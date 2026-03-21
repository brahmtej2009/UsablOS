import React, { useEffect } from 'react';
import Desktop from './os/components/Desktop';
import LoginScreen from './os/components/LoginScreen';
import { useOSStore } from './os/store/useOSStore';

function App() {
  const init = useOSStore((state) => state.init);
  const isAuthenticated = useOSStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      init();
    }
  }, [init, isAuthenticated]);

  return (
    <div className="App">
      {isAuthenticated ? <Desktop /> : <LoginScreen />}
    </div>
  );
}

export default App;
