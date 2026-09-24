/**
 * BorderDecorator - Concrete Decorator
 *
 * Adds a solid-colour border around the image by expanding the canvas
 * and compositing the original image centred on the new background.
 */
const { Jimp } = require('jimp');
const ImageDecorator = require('../ImageDecorator');

class BorderDecorator extends ImageDecorator {
  /**
   * @param {ImageDecorator|import('../ImageProcessor')} processor - Wrapped processor.
   * @param {number} [thickness=20] - Border thickness in pixels.
   * @param {number} [color=0x000000FF] - RGBA hex colour for the border.
   */
  constructor(processor, thickness = 20, color = 0x000000ff) {
    super(processor);
    this.thickness = thickness;
    this.color = color;
  }

  /**
   * Expand canvas and composite image onto coloured background.
   * @returns {Promise<object>} Bordered Jimp image
   */
  async process() {
    const image = await super.process();
    const t = this.thickness;
    const newWidth  = image.bitmap.width  + t * 2;
    const newHeight = image.bitmap.height + t * 2;

    const border = new Jimp({ width: newWidth, height: newHeight, color: this.color });
    border.composite(image, t, t);
    return border;
  }
}

module.exports = BorderDecorator;
