import { useState } from 'react';
import { loadImageFromFile } from '../utils/watermark.js';
import { FONTS } from '../utils/fonts.js';

/**
 * Watermark source controls: mode toggle (Text / Image), the matching input,
 * and the opacity slider. Decodes an uploaded watermark image into an
 * HTMLImageElement before lifting it to parent state.
 */
function WatermarkControls({
  mode,
  onModeChange,
  text,
  onTextChange,
  watermarkImageName,
  onWatermarkImageChange,
  opacity,
  onOpacityChange,
  count,
  onCountChange,
  scale,
  onScaleChange,
  font,
  onFontChange,
}) {
  const [error, setError] = useState('');

  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const img = await loadImageFromFile(file);
      onWatermarkImageChange(img, file.name);
    } catch {
      setError('Could not load that image.');
      onWatermarkImageChange(null, '');
    }
  }

  return (
    <section className="panel">
      <h2>Watermark</h2>

      <div className="mode-toggle" role="tablist" aria-label="Watermark mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          className={mode === 'text' ? 'active' : ''}
          onClick={() => onModeChange('text')}
        >
          Text
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'image'}
          className={mode === 'image' ? 'active' : ''}
          onClick={() => onModeChange('image')}
        >
          Image
        </button>
      </div>

      {mode === 'text' ? (
        <>
          <label className="field">
            <span>Watermark text</span>
            <input
              type="text"
              value={text}
              placeholder="e.g. Tiago Costa"
              onChange={(e) => onTextChange(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Font</span>
            <select
              value={font}
              onChange={(e) => onFontChange(e.target.value)}
              style={{ fontFamily: font }}
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        <label className="field">
          <span>Watermark image (PNG recommended)</span>
          <input type="file" accept="image/png,image/*" onChange={handleImageFile} />
          {watermarkImageName && <small className="hint">{watermarkImageName}</small>}
          {error && <small className="error">{error}</small>}
        </label>
      )}

      <label className="field">
        <span>Number of watermarks</span>
        <input
          type="number"
          min="1"
          step="1"
          value={count}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            onCountChange(Number.isNaN(next) ? 1 : Math.max(1, next));
          }}
        />
      </label>

      <label className="field">
        <span>
          Scale: <strong>{scale}%</strong>
        </span>
        <input
          type="range"
          min="25"
          max="400"
          step="5"
          value={scale}
          onChange={(e) => onScaleChange(Number(e.target.value))}
        />
      </label>

      <label className="field">
        <span>
          Opacity: <strong>{opacity}%</strong>
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => onOpacityChange(Number(e.target.value))}
        />
      </label>
    </section>
  );
}

export default WatermarkControls;
