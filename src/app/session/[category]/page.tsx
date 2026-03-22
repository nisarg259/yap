'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThinkTimer } from '@/components/ThinkTimer'
import { RecordTimer } from '@/components/RecordTimer'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import prompts from '@/data/prompts.json'

// Session phases
type SessionPhase = 'PROMPT' | 'THINK' | 'RECORD' | 'PROCESSING' | 'RESULT'

// TypeScript types
interface Prompt {
  text: string
  category: string
}

interface DimensionScore {
  score: number
  feedback: string
}

interface ScoreData {
  overall: number
  rawOverall?: number
  durationSeconds?: number
  durationFactor?: number
  dimensions: {
    fillerWords: DimensionScore
    repetition: DimensionScore
    clarity: DimensionScore
    relevance: DimensionScore
    vocabulary: DimensionScore
  }
  tip: string
}

// Categories from prompts.json
type Category = keyof typeof prompts

// Storage key for used prompts
const USED_PROMPTS_KEY = 'speakup_used_prompts'

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const categoryParam = params.category as string

  // Session state
  const [phase, setPhase] = useState<SessionPhase>('PROMPT')
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Audio recorder hook
  const { startRecording, stopRecording, audioBlob, isRecording } = useAudioRecorder()

  // Get a random prompt for the category
  const getRandomPrompt = (category: string): Prompt | null => {
    let availableCategories: Category[]

    // Handle "random" category by picking from all categories
    if (category === 'random') {
      availableCategories = Object.keys(prompts) as Category[]
    } else if (category in prompts) {
      availableCategories = [category as Category]
    } else {
      return null
    }

    // Get used prompts from sessionStorage
    const usedPromptsJson = sessionStorage.getItem(USED_PROMPTS_KEY)
    const usedPrompts: string[] = usedPromptsJson ? JSON.parse(usedPromptsJson) : []

    // Collect all available prompts
    const allPrompts: Prompt[] = []
    for (const cat of availableCategories) {
      const categoryPrompts = prompts[cat]
      categoryPrompts.forEach((text: string) => {
        if (!usedPrompts.includes(text)) {
          allPrompts.push({ text, category: cat })
        }
      })
    }

    // If all prompts have been used, reset
    if (allPrompts.length === 0) {
      sessionStorage.removeItem(USED_PROMPTS_KEY)
      // Collect all prompts again
      for (const cat of availableCategories) {
        const categoryPrompts = prompts[cat]
        categoryPrompts.forEach((text: string) => {
          allPrompts.push({ text, category: cat })
        })
      }
    }

    // Pick a random prompt
    if (allPrompts.length === 0) return null

    const randomIndex = Math.floor(Math.random() * allPrompts.length)
    const selectedPrompt = allPrompts[randomIndex]

    // Mark this prompt as used
    const updatedUsedPrompts = [...usedPrompts, selectedPrompt.text]
    sessionStorage.setItem(USED_PROMPTS_KEY, JSON.stringify(updatedUsedPrompts))

    return selectedPrompt
  }

  // Initialize prompt on mount
  useEffect(() => {
    const selectedPrompt = getRandomPrompt(categoryParam)
    if (selectedPrompt) {
      setPrompt(selectedPrompt)
    } else {
      setError('Invalid category or no prompts available')
    }
  }, [categoryParam])

  // Handle think timer completion
  const handleThinkComplete = () => {
    setPhase('RECORD')
  }

  // Handle think timer skip
  const handleThinkSkip = () => {
    setPhase('RECORD')
  }

  // Auto-start recording when entering RECORD phase
  useEffect(() => {
    if (phase === 'RECORD') {
      startRecording()
    }
  }, [phase])

  // Handle record timer completion
  const handleRecordComplete = async () => {
    stopRecording()
    setPhase('PROCESSING')
  }

  // Handle record timer stop (manual or after minimum time)
  const handleRecordStop = async () => {
    stopRecording()
    setPhase('PROCESSING')
  }

  // Process audio when we have an audio blob and we're in PROCESSING phase
  useEffect(() => {
    if (phase === 'PROCESSING' && audioBlob && prompt) {
      processAudio(audioBlob, prompt)
    }
  }, [phase, audioBlob, prompt])

  // Process the audio recording
  const processAudio = async (blob: Blob, currentPrompt: Prompt) => {
    try {
      setIsLoading(true)
      setError(null)

      // Step 1: Transcribe audio
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        throw new Error(errorData.error || 'Transcription failed')
      }

      const { transcript: transcriptText, duration: speechDuration } = await transcribeResponse.json()
      setTranscript(transcriptText)

      // Step 2: Score transcript (with duration for pro-rating)
      const scoreResponse = await fetch('/api/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcriptText,
          category: currentPrompt.category,
          prompt: currentPrompt.text,
          duration: speechDuration || 60,
        }),
      })

      if (!scoreResponse.ok) {
        const errorData = await scoreResponse.json()
        throw new Error(errorData.error || 'Scoring failed')
      }

      const scoreResult: ScoreData = await scoreResponse.json()
      setScoreData(scoreResult)
      setPhase('RESULT')
    } catch (err) {
      console.error('Processing error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during processing')
      setPhase('PROMPT')
    } finally {
      setIsLoading(false)
    }
  }

  // Start session
  const handleStartSession = () => {
    setPhase('THINK')
  }

  // Retry (go back to prompt)
  const handleRetry = () => {
    setPhase('PROMPT')
    setTranscript('')
    setScoreData(null)
    setError(null)
    const newPrompt = getRandomPrompt(categoryParam)
    if (newPrompt) {
      setPrompt(newPrompt)
    }
  }

  // Render based on phase
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="flex w-full max-w-4xl flex-col items-center px-6 py-12 sm:px-8">
        {/* Error Display */}
        {error && (
          <Card className="mb-6 w-full border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleRetry} className="mt-4" variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PROMPT Phase - prompt is hidden until user starts */}
        {phase === 'PROMPT' && prompt && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Ready to speak?
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Category: {prompt.category.charAt(0).toUpperCase() + prompt.category.slice(1)}
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="py-12">
                <p className="text-center text-lg text-zinc-600 dark:text-zinc-400">
                  Your prompt will be revealed when you start.
                </p>
                <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-500">
                  You&apos;ll have 15 seconds to think before recording begins.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button onClick={handleStartSession} size="lg" className="px-8 py-6 text-lg">
                Start Session
              </Button>
            </div>
          </div>
        )}

        {/* THINK Phase */}
        {phase === 'THINK' && prompt && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Think Time
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Organize your thoughts
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="pt-6">
                <p className="mb-6 text-center text-xl font-medium text-zinc-900 dark:text-zinc-50">
                  {prompt.text}
                </p>
                <ThinkTimer
                  onComplete={handleThinkComplete}
                  onSkip={handleThinkSkip}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* RECORD Phase */}
        {phase === 'RECORD' && prompt && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Recording
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Speak your thoughts
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="pt-6">
                <p className="mb-6 text-center text-xl font-medium text-zinc-900 dark:text-zinc-50">
                  {prompt.text}
                </p>
                <RecordTimer
                  isActive={isRecording}
                  onComplete={handleRecordComplete}
                  onStop={handleRecordStop}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROCESSING Phase */}
        {phase === 'PROCESSING' && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Processing
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Analyzing your speech...
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50"></div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {isLoading ? 'Transcribing and scoring...' : 'Preparing...'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* RESULT Phase */}
        {phase === 'RESULT' && scoreData && prompt && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Your Score
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Great job speaking!
              </p>
            </div>

            {/* Overall Score */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="text-6xl font-bold text-zinc-900 dark:text-zinc-50">
                    {Math.round(scoreData.overall)}
                  </div>
                  <div className="ml-2 text-3xl text-zinc-500">/100</div>
                </div>
                {scoreData.durationSeconds !== undefined && scoreData.durationSeconds < 55 && (
                  <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    You spoke for {Math.round(scoreData.durationSeconds)}s of 60s
                    {scoreData.rawOverall && scoreData.rawOverall !== scoreData.overall && (
                      <span> (base score: {scoreData.rawOverall})</span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Dimension Scores */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(scoreData.dimensions).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-sm font-semibold">{value.score}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-zinc-900 dark:bg-zinc-50"
                        style={{ width: `${value.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{value.feedback}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tip */}
            <Card className="w-full border-2 border-zinc-900 dark:border-zinc-50">
              <CardHeader>
                <CardTitle>Tip for Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-900 dark:text-zinc-50">{scoreData.tip}</p>
              </CardContent>
            </Card>

            {/* Transcript */}
            {transcript && (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Your Transcript</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-700 dark:text-zinc-300">{transcript}</p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Button onClick={() => router.push('/')} variant="outline" size="lg">
                Back to Home
              </Button>
              <Button onClick={handleRetry} size="lg">
                Try Another Prompt
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
