import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Stats as StatsType } from './types';
import { INITIAL_TEXT } from './constants';
import TypingArea from './components/TypingArea';
import VirtualKeyboard from './components/VirtualKeyboard';
import Stats from './components/Stats';
import { generateLesson } from './services/geminiService';
import { RefreshCw, Keyboard, Sparkles, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [text, setText] = useState(INITIAL_TEXT);
  const [nextText, setNextText] = useState<string | null>(null); // Pre-fetch buffer
  
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
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  
  // Ref to hold stats for calculation without re-triggering effects
  const statsRef = useRef(stats);
  statsRef.current = stats;

  // Pre-fetch the next lesson whenever the current text changes
  useEffect(() => {
    let isMounted = true;
    const fetchNext = async () => {
      try {
        const next = await generateLesson();
        if (isMounted) setNextText(next);
      } catch (error) {
        console.error("Failed to pre-fetch next lesson", error);
      }
    };
    fetchNext();
    return () => { isMounted = false; };
  }, [text]);

  // Manually trigger a completely new lesson (skip current)
  const generateNewLesson = useCallback(async () => {
    setGameState(GameState.LOADING);
    setNextText(null); // Clear buffer
    const newText = await generateLesson();
    setText(newText);
    resetGame();
  }, []);

  const resetGame = () => {
    setUserInput('');
    setGameState(GameState.IDLE);
    setIsError(false);
    setErrorIndices(new Set());
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
      // WPM = (All typed entries / 5) / Time (min)
      // Use cumulative correctChars
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

  // Timer effect for real-time WPM updates
  useEffect(() => {
    let interval: number;
    if (gameState === GameState.PLAYING) {
      interval = window.setInterval(calculateStats, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, calculateStats]);

  const loadNextParagraph = useCallback(async () => {
    setIsLoadingNext(true);
    
    let newParagraph = nextText;
    
    // If pre-fetch hasn't finished yet, wait for it
    if (!newParagraph) {
        newParagraph = await generateLesson();
    }

    setText(newParagraph);
    setUserInput('');
    setErrorIndices(new Set());
    setIsLoadingNext(false);
    // Note: We do NOT reset stats or startTime here, to allow for continuous session tracking.
    // If startTime was null (never started), we leave it.
    
  }, [nextText]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isFocused || gameState === GameState.LOADING || isLoadingNext || gameState === GameState.FINISHED) return;

    // Prevent default scrolling for Space
    if (e.code === 'Space') {
      e.preventDefault();
    }

    // Keyboard visuals
    setActiveKey(e.code);
    if (e.key === 'Shift') setIsShiftPressed(true);

    // Ignore special keys for typing logic
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta' || e.key === 'CapsLock' || e.key === 'Tab') {
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      setUserInput(prev => prev.slice(0, -1));
      setIsError(false);
      return;
    }

    // Start game on first valid keypress
    if (gameState === GameState.IDLE) {
      setGameState(GameState.PLAYING);
      setStats(prev => ({ ...prev, startTime: Date.now() }));
    }

    const nextCharIndex = userInput.length;
    
    // Safety check
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

      // Check for paragraph completion
      if (nextCharIndex + 1 === text.length) {
        loadNextParagraph();
      }
    } else {
      setIsError(true);
      setErrorIndices(prev => {
        const newSet = new Set(prev);
        newSet.add(nextCharIndex);
        return newSet;
      });
    }

  }, [gameState, isFocused, text, userInput, isLoadingNext, loadNextParagraph]);

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
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 px-4 font-sans selection:bg-primary-500/30">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20">
            <Keyboard className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TypeMaster <span className="text-primary-500">AI</span></h1>
            <p className="text-slate-500 text-sm font-medium">Professional Touch Typing Tutor</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-sm border border-slate-700"
          >
            <RefreshCw size={16} />
            Reset Session
          </button>
          <button 
            onClick={generateNewLesson}
            disabled={gameState === GameState.LOADING}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-all shadow-lg shadow-primary-500/20 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={16} />
            {gameState === GameState.LOADING ? 'Generating...' : 'Skip Paragraph'}
          </button>
        </div>
      </header>

      {/* Stats */}
      <Stats stats={stats} />

      {/* Main Typing Area */}
      <div className="w-full flex justify-center mb-8 relative">
        {isLoadingNext && (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-2xl animate-in fade-in duration-200">
             <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-3" />
             <p className="text-white font-medium">Loading next paragraph...</p>
           </div>
        )}
        
        <TypingArea 
          text={text} 
          userInput={userInput} 
          isFocused={isFocused}
          onFocus={() => setIsFocused(true)}
          isError={isError}
          errorIndices={errorIndices}
        />
      </div>

      {/* Instructions / Current Focus */}
      <div className="w-full max-w-5xl mb-6">
        <p className="text-center text-slate-500 text-sm">
          Focus: <span className="text-slate-300">A-Z, a-z</span> and symbols <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-xs mx-1">, : ; . ' "</span>
        </p>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard pressedKey={activeKey} shiftPressed={isShiftPressed} />
      
      {/* Footer / Attribution */}
      <footer className="mt-12 text-slate-600 text-xs">
        Powered by Gemini AI • React • Tailwind CSS
      </footer>
    </div>
  );
};

export default App;