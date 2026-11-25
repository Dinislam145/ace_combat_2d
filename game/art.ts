import { game } from './engine.js';

export const AIRCRAFT_MODEL = 'f-16in';

export async function loadFlightAssets(): Promise<void> {
    const [hudFont] = await Promise.all([
        game.typography.load('./assets/fonts/typography/ui-mono.glb', { format: 'msdf', emSize: 32, pixelRange: 4 }),
        game.modelFiles.load(AIRCRAFT_MODEL, './assets/planes/f-16in-low-poly.glb'),
    ]);
    game.typography.registerFamily('mono', hudFont);
}
