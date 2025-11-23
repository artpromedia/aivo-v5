'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Coffee, Activity, Eye, Brain, Play } from 'lucide-react'

interface BrainBreakProps {
  onComplete: () => void
  duration?: number // in seconds
  type?: 'breathing' | 'stretching' | 'visual' | 'mental'
}

export function BrainBreak({ onComplete, duration = 60, type = 'breathing' }: BrainBreakProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const activities = {
    breathing: {
      icon: Coffee,
      title: 'Breathing Exercise',
      color: 'from-blue-400 to-cyan-400',
      steps: [
        'Sit comfortably and close your eyes',
        'Breathe in slowly through your nose (4 seconds)',
        'Hold your breath (4 seconds)',
        'Breathe out slowly through your mouth (4 seconds)',
        'Repeat...'
      ]
    },
    stretching: {
      icon: Activity,
      title: 'Quick Stretch',
      color: 'from-green-400 to-emerald-400',
      steps: [
        'Stand up from your chair',
        'Reach your arms up high above your head',
        'Gently twist your torso left and right',
        'Roll your shoulders backward 5 times',
        'Shake out your hands and arms'
      ]
    },
    visual: {
      icon: Eye,
      title: 'Eye Rest',
      color: 'from-purple-400 to-pink-400',
      steps: [
        'Look away from the screen',
        'Focus on something 20 feet away',
        'Blink slowly 10 times',
        'Close your eyes and relax',
        'Gently massage your temples'
      ]
    },
    mental: {
      icon: Brain,
      title: 'Mental Reset',
      color: 'from-orange-400 to-red-400',
      steps: [
        'Think of three things you\'re grateful for',
        'Name 5 things you can see around you',
        'Take 3 deep, calming breaths',
        'Smile and tell yourself "I can do this!"',
        'Ready to learn more!'
      ]
    }
  }

  const activity = activities[type]
  const Icon = activity.icon

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return

    const stepDuration = duration / activity.steps.length
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= activity.steps.length - 1) {
          return prev
        }
        return prev + 1
      })
    }, stepDuration * 1000)

    return () => clearInterval(stepTimer)
  }, [isActive, duration, activity.steps.length])

  const startBreak = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const skipBreak = () => {
    onComplete()
  }

  const finishBreak = () => {
    setIsActive(false)
    setTimeRemaining(duration)
    setCurrentStep(0)
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`w-20 h-20 rounded-full bg-gradient-to-br ${activity.color} mx-auto mb-4 flex items-center justify-center shadow-lg`}
        >
          <Icon className="w-10 h-10 text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Time for a Brain Break! 🧠
        </h2>
        <p className="text-gray-600">
          Let's recharge your focus with a quick {activity.title.toLowerCase()}
        </p>
      </div>

      {!isActive ? (
        /* Pre-break Screen */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {activity.title}
            </h3>
            <p className="text-gray-700 mb-4">
              We'll guide you through a {duration}-second break to help you refocus and re-energize.
            </p>
            <ul className="space-y-2">
              {activity.steps.map((step, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-purple-600">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              onClick={skipBreak}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 transition-all font-semibold text-gray-700"
            >
              Skip Break
            </button>
            <button
              onClick={startBreak}
              className={`flex-1 px-6 py-3 rounded-xl bg-gradient-to-r ${activity.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2`}
            >
              <Play className="w-5 h-5" />
              Start Break
            </button>
          </div>
        </div>
      ) : (
        /* Active Break Screen */
        <div className="space-y-8">
          {/* Timer */}
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-900 mb-2">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-gray-600">seconds remaining</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className={`h-3 rounded-full bg-gradient-to-r ${activity.color}`}
              initial={{ width: '0%' }}
              animate={{ width: `${((duration - timeRemaining) / duration) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Current Step */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center"
          >
            <div className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2">
              Step {currentStep + 1} of {activity.steps.length}
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {activity.steps[currentStep]}
            </p>
          </motion.div>

          {/* Complete Button (shows when time is up) */}
          {timeRemaining === 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={finishBreak}
              className={`w-full px-6 py-4 rounded-xl bg-gradient-to-r ${activity.color} text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all`}
            >
              I'm Ready to Continue! 🚀
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}
