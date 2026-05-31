// Bundling exported image blobs into a single zip and triggering its download.
// No React here.
import JSZip from 'jszip';

/**
 * Bundle blobs into a zip and trigger a single download.
 * Files are named sequentially with zero-padded indexes.
 *
 * @param {Blob[]} blobs
 * @param {object} [options]
 * @param {string} [options.zipName]  - name of the downloaded zip
 * @param {string} [options.prefix]   - per-file name prefix
 * @returns {Promise<void>}
 */
export async function bundleAndDownload(
  blobs,
  { zipName = 'watermarked.zip', prefix = 'watermarked' } = {},
) {
  const zip = new JSZip();

  const pad = String(blobs.length).length;
  blobs.forEach((blob, i) => {
    const index = String(i + 1).padStart(Math.max(3, pad), '0');
    zip.file(`${prefix}-${index}.jpg`, blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(zipBlob, zipName);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has a chance to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
