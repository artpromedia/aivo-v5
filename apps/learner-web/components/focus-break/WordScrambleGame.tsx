'use client';

import { useState, useCallback, useMemo } from 'react';
import { GameTimer } from './GameTimer';
import { ScoreDisplay } from './ScoreDisplay';
import { Lightbulb, Check, X, Shuffle } from 'lucide-react';

interface WordScrambleGameProps {
  /** Duration in seconds */
  duration?: number;
  /** Difficulty level affects word complexity */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Callback when game completes */
  onComplete: (score: number) => void;
  /** Callback for score updates */
  onScoreUpdate?: (score: number) => void;
}

// Word lists by difficulty with hints
const WORD_LISTS = {
  easy: [
    { word: 'CAT', hint: 'A furry pet that meows 🐱' },
    { word: 'DOG', hint: 'A loyal pet that barks 🐕' },
    { word: 'SUN', hint: 'It shines in the sky ☀️' },
    { word: 'TREE', hint: 'Has leaves and branches 🌳' },
    { word: 'FISH', hint: 'Swims in water 🐟' },
    { word: 'BIRD', hint: 'Has wings and feathers 🐦' },
    { word: 'BOOK', hint: 'You read this 📖' },
    { word: 'STAR', hint: 'Twinkles at night ⭐' },
    { word: 'MOON', hint: 'Glows at night 🌙' },
    { word: 'RAIN', hint: 'Falls from clouds 🌧️' },
  ],
  medium: [
    { word: 'PLANET', hint: 'Earth is one 🌍' },
    { word: 'OCEAN', hint: 'Very large body of water 🌊' },
    { word: 'MUSIC', hint: 'You listen to this 🎵' },
    { word: 'GARDEN', hint: 'Where flowers grow 🌷' },
    { word: 'FRIEND', hint: 'Someone you play with 👫' },
    { word: 'SCHOOL', hint: 'Where you learn 🏫' },
    { word: 'TIGER', hint: 'Striped big cat 🐯' },
    { word: 'RAINBOW', hint: 'Colorful arc in the sky 🌈' },
    { word: 'SCIENCE', hint: 'Study of nature 🔬' },
    { word: 'PUZZLE', hint: 'A brain teaser 🧩' },
  ],
  hard: [
    { word: 'ADVENTURE', hint: 'An exciting journey 🗺️' },
    { word: 'BUTTERFLY', hint: 'Beautiful flying insect 🦋' },
    { word: 'CHOCOLATE', hint: 'Sweet brown treat 🍫' },
    { word: 'DISCOVERY', hint: 'Finding something new 🔍' },
    { word: 'ELEPHANT', hint: 'Large animal with trunk 🐘' },
    { word: 'FANTASTIC', hint: 'Really amazing! ✨' },
    { word: 'KNOWLEDGE', hint: 'What you gain from learning 📚' },
    { word: 'MOUNTAIN', hint: 'Very tall landform ⛰️' },
    { word: 'TREASURE', hint: 'Valuable hidden things 💎' },
    { word: 'WONDERFUL', hint: 'Full of wonder! 🌟' },
  ],
};

// Encouraging messages
const CORRECT_MESSAGES = [
  'Brilliant! 🎉',
  "You're a word wizard! ⭐",
  'Excellent spelling! 🌟',
  'Super smart! 🧠',
  'Perfect! 💫',
];

const INCORRECT_MESSAGES = ['Good try! 💪', 'Almost there! 🌈', 'Keep going! ✨'];

// Scramble a word - moved outside component for stability
function scrambleWord(word: string): string {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  // Make sure it's actually scrambled
  const scrambled = letters.join('');
  if (scrambled === word && word.length > 2) {
    return scrambleWord(word);
  }
  return scrambled;
}

/**
 * WordScrambleGame - Unscramble educational words
 */
