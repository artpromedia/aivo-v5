'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Zap, Award } from 'lucide-react'

interface CelebrationProps {
  onComplete: () => void
  type?: 'correct' | 'milestone' | 'levelUp' | 'perfect'
  message?: string
  duration?: number // in milliseconds
}

export function Celebration({ 
  onComplete, 
  type = 'correct',
  message,
  duration = 3000 
}: CelebrationProps) {
  
  useEffect(() => {
    // Auto-dismiss after duration
    const timer = setTimeout(onComplete, duration)
    return () => clearTimeout(timer)
  }, [duration, onComplete])

  const celebrations = {
    correct: {
      icon: Star,
      title: 'Correct!',
      subtitle: message || 'Great job!',
      color: 'from-green-400 to-emerald-500',
      emoji: '🎉'
    },
    milestone: {
      icon: Trophy,
      title: 'Milestone Reached!',
      subtitle: message || 'You\'re making amazing progress!',
      color: 'from-yellow-400 to-orange-500',
      emoji: '🏆'
    },
    levelUp: {
      icon: Zap,
      title: 'Level Up!',
      subtitle: message || 'You\'ve unlocked a new challenge level!',
      color: 'from-theme-primary to-pink-500',
      emoji: '⚡'
    },
    perfect: {
      icon: Award,
      title: 'Perfect Score!',
      subtitle: message || 'Outstanding work! You nailed it!',
      color: 'from-blue-400 to-cyan-500',
      emoji: '✨'
    }
  }

  const celebration = celebrations[type]
  const Icon = celebration.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onComplete}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ 
          scale: 1, 
          rotate: 0,
          transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15
          }
        }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 1,
          }}
          className={`w-24 h-24 rounded-full bg-gradient-to-br ${celebration.color} mx-auto mb-6 flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-12 h-12 text-white" />
        </motion.div>

        {/* Emoji Animation */}
        <motion.div
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-6xl mb-4"
        >
          {celebration.emoji}
        </motion.div>

        {/* Text Content */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 mb-3"
        >
          {celebration.title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-600 mb-8"
        >
          {celebration.subtitle}
        </motion.p>

        {/* Decorative Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <Star className={`w-6 h-6 ${i < 4 || type === 'perfect' ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onComplete}
          className={`px-8 py-3 rounded-xl bg-gradient-to-r ${celebration.color} text-white font-bold shadow-lg hover:shadow-xl transition-all`}
        >
          Continue
        </motion.button>
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
