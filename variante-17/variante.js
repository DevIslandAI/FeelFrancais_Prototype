/*
 * Variante D · Tableau de decision  (memes fonctionnalites que le prototype 13)
 *
 * Principe (document sur la charge cognitive) : donner une VUE D'ENSEMBLE
 * decoupee en blocs. En haut de la page Visa, un tableau reprend toutes les
 * propositions de l'IA : quoi, proposition, source, et la decision (✓ / ✕).
 * Les cases de Feel Francais restent pre-remplies en mauve ; les lignes IA sous
 * les cases sont remplacees par ce tableau. Chaque bouton du tableau appuie sur
 * le bouton de la proposition elle-meme ; « Voir » amene a la case.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;

  IA.v13.demarrer({
    style: 'd',
    apresPret: function (api) {
      var ancre = document.querySelector('#App_data_state');
      ancre = ancre && ancre.closest('.data-item');
      if (!ancre) return;
      var t = o.el('<div class="v17-tableau"><div class="v17-tete"><b>Propositions de l’IA</b><span class="v17-compte"></span></div><div class="v17-corps"></div></div>');
      ancre.parentNode.insertBefore(t, ancre);

      function groupeDe(cle) {
        if (cle.indexOf('sec:') === 0) return 'Sections';
        return 'Dossier';
      }
      function dessiner() {
        var lignes = api.barres().filter(function (b) { return !b.classList.contains('v13-prop-ap'); }).map(function (b) {
          var x = b.classList.contains('v13-prop-accepte') ? 'accepte' : b.classList.contains('v13-prop-refuse') ? 'refuse' : 'attente';
          var src = b.querySelector('.v13-src');
          return { cle: b.getAttribute('data-prop'), barre: b, groupe: groupeDe(b.getAttribute('data-prop')), libelle: b.getAttribute('data-libelle') || '',
            resume: b.getAttribute('data-resume') || '', source: src ? src.textContent.replace(/\s*voir\s*$/, '').trim() : '', etat: x };
        });
        Object.keys(api.controles).forEach(function (nom) {
          var c = api.controles[nom];
          var cles = c.p.cles();
          var fait = cles.length ? cles.every(function (k) { return IA.decision(k); }) : !!c.p.memo.local;
          lignes.push({ cle: 'doc:' + nom, doc: c, groupe: 'Documents', libelle: c.d.sousType || c.d.fichier,
            resume: (c.d.note ? c.d.note.valeur + '/20 · ' : '') + (c.d.verdict === 'valide' ? 'valid' : c.d.verdict === 'invalide' ? 'invalid' : 'à vérifier'),
            source: 'Analyse dans l’aperçu du document', etat: fait ? 'accepte' : 'attente' });
        });
        var reste = lignes.filter(function (l) { return l.etat === 'attente'; }).length;
        t.querySelector('.v17-compte').innerHTML = reste ? '<b>' + reste + '</b> à décider sur ' + lignes.length
          : '<span class="v17-ok"><i class="fa fa-check"></i> Tout est décidé</span>';
        var html = '';
        ['Dossier', 'Sections', 'Documents'].forEach(function (g) {
          var ls = lignes.filter(function (l) { return l.groupe === g; });
          if (!ls.length) return;
          html += '<div class="v17-groupe">' + g + '</div>';
          ls.forEach(function (l) {
            var decision;
            if (l.etat !== 'attente') {
              decision = '<span class="v17-fait v17-' + l.etat + '"><i class="fa ' + (l.etat === 'refuse' ? 'fa-times' : 'fa-check') + '"></i> ' +
                (l.etat === 'refuse' ? 'Refusé' : l.doc ? 'Décidé' : 'Accepté') + '</span>' +
                (l.doc ? '' : '<button type="button" class="v13-lien" data-t="annuler" data-cle="' + e(l.cle) + '">Annuler</button>');
            } else if (l.doc) {
              decision = '<button type="button" class="v13-b v13-b-ok" data-t="ouvrir" data-cle="' + e(l.cle) + '"><i class="fa fa-file-pdf-o"></i> Ouvrir</button>';
            } else {
              var bs = Array.prototype.slice.call(l.barre.querySelectorAll('.v13-actions [data-a]'));
              decision = bs.length ? bs.map(function (b, i) {
                var ok = b.classList.contains('v13-b-ok');
                return '<button type="button" class="v17-b' + (ok ? ' v17-b-ok' : '') + '" data-t="action" data-i="' + i + '" data-cle="' + e(l.cle) + '" title="' + e(b.textContent.trim()) + '">' +
                  (b.getAttribute('data-a') === 'accepter' ? '<i class="fa fa-check"></i>' : b.getAttribute('data-a') === 'refuser' ? '<i class="fa fa-times"></i>' : e(b.textContent.trim())) + '</button>';
              }).join('') : '<span class="v17-aide">valid / invalid dans la section</span>';
            }
            html += '<div class="v17-ligne v17-l-' + l.etat + '"><button type="button" class="v17-quoi" data-t="voir" data-cle="' + e(l.cle) + '" title="Voir sur la page">' + e(l.libelle) + '</button>' +
              '<span class="v17-prop">' + e(l.resume) + '</span><span class="v17-src">' + e(l.source) + '</span><span class="v17-dec">' + decision + '</span></div>';
          });
        });
        t.querySelector('.v17-corps').innerHTML = html;
      }

      t.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-t]');
        if (!b) return;
        var cle = b.getAttribute('data-cle');
        var barre = document.querySelector('.v13-prop[data-prop="' + cle + '"]:not(.v13-prop-ap)');
        var ctrl = cle.indexOf('doc:') === 0 ? api.controles[cle.slice(4)] : null;
        var a = b.getAttribute('data-t');
        if (a === 'ouvrir' && ctrl) api.ouvrirDocument(ctrl.d);
        else if (a === 'voir') {
          var cible = ctrl ? ctrl.d.el : barre && (barre.closest('.adm_row_doc_uploaded') || barre.previousElementSibling || barre);
          if (cible) { cible.scrollIntoView({ behavior: 'smooth', block: 'center' }); o.flash(cible); }
        } else if (a === 'action' && barre) {
          var c = barre.querySelectorAll('.v13-actions [data-a]')[+b.getAttribute('data-i')];
          if (c) c.click();
        } else if (a === 'annuler' && barre) {
          var n = barre.querySelector('[data-a="annuler"]');
          if (n) n.click();
        }
        setTimeout(dessiner, 50);
      });
      IA.on('decision', function () { setTimeout(dessiner, 30); });
      if (window.jQuery) window.jQuery(document).on('hidden.bs.modal', '#pdfModal', function () { setTimeout(dessiner, 50); });
      dessiner();
    }
  });
})();
