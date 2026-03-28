import React, { Suspense, lazy } from 'react';
import { useOSStore } from '../store/useOSStore';
import type { WindowState } from '../store/useOSStore';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { socket } from '../utils/socket';
import { X, Minus, Square, Copy } from 'lucide-react';
import { getAppIcon } from './DesktopIcon';

// Lazily-loaded app components
const appMap: Record<string, React.LazyExoticComponent<any>> = {
  notepad: lazy(() => import('../apps/Notepad')),
  settings: lazy(() => import('../apps/Settings')),
  calculator: lazy(() => import('../apps/Calculator')),
  'file-explorer': lazy(() => import('../apps/FileExplorer')),
  paint: lazy(() => import('../apps/Paint')),
  cosmos: lazy(() => import('../apps/Cosmos')),
};

const TASKBAR_HEIGHT = 48;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const Window = React.forwardRef<HTMLDivElement, { window: WindowState }>(({ window }, ref) => {
  const { 
    user, closeWindow, focusWindow, minimizeWindow, maximizeWindow, 
    activeWindowId, updateWindowPosition, updateWindowSize 
  } = useOSStore();
  const set = useOSStore.setState;
  const isFocused = activeWindowId === window.id;
  const isLight = user.theme === 'light';

  const headerBg = isFocused
    ? (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')
    : 'transparent';

  const textColor = isLight ? '#0f172a' : 'white';
  const iconColor = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
  const hoverColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
  const dragControls = useDragControls();

  const AppContent = appMap[window.component];
  const AppContentAny = AppContent as any;

  const handleDragEnd = (_: any, info: any) => {
    const vw = globalThis.window.innerWidth;
    const vh = globalThis.window.innerHeight - TASKBAR_HEIGHT;

    const rawX = window.x + info.offset.x;
    const rawY = window.y + info.offset.y;

    const clampedX = clamp(rawX, -(window.width - 120), vw - 120);
    const clampedY = clamp(rawY, 0, vh - 36);

    updateWindowPosition(window.id, clampedX, clampedY);
  };

  const handleResize = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = window.width;
    const startHeight = window.height;
    const startXPos = window.x;
    const startYPos = window.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startXPos;
      let newY = startYPos;

      if (type.includes('e')) newWidth = startWidth + deltaX;
      if (type.includes('w')) {
        newWidth = startWidth - deltaX;
        newX = startXPos + deltaX;
      }
      if (type.includes('s')) newHeight = startHeight + deltaY;
      if (type.includes('n')) {
        newHeight = startHeight - deltaY;
        newY = startYPos + deltaY;
      }

      // Constraints
      if (newWidth < 300) {
        if (type.includes('w')) newX = startXPos + (startWidth - 300);
        newWidth = 300;
      }
      if (newHeight < 200) {
        if (type.includes('n')) newY = startYPos + (startHeight - 200);
        newHeight = 200;
      }

      // Live Sync
      socket.emit('window-sync', { 
        userId: user.id, 
        id: window.id, 
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });

      // Local Update (Zustand setState)
      set(state => ({
        windows: state.windows.map(w => w.id === window.id ? { ...w, x: newX, y: newY, width: newWidth, height: newHeight } : w)
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      const latest = useOSStore.getState().windows.find(w => w.id === window.id);
      if (latest) {
        updateWindowPosition(window.id, latest.x, latest.y);
        updateWindowSize(window.id, latest.width, latest.height);
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const ResizeHandle = ({ type, cursor }: { type: string, cursor: string }) => {
    const style: React.CSSProperties = {
      position: 'absolute',
      zIndex: 100,
      cursor: cursor,
    };

    if (type === 'n') { style.top = -4; style.left = 8; style.right = 8; style.height = 8; }
    if (type === 's') { style.bottom = -4; style.left = 8; style.right = 8; style.height = 8; }
    if (type === 'e') { style.right = -4; style.top = 8; style.bottom = 8; style.width = 8; }
    if (type === 'w') { style.left = -4; style.top = 8; style.bottom = 8; style.width = 8; }
    if (type === 'nw') { style.top = -4; style.left = -4; style.width = 12; style.height = 12; }
    if (type === 'ne') { style.top = -4; style.right = -4; style.width = 12; style.height = 12; }
    if (type === 'sw') { style.bottom = -4; style.left = -4; style.width = 12; style.height = 12; }
    if (type === 'se') { style.bottom = -4; style.right = -4; style.width = 12; style.height = 12; }

    return <div style={style} onMouseDown={(e) => handleResize(e, type)} />;
  };

  return (
    <motion.div
      ref={ref}
      drag={!window.isMaximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      onDrag={(_e, info) => {
        if (!window.isMaximized) {
          socket.emit('window-sync', { 
            userId: user.id, 
            id: window.id, 
            x: window.x + info.delta.x, 
            y: window.y + info.delta.y 
          });
        }
      }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.92, opacity: 0, y: 10 }}
      animate={{
        scale: 1,
        opacity: window.isMinimized ? 0 : 1,
        pointerEvents: window.isMinimized ? 'none' : 'auto',
        x: window.isMaximized ? 0 : window.x,
        y: window.isMaximized ? 0 : window.y,
        width: window.isMaximized ? '100%' : window.width,
        height: window.isMaximized ? `calc(100% - ${TASKBAR_HEIGHT}px)` : window.height,
      }}
      exit={{ scale: 0.92, opacity: 0, y: 10 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      onClick={() => focusWindow(window.id)}
      style={{
        position: 'absolute',
        zIndex: window.zIndex,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        border: isFocused ? '1px solid rgba(86, 156, 214, 0.6)' : '1px solid var(--glass-border)',
        boxShadow: isFocused ? '0 20px 60px rgba(0,0,0,0.6)' : 'var(--glass-shadow)',
        borderRadius: window.isMaximized ? '0px' : '8px',
        backdropFilter: 'blur(20px)',
        background: 'var(--window-bg-inactive)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: window.isMaximized ? '0px' : '8px', border: 'inherit', background: 'inherit', zIndex: -1 }} />
      
      {!window.isMaximized && (
        <>
          <ResizeHandle type="n" cursor="ns-resize" />
          <ResizeHandle type="s" cursor="ns-resize" />
          <ResizeHandle type="e" cursor="ew-resize" />
          <ResizeHandle type="w" cursor="ew-resize" />
          <ResizeHandle type="nw" cursor="nwse-resize" />
          <ResizeHandle type="ne" cursor="nesw-resize" />
          <ResizeHandle type="sw" cursor="nesw-resize" />
          <ResizeHandle type="se" cursor="nwse-resize" />
        </>
      )}

      <div
        className="window-header"
        onPointerDown={(e) => { focusWindow(window.id); dragControls.start(e); }}
        style={{
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: '12px',
          background: headerBg,
          cursor: 'default',
          color: textColor,
          borderBottom: isLight ? '1px solid rgba(0,0,0,0.05)' : 'none',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: textColor, fontWeight: 500 }}>
          {getAppIcon(window.icon, 14)}
          <span>{window.title}</span>
        </div>

        <div style={{ display: 'flex', height: '100%' }}>
          <button
            onClick={(e) => { e.stopPropagation(); minimizeWindow(window.id); }}
            title="Minimize"
            style={{ width: '46px', height: '100%', background: 'transparent', border: 'none', color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Minus size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); maximizeWindow(window.id); }}
            title={window.isMaximized ? 'Restore' : 'Maximize'}
            style={{ width: '46px', height: '100%', background: 'transparent', border: 'none', color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = hoverColor}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {window.isMaximized ? <Copy size={14} /> : <Square size={14} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); closeWindow(window.id); }}
            title="Close"
            style={{ width: '46px', height: '100%', background: 'transparent', border: 'none', color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e81123'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = iconColor; }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Loading...</div>}>
          {appMap[window.component]
            ? <AppContentAny windowId={window.id} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>App &quot;{window.component}&quot; not found</div>
          }
        </Suspense>
      </div>
    </motion.div>
  );
});

const WindowManager: React.FC = () => {
  const { windows } = useOSStore();

  return (
    <div
      className="window-manager"
      style={{ position: 'absolute', inset: 0, bottom: `${TASKBAR_HEIGHT}px`, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <AnimatePresence>
        {windows.filter(w => w.isOpen).map((win: WindowState) => (
          <Window key={win.id} window={win} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WindowManager;
