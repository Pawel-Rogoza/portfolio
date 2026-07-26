/* Runs before first paint so the page never flashes the wrong theme.
   Kept as its own file (not an inline <script>) so the CSP can stay
   script-src 'self' with no 'unsafe-inline'.

   Dark is the default: with nothing stored we set data-theme="dark" outright
   rather than leaving it to prefers-color-scheme. Only an explicit `theme auto`
   hands the decision back to the system. */
(function () {
  'use strict';
  var saved = null;
  try {
    saved = localStorage.getItem('portfolio-theme');
  } catch (e) {
    /* private mode / storage disabled — fall through to the dark default */
  }
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (saved !== 'auto') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  /* saved === 'auto' → no attribute, the prefers-color-scheme rules apply */
})();
