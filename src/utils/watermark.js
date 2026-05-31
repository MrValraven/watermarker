// Pure watermarking utilities. No React, no DOM event wiring — just functions
// that take inputs and draw to / read from a canvas. This keeps the rendering
// logic testable and reusable, and lets the components stay thin.

// Tiling / appearance constants.
const WATERMARK_ANGLE = -Math.PI / 6; // ~ -30 degrees, diagonal
const TEXT_SIZE_RATIO = 0.035; // font size ~3.5% of base image width (at 100% scale)
const IMAGE_WIDTH_RATIO = 0.15; // image watermark ~15% of base image width (at 100% scale)
const DEFAULT_COUNT = 9; // how many watermarks to place when unspecified
const DEFAULT_SCALE = 100; // watermark size as a percent of the base ratio
const DEFAULT_FONT = 'system-ui, sans-serif'; // text watermark font-family

/**
 * Load a user-supplied File into a fully-decoded HTMLImageElement.
 * Uses an object URL that is revoked once decoding finishes. No network URLs.
 *
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // decode() ensures the bitmap is ready before we draw it to a canvas.
      const finish = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      if (img.decode) {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

/**
 * Draw a base image with a tiled, diagonal, semi-transparent watermark onto a
 * canvas. The canvas is sized to match the base image.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImageElement} baseImg
 * @param {object} options
 * @param {'text'|'image'} options.mode
 * @param {string} [options.text]            - watermark text (text mode)
 * @param {HTMLImageElement|null} [options.image] - watermark image (image mode)
 * @param {number} options.opacity           - 0..100
 * @param {number} [options.count]           - exact number of watermarks to place
 * @param {number} [options.scale]           - watermark size as a percent (100 = default)
 * @param {string} [options.font]            - text watermark font-family (text mode)
 */
export function drawWatermarked(
  canvas,
  baseImg,
  {
    mode,
    text,
    image,
    opacity,
    count = DEFAULT_COUNT,
    scale = DEFAULT_SCALE,
    font = DEFAULT_FONT,
  },
) {
  const width = baseImg.naturalWidth || baseImg.width;
  const height = baseImg.naturalHeight || baseImg.height;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(baseImg, 0, 0, width, height);

  const alpha = Math.max(0, Math.min(100, opacity)) / 100;
  if (alpha <= 0) return;

  // Nothing to draw if the chosen source is empty.
  if (mode === 'text' && (!text || !text.trim())) return;
  if (mode === 'image' && !image) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  const scaleFactor = Math.max(0, scale) / 100;

  if (mode === 'text') {
    drawTextTiles(ctx, width, height, text.trim(), count, scaleFactor, font);
  } else {
    drawImageTiles(ctx, width, height, image, count, scaleFactor);
  }

  ctx.restore();
}

function drawTextTiles(ctx, width, height, text, count, scaleFactor, font) {
  const fontSize = Math.max(1, Math.round(width * TEXT_SIZE_RATIO * scaleFactor));
  ctx.font = `600 ${fontSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = Math.max(2, Math.round(fontSize * 0.12));
  ctx.shadowOffsetX = Math.max(1, Math.round(fontSize * 0.06));
  ctx.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.06));

  placeGrid(ctx, width, height, count, () => {
    ctx.fillText(text, 0, 0);
  });
}

function drawImageTiles(ctx, width, height, image, count, scaleFactor) {
  const drawW = width * IMAGE_WIDTH_RATIO * scaleFactor;
  const aspect = (image.naturalHeight || image.height) / (image.naturalWidth || image.width);
  const drawH = drawW * aspect;

  placeGrid(ctx, width, height, count, () => {
    ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
  });
}

/**
 * Place exactly `count` watermarks spread evenly across the image in a
 * roughly-square grid. Each mark is rotated to the diagonal angle around its
 * own center; `paint` draws centered on the origin (0, 0). A count of 1 places
 * a single centered mark.
 */
function placeGrid(ctx, width, height, count, paint) {
  const total = Math.max(1, Math.floor(count));
  const cols = Math.ceil(Math.sqrt(total));
  const rows = Math.ceil(total / cols);

  let placed = 0;
  for (let r = 0; r < rows && placed < total; r += 1) {
    for (let c = 0; c < cols && placed < total; c += 1) {
      const x = ((c + 0.5) / cols) * width;
      const y = ((r + 0.5) / rows) * height;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(WATERMARK_ANGLE);
      paint();
      ctx.restore();

      placed += 1;
    }
  }
}

/**
 * Promise wrapper around canvas.toBlob.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} [type]
 * @param {number} [quality]
 * @returns {Promise<Blob>}
 */
export function canvasToBlob(canvas, type = 'image/jpeg', quality = 0.92) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob produced no blob'));
      },
      type,
      quality,
    );
  });
}
