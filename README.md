# PixelWrap 🖼️

> **An Image Processing Pipeline built with the Decorator Design Pattern**  
> University Software Engineering Lab 3 — GOF Structural Patterns

[![Node.js](https://img.shields.io/badge/Node.js-v24+-brightgreen)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Pattern](https://img.shields.io/badge/pattern-Decorator%20(GOF)-orange)]()
[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-7c3aed)](https://aadritaaa.github.io/pixel-wrap/)

## 🌐 Live Demo

**[https://aadritaaa.github.io/pixel-wrap/](https://aadritaaa.github.io/pixel-wrap/)**

An interactive browser demo of the same Decorator pattern — no terminal needed.  
Upload any image, stack effects in any order, watch the canvas update live, and download the result.

---

## Overview

PixelWrap demonstrates the **Decorator Pattern** (Gang of Four, Structural) applied to real image processing. Instead of creating a combinatorial explosion of subclasses for every possible effect combination, PixelWrap wraps image objects in configurable decorator layers at runtime.

**Stack:** Node.js + [Jimp](https://github.com/jimp-dev/jimp) (pure JavaScript — no native binaries)

---

## Architecture

```
ImageProcessor          ← Component interface (process())
├── BaseImage           ← Concrete Component (loads image from disk)
└── ImageDecorator      ← Abstract Decorator (wraps any ImageProcessor)
    ├── GrayscaleDecorator
    ├── BlurDecorator
    ├── BorderDecorator
    ├── BrightnessDecorator
    ├── SepiaDecorator
    ├── ResizeDecorator
    └── WatermarkDecorator
```

`pipelineBuilder.js` constructs the decorator chain from a plain config array using a registry pattern — adding a new effect requires only one new file and one registry entry.

---

## Project Structure

```
pixel-wrap/
├── cli.js                        # CLI entry point
├── package.json
├── src/
│   ├── ImageProcessor.js         # Component interface
│   ├── BaseImage.js              # Concrete component
│   ├── ImageDecorator.js         # Abstract decorator
│   ├── pipelineBuilder.js        # Registry-based chain builder
│   └── decorators/
│       ├── GrayscaleDecorator.js
│       ├── BlurDecorator.js
│       ├── BorderDecorator.js
│       ├── BrightnessDecorator.js
│       ├── SepiaDecorator.js
│       ├── ResizeDecorator.js
│       └── WatermarkDecorator.js
├── web/                          # ← Browser interactive demo
│   ├── index.html                #   App shell
│   ├── style.css                 #   Dark-mode UI styles
│   ├── decorators.js             #   Same pattern, Canvas 2D API
│   └── app.js                   #   Upload, effects, live preview
├── scripts/
│   └── generateTestImage.js      # Programmatic test image generator
├── sample_images/
│   └── test.jpg                  # Synthetic 400×300 test image
├── output/                       # Generated images (git-ignored)
└── docs/
    ├── Lab3_Decorator_Documentation.md
    └── CodeReviewReport.md
```

---

## Setup

```bash
# Clone the repository
git clone https://github.com/Aadritaaa/pixel-wrap.git
cd pixel-wrap

# Install dependencies
npm install

# (Optional) Regenerate the sample test image
node scripts/generateTestImage.js
```

**Requirements:** Node.js v18 or higher, npm

---

## Usage

```bash
node cli.js --input <input-path> --output <output-path> --effects <effect1,effect2,...>
```

### Available Effects

| Effect | Description | Options |
|---|---|---|
| `grayscale` | Convert to grayscale | — |
| `blur` | Gaussian blur | `radius` (default 4) |
| `border` | Solid colour border | `thickness` (default 20), `color` (RGBA hex) |
| `brightness` | Adjust brightness | `factor` −1 to 1 (default 0.2) |
| `sepia` | Vintage sepia tone | — |
| `resize` | Resize image | `width`, `height` (−1 for auto) |
| `watermark` | Semi-transparent strip | `text`, `opacity` (default 0.3) |

Effects are applied **left to right** in the order given.

---

## Examples

```bash
# Grayscale → Blur → Black border
node cli.js --input sample_images/test.jpg --output output/result.jpg --effects grayscale,blur,border

# Sepia tone → Brighten → Watermark strip
node cli.js --input sample_images/test.jpg --output output/vintage.jpg --effects sepia,brightness,watermark

# Resize to 200px wide (aspect ratio preserved) → Border
node cli.js --input sample_images/test.jpg --output output/small.jpg --effects resize,border

# All effects chained
node cli.js --input sample_images/test.jpg --output output/all.jpg --effects grayscale,blur,sepia,brightness,resize,border,watermark
```

### Example Output

```
PixelWrap Image Processor
==========================
Input:   sample_images/test.jpg
Output:  output/result.jpg
Effects: grayscale -> blur -> border

Processing pipeline...

Done! Output saved to: output/result.jpg
```

---

## Extending PixelWrap

Adding a new effect (e.g., `sharpen`) requires:

1. Create `src/decorators/SharpenDecorator.js` extending `ImageDecorator`
2. Add one line to `EFFECT_REGISTRY` in `src/pipelineBuilder.js`:
   ```javascript
   sharpen: (proc, opts) => new SharpenDecorator(proc, opts.amount),
   ```

No other file needs to change. ✅

---

## Documentation

| Document | Description |
|---|---|
| [`docs/Lab3_Decorator_Documentation.md`](docs/Lab3_Decorator_Documentation.md) | Full 15-section pattern writeup with UML diagram |
| [`docs/CodeReviewReport.md`](docs/CodeReviewReport.md) | 10-dimension code review with Pass/Needs-Work verdicts |

---

## Lab Submission Info

- **Pattern:** Decorator (GOF Structural)
- **Session 1:** Full implementation — all classes, CLI, tests, GitHub push
- **Session 2:** Documentation — UML diagram, 15-section writeup, code review
- **All commits:** 12 conventional commits across both sessions

---

## License

MIT © Aadritaaa
