import { useState } from 'react';
import WatermarkControls from './components/WatermarkControls.jsx';
import { FONTS } from './utils/fonts.js';
import ImageDropzone from './components/ImageDropzone.jsx';
import Preview from './components/Preview.jsx';
import { drawWatermarked, canvasToBlob } from './utils/watermark.js';
import { bundleAndDownload } from './utils/download.js';
import './App.css';

function App() {
  const [mode, setMode] = useState('text');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [watermarkImageName, setWatermarkImageName] = useState('');
  const [opacity, setOpacity] = useState(35);
  const [count, setCount] = useState(9);
  const [scale, setScale] = useState(100);
  const [font, setFont] = useState(FONTS[0].value);
  const [baseImages, setBaseImages] = useState([]);
  const [progress, setProgress] = useState(null); // { done, total } while processing

  function handleWatermarkImageChange(img, name) {
    setWatermarkImage(img);
    setWatermarkImageName(name);
  }

  const hasSource =
    (mode === 'text' && watermarkText.trim()) || (mode === 'image' && watermarkImage);
  const canProcess = baseImages.length > 0 && !progress;

  async function processAndDownload() {
    if (!canProcess) return;
    const total = baseImages.length;
    setProgress({ done: 0, total });

    const blobs = [];
    try {
      for (const item of baseImages) {
        // One offscreen canvas per image, released before moving on, to avoid
        // holding many large bitmaps in memory at once.
        const canvas = document.createElement('canvas');
        drawWatermarked(canvas, item.img, {
          mode,
          text: watermarkText,
          image: watermarkImage,
          opacity,
          count,
          scale,
          font,
        });
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        blobs.push(blob);

        // Release the canvas.
        canvas.width = 0;
        canvas.height = 0;

        setProgress((prev) => ({ done: (prev?.done ?? 0) + 1, total }));
      }

      await bundleAndDownload(blobs);
    } catch (err) {
      console.error('Processing failed:', err);
      alert('Something went wrong while processing the images.');
    } finally {
      setProgress(null);
    }
  }

  const previewImg = baseImages[0]?.img ?? null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Watermarker</h1>
        <p>Batch-watermark your images, right in the browser.</p>
      </header>

      <main className="layout">
        <div className="column">
          <WatermarkControls
            mode={mode}
            onModeChange={setMode}
            text={watermarkText}
            onTextChange={setWatermarkText}
            watermarkImageName={watermarkImageName}
            onWatermarkImageChange={handleWatermarkImageChange}
            opacity={opacity}
            onOpacityChange={setOpacity}
            count={count}
            onCountChange={setCount}
            scale={scale}
            onScaleChange={setScale}
            font={font}
            onFontChange={setFont}
          />
          <Preview
            baseImg={previewImg}
            mode={mode}
            text={watermarkText}
            watermarkImage={watermarkImage}
            opacity={opacity}
            count={count}
            scale={scale}
            font={font}
          />
        </div>

        <div className="column">
          <ImageDropzone images={baseImages} onImagesChange={setBaseImages} />

          <section className="panel process">
            {progress ? (
              <div className="progress">
                <div className="progress-label">
                  {progress.done} / {progress.total}
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="primary"
                  disabled={!canProcess}
                  onClick={processAndDownload}
                >
                  Process &amp; Download
                </button>
                {!hasSource && baseImages.length > 0 && (
                  <small className="hint">
                    Tip: add watermark {mode === 'text' ? 'text' : 'an image'} above for a visible mark.
                  </small>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
