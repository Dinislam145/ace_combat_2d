import { game } from '../engine.js';
import {
    DEGREES_PER_TURN,
    KILOMETERS_PER_HOUR_PER_METER_PER_SECOND,
    type FlightState,
} from '../flight/flightModel.js';

const HUD_INSET = 16;
const HUD_LINE_HEIGHT = 24;
const TEXT_COLOR = '#ffffff';
const WEP_COLOR = '#ff5252';

function formatTelemetry(state: FlightState): string {
    const speedKmh = state.speedMps * KILOMETERS_PER_HOUR_PER_METER_PER_SECOND;
    const heading = Math.round(state.headingDegrees) % DEGREES_PER_TURN;
    return [
        `X: ${state.xMeters.toFixed(1)} m`,
        `Y: ${state.yMeters.toFixed(1)} m`,
        `Speed: ${speedKmh.toFixed(0)} km/h`,
        `Heading: ${heading}°`,
    ].join('\n');
}

export function mountFlightHud(initialState: FlightState): (state: FlightState) => void {
    const style = {
        layer: 'hud',
        z: 1,
        align: 'left',
        baseline: 'top',
        size: 18,
        font: 'mono',
        color: TEXT_COLOR,
        stroke: { color: '#123650', width: 1 },
    } as const;
    const label = game.text(formatTelemetry(initialState), HUD_INSET, HUD_INSET, style);
    const throttle = game.text('', HUD_INSET, HUD_INSET + 4 * HUD_LINE_HEIGHT, style);

    function update(state: FlightState): void {
        label.text = formatTelemetry(state);
        throttle.text = state.wepActive ? 'Throttle: WEP' : `Throttle: ${state.throttlePercent.toFixed(0)}%`;
        throttle.color = state.wepActive ? WEP_COLOR : TEXT_COLOR;
    }

    update(initialState);
    return update;
}
