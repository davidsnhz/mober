// Genera todos los iconos de Mober a partir de la identidad: una "m" de Inter 700 con el símbolo
// del euro pequeño y verde arriba a la derecha. Uso: npm run icons
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import opentype from 'opentype.js';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fontFile = resolve(root, 'node_modules/@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf');
const fontData = readFileSync(fontFile);
const font = opentype.parse(
  fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength),
);

const INK = '#0B0B0C';
const WHITE = '#FFFFFF';
const GREEN = '#00C26F';

// Medidas del diseño (icono de 140 px): "m" a 100 px y "€" a 35 px.
const DESIGN = 140;
const M_SIZE = 100;
const EURO_SIZE = 35;
const M_BASELINE = 100.4;
const EURO_BASELINE = 54.9;
const EURO_RIGHT = 127;

/** Trazados de la marca en el lienzo de 140 px. */
function markPaths(mColor, euroColor) {
  const mWidth = font.getAdvanceWidth('m', M_SIZE);
  const euroWidth = font.getAdvanceWidth('€', EURO_SIZE);
  const m = font.getPath('m', (DESIGN - mWidth) / 2, M_BASELINE, M_SIZE).toPathData(2);
  const euro = font.getPath('€', EURO_RIGHT - euroWidth, EURO_BASELINE, EURO_SIZE).toPathData(2);
  return `<path d="${m}" fill="${mColor}"/><path d="${euro}" fill="${euroColor}"/>`;
}

/**
 * SVG cuadrado de `size` px con la marca escalada a `scale` (1 = como en el diseño) y centrada.
 * `background` es opcional; `radius` redondea el fondo (en proporción al lado).
 */
function svg({
  size,
  scale = 1,
  background = null,
  radius = 0,
  mColor = WHITE,
  euroColor = GREEN,
}) {
  const factor = (size / DESIGN) * scale;
  const offset = (size - DESIGN * factor) / 2;
  const rect = background
    ? `<rect width="${size}" height="${size}" rx="${size * radius}" fill="${background}"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${rect}<g transform="translate(${offset} ${offset}) scale(${factor})">${markPaths(mColor, euroColor)}</g></svg>`;
}

async function write(file, options) {
  const target = resolve(root, file);
  mkdirSync(dirname(target), { recursive: true });
  await sharp(Buffer.from(svg(options)))
    .png()
    .toFile(target);
  console.warn(`  ${file} (${options.size} px)`);
}

console.warn('Generando iconos de Mober:');

// App nativa
await write('assets/icon.png', { size: 1024, background: INK });
// Icono adaptable de Android: el sistema recorta, así que la marca va en la zona segura central.
await write('assets/adaptive-icon.png', { size: 1024, scale: 0.62 });
await write('assets/adaptive-icon-monochrome.png', { size: 1024, scale: 0.62, euroColor: WHITE });
await write('assets/splash-icon.png', { size: 512 });
// Icono pequeño de las notificaciones en Android: silueta blanca sobre transparente.
await write('assets/notification-icon.png', { size: 96, scale: 1.1, euroColor: WHITE });
await write('assets/favicon.png', { size: 96, background: INK, radius: 0.22 });

// Web y PWA
await write('public/icon-192.png', { size: 192, background: INK });
await write('public/icon-512.png', { size: 512, background: INK });
await write('public/icon-maskable-512.png', { size: 512, scale: 0.78, background: INK });
await write('public/apple-touch-icon.png', { size: 180, background: INK });

console.warn('Listo.');
