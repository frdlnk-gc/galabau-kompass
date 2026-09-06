/* =====================================================================
   GaLaBau Kompass · gemeinsames Script v2
   Masthead (zweizeilig, Ressorts, Suche, Drawer), Footer, Logo v2,
   Slider, Archiv (Suche/Filter/Sortierung), Kommentare, Meistgelesen,
   Abo-Formular, Teilen, Tracking, Offline-Puffer.
   Alle Pfade relativ (data-depth am body).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = {
    site: 'GaLaBau Kompass',
    apiBase: 'https://gc-tracking-dashboard.vercel.app/api/public/kompass',
    liveHosts: /(^|\.)galabau-kompass\.de$/i,
    previewHosts: /github\.io$|vercel\.app$/i,
    ressorts: [
      ['betrieb-personal', 'Betrieb & Personal'], ['recht-tarif', 'Recht & Tarif'], ['technik-digital', 'Technik & Digital'], ['bauen-pflanzen', 'Bauen & Pflanzen'],
      ['markt-politik', 'Markt & Politik'], ['sicherheit-gesundheit', 'Sicherheit & Gesundheit'], ['karriere', 'Karriere & Weiterbildung'], ['messe-termine', 'Messe & Termine']
    ],
    hauptleiste: 5
  };
  var depth = (document.body.getAttribute('data-depth') || '0') | 0;
  var ROOT = depth === 0 ? './' : new Array(depth + 1).join('../');
  var IS_LIVE = CFG.liveHosts.test(location.hostname), IS_PREVIEW = CFG.previewHosts.test(location.hostname), IS_LOCAL = !IS_LIVE && !IS_PREVIEW;
  window.KOMPASS_ENV = IS_LIVE ? 'live' : (IS_PREVIEW ? 'preview' : 'local');
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function deDate(iso) { var d = new Date(iso); return d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear(); }

  /* ── Logo v2: Kompassrose mit Blatt-Nadel ── */
  function logoSvg(opts) {
    opts = opts || {};
    var ticks = '';
    for (var i = 0; i < 16; i++) { var big = i % 4 === 0; ticks += '<path class="tick" d="M32 ' + (big ? '2' : '3') + 'v' + (big ? '3.6' : '2') + '" transform="rotate(' + (i * 22.5) + ' 32 32)"/>'; }
    var pts = '';
    ['E', 'S', 'W'].forEach(function (d, k) { pts += '<path class="pt" d="M32 32L34.4 30 32 12.5 29.6 30Z" transform="rotate(' + ((k + 1) * 90) + ' 32 32)"/>'; });
    [45, 135, 225, 315].forEach(function (r) { pts += '<path class="pt s" d="M32 32L33.6 30.4 32 19 30.4 30.4Z" transform="rotate(' + r + ' 32 32)"/>'; });
    var mark = '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-o" cx="32" cy="32" r="30"/><circle class="ring-i" cx="32" cy="32" r="24.6"/>' + ticks + pts +
      '<path class="leaf" d="M32 8.2C39.4 15.4 41 24.6 32.6 31.6L32 32.2 31.4 31.6C23 24.6 24.6 15.4 32 8.2Z"/><path class="rib" d="M32 11.5V30.5"/><circle class="hub" cx="32" cy="32" r="2.4"/></svg>';
    var text = opts.word === false ? '' : '<span class="logo-word">GaLaBau <i>Kompass</i></span>';
    return '<a class="logo' + (opts.size === 'lg' ? ' lg' : '') + '" href="' + ROOT + '" aria-label="GaLaBau Kompass – Startseite">' + mark + text + '</a>';
  }
  window.kompassLogo = logoSvg;

  /* ── Masthead / Footer ── */
  var SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var SVG_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  function isActive(href) { var p = location.pathname.replace(/index\.html$/, ''); return p.indexOf('/' + href) > -1; }
  function renderHeader(el) {
    var d = new Date();
    var haupt = CFG.ressorts.slice(0, CFG.hauptleiste).map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/"' + (isActive('ressort/' + r[0]) ? ' class="active"' : '') + '>' + r[1] + '</a>'; }).join('');
    var mehr = CFG.ressorts.slice(CFG.hauptleiste).map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/">' + r[1] + '</a>'; }).join('') +
      '<div class="trenn"></div><a href="' + ROOT + 'artikel/">Alle Artikel</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'ueber-uns/">Über uns</a>';
    var top = '<div class="masthead-top"><div class="container"><span class="datum"><b>' + TAGE[d.getDay()] + '</b>, ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear() + '</span>' +
      '<nav aria-label="Service"><a href="' + ROOT + 'ausgaben/">Aktuelle Ausgabe</a><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'abo/">Ausgabe per E-Mail</a></nav></div></div>';
    var main = '<div class="masthead"><div class="container">' + logoSvg() +
      '<nav class="haupt" aria-label="Ressorts">' + haupt + '<div class="mehr"><button type="button" aria-haspopup="true" aria-expanded="false">Mehr ▾</button><div class="mehr-menu">' + mehr + '</div></div></nav>' +
      '<div class="rechts"><a class="btn sm abo-btn" href="' + ROOT + 'abo/">Ausgabe per E-Mail</a><button type="button" class="such-btn" aria-label="Suche öffnen">' + SVG_SEARCH + '</button><button type="button" class="nav-toggle" aria-label="Menü öffnen">' + SVG_MENU + '</button></div></div>' +
      '<div class="suchleiste"><div class="container"><form role="search" action="' + ROOT + 'artikel/" method="get"><input type="search" class="input" name="q" placeholder="Suchbegriff, z. B. Tarif, Bagger, Azubi" aria-label="Suche"><button type="submit" class="btn sm">Suchen</button></form></div></div></div>';
    var drawer = '<div class="drawer" aria-hidden="true"><div class="scrim"></div><div class="panel"><div class="panel-kopf">' + logoSvg() + '<button type="button" class="schliessen" aria-label="Menü schließen">×</button></div>' +
      '<form role="search" action="' + ROOT + 'artikel/" method="get" class="suche"><input type="search" class="input" name="q" placeholder="Suchen …" aria-label="Suche"><button type="submit" class="btn sm">Los</button></form>' +
      '<div class="gruppe"><h4>Ressorts</h4>' + CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/">' + r[1] + '</a>'; }).join('') + '</div>' +
      '<div class="gruppe"><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Artikel</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'abo/">Ausgabe per E-Mail</a><a href="' + ROOT + 'ueber-uns/">Über uns</a></div>' +
      '<div class="gruppe"><h4>Service</h4><a class="cta" href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a></div></div></div>';
    el.innerHTML = top + main + drawer;
    var mehrEl = el.querySelector('.mehr'), mehrBtn = mehrEl.querySelector('button');
    mehrBtn.addEventListener('click', function () { var open = mehrEl.classList.toggle('open'); mehrBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
    document.addEventListener('click', function (e) { if (!mehrEl.contains(e.target)) mehrEl.classList.remove('open'); });
    var such = el.querySelector('.suchleiste');
    el.querySelector('.such-btn').addEventListener('click', function () { var open = such.classList.toggle('open'); if (open) setTimeout(function () { such.querySelector('input').focus(); }, 50); });
    var dr = el.querySelector('.drawer');
    function openDrawer(o) { dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', o ? 'false' : 'true'); document.body.style.overflow = o ? 'hidden' : ''; }
    el.querySelector('.nav-toggle').addEventListener('click', function () { openDrawer(true); });
    dr.querySelector('.schliessen').addEventListener('click', function () { openDrawer(false); });
    dr.querySelector('.scrim').addEventListener('click', function () { openDrawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { openDrawer(false); such.classList.remove('open'); } });
  }
  function renderFooter(el) {
    el.className = 'site-footer';
    el.innerHTML = '<div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' + logoSvg() + '<p>Das Online-Magazin für Inhaber, Führungskräfte und Fachkräfte im Garten- und Landschaftsbau. Zahlen, Einordnung und Praxis – jeden Monat als Ausgabe, jede Woche neue Beiträge.</p></div>' +
      '<div><h4>Ressorts</h4>' + CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/">' + r[1] + '</a>'; }).join('') + '</div>' +
      '<div><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Artikel</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'abo/">Ausgabe per E-Mail</a><a href="' + ROOT + 'ueber-uns/">Über uns</a><a href="mailto:redaktion@galabau-kompass.de">Redaktion kontaktieren</a></div>' +
      '<div><h4>Service &amp; Rechtliches</h4><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'impressum/">Impressum</a><a href="' + ROOT + 'datenschutz/">Datenschutz</a></div>' +
      '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' GaLaBau Kompass · Das Magazin für den Garten- und Landschaftsbau</span><span>galabau-kompass.de</span></div></div>';
  }

  /* ── Session, Parameter, Tracking, Offline-Puffer ── */
  function uuidv4() { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }
  var sessionId = (function () { try { var s = sessionStorage.getItem('kompass_session'); if (!s) { s = uuidv4(); sessionStorage.setItem('kompass_session', s); } return s; } catch (e) { return uuidv4(); } })();
  var params = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { params[k] = v; }); } catch (e) {}
  ['src', 'v', 'k'].forEach(function (k) { try { if (params[k]) sessionStorage.setItem('kompass_' + k, params[k]); else if (sessionStorage.getItem('kompass_' + k)) params[k] = sessionStorage.getItem('kompass_' + k); } catch (e) {} });
  window.KOMPASS = { cfg: CFG, root: ROOT, env: window.KOMPASS_ENV, sessionId: sessionId, params: params, uuid: uuidv4, esc: esc, deDate: deDate,
    source: function () { return params.src || (params.v ? 'qr' : 'web'); }, vertriebler: function () { return params.v || null; }, kontakt: function () { return params.k || null; } };
  function track(eventType, meta) {
    var body = { event_type: eventType, session_id: sessionId, source: window.KOMPASS.source(), vertriebler: window.KOMPASS.vertriebler(), kontakt_id: window.KOMPASS.kontakt(), page: location.pathname, page_url: location.href, referrer: document.referrer || '', env: window.KOMPASS_ENV, meta: meta || {} };
    if (IS_LOCAL) { console.info('[Kompass local] event:', eventType); return; }
    try { fetch(CFG.apiBase + '/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit' }).catch(function () {}); } catch (e) {}
  }
  window.KOMPASS.track = track;
  function post(path, body) { return fetch(CFG.apiBase + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' }).then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; }); }); }
  window.KOMPASS.post = post;
  function getJson(path) { return fetch(CFG.apiBase + path, { credentials: 'omit' }).then(function (r) { return r.json(); }); }
  var QK = 'kompass_queue';
  function rq() { try { return JSON.parse(localStorage.getItem(QK) || '[]'); } catch (e) { return []; } }
  function wq(q) { try { localStorage.setItem(QK, JSON.stringify(q)); } catch (e) {} }
  window.KOMPASS.enqueue = function (path, body) { var q = rq(); q.push({ path: path, body: body, at: Date.now() }); wq(q); return q.length; };
  window.KOMPASS.flushQueue = function () { var q = rq(); if (!q.length || IS_LOCAL) return Promise.resolve(0); var rest = [], done = 0; return q.reduce(function (p, it) { return p.then(function () { return post(it.path, it.body).then(function () { done++; }).catch(function () { rest.push(it); }); }); }, Promise.resolve()).then(function () { wq(rest); return done; }); };
  window.KOMPASS.queueLength = function () { return rq().length; };
  window.addEventListener('online', function () { window.KOMPASS.flushQueue(); });
  var loadedAt = Date.now(), realGesture = false;
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (e.isTrusted) realGesture = true; }, { passive: true, capture: true }); });
  window.KOMPASS.realUser = function () { return realGesture && (Date.now() - loadedAt) >= 1500; };

  /* ── Slider ── */
  function initSlider(root) {
    var slides = root.querySelectorAll('.slide'), dots = root.querySelectorAll('.dot'); if (slides.length < 2) return;
    var i = 0, timer;
    function go(n) { i = (n + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); }); dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); }); }
    function start() { stop(); timer = setInterval(function () { go(i + 1); }, 6500); }
    function stop() { if (timer) clearInterval(timer); }
    root.querySelectorAll('.slider-btn').forEach(function (b) { b.addEventListener('click', function () { go(i + (b.dataset.dir | 0)); start(); }); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(d.dataset.i | 0); start(); }); });
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); start(); } x0 = null; }, { passive: true });
    root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', start);
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  }

  /* ── Meistgelesen (Stats) ── */
  var statsPromise = null;
  function stats() { if (!statsPromise) statsPromise = IS_LOCAL ? Promise.resolve({ views: {} }) : getJson('/stats').catch(function () { return { views: {} }; }); return statsPromise; }

  /* ── Archiv: Suche / Filter / Sortierung ── */
  function initArchiv(root) {
    var liste = root.querySelector('[data-liste]'), erg = root.querySelector('[data-ergebnis]'), mehr = root.querySelector('[data-mehr]'), reset = root.querySelector('[data-reset]');
    var sortSel = root.querySelector('[data-sort]'), chips = root.querySelectorAll('[data-ressort-chips] .chip'), form = root.querySelector('[data-suche]'), input = form.querySelector('input');
    var state = { q: params.q || '', ressort: root.dataset.ressort || params.ressort || '', sort: params.sort || 'neu', shown: 12 };
    input.value = state.q;
    chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.r === state.ressort); });
    sortSel.value = state.sort;
    var data = null, views = {};
    function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
    function score(a, terms) { var t = norm(a.title), d = norm(a.dek), tg = norm(a.tags.join(' ')), x = norm(a.text); var s = 0; terms.forEach(function (w) { if (t.indexOf(w) > -1) s += 12; if (tg.indexOf(w) > -1) s += 8; if (d.indexOf(w) > -1) s += 5; if (x.indexOf(w) > -1) s += 2; }); return s; }
    function render() {
      if (!data) return;
      var terms = norm(state.q).split(/\s+/).filter(function (w) { return w.length > 1; });
      var rows = data.artikel.map(function (a) { return { a: a, s: terms.length ? score(a, terms) : 0 }; }).filter(function (r) { return (!terms.length || r.s > 0) && (!state.ressort || r.a.ressort === state.ressort); });
      var sort = state.sort;
      rows.sort(function (x, y) {
        if (terms.length && sort !== 'alt' && sort !== 'neu') { if (y.s !== x.s) return y.s - x.s; }
        if (sort === 'relevanz') return (y.a.relevanz - x.a.relevanz) || (y.a.datum > x.a.datum ? 1 : -1);
        if (sort === 'gelesen') return ((views[y.a.slug] || 0) - (views[x.a.slug] || 0)) || (y.a.relevanz - x.a.relevanz);
        if (sort === 'alt') return x.a.datum > y.a.datum ? 1 : -1;
        return y.a.datum > x.a.datum ? 1 : -1;
      });
      erg.textContent = rows.length + (rows.length === 1 ? ' Artikel' : ' Artikel') + (state.q ? ' zu „' + state.q + '“' : '') + (state.ressort ? ' in ' + (CFG.ressorts.filter(function (r) { return r[0] === state.ressort; })[0] || ['', ''])[1] : '');
      reset.hidden = !(state.q || state.ressort);
      liste.innerHTML = rows.slice(0, state.shown).map(function (r) { var a = r.a; return '<a class="karte" href="' + ROOT + 'artikel/' + a.slug + '/"><div class="karte-bild"><img src="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg" alt="" loading="lazy" width="640" height="427"></div><div class="karte-body"><div class="karte-meta"><span class="ressort-tag">' + esc(a.ressort_name) + '</span><time datetime="' + a.datum + '">' + deDate(a.datum) + '</time></div><h3>' + esc(a.title) + '</h3><p>' + esc(a.dek) + '</p><div class="karte-foot"><span>' + a.lesezeit + ' Min. Lesezeit' + (sort === 'gelesen' && views[a.slug] ? ' · ' + views[a.slug] + ' Leser' : '') + '</span></div></div></a>'; }).join('') || '<p class="muted">Keine Treffer. Versuchen Sie einen anderen Begriff oder ein anderes Ressort.</p>';
      mehr.hidden = rows.length <= state.shown;
      try { var u = new URL(location.href); ['q', 'ressort', 'sort'].forEach(function (k) { if (state[k] && !(k === 'sort' && state[k] === 'neu') && !(k === 'ressort' && root.dataset.ressort)) u.searchParams.set(k, state[k]); else u.searchParams.delete(k); }); history.replaceState(null, '', u.toString()); } catch (e) {}
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value.trim(); state.shown = 12; if (state.q) track('suche', { q: state.q }); render(); });
    input.addEventListener('input', function () { if (!input.value.trim() && state.q) { state.q = ''; render(); } });
    chips.forEach(function (c) { c.addEventListener('click', function () { state.ressort = c.dataset.r; state.shown = 12; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); render(); }); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; state.shown = 12; if (state.sort === 'gelesen') stats().then(function (s) { views = s.views || {}; render(); }); else render(); });
    mehr.addEventListener('click', function () { state.shown += 12; render(); });
    reset.addEventListener('click', function () { state.q = ''; state.ressort = root.dataset.ressort || ''; input.value = ''; chips.forEach(function (x) { x.classList.toggle('is-active', x.dataset.r === state.ressort); }); render(); });
    root.querySelectorAll('[data-tag]').forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); input.value = t.dataset.tag; state.q = t.dataset.tag; state.shown = 12; render(); window.scrollTo({ top: root.offsetTop - 80, behavior: 'smooth' }); }); });
    fetch(ROOT + 'assets/artikel-index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (j) { data = j; if (state.sort === 'gelesen') return stats().then(function (s) { views = s.views || {}; }); }).then(render).catch(function () { erg.textContent = 'Archiv konnte nicht geladen werden.'; });
  }

  /* ── Meistgelesen-Liste auf der Startseite (echte Zahlen, sonst Redaktions-Auswahl) ── */
  function initMeistgelesen(ol) {
    stats().then(function (s) {
      var v = s.views || {}; var items = Array.prototype.slice.call(ol.querySelectorAll('li'));
      var withViews = items.filter(function (li) { return v[li.querySelector('a').dataset.slug]; });
      if (withViews.length < 3) return;
      items.sort(function (a, b) { return (v[b.querySelector('a').dataset.slug] || 0) - (v[a.querySelector('a').dataset.slug] || 0); });
      items.forEach(function (li, i) { li.querySelector('.rang').textContent = i + 1; ol.appendChild(li); });
    });
  }

  /* ── Kommentare ── */
  function initKommentare(sec) {
    var slug = sec.dataset.kommentare, liste = sec.querySelector('[data-k-liste]'), form = sec.querySelector('[data-k-form]'), err = sec.querySelector('[data-k-error]'), anzahl = sec.querySelector('[data-k-anzahl]');
    function render(items) {
      anzahl.textContent = items.length ? '(' + items.length + ')' : '';
      liste.innerHTML = items.length ? items.map(function (k) { return '<div class="kommentar"><div class="k-kopf"><span><b>' + esc(k.name || 'Anonym') + '</b>' + (k.ort ? ' · ' + esc(k.ort) : '') + '</span><time>' + deDate(k.created_at) + '</time></div><p>' + esc(k.text) + '</p></div>'; }).join('') : '<p class="k-leer">Noch keine Kommentare. Schreiben Sie den ersten.</p>';
    }
    if (!IS_LOCAL) getJson('/kommentare?slug=' + encodeURIComponent(slug)).then(function (j) { render(j.kommentare || []); }).catch(function () {});
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.classList.remove('active');
      var text = form.text.value.trim(); if (text.length < 10) { err.textContent = 'Bitte mindestens zehn Zeichen.'; err.classList.add('active'); return; }
      if (!window.KOMPASS.realUser()) { err.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; err.classList.add('active'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      var body = { slug: slug, name: form.name.value.trim(), ort: form.ort.value.trim(), text: text, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href };
      var done = function (j) { btn.disabled = false; btn.textContent = 'Kommentar senden'; form.text.value = ''; track('kommentar', { slug: slug }); if (j && j.kommentare) render(j.kommentare); else { var now = new Date().toISOString(); var neu = { name: body.name, ort: body.ort, text: text, created_at: now }; var cur = Array.prototype.slice.call(liste.querySelectorAll('.kommentar')).length; render([neu].concat(cur ? [] : [])); if (cur) { var el = document.createElement('div'); el.innerHTML = '<div class="kommentar"><div class="k-kopf"><span><b>' + esc(body.name || 'Anonym') + '</b></span><time>' + deDate(now) + '</time></div><p>' + esc(text) + '</p></div>'; liste.insertBefore(el.firstChild, liste.firstChild); } } };
      if (IS_LOCAL) { setTimeout(function () { done(null); }, 400); return; }
      post('/kommentare', body).then(done).catch(function (e2) { btn.disabled = false; btn.textContent = 'Kommentar senden'; err.textContent = /HTTP 429/.test(e2.message) ? 'Zu viele Kommentare in kurzer Zeit – bitte später noch einmal.' : 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.'; err.classList.add('active'); });
    });
  }

  /* ── Abo (Ausgabe per E-Mail) ── */
  function initAbo(form) {
    var note = form.querySelector('[data-abo-note]');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); var email = form.email.value.trim(); note.classList.remove('err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte eine gültige E-Mail-Adresse eintragen.'; note.classList.add('err'); return; }
      var btn = form.querySelector('button'); btn.disabled = true;
      var body = { email: email, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href, quelle: location.pathname };
      var ok = function () { btn.disabled = false; form.email.value = ''; note.textContent = 'Danke – die nächste Ausgabe kommt per E-Mail.'; track('abo', {}); };
      if (IS_LOCAL) { setTimeout(ok, 300); return; }
      post('/abo', body).then(ok).catch(function () { btn.disabled = false; note.textContent = 'Das hat nicht geklappt – bitte später erneut versuchen.'; note.classList.add('err'); });
    });
  }

  /* ── Teilen ── */
  function initTeilen(box) {
    var url = location.href.split('#')[0], title = box.dataset.title || document.title;
    var wa = box.querySelector('[data-share=whatsapp]'), li = box.querySelector('[data-share=linkedin]'), ma = box.querySelector('[data-share=mail]'), cp = box.querySelector('[data-share=copy]');
    if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' – ' + url);
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    if (ma) ma.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + '\n' + url);
    if (cp) cp.addEventListener('click', function () { try { navigator.clipboard.writeText(url).then(function () { cp.textContent = 'Kopiert'; setTimeout(function () { cp.textContent = 'Link kopieren'; }, 1500); }); } catch (e) {} });
    box.querySelectorAll('[data-share]').forEach(function (el) { el.addEventListener('click', function () { track('teilen', { via: el.dataset.share }); }); });
  }

  /* ── Reveal ── */
  function initReveal() {
    var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    function show(el) { el.classList.add('in'); }
    if ('IntersectionObserver' in window) { var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }); pending.forEach(function (el) { io.observe(el); }); }
    else pending.forEach(show);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var h = document.querySelector('[data-kompass-header]'); if (h) renderHeader(h);
    var f = document.querySelector('[data-kompass-footer]'); if (f) renderFooter(f);
    document.querySelectorAll('[data-kompass-logo]').forEach(function (el) { el.innerHTML = logoSvg({ size: el.getAttribute('data-kompass-logo') || '' }); });
    var sl = document.getElementById('slider'); if (sl) initSlider(sl);
    var ar = document.querySelector('[data-archiv]'); if (ar) initArchiv(ar);
    var mg = document.getElementById('meistgelesen'); if (mg) initMeistgelesen(mg);
    document.querySelectorAll('[data-kommentare]').forEach(initKommentare);
    document.querySelectorAll('[data-abo]').forEach(initAbo);
    document.querySelectorAll('[data-teilen]').forEach(initTeilen);
    initReveal();
    if (!IS_LIVE) { var n = document.createElement('div'); n.className = 'notice-preview'; n.textContent = IS_PREVIEW ? 'VORSCHAU' : 'LOKAL'; document.body.appendChild(n); }
    track('page_view', { title: document.title });
    window.KOMPASS.flushQueue();
  });
})();
