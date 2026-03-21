import React from 'react';
import { useOSStore } from '../store/useOSStore';
import WindowManager from './WindowManager';
import Taskbar from './Taskbar';
import { useSocketSync } from '../hooks/useSocketSync';
import '../styles/global.css';

const Desktop: React.FC = () => {
  const { user } = useOSStore();
  useSocketSync(); // Intialize multi-client sync

  return (
    <div 
      className="desktop"
      style={{
        backgroundImage: `url(${user.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Desktop Icons Layer */}
      <div className="desktop-icons" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 100px)', gap: '20px' }}>
        {/* Placeholder for desktop icons */}
      </div>

      {/* Windows Layer */}
      <WindowManager />

      {/* Taskbar Layer */}
      <Taskbar />
    </div>
  );
};

export default Desktop;
