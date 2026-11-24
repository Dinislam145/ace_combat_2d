import { loadAircraft } from './art.js';
import { game } from './engine.js';
import { FlightScene } from './scenes/FlightScene.js';

await loadAircraft();
game.scenes.register(FlightScene);
await game.start();
game.scenes.go(FlightScene.name);
