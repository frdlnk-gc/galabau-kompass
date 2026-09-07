/* =====================================================================
   GaLaBau Kompass · gemeinsames Script v5 („Frisch“)
   Kopf (Topbar, Markenzeile, klebende Ressortleiste, Inline-Suche, Drawer),
   Footer, Logo, Social-Links, Top-Themen-Slider, Archiv, Mehr-laden-Listen,
   Lesefortschritt, Kommentare, Meistgelesen, Montagskompass (E-Mail/WhatsApp),
   Teilen, Merkliste, Vorlesen, Frage der Woche, Termine-Datumsfilter,
   Kompass Club (Mitgliedschaft, Ausweis, Punkte, Stufen), Tracking,
   Offline-Puffer. Pfade relativ (data-depth).
   ===================================================================== */
(function () {
  'use strict';
  var SITE = window.KOMPASS_SITE || {};
  var CFG = {
    site: 'GaLaBau Kompass',
    apiBase: SITE.api_base || 'https://gc-tracking-dashboard.vercel.app/api/public/kompass',
    liveHosts: /(^|\.)galabau-kompass\.de$/i,
    previewHosts: /github\.io$|vercel\.app$/i,
    ressorts: SITE.ressorts || [ /* slug, Name, kurz, Leisten-Label */
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
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function lsJson(k, fallback) { try { var v = JSON.parse(ls(k) || 'null'); return v == null ? fallback : v; } catch (e) { return fallback; } }

  /* ── Logo: Kompassnadel im Kreis + aufrechte Wortmarke ── */
  function logoSvg(opts) {
    opts = opts || {};
    var mark = '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><rect class="kachel" width="64" height="64" rx="14"/><path class="nadel-n" d="M32 3.25 44.075 32 32 25.675 19.925 32Z"/><path class="nadel-s" d="M32 60.75 19.925 32 32 38.325 44.075 32Z"/></svg>';
    var text = opts.word === false ? '' : '<span class="logo-word">GaLaBau Kompass</span>';
    return '<a class="logo' + (opts.size === 'lg' ? ' lg' : '') + '" href="' + ROOT + '" aria-label="GaLaBau Kompass – Startseite">' + mark + text + '</a>';
  }
  window.kompassLogo = logoSvg;

  /* ── Icons ── */
  var SVG_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var SVG_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var SVG_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var SVG_SOC = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6A1.6 1.6 0 0 0 2 3.6v16.8A1.6 1.6 0 0 0 3.6 22h16.8a1.6 1.6 0 0 0 1.6-1.6V3.6A1.6 1.6 0 0 0 20.4 2zM8 19H5V9h3zM6.5 7.7A1.7 1.7 0 1 1 8.2 6a1.7 1.7 0 0 1-1.7 1.7zM19 19h-3v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6V19h-3V9h2.9v1.4a3.2 3.2 0 0 1 2.9-1.6c3.1 0 3.7 2 3.7 4.7z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.6 4c.6.3 1.1.4 1.5.6a3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.2c-.1-.1-.3-.2-.5-.3z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12 31 31 0 0 0 23 7.2zM9.8 15.1V8.9l6 3.1z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.8a5.7 5.7 0 1 0 4.9 5.6V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.4a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3v2.2H7.3V14h2.8v8z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
  };
  function socialLinks(withLabel) {
    return (SITE.social || []).filter(function (s) { return s.url && SVG_SOC[s.id]; }).map(function (s) {
      return '<a class="soc" href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="' + esc(s.name) + '" title="' + esc(s.name) + '">' + SVG_SOC[s.id] + (withLabel ? '<span>' + esc(s.name) + '</span>' : '') + '</a>';
    }).join('');
  }

  /* ── Kompass Club: Mitgliedschaft, Punkte, Stufen ── */
  /* Status-Stufen wie bei Wettbewerben der Branche: Mitglied → Bronze → Silber → Gold → Platin */
  var STUFEN = [[0, 'Mitglied', 'mitglied'], [25, 'Bronze', 'bronze'], [75, 'Silber', 'silber'], [200, 'Gold', 'gold'], [500, 'Platin', 'platin']];
  var REGELN = { lesen: 2, frage: 5, kommentar: 8, teilen: 3, merken: 1, beitritt: 10, abo: 5, inserat: 15, praxisfrage: 10 };
  function mitglied() { return lsJson('kompass_mitglied', null); }
  function mitgliedSetzen(m) { ls('kompass_mitglied', m ? JSON.stringify(m) : null); document.body.classList.toggle('is-mitglied', !!m); document.querySelectorAll('[data-club-chip]').forEach(function (el) { el.innerHTML = clubChip(); }); }
  var punkteSyncTimer = null;
  function punkteSync() { var m = mitglied(); if (!m || !m.token || IS_LOCAL) return; clearTimeout(punkteSyncTimer); punkteSyncTimer = setTimeout(function () { post('/punkte', { token: m.token, punkte: punkte().p | 0 }).then(function (j) { if (j.punkte > (punkte().p | 0)) { var st = punkte(); st.p = j.punkte; ls('kompass_punkte', JSON.stringify(st)); } }).catch(function () {}); }, 1500); }
  function punkte() { return lsJson('kompass_punkte', { p: 0, k: {} }); }
  function stufe(p) { var s = STUFEN[0], next = null; for (var i = 0; i < STUFEN.length; i++) { if (p >= STUFEN[i][0]) s = STUFEN[i]; else { next = STUFEN[i]; break; } } return { name: s[1], cls: s[2], ab: s[0], next: next }; }
  function addPunkte(art, key) {
    var n = REGELN[art] || 0; if (!n) return;
    var st = punkte(); var k = art + (key ? ':' + key : ''); if (st.k[k]) return;
    st.k[k] = Date.now(); st.p = (st.p | 0) + n; ls('kompass_punkte', JSON.stringify(st)); punkteSync();
    document.querySelectorAll('[data-club-chip]').forEach(function (el) { el.innerHTML = clubChip(); });
    if (window.KOMPASS && window.KOMPASS.onPunkte) window.KOMPASS.onPunkte(st);
  }
  function nrFmt(n) { n = String(n | 0); return n.length < 4 ? ('0000' + n).slice(-4) : n; }
  function clubChip() {
    var m = mitglied();
    if (!m) return '<a class="login-link" href="' + ROOT + 'club/anmelden/">Anmelden</a><a class="btn sm ghost club-btn" href="' + ROOT + 'club/">Kompass Club</a>';
    var p = punkte().p | 0, s = stufe(p);
    return '<a class="club-chip" href="' + ROOT + 'club/#mein-kompass" title="Mein Kompass · Nr. ' + nrFmt(m.nr) + ' · ' + p + ' Punkte · Status ' + s.name + '"><span class="club-dot">✓</span>Mein Kompass<small>· Nr. ' + nrFmt(m.nr) + ' · ' + esc(s.name) + '</small></a>';
  }

  /* ── Kopf / Fuß ── */
  function ressortLinks(kurz) { return CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/"' + (isActive('ressort/' + r[0]) ? ' class="active"' : '') + ' title="' + r[1] + '">' + (kurz ? r[3] : r[1]) + '</a>'; }).join(''); }
  function renderHeader(el) {
    var d = new Date();
    var top = '<div class="topbar"><div class="container"><span class="claim">Das Magazin für den Garten- und Landschaftsbau</span>' +
      '<nav aria-label="Service"><span class="datum"><b>' + TAGE[d.getDay()] + '</b>, ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear() + (IS_LIVE ? '' : '<span class="env">' + (IS_PREVIEW ? 'Vorschau' : 'Lokal') + '</span>') + '</span>' +
      '<a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine</a><a href="' + ROOT + 'zahlen/">Zahlen</a><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'ueber-uns/">Über uns</a><a href="' + ROOT + 'merkliste/" data-merk-link>Merkliste<span class="merk-anz" data-merk-anz></span></a></nav></div></div>';
    var brand = '<div class="brandbar"><div class="container">' + logoSvg({ size: 'lg' }) + fuerSwitchHtml() +
      '<div class="brand-tools"><div class="soc-row">' + socialLinks() + '</div><span data-club-chip>' + clubChip() + '</span><a class="btn sm abo-btn" href="' + ROOT + 'newsletter/">Der Montagskompass</a>' +
      '<button type="button" class="icon-btn nav-toggle" aria-label="Menü öffnen">' + SVG_MENU + '</button></div></div></div>';
    var nav = '<div class="navbar" data-navbar><div class="container"><span class="mini">' + logoSvg({ word: false }) + '</span>' +
      '<nav aria-label="Ressorts">' + ressortLinks(true) + '</nav>' +
      '<div class="suche-box" data-suche-box><button type="button" class="icon-btn such-btn" aria-label="Suche öffnen" aria-expanded="false">' + SVG_SEARCH + '</button>' +
      '<form class="suche-inline" role="search" action="' + ROOT + 'artikel/" method="get" autocomplete="off"><input type="search" class="input" name="q" placeholder="Suchen – z. B. Tarif, Bagger, Azubi" aria-label="Suche"><button type="button" class="suche-x" aria-label="Suche schließen">' + SVG_CLOSE + '</button></form>' +
      '<div class="suche-erg" data-suche-erg role="listbox"></div></div></div></div>';
    var drawer = '<div class="drawer" aria-hidden="true"><div class="scrim"></div><div class="panel"><div class="panel-kopf">' + logoSvg() + '<button type="button" class="icon-btn schliessen" aria-label="Menü schließen">' + SVG_CLOSE + '</button></div>' +
      '<form role="search" action="' + ROOT + 'artikel/" method="get" class="suche"><input type="search" class="input" name="q" placeholder="Suchen …" aria-label="Suche"><button type="submit" class="btn sm">Los</button></form>' +
      '<div class="drawer-cta"><a class="btn" href="' + ROOT + 'newsletter/">Der Montagskompass</a><span data-club-chip>' + clubChip() + '</span></div>' +
      '<div class="gruppe"><h4>Ressorts</h4>' + ressortLinks() + '</div>' +
      '<div class="gruppe"><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine &amp; Fristen</a><a href="' + ROOT + 'zahlen/">Zahlen der Branche</a><a href="' + ROOT + 'club/">Kompass Club</a><a href="' + ROOT + 'merkliste/">Merkliste</a><a href="' + ROOT + 'ueber-uns/">Über uns</a></div>' +
      '<div class="gruppe"><h4>Service</h4><a class="cta" href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a></div>' +
      (socialLinks() ? '<div class="soc-row">' + socialLinks() + '</div>' : '') + '</div></div>';
    el.innerHTML = top + brand + nav + drawer;
    // Ressortleiste aus dem Header lösen, damit position:sticky für die ganze Seite gilt
    var navEl = el.querySelector('[data-navbar]'); el.insertAdjacentElement('afterend', navEl);
    var navbar = navEl, brandEl = el.querySelector('.brandbar');
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (es) { navbar.classList.toggle('is-stuck', !es[0].isIntersecting); }, { threshold: 0 }).observe(brandEl); }
    var act = navbar.querySelector('nav a.active'); if (act && act.scrollIntoView) { try { act.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
    initSuche(navbar);
    initFuer(el.querySelector('[data-fuer-switch]'));
    var dr = el.querySelector('.drawer');
    function openDrawer(o) { dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', o ? 'false' : 'true'); document.body.style.overflow = o ? 'hidden' : ''; if (o) setTimeout(function () { dr.querySelector('.schliessen').focus(); }, 30); }
    el.querySelector('.nav-toggle').addEventListener('click', function () { openDrawer(true); });
    dr.querySelector('.schliessen').addEventListener('click', function () { openDrawer(false); });
    dr.querySelector('.scrim').addEventListener('click', function () { openDrawer(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') openDrawer(false); });
  }
  function renderFooter(el) {
    el.className = 'site-footer';
    var soc = socialLinks();
    el.innerHTML = '<div class="container"><div class="footer-grid">' +
      '<div class="footer-brand">' + logoSvg() + '<p>Das Online-Magazin für Inhaber, Führungskräfte und Fachkräfte im Garten- und Landschaftsbau. Zahlen, Einordnung und Praxis – jede Woche neue Beiträge, jeden Montag der Montagskompass, jeden Monat die Ausgabe als PDF.</p>' + (soc ? '<div class="soc-row">' + soc + '</div>' : '') + '</div>' +
      '<div><h4>Ressorts</h4>' + CFG.ressorts.map(function (r) { return '<a href="' + ROOT + 'ressort/' + r[0] + '/">' + r[1] + '</a>'; }).join('') + '</div>' +
      '<div><h4>Magazin</h4><a href="' + ROOT + 'artikel/">Alle Beiträge</a><a href="' + ROOT + 'ausgaben/">Ausgaben (PDF)</a><a href="' + ROOT + 'termine/">Termine &amp; Fristen</a><a href="' + ROOT + 'zahlen/">Zahlen der Branche</a><a href="' + ROOT + 'newsletter/">Der Montagskompass</a><a href="' + ROOT + 'club/">Kompass Club</a><a href="' + ROOT + 'club/anmelden/">Mitglieder-Login</a><a href="' + ROOT + 'ueber-uns/">Über uns</a><a href="mailto:redaktion@galabau-kompass.de">Redaktion kontaktieren</a></div>' +
      '<div><h4>Service &amp; Rechtliches</h4><a href="' + ROOT + 'standort/">Standort-Check</a><a href="' + ROOT + 'branchenumfrage/">Branchenumfrage 2026</a><a href="' + ROOT + 'merkliste/">Merkliste</a><a href="' + ROOT + 'impressum/">Impressum</a><a href="' + ROOT + 'datenschutz/">Datenschutz</a></div>' +
      '</div><div class="footer-bottom"><span>© ' + new Date().getFullYear() + ' GaLaBau Kompass · Das Magazin für den Garten- und Landschaftsbau</span><span>galabau-kompass.de<a href="' + ROOT + 'impressum/">Impressum</a><a href="' + ROOT + 'datenschutz/">Datenschutz</a></span></div></div>';
  }


  /* ── Zielgruppen-Schalter: Für Betriebe | Für Fachkräfte (Parameter schlägt Speicher, Wahl bleibt erhalten) ── */
  var FUER = { betriebe: 'Für Betriebe', fachkraefte: 'Für Fachkräfte' };
  function fuerWahl() {
    var p = params.fuer; if (p && FUER[p]) { ls('kompass_fuer', p); return p; }
    var b = document.body.dataset.fuer; if (b && FUER[b]) { ls('kompass_fuer', b); return b; }
    var g = ls('kompass_fuer'); return g && FUER[g] ? g : null;
  }
  function fuerSwitchHtml() {
    var w = fuerWahl();
    return '<div class="fuer-switch" role="group" aria-label="Sicht wählen" data-fuer-switch>' +
      Object.keys(FUER).map(function (k) { return '<a class="fuer-opt' + (w === k ? ' is-active' : '') + '" href="' + ROOT + 'fuer-' + k + '/" data-fuer="' + k + '"' + (w === k ? ' aria-current="true"' : '') + '>' + FUER[k] + '</a>'; }).join('') + '</div>';
  }
  function fuerSortieren(w) {
    // Listen mit data-zielgruppe stabil umsortieren: gewählte Zielgruppe, dann beide, dann die andere; ohne Wahl Originalreihenfolge
    document.querySelectorAll('.river, .t-grid3, .t-textlist, .rblock .t-textlist').forEach(function (box) {
      var kinder = Array.prototype.slice.call(box.children).filter(function (el) { return el.dataset && el.dataset.zielgruppe; });
      if (kinder.length < 2) return;
      kinder.forEach(function (el, i) { if (!el.dataset.fuerI) el.dataset.fuerI = String(i); });
      var rang = function (el) { var z = el.dataset.zielgruppe; return !w ? 0 : (z === w ? 0 : (z === 'beide' ? 1 : 2)); };
      kinder.sort(function (a, b) { return rang(a) - rang(b) || (a.dataset.fuerI | 0) - (b.dataset.fuerI | 0); });
      kinder.forEach(function (el) { box.appendChild(el); });
      if (box.classList.contains('river') && box.hasAttribute('data-mehr-liste')) { var n = 0; kinder.forEach(function (el) { el.hidden = n++ >= ((box.dataset.schritt | 0) || 6); }); }
    });
  }
  function initFuer(sw) {
    var w = fuerWahl(), istStart = document.body.classList.contains('home');
    if (istStart && !document.body.dataset.fuer && w && params.fuer === undefined) { location.replace(ROOT + 'fuer-' + w + '/'); return; }
    if (!istStart) fuerSortieren(w);
    if (!sw) return;
    sw.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      var k = a.dataset.fuer || null; if (!k) return;
      ls('kompass_fuer', k); track('fuer', { wahl: k }); if (istStart) return; e.preventDefault();
      sw.querySelectorAll('.fuer-opt').forEach(function (o) { o.classList.toggle('is-active', o.dataset.fuer === k); if (o.dataset.fuer === k) o.setAttribute('aria-current', 'true'); else o.removeAttribute('aria-current'); });
      try { var u = new URL(location.href); u.searchParams.set('fuer', k); history.replaceState(null, '', u.toString()); } catch (e2) {}
      params.fuer = k || undefined; fuerSortieren(k);
      if (window.KOMPASS.archivRender) window.KOMPASS.archivRender();
    });
  }
  window.KOMPASS_FUER = fuerWahl;

  /* ── Inline-Suche in der Ressortleiste ── */
  var indexPromise = null;
  function loadIndex() { if (!indexPromise) indexPromise = fetch(ROOT + 'assets/artikel-index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }); return indexPromise; }
  function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); }
  function score(a, terms) { var t = norm(a.title), d = norm(a.dek), tg = norm(a.tags.join(' ')), x = norm(a.text); var s = 0; terms.forEach(function (w) { if (t.indexOf(w) > -1) s += 12; if (tg.indexOf(w) > -1) s += 8; if (d.indexOf(w) > -1) s += 5; if (x.indexOf(w) > -1) s += 2; }); if (s > 0) { var f = window.KOMPASS_FUER ? window.KOMPASS_FUER() : null; if (f) s += a.zielgruppe === f ? 6 : (a.zielgruppe === 'beide' ? 2 : 0); } return s; }
  function hl(text, terms) { var out = esc(text); terms.forEach(function (w) { if (w.length < 2) return; try { out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); } catch (e) {} }); return out; }
  function initSuche(navbar) {
    var box = navbar.querySelector('[data-suche-box]'), btn = box.querySelector('.such-btn'), form = box.querySelector('.suche-inline'), input = form.querySelector('input'), erg = box.querySelector('[data-suche-erg]'), x = form.querySelector('.suche-x');
    var hot = -1, timer;
    function open(o) { navbar.classList.toggle('suche-offen', o); btn.setAttribute('aria-expanded', o ? 'true' : 'false'); if (o) { loadIndex(); setTimeout(function () { input.focus(); }, 30); } else { erg.innerHTML = ''; hot = -1; input.value = ''; } }
    btn.addEventListener('click', function () { open(true); });
    x.addEventListener('click', function () { open(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') open(false); if (e.key === '/' && document.activeElement && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); open(true); } });
    document.addEventListener('click', function (e) { if (navbar.classList.contains('suche-offen') && !box.contains(e.target)) open(false); });
    function render(q) {
      var terms = norm(q).split(/\s+/).filter(function (w) { return w.length > 1; });
      if (!terms.length) { erg.innerHTML = ''; hot = -1; return; }
      loadIndex().then(function (j) {
        var rows = j.artikel.map(function (a) { return { a: a, s: score(a, terms) }; }).filter(function (r) { return r.s > 0; }).sort(function (x, y) { return y.s - x.s || (y.a.datum > x.a.datum ? 1 : -1); });
        if (!rows.length) { erg.innerHTML = '<div class="leer">Keine Treffer zu „' + esc(q) + '“.</div>'; hot = -1; return; }
        erg.innerHTML = rows.slice(0, 6).map(function (r) { var a = r.a; return '<a href="' + ROOT + 'artikel/' + a.slug + '/" role="option">' + (a.bild ? '<img src="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg" alt="" loading="lazy">' : '<span class="t-noimg"></span>') + '<span><b>' + hl(a.title, terms) + '</b><small>' + esc(a.ressort_name) + ' · ' + esc(a.datum_kurz || kurzDate(a.datum)) + '</small></span></a>'; }).join('') +
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
  window.KOMPASS = { cfg: CFG, root: ROOT, env: window.KOMPASS_ENV, sessionId: sessionId, params: params, uuid: uuidv4, esc: esc, deDate: deDate, mitglied: mitglied, punkte: punkte, stufe: stufe, addPunkte: addPunkte,
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
    requestAnimationFrame(function () { items[0] && items[0].classList.add('is-active'); restart(); });
  }

  /* ── Mehr laden (Ressort-Listen) ── */
  function initMehrListe(liste) {
    var schritt = (liste.dataset.schritt | 0) || 6, btn = document.querySelector('[data-mehr-btn]'), items = Array.prototype.slice.call(liste.children), shown = schritt;
    function apply() { items.forEach(function (el, k) { el.hidden = k >= shown; }); if (btn) { var rest = items.length - shown; btn.hidden = rest <= 0; if (rest > 0) btn.textContent = 'Weitere Beiträge laden (' + Math.min(schritt, rest) + ' von ' + rest + ')'; } }
    if (btn) btn.addEventListener('click', function () { shown += schritt; apply(); track('mehr_laden', { n: shown }); });
    apply();
  }

  /* ── Lesefortschritt + Lesepunkte ── */
  function initProgress(bar) {
    var main = document.querySelector('.art-main'); if (!main) return;
    var slug = (document.querySelector('.art') || {}).dataset ? document.querySelector('.art').dataset.slug : null, gezaehlt = false;
    function upd() { var r = main.getBoundingClientRect(), h = window.innerHeight, total = r.height - h * .5, done = Math.min(Math.max(-r.top + h * .25, 0), Math.max(total, 1)); var pct = total > 0 ? Math.round(done / total * 100) : 100; bar.style.width = pct + '%'; if (!gezaehlt && slug && pct >= 60 && (Date.now() - loadedAt) > 12000) { gezaehlt = true; addPunkte('lesen', slug); } }
    window.addEventListener('scroll', upd, { passive: true }); window.addEventListener('resize', upd); upd();
  }

  /* ── Meistgelesen (Stats) ── */
  var statsPromise = null;
  function stats() { if (!statsPromise) statsPromise = IS_LOCAL ? Promise.resolve({ views: {} }) : getJson('/stats').catch(function () { return { views: {} }; }); return statsPromise; }

  /* ── Archiv: Suche / Filter / Sortierung ── */
  function teaserHtml(a, extra) {
    var media = a.bild ? '<a class="t-media" href="' + ROOT + 'artikel/' + a.slug + '/" tabindex="-1" aria-hidden="true"><img src="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg" srcset="' + ROOT + 'assets/img/' + a.bild + '-thumb.jpg 640w, ' + ROOT + 'assets/img/' + a.bild + '.jpg 1600w" sizes="(min-width: 720px) 250px, 112px" alt="" loading="lazy" width="1600" height="1067"></a>' : '';
    var fmt = a.format && a.format !== 'artikel' ? '<span class="t-format t-format-' + a.format + '">' + esc(a.format_name || a.format) + '</span>' : '';
    var neu = a.neu ? '<span class="t-neu">Neu</span>' : '';
    return '<article class="t t-horiz' + (a.bild ? '' : ' t-ohne-bild') + '" data-slug="' + a.slug + '" data-zielgruppe="' + esc(a.zielgruppe || 'beide') + '">' + media +
      '<div class="t-body"><div class="t-meta">' + neu + fmt + '<a class="t-ressort" href="' + ROOT + 'ressort/' + a.ressort + '/">' + esc(a.ressort_name) + '</a><time datetime="' + a.datum + '">' + esc(a.datum_kurz || kurzDate(a.datum)) + '</time></div>' +
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
      var sort = state.sort, f = window.KOMPASS_FUER ? window.KOMPASS_FUER() : null;
      var fr = function (a) { return !f ? 0 : (a.zielgruppe === f ? 0 : (a.zielgruppe === 'beide' ? 1 : 2)); };
      rows.sort(function (x, y) {
        if (f && sort !== 'alt' && fr(x.a) !== fr(y.a)) return fr(x.a) - fr(y.a);
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
      merkSync();
      try { var u = new URL(location.href); ['q', 'ressort', 'sort', 'format'].forEach(function (k) { if (state[k] && !(k === 'sort' && state[k] === 'neu') && !(k === 'ressort' && root.dataset.ressort)) u.searchParams.set(k, state[k]); else u.searchParams.delete(k); }); history.replaceState(null, '', u.toString()); } catch (e) {}
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); state.q = input.value.trim(); state.shown = 12; if (state.q) track('suche', { q: state.q }); render(); });
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = input.value.trim(); state.shown = 12; render(); }, 180); });
    chips.forEach(function (c) { c.addEventListener('click', function () { state.ressort = c.dataset.r; state.shown = 12; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); render(); }); });
    sortSel.addEventListener('change', function () { state.sort = sortSel.value; state.shown = 12; if (state.sort === 'gelesen') stats().then(function (s) { views = s.views || {}; render(); }); else render(); });
    mehr.addEventListener('click', function () { state.shown += 12; render(); });
    reset.addEventListener('click', function () { state.q = ''; state.format = ''; state.ressort = root.dataset.ressort || ''; input.value = ''; chips.forEach(function (x) { x.classList.toggle('is-active', x.dataset.r === state.ressort); }); render(); });
    root.querySelectorAll('[data-tag]').forEach(function (tg) { tg.addEventListener('click', function (e) { e.preventDefault(); input.value = tg.dataset.tag; state.q = tg.dataset.tag; state.shown = 12; render(); window.scrollTo({ top: root.offsetTop - 60, behavior: 'smooth' }); }); });
    window.KOMPASS.archivRender = render;
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
    var m = mitglied(); if (m && m.name && form.name && !form.name.value) form.name.value = m.name;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.classList.remove('active');
      var text = form.text.value.trim(); if (text.length < 10) { err.textContent = 'Bitte mindestens zehn Zeichen.'; err.classList.add('active'); return; }
      if (!window.KOMPASS.realUser()) { err.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; err.classList.add('active'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      var body = { slug: slug, name: form.name.value.trim(), ort: form.ort.value.trim(), text: text, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href };
      var done = function (j) { btn.disabled = false; btn.textContent = 'Kommentar senden'; form.text.value = ''; track('kommentar', { slug: slug }); addPunkte('kommentar', slug + ':' + Date.now()); if (j && j.kommentare) { render(j.kommentare); if (j.pending) { err.textContent = 'Danke – Ihr Kommentar wird nach Prüfung freigeschaltet.'; err.classList.add('active'); } } else { var cur = liste.querySelectorAll('.kommentar').length; var neu = { name: body.name, ort: body.ort, text: text, created_at: new Date().toISOString() }; if (cur) liste.insertAdjacentHTML('afterbegin', kHtml(neu)); else render([neu]); } };
      if (IS_LOCAL) { setTimeout(function () { done(null); }, 400); return; }
      post('/kommentare', body).then(done).catch(function (e2) { btn.disabled = false; btn.textContent = 'Kommentar senden'; err.textContent = /HTTP 429/.test(e2.message) ? 'Zu viele Kommentare in kurzer Zeit – bitte später noch einmal.' : 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.'; err.classList.add('active'); });
    });
  }

  /* ── Montagskompass: E-Mail, WhatsApp oder beides ── */
  function normPhone(raw) { var p = String(raw || '').replace(/[\s()/\-.]/g, ''); if (!p) return null; if (p.indexOf('00') === 0) p = '+' + p.slice(2); else if (p.indexOf('0') === 0) p = '+49' + p.slice(1); else if (p.indexOf('+') !== 0 && /^(49|43|41)\d{6,}/.test(p)) p = '+' + p; return /^\+\d{7,15}$/.test(p) ? p : null; }
  function kanalSetup(form) {
    var kMail = form.querySelector('[name=k_mail]'), kWa = form.querySelector('[name=k_wa]'), tel = form.querySelector('[data-abo-tel]'), mailF = form.querySelector('[data-abo-mail]');
    function sync() {
      form.querySelectorAll('.kanal').forEach(function (l) { var c = l.querySelector('input'); l.classList.toggle('is-on', !!(c && c.checked)); });
      if (tel) tel.hidden = !(kWa && kWa.checked);
      if (mailF && kMail && form.classList.contains('nur-kanal')) mailF.hidden = !kMail.checked;
    }
    [kMail, kWa].forEach(function (c) { if (c) c.addEventListener('change', sync); });
    sync();
    return { kanal: function () { var m = !kMail || kMail.checked, w = !!(kWa && kWa.checked); return m && w ? 'beide' : (w ? 'whatsapp' : 'mail'); }, mail: function () { return !kMail || kMail.checked; }, wa: function () { return !!(kWa && kWa.checked); } };
  }
  function initAbo(form) {
    var note = form.querySelector('[data-abo-note]'), k = kanalSetup(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); note.classList.remove('err');
      var email = (form.email ? form.email.value : '').trim(), telRaw = form.telefon ? form.telefon.value : '', tel = normPhone(telRaw);
      if (!k.mail() && !k.wa()) { note.textContent = 'Bitte E-Mail oder WhatsApp wählen.'; note.classList.add('err'); return; }
      if (k.mail() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte eine gültige E-Mail-Adresse eintragen.'; note.classList.add('err'); return; }
      if (k.wa() && !tel) { note.textContent = 'Bitte eine gültige Handynummer für WhatsApp eintragen.'; note.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      var body = { email: k.mail() ? email : (email || null), telefon: k.wa() ? tel : null, kanal: k.kanal(), session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href, quelle: location.pathname };
      var ok = function () { btn.disabled = false; if (form.email) form.email.value = ''; if (form.telefon) form.telefon.value = ''; note.textContent = 'Danke – Sie sind eingetragen. Der nächste Montagskompass kommt ' + ({ mail: 'per E-Mail', whatsapp: 'per WhatsApp', beide: 'per E-Mail und WhatsApp' })[body.kanal] + '.'; track('abo', { kanal: body.kanal }); addPunkte('abo'); };
      if (IS_LOCAL) { setTimeout(ok, 300); return; }
      post('/abo', body).then(ok).catch(function () { btn.disabled = false; note.textContent = 'Das hat nicht geklappt – bitte später erneut versuchen.'; note.classList.add('err'); });
    });
  }

  /* ── Kompass Club: Beitritt, Ausweis, Stufen ── */
  function renderAusweis(el, m) {
    if (!el) return;
    var p = punkte().p | 0, s = stufe(p);
    el.classList.toggle('leer', !m); el.classList.toggle('is-mitglied', !!m); if (m) el.classList.remove('is-form');
    var n = el.querySelector('[data-aw-name]'), nr = el.querySelector('[data-aw-nr]'), seit = el.querySelector('[data-aw-seit]'), st = el.querySelector('[data-aw-stufe]');
    if (n) n.textContent = m ? m.name : 'Ihr Name';
    if (nr) nr.textContent = 'Mitglied Nr. ' + (m ? nrFmt(m.nr) : '····');
    if (seit) { var d = m ? new Date(m.seit) : new Date(); seit.textContent = 'seit ' + MONATE[d.getMonth()] + ' ' + d.getFullYear(); }
    if (st) { st.textContent = s.name; st.className = 'ausweis-stufe st-' + s.cls; }
  }
  function renderStufen(root) {
    var p = punkte().p | 0, s = stufe(p);
    root.querySelectorAll('[data-punkte]').forEach(function (el) { el.textContent = p; });
    root.querySelectorAll('[data-stufe-name]').forEach(function (el) { el.textContent = s.name; el.className = 'ausweis-stufe st-' + s.cls; });
    var bar = root.querySelector('[data-punkte-balken]'), zeile = root.querySelector('[data-punkte-zeile]');
    if (bar) { var lo = s.ab, hi = s.next ? s.next[0] : Math.max(p, lo + 1); bar.style.width = Math.min(100, Math.round((p - lo) / (hi - lo) * 100)) + '%'; }
    if (zeile) zeile.textContent = s.next ? (s.next[0] - p) + ' Punkte bis „' + s.next[1] + '“' : 'Höchste Stufe erreicht';
    root.querySelectorAll('[data-stufen] li').forEach(function (li) { li.classList.toggle('is-aktuell', (li.dataset.p | 0) === s.ab); });
  }
  function initClub(root) {
    var form = root.querySelector('[data-club-form]'), note = form && form.querySelector('[data-abo-note]'), danke = root.querySelector('[data-club-danke]'), ausweis = root.querySelector('[data-ausweis]');
    var m = mitglied();
    function zeige() { m = mitglied(); root.classList.toggle('is-mitglied', !!m); document.body.classList.toggle('is-mitglied', !!m); if (danke) danke.classList.toggle('active', !!m); renderAusweis(ausweis, m); renderStufen(root); if (m) { var dn = root.querySelector('[data-danke-name]'); if (dn) dn.textContent = m.name; var dnr = root.querySelector('[data-danke-nr]'); if (dnr) dnr.textContent = nrFmt(m.nr); } }
    window.KOMPASS.onPunkte = function () { renderAusweis(ausweis, mitglied()); renderStufen(root); };
    zeige();
    if (!form) return;
    var k = kanalSetup(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault(); note.classList.remove('err');
      var name = form.name.value.trim(), email = form.email.value.trim(), tel = normPhone(form.telefon ? form.telefon.value : '');
      if (name.length < 2) { note.textContent = 'Bitte Ihren Namen eintragen.'; note.classList.add('err'); form.name.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte eine gültige E-Mail-Adresse eintragen.'; note.classList.add('err'); form.email.focus(); return; }
      if (k.wa() && !tel) { note.textContent = 'Bitte eine gültige Handynummer für WhatsApp eintragen.'; note.classList.add('err'); return; }
      if (!form.consent.checked) { note.textContent = 'Bitte der Datenschutzerklärung zustimmen.'; note.classList.add('err'); return; }
      if (!window.KOMPASS.realUser()) { note.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; note.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird eingetragen …';
      var body = { name: name, email: email, telefon: k.wa() ? tel : null, betrieb: form.betrieb.value.trim(), rolle: form.rolle.value, plz: form.plz.value.trim(), kanal: k.kanal(), consent: true, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href, quelle: location.pathname, vertriebler: window.KOMPASS.vertriebler() };
      var ok = function (j) {
        btn.disabled = false; btn.textContent = 'Kostenlos Mitglied werden';
        mitgliedSetzen({ nr: j.nr, name: name, email: email, seit: j.seit || new Date().toISOString(), token: j.token || null });
        addPunkte('beitritt'); if (k.mail() || k.wa()) addPunkte('abo');
        track('club', { nr: j.nr, kanal: body.kanal, neu: j.neu !== false });
        document.querySelectorAll('[data-club-chip]').forEach(function (el) { el.innerHTML = clubChip(); });
        zeige(); try { root.querySelector('[data-club-danke]').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e2) {}
      };
      if (IS_LOCAL) { setTimeout(function () { ok({ ok: true, nr: 1, neu: true }); }, 400); return; }
      post('/mitglied', body).then(ok).catch(function (e2) { btn.disabled = false; btn.textContent = 'Kostenlos Mitglied werden'; note.textContent = /HTTP 429/.test(e2.message) ? 'Zu viele Anmeldungen in kurzer Zeit – bitte später noch einmal.' : 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.'; note.classList.add('err'); });
    });
    var aus = root.querySelector('[data-club-austritt]');
    if (aus) aus.addEventListener('click', function () { if (confirm('Mitgliedsdaten aus diesem Browser entfernen? (Zum Austritt schreiben Sie an redaktion@galabau-kompass.de.)')) { mitgliedSetzen(null); zeige(); } });
    window.KOMPASS.clubZeige = zeige;
  }

  /* ── Teilen ── */
  function initTeilen(box) {
    var url = location.href.split('#')[0].split('?')[0], title = box.dataset.title || document.title;
    var wa = box.querySelector('[data-share=whatsapp]'), li = box.querySelector('[data-share=linkedin]'), fb = box.querySelector('[data-share=facebook]'), ma = box.querySelector('[data-share=mail]'), cp = box.querySelector('[data-share=copy]');
    if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(title + ' – ' + url);
    if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
    if (fb) fb.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url);
    if (ma) ma.href = 'mailto:?subject=' + encodeURIComponent(title) + '&body=' + encodeURIComponent(title + '\n' + url);
    if (cp) cp.addEventListener('click', function () { var ok = function () { cp.classList.add('ok'); cp.title = 'Link kopiert'; setTimeout(function () { cp.classList.remove('ok'); cp.title = 'Link kopieren'; }, 1800); }; try { navigator.clipboard.writeText(url).then(ok); } catch (e) { try { window.prompt('Link kopieren:', url); } catch (e2) {} } });
    box.querySelectorAll('[data-share]').forEach(function (el) { el.addEventListener('click', function () { track('teilen', { via: el.dataset.share }); addPunkte('teilen', url + ':' + el.dataset.share); }); });
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
      if (i > -1) l.splice(i, 1); else { l.unshift(slug); track('merken', { slug: slug }); addPunkte('merken', slug); }
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
      box.classList.add('is-done'); note.textContent = 'Ergebnis in Prozent · wird laufend aktualisiert.';
    }
    function load() { if (IS_LOCAL) { var c = {}; opts.forEach(function (o, i) { c[o.dataset.opt] = [12, 9, 15, 4, 3][i] || 2; }); if (mine !== null) c[mine] = (c[mine] || 0) + 1; show(c); return; } getJson('/frage?id=' + encodeURIComponent(id)).then(function (j) { show(j.counts || {}); }).catch(function () { note.textContent = 'Ergebnis gerade nicht abrufbar.'; }); }
    opts.forEach(function (o) { o.addEventListener('click', function () {
      if (box.classList.contains('is-done')) return;
      mine = o.dataset.opt; try { localStorage.setItem(key, mine); } catch (e) {}
      o.disabled = true; note.textContent = 'Stimme wird gezählt …';
      var body = { poll_id: id, option: mine | 0, session_id: sessionId, env: window.KOMPASS_ENV };
      track('frage', { id: id, opt: mine }); addPunkte('frage', id);
      if (IS_LOCAL) { load(); return; }
      post('/frage', body).then(function (j) { show(j.counts || {}); }).catch(function () { load(); });
    }); });
    if (mine !== null) load();
  }

  /* ── Termine: Vergangenes automatisch ausblenden bzw. nach „Bereits vorbei“ schieben ── */
  function initTermine() {
    var heute = new Date(); heute.setHours(0, 0, 0, 0);
    var vorbeiListe = document.querySelector('[data-termine-vorbei]'), vorbeiBlock = document.querySelector('[data-termine-vorbei-block]');
    document.querySelectorAll('li[data-bis]').forEach(function (li) {
      var d = new Date(li.dataset.bis + 'T23:59:59'); if (!(d < heute)) return;
      li.classList.add('ist-vorbei');
      if (vorbeiListe && li.closest('[data-termine-alle]')) { li.querySelectorAll('.termin-text,.termin-ort').forEach(function (x) { x.remove(); }); vorbeiListe.insertBefore(li, vorbeiListe.firstChild); }
      else li.hidden = true;
    });
    document.querySelectorAll('[data-termine-alle] .termin-monat').forEach(function (m) { if (!m.querySelector('li:not([hidden])')) m.hidden = true; });
    if (vorbeiBlock) vorbeiBlock.hidden = !vorbeiListe.querySelector('li');
    document.querySelectorAll('[data-termine-box]').forEach(function (box) { if (!box.querySelector('li:not([hidden])')) box.hidden = true; });
  }

  /* ── Social-Box (nur wenn Kanäle konfiguriert sind) ── */
  function initSocialBox(box) { var s = socialLinks(true); if (!s) return; box.querySelector('[data-social-links]').innerHTML = s; box.hidden = false; }


  /* ── Kompass-Börse (Inserate der Mitglieder) ── */
  var KATS = { maschine: 'Maschine', geraet: 'Gerät', material: 'Material & Pflanzen', fahrzeug: 'Fahrzeug', sonstiges: 'Sonstiges' };
  var ARTEN = { verkauf: 'Zu verkaufen', verschenken: 'Zu verschenken', suche: 'Gesucht' };
  function inseratHtml(x) {
    var preis = x.art === 'verschenken' ? 'Kostenlos' : (x.art === 'suche' ? '' : (x.preis || 'Preis auf Anfrage'));
    var neu = (Date.now() - new Date(x.created_at).getTime()) < 7 * 86400000 && (x.status || 'aktiv') === 'aktiv';
    var st = x.status === 'reserviert' ? '<span class="pill">Reserviert</span>' : (x.status === 'verkauft' ? '<span class="pill grau">Verkauft</span>' : '');
    return '<article class="inserat' + (x.status === 'verkauft' ? ' is-verkauft' : '') + '" data-id="' + esc(x.id) + '"><div class="inserat-kopf">' + (neu ? '<span class="pill lime">Neu</span>' : '') + st + '<span class="pill ' + (x.art === 'suche' ? 'blau' : (x.art === 'verschenken' ? 'lime' : 'gruen')) + '">' + esc(ARTEN[x.art] || x.art) + '</span><span class="pill">' + esc(KATS[x.kategorie] || x.kategorie) + '</span></div>' +
      '<h3>' + esc(x.titel) + '</h3>' + (preis ? '<div class="inserat-preis">' + esc(preis) + '</div>' : '') + '<p class="inserat-text">' + esc(x.beschreibung) + '</p>' +
      '<div class="inserat-meta">' + esc([x.plz, x.ort].filter(Boolean).join(' ')) + (x.plz || x.ort ? ' · ' : '') + kurzDate(x.created_at) + '</div>' +
      '<div class="inserat-kontakt" data-kontakt>' + (x.status === 'verkauft' ? '<span class="gate-note">Bereits verkauft.</span>' : (mitglied() ? '<button type="button" class="btn sm ghost" data-kontakt-btn>Kontakt anzeigen</button>' : '<span class="gate-note">Kontaktdaten sehen nur Club-Mitglieder. <a href="' + ROOT + 'club/#beitreten">Kostenlos beitreten</a></span>')) + '</div></article>';
  }
  /* Eigene Inserate verwalten: bearbeiten, reservieren, verkauft, löschen (wie bei Kleinanzeigen) */
  function meinAktion(id, aktion, status) {
    var m = mitglied(); if (!m) return Promise.reject(new Error('kein Mitglied'));
    if (IS_LOCAL) return Promise.resolve({ ok: true });
    return post('/inserate', { aktion: aktion, id: id, status: status, token: m.token || null, email: m.email || '', session_id: sessionId, env: window.KOMPASS_ENV });
  }
  function renderMeineInserate(ul, items, reload) {
    var LBL = { aktiv: 'Aktiv', reserviert: 'Reserviert', verkauft: 'Verkauft' };
    ul.innerHTML = items.length ? items.map(function (x) {
      return '<li data-id="' + esc(x.id) + '"><div class="mein-zeile"><span><b>' + esc(x.titel) + '</b><br><small class="muted">' + esc(ARTEN[x.art] || x.art) + ' · ' + kurzDate(x.created_at) + (x.approved === false ? ' · wartet auf Freigabe' : '') + '</small></span><span class="st">' + esc(LBL[x.status] || x.status) + '</span></div>' +
        '<div class="mein-akt">' + ['aktiv', 'reserviert', 'verkauft'].map(function (st) { return '<button type="button" data-akt="status" data-status="' + st + '"' + (x.status === st ? ' class="is-on"' : '') + '>' + LBL[st] + '</button>'; }).join('') +
        '<a href="' + ROOT + 'boerse/?edit=' + esc(x.id) + '#inserieren" data-akt="bearbeiten">Bearbeiten</a><button type="button" class="del" data-akt="loeschen">Löschen</button></div></li>';
    }).join('') : '<li class="mein-leer">Noch kein Inserat. <a href="' + ROOT + 'boerse/#inserieren">Jetzt inserieren</a></li>';
    if (ul.dataset.bound) return; ul.dataset.bound = '1';
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('[data-akt]'); if (!b || b.tagName === 'A') return;
      var li = b.closest('li'), id = li.dataset.id, akt = b.dataset.akt;
      if (akt === 'loeschen' && !confirm('Inserat wirklich löschen?')) return;
      li.style.opacity = '.5';
      meinAktion(id, akt, b.dataset.status).then(function () { track('inserat', { aktion: akt }); reload(); }).catch(function () { li.style.opacity = ''; alert('Das hat nicht geklappt. Bitte erneut versuchen.'); });
    });
  }
  function ladeMeineInserate(ul, extra) {
    var m = mitglied(); if (!m || !ul) return;
    function reload() { ladeMeineInserate(ul, extra); if (extra) extra(); }
    if (IS_LOCAL || !m.token) { renderMeineInserate(ul, IS_LOCAL ? [{ id: 'demo-1', titel: 'Beispiel: Rüttelplatte 90 kg', art: 'verkauf', status: 'aktiv', approved: true, created_at: new Date().toISOString() }] : [], reload); return; }
    getJson('/inserate?mein=1&token=' + encodeURIComponent(m.token)).then(function (j) { renderMeineInserate(ul, j.inserate || [], reload); }).catch(function () { ul.innerHTML = '<li class="mein-leer">Gerade nicht abrufbar.</li>'; });
  }
  function initBoerse(root) {
    var liste = root.querySelector('[data-inserate]'), leer = root.querySelector('[data-boerse-leer]'), chips = root.querySelectorAll('[data-kat]'), anz = root.querySelector('[data-inserate-anzahl]'), form = root.querySelector('[data-inserat-form]'), limit = root.dataset.limit | 0;
    var daten = [], kat = '';
    function render() {
      var rows = daten.filter(function (x) { return !kat || x.kategorie === kat; }); if (limit) rows = rows.slice(0, limit);
      liste.innerHTML = rows.map(inseratHtml).join('');
      if (leer) leer.hidden = rows.length > 0;
      if (anz) anz.textContent = daten.length ? daten.length + (daten.length === 1 ? ' Inserat' : ' Inserate') : 'Noch keine Inserate';
    }
    function load() {
      if (IS_LOCAL) { daten = [{ id: 'demo-1', titel: 'Beispiel: Rüttelplatte 90 kg, Baujahr 2021', kategorie: 'geraet', art: 'verkauf', preis: '650 €', beschreibung: 'So sieht ein Inserat aus (nur lokale Vorschau).', plz: '50670', ort: 'Köln', created_at: new Date().toISOString() }]; render(); return; }
      getJson('/inserate').then(function (j) { daten = j.inserate || []; render(); }).catch(function () { if (anz) anz.textContent = 'Börse gerade nicht erreichbar.'; });
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { kat = c.dataset.kat; chips.forEach(function (x) { x.classList.toggle('is-active', x === c); }); render(); }); });
    liste.addEventListener('click', function (e) {
      var b = e.target.closest('[data-kontakt-btn]'); if (!b) return;
      var m = mitglied(); if (!m) return;
      var box = b.closest('[data-kontakt]'), id = b.closest('.inserat').dataset.id; b.disabled = true; b.textContent = 'Wird geladen …';
      var show = function (k) { box.innerHTML = '<b>' + esc(k.name || 'Inserent') + '</b>' + (k.telefon ? ' · <a href="tel:' + esc(k.telefon) + '">' + esc(k.telefon) + '</a>' : '') + (k.email ? ' · <a href="mailto:' + esc(k.email) + '">' + esc(k.email) + '</a>' : ''); track('inserat', { kontakt: id }); };
      if (IS_LOCAL) { show({ name: 'Max Muster', telefon: '+49 170 0000000', email: 'max@beispiel.de' }); return; }
      getJson('/inserate?kontakt=' + encodeURIComponent(id) + '&email=' + encodeURIComponent(m.email || '') + (m.token ? '&token=' + encodeURIComponent(m.token) : '')).then(function (j) { if (j.ok && j.kontakt) show(j.kontakt); else { box.innerHTML = '<span class="gate-note">' + esc(j.error || 'Kontakt nicht verfügbar.') + '</span>'; } }).catch(function () { box.innerHTML = '<span class="gate-note">Kontakt gerade nicht abrufbar.</span>'; });
    });
    var meine = root.querySelector('[data-meine-inserate]'); if (meine) ladeMeineInserate(meine, load);
    var editId = params.edit && /^[0-9a-f-]{36}$/i.test(params.edit) ? params.edit : null;
    if (form) {
      var note = form.querySelector('[data-abo-note]'), m0 = mitglied();
      if (m0) { if (form.kontakt_name && !form.kontakt_name.value) form.kontakt_name.value = m0.name || ''; if (form.kontakt_email && !form.kontakt_email.value) form.kontakt_email.value = m0.email || ''; }
      if (editId && m0 && m0.token && !IS_LOCAL) { getJson('/inserate?mein=1&token=' + encodeURIComponent(m0.token)).then(function (j) { var x = (j.inserate || []).filter(function (i) { return i.id === editId; })[0]; if (!x) return; form.id.value = x.id; form.titel.value = x.titel; form.kategorie.value = x.kategorie; form.art.value = x.art; form.preis.value = x.preis || ''; form.beschreibung.value = x.beschreibung; form.plz.value = x.plz || ''; form.ort.value = x.ort || ''; form.kontakt_name.value = x.kontakt_name || ''; form.kontakt_email.value = x.kontakt_email || ''; form.kontakt_telefon.value = x.kontakt_telefon || ''; form.querySelector('button[type=submit]').textContent = 'Änderungen speichern'; var h = form.querySelector('h2, .intro'); root.querySelector('[data-boerse-form-titel]') && (root.querySelector('[data-boerse-form-titel]').textContent = 'Inserat bearbeiten'); }); }
      form.addEventListener('submit', function (e) {
        e.preventDefault(); note.classList.remove('err');
        var m = mitglied(); if (!m) { note.textContent = 'Inserate können nur Club-Mitglieder aufgeben.'; note.classList.add('err'); return; }
        var titel = form.titel.value.trim(), text = form.beschreibung.value.trim();
        if (titel.length < 5) { note.textContent = 'Bitte einen aussagekräftigen Titel eintragen.'; note.classList.add('err'); form.titel.focus(); return; }
        if (text.length < 20) { note.textContent = 'Bitte mindestens zwanzig Zeichen Beschreibung.'; note.classList.add('err'); form.beschreibung.focus(); return; }
        if (/https?:\/\/|www\./i.test(titel + ' ' + text)) { note.textContent = 'Bitte keine Links – die Börse ist werbefrei.'; note.classList.add('err'); return; }
        var tel = normPhone(form.kontakt_telefon.value), mail = form.kontakt_email.value.trim();
        if (!tel && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { note.textContent = 'Bitte Telefonnummer oder E-Mail für Interessenten angeben.'; note.classList.add('err'); return; }
        if (!window.KOMPASS.realUser()) { note.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; note.classList.add('err'); return; }
        var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird eingestellt …';
        var bearbeiten = !!(form.id && form.id.value);
        var body = { aktion: bearbeiten ? 'bearbeiten' : 'neu', id: bearbeiten ? form.id.value : undefined, titel: titel, kategorie: form.kategorie.value, art: form.art.value, preis: form.preis.value.trim(), beschreibung: text, plz: form.plz.value.trim(), ort: form.ort.value.trim(), kontakt_name: form.kontakt_name.value.trim(), kontakt_email: mail, kontakt_telefon: tel, email: m.email || '', token: m.token || null, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV };
        var ok = function (j) { btn.disabled = false; btn.textContent = 'Inserat einstellen'; form.reset(); if (form.id) form.id.value = ''; if (form.kontakt_name) form.kontakt_name.value = m.name || ''; if (form.kontakt_email) form.kontakt_email.value = m.email || ''; note.textContent = bearbeiten ? 'Gespeichert – Ihr Inserat ist aktualisiert.' : (j.pending ? 'Danke – Ihr Inserat erscheint nach kurzer Prüfung.' : 'Danke – Ihr Inserat ist online. Es läuft 60 Tage. Sie verwalten es unter „Meine Inserate“.'); if (bearbeiten) { load(); } else if (j.inserat && !j.pending) { daten.unshift(j.inserat); render(); } if (meine) ladeMeineInserate(meine, load); track('inserat', { neu: !bearbeiten }); if (!bearbeiten) addPunkte('inserat', (j.inserat && j.inserat.id) || Date.now()); try { history.replaceState(null, '', location.pathname + '#inserieren'); } catch (e2) {} };
        if (IS_LOCAL) { setTimeout(function () { ok({ ok: true, inserat: Object.assign({ id: 'l' + Date.now(), created_at: new Date().toISOString() }, body) }); }, 400); return; }
        post('/inserate', body).then(ok).catch(function (e2) { btn.disabled = false; btn.textContent = 'Inserat einstellen'; note.textContent = /HTTP 403/.test(e2.message) ? 'Diese E-Mail ist nicht als Mitglied eingetragen. Bitte zuerst dem Club beitreten.' : (/HTTP 429/.test(e2.message) ? 'Zu viele Inserate in kurzer Zeit.' : 'Das hat nicht geklappt. Bitte erneut versuchen.'); note.classList.add('err'); });
      });
    }
    load();
  }

  /* ── Praxisfrage an die Redaktion (Mitglieder) ── */
  function initPraxisfrage(form) {
    var note = form.querySelector('[data-abo-note]'), m0 = mitglied();
    if (m0 && form.betrieb && !form.betrieb.value) form.betrieb.value = '';
    form.addEventListener('submit', function (e) {
      e.preventDefault(); note.classList.remove('err');
      var m = mitglied(); if (!m) { note.textContent = 'Praxisfragen können Club-Mitglieder stellen – der Beitritt ist kostenlos.'; note.classList.add('err'); return; }
      var frage = form.frage.value.trim(); if (frage.length < 20) { note.textContent = 'Bitte die Frage etwas ausführlicher stellen (mindestens zwanzig Zeichen).'; note.classList.add('err'); form.frage.focus(); return; }
      if (!window.KOMPASS.realUser()) { note.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; note.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird gesendet …';
      var body = { frage: frage, kontext: form.kontext ? form.kontext.value.trim() : '', betrieb: form.betrieb ? form.betrieb.value.trim() : '', anonym: form.anonym ? form.anonym.checked : true, name: m.name || '', email: m.email || '', token: m.token || null, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV };
      var ok = function () { btn.disabled = false; btn.textContent = 'Frage an die Redaktion senden'; form.frage.value = ''; if (form.kontext) form.kontext.value = ''; note.textContent = 'Danke – die Redaktion meldet sich, sobald die Antwort steht. Veröffentlichte Antworten erscheinen unter Praxisfragen.'; track('praxisfrage', {}); addPunkte('praxisfrage', Date.now()); };
      if (IS_LOCAL) { setTimeout(ok, 400); return; }
      post('/praxisfrage', body).then(ok).catch(function () { btn.disabled = false; btn.textContent = 'Frage an die Redaktion senden'; note.textContent = 'Das hat nicht geklappt. Bitte erneut versuchen.'; note.classList.add('err'); });
    });
  }


  /* ── Mitglied werden direkt auf dem Ausweis (Name tippen → Formular klappt auf) ── */
  function initAusweisForm(card) {
    var form = card.querySelector('[data-ausweis-form]'), nameIn = card.querySelector('[data-aw-input]'); if (!form || !nameIn) return;
    var note = form.querySelector('[data-abo-note]'), k = kanalSetup(form), willkommen = card.querySelector('[data-aw-willkommen]');
    function auf() { if (!mitglied()) card.classList.add('is-form'); }
    nameIn.addEventListener('focus', auf); nameIn.addEventListener('input', auf);
    card.addEventListener('click', function (e) { if (!mitglied() && !card.classList.contains('is-form') && !e.target.closest('a')) { card.classList.add('is-form'); nameIn.focus(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); note.classList.remove('err');
      var name = nameIn.value.trim(), email = form.email.value.trim(), tel = normPhone(form.telefon ? form.telefon.value : '');
      if (name.length < 2) { note.textContent = 'Bitte Ihren Namen eintragen.'; note.classList.add('err'); nameIn.focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte eine gültige E-Mail-Adresse eintragen.'; note.classList.add('err'); form.email.focus(); return; }
      if (k.wa() && !tel) { note.textContent = 'Bitte eine Handynummer für WhatsApp eintragen.'; note.classList.add('err'); return; }
      if (!form.consent.checked) { note.textContent = 'Bitte der Speicherung zustimmen.'; note.classList.add('err'); return; }
      if (!window.KOMPASS.realUser()) { note.textContent = 'Bitte versuchen Sie es in einem Moment erneut.'; note.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Wird eingetragen …';
      var body = { name: name, email: email, telefon: k.wa() ? tel : null, kanal: k.kanal(), consent: true, website: form.website.value, session_id: sessionId, env: window.KOMPASS_ENV, page_url: location.href, quelle: location.pathname + '#ausweis', vertriebler: window.KOMPASS.vertriebler() };
      var ok = function (j) {
        btn.disabled = false; btn.textContent = 'Jetzt Mitglied werden';
        mitgliedSetzen({ nr: j.nr, name: name, email: email, seit: j.seit || new Date().toISOString(), token: j.token || null });
        addPunkte('beitritt'); addPunkte('abo'); track('club', { nr: j.nr, kanal: body.kanal, neu: j.neu !== false, via: 'ausweis' });
        document.querySelectorAll('[data-ausweis],[data-ausweis-vorschau]').forEach(function (el) { renderAusweis(el, mitglied()); });
        var b = j.bestaetigung || {}; var wege = []; if (b.mail) wege.push('per E-Mail an ' + email); if (b.whatsapp) wege.push('per WhatsApp');
        if (willkommen) willkommen.textContent = 'Willkommen im Club, ' + name.split(' ')[0] + '. Ihre Nummer: ' + nrFmt(j.nr) + '.' + (wege.length ? ' Die Bestätigung kommt ' + wege.join(' und ') + '.' : ' Der nächste Montagskompass kommt ' + ({ mail: 'per E-Mail', whatsapp: 'per WhatsApp', beide: 'per E-Mail und WhatsApp' })[body.kanal] + '.');
        if (window.KOMPASS.clubZeige) window.KOMPASS.clubZeige();
        document.querySelectorAll('[data-mein]').forEach(initMein);
      };
      if (IS_LOCAL) { setTimeout(function () { ok({ ok: true, nr: 1, neu: true, token: 'lokal', bestaetigung: {} }); }, 400); return; }
      post('/mitglied', body).then(ok).catch(function (e2) { btn.disabled = false; btn.textContent = 'Jetzt Mitglied werden'; note.textContent = /HTTP 429/.test(e2.message) ? 'Zu viele Anmeldungen in kurzer Zeit – bitte später noch einmal.' : 'Das hat nicht geklappt. Bitte versuchen Sie es erneut.'; note.classList.add('err'); });
    });
  }

  /* ── Anmelden mit E-Mail + Mitgliedsnummer ── */
  function initLogin(form) {
    var note = form.querySelector('[data-abo-note]');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); note.classList.remove('err');
      var email = form.email.value.trim(), nr = String(form.nr.value || '').replace(/\D/g, '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte die E-Mail-Adresse der Mitgliedschaft eintragen.'; note.classList.add('err'); return; }
      if (!nr) { note.textContent = 'Bitte Ihre Mitgliedsnummer eintragen (steht auf dem Ausweis und in der Bestätigung).'; note.classList.add('err'); return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      var ok = function (j) { var m = j.mitglied || {}; mitgliedSetzen({ nr: m.nr || (nr | 0), name: m.name || '', email: email, seit: m.seit || new Date().toISOString(), token: j.token || null }); if (m.punkte > (punkte().p | 0)) { var st = punkte(); st.p = m.punkte; ls('kompass_punkte', JSON.stringify(st)); } track('club', { login: true }); if (document.body.classList.contains('club-seite')) { location.hash = '#mein-kompass'; location.reload(); } else location.href = ROOT + 'club/#mein-kompass'; };
      if (IS_LOCAL) { setTimeout(function () { ok({ ok: true, token: 'lokal', mitglied: { nr: nr | 0, name: 'Max Mustermann', punkte: 12 } }); }, 300); return; }
      post('/login', { email: email, nr: nr | 0, session_id: sessionId, env: window.KOMPASS_ENV }).then(ok).catch(function (e2) { btn.disabled = false; note.textContent = /HTTP 404|HTTP 403/.test(e2.message) ? 'Keine Mitgliedschaft mit dieser Kombination gefunden. Bitte E-Mail und Nummer prüfen.' : 'Anmeldung gerade nicht möglich. Bitte später erneut versuchen.'; note.classList.add('err'); });
    });
    // Mitgliedsnummer vergessen: Nummer geht an die hinterlegte E-Mail (bis SMTP steht: Redaktion meldet sich)
    var erinnern = form.querySelector('[data-nr-vergessen]');
    if (erinnern) erinnern.addEventListener('click', function () {
      note.classList.remove('err');
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { note.textContent = 'Bitte oben die E-Mail-Adresse der Mitgliedschaft eintragen – wir schicken die Nummer dorthin.'; note.classList.add('err'); form.email.focus(); return; }
      erinnern.disabled = true;
      var fertig = function () { note.textContent = 'Wenn zu ' + email + ' eine Mitgliedschaft besteht, bekommen Sie Ihre Mitgliedsnummer per E-Mail.'; track('club', { erinnerung: true }); };
      if (IS_LOCAL) { setTimeout(fertig, 300); return; }
      post('/login', { email: email, erinnern: true, session_id: sessionId, env: window.KOMPASS_ENV }).then(fertig).catch(function () { erinnern.disabled = false; note.textContent = 'Gerade nicht möglich. Bitte später erneut versuchen oder an redaktion@galabau-kompass.de schreiben.'; note.classList.add('err'); });
    });
  }

  /* ── Mein Kompass (Mitgliederbereich) ── */
  function initMein(root) {
    var m = mitglied(); root.hidden = !m; if (!m) return;
    var ins = root.querySelector('[data-mein-inserate]'), pf = root.querySelector('[data-mein-fragen]'), kanal = root.querySelector('[data-mein-kanal]'), ab = root.querySelector('[data-abmelden]');
    var KANAL = { mail: 'per E-Mail', whatsapp: 'per WhatsApp', beide: 'per E-Mail und WhatsApp' };
    function render(d) {
      if (ins) renderMeineInserate(ins, d.inserate || [], function () { initMein(root); });
      if (pf) pf.innerHTML = (d.praxisfragen || []).length ? d.praxisfragen.map(function (x) { return '<li><span><b>' + esc(x.frage.slice(0, 90)) + (x.frage.length > 90 ? '…' : '') + '</b><br><small class="muted">' + kurzDate(x.created_at) + '</small></span><span class="st">' + esc({ neu: 'eingegangen', bearbeitung: 'in Bearbeitung', beantwortet: 'beantwortet', veroeffentlicht: 'veröffentlicht' }[x.status] || x.status) + '</span></li>'; }).join('') : '<li class="mein-leer">Noch keine Frage gestellt. <a href="#praxisfrage">Frage stellen</a></li>';
      if (kanal && d.mitglied) kanal.textContent = 'Der Montagskompass kommt ' + (KANAL[d.mitglied.kanal] || 'per E-Mail') + (d.mitglied.telefon ? ' (' + esc(d.mitglied.telefon) + ')' : '') + '.';
      if (d.mitglied && d.mitglied.punkte > (punkte().p | 0)) { var st = punkte(); st.p = d.mitglied.punkte; ls('kompass_punkte', JSON.stringify(st)); if (window.KOMPASS.onPunkte) window.KOMPASS.onPunkte(st); }
    }
    if (IS_LOCAL || !m.token) render({ mitglied: { kanal: 'mail', punkte: 0 }, inserate: [], praxisfragen: [] });
    else getJson('/mitglied?token=' + encodeURIComponent(m.token)).then(function (j) { if (j.ok) render(j); else render({}); }).catch(function () { render({}); });
    if (ab) ab.addEventListener('click', function () { mitgliedSetzen(null); location.hash = ''; location.reload(); });
  }

  /* ── Mitglieder-Gate (Vorlagen, Börse-Formular) ── */
  function initGate() { document.body.classList.toggle('is-mitglied', !!mitglied()); }


  /* ── Seitenleiste: klebt mit der Unterkante, wenn sie höher als das Fenster ist ── */
  function initStickySide() {
    var side = document.querySelector('.main-grid .col-side'); if (!side) return;
    function upd() { if (window.innerWidth < 1024) { side.style.top = ''; return; } var h = side.offsetHeight, vh = window.innerHeight; side.style.top = (h + 100 > vh ? Math.min(76, vh - h - 24) : 76) + 'px'; }
    window.addEventListener('resize', upd); window.addEventListener('load', upd); upd(); setTimeout(upd, 800);
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
    initGate();
    initStickySide();
    var cl = document.querySelector('[data-club]'); if (cl) initClub(cl);
    document.querySelectorAll('[data-boerse]').forEach(initBoerse);
    document.querySelectorAll('[data-praxisfrage-form]').forEach(initPraxisfrage);
    document.querySelectorAll('[data-ausweis-vorschau]').forEach(function (el) { renderAusweis(el, mitglied()); });
    document.querySelectorAll('.ausweis').forEach(initAusweisForm);
    document.querySelectorAll('[data-login-form]').forEach(initLogin);
    document.querySelectorAll('[data-mein]').forEach(initMein);
    document.querySelectorAll('[data-social-box]').forEach(initSocialBox);
    initTermine();
    initReveal();
    track('page_view', { title: document.title });
    window.KOMPASS.flushQueue();
  });
})();
