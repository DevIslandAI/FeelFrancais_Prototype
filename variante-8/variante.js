/*
 * Variante 8 — « Revue guidée »  (4 Mode revue + 1 Fenêtre + 5 conformes groupés)
 *
 * Un parcours en etapes, dans l'ordre qui fait gagner le plus de temps :
 *   1. Incoherences du dossier (comparees cote a cote) ;
 *   2. les sections qui demandent une action, par priorite ;
 *   3. toutes les sections conformes regroupees : une seule etape ;
 *   4. le dossier : statut et message a l'etudiant.
 * Le PDF reste visible a chaque etape. Clavier : ← → etapes, Entree
 * « Appliquer et continuer », V vue etudiant, Echap fermer.
 * Sur la page : etiquettes sur les bordures, champs du haut sur place.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var r = null;

  IA.on('pret', function () {
    if (!IA.dossier) return IA.ui2.notifications();
    IA.analysees().forEach(function (s) { IA.ui2.marquer(s, function () { demarrer(s); }); });
    IA.ui2.champs();
    IA.ui2.ligne([{ html: '<i class="fa fa-play"></i> Commencer la revue', principal: true, action: function () { demarrer(); } }]);
  });

  function etapes() {
    var l = [];
    if (IA.ui2.nombreIncoherences()) l.push({ type: 'incoherences', nom: 'Incohérences', statut: 'a-corriger' });
    IA.ui2.ordre().filter(function (s) { return s.statut !== 'conforme'; }).forEach(function (s) {
      l.push({ type: 'section', s: s, nom: s.titre, statut: s.statut });
    });
    var conformes = IA.analysees().filter(function (s) { return s.statut === 'conforme'; });
    if (conformes.length) l.push({ type: 'conformes', liste: conformes, nom: conformes.length + ' conforme(s)', statut: 'conforme' });
    l.push({ type: 'dossier', nom: 'Dossier', statut: 'dossier' });
    return l;
  }
  function etapeFinie(x) {
    if (x.type === 'section') return IA.progressionSection(x.s).finie;
    if (x.type === 'conformes') return x.liste.every(function (s) { return IA.progressionSection(s).finie; });
    if (x.type === 'dossier') return IA.dossier.champs.every(function (c) { return IA.decision('champ:' + c.cle); });
    return x.vu;
  }

  function demarrer(section) {
    if (!r) {
      var f = IA.ui.fenetre({ titre: 'Revue guidée', classe: 'v8-fen', surFermeture: function () {
        document.removeEventListener('keydown', clavier, true);
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        r = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<header class="v8-tete"><b class="v8-marque"><i class="fa fa-magic"></i> Revue guidée</b><ol class="v8-etapes"></ol>' +
        '<button type="button" class="ia2-btn ia2-non" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button></header>' +
        '<div class="v8-corps"></div><footer class="v8-pied"></footer>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      r = { f: f, liste: etapes(), i: 0 };
      document.addEventListener('keydown', clavier, true);
      IA.on('decision', function () { if (r) barre(); });
    }
    var i = 0;
    if (section) r.liste.forEach(function (x, j) { if (x.s === section || (x.liste && x.liste.indexOf(section) > -1)) i = j; });
    aller(i);
  }

  function barre() {
    var ol = r.f.el.querySelector('.v8-etapes');
    ol.innerHTML = '';
    r.liste.forEach(function (x, j) {
      var fini = etapeFinie(x);
      var li = o.el('<li><button type="button" class="v8-etape ia2-t-' + x.statut + (j === r.i ? ' v8-active' : '') + (fini ? ' v8-finie' : '') +
        '" title="' + e(x.nom) + '">' + (fini ? '<i class="fa fa-check"></i>' : (x.type === 'section' ? '<span class="ia2-point"></span>' : '')) +
        '<span>' + e(court(x)) + '</span></button></li>');
      li.firstChild.addEventListener('click', function () { aller(j); });
      ol.appendChild(li);
    });
  }
  function court(x) { return x.type === 'section' ? IA.ui2.nom(x.s) : x.nom; }

  function aller(i) {
    r.i = Math.max(0, Math.min(r.liste.length - 1, i));
    var x = r.liste[r.i];
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', x.s === s); });
    barre();
    var corps = r.f.el.querySelector('.v8-corps');
    var pied = r.f.el.querySelector('.v8-pied');
    corps.innerHTML = '';
    corps.className = 'v8-corps';
    pied.innerHTML = '';
    ({ incoherences: vueIncoherences, section: vueSection, conformes: vueConformes, dossier: vueDossier })[x.type](x, corps, pied);
  }

  function piedStandard(pied, texte, action, libelle) {
    pied.innerHTML = '<span class="ia2-muet v8-aide"><span class="ia-kbd">←</span><span class="ia-kbd">→</span> étapes · ' +
      '<span class="ia-kbd">Entrée</span> ' + e(libelle) + '</span><span class="ia2-muet v8-reste">' + (texte || '') + '</span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="prec"' + (r.i ? '' : ' disabled') + '><i class="fa fa-chevron-left"></i></button>' +
      '<button type="button" class="ia2-btn ia2-principal" data-a="ok">' + e(libelle) + ' <i class="fa fa-chevron-right"></i></button>';
    pied.querySelector('[data-a="prec"]').addEventListener('click', function () { aller(r.i - 1); });
    pied.querySelector('[data-a="ok"]').addEventListener('click', action);
    r.action = action;
  }

  // Etape 1 : les incoherences, cote a cote.
  function vueIncoherences(x, corps, pied) {
    x.vu = true;
    corps.classList.add('v8-deux');
    corps.innerHTML = '<div class="v8-gauche v8-cote"></div><div class="v8-droite"></div>';
    var droite = corps.querySelector('.v8-droite');
    droite.appendChild(o.el('<h4 class="ia2-titre"><i class="fa fa-link"></i>Incohérences entre documents</h4>'));
    droite.appendChild(o.el('<p class="ia2-muet" style="font-size:12.5px;margin:0 0 8px">Cliquez une ligne pour voir les deux documents. ' +
      'Chaque incohérence est aussi reprise dans la section concernée.</p>'));
    var liste = [];
    IA.sections().forEach(function (s) {
      (s.croisements || []).filter(function (c) { return c.resultat !== 'coherent'; }).forEach(function (c) { liste.push({ s: s, c: c }); });
    });
    var gauche = corps.querySelector('.v8-gauche');
    function montrer(k) {
      droite.querySelectorAll('.v8-inc').forEach(function (b, j) { b.classList.toggle('v8-inc-actif', j === k); });
      var c = liste[k].c;
      gauche.innerHTML = '<div class="v8-duo"><div><div class="v8-duo-titre">' + e(c.a.fichier) + ' : <b>' + e(c.a.valeur) + '</b></div><div class="ia-v-zone"></div></div>' +
        '<div><div class="v8-duo-titre">' + e(c.b.fichier) + ' : <b>' + e(c.b.valeur) + '</b></div><div class="ia-v-zone"></div></div></div>';
      var zones = gauche.querySelectorAll('.ia-v-zone');
      [c.a, c.b].forEach(function (g, j) {
        IA.rendrePage(IA.urlDocument(g.nom), g.rect ? [{ rect: g.rect, teinte: 'probleme' }] : [], zones[j], Math.max(300, zones[j].clientWidth - 24)).then(function () {
          var h = zones[j].querySelector('.ia-surlignage');
          if (h) { h.classList.add('ia-actif'); h.scrollIntoView({ block: 'center' }); }
        });
      });
    }
    liste.forEach(function (l, k) {
      var b = o.el('<button type="button" class="v8-inc"><i class="fa fa-exclamation-circle ia2-rouge"></i><span><b>' + e(l.c.titre) + '</b>' +
        '<span class="ia2-inc-valeurs"><span>' + e(l.c.a.valeur) + '</span><i class="fa fa-arrows-h"></i><span>' + e(l.c.b.valeur) + '</span></span>' +
        '<span class="ia2-muet">' + e(l.s.titre) + '</span></span></button>');
      b.addEventListener('click', function () { montrer(k); });
      droite.appendChild(b);
    });
    IA.sections().forEach(function (s) {
      (s.piecesLiees || []).forEach(function (p) {
        droite.appendChild(o.el('<div class="ia2-inc"><i class="fa fa-chain-broken ia2-rouge"></i><div class="ia2-inc-texte"><b>' + e(p.section) +
          '</b> <span class="ia2-muet">· ' + e(p.etat) + '</span><div class="ia2-muet">' + e(p.texte) + '</div></div></div>'));
      });
    });
    if (liste.length) montrer(0);
    piedStandard(pied, '', function () { aller(r.i + 1); }, 'Continuer');
  }

  // Etape 2 : une section — PDF a gauche, propositions a droite.
  function vueSection(x, corps, pied) {
    var s = x.s;
    corps.classList.add('v8-deux');
    corps.innerHTML = '<div class="v8-gauche"></div><div class="v8-droite"></div>';
    var droite = corps.querySelector('.v8-droite');
    droite.appendChild(o.el('<div class="v8-sec-tete"><span class="ia2-tag ia2-t-' + s.statut + '" style="position:static"><span class="ia2-point"></span>' +
      e(IA.ui2.COURT[s.statut]) + '</span><b>' + e(IA.ui2.nom(s)) + '</b><div class="ia2-muet">' + e(s.resume) + '</div></div>'));
    droite.appendChild(IA.ui2.propositions(s));
    [IA.ui2.incoherences(s), IA.ui2.aSavoir(s)].forEach(function (b) { if (b) droite.appendChild(b); });
    var blocC = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-search"></i>Constats</h4><div></div></section>');
    droite.appendChild(blocC);
    droite.appendChild(IA.ui2.details(s));
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var vue = 'admin', doc = docs[0], liste;
    function constats() {
      var z = blocC.lastElementChild;
      z.innerHTML = '';
      if (doc) { liste = IA.ui2.constats(doc, vue, function (n) { r.v.activer(n); }); z.appendChild(liste); }
    }
    r.v = new IA.Visionneuse(corps.querySelector('.v8-gauche'), {
      documents: docs, compact: true,
      surConstat: function (d, k, n) { if (liste) liste.activer(n); },
      surVue: function (v) { vue = v; constats(); },
      surDocument: function (d) { doc = d; constats(); }
    });
    constats();
    function texte() {
      var p = IA.progressionSection(s);
      return p.finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Traité</span>' : (p.total - p.faites) + ' en attente';
    }
    piedStandard(pied, texte(), function () {
      IA.ui2.appliquerTout([s]);
      var p = IA.progressionSection(s);
      if (!p.finie) {
        o.toast('Il reste ' + (p.total - p.faites) + ' point(s) à décider vous-même (verdict « à décider » ou alerte).');
        var att = r.f.el.querySelector('.ia2-verdict .ia2-v-doute, .ia2-info-alerte .ia2-ok, .ia2-info-attention .ia2-ok');
        if (att) att.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      aller(r.i + 1);
    }, 'Appliquer et continuer');
    IA.on('decision', function () { var z = pied.querySelector('.v8-reste'); if (z && r && r.liste[r.i] === x) z.innerHTML = texte(); });
  }

  // Etape 3 : toutes les sections conformes, en une fois.
  function vueConformes(x, corps, pied) {
    corps.classList.add('v8-deux');
    corps.innerHTML = '<div class="v8-gauche"></div><div class="v8-droite"></div>';
    var droite = corps.querySelector('.v8-droite');
    droite.appendChild(o.el('<h4 class="ia2-titre"><i class="fa fa-check-circle ia2-vert"></i>Sections conformes</h4>'));
    droite.appendChild(o.el('<p class="ia2-muet" style="font-size:12.5px;margin:0 0 8px">L’IA n’a rien trouvé à corriger. Cliquez une ligne pour voir le document.</p>'));
    var gauche = corps.querySelector('.v8-gauche');
    function voir(s) {
      droite.querySelectorAll('.v8-conf').forEach(function (b) { b.classList.toggle('v8-inc-actif', b.__s === s); });
      gauche.innerHTML = '';
      new IA.Visionneuse(gauche, { documents: (s.documents || []).filter(function (d) { return d.el; }), compact: true });
    }
    x.liste.forEach(function (s) {
      var b = o.el('<button type="button" class="v8-conf"><i class="fa fa-check ia2-vert"></i><span><b>' + e(s.titre) + '</b><span class="ia2-muet">' +
        e(s.resume) + '</span></span></button>');
      b.__s = s;
      b.addEventListener('click', function () { voir(s); });
      droite.appendChild(b);
    });
    voir(x.liste[0]);
    piedStandard(pied, '', function () {
      var n = IA.ui2.appliquerTout(x.liste);
      o.toast(n + ' proposition(s) appliquée(s) sur les sections conformes.');
      aller(r.i + 1);
    }, 'Tout valider et continuer');
  }

  // Etape 4 : le dossier.
  function vueDossier(x, corps, pied) {
    var d = IA.dossier;
    corps.classList.add('v8-simple');
    corps.appendChild(o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-folder-open-o"></i>Synthèse</h4>' +
      d.dossier.synthese.map(function (t) { return '<div class="ia2-info">' + e(t) + '</div>'; }).join('') + '</section>'));
    var champs = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-magic"></i>Proposition IA — champs du dossier</h4></section>');
    d.champs.forEach(function (c) {
      champs.appendChild(o.el('<div class="v8-champ-lib">' + e(c.libelle) + '</div>'));
      champs.appendChild(c.type === 'select' ? IA.ui2.verdictChamp(c) : IA.ui2.prop({ cle: 'champ:' + c.cle, titre: 'Proposition IA', texte: c.propose,
        etudiant: c.cle === 'message', lignes: c.type === 'date' ? 1 : 3, appliquer: function (v) { IA.ecrire.champ(c, v); } }));
    });
    corps.appendChild(champs);
    var cf = IA.ui.campusFrance();
    if (cf) corps.appendChild(cf);
    var revoir = IA.brouillons().length;
    piedStandard(pied, revoir ? revoir + ' proposition(s) enregistrée(s) à revoir' : '', function () {
      r.f.fermer();
      var g = IA.progression();
      o.toast('Revue terminée : ' + g.faites + '/' + g.total + ' décisions écrites dans Feel Français.');
    }, 'Terminer');
  }

  function clavier(ev) {
    if (!r) return;
    var t = ev.target && ev.target.closest ? ev.target : document.body;
    if (t.closest('textarea, input, select')) return;
    var fait = true;
    if (ev.key === 'ArrowRight') aller(r.i + 1);
    else if (ev.key === 'ArrowLeft') aller(r.i - 1);
    else if (ev.key === 'Enter') { if (r.action) r.action(); }
    else if ((ev.key === 'v' || ev.key === 'V') && r.v && document.body.contains(r.v.c)) r.v.changerVue(r.v.vue === 'admin' ? 'etudiant' : 'admin');
    else fait = false;
    if (fait) { ev.preventDefault(); ev.stopPropagation(); }
  }
})();
