'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

const categories = [
  {
    id: "politics",
    name: "Politics",
    icon: "🏛️",
    description: "Debate civic issues",
    href: "/session/politics",
  },
  {
    id: "sports",
    name: "Sports",
    icon: "🏆",
    description: "Discuss athletics & competition",
    href: "/session/sports",
  },
  {
    id: "hobbies",
    name: "Hobbies",
    icon: "🎨",
    description: "Share your passions",
    href: "/session/hobbies",
  },
  {
    id: "work",
    name: "Work",
    icon: "💼",
    description: "Navigate workplace scenarios",
    href: "/session/work",
  },
  {
    id: "empathy",
    name: "Empathy",
    icon: "🤝",
    description: "Explore emotional intelligence",
    href: "/session/empathy",
  },
  {
    id: "random",
    name: "Random",
    icon: "🎲",
    description: "Surprise me",
    href: "/session/random",
    isSpecial: true,
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
      <main className="flex w-full max-w-7xl flex-col items-center px-6 py-12 sm:px-8 lg:px-12">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center text-center">
          <h1 className="mb-3 text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            SpeakUp
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Practice impromptu speaking
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.id} href={category.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Card
                  className={`cursor-pointer transition-shadow duration-300 hover:shadow-lg dark:hover:shadow-zinc-800/50 ${
                    category.isSpecial
                      ? "border-2 border-dashed border-zinc-300 dark:border-zinc-700"
                      : ""
                  }`}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl" role="img" aria-label={category.name}>
                        {category.icon}
                      </span>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
