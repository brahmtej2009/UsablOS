import { useEffect, useRef } from 'react';
import Desktop from './os/components/Desktop';
import LoginScreen from './os/components/LoginScreen';
import DialogManager from './os/components/DialogManager';
import { useOSStore } from './os/store/useOSStore';

function App() {
  const init = useOSStore((state) => state.init);
  const checkAuth = useOSStore((state) => state.checkAuth);
  const isAuthenticated = useOSStore((state) => state.isAuthenticated);
  const theme = useOSStore((state) => state.user.theme);
  const brightness = useOSStore((state) => state.user.brightness);
  const initCalledRef = useRef(false);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'glass');
  }, [theme]);

  // Hydrate session once on mount only
  useEffect(() => {
    if (initCalledRef.current) return;
    initCalledRef.current = true;
    const authed = checkAuth();
    if (authed) {
      init();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also init when isAuthenticated flips to true (fresh login)
  const prevAuth = useRef(false);
  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      init();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, init]);

  return (
    <div className="App" style={{ filter: `brightness(${brightness}%)`, transition: 'filter 0.3s ease' }}>
      {isAuthenticated ? <Desktop /> : <LoginScreen />}
      <DialogManager />
    </div>
  );
}

export default App;
