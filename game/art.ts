import { game } from './engine.js';

export const AIRCRAFT_TEXTURE = 'f-16in';

export async function loadAircraft(): Promise<void> {
    const job = game.assets.load([
        { kind: 'image', key: AIRCRAFT_TEXTURE, url: './assets/planes/f-16in-top.png' },
    ]);
    await job;
    if (!job.ok) throw new Error('Could not load the F-16IN sprite.');
}
