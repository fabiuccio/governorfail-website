/* Progressive enhancement for the generic email signup forms (home, essays).
   Fires the ESP subscribe in the background (email captured in Kit) and then
   sends the visitor straight to /download to get the file — delivery no longer
   depends on a Kit automation. If JS is disabled, the form does a normal POST to
   its action URL and Kit handles it. */
(function () {
  var DEST = '/download'; // generic forms deliver the full instrument
  var forms = document.querySelectorAll('.signup-form');
  forms.forEach(function (form) {
    // The /quadrant result gate has its own handler (with the result field).
    if (form.getAttribute('data-quadrant-gate')) return;
    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value || !input.checkValidity()) return; // let browser validate
      e.preventDefault();
      var action = form.getAttribute('action') || '';

      // keepalive lets the POST complete even as we navigate to /download.
      if (action.indexOf('http') === 0) {
        try {
          fetch(action, {
            method: 'POST',
            mode: 'no-cors',
            keepalive: true,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'email_address=' + encodeURIComponent(input.value)
          });
        } catch (err) { /* deliver the file regardless */ }
      }
      window.location.href = DEST;
    });
  });
})();
