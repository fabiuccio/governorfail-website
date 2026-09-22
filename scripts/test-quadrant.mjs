/* Tests for the Debt Quadrant scorer in assets/quadrant.js.

   No framework: the browser file is an IIFE that publishes its pure functions
   on window.QuadrantDebug, so the harness stubs window/document, evaluates the
   file, and asserts against the exported scorer.

     node scripts/test-quadrant.mjs        (or: npm test)
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(ROOT, 'assets', 'quadrant.js'), 'utf8');

// Minimal stubs: the module only touches these at load time.
globalThis.window = {};
globalThis.document = { readyState: 'complete', getElementById: () => null, addEventListener() {} };
new Function(src)();

const { score, quadrantSVG, QUESTIONS, LABELS, KICKERS, thresholds } = globalThis.window.QuadrantDebug;

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push({ name, message: err.message });
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function eq(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* Answer builders. VIS = q1..q3 (0-6), GD = q4..q8 (0-10), VV = q9..q10 (0-4). */
const ZERO = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 };
const VIS_MAX = { q1: 2, q2: 2, q3: 2 };
const GD_MAX = { q4: 2, q5: 2, q6: 2, q7: 2, q8: 2 };
const VV_MAX = { q9: 2, q10: 2 };

const answers = (...parts) => Object.assign({ belief: 'unknown' }, ZERO, ...parts);

// ---- the bug this suite exists for --------------------------------------
// Visibility must gate the higher-governance-discipline row. Before v2.0 a
// respondent reporting no inventory, no detection and no register coverage
// was still told "Governed".

check('VIS=0 with max GD and VV, belief=reckless -> not governed, visibility callout', () => {
  const r = score(answers(GD_MAX, VV_MAX, { belief: 'reckless' }));
  eq(r.VIS, 0, 'VIS');
  eq(r.GD, 10, 'GD');
  eq(r.VV, 4, 'VV');
  assert(r.computed !== 'governed', `expected not governed, got ${r.computed}`);
  eq(r.computed, 'reckless', 'computed');
  assert(r.visibilityGap, 'visibilityGap should be set at VIS=0');
  assert(r.visibilityBlocked, 'visibilityBlocked should be set: GD is high but VIS is not');
});

check('VIS=0 with max GD and VV, belief=governed -> not governed, visibility callout', () => {
  const r = score(answers(GD_MAX, VV_MAX, { belief: 'governed' }));
  assert(r.computed !== 'governed', `expected not governed, got ${r.computed}`);
  eq(r.computed, 'reckless', 'computed');
  assert(r.visibilityGap, 'visibilityGap should be set at VIS=0');
  assert(r.visibilityBlocked, 'visibilityBlocked should be set');
  assert(r.beliefGapHigh, 'beliefGapHigh should be set when belief=governed but computed is not');
  assert(r.gap, 'gap should be set when belief differs from computed');
});

check('VIS max, GD max, VV max -> governed, no visibility callout', () => {
  const r = score(answers(VIS_MAX, GD_MAX, VV_MAX, { belief: 'governed' }));
  eq(r.VIS, 6, 'VIS');
  eq(r.computed, 'governed', 'computed');
  assert(!r.visibilityGap, 'visibilityGap should not be set at VIS=6');
  assert(!r.visibilityBlocked, 'visibilityBlocked should not be set');
  assert(!r.gap, 'gap should not be set when belief matches computed');
});

// ---- every quadrant is reachable ----------------------------------------

check('all four quadrants are reachable', () => {
  const reached = {
    governed: score(answers(VIS_MAX, GD_MAX, VV_MAX)).computed,
    stagnant: score(answers(VIS_MAX, GD_MAX)).computed,
    reckless: score(answers(VIS_MAX, VV_MAX)).computed,
    dormant: score(answers()).computed
  };
  for (const [want, got] of Object.entries(reached)) eq(got, want, `quadrant ${want}`);
});

// ---- threshold boundaries ------------------------------------------------

check('VIS threshold is exact: 3 blocks the discipline row, 4 admits it', () => {
  // VIS 3 = one question at 2 plus one at 1
  const visThree = score(answers({ q1: 2, q2: 1 }, GD_MAX, VV_MAX));
  eq(visThree.VIS, 3, 'VIS');
  eq(visThree.computed, 'reckless', 'VIS=3 must not reach governed');

  const visFour = score(answers({ q1: 2, q2: 2 }, GD_MAX, VV_MAX));
  eq(visFour.VIS, 4, 'VIS');
  eq(visFour.computed, 'governed', 'VIS=4 should reach governed');
  assert(!visFour.visibilityBlocked, 'VIS=4 should not be blocked');
});

check('GD threshold is exact: 6 blocks the discipline row, 7 admits it', () => {
  const gdSix = score(answers(VIS_MAX, { q4: 2, q5: 2, q6: 2 }, VV_MAX));
  eq(gdSix.GD, 6, 'GD');
  eq(gdSix.computed, 'reckless', 'GD=6 must not reach governed');
  assert(gdSix.transition, 'GD=6 is in the transition band');

  const gdSeven = score(answers(VIS_MAX, { q4: 2, q5: 2, q6: 2, q7: 1 }, VV_MAX));
  eq(gdSeven.GD, 7, 'GD');
  eq(gdSeven.computed, 'governed', 'GD=7 should reach governed');
  assert(!gdSeven.transition, 'GD=7 is past the transition band');
});

