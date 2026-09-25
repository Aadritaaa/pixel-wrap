/**
 * app.js — PixelWrap Interactive Demo
 *
 * Handles: image upload (drag-and-drop + click), effect palette,
 * reorderable active pipeline layers (drag + arrow keys), live canvas
 * preview, pipeline chain display, download, and reset.
 *
 * Design principle: "raw" slider integers are stored in layer.options.
 * The transform() function on each control definition converts to the
 * value expected by the corresponding Decorator constructor.
 */

'use strict';

// ─── Effect metadata ─────────────────────────────────────────────────────────
// Each entry describes display info, parameter controls, and raw defaults.
// `transform` (optional): converts raw slider int → decorator constructor arg.

const EFFECT_META = [
  {
    name: 'grayscale',
    label: 'Grayscale',
    icon: '◑',
    color: '#94a3b8',
    desc: 'Remove all colour information (luminance formula)',
    controls: [],
    defaultOptions: {},
  },
  {
    name: 'blur',
    label: 'Blur',
    icon: '◎',
    color: '#60a5fa',
    desc: 'Gaussian blur via Canvas 2D filter',
    controls: [
      {
        key: 'radius', type: 'range', label: 'Radius',
        min: 1, max: 20, step: 1,
        display: v => `${v}px`,
      },
    ],
    defaultOptions: { radius: 4 },
  },
  {
    name: 'border',
    label: 'Border',
    icon: '▣',
    color: '#34d399',
    desc: 'Solid colour border — expands canvas dimensions',
    controls: [
      {
        key: 'thickness', type: 'range', label: 'Size',
        min: 4, max: 80, step: 4,
        display: v => `${v}px`,
      },
      { key: 'color', type: 'color', label: 'Colour' },
    ],
    defaultOptions: { thickness: 24, color: '#000000' },
  },
  {
    name: 'brightness',
    label: 'Brightness',
    icon: '☀',
    color: '#fbbf24',
    desc: 'Brighten or darken every pixel',
    controls: [
      {
        key: 'factor', type: 'range', label: 'Amount',
        min: -50, max: 50, step: 5,
        display: v => (v > 0 ? `+${v}` : `${v}`) + '%',
        transform: v => v / 100,   // raw 20 → decorator receives 0.20
      },
    ],
    defaultOptions: { factor: 20 },  // raw slider value
  },
  {
    name: 'sepia',
    label: 'Sepia',
    icon: '◈',
    color: '#f97316',
    desc: 'Vintage warm-tone colour matrix',
    controls: [],
    defaultOptions: {},
  },
  {
    name: 'resize',
    label: 'Resize',
    icon: '⤢',
    color: '#a78bfa',
    desc: 'Scale image up or down',
    controls: [
      {
        key: 'scale', type: 'range', label: 'Scale',
        min: 10, max: 200, step: 10,
        display: v => `${v}%`,
        transform: v => v / 100,   // raw 50 → decorator receives 0.50
      },
    ],
    defaultOptions: { scale: 50 },  // raw slider value
  },
  {
    name: 'watermark',
    label: 'Watermark',
    icon: '✦',
    color: '#f472b6',
    desc: 'Text overlay rendered with Canvas 2D fillText',
    controls: [
      { key: 'text', type: 'text', label: 'Text', placeholder: 'PixelWrap' },
      {
        key: 'opacity', type: 'range', label: 'Opacity',
        min: 10, max: 100, step: 10,
        display: v => `${v}%`,
        transform: v => v / 100,   // raw 65 → decorator receives 0.65
      },
    ],
    defaultOptions: { text: 'PixelWrap', opacity: 65 },
  },
];

const EFFECT_META_MAP = Object.fromEntries(EFFECT_META.map(e => [e.name, e]));

// ─── State ────────────────────────────────────────────────────────────────────

let uploadedImg  = null;   // HTMLImageElement | null
let activeLayers = [];     // Array<{ id: string, name: string, options: object }>
let nextLayerId  = 1;
let renderTimer  = null;
let dragSrcId    = null;

// ─── DOM references ───────────────────────────────────────────────────────────

const uploadZone       = document.getElementById('upload-zone');
const fileInput        = document.getElementById('file-input');
const effectPalette    = document.getElementById('effect-palette');
const layerStack       = document.getElementById('layer-stack');
const layerEmpty       = document.getElementById('layer-empty');
const previewCanvas    = document.getElementById('preview-canvas');
const canvasPlaceholder = document.getElementById('canvas-placeholder');
const canvasLoading    = document.getElementById('canvas-loading');
const pipelineChain    = document.getElementById('pipeline-chain');
const btnDownload      = document.getElementById('btn-download');
const btnReset         = document.getElementById('btn-reset');

