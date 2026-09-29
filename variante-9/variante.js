/*
 * Variante 9 — « Fenêtre claire »  (base : 6 Fenêtre épurée, analyse refaite)
 *
 * Fenetre en trois zones :
 *   a gauche  le sommaire (Dossier, Incoherences, sections par priorite) ;
 *   au centre le cadre DOCUMENT : le PDF surligne et, attachee a lui,
 *             l'analyse de ce document (points numerotes, verdict, commentaire) ;
 *   a droite  la colonne SECTION : verdict + commentaire general juste sous le
 *             titre, puis incoherences et points a savoir.
 * Un seul bouton pour envoyer : « Valider la section ».
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
    IA.ui3.champs();
    IA.ui2.ligne([
      { html: '<i class="fa fa-link"></i> Incohérences', action: function () { ouvrir('incoherences'); } },
      { html: 'Ouvrir l’analyse', principal: true, action: function () { ouvrir(premiere()); } }
    ]);
  });

  function premiere() {
    return IA.ui2.ordre().filter(function (s) { return !IA.progressionSection(s).finie; })[0] || 'dossier';
  }

  function ouvrir(cible) {
    if (!fen) {
      var f = IA.ui.fenetre({ titre: 'Analyse IA', classe: 'v9-fen', surFermeture: function () {
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        fen = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<nav class="v9-nav" aria-label="Sections"></nav><div class="v9-principal">' +
        '<button type="button" class="ia2-btn ia2-non v9-fermer" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button>' +
        '<div class="v9-corps"></div><footer class="v9-pied"></footer></div>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      fen = { f: f, courant: null };
      IA.on('decision', function () { if (fen) nav(); });
    }
    afficher(cible);
  }

  function nav() {
    var n = fen.f.el.querySelector('.v9-nav');
    n.innerHTML = '';
    var inc = IA.ui2.nombreIncoherences();
    [['dossier', '<i class="fa fa-folder-open-o"></i> Dossier', ''],
     ['incoherences', '<i class="fa fa-link"></i> Incohérences', inc ? '<span class="ia2-compte">' + inc + '</span>' : '']].forEach(function (x) {
      var b = o.el('<button type="button" class="v9-item' + (fen.courant === x[0] ? ' v9-actif' : '') + '">' + x[1] + '<span class="ia2-sep"></span>' + x[2] + '</button>');
      b.addEventListener('click', function () { afficher(x[0]); });
      n.appendChild(b);
    });
    n.appendChild(o.el('<div class="v9-nav-titre">Sections</div>'));
    IA.ui2.ordre().forEach(function (s) {
      var fini = IA.progressionSection(s).finie;
      var b = o.el('<button type="button" class="v9-item ia2-t-' + s.statut + (fen.courant === s ? ' v9-actif' : '') + (fini ? ' v9-fini' : '') + '">' +
        (fini ? '<i class="fa fa-check ia2-vert"></i>' : '<span class="ia2-point"></span>') + '<span class="v9-nom">' + e(IA.ui2.nom(s)) + '</span></button>');
      b.addEventListener('click', function () { afficher(s); });
      n.appendChild(b);
    });
  }

  function afficher(cible) {
    fen.courant = cible;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    nav();
    var corps = fen.f.el.querySelector('.v9-corps');
    var pied = fen.f.el.querySelector('.v9-pied');
    corps.innerHTML = '';
    corps.className = 'v9-corps';
    pied.innerHTML = '';
    pied.onclick = null;
    if (cible === 'dossier' || cible === 'incoherences') {
      corps.classList.add('v9-simple');
      if (cible === 'dossier') {
        corps.appendChild(o.el('<h3 class="v9-h">Dossier — ' + e(IA.dossier.etudiant) + '</h3>'));
        corps.appendChild(IA.ui3.dossier());
      } else {
        corps.appendChild(o.el('<h3 class="v9-h">Incohérences entre documents</h3>'));
        corps.appendChild(IA.ui2.incoherencesDossier(function (s) { afficher(s); }));
      }
      return;
    }
    var s = cible;
    var cadre = IA.ui3.documents(s);
    var colonne = IA.ui3.section(s);
    var zoneDoc = o.el('<div class="v9-docs"></div>');
    zoneDoc.appendChild(cadre.el);
    var zoneSec = o.el('<div class="v9-section"></div>');
    zoneSec.appendChild(colonne.el);
    corps.appendChild(zoneDoc);
    corps.appendChild(zoneSec);
    var suivante = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
    pied.innerHTML = '<span class="v9-etat ia3-muet"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="suivante">' + (suivante ? 'Passer <i class="fa fa-chevron-right"></i>' : 'Dossier') + '</button>' +
      '<button type="button" class="ia2-btn ia2-ok v9-valider" data-a="valider" title="Écrit les verdicts et les commentaires dans Feel Français : l’étudiant les verra">' +
      '<i class="fa fa-check"></i> Valider la section</button>';
    function etat() {
      var p = IA.progressionSection(s);
      pied.querySelector('.v9-etat').innerHTML = p.finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Section validée</span>' :
        (p.faites ? 'Il reste à arbitrer : ' + IA.propositionsSection(s).filter(function (x) { return !IA.decision(x.cle); })
          .map(function (x) { return { alerte: 'l’alerte', deplacement: 'le déplacement' }[x.type] || 'un point'; }).join(', ') : '');
    }
    etat();
    // onclick (et non addEventListener) : le pied est reutilise d'une section a
    // l'autre, un seul gestionnaire doit y etre attache.
    pied.onclick = function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'suivante') return afficher(suivante || 'dossier');
      var r = IA.ui3.valider(s, colonne, cadre);
      if (!r.ok) { o.toast('Choisissez d’abord ' + r.manque.join(' et ') + '.'); return; }
      etat();
      if (r.reste.length) { o.toast('Section envoyée. Il reste à arbitrer : ' + r.reste.map(function (x) { return x.type === 'alerte' ? 'l’alerte' : 'le déplacement'; }).join(', ') + '.'); return; }
      o.toast('Section validée : verdicts et commentaires écrits dans Feel Français.');
      var prochaine = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
      setTimeout(function () { afficher(prochaine || 'dossier'); }, 350);
    };
  }
})();
