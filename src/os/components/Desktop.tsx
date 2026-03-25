import React, { useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import WindowManager from './WindowManager';
import Taskbar from './Taskbar';
import { useSocketSync } from '../hooks/useSocketSync';
import '../styles/global.css';
import { DesktopIcon, ALL_APPS } from './DesktopIcon';
import CursorManager from './CursorManager';
import Screensaver from './Screensaver';
import { socket } from '../utils/socket';

const Desktop: React.FC = () => {
  const { user } = useOSStore();
  useSocketSync();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!user.id) return;
      socket.emit('cursor-move', {
        userId: user.id,
        username: user.username,
        x: e.clientX,
        y: e.clientY
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [user.id, user.username]);

  return (
    <div
      className="desktop"
      onContextMenu={(e) => {
        // Prevent default browser context menu on empty desktop
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      style={{
        backgroundImage: `url(${user.wallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-image 0.5s ease',
      }}
    >
      {/* Dark overlay tint for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Desktop Icons */}
      {user.desktopIcons.map(icon => {
        const app = ALL_APPS.find(a => a.id === icon.appId) || { 
          id: icon.appId, 
          title: icon.appId.split('-')[0], 
          icon: icon.appId.split('-')[0], 
          component: icon.appId.split('-')[0],
          description: ''
        };
        return <DesktopIcon 
          key={icon.appId} 
          app={app} 
          x={icon.x} 
          y={icon.y} 
          onContextMenu={() => {}} 
        />;
      })}

      <WindowManager />
      <CursorManager />
      <Taskbar />
      <Screensaver />
    </div>
  );
};

export default Desktop;
