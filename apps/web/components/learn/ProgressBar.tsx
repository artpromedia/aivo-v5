'use client'

import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface ProgressBarProps {
  progress: number // 0-100
  totalSteps?: number
  currentStep?: number
  showPercentage?: boolean
  showSteps?: boolean
  label?: string
}

export function ProgressBar({ 
  progress,
  totalSteps,
  currentStep,
  showPercentage = true,
  showSteps = false,
  label 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, progress))
  
  const getProgressColor = () => {
    if (percentage >= 75) return 'from-green-400 to-emerald-500'
    if (percentage >= 50) return 'from-blue-400 to-cyan-500'
    if (percentage >= 25) return 'from-yellow-400 to-orange-500'
    return 'from-coral-400 to-salmon-500'
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(label || showPercentage || showSteps) && (
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <div className="flex items-center gap-3">
            {showSteps && totalSteps && currentStep && (
              <span className="text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
            )}
            {showPercentage && (
              <span className="font-bold text-gray-900">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <motion.div
          className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor()} relative overflow-hidden`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </motion.div>

        {/* Checkmark at end if complete */}
        {percentage >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>

      {/* Step Indicators */}
      {showSteps && totalSteps && (
        <div className="flex justify-between mt-2">
          {[...Array(totalSteps)].map((_, index) => {
            const stepNumber = index + 1
            const isCompleted = currentStep ? stepNumber < currentStep : false
            const isCurrent = currentStep === stepNumber
            
            return (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-gradient-to-br from-coral-500 to-salmon-500 text-white ring-4 ring-coral-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNumber}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Milestone Messages */}
      {percentage === 25 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-orange-600 mt-2 text-center"
        >
          🔥 Quarter way there!
        </motion.p>
      )}
      {percentage === 50 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-blue-600 mt-2 text-center"
        >
          💪 Halfway done!
        </motion.p>
      )}
      {percentage === 75 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-600 mt-2 text-center"
        >
          ⭐ Almost there!
        </motion.p>
      )}
      {percentage === 100 && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-green-600 mt-2 text-center font-semibold"
        >
          🎉 Complete!
        </motion.p>
      )}
    </div>
  )
}
