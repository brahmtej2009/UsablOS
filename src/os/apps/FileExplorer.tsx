import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { FileText, Plus, RefreshCw } from 'lucide-react';

interface VFSFile {
  id: string;
  name: string;
  content: string;
  type: string;
}

const FileExplorer: React.FC<{ windowId: string }> = ({ windowId }) => {
  const [files, setFiles] = useState<VFSFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFileName, setNewFileName] = useState('');
  const { openWindow } = useOSStore();

  const loadFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch('http://localhost:3001/api/files', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFiles(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch('http://localhost:3001/api/files', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newFileName, content: '', type: 'txt' })
      });
      if (res.ok) {
        setNewFileName('');
        loadFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFile = (file: VFSFile) => {
    // Open in notepad by passing the file ID or just opening notepad and letting notepad load it.
    // For now we'll pass the file ID as part of the window title/ID to trick Notepad,
    // actually it'll be better to pass initial props. Since our OS manager implies 'appId' is the window id,
    // we can use `file.id` as the window ID so Notepad can fetch it!
    openWindow(`notepad-${file.id}`, file.name, 'file-text', 'notepad');
  };

  return (
    <div style={{ color: 'white', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
        <button onClick={loadFiles} className="glass-panel-hover" style={{ background: 'none', border: 'none', color: 'white', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}>
          <RefreshCw size={16} />
        </button>
        <form onSubmit={handleCreateFile} style={{ display: 'flex', gap: '5px' }}>
          <input 
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name..."
            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
          />
          <button type="submit" style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '6px 10px', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
            <Plus size={16} />
          </button>
        </form>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', borderRadius: '8px', padding: '15px', overflowY: 'auto' }}>
        {loading ? (
          <div>Loading files...</div>
        ) : files.length === 0 ? (
          <div style={{ opacity: 0.5 }}>No files exactly. Create one!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '15px' }}>
            {files.map(f => (
              <div 
                key={f.id}
                onDoubleClick={() => handleOpenFile(f)}
                className="glass-panel-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '15px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'background 0.2s'
                }}
              >
                <FileText size={32} color="var(--accent-primary)" style={{ marginBottom: '8px' }} />
                <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{f.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
