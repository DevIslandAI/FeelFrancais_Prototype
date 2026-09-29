/*
 * Variante B · Pas a pas  (memes fonctionnalites que le prototype 13)
 *
 * Principe (document sur la charge cognitive) : limiter le nombre d'elements a
 * traiter EN MEME TEMPS. Un guide en bas de l'ecran amene Perle d'une
 * proposition a la suivante : il fait defiler la page jusqu'a elle, la met en
 * avant, estompe les autres, et reprend ses boutons (Accepter / Refuser), plus
 * « Passer ». Les documents s'ouvrent depuis le guide. Rien de nouveau : chaque
 * bouton du guide appuie sur le bouton de la proposition elle-meme.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;

  IA.v13.demarrer({
    style: 'b',
    apresPret: function (api) {
      var guide = o.el('<div class="v15-guide" role="region" aria-label="Guide pas à pas"></div>');
      document.body.appendChild(guide);
      var index = 0, passees = {};

      // Les etapes, dans l'ordre de la page : chaque ligne IA a decider, puis
      // les documents pas encore acceptes (ils se decident dans leur apercu).
      function etapes() {
        var l = api.barres().filter(function (b) { return !b.classList.contains('v13-prop-ap'); }).map(function (b) {
          return { cle: b.getAttribute('data-prop'), barre: b, libelle: b.getAttribute('data-libelle') || '', resume: b.getAttribute('data-resume') || '',
            fait: !b.classList.contains('v13-prop-attente') };
        });
        Object.keys(api.controles).forEach(function (nom) {
          var c = api.controles[nom];
          var cles = c.p.cles();
          var fait = cles.length ? cles.every(function (k) { return IA.decision(k); }) : !!c.p.memo.local;
          l.push({ cle: 'doc:' + nom, doc: c, libelle: 'Document · ' + (c.d.sousType || c.d.fichier),
            resume: c.d.note ? 'Note ' + c.d.note.valeur + '/20' : '', fait: fait });
        });
        return l;
      }
      function aFaire() { return etapes().filter(function (x) { return !x.fait && !passees[x.cle]; }); }

      function dessiner() {
        var toutes = etapes();
        var restantes = aFaire();
        document.querySelectorAll('.v15-focus').forEach(function (x) { x.classList.remove('v15-focus'); });
        if (!restantes.length) {
          var sautees = toutes.filter(function (x) { return !x.fait; }).length;
          guide.className = 'v15-guide v15-fini';
          guide.innerHTML = '<span class="v15-etat"><i class="fa fa-check-circle"></i> ' +
            (sautees ? sautees + ' proposition' + (sautees > 1 ? 's' : '') + ' passée' + (sautees > 1 ? 's' : '') : 'Tout est traité') + '</span>' +
            (sautees ? '<button type="button" class="v13-b" data-g="reprendre">Revoir les propositions passées</button>' : '');
          document.documentElement.classList.remove('v15-actif');
          return;
        }
        if (index >= restantes.length) index = 0;
        var x = restantes[index];
        var faites = toutes.filter(function (y) { return y.fait; }).length;
        document.documentElement.classList.add('v15-actif');
        guide.className = 'v15-guide';
        var boutons;
        if (x.doc) boutons = '<button type="button" class="v13-b v13-b-ok" data-g="ouvrir"><i class="fa fa-file-pdf-o"></i> Ouvrir l’analyse</button>';
        else {
          var bs = Array.prototype.slice.call(x.barre.querySelectorAll('.v13-actions [data-a]'));
          boutons = bs.length ? bs.map(function (b, i) {
            return '<button type="button" class="v13-b' + (b.classList.contains('v13-b-ok') ? ' v13-b-ok' : '') + '" data-g="action" data-i="' + i + '">' + e(b.textContent.trim() || b.title) + '</button>';
          }).join('') : '<span class="v15-aide">Choisissez valid ou invalid dans la section</span>';
        }
        guide.innerHTML = '<span class="v15-compte">' + (faites + 1) + ' / ' + toutes.length + '</span>' +
          '<span class="v15-quoi"><b>' + e(x.libelle) + '</b>' + (x.resume ? '<small>' + e(x.resume) + '</small>' : '') + '</span>' +
          '<span class="v15-boutons">' + boutons + '<button type="button" class="v13-b" data-g="passer">Passer <i class="fa fa-chevron-right"></i></button></span>';
        // La proposition courante : mise en avant, et amenee au centre de l'ecran.
        var cible = x.doc ? x.doc.d.el : x.barre;
        var bloc = x.doc ? x.doc.d.el : (x.barre.closest('.adm_row_doc_uploaded') || x.barre.parentNode);
        bloc.classList.add('v15-focus');
        if (x.barre) x.barre.classList.add('v15-focus');
        cible.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      guide.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-g]');
        if (!b) return;
        var x = aFaire()[index];
        var g = b.getAttribute('data-g');
        if (g === 'passer' && x) { passees[x.cle] = true; }
        else if (g === 'reprendre') { passees = {}; index = 0; }
        else if (g === 'ouvrir' && x) { api.ouvrirDocument(x.doc.d); return; }
        else if (g === 'action' && x) {
          var bs = x.barre.querySelectorAll('.v13-actions [data-a]');
          var cible = bs[+b.getAttribute('data-i')];
          if (cible) cible.click();
        }
        setTimeout(dessiner, 50);
      });
      IA.on('decision', function () { setTimeout(dessiner, 30); });
      if (window.jQuery) window.jQuery(document).on('hidden.bs.modal', '#pdfModal', function () { setTimeout(dessiner, 50); });
      dessiner();
    }
  });
})();
