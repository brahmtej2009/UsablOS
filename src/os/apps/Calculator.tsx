import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { socket } from '../utils/socket';

const Calculator: React.FC = () => {
  const { user } = useOSStore();
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
  const handleInput = (char: string) => {
    if (char === 'C') {
      setDisplay('0');
      setEquation('');
      emitUpdate('0', '');
      return;
    }
    if (char === '=') {
      try {
        // 100% Hacker-proof: Allow strictly numbers and basic operators ONLY
        const sanitized = equation.replace(/x/g, '*');
        if (/[^0-9+\-*/.]/.test(sanitized)) {
          throw new Error('Invalid characters');
        }
        // eslint-disable-next-line no-new-func
        const result = new Function(`return ${sanitized}`)().toString();
        setDisplay(result);
        setEquation(result);
        emitUpdate(result, result);
      } catch {
        setDisplay('Error');
        setEquation('');
        emitUpdate('Error', '');
      }
      return;
    }
    const newDisplay = (display === '0' || ['/', 'x', '-', '+'].includes(display)) ? char : display + char;
    const newEq = equation + (char === 'x' ? '*' : char);
    setDisplay(newDisplay);
    setEquation(newEq);
    emitUpdate(newDisplay, newEq);
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', 'x',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
      <div 
        style={{ 
          background: displayBg, 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'right', 
          fontSize: '24px', 
          minHeight: '60px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          color: textColor,
          wordBreak: 'break-all',
          border: isLight ? `1px solid ${btnBorder}` : 'none',
        }}
      >
        {display}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', flex: 1 }}>
        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleInput(btn)}
            className="glass-panel-hover"
            style={{
              border: `1px solid ${btnBorder}`,
              background: ['/', 'x', '-', '+', '='].includes(btn) ? 'var(--accent-primary)' : btnBg,
              color: ['/', 'x', '-', '+', '='].includes(btn) ? 'white' : textColor,
              fontSize: '18px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Calculator;
