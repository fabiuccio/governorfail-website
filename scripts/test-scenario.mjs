/* Tests for the Chapter 11 scenario model in assets/scenario.js.

   The base case must reproduce the exact series printed in Appendix A. If these
   fail, the calculator on /resources/ is telling readers something the book
   does not.

     node scripts/test-scenario.mjs        (or: npm test)
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(ROOT, 'assets', 'scenario.js'), 'utf8');

globalThis.window = {};
globalThis.document = { readyState: 'complete', getElementById: () => null, addEventListener() {} };
new Function(src)();

const { BASE, model, deploymentSeries, maintenanceSeries, crossover } = globalThis.window.ScenarioModel;

let passed = 0;
const failures = [];

function check(name, fn) {
  try { fn(); passed++; } catch (err) { failures.push({ name, message: err.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function eqArr(actual, expected, what) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${what}:\n      expected ${e}\n      got      ${a}`);
}
function eq(actual, expected, what) {
  if (actual !== expected) throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ---- the book's printed series ------------------------------------------
// Appendix A: "The exact cumulative series plotted for deployments 1-10 is:
// ungoverned — 12, 27, 44, 63, 84, 107, 132, 159, 188, 219 person-weeks;
// governed — 24, 33, 42, 51, 60, 69, 78, 87, 96, 105 person-weeks."

check('base case reproduces the printed ungoverned deployment series', () => {
  const s = deploymentSeries();
  eqArr(s.ungoverned, [12, 27, 44, 63, 84, 107, 132, 159, 188, 219], 'ungoverned effort');
});

check('base case reproduces the printed governed deployment series', () => {
  const s = deploymentSeries();
  eqArr(s.governed, [24, 33, 42, 51, 60, 69, 78, 87, 96, 105], 'governed effort');
});

check('ungoverned increments rise by 2 from a second-deployment increment of 15', () => {
  const s = deploymentSeries();
  const increments = s.ungoverned.slice(1).map((v, i) => v - s.ungoverned[i]);
  eqArr(increments, [15, 17, 19, 21, 23, 25, 27, 29, 31], 'ungoverned increments');
});

check('governed increments are a flat 9 after the first deployment', () => {
  const s = deploymentSeries();
  const increments = s.governed.slice(1).map((v, i) => v - s.governed[i]);
  assert(increments.every((v) => v === 9), `expected all 9, got ${increments}`);
});

check('cumulative effort is roughly equal around deployment three', () => {
  const s = deploymentSeries();
  // Book: "cumulative effort is approximately equal around the third deployment"
  eq(s.governed[1] > s.ungoverned[1], true, 'governed still higher at deployment 2');
  eq(s.governed[2] < s.ungoverned[2], true, 'governed lower by deployment 3');
  eq(crossover(s), 3, 'deployment crossover');
});

check('the governed curve stays lower after crossover', () => {
  const s = deploymentSeries();
  for (let i = 2; i < s.governed.length; i++) {
    assert(s.governed[i] < s.ungoverned[i], `governed not lower at deployment ${i + 1}`);
  }
});

// ---- maintenance ---------------------------------------------------------
// Appendix A: ungoverned EUR 2,500 per agent per month; governed EUR 5,300
// fixed plus EUR 500 per agent. "The crossover occurs between the second and
// third agent."

check('base maintenance series match the stated cost structure', () => {
  const s = maintenanceSeries();
  eqArr(s.ungoverned.slice(0, 4), [2500, 5000, 7500, 10000], 'ungoverned maintenance');
  eqArr(s.governed.slice(0, 4), [5800, 6300, 6800, 7300], 'governed maintenance');
});

check('maintenance crossover falls between the second and third agent', () => {
  const s = maintenanceSeries();
  assert(s.governed[1] > s.ungoverned[1], 'governed should still cost more at 2 agents');
  assert(s.governed[2] < s.ungoverned[2], 'governed should cost less at 3 agents');
  eq(crossover(s), 3, 'maintenance crossover');
});

check('the maintenance gap widens after crossover', () => {
  const s = maintenanceSeries();
  const gaps = s.ungoverned.map((u, i) => u - s.governed[i]);
  for (let i = 3; i < gaps.length; i++) {
    assert(gaps[i] > gaps[i - 1], `gap did not widen at agent ${i + 1}`);
  }
});

// ---- sensitivity ---------------------------------------------------------
// Table 11.1: a high fixed platform cost of EUR 12,000 moves the point at which
// the two paths cost the same to 6 agents. 12,000 + 500n = 2,500n -> n = 6.

check('high platform cost of EUR 12,000 makes the paths equal at 6 agents', () => {
  const s = maintenanceSeries({ governedFixed: 12000 });
  eq(s.governed[5], s.ungoverned[5], 'costs at 6 agents should be equal');
  eq(s.governed[5], 15000, 'cost at 6 agents');
  assert(s.governed[4] > s.ungoverned[4], 'governed should still cost more at 5 agents');
  eq(crossover(s), 6, 'crossover with a EUR 12,000 platform');
});

check('a crossover can fail to occur in range, and says so', () => {
  // Enough fixed cost that ten agents is not enough to catch up.
  const s = maintenanceSeries({ governedFixed: 40000, agents: 10 });
  eq(crossover(s), null, 'crossover should be null');
  // The book is explicit that this is a real outcome, not an error state.
  const d = deploymentSeries({ governedFirst: 500, deployments: 5 });
  eq(crossover(d), null, 'deployment crossover should be null when reuse cannot pay for the start');
});

check('weak reuse moves the deployment crossover out', () => {
  // A governed increment of 14 instead of 9 - controls that are only partly reusable.
  const weak = deploymentSeries({ governedIncrement: 14 });
  const base = deploymentSeries();
  const wX = crossover(weak);
  assert(wX === null || wX > crossover(base), `weak reuse should delay or remove crossover, got ${wX}`);
});

// ---- model wiring and guards --------------------------------------------

check('model() returns both series and both crossovers', () => {
  const r = model();
  eq(r.deploymentCrossover, 3, 'deploymentCrossover');
  eq(r.maintenanceCrossover, 3, 'maintenanceCrossover');
  eq(r.deployment.ungoverned.length, 10, 'deployment length');
  eq(r.maintenance.ungoverned.length, 10, 'maintenance length');
});

check('range is adjustable and never drops below one period', () => {
  eq(deploymentSeries({ deployments: 3 }).governed.length, 3, 'three deployments');
  eq(maintenanceSeries({ agents: 1 }).governed.length, 1, 'one agent');
  eq(deploymentSeries({ deployments: 0 }).governed.length, 1, 'zero clamps to one');
});

check('base-case constants match Appendix A', () => {
  eq(BASE.ungovernedFirst, 12, 'ungoverned first deployment');
  eq(BASE.governedFirst, 24, 'governed first deployment');
  eq(BASE.ungovernedIncrement, 15, 'ungoverned second increment');
  eq(BASE.ungovernedGrowth, 2, 'ungoverned increment growth');
  eq(BASE.governedIncrement, 9, 'governed increment');
  eq(BASE.ungovernedPerAgent, 2500, 'ungoverned maintenance per agent');
  eq(BASE.governedFixed, 5300, 'governed fixed platform cost');
  eq(BASE.governedPerAgent, 500, 'governed maintenance per agent');
});

// ---- report ---------------------------------------------------------------

if (failures.length) {
  console.error(`\nscenario: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f.name}\n    ${f.message}`);
  process.exit(1);
}
console.log(`scenario: ${passed} passed`);
