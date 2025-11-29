'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { 
  AACProgressDashboard, 
  CommunicationBoard, 
  BoardEditor,
  VocabularySelector,
  type AACStats,
  type BoardSymbol,
  type Recommendation,
  type Symbol,
  type VocabularySymbol,
} from '@/components/aac'
import type { VocabularyGoal as DashboardVocabularyGoal } from '@/components/aac/AACProgressDashboard'
import type { VocabularyGoal as SelectorVocabularyGoal } from '@/components/aac/VocabularySelector'

interface AACMainPageProps {
  learnerId: string
  learnerName: string
  hasAACSystem: boolean
}

type TabId = 'dashboard' | 'boards' | 'vocabulary' | 'settings'

// Local goal type matching API response
interface GoalFromAPI {
  id: string
  symbolId: string
  currentMastery: 'NOT_INTRODUCED' | 'EMERGING' | 'DEVELOPING' | 'MASTERED'
  targetMastery: 'NOT_INTRODUCED' | 'EMERGING' | 'DEVELOPING' | 'MASTERED'
  completedTrials: number
  targetTrials: number
  successRate: number
  targetAccuracy: number
  isAchieved: boolean
}

interface AACSystem {
  id: string
  systemType: string
  accessMethod: string
  gridSize: number
  vocabularySize: number
  voiceId?: string
  speechRate: number
  scanSpeed: number
  dwellTime: number
  highContrastMode: boolean
  largeTargets: boolean
  auditoryFeedback: boolean
  visualFeedback: boolean
}

interface Board {
  id: string
  name: string
  boardType: string
  rows: number
  columns: number
  backgroundColor: string
  isDefault: boolean
  symbols: BoardSymbol[]
}

