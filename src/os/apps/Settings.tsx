import React, { useState } from 'react';
import { useOSStore } from '../store/useOSStore';
import { 
  Palette, 
  Info, 
  ChevronRight, 
  Monitor
} from 'lucide-react';

const WALLPAPERS = [
  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1920', label: 'Abstract Bloom' },
  { url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=1920', label: 'Aurora' },
  { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1920', label: 'Neon Flow' },
  { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920', label: 'Gradient' },
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=1920', label: 'Mountains' },
  { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1920', label: 'Night Sky' },
  { url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1920', label: 'Galaxy' },
  { url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=1920', label: 'Bokeh' },
];

const THEMES: { id: string; label: string; accent: string; preview: string }[] = [
  { id: 'glass',    label: 'Glass',    preview: 'linear-gradient(135deg, #0f172a, #1e293b)', accent: '#38bdf8' },
  { id: 'dark',     label: 'Dark',     preview: 'linear-gradient(135deg, #09090b, #18181b)', accent: '#8b5cf6' },
  { id: 'midnight', label: 'Midnight', preview: 'linear-gradient(135deg, #020617, #0f172a)', accent: '#34d399' },
  { id: 'aero',     label: 'Aero',     preview: 'linear-gradient(135deg, #1a1a2e, #0f3460)',  accent: '#4cc9f0' },
  { id: 'light',    label: 'Light',    preview: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', accent: '#2563eb' },
];


type SettingsPage = 'personalization' | 'display' | 'about';

const Settings: React.FC<{ windowId: string }> = () => {
  const { updateUser, setIsSleeping, user } = useOSStore();
  const [page, setPage] = useState<SettingsPage>('personalization');

  const navItems: { id: SettingsPage; label: string; icon: React.ReactNode }[] = [
    { id: 'personalization', label: 'Personalization',  icon: <Palette size={16} /> },
    { id: 'display',         label: 'Display',          icon: <Monitor size={16} /> },
    { id: 'about',           label: 'About',            icon: <Info size={16} /> },
  ];

  const isLight = user.theme === 'light';
  const text = isLight ? '#0f172a' : 'white';
  const subText = isLight ? '#475569' : 'rgba(255,255,255,0.55)';
  const sectionBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const sectionBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)';
  const navActiveBg = isLight ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.08)';

  return (
    <div style={{ display: 'flex', height: '100%', color: text, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: '200px', flexShrink: 0,
        borderRight: `1px solid ${sectionBorder}`,
        padding: '12px 8px',
        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontSize: '11px', color: subText, marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          System
        </p>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '10px', padding: '9px 10px', borderRadius: '8px', border: 'none',
              background: page === item.id ? navActiveBg : 'transparent',
              color: page === item.id ? 'var(--accent-primary)' : text,
              cursor: 'pointer', fontSize: '13px', fontWeight: page === item.id ? 500 : 400,
              marginBottom: '2px', transition: 'background 0.12s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (page !== item.id) e.currentTarget.style.background = sectionBg; }}
            onMouseLeave={e => { if (page !== item.id) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.icon}
              {item.label}
            </div>
            {page === item.id && <ChevronRight size={12} />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        
        {/* ── PERSONALIZATION ── */}
        {page === 'personalization' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Personalization</h1>
            
            <h3 style={{ fontSize: '15px', marginBottom: '14px', fontWeight: 600 }}>Theme</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateUser({ theme: t.id as any })}
                  style={{
                    width: '110px', borderRadius: '10px', overflow: 'hidden',
                    border: user.theme === t.id ? `2px solid ${t.accent}` : `2px solid transparent`,
                    background: 'transparent', cursor: 'pointer', padding: 0,
                    boxShadow: user.theme === t.id ? `0 0 12px ${t.accent}55` : 'none',
                    transition: 'border 0.15s, box-shadow 0.15s',
                  }}
                >
                  <div style={{ height: '65px', background: t.preview, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', bottom: '8px', left: '8px', right: '8px',
                      height: '18px', borderRadius: '4px',
                      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                    }} />
                  </div>
                  <div style={{ padding: '7px 8px', background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: 500, color: text, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.accent }} />
                    {t.label}
                  </div>
                </button>
              ))}
            </div>

            <h3 style={{ fontSize: '15px', marginBottom: '6px', fontWeight: 600 }}>Screensaver</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {['particles', 'nebula', 'matrix', 'bubbles'].map(type => (
                <button
                  key={type}
                  onClick={() => updateUser({ screensaverType: type as any })}
                  style={{
                    padding: '12px', borderRadius: '8px', border: user.screensaverType === type ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsSleeping(true)}
              style={{ 
                marginTop: '16px', padding: '10px 20px', borderRadius: '8px', 
                border: 'none', background: 'var(--accent-primary)', color: '#fff', 
                cursor: 'pointer', fontWeight: 600, width: '100%' 
              }}
            >
              Preview Screensaver
            </button>
            <div style={{ marginBottom: '28px' }} /> {/* Add margin bottom to separate from next section */}

            <h3 style={{ fontSize: '15px', marginBottom: '14px', fontWeight: 600 }}>Wallpaper</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {WALLPAPERS.map((wp, i) => (
                <button
                  key={i}
                  onClick={() => updateUser({ wallpaper: wp.url })}
                  style={{
                    borderRadius: '8px', overflow: 'hidden', border: 'none', padding: 0, cursor: 'pointer',
                    outline: user.wallpaper === wp.url ? `3px solid var(--accent-primary)` : '3px solid transparent',
                  }}
                >
                  <div style={{ height: '70px', backgroundImage: `url(${wp.url})`, backgroundSize: 'cover' }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── DISPLAY ── */}
        {page === 'display' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>Display</h1>
            <div style={{ background: sectionBg, border: `1px solid ${sectionBorder}`, borderRadius: '12px', padding: '16px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Brightness Sync</div>
                    <div style={{ fontSize: '12px', color: subText }}>Mirror brightness across all open sessions</div>
                  </div>
                  <button 
                    onClick={() => updateUser({ isBrightnessSynced: !user.isBrightnessSynced })}
                    style={{ 
                      width: '40px', height: '20px', borderRadius: '10px', 
                      background: user.isBrightnessSynced ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', 
                      border: 'none', position: 'relative', cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ 
                      width: '14px', height: '14px', borderRadius: '50%', background: '#fff', 
                      position: 'absolute', top: '3px', 
                      left: user.isBrightnessSynced ? '23px' : '3px',
                      transition: 'left 0.2s'
                    }} />
                  </button>
               </div>
               <div style={{ height: '1px', background: sectionBorder, margin: '16px 0' }} />
               <p style={{ fontSize: '13px', color: subText }}>Screen resolution and other display metrics are managed by your browser.</p>
               <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>Resolution</div>
                  <div style={{ fontSize: '12px', color: subText }}>{window.innerWidth} x {window.innerHeight}</div>
               </div>
            </div>
          </div>
        )}

        {/* ── ABOUT ── */}
        {page === 'about' && (
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>About</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--accent-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                 <span style={{ color: 'white', fontSize: '32px', fontWeight: 800 }}>U</span>
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>UsablOS</h2>
                <p style={{ fontSize: '13px', color: subText, margin: 0 }}>Version 1.0.0</p>
              </div>
            </div>
            <div style={{ background: sectionBg, border: `1px solid ${sectionBorder}`, borderRadius: '12px', overflow: 'hidden' }}>
              {[
                ['Developer', 'brahmtejsawhney'],
                ['Discord', '@brahmtejplaysmc'],
                ['Licence', 'MIT'],
                ['Architecture', 'Real-time Synchronized'],
                ['Engine', 'Next.js + Socket.IO'],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${sectionBorder}` }}>
                  <span style={{ fontSize: '13px', color: subText }}>{l}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
