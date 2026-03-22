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
    // Use verbose_json to get duration, and example-based prompt for filler words
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      prompt: "Umm, let me think like, hmm... Okay, here's what I'm, like, thinking. So, uh, you know, it's basically, um, I mean, actually, right, well, yeah, so basically...",
    });

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration || 0,
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
