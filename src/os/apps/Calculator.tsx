import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { socket } from '../utils/socket';
import { Delete } from 'lucide-react';

const Calculator: React.FC<{ windowId: string }> = ({ windowId }) => {
  const { user, activeWindowId } = useOSStore();
  const isLight = user.theme === 'light';
  const textColor = isLight ? '#0f172a' : 'white';
  const displayBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.3)';
  const btnBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const btnBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  // Sockets for real-time sync
  useEffect(() => {
    const handleCalcSync = (data: { display: string, equation: string }) => {
      setDisplay(data.display);
      setEquation(data.equation);
    };
    socket.on('calc-sync', handleCalcSync);
    return () => { socket.off('calc-sync', handleCalcSync); };
  }, []);

  const emitUpdate = (newDisplay: string, newEq: string) => {
    socket.emit('calc-update', {
      userId: user.id,
      display: newDisplay,
      equation: newEq
    });
  };

  const isOperator = (c: string) => ['+', '-', '*', '/', 'x'].includes(c);

  const calculate = (eq: string) => {
    try {
      const sanitized = eq.replace(/x/g, '*');
      if (/[^0-9+\-*/.]/.test(sanitized)) throw new Error('Invalid characters');
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)().toString();
      return result;
    } catch {
      return 'Error';
    }
  };

  const handleInput = (char: string) => {
    let nextDisplay = display;
    let nextEq = equation;

    const lastChar = equation.slice(-1);

    if (char === 'C') {
      nextDisplay = '0';
      nextEq = '';
    } else if (char === 'BS') {
      if (equation.length > 0) {
        nextEq = equation.slice(0, -1);
        if (nextEq === '') {
          nextDisplay = '0';
        } else {
          // Splitting by operators to find the last segment to display
          const parts = nextEq.split(/[+\-*/x]/);
          const lastPart = parts[parts.length - 1];
          nextDisplay = lastPart === '' ? nextEq.slice(-1) : lastPart;
        }
      } else {
        nextDisplay = '0';
        nextEq = '';
      }
    } else if (char === '=') {
      const result = calculate(equation);
      nextDisplay = result;
      nextEq = result === 'Error' ? '' : result;
    } else if (isOperator(char)) {
      const op = char === 'x' ? '*' : char;
      if (equation === '') {
        if (op === '-') {
            nextEq = '-';
            nextDisplay = '-';
        } else return; // ignore other starting ops
      } else if (isOperator(lastChar)) {
        // Double operator fix: replace the last one
        nextEq = equation.slice(0, -1) + op;
        nextDisplay = char;
      } else {
        nextEq = equation + op;
        nextDisplay = char;
      }
    } else if (char === '.') {
      // Find the current numerical segment
      const parts = equation.split(/[+\-*/x]/);
      const currentPart = parts[parts.length - 1] || '';
      
      if (currentPart.includes('.')) return; // skip if already has decimal point

      if (equation === '' || isOperator(lastChar)) {
        nextEq = equation + '0.';
        nextDisplay = '0.';
      } else {
        nextEq = equation + '.';
        nextDisplay = display + '.';
      }
    } else {
      // Numerical input
      if (display === '0' || isOperator(display)) {
        nextDisplay = char;
      } else {
        nextDisplay = display + char;
      }
      nextEq = equation + (char === 'x' ? '*' : char);
    }

    setDisplay(nextDisplay);
    setEquation(nextEq);
    emitUpdate(nextDisplay, nextEq);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeWindowId !== windowId) return;

      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === '+') {
        handleInput('+');
      } else if (e.key === '-') {
        handleInput('-');
      } else if (e.key === '*') {
        handleInput('x');
      } else if (e.key === '/') {
        handleInput('/');
      } else if (e.key === '.') {
        handleInput('.');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleInput('=');
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput('BS');
      } else if (e.key === 'Escape') {
        handleInput('C');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindowId, windowId, equation, display]);

  const buttons = [
    { label: 'C', value: 'C', type: 'danger' },
    { label: <Delete size={18} />, value: 'BS', type: 'danger' },
    { label: '/', value: '/', type: 'operator' },
    { label: 'x', value: 'x', type: 'operator' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
    { label: '-', value: '-', type: 'operator' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '+', value: '+', type: 'operator' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '=', value: '=', type: 'action' },
    { label: '0', value: '0', wide: true },
    { label: '.', value: '.' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
      <div
        style={{
          background: displayBg,
          padding: '20px 15px',
          borderRadius: '12px',
          textAlign: 'right',
          fontSize: '32px',
          fontWeight: 600,
          minHeight: '80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          color: textColor,
          wordBreak: 'break-all',
          border: isLight ? `1px solid ${btnBorder}` : 'none',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)',
          lineHeight: 1
        }}
      >
        <div style={{ fontSize: '13px', opacity: 0.5, fontWeight: 400, marginBottom: '5px' }}>
          {equation.replace(/\*/g, 'x') || '0'}
        </div>
        <div>{display}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flex: 1 }}>
        {buttons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleInput(btn.value)}
            className="glass-panel-hover"
            style={{
              gridColumn: btn.wide ? 'span 2' : (btn.value === '=' ? 'span 1' : 'auto'),
              gridRow: btn.value === '=' ? 'span 2' : 'auto',
              border: `1px solid ${btnBorder}`,
              background: btn.type === 'operator' 
                ? 'var(--accent-primary)' 
                : btn.type === 'action' 
                    ? '#10b981' 
                    : btn.type === 'danger' 
                        ? 'rgba(239, 68, 68, 0.8)' 
                        : btnBg,
              color: btn.type || btn.wide ? 'white' : textColor,
              fontSize: '20px',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: btn.type ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;

