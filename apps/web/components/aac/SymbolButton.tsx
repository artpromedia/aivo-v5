'use client'

import { useCallback, useRef, useState } from 'react'

export interface SymbolButtonProps {
  id: string
  label: string
  imageUrl: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  customLabel?: string
  customImageUrl?: string
  isCore?: boolean
  audioUrl?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isSelected?: boolean
  isHighlighted?: boolean
  highContrastMode?: boolean
  largeTargets?: boolean
  showLabel?: boolean
  disabled?: boolean
  onClick?: (id: string, label: string) => void
  onLongPress?: (id: string) => void
  auditoryFeedback?: boolean
  visualFeedback?: boolean
}

const sizeClasses = {
  sm: 'w-16 h-16 text-xs',
  md: 'w-20 h-20 text-sm',
  lg: 'w-24 h-24 text-base',
  xl: 'w-32 h-32 text-lg',
}

const largeSizeClasses = {
  sm: 'w-20 h-20 text-sm',
  md: 'w-28 h-28 text-base',
  lg: 'w-36 h-36 text-lg',
  xl: 'w-44 h-44 text-xl',
}

export function SymbolButton({
  id,
  label,
  imageUrl,
  backgroundColor = '#FFFFFF',
  textColor = '#000000',
  borderColor = '#E5E7EB',
  customLabel,
  customImageUrl,
  isCore = false,
  audioUrl,
  size = 'md',
  isSelected = false,
  isHighlighted = false,
  highContrastMode = false,
  largeTargets = false,
  showLabel = true,
  disabled = false,
  onClick,
  onLongPress,
  auditoryFeedback = true,
  visualFeedback = true,
}: SymbolButtonProps) {
  const [isPressed, setIsPressed] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const displayLabel = customLabel || label
  const displayImage = customImageUrl || imageUrl

  // High contrast mode overrides
  const bgColor = highContrastMode ? (isCore ? '#000000' : '#FFFFFF') : backgroundColor
  const txtColor = highContrastMode ? (isCore ? '#FFFF00' : '#000000') : textColor
  const brdColor = highContrastMode ? '#000000' : borderColor

  const sizeClass = largeTargets ? largeSizeClasses[size] : sizeClasses[size]

  const speak = useCallback((text: string) => {
    if (!auditoryFeedback) return
    
    // Try custom audio first
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl)
      }
      audioRef.current.play().catch(console.error)
      return
    }
    
    // Fall back to Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      speechSynthesis.speak(utterance)
    }
  }, [audioUrl, auditoryFeedback])

  const handleClick = useCallback(() => {
    if (disabled) return

    // Visual feedback
    if (visualFeedback) {
      setShowFeedback(true)
      setTimeout(() => setShowFeedback(false), 200)
    }

    // Speak the label
    speak(displayLabel)

    // Trigger callback
    onClick?.(id, displayLabel)
  }, [disabled, visualFeedback, speak, displayLabel, onClick, id])

  const handlePointerDown = useCallback(() => {
    if (disabled) return
    setIsPressed(true)
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(id)
    }, 800)
  }, [disabled, onLongPress, id])

  const handlePointerUp = useCallback(() => {
    setIsPressed(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handlePointerLeave = useCallback(() => {
    setIsPressed(false)
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`
        relative flex flex-col items-center justify-center gap-1
        rounded-xl border-2 transition-all duration-150
        focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2
        ${sizeClass}
        ${isPressed ? 'scale-95' : ''}
        ${isSelected ? 'ring-4 ring-blue-500' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-400 animate-pulse' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg active:scale-95'}
        ${showFeedback ? 'ring-4 ring-green-400' : ''}
      `}
      style={{
        backgroundColor: bgColor,
        color: txtColor,
        borderColor: brdColor,
      }}
      aria-label={displayLabel}
      aria-pressed={isSelected}
    >
      {/* Core vocabulary indicator */}
      {isCore && (
        <span 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ backgroundColor: highContrastMode ? '#FFFF00' : '#3B82F6' }}
          aria-label="Core vocabulary"
        />
      )}

      {/* Symbol image */}
      <div className={`flex-1 flex items-center justify-center ${showLabel ? 'pt-1' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt=""
          className={`object-contain ${largeTargets ? 'max-h-[70%]' : 'max-h-[65%]'} max-w-[90%]`}
          draggable={false}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <span 
          className={`
            px-1 font-semibold text-center leading-tight truncate w-full
            ${highContrastMode ? 'font-bold' : ''}
          `}
          style={{ color: txtColor }}
        >
          {displayLabel}
        </span>
      )}

      {/* Visual feedback overlay */}
      {showFeedback && (
        <div 
          className="absolute inset-0 rounded-xl bg-green-400/30 pointer-events-none"
          aria-hidden
        />
      )}
    </button>
  )
}

export default SymbolButton
