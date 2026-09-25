'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';

const BUCKET = 'user-photos';

export function useResolvedPhotoUrl(url: string | undefined): string | undefined {
  const [resolved, setResolved] = useState(url);

  useEffect(() => {
    if (!url) {
      setResolved(undefined);
      return;
    }
    if (!url.startsWith('storage:')) {
      setResolved(url);
      return;
    }
    const path = url.slice('storage:'.length);
    const sb = getSupabaseClient();
    if (!sb) {
      setResolved(url);
      return;
    }
    sb.storage.from(BUCKET).createSignedUrl(path, 3600).then(({ data, error }) => {
      setResolved(error ? url : data?.signedUrl ?? url);
    });
  }, [url]);

  return resolved;
}
