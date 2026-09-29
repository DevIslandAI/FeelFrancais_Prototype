/*
 * Variante 7 — « Panneau PDF »  (2 Panneau latéral + 5 vue d'ensemble)
 *
 * Le panneau s'ouvre a GAUCHE, par-dessus le menu et la colonne d'informations
 * personnelles (inutiles pendant la validation) : la section traitee, ses
 * boutons valid/invalid et ses commentaires restent visibles a droite, et Perle
 * voit ses champs se remplir quand elle applique.
 * Dans le panneau : le PDF en haut, les propositions en dessous (un bouton
 * donne plus de place a l'un ou a l'autre), dans l'ordre fixe
 * Proposition IA · Incoherences · A savoir · Constats · Details.
 * Accueil du panneau : incoherences du dossier, sections par priorite,
 * champs du dossier, « Appliquer les conformes ».
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var panneau, courant = null;

  IA.on('pret', function () {
    if (!IA.dossier) return IA.ui2.notifications();
    creer();
    IA.analysees().forEach(function (s) { IA.ui2.marquer(s, function () { ouvrir(s); }); });
    IA.ui2.champs();
    IA.ui2.ligne([{ html: '<i class="fa fa-columns"></i> Ouvrir le panneau', principal: true, action: function () { ouvrir('dossier'); } }]);
  });

  function creer() {
    panneau = o.el('<aside class="v7-panneau" aria-label="Analyse IA" hidden><header class="v7-tete"></header><div class="v7-corps"></div></aside>');
    document.body.appendChild(panneau);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !panneau.hidden && !document.querySelector('.ia-fenetre')) fermer();
    });
    IA.on('decision', function () { if (!panneau.hidden && courant === 'dossier') ouvrir('dossier'); });
  }
  function fermer() {
    panneau.hidden = true;
    IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
  }

  function tete(html, s) {
    var t = panneau.querySelector('.v7-tete');
    var ordre = IA.ui2.ordre();
    var i = ordre.indexOf(s);
    t.innerHTML = '<button type="button" class="ia2-btn ia2-non" data-v="dossier" title="Vue d’ensemble"><i class="fa fa-th-list"></i></button>' +
      '<div class="v7-titre">' + html + '</div>' +
      (s ? '<button type="button" class="ia2-btn ia2-non" data-v="prec"' + (i > 0 ? '' : ' disabled') + ' title="Section précédente"><i class="fa fa-chevron-up"></i></button>' +
        '<button type="button" class="ia2-btn ia2-non" data-v="suiv"' + (i < ordre.length - 1 ? '' : ' disabled') + ' title="Section suivante"><i class="fa fa-chevron-down"></i></button>' : '') +
      '<button type="button" class="ia2-btn ia2-non" data-v="fermer" title="Fermer (Échap)"><i class="fa fa-times"></i></button>';
    t.onclick = function (ev) {
      var b = ev.target.closest('[data-v]');
      if (!b || b.disabled) return;
      var v = b.getAttribute('data-v');
      if (v === 'fermer') fermer();
      else if (v === 'dossier') ouvrir('dossier');
      else ouvrir(ordre[i + (v === 'suiv' ? 1 : -1)]);
    };
  }

  function ouvrir(cible) {
    courant = cible;
    panneau.hidden = false;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    var corps = panneau.querySelector('.v7-corps');
    corps.innerHTML = '';
    corps.className = 'v7-corps';
    if (cible === 'dossier') return accueil(corps);
    section(cible, corps);
    o.defiler(cible.el);
  }

  // ── Une section : PDF en haut, propositions en dessous ──
  function section(s, corps) {
    tete('<span class="ia2-tag ia2-t-' + s.statut + '" style="position:static"><span class="ia2-point"></span>' + e(IA.ui2.COURT[s.statut]) +
      '</span><b>' + e(IA.ui2.nom(s)) + '</b>', s);
    corps.classList.add('v7-section');
    corps.innerHTML = '<div class="v7-pdf"></div><button type="button" class="v7-poignee" title="Donner plus de place au PDF ou aux propositions">' +
      '<i class="fa fa-arrows-v"></i> <span>Plus de place aux propositions</span></button><div class="v7-bas"></div>';
    var bas = corps.querySelector('.v7-bas');
    bas.appendChild(o.el('<div class="v7-resume">' + e(s.resume) + '</div>'));
    bas.appendChild(IA.ui2.propositions(s));
    [IA.ui2.incoherences(s), IA.ui2.aSavoir(s)].forEach(function (b) { if (b) bas.appendChild(b); });
    var blocC = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-search"></i>Constats <span class="ia2-muet v7-doc"></span></h4><div></div></section>');
    bas.appendChild(blocC);
    bas.appendChild(IA.ui2.details(s));
    var pied = o.el('<div class="v7-pied"><span class="ia2-muet v7-reste"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="tout">Appliquer tout</button>' +
      '<button type="button" class="ia2-btn ia2-principal" data-a="suiv">Suivante <i class="fa fa-chevron-down"></i></button></div>');
    corps.appendChild(pied);
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var vue = 'admin', doc = docs[0], liste;
    function constats() {
      blocC.querySelector('.v7-doc').textContent = doc ? '· ' + doc.sousType : '';
      var z = blocC.lastElementChild;
      z.innerHTML = '';
      if (doc) { liste = IA.ui2.constats(doc, vue, function (n) { v.activer(n); }); z.appendChild(liste); }
    }
    var v = new IA.Visionneuse(corps.querySelector('.v7-pdf'), {
      documents: docs, compact: true,
      surConstat: function (d, k, n) { if (liste) { liste.activer(n); } },
      surVue: function (x) { vue = x; constats(); },
      surDocument: function (d) { doc = d; constats(); }
    });
    constats();
    corps.querySelector('.v7-poignee').addEventListener('click', function () {
      var grand = corps.classList.toggle('v7-props-grand');
      this.querySelector('span').textContent = grand ? 'Plus de place au PDF' : 'Plus de place aux propositions';
      setTimeout(function () { v.afficher(v.index); }, 260);
    });
    function reste() {
      var p = IA.progressionSection(s);
      pied.querySelector('.v7-reste').innerHTML = p.finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Traité</span>' : (p.total - p.faites) + ' en attente';
    }
    IA.on('decision', function () { if (courant === s) reste(); });
    reste();
    pied.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'tout') {
        var n = IA.ui2.appliquerTout([s]);
        o.toast(n + ' proposition(s) appliquée(s)' + (IA.progressionSection(s).finie ? '.' : ' — il reste des points à décider.'));
      } else {
        var prochaine = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
        ouvrir(prochaine || 'dossier');
      }
    });
  }

  // ── Accueil du panneau : la vue d'ensemble du dossier ──
  function accueil(corps) {
    var d = IA.dossier;
    tete('<b>' + e(d.etudiant) + '</b><span class="ia2-muet">' + e(d.zone) + '</span>');
    corps.classList.add('v7-accueil');
    var inc = IA.ui2.incoherencesDossier(function (s) { ouvrir(s); });
    inc.insertBefore(o.el('<h4 class="ia2-titre"><i class="fa fa-link"></i>Incohérences entre documents' +
      (inc.n ? ' <span class="ia2-compte">' + inc.n + '</span>' : '') + '</h4>'), inc.firstChild);
    corps.appendChild(inc);
    var liste = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-list-ul"></i>Sections à traiter</h4></section>');
    IA.ui2.ordre().forEach(function (s) {
      var p = IA.progressionSection(s);
      var revoir = IA.propositionsSection(s).some(function (x) { return IA.brouillon(x.cle); });
      var l = o.el('<button type="button" class="v7-ligne ia2-t-' + s.statut + (p.finie ? ' v7-fini' : '') + '">' +
        (p.finie ? '<i class="fa fa-check ia2-vert"></i>' : '<span class="ia2-point"></span>') + '<span class="v7-l-texte"><b>' + e(IA.ui2.nom(s)) +
        '</b><span class="ia2-muet">' + e(s.resume) + '</span></span>' + (revoir ? '<span class="v7-revoir">à revoir</span>' : '') + '</button>');
      l.addEventListener('click', function () { ouvrir(s); });
      liste.appendChild(l);
    });
    var conformes = IA.analysees().filter(function (s) { return s.statut === 'conforme' && !IA.progressionSection(s).finie; });
    if (conformes.length) {
      var b = o.el('<button type="button" class="ia2-btn ia2-ok" style="margin-top:8px">Appliquer les ' + conformes.length + ' section(s) conforme(s)</button>');
      b.addEventListener('click', function () { var n = IA.ui2.appliquerTout(conformes); o.toast(n + ' proposition(s) appliquée(s).'); });
      liste.appendChild(b);
    }
    corps.appendChild(liste);
    var champs = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-magic"></i>Champs du dossier</h4>' +
      '<div class="ia2-muet" style="font-size:12.5px">Statut, texte à l’étudiant, dates : cliquez la pastille <b>IA</b> à côté de chaque champ de la page.</div></section>');
    var aller = o.el('<button type="button" class="ia2-btn" style="margin-top:6px">Montrer les champs</button>');
    aller.addEventListener('click', function () {
      var p = document.querySelector('.ia2-puce');
      o.defiler(p);
      if (p && p.getAttribute('aria-expanded') !== 'true') p.click();
    });
    champs.appendChild(aller);
    corps.appendChild(champs);
    var cf = IA.ui.campusFrance();
    if (cf) corps.appendChild(cf);
  }
})();
