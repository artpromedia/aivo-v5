'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Brain, Heart } from 'lucide-react'

interface VirtualTutorProps {
  message: string | null
  engagement: number
  mood?: 'encouraging' | 'excited' | 'supportive' | 'celebrating'
}

export function VirtualTutor({ message, engagement, mood = 'supportive' }: VirtualTutorProps) {
  const getMoodEmoji = () => {
    switch (mood) {
      case 'encouraging':
        return '💪'
      case 'excited':
        return '🎉'
      case 'celebrating':
        return '✨'
      default:
        return '🤗'
    }
  }

  const getMoodColor = () => {
    switch (mood) {
      case 'encouraging':
        return 'from-orange-400 to-red-400'
      case 'excited':
        return 'from-theme-primary to-pink-400'
      case 'celebrating':
        return 'from-yellow-400 to-orange-400'
      default:
        return 'from-blue-400 to-cyan-400'
    }
  }

  return (
    <div className="sticky top-4">
      {/* Avatar */}
      <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
        <div className="flex flex-col items-center">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${getMoodColor()} flex items-center justify-center text-4xl mb-4 shadow-lg`}
          >
            {getMoodEmoji()}
          </motion.div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Tutor</h3>
          <p className="text-sm text-gray-600 text-center">
            I'm here to help you learn!
          </p>
        </div>

        {/* Engagement Meter */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Energy Level</span>
            <span className="text-sm font-bold text-gray-900">{engagement}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full ${
                engagement > 70
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : engagement > 40
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  : 'bg-gradient-to-r from-red-400 to-orange-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${engagement}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {engagement < 50 && (
            <p className="text-xs text-orange-600 mt-2 text-center">
              💡 Consider taking a brain break soon!
            </p>
          )}
        </div>
      </div>

      {/* Message Bubble */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-theme-primary to-pink-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Tutor Message
                </h4>
              </div>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>

            {/* Action Suggestions */}
            <div className="mt-4 space-y-2">
              <button className="w-full px-4 py-2 rounded-xl border-2 border-theme-primary/20 hover:border-theme-primary/40 hover:bg-theme-primary/10 transition-all text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                <Brain className="w-4 h-4" />
                Get a Hint
              </button>
              <button className="w-full px-4 py-2 rounded-xl border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 transition-all text-sm font-medium text-gray-700 flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                I Need Help
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {!message && (
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Today's Progress</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Problems Solved</span>
              <span className="text-lg font-bold text-gray-900">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Accuracy</span>
              <span className="text-lg font-bold text-green-600">85%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Time Spent</span>
              <span className="text-lg font-bold text-blue-600">23m</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>Keep up the great work!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
