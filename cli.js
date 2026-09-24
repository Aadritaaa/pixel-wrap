#!/usr/bin/env node
/**
 * cli.js - PixelWrap Command-Line Interface
 *
 * Usage:
 *   node cli.js --input <path> --output <path> --effects <effect1,effect2,...>
 *
 * Available effects:
 *   grayscale, blur, border, brightness, sepia, resize, watermark
 *
 * Examples:
 *   node cli.js --input sample_images/test.jpg --output output/result.jpg --effects grayscale,blur
 *   node cli.js --input sample_images/test.jpg --output output/result.jpg --effects sepia,border,watermark
 */

const path = require('path');
const BaseImage = require('./src/BaseImage');
const { buildPipeline } = require('./src/pipelineBuilder');

// ── Argument parsing ────────────────────────────────────────────────────────
const args  = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const inputPath  = getArg('--input');
const outputPath = getArg('--output');
const effectsArg = getArg('--effects');

if (!inputPath || !outputPath || !effectsArg) {
  console.error('Usage: node cli.js --input <path> --output <path> --effects <effect1,effect2,...>');
  console.error('Available effects: grayscale, blur, border, brightness, sepia, resize, watermark');
  process.exit(1);
}

const effectNames  = effectsArg.split(',').map((e) => e.trim()).filter(Boolean);
const effectsConfig = effectNames.map((name) => ({ name }));

// ── Pipeline execution ──────────────────────────────────────────────────────
(async () => {
  try {
    console.log('\nPixelWrap Image Processor');
    console.log('==========================');
    console.log(`Input:   ${inputPath}`);
    console.log(`Output:  ${outputPath}`);
    console.log(`Effects: ${effectNames.join(' -> ')}`);
    console.log();

    const base     = new BaseImage(path.resolve(inputPath));
    const pipeline = buildPipeline(base, effectsConfig);

    console.log('Processing pipeline...');
    const result = await pipeline.process();

    await result.write(outputPath);
    console.log(`\nDone! Output saved to: ${outputPath}`);
  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  }
})();
