# Site de revue des prototypes de prevalidation IA (pages statiques + notes de revue).
# Aucune dependance : la bibliotheque standard de Python suffit.
FROM python:3.12-slim

WORKDIR /app
COPY index.html ./
COPY base ./base
COPY commun ./commun
COPY documents ./documents
COPY variante-13 ./variante-13
COPY variante-14 ./variante-14
COPY variante-15 ./variante-15
COPY variante-16 ./variante-16
COPY variante-17 ./variante-17
COPY outils/serveur.py ./outils/serveur.py

# Les notes de revue sont ecrites dans /data : monter un volume sur ce dossier
# pour qu'elles survivent aux redeploiements.
ENV HOST=0.0.0.0 \
    PORT=8790 \
    NOTES_FILE=/data/notes.json \
    PYTHONUNBUFFERED=1
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 8790
CMD ["python", "outils/serveur.py"]
