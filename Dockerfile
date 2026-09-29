# Site de revue des prototypes de prevalidation IA (pages statiques + notes de revue).
# Aucune dependance : la bibliotheque standard de Python suffit.
FROM python:3.12-slim

WORKDIR /app
COPY index.html ./
COPY base ./base
COPY commun ./commun
COPY documents ./documents
COPY variante-1 ./variante-1
COPY variante-2 ./variante-2
COPY variante-3 ./variante-3
COPY variante-4 ./variante-4
COPY variante-5 ./variante-5
COPY variante-6 ./variante-6
COPY variante-7 ./variante-7
COPY variante-8 ./variante-8
COPY variante-9 ./variante-9
COPY variante-10 ./variante-10
COPY variante-11 ./variante-11
COPY variante-12 ./variante-12
COPY variante-13 ./variante-13
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
