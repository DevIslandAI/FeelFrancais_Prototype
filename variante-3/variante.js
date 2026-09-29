/*
 * Variante 3 — « Dans la section »
 *
 * Aucune fenetre : chaque proposition est posee exactement la ou elle sera
 * ecrite dans Feel Francais (principe de contiguite, contre l'attention
 * partagee) :
 *   - sous l'entete de la section : le verdict propose et le resume ;
 *   - juste au-dessus de LEUR carte « Commentaire general » : le commentaire general propose ;
 *   - juste au-dessus des commentaires de chaque piece : son verdict et son commentaire ;
 *   - sous chaque champ (statut, texte, dates) : la valeur proposee.
 * Le PDF surligne et le detail se deplient dans la section (« Voir l'analyse »).
 * Une barre fine en haut permet d'aller a la section suivante a traiter.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;

  IA.on('pret', function () {
    if (!IA.dossier) return notifications();
    IA.analysees().forEach(installer);
    champs();
    navigation();
    campus();
  });

  function notifications() {
    IA.ui.notifications(function (tr, cellule, info) {
      var html;
      if (info.dossier) {
        var n = info.compte;
        html = ['alerte', 'a-corriger', 'a-verifier', 'provisoire', 'conforme'].filter(function (k) { return n[k]; }).map(function (k) {
          return '<span class="v3-compte ia-p-' + k + '" title="' + e(IA.LIBELLES[k]) + '"><i class="fa ' + IA.ICONES[k] + '"></i>' + n[k] + '</span>';
        }).join('');
      } else {
        html = '<span class="v3-compte ia-p-' + info.figurant[0] + '" title="' + e(IA.LIBELLES[info.figurant[0]]) + '"><i class="fa ' +
          IA.ICONES[info.figurant[0]] + '"></i>1</span>';
      }
      cellule.appendChild(o.el('<div class="v3-comptes"><i class="fa fa-magic" style="color:var(--ia)"></i>' + html + '</div>'));
    });
  }

  function installer(s) {
    s.el.classList.add('ia-section', 'ia-statut-' + s.statut);
    var conteneur = s.el.querySelector('.doc-container');
    var tete = s.el.querySelector('.doc-general-state');

    // 1. Le bandeau IA, juste sous l'entete de la section
    var bandeau = o.el('<div class="v3-bandeau"><div class="v3-ligne">' +
      '<span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>IA</span>' + o.pastille(s.statut) +
      '<span class="v3-resume">' + e(s.resume) + '</span>' +
      '<span class="ia-meta v3-prog"></span>' +
      '<button type="button" class="ia-btn v3-deplier" aria-expanded="false"><i class="fa fa-file-pdf-o"></i>Voir l’analyse</button></div>' +
      '<div class="v3-actions"></div><div class="v3-detail" hidden></div></div>');
    tete.parentNode.insertBefore(bandeau, tete.nextSibling);
    var actions = bandeau.querySelector('.v3-actions');
    var v = IA.ui.verdictSection(s);
    if (v) actions.appendChild(v);
    [IA.ui.alerte(s), IA.ui.mauvaiseSection(s), IA.ui.provisoire(s)].forEach(function (b) { if (b) actions.appendChild(b); });

    // 2. Commentaires de section : au-dessus de LEUR rangee de commentaires generaux
    var rangee = conteneur.querySelector(':scope > .doc-general-messages-row');
    IA.ui.commentairesSection(s).forEach(function (c) {
      c.classList.add('v3-pose');
      if (rangee) rangee.parentNode.insertBefore(c, rangee); else actions.appendChild(c);
    });

    // 3. Chaque piece : verdict et commentaire au-dessus de ses propres commentaires
    var unique = !!IA.ui.pieceUnique(s);
    (s.documents || []).forEach(function (d) {
      if (!d.el) return;
      var bloc = IA.ui.propositionsDocument(d, { sansVerdict: unique || s.statut === 'alerte' });
      if (!bloc.querySelector('.ia-prop')) return;
      bloc.classList.add('v3-pose');
      var cible = d.el.querySelector('.doc-item-comments');
      cible.parentNode.insertBefore(bloc, cible);
    });

    // 4. Le detail (PDF surligne, constats, preuves), deplie a la demande
    var bouton = bandeau.querySelector('.v3-deplier');
    var detail = bandeau.querySelector('.v3-detail');
    var construit = false;
    bouton.addEventListener('click', function () {
      var ouvrir = detail.hidden;
      detail.hidden = !ouvrir;
      bouton.setAttribute('aria-expanded', ouvrir);
      bouton.innerHTML = ouvrir ? '<i class="fa fa-chevron-up"></i>Replier' : '<i class="fa fa-file-pdf-o"></i>Voir l’analyse';
      if (ouvrir && !construit) { construit = true; detailSection(s, detail); }
    });
    s.bandeau = bandeau;
    function maj() {
      var p = IA.progressionSection(s);
      bandeau.querySelector('.v3-prog').textContent = p.faites + '/' + p.total + ' décisions';
      s.el.classList.toggle('ia-decide', p.finie);
      bandeau.classList.toggle('v3-fini', p.finie);
    }
    IA.on('decision', maj);
    maj();
  }

  function detailSection(s, zone) {
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var grille = o.el('<div class="v3-grille"><div class="v3-pdf"></div><div class="v3-infos"><div class="v3-constats"></div></div></div>');
    zone.appendChild(grille);
    var vue = 'admin';
    var courant = docs[0];
    var liste = grille.querySelector('.v3-constats');
    var visionneuse;
    function dessiner(actif) {
      liste.innerHTML = IA.ui.reperes(courant);
      var l = IA.ui.constats(courant, vue, function (n) { visionneuse.activer(n); });
      if (actif != null && l.children[actif]) l.children[actif].classList.add('ia-actif');
      liste.appendChild(l);
    }
    visionneuse = new IA.Visionneuse(grille.querySelector('.v3-pdf'), {
      documents: docs,
      surConstat: function (d, k, n) { dessiner(n); },
      surVue: function (x) { vue = x; dessiner(); },
      surDocument: function (d) { courant = d; dessiner(); }
    });
    var infos = grille.querySelector('.v3-infos');
    [IA.ui.ressources(s), IA.ui.piecesLiees(s), IA.ui.versions(s), IA.ui.croisements(s)].forEach(function (b) { if (b) infos.appendChild(b); });
    infos.appendChild(IA.ui.pourquoi(s));
  }

  // Sous chaque champ : la valeur proposee, directement.
  function champs() {
    IA.ui.champs({
      surVoir: function (c) {
        var boite = document.querySelector('.v3-champ[data-champ="' + c.cle + '"]');
        if (boite) { boite.hidden = !boite.hidden; if (!boite.hidden) o.defiler(boite); }
      }
    });
    IA.dossier.champs.forEach(function (c) {
      var champ = document.querySelector(c.selecteur);
      if (!champ) return;
      var boite = o.el('<div class="v3-champ" data-champ="' + e(c.cle) + '"></div>');
      boite.appendChild(IA.ui.propositionChamp(c));
      var apres = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2') ? champ.nextElementSibling : champ;
      apres.parentNode.insertBefore(boite, apres.nextSibling);
    });
  }

  // Barre fine : ou en est-on, et aller a la prochaine section a traiter.
  function navigation() {
    var barre = o.el('<div class="v3-nav"><span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>IA</span>' +
      '<span class="v3-nav-texte"></span><span style="flex:1"></span>' +
      '<button type="button" class="ia-btn" data-a="synthese"><i class="fa fa-folder-open"></i>Synthèse</button>' +
      '<button type="button" class="ia-btn ia-btn-ia" data-a="suivante">Section suivante à traiter <i class="fa fa-arrow-down"></i></button></div>');
    var cible = IA.blocDocuments();
    cible.parentNode.insertBefore(barre, cible);
    var synthese = IA.ui.syntheseDossier();
    synthese.hidden = true;
    barre.parentNode.insertBefore(synthese, barre.nextSibling);
    function maj() {
      var restantes = IA.analysees().filter(function (s) { return !IA.progressionSection(s).finie; });
      var p = IA.progression();
      barre.querySelector('.v3-nav-texte').innerHTML = '<b>' + restantes.length + '</b> section(s) à traiter · ' + p.faites + '/' + p.total + ' décisions';
      barre.querySelector('[data-a="suivante"]').disabled = !restantes.length;
    }
    barre.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'synthese') { synthese.hidden = !synthese.hidden; return; }
      var prochaine = IA.analysees().filter(function (s) { return !IA.progressionSection(s).finie; })[0];
      if (prochaine) {
        o.defiler(prochaine.bandeau);
        prochaine.el.classList.add('ia-focus');
        setTimeout(function () { prochaine.el.classList.remove('ia-focus'); }, 1600);
      }
    });
    IA.on('decision', maj);
    maj();
  }

  function campus() {
    var cf = IA.ui.campusFrance();
    if (!cf) return;
    var d = o.el('<details class="ia-pourquoi v3-campus"><summary>Questions Campus France</summary></details>');
    d.appendChild(cf);
    var nav = document.querySelector('.v3-nav');
    nav.parentNode.insertBefore(d, nav.nextSibling.nextSibling);
  }
})();
