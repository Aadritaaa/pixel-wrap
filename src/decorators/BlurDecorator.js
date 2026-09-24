/**
 * BlurDecorator - Concrete Decorator
 *
 * Applies a Gaussian blur to the image.
 */
const ImageDecorator = require('../ImageDecorator');

class BlurDecorator extends ImageDecorator {
  /**
   * @param {ImageDecorator|import('../ImageProcessor')} processor - Wrapped processor.
   * @param {number} [radius=4] - Blur radius in pixels (1–100).
   */
  constructor(processor, radius = 4) {
    super(processor);
    this.radius = radius;
  }

  /**
   * Apply blur transformation.
   * @returns {Promise<object>} Blurred Jimp image
   */
  async process() {
    const image = await super.process();
    image.blur(this.radius);
    return image;
  }
}

module.exports = BlurDecorator;
