import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource-variable/instrument-sans';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/base.css';
import './styles/sections.css';
import App from './App';

// The story always opens at the facility exterior.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(<App />);
