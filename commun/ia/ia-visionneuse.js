/*
 * Couche IA — visionneuse PDF avec surlignages.
 *
 * Reutilise pdf.js, deja charge par leur page (pdf.min.js 2.10.377) : aucune
 * dependance nouvelle. Les surlignages viennent de l'analyse (rect en
 * coordonnees relatives 0-1) : ils sont donc exactement la ou le constat parle.
 *
 * Deux vues (demande de Perle, D8) :
 *   admin    : tous les constats, y compris conformes et informations ;
 *   etudiant : uniquement ce que l'etudiant doit corriger, dans sa langue,
 *              sans reperes verts ni note interne.
 * Perle telecharge les deux versions annotees.
 */
(function () {
  'use strict';
  var O = function () { return window.IA.outils; };
  var BASE = '../documents/';

  function constatsVisibles(doc, vue) {
    return (doc.constats || []).filter(function (k) {
      return k.rect && (vue !== 'etudiant' || k.etudiant);
    });
  }

  // Un seul « worker » pdf.js pour toute la couche IA : sans lui, chaque
  // affichage lancerait un nouveau fil de calcul qui ne serait jamais libere.
  var travailleur = null;
  function partage() {
    if (!travailleur) travailleur = new window.pdfjsLib.PDFWorker({ name: 'ia-visionneuse' });
    return travailleur;
  }

  // Dessine une page PDF dans `cible` avec des cadres ; renvoie une promesse.
  function rendrePage(url, cadres, cible, largeur, surClic, avecNotes) {
    cible.innerHTML = '';
    var page = O().el('<div class="ia-v-page' + (avecNotes ? ' ia-v-page-notes' : '') + '"></div>');
    cible.appendChild(page);
    // Vue etudiant : l'explication de chaque surlignage dans la marge, comme sur
    // une copie corrigee (la page retrecit pour laisser la place aux notes).
    var MARGE = 230;
    if (avecNotes) largeur = Math.max(260, largeur - MARGE);
    var doc = null;
    return window.pdfjsLib.getDocument({ url: url, worker: partage() }).promise.then(function (pdf) {
      doc = pdf;
      return pdf.getPage(1);
    }).then(function (p) {
      var base = p.getViewport({ scale: 1 });
      var echelle = largeur / base.width;
      var vp = p.getViewport({ scale: echelle * (window.devicePixelRatio || 1) });
      var canvas = document.createElement('canvas');
      canvas.width = vp.width;
      canvas.height = vp.height;
      canvas.style.width = Math.round(base.width * echelle) + 'px';
      canvas.style.height = Math.round(base.height * echelle) + 'px';
      page.style.width = canvas.style.width;
      page.appendChild(canvas);
      (cadres || []).forEach(function (c, i) {
        var r = c.rect;
        var d = O().el('<div class="ia-surlignage ia-t-' + c.teinte + '" title="' + O().echapper(c.titre || '') + '">' +
          (c.numero ? '<span class="ia-num">' + c.numero + '</span>' : '') + '</div>');
        d.style.left = (r[0] * 100) + '%';
        d.style.top = (r[1] * 100) + '%';
        d.style.width = (r[2] * 100) + '%';
        d.style.height = (r[3] * 100) + '%';
        d.dataset.index = i;
        if (surClic) d.addEventListener('click', function () { surClic(i); });
        page.appendChild(d);
        if (avecNotes && c.titre) {
          var n = O().el('<div class="ia-v-note ia-t-' + c.teinte + '"><span class="ia-num">' + (c.numero || '') + '</span>' +
            O().echapper(c.titre) + '</div>');
          n.style.top = (r[1] * 100) + '%';
          n.dataset.index = i;
          if (surClic) n.addEventListener('click', function () { surClic(i); });
          page.appendChild(n);
          var fil = O().el('<div class="ia-v-fil ia-t-' + c.teinte + '"></div>');
          fil.style.left = ((r[0] + r[2]) * 100) + '%';
          fil.style.top = ((r[1] + r[3] / 2) * 100) + '%';
          page.appendChild(fil);
        }
      });
      if (avecNotes) {
        // Les notes ne se chevauchent pas : chacune commence sous la precedente.
        requestAnimationFrame(function () {
          var bas = 0;
          Array.prototype.forEach.call(page.querySelectorAll('.ia-v-note'), function (n) {
            var haut = Math.max(n.offsetTop, bas + 6);
            n.style.top = haut + 'px';
            bas = haut + n.offsetHeight;
          });
          page.querySelectorAll('.ia-v-fil').forEach(function (f, j) {
            var n = page.querySelectorAll('.ia-v-note')[j];
            f.style.width = 'calc(100% + 14px - ' + f.style.left + ')';
            if (n) f.dataset.note = n.offsetTop;
          });
        });
      }
      return p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
    }).catch(function (e) {
      page.appendChild(O().el('<div style="padding:30px;color:#999">Document indisponible (' + O().echapper(e.message) + ')</div>'));
    }).then(function () {
      if (doc) doc.destroy();  // l'image reste dessinee ; le document est libere (le worker partage reste)
    });
  }

  /*
   * new IA.Visionneuse(conteneur, { documents, vue, surConstat, surVue, largeur })
   *   documents : objets document de l'analyse (plusieurs = onglets)
   */
  function Visionneuse(conteneur, options) {
    this.c = conteneur;
    this.o = options || {};
    this.docs = (this.o.documents || []).filter(function (d) { return d.nom; });
    this.index = 0;
    this.vue = this.o.vue || 'admin';
    this.zoom = 1;
    this.construire();
  }

  Visionneuse.prototype.construire = function () {
    var self = this;
    var o = O();
    this.c.classList.add('ia-visionneuse');
    this.c.setAttribute('data-ia', '');
    this.c.innerHTML = '';
    var barre = o.el('<div class="ia-v-barre"></div>');
    if (this.docs.length > 1) {
      var onglets = o.el('<div class="ia-v-onglets" role="tablist"></div>');
      this.docs.forEach(function (d, i) {
        var b = o.el('<button type="button" class="ia-v-onglet" role="tab" title="' + o.echapper(d.nom) + '">' +
          (i + 1) + '. ' + o.echapper(d.sousType || d.fichier) + '</button>');
        b.addEventListener('click', function () { self.afficher(i); });
        onglets.appendChild(b);
      });
      barre.appendChild(onglets);
    }
    barre.appendChild(o.el('<span class="ia-sep"></span>'));
    var bascule = o.el('<span class="ia-vue-bascule" role="group" aria-label="Vue">' +
      '<button type="button" data-vue="admin">Vue admin</button><button type="button" data-vue="etudiant">Vue étudiant</button></span>');
    bascule.addEventListener('click', function (e) {
      var v = e.target.getAttribute('data-vue');
      if (v) self.changerVue(v);
    });
    barre.appendChild(bascule);
    var moins = o.el('<button type="button" class="ia-mini" title="Zoom arrière"><i class="fa fa-search-minus"></i></button>');
    var plus = o.el('<button type="button" class="ia-mini" title="Zoom avant"><i class="fa fa-search-plus"></i></button>');
    moins.addEventListener('click', function () { self.zoomer(-0.2); });
    plus.addEventListener('click', function () { self.zoomer(0.2); });
    barre.appendChild(moins);
    barre.appendChild(plus);
    if (this.o.compact) {
      // Une seule entree « Telecharger » : la barre tient sur une ligne.
      var menu = o.el('<span class="ia-v-menu"><button type="button" class="ia-mini" aria-haspopup="true">' +
        '<i class="fa fa-download"></i>Télécharger <i class="fa fa-caret-down"></i></button><span class="ia-v-menu-liste" hidden></span></span>');
      menu.firstChild.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var l = menu.lastChild;
        l.hidden = !l.hidden;
        if (!l.hidden) setTimeout(function () {
          document.addEventListener('click', function fermer() { l.hidden = true; document.removeEventListener('click', fermer); });
        }, 0);
      });
      barre.appendChild(menu);
      this.telecharger = menu.lastChild;
    } else {
      this.telecharger = o.el('<span style="display:inline-flex;gap:4px"></span>');
      barre.appendChild(this.telecharger);
    }
    this.c.appendChild(barre);
    this.bandeau = o.el('<div class="ia-bandeau-etudiant" style="display:none">Aperçu de ce que verra l’étudiant ' +
      '— les points conformes et les notes internes sont masqués</div>');
    this.c.appendChild(this.bandeau);
    this.zone = o.el('<div class="ia-v-zone"></div>');
    this.c.appendChild(this.zone);
    this.barre = barre;
    this.afficher(0);
  };

  Visionneuse.prototype.document = function () { return this.docs[this.index]; };

  Visionneuse.prototype.afficher = function (i) {
    var self = this;
    var o = O();
    this.index = i;
    Array.prototype.forEach.call(this.barre.querySelectorAll('.ia-v-onglet'), function (b, j) {
      b.classList.toggle('ia-actif', j === i);
    });
    Array.prototype.forEach.call(this.barre.querySelectorAll('[data-vue]'), function (b) {
      b.classList.toggle('ia-actif', b.getAttribute('data-vue') === self.vue);
    });
    this.bandeau.style.display = this.vue === 'etudiant' ? 'block' : 'none';
    var d = this.document();
    if (!d) return;
    var annote = d.annote || {};
    this.telecharger.innerHTML = '';
    [['PDF original', BASE + d.nom, 'fa-file-pdf-o'],
     ['Annoté admin', BASE + annote.admin, 'fa-download'],
     ['Annoté étudiant', BASE + annote.etudiant, 'fa-download']].forEach(function (t) {
      if (t[1].indexOf('undefined') > -1) return;
      var a = o.el('<a class="' + (self.o.compact ? 'ia-v-menu-item' : 'ia-mini') + '" target="_blank" rel="noopener" download href="' +
        t[1] + '"><i class="fa ' + t[2] + '"></i>' + t[0] + '</a>');
      self.telecharger.appendChild(a);
    });
    var visibles = constatsVisibles(d, this.vue);
    var largeur = Math.max(320, (this.zone.clientWidth || 560) - 28) * this.zoom;
    var cadres = visibles.map(function (k, n) {
      return { rect: k.rect, numero: n + 1, teinte: o.typeConstat(k), titre: self.vue === 'etudiant' ? k.etudiant : k.texte };
    });
    this.rendu = rendrePage(BASE + d.nom, cadres, this.zone, largeur, function (n) {
      self.activer(n);
      if (self.o.surConstat) self.o.surConstat(d, visibles[n], n);
    }, this.vue === 'etudiant');
    if (this.o.surDocument) this.o.surDocument(d, i);
  };

  Visionneuse.prototype.activer = function (n) {
    var cadres = this.zone.querySelectorAll('.ia-surlignage');
    Array.prototype.forEach.call(cadres, function (c, i) { c.classList.toggle('ia-actif', i === n); });
    var cible = cadres[n];
    if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  };

  // Afficher un document precis (par nom de fichier) et surligner un constat.
  Visionneuse.prototype.montrer = function (nom, n) {
    var self = this;
    var i = this.docs.findIndex(function (d) { return d.nom === nom; });
    if (i < 0) return;
    if (i !== this.index) this.afficher(i);
    if (n != null) (this.rendu || Promise.resolve()).then(function () { self.activer(n); });
  };

  Visionneuse.prototype.changerVue = function (v) {
    this.vue = v;
    this.afficher(this.index);
    if (this.o.surVue) this.o.surVue(v);
  };

  Visionneuse.prototype.zoomer = function (delta) {
    this.zoom = Math.min(2.4, Math.max(0.6, this.zoom + delta));
    this.afficher(this.index);
  };

  window.IA = window.IA || {};
  window.IA.Visionneuse = Visionneuse;
  window.IA.rendrePage = rendrePage;
  window.IA.constatsVisibles = constatsVisibles;
  window.IA.urlDocument = function (nom) { return BASE + nom; };
})();
