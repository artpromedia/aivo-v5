'use client'

import { useCallback, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { SymbolButton } from './SymbolButton'
import type { BoardSymbol } from './CommunicationBoard'

export interface Symbol {
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

export interface BoardEditorProps {
  boardId: string
  boardName: string
  rows: number
  columns: number
  currentSymbols: BoardSymbol[]
  availableSymbols: Symbol[]
  onSave: (symbols: BoardSymbol[]) => void
  onCancel: () => void
  onSettingsChange?: (settings: { rows: number; columns: number; name: string }) => void
}

type DragItem = {
  type: 'symbol' | 'board-symbol'
  symbol: Symbol | BoardSymbol
  sourcePosition?: { row: number; column: number }
}

const SYMBOL_CATEGORIES = [
  { id: 'CORE', label: 'Core', icon: '⭐' },
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

export function BoardEditor({
  boardId,
  boardName,
  rows: initialRows,
  columns: initialColumns,
  currentSymbols,
  availableSymbols,
  onSave,
  onCancel,
  onSettingsChange,
}: BoardEditorProps) {
  const [editedSymbols, setEditedSymbols] = useState<BoardSymbol[]>(currentSymbols)
  const [rows, setRows] = useState(initialRows)
  const [columns, setColumns] = useState(initialColumns)
  const [name, setName] = useState(boardName)
  const [selectedCategory, setSelectedCategory] = useState<string>('CORE')
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ row: number; column: number } | null>(null)

  // Create grid from symbols
  const grid: (BoardSymbol | null)[][] = Array(rows)
    .fill(null)
    .map(() => Array(columns).fill(null))

  editedSymbols.forEach((symbol) => {
    if (symbol.row < rows && symbol.column < columns) {
      grid[symbol.row][symbol.column] = symbol
    }
  })

  // Filter available symbols
  const filteredSymbols = availableSymbols.filter((symbol) => {
    const matchesCategory = selectedCategory === 'CORE' 
      ? symbol.isCore 
      : symbol.category === selectedCategory
    const matchesSearch = searchQuery === '' || 
      symbol.label.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Handle drag start
  const handleDragStart = useCallback((item: DragItem) => {
    setDraggedItem(item)
  }, [])

  // Handle drop on grid cell
  const handleDrop = useCallback((row: number, column: number) => {
    if (!draggedItem) return

    setEditedSymbols((prev) => {
      // Remove symbol from old position if moving within board
      let newSymbols = prev.filter((s) => !(s.row === row && s.column === column))
      
      if (draggedItem.type === 'board-symbol' && draggedItem.sourcePosition) {
        newSymbols = newSymbols.filter(
          (s) => !(s.row === draggedItem.sourcePosition!.row && 
                   s.column === draggedItem.sourcePosition!.column)
        )
      }

      // Add symbol to new position
      const symbol = draggedItem.symbol
      const newBoardSymbol: BoardSymbol = {
        id: `bs_${Date.now()}_${row}_${column}`,
        symbolId: 'symbolId' in symbol ? symbol.symbolId : symbol.id,
        label: symbol.label,
        imageUrl: symbol.imageUrl,
        row,
        column,
        backgroundColor: symbol.backgroundColor,
        textColor: symbol.textColor,
        borderColor: symbol.borderColor,
        isCore: symbol.isCore,
      }

      return [...newSymbols, newBoardSymbol]
    })

    setDraggedItem(null)
    setHoveredCell(null)
  }, [draggedItem])

  // Handle remove symbol from grid
  const handleRemoveSymbol = useCallback((row: number, column: number) => {
    setEditedSymbols((prev) => 
      prev.filter((s) => !(s.row === row && s.column === column))
    )
  }, [])

  // Handle grid size change
  const handleRowsChange = useCallback((newRows: number) => {
    const clampedRows = Math.max(1, Math.min(10, newRows))
    setRows(clampedRows)
    setEditedSymbols((prev) => prev.filter((s) => s.row < clampedRows))
    onSettingsChange?.({ rows: clampedRows, columns, name })
  }, [columns, name, onSettingsChange])

  const handleColumnsChange = useCallback((newColumns: number) => {
    const clampedColumns = Math.max(1, Math.min(10, newColumns))
    setColumns(clampedColumns)
    setEditedSymbols((prev) => prev.filter((s) => s.column < clampedColumns))
    onSettingsChange?.({ rows, columns: clampedColumns, name })
  }, [rows, name, onSettingsChange])

  // Handle save
  const handleSave = useCallback(() => {
    onSave(editedSymbols)
  }, [editedSymbols, onSave])

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Symbol Library Panel */}
      <Card className="lg:w-80 flex-shrink-0">
        <CardHeader title="Symbol Library" subtitle="Drag symbols to the board" />
        <CardContent className="flex flex-col gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1">
            {SYMBOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-2 py-1 rounded-lg text-xs font-medium transition-colors
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
          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
            {filteredSymbols.map((symbol) => (
              <div
                key={symbol.id}
                draggable
                onDragStart={() => handleDragStart({ type: 'symbol', symbol })}
                className="cursor-grab active:cursor-grabbing"
              >
                <SymbolButton
                  id={symbol.id}
                  label={symbol.label}
                  imageUrl={symbol.imageUrl}
                  backgroundColor={symbol.backgroundColor}
                  isCore={symbol.isCore}
                  size="sm"
                  auditoryFeedback={false}
                  visualFeedback={false}
                />
              </div>
            ))}
            {filteredSymbols.length === 0 && (
              <p className="col-span-3 text-center text-gray-500 text-sm py-4">
                No symbols found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Board Editor Panel */}
      <Card className="flex-1">
        <CardHeader 
          title="Board Editor"
          subtitle={`Editing: ${name}`}
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Save Board
              </button>
            </div>
          }
        />
        <CardContent>
          {/* Board settings */}
          <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  onSettingsChange?.({ rows, columns, name: e.target.value })
                }}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Rows:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={rows}
                onChange={(e) => handleRowsChange(parseInt(e.target.value) || 1)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Columns:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={columns}
                onChange={(e) => handleColumnsChange(parseInt(e.target.value) || 1)}
                className="px-2 py-1 border border-gray-300 rounded-lg text-sm w-16"
              />
            </div>
          </div>

          {/* Board grid */}
          <div 
            className="grid gap-2 p-4 bg-gray-100 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {grid.map((row, rowIndex) =>
              row.map((symbol, colIndex) => {
                const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.column === colIndex

                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      aspect-square rounded-xl border-2 border-dashed transition-all
                      ${symbol ? 'border-transparent' : 'border-gray-300'}
                      ${isHovered ? 'border-blue-500 bg-blue-50' : ''}
                    `}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setHoveredCell({ row: rowIndex, column: colIndex })
                    }}
                    onDragLeave={() => setHoveredCell(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(rowIndex, colIndex)
                    }}
                  >
                    {symbol ? (
                      <div 
                        className="relative group w-full h-full"
                        draggable
                        onDragStart={() => handleDragStart({
                          type: 'board-symbol',
                          symbol,
                          sourcePosition: { row: rowIndex, column: colIndex }
                        })}
                      >
                        <SymbolButton
                          id={symbol.id}
                          label={symbol.label}
                          imageUrl={symbol.imageUrl}
                          backgroundColor={symbol.backgroundColor}
                          isCore={symbol.isCore}
                          size="md"
                          auditoryFeedback={false}
                          visualFeedback={false}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSymbol(rowIndex, colIndex)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          aria-label="Remove symbol"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        Drop here
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-sm text-gray-500">
            <p>• Drag symbols from the library to add them to the board</p>
            <p>• Drag symbols within the board to rearrange</p>
            <p>• Hover over a symbol and click × to remove</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BoardEditor
