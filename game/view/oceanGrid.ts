import { game } from '../engine.js';

const GRID_SPACING_METERS = 50;

export function mountOceanGrid(): void {
    game.background.color('#237eaf');
    const grid = game.graphics({ layer: 'underlay' });
    const { width, height } = game.screen;

    game.frame('ocean-grid', () => {
        const origin = game.camera.project(0, 0);
        const spacing = GRID_SPACING_METERS * game.camera.render.zoom;
        const firstX = origin.x - Math.floor(origin.x / spacing) * spacing;
        const firstY = origin.y - Math.floor(origin.y / spacing) * spacing;

        grid.clear();
        grid.draw(ctx => {
            ctx.strokeStyle = '#94cce5';
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let x = firstX; x < width; x += spacing) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }

            for (let y = firstY; y < height; y += spacing) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }

            ctx.stroke();
        });
    });
}