// ─── Image upload ─────────────────────────────────────────────────────────────

function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img  = new Image();
  img.onload = () => {
    if (uploadedImg?.src?.startsWith('blob:')) URL.revokeObjectURL(uploadedImg.src);
    uploadedImg = img;
    // Show thumbnail in upload zone
    uploadZone.classList.add('has-image');
    uploadZone.querySelector('.upload-thumb-wrap').innerHTML =
      `<img src="${url}" class="upload-thumb" alt="Uploaded image thumbnail" />`;
    uploadZone.querySelector('.upload-hint').textContent = file.name;
    scheduleRender(true);
  };
  img.onerror = () => {
    uploadZone.querySelector('.upload-hint').textContent = 'Failed to load image';
  };
  img.src = url;
}

// Click-to-browse
uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
fileInput.addEventListener('change', () => { if (fileInput.files[0]) loadImageFile(fileInput.files[0]); });

// Drag & drop onto the upload zone
uploadZone.addEventListener('dragover',  e => { e.preventDefault(); uploadZone.classList.add('drag-active'); });
uploadZone.addEventListener('dragleave', e => { if (!uploadZone.contains(e.relatedTarget)) uploadZone.classList.remove('drag-active'); });
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.classList.remove('drag-active');
  if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
});

// Also accept drops anywhere on the canvas preview area
document.getElementById('canvas-container').addEventListener('dragover', e => e.preventDefault());
document.getElementById('canvas-container').addEventListener('drop', e => {
  e.preventDefault();
  if (e.dataTransfer.files[0]) loadImageFile(e.dataTransfer.files[0]);
});

// ─── Effect palette ────────────────────────────────────────────────────────────

function buildPalette() {
  EFFECT_META.forEach(meta => {
    const chip = document.createElement('button');
    chip.className        = 'palette-chip';
    chip.dataset.effect   = meta.name;
    chip.style.setProperty('--effect-color', meta.color);
    chip.setAttribute('aria-pressed', 'false');
    chip.title            = meta.desc;
    chip.innerHTML        = `<span class="palette-icon">${meta.icon}</span><span class="palette-label">${meta.label}</span>`;
    chip.addEventListener('click', () => toggleEffect(meta.name));
    effectPalette.appendChild(chip);
  });
}

