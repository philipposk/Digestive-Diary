import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { guardApiRoute } from '@/lib/apiGuard';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB (Whisper hard limit)

export async function POST(request: NextRequest) {
  const blocked = await guardApiRoute(request, { bucket: 'transcribe', capacity: 15, refillPerMinute: 15, requireAuth: true });
  if (blocked) return blocked;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ error: 'invalid audio type' }, { status: 400 });
    }
    if (audioFile.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'audio file too large' }, { status: 413 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
  }
}
