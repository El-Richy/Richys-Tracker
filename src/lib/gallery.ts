import { Capacitor, registerPlugin } from '@capacitor/core';

interface GallerySavePlugin {
  saveJpeg(options: { data: string; filename: string }): Promise<void>;
}

const GallerySave = registerPlugin<GallerySavePlugin>('GallerySave');

function jpegFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `richys-${stamp}.jpg`;
}

/** Best-effort copy of a journal photo into Pictures/RichysTracker. */
export async function saveJpegToGallery(dataUrl: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (!dataUrl.startsWith('data:image')) return;
  try {
    await GallerySave.saveJpeg({ data: dataUrl, filename: jpegFilename() });
  } catch (error) {
    console.error('[gallery] Could not save photo to Pictures/RichysTracker', error);
  }
}
