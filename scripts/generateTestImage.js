/**
 * generateTestImage.js
 *
 * Programmatically generates a 400x300 synthetic test image with
 * coloured horizontal bands and saves it to sample_images/test.jpg.
 *
 * Run once: node scripts/generateTestImage.js
 */
const { Jimp, intToRGBA, rgbaToInt } = require('jimp');
const path = require('path');

(async () => {
  const WIDTH  = 400;
  const HEIGHT = 300;

  // Start with a white canvas
  const image = new Jimp({ width: WIDTH, height: HEIGHT, color: 0xffffffff });

  // Colour bands (RGBA hex)
  const bands = [
    { y: 0,   h: 50,  color: 0xff3333ff }, // red
    { y: 50,  h: 50,  color: 0xff9900ff }, // orange
    { y: 100, h: 50,  color: 0xffee00ff }, // yellow
    { y: 150, h: 50,  color: 0x33bb33ff }, // green
    { y: 200, h: 50,  color: 0x3399ffff }, // blue
    { y: 250, h: 50,  color: 0x9933ffff }, // purple
  ];

  for (const band of bands) {
    for (let y = band.y; y < band.y + band.h && y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        image.setPixelColor(band.color, x, y);
      }
    }
  }

  // Add a subtle diagonal gradient overlay for visual interest
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const existing = intToRGBA(image.getPixelColor(x, y));
      const factor   = ((x + y) / (WIDTH + HEIGHT)) * 0.25;
      const r = Math.min(255, Math.round(existing.r * (1 - factor) + 255 * factor));
      const g = Math.min(255, Math.round(existing.g * (1 - factor) + 255 * factor));
      const b = Math.min(255, Math.round(existing.b * (1 - factor) + 255 * factor));
      image.setPixelColor(rgbaToInt(r, g, b, 255), x, y);
    }
  }

  const outPath = path.join(__dirname, '..', 'sample_images', 'test.jpg');
  await image.write(outPath);
  console.log(`Test image generated: ${outPath} (${WIDTH}x${HEIGHT})`);
})();
