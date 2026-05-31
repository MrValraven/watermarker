import { useState } from 'react';
import { loadImageFromFile } from '../utils/watermark.js';

/**
 * Base-image selection: a multi-file input (jpg / png / webp) and a thumbnail
 * grid of the selected images. Decodes each file into an HTMLImageElement so
 * the same decoded bitmap is reused for preview and batch processing.
 */
function ImageDropzone({ images, onImagesChange }) {
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError('');

    const loaded = [];
    for (const file of files) {
      try {
        const img = await loadImageFromFile(file);
        loaded.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${loaded.length}`,
          name: file.name,
          img,
          url: img.src,
        });
      } catch {
        // Skip files that fail to decode but report it.
        setError('Some files could not be loaded and were skipped.');
      }
    }
    onImagesChange(loaded);
    // Allow re-selecting the same files later.
    e.target.value = '';
  }

  return (
    <section className="panel">
      <h2>Base images</h2>

      <label className="field">
        <span>Select images (jpg, png, webp)</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFiles}
        />
      </label>
      {error && <small className="error">{error}</small>}

      {images.length > 0 ? (
        <>
          <p className="count">{images.length} image{images.length === 1 ? '' : 's'} selected</p>
          <ul className="thumb-grid">
            {images.map((item) => (
              <li key={item.id} className="thumb">
                <img src={item.url} alt={item.name} loading="lazy" />
                <span className="thumb-name">{item.name}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty">No images selected yet.</p>
      )}
    </section>
  );
}

export default ImageDropzone;
