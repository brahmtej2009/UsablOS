import React, { useState, useEffect } from 'react';
import { useOSStore } from '../store/useOSStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, HelpCircle, Info } from 'lucide-react';

const DialogManager: React.FC = () => {
  const { dialog, closeDialog } = useOSStore();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (dialog.isOpen) {
      setInputValue(dialog.value || '');
    }
  }, [dialog.isOpen, dialog.value]);

  const handleConfirm = () => {
    if (dialog.onConfirm) {
      dialog.onConfirm(dialog.type === 'prompt' ? inputValue : undefined);
    }
    closeDialog();
  };

  const handleCancel = () => {
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    closeDialog();
  };


  const theme = useOSStore(state => state.user.theme);
  const isLight = theme === 'light';
  const bg = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 30, 30, 0.95)';
  const textColor = isLight ? '#000' : '#fff';
  const borderColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  return (
    <AnimatePresence>
      {dialog.isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <motion.div
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0.9, opacity: 0 }}
             style={{
               width: '400px', background: bg, border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '24px', color: textColor, boxShadow: '0 30px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)'
             }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
               {dialog.type === 'alert' && <AlertCircle color="#e81123" size={24} />}
               {dialog.type === 'confirm' && <HelpCircle color="var(--accent-primary)" size={24} />}
               {dialog.type === 'prompt' && <Info color="var(--accent-primary)" size={24} />}
               <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{dialog.title}</h3>
            </div>
            
            <p style={{ fontSize: '14px', marginBottom: '20px', lineHeight: '1.5', opacity: 0.9 }}>{dialog.message}</p>

            {dialog.type === 'prompt' && (
              <input 
                autoFocus
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${borderColor}`, borderRadius: '6px', color: 'inherit', outline: 'none', marginBottom: '20px' }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                 <button onClick={handleCancel} style={{ background: 'none', border: `1px solid ${borderColor}`, color: 'inherit', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              )}
              <button onClick={handleConfirm} style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                {dialog.type === 'alert' ? 'OK' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DialogManager;
