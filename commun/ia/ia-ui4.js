/*
 * Couche IA — variante 13 : UNE seule carte « Proposition IA », partout pareille.
 *
 * Retours du 28/09 sur la variante 11 :
 *  - toutes les propositions ont la meme structure (Statut, Zone, Visa,
 *    section, document) : un vrai titre, l'etat, le contenu, puis quatre gestes
 *    Accepter · Modifier (puis accepter) · Refuser · Annuler (retour en arriere) ;
 *  - l'etat se lit a l'icone : ⏱ a decider, ✓ decide (accepte ou refuse) ;
 *  - l'analyse d'un document est decoupee en parties separees :
 *    Analyse (modifiable, constats ajoutes par Perle) · Verdict propose par l'IA ·
 *    Commentaire (+ PDF annote joint) · Note interne · Versions precedentes ;
 *  - le verdict propose par l'IA est toujours affiche explicitement.
 * « Annuler » remet aussi les cases de Feel Francais dans l'etat d'avant.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var ui4 = {};

  // ── Memoire (versions, choix, analyses modifiees) gardee d'une visite a l'autre ──
  var CLE = 'ia-demo:v13:' + (IA.dossier ? IA.dossier.code : 'liste');
  var m = {};
  try { m = JSON.parse(localStorage.getItem(CLE)) || {}; } catch (x) { m = {}; }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(m)); } catch (x) { /* stockage indisponible */ } }
  // Etat des decisions et instantanes pour « Annuler » : en memoire seulement,
  // comme les cases de Feel Francais (un rechargement remet tout a zero).
  var session = {};
  ui4.memoire = function (cle, valeur) {
    if (arguments.length > 1) { m[cle] = valeur; sauver(); }
    return m[cle];
  };

  // Les cartes d'un meme identifiant (page + fenetre) se redessinent ensemble.
  var cartes = {};
  function redessiner(id) { (cartes[id] || []).forEach(function (f) { if (document.contains(f.el)) f(); }); }
  ui4.redessiner = redessiner;

  // ── Instantanes des cases Feel Francais, pour « Annuler » ──
  var ff = {
    verdict: function (el) {
      var b = el && el.querySelector('.active');
      return b ? (b.classList.contains('valid') ? 'valide' : 'invalide') : null;
    },
    remettreVerdict: function (conteneur, selecteur, avant, ecrire) {
      if (avant) { ecrire(avant === 'valide'); return; }
      conteneur.querySelectorAll(selecteur).forEach(function (b) { b.classList.remove('active'); });
    },
    note: function (idDoc, note) {
      var c = document.querySelector('.doc-note-card[data-note="' + note + '"][data-doc-id="' + idDoc + '"] textarea');
      return c ? c.value : '';
    },
    valeur: function (sel) {
      var el = document.querySelector(sel);
      return el ? (el.type === 'checkbox' ? el.checked : el.value) : null;
    }
  };
  ui4.ff = ff;

  function icone(etat) {
    return etat === 'attente' ? '<i class="fa fa-clock-o"></i>' : '<i class="fa fa-check"></i>';
  }

  // ── Copier dans le presse-papiers ──
  ui4.copier = function (texte) {
    function ok() { o.toast('Copié dans le presse-papiers.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(ok, function () { secours(); });
    } else secours();
    function secours() {
      var t = document.createElement('textarea');
      t.value = texte;
      t.setAttribute('data-ia', '');
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { document.execCommand('copy'); ok(); } catch (x) { o.toast('Copie impossible dans ce navigateur.'); }
      t.remove();
    }
  };
  ui4.boutonCopier = function (titre, lire) {
    var b = o.el('<button type="button" class="ia4-copier" title="' + e(titre) + '"><i class="fa fa-clone"></i> Copier</button>');
    b.addEventListener('click', function (ev) { ev.stopPropagation(); ui4.copier(lire()); });
    return b;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // LA CARTE
  //   p = { id, titre, sousTitre?, champs: [...], avant?: el, apres?: [el...],
  //         cles: () => [cles de decision], appliquer(valeurs) -> instantane,
  //         annuler(instantane), refuser(), deja(): bool }
  //   champ = { id, libelle, type: texte|date|select|verdict|case|choix,
  //             ia: valeur proposee, options?: [[valeur, libelle]], etudiant?,
  //             facultatif?, info?, joint?: {url, nom}, avant?: el (pose juste avant) }
  // ─────────────────────────────────────────────────────────────────────────
  ui4.carte = function (p) {
    var el = o.el('<div class="ia4-carte" data-carte="' + e(p.id) + '"></div>');
    var edition = false;
    // Carte repliable (p.repliable = cle de preference) : repliee, elle tient sur
    // une ligne (titre, resume de la decision, etat) ; le choix est memorise.
    function replie() { return !!(p.repliable && !edition && m['pref:' + p.repliable]); }
    function etatCarte() {
      var cles = p.cles();
      if (!cles.length) return session['etat:' + p.id] || 'attente';
      var ds = cles.map(function (c) { return IA.decision(c); });
      if (ds.every(function (d) { return d; })) return ds.every(function (d) { return d.statut === 'refuse'; }) ? 'refuse' : 'accepte';
      return 'attente';
    }
    // Versions : [valeur IA, versions de Perle...] ; index affiche.
    function hist(ch) {
      var k = 'v:' + p.id + ':' + ch.id;
      if (!m[k]) m[k] = { versions: [ch.ia == null ? '' : ch.ia], index: 0 };
      return m[k];
    }
    function valeur(ch) { var h = hist(ch); return h.versions[h.index]; }

    function affichage(ch, v) {
      if (ch.type === 'verdict') {
        return '<span class="ia4-seg ia4-seg-lecture">' + ['valide', 'invalide'].map(function (x) {
          return '<span class="ia4-opt ia4-opt-' + x + (v === x ? ' ia4-choisi' : '') + '">' + (x === 'valide' ? '<i class="fa fa-check"></i> valid' : '<i class="fa fa-times"></i> invalid') +
            (ch.ia === x ? ' <span class="ia4-ia">IA</span>' : '') + '</span>';
        }).join('') + '</span>' + (!v ? ' <span class="ia4-muet">à décider — l’IA ne tranche pas</span>' : '');
      }
      if (ch.type === 'select' || ch.type === 'choix') {
        var opt = (ch.options || []).filter(function (x) { return x[0] === v; })[0];
        return '<span class="ia4-valeur-forte">' + e(opt ? opt[1] : v) + '</span>';
      }
      if (ch.type === 'case') {
        return '<span class="ia4-valeur-forte"><i class="fa ' + (v && v.coche ? 'fa-check-square-o' : 'fa-square-o') + '"></i> ' +
          (v && v.coche ? 'Cocher' : 'Laisser décoché') + '</span>' + (v && v.coche && v.le ? ' <span class="ia4-muet">· date ' + e(v.le) + '</span>' : '');
      }
      if (!v) return '<span class="ia4-muet">' + (ch.facultatif ? 'Aucune — facultatif. « Modifier » pour en écrire une.' : 'Aucun — rien ne sera écrit.') + '</span>';
      return '<div class="ia4-texte">' + e(v).replace(/\n/g, '<br>') + '</div>';
    }
    function controle(ch, v) {
      if (ch.type === 'verdict') {
        return '<span class="ia4-seg" data-ch="' + ch.id + '">' + ['valide', 'invalide'].map(function (x) {
          return '<button type="button" class="ia4-opt ia4-opt-' + x + (v === x ? ' ia4-choisi' : '') + '" data-v="' + x + '">' +
            (x === 'valide' ? '<i class="fa fa-check"></i> valid' : '<i class="fa fa-times"></i> invalid') + (ch.ia === x ? ' <span class="ia4-ia">IA</span>' : '') + '</button>';
        }).join('') + '</span>';
      }
      if (ch.type === 'select' || ch.type === 'choix') {
        return '<select class="ia4-select" data-ch="' + ch.id + '">' + ch.options.map(function (x) {
          return '<option value="' + e(x[0]) + '"' + (x[0] === v ? ' selected' : '') + '>' + e(x[1]) + (x[0] === ch.ia ? ' (IA)' : '') + '</option>';
        }).join('') + '</select>';
      }
      if (ch.type === 'case') {
        return '<label class="ia4-case"><input type="checkbox" data-ch="' + ch.id + '" data-part="coche"' + (v && v.coche ? ' checked' : '') + '> Cocher</label>' +
          ' <input class="ia4-date" data-ch="' + ch.id + '" data-part="le" value="' + e(v && v.le || '') + '" placeholder="jj/mm/aaaa">';
      }
      if (ch.type === 'date') return '<input class="ia4-date" data-ch="' + ch.id + '" value="' + e(v || '') + '" placeholder="jj/mm/aaaa">';
      return '<textarea data-ch="' + ch.id + '" rows="3">' + e(v || '') + '</textarea>';
    }
    function lireControle(ch) {
      if (ch.type === 'verdict') { var b = el.querySelector('[data-ch="' + ch.id + '"] .ia4-choisi'); return b ? b.getAttribute('data-v') : null; }
      if (ch.type === 'case') {
        return { coche: el.querySelector('[data-ch="' + ch.id + '"][data-part="coche"]').checked,
                 le: el.querySelector('[data-ch="' + ch.id + '"][data-part="le"]').value.trim() };
      }
      var c = el.querySelector('[data-ch="' + ch.id + '"]');
      return c ? (c.tagName === 'TEXTAREA' ? c.value.trim() : c.value) : null;
    }
    function egal(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

    function dessiner() {
      var etat = etatCarte();
      var decide = etat !== 'attente';
      var ferme = replie();
      el.className = 'ia4-carte ia4-' + etat + (edition ? ' ia4-edition' : '') + (p.repliable ? ' ia4-repliable' : '') + (ferme ? ' ia4-replie' : '');
      var resume = '';
      if (ferme && p.resume) {
        var vals = {};
        p.champs.forEach(function (ch) { vals[ch.id] = valeur(ch); });
        resume = '<span class="ia4-c-resume">' + p.resume(vals) + '</span>';
      }
      var html = '<div class="ia4-c-tete"' + (p.repliable ? ' data-a="basculer" title="' + (ferme ? 'Déplier' : 'Replier') + '"' : '') + '>' +
        '<span class="ia4-c-marque"><i class="fa fa-magic"></i> Proposition IA</span>' +
        '<span class="ia4-c-titre">' + e(p.titre) + '</span>' + (p.sousTitre ? '<span class="ia4-muet ia4-c-sous">' + e(p.sousTitre) + '</span>' : '') +
        resume + '<span class="ia4-sep"></span><span class="ia4-etat ia4-etat-' + etat + '">' + icone(etat) + ' ' +
        { attente: 'À décider', accepte: 'Accepté', refuse: 'Refusé' }[etat] + '</span>' +
        (p.repliable ? '<button type="button" class="ia4-plier" aria-expanded="' + !ferme + '" data-a="basculer">' +
          (ferme ? 'Déplier <i class="fa fa-chevron-down"></i>' : 'Replier <i class="fa fa-chevron-up"></i>') + '</button>' : '') +
        '</div><div class="ia4-c-corps"></div><div class="ia4-c-actions"></div>';
      el.innerHTML = html;
      var corps = el.querySelector('.ia4-c-corps');
      if (p.avant) corps.appendChild(p.avant);
      p.champs.forEach(function (ch) {
        if (ch.avant) corps.appendChild(ch.avant);  // bloc a intercaler juste avant ce champ
        var h = hist(ch);
        var v = valeur(ch);
        // Carte a un seul champ : le titre de la carte suffit, on ne le repete pas.
        var lib = p.champs.length > 1 ? ch.libelle : '';
        var bloc = o.el('<div class="ia4-partie" data-partie="' + ch.id + '"><div class="ia4-p-titre' + (lib ? '' : ' ia4-p-titre-seul') + '">' + e(lib) +
          (ch.etudiant ? ' <span class="ia4-vis"><i class="fa fa-eye"></i> visible par l’étudiant</span>' : '') +
          (ch.facultatif ? ' <span class="ia4-vis"><i class="fa fa-lock"></i> staff, facultatif</span>' : '') +
          (ch.info ? ' <i class="fa fa-info-circle ia4-info" title="' + e(ch.info) + '"></i>' : '') + '<span class="ia4-sep"></span>' +
          (!edition && ch.type === 'texte' && v ? '<button type="button" class="ia4-copier" data-copier title="Copier ce texte"><i class="fa fa-clone"></i> Copier</button>' : '') +
          (h.versions.length > 1 && !edition ? '<span class="ia4-versions"><button type="button" data-ver="-1"' + (h.index ? '' : ' disabled') +
            ' title="Version précédente"><i class="fa fa-chevron-left"></i></button><span>' + (h.index ? 'Votre version ' + h.index : '<i class="fa fa-magic"></i> Proposition IA') +
            ' · ' + (h.index + 1) + '/' + h.versions.length + '</span><button type="button" data-ver="1"' + (h.index < h.versions.length - 1 ? '' : ' disabled') +
            ' title="Version suivante"><i class="fa fa-chevron-right"></i></button></span>' : '') + '</div>' +
          '<div class="ia4-p-val">' + (edition ? controle(ch, v) : affichage(ch, v)) + '</div></div>');
        if (ch.joint && v) {
          bloc.appendChild(o.el('<a class="ia4-joint" href="' + e(ch.joint.url) + '" target="_blank" rel="noopener"><i class="fa fa-paperclip"></i> PDF annoté joint au commentaire' +
            ' <span class="ia4-muet">— l’étudiant voit les passages à corriger surlignés</span></a>'));
        }
        bloc.addEventListener('click', function (ev) {
          if (ev.target.closest('[data-copier]')) { ev.stopPropagation(); ui4.copier(valeur(ch) || ''); return; }
          var b = ev.target.closest('[data-ver]');
          if (!b || b.disabled) return;
          h.index = Math.max(0, Math.min(h.versions.length - 1, h.index + (+b.getAttribute('data-ver'))));
          sauver();
          redessiner(p.id);
        });
        corps.appendChild(bloc);
      });
      (p.apres || []).forEach(function (x) { if (x) corps.appendChild(x); });
      var actions = el.querySelector('.ia4-c-actions');
      if (edition) {
        actions.innerHTML = '<button type="button" class="ia4-btn ia4-ok" data-a="accepter-version"><i class="fa fa-check"></i> Accepter ma version</button>' +
          '<button type="button" class="ia4-btn" data-a="fin-edition">Annuler la modification</button>';
        el.querySelectorAll('.ia4-seg button').forEach(function (b) {
          b.addEventListener('click', function () {
            b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('ia4-choisi', x === b); });
          });
        });
        var premier = el.querySelector('textarea, input, select');
        if (premier) setTimeout(function () { premier.focus(); }, 0);
      } else if (decide) {
        actions.innerHTML = '<span class="ia4-muet">' + (etat === 'refuse' ? 'Rien n’a été écrit dans Feel Français.' : 'Écrit dans Feel Français.') + '</span>' +
          '<span class="ia4-sep"></span><button type="button" class="ia4-btn" data-a="annuler"><i class="fa fa-undo"></i> Annuler</button>';
      } else {
        actions.innerHTML = '<button type="button" class="ia4-btn ia4-ok" data-a="accepter"><i class="fa fa-check"></i> Accepter</button>' +
          '<button type="button" class="ia4-btn" data-a="modifier"><i class="fa fa-pencil"></i> Modifier</button>' +
          '<button type="button" class="ia4-btn ia4-non" data-a="refuser"><i class="fa fa-times"></i> Refuser</button>';
      }
    }

    el.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-a]');
      if (!a || !el.contains(a) || a.closest('.ia4-carte') !== el) return;
      var action = a.getAttribute('data-a');
      if (action === 'basculer') {
        if (ev.target.closest('.ia4-etat') && !ev.target.closest('.ia4-plier')) return;
        m['pref:' + p.repliable] = !m['pref:' + p.repliable];
        sauver();
        redessiner(p.id);
        if (p.apresAction) p.apresAction('basculer');
        return;
      }
      if (action === 'modifier') { edition = true; dessiner(); return; }
      if (action === 'fin-edition') { edition = false; dessiner(); return; }
      if (action === 'accepter-version') {
        p.champs.forEach(function (ch) {
          var v = lireControle(ch);
          var h = hist(ch);
          if (!egal(v, h.versions[h.index])) { h.versions.push(v); h.index = h.versions.length - 1; }
        });
        sauver();
        edition = false;
        action = 'accepter';
      }
      if (action === 'accepter') {
        var valeurs = {};
        p.champs.forEach(function (ch) { valeurs[ch.id] = valeur(ch); });
        var manque = p.champs.filter(function (ch) { return ch.type === 'verdict' && !valeurs[ch.id]; });
        if (manque.length) { o.toast('Choisissez d’abord valid ou invalid (« Modifier »).'); edition = true; dessiner(); return; }
        session['snap:' + p.id] = p.appliquer(valeurs, function (ch) { return egal(valeurs[ch.id], ch.ia) ? 'accepte' : 'modifie'; });
        session['etat:' + p.id] = 'accepte';
      }
      if (action === 'refuser') { p.refuser(); session['etat:' + p.id] = 'refuse'; }
      if (action === 'annuler') {
        p.annuler(session['snap:' + p.id] || {});
        delete session['snap:' + p.id];
        delete session['etat:' + p.id];
        o.toast('Annulé : la proposition est de nouveau à décider.');
      }
      redessiner(p.id);
      if (p.apresAction) p.apresAction(action);
    });
    cartes[p.id] = (cartes[p.id] || []).filter(function (f) { return document.contains(f.el); });
    dessiner.el = el;
    cartes[p.id].push(dessiner);
    IA.on('decision', function () { if (document.contains(el) && !edition) dessiner(); });
    dessiner();
    return el;
  };

  // ── Etat d'un groupe de cles : pour les pastilles et les etiquettes ──
  ui4.etat = function (cles, id) {
    if (!cles.length) return session['etat:' + id] ? 'decide' : 'attente';
    return cles.every(function (c) { return IA.decision(c); }) ? 'decide' : 'attente';
  };
  ui4.icone = icone;

  // Texte propose selon la langue de l'etudiant.
  ui4.langue = function () { return (IA.dossier.langue || 'fr').toUpperCase(); };

  IA.ui4 = ui4;
})();
