'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Play, RotateCcw, Volume2, ChevronRight } from 'lucide-react'

interface ArticulationPracticeProps {
  targetSound: string
  level: 'isolation' | 'syllable' | 'word' | 'phrase' | 'sentence'
  words: string[]
  learnerId: string
}

interface Feedback {
  accuracy: number
  suggestions: string[]
  phonemeScores?: Record<string, number>
}

export function ArticulationPractice({ 
  targetSound, 
  level, 
  words,
  learnerId
}: ArticulationPracticeProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup media stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        analyzeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      setIsRecording(false)
    }
  }

  const analyzeAudio = async (blob: Blob) => {
    setIsAnalyzing(true)
    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')
    formData.append('targetSound', targetSound)
    formData.append('targetWord', words[currentWordIndex])
    formData.append('level', level)
    formData.append('learnerId', learnerId)

    try {
      const response = await fetch('/api/speech/analyze', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze audio')
      }
      
      const result = await response.json()
      setFeedback(result)
    } catch (error) {
      console.error('Failed to analyze audio:', error)
      setFeedback({
        accuracy: 0.5,
        suggestions: ['Unable to analyze recording. Please try again.']
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const playExample = () => {
    const utterance = new SpeechSynthesisUtterance(words[currentWordIndex])
    utterance.rate = 0.7
    utterance.pitch = 1.0
    utterance.volume = 1.0
    speechSynthesis.speak(utterance)
  }

  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.play()
    }
  }

  const tryAgain = () => {
    setAudioBlob(null)
    setFeedback(null)
  }

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1)
      setFeedback(null)
      setAudioBlob(null)
    } else {
      // Session complete
      alert('Great work! You completed all words.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-3xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full mb-4">
            <span className="text-2xl">🗣️</span>
            <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
              Speech Practice
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Practice the "{targetSound}" Sound
          </h2>
          <p className="text-gray-600">Level: <span className="font-semibold capitalize">{level}</span></p>
        </div>

        {/* Current Word Display */}
        <div className="bg-gradient-to-r from-coral-50 to-salmon-50 rounded-2xl p-8 mb-8">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-2">Say this word:</p>
            <h3 className="text-5xl font-bold text-gray-900 mb-6">
              {words[currentWordIndex]}
            </h3>
            <button
              onClick={playExample}
              className="inline-flex items-center gap-2 text-coral-600 hover:text-coral-700 transition-colors"
            >
              <Volume2 className="w-5 h-5" />
              <span className="font-medium">Hear Example</span>
            </button>
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col items-center mb-8">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAnalyzing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-500 animate-pulse'
                : 'bg-gradient-to-br from-coral-500 to-salmon-500 hover:from-coral-600 hover:to-salmon-600'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </motion.button>
          <p className="text-sm text-gray-600 mt-3">
            {isRecording ? 'Recording... Click to stop' : 'Click to record'}
          </p>
        </div>

        {/* Playback Controls */}
        {audioBlob && !isAnalyzing && (
          <div className="flex justify-center gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playRecording}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-coral-400 hover:bg-coral-50 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Play Recording</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={tryAgain}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-coral-400 hover:bg-coral-50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </motion.button>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-8 mb-8">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-600">Analyzing your pronunciation...</p>
          </div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-2xl p-6 mb-8 ${
                feedback.accuracy > 0.8
                  ? 'bg-green-50 border-2 border-green-200'
                  : feedback.accuracy > 0.6
                  ? 'bg-yellow-50 border-2 border-yellow-200'
                  : 'bg-orange-50 border-2 border-orange-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg text-gray-900">
                  {feedback.accuracy > 0.8 ? '🎉 Excellent!' : 
                   feedback.accuracy > 0.6 ? '👍 Good Try!' : 
                   '💪 Keep Practicing!'}
                </h4>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round(feedback.accuracy * 100)}%
                  </div>
                  <div className="text-xs text-gray-600">Accuracy</div>
                </div>
              </div>
              
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Tips for improvement:</p>
                  <ul className="space-y-2">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-coral-500 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {feedback.accuracy > 0.7 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 bg-gradient-to-r from-coral-500 to-salmon-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
                  onClick={nextWord}
                  disabled={currentWordIndex >= words.length - 1}
                >
                  {currentWordIndex >= words.length - 1 ? (
                    'Complete Session'
                  ) : (
                    <>
                      Next Word
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>Word {currentWordIndex + 1} of {words.length}</span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-coral-500 to-salmon-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
