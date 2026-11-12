// Registers a pass-through 'default' Trusted Types policy as early as
// possible - before the app bundle (and the third-party code it imports,
// such as react-hot-toast's goober styling library, which calls a
// DOM-sink-writing innerHTML assignment at MODULE IMPORT time, not when a
// toast is shown) ever runs.
//
// This has to be its own <script> tag loaded ahead of the bundle in
// index.html rather than code inside the bundle itself: ES module imports
// evaluate in dependency order before the importing module's own top-level
// code, so anything placed inside src/main.tsx - no matter how early in that
// file - still runs after every module it (transitively) imports has
// already been evaluated. A separate, earlier <script> tag is the only way
// to guarantee this runs first.
//
// This is a pass-through policy (it does not sanitize), which is the
// standard first step for an app with third-party scripts it can't rewrite.
// It does not weaken script-src/style-src/etc. - a script still can't load
// unless those directives already allow its origin.
(function () {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('default', {
      createHTML: function (html) { return html; },
      createScript: function (script) { return script; },
      createScriptURL: function (url) { return url; },
    });
  }
})();
