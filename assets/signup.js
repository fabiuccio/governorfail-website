/* Progressive enhancement for the email signup form.
   Submits to the ESP in the background and shows an inline success state
   instead of redirecting to a provider-branded page. If JS is disabled, the
   form falls back to a normal POST to its action URL. */
(function () {
  var forms = document.querySelectorAll('.signup-form');
  forms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var input = form.querySelector('input[type="email"]');
      if (!input || !input.value || !input.checkValidity()) return; // let browser validate
      e.preventDefault();
      var success = form.querySelector('.signup-success');
      var button = form.querySelector('button[type="submit"]');
      var action = form.getAttribute('action') || '';

      function showSuccess() {
        if (success) success.hidden = false;
        input.disabled = true;
        if (button) { button.disabled = true; button.textContent = 'Sent'; }
      }

      // Placeholder action (not yet wired): just show the success state.
      if (action.indexOf('KIT_FORM_ACTION_URL') !== -1 || !action) {
        showSuccess();
        return;
      }

      // Opaque cross-origin POST; Kit sends the double opt-in email.
      fetch(action, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email_address=' + encodeURIComponent(input.value)
      }).then(showSuccess).catch(showSuccess);
    });
  });
})();
