import './polyfills';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('VitasMMA: main.tsx module loading...');

const manifestUrl = `${window.location.origin}/tonconnect-manifest.json`;
console.log('VitasMMA: Manifest URL:', manifestUrl);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('VitasMMA: Root element not found!');
} else {
  try {
    console.log('VitasMMA: Creating root and rendering...');
    const root = createRoot(rootElement);
    
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      console.log('VitasMMA: Initializing Telegram WebApp...');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      
      // Set header color to match app theme
      window.Telegram.WebApp.setHeaderColor('#0B0F19');
      window.Telegram.WebApp.setBackgroundColor('#0B0F19');
    }
    
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <TonConnectUIProvider 
            manifestUrl={manifestUrl}
            restoreConnection={true}
          >
            <App />
          </TonConnectUIProvider>
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('VitasMMA: root.render() called successfully');
  } catch (err: any) {
    console.error('VitasMMA: Render failed:', err);
  }
}
