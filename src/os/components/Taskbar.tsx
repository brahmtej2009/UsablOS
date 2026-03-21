import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { LayoutGrid, Monitor, Clock, LogOut } from 'lucide-react';
import clsx from 'clsx';

const Taskbar: React.FC = () => {
  const { windows, activeWindowId, focusWindow, minimizeWindow, logout } = useOSStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="taskbar glass-panel"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--taskbar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 10px',
        zIndex: 9999,
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        backgroundColor: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Invisible spacer for center alignment flex magic */}
      <div style={{ flex: 1 }} />

      {/* Centered App Area (Windows 11 style) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <button className="start-button glass-panel-hover" style={{ background: 'none', border: 'none', color: '#0ea5e9', padding: '8px', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}>
          <LayoutGrid size={24} />
        </button>

        <div className="taskbar-divider" style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }} />

        <div className="running-apps" style={{ display: 'flex', gap: '5px' }}>
          {windows.map((win) => (
            <button
              key={win.id}
              onClick={() => win.id === activeWindowId ? minimizeWindow(win.id) : focusWindow(win.id)}
              className={clsx("app-tab glass-panel-hover", { "active": win.id === activeWindowId })}
              style={{
                background: win.id === activeWindowId ? 'rgba(255,255,255,0.1)' : 'none',
                border: 'none',
                color: 'white',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                borderBottom: win.id === activeWindowId ? '3px solid #0ea5e9' : (win.isMinimized ? '3px solid transparent' : '3px solid rgba(255,255,255,0.3)'),
                transition: 'all 0.2s'
              }}
              title={win.title}
            >
              <Monitor size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="system-tray" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '15px', paddingRight: '10px' }}>
        <button
          onClick={logout}
          className="glass-panel-hover"
          title="Log Out"
          style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.8)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
        >
          <LogOut size={18} />
        </button>
        <div className="clock" style={{ textAlign: 'right', fontSize: '12px' }}>
          <div>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div>{time.toLocaleDateString()}</div>
        </div>
        <Monitor size={18} />
      </div>
    </div>
  );
};

export default Taskbar;
