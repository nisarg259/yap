"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string | null
  className?: string
}

export function AudioPlayer({ audioUrl, className = "" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setError(null)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      audio.currentTime = 0
    }
    const handleError = () => {
      setError("Failed to load audio")
      setIsPlaying(false)
    }
    const handlePause = () => {
      setIsPlaying(false)
    }
    const handlePlay = () => {
      setIsPlaying(true)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("play", handlePlay)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("play", handlePlay)
    }
  }, [])

  // Reset player when audioUrl changes
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)
  }, [audioUrl])

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    try {
      if (isPlaying) {
        audio.pause()
      } else {
        await audio.play()
        setError(null)
      }
    } catch (err) {
      setError("Failed to play audio")
      setIsPlaying(false)
      console.error("Playback error:", err)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Don't render if no audio URL
  if (!audioUrl) {
    return null
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlay}
          className="shrink-0"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>

        <div className="flex-1 space-y-1">
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Seek audio position"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
