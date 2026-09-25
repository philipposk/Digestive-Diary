import { useEffect } from 'react';

/** Escape-to-close + basic dialog semantics for modal overlays. */
export function useModalA11y(isOpen: boolean, onClose: () => void, titleId?: string) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return {
    overlayProps: {
      role: 'dialog' as const,
      'aria-modal': true as const,
      ...(titleId ? { 'aria-labelledby': titleId } : {}),
    },
  };
}
