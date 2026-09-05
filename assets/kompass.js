/* =====================================================================
   GaLaBau Kompass · gemeinsames Script
   - Masthead + Footer (eine Quelle für alle Seiten)
   - Logo (Inline-SVG, Wortmarke mit Webfont)
   - Tracking → GC-Dashboard (/api/public/kompass/event)
   - Helfer: Session, URL-Parameter (src / v / k), Offline-Puffer
   Alle Pfade relativ (Site läuft unter Apex-Domain UND unter
   frdlnk-gc.github.io/galabau-kompass/ als Vorschau).
   ===================================================================== */
(function () {
  'use strict';

  var CFG = {
    site: 'GaLaBau Kompass',
    apiBase: 'https://gc-tracking-dashboard.vercel.app/api/public/kompass',
    liveHosts: /(^|\.)galabau-kompass\.de$/i,
    previewHosts: /github\.io$|vercel\.app$/i
  };

  // ── Basis-Pfad (relativ zur aktuellen Seite → Root) ──────────────
  var depth = (document.body.getAttribute('data-depth') || '0') | 0;
  var ROOT = depth === 0 ? './' : new Array(depth + 1).join('../');
  window.KOMPASS_ROOT = ROOT;

  var IS_LIVE = CFG.liveHosts.test(location.hostname);
  var IS_PREVIEW = CFG.previewHosts.test(location.hostname);
  var IS_LOCAL = !IS_LIVE && !IS_PREVIEW;
  window.KOMPASS_ENV = IS_LIVE ? 'live' : (IS_PREVIEW ? 'preview' : 'local');

  // ── Logo ─────────────────────────────────────────────────────────
  function logoSvg(opts) {
    opts = opts || {};
    var word = opts.word !== false;
    var cls = 'logo' + (opts.size === 'lg' ? ' lg' : '');
    var mark =
      '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle class="ring" cx="32" cy="32" r="28.5"/>' +
      '<path class="tick" d="M32 4.5v6M32 53.5v6M4.5 32h6M53.5 32h6"/>' +
      '<g transform="rotate(-38 32 32)">' +
      '<path class="needle-n" d="M32 9.5C39.2 17.5 40.6 25.4 32 32.5C23.4 25.4 24.8 17.5 32 9.5Z"/>' +
      '<path class="rib" d="M32 12.5V31"/>' +
      '<path class="needle-s" d="M32 54.5L27.2 32.5H36.8L32 54.5Z"/>' +
      '</g>' +
      '<circle class="hub" cx="32" cy="32" r="3.3"/>' +
      '</svg>';
    var text = word ? '<span class="logo-word">GaLaBau <i>Kompass</i></span>' : '';
    return '<a class="' + cls + '" href="' + ROOT + '" aria-label="GaLaBau Kompass – Startseite">' + mark + text + '</a>';
  }
  window.kompassLogo = logoSvg;

  // ── Masthead / Footer ────────────────────────────────────────────
  var NAV = [
    { href: 'artikel/', label: 'Artikel' },
    { href: 'branchenumfrage/', label: 'Branchenumfrage 2026' },
    { href: 'standort/', label: 'Standort-Check' },
    { href: 'ueber-uns/', label: 'Über uns' }
  ];
  function isActive(href) {
    var p = location.pathname.replace(/index\.html$/, '');
    return href !== '' && p.indexOf('/' + href) > -1;
  }
  function renderHeader(el) {
    var links = NAV.map(function (n) {
      return '<a href="' + ROOT + n.href + '"' + (isActive(n.href) ? ' class="active"' : '') + '>' + n.label + '</a>';
    }).join('');
    el.className = 'masthead';
    el.innerHTML =
      '<div class="container">' +
      logoSvg() +
      '<nav aria-label="Hauptnavigation">' + links + '</nav>' +
      '<a class="btn sm nav-cta" href="' + ROOT + 'standort/">Standort-Check →</a>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">Menü <span aria-hidden="true">☰</span></button>' +
      '</div>' +
      '<div class="mobile-nav" id="mobile-nav">' +
      NAV.map(function (n) { return '<a href="' + ROOT + n.href + '">' + n.label + '</a>'; }).join('') +
      '<a class="cta" href="' + ROOT + 'standort/">Kostenloser Standort-Check →</a>' +
      '</div>';
    var btn = el.querySelector('.nav-toggle'), mob = el.querySelector('.mobile-nav');
    btn.addEventListener('click', function () {
      var open = mob.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  function renderFooter(el) {
    var year = new Date().getFullYear();
    el.className = 'site-footer';
    el.innerHTML =
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' + logoSvg() +
      '<p>Das Online-Magazin für Inhaber und Führungskräfte im Garten- und Landschaftsbau. Zahlen, Einordnung und Praxis – ohne Werbesprech.</p></div>' +
      '<div><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Artikel</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'ueber-uns/">Über uns</a></div>' +
      '<div><h4>Für Betriebe</h4><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'umfrage/">An der Umfrage teilnehmen</a></div>' +
      '<div><h4>Rechtliches</h4><a href="' + ROOT + 'impressum/">Impressum</a><a href="' + ROOT + 'datenschutz/">Datenschutz</a></div>' +
      '</div>' +
      '<div class="footer-bottom">' +
      '<span>© ' + year + ' GaLaBau Kompass · Eine Marke der GreenCareers GmbH, Köln</span>' +
      '<span class="gc"><img src="' + ROOT + 'assets/logos/greencareers-white.png" alt="GreenCareers"> In Kooperation mit dem Karrierenetzwerk GreenCareers</span>' +
      '</div></div>';
  }

  // ── Session / Parameter ──────────────────────────────────────────
  function uuidv4() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 3 | 8); return v.toString(16); });
  }
  var sessionId = (function () {
    try { var s = sessionStorage.getItem('kompass_session'); if (!s) { s = uuidv4(); sessionStorage.setItem('kompass_session', s); } return s; } catch (e) { return uuidv4(); }
  })();
  var params = (function () {
    var out = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { out[k] = v; }); } catch (e) {}
    return out;
  })();
  // Herkunft (src) + Vertriebler (v) über die Session merken – der Kunde klickt
  // vom QR über die Startseite weiter, die Zuordnung darf dabei nicht verloren gehen.
  ['src', 'v', 'k'].forEach(function (k) {
    try {
      if (params[k]) sessionStorage.setItem('kompass_' + k, params[k]);
      else if (sessionStorage.getItem('kompass_' + k)) params[k] = sessionStorage.getItem('kompass_' + k);
    } catch (e) {}
  });
  window.KOMPASS = {
    cfg: CFG, root: ROOT, env: window.KOMPASS_ENV, sessionId: sessionId, params: params, uuid: uuidv4,
    source: function () { return params.src || (params.v ? 'qr' : 'web'); },
    vertriebler: function () { return params.v || null; },
    kontakt: function () { return params.k || null; }
  };

  // ── Tracking ─────────────────────────────────────────────────────
  function track(eventType, meta) {
    var body = {
      event_type: eventType,
      session_id: sessionId,
      source: window.KOMPASS.source(),
      vertriebler: window.KOMPASS.vertriebler(),
      kontakt_id: window.KOMPASS.kontakt(),
      page: location.pathname,
      page_url: location.href,
      referrer: document.referrer || '',
      env: window.KOMPASS_ENV,
      meta: meta || {}
    };
    if (IS_LOCAL) { console.info('[Kompass local] event:', eventType, body); return; }
    try {
      fetch(CFG.apiBase + '/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true, credentials: 'omit' }).catch(function () {});
    } catch (e) {}
  }
  window.KOMPASS.track = track;

  // POST mit Offline-Puffer: schlägt der Versand fehl (Messehalle!), wird der
  // Datensatz lokal gepuffert und beim nächsten Seitenaufruf/online-Event nachgesendet.
  function post(path, body) {
    return fetch(CFG.apiBase + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit' })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status)); return j; }); });
  }
  window.KOMPASS.post = post;
  var QUEUE_KEY = 'kompass_queue';
  function readQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch (e) { return []; } }
  function writeQueue(q) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {} }
  window.KOMPASS.enqueue = function (path, body) { var q = readQueue(); q.push({ path: path, body: body, at: Date.now() }); writeQueue(q); return q.length; };
  window.KOMPASS.flushQueue = function () {
    var q = readQueue(); if (!q.length || IS_LOCAL) return Promise.resolve(0);
    var rest = [], done = 0;
    return q.reduce(function (p, item) {
      return p.then(function () { return post(item.path, item.body).then(function () { done++; }).catch(function () { rest.push(item); }); });
    }, Promise.resolve()).then(function () { writeQueue(rest); return done; });
  };
  window.KOMPASS.queueLength = function () { return readQueue().length; };
  window.addEventListener('online', function () { window.KOMPASS.flushQueue(); });

  // Echte Nutzergeste (Crawler-Guard, wie auf den GC-LPs)
  var loadedAt = Date.now(), realGesture = false;
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function (e) { if (e.isTrusted) realGesture = true; }, { passive: true, capture: true }); });
  window.KOMPASS.realUser = function () { return realGesture && (Date.now() - loadedAt) >= 1500; };

  // ── Reveal-Animationen ───────────────────────────────────────────
  function initReveal() {
    var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    function show(el) { el.classList.add('in'); var i = pending.indexOf(el); if (i > -1) pending.splice(i, 1); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { show(en.target); io.unobserve(en.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
      pending.forEach(function (el) { io.observe(el); });
    } else { pending.slice().forEach(show); }
  }

  // ── Init ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var h = document.querySelector('[data-kompass-header]'); if (h) renderHeader(h);
    var f = document.querySelector('[data-kompass-footer]'); if (f) renderFooter(f);
    document.querySelectorAll('[data-kompass-logo]').forEach(function (el) { el.innerHTML = logoSvg({ size: el.getAttribute('data-kompass-logo') || '' }); });
    document.querySelectorAll('[data-root-href]').forEach(function (a) { a.setAttribute('href', ROOT + a.getAttribute('data-root-href')); });
    initReveal();
    if (!IS_LIVE) {
      var n = document.createElement('div'); n.className = 'notice-preview'; n.textContent = IS_PREVIEW ? 'VORSCHAU' : 'LOKAL'; document.body.appendChild(n);
    }
    track('page_view', { title: document.title });
    window.KOMPASS.flushQueue();
  });
})();
