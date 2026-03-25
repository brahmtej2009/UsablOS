import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Eraser, 
  Minus, 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Slash,
  Trash2
} from 'lucide-react';
import { useOSStore } from '../store/useOSStore';
import { socket } from '../utils/socket';

type Tool = 'pencil' | 'eraser' | 'rect' | 'circle' | 'line' | 'text';

const Paint: React.FC<{ windowId: string }> = ({ windowId }) => {
  const fileId = windowId.startsWith('paint-') && windowId !== 'paint-1' ? windowId.replace('paint-', '') : null;
  const isNewFile = !fileId;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const [loading, setLoading] = useState(!!fileId);
  const [saving, setSaving] = useState(false);
  const { user, showDialog } = useOSStore();
  
  const isLight = user.theme === 'light';
  const textColor = isLight ? '#0f172a' : 'white';
  const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const toolbarBg = isLight ? 'rgba(255,255,255,0.8)' : 'rgba(20,20,20,0.8)';

  useEffect(() => {
    if (!fileId) initCanvas();

    const handlePaintSync = (data: any) => {
      if (data.fileId === fileId && data.userId !== user.id) {
        remoteDraw(data);
      }
    };

    socket.on('paint-sync', handlePaintSync);
    return () => { socket.off('paint-sync', handlePaintSync); };
  }, [fileId]);

  useEffect(() => {
    if (fileId) loadImage();
  }, [fileId]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const loadImage = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('webos_token');
      const res = await fetch(`/api/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const file = await res.json();
        if (file && file.content && file.content.startsWith('data:image')) {
          const img = new Image();
          img.onload = () => {
             const canvas = canvasRef.current;
             if (canvas) {
               const ctx = canvas.getContext('2d');
               if (ctx) {
                 ctx.clearRect(0,0, canvas.width, canvas.height);
                 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
               }
             }
             setLoading(false);
          };
          img.onerror = () => {
            initCanvas();
            setLoading(false);
          };
          img.src = file.content;
        } else {
             initCanvas();
             setLoading(false);
        }
      } else {
        initCanvas();
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      initCanvas();
      setLoading(false);
    }
  };

  const getCoordinates = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoordinates(e);
    setStartPos(coords);
    setIsDrawing(true);

    if (tool === 'pencil' || tool === 'eraser') {
      localDraw(coords.x, coords.y, true);
    } else if (tool === 'text') {
      showDialog({
        type: 'prompt',
        title: 'Add Text',
        message: 'Enter text to place on canvas:',
        onConfirm: (text) => {
          if (text) {
             localDrawText(coords.x, coords.y, text);
          }
          setIsDrawing(false);
        },
        onCancel: () => setIsDrawing(false)
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);

    if (tool === 'pencil' || tool === 'eraser') {
      localDraw(coords.x, coords.y, false);
    } else {
      drawPreview(coords.x, coords.y);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || tool === 'text') return;
    setIsDrawing(false);
    
    const coords = getCoordinates(e);
    if (tool !== 'pencil' && tool !== 'eraser') {
      localDrawShape(startPos.x, startPos.y, coords.x, coords.y);
    }

    const previewCanvas = previewCanvasRef.current;
    const pCtx = previewCanvas?.getContext('2d');
    pCtx?.clearRect(0,0, previewCanvas!.width, previewCanvas!.height);
  };

  const localDraw = (x: number, y: number, isStart: boolean) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const drawColor = tool === 'eraser' ? '#ffffff' : color;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = drawColor;

    if (isStart) { ctx.beginPath(); ctx.moveTo(x, y); }
    else { ctx.lineTo(x, y); ctx.stroke(); }
    emitUpdate({ type: 'pencil', x, y, color: drawColor, brushSize, isStart });
  };

  const localDrawShape = (x1: number, y1: number, x2: number, y2: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    drawShape(ctx, tool, x1, y1, x2, y2);
    emitUpdate({ type: 'shape', tool, x1, y1, x2, y2, color, brushSize });
  };

  const localDrawText = (x: number, y: number, text: string) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = `${brushSize * 4}px Segoe UI`;
    ctx.fillText(text, x, y);
    emitUpdate({ type: 'text', x, y, text, color, brushSize });
  };

  const drawShape = (ctx: CanvasRenderingContext2D, t: string, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    if (t === 'rect') ctx.rect(x1, y1, x2 - x1, y2 - y1);
    else if (t === 'circle') {
      const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    } else if (t === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  };

  const drawPreview = (x: number, y: number) => {
    const pCtx = previewCanvasRef.current?.getContext('2d');
    if (!pCtx) return;
    pCtx.clearRect(0, 0, previewCanvasRef.current!.width, previewCanvasRef.current!.height);
    pCtx.strokeStyle = color;
    pCtx.setLineDash([5, 5]);
    pCtx.lineWidth = 1;
    drawShape(pCtx, tool, startPos.x, startPos.y, x, y);
    pCtx.setLineDash([]);
  };

  const emitUpdate = (data: any) => {
    if (fileId) socket.emit('paint-update', { fileId, ...data, userId: user.id });
  };

  const remoteDraw = (data: any) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (data.type === 'pencil') {
      ctx.lineWidth = data.brushSize; ctx.strokeStyle = data.color; ctx.lineCap = 'round';
      if (data.isStart) { ctx.beginPath(); ctx.moveTo(data.x, data.y); }
      else { ctx.lineTo(data.x, data.y); ctx.stroke(); }
    } else if (data.type === 'shape') {
      ctx.lineWidth = data.brushSize; ctx.strokeStyle = data.color;
      drawShape(ctx, data.tool, data.x1, data.y1, data.x2, data.y2);
    } else if (data.type === 'text') {
      ctx.fillStyle = data.color; ctx.font = `${data.brushSize * 4}px Segoe UI`;
      ctx.fillText(data.text, data.x, data.y);
    }
  };

  const handleSave = async () => {
    if (isNewFile) {
      // New file — ask for a name first
      showDialog({
        type: 'prompt',
        title: 'Save Drawing',
        message: 'Enter a name for your drawing:',
        value: `Drawing_${Date.now()}.img`,
        onConfirm: async (val) => {
          if (!val) return;
          setSaving(true);
          const dataUrl = canvasRef.current?.toDataURL('image/png');
          try {
            const token = localStorage.getItem('webos_token');
            await fetch('/api/files', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: val, content: dataUrl, type: 'img' })
            });
            showDialog({ type: 'alert', title: 'Saved', message: `"${val}" saved to Files!` });
          } catch (e) {
            showDialog({ type: 'alert', title: 'Error', message: 'Failed to save drawing.' });
          }
          setSaving(false);
        }
      });
    } else {
      // Existing file — save silently without asking for a name
      setSaving(true);
      const dataUrl = canvasRef.current?.toDataURL('image/png');
      try {
        const token = localStorage.getItem('webos_token');
        await fetch(`/api/files/${fileId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: dataUrl })
        });
        showDialog({ type: 'alert', title: 'Saved', message: 'Drawing saved successfully!' });
      } catch (e) {
        showDialog({ type: 'alert', title: 'Error', message: 'Failed to save drawing.' });
      }
      setSaving(false);
    }
  };

  const handleClear = () => {
    showDialog({
      type: 'confirm',
      title: 'Clear Canvas',
      message: 'Are you sure you want to discard your drawing?',
      onConfirm: () => initCanvas()
    });
  };

  const ToolBtn = ({ t, icon: Icon }: { t: Tool, icon: any }) => (
    <button 
      onClick={() => setTool(t)}
      style={{ 
        background: tool === t ? 'var(--accent-primary)' : 'transparent',
        border: 'none', color: tool === t ? 'white' : textColor,
        padding: '8px', borderRadius: '6px', cursor: 'pointer', display: 'flex'
      }}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: textColor, background: isLight ? '#f1f5f9' : '#0a0a0a' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px 15px', borderBottom: `1px solid ${borderColor}`, background: toolbarBg, backdropFilter: 'blur(10px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px', paddingRight: '15px', borderRight: `1px solid ${borderColor}` }}>
          <ToolBtn t="pencil" icon={Pencil} />
          <ToolBtn t="eraser" icon={Eraser} />
          <ToolBtn t="rect" icon={Square} />
          <ToolBtn t="circle" icon={CircleIcon} />
          <ToolBtn t="line" icon={Slash} />
          <ToolBtn t="text" icon={Type} />
        </div>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ padding: 0, border: 'none', width: '28px', height: '28px', background: 'none', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
          <Minus size={14} />
          <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '80px', accentColor: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '11px', width: '30px', opacity: 0.6 }}>{brushSize}px</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={handleClear} style={{ background: 'none', border: 'none', color: textColor, padding: '8px', cursor: 'pointer', opacity: 0.6 }} title="Clear"><Trash2 size={18} /></button>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div style={{ flex: 1, padding: '40px', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
         {loading && (
             <div style={{ position: 'absolute', opacity: 0.8, zIndex: 10, background: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '8px' }}>Loading...</div>
         )}
         <div style={{ position: 'relative', width: '800px', height: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', opacity: loading ? 0 : 1, transition: 'opacity 0.2s' }}>
             <canvas ref={canvasRef} width={800} height={600} style={{ position: 'absolute', top: 0, left: 0, background: '#fff', borderRadius: '4px' }} />
             <canvas
               ref={previewCanvasRef}
               width={800}
               height={600}
               onMouseDown={handleMouseDown}
               onMouseMove={handleMouseMove}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               style={{ position: 'absolute', top: 0, left: 0, cursor: tool === 'text' ? 'text' : 'crosshair' }}
             />
         </div>
      </div>
    </div>
  );
};

export default Paint;
