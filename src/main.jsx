import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { requestPersistentStorage } from './db.js';
import './styles.css';

// Ask the phone to keep our data safe from automatic clean-up.
requestPersistentStorage();

// If a screen crashes, show the error (see index.html) instead of a blank page.
const root = createRoot(document.getElementById('root'), {
  onUncaughtError: (error) => window.showStartupError?.(error),
});

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