export function WordScrambleGame({
  duration = 60,
  difficulty = 'easy',
  onComplete,
  onScoreUpdate,
}: WordScrambleGameProps) {
  const wordList = useMemo(() => WORD_LISTS[difficulty], [difficulty]);

  // Initialize with a random word using lazy initialization
  const [currentWordIndex, setCurrentWordIndex] = useState(() =>
    Math.floor(Math.random() * WORD_LISTS[difficulty].length),
  );
  const [scrambledWord, setScrambledWord] = useState(() =>
    scrambleWord(
      WORD_LISTS[difficulty][Math.floor(Math.random() * WORD_LISTS[difficulty].length)].word,
    ),
  );
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [message, setMessage] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [usedWords, setUsedWords] = useState<Set<number>>(() => new Set([currentWordIndex]));

  // Get a new random word
  const getNextWord = useCallback(() => {
    const availableIndices = wordList.map((_, i) => i).filter((i) => !usedWords.has(i));

    if (availableIndices.length === 0) {
      // All words used, reset
      setUsedWords(new Set());
      const randomIndex = Math.floor(Math.random() * wordList.length);
      return randomIndex;
    }

    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }, [wordList, usedWords]);

  // Handle reshuffling the scrambled letters
  const handleReshuffle = useCallback(() => {
    setScrambledWord(scrambleWord(wordList[currentWordIndex].word));
  }, [currentWordIndex, wordList]);

  // Handle guess submission
  const handleSubmit = useCallback(() => {
    const currentWord = wordList[currentWordIndex];
    const isCorrect = userGuess.toUpperCase().trim() === currentWord.word;

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    if (isCorrect) {
      const pointsEarned = showHint ? 5 : 10;
      setScore((s) => {
        const newScore = s + pointsEarned;
        onScoreUpdate?.(newScore);
        return newScore;
      });
      setWordsCompleted((w) => w + 1);
      const randomMessage = CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)];
      setMessage(randomMessage);
    } else {
      const randomMessage =
        INCORRECT_MESSAGES[Math.floor(Math.random() * INCORRECT_MESSAGES.length)];
      setMessage(`${randomMessage} The word was: ${currentWord.word}`);
    }

    // Move to next word after delay
    setTimeout(() => {
      const nextIndex = getNextWord();
      setCurrentWordIndex(nextIndex);
      setScrambledWord(scrambleWord(wordList[nextIndex].word));
      setUsedWords((prev) => new Set([...prev, nextIndex]));
      setUserGuess('');
      setShowHint(false);
      setFeedback(null);
      setMessage('');
    }, 1500);
  }, [userGuess, currentWordIndex, wordList, showHint, getNextWord, onScoreUpdate]);

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    setIsTimerRunning(false);
    onComplete(score);
  }, [score, onComplete]);

  const currentWord = wordList[currentWordIndex];

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header with timer and score */}
      <div className="flex items-center justify-between mb-4">
        <GameTimer
          duration={duration}
          isRunning={isTimerRunning && !feedback}
          onComplete={handleTimerComplete}
          size="md"
        />
        <div className="flex items-center gap-3">
          <span className="text-sm text-theme-text-muted">Words: {wordsCompleted}</span>
          <ScoreDisplay score={score} icon="star" variant="warning" />
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`
          text-center py-3 px-4 rounded-xl mb-4 transition-all duration-300
          flex items-center justify-center gap-2
          ${feedback === 'correct' ? 'bg-mint/20 text-mint-dark' : 'bg-coral/20 text-coral-dark'}
        `}
        >
          {feedback === 'correct' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          <p className="font-medium">{message}</p>
        </div>
      )}

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Scrambled word display */}
        <div className="bg-theme-primary/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {scrambledWord.split('').map((letter, i) => (
              <div
                key={i}
                className="w-12 h-14 bg-white rounded-xl shadow-card flex items-center justify-center
                  transform transition-all duration-200 hover:scale-105"
              >
                <span className="text-2xl font-bold text-theme-text">{letter}</span>
              </div>
            ))}
          </div>

          {/* Reshuffle button */}
          <button
            onClick={handleReshuffle}
            className="mt-4 mx-auto flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-primary transition-colors"
            disabled={!!feedback}
          >
            <Shuffle className="w-4 h-4" />
            Shuffle letters
          </button>
        </div>

        {/* Hint section */}
        {showHint ? (
          <div className="bg-sunshine/15 rounded-xl px-4 py-3 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-sunshine-dark" />
            <span className="text-sunshine-dark font-medium">{currentWord.hint}</span>
          </div>
        ) : (
          <button
            onClick={() => setShowHint(true)}
            className="mb-6 flex items-center gap-2 text-theme-text-muted hover:text-sunshine-dark transition-colors"
            disabled={!!feedback}
          >
            <Lightbulb className="w-4 h-4" />
            Need a hint? (−5 points)
          </button>
        )}

        {/* Input field */}
        <div className="w-full max-w-xs">
          <input
            type="text"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userGuess.trim()) {
                handleSubmit();
              }
            }}
            placeholder="Type your answer..."
            disabled={!!feedback}
            className="w-full text-center text-2xl font-bold tracking-widest
              px-4 py-3 rounded-xl border-2 border-theme-surface-border
              bg-white focus:border-theme-primary focus:outline-none
              transition-colors uppercase"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!userGuess.trim() || !!feedback}
          className="mt-4 px-8 py-3 rounded-xl font-semibold
            bg-theme-primary text-white
            hover:bg-theme-primary-dark active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200"
        >
          Check Answer
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-theme-text-muted">
        <p>💡 Unscramble the letters to form a word!</p>
      </div>
    </div>
  );
}

export default WordScrambleGame;
