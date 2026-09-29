/*
 * Variante 2 — « Panneau latéral »
 *
 * L'analyse s'ouvre dans un panneau a droite ; la page Feel Francais reste
 * visible a gauche et la section traitee y est mise en evidence : Perle voit
 * ses propres champs se remplir quand elle accepte (pas de perte de contexte).
 * Dans le panneau, des onglets limitent ce qui est affiche en meme temps :
 * Constats · Preuves · Propositions · Pourquoi (interactivite des elements).
 * Sur la liste des notifications, le panneau devient une file de travail
 * triee par priorite.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var panneau, corps, courant = null, onglet = 'constats';

  IA.on('pret', function () {
    creerPanneau();
    if (!IA.dossier) return notifications();
    sections();
    IA.ui.champs({ surVoir: function () { ouvrirChamps(); } });
    ouvrirSommaire(true);
  });

  function creerPanneau() {
    panneau = o.el('<aside class="v2-panneau v2-replie" aria-label="Analyse IA">' +
      '<button type="button" class="v2-languette" title="Afficher / masquer l’analyse IA"><i class="fa fa-magic"></i><span>IA</span></button>' +
      '<div class="v2-interieur"><div class="v2-tete"></div><div class="v2-corps"></div></div></aside>');
    document.body.appendChild(panneau);
    corps = panneau.querySelector('.v2-corps');
    panneau.querySelector('.v2-languette').addEventListener('click', function () { basculer(); });
  }
  function basculer(ouvrir) {
    var ouvert = ouvrir == null ? panneau.classList.contains('v2-replie') : ouvrir;
    panneau.classList.toggle('v2-replie', !ouvert);
    document.documentElement.classList.toggle('v2-avec-panneau', ouvert);
  }

  function tete(html) { panneau.querySelector('.v2-tete').innerHTML = html; }

  // ── Notifications : une file de travail triee par priorite ──
  function notifications() {
    var dossiers = Object.keys(window.IA_DONNEES.dossiers).map(function (k) { return window.IA_DONNEES.dossiers[k]; });
    var poids = function (d) { var n = IA.ui.resumeDossier(d); return n['alerte'] * 100 + n['a-corriger'] * 10 + n['a-verifier']; };
    dossiers.sort(function (a, b) { return poids(b) - poids(a); });
    tete('<div class="v2-titre"><i class="fa fa-magic"></i> File de prévalidation</div><div class="ia-meta">' +
      'Dossiers dont l’analyse IA est prête, les plus urgents d’abord.</div>');
    dossiers.forEach(function (d) {
      var n = IA.ui.resumeDossier(d);
      var carte = o.el('<a class="v2-carte-dossier" href="' + e(d.page) + '"><div style="display:flex;align-items:center;gap:6px">' +
        '<b>' + e(d.etudiant) + '</b><span style="flex:1"></span>' + o.pastille(d.dossier.verdict) + '</div>' +
        '<div class="ia-meta">' + e(d.zone) + ' · ' + e(d.ecole) + '</div><div class="v2-compteurs">' +
        ['alerte', 'a-corriger', 'a-verifier', 'provisoire', 'conforme'].filter(function (k) { return n[k]; }).map(function (k) {
          return '<span class="ia-pastille ia-p-' + k + '">' + n[k] + ' ' + e(IA.LIBELLES[k].toLowerCase().replace('alerte sur une validation', 'alerte')) + '</span>';
        }).join('') + '</div><div class="ia-meta">Analyse du ' + e(d.analyse.date) + '</div></a>');
      corps.appendChild(carte);
    });
    basculer(true);
    IA.ui.notifications(function (tr, cellule, info) {
      var statut = info.dossier ? info.dossier.dossier.verdict : info.figurant[0];
      cellule.appendChild(o.el('<div><span class="ia-notif ia-p-' + statut + '"><i class="fa fa-magic"></i>' +
        e(IA.LIBELLES[statut]) + '</span></div>'));
    });
  }

  // ── Sections : contour + bouton qui ouvre le panneau sur cette section ──
  function sections() {
    IA.analysees().forEach(function (s) {
      s.el.classList.add('ia-section', 'ia-statut-' + s.statut);
      var b = o.el('<button type="button" class="ia-bouton" data-statut="' + s.statut + '"><span class="ia-point"></span>IA</button>');
      var etat = s.el.querySelector('.doc-general-state .doc-state');
      etat.insertBefore(b, etat.firstChild);
      b.addEventListener('click', function () { ouvrirSection(s); });
      s.bouton = b;
    });
    IA.on('decision', function () {
      IA.analysees().forEach(function (s) {
        var p = IA.progressionSection(s);
        s.el.classList.toggle('ia-decide', p.finie);
        s.bouton.classList.toggle('ia-fait', p.finie);
        s.bouton.innerHTML = '<span class="ia-point"></span>IA' + (p.finie ? ' <i class="fa fa-check"></i>' : '');
      });
      var prog = panneau.querySelector('.v2-prog-barre span');
      if (prog) { var g = IA.progression(); prog.style.width = Math.round(100 * g.faites / g.total) + '%'; }
      var t = panneau.querySelector('.v2-prog-texte');
      if (t) t.textContent = IA.progression().faites + '/' + IA.progression().total;
    });
  }

  function enteteDossier() {
    var d = IA.dossier;
    var g = IA.progression();
    return '<div class="v2-titre"><i class="fa fa-magic"></i> ' + e(d.etudiant) + ' ' + o.pastille(d.dossier.verdict) +
      '<span style="flex:1"></span><button type="button" class="ia-mini" data-v2="sommaire" title="Toutes les sections"><i class="fa fa-list"></i></button>' +
      '<button type="button" class="ia-mini" data-v2="fermer" title="Masquer"><i class="fa fa-chevron-right"></i></button></div>' +
      '<div class="v2-prog"><div class="v2-prog-barre"><span style="width:' + Math.round(100 * g.faites / g.total) + '%"></span></div>' +
      '<span class="ia-meta"><span class="v2-prog-texte">' + g.faites + '/' + g.total + '</span> décisions</span></div>';
  }
  function brancherTete() {
    panneau.querySelector('.v2-tete').onclick = function (ev) {
      var a = ev.target.closest('[data-v2]');
      if (!a) return;
      if (a.getAttribute('data-v2') === 'sommaire') ouvrirSommaire();
      else basculer(false);
    };
  }

  // Le sommaire : synthese, sections a traiter, champs, Campus France.
  function ouvrirSommaire(silencieux) {
    courant = null;
    focus(null);
    tete(enteteDossier());
    brancherTete();
    corps.innerHTML = '';
    corps.appendChild(IA.ui.syntheseDossier());
    var liste = o.el('<div class="ia-bloc"><h6><i class="fa fa-list-ol"></i>Sections à traiter</h6></div>');
    IA.analysees().forEach(function (s) {
      var p = IA.progressionSection(s);
      var l = o.el('<button type="button" class="v2-ligne">' + o.pastille(p.finie ? 'decide' : s.statut, p.finie ? 'Traité' : null) +
        '<span><b>' + e(s.titre) + '</b><br><span class="ia-meta">' + e(s.resume) + '</span></span></button>');
      l.addEventListener('click', function () { ouvrirSection(s); });
      liste.appendChild(l);
    });
    corps.appendChild(liste);
    var champs = o.el('<button type="button" class="v2-ligne"><span class="ia-pastille ia-p-ia"><i class="fa fa-pencil-square-o"></i>' +
      IA.dossier.champs.length + ' champs</span><span><b>Champs du dossier</b><br><span class="ia-meta">Statut, texte à l’étudiant, dates…</span></span></button>');
    champs.addEventListener('click', ouvrirChamps);
    liste.appendChild(champs);
    var cf = IA.ui.campusFrance();
    if (cf) corps.appendChild(cf);
    var tout = o.el('<button type="button" class="ia-btn ia-btn-ok" style="width:100%;justify-content:center;margin-top:6px">' +
      '<i class="fa fa-check-square-o"></i>Tout accepter dans le dossier</button>');
    tout.addEventListener('click', function () {
      var n = IA.ui.toutAccepter(IA.analysees());
      IA.dossier.champs.forEach(function (c) {
        if (IA.decision('champ:' + c.cle)) return;
        IA.ecrire.champ(c, c.propose);
        IA.decider('champ:' + c.cle, 'accepte', c.propose);
        n++;
      });
      o.toast(n + ' proposition(s) acceptée(s). Les points « à vérifier » restent à trancher.');
      ouvrirSommaire();
    });
    corps.appendChild(tout);
    if (!silencieux) basculer(true);
  }

  function ouvrirChamps() {
    courant = null;
    focus(null);
    tete(enteteDossier());
    brancherTete();
    corps.innerHTML = '';
    corps.appendChild(o.el('<div class="v2-soustitre"><button type="button" class="ia-mini" data-retour><i class="fa fa-arrow-left"></i></button> Champs du dossier</div>'));
    corps.querySelector('[data-retour]').addEventListener('click', function () { ouvrirSommaire(); });
    IA.dossier.champs.forEach(function (c) {
      var bloc = o.el('<div class="ia-bloc"><h6>' + e(c.libelle) + '<span style="flex:1"></span>' +
        '<button type="button" class="ia-mini">Montrer le champ</button></h6></div>');
      bloc.querySelector('button').addEventListener('click', function () { o.defiler(document.querySelector(c.selecteur)); });
      bloc.appendChild(IA.ui.propositionChamp(c));
      corps.appendChild(bloc);
    });
    basculer(true);
  }

  function focus(s) {
    IA.analysees().forEach(function (x) { x.el.classList.toggle('ia-focus', x === s); });
    if (s) o.defiler(s.el);
  }

  // ── Une section dans le panneau ──
  function ouvrirSection(s) {
    courant = s;
    basculer(true);
    focus(s);
    var liste = IA.analysees();
    var rang = liste.indexOf(s);
    tete(enteteDossier());
    brancherTete();
    corps.innerHTML = '';
    var nav = o.el('<div class="v2-soustitre"><button type="button" class="ia-mini" data-nav="-1"' + (rang ? '' : ' disabled') +
      '><i class="fa fa-chevron-left"></i></button><span style="flex:1">Section ' + (rang + 1) + ' / ' + liste.length +
      '</span><button type="button" class="ia-mini" data-nav="1"' + (rang < liste.length - 1 ? '' : ' disabled') + '><i class="fa fa-chevron-right"></i></button></div>');
    nav.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-nav]');
      if (b && !b.disabled) ouvrirSection(liste[rang + (+b.getAttribute('data-nav'))]);
    });
    corps.appendChild(nav);
    corps.appendChild(IA.ui.entete(s));
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var zoneV = o.el('<div class="v2-visionneuse"></div>');
    corps.appendChild(zoneV);
    var onglets = o.el('<div class="v2-onglets" role="tablist">' + [['constats', 'Constats'], ['preuves', 'Preuves'],
      ['propositions', 'Propositions'], ['pourquoi', 'Pourquoi ?']].map(function (x) {
      return '<button type="button" role="tab" data-onglet="' + x[0] + '">' + x[1] + '</button>';
    }).join('') + '</div>');
    corps.appendChild(onglets);
    var contenu = o.el('<div class="v2-contenu"></div>');
    corps.appendChild(contenu);

    var vue = 'admin';
    var docCourant = docs[0];
    var blocs = IA.ui.blocsSection(s);
    var props = IA.ui.propositionsSection(s);
    var pourquoi = IA.ui.pourquoi(s, true);
    onglet = s.alerte || s.mauvaiseSection || s.ressources ? 'preuves' : 'constats';
    var v = new IA.Visionneuse(zoneV, {
      documents: docs,
      surConstat: function (d, k, n) { onglet = 'constats'; dessiner(n); },
      surVue: function (x) { vue = x; dessiner(); },
      surDocument: function (d) { docCourant = d; dessiner(); }
    });
    function dessiner(actif) {
      Array.prototype.forEach.call(onglets.children, function (b) { b.classList.toggle('ia-actif', b.getAttribute('data-onglet') === onglet); });
      contenu.innerHTML = '';
      if (onglet === 'constats') {
        if (!docCourant) return;
        contenu.appendChild(o.el('<div>' + IA.ui.reperes(docCourant) + '</div>'));
        var l = IA.ui.constats(docCourant, vue, function (n) { v.activer(n); });
        contenu.appendChild(l);
        if (actif != null && l.children[actif]) l.children[actif].classList.add('ia-actif');
        var urgent = blocs.querySelector('.ia-bloc-alerte, .ia-bloc-attention');
        if (urgent) contenu.appendChild(o.el('<div class="ia-meta v2-renvoi"><i class="fa fa-exclamation-circle"></i> Un point demande votre arbitrage : onglet « Preuves ».</div>'));
      } else if (onglet === 'preuves') {
        contenu.appendChild(blocs.childElementCount ? blocs : o.el('<div class="ia-meta">Aucune preuve complémentaire pour cette section.</div>'));
      } else if (onglet === 'propositions') {
        contenu.appendChild(props);
        var suivant = o.el('<div class="v2-pied"><button type="button" class="ia-btn ia-btn-ok"><i class="fa fa-check"></i>Tout accepter dans cette section</button>' +
          '<button type="button" class="ia-btn" data-suivante>Section suivante <i class="fa fa-chevron-right"></i></button></div>');
        suivant.querySelector('.ia-btn-ok').addEventListener('click', function () {
          IA.ui.toutAccepter([s]);
          var p = IA.progressionSection(s);
          o.toast(p.finie ? 'Section traitée.' : 'Il reste ' + (p.total - p.faites) + ' point(s) à trancher vous-même.');
        });
        suivant.querySelector('[data-suivante]').addEventListener('click', function () {
          var prochaine = liste.filter(function (x) { return !IA.progressionSection(x).finie && x !== s; })[0];
          if (prochaine) ouvrirSection(prochaine); else ouvrirSommaire();
        });
        contenu.appendChild(suivant);
      } else {
        contenu.appendChild(pourquoi);
      }
    }
    onglets.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-onglet]');
      if (!b) return;
      onglet = b.getAttribute('data-onglet');
      dessiner();
    });
  }
})();
