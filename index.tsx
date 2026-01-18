
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Basic polyfill for process.env in browser
if (typeof window !== 'undefined') {
  (window as any).process = { env: { ...(window as any).process?.env } };
}

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Mounting error:", error);
    rootElement.innerHTML = `<div style="color: white; padding: 20px; text-align: center;">
      <h2>Critical Load Error</h2>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
      <button onclick="window.location.reload()" style="background: #ef4444; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold;">Reload App</button>
    </div>`;
  }
}
