import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleInput = (char: string) => {
    if (char === 'C') {
      setDisplay('0');
      setEquation('');
    } else if (char === '=') {
      try {
        // eslint-disable-next-line no-eval
        const result = eval(equation.replace(/x/g, '*'));
        setDisplay(String(result));
        setEquation(String(result));
      } catch (e) {
        setDisplay('Error');
      }
    } else {
      const newDisplay = display === '0' && !isNaN(Number(char)) ? char : display + char;
      setDisplay(newDisplay);
      setEquation(equation + char);
    }
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
          background: 'rgba(0,0,0,0.3)', 
          padding: '15px', 
          borderRadius: '8px', 
          textAlign: 'right', 
          fontSize: '24px', 
          minHeight: '60px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          color: 'white',
          wordBreak: 'break-all'
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
              border: '1px solid rgba(255,255,255,0.1)',
              background: ['/', 'x', '-', '+', '='].includes(btn) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              color: 'white',
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
