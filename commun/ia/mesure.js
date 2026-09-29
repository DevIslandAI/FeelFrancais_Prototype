/*
 * Mode test — mesurer la charge de chaque variante (actif avec ?test=1).
 *
 * Ce que le document sur la charge cognitive recommande de mesurer :
 *   - performance : temps pour traiter le dossier, nombre de clics, omissions
 *     (propositions laissees sans decision), retours en arriere (« rouvrir »),
 *     ecarts avec la decision de reference ;
 *   - charge ressentie : les 6 questions du NASA-TLX, notees de 0 a 100.
 * Les resultats restent dans ce navigateur (localStorage) ; la page d'accueil
 * les compare et les exporte en CSV.
 */
(function () {
  'use strict';
  if (!/[?&]test=1/.test(location.search)) return;
  var IA = window.IA;
  var CLE = 'ia-demo:mesures';
  var QUESTIONS = [
    ['mentale', 'Exigence mentale', 'Quelle activité mentale la tâche a-t-elle demandée (réfléchir, comparer, retenir) ?'],
    ['physique', 'Exigence physique', 'Quelle activité physique a-t-elle demandée (clics, défilement, déplacements) ?'],
    ['temporelle', 'Pression du temps', 'Vous êtes-vous sentie pressée par le rythme de la tâche ?'],
    ['performance', 'Réussite', 'À quel point pensez-vous avoir réussi la tâche ? (0 = parfaitement, 100 = échec)'],
    ['effort', 'Effort', 'Quel effort avez-vous dû fournir pour atteindre ce niveau ?'],
    ['frustration', 'Frustration', 'À quel point vous êtes-vous sentie agacée, stressée ou découragée ?']
  ];
  var debut = null, clics = 0, touches = 0, reouvertures = 0, minuteur = null;

  function lire() { try { return JSON.parse(localStorage.getItem(CLE)) || []; } catch (e) { return []; } }
  function ecrire(l) { try { localStorage.setItem(CLE, JSON.stringify(l)); } catch (e) { /* stockage indisponible */ } }

  var o = IA.outils;
  var panneau = o.el('<div class="ia-test" role="region" aria-label="Mode test">' +
    '<div class="ia-test-tete"><i class="fa fa-flask"></i> Mode test · variante ' + IA.variante +
    (IA.dossier ? ' · dossier ' + IA.dossier.code : '') + '</div>' +
    '<div class="ia-test-corps"><div class="ia-test-consigne">Consigne : traitez toutes les propositions de l’IA ' +
    'sur ce dossier comme vous le feriez un jour normal, puis cliquez sur « Terminer ».</div>' +
    '<div class="ia-test-chiffres"><span data-m="temps">0:00</span><span data-m="clics">0 clic</span><span data-m="prog">—</span></div>' +
    '<div class="ia-prop-actions"><button type="button" class="ia-btn ia-btn-ia" data-a="go"><i class="fa fa-play"></i>Commencer</button>' +
    '<button type="button" class="ia-btn" data-a="fin" disabled><i class="fa fa-flag-checkered"></i>Terminer</button></div></div></div>');
  var style = o.el('<style>.ia-test{position:fixed;left:14px;bottom:14px;z-index:100000;width:290px;background:#fff;border:1px solid var(--ia-bord);' +
    'border-radius:8px;box-shadow:var(--ia-ombre);font-size:12.5px}.ia-test-tete{background:var(--ia);color:#fff;padding:6px 10px;' +
    'border-radius:8px 8px 0 0;font-weight:700}.ia-test-corps{padding:8px 10px}.ia-test-consigne{color:var(--ia-gris);margin-bottom:6px}' +
    '.ia-test-chiffres{display:flex;gap:10px;font-weight:700;margin-bottom:4px}.ia-tlx label{display:block;font-weight:700;margin-top:8px}' +
    '.ia-tlx input{width:100%}.ia-tlx small{color:var(--ia-gris);display:block}</style>');
  document.head.appendChild(style);

  function afficher() {
    var s = debut ? Math.round((Date.now() - debut) / 1000) : 0;
    panneau.querySelector('[data-m="temps"]').textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
    panneau.querySelector('[data-m="clics"]').textContent = clics + ' clic' + (clics > 1 ? 's' : '');
    if (IA.dossier) {
      var p = IA.progression();
      panneau.querySelector('[data-m="prog"]').textContent = p.faites + '/' + p.total + ' décisions';
    }
  }

  document.addEventListener('click', function (e) {
    // Seuls les clics de la personne comptent (pas ceux que « Tout accepter » declenche).
    if (!e.isTrusted || !debut || panneau.contains(e.target)) return;
    clics++;
    if (e.target.closest('[data-action="rouvrir"], .ia-decision .ia-signaler')) reouvertures++;
    afficher();
  }, true);
  document.addEventListener('keydown', function (e) { if (debut && e.isTrusted) touches++; }, true);

  panneau.addEventListener('click', function (e) {
    var a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.getAttribute('data-a') === 'go') {
      debut = Date.now();
      a.disabled = true;
      panneau.querySelector('[data-a="fin"]').disabled = false;
      minuteur = setInterval(afficher, 1000);
    } else {
      clearInterval(minuteur);
      questionnaire(Math.round((Date.now() - debut) / 1000));
    }
  });

  function questionnaire(secondes) {
    var p = IA.dossier ? IA.progression() : { faites: 0, total: 0 };
    var f = IA.ui.fenetre({ titre: 'Questionnaire NASA-TLX', classe: 'ia-fenetre-tlx', bloquante: true });
    f.el.style.cssText += ';left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:92vh;overflow:auto;padding:16px 20px';
    f.el.innerHTML = '<h4 style="margin:0 0 4px;color:var(--ia-fonce)">Votre ressenti sur cette variante</h4>' +
      '<div class="ia-meta">6 questions, de 0 (très faible) à 100 (très élevé). Il n’y a pas de bonne réponse.</div>' +
      '<div class="ia-tlx">' + QUESTIONS.map(function (q) {
        return '<label>' + q[1] + ' <output>50</output><small>' + q[2] + '</small><input type="range" min="0" max="100" step="5" value="50" name="' +
          q[0] + '"></label>';
      }).join('') + '</div><label style="display:block;margin-top:10px;font-weight:700">Remarque libre' +
      '<textarea style="width:100%;min-height:50px" name="remarque"></textarea></label>' +
      '<div class="ia-prop-actions"><button type="button" class="ia-btn ia-btn-ia">Enregistrer</button></div>';
    f.el.addEventListener('input', function (e) {
      if (e.target.type === 'range') e.target.previousElementSibling.previousElementSibling.textContent = e.target.value;
    });
    f.el.querySelector('.ia-btn').addEventListener('click', function () {
      var tlx = {};
      QUESTIONS.forEach(function (q) { tlx[q[0]] = +f.el.querySelector('[name="' + q[0] + '"]').value; });
      var moyenne = Math.round(QUESTIONS.reduce(function (s, q) { return s + tlx[q[0]]; }, 0) / QUESTIONS.length);
      var l = lire();
      l.push({ variante: IA.variante, dossier: IA.dossier ? IA.dossier.code : '-', le: new Date().toISOString(),
        secondes: secondes, clics: clics, touches: touches, reouvertures: reouvertures,
        decisions: p.faites, propositions: p.total, omissions: p.total - p.faites,
        tlx: tlx, tlxMoyen: moyenne, remarque: f.el.querySelector('[name="remarque"]').value });
      ecrire(l);
      f.fermer();
      o.toast('Résultat enregistré — comparaison sur la page d’accueil de la démo.');
      panneau.querySelector('.ia-test-corps').innerHTML = '<div><b>Enregistré.</b> ' + secondes + ' s · ' + clics + ' clics · ' +
        (p.total - p.faites) + ' omission(s) · NASA-TLX ' + moyenne + '/100</div><a class="ia-mini" href="../index.html#resultats" style="margin-top:6px">Voir la comparaison</a>';
    });
  }

  function demarrer() { document.body.appendChild(panneau); afficher(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
  IA.mesures = { lire: lire };
})();
