/* The AI Governance Debt Quadrant — client-side self-assessment.
   Everything runs in the browser. Nothing is sent anywhere until (and unless)
   the visitor submits the email gate on the result screen. */
(function () {
  'use strict';

  var KIT_ACTION = 'https://app.kit.com/forms/9650426/subscriptions'; // Kit form 9650426

  // ---- questions ----------------------------------------------------------
  // set: 'belief' (unscored) | 'VIS' | 'GD' | 'VV'. value: belief string or 0/1/2.
  var QUESTIONS = [
    {
      id: 'belief', set: 'belief',
      text: 'Before we start: where would you place your organisation today?',
      options: [
        { label: 'Governed — high value, well controlled', value: 'governed' },
        { label: 'Reckless — creating value, controls lagging', value: 'reckless' },
        { label: 'Stagnant — well controlled, not much value yet', value: 'stagnant' },
        { label: 'Dormant — early days on both', value: 'dormant' },
        { label: 'Honestly, no idea', value: 'unknown' }
      ]
    },
    {
      id: 'q1', set: 'VIS',
      text: 'How was your AI inventory produced?',
      options: [
        { label: 'Multi-signal discovery: SSO/OAuth logs, expense data, repo scans, plus interviews', value: 2 },
        { label: 'From project registrations and procurement records', value: 1 },
        { label: "We don't have a formal AI inventory", value: 0 }
      ]
    },
    {
      id: 'q2', set: 'VIS',
      text: 'If an employee used an unapproved AI tool on company data tomorrow, would anything detect it?',
      options: [
        { label: 'Yes — technically detected (network/SSO/DLP signals)', value: 2 },
        { label: 'Only if someone reported it', value: 1 },
        { label: 'No', value: 0 }
      ]
    },
    {
      id: 'q3', set: 'VIS',
      text: 'What share of the AI actually in use does your official register cover, honestly estimated?',
      options: [
        { label: 'Above 80% — verified with discovery', value: 2 },
        { label: 'Somewhere between half and most of it', value: 1 },
        { label: 'Less than half, or we have no way to know', value: 0 }
      ]
    },
    {
      id: 'q4', set: 'GD',
      text: 'Do your material AI systems have a named, accountable business owner?',
      options: [
        { label: 'All of them — named individuals, not committees', value: 2 },
        { label: 'Some do', value: 1 },
        { label: 'Few or none', value: 0 }
      ]
    },
    {
      id: 'q5', set: 'GD',
      text: 'Are data boundaries technically enforced, or policy-only?',
      options: [
        { label: "Enforced in the architecture — the system cannot reach data it shouldn't", value: 2 },
        { label: 'Policy plus partial technical enforcement', value: 1 },
        { label: 'Policy only, or neither', value: 0 }
      ]
    },
    {
      id: 'q6', set: 'GD',
      text: 'Is behaviour monitoring active, with a defined review cadence?',
      options: [
        { label: 'Continuous monitoring, reviewed on a cadence', value: 2 },
        { label: 'Manual or intermittent checks', value: 1 },
        { label: 'No monitoring baseline', value: 0 }
      ]
    },
    {
      id: 'q7', set: 'GD',
      text: 'Is there an incident escalation path that has actually been tested?',
      options: [
        { label: 'Documented and tested', value: 2 },
        { label: 'Documented, never tested', value: 1 },
        { label: 'Neither', value: 0 }
      ]
    },
    {
      id: 'q8', set: 'GD',
      text: 'Could you reconstruct a specific AI decision — sources, version, policy applied, human review — from system telemetry, without a manual forensic exercise?',
      options: [
        { label: 'Yes, from the operating record', value: 2 },
        { label: 'Partially — some of it, with effort', value: 1 },
        { label: 'No', value: 0 }
      ]
    },
    {
      id: 'q9', set: 'VV',
      text: 'For your top AI systems: can you attribute a quantified contribution to a business KPI, with a stated methodology?',
      options: [
        { label: 'Yes — numbers and methodology', value: 2 },
        { label: 'Anecdotal or estimated value only', value: 1 },
        { label: 'No', value: 0 }
      ]
    },
    {
      id: 'q10', set: 'VV',
      text: 'What does your board/executive reporting on AI actually show?',
      options: [
        { label: 'Outcome metrics — cost, time, revenue, risk, attributed', value: 2 },
        { label: 'Activity metrics — tools deployed, pilots running, training done', value: 1 },
        { label: 'There is no regular AI reporting', value: 0 }
      ]
    }
  ];

  var NAMES = { governed: 'Governed', reckless: 'Reckless', stagnant: 'Stagnant', dormant: 'Dormant' };

  var INTERP = {
    reckless: 'Real value, thin control. This is where most high-impact shadow AI lives. The risk is not that a system fails today — it’s that when one does, there’s no audit trail, no owner, no rollback. The technical failure is recoverable; the organisational overcorrection that follows usually costs more than governance would have.',
    governed: 'Value inside an enforced frame — the target state. The honest follow-up: this result reflects your answers about your ‘known’ estate. If your visibility answers were weak, the systems you don’t know about are not in this dot.',
    stagnant: 'Control without output. Governance succeeded so thoroughly at preventing risk that it also prevented deployment. The fix is not less governance — it’s calibrated governance: a genuinely fast path for low-risk systems.',
    dormant: 'Little value, little control. Early days — or an estate full of abandoned pilots. Either way, the highest-return first move is usually deletion, not governance investment.'
  };

  // ---- state --------------------------------------------------------------
  var answers = {};   // id -> value
  var index = 0;
  var intro, flow;

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---- rendering ----------------------------------------------------------
  function renderQuestion() {
    var q = QUESTIONS[index];
    flow.innerHTML = '';

    var pct = Math.round((index / QUESTIONS.length) * 100);
    var prog = el('div', { class: 'quad-progress' });
    prog.appendChild(el('div', { class: 'quad-progress-label' },
      'Question ' + (index + 1) + ' of ' + QUESTIONS.length));
    var bar = el('div', { class: 'quad-progress-bar' });
    bar.appendChild(el('span', { style: 'width:' + pct + '%' }));
    prog.appendChild(bar);
    flow.appendChild(prog);

    var card = el('div', { class: 'quad-question' });
    card.appendChild(el('h2', { class: 'quad-qtext' }, escapeHtml(q.text)));

    var opts = el('div', { class: 'quad-options', role: 'group' });
    q.options.forEach(function (opt) {
      var selected = answers[q.id] === opt.value;
      var b = el('button', {
        type: 'button',
        class: 'quad-option' + (selected ? ' is-selected' : ''),
        'aria-pressed': selected ? 'true' : 'false'
      }, escapeHtml(opt.label));
      b.addEventListener('click', function () {
        answers[q.id] = opt.value;
        if (index < QUESTIONS.length - 1) { index++; renderQuestion(); }
        else { renderResult(); }
      });
      opts.appendChild(b);
    });
    card.appendChild(opts);
    flow.appendChild(card);

    var nav = el('div', { class: 'quad-nav' });
    if (index > 0) {
      var back = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Back');
      back.addEventListener('click', function () { index--; renderQuestion(); });
      nav.appendChild(back);
    }
    flow.appendChild(nav);
    flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- scoring ------------------------------------------------------------
  function score(a) {
    a = a || answers;
    function s(id) { return typeof a[id] === 'number' ? a[id] : 0; }
    var VIS = s('q1') + s('q2') + s('q3');
    var GD = s('q4') + s('q5') + s('q6') + s('q7') + s('q8');
    var VV = s('q9') + s('q10');
    var belief = a.belief;
    var GD_HIGH = GD >= 7;
    var VV_HIGH = VV >= 3;
    var computed = GD_HIGH ? (VV_HIGH ? 'governed' : 'stagnant')
                           : (VV_HIGH ? 'reckless' : 'dormant');
    var transition = (GD === 5 || GD === 6);
    var misdiagnosis = (belief === 'governed' && computed !== 'governed')
                    || (VIS <= 2 && belief === 'governed');
    var gap = belief !== 'unknown' && belief !== computed;
    return { VIS: VIS, GD: GD, VV: VV, belief: belief, computed: computed,
             transition: transition, misdiagnosis: misdiagnosis, gap: gap };
  }

  // ---- quadrant SVG -------------------------------------------------------
  function centerFor(pos) {
    // plot x 100..500 (mid 300), y 40..400 (mid 220); region centres
    var x = (pos === 'governed' || pos === 'stagnant') ? 400 : 200;
    var y = (pos === 'governed' || pos === 'reckless') ? 130 : 310;
    return { x: x, y: y };
  }

  function quadrantSVG(r) {
    var ch = '#2B2B2B', amber = '#D99A2B', grid = '#D9CFBE', muted = '#5A5A5A';
    var parts = [];
    parts.push('<svg viewBox="0 0 560 470" role="img" aria-label="Governance Debt Quadrant, your position: ' + NAMES[r.computed] + '" xmlns="http://www.w3.org/2000/svg">');
    parts.push('<rect x="0" y="0" width="560" height="470" fill="#F3EDDE"/>');
    // plot frame
    parts.push('<rect x="100" y="40" width="400" height="360" fill="none" stroke="' + ch + '" stroke-width="1.5"/>');
    // mid dividers
    parts.push('<line x1="300" y1="40" x2="300" y2="400" stroke="' + grid + '" stroke-width="1.5"/>');
    parts.push('<line x1="100" y1="220" x2="500" y2="220" stroke="' + grid + '" stroke-width="1.5"/>');
    // corner labels
    var lbl = function (x, y, anc, t) {
      return '<text x="' + x + '" y="' + y + '" text-anchor="' + anc + '" font-family="Archivo, sans-serif" font-weight="700" font-size="16" letter-spacing="1.5" fill="' + ch + '">' + t + '</text>';
    };
    parts.push(lbl(490, 62, 'end', 'GOVERNED'));
    parts.push(lbl(110, 62, 'start', 'RECKLESS'));
    parts.push(lbl(490, 388, 'end', 'STAGNANT'));
    parts.push(lbl(110, 388, 'start', 'DORMANT'));
    // axis labels
    parts.push('<text x="300" y="432" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5" fill="' + ch + '">GOVERNANCE DISCIPLINE</text>');
    parts.push('<text x="300" y="450" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="13" fill="' + muted + '">evidence and enforcement</text>');
    parts.push('<text x="104" y="416" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + muted + '">low</text>');
    parts.push('<text x="496" y="416" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + muted + '">high</text>');
    parts.push('<g transform="translate(46,220) rotate(-90)">');
    parts.push('<text x="0" y="-6" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5" fill="' + ch + '">VALUE VELOCITY</text>');
    parts.push('<text x="0" y="12" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="13" fill="' + muted + '">attributable, quantified value</text>');
    parts.push('</g>');
    // gap connector
    if (r.gap && r.belief && r.belief !== 'unknown') {
      var b = centerFor(r.belief), c = centerFor(r.computed);
      parts.push('<line x1="' + b.x + '" y1="' + b.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="' + amber + '" stroke-width="2" stroke-dasharray="4 5"/>');
      var mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2;
      parts.push('<text x="' + mx + '" y="' + (my - 8) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + amber + '">the gap</text>');
    }
    // belief dot (hollow)
    if (r.belief && r.belief !== 'unknown') {
      var bp = centerFor(r.belief);
      parts.push('<circle cx="' + bp.x + '" cy="' + bp.y + '" r="11" fill="#F3EDDE" stroke="' + ch + '" stroke-width="2"/>');
      parts.push('<text x="' + bp.x + '" y="' + (bp.y + 30) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + muted + '">you said</text>');
    }
    // computed dot (solid amber)
    var cp = centerFor(r.computed);
    parts.push('<circle cx="' + cp.x + '" cy="' + cp.y + '" r="11" fill="' + amber + '" stroke="' + ch + '" stroke-width="1.5"/>');
    parts.push('<text x="' + cp.x + '" y="' + (cp.y - 20) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" fill="' + ch + '">your answers</text>');
    parts.push('</svg>');
    return parts.join('');
  }

  // ---- result -------------------------------------------------------------
  function renderResult() {
    var r = score();
    flow.innerHTML = '';
    var wrap = el('div', { class: 'quad-result' });

    // 1. figure
    var fig = el('figure', { class: 'quad-figure' });
    fig.innerHTML = quadrantSVG(r);
    wrap.appendChild(fig);

    // 2. headline
    var head = '<span class="quad-place">' + NAMES[r.computed] + '</span>';
    var h = el('h2', { class: 'quad-headline' }, 'Your answers place you in: ' + head);
    wrap.appendChild(h);
    if (r.transition) {
      wrap.appendChild(el('p', { class: 'quad-note' },
        '(your discipline score sits in the transition zone — the honest convention is to plot low)'));
    }

    // 3. interpretation
    wrap.appendChild(el('p', { class: 'quad-interp' }, INTERP[r.computed]));

    // 4. misdiagnosis callout
    if (r.misdiagnosis) {
      wrap.appendChild(el('div', { class: 'quad-callout' },
        '<strong>The gap is the finding.</strong> You placed yourself in Governed; your answers — especially on estate visibility — don’t support it yet. This pattern has a name: the Bureaucratic misdiagnosis. Real policies, real committees, real certifications — describing a fraction of the AI actually running.'));
    }

    // 5. honesty footer
    wrap.appendChild(el('p', { class: 'quad-honesty' },
      'This is a screening result across your estate on average. The instrument proper is applied <em>per system</em> — that’s what your edition of the full instrument covers.'));

    // 6. email gate
    wrap.appendChild(buildGate(r));

    // 7. share + retake
    var share = el('div', { class: 'quad-share' });
    var copyBtn = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Copy link to the assessment');
    copyBtn.addEventListener('click', function () {
      var url = location.origin + '/quadrant/';
      var done = function () { copyBtn.textContent = 'Link copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else { done(); }
    });
    share.appendChild(copyBtn);
    share.appendChild(el('p', { class: 'quad-share-note' },
      'Shares the assessment, never your result — your answers never leave your browser until you choose to subscribe.'));
    var retake = el('button', { type: 'button', class: 'quad-retake' }, 'Retake the assessment');
    retake.addEventListener('click', function () { answers = {}; index = 0; showFlow(); renderQuestion(); });
    share.appendChild(retake);
    wrap.appendChild(share);

    flow.appendChild(wrap);
    flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function buildGate(r) {
    var gate = el('section', { class: 'signup quad-gate', 'aria-labelledby': 'gate-heading' });
    var inner = el('div', { class: 'signup-inner' });
    inner.appendChild(el('h2', { id: 'gate-heading' },
      'Get the ' + NAMES[r.computed] + ' edition'));
    inner.appendChild(el('p', {},
      'Your position explained, the direction of travel, the first three moves, and the full scoring instrument. Three pages, free.'));

    var form = el('form', { class: 'signup-form', action: KIT_ACTION, method: 'post', novalidate: '', 'data-quadrant-gate': '1' });
    form.innerHTML =
      '<input type="hidden" name="fields[quadrant_result]" value="' + r.computed + '">' +
      '<input type="hidden" name="fields[quadrant_belief]" value="' + (r.belief || 'unknown') + '">' +
      '<input type="hidden" name="fields[quadrant_gap]" value="' + (r.gap ? 'true' : 'false') + '">' +
      '<label class="visually-hidden" for="gate-email">Email address</label>' +
      '<input class="signup-input" id="gate-email" type="email" name="email_address" required autocomplete="email" placeholder="you@company.com">' +
      '<button class="btn btn-primary" type="submit">Send me the ' + NAMES[r.computed] + ' edition</button>' +
      '<p class="signup-fine">By subscribing you agree to the <a href="/privacy/">privacy policy</a>. Double opt-in — you’ll confirm by email.</p>' +
      '<p class="signup-success" role="status" hidden>Check your inbox to confirm — your edition arrives right after.</p>';

    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.checkValidity()) return;
      e.preventDefault();
      // Fire the subscribe in the background (keepalive survives navigation),
      // then deliver the matching edition directly via /download.
      if (KIT_ACTION.indexOf('http') === 0) {
        var body = 'email_address=' + encodeURIComponent(input.value) +
          '&fields[quadrant_result]=' + r.computed +
          '&fields[quadrant_belief]=' + (r.belief || 'unknown') +
          '&fields[quadrant_gap]=' + (r.gap ? 'true' : 'false');
        try {
          fetch(KIT_ACTION, { method: 'POST', mode: 'no-cors', keepalive: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body });
        } catch (err) { /* deliver the file regardless */ }
      }
      window.location.href = '/download?q=' + encodeURIComponent(r.computed);
    });

    inner.appendChild(form);
    gate.appendChild(inner);
    return gate;
  }

  // ---- boot ---------------------------------------------------------------
  function showFlow() {
    if (intro) intro.hidden = true;
    flow.hidden = false;
  }

  function init() {
    intro = document.getElementById('quad-intro');
    flow = document.getElementById('quad-flow');
    var start = document.getElementById('quad-start');
    if (!flow || !start) return;
    start.addEventListener('click', function () { showFlow(); index = 0; renderQuestion(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Test/QA hook — exposes the pure scoring + SVG builder for automated checks.
  if (typeof window !== 'undefined') {
    window.QuadrantDebug = { score: score, quadrantSVG: quadrantSVG, QUESTIONS: QUESTIONS };
  }
})();
