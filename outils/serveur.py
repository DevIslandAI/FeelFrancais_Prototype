"""Serveur du site de revue des prototypes : les pages statiques + les notes de revue.

    python outils/serveur.py            (http://127.0.0.1:8790/)

Variables d'environnement (toutes facultatives) :
  HOST / PORT        adresse d'ecoute (defaut 127.0.0.1:8790 ; 0.0.0.0 dans un conteneur)
  NOTES_FILE         fichier JSON des notes (defaut <racine>/.notes/notes.json)
  REVIEW_USER        si REVIEW_USER et REVIEW_PASSWORD sont definis, tout le site
  REVIEW_PASSWORD    demande ces identifiants (authentification HTTP Basic)

API des notes (communes a tous les relecteurs) :
  GET    /api/general        -> {text, at}      le commentaire general (un seul)
  PUT    /api/general        {text} -> {text, at}
  GET    /api/notes          -> [{id, text, proto, page, context, at, edited}]
  POST   /api/notes          {text, proto, page, context} -> la remarque creee
  PUT    /api/notes/<id>     {text} -> la note modifiee
  DELETE /api/notes/<id>
"""
import base64
import hmac
import json
import os
import sys
import threading
import time
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
NOTES = Path(os.environ.get("NOTES_FILE") or RACINE / ".notes" / "notes.json")
GENERAL = NOTES.with_name("general.json")
UTILISATEUR = os.environ.get("REVIEW_USER", "")
MOT_DE_PASSE = os.environ.get("REVIEW_PASSWORD", "")
MAX_CORPS = 90_000        # octets par requete (commentaire general compris)
MAX_TEXTE = 5_000         # caracteres par note
MAX_NOTES = 2_000
verrou = threading.Lock()


def lire_json(chemin, defaut):
    try:
        return json.loads(chemin.read_text(encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        return defaut


def ecrire_json(chemin, donnees):
    chemin.parent.mkdir(parents=True, exist_ok=True)
    tmp = chemin.with_suffix(".tmp")
    tmp.write_text(json.dumps(donnees, ensure_ascii=False, indent=1), encoding="utf-8")
    tmp.replace(chemin)


def lire_notes():
    return lire_json(NOTES, [])


def ecrire_notes(notes):
    ecrire_json(NOTES, notes)


def texte(valeur, limite):
    return str(valeur or "").strip()[:limite]


class Gestionnaire(SimpleHTTPRequestHandler):
    # Pages et scripts en UTF-8 : sans l'annoncer, le navigateur devine (mal) l'encodage
    # des pages dont la balise <meta charset> arrive tard (listes Visa avec données intégrées).
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
                      ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RACINE), **kwargs)

    # ── Acces ──
    def autorise(self):
        if not (UTILISATEUR and MOT_DE_PASSE):
            return True
        entete = self.headers.get("Authorization", "")
        if entete.startswith("Basic "):
            try:
                u, _, p = base64.b64decode(entete[6:]).decode("utf-8").partition(":")
                if hmac.compare_digest(u, UTILISATEUR) and hmac.compare_digest(p, MOT_DE_PASSE):
                    return True
            except ValueError:
                pass
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Prototype review"')
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def interdit(self):
        # Rien de cache n'est servi : .notes, .git, outils (scripts), capture brute.
        p = self.path.split("?", 1)[0]
        return any(seg.startswith(".") for seg in p.split("/") if seg) or p.startswith(("/outils/", "/capture/"))

    def end_headers(self):
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def json(self, code, donnees):
        corps = json.dumps(donnees, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def corps(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > MAX_CORPS:
            return None
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return None

    # ── Routes ──
    def do_GET(self):
        if not self.autorise():
            return
        chemin = self.path.split("?", 1)[0]
        if chemin == "/api/notes":
            with verrou:
                return self.json(200, lire_notes())
        if chemin == "/api/general":
            with verrou:
                return self.json(200, lire_json(GENERAL, {"text": "", "at": None}))
        if self.interdit():
            return self.send_error(404)
        return super().do_GET()

    def do_HEAD(self):
        if not self.autorise():
            return
        if self.interdit():
            return self.send_error(404)
        return super().do_HEAD()

    def do_POST(self):
        if not self.autorise():
            return
        if self.path != "/api/notes":
            return self.send_error(404)
        d = self.corps()
        if not isinstance(d, dict) or not texte(d.get("text"), MAX_TEXTE):
            return self.json(400, {"error": "text required"})
        note = {"id": uuid.uuid4().hex[:12], "text": texte(d.get("text"), MAX_TEXTE),
                "proto": texte(d.get("proto"), 10), "page": texte(d.get("page"), 20), "context": texte(d.get("context"), 120),
                "at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "edited": None}
        with verrou:
            notes = lire_notes()
            if len(notes) >= MAX_NOTES:
                return self.json(507, {"error": "too many notes"})
            notes.append(note)
            ecrire_notes(notes)
        return self.json(201, note)

    def do_PUT(self):
        if not self.autorise():
            return
        if self.path == "/api/general":
            d = self.corps()
            if not isinstance(d, dict):
                return self.json(400, {"error": "bad body"})
            general = {"text": texte(d.get("text"), 20_000), "at": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
            with verrou:
                ecrire_json(GENERAL, general)
            return self.json(200, general)
        ident = self.path[len("/api/notes/"):] if self.path.startswith("/api/notes/") else ""
        d = self.corps()
        if not ident or not isinstance(d, dict) or not texte(d.get("text"), MAX_TEXTE):
            return self.json(400, {"error": "text required"})
        with verrou:
            notes = lire_notes()
            for n in notes:
                if n["id"] == ident:
                    n["text"] = texte(d.get("text"), MAX_TEXTE)
                    n["edited"] = time.strftime("%Y-%m-%dT%H:%M:%S%z")
                    ecrire_notes(notes)
                    return self.json(200, n)
        return self.json(404, {"error": "not found"})

    def do_DELETE(self):
        if not self.autorise():
            return
        ident = self.path[len("/api/notes/"):] if self.path.startswith("/api/notes/") else ""
        with verrou:
            notes = lire_notes()
            reste = [n for n in notes if n["id"] != ident]
            if len(reste) == len(notes):
                return self.json(404, {"error": "not found"})
            ecrire_notes(reste)
        return self.json(200, {"ok": True})

    def log_message(self, fmt, *args):
        if "/api/" in str(args[0] if args else ""):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    hote = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8790"))
    print(f"Site de revue : http://{hote}:{port}/  (notes : {NOTES})", flush=True)
    ThreadingHTTPServer((hote, port), Gestionnaire).serve_forever()
