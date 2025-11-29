/**
 * AAC (Augmentative & Alternative Communication) Components
 * 
 * A comprehensive set of React components for building AAC interfaces
 * for learners who need alternative communication support.
 * 
 * Components:
 * - SymbolButton: Individual symbol button with TTS support
 * - CommunicationBoard: Full communication board with switch scanning
 * - BoardEditor: Drag-and-drop board customization interface
 * - VocabularySelector: Symbol library browser with filtering
 * - AACProgressDashboard: Analytics and progress tracking dashboard
 */

export { SymbolButton, type SymbolButtonProps } from './SymbolButton'
export { CommunicationBoard, type CommunicationBoardProps, type BoardSymbol } from './CommunicationBoard'
export { BoardEditor, type BoardEditorProps, type Symbol } from './BoardEditor'
export { VocabularySelector, type VocabularySelectorProps, type VocabularySymbol, type VocabularyGoal } from './VocabularySelector'
export { 
  AACProgressDashboard, 
  type AACProgressDashboardProps, 
  type AACStats, 
  type Recommendation 
} from './AACProgressDashboard'
