import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, FileText } from 'lucide-react';
import { useOSStore } from '../store/useOSStore';
import { socket } from '../utils/socket';

const Notepad: React.FC<{ windowId: string }> = ({ windowId }) => {
    const fileId = windowId.startsWith('notepad-') && windowId !== 'notepad-1' ? windowId.replace('notepad-', '') : null;
    const isNewFile = !fileId;
    
    const [content, setContent] = useState('');
    const [fileName, setFileName] = useState('Untitled.txt');
    const [loading, setLoading] = useState(!!fileId);
    const [saving, setSaving] = useState(false);
    const { user, showDialog } = useOSStore();

    const isLight = user.theme === 'light';
    const textColor = isLight ? '#0f172a' : 'white';
    const inputBorder = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

    const isInternalChange = useRef(false);

    useEffect(() => {
        if (fileId) {
            loadFile();
        }

        const handleRemoteSync = (data: any) => {
          if (data.fileId === fileId && !isInternalChange.current) {
            setContent(data.content);
          }
        };

        socket.on('notepad-sync', handleRemoteSync);
        return () => { socket.off('notepad-sync', handleRemoteSync); };
    }, [fileId]);

    const loadFile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('webos_token');
            const res = await fetch(`/api/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const file = await res.json();
                setContent(file.content || '');
                setFileName(file.name);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleContentChange = (newVal: string) => {
      setContent(newVal);
      if (fileId) {
        isInternalChange.current = true;
        socket.emit('notepad-update', { fileId, content: newVal, userId: user.id });
        setTimeout(() => { isInternalChange.current = false; }, 50);
      }
    };

    const handleSave = async () => {
        if (isNewFile) {
          showDialog({
            type: 'prompt',
            title: 'Save File',
            message: 'Enter a name for your file:',
            value: fileName,
            onConfirm: (val) => {
              if (val) performSave(val);
            }
          });
        } else {
          performSave(fileName);
        }
    };

    const performSave = async (targetName: string) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('webos_token');
            if (isNewFile) {
                const res = await fetch('/api/files', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: targetName, content, type: 'txt' })
                });
                if (res.ok) {
                   showDialog({ type: 'alert', title: 'File Saved', message: `"${targetName}" has been saved to the File Manager.` });
                }
            } else {
                await fetch(`/api/files/${fileId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, name: targetName })
                });
            }
        } catch (e) {
            showDialog({ type: 'alert', title: 'Error', message: 'Failed to save file. Please try again.' });
        }
        setSaving(false);
    };

    if (loading) return <div style={{ padding: '20px', color: textColor }}>Loading document...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: textColor }}>
            {/* Toolbar */}
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 15px', 
                borderBottom: `1px solid ${inputBorder}`, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} />
                    <input 
                        value={fileName} 
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Untitled.txt"
                        style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, outline: 'none', width: '200px' }}
                    />
                </div>
                <div style={{ flex: 1 }} />
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary)', 
                        border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', opacity: saving ? 0.7 : 1 
                    }}
                >
                    <Save size={16} /> {saving ? 'Saving...' : (isNewFile ? 'Save New' : 'Save')}
                </button>
                {fileId && (
                    <button onClick={loadFile} title="Reload from server" style={{ background: 'none', border: 'none', color: textColor, padding: '4px', cursor: 'pointer', opacity: 0.6 }}>
                        <RefreshCw size={16} />
                    </button>
                )}
            </div>

            <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                style={{
                    flex: 1, border: 'none', resize: 'none', padding: '20px', 
                    background: 'transparent', color: 'inherit', fontSize: '14px', lineHeight: '1.6', 
                    fontFamily: 'Consolas, monaco, monospace', outline: 'none'
                }}
                spellCheck={false}
            />
        </div>
    );
};

export default Notepad;
