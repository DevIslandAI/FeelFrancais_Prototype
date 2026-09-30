/*
 * Moteur du prototype 13 (et de ses variantes de presentation 14 a 17) :
 * les propositions de l'IA DANS les cases de Feel Francais.
 *
 *   IA.v13.demarrer(options)  — options de PRESENTATION seulement :
 *     style         nom ajoute en classe sur <html> (v13-style-<nom>) pour le CSS
 *     icones        Accepter / Refuser en icones ✓ ✕ collees a la case
 *     analyseMarge  dans l'apercu, l'analyse est ecrite dans la marge du PDF
 *     apresPret(api) appele une fois tout pose (guide pas a pas, tableau…)
 *   Les fonctionnalites sont les memes pour toutes les variantes.
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
  var OPTS = {};

  function lancer() {
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
    });
    toutAccepter();
    brancherApercu();
    ecouterBoutonsFF();
    if (OPTS.apresPret) OPTS.apresPret(api());
  }

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
  // Les PREUVES : les documents d'ou l'IA tire une proposition. Un clic les ouvre
  // dans leur apercu (avec l'analyse de l'IA quand le document en a une).
  var NOMS_FICHIERS = { 'enrollment-letter': 'Lettre d’inscription', passport: 'Passeport' };
  function trouverDoc(nom) {
    var r = null;
    IA.dossier.sections.forEach(function (s) { (s.documents || []).forEach(function (d) { if (d.nom === nom) r = d; }); });
    return r;
  }
  function libelleDoc(nom, fichier) { var d = trouverDoc(nom); return d ? nomDoc(d) : (NOMS_FICHIERS[fichier] || fichier || nom); }
  function preuve(nom, fichier) { return nom ? { nom: nom, libelle: libelleDoc(nom, fichier) } : null; }
  function ouvrirPreuve(nom) {
    if (controles[nom]) return ouvrirDocument(controles[nom].d);
    var item = Array.prototype.filter.call(document.querySelectorAll('.doc-orginal-name'), function (x) { return x.textContent.trim() === nom; })[0];
    var canvas = item && item.closest('.doc-item') && item.closest('.doc-item').querySelector('.pdf-canvas');
    if (canvas) return canvas.click();  // leur apercu du document
    window.open(IA.urlDocument(nom), '_blank', 'noopener');
  }
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
  var ICONES_B = { accepter: '<i class="fa fa-check"></i>', refuser: '<i class="fa fa-times"></i>', deplacer: '<i class="fa fa-arrows"></i>' };
  function court(x, n) { x = String(x || '').replace(/\s+/g, ' ').trim(); return x.length > n ? x.slice(0, n - 1) + '…' : x; }
  function etatDe(p) {
    p.memo = p.memo || { local: null, snap: null };
    var c = p.cles ? p.cles() : [];
    if (!c.length) return p.memo.local || 'attente';
    var ds = c.map(function (k) { return IA.decision(k); });
    if (!ds.every(Boolean)) return 'attente';
    return ds.every(function (d) { return d.statut === 'refuse'; }) ? 'refuse' : 'accepte';
  }
  // Le geste sur une proposition (bouton de sa barre, ou « Tout accepter »).
  function agir(p, a, fait) {
    p.memo = p.memo || { local: null, snap: null };
    if (a === 'annuler') {
      p.annuler(p.memo.snap || {});
      p.memo.snap = null; p.memo.local = null; p.memo.libelle = null;
    } else if (a === 'refuser') {
      p.memo.snap = p.refuser() || {}; p.memo.local = 'refuse';
    } else {
      var r = p.action(a);
      if (r === false) return false;  // action impossible (ex. verdict pas encore choisi)
      p.memo.snap = r || {}; p.memo.local = 'accepte';
      p.memo.libelle = fait || 'Accepté';
    }
    IA.emettre('decision', {});  // les autres barres du meme objet se redessinent
    return true;
  }
  function preuvesHtml(liste) {
    return (liste || []).filter(Boolean).map(function (x) {
      return '<button type="button" class="v13-preuve" data-preuve="' + e(x.nom) + '" title="Ouvrir ce document"><i class="fa fa-file-pdf-o"></i> ' + e(x.libelle) + '</button>';
    }).join('');
  }
  // Apres la decision : la meme ligne partout (case du haut, section, apercu).
  function faitHtml(teinte, titre, details) {
    return '<div class="v13-f"><span class="v13-f-icone v13-f-' + teinte + '"><i class="fa ' + (teinte === 'ko' || teinte === 'refuse' ? 'fa-times' : 'fa-check') + '"></i></span>' +
      '<span class="v13-f-txt"><b>' + titre + '</b>' + (details ? '<small>' + details + '</small>' : '') + '</span>' +
      '<button type="button" class="v13-annuler" data-a="annuler" title="Revenir à la suggestion de l’IA"><i class="fa fa-undo"></i> Annuler</button></div>';
  }
  function barre(p) {
    var el = o.el('<div class="v13-prop"></div>');
    if (p.id) el.setAttribute('data-prop', p.id);
    if (p.libelle) el.setAttribute('data-libelle', p.libelle);
    if (p.resume) el.setAttribute('data-resume', p.resume);
    p.memo = p.memo || { local: null, snap: null };
    function dessiner() {
      var x = etatDe(p);
      // Seul l'etat change : les autres classes (section, pied de commentaire…) restent.
      el.classList.remove('v13-prop-attente', 'v13-prop-accepte', 'v13-prop-refuse');
      el.classList.add('v13-prop-' + x);
      if (x !== 'attente') {
        var f = p.fait ? p.fait(x) : {
          teinte: x === 'refuse' ? 'refuse' : 'ok',
          titre: x === 'refuse' ? (p.libelleRefus || 'Suggestion refusée') : 'Suggestion acceptée',
          details: [p.libelle, x === 'refuse' ? 'la case est revenue comme avant' : p.resume].filter(Boolean).join(' · ')
        };
        el.innerHTML = faitHtml(f.teinte, e(f.titre), e(f.details || ''));
        if (p.surEtat) p.surEtat(x);
        return;
      }
      var preuves = preuvesHtml(p.preuves);
      var src = p.source || preuves ? '<span class="v13-src" title="D’où l’IA tire cette proposition"><i class="fa fa-search"></i> ' + e(p.source || 'Preuve :') +
        (preuves ? ' <span class="v13-preuves">' + preuves + '</span>' : '') + '</span>' : '';
      var act = (p.boutons || [['accepter', 'Accepter', true], ['refuser', 'Refuser']]).map(function (b) {
        var icone = OPTS.icones && ICONES_B[b[0]];
        return '<button type="button" class="v13-b' + (b[2] ? ' v13-b-ok' : '') + (icone ? ' v13-b-icone' : '') + '" data-a="' + b[0] + '" title="' + e(b[1]) + '">' +
          (icone || e(b[1])) + '</button>';
      }).join('');
      el.innerHTML = '<span class="v13-ia">IA</span>' + (p.avant ? '<span class="v13-avant">' + p.avant + '</span>' : '') + src +
        '<span class="v13-sep"></span><span class="v13-actions">' + act + '</span>';
      if (p.surEtat) p.surEtat(x);
    }
    el.addEventListener('click', function (ev) {
      var pr = ev.target.closest('[data-preuve]');
      if (pr) { ouvrirPreuve(pr.getAttribute('data-preuve')); return; }
      var b = ev.target.closest('[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (agir(p, a, b.getAttribute('data-fait') || (a === 'accepter' ? 'Accepté' : b.textContent.trim())) && a === 'annuler') {
        o.toast('Annulé : la suggestion est de nouveau à décider.');
      }
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
    var pc;
    placerSous(champ, barre(pc = {
      id: cle, libelle: c.libelle, resume: court(c.proposeLibelle || c.propose, 90), source: c.motif,
      preuves: [c.source ? preuve(c.source.nom, c.source.fichier) : null],
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
    inscrire(pc);
  }
  function inscrire(p) {
    registre.push({ attente: function () { return etatDe(p) === 'attente'; }, accepter: function () { agir(p, 'accepter'); }, annuler: function () { agir(p, 'annuler'); } });
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
    var pc;
    placerSous(champ, barre(pc = {
      id: 'campus', libelle: 'Q/R Campus France', resume: cf.questions.length + ' questions numérotées', source: 'Questions Campus France préparées d’après : ' + sources.join(', '), memo: memo,
      action: function () { IA.ecrire.champ(c, champ.value); },
      refuser: function () { champ.value = avant; },
      annuler: function () { champ.value = texte; },
      surEtat: function (x) { champ.classList.toggle('v13-pre', x === 'attente'); }
    }));
    inscrire(pc);
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
    var pc;
    groupe.parentNode.insertBefore(barre(pc = {
      id: 'visa:' + x.cle, libelle: 'Visa · ' + x.libelle, resume: x.coche ? 'Cocher · ' + (x.le || '') : 'Laisser décoché', source: x.motif,
      preuves: [x.source ? preuve(x.source.nom, x.source.fichier) : null],
      action: function () {
        if (jq(cb)) { jq(cb).trigger('change'); jq(date).trigger('change'); }
        o.flash(groupe);
      },
      refuser: function () { poser(avant); },
      annuler: function () { poser({ coche: x.coche, le: x.le }); },
      surEtat: function (etat) { groupe.classList.toggle('v13-pre-groupe', etat === 'attente'); }
    }), groupe.nextSibling);
    inscrire(pc);
  }

  // ─── Section : une carte « Analyse IA », le MEME format dans tous les cas ──
  //   (verdict seul, verdict + commentaire, verdict + document a deplacer, alerte,
  //   l'IA ne tranche pas). Pas d'Accepter / Refuser : Perle confirme avec LEURS
  //   boutons valid / invalid ; celui que l'IA suggere est mis en evidence.
  //   La carte dit POURQUOI (le resume de l'analyse) et sur quels documents.
  var CAS = {
    valide: { icone: 'fa-check', teinte: 'ok', titre: 'Section conforme' },
    invalide: { icone: 'fa-times', teinte: 'ko', titre: 'Section à corriger' },
    alerte: { icone: 'fa-exclamation-triangle', teinte: 'alerte', titre: 'Validation à revoir' },
    indecis: { icone: 'fa-exclamation', teinte: 'indecis', titre: 'L’IA ne peut pas trancher' }
  };
  var sectionsIA = {};  // alias -> controle de la carte (leurs boutons, « Tout accepter »)
  var registre = [];    // toutes les suggestions de la page, pour « Tout accepter »
  function miniBouton(v) { return '<span class="v13-mini v13-mini-' + v + '">' + (v === 'valide' ? 'valid' : 'invalid') + '</span>'; }

  function proposerSection(s) {
    var entete = s.el.querySelector('.doc-general-state');
    var SEL = '.changeGeneralState';
    var alerte = s.statut === 'alerte';
    var verdict = alerte ? 'invalide' : verdictSection(s);
    var cas = CAS[alerte ? 'alerte' : (verdict || 'indecis')];
    var texte = (s.commentaireSection || {}).etudiant || '';
    var note = noteFF(s.idSection, 'general');
    var cleV = alerte ? 'alerte:' + s.alias : 'sec:' + s.alias + ':verdict';
    var clesSec = function () { return cles(s, 'sec:' + s.alias + ':').concat(cles(s, 'alerte:' + s.alias)).filter(function (k) { return k.indexOf(':deplacement') < 0; }); };
    var dep = s.mauvaiseSection ? deplacement(s) : null;
    var pourquoi = alerte ? s.alerte.texte : s.resume;
    var preuves = docs(s).map(function (d) { return preuve(d.nom); });
    var x0 = (s.croisements || [])[0];
    if (alerte && x0) preuves = [preuve(x0.a.nom, x0.a.fichier), preuve(x0.b.nom, x0.b.fichier)];
    var sous = alerte ? 'Validée par ' + e((s.humain || {}).par || 'Perle') + ((s.humain || {}).le ? ' le ' + e(s.humain.le.slice(0, 5)) : '') + ' · nouvelle incohérence'
      : !verdict ? (s.statut === 'provisoire' ? 'Pièces encore attendues · décision humaine requise' : 'Décision humaine requise') : '';
    var memo = { snap: null, com: false };
    var carte = o.el('<div class="v13-carte v13-carte-' + cas.teinte + '"></div>');
    carte.setAttribute('data-prop', 'sec:' + s.alias);
    carte.setAttribute('data-libelle', 'Section · ' + IA.ui2.nom(s));
    carte.setAttribute('data-resume', verdict ? 'Verdict ' + (verdict === 'valide' ? 'valid' : 'invalid') : 'Verdict à choisir');

    function boutonsFF() { return entete.querySelectorAll(SEL); }
    function eteindre() { boutonsFF().forEach(function (b) { b.classList.remove('v13-pre-btn', 'v13-pre-q'); }); }
    function proposer() {
      if (note && texte) note.poser(texte, true);
      eteindre();
      if (verdict) encadrer(entete, SEL, verdict);
      else boutonsFF().forEach(function (b) { b.classList.add('v13-pre-q'); });
    }
    // Perle a choisi (v = 'valide' | 'invalide') : on note sa decision ; le
    // « Commentaire general » pre-rempli est enregistre s'il va dans son sens.
    function decider(v, avant) {
      if (IA.decision(cleV)) { IA.decider(cleV, v === verdict ? 'accepte' : 'modifie', v); IA.emettre('decision', {}); return; }
      memo.snap = avant;
      var suit = !verdict || v === verdict;
      memo.com = false;
      if (note && texte) {
        if (suit && note.zone.value.trim()) { IA.ecrire.commentaire(s.idSection, 'general', note.zone.value); memo.com = true; note.carte.classList.remove('v13-pre'); }
        else note.restaurer();
      }
      clesSec().forEach(function (k) {
        if (k === cleV) IA.decider(k, v === verdict ? 'accepte' : (alerte ? 'refuse' : 'modifie'), alerte && v === 'valide' ? 'Validation conservée' : v);
        else if (/:interne$/.test(k)) IA.decider(k, 'refuse', null);
        else IA.decider(k, memo.com ? (note.zone.value.trim() === texte ? 'accepte' : 'modifie') : 'refuse', memo.com ? note.zone.value : null);
      });
      eteindre();
      IA.emettre('decision', {});
    }
    function accepter() {  // « Tout accepter » : le verdict suggere, ecrit dans leurs boutons
      if (!verdict || IA.decision(cleV)) return;
      var avant = verdictActif(entete, SEL);
      IA.ecrire.verdictSection(s, verdict === 'valide');
      decider(verdict, avant);
    }
    function garder() {  // alerte : Perle garde sa validation
      memo.snap = verdictActif(entete, SEL);
      clesSec().forEach(function (k) { IA.decider(k, 'refuse', k === cleV ? 'Validation conservée' : null); });
      if (note) note.restaurer();
      eteindre();
      IA.emettre('decision', {});
    }
    function annuler() {
      if (dep && IA.decision(dep.cle)) dep.remettre();
      remettreVerdict(entete, SEL, memo.snap, function (v) { IA.ecrire.verdictSection(s, v); });
      clesSec().forEach(function (k) { IA.annuler(k); });
      memo.snap = null; memo.com = false;
      proposer();
      IA.emettre('decision', {});
    }

    function blocDeplacement() {
      if (!dep) return '';
      var fait = IA.decision(dep.cle);
      if (fait) return '<div class="v13-c-dep v13-c-dep-fait"><i class="fa ' + (fait.statut === 'refuse' ? 'fa-times' : 'fa-check') + '"></i> <span>' +
        (fait.statut === 'refuse' ? 'Document laissé dans cette section' : 'Document déplacé vers <b>' + e(dep.m.sectionProposee) + '</b> · analyse relancée') +
        '</span><button type="button" class="v13-lien" data-c="dep-annuler">Annuler</button></div>';
      // Explicite : QUEL document, D'OU, VERS OU. La justification reste dans « Pourquoi ».
      var dd = docs(s)[0];
      return '<div class="v13-c-dep"><div class="v13-c-lbl"><i class="fa fa-exchange"></i> Document à déplacer</div>' +
        (dd ? '<button type="button" class="v13-preuve v13-dep-doc" data-preuve="' + e(dd.nom) + '" title="Ouvrir ce document"><i class="fa fa-file-pdf-o"></i> ' + e(nomDoc(dd)) + '</button>' : '') +
        '<div class="v13-dep-trajet">' +
          '<div class="v13-dep-de"><small>De</small>' + e(dep.m.sectionActuelle || IA.ui2.nom(s)) + '</div>' +
          '<span class="v13-dep-fleche"><i class="fa fa-long-arrow-right"></i></span>' +
          '<div class="v13-dep-vers"><small>Vers</small>' + e(dep.m.sectionProposee) + '</div>' +
        '</div>' +
        '<div class="v13-c-dep-act"><button type="button" class="v13-lien" data-c="dep-laisser">Laisser ici</button>' +
        '<button type="button" class="v13-b v13-b-ok" data-c="deplacer"><i class="fa fa-arrows"></i> Déplacer</button></div></div>';
    }
    function dessiner() {
      var dv = IA.decision(cleV);
      carte.classList.toggle('v13-carte-faite', !!dv);
      carte.classList.toggle('v13-prop-attente', !dv || !!(dep && !IA.decision(dep.cle)));
      if (dv) {
        var v = dv.statut === 'refuse' && alerte ? 'valide' : dv.valeur === 'valide' || dv.valeur === 'invalide' ? dv.valeur : verdict;
        var titre = alerte && dv.statut === 'refuse' ? 'Validation conservée' : 'Section ' + (v === 'valide' ? 'validée' : 'invalidée');
        var details = [dv.statut === 'accepte' ? 'Suggestion de l’IA suivie' : !verdict ? 'Votre décision' : 'Votre choix (l’IA suggérait ' + (verdict === 'valide' ? 'valid' : 'invalid') + ')'];
        if (memo.com) details.push('commentaire général enregistré');
        var dd = dep && IA.decision(dep.cle);
        if (dd) details.push(dd.statut === 'refuse' ? 'document laissé dans cette section' : 'document déplacé vers « ' + e(dep.m.sectionProposee) + ' », analyse relancée');
        carte.innerHTML = faitHtml(v === 'valide' ? 'ok' : 'ko', titre, details.join(' · ')) + (dd ? '' : blocDeplacement());
        carte.classList.add('v13-carte-' + (v === 'valide' ? 'fait-ok' : 'fait-ko'));
        carte.classList.remove(v === 'valide' ? 'v13-carte-fait-ko' : 'v13-carte-fait-ok');
        return;
      }
      var pied = verdict
        ? '<i class="fa fa-hand-o-up"></i> ' + (alerte ? 'Pour retirer la validation, cliquez sur ' + miniBouton('invalide') + ' en haut à droite' : 'Confirmez avec ' + miniBouton(verdict) + ' en haut à droite')
        : '<i class="fa fa-hand-o-up"></i> Choisissez ' + miniBouton('valide') + ' ou ' + miniBouton('invalide') + ' en haut à droite';
      var ph = preuvesHtml(preuves);
      carte.innerHTML =
        '<div class="v13-c-tete"><span class="v13-ia">IA</span> Analyse IA</div>' +
        '<div class="v13-c-titre"><span class="v13-c-icone"><i class="fa ' + cas.icone + '"></i></span>' +
          '<span><b>' + cas.titre + '</b>' + (sous ? '<small>' + sous + '</small>' : '') + '</span></div>' +
        (pourquoi ? '<div class="v13-c-pourquoi"><span class="v13-c-lbl">Pourquoi</span>' + e(pourquoi) + '</div>' : '') +
        (ph ? '<div class="v13-c-docs"><span class="v13-c-lbl"><i class="fa fa-file-pdf-o"></i> Documents analysés</span><span class="v13-preuves">' + ph + '</span></div>' : '') +
        (texte && note ? '<div class="v13-c-com"><i class="fa fa-comment-o"></i> Commentaire général pré-rempli ci-dessous (modifiable) : enregistré avec votre choix</div>' : '') +
        blocDeplacement() +
        '<div class="v13-c-pied">' + pied + (alerte ? '<button type="button" class="v13-lien" data-c="garder">Garder ma validation</button>' : '') + '</div>';
    }
    carte.addEventListener('click', function (ev) {
      var pr = ev.target.closest('[data-preuve]');
      if (pr) return ouvrirPreuve(pr.getAttribute('data-preuve'));
      var b = ev.target.closest('[data-c],[data-a]');
      if (!b) return;
      var a = b.getAttribute('data-c') || b.getAttribute('data-a');
      if (a === 'annuler') { annuler(); o.toast('Annulé : la suggestion est de nouveau à décider.'); }
      else if (a === 'garder') garder();
      else if (a === 'deplacer') { dep.deplacer(); IA.emettre('decision', {}); }
      else if (a === 'dep-laisser') { IA.decider(dep.cle, 'refuse', 'Laissé dans cette section'); IA.emettre('decision', {}); }
      else if (a === 'dep-annuler') { dep.remettre(); IA.emettre('decision', {}); }
    });
    IA.on('decision', function () { if (document.contains(carte)) dessiner(); });
    sectionsIA[s.alias] = { s: s, decider: decider };
    registre.push({ indecis: !verdict, attente: function () { return !IA.decision(cleV); }, accepter: accepter, annuler: annuler });
    if (dep) registre.push({ attente: function () { return !IA.decision(dep.cle); }, accepter: function () { dep.deplacer(); }, annuler: function () { dep.remettre(); } });
    proposer();
    entete.insertAdjacentElement('afterend', carte);
    dessiner();
  }

  // ─── Document : RIEN sur la page. Tout se passe dans l'apercu du document :
  //     Perle y ajuste l'analyse, le verdict et le commentaire, puis « Sauvegarder »
  //     (un seul bouton ; chaque partie a son « Annuler mes changements »).
  function analyseIA(d) {
    return IA.constatsVisibles(d, 'admin').map(function (k, i) { return { texte: k.texte, ia: k.texte, teinte: o.typeConstat(k), n: i, origine: 'ia' }; });
  }
  function proposerDocument(s, d, rang, total) {
    var boutons = d.el.querySelector('.doc-info-buttons');
    var SEL = '.changeState';
    var texte = (d.commentaire || {}).etudiant || '';
    var iaChoix = d.verdict === 'a-verifier' ? null : d.verdict;
    var ctrl = controles[d.nom] = { s: s, d: d, texte: texte, rang: rang, total: total, iaChoix: iaChoix,
      choix: iaChoix, brouillon: texte, analyse: analyseIA(d), enregistre: null, snapFF: null };
    var clesD = function () { return cles(s, 'doc:' + d.nom + ':'); };
    ctrl.choisir = function (v) { ctrl.choix = v; };
    ctrl.etat = function () {
      return { choix: ctrl.choix, com: (ctrl.brouillon || '').trim(), analyse: JSON.stringify(ctrl.analyse.map(function (k) { return [k.texte, k.teinte]; })) };
    };
    ctrl.modifie = function () {
      var a = ctrl.etat(), b = ctrl.enregistre;
      return !b || a.choix !== b.choix || a.com !== b.com || a.analyse !== b.analyse;
    };
    // Sauvegarder : seul leur bouton valid / invalid est ecrit sur la page. « Commentaire
    // du staff » reste a Perle : l'IA n'y ecrit jamais (le commentaire reste dans l'apercu).
    ctrl.sauver = function (depuisFF) {
      if (!ctrl.choix) { o.toast('Choisissez d’abord valid ou invalid.'); return false; }
      if (!ctrl.enregistre) ctrl.snapFF = depuisFF ? depuisFF.avant : verdictActif(boutons, SEL);
      if (!depuisFF) IA.ecrire.verdictDocument(d, ctrl.choix === 'valide');
      var com = (ctrl.brouillon || '').trim();
      clesD().forEach(function (k) {
        if (/:verdict$/.test(k)) IA.decider(k, ctrl.choix === iaChoix ? 'accepte' : 'modifie', ctrl.choix);
        else if (/:interne$/.test(k)) IA.decider(k, 'refuse', null);
        else IA.decider(k, com === texte.trim() ? 'accepte' : 'modifie', com || null);
      });
      ctrl.enregistre = ctrl.etat();
      ctrl.enregistre.le = new Date();
      IA.emettre('decision', {});
      return true;
    };
    ctrl.annulerSauvegarde = function () {
      remettreVerdict(boutons, SEL, ctrl.snapFF, function (v) { IA.ecrire.verdictDocument(d, v); });
      clesD().forEach(function (k) { IA.annuler(k); });
      ctrl.enregistre = null; ctrl.snapFF = null;
      IA.emettre('decision', {});
    };
    // « Tout accepter » : le verdict suggere pour ce document (pas quand l'IA ne tranche pas).
    registre.push({ indecis: !iaChoix, attente: function () { return !ctrl.enregistre; },
      accepter: function () { if (ctrl.choix) ctrl.sauver(); }, annuler: function () { ctrl.annulerSauvegarde(); } });
  }

  // ─── « Tout accepter » : toutes les suggestions de l'IA en un clic ────────
  //   (cases du haut, verdicts des sections et des documents, deplacements).
  //   Ce que l'IA ne tranche pas reste a Perle. « Annuler » defait le lot.
  function toutAccepter() {
    var zone = document.querySelector('.student-service-data') || IA.blocDocuments().parentNode;
    var b = o.el('<div class="v13-global"></div>');
    var lot = null;
    function dessiner() {
      var attente = registre.filter(function (r) { return r.attente(); });
      var aAccepter = attente.filter(function (r) { return !r.indecis; });
      var aDecider = attente.filter(function (r) { return r.indecis; });
      var reste = aDecider.length ? '<small>' + aDecider.length + ' où l’IA ne tranche pas : à décider vous-même</small>' : '';
      if (lot) {
        b.className = 'v13-global v13-global-fait';
        b.innerHTML = '<span class="v13-f-icone v13-f-ok"><i class="fa fa-check"></i></span><span class="v13-g-txt"><b>' + lot.length + ' suggestion' + (lot.length > 1 ? 's' : '') +
          ' de l’IA acceptée' + (lot.length > 1 ? 's' : '') + '</b>' + reste + '</span>' +
          (aAccepter.length ? '<button type="button" class="v13-g-tout" data-g="tout"><i class="fa fa-check"></i> Tout accepter (' + aAccepter.length + ')</button>' : '') +
          '<button type="button" class="v13-annuler" data-g="annuler"><i class="fa fa-undo"></i> Annuler</button>';
      } else if (aAccepter.length) {
        b.className = 'v13-global';
        b.innerHTML = '<span class="v13-ia">IA</span><span class="v13-g-txt"><b>' + aAccepter.length + ' suggestion' + (aAccepter.length > 1 ? 's' : '') + ' de l’IA à confirmer</b>' + reste + '</span>' +
          '<button type="button" class="v13-g-tout" data-g="tout"><i class="fa fa-check"></i> Tout accepter (' + aAccepter.length + ')</button>';
      } else {
        b.className = 'v13-global v13-global-fait';
        b.innerHTML = '<span class="v13-f-icone v13-f-ok"><i class="fa fa-check"></i></span><span class="v13-g-txt"><b>' +
          (aDecider.length ? 'Toutes les suggestions de l’IA sont traitées' : 'Dossier entièrement traité') + '</b>' + reste + '</span>';
      }
    }
    b.addEventListener('click', function (ev) {
      var x = ev.target.closest('[data-g]');
      if (!x) return;
      if (x.getAttribute('data-g') === 'tout') {
        var faits = registre.filter(function (r) { return r.attente() && !r.indecis; });
        faits.forEach(function (r) { r.accepter(); });
        lot = (lot || []).concat(faits);
        o.toast(faits.length + ' suggestion' + (faits.length > 1 ? 's acceptées' : ' acceptée') + '.');
      } else {
        lot.slice().reverse().forEach(function (r) { if (!r.attente()) r.annuler(); });
        lot = null;
        o.toast('Annulé : les suggestions sont de nouveau à décider.');
      }
      IA.emettre('decision', {});
    });
    IA.on('decision', dessiner);
    zone.insertBefore(b, zone.firstChild);
    dessiner();
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
  // PDF : tous les points de l'analyse sont poses, numerotes comme la liste ; seuls
  // ceux a corriger ou a verifier sont visibles d'emblee, les autres apparaissent
  // quand Perle clique sur leur ligne dans l'analyse.
  function dessinerPdf(ctrl, zone) {
    var tous = IA.constatsVisibles(ctrl.d, 'admin');
    var cadres = tous.map(function (k, i) { return { rect: k.rect, numero: i + 1, teinte: o.typeConstat(k), titre: k.texte }; });
    ctrl.zonePdf = zone;
    IA.rendrePage(IA.urlDocument(ctrl.d.nom), cadres, zone, Math.max(420, zone.clientWidth - 40), function (i) { activerPoint(ctrl, i); }, !!OPTS.analyseMarge);
  }
  function activerPoint(ctrl, i) {
    if (ctrl.zonePdf) ctrl.zonePdf.querySelectorAll('.ia-surlignage').forEach(function (c, j) {
      c.classList.toggle('ia-actif', j === i);
      if (j === i) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    if (ctrl.listePoints) ctrl.listePoints.querySelectorAll('li').forEach(function (li) { li.classList.toggle('v13-actif', li.getAttribute('data-n') === String(i)); });
  }
  function panneauAnalyse(ctrl) {
    var d = ctrl.d, s = ctrl.s, n = d.note;
    var p = o.el('<div class="v13-ap-panneau"></div>');
    var titre = o.el('<div class="v13-ap-titre">' + e(nomDoc(d)) + (ctrl.total > 1 ? ' <span class="v13-ap-rang">' + ctrl.rang + ' / ' + ctrl.total + '</span>' : '') + '</div>');
    p.appendChild(titre);
    // Chaque partie modifiable a son « Annuler mes changements » (retour a la suggestion de l'IA).
    function partie(nom, html, retour) {
      var x = o.el('<section class="v13-ap-partie"><div class="v13-ap-tete"><h4>' + nom + '</h4>' +
        (retour ? '<button type="button" class="v13-ap-retour" data-retour="' + retour + '" hidden title="Revenir à la suggestion de l’IA"><i class="fa fa-undo"></i> Annuler mes changements</button>' : '') +
        '</div>' + (html || '') + '</section>');
      p.appendChild(x);
      return x;
    }
    if (n) partie('Note', '<div class="v13-note v13-note-grande v13-note-' + (n.valeur >= n.seuil ? 'ok' : 'ko') + '">' + n.valeur + '<small>/20</small></div>');

    // ── Analyse : cliquer un point le montre sur le PDF ; ✎ le modifie ; « + Ajouter un point »
    //    (les points ajoutes par Perle sont des corrections : en rouge).
    var analyse;
    if (OPTS.analyseMarge) analyse = partie('Analyse', '<p class="v13-ap-marge"><i class="fa fa-long-arrow-left"></i> Dans la marge du document, à côté de chaque passage.</p>');
    else {
      analyse = partie('Analyse', '<ol class="v13-ap-constats"></ol><button type="button" class="v13-ap-ajout"><i class="fa fa-plus"></i> Ajouter un point</button>', 'analyse');
      var liste = ctrl.listePoints = analyse.querySelector('ol');
      var dessinerAnalyse = function () {
        liste.innerHTML = ctrl.analyse.map(function (k, j) {
          var perle = k.origine === 'perle', modif = !perle && k.texte !== k.ia;
          return '<li class="v13-c-' + k.teinte + (perle ? ' v13-c-perle' : '') + '" data-j="' + j + '"' + (k.n != null ? ' data-n="' + k.n + '" title="Voir sur le document"' : '') + '>' +
            '<span class="v13-c-num">' + (j + 1) + '</span><span class="v13-c-txt">' + e(k.texte) +
            (perle ? ' <span class="v13-c-tag">ajouté</span>' : modif ? ' <span class="v13-c-tag">modifié</span>' : '') + '</span>' +
            '<span class="v13-c-outils"><button type="button" data-edit="' + j + '" title="Modifier ce point"><i class="fa fa-pencil"></i></button>' +
            (perle ? '<button type="button" data-suppr="' + j + '" title="Supprimer ce point"><i class="fa fa-trash-o"></i></button>' : '') + '</span></li>';
        }).join('');
        maj();
      };
      var editer = function (j, nouveau) {
        var li = liste.querySelector('[data-j="' + j + '"]');
        var k = ctrl.analyse[j];
        var zone = o.el('<textarea class="v13-c-edit" rows="2" placeholder="Votre remarque sur le document…"></textarea>');
        zone.value = k.texte;
        li.querySelector('.v13-c-txt').replaceWith(zone);
        li.querySelector('.v13-c-outils').remove();
        li.classList.add('v13-c-edition');
        zone.focus();
        var fini = false;
        function fin(garder) {
          if (fini) return;
          fini = true;
          var v = zone.value.trim();
          if (garder && v) k.texte = v;
          else if (nouveau && !v) ctrl.analyse.splice(j, 1);
          dessinerAnalyse();
        }
        zone.addEventListener('keydown', function (ev) {
          ev.stopPropagation();  // Echap ne doit pas fermer leur fenetre
          if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); fin(true); }
          else if (ev.key === 'Escape') { ev.preventDefault(); fin(false); }
        });
        zone.addEventListener('blur', function () { fin(true); });
      };
      liste.addEventListener('click', function (ev) {
        var ed = ev.target.closest('[data-edit]');
        if (ed) return editer(+ed.getAttribute('data-edit'));
        var su = ev.target.closest('[data-suppr]');
        if (su) { ctrl.analyse.splice(+su.getAttribute('data-suppr'), 1); return dessinerAnalyse(); }
        if (ev.target.closest('textarea')) return;
        var li = ev.target.closest('li[data-n]');
        if (li) activerPoint(ctrl, +li.getAttribute('data-n'));
      });
      liste.addEventListener('dblclick', function (ev) {
        var li = ev.target.closest('li[data-j]');
        if (li && !li.classList.contains('v13-c-edition')) editer(+li.getAttribute('data-j'));
      });
      analyse.querySelector('.v13-ap-ajout').addEventListener('click', function () {
        ctrl.analyse.push({ texte: '', ia: null, teinte: 'probleme', n: null, origine: 'perle' });
        dessinerAnalyse();
        editer(ctrl.analyse.length - 1, true);
      });
    }

    // ── Verdict
    var verdict = partie('Verdict', '<div class="v13-seg"><button type="button" data-v="valide"><i class="fa fa-check"></i> valid</button>' +
      '<button type="button" data-v="invalide"><i class="fa fa-times"></i> invalid</button></div>', 'verdict');
    function majVerdict() {
      verdict.querySelectorAll('[data-v]').forEach(function (b) {
        var v = b.getAttribute('data-v');
        b.classList.toggle('v13-choisi', v === ctrl.choix);
        b.innerHTML = (v === 'valide' ? '<i class="fa fa-check"></i> valid' : '<i class="fa fa-times"></i> invalid') + (v === d.verdict ? ' <span class="v13-ia v13-ia-mini">IA</span>' : '');
      });
    }
    verdict.addEventListener('click', function (ev) { var b = ev.target.closest('[data-v]'); if (b) { ctrl.choisir(b.getAttribute('data-v')); majVerdict(); maj(); } });
    majVerdict();

    var r = s.reponseEtudiant;
    if (r && ctrl.rang === ctrl.total) partie('Commentaire de l’étudiant', '<blockquote class="v13-ap-mot">« ' + e(r.texte) + ' »</blockquote>');

    // ── Commentaire
    var com = partie('Commentaire', '<textarea rows="4" placeholder="Aucun commentaire proposé"></textarea>', 'commentaire');
    var zone = com.querySelector('textarea');
    zone.value = ctrl.brouillon;  // la proposition, ou la version de Perle
    zone.addEventListener('input', function () { ctrl.brouillon = zone.value; maj(); });

    // ── Un seul bouton : Sauvegarder. Apres : la ligne « fait » et Annuler.
    var pied = o.el('<div class="v13-ap-pied"></div>');
    pied.setAttribute('data-prop', 'doc:' + d.nom);
    p.appendChild(pied);
    function heure(x) { return ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
    function dessinerPied() {
      var fait = ctrl.enregistre && !ctrl.modifie();
      pied.classList.toggle('v13-prop-attente', !fait);
      pied.classList.toggle('v13-ap-pied-fait', !!fait);
      if (fait) {
        var ch = [];
        if (ctrl.iaChoix && ctrl.enregistre.choix !== ctrl.iaChoix) ch.push('verdict');
        if (ctrl.enregistre.com !== ctrl.texte.trim()) ch.push('commentaire');
        var na = ctrl.analyse.filter(function (k) { return k.origine === 'perle' || k.texte !== k.ia; }).length;
        if (na) ch.push('analyse (' + na + ' point' + (na > 1 ? 's' : '') + ')');
        var details = (!ctrl.iaChoix ? 'Votre décision' : ch.length ? 'Modifié par vous : ' + ch.join(', ') : 'Suggestion de l’IA suivie') +
          ' · sauvegardé à ' + heure(ctrl.enregistre.le);
        pied.innerHTML = faitHtml(ctrl.enregistre.choix === 'invalide' ? 'ko' : 'ok', 'Document ' + (ctrl.enregistre.choix === 'invalide' ? 'invalidé' : 'validé'), e(details));
      } else {
        var msg = !ctrl.choix ? 'Choisissez valid ou invalid pour sauvegarder.' : ctrl.enregistre ? 'Modifications non sauvegardées.' : 'Rien n’est enregistré avant « Sauvegarder ».';
        pied.innerHTML = '<span class="v13-ap-msg">' + msg + '</span>' +
          '<button type="button" class="v13-sauver" data-a="sauver"' + (ctrl.choix ? '' : ' disabled') + '><i class="fa fa-floppy-o"></i> Sauvegarder</button>';
      }
    }
    pied.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-a]');
      if (!b || b.disabled) return;
      if (b.getAttribute('data-a') === 'sauver') { if (ctrl.sauver()) o.toast('Sauvegardé : verdict posé sur la page.'); }
      else { ctrl.annulerSauvegarde(); o.toast('Annulé : rien n’est plus enregistré pour ce document.'); }
    });

    // Les « Annuler mes changements » de chaque partie.
    function maj() {
      var boutonsRetour = p.querySelectorAll('[data-retour]');
      boutonsRetour.forEach(function (b) {
        var x = b.getAttribute('data-retour');
        b.hidden = x === 'analyse' ? !ctrl.analyse.some(function (k) { return k.origine === 'perle' || k.texte !== k.ia; })
          : x === 'verdict' ? !ctrl.iaChoix || ctrl.choix === ctrl.iaChoix
          : (ctrl.brouillon || '').trim() === ctrl.texte.trim();
      });
      dessinerPied();
    }
    p.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-retour]');
      if (!b) return;
      var x = b.getAttribute('data-retour');
      if (x === 'analyse') { ctrl.analyse = analyseIA(d); dessinerAnalyse(); }
      else if (x === 'verdict') { ctrl.choix = ctrl.iaChoix; majVerdict(); }
      else { ctrl.brouillon = ctrl.texte; zone.value = ctrl.texte; }
      maj();
    });
    IA.on('decision', function () { if (document.contains(pied)) dessinerPied(); });
    if (dessinerAnalyse) dessinerAnalyse(); else maj();
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
          // Capture : on lit leur verdict AVANT que leur clic ne le change (pour Annuler).
          var avant = verdictActif(s.el.querySelector('.doc-general-state'), '.changeGeneralState');
          if (sectionsIA[s.alias]) sectionsIA[s.alias].decider(v, avant);
        } else {
          docs(s).forEach(function (d) {
            if (!d.el.contains(b)) return;
            // Son clic sur leur bouton = la sauvegarde de son verdict (Annuler possible dans l'apercu).
            var ctrl = controles[d.nom];
            if (ctrl) { var avant = verdictActif(d.el.querySelector('.doc-info-buttons'), '.changeState'); ctrl.choix = v; ctrl.sauver({ avant: avant }); }
          });
        }
      });
    }, true);
  }

  // ─── Document mal place : le deplacement (propose dans le bloc de la section) ──
  function deplacement(s) {
    var m = s.mauvaiseSection;
    var d = docs(s)[0];
    if (!m || !d) return null;
    var cle = 'sec:' + s.alias + ':deplacement';
    var badge = null;
    return {
      m: m, cle: cle,
      deplacer: function () {
        var lien = Array.prototype.slice.call(d.el.querySelectorAll('.doc-info-actions .dropdown-menu a'))
          .filter(function (x) { return x.textContent.replace(/\s*\|\s*$/, '').trim() === m.aliasPropose; })[0];
        if (lien) lien.click();  // leur menu ⇄ : le document change de section
        badge = o.el('<span class="v13-deplace"><i class="fa fa-arrows"></i> Déplacé vers « ' + e(m.sectionProposee) + ' » · analyse relancée</span>');
        var meta = d.el.querySelector('.doc-info-meta');
        if (meta) meta.appendChild(badge);
        IA.decider(cle, 'accepte', m.aliasPropose);
      },
      remettre: function () { if (badge) { badge.remove(); badge = null; } IA.annuler(cle); }
    };
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
  // ─── Point d'entree ─────────────────────────────────────────────────────
  function api() {
    return { controles: controles, ouvrirDocument: ouvrirDocument,
      barres: function () { return Array.prototype.slice.call(document.querySelectorAll('.v13-prop[data-prop]')); } };
  }
  IA.v13 = {
    demarrer: function (opts) {
      OPTS = opts || {};
      document.documentElement.classList.add('v13-style-' + (OPTS.style || 'base'));
      IA.on('pret', lancer);
    }
  };
})();