function refreshPaletteState() {
  const activeNames = new Set(activeLayers.map(l => l.name));
  effectPalette.querySelectorAll('.palette-chip').forEach(chip => {
    const on = activeNames.has(chip.dataset.effect);
    chip.classList.toggle('active', on);
    chip.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function toggleEffect(name) {
  const idx = activeLayers.findIndex(l => l.name === name);
  if (idx === -1) addLayer(name);
  else            removeLayer(activeLayers[idx].id);
}

// ─── Layer management ──────────────────────────────────────────────────────────

function addLayer(name) {
  const meta = EFFECT_META_MAP[name];
  if (!meta) return;
  const options = Object.assign({}, meta.defaultOptions);
  activeLayers.push({ id: `layer-${nextLayerId++}`, name, options });
  refreshLayerUI();
  scheduleRender();
}

function removeLayer(id) {
  activeLayers = activeLayers.filter(l => l.id !== id);
  refreshLayerUI();
  scheduleRender();
}

function moveLayer(id, delta) {
  const i = activeLayers.findIndex(l => l.id === id);
  const j = i + delta;
  if (j < 0 || j >= activeLayers.length) return;
  [activeLayers[i], activeLayers[j]] = [activeLayers[j], activeLayers[i]];
  refreshLayerUI();
  scheduleRender();
}

function setLayerOption(id, key, rawValue, transform) {
  const layer = activeLayers.find(l => l.id === id);
  if (!layer) return;
  // Store raw value (slider int); apply transform when building pipeline
  layer.options[key] = transform ? transform(Number(rawValue)) : (isNaN(Number(rawValue)) ? rawValue : Number(rawValue));
  layer._raw = layer._raw || {};
  layer._raw[key] = rawValue;
  scheduleRender();
}

// ─── Layer UI ──────────────────────────────────────────────────────────────────

function refreshLayerUI() {
  // Remove old chips
  layerStack.querySelectorAll('.layer-chip').forEach(el => el.remove());
  layerEmpty.hidden = activeLayers.length > 0;

  activeLayers.forEach((layer, idx) => {
    const chip = buildLayerChip(layer, EFFECT_META_MAP[layer.name], idx);
    layerStack.appendChild(chip);
  });

  refreshPaletteState();
  refreshPipelineDisplay();
}

function buildLayerChip(layer, meta, idx) {
  const isFirst = idx === 0;
  const isLast  = idx === activeLayers.length - 1;

  const chip = document.createElement('div');
  chip.className    = 'layer-chip';
  chip.dataset.id   = layer.id;
  chip.draggable    = true;
  chip.setAttribute('role', 'listitem');
  chip.style.setProperty('--effect-color', meta.color);

  // ── Build control rows ──
  const controlRows = meta.controls.map(ctrl => {
    if (ctrl.type === 'range') {
      // Read back raw value from layer._raw or reverse-transform
      const raw = (layer._raw?.[ctrl.key] !== undefined)
        ? layer._raw[ctrl.key]
        : (ctrl.transform ? Math.round(layer.options[ctrl.key] * 100) : layer.options[ctrl.key]);
      return `
        <label class="ctrl-row">
          <span class="ctrl-label">${ctrl.label}</span>
          <input type="range" class="ctrl-slider" data-key="${ctrl.key}"
            min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${raw}" />
          <span class="ctrl-val" data-vkey="${ctrl.key}">${ctrl.display ? ctrl.display(Number(raw)) : raw}</span>
        </label>`;
    }
    if (ctrl.type === 'color') {
      const val = layer.options[ctrl.key] || '#000000';
      return `
        <label class="ctrl-row">
          <span class="ctrl-label">${ctrl.label}</span>
          <input type="color" class="ctrl-color" data-key="${ctrl.key}" value="${val}" />
          <span class="ctrl-val" data-vkey="${ctrl.key}">${val}</span>
        </label>`;
    }
    if (ctrl.type === 'text') {
      const val = layer.options[ctrl.key] || '';
      return `
        <label class="ctrl-row ctrl-row-text">
          <span class="ctrl-label">${ctrl.label}</span>
          <input type="text" class="ctrl-text" data-key="${ctrl.key}"
            value="${val}" placeholder="${ctrl.placeholder || ''}" />
        </label>`;
    }
    return '';
  }).join('');

  chip.innerHTML = `
    <div class="chip-header">
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <span class="chip-icon" aria-hidden="true">${meta.icon}</span>
      <span class="chip-name">${meta.label}</span>
      <div class="chip-arrows">
        <button class="chip-btn arrow-up"  title="Move up"   ${isFirst ? 'disabled' : ''} aria-label="Move ${meta.label} up">↑</button>
        <button class="chip-btn arrow-dn"  title="Move down" ${isLast  ? 'disabled' : ''} aria-label="Move ${meta.label} down">↓</button>
      </div>
      <button class="chip-btn chip-remove" title="Remove effect" aria-label="Remove ${meta.label}">✕</button>
    </div>
    ${controlRows ? `<div class="chip-controls">${controlRows}</div>` : ''}
  `;

  // ── Wire events ──
  chip.querySelector('.chip-remove').addEventListener('click', () => removeLayer(layer.id));
  chip.querySelector('.arrow-up')?.addEventListener('click', () => moveLayer(layer.id, -1));
  chip.querySelector('.arrow-dn')?.addEventListener('click', () => moveLayer(layer.id, +1));

  chip.querySelectorAll('.ctrl-slider').forEach(input => {
    const ctrl    = meta.controls.find(c => c.key === input.dataset.key);
    const valSpan = chip.querySelector(`[data-vkey="${ctrl.key}"]`);
    // Init _raw
    layer._raw = layer._raw || {};
    layer._raw[ctrl.key] = Number(input.value);
    input.addEventListener('input', () => {
      const raw = Number(input.value);
      if (valSpan && ctrl.display) valSpan.textContent = ctrl.display(raw);
      layer._raw[ctrl.key] = raw;
      layer.options[ctrl.key] = ctrl.transform ? ctrl.transform(raw) : raw;
      scheduleRender();
    });
  });

  chip.querySelectorAll('.ctrl-color').forEach(input => {
    const valSpan = chip.querySelector(`[data-vkey="${input.dataset.key}"]`);
    input.addEventListener('input', () => {
      if (valSpan) valSpan.textContent = input.value;
      layer.options[input.dataset.key] = input.value;
      scheduleRender();
    });
  });

  chip.querySelectorAll('.ctrl-text').forEach(input => {
    input.addEventListener('input', () => {
      layer.options[input.dataset.key] = input.value;
      scheduleRender();
    });
  });

  // ── Drag & Drop reorder ──
  chip.addEventListener('dragstart', e => {
    dragSrcId = layer.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layer.id);
    requestAnimationFrame(() => chip.classList.add('dragging'));
  });
  chip.addEventListener('dragend', () => {
    chip.classList.remove('dragging');
    layerStack.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragSrcId = null;
  });
  chip.addEventListener('dragover',  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  chip.addEventListener('dragenter', e => { e.preventDefault(); if (dragSrcId !== layer.id) chip.classList.add('drag-over'); });
  chip.addEventListener('dragleave', e => { if (!chip.contains(e.relatedTarget)) chip.classList.remove('drag-over'); });
  chip.addEventListener('drop', e => {
    e.stopPropagation();
    chip.classList.remove('drag-over');
    if (!dragSrcId || dragSrcId === layer.id) return;
    const si = activeLayers.findIndex(l => l.id === dragSrcId);
    const di = activeLayers.findIndex(l => l.id === layer.id);
    if (si !== -1 && di !== -1) {
      const [moved] = activeLayers.splice(si, 1);
      activeLayers.splice(di, 0, moved);
      refreshLayerUI();
      scheduleRender();
    }
  });

  return chip;
}

// ─── Pipeline display ──────────────────────────────────────────────────────────

function refreshPipelineDisplay() {
  const nodes = [`<span class="pipe-node pipe-base">BaseImage</span>`];
  activeLayers.forEach(l => {
    const m = EFFECT_META_MAP[l.name];
    nodes.push(
      `<span class="pipe-arrow">→</span>` +
      `<span class="pipe-node" style="--effect-color:${m.color}">${m.label}</span>`
    );
  });
  pipelineChain.innerHTML = nodes.join('');
}

// ─── Canvas render ─────────────────────────────────────────────────────────────

function scheduleRender(immediate = false) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(render, immediate ? 0 : 80);
}

async function render() {
  if (!uploadedImg) return;

  canvasLoading.hidden     = false;
  previewCanvas.hidden     = true;
  canvasPlaceholder.hidden = true;

  try {
    const base     = new BaseImage(uploadedImg);
    const config   = activeLayers.map(l => ({ name: l.name, options: l.options }));
    const pipeline = buildPipeline(base, config);
    const result   = await pipeline.process();

    previewCanvas.width  = result.width;
    previewCanvas.height = result.height;
    previewCanvas.getContext('2d').drawImage(result, 0, 0);

    previewCanvas.hidden  = false;
    canvasLoading.hidden  = true;
    btnDownload.disabled  = false;
  } catch (err) {
    console.error('[PixelWrap] Render error:', err);
    canvasLoading.hidden     = true;
    canvasPlaceholder.hidden = false;
    canvasPlaceholder.querySelector('p').textContent = `Error: ${err.message}`;
  }
}

// ─── Download ──────────────────────────────────────────────────────────────────

btnDownload.addEventListener('click', () => {
  if (previewCanvas.hidden) return;
  previewCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `pixelwrap-${activeLayers.map(l => l.name).join('-') || 'original'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
});

// ─── Reset ─────────────────────────────────────────────────────────────────────

btnReset.addEventListener('click', () => {
  if (uploadedImg?.src?.startsWith('blob:')) URL.revokeObjectURL(uploadedImg.src);
  uploadedImg     = null;
  activeLayers    = [];
  fileInput.value = '';

  uploadZone.classList.remove('has-image', 'drag-active');
  uploadZone.querySelector('.upload-thumb-wrap').innerHTML = '';
  uploadZone.querySelector('.upload-hint').textContent     = 'or click to browse';

  refreshLayerUI();

  previewCanvas.hidden     = true;
  canvasLoading.hidden     = true;
  canvasPlaceholder.hidden = false;
  canvasPlaceholder.querySelector('p').textContent = 'Upload an image to start';
  btnDownload.disabled     = true;

  refreshPipelineDisplay();
});

// ─── Init ──────────────────────────────────────────────────────────────────────

buildPalette();
refreshLayerUI();
