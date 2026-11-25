const INITIAL_SPEED_KMH = 600;
const MAX_THROTTLE_PERCENT = 100;
const INITIAL_THROTTLE_PERCENT = MAX_THROTTLE_PERCENT / 2;
const THROTTLE_POINTS_PER_SECOND = 25;
export const DEGREES_PER_TURN = 360;
const FULL_TURN_SECONDS = 20;
const TURN_RATE_DEGREES_PER_SECOND = (DEGREES_PER_TURN / FULL_TURN_SECONDS) * 2;
export const RADIANS_PER_DEGREE = Math.PI / 180;
export const KILOMETERS_PER_HOUR_PER_METER_PER_SECOND = 3.6;

const F16 = {
    massKg: 12_000,
    dryThrustNewtons: 65_300,
    afterburnerThrustNewtons: 106_000,
    dragPerSecond: 0.02,
    maxSpeedMps: 1470 / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND,
} as const;

export type FlightState = {
    readonly xMeters: number;
    readonly yMeters: number;
    readonly altitudeMeters: number;
    readonly speedMps: number;
    readonly accelerationMps2: number;
    readonly throttlePercent: number;
    readonly wepActive: boolean;
    /** Compass heading in degrees, clockwise from north. */
    readonly headingDegrees: number;
};

type AxisInput = -1 | 0 | 1;

function calculateAcceleration(speedMps: number, throttlePercent: number, wepActive: boolean): number {
    const thrustNewtons = wepActive
        ? F16.afterburnerThrustNewtons
        : F16.dryThrustNewtons * (throttlePercent / MAX_THROTTLE_PERCENT);

    return thrustNewtons / F16.massKg - F16.dragPerSecond * speedMps;
}

export function createFlight(): FlightState {
    const speedMps = INITIAL_SPEED_KMH / KILOMETERS_PER_HOUR_PER_METER_PER_SECOND;
    return {
        xMeters: 0,
        yMeters: 0,
        altitudeMeters: 160,
        speedMps,
        accelerationMps2: calculateAcceleration(speedMps, INITIAL_THROTTLE_PERCENT, false),
        throttlePercent: INITIAL_THROTTLE_PERCENT,
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
    const accelerationMps2 = calculateAcceleration(state.speedMps, throttlePercent, wepActive);
    const speedMps = Math.min(F16.maxSpeedMps, Math.max(0, state.speedMps + accelerationMps2 * elapsedSeconds));

    const nextHeading = state.headingDegrees + turn * TURN_RATE_DEGREES_PER_SECOND * elapsedSeconds;
    const wrappedHeading = nextHeading % DEGREES_PER_TURN;
    const headingDegrees = wrappedHeading < 0 ? wrappedHeading + DEGREES_PER_TURN : wrappedHeading;
    const headingRadians = headingDegrees * RADIANS_PER_DEGREE;
    const distanceMeters = speedMps * elapsedSeconds;

    return {
        ...state,
        speedMps,
        accelerationMps2,
        throttlePercent,
        wepActive,
        headingDegrees,
        xMeters: state.xMeters + distanceMeters * Math.sin(headingRadians),
        yMeters: state.yMeters - distanceMeters * Math.cos(headingRadians),
    };
}
