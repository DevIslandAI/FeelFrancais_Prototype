/*
 * Comportement de MAQUETTE, commun a la replique et aux 5 variantes.
 * Charge avant tous les scripts de Feel Francais pour :
 *   1. rejouer les reponses AJAX figees de la liste des notifications
 *      (leur DataTables les affiche avec son propre code) ;
 *   2. relier les liens « profil » aux pages de la replique ;
 *   3. neutraliser tout ce qui partirait vers un serveur (formulaires,
 *      liens hors maquette) avec un message clair.
 * Rien ici ne modifie l'apparence de leur page.
 */
(function () {
  'use strict';

  var AJAX = window.REPLIQUE_AJAX || {};
  var PAGES = window.REPLIQUE_PAGES || {};

  function lienReplique(url) {
    var m = /\/admin\/student\/show\/(\d+)\/VisaData/.exec(url || '');
    if (m && PAGES[m[1]]) return PAGES[m[1]];
    if (/\/admin\/notification\/list/.test(url || '')) return 'notifications.html';
    // Référentiel Visa (données réelles de la plateforme) : listes et fiches.
    if (/\/admin\/visa\/documentzone\/list/.test(url || '')) return 'visa-ref.html';
    if (/\/admin\/visa\/zone\/list/.test(url || '')) return 'visa-zone.html';
    var fiche = /\/admin\/visa\/documentzone\/edit\/(\d+)/.exec(url || '');
    if (fiche) return 'visa-ref-' + fiche[1] + '.html';
    fiche = /\/admin\/visa\/zone\/edit\/(\d+)/.exec(url || '');
    if (fiche) return 'visa-zone-' + fiche[1] + '.html';
    return null;
  }

  function idEtudiant(ligne) {
    var m = /\/admin\/student\/show\/(\d+)\//.exec(JSON.stringify(ligne));
    return m ? m[1] : null;
  }
  // Profils vides montres pour un etat de la liste (declares par la couche IA du prototype).
  function vides() { return window.REPLIQUE_VIDES || {}; }
  function aUnDossier(ligne) { var id = idEtudiant(ligne); return !!(id && PAGES[id]); }
  function garder(ligne) { var id = idEtudiant(ligne); return !!(id && (PAGES[id] || vides()[id])); }

  // La cloche du bandeau : meme regle, et son compteur suit.
  function filtrerCloche() {
    var menu = document.querySelector('.dropdown-menu.notifications');
    if (!menu) return;
    var restants = 0;
    menu.querySelectorAll(':scope > .media').forEach(function (item) {
      var a = item.querySelector('a[href*="/admin/student/show/"]');
      var m = a && /\/admin\/student\/show\/(\d+)\//.exec(a.getAttribute('href'));
      if (m && PAGES[m[1]]) restants++;
      else item.remove();
    });
    var compteur = menu.closest('.dropdown-notifications') && menu.closest('.dropdown-notifications').querySelector('.carret');
    if (compteur) compteur.textContent = restants;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', filtrerCloche);
  else filtrerCloche();

  // Les liens de profil contenus dans les reponses JSON pointent vers la replique.
  function relierJson(texte) {
    texte = texte
      .replace(/\\?\/admin\\?\/visa\\?\/documentzone\\?\/edit\\?\/(\d+)/g, function (t, id) { return 'visa-ref-' + id + '.html'; })
      .replace(/\\?\/admin\\?\/visa\\?\/zone\\?\/edit\\?\/(\d+)/g, function (t, id) { return 'visa-zone-' + id + '.html'; });
    return texte.replace(/\\?\/admin\\?\/student\\?\/show\\?\/(\d+)\\?\/VisaData(?:\\?\/[\w-]*)?/g, function (tout, id) {
      return PAGES[id] || tout;
    });
  }

  function texteDe(cellule) {
    var d = document.createElement('div');
    d.innerHTML = cellule == null ? '' : String(cellule);
    return (d.textContent || '').toLowerCase();
  }
  function listeVisa(url) {
    var cle = /\/admin\/visa\/documentzone\/list\?/.test(url) ? 'visa-ref' : /\/admin\/visa\/zone\/list\?/.test(url) ? 'visa-zone' : null;
    if (!cle || !AJAX[cle]) return null;
    var p = new URL(url, location.href).searchParams;
    var lignes = AJAX[cle].data.slice();
    var global = (p.get('search[value]') || '').toLowerCase().trim();
    if (global) lignes = lignes.filter(function (l) { return l.some(function (c) { return texteDe(c).indexOf(global) >= 0; }); });
    for (var i = 0; i < 12; i++) {
      var v = (p.get('columns[' + i + '][search][value]') || '').toLowerCase().trim();
      if (v) lignes = lignes.filter(function (l) { return texteDe(l[i]).indexOf(v) >= 0 || String(l[i] || '').toLowerCase().indexOf(v) >= 0; });
    }
    var col = parseInt(p.get('order[0][column]') || '0', 10);
    var sens = p.get('order[0][dir]') === 'desc' ? -1 : 1;
    lignes.sort(function (a, b) { return texteDe(a[col]).localeCompare(texteDe(b[col]), 'fr') * sens; });
    var debut = parseInt(p.get('start') || '0', 10);
    var nombre = parseInt(p.get('length') || '10', 10);
    var page = nombre > 0 ? lignes.slice(debut, debut + nombre) : lignes;
    return relierJson(JSON.stringify({
      draw: parseInt(p.get('draw') || '1', 10),
      recordsTotal: AJAX[cle].data.length,
      recordsFiltered: lignes.length,
      data: page,
    }));
  }

  function reponseFigee(url) {
    var visa = listeVisa(url);
    if (visa !== null) return visa;
    if (!/\/admin\/notification\/list\?/.test(url)) return null;
    var cle = /[?&]table=read/.test(url) ? 'notifications-lues' : 'notifications-non-lues';
    var donnees = AJAX[cle];
    if (!donnees) return null;
    var copie = JSON.parse(JSON.stringify(donnees));
    // Seuls les etudiants dont le dossier est reproduit apparaissent (pas de profil vide).
    if (Array.isArray(copie.data)) {
      // Les vrais dossiers d'abord, puis les profils vides de demonstration.
      copie.data = copie.data.filter(garder).sort(function (a, b) { return aUnDossier(b) - aUnDossier(a); });
      copie.recordsFiltered = copie.recordsTotal = copie.data.length;
    }
    var draw = /[?&]draw=(\d+)/.exec(url);
    if (draw) copie.draw = parseInt(draw[1], 10);
    return relierJson(JSON.stringify(copie));
  }

  // ── 1. XHR : les appels de leur DataTables recoivent la reponse figee ──
  var ouvrir = XMLHttpRequest.prototype.open;
  var envoyer = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (methode, url) {
    this.__url = String(url);
    return ouvrir.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    var xhr = this;
    var url = xhr.__url || '';
    var corps = reponseFigee(url);
    var versServeur = /^\/(admin|en|fr|_wdt|api)\b/.test(url.replace(location.origin, ''));
    if (corps === null && !versServeur) return envoyer.apply(this, arguments);
    if (corps === null) corps = '{}';
    var fixe = function (nom, valeur) { Object.defineProperty(xhr, nom, { value: valeur, configurable: true }); };
    fixe('readyState', 4); fixe('status', 200); fixe('statusText', 'OK');
    fixe('responseText', corps); fixe('response', corps); fixe('responseURL', url);
    xhr.getAllResponseHeaders = function () { return 'content-type: application/json\r\n'; };
    xhr.getResponseHeader = function (n) { return /content-type/i.test(n) ? 'application/json' : null; };
    setTimeout(function () {
      ['readystatechange', 'load', 'loadend'].forEach(function (type) {
        var gestionnaire = xhr['on' + type];
        if (typeof gestionnaire === 'function') gestionnaire.call(xhr, new Event(type));
        xhr.dispatchEvent(new Event(type));
      });
    }, 30);
  };

  // ── 2 & 3. Liens et formulaires ──
  function message(texte) {
    var el = document.getElementById('replique-message');
    if (!el) {
      el = document.createElement('div');
      el.id = 'replique-message';
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:100000;' +
        'background:#2b3a42;color:#fff;padding:10px 18px;border-radius:4px;font:13px/1.4 sans-serif;' +
        'box-shadow:0 4px 14px rgba(0,0,0,.25);transition:opacity .2s;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = texte;
    el.style.opacity = '1';
    clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.style.opacity = '0'; }, 2600);
  }
  window.repliqueMessage = message;

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '/') return;
    e.preventDefault();
    var cible = lienReplique(href);
    if (cible) { location.href = cible + location.search; return; }
    e.stopImmediatePropagation();
    // Leur menu « changer d'alias » (deplacer un document vers une autre section)
    if (a.closest('.doc-info-actions .dropdown-menu')) {
      var alias = a.textContent.trim();
      message('Maquette : le document serait déplacé vers « ' + alias + ' ».');
      document.dispatchEvent(new CustomEvent('replique:deplacement', { detail: { alias: alias, lien: a } }));
      var menu = a.closest('.dropdown');
      if (menu) menu.classList.remove('open');
      return;
    }
    var vide = /\/admin\/student\/show\/(\d+)\//.exec(href);
    if (vide && vides()[vide[1]]) {
      document.dispatchEvent(new CustomEvent('replique:profil-vide', { detail: { id: vide[1], nom: (a.closest('tr') && a.closest('tr').cells[1] ? a.closest('tr').cells[1].textContent : '') } }));
      return;
    }
    message('Maquette : cette page de la plateforme n’est pas reproduite.');
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    message('Maquette : rien n’est envoyé — la plateforme n’est pas modifiée.');
  }, true);
})();
