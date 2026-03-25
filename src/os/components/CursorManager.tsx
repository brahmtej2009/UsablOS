import React from 'react';
import { useOSStore } from '../store/useOSStore';
import { MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CursorManager: React.FC = () => {
  const remoteCursors = useOSStore((state) => state.remoteCursors);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 999999 }}>
      <AnimatePresence>
        {Object.entries(remoteCursors).map(([id, info]) => (
          <motion.div
            key={id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: info.x, y: info.y }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '2px',
            }}
          >
            <MousePointer2 
              size={18} 
              fill="var(--accent-primary)" 
              stroke="white" 
              strokeWidth={2} 
              style={{ transform: 'rotate(-90deg)' }}
            />
            <div style={{
              background: 'var(--accent-primary)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}>
              {info.username}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CursorManager;
