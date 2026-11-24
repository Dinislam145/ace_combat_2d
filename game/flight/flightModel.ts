const INITIAL_SPEED_KMH = 600;
const MAX_SPEED_KMH = 1500;
const MAX_THROTTLE_PERCENT = 100;
const NEUTRAL_THROTTLE_PERCENT = MAX_THROTTLE_PERCENT / 2;
const THROTTLE_POINTS_PER_SECOND = 25;
const MAX_ACCELERATION_KMH_PER_SECOND = 100;
const WEP_ACCELERATION_KMH_PER_SECOND = 150;
export const DEGREES_PER_TURN = 360;
const FULL_TURN_SECONDS = 20;
const TURN_RATE_DEGREES_PER_SECOND = (DEGREES_PER_TURN / FULL_TURN_SECONDS) * 2;
export const RADIANS_PER_DEGREE = Math.PI / 180;
export const KILOMETERS_PER_HOUR_PER_METER_PER_SECOND = 3.6;
const MAX_SPEED_MPS = MAX_SPEED_KMH / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND;
const MAX_ACCELERATION_MPS2 = MAX_ACCELERATION_KMH_PER_SECOND / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND;
const WEP_ACCELERATION_MPS2 = WEP_ACCELERATION_KMH_PER_SECOND / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND;

export type FlightState = {
    readonly xMeters: number;
    readonly yMeters: number;
    readonly speedMps: number;
    readonly throttlePercent: number;
    readonly wepActive: boolean;
    /** Compass heading in degrees, clockwise from north. */
    readonly headingDegrees: number;
};

type AxisInput = -1 | 0 | 1;

export function createFlight(): FlightState {
    return {
        xMeters: 0,
        yMeters: 0,
        speedMps: INITIAL_SPEED_KMH / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND,
        throttlePercent: NEUTRAL_THROTTLE_PERCENT,
        wepActive: false,
        headingDegrees: 0,
    };
}

export function advanceFlight(
    state: FlightState,
    elapsedSeconds: number,
    turn: AxisInput = 0,
    throttle: AxisInput = 0,
): FlightState {
    const throttleChange = throttle * THROTTLE_POINTS_PER_SECOND * elapsedSeconds;
    const throttlePercent = Math.min(MAX_THROTTLE_PERCENT, Math.max(0, state.throttlePercent + throttleChange));
    const wepActive = throttle > 0 && throttlePercent === MAX_THROTTLE_PERCENT;
    const throttleFromNeutral = (throttlePercent - NEUTRAL_THROTTLE_PERCENT) / NEUTRAL_THROTTLE_PERCENT;
    const accelerationMps2 = wepActive ? WEP_ACCELERATION_MPS2 : throttleFromNeutral * MAX_ACCELERATION_MPS2;
    const speedMps = Math.min(MAX_SPEED_MPS, Math.max(0, state.speedMps + accelerationMps2 * elapsedSeconds));

    const nextHeading = state.headingDegrees + turn * TURN_RATE_DEGREES_PER_SECOND * elapsedSeconds;
    const wrappedHeading = nextHeading % DEGREES_PER_TURN;
    const headingDegrees = wrappedHeading < 0 ? wrappedHeading + DEGREES_PER_TURN : wrappedHeading;
    const headingRadians = headingDegrees * RADIANS_PER_DEGREE;
    const distanceMeters = speedMps * elapsedSeconds;

    return {
        ...state,
        speedMps,
        throttlePercent,
        wepActive,
        headingDegrees,
        xMeters: state.xMeters + distanceMeters * Math.sin(headingRadians),
        yMeters: state.yMeters - distanceMeters * Math.cos(headingRadians),
    };
}
