import { useEffect, useState } from 'react';
import { useRoute } from './lib/route';
import { Dashboard } from './screens/Dashboard';
import { ProjectDetail } from './screens/ProjectDetail';
import { Settings } from './screens/Settings';
import { TokenGate } from './components/TokenGate';
import { CommandPalette } from './components/CommandPalette';
import { getToken, onAuthChange } from './store';

export default function App() {
  const route = useRoute();
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Re-read the token whenever it changes (set on unlock, cleared on any 401).
  useEffect(() => onAuthChange(() => setTokenState(getToken())), []);

  // Global ⌘K / Ctrl+K toggles the command palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!token) return <TokenGate />;

  return (
    <>
      {route.name === 'settings' ? (
        <Settings />
      ) : route.name === 'detail' ? (
        <ProjectDetail id={route.id} tab={route.tab} highlight={route.highlight} onOpenSearch={() => setPaletteOpen(true)} />
      ) : (
        <Dashboard onOpenSearch={() => setPaletteOpen(true)} />
      )}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
