/* The AI Governance Debt Quadrant — a client-side self-reflection exercise.

   Framing, per Chapter 5 of the book: the quadrant is a diagnostic lens for
   portfolio decisions, not a maturity model or a scoring method. Nothing here
   is validated measurement. Every answer is self-reported, the result is a
   prompt for a conversation, and the page says so.

   Everything runs in the browser. Nothing is sent anywhere until (and unless)
   the visitor submits the email form on the result screen.

   Internal position keys (governed / reckless / stagnant / dormant) are stable
   on purpose: they are the values written to the Kit custom field
   `quadrant_result`, which existing automations read. Display labels come from
   the book's Figure 5.1 and are mapped from those keys in LABELS below — change
   labels freely, never the keys. */
(function () {
  'use strict';

  var KIT_ACTION = 'https://app.kit.com/forms/9650426/subscriptions'; // Kit form 9650426

  // ---- key -> display label (Figure 5.1) ----------------------------------
  // key        | Figure 5.1 label          | Figure 5.1 action
  // governed   | Governed value            | The target
  // reckless   | Value with exposure       | Act first
  // stagnant   | Controlled but low-value  | Review
  // dormant    | Noise or residue          | Clear out
  var LABELS = {
    governed: 'Governed value',
    reckless: 'Value with exposure',
    stagnant: 'Controlled but low-value',
    dormant: 'Noise or residue'
  };

  var KICKERS = {
    governed: 'The target',
    reckless: 'Act first',
    stagnant: 'Review',
    dormant: 'Clear out'
  };

  // Two-line forms for the SVG corner labels.
  var LABEL_LINES = {
    governed: ['GOVERNED', 'VALUE'],
    reckless: ['VALUE WITH', 'EXPOSURE'],
    stagnant: ['CONTROLLED BUT', 'LOW-VALUE'],
    dormant: ['NOISE OR', 'RESIDUE']
  };

  // ---- questions ----------------------------------------------------------
  // set: 'belief' (unscored) | 'VIS' | 'GD' | 'VV'. value: belief string or 0/1/2.
  var QUESTIONS = [
    {
      id: 'belief', set: 'belief',
      text: 'Before we start: where would you place your organisation today?',
      options: [
        { label: 'Governed value — higher production value, higher governance discipline', value: 'governed' },
        { label: 'Value with exposure — real value, controls lagging', value: 'reckless' },
        { label: 'Controlled but low-value — well controlled, not much value yet', value: 'stagnant' },
        { label: 'Noise or residue — early days, or abandoned experiments', value: 'dormant' },
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

  // Interpretations track the Figure 5.1 actions rather than asserting findings.
  var INTERP = {
    reckless: 'Higher production value, lower governance discipline. Figure 5.1 calls this the quadrant to act on first, because reliance is already forming and every week it forms further. The risk is not that a system fails today — it is that when one does, there is no audit trail, no named owner, and no rollback. Prioritise for constraint, migration, or governance.',
    governed: 'Higher production value inside demonstrated governance discipline — the target state in Figure 5.1. Protect, learn from, and scale deliberately. The honest follow-up is that this reflects what you reported about the estate you can see; the book is direct that an estate you cannot fully see is an estate you cannot govern, however complete the documentation looks.',
    stagnant: 'Higher governance discipline, lower production value. Figure 5.1 calls for review: challenge further investment, and simplify, repurpose, or retire. Control that also prevented deployment is not a governance success. The fix is calibration — a genuinely fast path for low-risk systems — not less governance.',
    dormant: 'Lower production value, lower governance discipline. Figure 5.1 calls for clearing out: retire abandoned experiments, unused features, and unjustified tools. Early days or accumulated residue — either way, deletion usually returns more than governance investment does at this stage.'
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

  // Respect the visitor's motion preference: scrollIntoView({behavior:'smooth'})
  // overrides the CSS scroll-behavior rule, so it has to be gated here too.
  function reveal(node) {
    var reduce = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
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
    reveal(flow);
  }

  // ---- scoring ------------------------------------------------------------
  /* Three self-reported sub-scores:
       VIS — estate visibility, q1-q3, range 0-6
       GD  — governance discipline, q4-q8, range 0-10
       VV  — production value, q9-q10, range 0-4

     Visibility gates the higher-governance-discipline row. Chapter 5 is explicit
     that visibility is not administrative housekeeping but the first control:
     an organisation cannot assign ownership to systems it does not know exist or
     enforce boundaries around tools it has never reviewed. So a respondent who
     reports no inventory and no detection cannot be placed in a row that claims
     demonstrated discipline, however strong the other answers are.

     Thresholds are the upper third of each range: VIS >= 4 of 6, GD >= 7 of 10,
     VV >= 3 of 4. They are conventions chosen for this exercise, not validated
     cut-points, and the result screen says so. */
  var VIS_MIN = 4;  // of 6
  var GD_MIN = 7;   // of 10
  var VV_MIN = 3;   // of 4

  function score(a) {
    a = a || answers;
    function s(id) { return typeof a[id] === 'number' ? a[id] : 0; }
    var VIS = s('q1') + s('q2') + s('q3');
    var GD = s('q4') + s('q5') + s('q6') + s('q7') + s('q8');
    var VV = s('q9') + s('q10');
    var belief = a.belief;

    var VIS_OK = VIS >= VIS_MIN;
    var GD_HIGH = GD >= GD_MIN;
    var VV_HIGH = VV >= VV_MIN;

    // Demonstrated discipline requires both the discipline answers and enough
    // visibility for those answers to cover the estate.
    var disciplined = GD_HIGH && VIS_OK;

    var computed = disciplined ? (VV_HIGH ? 'governed' : 'stagnant')
                               : (VV_HIGH ? 'reckless' : 'dormant');

    // Reported discipline that visibility does not yet support.
    var visibilityBlocked = GD_HIGH && !VIS_OK;
    // Low visibility in absolute terms — shown to everyone who scores here.
    var visibilityGap = VIS <= 2;

    var transition = (GD === 5 || GD === 6);
    var gap = belief !== 'unknown' && belief !== computed;
    // The respondent placed themselves higher than their answers support.
    var beliefGapHigh = belief === 'governed' && computed !== 'governed';

    return {
      VIS: VIS, GD: GD, VV: VV,
      VIS_MAX: 6, GD_MAX: 10, VV_MAX: 4,
      belief: belief, computed: computed,
      transition: transition,
      visibilityGap: visibilityGap,
      visibilityBlocked: visibilityBlocked,
      beliefGapHigh: beliefGapHigh,
      gap: gap
    };
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
    parts.push('<svg viewBox="0 0 560 470" role="img" aria-label="Governance Debt Quadrant. Your answers place you in: ' + LABELS[r.computed] + '" xmlns="http://www.w3.org/2000/svg">');
    parts.push('<rect x="0" y="0" width="560" height="470" fill="#F3EDDE"/>');
    // plot frame
    parts.push('<rect x="100" y="40" width="400" height="360" fill="none" stroke="' + ch + '" stroke-width="1.5"/>');
    // mid dividers
    parts.push('<line x1="300" y1="40" x2="300" y2="400" stroke="' + grid + '" stroke-width="1.5"/>');
    parts.push('<line x1="100" y1="220" x2="500" y2="220" stroke="' + grid + '" stroke-width="1.5"/>');
    // corner labels (two lines each)
    var lbl = function (x, y, anc, key) {
      var lines = LABEL_LINES[key];
      var out = '<text x="' + x + '" y="' + y + '" text-anchor="' + anc + '" font-family="Archivo, sans-serif" font-weight="700" font-size="13" letter-spacing="1.2" fill="' + ch + '">';
      out += '<tspan x="' + x + '" dy="0">' + lines[0] + '</tspan>';
      out += '<tspan x="' + x + '" dy="15">' + lines[1] + '</tspan>';
      return out + '</text>';
    };
    parts.push(lbl(490, 60, 'end', 'governed'));
    parts.push(lbl(110, 60, 'start', 'reckless'));
    parts.push(lbl(490, 371, 'end', 'stagnant'));
    parts.push(lbl(110, 371, 'start', 'dormant'));
    // axis labels
    parts.push('<text x="300" y="432" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5" fill="' + ch + '">GOVERNANCE DISCIPLINE</text>');
    parts.push('<text x="300" y="450" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="13" fill="' + muted + '">evidence and enforcement, not documentation</text>');
    parts.push('<text x="104" y="416" text-anchor="start" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + muted + '">lower</text>');
    parts.push('<text x="496" y="416" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + muted + '">higher</text>');
    parts.push('<g transform="translate(46,220) rotate(-90)">');
    parts.push('<text x="0" y="-6" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="700" font-size="13" letter-spacing="0.5" fill="' + ch + '">PRODUCTION VALUE</text>');
    parts.push('<text x="0" y="12" text-anchor="middle" font-family="Newsreader, serif" font-style="italic" font-size="13" fill="' + muted + '">measurable effect</text>');
    parts.push('</g>');
    // gap connector
    if (r.gap && r.belief && r.belief !== 'unknown') {
      var b = centerFor(r.belief), c = centerFor(r.computed);
      parts.push('<line x1="' + b.x + '" y1="' + b.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="' + amber + '" stroke-width="2" stroke-dasharray="4 5"/>');
      var mx = (b.x + c.x) / 2, my = (b.y + c.y) / 2;
      parts.push('<text x="' + mx + '" y="' + (my - 8) + '" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="' + amber + '">the distance</text>');
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
    wrap.appendChild(el('p', { class: 'quad-kicker' }, escapeHtml(KICKERS[r.computed])));
    wrap.appendChild(el('h2', { class: 'quad-headline' },
      'Your answers point to: <span class="quad-place">' + LABELS[r.computed] + '</span>'));
    if (r.transition) {
      wrap.appendChild(el('p', { class: 'quad-note' },
        '(your discipline answers sit between the two rows — the convention used here is to place low)'));
    }

    // 3. interpretation
    wrap.appendChild(el('p', { class: 'quad-interp' }, INTERP[r.computed]));

    // 4. visibility callout — shown to anyone reporting low estate visibility,
    //    whatever they believed their position was.
    if (r.visibilityGap || r.visibilityBlocked) {
      var vis = '<strong>Start with visibility.</strong> Your answers on estate visibility scored ' +
        r.VIS + ' of ' + r.VIS_MAX + '. The book treats visibility as the first control, not administrative ' +
        'housekeeping: an organisation cannot classify what it cannot find, assign ownership to systems it ' +
        'does not know exist, or enforce boundaries around tools it has never reviewed.';
      if (r.visibilityBlocked) {
        vis += ' Your control answers were strong, but they describe the systems that came through the front ' +
          'door. Until discovery covers more of the estate, those controls cannot be read as demonstrated ' +
          'discipline across it — which is why this result sits where it does.';
      }
      vis += ' A register is only as reliable as the discovery process feeding it.';
      wrap.appendChild(el('div', { class: 'quad-callout' }, vis));
    }

    // 5. belief-gap callout — unchanged logic, reworded.
    if (r.beliefGapHigh) {
      wrap.appendChild(el('div', { class: 'quad-callout quad-callout-belief' },
        '<strong>The distance is the interesting part.</strong> You placed the organisation in Governed value; ' +
        'your own answers point somewhere else. The book calls this a true claim made over too small a ' +
        'surface — real policies, real committees, real certifications, describing the part of the estate ' +
        'that came through the front door. The distance is worth discussing with the people who would have ' +
        'to defend a challenged decision.'));
    }

    // 6. honesty footer
    wrap.appendChild(el('p', { class: 'quad-honesty' },
      'This is a self-reported exercise across your estate on average, not a score, an audit, or a validated ' +
      'instrument. It has one job: to be a better starting point for a conversation than a confident sentence. ' +
      'The quadrant itself is <em>a diagnostic lens for portfolio decisions, not a maturity model or scoring ' +
      'method</em> — the book applies it system by system.'));

    // 7. email form
    wrap.appendChild(buildGate(r));

    // 8. share + retake
    var share = el('div', { class: 'quad-share' });
    var copyBtn = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Copy link to the exercise');
    copyBtn.addEventListener('click', function () {
      var url = location.origin + '/quadrant/';
      var done = function () { copyBtn.textContent = 'Link copied'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else { done(); }
    });
    share.appendChild(copyBtn);
    share.appendChild(el('p', { class: 'quad-share-note' },
      'Shares the exercise, never your result — your answers never leave your browser unless you choose to subscribe.'));
    var retake = el('button', { type: 'button', class: 'quad-retake' }, 'Start again');
    retake.addEventListener('click', function () { answers = {}; index = 0; showFlow(); renderQuestion(); });
    share.appendChild(retake);
    wrap.appendChild(share);

    flow.appendChild(wrap);
    reveal(flow);
  }

  function buildGate(r) {
    var gate = el('section', { class: 'signup quad-gate', 'aria-labelledby': 'gate-heading' });
    var inner = el('div', { class: 'signup-inner' });
    inner.appendChild(el('h2', { id: 'gate-heading' },
      'Get the ' + LABELS[r.computed] + ' edition'));
    inner.appendChild(el('p', {},
      'Your position explained, the direction of travel, the first three moves, and the full question set. ' +
      'Three pages, free. The book’s own instruments — the customer challenge test, the technical control ' +
      'test, the four prerequisites and the Chapter 11 scenario model — are on the ' +
      '<a href="/resources/">resources page</a>, no email required.'));

    var form = el('form', { class: 'signup-form', action: KIT_ACTION, method: 'post', novalidate: '', 'data-quadrant-gate': '1' });
    form.innerHTML =
      '<input type="hidden" name="fields[quadrant_result]" value="' + r.computed + '">' +
      '<input type="hidden" name="fields[quadrant_belief]" value="' + (r.belief || 'unknown') + '">' +
      '<input type="hidden" name="fields[quadrant_gap]" value="' + (r.gap ? 'true' : 'false') + '">' +
      '<label class="visually-hidden" for="gate-email">Email address</label>' +
      '<input class="signup-input" id="gate-email" type="email" name="email_address" required autocomplete="email" placeholder="you@company.com">' +
      '<button class="btn btn-primary" type="submit">Send me the ' + LABELS[r.computed] + ' edition</button>' +
      '<p class="signup-fine">By subscribing you agree to the <a href="/privacy/">privacy policy</a>. Your download starts straight away; the confirmation email is to join the list.</p>';

    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.checkValidity()) return;
      e.preventDefault();
      // Fire the subscribe in the background. no-cors means we cannot read the
      // response, so a failed subscribe is silent by design — see README.
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
      // Deliver the matching edition directly (form submit is a real user
      // gesture, so the download is allowed). The result screen stays put.
      var pdf = '/downloads/q-7f3a9c/debt-quadrant-' + r.computed + '.pdf';
      var a = document.createElement('a');
      a.href = pdf;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      try { a.click(); } catch (err) { /* manual link below */ }
      document.body.removeChild(a);
      // Replace the form with a confirmation; leave the result visible.
      gate.innerHTML =
        '<div class="signup-inner">' +
        '<h2>Your download is starting</h2>' +
        '<p>The ' + LABELS[r.computed] + ' edition is downloading now. If it didn’t start, ' +
        '<a href="' + pdf + '" download>download it here</a>. ' +
        'Check your inbox to confirm your subscription to the list.</p>' +
        '</div>';
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

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  // Test/QA hook — exposes the pure scoring + SVG builder and the label map for
  // automated checks. See scripts/test-quadrant.mjs.
  if (typeof window !== 'undefined') {
    window.QuadrantDebug = {
      score: score,
      quadrantSVG: quadrantSVG,
      QUESTIONS: QUESTIONS,
      LABELS: LABELS,
      KICKERS: KICKERS,
      thresholds: { VIS_MIN: VIS_MIN, GD_MIN: GD_MIN, VV_MIN: VV_MIN }
    };
  }
})();
