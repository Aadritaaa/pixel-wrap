/**
 * decorators.js — PixelWrap Browser Implementation
 *
 * Mirrors the Node.js/Jimp architecture in src/ using the HTML5 Canvas 2D API.
 * Each decorator.process() returns a NEW HTMLCanvasElement so the chain is
 * immutable — re-renders create fresh canvas objects each time.
 *
 * Pattern roles:
 *   ImageProcessor  — Component interface         (process() → Promise<canvas>)
 *   BaseImage       — Concrete Component          (loads image onto canvas)
 *   ImageDecorator  — Abstract Decorator          (wraps ImageProcessor)
 *   *Decorator × 7  — Concrete Decorators         (one transformation each)
 *
 * Pipeline builder:
 *   buildPipeline(base, effectsConfig) — registry pattern, same as pipelineBuilder.js
 */

'use strict';

// ─── Component Interface ────────────────────────────────────────────────────

class ImageProcessor {
  /**
   * Process and return an HTMLCanvasElement carrying the transformed image.
   * @returns {Promise<HTMLCanvasElement>}
   */
  async process() {
    throw new Error(`${this.constructor.name} must implement process()`);
  }
}

// ─── Concrete Component ─────────────────────────────────────────────────────

class BaseImage extends ImageProcessor {
  /**
   * @param {HTMLImageElement} imgElement - Already-loaded source image
   * @param {number} [maxDim=1800]        - Auto-downscale cap (px) for performance
   */
  constructor(imgElement, maxDim = 1800) {
    super();
    this.imgElement = imgElement;
    this.maxDim = maxDim;
  }

  async process() {
    const img = this.imgElement;
    let w = img.naturalWidth  || img.width;
    let h = img.naturalHeight || img.height;

    // Downscale oversized images to keep pixel ops fast
    if (w > this.maxDim || h > this.maxDim) {
      const ratio = Math.min(this.maxDim / w, this.maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    return canvas;
  }
}

// ─── Abstract Decorator ─────────────────────────────────────────────────────

class ImageDecorator extends ImageProcessor {
  /**
   * @param {ImageProcessor} processor - The wrapped processor to delegate to
   */
  constructor(processor) {
    super();
    if (!(processor instanceof ImageProcessor)) {
      throw new TypeError('ImageDecorator requires an ImageProcessor instance');
    }
    this._processor = processor;
  }

  /** Delegates to the wrapped processor — concrete decorators override this. */
  async process() {
    return this._processor.process();
  }
}

// ─── Concrete Decorators ────────────────────────────────────────────────────

/**
 * GrayscaleDecorator
 * Converts the image to grayscale using the luminance formula (ITU-R BT.601).
 * Pixel-level operation via getImageData / putImageData.
 */
class GrayscaleDecorator extends ImageDecorator {
  async process() {
    const src = await super.process();
    const ctx  = src.getContext('2d');
    const img  = ctx.getImageData(0, 0, src.width, src.height);
    const d    = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = lum;
    }
    ctx.putImageData(img, 0, 0);
    return src; // modified in-place; src is fresh each render
  }
}

/**
 * BlurDecorator
 * Applies a Gaussian blur using the Canvas 2D filter property.
 * Draws to a fresh canvas so the blur does not bleed into adjacent decorators.
 */
class BlurDecorator extends ImageDecorator {
  /** @param {number} [radius=4] - Blur radius in pixels (1–30) */
  constructor(processor, radius = 4) {
    super(processor);
    this.radius = Math.max(1, Math.min(30, radius));
  }

  async process() {
    const src    = await super.process();
    const canvas = document.createElement('canvas');
    canvas.width  = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d');
    // Draw slightly outside bounds so edge pixels have content to blur into
    const pad = this.radius * 2;
    ctx.filter = `blur(${this.radius}px)`;
    ctx.drawImage(src, -pad, -pad, src.width + pad * 2, src.height + pad * 2);
    ctx.filter = 'none';
    return canvas;
  }
}

/**
 * BorderDecorator
 * Expands the canvas by (thickness × 2) on each axis and paints a filled
 * rectangle before compositing the source image at the offset (thickness, thickness).
 */
class BorderDecorator extends ImageDecorator {
  /**
   * @param {number} [thickness=24] - Border width in pixels
   * @param {string} [color='#000000'] - CSS colour (hex, rgb, hsl…)
   */
  constructor(processor, thickness = 24, color = '#000000') {
    super(processor);
    this.thickness = Math.max(1, thickness);
    this.color     = color;
  }

