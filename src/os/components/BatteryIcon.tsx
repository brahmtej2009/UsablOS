import React from 'react';
import { 
  Battery, 
  BatteryLow, 
  BatteryMedium, 
  BatteryFull, 
  BatteryCharging 
} from 'lucide-react';

interface Props {
  level: number;
  charging: boolean;
  size?: number;
  color?: string;
}

export const BatteryIcon: React.FC<Props> = ({ level, charging, size = 16, color }) => {
  if (charging) return <BatteryCharging size={size} color={color || '#2ecc71'} />;
  
  if (level > 85) return <BatteryFull size={size} color={color || '#2ecc71'} />;
  if (level > 40) return <Battery size={size} color={color} />; 
  if (level > 15) return <BatteryMedium size={size} color={color || '#f1c40f'} />;
  return <BatteryLow size={size} color={color || '#e74c3c'} />;
};
