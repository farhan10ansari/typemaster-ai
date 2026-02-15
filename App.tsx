import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Stats as StatsType } from './types';
import { PRACTICE_PARAGRAPHS } from './constants';
import TypingArea from './components/TypingArea';
import VirtualKeyboard from './components/VirtualKeyboard';
import Stats from './components/Stats';
import { RefreshCw, Keyboard } from 'lucide-react';

type MistakeMap = Record<string, number>;

const formatMistakes = (mistakes: MistakeMap): string => {
  const entries = Object.entries(mistakes);
  if (entries.length === 0) return 'None. Great paragraph.';

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => {
      const label = char === ' ' ? '[space]' : char;
      return `${label} (${count})`;
    })
    .join(', ');
};

const App: React.FC = () => {
  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [completedParagraphs, setCompletedParagraphs] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [stats, setStats] = useState<StatsType>({
    wpm: 0,
    accuracy: 100,
    errors: 0,
    totalChars: 0,
    correctChars: 0,
    startTime: null,
    endTime: null
  });

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const [paragraphMistakes, setParagraphMistakes] = useState<MistakeMap>({});
  const [lastParagraphMistakes, setLastParagraphMistakes] = useState<MistakeMap>({});

  const text = PRACTICE_PARAGRAPHS[paragraphIndex % PRACTICE_PARAGRAPHS.length];

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const resetGame = () => {
    setParagraphIndex(0);
    setCompletedParagraphs(0);
    setUserInput('');
    setGameState(GameState.IDLE);
    setIsError(false);
    setErrorIndices(new Set());
    setParagraphMistakes({});
    setLastParagraphMistakes({});
    setStats({
      wpm: 0,
      accuracy: 100,
      errors: 0,
      totalChars: 0,
      correctChars: 0,
      startTime: null,
      endTime: null
    });
    setIsFocused(true);
  };

  const calculateStats = useCallback(() => {
    if (!statsRef.current.startTime) return;

    const currentTime = Date.now();
    const timeElapsedMin = (currentTime - statsRef.current.startTime) / 60000;

    if (timeElapsedMin > 0) {
      const wpm = (statsRef.current.correctChars / 5) / timeElapsedMin;
      const accuracy = statsRef.current.totalChars > 0
        ? (statsRef.current.correctChars / statsRef.current.totalChars) * 100
        : 100;

      setStats(prev => ({
        ...prev,
        wpm,
        accuracy
      }));
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (gameState === GameState.PLAYING) {
      interval = window.setInterval(calculateStats, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, calculateStats]);

  const moveToNextParagraph = useCallback(() => {
    setLastParagraphMistakes(paragraphMistakes);
    setParagraphMistakes({});
    setUserInput('');
    setErrorIndices(new Set());
    setIsError(false);
    setParagraphIndex(prev => (prev + 1) % PRACTICE_PARAGRAPHS.length);
    setCompletedParagraphs(prev => prev + 1);
  }, [paragraphMistakes]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFocused || gameState === GameState.LOADING) return;

    if (e.code === 'Space') e.preventDefault();

    setActiveKey(e.code);
    if (e.key === 'Shift') setIsShiftPressed(true);

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

    if (e.key === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
      setIsError(false);
      return;
    }

    if (gameState === GameState.IDLE) {
      setGameState(GameState.PLAYING);
      setStats(prev => ({ ...prev, startTime: Date.now() }));
    }

    const nextCharIndex = userInput.length;
    if (nextCharIndex >= text.length) return;

    const charTyped = e.key;
    if (charTyped === 'Enter') return;
    if (charTyped.length !== 1) return;

    const correctChar = text[nextCharIndex];
    const isCorrect = charTyped === correctChar;

    setStats(prev => {
      const newTotal = prev.totalChars + 1;
      const newCorrect = isCorrect ? prev.correctChars + 1 : prev.correctChars;
      const newErrors = !isCorrect ? prev.errors + 1 : prev.errors;

      return {
        ...prev,
        totalChars: newTotal,
        correctChars: newCorrect,
        errors: newErrors
      };
    });

    if (isCorrect) {
      setIsError(false);
      setUserInput(prev => prev + charTyped);

      if (nextCharIndex + 1 === text.length) {
        moveToNextParagraph();
      }
    } else {
      setIsError(true);
      setParagraphMistakes(prev => ({
        ...prev,
        [correctChar]: (prev[correctChar] ?? 0) + 1
      }));
      setErrorIndices(prev => {
        const updated = new Set(prev);
        updated.add(nextCharIndex);
        return updated;
      });
    }
  }, [gameState, isFocused, text, userInput.length, moveToNextParagraph]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setActiveKey(null);
    if (e.key === 'Shift') setIsShiftPressed(false);
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 font-sans selection:bg-primary-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
          <h2 className="text-white font-bold text-lg mb-2">Paragraph Navigator</h2>
          <p className="text-slate-400 text-sm mb-4">Current paragraph: <span className="text-primary-400 font-semibold">#{paragraphIndex + 1}</span></p>
          <p className="text-slate-400 text-sm mb-4">Completed: <span className="text-emerald-400 font-semibold">{completedParagraphs}</span></p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {PRACTICE_PARAGRAPHS.map((_, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-lg text-sm border ${idx === paragraphIndex
                  ? 'bg-primary-600/20 border-primary-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
              >
                Paragraph {idx + 1}
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-col items-center">
          <header className="w-full max-w-5xl flex flex-wrap justify-between items-center gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20">
                <Keyboard className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">TypeMaster <span className="text-primary-500">Practice</span></h1>
                <p className="text-slate-500 text-sm font-medium">Infinite paragraph typing with focused character sets</p>
              </div>
            </div>

            <button
              onClick={resetGame}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm border border-slate-700"
            >
              <RefreshCw size={16} />
              Reset Session
            </button>
          </header>

          <Stats stats={stats} />

          <div className="w-full max-w-5xl mb-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-2">Mistake characters from previous paragraph</p>
            <p className="text-amber-300 font-mono text-sm md:text-base">{formatMistakes(lastParagraphMistakes)}</p>
          </div>

          <div className="w-full flex justify-center mb-6">
            <TypingArea
              text={text}
              userInput={userInput}
              isFocused={isFocused}
              onFocus={() => setIsFocused(true)}
              isError={isError}
              errorIndices={errorIndices}
            />
          </div>

          <div className="w-full max-w-5xl mb-4">
            <p className="text-center text-slate-500 text-sm">
              Allowed set: <span className="text-slate-300">A-Z, a-z</span> and <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs mx-1">, . : ; ' " ?</span>
            </p>
          </div>

          <VirtualKeyboard pressedKey={activeKey} shiftPressed={isShiftPressed} />
        </main>
      </div>
    </div>
  );
};

export default App;
