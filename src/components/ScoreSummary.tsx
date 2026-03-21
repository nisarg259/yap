"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AudioPlayer } from "@/components/AudioPlayer"
import { Lightbulb, RefreshCw, Home } from "lucide-react"

interface ScoreSummaryProps {
  score: {
    overall: number
    dimensions: {
      fillerWords: { score: number; feedback: string }
      repetition: { score: number; feedback: string }
      clarity: { score: number; feedback: string }
      relevance: { score: number; feedback: string }
      vocabulary: { score: number; feedback: string }
    }
    tip: string
  }
  audioUrl: string | null
  category: string
  onGoAgain: () => void
  onNewCategory: () => void
}

interface ScoreBand {
  min: number
  max: number
  label: string
  color: string
  bgColor: string
}

const scoreBands: ScoreBand[] = [
  {
    min: 90,
    max: 100,
    label: "Excellent",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  {
    min: 75,
    max: 89,
    label: "Great",
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
  {
    min: 60,
    max: 74,
    label: "Good",
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
  },
  {
    min: 0,
    max: 59,
    label: "Keep practising",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
  },
]

function getScoreBand(score: number): ScoreBand {
  return (
    scoreBands.find((band) => score >= band.min && score <= band.max) ||
    scoreBands[scoreBands.length - 1]
  )
}

function AnimatedScore({ score }: { score: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (value) => Math.round(value))
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(count, score, {
      duration: 2,
      ease: "easeOut",
    })

    const unsubscribe = rounded.on("change", (value) => {
      setDisplayValue(value)
    })

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [count, rounded, score])

  return <span>{displayValue}</span>
}

function DimensionBar({
  name,
  score,
  feedback,
  index,
}: {
  name: string
  score: number
  feedback: string
  index: number
}) {
  const barColor = score >= 75 ? "bg-green-500" : score >= 60 ? "bg-orange-500" : "bg-red-500"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
      className="space-y-2"
    >
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-foreground">{name}</h4>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {score}/100
        </span>
      </div>

      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.5 + index * 0.1 + 0.2, duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <p className="text-xs text-muted-foreground">{feedback}</p>
    </motion.div>
  )
}

export function ScoreSummary({
  score,
  audioUrl,
  category,
  onGoAgain,
  onNewCategory,
}: ScoreSummaryProps) {
  const band = getScoreBand(score.overall)

  const dimensions = [
    { name: "Filler Words", ...score.dimensions.fillerWords },
    { name: "Repetition", ...score.dimensions.repetition },
    { name: "Clarity", ...score.dimensions.clarity },
    { name: "Relevance", ...score.dimensions.relevance },
    { name: "Vocabulary", ...score.dimensions.vocabulary },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={band.bgColor}>
          <CardContent className="pt-8 pb-8 text-center">
            <h2 className="text-lg font-medium text-muted-foreground mb-4">
              Your Score
            </h2>
            <div className={`text-7xl md:text-8xl font-bold tabular-nums ${band.color} mb-2`}>
              <AnimatedScore score={score.overall} />
            </div>
            <p className={`text-xl font-semibold ${band.color}`}>
              {band.label}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dimension Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensions.map((dimension, index) => (
              <DimensionBar
                key={dimension.name}
                name={dimension.name}
                score={dimension.score}
                feedback={dimension.feedback}
                index={index}
              />
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tip of the Session */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex gap-4">
              <div className="shrink-0">
                <div className="flex items-center justify-center size-10 rounded-full bg-primary/10">
                  <Lightbulb className="size-5 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">
                  Tip of the Session
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {score.tip}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audio Replay */}
      {audioUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Your Recording</CardTitle>
            </CardHeader>
            <CardContent>
              <AudioPlayer audioUrl={audioUrl} />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          size="lg"
          onClick={onGoAgain}
          className="flex-1 gap-2"
        >
          <RefreshCw className="size-4" />
          Go Again ({category})
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={onNewCategory}
          className="flex-1 gap-2"
        >
          <Home className="size-4" />
          New Category
        </Button>
      </motion.div>
    </div>
  )
}
