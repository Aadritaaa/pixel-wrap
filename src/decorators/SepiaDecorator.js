/**
 * SepiaDecorator - Concrete Decorator
 *
 * Applies a sepia tone filter to produce a vintage photograph effect.
 */
const ImageDecorator = require('../ImageDecorator');

class SepiaDecorator extends ImageDecorator {
  /**
   * Apply sepia transformation.
   * @returns {Promise<object>} Sepia-toned Jimp image
   */
  async process() {
    const image = await super.process();
    image.sepia();
    return image;
  }
}

module.exports = SepiaDecorator;
