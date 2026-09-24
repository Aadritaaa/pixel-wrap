/**
 * ImageDecorator - Abstract Decorator (GOF Decorator Pattern)
 *
 * Wraps an ImageProcessor and delegates process() to it.
 * All concrete decorators extend this class and call super.process()
 * to obtain the current image before applying their own transformation.
 */
const ImageProcessor = require('./ImageProcessor');

class ImageDecorator extends ImageProcessor {
  /**
   * @param {ImageProcessor} processor - The component or decorator to wrap.
   */
  constructor(processor) {
    super();
    if (!(processor instanceof ImageProcessor)) {
      throw new TypeError('ImageDecorator requires an ImageProcessor instance');
    }
    this._processor = processor;
  }

  /**
   * Delegate to the wrapped processor.
   * Concrete decorators call this to obtain the image, then transform it.
   * @returns {Promise<object>} Jimp image instance
   */
  async process() {
    return this._processor.process();
  }
}

module.exports = ImageDecorator;
