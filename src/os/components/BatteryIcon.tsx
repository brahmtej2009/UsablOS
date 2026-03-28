import React from 'react';
import { 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull, 
  BatteryCharging,
  Zap
} from 'lucide-react';

interface Props {
  level: number;
  charging: boolean;
  size?: number;
  color?: string;
  showLevel?: boolean;
}

export const BatteryIcon: React.FC<Props> = ({ level, charging, size = 16, color, showLevel = false }) => {
  const getIcon = () => {
    // If charging, we show the charging variant or a bolt overlay
    if (charging) {
      if (level > 95) return <BatteryCharging size={size} color={color || '#2ecc71'} />;
      return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Battery size={size} color={color || '#2ecc71'} />
          <Zap size={size * 0.6} color="white" style={{ position: 'absolute', fill: 'white' }} />
        </div>
      );
    }
    
    if (level > 85) return <BatteryFull size={size} color={color || '#2ecc71'} />;
    if (level > 40) return <Battery size={size} color={color || '#fff'} />; 
    if (level > 15) return <BatteryMedium size={size} color={color || '#f1c40f'} />;
    return <BatteryLow size={size} color={color || '#e74c3c'} />;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {getIcon()}
      {showLevel && <span style={{ fontSize: '12px', fontWeight: 600 }}>{level}%</span>}
    </div>
  );
};
