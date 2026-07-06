/* /download router. Reads ?q=<position> and shows the matching edition; any
   missing/unknown value falls back to the full instrument. The gate is for email
   capture, not DRM — the paths are deliberately not tokenised. */
(function () {
  'use strict';
  var BASE = '/downloads/q-7f3a9c/';
  var EDITIONS = {
    reckless: {
      file: 'debt-quadrant-reckless.pdf', name: 'Reckless',
      recap: 'Real value, thin control — high-impact AI running ahead of the evidence, ownership, and rollback that would make it defensible.'
    },
    stagnant: {
      file: 'debt-quadrant-stagnant.pdf', name: 'Stagnant',
      recap: 'Control without output — governance so cautious it also prevented deployment. The fix is calibration, not more process.'
    },
    dormant: {
      file: 'debt-quadrant-dormant.pdf', name: 'Dormant',
      recap: 'Little value, little control — early days or abandoned pilots. The highest-return first move is usually deletion.'
    },
    governed: {
      file: 'debt-quadrant-governed.pdf', name: 'Governed',
      recap: 'Value inside an enforced frame — the target state, as far as your ‘known’ estate goes.'
    }
  };
  var FULL = { file: 'ai-governance-debt-quadrant-full.pdf' };

  function param() {
    try { return (new URLSearchParams(location.search)).get('q'); }
    catch (e) { return null; }
  }

  var app = document.getElementById('download-app');
  if (!app) return;
  var q = (param() || '').toLowerCase();
  var ed = EDITIONS[q];

  var title = app.querySelector('.section-title');
  var recap = app.querySelector('.download-recap');
  var link = app.querySelector('#download-link');
  var href;

  if (ed) {
    href = BASE + ed.file;
    if (title) title.textContent = 'The ' + ed.name + ' edition';
    if (recap) recap.textContent = ed.recap;
    if (link) link.textContent = 'Download the ' + ed.name + ' edition (PDF)';
  } else {
    href = BASE + FULL.file;
  }

  if (link) {
    link.setAttribute('href', href);
    link.setAttribute('download', ''); // force save rather than open in-tab
    var note = document.createElement('p');
    note.className = 'download-auto';
    note.textContent = 'Your download should start automatically. If it does not, use the button above.';
    link.parentNode.insertBefore(note, link.nextSibling);
    // Auto-start (same-origin download attribute; the button is the fallback).
    try { link.click(); } catch (e) { /* button remains */ }
  }
})();
