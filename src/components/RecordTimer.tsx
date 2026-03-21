"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress"

interface RecordTimerProps {
  isActive: boolean
  onComplete: () => void
  onStop: () => void
}

export function RecordTimer({
  isActive,
  onComplete,
  onStop,
}: RecordTimerProps) {
  const [timeLeft, setTimeLeft] = useState(60)
  const totalTime = 60
  const minTimeBeforeStop = 15

  useEffect(() => {
    if (!isActive) return

    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, isActive, onComplete])

  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const canStop = totalTime - timeLeft >= minTimeBeforeStop
  const isWarning = timeLeft < 10

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center gap-6">
      {/* Time remaining display */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-sm font-medium text-muted-foreground">
          Time Remaining
        </div>
        <motion.div
          className={`text-4xl font-bold tabular-nums ${
            isWarning
              ? "text-destructive dark:text-destructive"
              : "text-foreground"
          }`}
          key={timeLeft}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatTime(timeLeft)}
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full">
        <Progress value={progress} className="w-full">
          <ProgressTrack className="h-3">
            <ProgressIndicator
              className={`transition-colors duration-300 ${
                isWarning
                  ? "bg-destructive dark:bg-destructive"
                  : "bg-primary"
              }`}
            />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Stop button - only shows after 15 seconds */}
      <AnimatePresence>
        {canStop && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="destructive"
              size="lg"
              onClick={onStop}
              className="min-w-32"
            >
              Stop
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
