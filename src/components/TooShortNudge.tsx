"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface TooShortNudgeProps {
  detectedSeconds: number;
  minimumSeconds?: number;
  onTryAgain: () => void;
  onNewCategory: () => void;
}

export function TooShortNudge({
  detectedSeconds,
  minimumSeconds = 15,
  onTryAgain,
  onNewCategory,
}: TooShortNudgeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="mb-6"
      >
        <span className="text-6xl">🎤</span>
      </motion.div>

      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-semibold mb-3 text-foreground"
      >
        Almost there!
      </motion.h2>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-muted-foreground mb-2 max-w-md"
      >
        We detected only{" "}
        <span className="font-semibold text-foreground">
          {detectedSeconds} second{detectedSeconds !== 1 ? "s" : ""}
        </span>{" "}
        of speech.
      </motion.p>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-8 max-w-md"
      >
        To get a meaningful score, we need at least{" "}
        <span className="font-semibold text-foreground">
          {minimumSeconds} seconds
        </span>{" "}
        of speech. Don&apos;t worry — take a breath and give it another shot!
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button size="lg" onClick={onTryAgain}>
          Try Again
        </Button>
        <Button size="lg" variant="outline" onClick={onNewCategory}>
          Pick New Category
        </Button>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-muted-foreground mt-8"
      >
        Tip: Take a moment to gather your thoughts, then speak clearly and steadily.
      </motion.p>
    </div>
  );
}
