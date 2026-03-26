import { useState, useEffect } from 'react';

export interface BatteryStatus {
  level: number;
  charging: boolean;
  supported: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export const useBattery = () => {
  const [battery, setBattery] = useState<BatteryStatus>({
    level: 100,
    charging: true,
    supported: false,
    chargingTime: 0,
    dischargingTime: Infinity
  });

  useEffect(() => {
    let batteryManager: any = null;

    const updateBattery = () => {
      if (batteryManager) {
        setBattery({
          level: Math.round(batteryManager.level * 100),
          charging: batteryManager.charging,
          supported: true,
          chargingTime: batteryManager.chargingTime,
          dischargingTime: batteryManager.dischargingTime
        });
      }
    };

    if ('getBattery' in (navigator as any)) {
      (navigator as any).getBattery().then((bm: any) => {
        batteryManager = bm;
        updateBattery();

        bm.addEventListener('levelchange', updateBattery);
        bm.addEventListener('chargingchange', updateBattery);
        bm.addEventListener('chargingtimechange', updateBattery);
        bm.addEventListener('dischargingtimechange', updateBattery);
      }).catch(() => {
        setBattery(prev => ({ ...prev, supported: false }));
      });
    }

    // Polling fallback for some browsers/OS that don't trigger events reliably
    const pollInterval = setInterval(() => {
      if (batteryManager) updateBattery();
    }, 10000);

    return () => {
      clearInterval(pollInterval);
      if (batteryManager) {
        batteryManager.removeEventListener('levelchange', updateBattery);
        batteryManager.removeEventListener('chargingchange', updateBattery);
        batteryManager.removeEventListener('chargingtimechange', updateBattery);
        batteryManager.removeEventListener('dischargingtimechange', updateBattery);
      }
    };
  }, []);

  return battery;
};
