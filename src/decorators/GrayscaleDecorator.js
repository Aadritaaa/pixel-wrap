/**
 * GrayscaleDecorator - Concrete Decorator
 *
 * Converts the image to grayscale using Jimp's greyscale() method.
 */
const ImageDecorator = require('../ImageDecorator');

class GrayscaleDecorator extends ImageDecorator {
  /**
   * Apply grayscale transformation.
   * @returns {Promise<object>} Grayscale Jimp image
   */
  async process() {
    const image = await super.process();
    image.greyscale();
    return image;
  }
}

module.exports = GrayscaleDecorator;
