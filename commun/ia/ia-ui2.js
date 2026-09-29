/*
 * Couche IA — composants SIMPLIFIES des variantes 6 a 8 (issus de la revue UX).
 *
 * Ce qui change par rapport aux composants des variantes 1 a 5 :
 *  - quatre titres fixes, toujours dans le meme ordre : Proposition IA,
 *    Incoherences, A savoir, Details (replie) ;
 *  - une proposition = le texte de l'IA, modifiable sur place, et trois gestes :
 *    Appliquer (ecrit dans Feel Francais), Enregistrer (garde la version pour
 *    la revoir plus tard, sans rien ecrire), Ignorer. Plus d'avant/apres ;
 *  - le marquage des sections se pose SUR la bordure (etiquette + fin liseré) :
 *    aucune hauteur ne change, aucun bouton ne se chevauche ;
 *  - les propositions du haut de page (statut, texte a l'etudiant, dates,
 *    commentaire staff) s'ouvrent juste sous le champ, au clic.
 * Memes donnees, memes cles de decision et memes ecritures que les variantes 1 a 5.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var ui2 = {};

  var COURT = { 'a-corriger': 'À corriger', 'a-verifier': 'À vérifier', 'conforme': 'Conforme', 'provisoire': 'En attente',
    'alerte': 'Alerte', 'humain': 'Validé', 'optionnel': 'Optionnel' };
  ui2.COURT = COURT;

  // Nom court et sans ambiguite d'une section (les titres Feel Francais sont
  // longs et trois commencent par « Proof of resource »).
  var NOMS = {
    'passport': 'Passeport', 'proof-ressource': 'Relevés bancaires', 'affidavit-sponsoring-letter': 'Lettre du garant',
    'proof-ressource-relationship-taxbill-payslips': 'Pièces du garant', 'proof-accommodation-france': 'Hébergement', 'resume': 'CV',
    'eef-diploma': 'Diplôme', 'visa-form': 'Formulaire visa', 'travel-health-insurance': 'Assurance santé',
    'cover-letter': 'Lettre de motivation', 'enrollment-letter': 'Lettre d’inscription', 'id-photos': 'Photos', 'flight-ticket': 'Billet d’avion'
  };
  ui2.nom = function (s) { return NOMS[s.alias] || s.titre; };

  function traitee(cle) { return !!IA.decision(cle); }

  // ── Ecrire une valeur dans Feel Francais selon la cle de la proposition ──
  function unique(s) { return IA.verdictUnique(s) ? (s.documents || []).filter(function (d) { return d.el; })[0] : null; }
  function ecrire(s, cle, valeur) {
    var m = /^(sec|doc|champ):(.+?):?(verdict|etudiant|interne)?$/.exec(cle);
    if (cle.indexOf('champ:') === 0) {
      var c = IA.dossier.champs.filter(function (x) { return 'champ:' + x.cle === cle; })[0];
      if (c) IA.ecrire.champ(c, valeur);
      return;
    }
    if (!m) return;
    if (m[1] === 'sec') {
      if (m[3] === 'verdict') {
        IA.ecrire.verdictSection(s, valeur === 'valide');
        var u = unique(s);
        if (u) IA.ecrire.verdictDocument(u, valeur === 'valide');
      } else {
        IA.ecrire.commentaire(s.idSection, m[3] === 'etudiant' ? 'general' : 'internal-general', valeur);
      }
      return;
    }
    var d = (s.documents || []).filter(function (x) { return x.nom === m[2]; })[0];
    if (!d) return;
    if (m[3] === 'verdict') IA.ecrire.verdictDocument(d, valeur === 'valide');
    else IA.ecrire.commentaire(d.id, m[3] === 'etudiant' ? 'staff' : 'internal', valeur);
  }
  ui2.ecrire = ecrire;

  // Ce que l'IA propose pour une cle (texte ou verdict), ou null si elle ne tranche pas.
  function proposition(s, cle) {
    var m = /^(sec|doc):(.+):(verdict|etudiant|interne)$/.exec(cle);
    if (!m) return null;
    if (m[1] === 'sec') {
      if (m[3] === 'verdict') {
        var u = unique(s);
        return { 'conforme': 'valide', 'a-corriger': 'invalide' }[s.statut] || null;
      }
      return (s.commentaireSection || {})[m[3]] || null;
    }
    var d = (s.documents || []).filter(function (x) { return x.nom === m[2]; })[0];
    if (!d) return null;
    if (m[3] === 'verdict') return d.verdict === 'a-verifier' ? null : d.verdict;
    return (d.commentaire || {})[m[3]] || null;
  }

  // Appliquer tout ce qui est en attente (les versions enregistrees priment).
  ui2.appliquerTout = function (sections) {
    var n = 0;
    sections.forEach(function (s) {
      IA.propositionsSection(s).forEach(function (p) {
        if (traitee(p.cle) || p.type === 'alerte' || p.type === 'deplacement') return;
        var b = IA.brouillon(p.cle);
        var valeur = b ? b.valeur : proposition(s, p.cle);
        if (valeur == null) return;
        ecrire(s, p.cle, valeur);
        IA.decider(p.cle, b ? 'modifie' : 'accepte', valeur);
        n++;
      });
    });
    return n;
  };

  // ── Marquage d'une section : liseré + etiquette posee sur la bordure ──
  ui2.marquer = function (s, surClic) {
    var c = s.el.querySelector('.doc-container');
    s.el.classList.add('ia2-sec', 'ia2-' + s.statut);
    var tag = o.el('<button type="button" class="ia2-tag ia2-t-' + s.statut + '" title="Voir la proposition IA">' +
      '<span class="ia2-point"></span><span class="ia2-tag-texte"></span></button>');
    c.appendChild(tag);
    tag.addEventListener('click', function (ev) { ev.stopPropagation(); surClic(s); });
    function maj() {
      var p = IA.progressionSection(s);
      var revoir = IA.propositionsSection(s).some(function (x) { return IA.brouillon(x.cle); });
      s.el.classList.toggle('ia2-fini', p.finie);
      tag.classList.toggle('ia2-tag-fini', p.finie);
      tag.querySelector('.ia2-tag-texte').textContent = p.finie ? 'IA · traité' : 'IA · ' + COURT[s.statut] + (revoir ? ' · à revoir' : '');
    }
    IA.on('decision', maj);
    IA.on('brouillon', maj);
    maj();
    s.tag = tag;
    return tag;
  };

  // ── Une proposition de texte : Appliquer / Enregistrer / Ignorer ──
  ui2.prop = function (p) {
    var b0 = IA.brouillon(p.cle);
    var bloc = o.el('<div class="ia2-prop" data-cle="' + e(p.cle) + '">' +
      '<div class="ia2-prop-tete"><span class="ia2-prop-titre">' + e(p.titre) + '</span>' +
      (p.etudiant ? '<i class="fa fa-eye ia2-discret" title="Visible par l’étudiant"></i>' :
        '<i class="fa fa-lock ia2-discret" title="Réservé à l’équipe"></i>') +
      '<span class="ia2-etat"></span></div>' +
      '<textarea rows="' + (p.lignes || 2) + '" aria-label="' + e(p.titre) + '"></textarea>' +
      '<div class="ia2-actions"></div></div>');
    var zone = bloc.querySelector('textarea');
    zone.value = b0 ? b0.valeur : p.texte;
    function hauteur() { zone.style.height = 'auto'; zone.style.height = Math.min(zone.scrollHeight + 2, 220) + 'px'; }
    zone.addEventListener('input', function () { hauteur(); dessiner(); });
    function dessiner() {
      var d = IA.decision(p.cle);
      var br = IA.brouillon(p.cle);
      var modifie = zone.value !== p.texte;
      var etat = bloc.querySelector('.ia2-etat');
      var actions = bloc.querySelector('.ia2-actions');
      bloc.className = 'ia2-prop' + (d ? ' ia2-' + (d.statut === 'refuse' ? 'ignore' : 'applique') : (br ? ' ia2-enregistre' : ''));
      zone.readOnly = !!d;
      etat.innerHTML = d ? (d.statut === 'refuse' ? 'Ignoré' : 'Appliqué') : (br ? 'Enregistré · à revoir' : (modifie ? 'Modifié' : ''));
      actions.innerHTML = d
        ? '<button type="button" class="ia2-lien" data-a="annuler">Annuler</button>'
        : '<button type="button" class="ia2-btn ia2-ok" data-a="appliquer">Appliquer</button>' +
          '<button type="button" class="ia2-btn" data-a="enregistrer" title="Garder cette version pour la revoir plus tard, sans l’écrire">Enregistrer</button>' +
          '<button type="button" class="ia2-btn ia2-non" data-a="ignorer">Ignorer</button>';
    }
    bloc.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      var action = a.getAttribute('data-a');
      if (action === 'appliquer') { p.appliquer(zone.value); IA.decider(p.cle, zone.value !== p.texte ? 'modifie' : 'accepte', zone.value); }
      if (action === 'enregistrer') { IA.enregistrer(p.cle, zone.value); o.toast('Proposition enregistrée : elle vous attend « à revoir ».'); }
      if (action === 'ignorer') IA.decider(p.cle, 'refuse', null);
      if (action === 'annuler') IA.annuler(p.cle);
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === p.cle) dessiner(); });
    dessiner();
    setTimeout(hauteur, 0);
    return bloc;
  };

  // Recalcule la hauteur des textes (utile quand un bloc cache devient visible).
  ui2.ajuster = function (racine) {
    (racine || document).querySelectorAll('.ia2-prop textarea').forEach(function (t) {
      t.style.height = 'auto';
      t.style.height = Math.min(t.scrollHeight + 2, 220) + 'px';
    });
  };

  // ── Un verdict, sur une ligne : Appliquer / l'autre verdict / Ignorer ──
  ui2.verdict = function (p) {
    var LIB = { valide: 'valid', invalide: 'invalid' };
    var bloc = o.el('<div class="ia2-verdict" data-cle="' + e(p.cle) + '"></div>');
    function dessiner() {
      var d = IA.decision(p.cle);
      var html = '<span class="ia2-verdict-lib">' + e(p.titre) + '</span>';
      if (d) {
        html += d.statut === 'refuse' ? '<span class="ia2-muet">Ignoré</span>'
          : '<span class="ia2-v ia2-v-' + d.valeur + '">' + LIB[d.valeur] + '</span><span class="ia2-muet">appliqué</span>';
        html += '<button type="button" class="ia2-lien" data-a="annuler">Annuler</button>';
      } else if (p.propose) {
        var autre = p.propose === 'valide' ? 'invalide' : 'valide';
        html += '<span class="ia2-v ia2-v-' + p.propose + '">' + LIB[p.propose] + '</span>' +
          '<span class="ia2-sep"></span><button type="button" class="ia2-btn ia2-ok" data-a="appliquer">Appliquer</button>' +
          '<button type="button" class="ia2-btn" data-a="' + autre + '" title="Choisir ' + LIB[autre] + ' à la place">' + LIB[autre] + '</button>' +
          '<button type="button" class="ia2-btn ia2-non" data-a="ignorer">Ignorer</button>';
      } else {
        html += '<span class="ia2-v ia2-v-doute">à décider</span><span class="ia2-sep"></span>' +
          '<button type="button" class="ia2-btn" data-a="valide">valid</button><button type="button" class="ia2-btn" data-a="invalide">invalid</button>' +
          '<button type="button" class="ia2-btn ia2-non" data-a="ignorer">Plus tard</button>';
      }
      bloc.innerHTML = html;
    }
    bloc.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      var x = a.getAttribute('data-a');
      if (x === 'annuler') IA.annuler(p.cle);
      else if (x === 'ignorer') IA.decider(p.cle, 'refuse', null);
      else {
        var v = x === 'appliquer' ? p.propose : x;
        p.appliquer(v);
        IA.decider(p.cle, x === 'appliquer' ? 'accepte' : 'modifie', v);
      }
      dessiner();
    });
    IA.on('decision', function (y) { if (y.cle === p.cle) dessiner(); });
    dessiner();
    return bloc;
  };

  // ── « Proposition IA » d'une section : verdicts puis messages ──
  ui2.propositions = function (s) {
    var box = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-magic"></i>Proposition IA</h4></section>');
    var u = unique(s);
    var docs = (s.documents || []).filter(function (d) { return d.el; });
    var langue = (IA.dossier.langue || 'fr').toUpperCase();
    if (s.statut !== 'alerte') {
      box.appendChild(ui2.verdict({ cle: 'sec:' + s.alias + ':verdict', titre: u ? 'Verdict' : 'Verdict de la section',
        propose: proposition(s, 'sec:' + s.alias + ':verdict'), appliquer: function (v) { ecrire(s, 'sec:' + s.alias + ':verdict', v); } }));
      if (!u) docs.forEach(function (d) {
        box.appendChild(ui2.verdict({ cle: 'doc:' + d.nom + ':verdict', titre: d.sousType, propose: d.verdict === 'a-verifier' ? null : d.verdict,
          appliquer: function (v) { IA.ecrire.verdictDocument(d, v); } }));
      });
    }
    var cs = s.commentaireSection || {};
    if (cs.etudiant) box.appendChild(ui2.prop({ cle: 'sec:' + s.alias + ':etudiant', titre: 'Message à l’étudiant (' + langue + ')',
      texte: cs.etudiant, etudiant: true, appliquer: function (v) { ecrire(s, 'sec:' + s.alias + ':etudiant', v); } }));
    docs.forEach(function (d) {
      var c = d.commentaire || {};
      var suffixe = docs.length > 1 ? ' — ' + d.sousType : '';
      if (c.etudiant) box.appendChild(ui2.prop({ cle: 'doc:' + d.nom + ':etudiant', titre: 'Message à l’étudiant (' + langue + ')' + suffixe,
        texte: c.etudiant, etudiant: true, appliquer: function (v) { IA.ecrire.commentaire(d.id, 'staff', v); } }));
    });
    if (cs.interne) box.appendChild(ui2.prop({ cle: 'sec:' + s.alias + ':interne', titre: 'Note interne', texte: cs.interne,
      appliquer: function (v) { ecrire(s, 'sec:' + s.alias + ':interne', v); } }));
    docs.forEach(function (d) {
      var c = d.commentaire || {};
      if (c.interne) box.appendChild(ui2.prop({ cle: 'doc:' + d.nom + ':interne', titre: 'Note interne' + (docs.length > 1 ? ' — ' + d.sousType : ''),
        texte: c.interne, appliquer: function (v) { IA.ecrire.commentaire(d.id, 'internal', v); } }));
    });
    return box;
  };

  // ── Incoherences : contradictions entre pieces, pieces liees manquantes ──
  function ligneIncoherence(x, avecSection) {
    var l = o.el('<div class="ia2-inc"><i class="fa fa-exclamation-circle ia2-rouge"></i><div class="ia2-inc-texte"><b>' + e(x.titre) + '</b>' +
      (avecSection ? ' <span class="ia2-muet">· ' + e(avecSection) + '</span>' : '') + '<div class="ia2-inc-valeurs"><span>' + e(x.a.valeur) +
      '</span><i class="fa fa-arrows-h"></i><span>' + e(x.b.valeur) + '</span></div></div>' +
      '<button type="button" class="ia2-btn">Comparer</button></div>');
    l.querySelector('button').addEventListener('click', function () {
      IA.ui.ouvrirCote(x.titre, { libelle: x.a.fichier, valeur: x.a.valeur, nom: x.a.nom, rect: x.a.rect, teinte: 'probleme' },
        { libelle: x.b.fichier, valeur: x.b.valeur, nom: x.b.nom, rect: x.b.rect, teinte: 'probleme' });
    });
    return l;
  }
  ui2.incoherences = function (s) {
    var contra = (s.croisements || []).filter(function (x) { return x.resultat !== 'coherent'; });
    var ok = (s.croisements || []).filter(function (x) { return x.resultat === 'coherent'; });
    var liees = s.piecesLiees || [];
    if (!contra.length && !ok.length && !liees.length) return null;
    var box = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-link"></i>Incohérences' +
      (contra.length + liees.length ? ' <span class="ia2-compte">' + (contra.length + liees.length) + '</span>' : '') + '</h4></section>');
    contra.forEach(function (x) { box.appendChild(ligneIncoherence(x)); });
    liees.forEach(function (p) {
      box.appendChild(o.el('<div class="ia2-inc"><i class="fa fa-chain-broken ia2-rouge"></i><div class="ia2-inc-texte"><b>' + e(p.section) +
        '</b> <span class="ia2-muet">· ' + e(p.etat) + '</span><div class="ia2-muet">' + e(p.texte) + '</div></div></div>'));
    });
    if (ok.length) {
      var d = o.el('<details class="ia2-ok-liste"><summary><i class="fa fa-check ia2-vert"></i>' + ok.length + ' vérification' + (ok.length > 1 ? 's' : '') +
        ' concordante' + (ok.length > 1 ? 's' : '') + '</summary></details>');
      ok.forEach(function (x) {
        d.appendChild(o.el('<div class="ia2-muet ia2-ok-ligne">' + e(x.titre) + ' : ' + e(x.a.valeur) + '</div>'));
      });
      box.appendChild(d);
    }
    if (!contra.length && !liees.length && ok.length) box.querySelector('.ia2-titre').innerHTML = '<i class="fa fa-link"></i>Documents liés';
    return box;
  };

  // Toutes les incoherences du dossier (pour la vue d'ensemble).
  ui2.incoherencesDossier = function (surSection) {
    var box = o.el('<section class="ia2-bloc"></section>');
    var n = 0;
    IA.sections().forEach(function (s) {
      (s.croisements || []).filter(function (x) { return x.resultat !== 'coherent'; }).forEach(function (x) {
        var l = ligneIncoherence(x, s.titre);
        if (surSection && s.el) {
          var v = o.el('<button type="button" class="ia2-lien">Section</button>');
          v.addEventListener('click', function () { surSection(s); });
          l.appendChild(v);
        }
        box.appendChild(l);
        n++;
      });
      (s.piecesLiees || []).forEach(function (p) {
        box.appendChild(o.el('<div class="ia2-inc"><i class="fa fa-chain-broken ia2-rouge"></i><div class="ia2-inc-texte"><b>' + e(p.section) +
          '</b> <span class="ia2-muet">· ' + e(p.etat) + '</span><div class="ia2-muet">' + e(p.texte) + '</div></div></div>'));
        n++;
      });
    });
    if (!n) box.appendChild(o.el('<div class="ia2-muet">Aucune incohérence entre les documents.</div>'));
    box.n = n;
    return box;
  };
  ui2.nombreIncoherences = function () {
    var n = 0;
    IA.sections().forEach(function (s) {
      n += (s.croisements || []).filter(function (x) { return x.resultat !== 'coherent'; }).length + (s.piecesLiees || []).length;
    });
    return n;
  };

  // ── A savoir : ce qui demande un arbitrage ou eclaire la decision ──
  ui2.aSavoir = function (s) {
    var items = [];
    if (s.alerte) {
      var cle = 'alerte:' + s.alias;
      var a = o.el('<div class="ia2-info ia2-info-alerte"><b>Déjà validé par ' + e(s.humain.par) + ' le ' + e(s.humain.le.slice(0, 10)) + '.</b> ' +
        e(s.alerte.texte) + '<div class="ia2-actions"></div></div>');
      var zone = a.querySelector('.ia2-actions');
      var dessinerA = function () {
        var d = IA.decision(cle);
        zone.innerHTML = d ? '<span class="ia2-muet">' + e(d.valeur) + '</span><button type="button" class="ia2-lien" data-c="annuler">Annuler</button>'
          : '<button type="button" class="ia2-btn ia2-ok" data-c="garder">Garder la validation</button>' +
            '<button type="button" class="ia2-btn" data-c="invalider">Invalider</button><button type="button" class="ia2-btn ia2-non" data-c="tard">Plus tard</button>';
      };
      zone.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-c]');
        if (!b) return;
        var c = b.getAttribute('data-c');
        if (c === 'annuler') IA.annuler(cle);
        else {
          if (c === 'invalider') { IA.ecrire.verdictSection(s, false); (s.documents || []).forEach(function (d) { if (d.el) IA.ecrire.verdictDocument(d, false); }); }
          IA.decider(cle, c === 'tard' ? 'refuse' : (c === 'garder' ? 'accepte' : 'modifie'),
            { garder: 'Validation conservée', invalider: 'Passé en invalid', tard: 'Arbitrage reporté' }[c]);
        }
        dessinerA();
      });
      IA.on('decision', function (x) { if (x.cle === cle) dessinerA(); });
      dessinerA();
      items.push(a);
    }
    if (s.mauvaiseSection) {
      var m = s.mauvaiseSection;
      var cleD = 'sec:' + s.alias + ':deplacement';
      var b = o.el('<div class="ia2-info ia2-info-attention"><b>Mauvaise section.</b> ' + e(m.detecte.split(' (')[0]) + ' → à ranger dans « ' +
        e(m.sectionProposee) + ' ».<div class="ia2-actions"></div></div>');
      var zb = b.querySelector('.ia2-actions');
      var dessinerB = function () {
        var d = IA.decision(cleD);
        zb.innerHTML = d ? '<span class="ia2-muet">' + e(d.valeur) + '</span><button type="button" class="ia2-lien" data-c="annuler">Annuler</button>'
          : '<button type="button" class="ia2-btn ia2-ok" data-c="deplacer"><i class="fa fa-arrows"></i> Déplacer…</button>' +
            '<button type="button" class="ia2-btn ia2-non" data-c="laisser">Laisser ici</button>';
      };
      zb.addEventListener('click', function (ev) {
        var c = ev.target.closest('[data-c]');
        if (!c) return;
        var x = c.getAttribute('data-c');
        if (x === 'annuler') IA.annuler(cleD);
        else if (x === 'laisser') IA.decider(cleD, 'refuse', 'Laissé dans cette section');
        else { document.querySelectorAll('.ia-fenetre, .ia2-fenetre').forEach(function (f) { if (f.__fermer) f.__fermer(); }); IA.ui.preparerDeplacement(s); }
        dessinerB();
      });
      document.addEventListener('replique:deplacement', function (ev) {
        var d = (s.documents || [])[0];
        if (d && d.el && d.el.contains(ev.detail.lien)) { IA.decider(cleD, 'accepte', 'Déplacé vers « ' + ev.detail.alias + ' »'); dessinerB(); }
      });
      dessinerB();
      items.push(b);
    }
    if (s.provisoire) {
      items.push(o.el('<div class="ia2-info"><b>En attente de pièces.</b> Reçu : ' + e(s.provisoire.recu.join(', ')) + '. Manque : ' +
        e(s.provisoire.attendus.join(', ')) + '.</div>'));
    }
    if (s.ressources) {
      var r = s.ressources;
      var mois = [];
      r.comptes.forEach(function (c) {
        c.mois.forEach(function (x) {
          mois.push('<span class="ia2-mois ia2-mois-' + x.etat + '">' + e(x.mois.split(' ')[0]) +
            { ok: ' ✓', doublon: ' ✓ (+ doublon)', manquant: ' manquant' }[x.etat] + '</span>');
        });
      });
      items.push(o.el('<div class="ia2-info"><b>Ressources.</b> ' + mois.join(' ') + '<div class="ia2-chiffres"><span>Dernier solde <b>' +
        e(r.dernierSolde.euros) + '</b> <span class="ia2-muet">(' + e(r.dernierSolde.valeur) + ')</span></span><span>Besoin <b>' +
        e(r.besoin.split(' = ')[1] || r.besoin) + '</b></span></div></div>'));
    }
    if (s.versions || s.reponseEtudiant) {
      var v = o.el('<div class="ia2-info"><b>' + (s.tentatives ? s.tentatives.numero + 'ᵉ dépôt.' : 'Nouvelle version.') + '</b> ' +
        (s.versions || []).map(function (x) {
          return '<div class="ia2-version"><i class="fa ' + (x.resolu ? 'fa-check ia2-vert' : 'fa-times ia2-rouge') + '"></i> « ' + e(x.commentairePerle) +
            ' » <span class="ia2-muet">' + (x.resolu ? 'corrigé' : 'non corrigé') + '</span></div>';
        }).join('') +
        (s.reponseEtudiant ? '<div class="ia2-version"><i class="fa fa-comment-o"></i> L’étudiant : « ' + e(s.reponseEtudiant.texte) + ' »</div>' : '') +
        '</div>');
      if (s.comparaison) {
        var bt = o.el('<button type="button" class="ia2-btn" style="margin-top:5px">Comparer avec la version précédente</button>');
        bt.addEventListener('click', function () {
          var c = s.comparaison, ch = c.changements[0];
          IA.ui.ouvrirCote('Avant / maintenant', { libelle: 'Avant', valeur: ch.avant, nom: c.nomAvant, rect: ch.rectAvant, teinte: 'probleme' },
            { libelle: 'Maintenant', valeur: ch.apres, nom: c.nomApres, rect: ch.rectApres, teinte: 'conforme' });
        });
        v.appendChild(bt);
      }
      items.push(v);
    }
    if (!items.length) return null;
    var box = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-info-circle"></i>À savoir</h4></section>');
    items.forEach(function (i) { box.appendChild(i); });
    return box;
  };

  // ── Details : replies, pour qui veut comprendre ──
  ui2.details = function (s) {
    var d = o.el('<details class="ia2-details"><summary>Détails : règles appliquées et analyse</summary></details>');
    (s.regles || []).forEach(function (r) {
      d.appendChild(o.el('<div class="ia2-regle"><b>' + e(r.id) + '</b> ' + e(r.texte) + ' <span class="ia2-muet">— ' + e(r.source) + '</span></div>'));
    });
    (s.propositionsObsoletes || []).forEach(function (p) {
      d.appendChild(o.el('<div class="ia2-regle"><span class="ia2-barre">' + e(p.texte) + '</span> <span class="ia2-muet">— obsolète : ' + e(p.raison) + '</span></div>'));
    });
    var a = IA.dossier.analyse;
    d.appendChild(o.el('<div class="ia2-muet ia2-regle">Analyse du ' + e(a.date) + ' · ' + e(a.declencheur) + '</div>'));
    return d;
  };

  // ── Constats d'un document, numerotes comme sur le PDF ──
  ui2.constats = function (d, vue, surClic) {
    var ol = o.el('<ol class="ia2-constats"></ol>');
    var visibles = IA.constatsVisibles(d, vue);
    if (!visibles.length) ol.appendChild(o.el('<li class="ia2-muet">Rien à signaler sur ce document.</li>'));
    visibles.forEach(function (k, n) {
      var li = o.el('<li class="ia2-c ia2-c-' + o.typeConstat(k) + '" tabindex="0"><span class="ia2-num">' + (n + 1) + '</span><span class="ia2-c-texte">' +
        e(vue === 'etudiant' ? k.etudiant : k.texte) + '</span></li>');
      if (vue !== 'etudiant') li.appendChild(IA.ui.signaler('constat:' + d.nom + ':' + n));
      li.addEventListener('click', function (ev) {
        if (ev.target.closest('.ia-signalement')) return;
        Array.prototype.forEach.call(ol.children, function (x) { x.classList.toggle('ia2-actif', x === li); });
        if (surClic) surClic(n);
      });
      ol.appendChild(li);
    });
    ol.activer = function (n) {
      Array.prototype.forEach.call(ol.children, function (x, i) { x.classList.toggle('ia2-actif', i === n); });
      if (ol.children[n]) ol.children[n].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    };
    return ol;
  };

  // ── Haut de page : une pastille « IA » a cote du libelle ; la proposition
  //    s'ouvre juste sous le champ ──
  ui2.champs = function () {
    IA.dossier.champs.forEach(function (c) {
      var champ = document.querySelector(c.selecteur);
      if (!champ) return;
      var cle = 'champ:' + c.cle;
      var apres = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2') ? champ.nextElementSibling : champ;
      var cadre = c.type === 'select' ? (apres.querySelector('.select2-selection') || apres) : champ;
      var label = document.querySelector('label[for="' + champ.id + '"]');
      var puce = o.el('<button type="button" class="ia2-puce" aria-expanded="false" title="Proposition IA"><span class="ia2-point"></span>IA</button>');
      // Juste apres le titre du champ (pour « Statut », dans leur bloc titre,
      // sinon le libelle etale ses elements et la pastille flotte au milieu).
      var titreStatut = label && label.querySelector('.statut-title');
      if (titreStatut) titreStatut.appendChild(puce);
      else if (label) label.appendChild(puce);
      else champ.parentNode.insertBefore(puce, champ);
      var boite = o.el('<div class="ia2-champ" hidden></div>');
      apres.parentNode.insertBefore(boite, apres.nextSibling);
      if (c.type === 'select') {
        boite.appendChild(ui2.verdictChamp(c));
      } else {
        boite.appendChild(ui2.prop({ cle: cle, titre: 'Proposition IA', texte: c.propose, etudiant: c.cle === 'message', lignes: c.type === 'date' ? 1 : 3,
          appliquer: function (v) { IA.ecrire.champ(c, v); } }));
      }
      puce.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        boite.hidden = !boite.hidden;
        puce.setAttribute('aria-expanded', !boite.hidden);
        if (!boite.hidden) ui2.ajuster(boite);
      });
      function maj() {
        var d = IA.decision(cle);
        cadre.classList.toggle('ia2-champ-propose', !d);
        puce.classList.toggle('ia2-puce-fini', !!d);
        if (d) setTimeout(function () { boite.hidden = true; puce.setAttribute('aria-expanded', 'false'); }, 900);
      }
      IA.on('decision', function (x) { if (x.cle === cle) maj(); });
      maj();
    });
  };

  ui2.verdictChamp = function (c) {
    var cle = 'champ:' + c.cle;
    var b = o.el('<div class="ia2-prop"><div class="ia2-prop-tete"><span class="ia2-prop-titre">Proposition IA</span><span class="ia2-etat"></span></div>' +
      '<div class="ia2-statut-propose"></div><div class="ia2-actions"></div></div>');
    function dessiner() {
      var d = IA.decision(cle);
      b.className = 'ia2-prop' + (d ? ' ia2-' + (d.statut === 'refuse' ? 'ignore' : 'applique') : '');
      b.querySelector('.ia2-statut-propose').textContent = c.proposeLibelle;
      b.querySelector('.ia2-etat').textContent = d ? (d.statut === 'refuse' ? 'Ignoré' : 'Appliqué') : '';
      b.querySelector('.ia2-actions').innerHTML = d ? '<button type="button" class="ia2-lien" data-a="annuler">Annuler</button>'
        : '<button type="button" class="ia2-btn ia2-ok" data-a="appliquer">Appliquer</button><button type="button" class="ia2-btn ia2-non" data-a="ignorer">Ignorer</button>';
    }
    b.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      var x = a.getAttribute('data-a');
      if (x === 'appliquer') { IA.ecrire.champ(c, c.propose); IA.decider(cle, 'accepte', c.propose); }
      if (x === 'ignorer') IA.decider(cle, 'refuse', null);
      if (x === 'annuler') IA.annuler(cle);
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === cle) dessiner(); });
    dessiner();
    return b;
  };

  // ── Une ligne discrete au-dessus des documents ──
  ui2.ligne = function (boutons) {
    var l = o.el('<div class="ia2-ligne"><span class="ia2-ligne-marque"><i class="fa fa-magic"></i> Proposition IA</span>' +
      '<span class="ia2-ligne-infos"></span><span class="ia2-sep"></span></div>');
    (boutons || []).forEach(function (b) {
      var n = o.el('<button type="button" class="ia2-btn' + (b.principal ? ' ia2-principal' : '') + '">' + b.html + '</button>');
      n.addEventListener('click', b.action);
      l.appendChild(n);
    });
    var cible = IA.blocDocuments();
    cible.parentNode.insertBefore(l, cible);
    function maj() {
      var restantes = IA.analysees().filter(function (s) { return !IA.progressionSection(s).finie; }).length;
      var revoir = IA.brouillons().length;
      var inc = ui2.nombreIncoherences();
      l.querySelector('.ia2-ligne-infos').innerHTML = (restantes ? '<b>' + restantes + '</b> section' + (restantes > 1 ? 's' : '') + ' à traiter'
        : '<span class="ia2-vert"><i class="fa fa-check"></i> Tout est traité</span>') +
        (inc ? ' · <b class="ia2-rouge">' + inc + '</b> incohérence' + (inc > 1 ? 's' : '') : '') +
        (revoir ? ' · <b>' + revoir + '</b> à revoir' : '');
    }
    IA.on('decision', maj);
    IA.on('brouillon', maj);
    maj();
    return l;
  };

  // Ordre de travail : ce qui demande le plus d'attention d'abord.
  var PRIORITE = { alerte: 0, 'a-corriger': 1, 'a-verifier': 2, provisoire: 3, conforme: 4 };
  ui2.ordre = function () {
    return IA.analysees().slice().sort(function (a, b) { return PRIORITE[a.statut] - PRIORITE[b.statut]; });
  };

  // ── Page des notifications : une pastille discrete sous le nom ──
  ui2.notifications = function () {
    IA.ui.notifications(function (tr, cellule, info) {
      var statut, texte;
      if (info.dossier) {
        var n = info.compte;
        var aFaire = n['a-corriger'] + n['a-verifier'] + n['alerte'] + n['provisoire'];
        statut = aFaire ? 'a-corriger' : 'conforme';
        texte = aFaire ? aFaire + ' à traiter' : 'conforme';
      } else { statut = info.figurant[0]; texte = info.figurant[1]; }
      cellule.appendChild(o.el('<div class="ia2-notif ia2-t-' + statut + '"><span class="ia2-point"></span>IA · ' + e(texte) + '</div>'));
    });
  };

  IA.ui2 = ui2;
})();
