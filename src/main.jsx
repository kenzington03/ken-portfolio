import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import './styles/fonts.css';
import './styles/global.css';
import { startAnalytics } from './utils/track.js';
import { startBookings } from './utils/cal.js';

startAnalytics();
startBookings();

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
