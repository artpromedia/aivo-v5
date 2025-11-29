'use client'

import { useCallback, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { SymbolButton } from './SymbolButton'

export interface VocabularySymbol {
  id: string
  label: string
  imageUrl: string
  category: string
  isCore: boolean
  symbolSet: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
}

export interface VocabularyGoal {
  symbolId: string
  currentMastery: 'NOT_INTRODUCED' | 'EMERGING' | 'DEVELOPING' | 'MASTERED'
  completedTrials: number
  successRate: number
}

export interface VocabularySelectorProps {
  availableSymbols: VocabularySymbol[]
  currentGoals: VocabularyGoal[]
  currentBoardSymbolIds: string[]
  onAddToBoard: (symbolIds: string[]) => void
  onAddToGoals: (symbolIds: string[]) => void
  maxSelections?: number
  showGoalStatus?: boolean
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'core', label: 'Core', icon: '⭐' },
  { id: 'SOCIAL', label: 'Social', icon: '👋' },
  { id: 'EMOTIONS', label: 'Emotions', icon: '😊' },
  { id: 'ACTIONS', label: 'Actions', icon: '🏃' },
  { id: 'FOOD', label: 'Food', icon: '🍎' },
  { id: 'PLACES', label: 'Places', icon: '🏠' },
  { id: 'PEOPLE', label: 'People', icon: '👨‍👩‍👧' },
  { id: 'QUESTIONS', label: 'Questions', icon: '❓' },
  { id: 'DESCRIPTORS', label: 'Descriptors', icon: '🎨' },
  { id: 'ACTIVITIES', label: 'Activities', icon: '⚽' },
  { id: 'DAILY_LIVING', label: 'Daily Living', icon: '🪥' },
  { id: 'ACADEMIC', label: 'Academic', icon: '📚' },
]

const MASTERY_COLORS = {
  NOT_INTRODUCED: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Not Introduced' },
  EMERGING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Emerging' },
  DEVELOPING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Developing' },
  MASTERED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Mastered' },
}

