/*
 * Couche IA — composants d'interface partages par les 5 variantes.
 *
 * Chaque variante choisit OU et QUAND afficher ces composants ; leur contenu et
 * leur comportement restent identiques, pour que la comparaison des variantes
 * porte sur la presentation et non sur les fonctionnalites.
 *
 * Principes (charge cognitive) :
 *  - une proposition = ce qui sera ecrit, ou, et trois gestes : Accepter,
 *    Modifier (on edite le texte puis on valide sa version), Refuser ;
 *  - le « pourquoi » (regles, croisements, historique) est replie par defaut ;
 *  - un constat et son surlignage portent le meme numero et la meme couleur ;
 *  - rien n'est ecrit dans Feel Francais sans un geste explicite de Perle.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var ui = {};

  // ── Fenetre generique (les variantes y mettent ce qu'elles veulent) ──
  ui.fenetre = function (options) {
    var voile = o.el('<div class="ia-voile"></div>');
    var f = o.el('<div class="ia-fenetre ' + (options.classe || '') + '" role="dialog" aria-modal="true" aria-label="' +
      e(options.titre || '') + '"></div>');
    document.body.appendChild(voile);
    document.body.appendChild(f);
    var precedent = document.activeElement;
    function fermer() {
      voile.remove();
      f.remove();
      document.removeEventListener('keydown', clavier, true);
      if (options.surFermeture) options.surFermeture();
      if (precedent && precedent.focus) precedent.focus();
    }
    function clavier(ev) {
      if (ev.key === 'Escape' && !ev.target.closest('textarea')) { ev.stopPropagation(); fermer(); }
    }
    document.addEventListener('keydown', clavier, true);
    voile.addEventListener('click', function () { if (!options.bloquante) fermer(); });
    return { el: f, voile: voile, fermer: fermer };
  };

  // ── En-tete d'une section : statut, resume, confiance ──
  ui.entete = function (s) {
    var prog = IA.progressionSection(s);
    return o.el('<div class="ia-entete">' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<span class="ia-pastille ia-p-ia"><i class="fa fa-magic"></i>Proposition IA</span>' + o.pastille(s.statut) +
      (s.confiance ? '<span class="ia-meta">Confiance <b>' + e(s.confiance) + '</b></span>' : '') +
      '<span class="ia-sep" style="flex:1"></span>' +
      '<span class="ia-meta ia-prog-section">' + prog.faites + '/' + prog.total + ' décisions</span></div>' +
      '<div style="margin-top:6px;font-size:14px;line-height:1.45"><b>' + e(s.titre) + '</b> — ' + e(s.resume || '') + '</div>' +
      '</div>');
  };

  // Reperes Feel Francais d'un document (D9) : numero, vrai nom, sous-type, etape.
  ui.reperes = function (d) {
    return '<div class="ia-reperes"><span>Doc <b>n° ' + e(d.id || '—') + '</b></span>' +
      '<span title="' + e(d.nom) + '">Fichier <b>' + e(d.nom) + '</b></span>' +
      '<span>Sous-type <b>' + e(d.sousType || '—') + '</b></span>' +
      '<span>Étape <b>' + e(d.section && d.section.groupe || '—') + '</b></span></div>';
  };

  // ── Liste des constats, numerotee comme les surlignages ──
  ui.constats = function (d, vue, surClic) {
    var visibles = IA.constatsVisibles(d, vue);
    var ol = o.el('<ol class="ia-constats"></ol>');
    if (!visibles.length) {
      ol.appendChild(o.el('<li class="ia-meta" style="padding:6px 8px">' +
        (vue === 'etudiant' ? 'Rien à signaler à l’étudiant pour cette pièce.' : 'Aucun constat.') + '</li>'));
    }
    visibles.forEach(function (k, n) {
      var t = o.typeConstat(k);
      var cle = 'constat:' + d.nom + ':' + n;
      var li = o.el('<li class="ia-constat ia-t-' + t + '" tabindex="0">' +
        '<span class="ia-num">' + (n + 1) + '</span>' +
        '<div><div class="ia-type">' + e(o.libelleType(k)) + '</div>' +
        e(vue === 'etudiant' ? k.etudiant : k.texte) + '</div>' +
        '<div style="text-align:right"><div class="ia-lieu">p. ' + (k.page || 1) + '</div></div></li>');
      if (vue !== 'etudiant') li.lastElementChild.appendChild(ui.signaler(cle));
      li.addEventListener('click', function (ev) {
        if (ev.target.closest('.ia-signaler, .ia-signalement')) return;
        Array.prototype.forEach.call(ol.children, function (x) { x.classList.toggle('ia-actif', x === li); });
        if (surClic) surClic(n, k);
      });
      li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') li.click(); });
      ol.appendChild(li);
    });
    return ol;
  };

  // ── « Signaler une erreur de l'IA » (I4 : Perle corrige l'IA) ──
  ui.signaler = function (cle) {
    var zone = o.el('<span class="ia-signalement"></span>');
    function dessiner() {
      var s = IA.signalement(cle);
      zone.innerHTML = s ? '<span class="ia-signale"><i class="fa fa-flag"></i> Signalé : ' + e(s.motif) + '</span>'
        : '<button type="button" class="ia-signaler" title="Signaler une erreur de l’IA">Signaler une erreur</button>';
      var b = zone.querySelector('button');
      if (b) b.addEventListener('click', ouvrir);
    }
    function ouvrir(ev) {
      ev.stopPropagation();
      var f = o.el('<div class="ia-bulle" style="width:300px">' +
        '<div class="ia-bulle-titre"><i class="fa fa-flag"></i> Qu’est-ce qui est faux ?</div>' +
        ['Le constat est faux', 'Mauvais emplacement dans le PDF', 'Règle mal appliquée', 'Autre'].map(function (m, i) {
          return '<label style="display:block;font-weight:400;margin:2px 0"><input type="radio" name="ia-motif" value="' +
            e(m) + '"' + (i === 0 ? ' checked' : '') + '> ' + e(m) + '</label>';
        }).join('') +
        '<textarea placeholder="Précision (facultatif) — sert à corriger les consignes" style="width:100%;margin-top:6px;min-height:50px"></textarea>' +
        '<div class="ia-prop-actions"><button type="button" class="ia-btn ia-btn-ia">Envoyer</button>' +
        '<button type="button" class="ia-btn">Annuler</button></div></div>');
      document.body.appendChild(f);
      var r = zone.getBoundingClientRect();
      f.style.left = Math.max(10, Math.min(window.innerWidth - 320, r.right - 300)) + window.scrollX + 'px';
      f.style.top = r.bottom + 6 + window.scrollY + 'px';
      f.addEventListener('click', function (x) { x.stopPropagation(); });
      var boutons = f.querySelectorAll('.ia-btn');
      boutons[0].addEventListener('click', function () {
        IA.signaler(cle, f.querySelector('input:checked').value, f.querySelector('textarea').value);
        f.remove();
        dessiner();
        o.toast('Merci : le signalement est rattaché à cette analyse et aux consignes utilisées.');
      });
      boutons[1].addEventListener('click', function () { f.remove(); });
      setTimeout(function () {
        document.addEventListener('click', function fermer() { f.remove(); document.removeEventListener('click', fermer); });
      }, 0);
    }
    dessiner();
    return zone;
  };

  /*
   * Une proposition, et les trois gestes de Perle.
   *   p = { cle, titre, cible, texte, visibleEtudiant, langue, appliquer(valeur), multiligne }
   */
  ui.proposition = function (p) {
    var bloc = o.el('<div class="ia-prop" data-cle="' + e(p.cle) + '">' +
      '<div class="ia-prop-tete"><i class="fa fa-magic"></i>' + e(p.titre) +
      '<span class="ia-cible">→ ' + e(p.cible) + '</span><span class="ia-sep"></span>' +
      (p.visibleEtudiant ? '<span class="ia-etiquette-etu"><i class="fa fa-eye"></i>Visible par l’étudiant' +
        (p.langue ? ' · ' + e(p.langue.toUpperCase()) : '') + '</span>'
        : '<span class="ia-etiquette-etu"><i class="fa fa-lock"></i>Staff uniquement</span>') + '</div>' +
      '<textarea rows="' + (p.lignes || 3) + '" aria-label="' + e(p.titre) + '"></textarea>' +
      '<div class="ia-prop-actions">' +
      '<button type="button" class="ia-btn ia-btn-ok" data-action="accepter"><i class="fa fa-check"></i>Accepter</button>' +
      '<button type="button" class="ia-btn" data-action="modifier"><i class="fa fa-pencil"></i>Modifier</button>' +
      '<button type="button" class="ia-btn ia-btn-non" data-action="refuser"><i class="fa fa-times"></i>Refuser</button>' +
      '<span class="ia-sep" style="flex:1"></span><span class="ia-decision"></span></div></div>');
    var zone = bloc.querySelector('textarea');
    zone.value = p.texte;
    var modifie = false;
    zone.addEventListener('input', function () {
      modifie = zone.value !== p.texte;
      bloc.querySelector('[data-action="accepter"]').innerHTML = modifie
        ? '<i class="fa fa-check"></i>Valider ma version' : '<i class="fa fa-check"></i>Accepter';
    });
    function dessiner() {
      var d = IA.decision(p.cle);
      bloc.classList.remove('ia-accepte', 'ia-modifie', 'ia-refuse');
      var info = bloc.querySelector('.ia-decision');
      Array.prototype.forEach.call(bloc.querySelectorAll('.ia-btn'), function (b) { b.style.display = d ? 'none' : ''; });
      zone.readOnly = !!d;
      if (!d) { info.innerHTML = ''; return; }
      bloc.classList.add('ia-' + d.statut);
      info.innerHTML = { accepte: '<b>Accepté</b> — écrit dans Feel Français', modifie: '<b>Modifié</b> puis écrit dans Feel Français',
        refuse: '<b>Refusé</b> — rien n’a été écrit' }[d.statut] +
        ' · <button type="button" class="ia-signaler" data-action="rouvrir">rouvrir</button>';
      info.querySelector('[data-action="rouvrir"]').addEventListener('click', function () { IA.annuler(p.cle); dessiner(); });
    }
    bloc.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-action]');
      if (!b || !bloc.contains(b)) return;
      var a = b.getAttribute('data-action');
      if (a === 'modifier') { zone.readOnly = false; zone.focus(); zone.setSelectionRange(zone.value.length, zone.value.length); return; }
      if (a === 'accepter') {
        if (p.appliquer) p.appliquer(zone.value);
        IA.decider(p.cle, modifie ? 'modifie' : 'accepte', zone.value);
      }
      if (a === 'refuser') IA.decider(p.cle, 'refuse', null);
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === p.cle) dessiner(); });
    dessiner();
    return bloc;
  };

  /*
   * Proposition de verdict (valid / invalid) : accepter la proposition, ou
   * choisir l'autre verdict, ou refuser (ne rien decider maintenant).
   *   p = { cle, titre, cible, propose: 'valide'|'invalide'|null, appliquer(valide:boolean), motif }
   */
  ui.verdict = function (p) {
    var LIB = { valide: 'valid', invalide: 'invalid' };
    var bloc = o.el('<div class="ia-prop ia-prop-verdict" data-cle="' + e(p.cle) + '">' +
      '<div class="ia-prop-tete"><i class="fa fa-magic"></i>' + e(p.titre) + '<span class="ia-cible">→ ' + e(p.cible) +
      '</span></div>' +
      '<div style="font-size:13px">' + (p.propose ? 'L’IA propose : <b class="' + (p.propose === 'valide' ? 'ia-ok' : 'ia-ko') +
        '">' + LIB[p.propose] + '</b>' : '<b class="ia-doute">L’IA ne tranche pas</b> — à vous de décider') +
      (p.motif ? ' <span class="ia-meta">· ' + e(p.motif) + '</span>' : '') + '</div>' +
      '<div class="ia-prop-actions"></div></div>');
    var actions = bloc.querySelector('.ia-prop-actions');
    function dessiner() {
      var d = IA.decision(p.cle);
      bloc.classList.remove('ia-accepte', 'ia-modifie', 'ia-refuse');
      actions.innerHTML = '';
      if (d) {
        bloc.classList.add('ia-' + d.statut);
        actions.appendChild(o.el('<span class="ia-decision">' + (d.statut === 'refuse' ? '<b>Refusé</b> — aucun verdict écrit'
          : '<b>' + (d.statut === 'accepte' ? 'Accepté' : 'Corrigé') + ' : ' + LIB[d.valeur] + '</b> — écrit dans Feel Français') +
          ' · <button type="button" class="ia-signaler">rouvrir</button></span>'));
        actions.querySelector('button').addEventListener('click', function () { IA.annuler(p.cle); dessiner(); });
        return;
      }
      var boutons = p.propose
        ? [['accepter', '<i class="fa fa-check"></i>Accepter : ' + LIB[p.propose], 'ia-btn-ok'],
           ['autre', 'Mettre ' + LIB[p.propose === 'valide' ? 'invalide' : 'valide'], ''],
           ['refuser', '<i class="fa fa-times"></i>Refuser', 'ia-btn-non']]
        : [['valide', 'valid', ''], ['invalide', 'invalid', ''], ['refuser', 'Plus tard', 'ia-btn-non']];
      boutons.forEach(function (b) {
        var n = o.el('<button type="button" class="ia-btn ' + b[2] + '" data-action="' + b[0] + '">' + b[1] + '</button>');
        actions.appendChild(n);
      });
    }
    bloc.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-action]');
      if (!b) return;
      var a = b.getAttribute('data-action');
      var choix = null;
      var statut = 'accepte';
      if (a === 'accepter') choix = p.propose;
      if (a === 'autre') { choix = p.propose === 'valide' ? 'invalide' : 'valide'; statut = 'modifie'; }
      if (a === 'valide' || a === 'invalide') { choix = a; statut = 'modifie'; }
      if (a === 'refuser') { IA.decider(p.cle, 'refuse', null); dessiner(); return; }
      if (choix) { p.appliquer(choix === 'valide'); IA.decider(p.cle, statut, choix); dessiner(); }
    });
    IA.on('decision', function (x) { if (x.cle === p.cle) dessiner(); });
    dessiner();
    return bloc;
  };

  // Verdict propose pour la section entiere, selon le statut de l'analyse.
  function verdictSectionPropose(s) {
    return { 'conforme': 'valide', 'a-corriger': 'invalide' }[s.statut] || null;
  }
  function pieceUnique(s) { return IA.verdictUnique(s) ? (s.documents || []).filter(function (d) { return d.el; })[0] : null; }

  // Ecrit le verdict de section ; s'il n'y a qu'une piece, aussi le sien.
  function appliquerVerdictSection(s, valide) {
    IA.ecrire.verdictSection(s, valide);
    var d = pieceUnique(s);
    if (d) IA.ecrire.verdictDocument(d, valide);
  }

  // ── Toutes les propositions d'une section, dans l'ordre de lecture ──
  // Verdict de la section (null pour une section en alerte : c'est l'alerte qui decide).
  ui.verdictSection = function (s) {
    if (s.statut === 'alerte') return null;
    var unique = pieceUnique(s);
    return ui.verdict({
      cle: 'sec:' + s.alias + ':verdict', titre: unique ? 'Verdict' : 'Verdict de la section',
      cible: unique ? 'état de la section et de la pièce' : 'état général de la section',
      // Le verdict suit le statut de la SECTION, meme avec une seule piece : un
      // releve correct dans une section incomplete reste une section a corriger.
      propose: verdictSectionPropose(s),
      motif: s.statut === 'provisoire' ? 'pièces encore attendues' : (s.statut === 'a-verifier' ? 'un point est à vérifier' : ''),
      appliquer: function (v) { appliquerVerdictSection(s, v); }
    });
  };

  // Commentaire general et note generale interne de la section (liste, eventuellement vide).
  ui.commentairesSection = function (s) {
    var l = [];
    if (s.commentaireSection && s.commentaireSection.etudiant) {
      l.push(ui.proposition({
        cle: 'sec:' + s.alias + ':etudiant', titre: 'Commentaire général', cible: 'Commentaire général de la section',
        texte: s.commentaireSection.etudiant, visibleEtudiant: true, langue: IA.dossier.langue,
        appliquer: function (v) { IA.ecrire.commentaire(s.idSection, 'general', v); }
      }));
    }
    if (s.commentaireSection && s.commentaireSection.interne) {
      l.push(ui.proposition({
        cle: 'sec:' + s.alias + ':interne', titre: 'Note générale interne', cible: 'Note générale interne', lignes: 2,
        texte: s.commentaireSection.interne, visibleEtudiant: false,
        appliquer: function (v) { IA.ecrire.commentaire(s.idSection, 'internal-general', v); }
      }));
    }
    return l;
  };

  ui.propositionsSection = function (s, options) {
    options = options || {};
    var box = o.el('<div class="ia-propositions"></div>');
    var unique = pieceUnique(s);
    var v = ui.verdictSection(s);
    if (v) box.appendChild(v);
    ui.commentairesSection(s).forEach(function (c) { box.appendChild(c); });
    (s.documents || []).forEach(function (d) {
      if (!d.el || options.sansDocuments) return;
      var bloc = ui.propositionsDocument(d, { sansVerdict: !!unique || s.statut === 'alerte' });
      if (bloc.querySelector('.ia-prop')) box.appendChild(bloc);
    });
    return box;
  };

  ui.propositionsDocument = function (d, options) {
    options = options || {};
    var box = o.el('<div class="ia-props-doc" data-doc="' + e(d.nom) + '"></div>');
    var langue = IA.dossier.langue;
    box.appendChild(o.el('<div class="ia-meta" style="margin:10px 0 2px;font-weight:700;color:#2b3a42">' +
      '<i class="fa fa-file-pdf-o"></i> ' + e(d.sousType) + ' <span style="font-weight:400">· doc n° ' + e(d.id) + '</span></div>'));
    if (!options.sansVerdict) {
      box.appendChild(ui.verdict({
        cle: 'doc:' + d.nom + ':verdict', titre: 'Verdict de la pièce', cible: 'valid / invalid du document',
        propose: d.verdict === 'a-verifier' ? null : d.verdict,
        appliquer: function (v) { IA.ecrire.verdictDocument(d, v); }
      }));
    }
    if (d.commentaire && d.commentaire.etudiant) {
      box.appendChild(ui.proposition({
        cle: 'doc:' + d.nom + ':etudiant', titre: 'Commentaire pour l’étudiant', cible: 'Commentaire du staff',
        texte: d.commentaire.etudiant, visibleEtudiant: true, langue: langue,
        appliquer: function (v) { IA.ecrire.commentaire(d.id, 'staff', v); }
      }));
    }
    if (d.commentaire && d.commentaire.interne) {
      box.appendChild(ui.proposition({
        cle: 'doc:' + d.nom + ':interne', titre: 'Note interne', cible: 'Note interne', lignes: 2,
        texte: d.commentaire.interne, visibleEtudiant: false,
        appliquer: function (v) { IA.ecrire.commentaire(d.id, 'internal', v); }
      }));
    }
    return box;
  };

  // Accepter d'un coup tout ce qui reste en attente (section ou dossier).
  ui.toutAccepter = function (liste) {
    var n = 0;
    liste.forEach(function (s) {
      IA.propositionsSection(s).forEach(function (p) {
        if (IA.decision(p.cle) || p.type === 'deplacement') return;
        var bloc = document.querySelector('.ia-prop[data-cle="' + cssEsc(p.cle) + '"]');
        var bouton = bloc && bloc.querySelector('[data-action="accepter"]');
        if (bouton) { bouton.click(); n++; return; }
        n += accepterSansInterface(s, p) ? 1 : 0;
      });
    });
    return n;
  };
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/"/g, '\\"'); }

  // Meme effet qu'un clic sur « Accepter », quand la proposition n'est pas affichee.
  function accepterSansInterface(s, p) {
    var m = /^(sec|doc):(.+):(verdict|etudiant|interne)$/.exec(p.cle);
    if (!m) return false;
    if (m[1] === 'sec') {
      if (m[3] === 'verdict') {
        var u = pieceUnique(s);
        var v = verdictSectionPropose(s);
        if (!v) return false;
        appliquerVerdictSection(s, v === 'valide');
        IA.decider(p.cle, 'accepte', v);
      } else {
        var t = s.commentaireSection[m[3]];
        IA.ecrire.commentaire(s.idSection, m[3] === 'etudiant' ? 'general' : 'internal-general', t);
        IA.decider(p.cle, 'accepte', t);
      }
      return true;
    }
    var d = (s.documents || []).filter(function (x) { return x.nom === m[2]; })[0];
    if (!d) return false;
    if (m[3] === 'verdict') {
      if (d.verdict === 'a-verifier') return false;
      IA.ecrire.verdictDocument(d, d.verdict === 'valide');
      IA.decider(p.cle, 'accepte', d.verdict);
    } else {
      IA.ecrire.commentaire(d.id, m[3] === 'etudiant' ? 'staff' : 'internal', d.commentaire[m[3]]);
      IA.decider(p.cle, 'accepte', d.commentaire[m[3]]);
    }
    return true;
  }
  ui.accepterSansInterface = accepterSansInterface;
  ui.pieceUnique = pieceUnique;

  // ── Blocs d'information ──
  ui.alerte = function (s) {
    if (!s.alerte) return null;
    var b = o.el('<div class="ia-bloc ia-bloc-alerte"><h6><i class="fa fa-exclamation-triangle"></i>Alerte sur une validation humaine</h6>' +
      '<div class="ia-meta" style="margin-bottom:6px"><i class="fa fa-user"></i> Validé par <b>' + e(s.humain.par) + '</b> le ' +
      e(s.humain.le) + ' — cette validation reste la vérité du dossier tant que vous ne la changez pas.</div>' +
      '<div style="font-size:13px">' + e(s.alerte.texte) + '</div>' +
      '<div style="font-size:13px;margin-top:6px"><b>Proposition :</b> ' + e(s.alerte.proposition) + '</div>' +
      '<div class="ia-meta" style="margin-top:4px">Déclenchée par : ' + e(s.alerte.declenchee) + '</div>' +
      '<div class="ia-prop-actions"></div></div>');
    var cle = 'alerte:' + s.alias;
    var actions = b.querySelector('.ia-prop-actions');
    function dessiner() {
      var d = IA.decision(cle);
      actions.innerHTML = '';
      if (d) {
        actions.appendChild(o.el('<span class="ia-decision"><b>' + e(d.valeur) + '</b> · <button type="button" class="ia-signaler">rouvrir</button></span>'));
        actions.querySelector('button').addEventListener('click', function () { IA.annuler(cle); dessiner(); });
        return;
      }
      [['garder', '<i class="fa fa-check"></i>Garder la validation', 'ia-btn-ok'],
       ['invalider', 'Invalider et demander un nouveau document', ''],
       ['plus-tard', 'Arbitrer plus tard', 'ia-btn-non']].forEach(function (x) {
        actions.appendChild(o.el('<button type="button" class="ia-btn ' + x[2] + '" data-choix="' + x[0] + '">' + x[1] + '</button>'));
      });
    }
    actions.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-choix]');
      if (!c) return;
      var choix = c.getAttribute('data-choix');
      var libelle = { garder: 'Validation conservée', invalider: 'Validation remplacée par « invalid »', 'plus-tard': 'Arbitrage reporté' }[choix];
      if (choix === 'invalider') {
        IA.ecrire.verdictSection(s, false);
        (s.documents || []).forEach(function (d) { if (d.el) IA.ecrire.verdictDocument(d, false); });
      }
      IA.decider(cle, choix === 'plus-tard' ? 'refuse' : (choix === 'garder' ? 'accepte' : 'modifie'), libelle);
      dessiner();
    });
    dessiner();
    return b;
  };

  ui.provisoire = function (s) {
    if (!s.provisoire) return null;
    var p = s.provisoire;
    return o.el('<div class="ia-bloc"><h6><i class="fa fa-hourglass-half"></i>Analyse provisoire</h6>' +
      '<table class="ia-table"><tr><th>Reçu</th><th>Encore attendu</th></tr><tr><td>' +
      p.recu.map(function (x) { return '<div class="ia-ok"><i class="fa fa-check"></i> ' + e(x) + '</div>'; }).join('') + '</td><td>' +
      p.attendus.map(function (x) { return '<div class="ia-meta"><i class="fa fa-clock-o"></i> ' + e(x) + '</div>'; }).join('') +
      '</td></tr></table><div class="ia-meta" style="margin-top:6px">' + e(p.texte) + '</div></div>');
  };

  ui.mauvaiseSection = function (s) {
    if (!s.mauvaiseSection) return null;
    var m = s.mauvaiseSection;
    var cle = 'sec:' + s.alias + ':deplacement';
    var b = o.el('<div class="ia-bloc ia-bloc-attention"><h6><i class="fa fa-random"></i>Pièce dans la mauvaise section</h6>' +
      '<div style="font-size:13px"><b>Détecté :</b> ' + e(m.detecte) + '</div>' +
      '<div style="font-size:13px"><b>Section proposée :</b> ' + e(m.sectionProposee) + '</div>' +
      '<div class="ia-meta" style="margin:4px 0">' + e(m.motif) + '</div>' +
      '<div class="ia-meta">L’IA ne déplace rien : le déplacement se fait avec le menu <i class="fa fa-arrows"></i> de Feel Français.</div>' +
      '<div class="ia-prop-actions"></div></div>');
    var actions = b.querySelector('.ia-prop-actions');
    function dessiner() {
      var d = IA.decision(cle);
      actions.innerHTML = '';
      if (d) {
        actions.appendChild(o.el('<span class="ia-decision"><b>' + e(d.valeur) + '</b> · <button type="button" class="ia-signaler">rouvrir</button></span>'));
        actions.querySelector('button').addEventListener('click', function () { IA.annuler(cle); dessiner(); });
        return;
      }
      actions.appendChild(o.el('<button type="button" class="ia-btn ia-btn-ia" data-choix="preparer"><i class="fa fa-arrows"></i>Montrer le déplacement dans Feel Français</button>'));
      actions.appendChild(o.el('<button type="button" class="ia-btn ia-btn-non" data-choix="refuser">Laisser ici</button>'));
    }
    actions.addEventListener('click', function (ev) {
      var c = ev.target.closest('[data-choix]');
      if (!c) return;
      if (c.getAttribute('data-choix') === 'refuser') { IA.decider(cle, 'refuse', 'Laissé dans cette section'); dessiner(); return; }
      ui.preparerDeplacement(s);
    });
    document.addEventListener('replique:deplacement', function (ev) {
      var d = (s.documents || [])[0];
      if (d && d.el && d.el.contains(ev.detail.lien)) {
        IA.decider(cle, ev.detail.alias === m.aliasPropose ? 'accepte' : 'modifie', 'Déplacé vers « ' + ev.detail.alias + ' »');
        dessiner();
      }
    });
    dessiner();
    return b;
  };

  // Ouvre LEUR menu de deplacement et designe la bonne entree : Perle clique.
  ui.preparerDeplacement = function (s) {
    var d = (s.documents || [])[0];
    if (!d || !d.el) return;
    var ferme = document.querySelector('.ia-fenetre');
    if (ferme && ferme.__fermer) ferme.__fermer();
    var menu = d.el.querySelector('.doc-info-actions .dropdown');
    o.defiler(menu);
    setTimeout(function () {
      menu.classList.add('open');
      Array.prototype.forEach.call(menu.querySelectorAll('.dropdown-menu a'), function (a) {
        if (a.textContent.trim() === s.mauvaiseSection.aliasPropose) {
          a.classList.add('ia-champ-propose');
          a.setAttribute('title', 'Proposition IA : cliquez pour déplacer');
          a.scrollIntoView({ block: 'nearest' });
        }
      });
    }, 450);
  };

  ui.ressources = function (s) {
    var r = s.ressources;
    if (!r) return null;
    var lignes = [];
    r.comptes.forEach(function (c) {
      c.mois.forEach(function (m) {
        var etat = { ok: '<span class="ia-ok"><i class="fa fa-check"></i> retenu</span>',
          doublon: '<span class="ia-doute"><i class="fa fa-clone"></i> doublon écarté</span>',
          manquant: '<span class="ia-ko"><i class="fa fa-times"></i> manquant</span>' }[m.etat];
        lignes.push('<tr><td>' + e(m.mois) + '</td><td>' + (m.fichiers.length ? m.fichiers.map(function (f, i) {
          return '<div title="' + e(m.noms[i]) + '">' + e(f) + '</div>'; }).join('') : '—') + '</td><td>' +
          e(m.cloture || '') + '</td><td>' + etat + '</td></tr>');
      });
    });
    var c0 = r.comptes[0];
    return o.el('<div class="ia-bloc"><h6><i class="fa fa-university"></i>Preuve de ressources — vue d’ensemble</h6>' +
      '<div class="ia-meta" style="margin-bottom:6px">Option <b>' + e(r.option) + '</b> · ' + e(c0.banque) + ' · compte <b>' +
      e(c0.compte) + '</b> · titulaire <b>' + e(c0.titulaire) + '</b> · devise <b>' + e(c0.devise) + '</b></div>' +
      '<table class="ia-table"><tr><th>Mois</th><th>Fichier(s)</th><th>Clôture</th><th>Retenu ?</th></tr>' + lignes.join('') + '</table>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">' +
      '<div class="ia-bloc" style="margin:0;background:var(--ia-gris-clair)"><div class="ia-meta">Dernier solde pertinent</div>' +
      '<div style="font-size:16px;font-weight:700">' + e(r.dernierSolde.euros) + '</div><div class="ia-meta">' +
      e(r.dernierSolde.valeur) + ' au ' + e(r.dernierSolde.date) + ' · ' + e(IA.meta.taux[c0.devise] || '') + '</div></div>' +
      '<div class="ia-bloc" style="margin:0;background:var(--ia-gris-clair)"><div class="ia-meta">Besoin</div>' +
      '<div style="font-size:13px;font-weight:700">' + e(r.besoin) + '</div><div class="ia-meta">' + e(IA.meta.bareme) + '</div></div></div>' +
      (r.complement ? '<div class="ia-meta" style="margin-top:6px">' + e(r.complement) + '</div>' : '') +
      '<div style="margin-top:6px;font-size:13px"><b>Conclusion :</b> ' + e(r.conclusion) + '</div></div>');
  };

  // Comparaison cote a cote de deux zones de deux documents (controle croise).
  ui.ouvrirCote = function (titre, gauche, droite, note) {
    var f = ui.fenetre({ titre: titre, classe: 'ia-fenetre-cote' });
    f.el.innerHTML = '<div class="ia-cote-tete"><b>' + e(titre) + '</b>' + (note ? ' <span class="ia-meta">' + note + '</span>' : '') +
      '<button type="button" class="ia-btn" style="margin-left:auto" data-fermer><i class="fa fa-times"></i>Fermer</button></div>' +
      '<div class="ia-cote-corps"><div><div class="ia-cote-legende"></div><div class="ia-v-zone"></div></div>' +
      '<div><div class="ia-cote-legende"></div><div class="ia-v-zone"></div></div></div>';
    f.el.__fermer = f.fermer;
    f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
    var zones = f.el.querySelectorAll('.ia-v-zone');
    var legendes = f.el.querySelectorAll('.ia-cote-legende');
    [gauche, droite].forEach(function (g, i) {
      legendes[i].innerHTML = '<b>' + e(g.libelle) + '</b>' + (g.valeur ? ' : <span class="' + (g.classe || '') + '">' + e(g.valeur) + '</span>' : '');
      IA.rendrePage(IA.urlDocument(g.nom), g.rect ? [{ rect: g.rect, teinte: g.teinte || 'info', numero: null }] : [],
        zones[i], Math.min(520, (window.innerWidth - 120) / 2)).then(function () {
        var s = zones[i].querySelector('.ia-surlignage');
        if (s) { s.classList.add('ia-actif'); s.scrollIntoView({ block: 'center' }); }
      });
    });
    return f;
  };

  ui.croisements = function (s) {
    if (!s.croisements || !s.croisements.length) return null;
    var b = o.el('<div class="ia-bloc"><h6><i class="fa fa-exchange"></i>Contrôles croisés</h6></div>');
    s.croisements.forEach(function (x) {
      var ok = x.resultat === 'coherent';
      var l = o.el('<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px solid #f0f3f5;font-size:12.5px">' +
        '<span class="' + (ok ? 'ia-ok' : 'ia-ko') + '"><i class="fa ' + (ok ? 'fa-check' : 'fa-not-equal fa-times') + '"></i></span>' +
        '<span style="flex:1"><b>' + e(x.titre) + '</b><br><span class="ia-meta">' + e(x.a.valeur) + ' ↔ ' + e(x.b.valeur) + '</span></span>' +
        '<button type="button" class="ia-mini"><i class="fa fa-columns"></i>Côte à côte</button></div>');
      l.querySelector('button').addEventListener('click', function () {
        var t = ok ? 'conforme' : 'probleme';
        ui.ouvrirCote(x.titre, { libelle: x.a.fichier, valeur: x.a.valeur, nom: x.a.nom, rect: x.a.rect, teinte: t },
          { libelle: x.b.fichier, valeur: x.b.valeur, nom: x.b.nom, rect: x.b.rect, teinte: t },
          ok ? 'cohérent' : '<span class="ia-ko">contradiction</span>');
      });
      b.appendChild(l);
    });
    return b;
  };

  ui.versions = function (s) {
    if (!s.versions && !s.reponseEtudiant && !s.tentatives) return null;
    var b = o.el('<div class="ia-bloc"><h6><i class="fa fa-history"></i>Versions précédentes et réponse de l’étudiant</h6></div>');
    if (s.tentatives) {
      b.appendChild(o.el('<div class="ia-bloc ia-bloc-attention" style="margin:0 0 8px"><b>' + s.tentatives.numero + 'e dépôt</b> ' +
        '<span class="ia-meta">(seuil : ' + s.tentatives.seuil + ')</span> — ' + e(s.tentatives.texte) + '</div>'));
    }
    (s.versions || []).forEach(function (v, i) {
      var l = o.el('<div style="padding:5px 0;border-top:1px solid #f0f3f5;font-size:12.5px">' +
        '<div style="display:flex;gap:8px;align-items:center"><span class="ia-pastille ia-p-decide">v' + (i + 1) + '</span>' +
        '<span class="ia-meta">déposée le ' + e(v.depose) + ' · refusée par Perle</span><span style="flex:1"></span>' +
        '<a class="ia-mini" target="_blank" rel="noopener" href="' + IA.urlDocument(v.nom) + '"><i class="fa fa-file-pdf-o"></i>Voir</a></div>' +
        '<div style="margin:4px 0 0 4px">« ' + e(v.commentairePerle) + ' »</div>' +
        '<div class="' + (v.resolu ? 'ia-ok' : 'ia-ko') + '" style="margin-left:4px"><i class="fa ' + (v.resolu ? 'fa-check' : 'fa-times') +
        '"></i> ' + (v.resolu ? 'Corrigé dans la version actuelle' : 'Pas encore corrigé') + ' <span class="ia-meta" style="font-weight:400">— ' +
        e(v.preuve) + '</span></div></div>');
      b.appendChild(l);
    });
    if (s.reponseEtudiant) {
      var r = s.reponseEtudiant;
      b.appendChild(o.el('<div style="padding:6px 0;border-top:1px solid #f0f3f5;font-size:12.5px"><i class="fa fa-user"></i> ' +
        '<b>Réponse de l’étudiant</b> <span class="ia-meta">(' + e(r.le) + ')</span><div style="margin:3px 0 0 16px">« ' +
        e(r.texte) + ' »</div><div class="ia-ok" style="margin-left:16px"><i class="fa fa-check"></i> ' + e(r.priseEnCompte) + '</div></div>'));
    }
    if (s.comparaison) {
      var c = s.comparaison;
      var bouton = o.el('<button type="button" class="ia-btn" style="margin-top:6px"><i class="fa fa-columns"></i>Comparer avec la version précédente</button>');
      bouton.addEventListener('click', function () {
        var ch = c.changements[0];
        ui.ouvrirCote('Ce qui a changé', { libelle: 'Avant (' + c.avant + ')', valeur: ch.avant, nom: c.nomAvant, rect: ch.rectAvant, teinte: 'probleme', classe: 'ia-obsolete' },
          { libelle: 'Maintenant (' + c.apres + ')', valeur: ch.apres, nom: c.nomApres, rect: ch.rectApres, teinte: 'conforme' },
          c.changements.map(function (x) { return e(x.avant) + ' → <b>' + e(x.apres) + '</b>'; }).join(' · '));
      });
      b.appendChild(bouton);
    }
    return b;
  };

  ui.piecesLiees = function (s) {
    if (!s.piecesLiees) return null;
    return o.el('<div class="ia-bloc ia-bloc-attention"><h6><i class="fa fa-link"></i>Pièces liées</h6>' +
      s.piecesLiees.map(function (p) {
        return '<div style="font-size:12.5px"><b>' + e(p.section) + '</b> — <span class="ia-ko">' + e(p.etat) + '</span><div class="ia-meta">' +
          e(p.texte) + '</div></div>';
      }).join('') + '</div>');
  };

  // Le « pourquoi » : regles et versions de consignes, propositions obsoletes, horodatage.
  ui.pourquoi = function (s, ouvert) {
    var d = o.el('<details class="ia-pourquoi"' + (ouvert ? ' open' : '') + '><summary>Pourquoi ? règles appliquées et traçabilité</summary></details>');
    var contenu = o.el('<div></div>');
    if (s.regles && s.regles.length) {
      contenu.appendChild(o.el('<div class="ia-bloc"><h6><i class="fa fa-book"></i>Règles appliquées</h6>' + s.regles.map(function (r) {
        return '<div style="font-size:12.5px;padding:2px 0"><span class="ia-pastille ia-p-decide">' + e(r.id) + '</span> ' + e(r.texte) +
          ' <span class="ia-meta">— ' + e(r.source) + '</span></div>';
      }).join('') + '</div>'));
    }
    if (s.propositionsObsoletes) {
      contenu.appendChild(o.el('<div class="ia-bloc"><h6><i class="fa fa-ban"></i>Propositions devenues obsolètes</h6>' +
        s.propositionsObsoletes.map(function (p) {
          return '<div style="font-size:12.5px"><span class="ia-obsolete">' + e(p.texte) + '</span> <span class="ia-meta">(' + e(p.date) +
            ')</span><div class="ia-meta">' + e(p.raison) + '</div></div>';
        }).join('') + '</div>'));
    }
    contenu.appendChild(ui.horodatage());
    d.appendChild(contenu);
    return d;
  };

  ui.horodatage = function () {
    var a = IA.dossier.analyse;
    return o.el('<div class="ia-meta" style="padding:4px 2px"><i class="fa fa-clock-o"></i> Analyse du <b>' + e(a.date) +
      '</b> (' + e(a.duree) + ') · ' + e(a.declencheur) + '<br><i class="fa fa-eye"></i> Lu : ' + e(a.lu) + '<br>' +
      '<i class="fa fa-cog"></i> ' + e(IA.meta.agent) + '</div>');
  };

  // Tous les blocs d'une section, dans l'ordre : ce qui demande une action d'abord.
  ui.blocsSection = function (s) {
    var box = o.el('<div class="ia-blocs"></div>');
    [ui.alerte(s), ui.mauvaiseSection(s), ui.provisoire(s), ui.ressources(s), ui.piecesLiees(s), ui.versions(s), ui.croisements(s)]
      .forEach(function (b) { if (b) box.appendChild(b); });
    return box;
  };

  // ── Champs Feel Francais : contour + « Voir la proposition » (P0) ──
  ui.champs = function (options) {
    options = options || {};
    IA.dossier.champs.forEach(function (c) {
      var champ = document.querySelector(c.selecteur);
      if (!champ) return;
      var cle = 'champ:' + c.cle;
      var cible = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2')
        ? champ.nextElementSibling.querySelector('.select2-selection') || champ.nextElementSibling : champ;
      var label = document.querySelector('label[for="' + champ.id + '"]');
      var bouton = o.el('<button type="button" class="ia-voir"><i class="fa fa-magic"></i>Voir la proposition</button>');
      if (label) label.appendChild(bouton);
      else champ.parentNode.insertBefore(bouton, champ);
      function etat() {
        var d = IA.decision(cle);
        cible.classList.toggle('ia-champ-propose', !d);
        bouton.innerHTML = d ? '<i class="fa fa-check"></i>Proposition ' + { accepte: 'acceptée', modifie: 'modifiée', refuse: 'refusée' }[d.statut]
          : '<i class="fa fa-magic"></i>Voir la proposition';
        bouton.classList.toggle('ia-fait', !!d);
      }
      bouton.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        if (options.surVoir) options.surVoir(c, bouton);
        else ui.bulleChamp(c, bouton);
      });
      IA.on('decision', function (x) { if (x.cle === cle) etat(); });
      etat();
    });
  };

  ui.propositionChamp = function (c) {
    var champ = document.querySelector(c.selecteur);
    var actuel = champ ? (c.type === 'select' ? champ.options[champ.selectedIndex].text : champ.value) : '';
    var box = o.el('<div></div>');
    box.appendChild(o.el('<div class="ia-avant-apres"><div><small>Actuellement</small>' + e(actuel || '(vide)') + '</div>' +
      '<div><small>Proposé</small>' + e(c.proposeLibelle || c.propose) + '</div></div>'));
    box.appendChild(o.el('<div class="ia-meta" style="margin-bottom:4px">' + e(c.motif) + '</div>'));
    if (c.source) {
      var lien = o.el('<button type="button" class="ia-mini" style="margin-bottom:6px"><i class="fa fa-search"></i>Voir la source dans le document</button>');
      lien.addEventListener('click', function () {
        ui.ouvrirCote('Source de la proposition : ' + c.libelle, { libelle: c.source.fichier, valeur: c.propose, nom: c.source.nom, rect: c.source.rect, teinte: 'info' },
          { libelle: 'Champ Feel Français « ' + c.libelle + ' »', valeur: actuel || '(vide)', nom: c.source.nom, rect: null });
      });
      box.appendChild(lien);
    }
    var visible = !c.interne && c.cle === 'message';
    if (c.type === 'select') {
      box.appendChild(ui.verdictChamp(c));
    } else {
      box.appendChild(ui.proposition({
        cle: 'champ:' + c.cle, titre: c.libelle, cible: 'champ « ' + c.libelle + ' »', texte: c.propose,
        visibleEtudiant: visible, langue: visible ? IA.dossier.langue : null, lignes: c.type === 'date' ? 1 : 5,
        appliquer: function (v) { IA.ecrire.champ(c, v); }
      }));
    }
    return box;
  };

  // Statut du dossier : accepter la valeur proposee ou garder l'actuelle.
  ui.verdictChamp = function (c) {
    var cle = 'champ:' + c.cle;
    var b = o.el('<div class="ia-prop" data-cle="' + e(cle) + '"><div class="ia-prop-tete"><i class="fa fa-magic"></i>' + e(c.libelle) +
      '<span class="ia-cible">→ ' + e(c.proposeLibelle) + '</span></div><div class="ia-prop-actions"></div></div>');
    var actions = b.querySelector('.ia-prop-actions');
    function dessiner() {
      var d = IA.decision(cle);
      actions.innerHTML = '';
      b.classList.remove('ia-accepte', 'ia-refuse');
      if (d) {
        b.classList.add('ia-' + d.statut);
        actions.appendChild(o.el('<span class="ia-decision"><b>' + (d.statut === 'accepte' ? 'Statut changé : ' + e(c.proposeLibelle) : 'Statut inchangé') +
          '</b> · <button type="button" class="ia-signaler">rouvrir</button></span>'));
        actions.querySelector('button').addEventListener('click', function () { IA.annuler(cle); dessiner(); });
        return;
      }
      actions.appendChild(o.el('<button type="button" class="ia-btn ia-btn-ok" data-a="ok"><i class="fa fa-check"></i>Passer à « ' + e(c.proposeLibelle) + ' »</button>'));
      actions.appendChild(o.el('<button type="button" class="ia-btn ia-btn-non" data-a="non"><i class="fa fa-times"></i>Garder le statut actuel</button>'));
    }
    actions.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'ok') { IA.ecrire.champ(c, c.propose); IA.decider(cle, 'accepte', c.propose); }
      else IA.decider(cle, 'refuse', null);
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === cle) dessiner(); });
    dessiner();
    return b;
  };

  ui.bulleChamp = function (c, ancre) {
    document.querySelectorAll('.ia-bulle[data-champ]').forEach(function (x) { x.remove(); });
    var b = o.el('<div class="ia-bulle" data-champ="' + e(c.cle) + '" style="width:420px"><div class="ia-bulle-titre">' +
      '<i class="fa fa-magic"></i>Proposition IA — ' + e(c.libelle) + '<span style="flex:1"></span>' +
      '<button type="button" class="ia-mini" data-fermer><i class="fa fa-times"></i></button></div></div>');
    b.appendChild(ui.propositionChamp(c));
    document.body.appendChild(b);
    var r = ancre.getBoundingClientRect();
    b.style.left = Math.max(10, Math.min(window.innerWidth - 440, r.left)) + window.scrollX + 'px';
    b.style.top = r.bottom + 8 + window.scrollY + 'px';
    b.querySelector('[data-fermer]').addEventListener('click', function () { b.remove(); });
    IA.on('decision', function (x) { if (x.cle === 'champ:' + c.cle && x.statut) setTimeout(function () { b.remove(); }, 700); });
    return b;
  };

  // ── Questions Campus France (E3) : seulement si la zone les prevoit ──
  ui.campusFrance = function () {
    var cf = IA.dossier.campusFrance;
    if (!cf || cf.absent) return null;
    var b = o.el('<div class="ia-bloc"><h6><i class="fa fa-comments"></i>Questions Campus France — préparation de l’entretien</h6></div>');
    if (!cf.disponible) {
      b.appendChild(o.el('<div class="ia-meta">' + e(cf.raison) + '</div>'));
      return b;
    }
    b.appendChild(o.el('<div class="ia-meta" style="margin-bottom:6px">' + e(cf.raison) + ' · langue de l’étudiante : <b>' +
      e(cf.langue.toUpperCase()) + '</b> · réponses construites uniquement à partir des pièces du dossier.</div>'));
    cf.questions.forEach(function (x, i) {
      b.appendChild(o.el('<div style="padding:6px 0;border-top:1px solid #f0f3f5;font-size:13px"><b>' + (i + 1) + '. ' + e(x.q) + '</b>' +
        '<div style="margin:3px 0 2px">' + e(x.r) + '</div><div class="ia-meta"><i class="fa fa-file-o"></i> ' + e(x.sources.join(' · ')) +
        '</div>' + (x.alerte ? '<div class="ia-doute" style="font-size:12px"><i class="fa fa-exclamation-triangle"></i> ' + e(x.alerte) + '</div>' : '') + '</div>'));
    });
    var copier = o.el('<button type="button" class="ia-btn" style="margin-top:6px"><i class="fa fa-copy"></i>Copier pour l’étudiante</button>');
    copier.addEventListener('click', function () {
      var t = cf.questions.map(function (x, i) { return (i + 1) + '. ' + x.q + '\n' + x.r; }).join('\n\n');
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { o.toast('Questions copiées.'); },
        function () { o.toast('Copie impossible dans ce navigateur.'); });
    });
    b.appendChild(copier);
    return b;
  };

  // ── Resume du dossier (verdict global, E2) ──
  ui.syntheseDossier = function () {
    var d = IA.dossier;
    var box = o.el('<div class="ia-bloc"><h6><i class="fa fa-folder-open"></i>Synthèse du dossier ' + o.pastille(d.dossier.verdict) + '</h6>' +
      '<ul style="margin:0 0 4px 16px;padding:0;font-size:13px">' + d.dossier.synthese.map(function (x) { return '<li>' + e(x) + '</li>'; }).join('') +
      '</ul>' + (d.dossier.nonRequis.length ? '<div class="ia-meta"><b>Non requis pour ce cas :</b> ' + d.dossier.nonRequis.map(function (n) {
        return e(n.section) + ' — ' + e(n.motif); }).join(' ; ') + '</div>' : '') + '</div>');
    return box;
  };

  // ── Page des notifications : l'analyse IA visible depuis leur liste (E1) ──
  var FIGURANTS = {
    'Youssef Benali': ['a-corriger', '1 à corriger'], 'Amadou Traoré': ['conforme', 'conforme'],
    'Nour El Amrani': ['a-verifier', '1 à vérifier'], 'Priya Raman': ['conforme', 'conforme'],
    'Chen Liwei': ['conforme', 'conforme'], 'Sofía Castillo': ['a-corriger', '1 à corriger'],
    'Kwame Mensah': ['provisoire', 'provisoire'], 'Daniel Okafor': ['conforme', 'conforme'], 'Hana Suzuki': ['a-verifier', '1 à vérifier']
  };
  ui.resumeDossier = function (d) {
    var n = { 'a-corriger': 0, 'a-verifier': 0, 'provisoire': 0, 'alerte': 0, 'conforme': 0 };
    d.sections.forEach(function (s) { if (n[s.statut] != null) n[s.statut]++; });
    return n;
  };
  ui.notifications = function (dessinerLigne) {
    var parNom = {};
    Object.keys(IA.meta ? window.IA_DONNEES.dossiers : {}).forEach(function (k) {
      var d = window.IA_DONNEES.dossiers[k];
      parNom[d.etudiant] = d;
    });
    function marquer() {
      document.querySelectorAll('table.dataTable tbody tr').forEach(function (tr) {
        if (tr.querySelector('[data-ia]')) return;
        var cellule = tr.cells[1];
        if (!cellule) return;
        var nom = o.texte(cellule);
        var d = parNom[nom];
        var info = d ? { dossier: d, compte: ui.resumeDossier(d) } : (FIGURANTS[nom] ? { figurant: FIGURANTS[nom] } : null);
        if (info) dessinerLigne(tr, cellule, info);
      });
    }
    if (window.jQuery) window.jQuery(document).on('draw.dt', function () { setTimeout(marquer, 0); });
    setTimeout(marquer, 800);
  };

  IA.ui = ui;
})();
