import { KeyboardRow } from './types';

export const INITIAL_TEXT = "The quick brown fox jumps over the lazy dog; ensuring that: typing, precision, and speed are tested correctly. 'Practice makes perfect', they say.";

export const KEYBOARD_LAYOUT: KeyboardRow[] = [
  {
    keys: [
      { label: '`', secondary: '~', code: 'Backquote' },
      { label: '1', secondary: '!', code: 'Digit1' },
      { label: '2', secondary: '@', code: 'Digit2' },
      { label: '3', secondary: '#', code: 'Digit3' },
      { label: '4', secondary: '$', code: 'Digit4' },
      { label: '5', secondary: '%', code: 'Digit5' },
      { label: '6', secondary: '^', code: 'Digit6' },
      { label: '7', secondary: '&', code: 'Digit7' },
      { label: '8', secondary: '*', code: 'Digit8' },
      { label: '9', secondary: '(', code: 'Digit9' },
      { label: '0', secondary: ')', code: 'Digit0' },
      { label: '-', secondary: '_', code: 'Minus' },
      { label: '=', secondary: '+', code: 'Equal' },
      { label: 'Backspace', code: 'Backspace', width: 'w-20' },
    ],
  },
  {
    keys: [
      { label: 'Tab', code: 'Tab', width: 'w-14' },
      { label: 'Q', code: 'KeyQ' },
      { label: 'W', code: 'KeyW' },
      { label: 'E', code: 'KeyE' },
      { label: 'R', code: 'KeyR' },
      { label: 'T', code: 'KeyT' },
      { label: 'Y', code: 'KeyY' },
      { label: 'U', code: 'KeyU' },
      { label: 'I', code: 'KeyI' },
      { label: 'O', code: 'KeyO' },
      { label: 'P', code: 'KeyP' },
      { label: '[', secondary: '{', code: 'BracketLeft' },
      { label: ']', secondary: '}', code: 'BracketRight' },
      { label: '\\', secondary: '|', code: 'Backslash', width: 'w-14' },
    ],
  },
  {
    keys: [
      { label: 'Caps Lock', code: 'CapsLock', width: 'w-16' },
      { label: 'A', code: 'KeyA' },
      { label: 'S', code: 'KeyS' },
      { label: 'D', code: 'KeyD' },
      { label: 'F', code: 'KeyF' },
      { label: 'G', code: 'KeyG' },
      { label: 'H', code: 'KeyH' },
      { label: 'J', code: 'KeyJ' },
      { label: 'K', code: 'KeyK' },
      { label: 'L', code: 'KeyL' },
      { label: ';', secondary: ':', code: 'Semicolon' },
      { label: "'", secondary: '"', code: 'Quote' },
      { label: 'Enter', code: 'Enter', width: 'w-20' },
    ],
  },
  {
    keys: [
      { label: 'Shift', code: 'ShiftLeft', width: 'w-24' },
      { label: 'Z', code: 'KeyZ' },
      { label: 'X', code: 'KeyX' },
      { label: 'C', code: 'KeyC' },
      { label: 'V', code: 'KeyV' },
      { label: 'B', code: 'KeyB' },
      { label: 'N', code: 'KeyN' },
      { label: 'M', code: 'KeyM' },
      { label: ',', secondary: '<', code: 'Comma' },
      { label: '.', secondary: '>', code: 'Period' },
      { label: '/', secondary: '?', code: 'Slash' },
      { label: 'Shift', code: 'ShiftRight', width: 'w-24' },
    ],
  },
  {
    keys: [
      { label: 'Space', code: 'Space', width: 'w-96' },
    ],
  },
];