export function VocabularySelector({
  availableSymbols,
  currentGoals,
  currentBoardSymbolIds,
  onAddToBoard,
  onAddToGoals,
  maxSelections = 20,
  showGoalStatus = true,
}: VocabularySelectorProps) {
  const [selectedSymbolIds, setSelectedSymbolIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showOnlyUnused, setShowOnlyUnused] = useState(false)
  const [sortBy, setSortBy] = useState<'label' | 'category' | 'mastery'>('label')

  // Create goal lookup map
  const goalMap = useMemo(() => {
    const map = new Map<string, VocabularyGoal>()
    currentGoals.forEach((goal) => map.set(goal.symbolId, goal))
    return map
  }, [currentGoals])

  // Filter and sort symbols
  const filteredSymbols = useMemo(() => {
    let symbols = availableSymbols

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      symbols = symbols.filter((s) => s.label.toLowerCase().includes(query))
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'core') {
        symbols = symbols.filter((s) => s.isCore)
      } else {
        symbols = symbols.filter((s) => s.category === selectedCategory)
      }
    }

    // Filter by unused
    if (showOnlyUnused) {
      symbols = symbols.filter((s) => !currentBoardSymbolIds.includes(s.id))
    }

    // Sort
    symbols = [...symbols].sort((a, b) => {
      if (sortBy === 'label') {
        return a.label.localeCompare(b.label)
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category) || a.label.localeCompare(b.label)
      }
      if (sortBy === 'mastery') {
        const masteryOrder = { NOT_INTRODUCED: 0, EMERGING: 1, DEVELOPING: 2, MASTERED: 3 }
        const aMastery = goalMap.get(a.id)?.currentMastery || 'NOT_INTRODUCED'
        const bMastery = goalMap.get(b.id)?.currentMastery || 'NOT_INTRODUCED'
        return masteryOrder[aMastery] - masteryOrder[bMastery] || a.label.localeCompare(b.label)
      }
      return 0
    })

    return symbols
  }, [availableSymbols, searchQuery, selectedCategory, showOnlyUnused, sortBy, currentBoardSymbolIds, goalMap])

  // Toggle symbol selection
  const handleToggleSymbol = useCallback((symbolId: string) => {
    setSelectedSymbolIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(symbolId)) {
        newSet.delete(symbolId)
      } else if (newSet.size < maxSelections) {
        newSet.add(symbolId)
      }
      return newSet
    })
  }, [maxSelections])

  // Select all visible
  const handleSelectAll = useCallback(() => {
    setSelectedSymbolIds((prev) => {
      const newSet = new Set(prev)
      filteredSymbols.slice(0, maxSelections - prev.size).forEach((s) => newSet.add(s.id))
      return newSet
    })
  }, [filteredSymbols, maxSelections])

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedSymbolIds(new Set())
  }, [])

  // Add to board
  const handleAddToBoard = useCallback(() => {
    onAddToBoard(Array.from(selectedSymbolIds))
    setSelectedSymbolIds(new Set())
  }, [selectedSymbolIds, onAddToBoard])

  // Add to goals
  const handleAddToGoals = useCallback(() => {
    onAddToGoals(Array.from(selectedSymbolIds))
    setSelectedSymbolIds(new Set())
  }, [selectedSymbolIds, onAddToGoals])

  return (
    <Card>
      <CardHeader 
        title="Vocabulary Selector"
        subtitle={`${filteredSymbols.length} symbols available • ${selectedSymbolIds.size} selected`}
      />
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-200">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search symbols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'label' | 'category' | 'mastery')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="label">Sort by Name</option>
            <option value="category">Sort by Category</option>
            <option value="mastery">Sort by Mastery</option>
          </select>

          {/* Show only unused */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnused}
              onChange={(e) => setShowOnlyUnused(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show unused only</span>
          </label>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 mb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${selectedCategory === cat.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Symbol grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto p-2">
          {filteredSymbols.map((symbol) => {
            const isSelected = selectedSymbolIds.has(symbol.id)
            const isOnBoard = currentBoardSymbolIds.includes(symbol.id)
            const goal = goalMap.get(symbol.id)
            const mastery = goal?.currentMastery || 'NOT_INTRODUCED'
            const masteryStyle = MASTERY_COLORS[mastery]

            return (
              <div
                key={symbol.id}
                className={`
                  relative cursor-pointer transition-transform
                  ${isSelected ? 'scale-105' : 'hover:scale-102'}
                `}
                onClick={() => handleToggleSymbol(symbol.id)}
              >
                <SymbolButton
                  id={symbol.id}
                  label={symbol.label}
                  imageUrl={symbol.imageUrl}
                  backgroundColor={symbol.backgroundColor}
                  isCore={symbol.isCore}
                  size="sm"
                  isSelected={isSelected}
                  auditoryFeedback={false}
                  visualFeedback={false}
                />
                
                {/* On board indicator */}
                {isOnBoard && (
                  <span 
                    className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center"
                    title="Already on board"
                  >
                    ✓
                  </span>
                )}

                {/* Mastery badge */}
                {showGoalStatus && goal && (
                  <span 
                    className={`
                      absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-medium
                      ${masteryStyle.bg} ${masteryStyle.text}
                    `}
                    title={masteryStyle.label}
                  >
                    {mastery.charAt(0)}
                  </span>
                )}
              </div>
            )
          })}
          
          {filteredSymbols.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-8">
              No symbols found matching your criteria
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Select All Visible
          </button>
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={selectedSymbolIds.size === 0}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
          >
            Clear Selection
          </button>
          
          <div className="flex-1" />
          
          <button
            type="button"
            onClick={handleAddToGoals}
            disabled={selectedSymbolIds.size === 0}
            className="px-4 py-2 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Goals ({selectedSymbolIds.size})
          </button>
          <button
            type="button"
            onClick={handleAddToBoard}
            disabled={selectedSymbolIds.size === 0}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Board ({selectedSymbolIds.size})
          </button>
        </div>

        {/* Legend */}
        {showGoalStatus && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
            <span className="font-medium">Mastery Level:</span>
            {Object.entries(MASTERY_COLORS).map(([key, style]) => (
              <span key={key} className="flex items-center gap-1">
                <span className={`w-4 h-4 rounded ${style.bg}`} />
                {style.label}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VocabularySelector
