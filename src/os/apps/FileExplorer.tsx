import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Folder, 
  FileText, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Search, 
  Edit2, 
  Image as ImageIcon,
  ChevronRight,
  Move,
  ArrowRight
} from 'lucide-react';
import { useOSStore } from '../store/useOSStore';

interface FileItem {
  id: string;
  name: string;
  type: string;
  content: string;
  parentId: string | null;
}

const FileExplorer: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allFolders, setAllFolders] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [path, setPath] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Home' }]);
  const [loading, setLoading] = useState(true);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('txt');
  const [isCreating, setIsCreating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, file: FileItem } | null>(null);
  const [isMoving, setIsMoving] = useState<FileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { openWindow, user, showDialog } = useOSStore();

  const isLight = user.theme === 'light';
  const textColor = isLight ? '#0f172a' : 'white';
  const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const hoverBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  const menuBg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 30, 30, 0.95)';

  useEffect(() => {
    fetchFiles();
  }, [currentFolderId]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('webos_token');
      // Fetch current level
      const url = currentFolderId ? `/api/files?parentId=${currentFolderId}` : '/api/files';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setFiles(data);

      // Fetch all folders for "Move to" list
      const allRes = await fetch('/api/files?all=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allRes.json();
      setAllFolders(allData.filter((f: any) => f.type === 'dir'));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateFile = async () => {
    if (!newFileName) return;
    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFileName,
          type: newFileType,
          content: '',
          parentId: currentFolderId
        })
      });
      if (res.ok) {
        setNewFileName('');
        setIsCreating(false);
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFile = (id: string, name: string) => {
    showDialog({
      type: 'confirm',
      title: 'Delete File',
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('webos_token');
          await fetch(`/api/files/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchFiles();
        } catch (e) { console.error(e); }
      }
    });
  };

  const handleMoveFile = async (targetFolderId: string | null) => {
    if (!isMoving) return;
    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch(`/api/files/${isMoving.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parentId: targetFolderId
        })
      });
      if (res.ok) {
        setIsMoving(null);
        setContextMenu(null);
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameFile = (file: FileItem) => {
    showDialog({
      type: 'prompt',
      title: 'Rename File',
      message: `Enter new name for "${file.name}":`,
      value: file.name,
      onConfirm: async (newName) => {
        if (!newName || newName === file.name) return;
        try {
          const token = localStorage.getItem('webos_token');
          await fetch(`/api/files/${file.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
          });
          fetchFiles();
        } catch(e) { console.error(e); }
      }
    });
  };

  const handleOpenFileOrFolder = (file: FileItem) => {
    if (file.type === 'dir') {
      setPath([...path, { id: file.id, name: file.name }]);
      setCurrentFolderId(file.id);
    } else if (file.type === 'txt') {
      openWindow(`notepad-${file.id}`, file.name, 'file-text', 'notepad');
    } else if (file.type === 'img' || file.name.endsWith('.img')) {
      openWindow(`paint-${file.id}`, file.name, 'image', 'paint');
    }
  };

  const navigateTo = (idx: number) => {
    const newPath = path.slice(0, idx + 1);
    setPath(newPath);
    setCurrentFolderId(newPath[idx].id);
  };

  const goBack = () => {
    if (path.length > 1) {
      navigateTo(path.length - 2);
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = e.clientX;
    let y = e.clientY;
    
    if (x + 180 > window.innerWidth) x = window.innerWidth - 180;
    if (y + 240 > window.innerHeight) y = Math.max(0, window.innerHeight - 240);

    setContextMenu({ x, y, file });
    setIsMoving(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: textColor, background: isLight ? '#f8fafc' : '#010101', position: 'relative' }} onClick={() => { setContextMenu(null); setIsMoving(null); }}>
      {/* Navigation Bar */}
      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `1px solid ${borderColor}`, background: isLight ? 'white' : 'transparent' }}>
        <button onClick={e => { e.stopPropagation(); goBack(); }} disabled={path.length <= 1} style={{ padding: '6px', borderRadius: '4px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', opacity: path.length <= 1 ? 0.3 : 1 }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, padding: '4px 8px', background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
           {path.map((p, i) => (
             <React.Fragment key={p.id || 'home'}>
               {i > 0 && <ChevronRight size={14} opacity={0.3} />}
               <button onClick={(e) => { e.stopPropagation(); navigateTo(i); }} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '13px', cursor: 'pointer', opacity: i === path.length - 1 ? 1 : 0.6, fontWeight: i === path.length - 1 ? 600 : 400 }}>
                 {p.name}
               </button>
             </React.Fragment>
           ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: isLight ? 'white' : 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`, borderRadius: '6px', padding: '4px 10px', gap: '8px' }}>
          <Search size={16} opacity={0.4} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search" 
            style={{ background: 'none', border: 'none', color: 'inherit', outline: 'none', width: '120px', fontSize: '12px' }} 
          />
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ padding: '10px 20px', display: 'flex', gap: '15px', borderBottom: `1px solid ${borderColor}`, background: isLight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.1)' }}>
        <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); setNewFileType('dir'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 10px rgba(0,120,212,0.3)' }}>
          <Plus size={16} /> New Folder
        </button>
        <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); setNewFileType('txt'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: `1px solid ${borderColor}`, color: 'inherit', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
           Text File
        </button>
        <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); setNewFileType('img'); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: `1px solid ${borderColor}`, color: 'inherit', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
           Image
        </button>
      </div>

      {/* File List */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {isCreating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--accent-primary)', borderRadius: '10px', marginBottom: '20px', color: '#fff', boxShadow: '0 8px 20px rgba(0,120,212,0.4)' }}>
             {newFileType === 'dir' ? <Folder size={20} /> : (newFileType === 'img' ? <ImageIcon size={20} /> : <FileText size={20} />)}
             <input autoFocus value={newFileName} onChange={e => setNewFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFile()} placeholder={`Enter ${newFileType === 'dir' ? 'folder' : 'file'} name...`} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', outline: 'none', flex: 1, fontSize: '13px' }} />
             <button onClick={(e) => { e.stopPropagation(); handleCreateFile(); }} style={{ background: '#fff', color: 'var(--accent-primary)', border: 'none', padding: '6px 16px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>Create</button>
             <button onClick={(e) => { e.stopPropagation(); setIsCreating(false); }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
          </div>
        )}

        {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', opacity: 0.5 }}>Loading files...</div>
        ) : filteredFiles.length === 0 && !isCreating ? (
             <div style={{ opacity: 0.4, textAlign: 'center', marginTop: '60px' }}>
               <Folder size={64} style={{ marginBottom: '15px' }} />
               <div>{searchTerm ? 'No results found' : 'This folder is empty'}</div>
             </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '15px' }}>
            {filteredFiles.map(file => (
              <div 
                key={file.id} 
                onDoubleClick={() => handleOpenFileOrFolder(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '15px 10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center', border: '1px solid transparent' }}
                onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.borderColor = borderColor; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                {file.type === 'dir' ? <Folder size={48} color="#ffd43b" fill="#ffd43b" strokeWidth={1.5} /> : (file.type === 'img' ? <ImageIcon size={48} color="#3498db" strokeWidth={1.5} /> : <FileText size={48} color="#95a5a6" strokeWidth={1.5} />)}
                <span style={{ fontSize: '12px', wordBreak: 'break-word', maxWidth: '90px', fontWeight: 500, lineHeight: 1.2 }}>{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && createPortal(
        <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, background: menuBg, border: `1px solid ${borderColor}`, borderRadius: '10px', padding: '6px', width: '180px', zIndex: 100000, boxShadow: '0 15px 40px rgba(0,0,0,0.5)', color: textColor, backdropFilter: 'blur(20px)' }} onClick={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()}>
           <button onClick={() => { handleOpenFileOrFolder(contextMenu.file); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }} onMouseEnter={e => e.currentTarget.style.background = hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
             <Edit2 size={16} /> Open
           </button>
           
           <button onClick={() => { handleRenameFile(contextMenu.file); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }} onMouseEnter={e => e.currentTarget.style.background = hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
             <Edit2 size={16} /> Rename
           </button>
           
           <div style={{ position: 'relative' }}>
             <button onClick={() => setIsMoving(contextMenu.file)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '13px' }} onMouseEnter={e => e.currentTarget.style.background = hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
               <Move size={16} /> Move to...
             </button>
             {isMoving && isMoving.id === contextMenu.file.id && (
               <div style={{ position: 'absolute', left: contextMenu.x + 180 + 180 > window.innerWidth ? '-185px' : '100%', top: 0, marginLeft: contextMenu.x + 180 + 180 > window.innerWidth ? '0' : '5px', background: menuBg, border: `1px solid ${borderColor}`, borderRadius: '10px', padding: '6px', width: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
                  <div style={{ fontSize: '11px', opacity: 0.5, padding: '5px 10px', fontWeight: 700 }}>Destinations:</div>
                  <button onClick={() => handleMoveFile(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '12px' }} onMouseEnter={e => e.currentTarget.style.background = hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'none'}><ArrowRight size={14} /> Home (Root)</button>
                  {allFolders.filter(f => f.id !== contextMenu.file.id).map(f => (
                    <button key={f.id} onClick={() => handleMoveFile(f.id)} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '8px 10px', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', borderRadius: '6px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }} onMouseEnter={e => e.currentTarget.style.background = hoverBg} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <Folder size={14} color="#ffd43b" /> {f.name}
                    </button>
                  ))}
               </div>
             )}
           </div>

           <div style={{ height: '1px', background: borderColor, margin: '4px 0' }} />
           <button onClick={() => { handleDeleteFile(contextMenu.file.id, contextMenu.file.name); setContextMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ff4757', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}>
             <Trash2 size={16} /> Delete
           </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FileExplorer;
