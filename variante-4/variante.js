/*
 * Variante 4 — « Mode revue »
 *
 * Un parcours plein ecran, section par section, pilotable au clavier :
 *   A accepter · R refuser · E modifier · ↓/↑ proposition suivante/precedente
 *   → / ← section suivante/precedente · V vue etudiant · 1-9 surligner un constat
 *   Entree valider la section et passer a la suivante · ? aide · Echap quitter
 * Une seule proposition a la fois est « active » (cadre violet) : la memoire de
 * travail ne porte que sur elle. A la fin, un recapitulatif du dossier reprend
 * toutes les decisions et les propositions sur les champs (statut, texte).
 * Pense pour la haute saison : traiter vite les cas simples (E8).
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var revue = null;
  // L'element vise par une touche (le document lui-meme si rien n'a le focus).
  function cible(ev) { return ev.target && ev.target.closest ? ev.target : document.body; }

  IA.on('pret', function () {
    if (!IA.dossier) return notifications();
    IA.analysees().forEach(function (s) {
      s.el.classList.add('ia-section', 'ia-statut-' + s.statut);
      var b = o.el('<button type="button" class="ia-bouton" data-statut="' + s.statut + '"><span class="ia-point"></span>Revoir</button>');
      var etat = s.el.querySelector('.doc-general-state .doc-state');
      etat.insertBefore(b, etat.firstChild);
      b.addEventListener('click', function () { demarrer(IA.analysees().indexOf(s)); });
      s.bouton = b;
    });
    IA.on('decision', function () {
      IA.analysees().forEach(function (s) {
        var p = IA.progressionSection(s);
        s.el.classList.toggle('ia-decide', p.finie);
        s.bouton.classList.toggle('ia-fait', p.finie);
      });
    });
    lanceur();
    IA.ui.champs({ surVoir: function () { demarrer(IA.analysees().length); } });
  });

  function notifications() {
    IA.ui.notifications(function (tr, cellule, info) {
      var statut = info.dossier ? info.dossier.dossier.verdict : info.figurant[0];
      var texte = info.dossier ? (IA.ui.resumeDossier(info.dossier)['a-corriger'] + IA.ui.resumeDossier(info.dossier)['alerte'] +
        IA.ui.resumeDossier(info.dossier)['a-verifier'] + ' section(s) à revoir') : IA.LIBELLES[statut];
      cellule.appendChild(o.el('<div><span class="ia-notif ia-p-' + statut + '"><i class="fa fa-play-circle"></i>' + e(texte) + '</span></div>'));
    });
  }

  function lanceur() {
    var d = IA.dossier;
    var n = IA.ui.resumeDossier(d);
    var b = o.el('<div class="v4-lanceur"><div><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Analyse IA prête</span> ' +
      '<span class="ia-meta">du ' + e(d.analyse.date) + '</span><div style="margin-top:4px;font-size:13px"><b>' + IA.analysees().length +
      ' sections</b> à revoir, dont ' + (n['a-corriger'] + n['alerte']) + ' à corriger ou arbitrer · environ ' +
      Math.max(1, Math.round(IA.progression().total * 6 / 60)) + ' min</div></div>' +
      '<button type="button" class="ia-btn ia-btn-ia v4-go"><i class="fa fa-play"></i>Démarrer la revue <span class="ia-kbd">R</span></button></div>');
    var cible = IA.blocDocuments();
    cible.parentNode.insertBefore(b, cible);
    b.querySelector('.v4-go').addEventListener('click', function () { demarrer(0); });
    document.addEventListener('keydown', function (ev) {
      if (!revue && (ev.key === 'r' || ev.key === 'R') && !cible(ev).closest('input, textarea, select, [contenteditable]')) {
        ev.preventDefault();
        demarrer(0);
      }
    });
  }

  // ── Le mode revue ──
  function demarrer(rang) {
    if (revue) return;
    var liste = IA.analysees();
    var f = IA.ui.fenetre({ titre: 'Mode revue', classe: 'v4-revue', bloquante: true, surFermeture: function () {
      document.removeEventListener('keydown', clavier, true);
      liste.forEach(function (x) { x.el.classList.remove('ia-focus'); });
      revue = null;
    } });
    revue = { f: f, rang: rang, liste: liste, prop: 0, visionneuse: null, vue: 'admin' };
    f.el.innerHTML = '<div class="v4-tete"><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Mode revue</span>' +
      '<b>' + e(IA.dossier.etudiant) + '</b><div class="v4-etapes"></div>' +
      '<button type="button" class="v4-aide-btn" title="Raccourcis (?)">?</button>' +
      '<button type="button" class="v4-quitter" title="Quitter (Échap)"><i class="fa fa-times"></i></button></div>' +
      '<div class="v4-corps"></div><div class="v4-pied"></div>';
    f.el.querySelector('.v4-quitter').addEventListener('click', f.fermer);
    f.el.querySelector('.v4-aide-btn').addEventListener('click', aide);
    document.addEventListener('keydown', clavier, true);
    etapes();
    afficher();
  }

  function etapes() {
    var zone = revue.f.el.querySelector('.v4-etapes');
    zone.innerHTML = '';
    revue.liste.forEach(function (s, i) {
      var p = IA.progressionSection(s);
      var b = o.el('<button type="button" class="v4-etape v4-' + s.statut + (p.finie ? ' v4-finie' : '') + (i === revue.rang ? ' v4-active' : '') +
        '" title="' + e(s.titre) + '">' + (p.finie ? '<i class="fa fa-check"></i>' : i + 1) + '</button>');
      b.addEventListener('click', function () { aller(i); });
      zone.appendChild(b);
    });
    var r = o.el('<button type="button" class="v4-etape v4-recap' + (revue.rang === revue.liste.length ? ' v4-active' : '') +
      '" title="Récapitulatif et champs du dossier"><i class="fa fa-flag-checkered"></i></button>');
    r.addEventListener('click', function () { aller(revue.liste.length); });
    zone.appendChild(r);
  }

  function aller(i) {
    revue.rang = Math.max(0, Math.min(revue.liste.length, i));
    revue.prop = 0;
    etapes();
    afficher();
  }

  function afficher() {
    var corps = revue.f.el.querySelector('.v4-corps');
    var pied = revue.f.el.querySelector('.v4-pied');
    corps.innerHTML = '';
    pied.innerHTML = '';
    revue.liste.forEach(function (x, i) { x.el.classList.toggle('ia-focus', i === revue.rang); });
    if (revue.rang === revue.liste.length) return recapitulatif(corps, pied);
    var s = revue.liste[revue.rang];
    corps.innerHTML = '<div class="v4-gauche"></div><div class="v4-droite"></div>';
    var droite = corps.querySelector('.v4-droite');
    droite.appendChild(IA.ui.entete(s));
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var constats = o.el('<div class="ia-bloc"><h6><i class="fa fa-search"></i>Constats <span class="ia-meta" style="text-transform:none;letter-spacing:0">— touches 1 à 9</span></h6><div></div></div>');
    droite.appendChild(constats);
    var courant = docs[0];
    function dessinerConstats(actif) {
      var zone = constats.lastElementChild;
      zone.innerHTML = courant ? IA.ui.reperes(courant) : '';
      if (!courant) return;
      var l = IA.ui.constats(courant, revue.vue, function (n) { revue.visionneuse.activer(n); });
      if (actif != null && l.children[actif]) l.children[actif].classList.add('ia-actif');
      zone.appendChild(l);
    }
    var blocs = IA.ui.blocsSection(s);
    if (blocs.childElementCount) droite.appendChild(blocs);
    var props = IA.ui.propositionsSection(s);
    props.classList.add('v4-props');
    droite.appendChild(o.el('<div class="ia-meta v4-props-titre"><b>Décisions</b> — la proposition active est encadrée</div>'));
    droite.appendChild(props);
    droite.appendChild(IA.ui.pourquoi(s));
    revue.courantDocs = docs;
    revue.dessinerConstats = dessinerConstats;
    revue.visionneuse = new IA.Visionneuse(corps.querySelector('.v4-gauche'), {
      documents: docs, vue: revue.vue,
      surConstat: function (d, k, n) { dessinerConstats(n); },
      surVue: function (v) { revue.vue = v; dessinerConstats(); },
      surDocument: function (d) { courant = d; dessinerConstats(); }
    });
    pied.innerHTML = '<span class="ia-meta"><span class="ia-kbd">A</span> accepter <span class="ia-kbd">R</span> refuser ' +
      '<span class="ia-kbd">E</span> modifier <span class="ia-kbd">↓</span><span class="ia-kbd">↑</span> proposition ' +
      '<span class="ia-kbd">→</span><span class="ia-kbd">←</span> section <span class="ia-kbd">V</span> vue étudiant</span>' +
      '<span style="flex:1"></span><span class="ia-meta v4-reste"></span>' +
      '<button type="button" class="ia-btn ia-btn-ok v4-suivant">Valider et continuer <span class="ia-kbd">Entrée</span></button>';
    pied.querySelector('.v4-suivant').addEventListener('click', validerEtContinuer);
    activer(0);
    IA.on('decision', function () { if (revue && revue.liste[revue.rang] === s) { reste(s); etapes(); } });
    reste(s);
  }

  function reste(s) {
    var el = revue.f.el.querySelector('.v4-reste');
    if (!el) return;
    var p = IA.progressionSection(s);
    el.innerHTML = p.finie ? '<span class="ia-ok"><i class="fa fa-check"></i> Section traitée</span>' : (p.total - p.faites) + ' en attente';
  }

  // La proposition active : la premiere sans decision a partir de l'index.
  function propsAttente() {
    return Array.prototype.slice.call(revue.f.el.querySelectorAll('.v4-props .ia-prop, .v4-droite .ia-bloc-alerte, .v4-droite .ia-bloc-attention'))
      .filter(function (p) { return p.querySelector('.ia-btn'); });
  }
  function activer(i) {
    var l = propsAttente();
    revue.f.el.querySelectorAll('.v4-courant').forEach(function (x) { x.classList.remove('v4-courant'); });
    if (!l.length) return;
    revue.prop = (i + l.length) % l.length;
    var p = l[revue.prop];
    p.classList.add('v4-courant');
    p.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function actionCourante(type) {
    var p = revue.f.el.querySelector('.v4-courant');
    if (!p) return;
    var b;
    if (type === 'accepter') b = p.querySelector('[data-action="accepter"], [data-choix="garder"], [data-choix="preparer"], [data-a="ok"], [data-action="valide"]');
    if (type === 'refuser') b = p.querySelector('[data-action="refuser"], [data-choix="plus-tard"], [data-choix="refuser"], [data-a="non"]');
    if (type === 'modifier') {
      var t = p.querySelector('textarea');
      if (t) { t.readOnly = false; t.focus(); }
      return;
    }
    if (b) { b.click(); setTimeout(function () { activer(revue.prop); }, 50); }
  }

  function validerEtContinuer() {
    var s = revue.liste[revue.rang];
    if (s) {
      IA.ui.toutAccepter([s]);
      var p = IA.progressionSection(s);
      if (!p.finie) {
        o.toast('Il reste ' + (p.total - p.faites) + ' point(s) que l’IA ne tranche pas.');
        activer(0);
        return;
      }
    }
    aller(revue.rang + 1);
  }

  function clavier(ev) {
    if (!revue) return;
    var dansTexte = cible(ev).closest('textarea, input, select');
    if (dansTexte) {
      if (ev.key === 'Escape') { ev.target.blur(); ev.preventDefault(); }
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); ev.target.blur(); actionCourante('accepter'); }
      return;
    }
    var k = ev.key;
    var fait = true;
    if (k === 'a' || k === 'A') actionCourante('accepter');
    else if (k === 'r' || k === 'R') actionCourante('refuser');
    else if (k === 'e' || k === 'E') { ev.preventDefault(); actionCourante('modifier'); }
    else if (k === 'ArrowDown') activer(revue.prop + 1);
    else if (k === 'ArrowUp') activer(revue.prop - 1);
    else if (k === 'ArrowRight') aller(revue.rang + 1);
    else if (k === 'ArrowLeft') aller(revue.rang - 1);
    else if (k === 'Enter') validerEtContinuer();
    else if ((k === 'v' || k === 'V') && revue.visionneuse) revue.visionneuse.changerVue(revue.vue === 'admin' ? 'etudiant' : 'admin');
    else if (/^[1-9]$/.test(k) && revue.visionneuse) { revue.visionneuse.activer(+k - 1); revue.dessinerConstats(+k - 1); }
    else if (k === '?') aide();
    else if (k === 'Escape') revue.f.fermer();
    else fait = false;
    if (fait) { ev.preventDefault(); ev.stopPropagation(); }
  }

  function aide() {
    o.toast('A accepter · R refuser · E modifier (Ctrl+Entrée pour valider le texte) · ↓↑ proposition · →← section · ' +
      'V vue étudiant · 1-9 constat · Entrée valider la section · Échap quitter');
  }

  // ── Recapitulatif : toutes les decisions + champs du dossier ──
  function recapitulatif(corps, pied) {
    corps.innerHTML = '<div class="v4-recap-corps"></div>';
    var zone = corps.firstChild;
    zone.appendChild(IA.ui.syntheseDossier());
    var tableau = o.el('<div class="ia-bloc"><h6><i class="fa fa-list"></i>Vos décisions</h6><table class="ia-table"><tr><th>Section</th>' +
      '<th>Proposition IA</th><th>Décisions</th><th></th></tr></table></div>');
    revue.liste.forEach(function (s, i) {
      var p = IA.progressionSection(s);
      var detail = IA.propositionsSection(s).map(function (x) {
        var d = IA.decision(x.cle);
        return d ? { accepte: '✓', modifie: '✎', refuse: '✗' }[d.statut] : '·';
      }).join(' ');
      var tr = o.el('<tr><td><b>' + e(s.titre) + '</b></td><td>' + o.pastille(s.statut) + '</td><td>' + detail + ' <span class="ia-meta">(' +
        p.faites + '/' + p.total + ')</span></td><td><button type="button" class="ia-mini">Revoir</button></td></tr>');
      tr.querySelector('button').addEventListener('click', function () { aller(i); });
      tableau.querySelector('table').appendChild(tr);
    });
    zone.appendChild(tableau);
    var champs = o.el('<div class="ia-bloc"><h6><i class="fa fa-pencil-square-o"></i>Champs du dossier</h6></div>');
    IA.dossier.champs.forEach(function (c) {
      champs.appendChild(o.el('<div style="font-weight:700;margin-top:8px">' + e(c.libelle) + '</div>'));
      champs.appendChild(IA.ui.propositionChamp(c));
    });
    zone.appendChild(champs);
    var cf = IA.ui.campusFrance();
    if (cf) zone.appendChild(cf);
    var g = IA.progression();
    pied.innerHTML = '<span class="ia-meta"><b>' + g.faites + '/' + g.total + '</b> décisions prises</span><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn ia-btn-ok"><i class="fa fa-flag-checkered"></i>Terminer la revue</button>';
    pied.querySelector('.ia-btn').addEventListener('click', function () {
      revue.f.fermer();
      o.toast('Revue terminée : ' + IA.progression().faites + ' décision(s) écrite(s) dans Feel Français.');
    });
  }
})();
