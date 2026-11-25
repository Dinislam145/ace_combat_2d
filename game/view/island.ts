import { flatNormals } from '@phaser-ae/geometry-3d';
import type { Mesh3dDef } from '@phaser-ae/render-3d';
import { game } from '../engine.js';

const OCEAN_COLOR = '#237eaf';
const SEA_FLOOR_METERS = -12;
const SUMMIT_METERS = 85;

// The summit sits on a vertex of the 25-metre grid. Varying the radius with
// bearing gives the island headlands and ridges while retaining a single peak.
function islandHeight(x: number, z: number): number {
    const east = (x - 25) / 125;
    const south = (z + 75) / 235;
    const bearing = Math.atan2(south, east);
    const radius = 1 + 0.16 * Math.sin(3 * bearing + 0.6) + 0.12 * Math.cos(5 * bearing - 0.8);
    const slope = Math.max(0, 1 - Math.hypot(east, south) / radius);
    return SEA_FLOOR_METERS + (SUMMIT_METERS - SEA_FLOOR_METERS) * slope ** 1.18;
}

export function mountIsland(): void {
    game.background.color(OCEAN_COLOR);
    game.render3d.lighting.preset('noon', {
        sun: { x: 0.78, y: -0.68, z: 0.42 }, skyColor: '#d4dfed', ambient: 0.65,
        exposure: 1, fogEnd: 0, shadows: false,
    });
    game.spawn({ id: 'ocean', mesh: 'plane', size: [1600, 1, 1600], color: OCEAN_COLOR, unlit: true });
    game.terrain.build({
        size: 800, resolution: 32, chunks: 1, height: islandHeight, seed: 68949,
        baseY: SEA_FLOOR_METERS, amplitude: SUMMIT_METERS - SEA_FLOOR_METERS,
        groundDetail: 0, grain: 0, colormapRes: 256,
        bands: [
            { h: 0.12, color: '#e2ca99' },
            { h: 0.22, color: '#9da86d', steep: '#b5a88b' },
            { h: 0.40, color: '#698b63', steep: '#8e917e' },
            { h: 0.62, color: '#70836c', steep: '#777f7e' },
            { h: 0.83, color: '#999687', steep: '#818681' },
            { h: 1.00, color: '#bcb8a8', steep: '#96988c' },
        ],
    });
    // terrain-3d registers the single chunk under this name. Keep its UVs,
    // material and height queries, and light each triangle as a flat face.
    const chunk = game.kernel.registry.get<Mesh3dDef>('mesh3d', 'terrain:chunk:0');
    if (!chunk) throw new Error('Missing island terrain mesh');
    game.world3d.defineMesh(chunk.name, flatNormals(chunk.verts));
}
