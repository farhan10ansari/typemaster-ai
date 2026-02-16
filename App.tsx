import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Stats as StatsType } from './types';
import { PRACTICE_PARAGRAPHS, Difficulty } from './constants';
import TypingArea from './components/TypingArea';
import VirtualKeyboard from './components/VirtualKeyboard';
import Stats from './components/Stats';
import { RefreshCw, Keyboard } from 'lucide-react';

type MistakeMap = Record<string, number>;

type DifficultyRecord = {
  completedParagraphs: number;
  totalTyped: number;
  totalCorrect: number;
  errors: number;
  paragraphAccuracies: Record<number, number>;
  updatedAt: number;
};

type SessionRecords = Record<Difficulty, DifficultyRecord>;

const STORAGE_KEY = 'typemaster_session_records_v1';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const createEmptyRecord = (): DifficultyRecord => ({
  completedParagraphs: 0,
  totalTyped: 0,
  totalCorrect: 0,
  errors: 0,
  paragraphAccuracies: {},
  updatedAt: Date.now(),
});

const createDefaultRecords = (): SessionRecords => ({
  easy: createEmptyRecord(),
  medium: createEmptyRecord(),
  hard: createEmptyRecord(),
});

const loadRecords = (): SessionRecords => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultRecords();
    const parsed = JSON.parse(raw) as Partial<SessionRecords>;
    return {
      easy: { ...createEmptyRecord(), ...(parsed.easy ?? {}) },
      medium: { ...createEmptyRecord(), ...(parsed.medium ?? {}) },
      hard: { ...createEmptyRecord(), ...(parsed.hard ?? {}) },
    };
  } catch {
    return createDefaultRecords();
  }
};

const prettifyMistake = (char: string): string => {
  if (char === ' ') return '␠';
  if (char === '\n') return '⏎';
  return char;
};

