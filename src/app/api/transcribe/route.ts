import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse the FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: 'No audio file provided or invalid format' },
        { status: 400 }
      );
    }

    // Convert Blob to File for OpenAI API
    const file = new File([audioFile], 'audio.webm', { type: audioFile.type });

    // Send to OpenAI Whisper API
    // Use prompt parameter to encourage verbatim transcription including filler words
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      prompt: 'Transcribe exactly as spoken, including all filler words like um, uh, like, you know, so, actually, basically, literally, I mean, right, okay, well, and any hesitations or repeated words.',
    });

    return NextResponse.json({
      transcript: transcription.text,
    });
  } catch (error) {
    console.error('Transcription error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Transcription failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during transcription' },
      { status: 500 }
    );
  }
}
