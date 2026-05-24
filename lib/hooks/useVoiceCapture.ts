'use client';

import { useCallback, useRef, useState } from 'react';

interface VoiceCaptureState {
  recording: boolean;
  transcribing: boolean;
  error: string | null;
  supported: boolean;
}

interface VoiceCaptureApi extends VoiceCaptureState {
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  reset: () => void;
}

const PREFERRED_MIME = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
];

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  for (const m of PREFERRED_MIME) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export function useVoiceCapture(): VoiceCaptureApi {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((value: string | null) => void) | null>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  };

  const start = useCallback(async () => {
    if (!supported) {
      setError('Voice capture not supported in this browser');
      return;
    }
    if (recording) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = (e: any) => {
        setError(e?.error?.message || 'Recorder error');
      };
      recorder.onstop = async () => {
        const resolve = stopResolverRef.current;
        stopResolverRef.current = null;
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mime || 'audio/webm' });
        cleanupStream();
        if (!resolve) return;
        if (blob.size === 0) {
          resolve(null);
          return;
        }
        setTranscribing(true);
        try {
          const ext = (recorder.mimeType || mime || 'audio/webm').includes('mp4') ? 'm4a'
            : (recorder.mimeType || mime || 'audio/webm').includes('ogg') ? 'ogg'
            : (recorder.mimeType || mime || 'audio/webm').includes('wav') ? 'wav'
            : 'webm';
          const fd = new FormData();
          fd.append('audio', new File([blob], `voice.${ext}`, { type: blob.type }));
          const res = await fetch('/api/openai/transcribe', { method: 'POST', body: fd });
          if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            throw new Error(j?.error || `Transcribe failed: ${res.status}`);
          }
          const data = await res.json();
          resolve(typeof data?.text === 'string' ? data.text.trim() : null);
        } catch (err: any) {
          setError(err?.message || 'Transcription failed');
          resolve(null);
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err: any) {
      setError(err?.message || 'Microphone access denied');
      cleanupStream();
      setRecording(false);
    }
  }, [supported, recording]);

  const stop = useCallback(async (): Promise<string | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return null;
    return new Promise<string | null>((resolve) => {
      stopResolverRef.current = resolve;
      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setTranscribing(false);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* noop */ }
    }
    cleanupStream();
    setRecording(false);
  }, []);

  return { recording, transcribing, error, supported, start, stop, reset };
}