export default function AACMainPage({ learnerId, learnerName, hasAACSystem }: AACMainPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // AAC System state
  const [aacSystem, setAACSystem] = useState<AACSystem | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [symbols, setSymbols] = useState<VocabularySymbol[]>([])
  const [goals, setGoals] = useState<GoalFromAPI[]>([])
  const [stats, setStats] = useState<AACStats | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  
  // Editor state
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreatingSystem, setIsCreatingSystem] = useState(false)

  // Fetch AAC data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch AAC system
        const systemRes = await fetch(`/api/aac/systems/${learnerId}`)
        if (systemRes.ok) {
          const systemData = await systemRes.json()
          setAACSystem(systemData)
        }
        
        // Fetch boards
        const boardsRes = await fetch(`/api/aac/boards/${learnerId}`)
        if (boardsRes.ok) {
          const boardsData = await boardsRes.json()
          setBoards(boardsData)
        }
        
        // Fetch symbols
        const symbolsRes = await fetch('/api/aac/symbols?limit=200')
        if (symbolsRes.ok) {
          const symbolsData = await symbolsRes.json()
          setSymbols(symbolsData)
        }
        
        // Fetch goals
        const goalsRes = await fetch(`/api/aac/goals/${learnerId}`)
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          setGoals(goalsData)
        }
        
        // Fetch dashboard stats
        const statsRes = await fetch(`/api/aac/dashboard/${learnerId}`)
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        
        // Fetch recommendations
        const recsRes = await fetch(`/api/aac/recommendations/${learnerId}`)
        if (recsRes.ok) {
          const recsData = await recsRes.json()
          setRecommendations(recsData)
        }
      } catch (err) {
        console.error('Error fetching AAC data:', err)
        setError('Failed to load AAC data')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [learnerId])

  // Create AAC system
  const handleCreateSystem = useCallback(async () => {
    setIsCreatingSystem(true)
    try {
      const res = await fetch('/api/aac/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId,
          systemType: 'COMMUNICATION_BOARD',
          accessMethod: 'DIRECT_SELECT',
          gridSize: 20,
          vocabularySize: 200,
        }),
      })
      
      if (res.ok) {
        const newSystem = await res.json()
        setAACSystem(newSystem)
      }
    } catch (err) {
      console.error('Error creating AAC system:', err)
      setError('Failed to create AAC system')
    } finally {
      setIsCreatingSystem(false)
    }
  }, [learnerId])

  // Update AAC system settings
  const handleUpdateSettings = useCallback(async (updates: Partial<AACSystem>) => {
    if (!aacSystem) return
    
    try {
      const res = await fetch(`/api/aac/systems/${learnerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (res.ok) {
        const updatedSystem = await res.json()
        setAACSystem(updatedSystem)
      }
    } catch (err) {
      console.error('Error updating AAC system:', err)
    }
  }, [aacSystem, learnerId])

  // Save board changes
  const handleSaveBoard = useCallback(async (boardSymbols: BoardSymbol[]) => {
    if (!selectedBoardId) return
    
    try {
      // Update board symbols
      await fetch(`/api/aac/boards/${selectedBoardId}/symbols/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: boardSymbols }),
      })
      
      // Refresh boards
      const boardsRes = await fetch(`/api/aac/boards/${learnerId}`)
      if (boardsRes.ok) {
        const boardsData = await boardsRes.json()
        setBoards(boardsData)
      }
      
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving board:', err)
    }
  }, [selectedBoardId, learnerId])

  // Log symbol usage
  const handleSymbolSelect = useCallback(async (symbol: BoardSymbol) => {
    try {
      await fetch('/api/aac/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId,
          symbolId: symbol.symbolId,
          boardId: selectedBoardId,
          communicativeFunction: 'REQUESTING',
          wasPrompted: false,
        }),
      })
    } catch (err) {
      console.error('Error logging usage:', err)
    }
  }, [learnerId, selectedBoardId])

  // Add symbols to board
  const handleAddToBoard = useCallback(async (symbolIds: string[]) => {
    if (!selectedBoardId) return
    
    const board = boards.find(b => b.id === selectedBoardId)
    if (!board) return
    
    // Find empty positions
    const occupiedPositions = new Set(
      board.symbols.map(s => `${s.row}-${s.column}`)
    )
    
    const newSymbols: BoardSymbol[] = []
    let row = 0
    let col = 0
    
    for (const symbolId of symbolIds) {
      const symbol = symbols.find(s => s.id === symbolId)
      if (!symbol) continue
      
      // Find next empty position
      while (occupiedPositions.has(`${row}-${col}`)) {
        col++
        if (col >= board.columns) {
          col = 0
          row++
        }
        if (row >= board.rows) break
      }
      
      if (row >= board.rows) break
      
      newSymbols.push({
        id: `bs_${Date.now()}_${row}_${col}`,
        symbolId: symbol.id,
        label: symbol.label,
        imageUrl: symbol.imageUrl,
        row,
        column: col,
        isCore: symbol.isCore,
      })
      
      occupiedPositions.add(`${row}-${col}`)
      col++
    }
    
    if (newSymbols.length > 0) {
      try {
        await fetch(`/api/aac/boards/${selectedBoardId}/symbols/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: newSymbols }),
        })
        
        // Refresh boards
        const boardsRes = await fetch(`/api/aac/boards/${learnerId}`)
        if (boardsRes.ok) {
          const boardsData = await boardsRes.json()
          setBoards(boardsData)
        }
      } catch (err) {
        console.error('Error adding symbols to board:', err)
      }
    }
  }, [selectedBoardId, boards, symbols, learnerId])

  // Add symbols to goals
  const handleAddToGoals = useCallback(async (symbolIds: string[]) => {
    try {
      for (const symbolId of symbolIds) {
        await fetch('/api/aac/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learnerId,
            symbolId,
            targetMastery: 'MASTERED',
            targetTrials: 10,
            targetAccuracy: 0.8,
          }),
        })
      }
      
      // Refresh goals
      const goalsRes = await fetch(`/api/aac/goals/${learnerId}`)
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData)
      }
    } catch (err) {
      console.error('Error adding goals:', err)
    }
  }, [learnerId])

  // Generate report
  const handleGenerateReport = useCallback(async () => {
    try {
      await fetch(`/api/aac/reports/generate/${learnerId}?period_days=7`, {
        method: 'POST',
      })
      alert('Report generated successfully!')
    } catch (err) {
      console.error('Error generating report:', err)
    }
  }, [learnerId])

  // No AAC system setup
  if (!hasAACSystem && !aacSystem && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No AAC System Configured
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Set up an Augmentative and Alternative Communication (AAC) system to help 
            {learnerName} communicate more effectively.
          </p>
          <button
            type="button"
            onClick={handleCreateSystem}
            disabled={isCreatingSystem}
            className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {isCreatingSystem ? 'Setting up...' : '🚀 Set Up AAC System'}
          </button>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading AAC system...</p>
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'boards', label: '📋 Boards' },
    { id: 'vocabulary', label: '🔤 Vocabulary' },
    { id: 'settings', label: '⚙️ Settings' },
  ]

  const selectedBoard = boards.find(b => b.id === selectedBoardId) || boards[0]

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`
              px-4 py-2 rounded-t-lg font-medium transition-colors
              ${activeTab === tab.id 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <AACProgressDashboard
          learnerId={learnerId}
          learnerName={learnerName}
          stats={stats}
          goals={goals.map(g => ({
            id: g.id,
            symbolId: g.symbolId,
            symbolLabel: symbols.find(s => s.id === g.symbolId)?.label || 'Unknown',
            symbolImageUrl: symbols.find(s => s.id === g.symbolId)?.imageUrl || '',
            currentMastery: g.currentMastery,
            targetMastery: g.targetMastery,
            completedTrials: g.completedTrials,
            targetTrials: g.targetTrials,
            successRate: g.successRate,
            targetAccuracy: g.targetAccuracy,
            isAchieved: g.isAchieved,
          }))}
          recommendations={recommendations}
          onGenerateReport={handleGenerateReport}
          onViewAllGoals={() => setActiveTab('vocabulary')}
        />
      )}

      {/* Boards Tab */}
      {activeTab === 'boards' && (
        <div className="space-y-4">
          {/* Board selector */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {boards.map(board => (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => {
                    setSelectedBoardId(board.id)
                    setIsEditing(false)
                  }}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${selectedBoardId === board.id || (!selectedBoardId && board.isDefault)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                  `}
                >
                  {board.name}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            {!isEditing && selectedBoard && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ✏️ Edit Board
              </button>
            )}
          </div>

          {/* Board display or editor */}
          {isEditing && selectedBoard ? (
            <BoardEditor
              boardId={selectedBoard.id}
              boardName={selectedBoard.name}
              rows={selectedBoard.rows}
              columns={selectedBoard.columns}
              currentSymbols={selectedBoard.symbols}
              availableSymbols={symbols as Symbol[]}
              onSave={handleSaveBoard}
              onCancel={() => setIsEditing(false)}
            />
          ) : selectedBoard ? (
            <CommunicationBoard
              id={selectedBoard.id}
              name={selectedBoard.name}
              rows={selectedBoard.rows}
              columns={selectedBoard.columns}
              symbols={selectedBoard.symbols}
              backgroundColor={selectedBoard.backgroundColor}
              highContrastMode={aacSystem?.highContrastMode || false}
              largeTargets={aacSystem?.largeTargets || false}
              auditoryFeedback={aacSystem?.auditoryFeedback ?? true}
              visualFeedback={aacSystem?.visualFeedback ?? true}
              switchScanningEnabled={aacSystem?.accessMethod === 'SWITCH_SCANNING'}
              scanSpeed={aacSystem?.scanSpeed || 1.5}
              onSymbolSelect={handleSymbolSelect}
            />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No boards created yet. Create your first communication board!
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vocabulary Tab */}
      {activeTab === 'vocabulary' && (
        <VocabularySelector
          availableSymbols={symbols}
          currentGoals={goals}
          currentBoardSymbolIds={selectedBoard?.symbols.map(s => s.symbolId) || []}
          onAddToBoard={handleAddToBoard}
          onAddToGoals={handleAddToGoals}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && aacSystem && (
        <Card>
          <CardHeader title="AAC System Settings" subtitle="Configure accessibility and display options" />
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Access Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Method
                </label>
                <select
                  value={aacSystem.accessMethod}
                  onChange={(e) => handleUpdateSettings({ accessMethod: e.target.value } as Partial<AACSystem>)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DIRECT_SELECT">Direct Selection (Touch/Click)</option>
                  <option value="SWITCH_SCANNING">Switch Scanning</option>
                  <option value="EYE_GAZE">Eye Gaze</option>
                  <option value="HEAD_TRACKING">Head Tracking</option>
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Rate: {aacSystem.speechRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={aacSystem.speechRate}
                  onChange={(e) => handleUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Scan Speed */}
              {aacSystem.accessMethod === 'SWITCH_SCANNING' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Speed: {aacSystem.scanSpeed.toFixed(1)}s
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={aacSystem.scanSpeed}
                    onChange={(e) => handleUpdateSettings({ scanSpeed: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              )}

              {/* Dwell Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dwell Time: {aacSystem.dwellTime.toFixed(1)}s
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="3.0"
                  step="0.1"
                  value={aacSystem.dwellTime}
                  onChange={(e) => handleUpdateSettings({ dwellTime: parseFloat(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Toggle options */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-medium text-gray-900">Accessibility Options</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aacSystem.highContrastMode}
                    onChange={(e) => handleUpdateSettings({ highContrastMode: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">High Contrast Mode</span>
                    <p className="text-sm text-gray-500">Use high contrast colors for better visibility</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aacSystem.largeTargets}
                    onChange={(e) => handleUpdateSettings({ largeTargets: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Large Targets</span>
                    <p className="text-sm text-gray-500">Increase symbol button sizes for easier selection</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aacSystem.auditoryFeedback}
                    onChange={(e) => handleUpdateSettings({ auditoryFeedback: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Auditory Feedback</span>
                    <p className="text-sm text-gray-500">Speak symbol labels when selected</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aacSystem.visualFeedback}
                    onChange={(e) => handleUpdateSettings({ visualFeedback: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Visual Feedback</span>
                    <p className="text-sm text-gray-500">Show visual confirmation when symbols are selected</p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
