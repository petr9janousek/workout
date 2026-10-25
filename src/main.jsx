// Starting point: ask to keep our data safe, then start React.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { requestPersistentStorage } from './data/db.js';
import './styles.css';

// Ask the phone not to clean up the app's data automatically.
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
