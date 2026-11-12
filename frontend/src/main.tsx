import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// The default Trusted Types policy required by our CSP is registered in
// public/trusted-types-init.js, loaded via a <script> tag in index.html
// BEFORE this module. It can't live here: ES module imports (including the
// App import above, which transitively imports react-hot-toast) evaluate
// before this file's own top-level code runs, and react-hot-toast's styling
// library writes to a DOM sink at import time, not at render time - so by
// the time any code here would run, it's already too late.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
