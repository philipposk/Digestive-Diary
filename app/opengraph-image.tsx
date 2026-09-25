import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/seo';

export const runtime = 'edge';
export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #f6f5f1 0%, #e6ebd9 100%)',
          color: '#16161a',
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: '-0.02em' }}>{SITE_NAME}</div>
        <div style={{ fontSize: 28, marginTop: 16, maxWidth: 800, color: '#3a3a36' }}>{SITE_DESCRIPTION}</div>
      </div>
    ),
    { ...size }
  );
}
