import React, { useRef, useEffect } from 'react';

interface TypingAreaProps {
  text: string;
  userInput: string;
  isFocused: boolean;
  onFocus: () => void;
  isError: boolean;
  errorIndices: Set<number>;
}

const TypingArea: React.FC<TypingAreaProps> = ({ text, userInput, isFocused, onFocus, isError, errorIndices }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Auto-scroll logic to keep cursor in view
  useEffect(() => {
    if (cursorRef.current && containerRef.current) {
      const cursorTop = cursorRef.current.offsetTop;
      const containerHeight = containerRef.current.clientHeight;
      const scrollTop = containerRef.current.scrollTop;

      if (cursorTop > scrollTop + containerHeight - 60) {
        containerRef.current.scrollTo({
          top: cursorTop - containerHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [userInput]);

  const renderChar = (char: string, index: number) => {
    const isCurrent = index === userInput.length;
    const isTyped = index < userInput.length;
    
    // Check if this specific index had an error at any point
    const hasHistoryError = errorIndices.has(index);

    let className = "font-mono text-2xl md:text-3xl transition-colors duration-75 relative ";
    
    if (isCurrent) {
      // Show cursor styling
      if (isError) {
        className += "bg-rose-500 text-white rounded-sm animate-shake ";
      } else {
        className += "bg-slate-700 text-white rounded-sm "; 
      }
    } else if (isTyped) {
        // If it was typed, it's correct (because we block incorrect input), 
        // BUT if it had an error previously, we color it red.
        if (hasHistoryError) {
             className += "text-rose-400 "; 
        } else {
             className += "text-emerald-400 ";
        }
    } else {
      className += "text-slate-500 ";
    }

    return (
      <span 
        key={index} 
        ref={isCurrent ? cursorRef : null}
        className={className}
      >
        {isCurrent && isFocused && !isError && (
          <span className="absolute left-0 -bottom-1 w-full h-1 bg-primary-500 cursor-blink"></span>
        )}
        {char}
      </span>
    );
  };

  return (
    <div 
      className={`
        relative w-full max-w-5xl h-64 bg-slate-900/50 rounded-2xl border-2 
        p-8 overflow-y-auto backdrop-blur-sm transition-all duration-300
        ${isFocused 
          ? isError 
            ? 'border-rose-500/50 shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)]' 
            : 'border-primary-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]' 
          : 'border-slate-800 opacity-80'}
      `}
      onClick={onFocus}
      ref={containerRef}
    >
      {!isFocused && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] rounded-xl cursor-pointer">
          <p className="text-white font-medium text-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            Click to focus
          </p>
        </div>
      )}
      
      <div className="flex flex-wrap leading-relaxed select-none break-words whitespace-pre-wrap">
        {text.split('').map((char, idx) => renderChar(char, idx))}
      </div>
    </div>
  );
};

export default TypingArea;