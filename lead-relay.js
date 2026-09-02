(function () {
  var EP = 'https://script.google.com/macros/s/AKfycbwCA2IDYAkb5Dcp9nWHCdJvBnRZtbb8p0MzFYA8eZ9Bc3gy9Hq435PZZWInNi3HeVpTNQ/exec';
  var TIMEOUT = 25000;
  var orig = window.fetch.bind(window);

  /* Both entry points are equal choices, so the type-it-in option carries its
     own colour rather than reading as a footnote under the photo option. */
  (function () {
    var s = document.createElement('style');
    s.textContent =
      '#pickType{background:#C2410C;color:#fff;border:none;font-weight:700;font-size:17px;padding:15px}' +
      '#pickType small{color:#fff;opacity:.9}' +
      '#salWrap{display:flex;gap:8px}' +
      '#salSel{flex:0 0 96px}';
    (document.head || document.documentElement).appendChild(s);
  }());

  /* A visitor who is a doctor or a professor expects to be addressed as one,
     and asking is the only honest way to know: a greeting must never be
     guessed from a name. */
  var TITLES = ['Dr.', 'Prof.', 'Mr.', 'Ms.', 'Mrs.'];

  function addTitle() {
    if (document.getElementById('salSel')) { return true; }
    var input = document.querySelector('input[name=name]');
    if (!input || !input.parentElement) { return false; }
    var sel = document.createElement('select');
    sel.id = 'salSel';
    sel.setAttribute('aria-label', 'Title');
    var blank = document.createElement('option');
    blank.value = '';
    blank.textContent = '—';
    sel.appendChild(blank);
    TITLES.forEach(function (t) {
      var op = document.createElement('option');
      op.value = t;
      op.textContent = t;
      sel.appendChild(op);
    });
    var wrap = document.createElement('span');
    wrap.id = 'salWrap';
    input.parentElement.insertBefore(wrap, input);
    wrap.appendChild(sel);
    wrap.appendChild(input);
    return true;
  }
  if (!addTitle()) {
    document.addEventListener('DOMContentLoaded', addTitle);
    var tries = 0;
    var iv = setInterval(function () { if (addTitle() || ++tries > 20) { clearInterval(iv); } }, 300);
  }

  /* The honorific rides on the name itself, so the sheet, the alert and the
     greeting all carry it without a second field to keep in step. */
  function titled(n) {
    var sel = document.getElementById('salSel');
    var t = sel ? sel.value : '';
    n = String(n == null ? '' : n).trim();
    if (!t || !n || /^(dr|prof|professor|mr|mrs|ms|miss)\b/i.test(n)) { return n; }
    return t + ' ' + n;
  }

  function copy(o, body) {
    var c = {}, k;
    for (k in o) { if (k !== 'signal') { c[k] = o[k]; } }
    if (body != null) { c.body = body; }
    return c;
  }

  window.fetch = function (u, o) {
    try {
      if (typeof u === 'string' && u.indexOf('formsubmit.co') > -1 && o && typeof o.body === 'string') {
        var m = JSON.parse(o.body);
        m.Name = titled(m.Name);
        var fallbackOpts = copy(o, JSON.stringify(m));
        var p = { name: m.Name, company: m.Company, title: m.Title, mobile: m.Mobile,
          email: m.email, city: m.City, website: m.Website, interests: m.Interests,
          notes: m.Notes, event: m.Event, pref: m['Preferred contact'], lang: m['Form language'] };
        var ctrl = new AbortController();
        var tmo = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        return orig(EP, { method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) })
          .then(function (r) { clearTimeout(tmo); return r.json(); })
          .then(function (j) {
            if (!j || j.result !== 'ok') { throw new Error('relay declined'); }
            return new Response(JSON.stringify({ success: 'true' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          })
          .catch(function () { clearTimeout(tmo); return orig(u, fallbackOpts); });
      }
    } catch (e) { }
    return orig(u, o);
  };
}());
