/*
 * Prototype 13 — les propositions de l'IA DANS les cases de Feel Francais.
 *
 * Retours de Renveer (29/09) : moins de clics, moins de texte, rien a ouvrir.
 *   - Chaque proposition est deja posee dans la case de Feel Francais (en mauve,
 *     la couleur de l'IA) : Statut, Texte a l'etudiant, campus message, dates du
 *     cursus, commentaire staff, etapes Visa, verdict et « Commentaire general »
 *     de chaque section, verdict et commentaire de chaque document.
 *   - Sous la case : la SOURCE (d'ou l'IA tire l'information), puis Accepter /
 *     Refuser. Pour modifier, on ecrit directement dans la case.
 *   - Rien n'est envoye tant que Perle n'a pas accepte (la case est pre-remplie
 *     sans declencher leur enregistrement ; « Accepter » le declenche).
 *   - L'analyse d'un document s'ouvre la ou Perle clique deja : l'apercu du
 *     document de Feel Francais (leur fenetre « Aperçu du document »), avec a
 *     droite Note · Analyse · Verdict · Commentaire de l'etudiant · Commentaire.
 *   - Au-dessus des documents : une carte par etape (note, pieces recues,
 *     conformes, coherence) et « Voir le detail » = ce qui fait baisser la note.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var controles = {};  // nom du document -> controle (partage page + apercu)

  IA.on('pret', function () {
    if (!IA.dossier) return notifications();
    // Au-dessus des documents : seulement les cartes des etapes (les incoherences
    // sont dans « Voir le detail » de chaque carte).
    var bloc = IA.blocDocuments();
    bloc.parentNode.insertBefore(bandeauEtapes(), bloc);
    IA.dossier.champs.forEach(proposerChamp);
    proposerCampusFrance();
    (IA.dossier.etapesVisa || []).forEach(proposerEtape);
    IA.analysees().forEach(function (s) {
      marquer(s);
      proposerSection(s);
      docs(s).forEach(function (d, i) { proposerDocument(s, d, i + 1, docs(s).length); });
      if (s.mauvaiseSection) poserDeplacement(s);
    });
    brancherApercu();
    ecouterBoutonsFF();
  });

  // ─── Outils ─────────────────────────────────────────────────────────────
  var ALIAS_EEF = ['eef-diploma', 'EEF-email', 'etudes-en-france-certificate'];
  function etapeDe(s) { return ALIAS_EEF.indexOf(s.alias) >= 0 ? 'eef' : 'visa'; }
  function docs(s) { return (s.documents || []).filter(function (d) { return d.el; }); }
  function verdictSection(s) { return { 'conforme': 'valide', 'a-corriger': 'invalide' }[s.statut] || null; }
  function cles(s, prefixe) { return IA.propositionsSection(s).map(function (p) { return p.cle; }).filter(function (c) { return c.indexOf(prefixe) === 0; }); }
  function existe(s, cle) { return IA.propositionsSection(s).some(function (p) { return p.cle === cle; }); }
  function dixieme(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  function jq(el) { return window.jQuery ? window.jQuery(el) : null; }
  function seuil() { return (IA.dossier.bareme || {}).seuil || 17; }
  function nomDoc(d) { return d.sousType || d.fichier; }
  function ouvrirDocument(d) {  // le geste de Perle : clic sur l'apercu du document
    var c = d.el && d.el.querySelector('.pdf-canvas');
    if (c) c.click();
  }

  // Une note de carte de Feel Francais (commentaire du document, commentaire
  // general de la section) : ouverte et pre-remplie SANS declencher leur
  // enregistrement automatique.
  function noteFF(idDoc, note) {
    var carte = document.querySelector('.doc-note-card[data-note="' + note + '"][data-doc-id="' + idDoc + '"]');
    if (!carte) return null;
    var zone = carte.querySelector('textarea');
    var etat = { cachee: carte.style.display === 'none', texte: zone.value };
    return {
      carte: carte, zone: zone,
      poser: function (texte, mauve) {
        if (texte) carte.style.display = '';
        else if (etat.cachee) carte.style.display = 'none';
        zone.value = texte || etat.texte;
        carte.classList.toggle('v13-pre', !!(mauve && texte));
      },
      restaurer: function () { carte.style.display = etat.cachee ? 'none' : ''; zone.value = etat.texte; carte.classList.remove('v13-pre'); }
    };
  }
  // Leur bouton valid / invalid : on l'encadre (proposition), sans l'activer.
  function encadrer(conteneur, selecteur, verdict) {
    conteneur.querySelectorAll(selecteur).forEach(function (b) { b.classList.remove('v13-pre-btn'); });
    if (!verdict) return;
    var b = conteneur.querySelector(selecteur + '.' + (verdict === 'valide' ? 'valid' : 'invalid'));
    if (b) b.classList.add('v13-pre-btn');
  }
  function verdictActif(conteneur, selecteur) {
    var b = conteneur.querySelector(selecteur + '.active');
    return b ? (b.classList.contains('valid') ? 'valide' : 'invalide') : null;
  }
  function remettreVerdict(conteneur, selecteur, avant, ecrire) {
    if (avant) { ecrire(avant === 'valide'); return; }
    conteneur.querySelectorAll(selecteur).forEach(function (b) { b.classList.remove('active'); });
  }

  // ─── La barre sous une case : « IA · source · Accepter / Refuser » ────────
  //   p = { source, lien?, avant?, cles(), action(a) -> instantane, refuser() -> instantane,
  //         annuler(instantane), surEtat(etat), boutons?: [[action, libelle, principal]] }
  function barre(p) {
    var el = o.el('<div class="v13-prop"></div>');
    if (p.id) el.setAttribute('data-prop', p.id);
    p.memo = p.memo || { local: null, snap: null };
    function etat() {
      var c = p.cles ? p.cles() : [];
      if (!c.length) return p.memo.local || 'attente';
      var ds = c.map(function (k) { return IA.decision(k); });
      if (!ds.every(Boolean)) return 'attente';
      return ds.every(function (d) { return d.statut === 'refuse'; }) ? 'refuse' : 'accepte';
    }
    function dessiner() {
      var x = etat();
      // Seul l'etat change : les autres classes (section, pied de commentaire…) restent.
      el.classList.remove('v13-prop-attente', 'v13-prop-accepte', 'v13-prop-refuse');
      el.classList.add('v13-prop-' + x);
      var src = p.source ? '<span class="v13-src" title="D’où l’IA tire cette proposition"><i class="fa fa-search"></i> ' + e(p.source) +
        (p.lien ? ' <a href="' + e(p.lien) + '" target="_blank" rel="noopener">voir</a>' : '') + '</span>' : '';
      var act = x === 'attente'
        ? (p.boutons || [['accepter', 'Accepter', true], ['refuser', 'Refuser']]).map(function (b) {
          return '<button type="button" class="v13-b' + (b[2] ? ' v13-b-ok' : '') + '" data-a="' + b[0] + '">' + e(b[1]) + '</button>';
        }).join('')
        : '<span class="v13-fait v13-fait-' + x + '"><i class="fa ' + (x === 'refuse' ? 'fa-times' : 'fa-check') + '"></i> ' +
          e(x === 'refuse' ? (p.libelleRefus || 'Refusé') : (p.memo.libelle || 'Accepté')) + '</span>' +
          '<button type="button" class="v13-lien" data-a="annuler">Annuler</button>';
      el.innerHTML = '<span class="v13-ia">IA</span>' + (p.avant ? '<span class="v13-avant">' + p.avant + '</span>' : '') + src +
        '<span class="v13-sep"></span><span class="v13-actions">' + act + '</span>';
      if (p.surEtat) p.surEtat(x);
    }
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'annuler') {
        p.annuler(p.memo.snap || {});
        p.memo.snap = null; p.memo.local = null; p.memo.libelle = null;
        o.toast('Annulé : la proposition est de nouveau à décider.');
      } else if (a === 'refuser') {
        p.memo.snap = p.refuser() || {}; p.memo.local = 'refuse';
      } else {
        var r = p.action(a);
        if (r === false) return;  // action impossible (ex. verdict pas encore choisi)
        p.memo.snap = r || {}; p.memo.local = 'accepte';
        p.memo.libelle = b.getAttribute('data-fait') || (a === 'accepter' ? 'Accepté' : b.textContent);
      }
      IA.emettre('decision', {});  // les autres barres du meme objet se redessinent
    });
    IA.on('decision', function () { if (document.contains(el)) dessiner(); });
    dessiner();
    return el;
  }

  // ─── Section analysee : seulement la couleur de sa bordure (plus d'etiquette :
  //     l'analyse s'ouvre en cliquant sur le document) ─────────────────────────
  function marquer(s) {
    s.el.classList.add('ia2-sec', 'ia2-' + s.statut);
    function maj() { s.el.classList.toggle('ia2-fini', IA.progressionSection(s).finie); }
    IA.on('decision', maj);
    maj();
  }

  // ─── Cases du haut de page : Statut, Texte a l'etudiant, Zone ────────────
  function valeurChamp(champ) { return champ.value; }
  function poserChamp(champ, c, valeur) {
    if (c.type === 'select' && jq(champ)) jq(champ).val(valeur).trigger('change.select2');  // affichage seulement
    else champ.value = valeur;
  }
  function placerSous(champ, el, apres) {
    // Case dans une colonne etroite (dates du cursus) : la barre passe sous la ligne entiere.
    var ligne = champ.closest('.row');
    if (ligne && champ.parentNode.getBoundingClientRect().width < 420) ligne.parentNode.insertBefore(el, ligne.nextSibling);
    else (apres || champ).parentNode.insertBefore(el, (apres || champ).nextSibling);
  }
  function proposerChamp(c) {
    var champ = document.querySelector(c.selecteur);
    if (!champ) return;
    var cle = 'champ:' + c.cle;
    var avant = champ.value;
    var s2 = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2') ? champ.nextElementSibling : null;
    var cadre = s2 ? (s2.querySelector('.select2-selection') || s2) : champ;
    poserChamp(champ, c, c.propose);
    placerSous(champ, barre({
      id: cle, source: c.motif, lien: c.source && c.source.nom ? IA.urlDocument(c.source.nom) : null,
      cles: function () { return [cle]; },
      action: function () {
        var v = valeurChamp(champ);
        IA.ecrire.champ(c, v);  // leur enregistrement se declenche ici, pas avant
        IA.decider(cle, v === c.propose ? 'accepte' : 'modifie', v);
      },
      refuser: function () { poserChamp(champ, c, avant); IA.decider(cle, 'refuse', null); },
      annuler: function () { poserChamp(champ, c, c.propose); IA.annuler(cle); },
      surEtat: function (x) { cadre.classList.toggle('v13-pre', x === 'attente'); }
    }), s2);
  }

  // Questions-reponses Campus France, dans leur case « campus message ».
  function proposerCampusFrance() {
    var cf = IA.dossier.campusFrance;
    var champ = document.querySelector('#App_data_campusMessage');
    if (!cf || !cf.disponible || !cf.questions || !champ) return;
    var texte = cf.questions.map(function (q, i) { return (i + 1) + '. ' + q.q + '\n' + q.r; }).join('\n\n');
    var sources = [];
    cf.questions.forEach(function (q) { (q.sources || []).forEach(function (x) { if (sources.indexOf(x) < 0) sources.push(x); }); });
    var avant = champ.value;
    champ.value = texte;
    var c = { selecteur: '#App_data_campusMessage', type: 'texte' };
    var memo = { local: null, snap: null };
    placerSous(champ, barre({
      id: 'campus', source: 'Questions Campus France préparées d’après : ' + sources.join(', '), memo: memo,
      action: function () { IA.ecrire.champ(c, champ.value); },
      refuser: function () { champ.value = avant; },
      annuler: function () { champ.value = texte; },
      surEtat: function (x) { champ.classList.toggle('v13-pre', x === 'attente'); }
    }));
  }

  // ─── Etapes Visa : case cochee et date deja posees ───────────────────────
  function proposerEtape(x) {
    var cb = document.querySelector(x.case);
    var date = document.querySelector(x.date);
    if (!cb || !date) return;
    var groupe = cb.closest('.form-group') || cb.parentNode;
    var avant = { coche: cb.checked, le: date.value };
    function poser(v) { cb.checked = v.coche; date.value = v.coche ? (v.le || '') : ''; }
    poser({ coche: x.coche, le: x.le });
    groupe.parentNode.insertBefore(barre({
      id: 'visa:' + x.cle, source: x.motif,
      action: function () {
        if (jq(cb)) { jq(cb).trigger('change'); jq(date).trigger('change'); }
        o.flash(groupe);
      },
      refuser: function () { poser(avant); },
      annuler: function () { poser({ coche: x.coche, le: x.le }); },
      surEtat: function (etat) { groupe.classList.toggle('v13-pre-groupe', etat === 'attente'); }
    }), groupe.nextSibling);
  }

  // ─── Section : leur verdict encadre + leur « Commentaire general » pre-rempli ──
  function proposerSection(s) {
    var cont = s.el.querySelector('.doc-container');
    var rangee = cont.querySelector(':scope > .doc-general-messages-row');
    var entete = s.el.querySelector('.doc-general-state');
    var SEL = '.changeGeneralState';
    var verdict = verdictSection(s);
    var texte = (s.commentaireSection || {}).etudiant || '';
    var note = noteFF(s.idSection, 'general');
    var clesSec = function () { return cles(s, 'sec:' + s.alias + ':').concat(cles(s, 'alerte:')).filter(function (k) { return k.indexOf(':deplacement') < 0; }); };
    var cleV = s.statut === 'alerte' ? 'alerte:' + s.alias : 'sec:' + s.alias + ':verdict';
    function proposer() { if (note && texte) note.poser(texte, true); encadrer(entete, SEL, s.statut === 'alerte' ? null : verdict); }
    function retirer() { encadrer(entete, SEL, null); if (note) note.carte.classList.remove('v13-pre'); }
    function enregistrer(valide, statut, valeur) {
      if (valide != null) IA.ecrire.verdictSection(s, valide);
      if (note && note.zone.value.trim()) IA.ecrire.commentaire(s.idSection, 'general', note.zone.value);
      if (existe(s, cleV)) IA.decider(cleV, statut, valeur);
      if (existe(s, 'sec:' + s.alias + ':etudiant')) IA.decider('sec:' + s.alias + ':etudiant', note && note.zone.value.trim() === texte ? 'accepte' : 'modifie', note ? note.zone.value : null);
      if (existe(s, 'sec:' + s.alias + ':interne')) IA.decider('sec:' + s.alias + ':interne', 'refuse', null);
    }
    var p = {
      id: 'sec:' + s.alias,
      source: docs(s).length > 1 ? 'd’après les ' + docs(s).length + ' documents de la section' : 'd’après : ' + docs(s).map(nomDoc).join(''),
      cles: clesSec,
      action: function (a) {
        var snap = { verdict: verdictActif(entete, SEL) };
        if (s.statut === 'alerte') {
          if (a === 'invalider') { IA.ecrire.verdictSection(s, false); docs(s).forEach(function (d) { IA.ecrire.verdictDocument(d, false); }); }
          enregistrer(null, a === 'garder' ? 'accepte' : 'modifie', a === 'garder' ? 'Validation conservée' : 'Passé en invalid');
        } else if (a === 'valide' || a === 'invalide') {
          enregistrer(a === 'valide', 'modifie', a);
        } else {
          enregistrer(verdict === 'valide', 'accepte', verdict);
        }
        retirer();
        return snap;
      },
      refuser: function () {
        clesSec().forEach(function (k) { IA.decider(k, 'refuse', k.indexOf('alerte:') === 0 ? 'Arbitrage reporté' : null); });
        retirer();
        if (note) note.restaurer();
      },
      annuler: function (snap) {
        if ('verdict' in snap) remettreVerdict(entete, SEL, snap.verdict, function (v) { IA.ecrire.verdictSection(s, v); });
        clesSec().forEach(function (k) { IA.annuler(k); });
        proposer();
      }
    };
    if (s.statut === 'alerte') {
      p.avant = '<b>Déjà validé par ' + e(s.humain.par) + ' le ' + e(s.humain.le.slice(0, 10)) + '.</b> ' + e(s.alerte.texte);
      p.source = null;
      p.boutons = [['garder', 'Garder la validation', true], ['invalider', 'Invalider']];
      p.libelleRefus = 'Arbitrage reporté';
    } else if (!verdict) {
      // L'IA ne tranche pas (a verifier, provisoire) : Perle choisit, en un clic.
      p.avant = s.statut === 'provisoire' ? 'Pièces encore attendues : pas de verdict pour l’instant.' : 'À vérifier : l’IA ne tranche pas.';
      p.boutons = [['valide', 'valid', true], ['invalide', 'invalid']];
    } else {
      p.avant = 'Verdict proposé : <span class="v13-verdict v13-verdict-' + verdict + '">' + (verdict === 'valide' ? 'valid' : 'invalid') + '</span>';
    }
    proposer();
    var el = barre(p);
    el.classList.add('v13-prop-section');
    // Un seul bloc : leur « Commentaire general » pre-rempli, et juste dessous,
    // colles a lui, le verdict propose, la source et Accepter / Refuser.
    // Sans commentaire propose : le bloc se pose sous l'en-tete de la section.
    if (note && texte) {
      note.carte.classList.add('v13-attache');
      note.carte.insertAdjacentElement('afterend', el);
      el.classList.add('v13-prop-pied');
    } else {
      entete.insertAdjacentElement('afterend', el);
    }
  }

  // ─── Document : RIEN sur la page. Le verdict et le commentaire proposes
  //     n'apparaissent que dans l'apercu du document, et ne s'acceptent que la.
  function proposerDocument(s, d, rang, total) {
    var boutons = d.el.querySelector('.doc-info-buttons');
    var SEL = '.changeState';
    var texte = (d.commentaire || {}).etudiant || '';
    var note = noteFF(d.id, 'staff');
    var ctrl = controles[d.nom] = { s: s, d: d, note: note, texte: texte, brouillon: texte,
      choix: d.verdict === 'a-verifier' ? null : d.verdict, rang: rang, total: total };
    var clesD = function () { return cles(s, 'doc:' + d.nom + ':'); };
    ctrl.choisir = function (v) { ctrl.choix = v; };
    ctrl.p = {
      id: 'doc:' + d.nom,
      memo: { local: null, snap: null },
      cles: clesD,
      action: function (a) {
        if (a === 'valide' || a === 'invalide') ctrl.choix = a;
        if (!ctrl.choix) { o.toast('Choisissez d’abord valid ou invalid.'); return false; }
        var snap = { verdict: verdictActif(boutons, SEL) };
        var com = (ctrl.brouillon || '').trim();
        // Seul leur bouton valid / invalid est ecrit sur la page. « Commentaire du
        // staff » reste a Perle : l'IA n'y ecrit jamais (le commentaire reste dans l'apercu).
        IA.ecrire.verdictDocument(d, ctrl.choix === 'valide');
        if (existe(s, 'doc:' + d.nom + ':verdict')) IA.decider('doc:' + d.nom + ':verdict', ctrl.choix === d.verdict ? 'accepte' : 'modifie', ctrl.choix);
        if (existe(s, 'doc:' + d.nom + ':etudiant')) IA.decider('doc:' + d.nom + ':etudiant', com === texte ? 'accepte' : 'modifie', com || null);
        if (existe(s, 'doc:' + d.nom + ':interne')) IA.decider('doc:' + d.nom + ':interne', 'refuse', null);
        return snap;
      },
      refuser: function () { clesD().forEach(function (k) { IA.decider(k, 'refuse', null); }); },
      annuler: function (snap) {
        if ('verdict' in snap) remettreVerdict(boutons, SEL, snap.verdict, function (v) { IA.ecrire.verdictDocument(d, v); });
        clesD().forEach(function (k) { IA.annuler(k); });
      }
    };
    // L'IA ne tranche pas sur ce document : Perle choisit directement, en un clic.
    if (!ctrl.choix) ctrl.p.boutons = [['valide', 'valid', true], ['invalide', 'invalid']];
  }

  // ─── Analyse du document dans LEUR apercu (« Aperçu du document ») ───────
  function brancherApercu() {
    if (!window.jQuery) return;
    var $ = window.jQuery;
    $(document).on('shown.bs.modal', '#pdfModal', function () {
      var src = ($('#pdfModalFrame').attr('src') || '').split('/').pop();
      var ctrl = controles[decodeURIComponent(src)];
      if (!ctrl) return;
      var modal = this;
      modal.classList.add('v13-apercu-actif');
      var corps = modal.querySelector('.modal-body');
      var bloc = o.el('<div class="v13-apercu"><div class="v13-ap-pdf"></div><aside class="v13-ap-ia"></aside></div>');
      corps.appendChild(bloc);
      dessinerPdf(ctrl, bloc.querySelector('.v13-ap-pdf'));
      bloc.querySelector('.v13-ap-ia').appendChild(panneauAnalyse(ctrl));
    });
    $(document).on('hidden.bs.modal', '#pdfModal', function () {
      this.classList.remove('v13-apercu-actif');
      this.querySelectorAll('.v13-apercu').forEach(function (x) { x.remove(); });
    });
  }
  // PDF : surlignages seulement la ou il y a quelque chose a corriger ou a verifier.
  function dessinerPdf(ctrl, zone) {
    var tous = IA.constatsVisibles(ctrl.d, 'admin');
    var cadres = [];
    tous.forEach(function (k, i) {
      var t = o.typeConstat(k);
      if (t === 'probleme' || t === 'a-verifier') cadres.push({ rect: k.rect, numero: i + 1, teinte: t, titre: k.texte });
    });
    IA.rendrePage(IA.urlDocument(ctrl.d.nom), cadres, zone, Math.max(420, zone.clientWidth - 40), function () {}, false);
  }
  function panneauAnalyse(ctrl) {
    var d = ctrl.d, s = ctrl.s, n = d.note;
    var p = o.el('<div class="v13-ap-panneau"></div>');
    var titre = o.el('<div class="v13-ap-titre">' + e(nomDoc(d)) + (ctrl.total > 1 ? ' <span class="v13-ap-rang">' + ctrl.rang + ' / ' + ctrl.total + '</span>' : '') + '</div>');
    p.appendChild(titre);
    function partie(nom, html) { var x = o.el('<section class="v13-ap-partie"><h4>' + nom + '</h4>' + (html || '') + '</section>'); p.appendChild(x); return x; }
    if (n) partie('Note', '<div class="v13-note v13-note-grande v13-note-' + (n.valeur >= n.seuil ? 'ok' : 'ko') + '">' + n.valeur + '<small>/20</small></div>');
    var tous = IA.constatsVisibles(d, 'admin');
    partie('Analyse', '<ol class="v13-ap-constats">' + tous.map(function (k, i) {
      return '<li class="v13-c-' + o.typeConstat(k) + '"><span class="v13-c-num">' + (i + 1) + '</span>' + e(k.texte) + '</li>';
    }).join('') + '</ol>');
    var verdict = partie('Verdict', '<div class="v13-seg"><button type="button" data-v="valide"><i class="fa fa-check"></i> valid</button>' +
      '<button type="button" data-v="invalide"><i class="fa fa-times"></i> invalid</button></div>');
    function majVerdict() {
      verdict.querySelectorAll('[data-v]').forEach(function (b) {
        var v = b.getAttribute('data-v');
        b.classList.toggle('v13-choisi', v === ctrl.choix);
        b.innerHTML = (v === 'valide' ? '<i class="fa fa-check"></i> valid' : '<i class="fa fa-times"></i> invalid') + (v === d.verdict ? ' <span class="v13-ia v13-ia-mini">IA</span>' : '');
      });
    }
    verdict.addEventListener('click', function (ev) { var b = ev.target.closest('[data-v]'); if (b) { ctrl.choisir(b.getAttribute('data-v')); majVerdict(); } });
    majVerdict();
    var r = s.reponseEtudiant;
    if (r && ctrl.rang === ctrl.total) partie('Commentaire de l’étudiant', '<blockquote class="v13-ap-mot">« ' + e(r.texte) + ' »</blockquote>');
    var com = partie('Commentaire', '<textarea rows="4" placeholder="Aucun commentaire proposé"></textarea>');
    var zone = com.querySelector('textarea');
    zone.value = ctrl.brouillon;  // la proposition, ou la version de Perle
    zone.addEventListener('input', function () { ctrl.brouillon = zone.value; });
    var b = barre(ctrl.p);
    b.classList.add('v13-prop-ap');
    p.appendChild(b);
    return p;
  }

  // Perle clique directement sur LEURS boutons valid / invalid : c'est sa decision.
  function ecouterBoutonsFF() {
    document.addEventListener('click', function (ev) {
      if (!ev.isTrusted) return;  // nos propres clics (Accepter) sont deja comptes
      var b = ev.target.closest('.changeState');
      if (!b) return;
      var v = b.classList.contains('valid') ? 'valide' : 'invalide';
      IA.analysees().forEach(function (s) {
        if (!s.el.contains(b)) return;
        if (b.classList.contains('changeGeneralState')) {
          var k = s.statut === 'alerte' ? 'alerte:' + s.alias : 'sec:' + s.alias + ':verdict';
          if (existe(s, k)) IA.decider(k, 'modifie', v);
          encadrer(s.el.querySelector('.doc-general-state'), '.changeGeneralState', null);
        } else {
          docs(s).forEach(function (d) {
            if (!d.el.contains(b)) return;
            var ctrl = controles[d.nom];
            if (ctrl) ctrl.choix = v;
            if (existe(s, 'doc:' + d.nom + ':verdict')) IA.decider('doc:' + d.nom + ':verdict', 'modifie', v);
          });
        }
      });
    }, true);
  }

  // ─── Document mal place : de → vers, puis Deplacer / Annuler ─────────────
  function poserDeplacement(s) {
    var m = s.mauvaiseSection;
    var d = docs(s)[0];
    if (!m || !d) return;
    var cle = 'sec:' + s.alias + ':deplacement';
    var liens = Array.prototype.slice.call(d.el.querySelectorAll('.doc-info-actions .dropdown-menu a'));
    function aliasDe(a) { return a.textContent.replace(/\s*\|\s*$/, '').trim(); }
    var badge = null;
    var el = barre({
      id: 'dep:' + s.alias,
      avant: '<b>Document mal placé :</b> ' + e(m.sectionActuelle || IA.ui2.nom(s)) + ' <i class="fa fa-long-arrow-right"></i> <b>' + e(m.sectionProposee) + '</b>',
      source: m.motifCourt || m.motif,
      cles: function () { return [cle]; },
      boutons: [['deplacer', 'Déplacer', true], ['refuser', 'Annuler']],
      libelleRefus: 'Laissé ici',
      action: function () {
        var lien = liens.filter(function (x) { return aliasDe(x) === m.aliasPropose; })[0];
        if (lien) lien.click();  // leur menu ⇄ : le document change de section
        badge = o.el('<span class="v13-deplace"><i class="fa fa-arrows"></i> Déplacé vers « ' + e(m.sectionProposee) + ' » · analyse relancée</span>');
        var meta = d.el.querySelector('.doc-info-meta');
        if (meta) meta.appendChild(badge);
        IA.decider(cle, 'accepte', m.aliasPropose);
      },
      refuser: function () { IA.decider(cle, 'refuse', 'Laissé dans cette section'); },
      annuler: function () { if (badge) { badge.remove(); badge = null; } IA.annuler(cle); }
    });
    el.classList.add('v13-prop-dep');
    var grille = d.el.closest('.doc-docs-grid') || d.el;
    grille.parentNode.insertBefore(el, grille);
  }

  // ─── Une carte par etape : note, pieces recues, conformes, coherence ──────
  function bandeauEtapes() {
    var dos = IA.dossier;
    var b = o.el('<div class="v13-etapes"></div>');
    function carte(cle, nom, icone) {
      var c = o.el('<div class="v13-etape"></div>');
      var tete = '<div class="v13-e-tete"><span class="v13-e-icone"><i class="fa ' + icone + '"></i></span><span class="v13-e-nom">' + nom + '</span>';
      if (cle === 'eef' && !dos.eef) {
        c.classList.add('v13-etape-sans');
        c.innerHTML = tete + '</div><div class="v13-e-vide">Pas d’étape Études en France pour la zone ' + e((dos.bareme || {}).zone || '') + '.</div>';
        return c;
      }
      var sections = IA.sections().filter(function (s) { return s.el && etapeDe(s) === cle && s.statut !== 'optionnel'; });
      var analysees = sections.filter(function (s) { return s.statut !== 'humain'; });
      var humaines = sections.filter(function (s) { return s.statut === 'humain'; });
      var analyses = [];
      analysees.forEach(function (s) { docs(s).forEach(function (d) { if (d.note) analyses.push(d); }); });
      if (!analyses.length) {
        var h = humaines[0];
        c.classList.add('v13-etape-ok');
        c.innerHTML = tete + '<span class="v13-pill v13-pill-ok">Validée</span></div><div class="v13-e-vide"><i class="fa fa-user"></i> Validée par ' +
          e(h ? h.humain.par : 'l’équipe') + (h ? ' le ' + e(h.humain.le.slice(0, 10)) : '') + '. Rien à analyser.</div>';
        return c;
      }
      var moy = analyses.reduce(function (a, d) { return a + d.note.valeur; }, 0) / analyses.length / 2;
      var sl = seuil() / 2;
      var niveau = moy >= sl ? ['ok', 'Bonne qualité', 'fa-check'] : moy >= 6 ? ['moyen', 'À améliorer', 'fa-exclamation-triangle'] : ['ko', 'À reprendre', 'fa-times'];
      var attendus = cle === 'visa' ? (dos.attendus || []) : [];
      var recues = analyses.length + humaines.length;
      var conformes = analyses.filter(function (d) { return d.verdict === 'valide' && d.note.valeur >= d.note.seuil; }).length + humaines.length;
      var crois = [];
      analysees.forEach(function (s) { (s.croisements || []).forEach(function (x) { crois.push(x); }); });
      var coherents = crois.filter(function (x) { return x.resultat === 'coherent'; }).length;
      function ligne(libelle, a, bb, aide) {
        var pct = bb ? Math.round(a / bb * 100) : 100;
        var t = pct >= 90 ? 'ok' : pct >= 60 ? 'moyen' : 'ko';
        return '<div class="v13-e-ligne" title="' + e(aide) + '"><span class="v13-e-lib">' + libelle + '</span><span class="v13-e-barre"><span class="v13-e-rempli v13-e-' + t +
          '" style="width:' + pct + '%"></span></span><span class="v13-e-val">' + a + '<small>/' + bb + '</small></span></div>';
      }
      // Ce qui fait baisser la note : les documents sous le seuil ou pas encore conformes.
      var baisses = analyses.filter(function (d) { return d.note.valeur < d.note.seuil || d.verdict !== 'valide'; })
        .sort(function (x, y) { return x.note.valeur - y.note.valeur; });
      c.classList.add('v13-etape-' + niveau[0]);
      c.innerHTML = tete + '<span class="v13-pill v13-pill-' + niveau[0] + '"><i class="fa ' + niveau[2] + '"></i> ' + niveau[1] + '</span></div>' +
        '<div class="v13-e-note v13-note-' + niveau[0] + '">' + dixieme(moy) + '<small>/10</small></div>' +
        ligne('Pièces reçues', recues, recues + attendus.length, 'Pièces déposées, sur celles demandées pour cette étape') +
        ligne('Pièces conformes', conformes, recues, 'Pièces valides selon l’IA ou déjà validées par Perle') +
        (crois.length ? ligne('Cohérence entre pièces', coherents, crois.length, 'Vérifications croisées entre documents sans contradiction') : '') +
        '<button type="button" class="v13-e-detail" aria-expanded="false"><i class="fa fa-info-circle"></i> Voir le détail <i class="fa fa-chevron-right v13-e-chevron"></i></button>' +
        '<div class="v13-e-liste" hidden>' +
        (baisses.length ? '<div class="v13-e-titre">Ce qui fait baisser la note</div>' + baisses.map(function (d) {
          var k = d.note.pertes[0] || (d.constats || []).filter(function (x) { return x.probleme || x.type === 'a-verifier'; })[0] || {};
          var t = d.note.valeur >= d.note.seuil ? 'moyen' : 'ko';
          return '<button type="button" class="v13-e-item" data-doc="' + e(d.nom) + '"><span class="v13-e-item-note v13-note-' + t + '">' + d.note.valeur + '/20</span>' +
            '<span><b>' + e(nomDoc(d)) + '</b><small>' + e(k.texte || '') + '</small></span></button>';
        }).join('') : '<div class="v13-e-titre">Tous les documents analysés sont au-dessus du seuil.</div>') +
        (attendus.length ? '<div class="v13-e-titre">Pas encore reçu</div>' + attendus.map(function (x) {
          return '<div class="v13-e-item v13-e-manque"><i class="fa fa-hourglass-half"></i><span><b>' + e(x.section) + '</b><small>' + e(x.piece) + '</small></span></div>';
        }).join('') : '') +
        (crois.length > coherents ? '<div class="v13-e-titre">Incohérences</div>' + crois.filter(function (x) { return x.resultat !== 'coherent'; }).map(function (x) {
          return '<div class="v13-e-item v13-e-manque"><i class="fa fa-link"></i><span><b>' + e(x.titre) + '</b><small>' + e(x.a.valeur) + ' ≠ ' + e(x.b.valeur) + '</small></span></div>';
        }).join('') : '') + '</div>';
      c.querySelector('.v13-e-detail').addEventListener('click', function () {
        var l = c.querySelector('.v13-e-liste');
        l.hidden = !l.hidden;
        this.setAttribute('aria-expanded', !l.hidden);
        c.classList.toggle('v13-etape-ouverte', !l.hidden);
      });
      c.querySelector('.v13-e-liste').addEventListener('click', function (ev) {
        var it = ev.target.closest('[data-doc]');
        if (it && controles[it.getAttribute('data-doc')]) ouvrirDocument(controles[it.getAttribute('data-doc')].d);
      });
      return c;
    }
    b.appendChild(carte('eef', 'Études en France', 'fa-graduation-cap'));
    b.appendChild(carte('visa', 'Visa Center', 'fa-university'));
    return b;
  }

  // ─── Notifications : l'etat de l'analyse de chaque dossier ───────────────
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
})();
