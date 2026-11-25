import { AIRCRAFT_MODEL } from '../art.js';
import { game } from '../engine.js';
import { advanceFlight, createFlight, RADIANS_PER_DEGREE } from '../flight/flightModel.js';
import { mountFlightHud } from '../view/flightHud.js';
import { mountIsland } from '../view/island.js';

const AIRCRAFT_LENGTH_METERS = 15.03;

function keyAxis(negative: string, positive: string): -1 | 0 | 1 {
    const minus = game.input.keyDown(negative);
    const plus = game.input.keyDown(positive);
    return plus === minus ? 0 : plus ? 1 : -1;
}

export const FlightScene = {
    name: 'play',

    enter(): void {
        mountIsland();
        let flight = createFlight();
        const aircraft = game.modelFiles.spawn(AIRCRAFT_MODEL, { id: 'aircraft', size: AIRCRAFT_LENGTH_METERS });
        const updateHud = mountFlightHud(flight);
        game.inspect.state(() => flight);

        // Leave a small horizontal component for the camera's north-up basis.
        game.rig.maxPitch = Math.PI / 2;
        game.rig.pitch = 89.99 * RADIANS_PER_DEGREE;
        game.rig.yaw = Math.PI;
        game.rig.distance = 150;
        game.rig.pan = false;
        game.world3d.camera.fov = 55 * RADIANS_PER_DEGREE;

        function updatePose(): void {
            aircraft.x = flight.xMeters;
            aircraft.y = flight.altitudeMeters;
            aircraft.z = flight.yMeters;
            aircraft.yaw = flight.headingDegrees * RADIANS_PER_DEGREE;
            game.rig.focus(aircraft.x, aircraft.y, aircraft.z);
        }

        updatePose();
        // The rig publishes on simulation steps. Cut directly to the same
        // pose for the first frame, including when re-entering from far away.
        const camera = game.world3d.camera;
        camera.yaw = game.rig.yaw;
        camera.pitch = game.rig.pitch;
        camera.distance = game.rig.distance;
        camera.snap(aircraft.x, aircraft.y, aircraft.z);
        game.step('flight', elapsedSeconds => {
            flight = advanceFlight(flight, elapsedSeconds, keyAxis('KeyA', 'KeyD'), keyAxis('KeyS', 'KeyW'));
            updatePose();
            updateHud(flight);
        }, { before: 'rig-orbit.camera' });
    },
};
