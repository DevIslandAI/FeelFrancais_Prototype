/*
 * Variante 6 — « Fenêtre épurée »  (1 Fenêtre d'analyse + 4 navigation + 3 champs sur place)
 *
 * Page : liseré + etiquette sur la bordure des sections analysees ; pastille
 * « IA » a cote des champs du haut, la proposition s'ouvre juste en dessous ;
 * une ligne discrete au-dessus des documents.
 * Fenetre : a gauche la liste des sections (ordre de priorite), au centre le
 * PDF en grand, a droite, toujours dans le meme ordre :
 *   Proposition IA · Incoherences · A savoir · Constats · Details.
 * En bas : « Appliquer tout » et « Suivante ».
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var fen = null;

  IA.on('pret', function () {
    if (!IA.dossier) return IA.ui2.notifications();
    IA.analysees().forEach(function (s) { IA.ui2.marquer(s, function () { ouvrir(s); }); });
    IA.ui2.champs();
    IA.ui2.ligne([
      { html: '<i class="fa fa-link"></i> Incohérences', action: function () { ouvrir('incoherences'); } },
      { html: 'Ouvrir l’analyse', principal: true, action: function () { ouvrir(premiere()); } }
    ]);
  });

  function premiere() {
    return IA.ui2.ordre().filter(function (s) { return !IA.progressionSection(s).finie; })[0] || 'dossier';
  }

  function ouvrir(cible) {
    if (!fen) creer();
    afficher(cible);
  }

  function creer() {
    var f = IA.ui.fenetre({ titre: 'Analyse IA', classe: 'v6-fen', surFermeture: function () {
      IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
      fen = null;
    } });
    f.el.__fermer = f.fermer;
    f.el.innerHTML = '<nav class="v6-nav" aria-label="Sections"></nav>' +
      '<div class="v6-principal"><header class="v6-tete"><div class="v6-titre"></div>' +
      '<button type="button" class="ia2-btn ia2-non" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button></header>' +
      '<div class="v6-corps"></div><footer class="v6-pied"></footer></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    fen = { f: f, courant: null };
    IA.on('decision', function () { if (fen) nav(); });
    IA.on('brouillon', function () { if (fen) nav(); });
  }

  // ── Colonne de gauche : Dossier, Incoherences, puis les sections par priorite ──
  function nav() {
    var n = fen.f.el.querySelector('.v6-nav');
    n.innerHTML = '';
    var inc = IA.ui2.nombreIncoherences();
    var entrees = [['dossier', '<i class="fa fa-folder-open-o"></i> Dossier', ''],
      ['incoherences', '<i class="fa fa-link"></i> Incohérences', inc ? '<span class="ia2-compte">' + inc + '</span>' : '']];
    if (IA.dossier.campusFrance && IA.dossier.campusFrance.disponible) entrees.push(['campus', '<i class="fa fa-comments-o"></i> Campus France', '']);
    entrees.forEach(function (x) {
      var b = o.el('<button type="button" class="v6-item' + (fen.courant === x[0] ? ' v6-actif' : '') + '">' + x[1] + '<span class="ia2-sep"></span>' + x[2] + '</button>');
      b.addEventListener('click', function () { afficher(x[0]); });
      n.appendChild(b);
    });
    n.appendChild(o.el('<div class="v6-nav-titre">Sections</div>'));
    IA.ui2.ordre().forEach(function (s) {
      var p = IA.progressionSection(s);
      var revoir = IA.propositionsSection(s).some(function (x) { return IA.brouillon(x.cle); });
      var b = o.el('<button type="button" class="v6-item v6-sec ia2-t-' + s.statut + (fen.courant === s ? ' v6-actif' : '') + (p.finie ? ' v6-fini' : '') + '">' +
        (p.finie ? '<i class="fa fa-check ia2-vert"></i>' : '<span class="ia2-point"></span>') + '<span class="v6-nom">' + e(IA.ui2.nom(s)) + '</span>' +
        (revoir ? '<i class="fa fa-bookmark v6-revoir" title="À revoir"></i>' : '') + '</button>');
      b.addEventListener('click', function () { afficher(s); });
      n.appendChild(b);
    });
  }

  function afficher(cible) {
    fen.courant = cible;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    nav();
    var titre = fen.f.el.querySelector('.v6-titre');
    var corps = fen.f.el.querySelector('.v6-corps');
    var pied = fen.f.el.querySelector('.v6-pied');
    corps.className = 'v6-corps';
    corps.innerHTML = '';
    pied.innerHTML = '';
    pied.onclick = null;
    if (cible === 'dossier') return vueDossier(titre, corps, pied);
    if (cible === 'incoherences') return vueIncoherences(titre, corps);
    if (cible === 'campus') { titre.innerHTML = '<b>Campus France</b>'; corps.classList.add('v6-simple'); corps.appendChild(IA.ui.campusFrance()); return; }
    vueSection(cible, titre, corps, pied);
  }

  function vueSection(s, titre, corps, pied) {
    titre.innerHTML = '<span class="ia2-tag ia2-t-' + s.statut + '" style="position:static"><span class="ia2-point"></span>' +
      e(IA.ui2.COURT[s.statut]) + '</span><b>' + e(IA.ui2.nom(s)) + '</b><span class="ia2-muet">' + e(s.resume) + '</span>';
    corps.innerHTML = '<div class="v6-pdf"></div><div class="v6-droite"></div>';
    var droite = corps.querySelector('.v6-droite');
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    droite.appendChild(IA.ui2.propositions(s));
    [IA.ui2.incoherences(s), IA.ui2.aSavoir(s)].forEach(function (b) { if (b) droite.appendChild(b); });
    var blocC = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-search"></i>Constats <span class="ia2-muet v6-doc"></span></h4><div></div></section>');
    droite.appendChild(blocC);
    droite.appendChild(IA.ui2.details(s));
    var vue = 'admin', courant = docs[0], liste;
    function constats() {
      blocC.querySelector('.v6-doc').textContent = courant ? '· ' + courant.sousType : '';
      var z = blocC.lastElementChild;
      z.innerHTML = '';
      if (!courant) return;
      liste = IA.ui2.constats(courant, vue, function (n) { v.activer(n); });
      z.appendChild(liste);
    }
    var v = new IA.Visionneuse(corps.querySelector('.v6-pdf'), {
      documents: docs, compact: true,
      surConstat: function (d, k, n) { if (liste) liste.activer(n); },
      surVue: function (x) { vue = x; constats(); },
      surDocument: function (d) { courant = d; constats(); }
    });
    constats();
    var ordre = IA.ui2.ordre();
    var suivante = ordre.filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
    pied.innerHTML = '<span class="ia2-muet v6-reste"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="tout">Appliquer tout</button>' +
      '<button type="button" class="ia2-btn ia2-principal" data-a="suivante">' + (suivante ? 'Suivante <i class="fa fa-chevron-right"></i>' : 'Terminer') + '</button>';
    function reste() {
      var p = IA.progressionSection(s);
      var r = pied.querySelector('.v6-reste');
      if (r) r.innerHTML = p.finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Section traitée</span>' : (p.total - p.faites) + ' proposition(s) en attente';
    }
    IA.on('decision', function () { if (fen && fen.courant === s) reste(); });
    reste();
    // onclick : le pied est reutilise d'une section a l'autre (un seul gestionnaire).
    pied.onclick = function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'tout') {
        var n = IA.ui2.appliquerTout([s]);
        o.toast(n + ' proposition(s) appliquée(s)' + (IA.progressionSection(s).finie ? '.' : ' — il reste des points à décider vous-même.'));
      } else afficher(suivante || 'dossier');
    };
  }

  function vueIncoherences(titre, corps) {
    titre.innerHTML = '<b>Incohérences entre documents</b><span class="ia2-muet">Les documents liés qui ne disent pas la même chose</span>';
    corps.classList.add('v6-simple');
    corps.appendChild(IA.ui2.incoherencesDossier(function (s) { afficher(s); }));
  }

  function vueDossier(titre, corps, pied) {
    var d = IA.dossier;
    titre.innerHTML = '<b>Dossier — ' + e(d.etudiant) + '</b><span class="ia2-muet">' + e(d.zone) + '</span>';
    corps.classList.add('v6-simple');
    corps.appendChild(o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-folder-open-o"></i>Synthèse</h4>' +
      d.dossier.synthese.map(function (x) { return '<div class="ia2-info">' + e(x) + '</div>'; }).join('') + '</section>'));
    var champs = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-magic"></i>Proposition IA — champs du dossier</h4></section>');
    d.champs.forEach(function (c) {
      champs.appendChild(o.el('<div class="v6-champ-lib">' + e(c.libelle) + '</div>'));
      champs.appendChild(c.type === 'select' ? IA.ui2.verdictChamp(c) : IA.ui2.prop({ cle: 'champ:' + c.cle, titre: 'Proposition IA', texte: c.propose,
        etudiant: c.cle === 'message', lignes: c.type === 'date' ? 1 : 3, appliquer: function (v) { IA.ecrire.champ(c, v); } }));
    });
    corps.appendChild(champs);
    var revoir = IA.brouillons();
    pied.innerHTML = '<span class="ia2-muet">' + (revoir.length ? revoir.length + ' proposition(s) enregistrée(s) à revoir' : '') + '</span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn ia2-principal" data-a="tout">Appliquer tout le dossier</button>';
    pied.querySelector('[data-a]').addEventListener('click', function () {
      var n = IA.ui2.appliquerTout(IA.analysees());
      o.toast(n + ' proposition(s) appliquée(s). Les points « à décider » et les alertes restent à trancher.');
      nav();
    });
  }
})();
