import { AIRCRAFT_TEXTURE } from '../art.js';
import { game } from '../engine.js';
import { advanceFlight, createFlight, RADIANS_PER_DEGREE } from '../flight/flightModel.js';
import { mountFlightHud } from '../view/flightHud.js';
import { mountOceanGrid } from '../view/oceanGrid.js';

const PIXELS_PER_METER = 2;
const AIRCRAFT_DISPLAY_HEIGHT = 12;

export const FlightScene = {
    name: 'play',

    enter(): void {
        game.controls.bind('turn-left', { keys: ['KeyA'] });
        game.controls.bind('turn-right', { keys: ['KeyD'] });
        game.controls.bind('throttle-up', { keys: ['KeyW'] });
        game.controls.bind('throttle-down', { keys: ['KeyS'] });
        let flight = createFlight();
        const aircraft = game.spawn({
            id: 'aircraft',
            texture: AIRCRAFT_TEXTURE,
            height: AIRCRAFT_DISPLAY_HEIGHT,
            layer: 'world',
            x: flight.xMeters,
            y: flight.yMeters,
        });

        game.camera.snap(aircraft.x, aircraft.y, PIXELS_PER_METER);
        mountOceanGrid();
        const updateHud = mountFlightHud(flight);
        game.inspect.state(() => flight);

        // Phaser AE passes its fixed simulation step in seconds.
        game.step('flight', elapsedSeconds => {
            const left = game.controls.pressed('turn-left');
            const right = game.controls.pressed('turn-right');
            const turn = left === right ? 0 : left ? -1 : 1;
            const throttleUp = game.controls.pressed('throttle-up');
            const throttleDown = game.controls.pressed('throttle-down');
            const throttle = throttleUp === throttleDown ? 0 : throttleUp ? 1 : -1;
            flight = advanceFlight(flight, elapsedSeconds, turn, throttle);
            aircraft.x = flight.xMeters;
            aircraft.y = flight.yMeters;
            aircraft.rot = flight.headingDegrees * RADIANS_PER_DEGREE;
            game.camera.x = flight.xMeters;
            game.camera.y = flight.yMeters;
            updateHud(flight);
        });
    },
};