check('VV threshold is exact: 2 gives the low-value column, 3 the high', () => {
  const vvTwo = score(answers(VIS_MAX, GD_MAX, { q9: 1, q10: 1 }));
  eq(vvTwo.VV, 2, 'VV');
  eq(vvTwo.computed, 'stagnant', 'VV=2 with high discipline is stagnant');

  const vvThree = score(answers(VIS_MAX, GD_MAX, { q9: 2, q10: 1 }));
  eq(vvThree.VV, 3, 'VV');
  eq(vvThree.computed, 'governed', 'VV=3 with high discipline is governed');
});

check('low visibility with low discipline still raises the visibility callout', () => {
  const r = score(answers(VV_MAX, { belief: 'reckless' }));
  eq(r.computed, 'reckless', 'computed');
  assert(r.visibilityGap, 'visibilityGap should be set at VIS=0 regardless of discipline');
  assert(!r.visibilityBlocked, 'visibilityBlocked only applies when GD is high');
});

check('visibility callout fires for every belief, not just governed', () => {
  for (const belief of ['governed', 'reckless', 'stagnant', 'dormant', 'unknown']) {
    const r = score(answers(GD_MAX, VV_MAX, { belief }));
    assert(r.visibilityGap, `visibilityGap missing for belief=${belief}`);
    assert(r.computed !== 'governed', `belief=${belief} reached governed with VIS=0`);
  }
});

// ---- belief-gap logic is preserved ---------------------------------------

check('belief gap: unknown never counts as a gap', () => {
  const r = score(answers(VIS_MAX, GD_MAX, VV_MAX, { belief: 'unknown' }));
  assert(!r.gap, 'unknown belief must not set gap');
  assert(!r.beliefGapHigh, 'unknown belief must not set beliefGapHigh');
});

check('belief gap: matching belief and result is not a gap', () => {
  const r = score(answers({ belief: 'dormant' }));
  eq(r.computed, 'dormant', 'computed');
  assert(!r.gap, 'matching belief must not set gap');
});

check('belief gap: mismatch sets gap without implying direction', () => {
  const r = score(answers(VIS_MAX, GD_MAX, VV_MAX, { belief: 'dormant' }));
  eq(r.computed, 'governed', 'computed');
  assert(r.gap, 'mismatched belief should set gap');
  assert(!r.beliefGapHigh, 'beliefGapHigh is only for belief=governed');
});

// ---- labels and keys -----------------------------------------------------

check('display labels match the book Figure 5.1, keys unchanged', () => {
  eq(LABELS.governed, 'Governed value', 'governed label');
  eq(LABELS.reckless, 'Value with exposure', 'reckless label');
  eq(LABELS.stagnant, 'Controlled but low-value', 'stagnant label');
  eq(LABELS.dormant, 'Noise or residue', 'dormant label');
  eq(KICKERS.governed, 'The target', 'governed action');
  eq(KICKERS.reckless, 'Act first', 'reckless action');
  eq(KICKERS.stagnant, 'Review', 'stagnant action');
  eq(KICKERS.dormant, 'Clear out', 'dormant action');
  // The Kit field values are the keys, not the labels.
  eq(Object.keys(LABELS).sort().join(','), 'dormant,governed,reckless,stagnant', 'position keys');
});

check('every computed value is a valid Kit quadrant_result key', () => {
  const valid = new Set(Object.keys(LABELS));
  const combos = [answers(), answers(VIS_MAX, GD_MAX, VV_MAX), answers(VV_MAX), answers(VIS_MAX, GD_MAX)];
  for (const a of combos) assert(valid.has(score(a).computed), `invalid key: ${score(a).computed}`);
});

// ---- question set integrity ---------------------------------------------

check('question set is 1 belief question plus 10 scored across VIS/GD/VV', () => {
  eq(QUESTIONS.length, 11, 'question count');
  const bySet = QUESTIONS.reduce((acc, q) => ((acc[q.set] = (acc[q.set] || 0) + 1), acc), {});
  eq(bySet.belief, 1, 'belief questions');
  eq(bySet.VIS, 3, 'VIS questions');
  eq(bySet.GD, 5, 'GD questions');
  eq(bySet.VV, 2, 'VV questions');
  for (const q of QUESTIONS) {
    if (q.set === 'belief') continue;
    const vals = q.options.map((o) => o.value).sort();
    eq(vals.join(','), '0,1,2', `option values for ${q.id}`);
  }
});

check('thresholds are the documented upper-third cut-points', () => {
  eq(thresholds.VIS_MIN, 4, 'VIS_MIN');
  eq(thresholds.GD_MIN, 7, 'GD_MIN');
  eq(thresholds.VV_MIN, 3, 'VV_MIN');
});

// ---- SVG ------------------------------------------------------------------

check('SVG renders the book labels and both axis names', () => {
  const svg = quadrantSVG(score(answers(VIS_MAX, GD_MAX, VV_MAX, { belief: 'dormant' })));
  for (const frag of ['GOVERNED', 'VALUE WITH', 'CONTROLLED BUT', 'NOISE OR', 'GOVERNANCE DISCIPLINE', 'PRODUCTION VALUE']) {
    assert(svg.includes(frag), `SVG missing "${frag}"`);
  }
  assert(!/VALUE VELOCITY/.test(svg), 'SVG still carries the invented "value velocity" axis');
  assert(svg.includes('Governed value'), 'SVG aria-label should name the position');
});

// ---- report ---------------------------------------------------------------

if (failures.length) {
  console.error(`\nquadrant: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f.name}\n    ${f.message}`);
  process.exit(1);
}
console.log(`quadrant: ${passed} passed`);
