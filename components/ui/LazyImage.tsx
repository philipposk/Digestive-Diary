'use client';

import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

/** Lazy-loaded image with blob/data URL support via unoptimized fallback. */
export default function LazyImage({ src, alt, className, width = 800, height = 400 }: Props) {
  const isBlob = src.startsWith('blob:') || src.startsWith('data:');

  if (isBlob) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      unoptimized
    />
  );
}
