import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { SCORING_SYSTEM_PROMPT, buildScoringPrompt } from '@/lib/prompts/scoring';

interface ScoreRequest {
  transcript: string;
  category: string;
  prompt: string;
  duration?: number; // Speech duration in seconds (max 60)
}

interface DimensionScore {
  score: number;
  feedback: string;
}

interface ScoreResponse {
  overall: number;
  dimensions: {
    fillerWords: DimensionScore;
    repetition: DimensionScore;
    clarity: DimensionScore;
    relevance: DimensionScore;
    vocabulary: DimensionScore;
  };
  tip: string;
}

export async function POST(request: NextRequest) {
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse the JSON body
    const body: ScoreRequest = await request.json();
    const { transcript, category, prompt, duration = 60 } = body;

    // Validate required fields
    if (!transcript || !category || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, category, and prompt are required' },
        { status: 400 }
      );
    }

    // Calculate duration factor (pro-rate score based on speaking time)
    // 60 seconds = 100%, 30 seconds = 70%, 15 seconds = 55%
    const maxDuration = 60;
    const normalizedDuration = Math.min(Math.max(duration, 0), maxDuration);
    const durationFactor = 0.4 + (normalizedDuration / maxDuration) * 0.6;

    // Build the user prompt
    const userPrompt = buildScoringPrompt(category, prompt, transcript);

    // Call OpenAI GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }

    const scoreData: ScoreResponse = JSON.parse(responseContent);

    // Validate the response structure
    if (
      typeof scoreData.overall !== 'number' ||
      !scoreData.dimensions ||
      !scoreData.tip
    ) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Apply duration factor to overall score
    const adjustedOverall = Math.round(scoreData.overall * durationFactor);

    // Add duration info to response
    return NextResponse.json({
      ...scoreData,
      overall: adjustedOverall,
      rawOverall: scoreData.overall,
      durationSeconds: normalizedDuration,
      durationFactor: Math.round(durationFactor * 100),
    });
  } catch (error) {
    console.error('Scoring error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Scoring failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred during scoring' },
      { status: 500 }
    );
  }
}
