import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

const RECEIPTS_DIR = `${FileSystem.documentDirectory}receipts/`;
const TARGET_MAX_BYTES = 100 * 1024; // 100KB ceiling per spec
const MIN_QUALITY = 0.25;

async function ensureReceiptsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(RECEIPTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECEIPTS_DIR, { intermediates: true });
  }
}

/**
 * Resizes + compresses a captured receipt photo down into the 80-100KB
 * target range before it's queued for upload, keeping cloud storage cost
 * near zero at scale. Uses a shrinking-quality loop rather than a single
 * fixed quality, since receipt photos vary a lot in raw size/lighting.
 */
export async function compressReceiptImage(sourceUri: string, localId: string): Promise<string> {
  await ensureReceiptsDir();

  let width = 1000;
  let quality = 0.7;
  let result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  let sizeInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
  let size = (sizeInfo.exists && "size" in sizeInfo && sizeInfo.size) || 0;

  // Iteratively step quality/width down until we're under the target size
  // or we hit the quality floor (avoids producing an unreadable image).
  let attempts = 0;
  while (size > TARGET_MAX_BYTES && quality > MIN_QUALITY && attempts < 5) {
    quality -= 0.15;
    width = Math.max(600, width - 150);
    result = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );
    sizeInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
    size = (sizeInfo.exists && "size" in sizeInfo && sizeInfo.size) || 0;
    attempts += 1;
  }

  const destination = `${RECEIPTS_DIR}${localId}.jpg`;
  await FileSystem.moveAsync({ from: result.uri, to: destination });
  return destination;
}

export async function deleteLocalImage(path: string | null): Promise<void> {
  if (!path) return;
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

export async function readImageAsBase64(path: string): Promise<string> {
  return FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.Base64 });
}
