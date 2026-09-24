/**
 * pipelineBuilder - Registry-based Decorator Chain Builder
 *
 * Builds a decorator chain from a plain config array such as:
 *   [ { name: 'grayscale' }, { name: 'blur', options: { radius: 5 } } ]
 *
 * Registry pattern: to add a new effect, add one entry to EFFECT_REGISTRY.
 * No other file needs to change — open/closed principle satisfied.
 */

const GrayscaleDecorator  = require('./decorators/GrayscaleDecorator');
const BlurDecorator       = require('./decorators/BlurDecorator');
const BorderDecorator     = require('./decorators/BorderDecorator');
const BrightnessDecorator = require('./decorators/BrightnessDecorator');
const SepiaDecorator      = require('./decorators/SepiaDecorator');
const ResizeDecorator     = require('./decorators/ResizeDecorator');
const WatermarkDecorator  = require('./decorators/WatermarkDecorator');

/**
 * Effect registry: maps effect name -> factory function(processor, options).
 * @type {Object.<string, function(import('./ImageProcessor'), object): import('./ImageDecorator')>}
 */
const EFFECT_REGISTRY = {
  grayscale:  (proc, _opts) => new GrayscaleDecorator(proc),
  blur:       (proc, opts)  => new BlurDecorator(proc, opts.radius),
  border:     (proc, opts)  => new BorderDecorator(proc, opts.thickness, opts.color),
  brightness: (proc, opts)  => new BrightnessDecorator(proc, opts.factor),
  sepia:      (proc, _opts) => new SepiaDecorator(proc),
  resize:     (proc, opts)  => new ResizeDecorator(proc, opts.width, opts.height),
  watermark:  (proc, opts)  => new WatermarkDecorator(proc, opts.text, opts.opacity),
};

/**
 * Build a processing pipeline from a base processor and an effects config array.
 *
 * @param {import('./ImageProcessor')} baseProcessor - Root ImageProcessor (typically BaseImage).
 * @param {Array<{name: string, options?: object}>} effectsConfig - Ordered list of effects.
 * @returns {import('./ImageProcessor')} Fully-chained decorator ready to call .process() on.
 * @throws {Error} If an unknown effect name is encountered.
 */
function buildPipeline(baseProcessor, effectsConfig) {
  return effectsConfig.reduce((processor, { name, options = {} }) => {
    const factory = EFFECT_REGISTRY[name];
    if (!factory) {
      throw new Error(
        `Unknown effect: "${name}". Available effects: ${Object.keys(EFFECT_REGISTRY).join(', ')}`
      );
    }
    return factory(processor, options);
  }, baseProcessor);
}

module.exports = { buildPipeline, EFFECT_REGISTRY };
