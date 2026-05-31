import { useEffect, useRef } from 'react';
import { drawWatermarked } from '../utils/watermark.js';

/**
 * Live preview of the watermark applied to the first base image. The canvas is
 * driven imperatively from a useEffect that re-renders whenever any real input
 * changes — every dependency is listed explicitly.
 */
function Preview({ baseImg, mode, text, watermarkImage, opacity, count, scale, font }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImg) return;
    drawWatermarked(canvas, baseImg, {
      mode,
      text,
      image: watermarkImage,
      opacity,
      count,
      scale,
      font,
    });
  }, [baseImg, mode, text, watermarkImage, opacity, count, scale, font]);

  return (
    <section className="panel preview">
      <h2>Preview</h2>
      {baseImg ? (
        <div className="canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <p className="empty">Select a base image to see a live preview.</p>
      )}
    </section>
  );
}

export default Preview;
