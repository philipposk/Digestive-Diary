import { getSupabaseClient } from '../supabase/client';
import { getSyncStatus } from './cloudSync';

const BUCKET = 'user-photos';

function isDataUrl(url: string): boolean {
  return url.startsWith('data:');
}

/** Upload a data-URL photo to Supabase storage; returns public signed path or original URL. */
export async function ensureRemotePhotoUrl(
  photoUrl: string | undefined,
  storagePath: string
): Promise<string | undefined> {
  if (!photoUrl || !isDataUrl(photoUrl)) return photoUrl;
  const { userId } = getSyncStatus();
  if (!userId) return photoUrl;

  const sb = getSupabaseClient();
  if (!sb) return photoUrl;

  try {
    const [meta, b64] = photoUrl.split(',');
    const mime = meta.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg';
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${userId}/${storagePath}`;

    const { error } = await sb.storage.from(BUCKET).upload(path, bytes, {
      upsert: true,
      contentType: mime,
    });
    if (error) {
      console.warn('photo upload:', error.message);
      return photoUrl;
    }

    return `storage:${path}`;
  } catch (e) {
    console.warn('photo upload failed', e);
    return photoUrl;
  }
}
