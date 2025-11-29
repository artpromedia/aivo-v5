'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { SymbolButton, type SymbolButtonProps } from './SymbolButton'

export interface BoardSymbol {
  id: string
  symbolId: string
  label: string
  imageUrl: string
  row: number
  column: number
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  customLabel?: string
  customImageUrl?: string
  isCore?: boolean
  audioUrl?: string
  isHidden?: boolean
}

export interface CommunicationBoardProps {
  id: string
  name: string
  rows: number
  columns: number
  symbols: BoardSymbol[]
  backgroundColor?: string
  
  // Accessibility settings
  highContrastMode?: boolean
  largeTargets?: boolean
  auditoryFeedback?: boolean
  visualFeedback?: boolean
  
  // Switch scanning
  switchScanningEnabled?: boolean
  scanSpeed?: number // seconds per item
  scanPattern?: 'row-column' | 'linear'
  
  // Message bar
  showMessageBar?: boolean
  maxMessageLength?: number
  
  // Callbacks
  onSymbolSelect?: (symbol: BoardSymbol) => void
  onUtteranceComplete?: (symbols: BoardSymbol[]) => void
  onSymbolEdit?: (symbolId: string) => void
}

export function CommunicationBoard({
  id,
  name,
  rows,
  columns,
  symbols,
  backgroundColor = '#F3F4F6',
  highContrastMode = false,
  largeTargets = false,
  auditoryFeedback = true,
  visualFeedback = true,
  switchScanningEnabled = false,
  scanSpeed = 1.5,
  scanPattern = 'row-column',
  showMessageBar = true,
  maxMessageLength = 10,
  onSymbolSelect,
  onUtteranceComplete,
  onSymbolEdit,
}: CommunicationBoardProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<BoardSymbol[]>([])
  const [scanRow, setScanRow] = useState<number | null>(null)
  const [scanColumn, setScanColumn] = useState<number | null>(null)
  const [isScanningRows, setIsScanningRows] = useState(true)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  // Create grid from symbols
  const grid: (BoardSymbol | null)[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(null))

  symbols.forEach((symbol) => {
    if (!symbol.isHidden && symbol.row < rows && symbol.column < columns) {
      grid[symbol.row][symbol.column] = symbol
    }
  })

  // Handle symbol click
  const handleSymbolClick = useCallback((symbolId: string) => {
    const symbol = symbols.find((s) => s.id === symbolId)
    if (!symbol) return

    setSelectedSymbols((prev) => {
      if (prev.length >= maxMessageLength) {
        return prev
      }
      return [...prev, symbol]
    })

    onSymbolSelect?.(symbol)
  }, [symbols, maxMessageLength, onSymbolSelect])

  // Handle symbol long press (edit)
  const handleSymbolLongPress = useCallback((symbolId: string) => {
    onSymbolEdit?.(symbolId)
  }, [onSymbolEdit])

  // Clear message
  const handleClear = useCallback(() => {
    setSelectedSymbols([])
  }, [])

  // Delete last symbol
  const handleBackspace = useCallback(() => {
    setSelectedSymbols((prev) => prev.slice(0, -1))
  }, [])

  // Speak the complete message
  const handleSpeak = useCallback(() => {
    if (selectedSymbols.length === 0) return

    const message = selectedSymbols.map((s) => s.customLabel || s.label).join(' ')
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message)
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }

    onUtteranceComplete?.(selectedSymbols)
  }, [selectedSymbols, onUtteranceComplete])

  // Switch scanning logic
  useEffect(() => {
    if (!switchScanningEnabled) {
      setScanRow(null)
      setScanColumn(null)
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
      return
    }

    // Start row scanning
    setScanRow(0)
    setIsScanningRows(true)

    scanIntervalRef.current = setInterval(() => {
      if (isScanningRows) {
        setScanRow((prev) => {
          if (prev === null) return 0
          return (prev + 1) % rows
        })
      } else {
        setScanColumn((prev) => {
          if (prev === null) return 0
          return (prev + 1) % columns
        })
      }
    }, scanSpeed * 1000)

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
      }
    }
  }, [switchScanningEnabled, scanSpeed, rows, columns, isScanningRows])

  // Handle switch input (spacebar or Enter)
  useEffect(() => {
    if (!switchScanningEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        
        if (isScanningRows && scanRow !== null) {
          // Select row, start column scanning
          setIsScanningRows(false)
          setScanColumn(0)
        } else if (!isScanningRows && scanRow !== null && scanColumn !== null) {
          // Select symbol
          const symbol = grid[scanRow][scanColumn]
          if (symbol) {
            handleSymbolClick(symbol.id)
          }
          // Reset to row scanning
          setIsScanningRows(true)
          setScanColumn(null)
        }
      }
      
      // Escape to reset scanning
      if (e.key === 'Escape') {
        setIsScanningRows(true)
        setScanRow(0)
        setScanColumn(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [switchScanningEnabled, isScanningRows, scanRow, scanColumn, grid, handleSymbolClick])

  const bgStyle = highContrastMode ? '#000000' : backgroundColor

  return (
    <div 
      ref={boardRef}
      className="flex flex-col gap-4 p-4 rounded-2xl"
      style={{ backgroundColor: bgStyle }}
      role="application"
      aria-label={`Communication board: ${name}`}
    >
      {/* Message bar */}
      {showMessageBar && (
        <div 
          className={`
            flex items-center gap-2 p-3 rounded-xl min-h-[80px]
            ${highContrastMode ? 'bg-white border-4 border-black' : 'bg-white border border-gray-200'}
          `}
        >
          {/* Selected symbols */}
          <div className="flex-1 flex flex-wrap gap-2 overflow-x-auto">
            {selectedSymbols.length === 0 ? (
              <span className={`text-sm ${highContrastMode ? 'text-black font-bold' : 'text-gray-400'}`}>
                Tap symbols to build a message
              </span>
            ) : (
              selectedSymbols.map((symbol, index) => (
                <div 
                  key={`${symbol.id}-${index}`}
                  className={`
                    flex flex-col items-center p-2 rounded-lg
                    ${highContrastMode ? 'bg-yellow-300' : 'bg-blue-50'}
                  `}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={symbol.customImageUrl || symbol.imageUrl}
                    alt={symbol.customLabel || symbol.label}
                    className="w-10 h-10 object-contain"
                  />
                  <span className={`text-xs font-medium ${highContrastMode ? 'text-black' : 'text-gray-700'}`}>
                    {symbol.customLabel || symbol.label}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={selectedSymbols.length === 0}
              className={`
                px-4 py-2 rounded-lg font-bold text-white transition-colors
                ${highContrastMode 
                  ? 'bg-black hover:bg-gray-800 disabled:bg-gray-500' 
                  : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300'}
                ${selectedSymbols.length === 0 ? 'cursor-not-allowed' : ''}
              `}
              aria-label="Speak message"
            >
              🔊 Speak
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleBackspace}
                disabled={selectedSymbols.length === 0}
                className={`
                  px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${highContrastMode 
                    ? 'bg-white border-2 border-black text-black hover:bg-gray-100' 
                    : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100'}
                `}
                aria-label="Delete last symbol"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={selectedSymbols.length === 0}
                className={`
                  px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${highContrastMode 
                    ? 'bg-white border-2 border-black text-black hover:bg-gray-100' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200 disabled:bg-gray-100'}
                `}
                aria-label="Clear all"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symbol grid */}
      <div 
        className={`
          grid gap-2
          ${largeTargets ? 'gap-3' : 'gap-2'}
        `}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        }}
        role="grid"
        aria-label="Symbol grid"
      >
        {grid.map((row, rowIndex) => (
          row.map((symbol, colIndex) => {
            const isRowHighlighted = switchScanningEnabled && isScanningRows && scanRow === rowIndex
            const isCellHighlighted = switchScanningEnabled && !isScanningRows && 
              scanRow === rowIndex && scanColumn === colIndex

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  aspect-square
                  ${isRowHighlighted ? 'ring-4 ring-yellow-400 rounded-xl' : ''}
                  ${isCellHighlighted ? 'ring-4 ring-green-400 rounded-xl animate-pulse' : ''}
                `}
                role="gridcell"
              >
                {symbol ? (
                  <SymbolButton
                    id={symbol.id}
                    label={symbol.label}
                    imageUrl={symbol.imageUrl}
                    backgroundColor={symbol.backgroundColor}
                    textColor={symbol.textColor}
                    borderColor={symbol.borderColor}
                    customLabel={symbol.customLabel}
                    customImageUrl={symbol.customImageUrl}
                    isCore={symbol.isCore}
                    audioUrl={symbol.audioUrl}
                    size={largeTargets ? 'lg' : 'md'}
                    highContrastMode={highContrastMode}
                    largeTargets={largeTargets}
                    auditoryFeedback={auditoryFeedback}
                    visualFeedback={visualFeedback}
                    isHighlighted={isCellHighlighted}
                    onClick={() => handleSymbolClick(symbol.id)}
                    onLongPress={() => handleSymbolLongPress(symbol.id)}
                  />
                ) : (
                  <div 
                    className={`
                      w-full h-full rounded-xl border-2 border-dashed
                      ${highContrastMode ? 'border-white/30' : 'border-gray-300'}
                    `}
                    aria-hidden
                  />
                )}
              </div>
            )
          })
        ))}
      </div>

      {/* Switch scanning indicator */}
      {switchScanningEnabled && (
        <div 
          className={`
            text-center text-sm font-medium py-2 rounded-lg
            ${highContrastMode ? 'bg-white text-black' : 'bg-blue-50 text-blue-700'}
          `}
        >
          {isScanningRows 
            ? `Scanning rows (Row ${(scanRow ?? 0) + 1} of ${rows}) - Press Space/Enter to select`
            : `Scanning columns (Column ${(scanColumn ?? 0) + 1} of ${columns}) - Press Space/Enter to select`
          }
        </div>
      )}
    </div>
  )
}

export default CommunicationBoard
