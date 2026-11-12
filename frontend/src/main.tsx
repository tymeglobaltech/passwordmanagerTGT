import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// The CSP sent by nginx enforces require-trusted-types-for 'script' and
// permits a policy literally named 'default'. That only grants permission
// for such a policy to exist - nothing creates it automatically, so without
// this, every raw-string write to a DOM sink (innerHTML, script.src, etc.)
// is blocked outright, including ones made by third-party scripts we don't
// control (e.g. Google Identity Services on the login page).
//
// This registers a pass-through 'default' policy: it satisfies the
// enforcement requirement without sanitizing, which is the standard first
// step for an app with third-party scripts it can't rewrite. It does not
// weaken script-src/style-src/etc. - a malicious script still can't load
// unless those directives already allow its origin. It must run before any
// other code (ours or a dynamically-injected third-party script) touches a
// trusted-types-governed sink, so it stays at the top of this entry file,
// ahead of the render call.
if (window.trustedTypes?.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (html: string) => html,
    createScript: (script: string) => script,
    createScriptURL: (url: string) => url,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
