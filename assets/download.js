/* /download router. Reads ?q=<position> and shows the matching edition; any
   missing/unknown value falls back to the full instrument. The gate is for email
   capture, not DRM — the paths are deliberately not tokenised. */
(function () {
  'use strict';
  var BASE = '/downloads/q-7f3a9c/';
  // Keys are the stable Kit `quadrant_result` values and must not change.
  // Display names are the book's Figure 5.1 labels — see assets/quadrant.js.
  var EDITIONS = {
    reckless: {
      file: 'debt-quadrant-reckless.pdf', name: 'Value with exposure',
      recap: 'Higher production value, lower governance discipline — the quadrant to act on first, because reliance is already forming. Prioritise for constraint, migration, or governance.'
    },
    stagnant: {
      file: 'debt-quadrant-stagnant.pdf', name: 'Controlled but low-value',
      recap: 'Higher governance discipline, lower production value. Challenge further investment; simplify, repurpose, or retire. The fix is calibration, not more process.'
    },
    dormant: {
      file: 'debt-quadrant-dormant.pdf', name: 'Noise or residue',
      recap: 'Lower value, lower discipline. Retire abandoned experiments, unused features, and unjustified tools — deletion usually returns more than governance investment at this stage.'
    },
    governed: {
      file: 'debt-quadrant-governed.pdf', name: 'Governed value',
      recap: 'Value inside demonstrated governance discipline — the target state. Protect, learn from, and scale deliberately, as far as the estate you can see goes.'
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
    if (title) title.textContent = 'Your edition: ' + ed.name;
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
