/**
 * ResizeDecorator - Concrete Decorator
 *
 * Resizes the image to specified dimensions.
 * Pass -1 for one dimension to preserve aspect ratio (Jimp.AUTO).
 */
const ImageDecorator = require('../ImageDecorator');

class ResizeDecorator extends ImageDecorator {
  /**
   * @param {ImageDecorator|import('../ImageProcessor')} processor - Wrapped processor.
   * @param {number} [width=400]  - Target width in pixels (-1 for auto).
   * @param {number} [height=-1] - Target height in pixels (-1 for auto).
   */
  constructor(processor, width = 400, height = -1) {
    super(processor);
    this.width  = width;
    this.height = height;
  }

  /**
   * Apply resize transformation.
   * @returns {Promise<object>} Resized Jimp image
   */
  async process() {
    const image = await super.process();
    const origW = image.bitmap.width;
    const origH = image.bitmap.height;

    let targetW = this.width  === -1 ? null : this.width;
    let targetH = this.height === -1 ? null : this.height;

    // If only one dimension given, calculate the other to preserve aspect ratio
    if (targetW && !targetH) {
      targetH = Math.round((origH / origW) * targetW);
    } else if (targetH && !targetW) {
      targetW = Math.round((origW / origH) * targetH);
    } else if (!targetW && !targetH) {
      // Both -1: no resize
      return image;
    }

    image.resize({ w: targetW, h: targetH });
    return image;
  }
}

module.exports = ResizeDecorator;
