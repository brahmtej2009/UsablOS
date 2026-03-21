import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { ArrowRight, Wifi, Battery, Power } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());
  
  const { login, user } = useOSStore();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('webos_token', data.token);
      login(data.user.username);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${user.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        position: 'relative',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      {/* Blurred overlay exactly like Windows 11 login */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backdropFilter: 'blur(25px)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1
      }} />

      {/* Big Windows 11 Clock at the top center */}
      <div style={{ position: 'absolute', top: '10vh', left: 0, right: 0, textAlign: 'center', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '80px', fontWeight: '500', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: '24px', fontWeight: '400', textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>
          {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '320px', marginTop: '10vh' }}>
        
        {/* User Avatar */}
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          backgroundImage: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          fontWeight: '300',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          marginBottom: '20px'
        }}>
          {username ? username.charAt(0).toUpperCase() : 'A'}
        </div>

        {/* User Name */}
        <h1 style={{ fontSize: '32px', fontWeight: 600, marginBottom: '25px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {username || (isRegister ? 'New AeroOS User' : 'AeroOS User')}
        </h1>

        {error && <div style={{ fontSize: '13px', color: '#fca5a5', marginBottom: '15px' }}>{error}</div>}

        {/* Auth Form */}
        <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          
          <input 
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: '12px 16px',
              width: '100%',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              color: 'white',
              outline: 'none',
              fontSize: '15px',
              backdropFilter: 'blur(10px)',
              transition: 'border 0.2s',
            }}
            onFocus={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.5)'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
          />

          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type="password"
              placeholder={isRegister ? "Create PIN/Password" : "PIN or Password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: '12px 45px 12px 16px',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: 'white',
                outline: 'none',
                fontSize: '15px',
                backdropFilter: 'blur(10px)',
                transition: 'border 0.2s',
              }}
              onFocus={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.5)'}
              onBlur={(e) => e.target.style.border = '1px solid rgba(255,255,255,0.2)'}
            />
            
            <button 
              type="submit"
              disabled={loading || !password || !username}
              style={{
                position: 'absolute',
                right: '6px',
                top: '6px',
                bottom: '6px',
                width: '32px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (loading || !password || !username) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                opacity: (loading || !password || !username) ? 0.5 : 1
              }}
              onMouseEnter={(e) => { if(!loading) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={(e) => { if(!loading) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
            >
              <ArrowRight size={18} />
            </button>
          </div>

          <p 
            style={{ 
              marginTop: '10px', 
              fontSize: '13px', 
              cursor: 'pointer', 
              color: 'rgba(255,255,255,0.8)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
            onClick={() => setIsRegister(!isRegister)}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          >
            {isRegister ? 'Sign-in options' : 'Create new account'}
          </p>
        </form>
      </div>

      {/* Bottom Right System Icons */}
      <div style={{ position: 'absolute', bottom: '25px', right: '35px', display: 'flex', gap: '20px', zIndex: 2, alignItems: 'center', opacity: 0.9 }}>
        <Wifi size={22} style={{ cursor: 'pointer' }} />
        <Battery size={22} style={{ cursor: 'pointer' }} />
        <Power size={22} style={{ cursor: 'pointer' }} onClick={() => alert('Shut down clicked')} />
      </div>

      {/* Bottom Center Date (Optional, like Windows lock screen hidden state) */}
      <div style={{ position: 'absolute', bottom: '25px', zIndex: 2, fontSize: '13px', opacity: 0.7 }}>
        AeroOS • Version 11.0
      </div>
    </div>
  );
};

export default LoginScreen;
