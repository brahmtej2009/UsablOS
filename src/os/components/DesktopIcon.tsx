import React, { useState, useRef } from 'react';
import { useOSStore } from '../store/useOSStore';
import { motion } from 'framer-motion';
import { Settings, Calculator, Terminal, Globe, Folder, FileText, Cpu, Music, Image as ImageIcon, Rocket } from 'lucide-react';

// The master registry of ALL apps available in the OS
export interface AppDefinition {
  id: string;
  title: string;
  icon: string;
  component: string;
  description: string;
}

export const ALL_APPS: AppDefinition[] = [
  { id: 'settings-1', title: 'Settings', icon: 'settings', component: 'settings', description: 'System preferences' },
  { id: 'calculator-1', title: 'Calculator', icon: 'calculator', component: 'calculator', description: 'Do the math' },
  { id: 'file-explorer-1', title: 'Files', icon: 'folder', component: 'file-explorer', description: 'Manage your files' },
  { id: 'notepad-1', title: 'Notepad', icon: 'file-text', component: 'notepad', description: 'Edit text files' },
  { id: 'paint-1', title: 'Paint', icon: 'image', component: 'paint', description: 'Draw and edit images' },
  { id: 'cosmos-1', title: 'Cosmos', icon: 'rocket', component: 'cosmos', description: 'Explore the universe' },
];

// Map string icon name → React element
export const getAppIcon = (iconName: string, size = 24, color?: string): React.ReactNode => {
  const s = size;
  const c = color || 'currentColor';
  switch (iconName) {
    case 'settings': return <Settings size={s} color={c} />;
    case 'calculator': return <Calculator size={s} color={c} />;
    case 'terminal': return <Terminal size={s} color={c} />;
    case 'globe': return <Globe size={s} color={c} />;
    case 'folder': return <Folder size={s} color={c} />;
    case 'file-text': return <FileText size={s} color={c} />;
    case 'cpu': return <Cpu size={s} color={c} />;
    case 'music': return <Music size={s} color={c} />;
    case 'image': return <ImageIcon size={s} color={c} />;
    case 'rocket': return <Rocket size={s} color={c} />;
    default: return <Folder size={s} color={c} />;
  }
};

const DesktopIcon: React.FC<{ app: AppDefinition; x: number; y: number; onContextMenu: (e: React.MouseEvent, appId: string, title: string) => void }> = ({ app, x, y, onContextMenu }) => {
  const { openWindow, moveDesktopIcon } = useOSStore();
  const [selected, setSelected] = useState(false);
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    setSelected(true);
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => setSelected(false), 1500);
  };

  const handleDoubleClick = () => {
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    setSelected(false);
    openWindow(app.id, app.title, app.icon, app.component);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        moveDesktopIcon(app.id, x + info.offset.x, y + info.offset.y);
      }}
      initial={{ x, y }}
      animate={{ x, y }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, app.id, app.title);
      }}
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '8px',
        borderRadius: '8px',
        cursor: 'default',
        userSelect: 'none',
        background: selected ? 'rgba(255,255,255,0.15)' : 'transparent',
        border: selected ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
        transition: 'background 0.12s, border 0.12s',
        width: '76px',
        minHeight: '84px',
        justifyContent: 'center',
        zIndex: selected ? 100 : 1
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        color: 'white',
      }}>
        {getAppIcon(app.icon, 24)}
      </div>
      <span style={{
        fontSize: '11px',
        color: 'white',
        textAlign: 'center',
        textShadow: '0 1px 4px rgba(0,0,0,0.9)',
        fontWeight: 500,
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        lineHeight: '1.2',
        maxWidth: '72px',
        wordBreak: 'break-word',
      }}>
        {app.title}
      </span>
    </motion.div>
  );
};

export { DesktopIcon };
export default DesktopIcon;
