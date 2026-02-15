import React from 'react';
import { KEYBOARD_LAYOUT } from '../constants';
import { KeyConfig } from '../types';

interface VirtualKeyboardProps {
  pressedKey: string | null;
  shiftPressed: boolean;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ pressedKey, shiftPressed }) => {
  
  const isKeyActive = (code: string) => {
    if (!pressedKey) return false;
    // Simple matching. For Shift, we match both left and right if the user just pressed 'Shift' key generically,
    // though the event usually gives specific codes.
    return pressedKey === code;
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl mt-8 select-none">
      <div className="flex flex-col gap-2 items-center">
        {KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.keys.map((key: KeyConfig) => {
              const active = isKeyActive(key.code) || (key.code.includes('Shift') && shiftPressed);
              
              return (
                <div
                  key={key.code}
                  className={`
                    flex flex-col items-center justify-center rounded-lg transition-all duration-100 border-b-4
                    ${key.width || 'w-12'} h-12 md:h-14
                    ${active 
                      ? 'bg-primary-500 border-primary-600 text-white translate-y-1 shadow-inner' 
                      : 'bg-slate-800 border-slate-950 text-slate-400 hover:bg-slate-700'}
                  `}
                >
                  {key.secondary && (
                    <span className="text-[10px] leading-none opacity-60 mb-0.5">{key.secondary}</span>
                  )}
                  <span className={`${key.secondary ? 'text-sm' : 'text-base md:text-lg'} font-semibold`}>
                    {key.label}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;