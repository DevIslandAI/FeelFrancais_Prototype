/*
 * Variante 5 — « Tableau de bord »
 *
 * Une barre de synthese en tete du dossier : verdict, progression, filtres par
 * statut, et des vues d'ensemble qu'aucune autre variante ne propose :
 *   - matrice de TOUS les controles croises du dossier ;
 *   - chronologie (depots, commentaires de Perle, reponses, analyses,
 *     propositions devenues obsoletes, validations humaines) ;
 *   - « Accepter les conformes » : premiere marche vers l'automatisation des
 *     pieces simples (E8), limitee aux sections conformes a confiance elevee.
 * Chaque section a une fiche compacte (verdict, 3 constats principaux,
 * propositions) ; le PDF annote s'ouvre en second temps, a la demande.
 * Sur la liste des notifications : filtres IA et priorite.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var fiche = null;

  IA.on('pret', function () {
    if (!IA.dossier) return notifications();
    IA.analysees().forEach(function (s) {
      s.el.classList.add('ia-section', 'ia-statut-' + s.statut);
      var b = o.el('<button type="button" class="ia-bouton" data-statut="' + s.statut + '"><span class="ia-point"></span>Fiche IA</button>');
      var etat = s.el.querySelector('.doc-general-state .doc-state');
      etat.insertBefore(b, etat.firstChild);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); ouvrirFiche(s); });
      s.bouton = b;
    });
    tableau();
    IA.ui.champs();
    IA.on('decision', maj);
    maj();
  });

  // ── Notifications : filtres IA au-dessus de leur tableau ──
  function notifications() {
    var filtre = 'tous';
    var barre = o.el('<div class="v5-filtres-notif"><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Prévalidation IA</span>' +
      '<button type="button" class="v5-chip ia-actif" data-f="tous">Tous</button>' +
      '<button type="button" class="v5-chip" data-f="a-traiter">À traiter</button>' +
      '<button type="button" class="v5-chip" data-f="conforme">Conformes</button>' +
      '<span class="ia-meta">Filtre d’affichage — n’agit pas sur les filtres Feel Français</span></div>');
    var table = document.querySelector('table.dataTable, table');
    var ancre = table && table.closest('.dataTables_wrapper') || table;
    if (ancre) ancre.parentNode.insertBefore(barre, ancre);
    barre.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-f]');
      if (!b) return;
      filtre = b.getAttribute('data-f');
      barre.querySelectorAll('.v5-chip').forEach(function (x) { x.classList.toggle('ia-actif', x === b); });
      appliquer();
    });
    function appliquer() {
      document.querySelectorAll('table.dataTable tbody tr').forEach(function (tr) {
        var st = tr.getAttribute('data-ia-statut');
        var montrer = filtre === 'tous' || !st || (filtre === 'conforme' ? st === 'conforme' : st !== 'conforme');
        tr.classList.toggle('v5-filtre-masque', !montrer);
      });
    }
    IA.ui.notifications(function (tr, cellule, info) {
      var statut, texte;
      if (info.dossier) {
        var n = info.compte;
        statut = info.dossier.dossier.verdict;
        texte = (n['alerte'] ? n['alerte'] + ' alerte · ' : '') + (n['a-corriger'] ? n['a-corriger'] + ' à corriger · ' : '') +
          (n['a-verifier'] ? n['a-verifier'] + ' à vérifier · ' : '') + n['conforme'] + ' conforme(s)';
      } else { statut = info.figurant[0]; texte = info.figurant[1]; }
      tr.setAttribute('data-ia-statut', statut);
      cellule.appendChild(o.el('<div><span class="ia-notif ia-p-' + statut + '" title="' + e(texte) + '"><i class="fa fa-magic"></i>' +
        e(texte.length > 32 ? IA.LIBELLES[statut] : texte) + '</span></div>'));
      appliquer();
    });
  }

  // ── Le tableau de bord du dossier ──
  var CATEGORIES = [['alerte', 'Alertes'], ['a-corriger', 'À corriger'], ['a-verifier', 'À vérifier'], ['provisoire', 'Provisoires'],
    ['conforme', 'Conformes'], ['humain', 'Validées par l’équipe'], ['optionnel', 'Optionnelles']];

  function tableau() {
    var d = IA.dossier;
    var tb = o.el('<div class="v5-tableau"><div class="v5-l1">' +
      '<div class="v5-anneau" title="Décisions prises"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" class="v5-fond"/>' +
      '<circle cx="18" cy="18" r="15.9" class="v5-plein" stroke-dasharray="0 100"/></svg><span></span></div>' +
      '<div class="v5-titre"><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Prévalidation IA</span> ' + o.pastille(d.dossier.verdict) +
      '<div class="ia-meta">Analyse du <b>' + e(d.analyse.date) + '</b> · ' + e(d.zone) + ' · étape ' + e(d.etape) + '</div></div>' +
      '<span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-v="croises"><i class="fa fa-th"></i>Contrôles croisés</button>' +
      '<button type="button" class="ia-btn" data-v="chrono"><i class="fa fa-history"></i>Chronologie</button>' +
      (d.campusFrance && !d.campusFrance.absent ? '<button type="button" class="ia-btn" data-v="campus"><i class="fa fa-comments"></i>Campus France</button>' : '') +
      '<button type="button" class="ia-btn" data-v="champs"><i class="fa fa-pencil-square-o"></i>Champs (' + d.champs.length + ')</button>' +
      '<button type="button" class="ia-btn ia-btn-ok" data-v="conformes"><i class="fa fa-check-square-o"></i>Accepter les conformes</button>' +
      '</div><div class="v5-l2"></div><div class="v5-liste" hidden></div></div>');
    var cible = IA.blocDocuments();
    cible.parentNode.insertBefore(tb, cible);
    var l2 = tb.querySelector('.v5-l2');
    CATEGORIES.forEach(function (c) {
      var n = IA.sections().filter(function (s) { return s.el && s.statut === c[0]; }).length;
      if (!n) return;
      l2.appendChild(o.el('<button type="button" class="v5-chip v5-c-' + c[0] + '" data-cat="' + c[0] + '">' +
        (IA.ICONES[c[0]] ? '<i class="fa ' + IA.ICONES[c[0]] + '"></i>' : '') + c[1] + ' <b>' + n + '</b></button>'));
    });
    tb.addEventListener('click', function (ev) {
      var cat = ev.target.closest('[data-cat]');
      if (cat) return basculerCategorie(cat.getAttribute('data-cat'), cat);
      var v = ev.target.closest('[data-v]');
      if (!v) return;
      ({ croises: matrice, chrono: chronologie, campus: campus, champs: champs, conformes: accepterConformes })[v.getAttribute('data-v')]();
    });
  }

  function basculerCategorie(cat, chip) {
    var liste = document.querySelector('.v5-liste');
    var deja = chip.classList.contains('ia-actif');
    document.querySelectorAll('.v5-l2 .v5-chip').forEach(function (x) { x.classList.remove('ia-actif'); });
    IA.sections().forEach(function (s) { if (s.el) s.el.classList.remove('v5-repere'); });
    if (deja) { liste.hidden = true; return; }
    chip.classList.add('ia-actif');
    liste.hidden = false;
    liste.innerHTML = '';
    IA.sections().filter(function (s) { return s.el && s.statut === cat; }).forEach(function (s) {
      s.el.classList.add('v5-repere');
      var info = cat === 'humain' ? 'Validé par ' + s.humain.par + ' le ' + s.humain.le + ' — aucune nouveauté, rien à revoir.'
        : cat === 'optionnel' ? 'Pièce optionnelle : visible, jamais analysée par l’IA.' : s.resume;
      var l = o.el('<div class="v5-ligne"><b>' + e(s.titre) + '</b><span class="ia-meta" style="flex:1">' + e(info) + '</span>' +
        '<button type="button" class="ia-mini" data-aller><i class="fa fa-crosshairs"></i>Voir</button>' +
        (s.bouton ? '<button type="button" class="ia-mini" data-fiche><i class="fa fa-magic"></i>Fiche</button>' : '') + '</div>');
      l.querySelector('[data-aller]').addEventListener('click', function () { o.defiler(s.el); });
      var fb = l.querySelector('[data-fiche]');
      if (fb) fb.addEventListener('click', function () { ouvrirFiche(s); });
      liste.appendChild(l);
    });
  }

  function maj() {
    var p = IA.progression();
    var pct = p.total ? Math.round(100 * p.faites / p.total) : 0;
    var anneau = document.querySelector('.v5-anneau');
    if (anneau) {
      anneau.querySelector('.v5-plein').setAttribute('stroke-dasharray', pct + ' 100');
      anneau.querySelector('span').textContent = pct + '%';
    }
    IA.analysees().forEach(function (s) {
      var q = IA.progressionSection(s);
      s.el.classList.toggle('ia-decide', q.finie);
      s.bouton.classList.toggle('ia-fait', q.finie);
      s.bouton.innerHTML = '<span class="ia-point"></span>' + (q.finie ? '<i class="fa fa-check"></i> Traité' : 'Fiche IA');
    });
  }

  // ── La fiche compacte d'une section ──
  function ouvrirFiche(s) {
    if (fiche) fiche.fermer();
    IA.analysees().forEach(function (x) { x.el.classList.toggle('ia-focus', x === s); });
    var f = IA.ui.fenetre({ titre: 'Fiche IA — ' + s.titre, classe: 'v5-fiche', surFermeture: function () {
      s.el.classList.remove('ia-focus'); fiche = null;
    } });
    fiche = f;
    f.el.__fermer = f.fermer;
    f.el.innerHTML = '<div class="v5-fiche-tete"><div style="flex:1"></div><button type="button" class="ia-mini" data-fermer><i class="fa fa-times"></i></button></div>' +
      '<div class="v5-fiche-corps"></div>';
    f.el.querySelector('.v5-fiche-tete > div').appendChild(IA.ui.entete(s));
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var corps = f.el.querySelector('.v5-fiche-corps');
    // Les 3 constats qui demandent une action, tous documents confondus
    var principaux = [];
    (s.documents || []).forEach(function (d) {
      if (!d.el) return;
      IA.constatsVisibles(d, 'admin').forEach(function (k, n) {
        if (k.probleme || k.type === 'a-verifier') principaux.push({ d: d, k: k, n: n });
      });
    });
    var bloc = o.el('<div class="ia-bloc"><h6><i class="fa fa-search"></i>Points principaux</h6></div>');
    (principaux.length ? principaux.slice(0, 3) : []).forEach(function (x) {
      var t = o.typeConstat(x.k);
      var l = o.el('<div class="ia-constat ia-t-' + t + '"><span class="ia-num">' + (x.n + 1) + '</span><div><div class="ia-type">' +
        e(o.libelleType(x.k)) + '</div>' + e(x.k.texte) + '<div class="ia-meta">' + e(x.d.sousType) + ' · p. 1</div></div>' +
        '<button type="button" class="ia-mini"><i class="fa fa-file-pdf-o"></i></button></div>');
      l.addEventListener('click', function () { ouvrirPdf(s, x.d.nom, x.n); });
      bloc.appendChild(l);
    });
    if (!principaux.length) bloc.appendChild(o.el('<div class="ia-meta">Aucun point bloquant : tous les constats sont conformes.</div>'));
    if (principaux.length > 3) bloc.appendChild(o.el('<div class="ia-meta">+ ' + (principaux.length - 3) + ' autre(s) dans le PDF annoté</div>'));
    var btn = o.el('<button type="button" class="ia-btn ia-btn-ia" style="margin-top:6px"><i class="fa fa-file-pdf-o"></i>Ouvrir le PDF annoté</button>');
    btn.addEventListener('click', function () { ouvrirPdf(s); });
    bloc.appendChild(btn);
    corps.appendChild(bloc);
    var blocs = IA.ui.blocsSection(s);
    if (blocs.childElementCount) corps.appendChild(blocs);
    corps.appendChild(IA.ui.propositionsSection(s));
    corps.appendChild(IA.ui.pourquoi(s));
    var pied = o.el('<div class="v5-fiche-pied"><button type="button" class="ia-btn ia-btn-ok"><i class="fa fa-check"></i>Tout accepter</button>' +
      '<button type="button" class="ia-btn" data-suiv>Suivante <i class="fa fa-chevron-right"></i></button></div>');
    pied.querySelector('.ia-btn-ok').addEventListener('click', function () {
      IA.ui.toutAccepter([s]);
      var p = IA.progressionSection(s);
      o.toast(p.finie ? 'Section traitée.' : 'Il reste ' + (p.total - p.faites) + ' point(s) à trancher vous-même.');
    });
    pied.querySelector('[data-suiv]').addEventListener('click', function () {
      var prochaine = IA.analysees().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
      if (prochaine) ouvrirFiche(prochaine); else f.fermer();
    });
    f.el.appendChild(pied);
    o.defiler(s.el);
  }

  function ouvrirPdf(s, nom, n) {
    var f = IA.ui.fenetre({ titre: 'PDF annoté', classe: 'v5-pdf' });
    f.el.innerHTML = '<div class="v5-pdf-tete"><b>' + e(s.titre) + '</b><span style="flex:1"></span><button type="button" class="ia-btn" data-fermer>' +
      '<i class="fa fa-times"></i>Fermer</button></div><div class="v5-pdf-corps"><div class="v5-pdf-v"></div><div class="v5-pdf-l"></div></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var liste = f.el.querySelector('.v5-pdf-l');
    var vue = 'admin';
    var courant = docs[0];
    var v;
    function dessiner(actif) {
      liste.innerHTML = IA.ui.reperes(courant);
      var l = IA.ui.constats(courant, vue, function (i) { v.activer(i); });
      if (actif != null && l.children[actif]) l.children[actif].classList.add('ia-actif');
      liste.appendChild(l);
    }
    v = new IA.Visionneuse(f.el.querySelector('.v5-pdf-v'), {
      documents: docs,
      surConstat: function (d, k, i) { dessiner(i); },
      surVue: function (x) { vue = x; dessiner(); },
      surDocument: function (d) { courant = d; dessiner(); }
    });
    if (nom) v.montrer(nom, n);
  }

  // ── Matrice de tous les controles croises du dossier ──
  function matrice() {
    var f = IA.ui.fenetre({ titre: 'Contrôles croisés', classe: 'v5-grande' });
    f.el.innerHTML = '<div class="v5-pdf-tete"><b><i class="fa fa-th"></i> Tous les contrôles croisés du dossier</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i>Fermer</button></div><div class="v5-grande-corps"></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var t = o.el('<table class="ia-table"><tr><th></th><th>Contrôle</th><th>Pièce A</th><th>Pièce B</th><th>Section</th><th></th></tr></table>');
    var lignes = [];
    IA.sections().forEach(function (s) { (s.croisements || []).forEach(function (x) { lignes.push({ s: s, x: x }); }); });
    lignes.sort(function (a, b) { return (a.x.resultat === 'coherent') - (b.x.resultat === 'coherent'); });
    lignes.forEach(function (l) {
      var ok = l.x.resultat === 'coherent';
      var tr = o.el('<tr><td class="' + (ok ? 'ia-ok' : 'ia-ko') + '"><i class="fa ' + (ok ? 'fa-check' : 'fa-times') + '"></i></td><td><b>' +
        e(l.x.titre) + '</b></td><td>' + e(l.x.a.fichier) + '<br><span class="ia-meta">' + e(l.x.a.valeur) + '</span></td><td>' + e(l.x.b.fichier) +
        '<br><span class="ia-meta">' + e(l.x.b.valeur) + '</span></td><td class="ia-meta">' + e(l.s.titre) + '</td>' +
        '<td><button type="button" class="ia-mini"><i class="fa fa-columns"></i>Côte à côte</button></td></tr>');
      tr.querySelector('button').addEventListener('click', function () {
        var te = ok ? 'conforme' : 'probleme';
        IA.ui.ouvrirCote(l.x.titre, { libelle: l.x.a.fichier, valeur: l.x.a.valeur, nom: l.x.a.nom, rect: l.x.a.rect, teinte: te },
          { libelle: l.x.b.fichier, valeur: l.x.b.valeur, nom: l.x.b.nom, rect: l.x.b.rect, teinte: te });
      });
      t.appendChild(tr);
    });
    var corps = f.el.querySelector('.v5-grande-corps');
    corps.appendChild(o.el('<div class="ia-meta" style="margin-bottom:8px">' + lignes.length + ' contrôles, dont <b class="ia-ko">' +
      lignes.filter(function (l) { return l.x.resultat !== 'coherent'; }).length + ' contradiction(s)</b>. Les contradictions sont en tête.</div>'));
    corps.appendChild(t);
  }

  // ── Chronologie du dossier ──
  function chronologie() {
    var ev = [];
    function date(s) { var m = /(\d\d)\/(\d\d)\/(\d{4})(?: (\d\d):(\d\d))?/.exec(s || ''); return m ? new Date(m[3], m[2] - 1, m[1], m[4] || 10, m[5] || 0) : null; }
    IA.sections().forEach(function (s) {
      if (s.humain) ev.push({ d: date(s.humain.le), icone: 'fa-user', classe: 'humain', texte: 'Validé par ' + s.humain.par + ' : ' + s.titre });
      (s.versions || []).forEach(function (v, i) {
        ev.push({ d: date(v.depose), icone: 'fa-upload', classe: 'depot', texte: 'Dépôt v' + (i + 1) + ' — ' + s.titre });
        ev.push({ d: new Date(date(v.depose).getTime() + 3600e3), icone: 'fa-comment', classe: 'perle', texte: 'Refus de Perle : « ' + v.commentairePerle + ' »' });
      });
      if (s.reponseEtudiant) ev.push({ d: date(s.reponseEtudiant.le), icone: 'fa-reply', classe: 'etudiant', texte: 'Réponse de l’étudiant : « ' + s.reponseEtudiant.texte + ' »' });
      (s.propositionsObsoletes || []).forEach(function (p) { ev.push({ d: date(p.date), icone: 'fa-ban', classe: 'obsolete', texte: 'Proposition IA devenue obsolète : ' + p.texte + ' — ' + p.raison }); });
      (s.documents || []).forEach(function (d) {
        var m = /_(\d\d)_(\d\d)_(\d{4})\.pdf$/.exec(d.nom || '');
        if (m && s.statut !== 'humain') ev.push({ d: new Date(m[3], m[2] - 1, m[1], 10), icone: 'fa-upload', classe: 'depot', texte: 'Dépôt : ' + d.sousType });
      });
    });
    ev.push({ d: date(IA.dossier.analyse.date), icone: 'fa-magic', classe: 'ia', texte: 'Analyse IA (' + IA.dossier.analyse.duree + ') — ' + IA.dossier.analyse.declencheur });
    IA.journal().forEach(function (j) {
      ev.push({ d: new Date(j.le), icone: 'fa-check', classe: 'decision', texte: 'Votre décision : ' + j.cle.replace(/^(sec|doc|champ):/, '') + ' → ' + j.statut });
    });
    ev.sort(function (a, b) { return a.d - b.d; });
    var f = IA.ui.fenetre({ titre: 'Chronologie', classe: 'v5-grande' });
    f.el.innerHTML = '<div class="v5-pdf-tete"><b><i class="fa fa-history"></i> Chronologie du dossier</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i>Fermer</button></div><div class="v5-grande-corps"><ol class="v5-chrono"></ol></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var ol = f.el.querySelector('.v5-chrono');
    ev.forEach(function (x) {
      ol.appendChild(o.el('<li class="v5-ev-' + x.classe + '"><span class="v5-ev-ico"><i class="fa ' + x.icone + '"></i></span><span class="ia-meta">' +
        x.d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</span> ' + e(x.texte) + '</li>'));
    });
  }

  function campus() {
    var f = IA.ui.fenetre({ titre: 'Campus France', classe: 'v5-grande' });
    f.el.innerHTML = '<div class="v5-pdf-tete"><b><i class="fa fa-comments"></i> Campus France</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i>Fermer</button></div><div class="v5-grande-corps"></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    f.el.querySelector('.v5-grande-corps').appendChild(IA.ui.campusFrance());
  }

  function champs() {
    var f = IA.ui.fenetre({ titre: 'Champs du dossier', classe: 'v5-grande' });
    f.el.innerHTML = '<div class="v5-pdf-tete"><b><i class="fa fa-pencil-square-o"></i> Champs du dossier</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i>Fermer</button></div><div class="v5-grande-corps"></div>';
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var corps = f.el.querySelector('.v5-grande-corps');
    corps.appendChild(IA.ui.syntheseDossier());
    IA.dossier.champs.forEach(function (c) {
      corps.appendChild(o.el('<div style="font-weight:700;margin-top:10px">' + e(c.libelle) + '</div>'));
      corps.appendChild(IA.ui.propositionChamp(c));
    });
  }

  // Automatisation progressive (E8) : seulement les sections conformes a confiance elevee.
  function accepterConformes() {
    var cibles = IA.analysees().filter(function (s) { return s.statut === 'conforme' && s.confiance === 'élevée' && !IA.progressionSection(s).finie; });
    if (!cibles.length) return o.toast('Aucune section conforme en attente.');
    var n = IA.ui.toutAccepter(cibles);
    o.toast(cibles.length + ' section(s) conforme(s) acceptée(s) (' + n + ' décisions). Les autres restent à revoir.');
  }
})();
