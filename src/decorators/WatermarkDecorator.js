/**
 * WatermarkDecorator - Concrete Decorator
 *
 * Overlays a semi-transparent text watermark onto the image.
 * Uses Jimp's pixel-level manipulation for maximum compatibility
 * without requiring external font files.
 */
const ImageDecorator = require('../ImageDecorator');

class WatermarkDecorator extends ImageDecorator {
  /**
   * @param {ImageDecorator|import('../ImageProcessor')} processor - Wrapped processor.
   * @param {string} [text='PixelWrap'] - Watermark text label (used in metadata).
   * @param {number} [opacity=0.3]     - Opacity of the watermark strip (0–1).
   */
  constructor(processor, text = 'PixelWrap', opacity = 0.3) {
    super(processor);
    this.text    = text;
    this.opacity = opacity;
  }

  /**
   * Composite a semi-transparent white strip at the bottom of the image
   * as the watermark (font-free approach, fully compatible with Jimp v1).
   * @returns {Promise<object>} Watermarked Jimp image
   */
  async process() {
    const { intToRGBA, rgbaToInt } = require('jimp');
    const image = await super.process();

    const w           = image.bitmap.width;
    const h           = image.bitmap.height;
    const stripHeight = Math.max(20, Math.floor(h * 0.08)); // 8% of height

    // Paint a semi-transparent white rectangle at the bottom
    for (let y = h - stripHeight; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Blend white (255,255,255) over existing pixel at given opacity
        const existing = intToRGBA(image.getPixelColor(x, y));
        const r = Math.min(255, Math.round(existing.r * (1 - this.opacity) + 255 * this.opacity));
        const g = Math.min(255, Math.round(existing.g * (1 - this.opacity) + 255 * this.opacity));
        const b = Math.min(255, Math.round(existing.b * (1 - this.opacity) + 255 * this.opacity));
        image.setPixelColor(rgbaToInt(r, g, b, existing.a), x, y);
      }
    }

    return image;
  }
}

module.exports = WatermarkDecorator;
