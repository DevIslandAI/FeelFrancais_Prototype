/*
 * Variante 13 — « Cartes IA »  (base : 11 Section sur la page)
 *
 * Partout la meme carte « Proposition IA » (titre, etat ⏱/✓, contenu, puis
 * Accepter · Modifier · Refuser · Annuler) :
 *   - haut de page : Statut, Texte a l'etudiant, Zone (dates, commentaire staff),
 *     Visa (etapes a cocher) — une pastille « IA ⏱ » a cote du libelle ouvre la
 *     carte juste sous le champ ;
 *   - chaque section : la carte de SECTION (verdict, commentaire general, note
 *     generale interne) s'ouvre sous leur « Commentaire general », et reapparait
 *     en haut de la fenetre des documents (les deux restent synchronisees) ;
 *   - la fenetre : en haut la section, en bas le PDF a gauche et, a droite, la
 *     carte du DOCUMENT, en parties separees : Analyse · Verdict propose par
 *     l'IA · Commentaire (+ PDF annote joint) · Note interne · Versions precedentes.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var ui4;
  var fen = null;

  IA.on('pret', function () {
    ui4 = IA.ui4;
    if (!IA.dossier) return notifications();
    IA.analysees().forEach(function (s) { marquer(s); poserSection(s); });
    IA.dossier.champs.forEach(poserChamp);
    (IA.dossier.etapesVisa || []).forEach(poserEtape);
    var ligne = IA.ui2.ligne([
      { html: '<i class="fa fa-link"></i> Incohérences', action: function () { ouvrir('incoherences'); } },
      { html: 'Ouvrir l’analyse des documents', principal: true, action: function () { ouvrir(premiere()); } }
    ]);
    ligne.parentNode.insertBefore(bandeauEtapes(), ligne.nextSibling);
  });

  // ─── Bandeau des etapes : note generale, « N a traiter », pieces attendues ──
  var ALIAS_EEF = ['eef-diploma', 'EEF-email', 'etudes-en-france-certificate'];
  function etapeDe(s) { return ALIAS_EEF.indexOf(s.alias) >= 0 ? 'eef' : 'visa'; }
  function bandeauEtapes() {
    var d = IA.dossier;
    var b = o.el('<div class="v13-etapes"><div class="v13-e-cases"></div><div class="v13-e-infos"></div></div>');
    var seuil = (d.bareme || {}).seuil || 17;
    // Une case par etape : la note generale seule (moyenne des documents analyses, sur 10).
    function caseEtape(cle, nom) {
      var html = '<div class="v13-etape' + (cle === 'eef' && !d.eef ? ' v13-etape-sans' : '') + '"><span class="v13-e-nom">' + nom + '</span>';
      if (cle === 'eef' && !d.eef) return html + '<span class="ia4-muet">sans objet</span></div>';
      var notes = [];
      IA.analysees().filter(function (s) { return etapeDe(s) === cle; })
        .forEach(function (s) { docs(s).forEach(function (x) { if (x.note) notes.push(x.note.valeur); }); });
      if (notes.length) {
        var moy = notes.reduce(function (a, x) { return a + x; }, 0) / notes.length / 2;
        return html + '<span class="v13-e-note v13-note-' + (moy >= seuil / 2 ? 'ok' : 'ko') + '">' + dixieme(moy) + '<small>/10</small></span></div>';
      }
      return html + '<span class="ia2-vert"><i class="fa fa-check"></i> validée</span></div>';
    }
    b.querySelector('.v13-e-cases').innerHTML = caseEtape('eef', 'Études en France') + caseEtape('visa', 'Visa Center');
    var infos = b.querySelector('.v13-e-infos');
    if ((d.attendus || []).length) {
      infos.appendChild(o.el('<div class="v13-e-attendus"><b><i class="fa fa-hourglass-half"></i> Attendu, pas encore reçu</b><ul>' +
        d.attendus.map(function (x) { return '<li><span class="v13-e-sec">' + e(x.section) + '</span> ' + e(x.piece) + '</li>'; }).join('') + '</ul></div>'));
    }
    var opt = IA.sections().filter(function (s) { return s.el && s.statut === 'optionnel'; });
    if (opt.length) {
      infos.appendChild(o.el('<div class="v13-e-opt"><i class="fa fa-eye-slash"></i> <b>Optionnel, non analysé par l’IA :</b> ' +
        opt.map(function (s) { return e({ 'french-test': 'Test de français ou d’anglais' }[s.alias] || IA.ui2.nom(s)); }).join(', ') + '</div>'));
    }
    if (!infos.children.length) infos.remove();
    return b;
  }

  // ─── Notifications : l'etat de l'analyse de chaque dossier ───────────────
  // Figurants : un dossier en cours d'analyse, un en attente (l'etudiant depose
  // encore), un en echec avec « Relancer ».
  var ETATS_NOTIF = { 'Amadou Traoré': 'cours', 'Youssef Benali': 'attente', 'Nour El Amrani': 'echec' };
  function notifications() {
    IA.ui.notifications(function (tr, cellule, info) {
      var boite = o.el('<div class="ia2-notif v13-notif"></div>');
      cellule.appendChild(boite);
      var fin;
      if (info.dossier) {
        var n = info.compte;
        var aFaire = n['a-corriger'] + n['a-verifier'] + n['alerte'] + n['provisoire'];
        fin = [aFaire ? 'a-corriger' : 'conforme', aFaire ? aFaire + ' à traiter' : 'conforme', info.dossier.analyse.date.replace(' ', ' à ')];
      } else fin = [info.figurant[0], info.figurant[1], ''];
      function fait() {
        boite.className = 'ia2-notif v13-notif ia2-t-' + fin[0];
        boite.innerHTML = '<span class="ia2-point"></span>IA · ' + e(fin[1]) + (fin[2] ? ' <span class="v13-n-quand">· ' + e(fin[2].replace(/\/\d{4} à/, '')) + '</span>' : '');
        boite.title = fin[2] ? 'Analysé le ' + fin[2] : 'Analyse faite';
      }
      function cours(duree) {
        boite.className = 'ia2-notif v13-notif v13-n-cours';
        boite.title = 'Analyse en cours';
        boite.innerHTML = '<i class="fa fa-spinner fa-spin"></i> IA · en cours…';
        setTimeout(fait, duree);
      }
      var etat = info.dossier ? 'fait' : (ETATS_NOTIF[o.texte(cellule).replace(/IA ·.*$/, '').trim()] || 'fait');
      if (etat === 'cours') cours(7000);
      else if (etat === 'attente') {
        boite.className = 'ia2-notif v13-notif v13-n-attente';
        boite.title = 'L’étudiant dépose encore : l’analyse attend la fin de ses dépôts.';
        boite.innerHTML = '<i class="fa fa-clock-o"></i> IA · en attente';
      } else if (etat === 'echec') {
        boite.className = 'ia2-notif v13-notif v13-n-echec';
        boite.title = 'L’analyse n’a pas abouti.';
        boite.innerHTML = '<i class="fa fa-exclamation-triangle"></i> IA · échec ' +
          '<button type="button" class="v13-relancer" title="Relancer l’analyse de ce dossier"><i class="fa fa-refresh"></i> Relancer</button>';
        boite.querySelector('button').addEventListener('click', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          o.toast('Analyse relancée.');
          cours(4000);
        });
      } else fait();
    });
  }

  function premiere() {
    return IA.ui2.ordre().filter(function (s) { return !IA.progressionSection(s).finie; })[0] || 'dossier';
  }
  function docs(s) { return (s.documents || []).filter(function (d) { return d.el; }); }
  function verdictSection(s) { return { 'conforme': 'valide', 'a-corriger': 'invalide' }[s.statut] || null; }
  function clesSection(s) { return IA.propositionsSection(s).map(function (p) { return p.cle; }).filter(function (c) { return /^(sec:|alerte:)/.test(c) && c.indexOf(':deplacement') < 0; }); }
  function clesDoc(s, d) { return IA.propositionsSection(s).map(function (p) { return p.cle; }).filter(function (c) { return c.indexOf('doc:' + d.nom + ':') === 0; }); }
  function decisionTexte(cle, texteIA, valeur, statut) {
    if (!texteIA) return;  // rien n'etait propose : si Perle ecrit, c'est ecrit, sans cle IA
    IA.decider(cle, !valeur ? 'refuse' : statut, valeur || null);
  }
  function existe(s, cle) { return IA.propositionsSection(s).some(function (p) { return p.cle === cle; }); }

  // ── Pastille « IA ⏱ / ✓ » ──
  function pastille(etat) {
    return '<span class="ia2-point"></span>IA ' + ui4.icone(etat === 'attente' ? 'attente' : 'decide');
  }
  function puce(titre) {
    return o.el('<button type="button" class="ia4-puce" aria-expanded="false" title="' + e(titre) + '"></button>');
  }

  // ── Etiquette sur la bordure de la section (⏱ tant que tout n'est pas decide) ──
  function marquer(s) {
    var c = s.el.querySelector('.doc-container');
    s.el.classList.add('ia2-sec', 'ia2-' + s.statut);
    var tag = o.el('<button type="button" class="ia2-tag ia4-tag ia2-t-' + s.statut + '" title="Analyse des documents"></button>');
    c.appendChild(tag);
    tag.addEventListener('click', function (ev) { ev.stopPropagation(); ouvrir(s); });
    function maj() {
      var fini = IA.progressionSection(s).finie;
      s.el.classList.toggle('ia2-fini', fini);
      tag.innerHTML = '<span class="ia2-point"></span>IA · ' + e(fini ? 'traité' : IA.ui2.COURT[s.statut]) + ' ' + ui4.icone(fini ? 'decide' : 'attente');
      tag.classList.toggle('ia2-tag-fini', fini);
    }
    IA.on('decision', maj);
    maj();
    s.tag = tag;
  }

  // ─── Cartes des champs du haut de page (Statut, Zone) ───────────────────
  function carteChamp(c) {
    var champ = document.querySelector(c.selecteur);
    var ch = { id: 'valeur', libelle: c.libelle, type: c.type, ia: c.propose, etudiant: c.cle === 'message', info: c.motif };
    if (c.type === 'select') ch.options = Array.prototype.map.call(champ.options, function (x) { return [x.value, x.text]; });
    return ui4.carte({
      id: 'champ:' + c.cle, titre: c.libelle, champs: [ch],
      cles: function () { return ['champ:' + c.cle]; },
      appliquer: function (v, statut) {
        var avant = champ.value;
        IA.ecrire.champ(c, v.valeur);
        IA.decider('champ:' + c.cle, statut(ch), v.valeur);
        return { avant: avant };
      },
      refuser: function () { IA.decider('champ:' + c.cle, 'refuse', null); },
      annuler: function (snap) { if ('avant' in snap) IA.ecrire.champ(c, snap.avant); IA.annuler('champ:' + c.cle); }
    });
  }

  function poserChamp(c) {
    var champ = document.querySelector(c.selecteur);
    if (!champ) return;
    var apres = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2') ? champ.nextElementSibling : champ;
    var cadre = c.type === 'select' ? (apres.querySelector('.select2-selection') || apres) : champ;
    var label = document.querySelector('label[for="' + champ.id + '"]');
    var p = puce('Proposition IA — ' + c.libelle);
    var titreStatut = label && label.querySelector('.statut-title');
    if (titreStatut) titreStatut.appendChild(p); else if (label) label.appendChild(p); else champ.parentNode.insertBefore(p, champ);
    var boite = o.el('<div class="ia4-sous-champ" hidden></div>');
    boite.appendChild(carteChamp(c));
    // Champ dans une colonne etroite (les 3 dates du cursus) : la carte se pose
    // sous la ligne entiere, pleine largeur, au lieu d'etre ecrasee.
    var ligne = champ.closest('.row');
    if (ligne && champ.parentNode.getBoundingClientRect().width < 420) {
      ligne.parentNode.insertBefore(boite, ligne.nextSibling);
    } else {
      apres.parentNode.insertBefore(boite, apres.nextSibling);
    }
    brancherPuce(p, boite, function () { return ui4.etat(['champ:' + c.cle]); }, function (etat) { cadre.classList.toggle('ia4-champ-propose', etat === 'attente'); });
  }

  function brancherPuce(p, boite, etat, surEtat) {
    p.addEventListener('click', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      boite.hidden = !boite.hidden;
      p.setAttribute('aria-expanded', !boite.hidden);
    });
    function maj() {
      var x = etat();
      p.innerHTML = pastille(x);
      p.classList.toggle('ia4-puce-fini', x !== 'attente');
      if (surEtat) surEtat(x);
    }
    IA.on('decision', maj);
    boite.addEventListener('click', function () { setTimeout(maj, 0); });
    maj();
  }

  // ─── Cartes des etapes Visa (checklist) ─────────────────────────────────
  function carteEtape(x) {
    var cb = document.querySelector(x.case);
    var date = document.querySelector(x.date);
    var ch = { id: 'valeur', libelle: x.libelle, type: 'case', ia: { coche: x.coche, le: x.le }, info: x.motif };
    return ui4.carte({
      id: 'visa:' + x.cle, titre: 'Visa · ' + x.libelle, champs: [ch],
      cles: function () { return []; },
      appliquer: function (v) {
        var snap = { coche: cb.checked, le: date.value };
        cb.checked = !!v.valeur.coche;
        date.value = v.valeur.coche ? (v.valeur.le || '') : '';
        if (window.jQuery) { window.jQuery(cb).trigger('change'); window.jQuery(date).trigger('change'); }
        o.flash(cb.closest('.form-group'));
        return snap;
      },
      refuser: function () {},
      annuler: function (snap) { if ('coche' in snap) { cb.checked = snap.coche; date.value = snap.le; } }
    });
  }
  function poserEtape(x) {
    var cb = document.querySelector(x.case);
    if (!cb) return;
    var groupe = cb.closest('.form-group');
    var label = cb.closest('label');
    var p = puce('Proposition IA — ' + x.libelle);
    label.appendChild(p);
    var boite = o.el('<div class="ia4-sous-champ ia4-sous-visa" hidden></div>');
    boite.appendChild(carteEtape(x));
    groupe.parentNode.insertBefore(boite, groupe.nextSibling);
    brancherPuce(p, boite, function () { return ui4.etat([], 'visa:' + x.cle); }, function (etat) { groupe.classList.toggle('ia4-champ-propose-groupe', etat === 'attente'); });
  }

  // ─── Carte de SECTION (page + haut de la fenetre, synchronisees) ─────────
  function carteSection(s, avecIncoherences) {
    var champs = [];
    var avant = null;
    if (s.statut === 'alerte') {
      avant = o.el('<div class="ia4-alerte"><b><i class="fa fa-exclamation-triangle"></i> Déjà validé par ' + e(s.humain.par) + ' le ' +
        e(s.humain.le.slice(0, 10)) + '.</b> ' + e(s.alerte.texte) + '</div>');
      champs.push({ id: 'alerte', libelle: 'Décision sur la validation', type: 'choix', ia: 'garder',
        options: [['garder', 'Garder la validation'], ['invalider', 'Invalider et demander un nouveau document'], ['plus-tard', 'Arbitrer plus tard']] });
    } else {
      champs.push({ id: 'verdict', libelle: 'Verdict de la section', type: 'verdict', ia: verdictSection(s) });
    }
    champs.push({ id: 'commentaire', libelle: 'Commentaire général', type: 'texte', ia: (s.commentaireSection || {}).etudiant || '', etudiant: true });
    champs.push({ id: 'note', libelle: 'Note générale interne', type: 'texte', ia: '', facultatif: true });
    var entete = s.el.querySelector('.doc-general-state .doc-state');
    return ui4.carte({
      id: 'sec:' + s.alias, titre: 'Section · ' + IA.ui2.nom(s), sousTitre: IA.ui2.COURT[s.statut], champs: champs, avant: avant,
      apres: avecIncoherences ? [IA.ui3.incoherencesCompactes(s)] : [],
      // Dans la fenetre, la carte de section se replie en une ligne pour laisser la place au PDF.
      repliable: avecIncoherences ? 'sectionFenetre' : null,
      resume: function (v) {
        var r = s.statut === 'alerte'
          ? '<span class="ia4-r-v ia4-r-doute">' + e({ garder: 'Garder la validation', invalider: 'Invalider', 'plus-tard': 'Plus tard' }[v.alerte] || '') + '</span>'
          : '<span class="ia4-r-v ia4-r-' + (v.verdict || 'doute') + '">' + (v.verdict === 'valide' ? 'valid' : v.verdict === 'invalide' ? 'invalid' : 'à décider') + '</span>';
        return r + '<span class="ia4-r-com">' + (v.commentaire ? '« ' + e(v.commentaire) + ' »' : 'Pas de commentaire général') + '</span>';
      },
      cles: function () { return clesSection(s); },
      appliquer: function (v, statut) {
        var snap = { verdict: ui4.ff.verdict(entete), general: ui4.ff.note(s.idSection, 'general'), interne: ui4.ff.note(s.idSection, 'internal-general') };
        if (s.statut === 'alerte') {
          if (v.alerte === 'invalider') { IA.ecrire.verdictSection(s, false); docs(s).forEach(function (d) { IA.ecrire.verdictDocument(d, false); }); }
          IA.decider('alerte:' + s.alias, v.alerte === 'plus-tard' ? 'refuse' : (v.alerte === 'garder' ? 'accepte' : 'modifie'),
            { garder: 'Validation conservée', invalider: 'Passé en invalid', 'plus-tard': 'Arbitrage reporté' }[v.alerte]);
        } else {
          IA.ecrire.verdictSection(s, v.verdict === 'valide');
          IA.decider('sec:' + s.alias + ':verdict', statut(champs[0]), v.verdict);
        }
        if (v.commentaire || snap.general) IA.ecrire.commentaire(s.idSection, 'general', v.commentaire || '');
        decisionTexte('sec:' + s.alias + ':etudiant', champs[1].ia, v.commentaire, statut(champs[1]));
        if (v.note) IA.ecrire.commentaire(s.idSection, 'internal-general', v.note);
        if (existe(s, 'sec:' + s.alias + ':interne')) IA.decider('sec:' + s.alias + ':interne', v.note ? 'modifie' : 'refuse', v.note || null);
        return snap;
      },
      refuser: function () { clesSection(s).forEach(function (c) { IA.decider(c, 'refuse', c.indexOf('alerte:') === 0 ? 'Arbitrage reporté' : null); }); },
      annuler: function (snap) {
        if ('verdict' in snap && s.statut !== 'alerte') {
          ui4.ff.remettreVerdict(entete, '.changeGeneralState', snap.verdict, function (valide) { IA.ecrire.verdictSection(s, valide); });
        }
        if ('general' in snap && ui4.ff.note(s.idSection, 'general') !== snap.general) IA.ecrire.commentaire(s.idSection, 'general', snap.general);
        if ('interne' in snap && ui4.ff.note(s.idSection, 'internal-general') !== snap.interne) IA.ecrire.commentaire(s.idSection, 'internal-general', snap.interne);
        clesSection(s).forEach(function (c) { IA.annuler(c); });
      }
    });
  }

  function poserSection(s) {
    var conteneur = s.el.querySelector('.doc-container');
    var rangee = conteneur.querySelector(':scope > .doc-general-messages-row');
    var boite = o.el('<div class="ia4-sous-section" hidden></div>');
    boite.appendChild(carteSection(s, false));
    var lien = o.el('<button type="button" class="ia4-lien-docs"><i class="fa fa-file-pdf-o"></i> Voir l’analyse des documents</button>');
    lien.addEventListener('click', function () { ouvrir(s); });
    boite.appendChild(lien);
    if (rangee) rangee.parentNode.insertBefore(boite, rangee.nextSibling);
    else conteneur.querySelector('.doc-general-state').insertAdjacentElement('afterend', boite);
    var p = puce('Proposition IA — verdict et commentaire général de la section');
    var rangBoutons = rangee && rangee.querySelector('.doc-note-add-row');
    if (rangBoutons) rangBoutons.appendChild(p); else boite.parentNode.insertBefore(p, boite);
    brancherPuce(p, boite, function () { return ui4.etat(clesSection(s)); });
  }

  // ─── Carte du DOCUMENT (dans la fenetre) ────────────────────────────────
  function analyse(d) {
    var box = o.el('<div class="ia4-analyse"></div>');
    var ajouts = ui4.memoire('ajouts:' + d.nom) || [];
    function dessiner() {
      box.innerHTML = '';
      var ol = o.el('<ol class="ia4-constats"></ol>');
      IA.constatsVisibles(d, 'admin').forEach(function (k, n) {
        var modif = ui4.memoire('constat:' + d.nom + ':' + n);
        var li = o.el('<li class="ia4-constat ia4-c-' + o.typeConstat(k) + '" data-n="' + n + '"><span class="ia2-num">' + (n + 1) + '</span>' +
          '<span class="ia4-c-texte">' + e(modif != null ? modif : k.texte) + (modif != null ? ' <span class="ia4-modifie">modifié</span>' : '') + '</span>' +
          '<button type="button" class="ia4-mini" data-edit title="Modifier ce constat"><i class="fa fa-pencil"></i></button></li>');
        li.appendChild(IA.ui.signaler('constat:' + d.nom + ':' + n));
        li.querySelector('[data-edit]').addEventListener('click', function (ev) {
          ev.stopPropagation();
          var t = li.querySelector('.ia4-c-texte');
          var zone = o.el('<textarea class="ia4-edit-constat" rows="2"></textarea>');
          zone.value = modif != null ? modif : k.texte;
          t.replaceWith(zone);
          zone.focus();
          zone.addEventListener('blur', function () {
            ui4.memoire('constat:' + d.nom + ':' + n, zone.value.trim() === k.texte ? null : zone.value.trim());
            dessiner();
          });
        });
        li.addEventListener('click', function () { if (box.surClic) box.surClic(n); });
        ol.appendChild(li);
      });
      ajouts.forEach(function (a, i) {
        var li = o.el('<li class="ia4-constat ia4-c-perle"><span class="ia4-num-perle">' + (a.type === 'autre' ? '…' : '+') + '</span>' +
          '<span class="ia4-c-texte"><span class="ia4-type-perle">' + (a.type === 'autre' ? 'Autre commentaire' : 'Constat') + ' · Perle</span> ' + e(a.texte) + '</span>' +
          '<button type="button" class="ia4-mini" title="Supprimer"><i class="fa fa-trash-o"></i></button></li>');
        li.querySelector('button').addEventListener('click', function () { ajouts.splice(i, 1); ui4.memoire('ajouts:' + d.nom, ajouts); dessiner(); });
        ol.appendChild(li);
      });
      box.appendChild(ol);
      var form = o.el('<div class="ia4-ajout"><button type="button" class="ia4-lien"><i class="fa fa-plus"></i> Ajouter un constat ou un autre commentaire</button>' +
        '<div class="ia4-ajout-form" hidden><select><option value="constat">Constat</option><option value="autre">Autre commentaire</option></select>' +
        '<textarea rows="2" placeholder="Ce que vous avez remarqué sur ce document…"></textarea>' +
        '<button type="button" class="ia4-btn ia4-ok">Ajouter</button></div></div>');
      form.querySelector('.ia4-lien').addEventListener('click', function () { var f = form.querySelector('.ia4-ajout-form'); f.hidden = !f.hidden; });
      form.querySelector('.ia4-ok').addEventListener('click', function () {
        var t = form.querySelector('textarea').value.trim();
        if (!t) return;
        ajouts.push({ type: form.querySelector('select').value, texte: t });
        ui4.memoire('ajouts:' + d.nom, ajouts);
        dessiner();
      });
      box.appendChild(form);
    }
    dessiner();
    box.activer = function (n) {
      box.querySelectorAll('.ia4-constat').forEach(function (li) { li.classList.toggle('ia4-actif', li.getAttribute('data-n') === String(n)); });
      var li = box.querySelector('.ia4-constat[data-n="' + n + '"]');
      if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    return box;
  }

  // ── Note /20 du document : la note seule, avant l'analyse ──
  function dixieme(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  function blocNote(d) {
    var n = d.note;
    if (!n) return null;
    return o.el('<div class="ia4-partie v13-note"><span class="ia4-p-titre">Note de l’IA</span>' +
      '<span class="v13-note-val v13-note-' + (n.valeur >= n.seuil ? 'ok' : 'ko') + '">' + n.valeur + '<small>/20</small></span></div>');
  }

  // ── Mot laisse par l'etudiant avec son depot : seulement son message ──
  function blocMot(s, rang, total) {
    var r = s.reponseEtudiant;
    if (!r || rang !== total) return null;  // le mot accompagne le dernier depot
    return o.el('<div class="ia4-partie v13-mot"><div class="ia4-p-titre"><i class="fa fa-user"></i> Mot de l’étudiant</div>' +
      '<div class="v13-mot-texte">« ' + e(r.texte) + ' »</div></div>');
  }

  // ── Versions precedentes : repliees, une ligne par version ──
  function versionsPrecedentes(s) {
    if (!s.versions) return null;
    var box = o.el('<details class="ia4-partie v13-versions"><summary><span class="ia4-p-titre">Versions précédentes</span>' +
      '<span class="v13-v-compte">' + s.versions.length + '</span><span class="ia4-sep"></span><i class="fa fa-chevron-down v13-v-chevron"></i></summary>' +
      '<div class="v13-v-liste"></div></details>');
    var liste = box.querySelector('.v13-v-liste');
    s.versions.forEach(function (v, i) {
      liste.appendChild(o.el('<div class="v13-v"><div class="v13-v-tete"><span class="v13-v-num">v' + (i + 1) + '</span>' +
        '<span class="v13-v-date">' + e(v.depose.split(' ')[0]) + '</span>' +
        '<span class="v13-v-etat v13-v-' + (v.resolu ? 'ok' : 'ko') + '" title="' + e(v.preuve) + '"><i class="fa ' + (v.resolu ? 'fa-check' : 'fa-times') + '"></i> ' +
        (v.resolu ? 'corrigé' : 'pas corrigé') + '</span><span class="ia4-sep"></span>' +
        '<a href="' + IA.urlDocument(v.nom) + '" target="_blank" rel="noopener"><i class="fa fa-file-pdf-o"></i> PDF</a></div>' +
        '<div class="v13-v-com"><span class="ia4-muet">Perle :</span> « ' + e(v.commentairePerle) + ' »</div></div>'));
    });
    if (s.comparaison) {
      var b = o.el('<button type="button" class="ia4-btn v13-v-comparer"><i class="fa fa-columns"></i> Comparer avec la version précédente</button>');
      b.addEventListener('click', function () {
        var c = s.comparaison, x = c.changements[0];
        IA.ui.ouvrirCote('Avant / maintenant', { libelle: 'Avant', valeur: x.avant, nom: c.nomAvant, rect: x.rectAvant, teinte: 'probleme' },
          { libelle: 'Maintenant', valeur: x.apres, nom: c.nomApres, rect: x.rectApres, teinte: 'conforme' });
      });
      liste.appendChild(b);
    }
    return box;
  }

  function carteDocument(s, d, analyseEl, rang, total, surAction) {
    var aCorriger = IA.constatsVisibles(d, 'etudiant').length > 0;
    var champs = [
      { id: 'verdict', libelle: 'Verdict proposé par l’IA', type: 'verdict', ia: d.verdict === 'a-verifier' ? null : d.verdict },
      { id: 'commentaire', libelle: 'Commentaire', type: 'texte', ia: (d.commentaire || {}).etudiant || '', etudiant: true,
        joint: aCorriger && d.annote ? { url: IA.urlDocument(d.annote.etudiant) } : null, avant: blocMot(s, rang, total) },
      { id: 'note', libelle: 'Note interne', type: 'texte', ia: '', facultatif: true }
    ];
    var analyseBloc = o.el('<div class="ia4-partie"><div class="ia4-p-titre">Analyse <span class="ia4-muet">— ce que l’IA a lu dans le document ; modifiable</span>' +
      '<span class="ia4-sep"></span></div></div>');
    analyseBloc.querySelector('.ia4-p-titre').appendChild(ui4.boutonCopier('Copier l’analyse', function () {
      return Array.prototype.map.call(analyseEl.querySelectorAll('.ia4-constat .ia4-c-texte'), function (t, i) {
        return (i + 1) + '. ' + t.textContent.replace(/\s*modifié$/, '').trim();
      }).join('\n');
    }));
    analyseBloc.appendChild(analyseEl);
    var avant = o.el('<div class="v13-avant-doc"></div>');
    // Ordre de lecture : note → analyse → (verdict → mot de l'etudiant → commentaire → note interne) → versions
    [blocNote(d), analyseBloc].forEach(function (x) { if (x) avant.appendChild(x); });
    var boutons = d.el.querySelector('.doc-info-buttons');
    return ui4.carte({
      id: 'doc:' + d.nom, titre: (total > 1 ? 'Document ' + rang + ' sur ' + total + ' · ' : 'Document · ') + d.sousType, sousTitre: 'n° ' + d.id,
      champs: champs, avant: avant, apres: [versionsPrecedentes(s)], apresAction: surAction,
      cles: function () { return clesDoc(s, d); },
      appliquer: function (v, statut) {
        var snap = { verdict: ui4.ff.verdict(boutons), staff: ui4.ff.note(d.id, 'staff'), internal: ui4.ff.note(d.id, 'internal') };
        IA.ecrire.verdictDocument(d, v.verdict === 'valide');
        if (existe(s, 'doc:' + d.nom + ':verdict')) IA.decider('doc:' + d.nom + ':verdict', statut(champs[0]), v.verdict);
        if (v.commentaire || snap.staff) IA.ecrire.commentaire(d.id, 'staff', v.commentaire || '');
        decisionTexte('doc:' + d.nom + ':etudiant', champs[1].ia, v.commentaire, statut(champs[1]));
        if (v.note) IA.ecrire.commentaire(d.id, 'internal', v.note);
        if (existe(s, 'doc:' + d.nom + ':interne')) IA.decider('doc:' + d.nom + ':interne', v.note ? 'modifie' : 'refuse', v.note || null);
        return snap;
      },
      refuser: function () { clesDoc(s, d).forEach(function (c) { IA.decider(c, 'refuse', null); }); },
      annuler: function (snap) {
        if ('verdict' in snap) ui4.ff.remettreVerdict(boutons, '.changeState', snap.verdict, function (valide) { IA.ecrire.verdictDocument(d, valide); });
        if ('staff' in snap && ui4.ff.note(d.id, 'staff') !== snap.staff) IA.ecrire.commentaire(d.id, 'staff', snap.staff);
        if ('internal' in snap && ui4.ff.note(d.id, 'internal') !== snap.internal) IA.ecrire.commentaire(d.id, 'internal', snap.internal);
        clesDoc(s, d).forEach(function (c) { IA.annuler(c); });
      }
    });
  }

  // ─── Carte « Document mal place » ────────────────────────────────────────
  // De « section actuelle » → vers « section proposee », puis Deplacer ou Annuler.
  // Deplacer = le meme geste que leur menu ⇄ (changer d'alias) du document ;
  // l'analyse est alors relancee dans la section d'arrivee.
  function carteDeplacement(s) {
    var m = s.mauvaiseSection;
    var d = docs(s)[0];
    if (!m || !d) return null;
    var cle = 'sec:' + s.alias + ':deplacement';
    var liens = Array.prototype.slice.call(d.el.querySelectorAll('.doc-info-actions .dropdown-menu a'));
    function aliasDe(a) { return a.textContent.replace(/\s*\|\s*$/, '').trim(); }
    function nomSection(alias) {
      if (alias === m.aliasPropose) return m.sectionProposee;
      var x = IA.sections().filter(function (y) { return y.alias === alias && y.titre; })[0];
      return x ? x.titre : alias;
    }
    var options = liens.map(aliasDe).filter(function (x, i, l) { return l.indexOf(x) === i && x !== s.alias; });
    if (options.indexOf(m.aliasPropose) < 0) options.unshift(m.aliasPropose);
    var vers = m.aliasPropose, choix = false, badge = null, minuterie = null;
    var el = o.el('<div class="ia4-carte v13-dep" data-carte="dep:' + e(s.alias) + '"></div>');

    function dessiner() {
      var dec = IA.decision(cle);
      var etat = !dec ? 'attente' : dec.statut === 'refuse' ? 'refuse' : 'accepte';
      el.className = 'ia4-carte v13-dep ia4-' + etat;
      var tete = '<div class="v13-dep-tete"><span class="ia4-c-marque"><i class="fa fa-magic"></i> Proposition IA</span>' +
        '<span class="v13-dep-titre">Document mal placé</span><span class="ia4-sep"></span>' +
        '<span class="ia4-etat ia4-etat-' + etat + '">' + ui4.icone(etat) + ' ' + { attente: 'À décider', accepte: 'Déplacé', refuse: 'Laissé ici' }[etat] + '</span></div>';
      var trajet = '<div class="v13-dep-trajet"><div class="v13-dep-bout"><small>De</small><b>' + e(m.sectionActuelle || IA.ui2.nom(s)) + '</b></div>' +
        '<i class="fa fa-long-arrow-right v13-dep-fleche"></i>' +
        '<div class="v13-dep-bout v13-dep-vers"><small>Vers</small>' +
        (choix ? '<select class="ia4-select">' + options.map(function (a) {
          return '<option value="' + e(a) + '"' + (a === vers ? ' selected' : '') + '>' + e(nomSection(a)) + (a === m.aliasPropose ? ' (proposé)' : '') + '</option>';
        }).join('') + '</select>' : '<b>' + e(nomSection(vers)) + '</b>') + '</div></div>';
      var html = tete + '<div class="v13-dep-corps"><div class="v13-dep-doc"><i class="fa fa-file-pdf-o"></i> ' + e(d.sousType) + '</div>' + trajet;
      if (etat === 'attente') {
        html += '<div class="v13-dep-motif">' + e(m.motifCourt || m.motif) + '</div>' +
          (choix ? '' : '<button type="button" class="ia4-lien v13-dep-changer" data-a="changer">Choisir une autre section</button>') +
          '</div><div class="ia4-c-actions"><button type="button" class="ia4-btn ia4-ok" data-a="accepter"><i class="fa fa-arrows"></i> Déplacer</button>' +
          '<button type="button" class="ia4-btn" data-a="refuser"><i class="fa fa-times"></i> Annuler</button></div>';
      } else if (etat === 'accepte') {
        html += '<div class="v13-dep-relance" data-relance>' + (minuterie ? '<i class="fa fa-spinner fa-spin"></i> Analyse relancée dans « ' + e(nomSection(dec.valeur)) + ' »…'
          : '<i class="fa fa-check"></i> Analyse relancée dans « ' + e(nomSection(dec.valeur)) + ' »') + '</div></div>' +
          '<div class="ia4-c-actions"><span class="ia4-muet">Déplacé dans Feel Français.</span><span class="ia4-sep"></span>' +
          '<button type="button" class="ia4-btn" data-a="revenir"><i class="fa fa-undo"></i> Revenir en arrière</button></div>';
      } else {
        html += '</div><div class="ia4-c-actions"><span class="ia4-muet">Le document reste dans cette section.</span><span class="ia4-sep"></span>' +
          '<button type="button" class="ia4-btn" data-a="revenir"><i class="fa fa-undo"></i> Revenir en arrière</button></div>';
      }
      el.innerHTML = html;
    }

    el.addEventListener('change', function (ev) { if (ev.target.tagName === 'SELECT') vers = ev.target.value; });
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'changer') { choix = true; dessiner(); return; }
      if (a === 'accepter') {
        var lien = liens.filter(function (x) { return aliasDe(x) === vers; })[0];
        if (lien) lien.click();  // leur menu ⇄ : le document change de section
        badge = o.el('<span class="v13-deplace"><i class="fa fa-arrows"></i> Déplacé vers « ' + e(nomSection(vers)) + ' »</span>');
        var meta = d.el.querySelector('.doc-info-meta');
        if (meta) meta.appendChild(badge);
        minuterie = setTimeout(function () { minuterie = null; if (document.contains(el)) dessiner(); }, 1600);
        IA.decider(cle, vers === m.aliasPropose ? 'accepte' : 'modifie', vers);
      } else if (a === 'refuser') {
        IA.decider(cle, 'refuse', 'Laissé dans cette section');
      } else if (a === 'revenir') {
        clearTimeout(minuterie);
        minuterie = null;
        if (badge) { badge.remove(); badge = null; }
        IA.annuler(cle);
        o.toast('Annulé : la proposition est de nouveau à décider.');
      }
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === cle && document.contains(el)) dessiner(); });
    dessiner();
    return el;
  }

  // ─── La fenetre ─────────────────────────────────────────────────────────
  function ouvrir(cible) {
    if (!fen) {
      var f = IA.ui.fenetre({ titre: 'Analyse des documents', classe: 'v13-fen', surFermeture: function () {
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        fen = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<nav class="v13-nav" aria-label="Sections"></nav><div class="v13-principal">' +
        '<button type="button" class="ia4-btn v13-fermer" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button>' +
        '<div class="v13-corps"></div><footer class="v13-pied"></footer></div>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      fen = { f: f, courant: null };
      IA.on('decision', function () { if (fen) nav(); });
    }
    afficher(cible);
  }

  function nav() {
    var n = fen.f.el.querySelector('.v13-nav');
    n.innerHTML = '';
    var inc = IA.ui2.nombreIncoherences();
    [['dossier', '<i class="fa fa-folder-open-o"></i> Dossier', ''],
     ['incoherences', '<i class="fa fa-link"></i> Incohérences', inc ? '<span class="ia2-compte">' + inc + '</span>' : '']].forEach(function (x) {
      var b = o.el('<button type="button" class="v13-item' + (fen.courant === x[0] ? ' v13-actif' : '') + '">' + x[1] + '<span class="ia2-sep"></span>' + x[2] + '</button>');
      b.addEventListener('click', function () { afficher(x[0]); });
      n.appendChild(b);
    });
    n.appendChild(o.el('<div class="v13-nav-titre">Sections</div>'));
    IA.ui2.ordre().forEach(function (s) {
      var fini = IA.progressionSection(s).finie;
      var b = o.el('<button type="button" class="v13-item ia2-t-' + s.statut + (fen.courant === s ? ' v13-actif' : '') + (fini ? ' v13-fini' : '') + '">' +
        '<span class="ia2-point"></span><span class="v13-nom">' + e(IA.ui2.nom(s)) + '</span>' + ui4.icone(fini ? 'decide' : 'attente') + '</button>');
      b.addEventListener('click', function () { afficher(s); });
      n.appendChild(b);
    });
  }

  function afficher(cible) {
    fen.courant = cible;
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', s === cible); });
    nav();
    var corps = fen.f.el.querySelector('.v13-corps');
    var pied = fen.f.el.querySelector('.v13-pied');
    corps.innerHTML = '';
    corps.className = 'v13-corps';
    pied.innerHTML = '';
    pied.onclick = null;
    if (cible === 'dossier' || cible === 'incoherences') {
      corps.classList.add('v13-simple', 'v13-blanc');
      if (cible === 'incoherences') {
        corps.appendChild(o.el('<h3 class="v13-h">Incohérences entre documents</h3>'));
        corps.appendChild(IA.ui2.incoherencesDossier(function (s) { afficher(s); }));
        return;
      }
      corps.appendChild(o.el('<h3 class="v13-h">Dossier — ' + e(IA.dossier.etudiant) + '</h3>'));
      corps.appendChild(o.el('<div class="ia4-synthese">' + IA.dossier.dossier.synthese.map(function (x) { return '<div>' + e(x) + '</div>'; }).join('') + '</div>'));
      IA.dossier.champs.forEach(function (c) { corps.appendChild(carteChamp(c)); });
      (IA.dossier.etapesVisa || []).forEach(function (x) { corps.appendChild(carteEtape(x)); });
      var cf = IA.ui.campusFrance();
      if (cf) corps.appendChild(cf);
      return;
    }
    var s = cible;
    var haut = o.el('<div class="v13-haut"></div>');
    haut.appendChild(carteSection(s, true));
    var liste = docs(s);
    // v13-blanc : la carte du document sur fond blanc (la carte de section reste mauve)
    var bas = o.el('<div class="v13-bas"><div class="v13-docs-tete"><span class="v13-docs-titre"><i class="fa fa-files-o"></i> Documents de la section' +
      ' <span class="v13-docs-nb"></span></span><div class="v13-onglets" role="tablist"></div></div>' +
      '<div class="v13-doc"><div class="v13-pdf"></div><aside class="v13-carte-doc v13-blanc"></aside></div></div>');
    corps.appendChild(haut);
    corps.appendChild(bas);
    var aside = bas.querySelector('.v13-carte-doc');
    var analyses = [];
    var courant = 0;
    // Etat d'un document : ⏱ tant qu'il reste une decision, ✓ ensuite.
    function docFini(i) {
      var c = cartesDocs[i];
      return c && !c.classList.contains('ia4-attente');
    }
    var cartesDocs = liste.map(function (d, i) {
      var a = analyse(d);
      analyses.push(a);
      var c = carteDocument(s, d, a, i + 1, liste.length, function (action) {
        majOnglets();
        // Apres « Accepter » ou « Refuser », on passe au document suivant a traiter.
        if ((action === 'accepter' || action === 'refuser') && liste.length > 1) {
          var suivant = liste.map(function (x, j) { return j; }).filter(function (j) { return j !== i && !docFini(j); })[0];
          if (suivant != null) setTimeout(function () { montrer(suivant); }, 250);
        }
      });
      c.hidden = true;
      aside.appendChild(c);
      return c;
    });
    var dep = carteDeplacement(s);
    if (dep) aside.insertBefore(dep, aside.firstChild);
    var aSavoir = IA.ui3.separerAlerte(s).aSavoir;
    if (aSavoir) {
      aSavoir.querySelectorAll('.ia2-version').forEach(function (v) { var b = v.closest('.ia2-info'); if (b) b.remove(); });
      // Le document mal place a maintenant sa propre carte, en haut.
      if (dep) aSavoir.querySelectorAll('.ia2-info-attention').forEach(function (b) { if (/Mauvaise section/.test(b.textContent)) b.remove(); });
      if (aSavoir.querySelector('.ia2-info')) aside.appendChild(aSavoir);
    }
    var onglets = bas.querySelector('.v13-onglets');
    var v = new IA.Visionneuse(bas.querySelector('.v13-pdf'), {
      documents: liste, compact: true,
      surConstat: function (d, k, n) { var i = liste.indexOf(d); if (analyses[i] && v.vue === 'admin') analyses[i].activer(n); }
    });
    analyses.forEach(function (a) { a.surClic = function (n) { if (v.vue !== 'admin') v.changerVue('admin'); v.activer(n); }; });
    function montrer(i) {
      courant = i;
      cartesDocs.forEach(function (c, j) { c.hidden = j !== i; });
      onglets.querySelectorAll('button').forEach(function (b, j) {
        b.classList.toggle('v13-onglet-actif', j === i);
        b.setAttribute('aria-selected', j === i);
      });
      if (v.index !== i) v.afficher(i);
    }
    function majOnglets() {
      onglets.querySelectorAll('button').forEach(function (b, j) {
        var fini = docFini(j);
        b.querySelector('.v13-o-etat').innerHTML = ui4.icone(fini ? 'decide' : 'attente');
        b.classList.toggle('v13-onglet-fini', fini);
      });
      var restants = liste.filter(function (x, j) { return !docFini(j); }).length;
      bas.querySelector('.v13-docs-nb').innerHTML = '(' + liste.length + ')' +
        (liste.length > 1 ? ' · ' + (restants ? restants + ' à traiter' : '<span class="ia2-vert">tous traités</span>') : '');
    }
    liste.forEach(function (d, i) {
      var problemes = IA.constatsVisibles(d, 'admin').filter(function (k) { return k.probleme || k.type === 'a-verifier'; }).length;
      var b = o.el('<button type="button" role="tab" class="v13-onglet"><span class="v13-o-num">' + (i + 1) + '</span>' +
        '<span class="v13-o-nom">' + e(d.sousType) + '</span>' +
        (d.note ? '<span class="v13-o-note v13-note-' + (d.note.valeur >= d.note.seuil ? 'ok' : 'ko') + '" title="Note de l’IA">' + d.note.valeur + '/20</span>' : '') +
        (problemes ? '<span class="v13-o-pb" title="Points à corriger ou à vérifier">' + problemes + '</span>' : '') +
        '<span class="v13-o-etat"></span></button>');
      b.addEventListener('click', function () { montrer(i); });
      onglets.appendChild(b);
    });
    IA.on('decision', function () { if (document.contains(onglets)) majOnglets(); });
    majOnglets();
    montrer(0);
    var suivante = IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0];
    pied.innerHTML = '<span class="v13-etat"></span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia4-btn ia4-principal" data-a="suivante">' + (suivante ? 'Section suivante <i class="fa fa-chevron-right"></i>' : 'Dossier') + '</button>';
    function etat() {
      var reste = IA.ui3.reste(s).length;
      pied.querySelector('.v13-etat').innerHTML = reste ? ui4.icone('attente') + ' ' + reste + ' proposition(s) à décider dans cette section'
        : '<span class="ia2-vert">' + ui4.icone('decide') + ' Section traitée</span>';
    }
    etat();
    IA.on('decision', function () { if (fen && fen.courant === s && document.contains(pied)) etat(); });
    pied.onclick = function (ev) {
      if (ev.target.closest('[data-a="suivante"]')) afficher(IA.ui2.ordre().filter(function (x) { return x !== s && !IA.progressionSection(x).finie; })[0] || 'dossier');
    };
  }
})();
