import React, { useState, useEffect, useCallback } from 'react';
import { Calculator, Delete, Palette } from 'lucide-react';

export default function AdvancedCalculator() {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [newNumber, setNewNumber] = useState(true);
  const [mode, setMode] = useState('deg');
  const [pendingFunction, setPendingFunction] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const [colors, setColors] = useState({
    numbers: 'bg-slate-600',
    operations: 'bg-purple-600',
    functions: 'bg-slate-700',
    equals: 'bg-green-600',
    clear: 'bg-red-600',
    special: 'bg-orange-600'
  });

  const colorOptions = [
    { name: 'Slate', value: 'bg-slate-600' }, { name: 'Purple', value: 'bg-purple-600' },
    { name: 'Blue', value: 'bg-blue-600' }, { name: 'Green', value: 'bg-green-600' },
    { name: 'Red', value: 'bg-red-600' }, { name: 'Orange', value: 'bg-orange-600' },
    { name: 'Indigo', value: 'bg-indigo-600' }, { name: 'Rose', value: 'bg-rose-600' }
  ];

  // --- Logic Helpers ---

  const formatResult = (num) => {
    if (isNaN(num) || !isFinite(num)) return "Error";
    // Fixes floating point issues like 0.1 + 0.2
    const formatted = Number(num.toPrecision(12));
    return String(formatted);
  };

  const playSound = useCallback(async (frequency, duration = 50) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) { /* Audio fails silently if blocked by browser */ }
  }, []);

  const handleClear = useCallback(() => {
    playSound(440, 100);
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setPendingFunction(null);
    setNewNumber(true);
  }, [playSound]);

  const handleNumber = useCallback((num) => {
    playSound(523.25, 40);
    setDisplay(prev => (newNumber || prev === '0' ? String(num) : prev + num));
    setNewNumber(false);
  }, [newNumber, playSound]);

  const handleDecimal = useCallback(() => {
    playSound(493.88, 40);
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  }, [display, newNumber, playSound]);

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': case '*': return a * b;
      case '÷': case '/': return a / b;
      case '^': return Math.pow(a, b);
      default: return b;
    }
  };

  const handleOperation = useCallback((op) => {
    playSound(587.33, 60);
    const current = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(current);
    } else if (operation && !newNumber) {
      const result = calculate(prevValue, current, operation);
      setDisplay(formatResult(result));
      setPrevValue(result);
    }
    setOperation(op);
    setNewNumber(true);
    setPendingFunction(null);
  }, [display, newNumber, operation, prevValue, playSound]);

  const executeFunction = useCallback((func, value) => {
    const current = value !== undefined ? value : parseFloat(display);
    let result;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;

    switch (func) {
      case 'sin': result = mode === 'deg' ? Math.sin(toRad(current)) : Math.sin(current); break;
      case 'cos': result = mode === 'deg' ? Math.cos(toRad(current)) : Math.cos(current); break;
      case 'tan': result = mode === 'deg' ? Math.tan(toRad(current)) : Math.tan(current); break;
      case 'log': result = Math.log10(current); break;
      case 'ln': result = Math.log(current); break;
      case 'sqrt': result = Math.sqrt(current); break;
      case 'x!': 
        if (current < 0 || current > 170) result = NaN;
        else {
          let res = 1;
          for (let i = 2; i <= current; i++) res *= i;
          result = res;
        }
        break;
      case 'π': result = Math.PI; break;
      case 'e': result = Math.E; break;
      default: result = current;
    }
    setDisplay(formatResult(result));
    setNewNumber(true);
    setPendingFunction(null);
  }, [display, mode]);

  const handleEquals = useCallback(() => {
    playSound(659.25, 80);
    if (pendingFunction) {
      executeFunction(pendingFunction, parseFloat(display));
      return;
    }
    if (operation && prevValue !== null) {
      const result = calculate(prevValue, parseFloat(display), operation);
      setDisplay(formatResult(result));
      setPrevValue(null);
      setOperation(null);
      setNewNumber(true);
    }
  }, [display, operation, pendingFunction, prevValue, executeFunction, playSound]);

  // --- Keyboard Support ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') handleNumber(parseInt(e.key));
      if (e.key === '.') handleDecimal();
      if (['+', '-', '*', '/'].includes(e.key)) handleOperation(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key);
      if (e.key === 'Enter' || e.key === '=') handleEquals();
      if (e.key === 'Escape') handleClear();
      if (e.key === 'Backspace') setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumber, handleDecimal, handleOperation, handleEquals, handleClear]);

  // --- UI Component ---
  const Button = ({ children, onClick, className = '', rowSpan = false, colSpan = "" }) => (
    <button 
      onClick={onClick} 
      className={`h-12 rounded-lg font-semibold transition-all hover:brightness-110 active:scale-95 flex items-center justify-center text-white ${className} ${rowSpan ? 'row-span-2 h-full' : ''} ${colSpan}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-4 w-full max-w-sm border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calculator className="text-purple-400" size={20} />
            <h1 className="text-white font-bold tracking-tight">Scientific Pro</h1>
          </div>
          <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">
            <Palette className="text-purple-400" size={18}/>
          </button>
        </div>

        {showColorPicker && (
          <div className="bg-slate-900 rounded-xl p-3 mb-4 border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <p className="text-slate-400 text-[10px] uppercase font-bold mb-2">Theme Editor</p>
            {Object.keys(colors).map((key) => (
              <div key={key} className="mb-2 last:mb-0">
                <span className="text-white text-[10px] capitalize block mb-1">{key}</span>
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {colorOptions.map((c) => (
                    <button 
                      key={c.value} 
                      onClick={() => setColors({...colors, [key]: c.value})} 
                      className={`w-5 h-5 rounded-full shrink-0 ${c.value} ${colors[key] === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900 rounded-xl p-4 mb-4 text-right border border-slate-700 shadow-inner">
          <div className="text-purple-400 font-mono text-xs h-4 mb-1">
            {pendingFunction ? `${pendingFunction}(` : operation ? `${prevValue} ${operation}` : ''}
          </div>
          <div className="text-white text-3xl font-mono truncate tracking-tighter">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {/* Controls */}
          <Button onClick={() => setMode(mode === 'deg' ? 'rad' : 'deg')} className={colors.functions}>{mode.toUpperCase()}</Button>
          <Button onClick={() => executeFunction('π')} className={colors.functions}>π</Button>
          <Button onClick={() => executeFunction('e')} className={colors.functions}>e</Button>
          <Button onClick={handleClear} className={colors.clear}>AC</Button>
          
          {/* Scientific Group */}
          {['sin', 'cos', 'tan'].map(f => (
            <Button key={f} onClick={() => { setPendingFunction(f); setNewNumber(true); }} className={colors.functions}>{f}</Button>
          ))}
          <Button onClick={() => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')} className={colors.special}>
            <Delete size={18}/>
          </Button>
          
          {['log', 'ln', 'sqrt'].map(f => (
            <Button key={f} onClick={() => executeFunction(f)} className={colors.functions}>{f === 'sqrt' ? '√x' : f}</Button>
          ))}
          <Button onClick={() => handleOperation('÷')} className={colors.operations}>÷</Button>
          
          {/* Numpad Group */}
          {[7, 8, 9].map(n => <Button key={n} onClick={() => handleNumber(n)} className={colors.numbers}>{n}</Button>)}
          <Button onClick={() => handleOperation('×')} className={colors.operations}>×</Button>
          
          {[4, 5, 6].map(n => <Button key={n} onClick={() => handleNumber(n)} className={colors.numbers}>{n}</Button>)}
          <Button onClick={() => handleOperation('-')} className={colors.operations}>-</Button>
          
          {[1, 2, 3].map(n => <Button key={n} onClick={() => handleNumber(n)} className={colors.numbers}>{n}</Button>)}
          <Button onClick={() => handleOperation('+')} className={colors.operations}>+</Button>
          
          <Button onClick={() => handleNumber(0)} className={`${colors.numbers} col-span-2`}>0</Button>
          <Button onClick={handleDecimal} className={colors.numbers}>.</Button>
          <Button onClick={handleEquals} className={colors.equals}>=</Button>
        </div>
      </div>
    </div>
  );
          }
