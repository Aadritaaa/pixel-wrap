/**
 * ImageProcessor - Component Interface (GOF Decorator Pattern)
 *
 * Defines the interface for all image processing objects.
 * Both concrete components and decorators implement this interface.
 */
class ImageProcessor {
  /**
   * Process the image and return a Jimp image instance.
   * Must be implemented by all concrete components and decorators.
   * @returns {Promise<object>} Jimp image instance
   */
  async process() {
    throw new Error(`${this.constructor.name} must implement process()`);
  }
}

module.exports = ImageProcessor;
