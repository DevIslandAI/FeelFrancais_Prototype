/*
 * Variante 11 — « Section sur la page »  (base : 9 Fenêtre claire)
 *
 * La decision de SECTION se prend sur la page Feel Francais : une pastille
 * « IA » a cote de leur bouton « Commentaire general » ouvre, juste en dessous,
 * le verdict de la section et le commentaire general proposes (+ note generale
 * interne facultative), avec « Valider la section ».
 * La fenetre ne sert qu'a l'analyse des DOCUMENTS :
 *   en haut  un rappel de la section (nom, statut, verdict et commentaire
 *            general, avec un lien pour les modifier sur la page) ;
 *   en bas   a gauche le PDF, a droite l'analyse, le verdict et le commentaire
 *            du document (+ note interne facultative).
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var fen = null;
  var blocs = {};  // alias -> bloc de section pose sur la page

  IA.on('pret', function () {
    if (!IA.dossier) return IA.ui2.notifications();
    IA.analysees().forEach(function (s) {
      IA.ui2.marquer(s, function () { ouvrir(s); });
      poserBloc(s);
    });
    IA.ui3.champs();
    IA.ui2.ligne([
      { html: '<i class="fa fa-link"></i> Incohérences', action: function () { ouvrir('incoherences'); } },
      { html: 'Ouvrir l’analyse des documents', principal: true, action: function () { ouvrir(premiere()); } }
    ]);
  });

  function premiere() {
    return IA.ui2.ordre().filter(function (s) { return !IA.progressionSection(s).finie; })[0] || 'dossier';
  }

  function sectionValidee(s) {
    return IA.propositionsSection(s).filter(function (p) { return /^(sec:|alerte:)/.test(p.cle); })
      .every(function (p) { return IA.decision(p.cle); });
  }

  // ── Le bloc SECTION sur la page, sous leur rangee « Commentaire general » ──
  function poserBloc(s) {
    var conteneur = s.el.querySelector('.doc-container');
    var rangee = conteneur.querySelector(':scope > .doc-general-messages-row');
    var parts = IA.ui3.separerAlerte(s);
    var d = IA.ui3.decisionSection(s, parts.alerte);
    var bloc = o.el('<div class="ia3-page" hidden><div class="ia3-page-titre"><i class="fa fa-magic"></i> Proposition IA — section</div></div>');
    bloc.appendChild(d.el);
    var actions = o.el('<div class="ia3-page-actions"><button type="button" class="ia2-btn ia2-ok" data-a="valider"><i class="fa fa-check"></i> Valider la section</button>' +
      '<button type="button" class="ia2-btn" data-a="docs">Analyse des documents <i class="fa fa-external-link"></i></button>' +
      '<span class="ia3-muet ia3-page-etat"></span></div>');
    bloc.appendChild(actions);
    if (rangee) rangee.parentNode.insertBefore(bloc, rangee.nextSibling);
    else conteneur.querySelector('.doc-general-state').insertAdjacentElement('afterend', bloc);

    // La pastille « IA », a cote de leurs boutons de commentaire general
    var puce = o.el('<button type="button" class="ia2-puce" aria-expanded="false" title="Verdict et commentaire général proposés"><span class="ia2-point"></span>IA</button>');
    var rangBoutons = rangee && rangee.querySelector('.doc-note-add-row');
    if (rangBoutons) rangBoutons.appendChild(puce);
    else bloc.parentNode.insertBefore(puce, bloc);
    puce.addEventListener('click', function (ev) { ev.preventDefault(); basculer(!bloc.hidden ? false : true); });
    function basculer(ouvrirBloc) {
      bloc.hidden = !ouvrirBloc;
      puce.setAttribute('aria-expanded', ouvrirBloc);
      if (ouvrirBloc) bloc.querySelectorAll('textarea').forEach(function (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 240) + 'px'; });
    }
    function etat() {
      var ok = sectionValidee(s);
      bloc.querySelector('.ia3-page-etat').innerHTML = ok ? '<span class="ia2-vert"><i class="fa fa-check"></i> Section validée</span>' : '';
      puce.classList.toggle('ia2-puce-fini', ok);
    }
    actions.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'docs') return ouvrir(s);
      var r = IA.ui3.validerSection(s, d.comps);
      if (!r.ok) return o.toast('Choisissez d’abord ' + r.manque.join(' et ') + '.');
      if (!sectionValidee(s)) return o.toast('Arbitrez aussi l’alerte.');
      etat();
      o.toast('Section validée : verdict et commentaire général écrits dans Feel Français.');
    });
    IA.on('decision', etat);
    etat();
    blocs[s.alias] = { bloc: bloc, comps: d.comps, basculer: basculer, aSavoir: parts.aSavoir };
  }

  function ouvrir(cible) {
    if (!fen) {
      var f = IA.ui.fenetre({ titre: 'Analyse des documents', classe: 'v11-fen', surFermeture: function () {
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        fen = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<nav class="v11-nav" aria-label="Sections"></nav><div class="v11-principal">' +
        '<button type="button" class="ia2-btn ia2-non v11-fermer" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button>' +
        '<div class="v11-corps"></div><footer class="v11-pied"></footer></div>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      fen = { f: f, courant: null };
      IA.on('decision', function () { if (fen) nav(); });
    }
    afficher(cible);
  }

  function nav() {
    var n = fen.f.el.querySelector('.v11-nav');
    n.innerHTML = '';
    var inc = IA.ui2.nombreIncoherences();
    [['dossier', '<i class="fa fa-folder-open-o"></i> Dossier', ''],
     ['incoherences', '<i class="fa fa-link"></i> Incohérences', inc ? '<span class="ia2-compte">' + inc + '</span>' : '']].forEach(function (x) {
      var b = o.el('<button type="button" class="v11-item' + (fen.courant === x[0] ? ' v11-actif' : '') + '">' + x[1] + '<span class="ia2-sep"></span>' + x[2] + '</button>');
      b.addEventListener('click', function () { afficher(x[0]); });
      n.appendChild(b);
    });
    n.appendChild(o.el('<div class="v11-nav-titre">Sections</div>'));
    IA.ui2.ordre().forEach(function (s) {
      var fini = IA.progressionSection(s).finie;
      var b = o.el('<button type="button" class="v11-item ia2-t-' + s.statut + (fen.courant === s ? ' v11-actif' : '') + (fini ? ' v11-fini' : '') + '">' +
        (fini ? '<i class="fa fa-check ia2-vert"></i>' : '<span class="ia2-point"></span>') + '<span class="v11-nom">' + e(IA.ui2.nom(s)) + '</span></button>');
      b.addEventListener('click', function () { afficher(s); });
      n.appendChild(b);
    });
  }

  // Rappel de la decision de section (prise sur la page) en haut de la fenetre.
  function rappel(s) {
    return function () {
      var b = blocs[s.alias];
      var el = o.el('<div class="ia3-rappel"></div>');
      function dessiner() {
        var ok = sectionValidee(s);
        var v = b.comps.verdict ? b.comps.verdict.valeur() : null;
        var com = b.bloc.querySelector('.ia3-com textarea').value;
        el.innerHTML = '<span><b>Verdict de la section :</b> ' + (s.statut === 'alerte' ? 'alerte à arbitrer' :
          (v ? '<span class="ia2-v ia2-v-' + v + '">' + (v === 'valide' ? 'valid' : 'invalid') + '</span>' : '<span class="ia2-v ia2-v-doute">à décider</span>')) + '</span>' +
          '<span class="ia3-rappel-com" title="' + e(com) + '"><b>Commentaire général :</b> ' + (com ? '« ' + e(com) + ' »' : '<span class="ia3-muet">aucun</span>') + '</span>' +
          (ok ? '<span class="ia2-vert"><i class="fa fa-check"></i> validée sur la page</span>' : '<span class="ia3-muet">à valider sur la page</span>') +
          '<button type="button" class="ia2-btn" data-page>Modifier sur la page</button>';
        el.querySelector('[data-page]').addEventListener('click', function () {
          fen.f.fermer();
          b.basculer(true);
          o.defiler(b.bloc);
        });
      }
      dessiner();
      return el;
    };
  }

  function afficher(cible) {
    fen.courant = cible;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    nav();
    var corps = fen.f.el.querySelector('.v11-corps');
    var pied = fen.f.el.querySelector('.v11-pied');
    corps.innerHTML = '';
    corps.className = 'v11-corps';
    pied.innerHTML = '';
    pied.onclick = null;
    if (cible === 'dossier' || cible === 'incoherences') {
      corps.classList.add('v11-simple');
      corps.appendChild(o.el('<h3 class="v11-h">' + (cible === 'dossier' ? 'Dossier — ' + e(IA.dossier.etudiant) : 'Incohérences entre documents') + '</h3>'));
      corps.appendChild(cible === 'dossier' ? IA.ui3.dossier() : IA.ui2.incoherencesDossier(function (s) { afficher(s); }));
      return;
    }
    var s = cible;
    var haut = IA.ui3.bandeau(s, { rappel: rappel(s) });
    var cadre = IA.ui3.documents(s, { notes: true, apres: blocs[s.alias].aSavoir });
    var zoneHaut = o.el('<div class="v11-haut"></div>');
    zoneHaut.appendChild(haut.el);
    var zoneBas = o.el('<div class="v11-bas"></div>');
    zoneBas.appendChild(cadre.el);
    corps.appendChild(zoneHaut);
    corps.appendChild(zoneBas);
    var suivante = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
    pied.innerHTML = '<span class="v11-etat ia3-muet"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="suivante">' + (suivante ? 'Passer <i class="fa fa-chevron-right"></i>' : 'Dossier') + '</button>' +
      '<button type="button" class="ia2-btn ia2-ok v11-valider" data-a="valider" title="Écrit le verdict, le commentaire et la note de chaque document dans Feel Français">' +
      '<i class="fa fa-check"></i> Valider les documents</button>';
    function etat() {
      var docsOk = IA.propositionsSection(s).filter(function (p) { return p.cle.indexOf('doc:') === 0 || p.type === 'deplacement'; })
        .every(function (p) { return IA.decision(p.cle); });
      pied.querySelector('.v11-etat').innerHTML = [docsOk ? '<span class="ia2-vert"><i class="fa fa-check"></i> Documents validés</span>' : '',
        !sectionValidee(s) ? 'La section reste à valider sur la page' : ''].filter(Boolean).join(' · ');
    }
    etat();
    pied.onclick = function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'suivante') return afficher(suivante || 'dossier');
      var r = IA.ui3.validerDocuments(s, cadre);
      if (!r.ok) { o.toast('Choisissez d’abord ' + r.manque.join(' et ') + '.'); return; }
      etat();
      var reste = IA.ui3.reste(s).filter(function (p) { return p.type === 'deplacement'; });
      if (reste.length) { o.toast('Documents envoyés. Reste à arbitrer : le déplacement.'); return; }
      o.toast('Documents validés : verdicts et commentaires écrits dans Feel Français.' + (sectionValidee(s) ? '' : ' La section reste à valider sur la page.'));
      var prochaine = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
      if (sectionValidee(s)) setTimeout(function () { afficher(prochaine || 'dossier'); }, 350);
    };
  }
})();
