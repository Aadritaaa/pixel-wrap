/**
 * BrightnessDecorator - Concrete Decorator
 *
 * Adjusts the image brightness by a given delta factor.
 */
const ImageDecorator = require('../ImageDecorator');

class BrightnessDecorator extends ImageDecorator {
  /**
   * @param {ImageDecorator|import('../ImageProcessor')} processor - Wrapped processor.
   * @param {number} [factor=0.2] - Brightness delta. Range: -1 (black) to 1 (white).
   */
  constructor(processor, factor = 0.2) {
    super(processor);
    this.factor = factor;
  }

  /**
   * Apply brightness adjustment.
   * @returns {Promise<object>} Brightness-adjusted Jimp image
   */
  async process() {
    const image = await super.process();
    image.brightness(this.factor);
    return image;
  }
}

module.exports = BrightnessDecorator;
