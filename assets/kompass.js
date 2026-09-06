/* =====================================================================
   GaLaBau Kompass · gemeinsames Script v3 (Editorial)
   Kopf (Topbar, Masthead, klebende Ressortleiste, Live-Suche, Drawer),
   Footer, Logo, Top-Themen-Slider, Archiv (Suche/Filter/Sortierung),
   Mehr-laden-Listen, Lesefortschritt, Kommentare, Meistgelesen,
   Abo-Formular, Teilen, Tracking, Offline-Puffer. Pfade relativ (data-depth).
   ===================================================================== */
(function () {
  'use strict';
  var CFG = {
    site: 'GaLaBau Kompass',
    apiBase: 'https://gc-tracking-dashboard.vercel.app/api/public/kompass',
    liveHosts: /(^|\.)galabau-kompass\.de$/i,
    previewHosts: /github\.io$|vercel\.app$/i,
    ressorts: [ /* slug, Name, kurz, Leisten-Label */
      ['betrieb-personal', 'Betrieb & Personal', 'Betrieb', 'Betrieb'], ['recht-tarif', 'Recht & Tarif', 'Recht', 'Recht'], ['technik-digital', 'Technik & Digital', 'Technik', 'Technik'], ['produkte', 'Produkte & Software', 'Produkte', 'Produkte'],
      ['bauen-pflanzen', 'Bauen & Pflanzen', 'Bauen', 'Bauen'], ['markt-politik', 'Markt & Politik', 'Markt', 'Markt'], ['sicherheit-gesundheit', 'Sicherheit & Gesundheit', 'Sicherheit', 'Sicherheit'], ['karriere', 'Karriere & Weiterbildung', 'Karriere', 'Karriere'],
      ['messe-termine', 'Messe & Termine', 'Termine', 'Termine'], ['standpunkt', 'Standpunkt', 'Standpunkt', 'Standpunkt']
    ]
  };
  var depth = (document.body.getAttribute('data-depth') || '0') | 0;
  var ROOT = depth === 0 ? './' : new Array(depth + 1).join('../');
  var IS_LIVE = CFG.liveHosts.test(location.hostname), IS_PREVIEW = CFG.previewHosts.test(location.hostname), IS_LOCAL = !IS_LIVE && !IS_PREVIEW;
  window.KOMPASS_ENV = IS_LIVE ? 'live' : (IS_PREVIEW ? 'preview' : 'local');
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function deDate(iso) { var d = new Date(iso); return d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear(); }
  function kurzDate(iso) { var d = new Date(iso); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear(); }
  function path() { return location.pathname.replace(/index\.html$/, ''); }
  function isActive(href) { return path().indexOf('/' + href) > -1; }

  /* ── Logo v2: Kompassrose mit Blatt-Nadel ── */
  function logoSvg(opts) {
    opts = opts || {};
    var ticks = '';
    for (var i = 0; i < 16; i++) { var big = i % 4 === 0; ticks += '<path class="tick" d="M32 ' + (big ? '2' : '3') + 'v' + (big ? '3.6' : '2') + '" transform="rotate(' + (i * 22.5) + ' 32 32)"/>'; }
    var pts = '';
    ['E', 'S', 'W'].forEach(function (d, k) { pts += '<path class="pt" d="M32 32L34.4 30 32 12.5 29.6 30Z" transform="rotate(' + ((k + 1) * 90) + ' 32 32)"/>'; });
    [45, 135, 225, 315].forEach(function (r) { pts += '<path class="pt s" d="M32 32L33.6 30.4 32 19 30.4 30.4Z" transform="rotate(' + r + ' 32 32)"/>'; });
    var mark = '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><circle class="kreis" cx="32" cy="32" r="29"/><path class="nadel-n" d="M32 7 42.5 32 32 26.5 21.5 32Z"/><path class="nadel-s" d="M32 57 21.5 32 32 37.5 42.5 32Z"/></svg>';
    var text = opts.word === false ? '' : '<span class="logo-word">GaLaBau Kompass</span>';
    return '<a class="logo' + (opts.size === 'lg' ? ' lg' : '') + '" href="' + ROOT + '" aria-label="GaLaBau Kompass – Startseite">' + mark + text + '</a>';
  }
  window.kompassLogo = logoSvg;

  /* ── Kopf / Fuß ── */
  var SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var SVG_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  function ressortLinks(kurz) { return CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/"' + (isActive('ressort/' + r[0]) ? ' class="active"' : '') + ' title="' + r[1] + '">' + (kurz ? r[3] : r[1]) + '</a>'; }).join(''); }
  function renderHeader(el) {
    var d = new Date();
    var ausg = document.body.getAttribute('data-ausgabe') || '';
    var top = '<div class="topbar"><div class="container"><span class="datum"><b>' + TAGE[d.getDay()] + '</b>, ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear() +
      (IS_LIVE ? '' : '<span class="env">' + (IS_PREVIEW ? 'Vorschau' : 'Lokal') + '</span>') + '</span>' +
      '<nav aria-label="Service"><a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine</a><a href="' + ROOT + 'zahlen/">Zahlen</a><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'ueber-uns/">Über uns</a><a href="' + ROOT + 'merkliste/" data-merk-link>Merkliste<span class="merk-anz" data-merk-anz></span></a></nav></div></div>';
    var mast = '<div class="masthead"><div class="container"><span class="links">' + (ausg ? ausg + ' · seit 2025' : 'Seit 2025') + '</span><div class="mitte">' + logoSvg({ size: 'lg' }) + '<span class="tagline">Das Magazin für den Garten- und Landschaftsbau</span></div>' +
      '<div class="rechts"><a class="btn sm ghost abo-btn" href="' + ROOT + 'newsletter/">Der Montagskompass</a><button type="button" class="icon-btn nav-toggle" aria-label="Menü öffnen">' + SVG_MENU + '</button></div></div></div>';
    var nav = '<div class="navbar" data-navbar><div class="container"><span class="mini">' + logoSvg({ word: false }) + '</span>' +
      '<nav aria-label="Ressorts">' + ressortLinks(true) + '</nav>' +
      '<button type="button" class="icon-btn such-btn" aria-label="Suche öffnen" aria-expanded="false">' + SVG_SEARCH + '</button></div>' +
      '<div class="suche-panel" data-suche-panel><div class="container"><form role="search" action="' + ROOT + 'artikel/" method="get" autocomplete="off"><input type="search" class="input" name="q" placeholder="Beiträge durchsuchen – z. B. Tarif, Bagger, Azubi, Zecken" aria-label="Suche"><button type="submit" class="btn">Suchen</button></form><div class="suche-erg" data-suche-erg role="listbox"></div></div></div></div>';
    var drawer = '<div class="drawer" aria-hidden="true"><div class="scrim"></div><div class="panel"><div class="panel-kopf">' + logoSvg() + '<button type="button" class="icon-btn schliessen" aria-label="Menü schließen">' + SVG_CLOSE + '</button></div>' +
      '<form role="search" action="' + ROOT + 'artikel/" method="get" class="suche"><input type="search" class="input" name="q" placeholder="Suchen …" aria-label="Suche"><button type="submit" class="btn sm">Los</button></form>' +
      '<div class="gruppe"><h4>Ressorts</h4>' + ressortLinks() + '</div>' +
      '<div class="gruppe"><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine &amp; Fristen</a><a href="' + ROOT + 'zahlen/">Zahlen der Branche</a><a href="' + ROOT + 'newsletter/">Der Montagskompass</a><a href="' + ROOT + 'merkliste/">Merkliste</a><a href="' + ROOT + 'ueber-uns/">Über uns</a></div>' +
      '<div class="gruppe"><h4>Service</h4><a class="cta" href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a></div></div></div>';
    el.innerHTML = top + mast + nav + drawer;
    // Ressortleiste aus dem Header lösen, damit position:sticky für die ganze Seite gilt
    var navEl = el.querySelector('[data-navbar]'); el.insertAdjacentElement('afterend', navEl);

    // klebende Leiste: Mini-Logo einblenden, sobald der Masthead aus dem Bild ist
    var navbar = navEl, mast = el.querySelector('.masthead');
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { navbar.classList.toggle('is-stuck', !es[0].isIntersecting); }, { threshold: 0 }).observe(mast); }
    // aktives Ressort in die Sicht scrollen (mobil)
    var act = navbar.querySelector('nav a.active'); if (act && act.scrollIntoView) { try { act.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
    initSuche(navbar);
    var dr = el.querySelector('.drawer');
    function openDrawer(o) { dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', o ? 'false' : 'true'); document.body.style.overflow = o ? 'hidden' : ''; if (o) setTimeout(function () { dr.querySelector('.schliessen').focus(); }, 30); }
    el.querySelector('.nav-toggle').addEventListener('click', function () { openDrawer(true); });
    dr.querySelector('.schliessen').addEventListener('click', function () { openDrawer(false); });
    dr.querySelector('.scrim').addEventListener('click', function () { openDrawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openDrawer(false); });
  }
  function renderFooter(el) {
    el.className = 'site-footer';
    el.innerHTML = '<div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' + logoSvg() + '<p>Das Online-Magazin für Inhaber, Führungskräfte und Fachkräfte im Garten- und Landschaftsbau. Zahlen, Einordnung und Praxis – jede Woche neue Beiträge, jeden Monat als Ausgabe.</p></div>' +
      '<div><h4>Ressorts</h4>' + CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/">' + r[1] + '</a>'; }).join('') + '</div>' +
      '<div><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine &amp; Fristen</a><a href="' + ROOT + 'zahlen/">Zahlen der Branche</a><a href="' + ROOT + 'newsletter/">Der Montagskompass</a><a href="' + ROOT + 'ueber-uns/">Über uns</a><a href="mailto:redaktion@galabau-kompass.de">Redaktion kontaktieren</a></div>' +
      '<div><h4>Service &amp; Rechtliches</h4><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'impressum/">Impressum</a><a href="' + ROOT + 'datenschutz/">Datenschutz</a></div>' +
      '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' GaLaBau Kompass · Das Magazin für den Garten- und Landschaftsbau</span><span>galabau-kompass.de</span></div></div>';
  }

  /* ── Live-Suche in der Ressortleiste ── */
  var indexPromise = null;
  function loadIndex() { if (!indexPromise) indexPromise = fetch(ROOT + 'assets/artikel-index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }); return indexPromise; }
  function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
  function score(a, terms) { var t = norm(a.title), d = norm(a.dek), tg = norm(a.tags.join(' ')), x = norm(a.text); var s = 0; terms.forEach(function (w) { if (t.indexOf(w) > -1) s += 12; if (tg.indexOf(w) > -1) s += 8; if (d.indexOf(w) > -1) s += 5; if (x.indexOf(w) > -1) s += 2; }); return s; }
  function hl(text, terms) { var out = esc(text); terms.forEach(function (w) { if (w.length < 2) return; try { out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); } catch (e) {} }); return out; }
  function initSuche(navbar) {
    var btn = navbar.querySelector('.such-btn'), panel = navbar.querySelector('[data-suche-panel]'), input = panel.querySelector('input'), erg = panel.querySelector('[data-suche-erg]'), form = panel.querySelector('form');
    var hot = -1, timer;
    function open(o) { panel.classList.toggle('open', o); btn.classList.toggle('is-open', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) { loadIndex(); setTimeout(function () { input.focus(); }, 30); } else { erg.innerHTML = ''; hot = -1; } }
    btn.addEventListener('click', function () { open(!panel.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); if (e.key === '/' && document.activeElement && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(true); } });
    document.addEventListener('click', function (e) { if (panel.classList.contains('open') && !navbar.contains(e.target)) open(false); });
    function render(q) {
      var terms = norm(q).split(/\s+/).filter(function (w) { return w.length > 1; });
      if (!terms.length) { erg.innerHTML = ''; hot = -1; return; }
      loadIndex().then(function (j) {
        var rows = j.artikel.map(function (a) { return { a: a, s: score(a, terms) }; }).filter(function (r) { return r.s > 0; }).sort(function (x, y) { return y.s - x.s || (y.a.datum > x.a.datum ? 1 : -1); });
        if (!rows.length) { erg.innerHTML = '<div class="leer">Keine Treffer zu „' + esc(q) + '“.</div>'; hot = -1; return; }
        erg.innerHTML = rows.slice(0, 6).map(function (r) { var a = r.a; return '<a href="' + ROOT + 'artikel/' + a.slug + '/" role="option"><img src="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg" alt="" loading="lazy"><span><b>' + hl(a.title, terms) + '</b><small>' + esc(a.ressort_name) + ' · ' + esc(a.datum_kurz || kurzDate(a.datum)) + '</small></span></a>'; }).join('') +
          '<a class="alle" href="' + ROOT + 'artikel/?q=' + encodeURIComponent(q) + '">Alle ' + rows.length + ' Treffer im Archiv →</a>';
        hot = -1;
      });
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { render(input.value.trim()); }, 120); });
    input.addEventListener('keydown', function (e) {
      var items = erg.querySelectorAll('a[role=option]'); if (!items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); hot = (hot + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items.forEach(function (it, i) { it.classList.toggle('is-hot', i === hot); }); }
      if (e.key === 'Enter' && hot > -1) { e.preventDefault(); location.href = items[hot].href; }
    });
    form.addEventListener('submit', function (e) { if (!input.value.trim()) { e.preventDefault(); input.focus(); } else track('suche', { q: input.value.trim(), via: 'leiste' }); });
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

  /* ── Top-Themen-Slider (Bühne + Leiste) ── */
  function initSlider(root) {
    var slides = root.querySelectorAll('.top-slide'), items = root.querySelectorAll('.rail-item'), count = root.querySelector('[data-count]'); if (slides.length < 2) return;
    var i = 0, timer, DAUER = 7000, paused = false;
    root.style.setProperty('--dauer', DAUER + 'ms');
    function go(n, user) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { var on = k === i; s.classList.toggle('is-active', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); if (on) s.removeAttribute('tabindex'); else s.setAttribute('tabindex', '-1'); });
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); it.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (count) count.textContent = i + 1;
      if (user) track('slider', { i: i });
      restart();
    }
    function restart() { stop(); if (!paused && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setTimeout(function () { go(i + 1); }, DAUER); }
    function stop() { if (timer) clearTimeout(timer); timer = null; }
    root.querySelectorAll('.top-btn').forEach(function (b) { b.addEventListener('click', function () { go(i + (b.dataset.dir | 0), true); }); });
    items.forEach(function (it) { it.addEventListener('click', function () { go(it.dataset.i | 0, true); }); });
    var stage = root.querySelector('.top-stage'), x0 = null;
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1), true); x0 = null; }, { passive: true });
    function pause(p) { paused = p; root.classList.toggle('is-paused', p); if (p) stop(); else restart(); }
    root.addEventListener('mouseenter', function () { pause(true); }); root.addEventListener('mouseleave', function () { pause(false); });
    root.addEventListener('focusin', function () { pause(true); }); root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) pause(false); });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(i + 1, true); if (e.key === 'ArrowLeft') go(i - 1, true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else restart(); });
    // Fortschrittsbalken startet erst nach dem ersten Frame, damit die Transition greift
    requestAnimationFrame(function () { items[0] && items[0].classList.add('is-active'); restart(); });
  }

  /* ── Mehr laden (Ressort-Listen) ── */
  function initMehrListe(liste) {
    var schritt = (liste.dataset.schritt | 0) || 6, btn = document.querySelector('[data-mehr-btn]'), items = Array.prototype.slice.call(liste.children), shown = schritt;
    function apply() { items.forEach(function (el, k) { el.hidden = k >= shown; }); if (btn) { var rest = items.length - shown; btn.hidden = rest <= 0; if (rest > 0) btn.textContent = 'Weitere Beiträge laden (' + Math.min(schritt, rest) + ' von ' + rest + ')'; } }
    if (btn) btn.addEventListener('click', function () { shown += schritt; apply(); track('mehr_laden', { n: shown }); });
    apply();
  }

  /* ── Lesefortschritt ── */
  function initProgress(bar) {
    var main = document.querySelector('.art-main'); if (!main) return;
    function upd() { var r = main.getBoundingClientRect(), h = window.innerHeight, total = r.height - h * .5, done = Math.min(Math.max(-r.top + h * .25, 0), Math.max(total, 1)); bar.style.width = (total > 0 ? Math.round(done / total * 100) : 100) + '%'; }
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }

  /* ── Meistgelesen (Stats) ── */
  var statsPromise = null;
  function stats() { if (!statsPromise) statsPromise = IS_LOCAL ? Promise.resolve({ views: {} }) : getJson('/stats').catch(function () { return { views: {} }; }); return statsPromise; }

  /* ── Archiv: Suche / Filter / Sortierung ── */
  function teaserHtml(a, extra) {
    var media = a.bild ? '<a class="t-media" href="' + ROOT + 'artikel/' + a.slug + '/" tabindex="-1" aria-hidden="true"><img src="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg" srcset="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg 640w, ' + ROOT + 'assets/img/' + a.bild + '.jpg 1600w" sizes="(min-width: 720px) 240px, 112px" alt="" loading="lazy" width="1600" height="1067"></a>' : '';
    var fmt = a.format && a.format !== 'artikel' ? '<span class="t-format t-format-' + a.format + '">' + esc(a.format_name || a.format) + '</span>' : '';
    return '<article class="t t-horiz' + (a.bild ? '' : ' t-ohne-bild') + '" data-slug="' + a.slug + '">' + media +
      '<div class="t-body"><div class="t-meta">' + fmt + '<a class="t-ressort" href="' + ROOT + 'ressort/' + a.ressort + '/">' + esc(a.ressort_name) + '</a><time datetime="' + a.datum + '">' + esc(a.datum_kurz || kurzDate(a.datum)) + '</time></div>' +
      '<h3 class="t-h"><a href="' + ROOT + 'artikel/' + a.slug + '/">' + esc(a.title) + '</a></h3><p class="t-dek">' + esc(a.dek) + '</p><div class="t-foot"><span>' + a.lesezeit + ' Min. Lesezeit' + (extra || '') + '</span><button type="button" class="merken" data-merken="' + a.slug + '" aria-label="Beitrag merken" title="Merken"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg></button></div></div></article>';
  }
  function initArchiv(root) {
    var liste = root.querySelector('[data-liste]'), erg = root.querySelector('[data-ergebnis]'), mehr = root.querySelector('[data-mehr]'), reset = root.querySelector('[data-reset]');
    var sortSel = root.querySelector('[data-sort]'), chips = root.querySelectorAll('[data-ressort-chips] .chip'), form = root.querySelector('[data-suche]'), input = form.querySelector('input');
    var state = { q: params.q || '', ressort: root.dataset.ressort || params.ressort || '', sort: params.sort || 'neu', format: params.format || '', shown: 12 };
    input.value = state.q;
    chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.r === state.ressort); });
    sortSel.value = state.sort;
    var data = null, views = {};
    function render() {
      if (!data) return;
      var terms = norm(state.q).split(/\s+/).filter(function (w) { return w.length > 1; });
      var rows = data.artikel.map(function (a) { return { a: a, s: terms.length ? score(a, terms) : 0 }; }).filter(function (r) { return (!terms.length || r.s > 0) && (!state.ressort || r.a.ressort === state.ressort) && (!state.format || r.a.format === state.format); });
      var sort = state.sort;
      rows.sort(function (x, y) {
        if (terms.length && sort !== 'alt' && sort !== 'neu') { if (y.s !== x.s) return y.s - x.s; }
        if (sort === 'relevanz') return (y.a.relevanz - x.a.relevanz) || (y.a.datum > x.a.datum ? 1 : -1);
        if (sort === 'gelesen') return ((views[y.a.slug] || 0) - (views[x.a.slug] || 0)) || (y.a.relevanz - x.a.relevanz);
        if (sort === 'alt') return x.a.datum > y.a.datum ? 1 : -1;
        return y.a.datum > x.a.datum ? 1 : -1;
      });
      var rName = (CFG.ressorts.filter(function (r) { return r[0] === state.ressort; })[0] || ['', ''])[1];
      var fName = { meldung: 'Kurz gemeldet', produkt: 'Produkte', standpunkt: 'Standpunkte', praxisfrage: 'Praxisfragen' }[state.format];
      erg.textContent = rows.length + (rows.length === 1 ? ' Beitrag' : ' Beiträge') + (state.q ? ' zu „' + state.q + '“' : '') + (state.ressort ? ' in ' + rName : '') + (fName ? ' · ' + fName : '');
      reset.hidden = !(state.q || state.ressort || state.format);
      liste.innerHTML = rows.slice(0, state.shown).map(function (r) { return teaserHtml(r.a, sort === 'gelesen' && views[r.a.slug] ? ' · ' + views[r.a.slug] + ' Leser' : ''); }).join('') || '<p class="muted mt-s">Keine Treffer. Versuchen Sie einen anderen Begriff oder ein anderes Ressort.</p>';
      mehr.hidden = rows.length <= state.shown;
      if (!mehr.hidden) mehr.textContent = 'Mehr laden (' + (rows.length - state.shown) + ' weitere)';
      try { var u = new URL(location.href); ['q', 'ressort', 'sort', 'format'].forEach(function (k) { if (state[k] && !(k === 'sort' && state[k] === 'neu') && !(k === 'ressort' && root.dataset.ressort)) u.searchParams.set(k, state[k]); else u.searchParams.delete(k); }); history.replaceState(null, '', u.toString()); } catch (e) {}
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value.trim(); state.shown = 12; if (state.q) track('suche', { q: state.q }); render(); });
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = input.value.trim(); state.shown = 12; render(); }, 180); });
    chips.forEach(function (c) { c.addEventListener('click', function () { state.ressort = c.dataset.r; state.shown = 12; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); render(); }); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; state.shown = 12; if (state.sort === 'gelesen') stats().then(function (s) { views = s.views || {}; render(); }); else render(); });
    mehr.addEventListener('click', function () { state.shown += 12; render(); });
    reset.addEventListener('click', function () { state.q = ''; state.format = ''; state.ressort = root.dataset.ressort || ''; input.value = ''; chips.forEach(function (x) { x.classList.toggle('is-active', x.dataset.r === state.ressort); }); render(); });
    root.querySelectorAll('[data-tag]').forEach(function (tg) { tg.addEventListener('click', function (e) { e.preventDefault(); input.value = tg.dataset.tag; state.q = tg.dataset.tag; state.shown = 12; render(); window.scrollTo({ top: root.offsetTop - 60, behavior: 'smooth' }); }); });
    loadIndex().then(function (j) { data = j; if (state.sort === 'gelesen') return stats().then(function (s) { views = s.views || {}; }); }).then(render).catch(function () { erg.textContent = 'Archiv konnte nicht geladen werden.'; });
  }

  /* ── Meistgelesen (echte Zahlen, sonst Redaktions-Auswahl) ── */
  function initMeistgelesen(ol) {
    stats().then(function (s) {
      var v = s.views || {}; var items = Array.prototype.slice.call(ol.querySelectorAll('li'));
      var withViews = items.filter(function (li) { return v[li.querySelector('a').dataset.slug]; });
      if (withViews.length < 3) return;
      items.sort(function (a, b) { return (v[b.querySelector('a').dataset.slug] || 0) - (v[a.querySelector('a').dataset.slug] || 0); });
      items.forEach(function (li, i) { li.querySelector('.rang-nr').textContent = i + 1; ol.appendChild(li); });
    });
  }

  /* ── Kommentare ── */
  function initKommentare(sec) {
    var slug = sec.dataset.kommentare, liste = sec.querySelector('[data-k-liste]'), form = sec.querySelector('[data-k-form]'), err = sec.querySelector('[data-k-error]'), anzahl = sec.querySelector('[data-k-anzahl]');
    function kHtml(k) { return '<div class="kommentar"><div class="k-kopf"><span><b>' + esc(k.name || 'Anonym') + '</b>' + (k.ort ? ' · ' + esc(k.ort) : '') + '</span><time>' + deDate(k.created_at) + '</time></div><p>' + esc(k.text) + '</p></div>'; }
    function render(items) { anzahl.textContent = items.length ? '(' + items.length + ')' : ''; liste.innerHTML = items.length ? items.map(kHtml).join('') : '<p class="k-leer">Noch keine Kommentare. Schreiben Sie den ersten.</p>'; }
    if (!IS_LOCAL) getJson('/kommentare?slug=' + encodeURIComponent(slug)).then(function (j) { render(j.kommentare || []); }).catch(function () {});
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.classList.remove('active');
      var text = form.text.value.trim(); if (text.length < 10) { err.textContent = 'Bitte mindestens zehn Zeichen.'; err.classList.add('active'); return; }
      if (!window.KOMPASS.realUser()) { err.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; err.classList.add('active'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      var body = { slug: slug, name: form.name.value.trim(), ort: form.ort.value.trim(), text: text, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href };
      var done = function (j) { btn.disabled = false; btn.textContent = 'Kommentar senden'; form.text.value = ''; track('kommentar', { slug: slug }); if (j && j.kommentare) { render(j.kommentare); if (j.pending) { err.textContent = 'Danke – Ihr Kommentar wird nach Prüfung freigeschaltet.'; err.classList.add('active'); } } else { var cur = liste.querySelectorAll('.kommentar').length; var neu = { name: body.name, ort: body.ort, text: text, created_at: new Date().toISOString() }; if (cur) liste.insertAdjacentHTML('afterbegin', kHtml(neu)); else render([neu]); } };
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
    var url = location.href.split('#')[0].split('?')[0], title = box.dataset.title || document.title;
    var wa = box.querySelector('[data-share=whatsapp]'), li = box.querySelector('[data-share=linkedin]'), ma = box.querySelector('[data-share=mail]'), cp = box.querySelector('[data-share=copy]');
    if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' – ' + url);
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    if (ma) ma.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + '\n' + url);
    if (cp) cp.addEventListener('click', function () { var ok = function () { cp.classList.add('ok'); cp.title = 'Link kopiert'; setTimeout(function () { cp.classList.remove('ok'); cp.title = 'Link kopieren'; }, 1800); }; try { navigator.clipboard.writeText(url).then(ok); } catch (e) { try { window.prompt('Link kopieren:', url); } catch (e2) {} } });
    box.querySelectorAll('[data-share]').forEach(function (el) { el.addEventListener('click', function () { track('teilen', { via: el.dataset.share }); }); });
  }

  /* ── Merkliste (localStorage, kein Login) ── */
  var MK = 'kompass_merkliste';
  function merkListe() { try { return JSON.parse(localStorage.getItem(MK) || '[]'); } catch (e) { return []; } }
  function merkSet(l) { try { localStorage.setItem(MK, JSON.stringify(l)); } catch (e) {} merkSync(); }
  function merkSync() {
    var l = merkListe();
    document.querySelectorAll('[data-merken]').forEach(function (b) { var on = l.indexOf(b.dataset.merken) > -1; b.classList.toggle('is-on', on); b.title = on ? 'Gemerkt – zum Entfernen klicken' : 'Merken'; var t = b.querySelector('[data-merken-text]'); if (t) t.textContent = on ? 'Gemerkt' : 'Merken'; });
    document.querySelectorAll('[data-merk-anz]').forEach(function (el) { el.textContent = l.length ? String(l.length) : ''; });
  }
  function initMerken() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-merken]'); if (!b) return; e.preventDefault(); e.stopPropagation();
      var l = merkListe(), slug = b.dataset.merken, i = l.indexOf(slug);
      if (i > -1) l.splice(i, 1); else { l.unshift(slug); track('merken', { slug: slug }); }
      merkSet(l);
    });
    merkSync();
  }
  function initMerkliste(root) {
    var liste = root.querySelector('[data-merk-liste]'), anz = root.querySelector('[data-merk-anzahl]'), leer = root.querySelector('[data-merk-leer]'), btn = root.querySelector('[data-merk-leeren]');
    function render() {
      var l = merkListe();
      loadIndex().then(function (j) {
        var by = {}; j.artikel.forEach(function (a) { by[a.slug] = a; });
        var rows = l.map(function (s) { return by[s]; }).filter(Boolean);
        anz.textContent = rows.length ? rows.length + (rows.length === 1 ? ' gemerkter Beitrag' : ' gemerkte Beiträge') : 'Keine gemerkten Beiträge';
        leer.hidden = rows.length > 0; btn.hidden = rows.length === 0;
        liste.innerHTML = rows.map(function (a) { return teaserHtml(a, ''); }).join('');
        merkSync();
      });
    }
    btn.addEventListener('click', function () { if (confirm('Merkliste wirklich leeren?')) { merkSet([]); render(); } });
    document.addEventListener('click', function (e) { if (e.target.closest('[data-merken]')) setTimeout(render, 50); });
    render();
  }

  /* ── Vorlesen (Sprachausgabe des Browsers) ── */
  function initVorlesen(btn) {
    if (!('speechSynthesis' in window)) { btn.hidden = true; return; }
    var prose = document.querySelector('[data-prose]'), lesen = false, utter = null;
    function text() { var h = document.querySelector('.art-head h1'), d = document.querySelector('.art-dek'); return [h && h.textContent, d && d.textContent, prose && prose.innerText].filter(Boolean).join('. '); }
    function stop() { speechSynthesis.cancel(); lesen = false; btn.classList.remove('is-lesen'); btn.querySelector('span').textContent = 'Vorlesen'; }
    btn.addEventListener('click', function () {
      if (lesen) { stop(); return; }
      utter = new SpeechSynthesisUtterance(text()); utter.lang = 'de-DE'; utter.rate = 1.02;
      var v = speechSynthesis.getVoices().filter(function (x) { return /^de/i.test(x.lang); }); if (v.length) utter.voice = v.filter(function (x) { return /Anna|Petra|Markus|Google|Microsoft|Premium|Enhanced/i.test(x.name); })[0] || v[0];
      utter.onend = stop; utter.onerror = stop;
      speechSynthesis.cancel(); speechSynthesis.speak(utter); lesen = true; btn.classList.add('is-lesen'); btn.querySelector('span').textContent = 'Stopp'; track('vorlesen', {});
    });
    window.addEventListener('pagehide', function () { if (lesen) speechSynthesis.cancel(); });
  }

  /* ── Frage der Woche ── */
  function initFrage(box) {
    var id = box.dataset.frage, opts = box.querySelectorAll('.frage-opt'), note = box.querySelector('[data-frage-note]'), key = 'kompass_frage_' + id, mine = null;
    try { mine = localStorage.getItem(key); } catch (e) {}
    function show(counts) {
      var total = 0; opts.forEach(function (o) { total += counts[o.dataset.opt] || 0; });
      opts.forEach(function (o) { var n = counts[o.dataset.opt] || 0, pct = total ? Math.round(n / total * 100) : 0; o.querySelector('.frage-fill').style.width = pct + '%'; o.querySelector('.frage-pct').textContent = pct + ' %'; o.classList.toggle('is-mine', o.dataset.opt === mine); o.disabled = true; });
      box.classList.add('is-done'); note.textContent = total + (total === 1 ? ' Stimme' : ' Stimmen') + ' · Ergebnis wird laufend aktualisiert.';
    }
    function load() { if (IS_LOCAL) { var c = {}; opts.forEach(function (o, i) { c[o.dataset.opt] = [12, 9, 15, 4, 3][i] || 2; }); if (mine !== null) c[mine] = (c[mine] || 0) + 1; show(c); return; } getJson('/frage?id=' + encodeURIComponent(id)).then(function (j) { show(j.counts || {}); }).catch(function () { note.textContent = 'Ergebnis gerade nicht abrufbar.'; }); }
    opts.forEach(function (o) { o.addEventListener('click', function () {
      if (box.classList.contains('is-done')) return;
      mine = o.dataset.opt; try { localStorage.setItem(key, mine); } catch (e) {}
      o.disabled = true; note.textContent = 'Stimme wird gezählt …';
      var body = { poll_id: id, option: mine | 0, session_id: sessionId, env: window.KOMPASS_ENV };
      track('frage', { id: id, opt: mine });
      if (IS_LOCAL) { load(); return; }
      post('/frage', body).then(function (j) { show(j.counts || {}); }).catch(function () { load(); });
    }); });
    if (mine !== null) load();
  }

  /* ── Reveal (Tool-Seiten) ── */
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
    var sl = document.querySelector('[data-slider]'); if (sl) initSlider(sl);
    var ar = document.querySelector('[data-archiv]'); if (ar) initArchiv(ar);
    document.querySelectorAll('[data-mehr-liste]').forEach(initMehrListe);
    var pb = document.querySelector('[data-progress]'); if (pb) initProgress(pb);
    var mg = document.getElementById('meistgelesen'); if (mg) initMeistgelesen(mg);
    document.querySelectorAll('[data-kommentare]').forEach(initKommentare);
    document.querySelectorAll('[data-abo]').forEach(initAbo);
    document.querySelectorAll('[data-teilen]').forEach(initTeilen);
    initMerken();
    var ml = document.querySelector('[data-merkliste]'); if (ml) initMerkliste(ml);
    var vl = document.querySelector('[data-vorlesen]'); if (vl) initVorlesen(vl);
    document.querySelectorAll('[data-frage]').forEach(initFrage);
    initReveal();
    track('page_view', { title: document.title });
    window.KOMPASS.flushQueue();
  });
})();
