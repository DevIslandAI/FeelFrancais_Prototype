/*
 * Variante 12 — « Section en haut »  (base : 9 Fenêtre claire)
 *
 * Dans la fenetre :
 *   EN HAUT     la SECTION traitee, bien visible : son nom, son statut, son
 *               verdict et son commentaire general (+ note generale interne
 *               facultative), puis ses incoherences ;
 *   EN BAS      a gauche le PDF, a droite l'analyse du document, son verdict,
 *               son commentaire (+ note interne facultative) ; un onglet par document.
 * Un seul bouton : « Valider la section » ecrit toutes les cases dans Feel Francais.
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
      var f = IA.ui.fenetre({ titre: 'Analyse IA', classe: 'v12-fen', surFermeture: function () {
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        fen = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<nav class="v12-nav" aria-label="Sections"></nav><div class="v12-principal">' +
        '<button type="button" class="ia2-btn ia2-non v12-fermer" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button>' +
        '<div class="v12-corps"></div><footer class="v12-pied"></footer></div>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      fen = { f: f, courant: null };
      IA.on('decision', function () { if (fen) nav(); });
    }
    afficher(cible);
  }

  function nav() {
    var n = fen.f.el.querySelector('.v12-nav');
    n.innerHTML = '';
    var inc = IA.ui2.nombreIncoherences();
    [['dossier', '<i class="fa fa-folder-open-o"></i> Dossier', ''],
     ['incoherences', '<i class="fa fa-link"></i> Incohérences', inc ? '<span class="ia2-compte">' + inc + '</span>' : '']].forEach(function (x) {
      var b = o.el('<button type="button" class="v12-item' + (fen.courant === x[0] ? ' v12-actif' : '') + '">' + x[1] + '<span class="ia2-sep"></span>' + x[2] + '</button>');
      b.addEventListener('click', function () { afficher(x[0]); });
      n.appendChild(b);
    });
    n.appendChild(o.el('<div class="v12-nav-titre">Sections</div>'));
    IA.ui2.ordre().forEach(function (s) {
      var fini = IA.progressionSection(s).finie;
      var b = o.el('<button type="button" class="v12-item ia2-t-' + s.statut + (fen.courant === s ? ' v12-actif' : '') + (fini ? ' v12-fini' : '') + '">' +
        (fini ? '<i class="fa fa-check ia2-vert"></i>' : '<span class="ia2-point"></span>') + '<span class="v12-nom">' + e(IA.ui2.nom(s)) + '</span></button>');
      b.addEventListener('click', function () { afficher(s); });
      n.appendChild(b);
    });
  }

  function afficher(cible) {
    fen.courant = cible;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    nav();
    var corps = fen.f.el.querySelector('.v12-corps');
    var pied = fen.f.el.querySelector('.v12-pied');
    corps.innerHTML = '';
    corps.className = 'v12-corps';
    pied.innerHTML = '';
    pied.onclick = null;
    if (cible === 'dossier' || cible === 'incoherences') {
      corps.classList.add('v12-simple');
      corps.appendChild(o.el('<h3 class="v12-h">' + (cible === 'dossier' ? 'Dossier — ' + e(IA.dossier.etudiant) : 'Incohérences entre documents') + '</h3>'));
      corps.appendChild(cible === 'dossier' ? IA.ui3.dossier() : IA.ui2.incoherencesDossier(function (s) { afficher(s); }));
      return;
    }
    var s = cible;
    var haut = IA.ui3.bandeau(s, { decision: true });
    var cadre = IA.ui3.documents(s, { notes: true, apres: haut.aSavoir });
    var zoneHaut = o.el('<div class="v12-haut"></div>');
    zoneHaut.appendChild(haut.el);
    var zoneBas = o.el('<div class="v12-bas"></div>');
    zoneBas.appendChild(cadre.el);
    corps.appendChild(zoneHaut);
    corps.appendChild(zoneBas);
    var suivante = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
    pied.innerHTML = '<span class="v12-etat ia3-muet"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="suivante">' + (suivante ? 'Passer <i class="fa fa-chevron-right"></i>' : 'Dossier') + '</button>' +
      '<button type="button" class="ia2-btn ia2-ok v12-valider" data-a="valider" title="Écrit toutes les cases dans Feel Français : verdicts, commentaires, notes">' +
      '<i class="fa fa-check"></i> Valider la section</button>';
    function etat() {
      var reste = IA.ui3.reste(s);
      pied.querySelector('.v12-etat').innerHTML = IA.progressionSection(s).finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Section validée</span>' :
        (reste.length && reste.length < IA.propositionsSection(s).length ? 'Reste à arbitrer : ' + reste.map(function (x) {
          return { alerte: 'l’alerte', deplacement: 'le déplacement' }[x.type] || 'un point'; }).join(', ') : '');
    }
    etat();
    // Le pied est reutilise d'une section a l'autre : un seul gestionnaire (onclick).
    pied.onclick = function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'suivante') return afficher(suivante || 'dossier');
      var r = IA.ui3.valider(s, haut, cadre);
      if (!r.ok) { o.toast('Choisissez d’abord ' + r.manque.join(' et ') + '.'); return; }
      etat();
      if (r.reste.length) { o.toast('Section envoyée. Reste à arbitrer : ' + r.reste.map(function (x) { return x.type === 'alerte' ? 'l’alerte' : 'le déplacement'; }).join(', ') + '.'); return; }
      o.toast('Section validée : toutes les cases sont écrites dans Feel Français.');
      var prochaine = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
      setTimeout(function () { afficher(prochaine || 'dossier'); }, 350);
    };
  }
})();
