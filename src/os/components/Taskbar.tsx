import React, { useState, useEffect } from 'react';
import { 
  Moon, 
  LogOut,
  Volume2,
  Sun,
  RefreshCw,
  Power,
  Settings as SettingsIcon,
  Calculator as CalculatorIcon,
  Folder,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  FileText,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../store/useOSStore';
import { useBattery } from '../hooks/useBattery';
import { BatteryIcon } from './BatteryIcon';

const Taskbar: React.FC = () => {
  const { 
    windows, 
    openWindow, 
    focusWindow, 
    activeWindowId,
    isStartMenuOpen,
    setStartMenuOpen,
    isActionCenterOpen,
    setActionCenterOpen,
    updateUser,
    addDesktopIcon,
    removeDesktopIcon,
    user: storeUser,
    logout,
    setIsSleeping
  } = useOSStore();

  const user = storeUser as any; 
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appId: string; title: string } | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [time, setTime] = useState(new Date());
  const [calendarDate, setCalendarDate] = useState(new Date());
  const { level: batteryLevel, charging: isBatteryCharging, supported: batterySupported } = useBattery();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isLight = user.theme === 'light';
  const taskbarBg = isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 20, 20, 0.75)';
  const popoverBg = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(28, 28, 28, 0.85)';
  const textColor = isLight ? '#000' : '#fff';
  const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  // Core Apps (Explicitly Pinned)
  const coreApps = [
    { id: 'settings-1', title: 'Settings', iconName: 'settings', component: 'settings' },
    { id: 'file-explorer-1', title: 'Files', iconName: 'folder', component: 'file-explorer' },
    { id: 'notepad-1', title: 'Notepad', iconName: 'file-text', component: 'notepad' },
    { id: 'paint-1', title: 'Paint', iconName: 'image', component: 'paint' },
    { id: 'calculator-1', title: 'Calculator', iconName: 'calculator', component: 'calculator' },
  ];

  const renderIcon = (iconName: string, size = 24) => {
    const iconColor = isLight ? '#000' : '#fff';
    switch (iconName) {
      case 'settings': return <SettingsIcon size={size} color={iconColor} />;
      case 'folder': return <Folder size={size} color={iconColor} />;
      case 'calculator': return <CalculatorIcon size={size} color={iconColor} />;
      case 'calendar': return <CalendarIcon size={size} color={iconColor} />;
      case 'file-text': return <FileText size={size} color={iconColor} />;
      case 'image': return <ImageIcon size={size} color={iconColor} />;
      default: return <img src={`/icons/${iconName}.png`} style={{ width: `${size}px`, height: `${size}px`, filter: (isLight && iconName === 'chrome') ? 'none' : (isLight ? 'invert(1)' : 'none') }} alt="" onError={(e) => (e.target as any).src = '/logo.png' } />;
    }
  };

  const openWindows = windows.filter(w => w.isOpen);
  
  // Taskbar Apps: All Core Apps + Any other open windows
  const taskbarApps = [
    ...coreApps,
    ...openWindows.filter(w => !coreApps.map(c => c.id).includes(w.id)).map(w => ({
       id: w.id,
       title: w.title,
       iconName: w.icon || 'file-text',
       component: w.component || 'notepad'
    }))
  ];

  // Only show open apps in the actual taskbar bar (ONLY those with isOpen windows)
  const openInTaskbar = taskbarApps.filter(app => windows.some(w => w.id === app.id && w.isOpen));

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      {/* ─── START MENU ─── */}
      <AnimatePresence>
        {isStartMenuOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98, x: '-50%' }} animate={{ y: 0, opacity: 1, scale: 1, x: '-50%' }} exit={{ y: 20, opacity: 0, scale: 0.98, x: '-50%' }}
            style={{ position: 'fixed', bottom: '60px', left: '50%', width: '600px', height: '650px', background: popoverBg, backdropFilter: 'blur(30px)', borderRadius: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 25px 60px rgba(0,0,0,0.4)', zIndex: 9999, padding: '0', color: textColor, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
             <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                <div style={{ background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', border: 'none', marginBottom: '32px' }}>
                  <Search size={18} opacity={0.6} />
                  <input placeholder="Search apps, settings, and documents" style={{ background: 'none', border: 'none', color: 'inherit', outline: 'none', width: '100%', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, opacity: 0.8 }}>Pinned Apps</p>
                  <button style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', padding: '4px 8px', color: 'inherit', cursor: 'pointer' }}>All apps {'>'}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
                   {taskbarApps.map(app => (
                     <button
                       key={app.id}
                       onClick={() => { openWindow(app.id, app.title, app.iconName, app.component); setStartMenuOpen(false); }}
                       onContextMenu={(e) => {
                         e.preventDefault(); e.stopPropagation();
                         setContextMenu({ x: e.clientX, y: e.clientY, appId: app.id, title: app.title });
                       }}
                       style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.2s', color: 'inherit' }}
                     >
                        <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          { renderIcon(app.iconName, 36) }
                        </div>
                        <span style={{ fontSize: '11px', textAlign: 'center', fontWeight: 500 }}>{app.title}</span>
                     </button>
                   ))}
                </div>
             </div>
             <div style={{ padding: '16px 32px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>{user.username ? user.username[0].toUpperCase() : 'G'}</div>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.username}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setPowerMenuOpen(!powerMenuOpen)} style={{ background: 'none', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'inherit' }}><Power size={20} /></button>
                  <AnimatePresence>
                    {powerMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '12px', background: popoverBg, backdropFilter: 'blur(20px)', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '6px', width: '160px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 10000 }}>
                         <button onClick={() => { setIsSleeping(true); setPowerMenuOpen(false); setStartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><Moon size={16} /> Sleep</button>
                         <button onClick={() => window.location.reload()} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><RefreshCw size={16} /> Restart</button>
                         <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} />
                         <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><LogOut size={16} /> Logout</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ACTION CENTER ─── */}
      <AnimatePresence>
        {isActionCenterOpen && (
          <motion.div initial={{ y: 20, opacity: 0, x: 20 }} animate={{ y: 0, opacity: 1, x: 0 }} exit={{ y: 20, opacity: 0, x: 20 }} style={{ position: 'fixed', bottom: '60px', right: '12px', width: '320px', background: popoverBg, backdropFilter: 'blur(30px)', borderRadius: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', zIndex: 9999, overflow: 'hidden', color: textColor }}>
            {isCalendarOpen ? (
              <div style={{ padding: '24px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{calendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                   <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }}
                        style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', opacity: 0.6, cursor: 'pointer' }}
                      >
                        {'<'}
                      </button>
                      <button 
                        onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }}
                        style={{ background: 'none', border: 'none', color: 'inherit', padding: '4px', opacity: 0.6, cursor: 'pointer' }}
                      >
                        {'>'}
                      </button>
                   </div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                   {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => <div key={d} style={{ fontSize: '11px', fontWeight: 800, padding: '4px', opacity: 0.4 }}>{d}</div>)}
                   {/* Offset blank cells so day 1 lands on correct weekday (Mon=0) */}
                   {Array.from({ length: (new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => (
                     <div key={`offset-${i}`} />
                   ))}
                   {Array.from({ length: new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                     const isToday = i+1 === new Date().getDate() && calendarDate.getMonth() === new Date().getMonth() && calendarDate.getFullYear() === new Date().getFullYear();
                     return (
                      <div key={`day-${i}`} style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', background: isToday ? 'var(--accent-primary)' : 'none', color: isToday ? '#fff' : 'inherit', fontWeight: isToday ? 700 : 400 }}>
                        {i + 1}
                      </div>
                     );
                   })}
                 </div>
              </div>
            ) : (
              <div style={{ padding: '24px' }}>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '12px', marginBottom: '24px' }}><button onClick={() => updateUser({ isBrightnessSynced: !user.isBrightnessSynced })} style={{ display: 'flex', gap: '12px', padding: '12px 16px', background: user.isBrightnessSynced ? 'var(--accent-primary)' : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'), borderRadius: '12px', border: 'none', color: user.isBrightnessSynced ? '#fff' : 'inherit', cursor: 'pointer', alignItems: 'center' }}><RefreshCw size={18} /><span style={{ fontSize: '13px', fontWeight: 600 }}>Sync Brightness Across Sessions</span></button></div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}><Sun size={14} /> Brightness</div><span style={{ fontSize: '12px', opacity: 0.6 }}>{user.brightness}%</span></div><input type="range" min="10" max="100" value={user.brightness} onChange={(e) => updateUser({ brightness: parseInt(e.target.value) })} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)' }} /></div>
                    <div><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}><Volume2 size={14} /> Volume</div><span style={{ fontSize: '12px', opacity: 0.6 }}>{user.volume}%</span></div><input type="range" min="0" max="100" value={user.volume} onChange={(e) => updateUser({ volume: parseInt(e.target.value) })} style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-primary)' }} /></div>
                 </div>
                  <div style={{ marginTop: '24px', borderTop: `1px solid ${borderColor}`, paddingTop: '16px', display: 'flex', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}><BatteryIcon level={batteryLevel} charging={isBatteryCharging} size={16} /><span style={{ fontWeight: 700 }}>{batterySupported ? `${batteryLevel}%` : 'Desktop: 100%'}</span></div></div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CONTEXT MENU for Start Menu ─── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: popoverBg, backdropFilter: 'blur(10px)', border: `1px solid ${borderColor}`, borderRadius: '8px', padding: '6px', width: '180px', zIndex: 100000, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', color: textColor }}>
            <button
               onClick={() => { addDesktopIcon(contextMenu.appId); setContextMenu(null); }}
               style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Plus size={16} /> Pin to Desktop
            </button>
            <button
               onClick={() => { removeDesktopIcon(contextMenu.appId); setContextMenu(null); }}
               style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}
               onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <Trash2 size={16} /> Unpin from Desktop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '48px', background: taskbarBg, backdropFilter: 'blur(20px)', borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', zIndex: 9991, color: textColor }}>
        <div style={{ width: '200px' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => { setStartMenuOpen(!isStartMenuOpen); setActionCenterOpen(false); }} style={{ padding: '6px', borderRadius: '4px', border: 'none', background: isStartMenuOpen ? 'rgba(255,255,255,0.1)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
            <div style={{ width: '24px', height: '24px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" style={{ width: '100%', height: '100%', filter: isLight ? 'invert(1)' : 'none' }} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<div style="width:16px;height:16px;background:var(--accent-primary);border-radius:2px"></div>'; }} />
            </div>
          </button>
          {openInTaskbar.map(app => {
            const isActive = activeWindowId === app.id;
            const isOpen = windows.some(w => w.id === app.id && w.isOpen);
            return (
              <div key={app.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button onClick={() => focusWindow(app.id)} style={{ padding: '6px', borderRadius: '4px', border: 'none', background: isActive ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)') : 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  { renderIcon(app.iconName, 24) }
                </button>
                {isOpen && <div style={{ position: 'absolute', bottom: '2px', width: isActive ? '12px' : '4px', height: '3px', background: isActive ? 'var(--accent-primary)' : (isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'), borderRadius: '2px' }} />}
              </div>
            );
          })}
        </div>
        <div style={{ width: '260px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => { setActionCenterOpen(!(isActionCenterOpen && !isCalendarOpen)); setIsCalendarOpen(false); setStartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: (isActionCenterOpen && !isCalendarOpen) ? (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)') : 'none', border: 'none', color: 'inherit', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Volume2 size={16} /><Sun size={16} /><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BatteryIcon level={batteryLevel} charging={isBatteryCharging} size={16} /><span style={{ fontSize: '11px', fontWeight: 600 }}>{batterySupported ? `${batteryLevel}%` : '100%'}</span></div></div>
          </button>
          <button onClick={() => { setActionCenterOpen(!(isActionCenterOpen && isCalendarOpen)); setIsCalendarOpen(true); setStartMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', background: (isActionCenterOpen && isCalendarOpen) ? (isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)') : 'none', border: 'none', color: 'inherit', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}>
            <div style={{ textAlign: 'right', lineHeight: 1.1 }}><div style={{ fontSize: '11px', fontWeight: 600 }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div><div style={{ fontSize: '10px', opacity: 0.6 }}>{time.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' })}</div></div>
          </button>
          <div style={{ width: '4px', height: '30px', borderLeft: `1px solid ${borderColor}`, marginLeft: '4px' }} />
        </div>
      </div>
    </>
  );
};

export default Taskbar;
