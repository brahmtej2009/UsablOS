import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { useOSStore } from '../store/useOSStore';

const Notepad: React.FC<{ windowId: string }> = ({ windowId }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useOSStore();
  const fileId = windowId.replace('notepad-', '');
  const isRealFile = fileId.length > 5; // Basic check for UUID vs fallback ID

  useEffect(() => {
    if (isRealFile) {
      const load = async () => {
        const token = localStorage.getItem('webos_token');
        const res = await fetch(`http://localhost:3001/api/files/${fileId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setText(data.content);
        }
      };
      load();
    }
  }, [fileId, isRealFile]);

  useEffect(() => {
    const handleSync = (data: any) => {
      if (data.windowId === windowId) {
        setText(data.content);
      }
    };
    socket.on('notepad-sync', handleSync);
    return () => {
      socket.off('notepad-sync', handleSync);
    };
  }, [windowId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    socket.emit('notepad-update', { 
      userId: user.username, 
      windowId, 
      content: newText 
    });
  };

  const handleSave = async () => {
    if (!isRealFile) return alert('Save feature only works for files created via Explorer');
    setSaving(true);
    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch(`http://localhost:3001/api/files/${fileId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text })
      });
      if (!res.ok) alert('Failed to save file');
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
       <textarea
        value={text}
        onChange={handleChange}
        placeholder="Type something here..."
        style={{
            flex: 1,
            background: 'rgba(0,0,0,0.2)',
            color: 'white',
            border: 'none',
            outline: 'none',
            padding: '10px',
            borderRadius: '4px',
            resize: 'none',
            fontSize: '14px',
            lineHeight: '1.5'
        }}
       />
       <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleSave}
              disabled={saving}
              style={{ 
                padding: '4px 12px', 
                background: saving ? 'rgba(56, 189, 248, 0.5)' : 'var(--accent-primary)', 
                border: 'none', 
                borderRadius: '4px', 
                color: 'white', 
                cursor: saving ? 'wait' : 'pointer' 
              }}
            >
                {saving ? 'Saving...' : 'Save'}
            </button>
       </div>
    </div>
  );
};

export default Notepad;
