/*
 * Couche IA — presentation de l'analyse des variantes 9 et 10.
 *
 * Suite aux retours du 27/09 sur les variantes 6 a 8 :
 *  - la SECTION a son verdict et son commentaire general juste sous son titre ;
 *  - chaque DOCUMENT a son analyse attachee au PDF : l'analyse (points
 *    numerotes comme les surlignages), son verdict et son commentaire ;
 *  - trois choses seulement : Analyse, Verdict, Commentaire. Pas de note interne ;
 *  - Perle modifie librement ; les fleches ◀ ▶ passent de la proposition de
 *    l'IA a ses propres versions (retour au depart possible a tout moment) ;
 *  - un seul geste pour envoyer : « Valider la section » ecrit verdicts et
 *    commentaires dans Feel Francais, donc chez l'etudiant.
 * Memes cles de decision que les autres variantes (progression, mode test).
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var ui3 = {};

  // ── Versions des commentaires et choix de verdict, gardes d'une visite a l'autre ──
  var CLE = 'ia-demo:versions:v' + IA.variante + ':' + (IA.dossier ? IA.dossier.code : 'liste');
  var memoire = {};
  try { memoire = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (x) { memoire = {}; }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(memoire)); } catch (x) { /* stockage indisponible */ } }

  function unique(s) { return IA.verdictUnique(s) ? docs(s)[0] : null; }
  function docs(s) { return (s.documents || []).filter(function (d) { return d.el; }); }
  ui3.docs = docs;

  // ── Commentaire : texte modifiable, versions ◀ ▶ (Proposition IA, puis celles de Perle) ──
  ui3.commentaire = function (p) {
    var h = memoire[p.cle] = memoire[p.cle] || { versions: [{ auteur: 'IA', texte: p.texteIA || '' }], index: 0 };
    var el = o.el('<div class="ia3-com"><div class="ia3-com-tete"><span class="ia3-com-titre">' + e(p.titre) + '</span>' +
      '<i class="fa fa-eye ia3-discret" title="Visible par l’étudiant après validation"></i><span class="ia3-sep"></span>' +
      '<span class="ia3-versions"><button type="button" class="ia3-fleche" data-d="-1" title="Version précédente" aria-label="Version précédente">' +
      '<i class="fa fa-chevron-left"></i></button><span class="ia3-version"></span>' +
      '<button type="button" class="ia3-fleche" data-d="1" title="Version suivante" aria-label="Version suivante"><i class="fa fa-chevron-right"></i></button></span></div>' +
      '<textarea rows="2" placeholder="Aucun commentaire : rien ne sera envoyé à l’étudiant."></textarea></div>');
    var zone = el.querySelector('textarea');
    function hauteur() { zone.style.height = 'auto'; zone.style.height = Math.min(zone.scrollHeight + 2, 240) + 'px'; }
    function afficher() {
      var v = h.versions[h.index];
      zone.value = v.texte;
      var ia = v.auteur === 'IA';
      el.querySelector('.ia3-version').innerHTML = (ia ? '<i class="fa fa-magic"></i> Proposition IA' : 'Votre version ' + h.index) +
        (h.versions.length > 1 ? ' <span class="ia3-muet">' + (h.index + 1) + '/' + h.versions.length + '</span>' : '');
      el.classList.toggle('ia3-com-perso', !ia);
      el.querySelector('[data-d="-1"]').disabled = h.index === 0;
      el.querySelector('[data-d="1"]').disabled = h.index === h.versions.length - 1;
      el.querySelector('.ia3-versions').hidden = h.versions.length < 2;
      setTimeout(hauteur, 0);
    }
    // Une modification devient une nouvelle version quand Perle quitte le champ.
    function figer() {
      if (zone.value === h.versions[h.index].texte) return;
      h.versions.push({ auteur: 'Perle', texte: zone.value, le: new Date().toISOString() });
      h.index = h.versions.length - 1;
      sauver();
      afficher();
    }
    zone.addEventListener('input', hauteur);
    zone.addEventListener('blur', figer);
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-d]');
      if (!b || b.disabled) return;
      figer();
      h.index = Math.max(0, Math.min(h.versions.length - 1, h.index + (+b.getAttribute('data-d'))));
      sauver();
      afficher();
    });
    el.valeur = function () { figer(); return zone.value.trim(); };
    el.texteIA = p.texteIA || '';
    afficher();
    return el;
  };

  // ── Verdict : [valid] [invalid], la proposition de l'IA preselectionnee ──
  ui3.verdict = function (p) {
    var m = memoire['verdict:' + p.cle];
    var choix = m ? m.choix : p.propose;
    var el = o.el('<div class="ia3-verdict"><span class="ia3-verdict-titre">' + e(p.titre) + '</span>' +
      '<span class="ia3-seg" role="radiogroup" aria-label="' + e(p.titre) + '">' +
      '<button type="button" role="radio" data-v="valide"><i class="fa fa-check"></i> valid</button>' +
      '<button type="button" role="radio" data-v="invalide"><i class="fa fa-times"></i> invalid</button></span>' +
      '<span class="ia3-muet ia3-verdict-note"></span></div>');
    function dessiner() {
      el.querySelectorAll('[data-v]').forEach(function (b) {
        var v = b.getAttribute('data-v');
        b.classList.toggle('ia3-choisi', choix === v);
        b.setAttribute('aria-checked', choix === v);
        b.classList.toggle('ia3-propose', p.propose === v);
      });
      el.querySelector('.ia3-verdict-note').textContent = !choix ? 'à décider — l’IA ne tranche pas'
        : (p.propose && choix !== p.propose ? 'modifié (l’IA proposait ' + (p.propose === 'valide' ? 'valid' : 'invalid') + ')' : 'proposé par l’IA');
    }
    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-v]');
      if (!b) return;
      choix = b.getAttribute('data-v');
      memoire['verdict:' + p.cle] = { choix: choix };
      sauver();
      dessiner();
    });
    el.valeur = function () { return choix || null; };
    el.propose = p.propose;
    dessiner();
    return el;
  };

  function propose(v) { return v === 'a-verifier' ? null : v; }
  // Le verdict de SECTION suit le statut de la section, meme avec une seule piece.
  function verdictSection(s) { return { 'conforme': 'valide', 'a-corriger': 'invalide' }[s.statut] || null; }

  // ── La colonne SECTION : verdict + commentaire general sous le titre ──
  ui3.section = function (s) {
    var comps = {};
    var el = o.el('<div class="ia3-section-col"><div class="ia3-s-tete"><span class="ia3-etiquette">Section</span>' +
      '<b>' + e(IA.ui2.nom(s)) + '</b><span class="ia2-tag ia2-t-' + s.statut + '" style="position:static"><span class="ia2-point"></span>' +
      e(IA.ui2.COURT[s.statut]) + '</span></div><div class="ia3-s-resume">' + e(s.resume || '') + '</div></div>');
    var u = unique(s);
    if (s.statut !== 'alerte') {
      comps.verdict = ui3.verdict({ cle: 'sec:' + s.alias, titre: u ? 'Verdict' : 'Verdict de la section',
        propose: verdictSection(s) });
      el.appendChild(comps.verdict);
    }
    comps.commentaire = ui3.commentaire({ cle: 'sec:' + s.alias + ':etudiant', titre: 'Commentaire général',
      texteIA: (s.commentaireSection || {}).etudiant || '' });
    el.appendChild(comps.commentaire);
    [IA.ui2.incoherences(s), IA.ui2.aSavoir(s)].forEach(function (b) { if (b) el.appendChild(b); });
    el.appendChild(IA.ui2.details(s));
    return { el: el, comps: comps };
  };

  // ── Note interne : facultative, repliee, jamais pre-remplie par l'IA. Elle
  //    permet de remplir toutes les cases que Perle remplit dans Feel Francais. ──
  ui3.noteInterne = function (cle, libelle) {
    var m = memoire['note:' + cle] || { texte: '' };
    var el = o.el('<div class="ia3-note"><button type="button" class="ia3-note-lien"><i class="fa fa-lock"></i> ' + e(libelle) +
      ' <span class="ia3-muet">(facultatif, staff uniquement)</span></button><textarea rows="2" hidden placeholder="Note pour l’équipe — l’étudiant ne la voit pas."></textarea></div>');
    var zone = el.querySelector('textarea');
    zone.value = m.texte;
    if (m.texte) zone.hidden = false;
    el.querySelector('.ia3-note-lien').addEventListener('click', function () { zone.hidden = !zone.hidden; if (!zone.hidden) zone.focus(); });
    zone.addEventListener('blur', function () { memoire['note:' + cle] = { texte: zone.value }; sauver(); });
    el.valeur = function () { return zone.value.trim(); };
    return el;
  };

  // Incoherences en une ligne chacune (pour le bandeau du haut).
  ui3.incoherencesCompactes = function (s) {
    var contra = (s.croisements || []).filter(function (x) { return x.resultat !== 'coherent'; });
    var liees = s.piecesLiees || [];
    if (!contra.length && !liees.length) return null;
    var el = o.el('<div class="ia3-inc"><span class="ia3-inc-titre"><i class="fa fa-link"></i> Incohérences</span></div>');
    contra.forEach(function (x) {
      var l = o.el('<span class="ia3-inc-item"><i class="fa fa-exclamation-circle ia2-rouge"></i> ' + e(x.titre) + ' : <b>' + e(x.a.valeur) +
        '</b> ↔ <b>' + e(x.b.valeur) + '</b> <button type="button" class="ia2-lien">Comparer</button></span>');
      l.querySelector('button').addEventListener('click', function () {
        IA.ui.ouvrirCote(x.titre, { libelle: x.a.fichier, valeur: x.a.valeur, nom: x.a.nom, rect: x.a.rect, teinte: 'probleme' },
          { libelle: x.b.fichier, valeur: x.b.valeur, nom: x.b.nom, rect: x.b.rect, teinte: 'probleme' });
      });
      el.appendChild(l);
    });
    liees.forEach(function (p) {
      el.appendChild(o.el('<span class="ia3-inc-item" title="' + e(p.texte) + '"><i class="fa fa-chain-broken ia2-rouge"></i> ' + e(p.section) +
        ' : <b>' + e(p.etat) + '</b></span>'));
    });
    return el;
  };

  // « A savoir » sans l'alerte (l'alerte va dans la zone de decision de la section).
  function separerAlerte(s) {
    var bloc = IA.ui2.aSavoir(s);
    var alerte = bloc && bloc.querySelector('.ia2-info-alerte');
    if (alerte) {
      alerte.remove();
      if (!bloc.querySelector('.ia2-info')) bloc = null;
    }
    return { aSavoir: bloc, alerte: alerte };
  }
  ui3.separerAlerte = separerAlerte;

  // Zone de decision de la SECTION : verdict (ou alerte) + commentaire general + note generale interne.
  ui3.decisionSection = function (s, alerte) {
    var comps = {};
    var el = o.el('<div class="ia3-decision-section"><div class="ia3-ds-verdict"></div><div class="ia3-ds-com"></div></div>');
    var u = unique(s);
    if (s.statut !== 'alerte') {
      comps.verdict = ui3.verdict({ cle: 'sec:' + s.alias, titre: u ? 'Verdict' : 'Verdict de la section', propose: verdictSection(s) });
      el.querySelector('.ia3-ds-verdict').appendChild(comps.verdict);
      if (u) el.querySelector('.ia3-ds-verdict').appendChild(o.el('<div class="ia3-muet ia3-petit">Une seule pièce : ce verdict vaut aussi pour le document.</div>'));
    } else if (alerte) {
      el.querySelector('.ia3-ds-verdict').appendChild(alerte);
    }
    comps.commentaire = ui3.commentaire({ cle: 'sec:' + s.alias + ':etudiant', titre: 'Commentaire général', texteIA: (s.commentaireSection || {}).etudiant || '' });
    comps.note = ui3.noteInterne('sec:' + s.alias, 'Note générale interne');
    el.querySelector('.ia3-ds-com').appendChild(comps.commentaire);
    el.querySelector('.ia3-ds-com').appendChild(comps.note);
    return { el: el, comps: comps };
  };

  // Bandeau du HAUT de la fenetre : on voit toujours quelle section on traite.
  //   options.decision : la zone de decision est dans le bandeau (variante 12) ;
  //   sinon un simple rappel de la decision prise sur la page (variante 11).
  ui3.bandeau = function (s, options) {
    options = options || {};
    var el = o.el('<div class="ia3-bandeau"><div class="ia3-b-titre"><span class="ia3-etiquette">Section</span><b>' + e(IA.ui2.nom(s)) +
      '</b><span class="ia2-tag ia2-t-' + s.statut + '" style="position:static"><span class="ia2-point"></span>' + e(IA.ui2.COURT[s.statut]) +
      '</span><span class="ia3-muet ia3-b-resume">' + e(s.resume || '') + '</span></div></div>');
    var parts = separerAlerte(s);
    var res = { el: el, aSavoir: parts.aSavoir, comps: null };
    if (options.decision) {
      var d = ui3.decisionSection(s, parts.alerte);
      el.appendChild(d.el);
      res.comps = d.comps;
    } else if (options.rappel) {
      el.appendChild(options.rappel(parts.alerte));
    }
    var inc = ui3.incoherencesCompactes(s);
    if (inc) el.appendChild(inc);
    return res;
  };

  // ── Le cadre DOCUMENT : PDF + son analyse (points, verdict, commentaire) ──
  ui3.documents = function (s, options) {
    options = options || {};
    var liste = docs(s);
    var u = unique(s);
    var comps = { verdicts: {}, commentaires: {} };
    var el = o.el('<div class="ia3-docs"><div class="ia3-onglets" role="tablist"></div><div class="ia3-doc"><div class="ia3-pdf"></div>' +
      '<aside class="ia3-analyse"></aside></div></div>');
    var onglets = el.querySelector('.ia3-onglets');
    var aside = el.querySelector('.ia3-analyse');
    var vue = 'admin';
    var panneaux = liste.map(function (d, i) {
      var p = o.el('<div class="ia3-panneau" hidden><div class="ia3-a-tete"><span class="ia3-etiquette">Document</span><b>' + e(d.sousType) +
        '</b></div><div class="ia3-a-titre"><i class="fa fa-search"></i> Analyse</div><div class="ia3-points"></div></div>');
      if (!u && s.statut !== 'alerte') {
        comps.verdicts[d.nom] = ui3.verdict({ cle: 'doc:' + d.nom, titre: 'Verdict du document', propose: propose(d.verdict) });
        p.appendChild(comps.verdicts[d.nom]);
      } else if (u) {
        p.appendChild(o.el('<div class="ia3-muet ia3-lien-verdict">Verdict : celui de la section.</div>'));
      }
      comps.commentaires[d.nom] = ui3.commentaire({ cle: 'doc:' + d.nom + ':etudiant', titre: 'Commentaire', texteIA: (d.commentaire || {}).etudiant || '' });
      p.appendChild(comps.commentaires[d.nom]);
      if (options.notes) {
        comps.notes = comps.notes || {};
        comps.notes[d.nom] = ui3.noteInterne('doc:' + d.nom, 'Note interne');
        p.appendChild(comps.notes[d.nom]);
      }
      aside.appendChild(p);
      return p;
    });
    if (options.apres) aside.appendChild(options.apres);
    var v;
    function points() {
      panneaux.forEach(function (p, i) {
        var z = p.querySelector('.ia3-points');
        z.innerHTML = '';
        var l = IA.ui2.constats(liste[i], vue, function (n) { v.activer(n); });
        p.__liste = l;
        z.appendChild(l);
      });
    }
    function montrer(i) {
      panneaux.forEach(function (p, j) { p.hidden = j !== i; });
      onglets.querySelectorAll('button').forEach(function (b, j) { b.classList.toggle('ia3-actif', j === i); });
      if (v && v.index !== i) v.afficher(i);
      setTimeout(function () { IA.ui2.ajuster(panneaux[i]); el.querySelectorAll('.ia3-com textarea').forEach(function (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 240) + 'px'; }); }, 0);
    }
    liste.forEach(function (d, i) {
      var n = IA.constatsVisibles(d, 'admin').filter(function (k) { return k.probleme || k.type === 'a-verifier'; }).length;
      var b = o.el('<button type="button" role="tab" class="ia3-onglet"><span class="ia3-pastille-doc ia3-pd-' + (d.verdict || 'valide') + '"></span>' +
        e(d.sousType) + (n ? ' <span class="ia3-nb">' + n + '</span>' : '') + '</button>');
      b.addEventListener('click', function () { montrer(i); });
      onglets.appendChild(b);
    });
    onglets.hidden = liste.length < 2;
    points();
    v = new IA.Visionneuse(el.querySelector('.ia3-pdf'), {
      documents: liste, compact: true,
      surConstat: function (d, k, n) { var p = panneaux[liste.indexOf(d)]; if (p && p.__liste) p.__liste.activer(n); },
      surVue: function (x) { vue = x; points(); }
    });
    montrer(0);
    return { el: el, comps: comps, visionneuse: v };
  };

  // ── Valider la section : ecrit verdicts et commentaires dans Feel Francais ──
  function decisionTexte(cle, texteIA, valeur) {
    if (!texteIA && !valeur) return;               // rien propose, rien ecrit
    if (!texteIA) return;                          // commentaire ajoute par Perle : ecrit, sans cle IA
    IA.decider(cle, !valeur ? 'refuse' : (valeur === texteIA ? 'accepte' : 'modifie'), valeur || null);
  }
  // Note interne : l'IA n'en propose plus ; celle que Perle ecrit est enregistree.
  function decisionNote(cle, aCle, valeur) {
    if (aCle) IA.decider(cle, valeur ? 'modifie' : 'refuse', valeur || null);
  }

  // Partie SECTION : verdict general, commentaire general, note generale interne.
  ui3.validerSection = function (s, comps) {
    var u = unique(s);
    if (comps.verdict && !comps.verdict.valeur()) return { ok: false, manque: ['le verdict de la section'] };
    if (comps.verdict) {
      var v = comps.verdict.valeur();
      IA.ecrire.verdictSection(s, v === 'valide');
      if (u) IA.ecrire.verdictDocument(u, v === 'valide');
      IA.decider('sec:' + s.alias + ':verdict', v === comps.verdict.propose ? 'accepte' : 'modifie', v);
    }
    var cg = comps.commentaire.valeur();
    if (cg) IA.ecrire.commentaire(s.idSection, 'general', cg);
    decisionTexte('sec:' + s.alias + ':etudiant', comps.commentaire.texteIA, cg);
    var ng = comps.note ? comps.note.valeur() : '';
    if (ng) IA.ecrire.commentaire(s.idSection, 'internal-general', ng);
    decisionNote('sec:' + s.alias + ':interne', !!(s.commentaireSection || {}).interne, ng);
    return { ok: true };
  };

  // Partie DOCUMENTS : verdict, commentaire et note interne de chaque piece.
  ui3.validerDocuments = function (s, cadre) {
    var manque = [];
    Object.keys(cadre.comps.verdicts).forEach(function (nom) {
      if (!cadre.comps.verdicts[nom].valeur()) manque.push('le verdict de « ' + docs(s).filter(function (d) { return d.nom === nom; })[0].sousType + ' »');
    });
    if (manque.length) return { ok: false, manque: manque };
    docs(s).forEach(function (d) {
      var vd = cadre.comps.verdicts[d.nom];
      if (vd) {
        IA.ecrire.verdictDocument(d, vd.valeur() === 'valide');
        IA.decider('doc:' + d.nom + ':verdict', vd.valeur() === vd.propose ? 'accepte' : 'modifie', vd.valeur());
      }
      var c = cadre.comps.commentaires[d.nom];
      var t = c.valeur();
      if (t) IA.ecrire.commentaire(d.id, 'staff', t);
      decisionTexte('doc:' + d.nom + ':etudiant', c.texteIA, t);
      var n = cadre.comps.notes && cadre.comps.notes[d.nom] ? cadre.comps.notes[d.nom].valeur() : '';
      if (n) IA.ecrire.commentaire(d.id, 'internal', n);
      decisionNote('doc:' + d.nom + ':interne', !!(d.commentaire || {}).interne, n);
    });
    return { ok: true };
  };

  // Les deux d'un coup (variantes 9, 10 et 12).
  ui3.valider = function (s, colonne, cadre) {
    var manque = [];
    if (colonne.comps.verdict && !colonne.comps.verdict.valeur()) manque.push('le verdict de la section');
    Object.keys(cadre.comps.verdicts).forEach(function (nom) {
      if (!cadre.comps.verdicts[nom].valeur()) manque.push('le verdict de « ' + docs(s).filter(function (d) { return d.nom === nom; })[0].sousType + ' »');
    });
    if (manque.length) return { ok: false, manque: manque };
    ui3.validerSection(s, colonne.comps);
    ui3.validerDocuments(s, cadre);
    var reste = IA.propositionsSection(s).filter(function (p) { return !IA.decision(p.cle); });
    return { ok: true, reste: reste };
  };

  ui3.reste = function (s) { return IA.propositionsSection(s).filter(function (p) { return !IA.decision(p.cle); }); };

  // Valider une section sans l'ouvrir (etape « conformes ») : la derniere
  // version choisie par Perle, sinon la proposition de l'IA. Jamais de note interne.
  ui3.validerDirect = function (s) {
    var u = unique(s);
    function version(cle, texteIA) {
      var h = memoire[cle];
      return (h ? h.versions[h.index].texte : texteIA || '').trim();
    }
    if (s.statut !== 'alerte') {
      var m = memoire['verdict:sec:' + s.alias];
      var v = m ? m.choix : verdictSection(s);
      if (!v) return false;
      IA.ecrire.verdictSection(s, v === 'valide');
      if (u) IA.ecrire.verdictDocument(u, v === 'valide');
      IA.decider('sec:' + s.alias + ':verdict', m ? 'modifie' : 'accepte', v);
    }
    var cs = s.commentaireSection || {};
    var cg = version('sec:' + s.alias + ':etudiant', cs.etudiant);
    if (cg) IA.ecrire.commentaire(s.idSection, 'general', cg);
    decisionTexte('sec:' + s.alias + ':etudiant', cs.etudiant || '', cg);
    if (cs.interne) IA.decider('sec:' + s.alias + ':interne', 'refuse', null);
    docs(s).forEach(function (d) {
      if (!u && s.statut !== 'alerte') {
        var md = memoire['verdict:doc:' + d.nom];
        var vd = md ? md.choix : propose(d.verdict);
        if (vd) {
          IA.ecrire.verdictDocument(d, vd === 'valide');
          IA.decider('doc:' + d.nom + ':verdict', md ? 'modifie' : 'accepte', vd);
        }
      }
      var c = d.commentaire || {};
      var t = version('doc:' + d.nom + ':etudiant', c.etudiant);
      if (t) IA.ecrire.commentaire(d.id, 'staff', t);
      decisionTexte('doc:' + d.nom + ':etudiant', c.etudiant || '', t);
      if (c.interne) IA.decider('doc:' + d.nom + ':interne', 'refuse', null);
    });
    return IA.progressionSection(s).finie;
  };

  // ── Champs du haut de page : meme logique (versions ◀ ▶ + Appliquer) ──
  ui3.champ = function (c) {
    var cle = 'champ:' + c.cle;
    var box = o.el('<div class="ia3-champ-prop"></div>');
    if (c.type === 'select') {
      box.appendChild(IA.ui2.verdictChamp(c));
      return box;
    }
    var com = ui3.commentaire({ cle: cle, titre: 'Proposition IA', texteIA: c.propose });
    if (c.cle !== 'message') com.querySelector('.ia3-discret').remove();
    box.appendChild(com);
    var actions = o.el('<div class="ia3-actions"></div>');
    box.appendChild(actions);
    function dessiner() {
      var d = IA.decision(cle);
      actions.innerHTML = d ? '<span class="ia3-muet"><i class="fa fa-check ia2-vert"></i> Appliqué</span><button type="button" class="ia2-lien" data-a="refaire">Modifier</button>'
        : '<button type="button" class="ia2-btn ia2-ok" data-a="appliquer">Appliquer</button>';
    }
    actions.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a) return;
      if (a.getAttribute('data-a') === 'appliquer') {
        var t = com.valeur();
        IA.ecrire.champ(c, t);
        IA.decider(cle, t === c.propose ? 'accepte' : 'modifie', t);
      } else IA.annuler(cle);
      dessiner();
    });
    IA.on('decision', function (x) { if (x.cle === cle) dessiner(); });
    dessiner();
    return box;
  };

  ui3.champs = function () {
    IA.dossier.champs.forEach(function (c) {
      var champ = document.querySelector(c.selecteur);
      if (!champ) return;
      var cle = 'champ:' + c.cle;
      var apres = c.type === 'select' && champ.nextElementSibling && champ.nextElementSibling.classList.contains('select2') ? champ.nextElementSibling : champ;
      var cadre = c.type === 'select' ? (apres.querySelector('.select2-selection') || apres) : champ;
      var label = document.querySelector('label[for="' + champ.id + '"]');
      var puce = o.el('<button type="button" class="ia2-puce" aria-expanded="false" title="Proposition IA"><span class="ia2-point"></span>IA</button>');
      var titreStatut = label && label.querySelector('.statut-title');
      if (titreStatut) titreStatut.appendChild(puce); else if (label) label.appendChild(puce); else champ.parentNode.insertBefore(puce, champ);
      var boite = o.el('<div class="ia2-champ" hidden></div>');
      boite.appendChild(ui3.champ(c));
      apres.parentNode.insertBefore(boite, apres.nextSibling);
      puce.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        boite.hidden = !boite.hidden;
        puce.setAttribute('aria-expanded', !boite.hidden);
        if (!boite.hidden) boite.querySelectorAll('textarea').forEach(function (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 240) + 'px'; });
      });
      function maj() {
        var d = IA.decision(cle);
        cadre.classList.toggle('ia2-champ-propose', !d);
        puce.classList.toggle('ia2-puce-fini', !!d);
      }
      IA.on('decision', function (x) { if (x.cle === cle) maj(); });
      maj();
    });
  };

  // Page « Dossier » commune : synthese + champs.
  ui3.dossier = function () {
    var d = IA.dossier;
    var box = o.el('<div></div>');
    box.appendChild(o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-folder-open-o"></i>Synthèse</h4>' +
      d.dossier.synthese.map(function (x) { return '<div class="ia2-info">' + e(x) + '</div>'; }).join('') + '</section>'));
    var champs = o.el('<section class="ia2-bloc"><h4 class="ia2-titre"><i class="fa fa-pencil-square-o"></i>Champs du dossier</h4></section>');
    d.champs.forEach(function (c) {
      champs.appendChild(o.el('<div class="ia3-champ-lib">' + e(c.libelle) + '</div>'));
      champs.appendChild(ui3.champ(c));
    });
    box.appendChild(champs);
    var cf = IA.ui.campusFrance();
    if (cf) box.appendChild(cf);
    return box;
  };

  ui3.oublier = function () { memoire = {}; sauver(); };
  IA.ui3 = ui3;
})();
