// Session phases
export type SessionPhase = "prompt" | "think" | "record" | "processing" | "result" | "too-short";

// Category types
export type CategoryId = "politics" | "sports" | "hobbies" | "work" | "empathy" | "random";

export interface Prompt {
  id: string;
  text: string;
}

export interface Category {
  icon: string;
  name: string;
  prompts: Prompt[];
}

export interface PromptsData {
  categories: Record<Exclude<CategoryId, "random">, Category>;
}

// Scoring types
export interface DimensionScore {
  score: number;
  feedback: string;
}

export interface ScoreResult {
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

// API types
export interface TranscribeResponse {
  transcript: string;
  duration?: number;
}

export interface ScoreRequest {
  transcript: string;
  category: string;
  prompt: string;
}

export interface ScoreResponse extends ScoreResult {}

// Session state
export interface SessionState {
  phase: SessionPhase;
  category: CategoryId;
  prompt: Prompt | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string | null;
  score: ScoreResult | null;
  detectedSpeechDuration: number;
  error: string | null;
}
