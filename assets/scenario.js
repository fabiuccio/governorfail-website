/* The Chapter 11 scenario model, with its assumptions exposed.

   This is illustrative scenario logic, not a forecast, a benchmark, or an
   estimate of total cost of ownership. Appendix A documents every base-case
   value as a scenario assumption and says they should be replaced with the
   organisation's own estimates before anyone acts on them. The page says the
   same thing, prominently, because a model that hides its assumptions is the
   thing the book is arguing against.

   Two quantities are kept separate throughout, as the book insists:
     - deployment EFFORT, in cumulative person-weeks. Not elapsed calendar
       time: a governed deployment can consume less total effort and still take
       longer, if a central review or platform team becomes a bottleneck.
     - MAINTENANCE COST, in EUR per month as the estate grows.

   Base case (Appendix A):
     ungoverned effort  12, 27, 44, 63, 84, 107, 132, 159, 188, 219
     governed effort    24, 33, 42, 51, 60, 69, 78, 87, 96, 105
     ungoverned maintenance  EUR 2,500 per agent per month
     governed maintenance    EUR 5,300 fixed + EUR 500 per agent per month
*/
(function () {
  'use strict';

  var BASE = {
    // Deployment effort, person-weeks.
    ungovernedFirst: 12,       // first deployment
    ungovernedIncrement: 15,   // the second deployment adds this
    ungovernedGrowth: 2,       // each later increment rises by this
    governedFirst: 24,         // first deployment: roughly twice the ungoverned one
    governedIncrement: 9,      // each later deployment adds this, given real reuse
    deployments: 10,
    // Maintenance, EUR per month.
    ungovernedPerAgent: 2500,
    governedFixed: 5300,
    governedPerAgent: 500,
    agents: 10
  };

  /* Cumulative deployment effort.
     Ungoverned: nothing is reusable, so each increment grows.
     Governed:   a constant increment, because the foundation already exists. */
  function deploymentSeries(p) {
    p = Object.assign({}, BASE, p || {});
    var n = Math.max(1, Math.round(p.deployments));
    var ungoverned = [];
    var governed = [];
    var uTotal = 0;
    var gTotal = 0;
    for (var i = 1; i <= n; i++) {
      if (i === 1) {
        uTotal = p.ungovernedFirst;
        gTotal = p.governedFirst;
      } else {
        // Second deployment adds `ungovernedIncrement`; every later one adds
        // `ungovernedGrowth` more than the increment before it.
        uTotal += p.ungovernedIncrement + (i - 2) * p.ungovernedGrowth;
        gTotal += p.governedIncrement;
      }
      ungoverned.push(uTotal);
      governed.push(gTotal);
    }
    return { ungoverned: ungoverned, governed: governed };
  }

  /* Monthly maintenance cost at each estate size. */
  function maintenanceSeries(p) {
    p = Object.assign({}, BASE, p || {});
    var n = Math.max(1, Math.round(p.agents));
    var ungoverned = [];
    var governed = [];
    for (var i = 1; i <= n; i++) {
      ungoverned.push(p.ungovernedPerAgent * i);
      governed.push(p.governedFixed + p.governedPerAgent * i);
    }
    return { ungoverned: ungoverned, governed: governed };
  }

  /* First index (1-based) at which the governed path is no longer more
     expensive than the ungoverned one. Returns null when it does not happen
     within the range — which the book is explicit can be the honest answer. */
  function crossover(series) {
    for (var i = 0; i < series.governed.length; i++) {
      if (series.governed[i] <= series.ungoverned[i]) return i + 1;
    }
    return null;
  }

  function model(p) {
    var deployment = deploymentSeries(p);
    var maintenance = maintenanceSeries(p);
    return {
      deployment: deployment,
      maintenance: maintenance,
      deploymentCrossover: crossover(deployment),
      maintenanceCrossover: crossover(maintenance)
    };
  }

  // ---- DOM ----------------------------------------------------------------

  function fmt(n) {
    return Math.round(n).toLocaleString('en-GB');
  }

  function readInputs(root) {
    var p = {};
    var fields = root.querySelectorAll('[data-param]');
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var v = parseFloat(f.value);
      if (!isNaN(v) && v >= 0) p[f.getAttribute('data-param')] = v;
    }
    return p;
  }

  function renderTable(tbody, series, unit, count) {
    var rows = '';
    for (var i = 0; i < count; i++) {
      var u = series.ungoverned[i];
      var g = series.governed[i];
      var cls = g <= u ? ' class="is-crossed"' : '';
      rows += '<tr' + cls + '><th scope="row">' + (i + 1) + '</th>' +
        '<td>' + unit + fmt(u) + '</td>' +
        '<td>' + unit + fmt(g) + '</td>' +
        '<td>' + (g <= u ? '−' : '+') + unit + fmt(Math.abs(g - u)) + '</td></tr>';
    }
    tbody.innerHTML = rows;
  }

  function crossoverText(n, noun) {
    if (n === null) return 'No crossover in range — on these assumptions the governed path stays more expensive across every ' + noun + ' shown.';
    if (n === 1) return 'Crossover at the first ' + noun + '.';
    return 'Crossover at ' + noun + ' ' + n + ' — it is between ' + noun + ' ' + (n - 1) + ' and ' + n + ' that the lines meet.';
  }

  function init() {
    var root = document.getElementById('scenario');
    if (!root) return;

    var effortBody = root.querySelector('#effort-body');
    var maintBody = root.querySelector('#maintenance-body');
    var effortNote = root.querySelector('#effort-crossover');
    var maintNote = root.querySelector('#maintenance-crossover');
    var resetBtn = root.querySelector('#scenario-reset');

    function update() {
      var p = readInputs(root);
      var r = model(p);
      var deployments = r.deployment.ungoverned.length;
      var agents = r.maintenance.ungoverned.length;

      renderTable(effortBody, r.deployment, '', deployments);
      renderTable(maintBody, r.maintenance, '€', agents);
      effortNote.textContent = crossoverText(r.deploymentCrossover, 'deployment');
      maintNote.textContent = crossoverText(r.maintenanceCrossover, 'agent');
    }

    root.addEventListener('input', function (e) {
      if (e.target && e.target.getAttribute('data-param')) update();
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        var fields = root.querySelectorAll('[data-param]');
        for (var i = 0; i < fields.length; i++) {
          var key = fields[i].getAttribute('data-param');
          if (key in BASE) fields[i].value = BASE[key];
        }
        update();
      });
    }

    update();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }

  // Test hook — see scripts/test-scenario.mjs.
  if (typeof window !== 'undefined') {
    window.ScenarioModel = {
      BASE: BASE,
      model: model,
      deploymentSeries: deploymentSeries,
      maintenanceSeries: maintenanceSeries,
      crossover: crossover
    };
  }
})();
