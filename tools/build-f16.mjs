// Offline model source. Coordinates are metres, with the nose along -Z and Y up.
import { writeFileSync } from 'node:fs';

const materials = [
    { name: 'Airframe', color: [0.54, 0.60, 0.64] },
    { name: 'Upper panels', color: [0.37, 0.44, 0.49] },
    { name: 'Radome', color: [0.40, 0.45, 0.48] },
    { name: 'Canopy', color: [0.065, 0.15, 0.20], roughness: 0.23 },
    { name: 'Nozzle', color: [0.16, 0.17, 0.18] },
    { name: 'Intake and exhaust interior', color: [0.018, 0.024, 0.028] },
];
const geometry = materials.map(() => ({ positions: [], normals: [] }));
const [skin, panels, radome, glass, nozzle, interior] = geometry;

function faceNormal(a, b, c) {
    const [ux, uy, uz] = b.map((value, i) => value - a[i]);
    const [vx, vy, vz] = c.map((value, i) => value - a[i]);
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

function triangle(part, a, b, c) {
    const normal = faceNormal(a, b, c);
    const length = Math.hypot(...normal);
    if (length === 0) throw new Error('Degenerate triangle');
    const unit = normal.map(value => value / length);
    part.positions.push(...a, ...b, ...c);
    part.normals.push(...unit, ...unit, ...unit);
}

function face(part, vertices) {
    for (let i = 1; i < vertices.length - 1; i++) triangle(part, vertices[0], vertices[i], vertices[i + 1]);
}

// Sections are [z, centre height, half-width, half-height], ordered nose to tail.
function loft(sections, sides, skinMaterial, front = skinMaterial, rear = skinMaterial) {
    const rings = sections.map(([z, y, width, height]) => Array.from({ length: sides }, (_, i) => {
        const angle = 2 * Math.PI * i / sides;
        return [width * Math.cos(angle), y + height * Math.sin(angle), z];
    }));
    face(front, rings[0].toReversed());
    for (let j = 0; j + 1 < rings.length; j++) {
        for (let i = 0; i < sides; i++) {
            const next = (i + 1) % sides;
            face(skinMaterial, [rings[j][i], rings[j][next], rings[j + 1][next], rings[j + 1][i]]);
        }
    }
    face(rear, rings.at(-1));
}

// Connect two convex outlines. Orient each cap/edge away from the solid's
// centre so the mirrored left wing and the vertical tail get correct normals.
function foil(part, a, b) {
    const points = [...a, ...b];
    const centre = [0, 1, 2].map(i => points.reduce((sum, p) => sum + p[i], 0) / points.length);
    function outward(vertices) {
        const [a, b, c] = vertices;
        const normal = faceNormal(a, b, c);
        const facing = normal.reduce((sum, value, i) => sum + value * (a[i] - centre[i]), 0);
        face(part, facing < 0 ? vertices.toReversed() : vertices);
    }
    outward(a);
    outward(b);
    for (let i = 0; i < a.length; i++) {
        const next = (i + 1) % a.length;
        outward([a[i], a[next], b[next], b[i]]);
    }
}

loft([[-7.515, 0.03, 0.025, 0.025], [-6.8, 0.05, 0.27, 0.22], [-5.7, 0.08, 0.48, 0.39]], 12, radome);
loft([[-5.7, 0.08, 0.48, 0.39], [-4.5, 0.12, 0.65, 0.49], [-2.4, 0.11, 0.82, 0.63],
    [-0.3, 0.12, 0.98, 0.73], [2.6, 0.16, 0.94, 0.77], [5.8, 0.17, 0.79, 0.66],
    [6.47, 0.16, 0.70, 0.57]], 12, skin);
loft([[-5.18, 0.51, 0.1, 0.08], [-4.63, 0.57, 0.40, 0.30], [-3.55, 0.64, 0.52, 0.51],
    [-2.58, 0.65, 0.45, 0.40], [-1.89, 0.64, 0.24, 0.20]], 10, glass);
loft([[-1.97, 0.60, 0.31, 0.25], [-1.05, 0.65, 0.44, 0.27], [3.5, 0.70, 0.33, 0.24],
    [5.85, 0.71, 0.20, 0.10]], 8, panels);
loft([[-2.87, -0.48, 0.61, 0.31], [-2.64, -0.49, 0.72, 0.37], [-1.3, -0.46, 0.75, 0.44],
    [1.35, -0.35, 0.76, 0.44]], 10, skin, interior);
loft([[6.45, 0.16, 0.70, 0.57], [6.80, 0.16, 0.68, 0.56], [7.515, 0.16, 0.51, 0.46]], 12, nozzle, nozzle, interior);

for (const side of [-1, 1]) {
    function wing(part, outline, thickness) {
        const top = outline.map(([x, z, y]) => [side * x, y, z]);
        const bottom = top.map(([x, y, z]) => [x, y - thickness, z]);
        foil(part, top, bottom);
    }
    // Leading-edge root extension, clipped main wing and all-moving tailplane.
    wing(skin, [[0.53,-4.0,0.28], [1.27,-1.55,0.23], [1.70,0.0,0.17], [0.67,1.25,0.31]], 0.19);
    wing(skin, [[0.82,-1.55,0.24], [4.97,2.18,0.10], [5,3.05,0.10],
        [3.67,3.15,0.14], [0.78,3.09,0.28]], 0.15);
    wing(panels, [[0.66,3.85,0.13], [2.80,6.37,-0.11], [2.73,7.13,-0.13],
        [0.66,6.87,0.13]], 0.14);
}
const fin = [[1.63,0.79,0.28], [3.50,1.25,0.21], [5.92,3.18,0.075],
    [6.72,3.19,0.07], [6.08,0.90,0.14], [6.42,0.68,0.19]];
// The dorsal fillet and main fin share an edge, keeping each cap convex.
for (const indices of [[0,1,4,5], [1,2,3,4]]) {
    const section = indices.map(i => fin[i]);
    foil(panels, section.map(([z,y,w]) => [-w,y,z]), section.map(([z,y,w]) => [w,y,z]));
}

// A static mesh per material, with tightly packed float attributes and an
// embedded buffer. No runtime exporter, extensions or external resources.
const gltf = {
    asset: { version: '2.0', generator: 'Cleared to Land • F-16IN' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'F-16IN', mesh: 0 }],
    meshes: [{ primitives: [] }], buffers: [], bufferViews: [], accessors: [],
    materials: materials.map(({ name, color, roughness = 0.75 }) => ({
        name, pbrMetallicRoughness: { baseColorFactor: [...color, 1], metallicFactor: 0.1, roughnessFactor: roughness },
    })),
};
const chunks = [];
let byteOffset = 0;
function attribute(values, bounds) {
    const bytes = Buffer.from(new Float32Array(values).buffer);
    const bufferView = gltf.bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.length, target: 34962 }) - 1;
    const accessor = { bufferView, componentType: 5126, count: values.length / 3, type: 'VEC3' };
    if (bounds) {
        const axes = [0, 1, 2].map(axis => values.filter((_, i) => i % 3 === axis).map(Math.fround));
        accessor.min = axes.map(axis => Math.min(...axis));
        accessor.max = axes.map(axis => Math.max(...axis));
    }
    chunks.push(bytes);
    byteOffset += bytes.length;
    return gltf.accessors.push(accessor) - 1;
}
geometry.forEach(({ positions, normals }, material) => {
    const attributes = { POSITION: attribute(positions, true), NORMAL: attribute(normals, false) };
    gltf.meshes[0].primitives.push({ attributes, material });
});
gltf.buffers.push({ byteLength: byteOffset });
const json = Buffer.from(JSON.stringify(gltf));
const jsonBytes = Math.ceil(json.length / 4) * 4;
const binary = Buffer.concat(chunks);
const header = Buffer.alloc(20);
header.write('glTF');
header.writeUInt32LE(2, 4);
header.writeUInt32LE(20 + jsonBytes + 8 + binary.length, 8);
header.writeUInt32LE(jsonBytes, 12);
header.write('JSON', 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binary.length);
binHeader.write('BIN\0', 4);
const output = Buffer.concat([header, json, Buffer.alloc(jsonBytes - json.length, 0x20), binHeader, binary]);
writeFileSync(new URL('../assets/planes/f-16in-low-poly.glb', import.meta.url), output);