const getStatsFromRecord = (record: DifficultyRecord): StatsType => ({
  wpm: 0,
  accuracy: record.totalTyped > 0 ? (record.totalCorrect / record.totalTyped) * 100 : 100,
  errors: record.errors,
  totalChars: record.totalTyped,
  correctChars: record.totalCorrect,
  startTime: null,
  endTime: null,
});

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [sessionRecords, setSessionRecords] = useState<SessionRecords>(() => loadRecords());

  const [paragraphIndex, setParagraphIndex] = useState(0);
  const [completedParagraphs, setCompletedParagraphs] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [stats, setStats] = useState<StatsType>(() => getStatsFromRecord(loadRecords().medium));

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const [paragraphMistakes, setParagraphMistakes] = useState<MistakeMap>({});
  const [lastParagraphMistakes, setLastParagraphMistakes] = useState<MistakeMap>({});
  const [paragraphAttempts, setParagraphAttempts] = useState(0);
  const [paragraphCorrect, setParagraphCorrect] = useState(0);

  const paragraphs = PRACTICE_PARAGRAPHS[difficulty];
  const text = `${paragraphs[paragraphIndex % paragraphs.length]}\n`; // Enter key required at paragraph end

  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionRecords));
  }, [sessionRecords]);

  useEffect(() => {
    const record = sessionRecords[difficulty];
    setCompletedParagraphs(record.completedParagraphs);
  }, [difficulty, sessionRecords]);

  const resetTypingProgressOnly = () => {
    setParagraphIndex(0);
    setCompletedParagraphs(sessionRecords[difficulty].completedParagraphs);
    setUserInput('');
    setIsError(false);
    setErrorIndices(new Set());
    setParagraphMistakes({});
    setLastParagraphMistakes({});
    setParagraphAttempts(0);
    setParagraphCorrect(0);
  };

  const resetCurrentDifficultySession = () => {
    const empty = createEmptyRecord();
    setSessionRecords(prev => ({ ...prev, [difficulty]: empty }));
    setStats(getStatsFromRecord(empty));
    setGameState(GameState.IDLE);
    setParagraphIndex(0);
    setCompletedParagraphs(0);
    setUserInput('');
    setIsError(false);
    setErrorIndices(new Set());
    setParagraphMistakes({});
    setLastParagraphMistakes({});
    setParagraphAttempts(0);
    setParagraphCorrect(0);
    setIsFocused(true);
  };

  const changeDifficulty = (next: Difficulty) => {
    setDifficulty(next);
    setParagraphIndex(0);
    setUserInput('');
    setGameState(GameState.IDLE);
    setIsError(false);
    setErrorIndices(new Set());
    setParagraphMistakes({});
    setLastParagraphMistakes({});
    setParagraphAttempts(0);
    setParagraphCorrect(0);
    setCompletedParagraphs(sessionRecords[next].completedParagraphs);
    setStats(getStatsFromRecord(sessionRecords[next]));
  };

  const openParagraph = (idx: number) => {
    setParagraphIndex(idx);
    setUserInput('');
    setGameState(GameState.IDLE);
    setIsError(false);
    setErrorIndices(new Set());
    setParagraphMistakes({});
    setParagraphAttempts(0);
    setParagraphCorrect(0);
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

      setStats(prev => ({ ...prev, wpm, accuracy }));
    }
  }, []);

  useEffect(() => {
    let interval: number;
    if (gameState === GameState.PLAYING) interval = window.setInterval(calculateStats, 1000);
    return () => clearInterval(interval);
  }, [gameState, calculateStats]);

  const moveToNextParagraph = useCallback((finalParagraphAccuracy: number, completedIndex: number) => {
    setLastParagraphMistakes(paragraphMistakes);
    setParagraphMistakes({});
    setUserInput('');
    setErrorIndices(new Set());
    setIsError(false);
    setParagraphAttempts(0);
    setParagraphCorrect(0);
    setParagraphIndex(prev => (prev + 1) % paragraphs.length);
    setCompletedParagraphs(prev => prev + 1);

    setSessionRecords(prev => {
      const current = prev[difficulty];
      return {
        ...prev,
        [difficulty]: {
          ...current,
          completedParagraphs: current.completedParagraphs + 1,
          paragraphAccuracies: {
            ...current.paragraphAccuracies,
            [completedIndex]: finalParagraphAccuracy,
          },
          updatedAt: Date.now(),
        },
      };
    });
  }, [paragraphMistakes, paragraphs.length, difficulty]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFocused || gameState === GameState.LOADING) return;

    if (e.code === 'Space') e.preventDefault();

    setActiveKey(e.code);
    if (e.key === 'Shift') setIsShiftPressed(true);

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

    // Robust paragraph-end Enter handling: if user is exactly at the final newline marker,
    // Enter should always advance to next paragraph.
    if (e.key === 'Enter' && userInput.length === text.length - 1) {
      const nextAttempts = paragraphAttempts + 1;
      const nextCorrect = paragraphCorrect + 1;
      const paragraphAccuracy = nextAttempts > 0 ? (nextCorrect / nextAttempts) * 100 : 100;

      setParagraphAttempts(nextAttempts);
      setParagraphCorrect(nextCorrect);

      setStats(prev => ({
        ...prev,
        totalChars: prev.totalChars + 1,
        correctChars: prev.correctChars + 1,
      }));

      setSessionRecords(prev => {
        const current = prev[difficulty];
        return {
          ...prev,
          [difficulty]: {
            ...current,
            totalTyped: current.totalTyped + 1,
            totalCorrect: current.totalCorrect + 1,
            updatedAt: Date.now(),
          },
        };
      });

      moveToNextParagraph(paragraphAccuracy, paragraphIndex % paragraphs.length);
      return;
    }

    if (e.key === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
      setIsError(false);
      return;
    }

    if (gameState === GameState.IDLE) {
      setGameState(GameState.PLAYING);
      setStats(prev => ({ ...prev, startTime: prev.startTime ?? Date.now() }));
    }

    const nextCharIndex = userInput.length;
    if (nextCharIndex >= text.length) return;

    const charTyped = e.key === 'Enter' ? '\n' : e.key;
    if (charTyped !== '\n' && charTyped.length !== 1) return;

    const correctChar = text[nextCharIndex];
    const isCorrect = charTyped === correctChar;

    const nextAttempts = paragraphAttempts + 1;
    const nextCorrect = paragraphCorrect + (isCorrect ? 1 : 0);
    setParagraphAttempts(nextAttempts);
    setParagraphCorrect(nextCorrect);

    setStats(prev => {
      const totalChars = prev.totalChars + 1;
      const correctChars = isCorrect ? prev.correctChars + 1 : prev.correctChars;
      const errors = prev.errors + (isCorrect ? 0 : 1);
      return {
        ...prev,
        totalChars,
        correctChars,
        errors,
      };
    });

    setSessionRecords(prev => {
      const current = prev[difficulty];
      return {
        ...prev,
        [difficulty]: {
          ...current,
          totalTyped: current.totalTyped + 1,
          totalCorrect: current.totalCorrect + (isCorrect ? 1 : 0),
          errors: current.errors + (isCorrect ? 0 : 1),
          updatedAt: Date.now(),
        },
      };
    });

    if (isCorrect) {
      setIsError(false);

      // Explicitly handle paragraph-end Enter so next paragraph always opens reliably.
      if (charTyped === '\n' && correctChar === '\n') {
        const paragraphAccuracy = nextAttempts > 0 ? (nextCorrect / nextAttempts) * 100 : 100;
        moveToNextParagraph(paragraphAccuracy, paragraphIndex % paragraphs.length);
        return;
      }

      setUserInput(prev => prev + charTyped);

      if (nextCharIndex + 1 === text.length) {
        const paragraphAccuracy = nextAttempts > 0 ? (nextCorrect / nextAttempts) * 100 : 100;
        moveToNextParagraph(paragraphAccuracy, paragraphIndex % paragraphs.length);
      }
    } else {
      setIsError(true);
      setParagraphMistakes(prev => ({ ...prev, [correctChar]: (prev[correctChar] ?? 0) + 1 }));
      setErrorIndices(prev => {
        const updated = new Set(prev);
        updated.add(nextCharIndex);
        return updated;
      });
    }
  }, [isFocused, gameState, userInput.length, text, moveToNextParagraph, paragraphAttempts, paragraphCorrect, paragraphIndex, paragraphs.length, difficulty]);

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

  const mistakeEntries = Object.entries(lastParagraphMistakes).sort((a, b) => b[1] - a[1]);
  const currentRecord = sessionRecords[difficulty];

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 font-sans selection:bg-primary-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <aside className="bg-slate-900 border border-slate-800 rounded-2xl p-4 h-fit lg:sticky lg:top-4">
          <h2 className="text-white font-bold text-lg mb-2">Paragraph Navigator</h2>
          <p className="text-slate-400 text-sm mb-2">Difficulty: <span className="text-primary-400 font-semibold">{difficultyLabels[difficulty]}</span></p>
          <p className="text-slate-400 text-sm mb-2">Current paragraph: <span className="text-primary-400 font-semibold">#{(paragraphIndex % paragraphs.length) + 1}</span></p>
          <p className="text-slate-400 text-sm mb-4">Completed (saved): <span className="text-emerald-400 font-semibold">{currentRecord.completedParagraphs}</span></p>
          <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
            {paragraphs.map((_, idx) => {
              const acc = currentRecord.paragraphAccuracies[idx];
              const active = idx === (paragraphIndex % paragraphs.length);
              return (
                <button
                  key={idx}
                  onClick={() => openParagraph(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${active
                    ? 'bg-primary-600/20 border-primary-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Paragraph {idx + 1}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${acc !== undefined ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'}`}>
                      {acc !== undefined ? `${Math.round(acc)}%` : '--'}
                    </span>
                  </div>
                </button>
              );
            })}
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
                <p className="text-slate-500 text-sm font-medium">Infinite paragraph typing with difficulty modes</p>
              </div>
            </div>

            <button
              onClick={resetCurrentDifficultySession}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm border border-slate-700"
            >
              <RefreshCw size={16} />
              Reset {difficultyLabels[difficulty]} Session
            </button>
          </header>

          <div className="w-full max-w-5xl mb-4 flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => changeDifficulty(level)}
                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors ${difficulty === level
                  ? 'bg-primary-600/30 border-primary-500 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
              >
                {difficultyLabels[level]} ({PRACTICE_PARAGRAPHS[level].length})
              </button>
            ))}
          </div>

          <Stats stats={stats} />

          <div className="w-full max-w-5xl mb-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-400 text-sm mb-3">Mistake characters from previous paragraph</p>
            {mistakeEntries.length === 0 ? (
              <p className="text-emerald-300 font-semibold text-sm">No mistakes. Great paragraph.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mistakeEntries.map(([char, count]) => (
                  <span
                    key={char}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-200 border border-rose-500/30 font-mono text-sm"
                  >
                    <span className="font-bold">{prettifyMistake(char)}</span>
                    <span className="text-rose-300/90">×{count}</span>
                  </span>
                ))}
              </div>
            )}
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
              Allowed set: <span className="text-slate-300">A-Z, a-z</span> and <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs mx-1">, . : ; ' " ?</span> + press <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs">Enter</span> at paragraph end.
            </p>
          </div>

          <VirtualKeyboard pressedKey={activeKey} shiftPressed={isShiftPressed} />
        </main>
      </div>
    </div>
  );
};

export default App;
