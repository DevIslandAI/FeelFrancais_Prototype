/*
 * Couche IA — le noyau commun aux 5 variantes.
 *
 * Ce que fait le noyau :
 *   - retrouve le dossier affiche et rattache chaque section et chaque document
 *     de la page Feel Francais aux donnees de l'analyse (window.IA_DONNEES) ;
 *   - garde les decisions de Perle (accepter / modifier / refuser) ;
 *   - ecrit une proposition acceptee DANS les controles de Feel Francais : leurs
 *     boutons valid/invalid, leurs champs de commentaire, leurs champs de dates.
 *     Leur propre JavaScript prend ensuite le relais, exactement comme si Perle
 *     l'avait saisi (principe : Feel Francais reste la source de verite, D1/D12).
 *
 * Ce qu'il ne fait jamais : retirer, masquer ou remplacer un element de leur page.
 * Tout ce qu'il ajoute porte l'attribut data-ia.
 */
(function () {
  'use strict';

  var DONNEES = window.IA_DONNEES;
  var page = location.pathname.split('/').pop();
  var dossier = null;
  Object.keys(DONNEES.dossiers).forEach(function (code) {
    if (DONNEES.dossiers[code].page === page) dossier = DONNEES.dossiers[code];
  });

  var variante = document.documentElement.getAttribute('data-variante') || '0';
  var ecouteurs = [];

  // ── Etat : decisions de Perle, en memoire. Recharger la page repart de zero,
  //    comme leurs boutons valid/invalid (qui ne sont pas enregistres dans la
  //    maquette) : l'etat affiche et l'etat de l'IA ne peuvent pas diverger. ──
  var etat = { decisions: {}, signalements: {}, journal: [] };
  function sauver() { /* volontairement rien : voir ci-dessus */ }

  // ── Brouillons : une proposition modifiee et « enregistree pour plus tard ».
  //    Rien n'est ecrit dans Feel Francais ; on peut donc les garder d'une
  //    visite a l'autre sans risque de divergence (stockage du navigateur). ──
  var CLE_BROUILLONS = 'ia-demo:brouillons:v' + variante + ':' + (dossier ? dossier.code : 'liste');
  var brouillons = {};
  try { brouillons = JSON.parse(localStorage.getItem(CLE_BROUILLONS)) || {}; } catch (e) { brouillons = {}; }
  function sauverBrouillons() {
    try { localStorage.setItem(CLE_BROUILLONS, JSON.stringify(brouillons)); } catch (e) { /* stockage indisponible */ }
  }
  function enregistrer(cle, valeur) {
    brouillons[cle] = { valeur: valeur, le: new Date().toISOString() };
    sauverBrouillons();
    emettre('brouillon', { cle: cle });
  }
  function oublier(cle) {
    if (!brouillons[cle]) return;
    delete brouillons[cle];
    sauverBrouillons();
    emettre('brouillon', { cle: cle });
  }

  var LIBELLES = {
    'a-corriger': 'À corriger', 'a-verifier': 'À vérifier', 'conforme': 'Conforme', 'provisoire': 'Provisoire',
    'alerte': 'Alerte sur une validation', 'humain': 'Validé par l’équipe', 'optionnel': 'Optionnel — non analysé'
  };
  var ICONES = {
    'a-corriger': 'fa-times-circle', 'a-verifier': 'fa-question-circle', 'conforme': 'fa-check-circle',
    'provisoire': 'fa-hourglass-half', 'alerte': 'fa-exclamation-triangle', 'humain': 'fa-user'
  };
  var TYPES = {
    'probleme': 'À corriger', 'contradiction': 'Contradiction', 'a-verifier': 'À vérifier',
    'conforme': 'Conforme', 'info': 'Fait lu'
  };

  // ── Rattachement a la page Feel Francais ──
  var sections = [];

  function texte(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }

  function rattacher() {
    if (!dossier) return;
    var zone = document.getElementById('VisaData_documents') || document;
    var fieldsets = Array.prototype.slice.call(zone.querySelectorAll('fieldset.adm_row_doc_uploaded'));
    var parAlias = {};
    fieldsets.forEach(function (fs) {
      var tete = fs.querySelector('.doc-general-state .doc-state[data-doc-alias]');
      if (tete) parAlias[tete.getAttribute('data-doc-alias')] = fs;
    });
    // Titre de chaque section tel que Feel Francais l'affiche
    dossier.sections.forEach(function (s) {
      var fs = parAlias[s.alias] || null;
      s.el = fs;
      s.titre = fs ? texte(fs.querySelector('.doc-general-state > strong, .doc-general-state .doc-name-icon strong')) : s.alias;
      var groupe = fs && fs.closest('.col-md-7');
      if (fs) {
        var h = fs.previousElementSibling;
        while (h && h.tagName !== 'H5') h = h.previousElementSibling;
        s.groupe = h ? texte(h) : '';
        s.idSection = fs.querySelector('.doc-general-state .doc-state').getAttribute('data-doc-id');
      }
      (s.documents || []).forEach(function (d) {
        d.section = s;
        if (!fs) return;
        Array.prototype.forEach.call(fs.querySelectorAll('.doc-item'), function (item) {
          if (texte(item.querySelector('.doc-orginal-name')) === d.nom) {
            d.el = item;
            d.id = item.querySelector('.doc-info-buttons[data-doc-id]').getAttribute('data-doc-id');
          }
        });
      });
      sections.push(s);
    });
  }

  // Sections soumises a l'analyse (les pieces humaines sans nouveaute et les
  // optionnelles restent blanches : rien n'est ajoute dessus).
  function analysees() {
    return sections.filter(function (s) { return s.el && s.statut !== 'humain' && s.statut !== 'optionnel'; });
  }

  // ── Decisions ──
  function decision(cle) { return etat.decisions[cle] || null; }
  function decider(cle, statut, valeur, contexte) {
    if (brouillons[cle]) { delete brouillons[cle]; sauverBrouillons(); }  // une decision remplace le brouillon
    etat.decisions[cle] = { statut: statut, valeur: valeur, le: new Date().toISOString() };
    etat.journal.push({ cle: cle, statut: statut, le: Date.now() });
    sauver();
    emettre('decision', { cle: cle, statut: statut, valeur: valeur, contexte: contexte });
  }
  function annuler(cle) {
    delete etat.decisions[cle];
    sauver();
    emettre('decision', { cle: cle, statut: null });
  }
  function signaler(cle, motif, precision) {
    etat.signalements[cle] = { motif: motif, precision: precision, le: new Date().toISOString() };
    sauver();
    emettre('signalement', { cle: cle });
  }
  function on(type, fn) { ecouteurs.push({ type: type, fn: fn }); }
  function emettre(type, detail) {
    ecouteurs.forEach(function (e) { if (e.type === type || e.type === '*') e.fn(detail, type); });
  }

  // Toutes les propositions d'une section, pour savoir si elle est traitee.
  // Une section a une seule piece : un seul verdict (section + piece), pour ne
  // pas demander deux fois la meme decision (redondance).
  function docsAffiches(s) { return (s.documents || []).filter(function (d) { return d.el; }); }
  function verdictUnique(s) { return docsAffiches(s).length === 1; }
  function propositionsSection(s) {
    var liste = [s.statut === 'alerte' ? { cle: 'alerte:' + s.alias, type: 'alerte' }
      : { cle: 'sec:' + s.alias + ':verdict', type: 'verdict-section' }];
    if (s.commentaireSection && s.commentaireSection.etudiant) liste.push({ cle: 'sec:' + s.alias + ':etudiant', type: 'commentaire' });
    if (s.commentaireSection && s.commentaireSection.interne) liste.push({ cle: 'sec:' + s.alias + ':interne', type: 'commentaire' });
    docsAffiches(s).forEach(function (d) {
      if (s.statut !== 'alerte' && !verdictUnique(s)) liste.push({ cle: 'doc:' + d.nom + ':verdict', type: 'verdict' });
      if (d.commentaire && d.commentaire.etudiant) liste.push({ cle: 'doc:' + d.nom + ':etudiant', type: 'commentaire' });
      if (d.commentaire && d.commentaire.interne) liste.push({ cle: 'doc:' + d.nom + ':interne', type: 'commentaire' });
    });
    if (s.mauvaiseSection) liste.push({ cle: 'sec:' + s.alias + ':deplacement', type: 'deplacement' });
    return liste;
  }
  function progressionSection(s) {
    var p = propositionsSection(s);
    var faites = p.filter(function (x) { return decision(x.cle); }).length;
    return { faites: faites, total: p.length, finie: faites === p.length };
  }
  function toutesPropositions() {
    var l = [];
    analysees().forEach(function (s) { l = l.concat(propositionsSection(s)); });
    dossier.champs.forEach(function (c) { l.push({ cle: 'champ:' + c.cle, type: 'champ' }); });
    return l;
  }
  function progression() {
    var p = toutesPropositions();
    var faites = p.filter(function (x) { return decision(x.cle); }).length;
    return { faites: faites, total: p.length };
  }

  // ── Ecriture dans les controles de Feel Francais ──
  function flash(el) {
    if (!el) return;
    el.classList.add('ia-applique');
    el.animate && el.animate([{ boxShadow: '0 0 0 4px rgba(47,158,98,.55)' }, { boxShadow: '0 0 0 0 rgba(47,158,98,0)' }],
      { duration: 1100 });
  }

  // Clique LEUR bouton valid / invalid : leur JS met l'etat a jour (et en
  // production l'enregistre). 1 = valid, 0 = invalid.
  function verdictDocument(d, valide) {
    var b = d.el && d.el.querySelector('.doc-info-buttons .changeState.' + (valide ? 'valid' : 'invalid'));
    if (b && !b.classList.contains('active')) b.click();
    flash(b);
  }
  function verdictSection(s, valide) {
    var b = s.el && s.el.querySelector('.doc-general-state .changeGeneralState.' + (valide ? 'valid' : 'invalid'));
    if (b && !b.classList.contains('active')) b.click();
    flash(b);
  }

  // Remplit leur carte de commentaire : staff (visible etudiant), internal,
  // general, internal-general. On ouvre la carte avec LEUR bouton d'ajout, puis
  // focus / saisie / blur declenchent leur sauvegarde automatique.
  function commentaire(idDoc, note, valeur) {
    var carte = document.querySelector('.doc-note-card[data-note="' + note + '"][data-doc-id="' + idDoc + '"]');
    if (!carte) return null;
    var groupe = carte.closest('.doc-note-group');
    var ajout = groupe && groupe.querySelector('.doc-note-add[data-note="' + note + '"]');
    if (carte.style.display === 'none' && ajout) ajout.click();
    var zone = carte.querySelector('textarea');
    if (window.jQuery) {
      var $z = window.jQuery(zone);
      $z.trigger('focus');
      $z.val(valeur).trigger('input').trigger('change');
      $z.trigger('blur');
    } else {
      zone.value = valeur;
    }
    flash(carte);
    return carte;
  }

  function champ(c, valeur) {
    var el = document.querySelector(c.selecteur);
    if (!el) return;
    if (window.jQuery) {
      var $el = window.jQuery(el);
      if (c.type === 'texte') $el.trigger('focus');
      $el.val(valeur).trigger('input').trigger('change');
      if (c.type === 'texte') $el.trigger('blur');
    } else {
      el.value = valeur;
    }
    var cible = c.type === 'select' && el.nextElementSibling && el.nextElementSibling.classList.contains('select2')
      ? el.nextElementSibling : el;
    flash(cible);
  }

  // ── Utilitaires d'affichage partages ──
  function echapper(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    var n = t.content.firstElementChild;
    n.setAttribute('data-ia', '');
    return n;
  }
  function toast(message) {
    var t = document.querySelector('.ia-toast');
    if (!t) { t = el('<div class="ia-toast" role="status"></div>'); document.body.appendChild(t); }
    t.textContent = message;
    t.style.display = 'block';
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }
  function typeConstat(k) {
    if (k.type === 'conforme') return 'conforme';
    if (k.type === 'a-verifier') return 'a-verifier';
    return k.probleme ? 'probleme' : 'info';
  }
  function libelleType(k) {
    if (k.type === 'contradiction') return TYPES.contradiction;
    return TYPES[typeConstat(k)];
  }
  function pastille(statut, texteLibre) {
    return '<span class="ia-pastille ia-p-' + statut + '"><i class="fa ' + (ICONES[statut] || 'fa-circle') +
      '"></i>' + echapper(texteLibre || LIBELLES[statut] || statut) + '</span>';
  }
  function defiler(elCible) {
    if (!elCible) return;
    elCible.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.IA = {
    meta: DONNEES.meta,
    dossier: dossier,
    variante: variante,
    sections: function () { return sections; },
    // Le bloc « Visa Center » (onglets + documents) — pas celui de la colonne de gauche.
    blocDocuments: function () {
      var z = document.getElementById('VisaData_documents');
      return z ? z.closest('.admin-student-documents') : null;
    },
    analysees: analysees,
    decision: decision,
    decider: decider,
    annuler: annuler,
    signaler: signaler,
    signalement: function (cle) { return etat.signalements[cle] || null; },
    on: on,
    emettre: emettre,
    propositionsSection: propositionsSection,
    verdictUnique: verdictUnique,
    progressionSection: progressionSection,
    progression: progression,
    toutesPropositions: toutesPropositions,
    ecrire: { verdictDocument: verdictDocument, verdictSection: verdictSection, commentaire: commentaire, champ: champ },
    LIBELLES: LIBELLES, ICONES: ICONES,
    outils: { echapper: echapper, el: el, toast: toast, typeConstat: typeConstat, libelleType: libelleType,
              pastille: pastille, defiler: defiler, texte: texte, flash: flash },
    journal: function () { return etat.journal.slice(); },
    enregistrer: enregistrer,
    oublier: oublier,
    brouillon: function (cle) { return brouillons[cle] || null; },
    brouillons: function () { return Object.keys(brouillons); },
    reinitialiser: function () { location.reload(); }
  };

  // Le rattachement attend que leur page ait fini de se construire.
  function demarrer() {
    rattacher();
    emettre('pret', {});
  }
  if (document.readyState === 'complete') setTimeout(demarrer, 0);
  else window.addEventListener('load', function () { setTimeout(demarrer, 0); });
})();
