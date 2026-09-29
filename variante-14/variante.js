/*
 * Variante A · Tout sur place  (memes fonctionnalites que le prototype 13)
 *
 * Principe (document sur la charge cognitive) : eviter l'ATTENTION PARTAGEE —
 * ce qui se lit ensemble est pose ensemble.
 *   - Accepter / Refuser : deux icones ✓ ✕ collees sous la case, avec la source
 *     sur la meme ligne ; la ligne IA fait corps avec la case.
 *   - Apercu d'un document : l'analyse est ecrite DANS LA MARGE du PDF, a cote
 *     de chaque passage surligne (plus de liste separee a relier aux numeros).
 */
window.IA.v13.demarrer({ style: 'a', icones: true, analyseMarge: true });
