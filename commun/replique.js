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
    return null;
  }

  // Les liens de profil contenus dans les reponses JSON pointent vers la replique.
  function relierJson(texte) {
    return texte.replace(/\\?\/admin\\?\/student\\?\/show\\?\/(\d+)\\?\/VisaData(?:\\?\/[\w-]*)?/g, function (tout, id) {
      return PAGES[id] || tout;
    });
  }

  function reponseFigee(url) {
    if (!/\/admin\/notification\/list\?/.test(url)) return null;
    var cle = /[?&]table=read/.test(url) ? 'notifications-lues' : 'notifications-non-lues';
    var donnees = AJAX[cle];
    if (!donnees) return null;
    var copie = JSON.parse(JSON.stringify(donnees));
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
    message('Maquette : cette page de la plateforme n’est pas reproduite.');
  }, true);

  document.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    message('Maquette : rien n’est envoyé — la plateforme n’est pas modifiée.');
  }, true);
})();
