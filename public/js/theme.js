/* Runs before first paint so the page never flashes the wrong theme.
   Kept as its own file (not an inline <script>) so the CSP can stay
   script-src 'self' with no 'unsafe-inline'. */
(function () {
  'use strict';
  try {
    var saved = localStorage.getItem('portfolio-theme');
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } catch (e) {
    /* private mode / storage disabled — fall back to prefers-color-scheme */
  }
})();