  async process() {
    const src    = await super.process();
    const t      = this.thickness;
    const canvas = document.createElement('canvas');
    canvas.width  = src.width  + t * 2;
    canvas.height = src.height + t * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(src, t, t);
    return canvas;
  }
}

/**
 * BrightnessDecorator
 * Shifts every RGB channel by a fixed delta derived from factor × 255.
 * Pixel-level operation via getImageData / putImageData.
 */
class BrightnessDecorator extends ImageDecorator {
  /** @param {number} [factor=0.2] - Brightness delta; −1 = black, +1 = white */
  constructor(processor, factor = 0.2) {
    super(processor);
    this.factor = Math.max(-1, Math.min(1, factor));
  }

  async process() {
    const src   = await super.process();
    const ctx   = src.getContext('2d');
    const img   = ctx.getImageData(0, 0, src.width, src.height);
    const d     = img.data;
    const delta = Math.round(this.factor * 255);
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.min(255, Math.max(0, d[i]     + delta));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + delta));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + delta));
    }
    ctx.putImageData(img, 0, 0);
    return src;
  }
}

/**
 * SepiaDecorator
 * Applies the standard sepia-tone colour matrix.
 * Pixel-level operation via getImageData / putImageData.
 */
class SepiaDecorator extends ImageDecorator {
  async process() {
    const src = await super.process();
    const ctx = src.getContext('2d');
    const img = ctx.getImageData(0, 0, src.width, src.height);
    const d   = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i]     = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      d[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      d[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }
    ctx.putImageData(img, 0, 0);
    return src;
  }
}

/**
 * ResizeDecorator
 * Scales the image by a percentage factor (e.g. 0.5 = 50%).
 * Creates a new canvas at the scaled dimensions and uses drawImage for quality scaling.
 */
class ResizeDecorator extends ImageDecorator {
  /** @param {number} [scale=0.5] - Scale factor (0.1 = 10%, 2.0 = 200%) */
  constructor(processor, scale = 0.5) {
    super(processor);
    this.scale = Math.max(0.1, Math.min(3.0, scale));
  }

  async process() {
    const src    = await super.process();
    const w      = Math.max(1, Math.round(src.width  * this.scale));
    const h      = Math.max(1, Math.round(src.height * this.scale));
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(src, 0, 0, w, h);
    return canvas;
  }
}

/**
 * WatermarkDecorator
 * Renders a text watermark with an outline shadow at the bottom-right of the image.
 * Uses Canvas 2D fillText / strokeText — no font files required.
 */
class WatermarkDecorator extends ImageDecorator {
  /**
   * @param {string} [text='PixelWrap'] - Watermark text
   * @param {number} [opacity=0.65]     - Text opacity (0–1)
   */
  constructor(processor, text = 'PixelWrap', opacity = 0.65) {
    super(processor);
    this.text    = text || 'PixelWrap';
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  async process() {
    const canvas = await super.process();
    const ctx    = canvas.getContext('2d');
    const size   = Math.max(14, Math.floor(canvas.width / 16));

    ctx.save();
    ctx.font         = `bold ${size}px system-ui, sans-serif`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';

    const x = canvas.width  - 14;
    const y = canvas.height - 14;

    // Outline for legibility over any background
    ctx.strokeStyle = `rgba(0, 0, 0, ${this.opacity * 0.7})`;
    ctx.lineWidth   = size * 0.3;
    ctx.lineJoin    = 'round';
    ctx.strokeText(this.text, x, y);

    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fillText(this.text, x, y);
    ctx.restore();
    return canvas;
  }
}

// ─── Pipeline Builder (registry pattern) ────────────────────────────────────

/** Maps effect name → factory function, mirroring src/pipelineBuilder.js */
const EFFECT_REGISTRY = {
  grayscale:  (proc, opts) => new GrayscaleDecorator(proc),
  blur:       (proc, opts) => new BlurDecorator(proc, opts.radius),
  border:     (proc, opts) => new BorderDecorator(proc, opts.thickness, opts.color),
  brightness: (proc, opts) => new BrightnessDecorator(proc, opts.factor),
  sepia:      (proc, opts) => new SepiaDecorator(proc),
  resize:     (proc, opts) => new ResizeDecorator(proc, opts.scale),
  watermark:  (proc, opts) => new WatermarkDecorator(proc, opts.text, opts.opacity),
};

/**
 * Build a decorator chain from a base processor and an ordered effects config.
 * @param {ImageProcessor} base
 * @param {Array<{name:string, options?:object}>} config
 * @returns {ImageProcessor} Fully-chained decorator
 */
function buildPipeline(base, config) {
  return config.reduce((proc, { name, options = {} }) => {
    const factory = EFFECT_REGISTRY[name];
    if (!factory) throw new Error(`Unknown effect: "${name}"`);
    return factory(proc, options);
  }, base);
}
