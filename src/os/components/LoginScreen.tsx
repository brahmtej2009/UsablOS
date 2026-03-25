import React, { useState, useEffect, useRef } from 'react';
import { useOSStore } from '../store/useOSStore';
import { ArrowRight, Wifi, Battery, Power } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [locked, setLocked] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const { login, user } = useOSStore();
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Unlock on any key press
  useEffect(() => {
    const handleKeyDown = () => {
      if (locked) setLocked(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locked]);

  // Handle scroll/swipe up to reveal
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (locked && e.deltaY > 50) setLocked(false);
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStart.current !== null) {
        const delta = touchStart.current - e.touches[0].clientY;
        if (delta > 100 && locked) setLocked(false);
      }
    };

    window.addEventListener('wheel', handleWheel);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [locked]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError('Connection refused. Is the server running on port 3001?');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: '"Segoe UI", "Segoe UI Variable", system-ui, sans-serif',
        backgroundColor: '#000'
      }}
    >
      {/* Dynamic Background Layer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: `url(${user.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: locked ? 'none' : 'blur(40px) brightness(0.7)',
        transform: locked ? 'scale(1)' : 'scale(1.1)',
        transition: 'all 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
        zIndex: 1
      }} />

      {/* Dark tint over background when unlocked */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        opacity: locked ? 0 : 1,
        transition: 'opacity 0.6s ease',
        zIndex: 2,
        pointerEvents: 'none'
      }} />

      {/* The Login Form Layer */}
      <div 
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          opacity: locked ? 0 : 1,
          pointerEvents: locked ? 'none' : 'auto',
          transform: locked ? 'scale(0.9)' : 'scale(1)',
          transition: 'all 0.5s cubic-bezier(0.1, 0.9, 0.2, 1)',
          zIndex: 3, color: 'white',
          padding: '20px'
        }}
      >
        <div style={{
          width: 'min(150px, 30vw)',
          height: 'min(150px, 30vw)',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'min(64px, 12vw)',
          fontWeight: '300',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <h2 style={{ fontSize: 'min(32px, 8vw)', fontWeight: 500, marginBottom: '30px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {username || 'Sign In'}
        </h2>

        {error && <div style={{ 
          fontSize: '14px', 
          color: '#ff8a8a', 
          marginBottom: '20px', 
          textAlign: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 0, 0, 0.2)',
          maxWidth: '320px'
        }}>{error}</div>}

        <form onSubmit={handleAuth} style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '12px 16px',
              width: '100%',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: '2px solid var(--accent-primary)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'white',
              outline: 'none',
              fontSize: '15px',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s',
            }}
            onFocus={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.45)'}
            onBlur={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
          />

          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="password"
              placeholder={isRegister ? "Create PIN" : "PIN"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px 45px 12px 16px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '2px solid var(--accent-primary)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                color: 'white',
                outline: 'none',
                fontSize: '15px',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.2s',
              }}
              onFocus={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.45)'}
              onBlur={e => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.3)'}
            />
            
            <button 
              type="submit"
              disabled={loading || !password || !username}
              style={{
                position: 'absolute', right: '6px', top: '6px', bottom: '6px', width: '36px',
                backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? <div className="spinner" /> : <ArrowRight size={20} />}
            </button>
          </div>

          <p 
            style={{ marginTop: '10px', fontSize: '13px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Back to Sign-in' : 'Create new account'}
          </p>
        </form>

        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', opacity: 0.8, position: 'absolute', bottom: '40px', right: '40px' }}>
          <Wifi size={24} style={{ cursor: 'pointer' }} />
          <Battery size={24} style={{ cursor: 'pointer' }} />
          <Power size={24} style={{ cursor: 'pointer' }} onClick={() => setLocked(true)} />
        </div>
      </div>

      {/* The Lock Screen Cover (Slides Up) */}
      <div 
        onClick={() => setLocked(false)}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          transform: locked ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.6s cubic-bezier(0.1, 0.9, 0.2, 1)',
          zIndex: 4, color: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: 'flex-start',
          paddingTop: '15vh',
          cursor: locked ? 'pointer' : 'default',
          userSelect: 'none'
        }}
      >
        <div style={{ 
          fontSize: 'clamp(60px, 15vw, 120px)', 
          fontWeight: 600, 
          textShadow: '0 5px 15px rgba(0,0,0,0.4)', 
          letterSpacing: '-2px',
          lineHeight: 1
        }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ 
          fontSize: 'clamp(18px, 4vw, 28px)', 
          fontWeight: 400, 
          textShadow: '0 3px 10px rgba(0,0,0,0.4)',
          marginTop: '10px'
        }}>
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <style>{`
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: rgba(255,255,255,0.4);
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
