/* Progressive enhancement for the generic email signup forms (home, essays).

   Flow: fire the ESP subscribe in the background, show the visitor an inline
   confirmation, then send them to /download/ for the file. Delivery does not
   depend on an ESP automation, which is why the form copy promises the download
   now and describes the confirmation email as joining the list rather than as a
   gate on the file.

   Trade-off, deliberate: the POST uses mode:'no-cors' because Kit's form
   endpoint sends no CORS headers, so the response is opaque and a failed
   subscribe cannot be detected here. The visitor gets the file either way. We
   prefer silent subscribe failure over withholding a download the copy just
   promised. See README, "Email capture".

   With JS disabled the form does a normal POST to its action URL and Kit
   handles it, including its own confirmation page. */
(function () {
  'use strict';

  var DEST = '/download/'; // trailing slash: vercel.json sets trailingSlash, so
                           // '/download' would cost every signup a 308 hop.
  var HANDOFF_MS = 600;    // long enough to read the confirmation line

  var forms = document.querySelectorAll('.signup-form');
  Array.prototype.forEach.call(forms, function (form) {
    // The /quadrant result screen has its own handler (it posts the extra
    // quadrant_* fields and delivers the matching edition in place).
    if (form.getAttribute('data-quadrant-gate')) return;

    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value || !input.checkValidity()) return; // let the browser validate
      e.preventDefault();

      var action = form.getAttribute('action') || '';
      // keepalive lets the POST complete even as we navigate away.
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

      // Confirm in place before handing off, so the success line is not dead
      // markup and the visitor sees that something happened.
      var success = form.querySelector('.signup-success');
      var button = form.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = 'Starting your download…';
      }
      if (success) success.hidden = false;

      window.setTimeout(function () { window.location.href = DEST; }, HANDOFF_MS);
    });
  });
})();
