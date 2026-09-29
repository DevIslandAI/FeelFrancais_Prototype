/*
 * Variante 1 — « Fenêtre d'analyse »
 *
 * Le schema decrit a l'oral : les sections analysees ont un contour de couleur
 * et un petit bouton IA ; le bouton ouvre une grande fenetre :
 *   a gauche le PDF surligne (vue admin / vue etudiant, telechargeables),
 *   a droite l'analyse, en dessous le verdict et les commentaires proposes,
 *   tout en bas « Valider la section ».
 * Les sections sans nouveau depot restent blanches ; les pieces optionnelles
 * n'ont rien.
 *
 * Charge cognitive : une section a la fois (pas de navigation entre plusieurs
 * fenetres), preuve et constat cote a cote (attention non partagee), numeros
 * communs entre la liste et les surlignages.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;

  IA.on('pret', function () {
    if (!IA.dossier) return notifications();
    sections();
    barreSynthese();
    IA.ui.champs();
  });

  // ── Page des notifications : l'etat de l'analyse sous le nom ──
  function notifications() {
    IA.ui.notifications(function (tr, cellule, info) {
      var html;
      if (info.dossier) {
        var n = info.compte;
        var aFaire = n['a-corriger'] + n['a-verifier'] + n['alerte'];
        html = aFaire ? '<span class="ia-notif ia-p-a-corriger"><i class="fa fa-magic"></i>IA · ' + aFaire + ' à traiter</span>'
          : '<span class="ia-notif ia-p-conforme"><i class="fa fa-magic"></i>IA · tout conforme</span>';
      } else {
        html = '<span class="ia-notif ia-p-' + info.figurant[0] + '"><i class="fa fa-magic"></i>IA · ' + e(info.figurant[1]) + '</span>';
      }
      var n2 = o.el('<div>' + html + '</div>');
      cellule.appendChild(n2);
    });
  }

  // ── Contour + bouton IA sur chaque section analysee ──
  function sections() {
    IA.analysees().forEach(function (s) {
      s.el.classList.add('ia-section', 'ia-statut-' + s.statut);
      var b = o.el('<button type="button" class="ia-bouton" data-statut="' + s.statut + '" title="Voir l’analyse IA">' +
        '<span class="ia-point"></span>IA · ' + e(IA.LIBELLES[s.statut].replace('Alerte sur une validation', 'Alerte')) + '</button>');
      var etat = s.el.querySelector('.doc-general-state .doc-state');
      etat.insertBefore(b, etat.firstChild);
      b.addEventListener('click', function () { ouvrir(s); });
      s.bouton = b;
    });
    IA.on('decision', majBoutons);
  }

  function majBoutons() {
    IA.analysees().forEach(function (s) {
      var p = IA.progressionSection(s);
      s.el.classList.toggle('ia-decide', p.finie);
      s.bouton.classList.toggle('ia-fait', p.finie);
      s.bouton.innerHTML = '<span class="ia-point"></span>' + (p.finie ? '<i class="fa fa-check"></i> IA · traité'
        : 'IA · ' + e(IA.LIBELLES[s.statut].replace('Alerte sur une validation', 'Alerte')) + (p.faites ? ' (' + p.faites + '/' + p.total + ')' : ''));
    });
    var barre = document.querySelector('.v1-synthese');
    if (barre) barre.querySelector('.v1-prog').textContent = IA.progression().faites + '/' + IA.progression().total + ' décisions';
  }

  // ── Ligne de synthese au-dessus des documents (verdict du dossier, E2) ──
  function barreSynthese() {
    var d = IA.dossier;
    var n = IA.ui.resumeDossier(d);
    var morceaux = ['a-corriger', 'alerte', 'a-verifier', 'provisoire', 'conforme'].filter(function (k) { return n[k]; })
      .map(function (k) { return o.pastille(k, n[k] + ' ' + IA.LIBELLES[k].toLowerCase().replace('alerte sur une validation', 'alerte')); }).join(' ');
    var barre = o.el('<div class="v1-synthese"><div class="v1-ligne"><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Analyse IA</span>' +
      '<span class="ia-meta">du <b>' + e(d.analyse.date) + '</b></span>' + morceaux + '<span style="flex:1"></span>' +
      '<span class="ia-meta v1-prog"></span>' +
      '<button type="button" class="ia-btn" data-a="synthese"><i class="fa fa-folder-open"></i>Synthèse du dossier</button>' +
      (d.campusFrance && !d.campusFrance.absent ? '<button type="button" class="ia-btn" data-a="campus"><i class="fa fa-comments"></i>Campus France</button>' : '') +
      '</div></div>');
    var cible = IA.blocDocuments();
    cible.parentNode.insertBefore(barre, cible);
    barre.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'synthese') ouvrirSynthese();
      else ouvrirCampus();
    });
    majBoutons();
  }

  function ouvrirSynthese() {
    var f = IA.ui.fenetre({ titre: 'Synthèse du dossier', classe: 'v1-fenetre v1-petite' });
    f.el.innerHTML = '<div class="v1-tete"><b>Synthèse du dossier — ' + e(IA.dossier.etudiant) + '</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i></button></div><div class="v1-corps-simple"></div>' +
      '<div class="v1-pied"><span class="ia-meta">Les propositions sur les champs sont aussi signalées par un contour violet sur la page.</span>' +
      '<span style="flex:1"></span><button type="button" class="ia-btn ia-btn-ok" data-tout><i class="fa fa-check-square-o"></i>Tout accepter dans le dossier</button></div>';
    var corps = f.el.querySelector('.v1-corps-simple');
    corps.appendChild(IA.ui.syntheseDossier());
    var liste = o.el('<div class="ia-bloc"><h6><i class="fa fa-list"></i>Sections analysées</h6></div>');
    IA.analysees().forEach(function (s) {
      var p = IA.progressionSection(s);
      var l = o.el('<div class="v1-ligne-sec">' + o.pastille(s.statut) + '<span style="flex:1"><b>' + e(s.titre) + '</b> — ' + e(s.resume) +
        '</span><span class="ia-meta">' + p.faites + '/' + p.total + '</span><button type="button" class="ia-mini">Ouvrir</button></div>');
      l.querySelector('button').addEventListener('click', function () { f.fermer(); ouvrir(s); });
      liste.appendChild(l);
    });
    corps.appendChild(liste);
    var champs = o.el('<div class="ia-bloc"><h6><i class="fa fa-pencil-square-o"></i>Champs du dossier</h6></div>');
    IA.dossier.champs.forEach(function (c) {
      champs.appendChild(o.el('<div class="ia-meta" style="margin-top:6px;font-weight:700;color:#2b3a42">' + e(c.libelle) + '</div>'));
      champs.appendChild(IA.ui.propositionChamp(c));
    });
    corps.appendChild(champs);
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    f.el.querySelector('[data-tout]').addEventListener('click', function () {
      var n = IA.ui.toutAccepter(IA.analysees());
      corps.querySelectorAll('.ia-prop [data-action="accepter"], .ia-prop [data-a="ok"]').forEach(function (b) { b.click(); n++; });
      o.toast(n + ' proposition(s) acceptée(s) et écrite(s) dans Feel Français. Les points « à vérifier » restent à trancher.');
    });
  }

  function ouvrirCampus() {
    var f = IA.ui.fenetre({ titre: 'Campus France', classe: 'v1-fenetre v1-petite' });
    f.el.innerHTML = '<div class="v1-tete"><b>Questions Campus France</b><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-fermer><i class="fa fa-times"></i></button></div><div class="v1-corps-simple"></div>';
    f.el.querySelector('.v1-corps-simple').appendChild(IA.ui.campusFrance());
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
  }

  // ── La fenetre d'analyse d'une section ──
  function ouvrir(s) {
    var liste = IA.analysees();
    var rang = liste.indexOf(s);
    liste.forEach(function (x) { x.el.classList.toggle('ia-focus', x === s); });
    var f = IA.ui.fenetre({ titre: 'Analyse IA — ' + s.titre, classe: 'v1-fenetre',
      surFermeture: function () { s.el.classList.remove('ia-focus'); } });
    f.el.__fermer = f.fermer;
    f.el.innerHTML = '<div class="v1-tete">' +
      '<button type="button" class="ia-btn" data-nav="-1" title="Section précédente"' + (rang ? '' : ' disabled') + '><i class="fa fa-chevron-left"></i></button>' +
      '<div class="v1-titre"></div>' +
      '<button type="button" class="ia-btn" data-nav="1" title="Section suivante"' + (rang < liste.length - 1 ? '' : ' disabled') + '><i class="fa fa-chevron-right"></i></button>' +
      '<button type="button" class="ia-btn" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button></div>' +
      '<div class="v1-corps"><div class="v1-gauche"></div><div class="v1-droite"></div></div>' +
      '<div class="v1-pied"><span class="ia-meta v1-reste"></span><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn ia-btn-ok v1-valider"><i class="fa fa-check"></i>Valider la section</button></div>';
    f.el.querySelector('.v1-titre').appendChild(IA.ui.entete(s));
    var droite = f.el.querySelector('.v1-droite');
    var docs = (s.documents || []).filter(function (d) { return d.el; });

    // Colonne de droite : ce qui demande une action, les constats du document
    // affiche, les preuves, puis les propositions.
    var actions = IA.ui.blocsSection(s);
    var zoneConstats = o.el('<div class="ia-bloc v1-constats"><h6><i class="fa fa-search"></i>Constats sur le document affiché</h6><div class="v1-reperes"></div><div class="v1-liste"></div></div>');
    droite.appendChild(zoneConstats);
    droite.appendChild(actions);
    var props = o.el('<div class="v1-props"><div class="ia-meta v1-props-titre"><b>Verdicts et commentaires proposés</b> — ' +
      'rien n’est écrit dans Feel Français sans votre accord</div></div>');
    props.appendChild(IA.ui.propositionsSection(s));
    droite.appendChild(props);
    droite.appendChild(IA.ui.pourquoi(s));

    var vue = 'admin';
    var courant = docs[0];
    var visionneuse = new IA.Visionneuse(f.el.querySelector('.v1-gauche'), {
      documents: docs, vue: vue,
      surConstat: function (d, k, n) { selection(n); },
      surVue: function (v) { vue = v; dessinerConstats(); },
      surDocument: function (d) { courant = d; dessinerConstats(); montrerPropsDoc(d); }
    });
    function dessinerConstats() {
      if (!courant) return;
      zoneConstats.querySelector('.v1-reperes').innerHTML = IA.ui.reperes(courant);
      var l = zoneConstats.querySelector('.v1-liste');
      l.innerHTML = '';
      l.appendChild(IA.ui.constats(courant, vue, function (n) { visionneuse.activer(n); }));
    }
    function selection(n) {
      var items = zoneConstats.querySelectorAll('.ia-constat');
      Array.prototype.forEach.call(items, function (x, i) { x.classList.toggle('ia-actif', i === n); });
      if (items[n]) items[n].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function montrerPropsDoc(d) {
      props.querySelectorAll('.ia-props-doc').forEach(function (x) { x.classList.toggle('v1-doc-courant', x.getAttribute('data-doc') === d.nom); });
    }
    dessinerConstats();
    if (courant) montrerPropsDoc(courant);

    function reste() {
      var p = IA.progressionSection(s);
      f.el.querySelector('.v1-reste').innerHTML = p.finie ? '<span class="ia-ok"><i class="fa fa-check"></i> Section traitée</span>'
        : (p.total - p.faites) + ' décision(s) en attente dans cette section';
    }
    IA.on('decision', function () { if (document.body.contains(f.el)) reste(); });
    reste();

    f.el.querySelector('.v1-valider').addEventListener('click', function () {
      IA.ui.toutAccepter([s]);
      var p = IA.progressionSection(s);
      if (!p.finie) {
        o.toast('Il reste ' + (p.total - p.faites) + ' point(s) que l’IA ne tranche pas : choisissez valid ou invalid.');
        var rest = f.el.querySelector('.ia-prop:not(.ia-accepte):not(.ia-modifie):not(.ia-refuse)');
        if (rest) rest.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      o.toast('Section validée : verdicts et commentaires écrits dans Feel Français.');
      var suivante = liste.filter(function (x) { return !IA.progressionSection(x).finie; })[0];
      f.fermer();
      if (suivante) setTimeout(function () { ouvrir(suivante); }, 200);
      else o.defiler(s.el);
    });
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    f.el.addEventListener('click', function (ev) {
      var n = ev.target.closest('[data-nav]');
      if (!n || n.disabled) return;
      var cible = liste[rang + (+n.getAttribute('data-nav'))];
      f.fermer();
      if (cible) ouvrir(cible);
    });
  }
})();
