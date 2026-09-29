/*
 * Variante 10 — « Revue claire »  (base : 8 Revue guidée, analyse refaite)
 *
 * Les etapes de la revue guidee :
 *   Incoherences → sections a traiter (par priorite) → conformes en une fois → Dossier.
 * Chaque etape de section utilise la presentation claire :
 *   a gauche le cadre DOCUMENT (PDF + analyse du document : points, verdict, commentaire),
 *   a droite la colonne SECTION (verdict + commentaire general, incoherences).
 * « Valider et continuer » ecrit dans Feel Francais puis passe a la suite.
 * Clavier : ← → etapes, Entree valider et continuer, V vue etudiant, Echap fermer.
 */
(function () {
  'use strict';
  var IA = window.IA;
  var o = IA.outils;
  var e = o.echapper;
  var r = null;

  IA.on('pret', function () {
    if (!IA.dossier) return IA.ui2.notifications();
    IA.analysees().forEach(function (s) { IA.ui2.marquer(s, function () { demarrer(s); }); });
    IA.ui3.champs();
    IA.ui2.ligne([{ html: '<i class="fa fa-play"></i> Commencer la revue', principal: true, action: function () { demarrer(); } }]);
  });

  function etapes() {
    var l = [];
    if (IA.ui2.nombreIncoherences()) l.push({ type: 'incoherences', nom: 'Incohérences', statut: 'a-corriger' });
    IA.ui2.ordre().filter(function (s) { return s.statut !== 'conforme'; }).forEach(function (s) { l.push({ type: 'section', s: s, statut: s.statut }); });
    var conformes = IA.analysees().filter(function (s) { return s.statut === 'conforme'; });
    if (conformes.length) l.push({ type: 'conformes', liste: conformes, nom: conformes.length + ' conforme(s)', statut: 'conforme' });
    l.push({ type: 'dossier', nom: 'Dossier', statut: 'dossier' });
    return l;
  }
  function finie(x) {
    if (x.type === 'section') return IA.progressionSection(x.s).finie;
    if (x.type === 'conformes') return x.liste.every(function (s) { return IA.progressionSection(s).finie; });
    if (x.type === 'dossier') return IA.dossier.champs.every(function (c) { return IA.decision('champ:' + c.cle); });
    return x.vu;
  }

  function demarrer(section) {
    if (!r) {
      var f = IA.ui.fenetre({ titre: 'Revue', classe: 'v10-fen', surFermeture: function () {
        document.removeEventListener('keydown', clavier, true);
        IA.analysees().forEach(function (s) { s.el.classList.remove('ia2-courant'); });
        r = null;
      } });
      f.el.__fermer = f.fermer;
      f.el.innerHTML = '<header class="v10-tete"><b class="v10-marque"><i class="fa fa-magic"></i> Revue</b><ol class="v10-etapes"></ol>' +
        '<button type="button" class="ia2-btn ia2-non" data-fermer title="Fermer (Échap)"><i class="fa fa-times"></i></button></header>' +
        '<div class="v10-corps"></div><footer class="v10-pied"></footer>';
      f.el.querySelector('[data-fermer]').addEventListener('click', f.fermer);
      r = { f: f, liste: etapes(), i: 0 };
      document.addEventListener('keydown', clavier, true);
      IA.on('decision', function () { if (r) barre(); });
    }
    var i = 0;
    if (section) r.liste.forEach(function (x, j) { if (x.s === section || (x.liste && x.liste.indexOf(section) > -1)) i = j; });
    aller(i);
  }

  function barre() {
    var ol = r.f.el.querySelector('.v10-etapes');
    ol.innerHTML = '';
    r.liste.forEach(function (x, j) {
      var ok = finie(x);
      var li = o.el('<li><button type="button" class="v10-etape' + (j === r.i ? ' v10-active' : '') + (ok ? ' v10-finie' : '') + ' ia2-t-' + x.statut + '">' +
        (ok ? '<i class="fa fa-check"></i>' : (x.type === 'section' ? '<span class="ia2-point"></span>' : '')) +
        '<span>' + e(x.type === 'section' ? IA.ui2.nom(x.s) : x.nom) + '</span></button></li>');
      li.firstChild.addEventListener('click', function () { aller(j); });
      ol.appendChild(li);
    });
  }

  function aller(i) {
    r.i = Math.max(0, Math.min(r.liste.length - 1, i));
    var x = r.liste[r.i];
    IA.analysees().forEach(function (s) { s.el.classList.toggle('ia2-courant', x.s === s); });
    barre();
    var corps = r.f.el.querySelector('.v10-corps');
    corps.innerHTML = '';
    corps.className = 'v10-corps';
    r.f.el.querySelector('.v10-pied').innerHTML = '';
    r.cadre = null;
    ({ incoherences: vueIncoherences, section: vueSection, conformes: vueConformes, dossier: vueDossier })[x.type](x, corps);
  }

  function pied(texte, libelle, action, principal) {
    var p = r.f.el.querySelector('.v10-pied');
    p.innerHTML = '<span class="ia3-muet v10-aide"><span class="ia-kbd">←</span><span class="ia-kbd">→</span> étapes · <span class="ia-kbd">Entrée</span> ' +
      e(libelle) + '</span><span class="v10-etat ia3-muet">' + (texte || '') + '</span><span class="ia2-sep"></span>' +
      '<button type="button" class="ia2-btn" data-a="prec"' + (r.i ? '' : ' disabled') + '><i class="fa fa-chevron-left"></i></button>' +
      '<button type="button" class="ia2-btn ' + (principal || 'ia2-principal') + ' v10-ok" data-a="ok">' + e(libelle) + ' <i class="fa fa-chevron-right"></i></button>';
    p.querySelector('[data-a="prec"]').addEventListener('click', function () { aller(r.i - 1); });
    p.querySelector('[data-a="ok"]').addEventListener('click', action);
    r.action = action;
  }

  // Etape « Incoherences » : la liste a droite, les deux documents cote a cote a gauche.
  function vueIncoherences(x, corps) {
    x.vu = true;
    corps.classList.add('v10-deux');
    corps.innerHTML = '<div class="v10-gauche v10-duo"></div><div class="v10-droite"></div>';
    var droite = corps.querySelector('.v10-droite');
    droite.appendChild(o.el('<h3 class="v10-h"><i class="fa fa-link"></i> Incohérences entre documents</h3>'));
    droite.appendChild(o.el('<p class="ia3-muet v10-p">Cliquez une ligne : les deux documents s’affichent côte à côte, la valeur en cause surlignée.</p>'));
    var liste = [];
    IA.sections().forEach(function (s) {
      (s.croisements || []).filter(function (c) { return c.resultat !== 'coherent'; }).forEach(function (c) { liste.push({ s: s, c: c }); });
    });
    var gauche = corps.querySelector('.v10-gauche');
    function montrer(k) {
      droite.querySelectorAll('.v10-inc').forEach(function (b, j) { b.classList.toggle('v10-inc-actif', j === k); });
      var c = liste[k].c;
      gauche.innerHTML = '<div><div class="v10-duo-titre">' + e(c.a.fichier) + ' : <b>' + e(c.a.valeur) + '</b></div><div class="ia-v-zone"></div></div>' +
        '<div><div class="v10-duo-titre">' + e(c.b.fichier) + ' : <b>' + e(c.b.valeur) + '</b></div><div class="ia-v-zone"></div></div>';
      gauche.querySelectorAll('.ia-v-zone').forEach(function (z, j) {
        var g = j ? c.b : c.a;
        IA.rendrePage(IA.urlDocument(g.nom), g.rect ? [{ rect: g.rect, teinte: 'probleme' }] : [], z, Math.max(280, z.clientWidth - 24)).then(function () {
          var h = z.querySelector('.ia-surlignage');
          if (h) { h.classList.add('ia-actif'); h.scrollIntoView({ block: 'center' }); }
        });
      });
    }
    liste.forEach(function (l, k) {
      var b = o.el('<button type="button" class="v10-inc"><i class="fa fa-exclamation-circle ia2-rouge"></i><span><b>' + e(l.c.titre) + '</b>' +
        '<span class="ia2-inc-valeurs"><span>' + e(l.c.a.valeur) + '</span><i class="fa fa-arrows-h"></i><span>' + e(l.c.b.valeur) + '</span></span>' +
        '<span class="ia3-muet">Section : ' + e(IA.ui2.nom(l.s)) + '</span></span></button>');
      b.addEventListener('click', function () { montrer(k); });
      droite.appendChild(b);
    });
    IA.sections().forEach(function (s) {
      (s.piecesLiees || []).forEach(function (p) {
        droite.appendChild(o.el('<div class="ia2-inc"><i class="fa fa-chain-broken ia2-rouge"></i><div class="ia2-inc-texte"><b>' + e(p.section) +
          '</b> <span class="ia2-muet">· ' + e(p.etat) + '</span><div class="ia2-muet">' + e(p.texte) + '</div></div></div>'));
      });
    });
    if (liste.length) montrer(0);
    pied('', 'Continuer', function () { aller(r.i + 1); });
  }

  // Etape « section » : cadre document a gauche, colonne section a droite.
  function vueSection(x, corps) {
    var s = x.s;
    corps.classList.add('v10-deux');
    var cadre = IA.ui3.documents(s);
    var colonne = IA.ui3.section(s);
    var g = o.el('<div class="v10-gauche"></div>');
    g.appendChild(cadre.el);
    var d = o.el('<div class="v10-droite"></div>');
    d.appendChild(colonne.el);
    corps.appendChild(g);
    corps.appendChild(d);
    r.cadre = cadre;
    function etat() {
      var p = IA.progressionSection(s);
      return p.finie ? '<span class="ia2-vert"><i class="fa fa-check"></i> Section validée</span>' : '';
    }
    pied(etat(), 'Valider et continuer', function () {
      var res = IA.ui3.valider(s, colonne, cadre);
      if (!res.ok) { o.toast('Choisissez d’abord ' + res.manque.join(' et ') + '.'); return; }
      if (res.reste.length) {
        o.toast('Section envoyée. Il reste à arbitrer : ' + res.reste.map(function (z) { return z.type === 'alerte' ? 'l’alerte' : 'le déplacement'; }).join(', ') + '.');
        var b = r.f.el.querySelector('.ia2-info-alerte .ia2-ok, .ia2-info-attention .ia2-ok');
        if (b) b.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      aller(r.i + 1);
    }, 'ia2-ok');
  }

  // Etape « conformes » : un coup d'oeil, puis tout valider.
  function vueConformes(x, corps) {
    corps.classList.add('v10-deux');
    corps.innerHTML = '<div class="v10-gauche"></div><div class="v10-droite"></div>';
    var droite = corps.querySelector('.v10-droite');
    droite.appendChild(o.el('<h3 class="v10-h"><i class="fa fa-check-circle ia2-vert"></i> Sections conformes</h3>'));
    droite.appendChild(o.el('<p class="ia3-muet v10-p">L’IA n’a rien trouvé à corriger. Cliquez une ligne pour voir le document ; ' +
      'ouvrez la section depuis les étapes si vous voulez changer quelque chose.</p>'));
    var gauche = corps.querySelector('.v10-gauche');
    function voir(s) {
      droite.querySelectorAll('.v10-conf').forEach(function (b) { b.classList.toggle('v10-inc-actif', b.__s === s); });
      gauche.innerHTML = '';
      gauche.appendChild(IA.ui3.documents(s).el);
    }
    x.liste.forEach(function (s) {
      var b = o.el('<button type="button" class="v10-conf"><i class="fa fa-check ia2-vert"></i><span><b>' + e(IA.ui2.nom(s)) + '</b><span class="ia3-muet">' +
        e(s.resume) + '</span></span></button>');
      b.__s = s;
      b.addEventListener('click', function () { voir(s); });
      droite.appendChild(b);
    });
    voir(x.liste[0]);
    pied('', 'Tout valider et continuer', function () {
      x.liste.forEach(function (s) { IA.ui3.validerDirect(s); });
      o.toast(x.liste.length + ' section(s) conforme(s) validée(s).');
      aller(r.i + 1);
    }, 'ia2-ok');
  }

  function vueDossier(x, corps) {
    corps.classList.add('v10-simple');
    corps.appendChild(o.el('<h3 class="v10-h">Dossier — ' + e(IA.dossier.etudiant) + '</h3>'));
    corps.appendChild(IA.ui3.dossier());
    pied('', 'Terminer', function () {
      r.f.fermer();
      var g = IA.progression();
      o.toast('Revue terminée : ' + g.faites + '/' + g.total + ' décisions écrites dans Feel Français.');
    });
  }

  function clavier(ev) {
    if (!r) return;
    var t = ev.target && ev.target.closest ? ev.target : document.body;
    if (t.closest('textarea, input, select')) return;
    var fait = true;
    if (ev.key === 'ArrowRight') aller(r.i + 1);
    else if (ev.key === 'ArrowLeft') aller(r.i - 1);
    else if (ev.key === 'Enter') { if (r.action) r.action(); }
    else if ((ev.key === 'v' || ev.key === 'V') && r.cadre) r.cadre.visionneuse.changerVue(r.cadre.visionneuse.vue === 'admin' ? 'etudiant' : 'admin');
    else fait = false;
    if (fait) { ev.preventDefault(); ev.stopPropagation(); }
  }
})();
