/**
 * BaseImage - Concrete Component (GOF Decorator Pattern)
 *
 * Loads an image from disk and exposes it as a Jimp instance.
 * This is the object being decorated — it performs no transformations.
 */
const { Jimp } = require('jimp');
const ImageProcessor = require('./ImageProcessor');

class BaseImage extends ImageProcessor {
  /**
   * @param {string} filePath - Absolute or relative path to the source image.
   */
  constructor(filePath) {
    super();
    this.filePath = filePath;
  }

  /**
   * Load and return the raw image with no modifications.
   * @returns {Promise<object>} Jimp image instance
   */
  async process() {
    const image = await Jimp.read(this.filePath);
    return image;
  }
}

module.exports = BaseImage;
