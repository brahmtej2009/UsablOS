import React, { Suspense, lazy } from 'react';
import { useOSStore } from '../store/useOSStore';
import type { WindowState } from '../store/useOSStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Square, Minimize2 } from 'lucide-react';

// Help to resolve apps lazily
const appMap: Record<string, React.LazyExoticComponent<any>> = {
  notepad: lazy(() => import('../apps/Notepad')),
  settings: lazy(() => import('../apps/Settings')),
  explorer: lazy(() => import('../apps/FileExplorer')),
  calculator: lazy(() => import('../apps/Calculator')),
  // Add other apps here as they are created
};

const Window: React.FC<{ window: WindowState }> = ({ window }) => {
  const { closeWindow, focusWindow, minimizeWindow, maximizeWindow, activeWindowId } = useOSStore();
  const isActive = activeWindowId === window.id;

  const AppContent = appMap[window.component] || (() => <div>App Not Found</div>);
  const AppContentAny = AppContent as any;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: window.isMinimized ? 0 : 1,
        display: window.isMinimized ? 'none' : 'block',
        x: window.isMaximized ? 0 : window.x,
        y: window.isMaximized ? 0 : window.y,
        width: window.isMaximized ? '100%' : window.width,
        height: window.isMaximized ? 'calc(100% - var(--taskbar-height))' : window.height,
      }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={() => focusWindow(window.id)}
      className="window glass-panel"
      style={{
        position: 'absolute',
        zIndex: window.zIndex,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--glass-border)',
        boxShadow: isActive ? '0 0 20px rgba(56, 189, 248, 0.2)' : 'var(--glass-shadow)',
      }}
    >
      {/* Title Bar */}
      <div 
        className="window-header"
        style={{
          height: '35px',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 10px',
          cursor: 'default',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
          <span>{window.title}</span>
        </div>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }}
            className="glass-panel-hover"
            style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', borderRadius: '4px' }}
          >
            <Minus size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }}
            className="glass-panel-hover"
            style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer', borderRadius: '4px' }}
          >
            {window.isMaximized ? <Minimize2 size={14} /> : <Square size={14} />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }}
            className="glass-panel-hover"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              padding: '4px', 
              cursor: 'pointer', 
              borderRadius: '4px', 
              transition: 'background 0.2s' 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'auto', padding: '15px' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <AppContentAny windowId={window.id} />
        </Suspense>
      </div>
    </motion.div>
  );
};

const WindowManager: React.FC = () => {
  const { windows } = useOSStore();

  return (
    <div className="window-manager" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 'var(--taskbar-height)' }}>
      <AnimatePresence>
        {windows.map((win: WindowState) => (
          <Window key={win.id} window={win} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WindowManager;
