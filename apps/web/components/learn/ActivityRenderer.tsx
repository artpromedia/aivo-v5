'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Eye, Brain, CheckCircle } from 'lucide-react'
import Image from 'next/image'

interface Activity {
  id: string
  type: 'multipleChoice' | 'openEnded' | 'matching' | 'fillInBlank' | 'trueFalse'
  question: string
  description?: string
  mediaUrl?: string
  mediaType?: 'image' | 'video' | 'audio'
  options?: string[]
  correctAnswer?: string | string[]
  hints?: string[]
  difficulty: number
}

interface Adaptations {
  visualSupports?: boolean
  audioSupport?: boolean
  simplifiedLanguage?: boolean
  scaffolding?: string[]
}

interface ActivityRendererProps {
  activity: Activity
  adaptations?: Adaptations
  onAnswer: (answer: string | string[]) => void
  disabled?: boolean
}

export function ActivityRenderer({ 
  activity, 
  adaptations,
  onAnswer,
  disabled = false 
}: ActivityRendererProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[]>('')
  const [showHint, setShowHint] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)

  const handleSubmit = () => {
    if (selectedAnswer) {
      onAnswer(selectedAnswer)
      setSelectedAnswer('')
      setShowHint(false)
      setCurrentHintIndex(0)
    }
  }

  const playAudio = () => {
    if (adaptations?.audioSupport) {
      const utterance = new SpeechSynthesisUtterance(activity.question)
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  const showNextHint = () => {
    if (activity.hints && currentHintIndex < activity.hints.length) {
      setShowHint(true)
      setCurrentHintIndex(prev => Math.min(prev + 1, activity.hints?.length || 0))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-theme-primary uppercase tracking-wide">
              Question
            </span>
            <div className="flex gap-1">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < activity.difficulty ? 'bg-theme-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {adaptations?.audioSupport && (
          <button
            onClick={playAudio}
            className="p-2 rounded-lg hover:bg-theme-primary/10 transition-colors"
            title="Listen to question"
          >
            <Volume2 className="w-5 h-5 text-theme-primary" />
          </button>
        )}
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4 leading-relaxed">
        {adaptations?.simplifiedLanguage 
          ? activity.question.replace(/\b(utilize|demonstrate|implement)\b/gi, word => {
              const simple: Record<string, string> = {
                'utilize': 'use',
                'demonstrate': 'show',
                'implement': 'do'
              }
              return simple[word.toLowerCase()] || word
            })
          : activity.question
        }
      </h3>

      {activity.description && (
        <p className="text-gray-600 mb-6">{activity.description}</p>
      )}

      {/* Media */}
      {activity.mediaUrl && (
        <div className="mb-6 rounded-2xl overflow-hidden bg-gray-100">
          {activity.mediaType === 'image' && (
            <Image
              src={activity.mediaUrl}
              alt="Question visual"
              width={800}
              height={400}
              className="w-full h-auto"
            />
          )}
          {activity.mediaType === 'video' && (
            <video controls className="w-full">
              <source src={activity.mediaUrl} type="video/mp4" />
            </video>
          )}
          {activity.mediaType === 'audio' && (
            <audio controls className="w-full">
              <source src={activity.mediaUrl} type="audio/mpeg" />
            </audio>
          )}
        </div>
      )}

      {/* Scaffolding */}
      {adaptations?.scaffolding && adaptations.scaffolding.length > 0 && (
        <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">Helpful Tips:</p>
              <ul className="space-y-1">
                {adaptations.scaffolding.map((tip, index) => (
                  <li key={index} className="text-sm text-blue-800">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Answer Input based on type */}
      <div className="mb-6">
        {activity.type === 'multipleChoice' && activity.options && (
          <div className="space-y-3">
            {activity.options.map((option, index) => (
              <motion.button
                key={option}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !disabled && setSelectedAnswer(option)}
                disabled={disabled}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedAnswer === option
                    ? 'border-coral-500 bg-coral-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {selectedAnswer === option && (
                    <CheckCircle className="w-5 h-5 text-coral-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {activity.type === 'openEnded' && (
          <textarea
            value={selectedAnswer as string}
            onChange={(e) => !disabled && setSelectedAnswer(e.target.value)}
            disabled={disabled}
            placeholder="Type your answer here..."
            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-coral-500 focus:outline-none min-h-[120px] resize-none"
          />
        )}

        {activity.type === 'trueFalse' && (
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !disabled && setSelectedAnswer('true')}
              disabled={disabled}
              className={`flex-1 p-6 rounded-xl border-2 font-semibold transition-all ${
                selectedAnswer === 'true'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-green-300 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ✓ True
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !disabled && setSelectedAnswer('false')}
              disabled={disabled}
              className={`flex-1 p-6 rounded-xl border-2 font-semibold transition-all ${
                selectedAnswer === 'false'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              ✗ False
            </motion.button>
          </div>
        )}
      </div>

      {/* Hint System */}
      {activity.hints && activity.hints.length > 0 && (
        <div className="mb-6">
          {!showHint || currentHintIndex === 0 ? (
            <button
              onClick={showNextHint}
              disabled={disabled}
              className="inline-flex items-center gap-2 text-sm text-theme-primary hover:text-theme-primary/80 font-medium disabled:opacity-50"
            >
              <Eye className="w-4 h-4" />
              Need a hint?
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-theme-primary/10 border-2 border-theme-primary/20 rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-theme-primary mb-2">
                💡 Hint {currentHintIndex}:
              </p>
              <p className="text-sm text-theme-primary/80">
                {activity.hints[currentHintIndex - 1]}
              </p>
              {currentHintIndex < activity.hints.length && (
                <button
                  onClick={showNextHint}
                  className="text-xs text-theme-primary hover:text-theme-primary/80 font-medium mt-2"
                >
                  Show another hint
                </button>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!selectedAnswer || disabled}
        className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-coral-500 to-salmon-500 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Processing...' : 'Submit Answer'}
      </motion.button>
    </motion.div>
  )
}
