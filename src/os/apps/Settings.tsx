import React from 'react';
import { useOSStore } from '../store/useOSStore';

const wallpapers = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1920',
];

const Settings: React.FC<{ windowId: string }> = ({ windowId }) => {
  const { setWallpaper, user } = useOSStore();

  return (
    <div style={{ color: 'white' }}>
      <h2 style={{ marginBottom: '15px' }}>Apperance</h2>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>Choose Wallpaper</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {wallpapers.map((url, i) => (
            <div 
              key={i}
              onClick={() => setWallpaper(url)}
              style={{
                height: '80px',
                borderRadius: '8px',
                backgroundImage: `url(${url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                cursor: 'pointer',
                border: user.wallpaper === url ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            />
          ))}
        </div>
      </div>
      
      <div>
        <p style={{ fontSize: '14px', marginBottom: '10px' }}>System Info</p>
        <div className="glass-panel" style={{ padding: '10px', fontSize: '12px' }}>
            <p>OS Version: 1.0.0-beta</p>
            <p>Theme: {user.theme.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
