"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface ThinkTimerProps {
  onComplete: () => void
  onSkip: () => void
}

export function ThinkTimer({ onComplete, onSkip }: ThinkTimerProps) {
  const [timeLeft, setTimeLeft] = useState(15)
  const totalTime = 15

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, onComplete])

  const progress = (timeLeft / totalTime) * 100
  const circumference = 2 * Math.PI * 54 // radius = 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center">
        <svg
          className="h-40 w-40 -rotate-90"
          viewBox="0 0 120 120"
          aria-label={`${timeLeft} seconds remaining`}
        >
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="54"
            className="fill-none stroke-muted"
            strokeWidth="6"
          />

          {/* Animated progress circle */}
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            className="fill-none stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </svg>

        {/* Timer text in center */}
        <motion.div
          className="absolute flex items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={timeLeft}
          transition={{ duration: 0.2 }}
        >
          <span className="text-5xl font-bold tabular-nums text-foreground">
            {timeLeft}
          </span>
        </motion.div>
      </div>

      <Button
        variant="outline"
        size="lg"
        onClick={onSkip}
        className="min-w-32"
      >
        Skip
      </Button>
    </div>
  )
}
