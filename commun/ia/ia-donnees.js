/* Genere par outils/ia_donnees.py — ne pas modifier a la main. */
window.IA_DONNEES = {
 "meta": {
  "agent": "Agent de prévalidation Feel Français — v0.9 (démonstration)",
  "consignes": [
   {
    "nom": "Prompt général",
    "version": "v14",
    "maj": "22/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Formation IA — Ressources",
    "version": "v12",
    "maj": "22/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Formation IA — Passeport",
    "version": "v7",
    "maj": "02/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Formation IA — Formulaire France-Visas",
    "version": "v9",
    "maj": "15/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Spécificités pays — Côte d'Ivoire",
    "version": "v4",
    "maj": "10/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Spécificités pays — Sénégal",
    "version": "v3",
    "maj": "10/09/2026",
    "par": "Perle"
   },
   {
    "nom": "Spécificités pays — Canada",
    "version": "v2",
    "maj": "01/09/2026",
    "par": "Perle"
   }
  ],
  "bareme": "615 € par mois (Formation IA — Ressources v12 ; montant à confirmer par Perle)",
  "taux": {
   "XOF": "1 € = 655.957 XOF (parité fixe)",
   "CAD": "1 CAD = 0.6702 € (cours du 24/09/2026)"
  },
  "legende": {
   "fait": "Fait certain — lu dans le document",
   "contradiction": "Contradiction — deux sources ne concordent pas",
   "a-verifier": "À vérifier — lecture incertaine ou règle à confirmer",
   "conforme": "Point conforme"
  }
 },
 "dossiers": {
  "A": {
   "page": "profil-A.html",
   "etudiant": "Awa Kouassi",
   "langue": "fr",
   "zone": "Côte d'Ivoire — Abidjan",
   "etape": "Visa (après Études en France)",
   "ecole": "Institut Saint-Clair Paris",
   "analyse": {
    "date": "25/09/2026 08:31",
    "duree": "41 s",
    "declencheur": "Nouveau dépôt : attestation d'hébergement v2 (23/09, 20:05), puis 2 dépôts le 24/09",
    "lu": "13 pièces actives, 1 version supprimée, 5 validations humaines, profil et zone"
   },
   "dossier": {
    "verdict": "a-corriger",
    "synthese": [
     "5 sections à corriger, 1 à vérifier, 1 provisoire, 2 conformes.",
     "1 alerte sur une pièce déjà validée par Perle (passeport).",
     "1 pièce déposée dans la mauvaise section (billet d'avion).",
     "La pièce optionnelle (test de français) n'est pas analysée."
    ],
    "nonRequis": []
   },
   "eef": true,
   "attendus": [
    {
     "section": "Travel health insurance",
     "piece": "Attestation d'assurance santé voyage (le fichier déposé est un billet)"
    },
    {
     "section": "Proof of resource",
     "piece": "Relevé bancaire de juillet 2026"
    },
    {
     "section": "Proof of relationship",
     "piece": "Avis d'imposition et 3 bulletins de salaire du père"
    }
   ],
   "champs": [
    {
     "cle": "cursusEnding",
     "selecteur": "#visa_cursus_date_cursusEnding",
     "type": "date",
     "libelle": "Cursus ending",
     "actuel": "",
     "propose": "30/06/2028",
     "motif": "Date lue sur la lettre d'inscription validée (« Fin du cursus : 30/06/2028 »).",
     "source": {
      "fichier": "enrollment-letter",
      "zone": "fin",
      "nom": "FF__174_89_awa-kouassi__enrollment-letter_10_09_2026.pdf",
      "rect": [
       0.3477,
       0.3145,
       0.0942,
       0.0184
      ]
     }
    },
    {
     "cle": "state",
     "selecteur": "#App_data_state",
     "type": "select",
     "libelle": "Statut",
     "actuel": "documents-not-uploaded",
     "propose": "invalid-visa-center",
     "proposeLibelle": "invalid (visa center)",
     "motif": "5 sections doivent être corrigées par l'étudiante avant le dépôt au centre de visa."
    },
    {
     "cle": "message",
     "selecteur": "#App_data_message",
     "type": "texte",
     "libelle": "Texte à l'étudiant",
     "actuel": "",
     "motif": "Résumé des corrections demandées, dans la langue de l'étudiante (français).",
     "propose": "Bonjour Awa, merci pour vos dépôts. Il reste quelques corrections avant le rendez-vous au centre de visa :\n1. Relevés bancaires : ajoutez le relevé de juillet 2026.\n2. Lettre de votre père : elle doit être signée.\n3. CV : complétez la période depuis octobre 2025 et indiquez votre niveau d'études.\n4. Formulaire de visa : corrigez les cases 22 et 26.\n5. Assurance santé voyage : déposez votre attestation d'assurance.\nLe détail est indiqué sous chaque document."
    }
   ],
   "etapesVisa": [
    {
     "cle": "etape-2",
     "case": "#student_data_check_list_item_2",
     "date": "#student_data_check_list_date_from_2",
     "libelle": "Create your Études en France account",
     "coche": true,
     "le": "21/09/2026",
     "motif": "Le diplôme a été déposé pour l'étape Études en France le 21/09 : le compte existe.",
     "source": {
      "fichier": "licence-professionnelle",
      "nom": "FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.pdf"
     }
    }
   ],
   "sections": [
    {
     "alias": "passport",
     "statut": "alerte",
     "confiance": "élevée",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "10/09/2026 10:00"
     },
     "resume": "Validé par Perle le 10/09. Nouvelle incohérence : le passeport expire avant la fin du cursus.",
     "constatsSection": [
      {
       "t": "attention",
       "texte": "Passeport : expiration le 14/02/2028.",
       "docs": [
        {
         "fichier": "passport",
         "lien": "Passeport",
         "nom": "FF__137_89_awa-kouassi__passport_10_09_2026.pdf"
        }
       ]
      },
      {
       "t": "attention",
       "texte": "Cursus : fin le 30/06/2028.",
       "docs": [
        {
         "fichier": "enrollment-letter",
         "lien": "Lettre d'inscription",
         "nom": "FF__174_89_awa-kouassi__enrollment-letter_10_09_2026.pdf"
        }
       ]
      },
      {
       "t": "question",
       "texte": "Vérifier la date de fin du visa et la validité requise après le visa.",
       "docs": []
      }
     ],
     "alerte": {
      "texte": "Le passeport expire le 14/02/2028, soit 4 mois et demi avant la fin du cursus (30/06/2028, lettre d'inscription). La règle demande 3 mois de validité après le visa.",
      "proposition": "Conserver la validation et prévenir l'étudiante qu'elle devra renouveler son passeport avant février 2028 — ou invalider et demander un renouvellement dès maintenant.",
      "declenchee": "Date de fin de cursus lue sur la lettre d'inscription (analyse du 25/09).",
      "source": "d'après le passeport et la lettre d'inscription : il expire le 14/02/2028, avant la fin du cursus (30/06/2028)"
     },
     "regles": [
      {
       "id": "PASS-02",
       "texte": "Passeport valide au moins 3 mois après la date de fin du visa demandé.",
       "source": "Formation IA — Passeport v7"
      }
     ],
     "documents": [
      {
       "fichier": "passport",
       "sousType": "Passeport ordinaire (type P)",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "N° 21AB48213, au nom de KOUASSI Awa — concorde avec le profil.",
         "zone": "numero",
         "probleme": false,
         "rect": [
          0.3393,
          0.2066,
          0.1042,
          0.0192
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Date d'expiration : 14/02/2028.",
         "zone": "expiration",
         "probleme": false,
         "rect": [
          0.6417,
          0.2873,
          0.0984,
          0.0192
         ],
         "page": 1
        },
        {
         "type": "contradiction",
         "texte": "Expire avant la fin du cursus (30/06/2028) augmentée de 3 mois.",
         "zone": "expiration",
         "etudiant": "Votre passeport expire le 14/02/2028, avant la fin de vos études : il faudra le renouveler.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.6417,
          0.2873,
          0.0984,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "Votre passeport expire le 14/02/2028, avant la fin de vos études (30/06/2028). Pensez à le renouveler : le visa ne pourra pas aller au-delà de sa validité.",
        "interne": "Alerte IA : expiration 14/02/2028 < fin cursus + 3 mois. Validation humaine du 10/09 conservée en attendant l'arbitrage."
       },
       "note": {
        "valeur": 14,
        "seuil": 17,
        "pertes": [
         {
          "points": -6,
          "texte": "Expire avant la fin du cursus (30/06/2028) augmentée de 3 mois."
         }
        ]
       },
       "nom": "FF__137_89_awa-kouassi__passport_10_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__137_89_awa-kouassi__passport_10_09_2026.admin.pdf",
        "etudiant": "annotes/FF__137_89_awa-kouassi__passport_10_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "Validité du passeport ↔ fin du cursus",
       "a": {
        "fichier": "passport",
        "zone": "expiration",
        "valeur": "14/02/2028",
        "nom": "FF__137_89_awa-kouassi__passport_10_09_2026.pdf",
        "rect": [
         0.6417,
         0.2873,
         0.0984,
         0.0192
        ]
       },
       "b": {
        "fichier": "enrollment-letter",
        "zone": "fin",
        "valeur": "30/06/2028",
        "nom": "FF__174_89_awa-kouassi__enrollment-letter_10_09_2026.pdf",
        "rect": [
         0.3477,
         0.3145,
         0.0942,
         0.0184
        ]
       },
       "resultat": "contradiction"
      }
     ]
    },
    {
     "alias": "proof-ressource",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "3 fichiers reçus pour un seul compte : un doublon, juillet manquant, dernier solde suffisant.",
     "constatsSection": [
      {
       "t": "ko",
       "texte": "Le relevé de juillet 2026 manque entre juin et août.",
       "docs": [
        {
         "fichier": "releve-aout-2026-fcfa",
         "lien": "Relevé d'août",
         "nom": "FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.pdf"
        }
       ]
      },
      {
       "t": "attention",
       "texte": "« Relevé juin bis » est un doublon du relevé de juin.",
       "docs": [
        {
         "fichier": "releve-juin-2026-bis",
         "lien": "Relevé de juin (copie)",
         "nom": "FF__322_89_awa-kouassi__releve-juin-2026-bis_22_09_2026.pdf"
        }
       ]
      },
      {
       "t": "ok",
       "texte": "Dernier solde : 5 198,51 € au 31/08/2026.",
       "docs": [
        {
         "fichier": "releve-aout-2026-fcfa",
         "lien": "Relevé d'août",
         "nom": "FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "RES-03",
       "texte": "Les 3 derniers relevés mensuels du compte, sans mois manquant.",
       "source": "Formation IA — Ressources v12"
      },
      {
       "id": "RES-07",
       "texte": "Retenir le dernier solde de clôture pertinent, converti en euros.",
       "source": "Formation IA — Ressources v12"
      },
      {
       "id": "RES-09",
       "texte": "Un fichier en double est écarté, pas refusé : il n'est pas reproché à l'étudiant.",
       "source": "Prompt général v14"
      }
     ],
     "ressources": {
      "option": "Own resources (ressources personnelles)",
      "comptes": [
       {
        "compte": "CI 042 01001 0045871 22",
        "banque": "Banque Lagunaire de Côte d'Ivoire",
        "titulaire": "Awa KOUASSI",
        "devise": "XOF",
        "mois": [
         {
          "mois": "Juin 2026",
          "fichiers": [
           "releve-juin-2026",
           "releve-juin-2026-bis"
          ],
          "etat": "doublon",
          "cloture": "2 875 500 XOF",
          "noms": [
           "FF__285_89_awa-kouassi__releve-juin-2026_22_09_2026.pdf",
           "FF__322_89_awa-kouassi__releve-juin-2026-bis_22_09_2026.pdf"
          ]
         },
         {
          "mois": "Juillet 2026",
          "fichiers": [],
          "etat": "manquant",
          "noms": []
         },
         {
          "mois": "Août 2026",
          "fichiers": [
           "releve-aout-2026-fcfa"
          ],
          "etat": "ok",
          "cloture": "3 410 000 XOF",
          "noms": [
           "FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.pdf"
          ]
         }
        ]
       }
      ],
      "dernierSolde": {
       "valeur": "3 410 000 XOF",
       "euros": "5 198,51 €",
       "date": "31/08/2026",
       "fichier": "releve-aout-2026-fcfa",
       "zone": "cloture",
       "nom": "FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.pdf"
      },
      "complement": "Garant (père) : 400 000 XOF par mois = 609,80 € — voir section sponsor.",
      "besoin": "615 € × 12 mois = 7 380,00 € pour la première année",
      "conclusion": "Épargne + garant couvrent le besoin si la lettre du garant est signée."
     },
     "documents": [
      {
       "fichier": "releve-juin-2026",
       "sousType": "Relevé mensuel — juin 2026",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "Titulaire Awa KOUASSI, compte …45871 22, période juin 2026.",
         "zone": "periode",
         "probleme": false,
         "rect": [
          0.2805,
          0.2036,
          0.2324,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Solde de clôture 2 875 500 XOF = 4 383,67 €.",
         "zone": "cloture",
         "probleme": false,
         "rect": [
          0.7947,
          0.4833,
          0.1297,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "Relevé de juin retenu."
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__285_89_awa-kouassi__releve-juin-2026_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__285_89_awa-kouassi__releve-juin-2026_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__285_89_awa-kouassi__releve-juin-2026_22_09_2026.etudiant.pdf"
       }
      },
      {
       "fichier": "releve-juin-2026-bis",
       "sousType": "Relevé mensuel — juin 2026 (copie)",
       "verdict": "invalide",
       "constats": [
        {
         "type": "fait",
         "texte": "Même compte, même période et mêmes opérations que « releve-juin-2026 ».",
         "zone": "periode",
         "etudiant": "Ce fichier est le même relevé de juin : il ne compte pas comme un mois de plus.",
         "probleme": true,
         "rect": [
          0.2805,
          0.2036,
          0.2324,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Doublon : écarté du calcul.",
         "zone": "cloture",
         "probleme": false,
         "rect": [
          0.7947,
          0.4833,
          0.1297,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "Ce fichier est une deuxième copie du relevé de juin. Remplacez-le par le relevé de juillet 2026.",
        "interne": "Doublon exact du relevé de juin (écarté, non reproché)."
       },
       "note": {
        "valeur": 12,
        "seuil": 17,
        "pertes": [
         {
          "points": -8,
          "texte": "Doublon du relevé de juin : il ne compte pas comme un mois de plus."
         }
        ]
       },
       "nom": "FF__322_89_awa-kouassi__releve-juin-2026-bis_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__322_89_awa-kouassi__releve-juin-2026-bis_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__322_89_awa-kouassi__releve-juin-2026-bis_22_09_2026.etudiant.pdf"
       }
      },
      {
       "fichier": "releve-aout-2026-fcfa",
       "sousType": "Relevé mensuel — août 2026",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "Période août 2026, en francs CFA (XOF).",
         "zone": "devise",
         "probleme": false,
         "rect": [
          0.2805,
          0.1798,
          0.0446,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "contradiction",
         "texte": "Solde d'ouverture 3 020 500 XOF ≠ clôture de juin 2 875 500 XOF : le relevé de juillet manque entre les deux.",
         "zone": "ouverture",
         "etudiant": "Il manque le relevé de juillet 2026 entre juin et août.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.8061,
          0.3063,
          0.1183,
          0.0177
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Dernier solde : 3 410 000 XOF = 5 198,51 € au 31/08/2026.",
         "zone": "cloture",
         "probleme": false,
         "rect": [
          0.7947,
          0.4358,
          0.1297,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "Dernier solde retenu : 5 198,51 € au 31/08."
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": [],
        "remarque": "Le relevé de juillet manquant est compté pour la section, pas pour ce relevé."
       },
       "nom": "FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__359_89_awa-kouassi__releve-aout-2026-fcfa_22_09_2026.etudiant.pdf"
       }
      }
     ],
     "commentaireSection": {
      "etudiant": "Il manque votre relevé bancaire de juillet 2026. Merci de téléverser vos 3 derniers relevés bancaires : juin, juillet et août. Le fichier « relevé juin bis » est un doublon.",
      "interne": "Compte unique en XOF. Juin (x2, doublon), juillet absent, août OK. Dernier solde 5 198,51 €."
     },
     "propositionsObsoletes": [
      {
       "date": "22/09/2026 10:02",
       "texte": "Relevé de juin : il faut 3 relevés (1 seul reçu).",
       "raison": "Deux autres relevés sont arrivés à 10:05 : la conclusion a été recalculée sur les 3 fichiers."
      }
     ]
    },
    {
     "alias": "affidavit-sponsoring-letter",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "Lettre du père non signée ; sa pièce d'identité concorde.",
     "constatsSection": [
      {
       "t": "ko",
       "texte": "La lettre de prise en charge n'est pas signée.",
       "docs": [
        {
         "fichier": "lettre-sponsor-pere",
         "lien": "Attestation de prise en charge",
         "nom": "FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.pdf"
        }
       ]
      },
      {
       "t": "ok",
       "texte": "La pièce d'identité du garant est présente et concorde.",
       "docs": [
        {
         "fichier": "piece-identite-sponsor",
         "lien": "Carte nationale d'identité du garant",
         "nom": "FF__433_89_awa-kouassi__piece-identite-sponsor_22_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "SPO-01",
       "texte": "Lettre de prise en charge datée et signée + pièce d'identité du garant.",
       "source": "Formation IA — Ressources v12"
      },
      {
       "id": "SPO-04",
       "texte": "Le montant mensuel du garant est comparé au barème.",
       "source": "Formation IA — Ressources v12"
      }
     ],
     "documents": [
      {
       "fichier": "lettre-sponsor-pere",
       "sousType": "Attestation de prise en charge",
       "verdict": "invalide",
       "constats": [
        {
         "type": "fait",
         "texte": "Garant : Koffi Kouassi, CNI C 0045 7781, père de l'étudiante.",
         "zone": "engagement",
         "probleme": false,
         "rect": [
          0.0605,
          0.2523,
          0.879,
          0.0595
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Engagement : 400 000 XOF par mois = 609,80 €.",
         "zone": "montant",
         "probleme": false,
         "rect": [
          0.0605,
          0.3165,
          0.879,
          0.042
         ],
         "page": 1
        },
        {
         "type": "a-verifier",
         "texte": "609,80 € par mois : légèrement sous le barème de 615 €, compensé par l'épargne.",
         "zone": "montant",
         "probleme": false,
         "rect": [
          0.0605,
          0.3165,
          0.879,
          0.042
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "La lettre n'est pas signée.",
         "zone": "signature",
         "etudiant": "La lettre doit être signée par votre père.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.5947,
          0.4376,
          0.2889,
          0.0499
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "La lettre de prise en charge doit être signée par votre père. Merci de la téléverser à nouveau, signée.",
        "interne": "Montant 609,80 €/mois (< 615 €) : compensé par l'épargne de 5 198 €."
       },
       "note": {
        "valeur": 12,
        "seuil": 17,
        "pertes": [
         {
          "points": -2,
          "texte": "609,80 € par mois : légèrement sous le barème de 615 €, compensé par l'épargne."
         },
         {
          "points": -6,
          "texte": "La lettre n'est pas signée."
         }
        ]
       },
       "nom": "FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.etudiant.pdf"
       }
      },
      {
       "fichier": "piece-identite-sponsor",
       "sousType": "Carte nationale d'identité du garant",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "KOUASSI Koffi — même nom que la lettre.",
         "zone": "nom",
         "probleme": false,
         "rect": [
          0.3813,
          0.1442,
          0.0943,
          0.0199
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "N° C 0045 7781 — même numéro que la lettre.",
         "zone": "numero",
         "probleme": false,
         "rect": [
          0.3813,
          0.2725,
          0.1159,
          0.0199
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Valide jusqu'au 22/03/2029.",
         "zone": "expiration",
         "probleme": false,
         "rect": [
          0.3813,
          0.3153,
          0.1026,
          0.0199
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__433_89_awa-kouassi__piece-identite-sponsor_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__433_89_awa-kouassi__piece-identite-sponsor_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__433_89_awa-kouassi__piece-identite-sponsor_22_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "Lettre du garant ↔ pièce d'identité",
       "a": {
        "fichier": "lettre-sponsor-pere",
        "zone": "engagement",
        "valeur": "CNI C 0045 7781",
        "nom": "FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.pdf",
        "rect": [
         0.0605,
         0.2523,
         0.879,
         0.0595
        ]
       },
       "b": {
        "fichier": "piece-identite-sponsor",
        "zone": "numero",
        "valeur": "C 0045 7781",
        "nom": "FF__433_89_awa-kouassi__piece-identite-sponsor_22_09_2026.pdf",
        "rect": [
         0.3813,
         0.2725,
         0.1159,
         0.0199
        ]
       },
       "resultat": "coherent"
      },
      {
       "titre": "Garant ↔ acte de naissance (lien familial)",
       "a": {
        "fichier": "lettre-sponsor-pere",
        "zone": "engagement",
        "valeur": "Koffi Kouassi",
        "nom": "FF__396_89_awa-kouassi__lettre-sponsor-pere_22_09_2026.pdf",
        "rect": [
         0.0605,
         0.2523,
         0.879,
         0.0595
        ]
       },
       "b": {
        "fichier": "acte-de-naissance",
        "zone": "pere",
        "valeur": "Koffi KOUASSI",
        "nom": "FF__470_89_awa-kouassi__acte-de-naissance_22_09_2026.pdf",
        "rect": [
         0.2973,
         0.3931,
         0.1355,
         0.0192
        ]
       },
       "resultat": "coherent"
      }
     ],
     "commentaireSection": {
      "etudiant": "La lettre de votre père doit être signée.",
      "interne": "Pièce d'identité conforme ; seule la signature manque."
     }
    },
    {
     "alias": "proof-ressource-relationship-taxbill-payslips",
     "statut": "provisoire",
     "confiance": "moyenne",
     "resume": "1 pièce sur 3 reçue (acte de naissance). Conclusion provisoire.",
     "constatsSection": [
      {
       "t": "ok",
       "texte": "Reçu : extrait d'acte de naissance",
       "docs": [
        {
         "fichier": "acte-de-naissance",
         "lien": "Extrait d'acte de naissance",
         "nom": "FF__470_89_awa-kouassi__acte-de-naissance_22_09_2026.pdf"
        }
       ]
      },
      {
       "t": "attention",
       "texte": "Avis d'imposition",
       "docs": []
      },
      {
       "t": "attention",
       "texte": "3 derniers bulletins de salaire du père",
       "docs": []
      }
     ],
     "provisoire": {
      "recu": [
       "Acte de naissance"
      ],
      "attendus": [
       "Avis d'imposition du garant",
       "3 derniers bulletins de salaire du garant"
      ],
      "texte": "Les pièces arrivent souvent en plusieurs dépôts : aucune demande n'est envoyée tant que l'étudiante n'a pas terminé ses dépôts ou que Perle ne le décide pas."
     },
     "regles": [
      {
       "id": "SPO-06",
       "texte": "Garant : preuve du lien, avis d'imposition et 3 bulletins de salaire.",
       "source": "Spécificités pays — Côte d'Ivoire v4"
      }
     ],
     "documents": [
      {
       "fichier": "acte-de-naissance",
       "sousType": "Extrait d'acte de naissance",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "Père : Koffi KOUASSI — c'est bien le garant.",
         "zone": "pere",
         "probleme": false,
         "rect": [
          0.2973,
          0.3931,
          0.1355,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "Lien de filiation prouvé."
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__470_89_awa-kouassi__acte-de-naissance_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__470_89_awa-kouassi__acte-de-naissance_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__470_89_awa-kouassi__acte-de-naissance_22_09_2026.etudiant.pdf"
       }
      }
     ],
     "commentaireSection": {
      "etudiant": "Merci d'ajouter l'avis d'imposition et les 3 derniers bulletins de salaire de votre père.",
      "interne": "Provisoire : 1/3 reçu."
     }
    },
    {
     "alias": "proof-accommodation-france",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Version 2 : la date de début a été corrigée comme demandé.",
     "constatsSection": [
      {
       "t": "ok",
       "texte": "La date de début a été corrigée dans la version 2.",
       "docs": [
        {
         "fichier": "attestation-hebergement-v2",
         "lien": "Attestation d'hébergement",
         "nom": "FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "HEB-01",
       "texte": "Hébergement couvrant au moins les 3 premiers mois, dates à venir.",
       "source": "Prompt général v14"
      }
     ],
     "versions": [
      {
       "fichier": "attestation-hebergement-v1",
       "depose": "23/09/2026 19:40",
       "statut": "invalide",
       "commentairePerle": "mettez à jour la date de début de l'hebergement",
       "resolu": true,
       "preuve": "Début passé du 15/09/2026 au 01/10/2026 ; date de fin ajoutée (31/12/2026).",
       "nom": "FF__507_89_awa-kouassi__attestation-hebergement-v1_23_09_2026.pdf"
      }
     ],
     "reponseEtudiant": {
      "texte": "J'ai mis à jour la date de début de l'hébergement.",
      "le": "23/09/2026 20:05",
      "priseEnCompte": "Confirmé par la comparaison des deux versions."
     },
     "comparaison": {
      "avant": "attestation-hebergement-v1",
      "apres": "attestation-hebergement-v2",
      "changements": [
       {
        "zone": "debut",
        "avant": "15/09/2026",
        "apres": "01/10/2026",
        "rectAvant": [
         0.4149,
         0.2824,
         0.0942,
         0.0184
        ],
        "rectApres": [
         0.4149,
         0.2824,
         0.0942,
         0.0184
        ]
       },
       {
        "zone": "fin",
        "avant": "—",
        "apres": "31/12/2026",
        "rectAvant": [
         0.4149,
         0.311,
         0.0269,
         0.0184
        ],
        "rectApres": [
         0.4149,
         0.311,
         0.0942,
         0.0184
        ]
       }
      ],
      "nomAvant": "FF__507_89_awa-kouassi__attestation-hebergement-v1_23_09_2026.pdf",
      "nomApres": "FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.pdf"
     },
     "documents": [
      {
       "fichier": "attestation-hebergement-v2",
       "sousType": "Attestation d'hébergement chez un particulier",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Début de l'hébergement : 01/10/2026.",
         "zone": "debut",
         "probleme": false,
         "rect": [
          0.4149,
          0.2824,
          0.0942,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Fin : 31/12/2026 — les 3 premiers mois sont couverts.",
         "zone": "fin",
         "probleme": false,
         "rect": [
          0.4149,
          0.311,
          0.0942,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Signée par l'hébergeuse.",
         "zone": "signature",
         "probleme": false,
         "rect": [
          0.5947,
          0.4089,
          0.2856,
          0.0428
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "Commentaire du 23/09 résolu."
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.admin.pdf",
        "etudiant": "annotes/FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "Adresse d'hébergement ↔ formulaire de visa (case 30)",
       "a": {
        "fichier": "attestation-hebergement-v2",
        "zone": "debut",
        "valeur": "12 rue Imaginaire, 75011 Paris",
        "nom": "FF__544_89_awa-kouassi__attestation-hebergement-v2_23_09_2026.pdf",
        "rect": [
         0.4149,
         0.2824,
         0.0942,
         0.0184
        ]
       },
       "b": {
        "fichier": "visa-form",
        "zone": "case-30",
        "valeur": "12 rue Imaginaire, 75011 Paris",
        "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf",
        "rect": [
         0.0672,
         0.5463,
         0.8656,
         0.0285
        ]
       },
       "resultat": "coherent"
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "resume",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "Période vide depuis octobre 2025 ; niveau d'études non indiqué.",
     "constatsSection": [
      {
       "t": "ko",
       "texte": "Période vide depuis octobre 2025.",
       "docs": [
        {
         "fichier": "resume",
         "lien": "CV",
         "nom": "FF__581_89_awa-kouassi__resume_21_09_2026.pdf"
        }
       ]
      },
      {
       "t": "ko",
       "texte": "Niveau d'études non indiqué.",
       "docs": [
        {
         "fichier": "resume",
         "lien": "CV",
         "nom": "FF__581_89_awa-kouassi__resume_21_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "CV-02",
       "texte": "Aucune période vide dans le parcours.",
       "source": "Prompt général v14"
      },
      {
       "id": "CV-03",
       "texte": "Niveau d'études indiqué (« Bac+3 ou équivalent »).",
       "source": "Formation IA — CV v5"
      }
     ],
     "documents": [
      {
       "fichier": "resume",
       "sousType": "CV",
       "verdict": "invalide",
       "constats": [
        {
         "type": "fait",
         "texte": "Dernière activité : stage terminé en 09/2025. Rien depuis octobre 2025.",
         "zone": "experience-stage-dates",
         "etudiant": "Que faites-vous depuis octobre 2025 ? Le CV ne doit pas avoir de période vide.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.0622,
          0.2875,
          0.1432,
          0.0177
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Le niveau d'études n'est pas indiqué.",
         "zone": "titre",
         "etudiant": "Indiquez votre niveau d'études (« Bac+3 ou équivalent »).",
         "probleme": true,
         "rect": [
          0.0622,
          0.086,
          0.3501,
          0.0199
         ],
         "page": 1
        },
        {
         "type": "contradiction",
         "texte": "Licence indiquée « 2022 – 2025 » ; le diplôme dit session juin 2024.",
         "zone": "formation-licence-dates",
         "probleme": true,
         "rect": [
          0.0622,
          0.1792,
          0.0988,
          0.0177
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "Que faites-vous depuis octobre 2025 ? Votre CV ne doit pas comporter de période vide. Ajoutez aussi votre niveau d'études (« Bac+3 ou équivalent »).",
        "interne": "Écart de dates licence CV (2025) / diplôme (2024) : voir section Diploma."
       },
       "note": {
        "valeur": 6,
        "seuil": 17,
        "pertes": [
         {
          "points": -6,
          "texte": "Dernière activité : stage terminé en 09/2025. Rien depuis octobre 2025."
         },
         {
          "points": -4,
          "texte": "Le niveau d'études n'est pas indiqué."
         },
         {
          "points": -4,
          "texte": "Licence indiquée « 2022 – 2025 » ; le diplôme dit session juin 2024."
         }
        ]
       },
       "nom": "FF__581_89_awa-kouassi__resume_21_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__581_89_awa-kouassi__resume_21_09_2026.admin.pdf",
        "etudiant": "annotes/FF__581_89_awa-kouassi__resume_21_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "CV ↔ diplôme (année de la licence)",
       "a": {
        "fichier": "resume",
        "zone": "formation-licence-dates",
        "valeur": "2022 – 2025",
        "nom": "FF__581_89_awa-kouassi__resume_21_09_2026.pdf",
        "rect": [
         0.0622,
         0.1792,
         0.0988,
         0.0177
        ]
       },
       "b": {
        "fichier": "licence-professionnelle",
        "zone": "session",
        "valeur": "Juin 2024",
        "nom": "FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.pdf",
        "rect": [
         0.3981,
         0.351,
         0.102,
         0.0214
        ]
       },
       "resultat": "contradiction"
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "eef-diploma",
     "statut": "a-verifier",
     "confiance": "moyenne",
     "resume": "Diplôme lisible ; l'année ne concorde pas avec le CV.",
     "constatsSection": [
      {
       "t": "attention",
       "texte": "L'année du diplôme ne concorde pas avec le CV.",
       "docs": [
        {
         "fichier": "licence-professionnelle",
         "lien": "Diplôme — licence professionnelle",
         "nom": "FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.pdf"
        },
        {
         "fichier": "resume",
         "lien": "CV",
         "nom": "FF__581_89_awa-kouassi__resume_21_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "EEF-04",
       "texte": "Le diplôme doit correspondre au parcours indiqué dans le CV.",
       "source": "Spécificités pays — Côte d'Ivoire v4"
      }
     ],
     "documents": [
      {
       "fichier": "licence-professionnelle",
       "sousType": "Diplôme — licence professionnelle",
       "verdict": "a-verifier",
       "constats": [
        {
         "type": "fait",
         "texte": "Licence professionnelle, mention Communication des organisations.",
         "zone": "intitule",
         "probleme": false,
         "rect": [
          0.2285,
          0.1828,
          0.5431,
          0.0333
         ],
         "page": 1
        },
        {
         "type": "a-verifier",
         "texte": "Session juin 2024, alors que le CV indique 2025 : erreur de saisie probable dans le CV.",
         "zone": "session",
         "probleme": false,
         "rect": [
          0.3981,
          0.351,
          0.102,
          0.0214
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "À vérifier : 2024 (diplôme) / 2025 (CV). Probablement une erreur du CV."
       },
       "note": {
        "valeur": 18,
        "seuil": 17,
        "pertes": [
         {
          "points": -2,
          "texte": "Session juin 2024, alors que le CV indique 2025 : erreur de saisie probable dans le CV."
         }
        ]
       },
       "nom": "FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.admin.pdf",
        "etudiant": "annotes/FF__618_89_awa-kouassi__licence-professionnelle_21_09_2026.etudiant.pdf"
       }
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "visa-form",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "Case 22 : école en France au lieu de l'établissement actuel. Case 26 : date différente du billet.",
     "constatsSection": [
      {
       "t": "ko",
       "texte": "Case 22 : école en France au lieu de l'établissement actuel.",
       "docs": [
        {
         "fichier": "visa-form",
         "lien": "Formulaire France-Visas",
         "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf"
        }
       ]
      },
      {
       "t": "ko",
       "texte": "Case 26 : 01/10/2026, mais le vol est le 29/09/2026.",
       "docs": [
        {
         "fichier": "visa-form",
         "lien": "Formulaire France-Visas",
         "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf"
        },
        {
         "fichier": "billet-avion-abidjan-paris",
         "lien": "Billet d'avion",
         "nom": "FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.pdf"
        }
       ]
      }
     ],
     "regles": [
      {
       "id": "FV-22",
       "texte": "Case 22 : établissement actuel dans le pays de résidence.",
       "source": "Formation IA — Formulaire France-Visas v9"
      },
      {
       "id": "FV-26",
       "texte": "Case 26 : date d'arrivée = date du vol.",
       "source": "Formation IA — Formulaire France-Visas v9"
      }
     ],
     "documents": [
      {
       "fichier": "visa-form",
       "sousType": "Brouillon France-Visas",
       "verdict": "invalide",
       "constats": [
        {
         "type": "fait",
         "texte": "Case 22 : « Institut Saint-Clair Paris » (école en France).",
         "zone": "case-22",
         "etudiant": "Case 22 : n'écrivez pas votre école en France, écrivez votre établissement actuel en Côte d'Ivoire.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.0672,
          0.4227,
          0.8656,
          0.0285
         ],
         "page": 1
        },
        {
         "type": "contradiction",
         "texte": "Case 26 : 01/10/2026, mais le billet d'avion est au 29/09/2026.",
         "zone": "case-26",
         "etudiant": "Case 26 : indiquez la date de votre vol (29/09/2026).",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.0672,
          0.4845,
          0.8656,
          0.0285
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Case 16 : expiration du passeport identique au passeport.",
         "zone": "case-16",
         "probleme": false,
         "rect": [
          0.0672,
          0.3301,
          0.8656,
          0.0285
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Case 30 : adresse identique à l'attestation d'hébergement.",
         "zone": "case-30",
         "probleme": false,
         "rect": [
          0.0672,
          0.5463,
          0.8656,
          0.0285
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "Case 22 : n'écrivez pas votre école en France, écrivez votre établissement actuel en Côte d'Ivoire. Case 26 : indiquez la date de votre vol (29/09/2026).",
        "interne": ""
       },
       "note": {
        "valeur": 8,
        "seuil": 17,
        "pertes": [
         {
          "points": -6,
          "texte": "Case 22 : « Institut Saint-Clair Paris » (école en France)."
         },
         {
          "points": -6,
          "texte": "Case 26 : 01/10/2026, mais le billet d'avion est au 29/09/2026."
         }
        ]
       },
       "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__655_89_awa-kouassi__visa-form_24_09_2026.admin.pdf",
        "etudiant": "annotes/FF__655_89_awa-kouassi__visa-form_24_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "Formulaire case 26 ↔ billet d'avion",
       "a": {
        "fichier": "visa-form",
        "zone": "case-26",
        "valeur": "01/10/2026",
        "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf",
        "rect": [
         0.0672,
         0.4845,
         0.8656,
         0.0285
        ]
       },
       "b": {
        "fichier": "billet-avion-abidjan-paris",
        "zone": "date",
        "valeur": "29/09/2026",
        "nom": "FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.pdf",
        "rect": [
         0.2805,
         0.262,
         0.1194,
         0.0229
        ]
       },
       "resultat": "contradiction"
      },
      {
       "titre": "Formulaire case 16 ↔ passeport",
       "a": {
        "fichier": "visa-form",
        "zone": "case-16",
        "valeur": "14/02/2028",
        "nom": "FF__655_89_awa-kouassi__visa-form_24_09_2026.pdf",
        "rect": [
         0.0672,
         0.3301,
         0.8656,
         0.0285
        ]
       },
       "b": {
        "fichier": "passport",
        "zone": "expiration",
        "valeur": "14/02/2028",
        "nom": "FF__137_89_awa-kouassi__passport_10_09_2026.pdf",
        "rect": [
         0.6417,
         0.2873,
         0.0984,
         0.0192
        ]
       },
       "resultat": "coherent"
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "travel-health-insurance",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "Le fichier déposé est un billet d'avion, pas une assurance.",
     "constatsSection": [
      {
       "t": "ko",
       "texte": "Le fichier déposé est un billet d'avion, pas une assurance.",
       "docs": [
        {
         "fichier": "billet-avion-abidjan-paris",
         "lien": "Billet d'avion (aller simple)",
         "nom": "FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.pdf"
        }
       ]
      }
     ],
     "mauvaiseSection": {
      "detecte": "Billet d'avion Abidjan → Paris (vol AL 704, 29/09/2026)",
      "sectionProposee": "Flight ticket (one way)",
      "aliasPropose": "flight-ticket",
      "sectionActuelle": "Travel health insurance",
      "motifCourt": "C'est un billet d'avion (vol AL 704, 29/09/2026), pas une assurance.",
      "messageEtudiant": "Nous avons déplacé votre billet d'avion de la section « Travel health insurance » vers « Flight ticket (one way) ».",
      "motif": "Le document porte un numéro de vol, un trajet ABJ → CDG et la mention « ONE WAY ». Aucune garantie d'assurance n'y figure."
     },
     "regles": [
      {
       "id": "GEN-06",
       "texte": "Pièce dans la mauvaise section : avertir et proposer la bonne section, sans déplacer.",
       "source": "Prompt général v14"
      }
     ],
     "documents": [
      {
       "fichier": "billet-avion-abidjan-paris",
       "sousType": "Billet d'avion (aller simple)",
       "verdict": "invalide",
       "constats": [
        {
         "type": "fait",
         "texte": "Billet électronique AL 704, ABJ → CDG, 29/09/2026.",
         "zone": "billet",
         "etudiant": "Ce document est un billet d'avion, pas une assurance.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.0672,
          0.2279,
          0.8656,
          0.1069
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "Ce document est votre billet d'avion. Merci de déposer ici votre attestation d'assurance santé voyage couvrant tout le séjour.",
        "interne": "Billet à déplacer dans « Flight ticket (one way) »."
       },
       "note": {
        "valeur": 0,
        "seuil": 17,
        "pertes": [
         {
          "points": -20,
          "texte": "Ce n'est pas une assurance : aucune garantie ni période de couverture."
         }
        ]
       },
       "nom": "FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.admin.pdf",
        "etudiant": "annotes/FF__692_89_awa-kouassi__billet-avion-abidjan-paris_24_09_2026.etudiant.pdf"
       }
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "enrollment-letter",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "10/09/2026"
     }
    },
    {
     "alias": "cover-letter",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "12/09/2026"
     }
    },
    {
     "alias": "id-photos",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "08/09/2026"
     }
    },
    {
     "alias": "french-test",
     "statut": "optionnel"
    }
   ],
   "campusFrance": {
    "disponible": false,
    "raison": "Les questions Campus France seront préparées après validation des pièces Études en France (diplôme encore à vérifier)."
   },
   "code": "A",
   "bareme": {
    "seuil": 17,
    "zone": "Côte d'Ivoire",
    "source": "Afrique : 8,5/10 (réunion du 30/06) — à confirmer par Perle"
   }
  },
  "B": {
   "page": "profil-B.html",
   "etudiant": "Lucas Ferreira",
   "langue": "en",
   "zone": "Canada — Toronto",
   "etape": "Visa (pas d'Études en France pour cette zone)",
   "ecole": "Horizon Business School Paris",
   "analyse": {
    "date": "25/09/2026 08:29",
    "duree": "33 s",
    "declencheur": "Dernier dépôt : flight ticket, resume et cover letter (22/09)",
    "lu": "10 pièces actives, profil et zone"
   },
   "dossier": {
    "verdict": "conforme",
    "synthese": [
     "Les 10 sections sont conformes.",
     "Aucune étape Études en France pour la zone Canada.",
     "La lettre de sponsor n'est pas requise : ressources personnelles."
    ],
    "nonRequis": [
     {
      "section": "Proof of resource, if sponsor: sponsoring letter + ID",
      "motif": "L'étudiant a choisi « Own resources » et justifie seul ses ressources."
     }
    ]
   },
   "eef": false,
   "attendus": [],
   "champs": [
    {
     "cle": "state",
     "selecteur": "#App_data_state",
     "type": "select",
     "libelle": "Statut",
     "actuel": "documents-not-uploaded",
     "propose": "OK-visa-center",
     "proposeLibelle": "valid (visa center)",
     "motif": "Toutes les pièces requises sont conformes."
    },
    {
     "cle": "message",
     "selecteur": "#App_data_message",
     "type": "texte",
     "libelle": "Texte à l'étudiant",
     "actuel": "",
     "motif": "Message dans la langue de l'étudiant (anglais).",
     "propose": "Hello Lucas, all your documents have been checked and validated. You can now book your appointment at the visa center in Toronto and bring the originals with you."
    }
   ],
   "etapesVisa": [
    {
     "cle": "etape-4",
     "case": "#student_data_check_list_item_4",
     "date": "#student_data_check_list_date_from_4",
     "libelle": "Documents pre-validated by Feel Français",
     "coche": true,
     "le": "25/09/2026",
     "motif": "Les 10 sections sont conformes."
    }
   ],
   "sections": [
    {
     "alias": "passport",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Valide jusqu'au 11/05/2031.",
     "regles": [
      {
       "id": "PASS-02",
       "texte": "Passeport valide au moins 3 mois après la date de fin du visa demandé.",
       "source": "Formation IA — Passeport v7"
      }
     ],
     "documents": [
      {
       "fichier": "passport",
       "sousType": "Passeport ordinaire",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "N° HK418273 au nom de FERREIRA Lucas.",
         "zone": "numero",
         "probleme": false,
         "rect": [
          0.3393,
          0.2066,
          0.0944,
          0.0192
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Expire le 11/05/2031, bien après la fin du cursus (25/06/2027).",
         "zone": "expiration",
         "probleme": false,
         "rect": [
          0.6417,
          0.2873,
          0.0984,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__766_90_lucas-ferreira__passport_20_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__766_90_lucas-ferreira__passport_20_09_2026.admin.pdf",
        "etudiant": "annotes/FF__766_90_lucas-ferreira__passport_20_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "enrollment-letter",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "MSc International Business, du 19/10/2026 au 25/06/2027 — identique au profil.",
     "documents": [
      {
       "fichier": "enrollment-letter",
       "sousType": "Letter of final admission",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Début 19/10/2026 = Cursus beginning du profil.",
         "zone": "debut",
         "probleme": false,
         "rect": [
          0.3477,
          0.2884,
          0.0942,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Fin 25/06/2027 = Cursus ending du profil.",
         "zone": "fin",
         "probleme": false,
         "rect": [
          0.3477,
          0.3145,
          0.0942,
          0.0184
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__803_90_lucas-ferreira__enrollment-letter_20_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__803_90_lucas-ferreira__enrollment-letter_20_09_2026.admin.pdf",
        "etudiant": "annotes/FF__803_90_lucas-ferreira__enrollment-letter_20_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "id-photos",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "4 photos, fond clair.",
     "documents": [
      {
       "fichier": "id-photos",
       "sousType": "Photos d'identité",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Format et fond conformes.",
         "zone": "photo",
         "probleme": false,
         "rect": [
          0.1512,
          0.0735,
          0.252,
          0.2257
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__840_90_lucas-ferreira__id-photos_20_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__840_90_lucas-ferreira__id-photos_20_09_2026.admin.pdf",
        "etudiant": "annotes/FF__840_90_lucas-ferreira__id-photos_20_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "proof-ressource",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Relevé trimestriel juin–août ; dernier solde 9 952,47 €.",
     "regles": [
      {
       "id": "RES-03",
       "texte": "Les 3 derniers relevés mensuels du compte, sans mois manquant.",
       "source": "Formation IA — Ressources v12"
      },
      {
       "id": "CA-02",
       "texte": "Canada : un relevé trimestriel vaut les 3 relevés mensuels.",
       "source": "Spécificités pays — Canada v2"
      }
     ],
     "ressources": {
      "option": "Own resources",
      "comptes": [
       {
        "compte": "004-11872-5530918",
        "banque": "Northern Maple Bank",
        "titulaire": "Lucas FERREIRA",
        "devise": "CAD",
        "mois": [
         {
          "mois": "Juin 2026",
          "fichiers": [
           "proof-ressource"
          ],
          "etat": "ok",
          "noms": [
           "FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.pdf"
          ]
         },
         {
          "mois": "Juillet 2026",
          "fichiers": [
           "proof-ressource"
          ],
          "etat": "ok",
          "noms": [
           "FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.pdf"
          ]
         },
         {
          "mois": "Août 2026",
          "fichiers": [
           "proof-ressource"
          ],
          "etat": "ok",
          "cloture": "14 850,00 CAD",
          "noms": [
           "FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.pdf"
          ]
         }
        ]
       }
      ],
      "dernierSolde": {
       "valeur": "14 850,00 CAD",
       "euros": "9 952,47 €",
       "date": "31/08/2026",
       "fichier": "proof-ressource",
       "zone": "cloture",
       "nom": "FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.pdf"
      },
      "besoin": "615 € × 9 mois de cursus = 5 535,00 €",
      "conclusion": "Le solde couvre le besoin."
     },
     "documents": [
      {
       "fichier": "proof-ressource",
       "sousType": "Relevé trimestriel (juin–août 2026)",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Titulaire Lucas FERREIRA, 3 mois couverts.",
         "zone": "periode",
         "probleme": false,
         "rect": [
          0.2805,
          0.2036,
          0.3332,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Solde 14 850,00 CAD = 9 952,47 € ≥ 5 535,00 €.",
         "zone": "cloture",
         "probleme": false,
         "rect": [
          0.7927,
          0.5308,
          0.1317,
          0.0192
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.admin.pdf",
        "etudiant": "annotes/FF__877_90_lucas-ferreira__proof-ressource_21_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "proof-accommodation-france",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Résidence du 15/10/2026 au 30/06/2027 : couvre l'arrivée et tout le cursus.",
     "documents": [
      {
       "fichier": "proof-accommodation-france",
       "sousType": "Résidence étudiante",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Début 15/10/2026 = date du vol.",
         "zone": "debut",
         "probleme": false,
         "rect": [
          0.3477,
          0.2694,
          0.0942,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Fin 30/06/2027, après la fin du cursus.",
         "zone": "fin",
         "probleme": false,
         "rect": [
          0.3477,
          0.2979,
          0.0942,
          0.0184
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__914_90_lucas-ferreira__proof-accommodation-france_21_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__914_90_lucas-ferreira__proof-accommodation-france_21_09_2026.admin.pdf",
        "etudiant": "annotes/FF__914_90_lucas-ferreira__proof-accommodation-france_21_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "travel-health-insurance",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Couverture du 15/10/2026 au 14/10/2027, frais médicaux illimités.",
     "documents": [
      {
       "fichier": "travel-health-insurance",
       "sousType": "Assurance santé voyage long séjour",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Du 15/10/2026 au 14/10/2027.",
         "zone": "debut",
         "probleme": false,
         "rect": [
          0.3141,
          0.1846,
          0.0942,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Frais médicaux illimités, rapatriement inclus.",
         "zone": "garantie-0",
         "probleme": false,
         "rect": [
          0.8195,
          0.3057,
          0.0847,
          0.0184
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__951_90_lucas-ferreira__travel-health-insurance_21_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__951_90_lucas-ferreira__travel-health-insurance_21_09_2026.admin.pdf",
        "etudiant": "annotes/FF__951_90_lucas-ferreira__travel-health-insurance_21_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "visa-form",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Cases 22, 26 et 30 cohérentes avec les autres pièces.",
     "documents": [
      {
       "fichier": "visa-form",
       "sousType": "Brouillon France-Visas",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Case 22 : établissement actuel au Canada.",
         "zone": "case-22",
         "probleme": false,
         "rect": [
          0.0672,
          0.4227,
          0.8656,
          0.0285
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Case 26 : 15/10/2026 = date du vol.",
         "zone": "case-26",
         "probleme": false,
         "rect": [
          0.0672,
          0.4845,
          0.8656,
          0.0285
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Case 30 : même adresse que l'attestation de logement.",
         "zone": "case-30",
         "probleme": false,
         "rect": [
          0.0672,
          0.5463,
          0.8656,
          0.0285
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__988_90_lucas-ferreira__visa-form_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__988_90_lucas-ferreira__visa-form_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__988_90_lucas-ferreira__visa-form_22_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "Formulaire case 26 ↔ billet d'avion",
       "a": {
        "fichier": "visa-form",
        "zone": "case-26",
        "valeur": "15/10/2026",
        "nom": "FF__988_90_lucas-ferreira__visa-form_22_09_2026.pdf",
        "rect": [
         0.0672,
         0.4845,
         0.8656,
         0.0285
        ]
       },
       "b": {
        "fichier": "flight-ticket",
        "zone": "date",
        "valeur": "15/10/2026",
        "nom": "FF__1025_90_lucas-ferreira__flight-ticket_22_09_2026.pdf",
        "rect": [
         0.2805,
         0.262,
         0.1194,
         0.0229
        ]
       },
       "resultat": "coherent"
      }
     ]
    },
    {
     "alias": "flight-ticket",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Aller simple YYZ → CDG le 15/10/2026.",
     "documents": [
      {
       "fichier": "flight-ticket",
       "sousType": "Billet d'avion (aller simple)",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Vol le 15/10/2026, 4 jours avant la rentrée.",
         "zone": "date",
         "probleme": false,
         "rect": [
          0.2805,
          0.262,
          0.1194,
          0.0229
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__1025_90_lucas-ferreira__flight-ticket_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1025_90_lucas-ferreira__flight-ticket_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1025_90_lucas-ferreira__flight-ticket_22_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "resume",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Parcours continu, niveau indiqué.",
     "documents": [
      {
       "fichier": "resume",
       "sousType": "CV",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Aucune période vide.",
         "zone": "experience-dates",
         "probleme": false,
         "rect": [
          0.0622,
          0.2536,
          0.1432,
          0.0177
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__1062_90_lucas-ferreira__resume_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1062_90_lucas-ferreira__resume_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1062_90_lucas-ferreira__resume_22_09_2026.etudiant.pdf"
       }
      }
     ]
    },
    {
     "alias": "cover-letter",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Projet cohérent avec le programme ; retour au Canada prévu.",
     "documents": [
      {
       "fichier": "cover-letter",
       "sousType": "Lettre de motivation",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "429 caractères, sous la limite de 2 500.",
         "zone": "lettre",
         "probleme": false,
         "rect": [
          0.0571,
          0.1982,
          0.8858,
          0.1499
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 12,
        "pertes": []
       },
       "nom": "FF__1099_90_lucas-ferreira__cover-letter_22_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1099_90_lucas-ferreira__cover-letter_22_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1099_90_lucas-ferreira__cover-letter_22_09_2026.etudiant.pdf"
       }
      }
     ]
    }
   ],
   "campusFrance": {
    "disponible": false,
    "absent": true,
    "raison": "La zone Canada ne prévoit pas d'entretien Campus France : rien n'est proposé."
   },
   "code": "B",
   "bareme": {
    "seuil": 12,
    "zone": "Canada",
    "source": "Amérique du Nord : 6/10 (réunion du 30/06) — à confirmer par Perle"
   }
  },
  "C": {
   "page": "profil-C.html",
   "etudiant": "Mariam Diallo",
   "langue": "fr",
   "zone": "Sénégal — Dakar",
   "etape": "Visa (après Études en France)",
   "ecole": "Institut Delta d'Ingénierie",
   "analyse": {
    "date": "25/09/2026 08:30",
    "duree": "37 s",
    "declencheur": "Nouveau dépôt : lettre de motivation v3 avec un commentaire de l'étudiante (24/09, 09:12)",
    "lu": "8 pièces actives, 2 versions supprimées avec les commentaires de Perle, 5 validations humaines"
   },
   "dossier": {
    "verdict": "a-corriger",
    "synthese": [
     "La 3e lettre de motivation corrige les deux remarques précédentes.",
     "Ressources : il manque 2 relevés du garant et sa lettre de prise en charge.",
     "5 pièces validées par Perle, sans nouvelle incohérence."
    ],
    "nonRequis": []
   },
   "eef": true,
   "attendus": [
    {
     "section": "Proof of resource",
     "piece": "Relevés de juin et juillet 2026 du garant"
    },
    {
     "section": "Sponsoring letter + ID",
     "piece": "Lettre de prise en charge signée et pièce d'identité du garant"
    }
   ],
   "champs": [
    {
     "cle": "message",
     "selecteur": "#App_data_message",
     "type": "texte",
     "libelle": "Texte à l'étudiant",
     "actuel": "",
     "motif": "Il ne reste que les ressources à compléter.",
     "propose": "Bonjour Mariam, votre lettre de motivation est validée, merci pour les corrections. Il reste à compléter la preuve de ressources : les 3 derniers relevés bancaires de votre père et sa lettre de prise en charge signée, avec une copie de sa pièce d'identité."
    },
    {
     "cle": "state",
     "selecteur": "#App_data_state",
     "type": "select",
     "libelle": "Statut",
     "actuel": "documents-not-uploaded",
     "propose": "invalid-visa-center",
     "proposeLibelle": "invalid (visa center)",
     "motif": "La section ressources doit être complétée."
    }
   ],
   "etapesVisa": [
    {
     "cle": "etape-1",
     "case": "#student_data_check_list_item_1",
     "date": "#student_data_check_list_date_from_1",
     "libelle": "EEF file validated by Feel Français",
     "coche": true,
     "le": "09/09/2026",
     "motif": "Les pièces Études en France (diplôme) ont été validées par Perle le 09/09."
    }
   ],
   "sections": [
    {
     "alias": "cover-letter",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "3e version : les deux remarques de Perle sont corrigées.",
     "tentatives": {
      "numero": 3,
      "seuil": 3,
      "texte": "3e dépôt pour cette pièce. Au-delà, la règle prévoit un échange direct avec l'étudiante (seuil à confirmer par Perle)."
     },
     "regles": [
      {
       "id": "LM-01",
       "texte": "2 500 caractères maximum.",
       "source": "Formation IA — Lettre v6"
      },
      {
       "id": "LM-04",
       "texte": "Ne pas évoquer un projet de travail en France après les études.",
       "source": "Spécificités pays — Sénégal v3"
      }
     ],
     "versions": [
      {
       "fichier": "lettre-de-motivation-v1",
       "depose": "15/09/2026 11:02",
       "statut": "invalide",
       "commentairePerle": "Please shorten the letter, it should be 2500 characters max",
       "resolu": true,
       "preuve": "2 643 caractères en v1 → 1 033 en v3.",
       "nom": "FF__1284_91_mariam-diallo__lettre-de-motivation-v1_15_09_2026.pdf"
      },
      {
       "fichier": "lettre-de-motivation-v2",
       "depose": "19/09/2026 16:40",
       "statut": "invalide",
       "commentairePerle": "avoid saying that you wish to work in France after your studies",
       "resolu": true,
       "preuve": "La phrase « je souhaite travailler en France… » est remplacée par le projet de retour à Dakar.",
       "nom": "FF__1321_91_mariam-diallo__lettre-de-motivation-v2_19_09_2026.pdf"
      }
     ],
     "reponseEtudiant": {
      "texte": "J'ai raccourci la lettre et retiré la phrase sur le travail en France.",
      "le": "24/09/2026 09:12",
      "priseEnCompte": "Les deux corrections annoncées sont vérifiées."
     },
     "comparaison": {
      "avant": "lettre-de-motivation-v2",
      "apres": "lettre-de-motivation-v3",
      "changements": [
       {
        "zone": "phrase-travail",
        "zoneApres": "phrase-retour",
        "avant": "Après mes études, je souhaite travailler en France quelques années…",
        "apres": "À l'issue du mastère, je rentrerai à Dakar pour rejoindre l'équipe sécurité de Sahel Télécom…",
        "rectAvant": [
         0.0605,
         0.3203,
         0.879,
         0.0388
        ],
        "rectApres": [
         0.0605,
         0.3203,
         0.879,
         0.0388
        ]
       }
      ],
      "nomAvant": "FF__1321_91_mariam-diallo__lettre-de-motivation-v2_19_09_2026.pdf",
      "nomApres": "FF__1358_91_mariam-diallo__lettre-de-motivation-v3_24_09_2026.pdf"
     },
     "documents": [
      {
       "fichier": "lettre-de-motivation-v3",
       "sousType": "Lettre de motivation",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "1 033 caractères : sous la limite de 2 500.",
         "zone": "lettre",
         "probleme": false,
         "rect": [
          0.0571,
          0.1982,
          0.8858,
          0.2366
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Projet de retour à Dakar, employeur nommé.",
         "zone": "phrase-retour",
         "probleme": false,
         "rect": [
          0.0605,
          0.3203,
          0.879,
          0.0388
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": "Remarques des 15/09 et 19/09 résolues."
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__1358_91_mariam-diallo__lettre-de-motivation-v3_24_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1358_91_mariam-diallo__lettre-de-motivation-v3_24_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1358_91_mariam-diallo__lettre-de-motivation-v3_24_09_2026.etudiant.pdf"
       }
      }
     ],
     "commentaireSection": {
      "etudiant": "",
      "interne": ""
     }
    },
    {
     "alias": "proof-ressource",
     "statut": "a-corriger",
     "confiance": "élevée",
     "resume": "Option sponsor : 1 relevé du garant sur 3 ; lettre du garant absente.",
     "regles": [
      {
       "id": "RES-03",
       "texte": "Les 3 derniers relevés mensuels du compte, sans mois manquant.",
       "source": "Formation IA — Ressources v12"
      },
      {
       "id": "SPO-01",
       "texte": "Lettre de prise en charge datée et signée + pièce d'identité du garant.",
       "source": "Formation IA — Ressources v12"
      }
     ],
     "ressources": {
      "option": "Sponsor",
      "comptes": [
       {
        "compte": "SN 118 01201 8872004 15",
        "banque": "Banque de la Presqu'île",
        "titulaire": "Ousmane Diallo (garant)",
        "devise": "XOF",
        "mois": [
         {
          "mois": "Juin 2026",
          "fichiers": [],
          "etat": "manquant",
          "noms": []
         },
         {
          "mois": "Juillet 2026",
          "fichiers": [],
          "etat": "manquant",
          "noms": []
         },
         {
          "mois": "Août 2026",
          "fichiers": [
           "proof-ressource"
          ],
          "etat": "ok",
          "cloture": "6 420 000 XOF",
          "noms": [
           "FF__1432_91_mariam-diallo__proof-ressource_23_09_2026.pdf"
          ]
         }
        ]
       }
      ],
      "dernierSolde": {
       "valeur": "6 420 000 XOF",
       "euros": "9 787,23 €",
       "date": "31/08/2026",
       "fichier": "proof-ressource",
       "zone": "cloture",
       "nom": "FF__1432_91_mariam-diallo__proof-ressource_23_09_2026.pdf"
      },
      "besoin": "615 € × 12 mois = 7 380,00 €",
      "conclusion": "Le solde suffirait, mais il manque 2 relevés et la lettre du garant."
     },
     "documents": [
      {
       "fichier": "proof-ressource",
       "sousType": "Relevé mensuel du garant — août 2026",
       "verdict": "valide",
       "constats": [
        {
         "type": "fait",
         "texte": "Titulaire : Ousmane Diallo, et non l'étudiante : c'est un garant.",
         "zone": "titulaire",
         "probleme": false,
         "rect": [
          0.2805,
          0.1323,
          0.137,
          0.0184
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Solde 6 420 000 XOF = 9 787,23 € au 31/08/2026.",
         "zone": "cloture",
         "probleme": false,
         "rect": [
          0.7947,
          0.4121,
          0.1297,
          0.0192
         ],
         "page": 1
        },
        {
         "type": "fait",
         "texte": "Un seul mois (août) : juin et juillet manquent.",
         "zone": "periode",
         "etudiant": "Il manque les relevés de juin et juillet de votre père.",
         "gravite": "haute",
         "probleme": true,
         "rect": [
          0.2805,
          0.2036,
          0.2324,
          0.0184
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": [],
        "remarque": "Les relevés de juin et juillet manquants sont comptés pour la section."
       },
       "nom": "FF__1432_91_mariam-diallo__proof-ressource_23_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1432_91_mariam-diallo__proof-ressource_23_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1432_91_mariam-diallo__proof-ressource_23_09_2026.etudiant.pdf"
       }
      }
     ],
     "piecesLiees": [
      {
       "section": "Proof of resource, if sponsor: sponsoring letter + ID",
       "etat": "absente",
       "texte": "Garant identifié sur le relevé, mais aucune lettre de prise en charge ni pièce d'identité n'a été déposée."
      }
     ],
     "commentaireSection": {
      "etudiant": "Merci de téléverser les 3 derniers relevés bancaires de votre père (juin, juillet, août), ainsi que sa lettre de prise en charge signée et une copie de sa pièce d'identité.",
      "interne": "Garant : Ousmane Diallo. 1/3 relevé, lettre absente."
     }
    },
    {
     "alias": "resume",
     "statut": "conforme",
     "confiance": "élevée",
     "resume": "Parcours continu ; cohérent avec le diplôme et la lettre.",
     "documents": [
      {
       "fichier": "resume",
       "sousType": "CV",
       "verdict": "valide",
       "constats": [
        {
         "type": "conforme",
         "texte": "Licence 2021–2024, identique au diplôme (juillet 2024).",
         "zone": "formation-dates",
         "probleme": false,
         "rect": [
          0.0622,
          0.1792,
          0.0988,
          0.0177
         ],
         "page": 1
        },
        {
         "type": "conforme",
         "texte": "Expérience chez Sahel Télécom, citée dans la lettre.",
         "zone": "experience",
         "probleme": false,
         "rect": [
          0.2637,
          0.2536,
          0.3746,
          0.0177
         ],
         "page": 1
        }
       ],
       "commentaire": {
        "etudiant": "",
        "interne": ""
       },
       "note": {
        "valeur": 20,
        "seuil": 17,
        "pertes": []
       },
       "nom": "FF__1395_91_mariam-diallo__resume_24_09_2026.pdf",
       "annote": {
        "admin": "annotes/FF__1395_91_mariam-diallo__resume_24_09_2026.admin.pdf",
        "etudiant": "annotes/FF__1395_91_mariam-diallo__resume_24_09_2026.etudiant.pdf"
       }
      }
     ],
     "croisements": [
      {
       "titre": "CV ↔ diplôme",
       "a": {
        "fichier": "resume",
        "zone": "formation-dates",
        "valeur": "2021 – 2024",
        "nom": "FF__1395_91_mariam-diallo__resume_24_09_2026.pdf",
        "rect": [
         0.0622,
         0.1792,
         0.0988,
         0.0177
        ]
       },
       "b": {
        "fichier": "eef-diploma",
        "zone": "session",
        "valeur": "Juillet 2024",
        "nom": "FF__1210_91_mariam-diallo__eef-diploma_09_09_2026.pdf",
        "rect": [
         0.3981,
         0.351,
         0.1188,
         0.0214
        ]
       },
       "resultat": "coherent"
      }
     ]
    },
    {
     "alias": "passport",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "05/09/2026"
     }
    },
    {
     "alias": "enrollment-letter",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "05/09/2026"
     }
    },
    {
     "alias": "eef-diploma",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "09/09/2026"
     }
    },
    {
     "alias": "id-photos",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "09/09/2026"
     }
    },
    {
     "alias": "proof-accommodation-france",
     "statut": "humain",
     "humain": {
      "etat": "valid",
      "par": "Perle",
      "le": "18/09/2026"
     }
    }
   ],
   "campusFrance": {
    "disponible": true,
    "langue": "fr",
    "raison": "Zone Sénégal avec entretien Campus France ; pièces Études en France validées.",
    "questions": [
     {
      "q": "Présentez-vous et décrivez votre parcours.",
      "r": "Je m'appelle Mariam Diallo, j'ai 25 ans. J'ai obtenu une licence en informatique, spécialité réseaux et sécurité, en 2024, puis j'ai travaillé deux ans comme technicienne réseaux chez Sahel Télécom.",
      "sources": [
       "CV",
       "Diplôme"
      ]
     },
     {
      "q": "Pourquoi ce mastère en cybersécurité ?",
      "r": "Dans mon travail, je vois les PME sénégalaises exposées au hameçonnage et aux rançongiciels. Ce mastère m'apportera l'analyse de risques et la réponse à incident, que je ne trouve pas à ce niveau au Sénégal.",
      "sources": [
       "Lettre de motivation v3"
      ]
     },
     {
      "q": "Pourquoi l'Institut Delta d'Ingénierie ?",
      "r": "Parce que le mastère associe cours théoriques, laboratoire de simulation d'attaques et stage de six mois en entreprise.",
      "sources": [
       "Lettre de motivation v1 (passage conservé)"
      ]
     },
     {
      "q": "Quel est votre projet après vos études ?",
      "r": "Rentrer à Dakar et rejoindre l'équipe sécurité de Sahel Télécom, qui soutient mon projet, pour accompagner les PME clientes.",
      "sources": [
       "Lettre de motivation v3"
      ]
     },
     {
      "q": "Comment allez-vous financer vos études et votre séjour ?",
      "r": "Mon père, Ousmane Diallo, prend en charge mes frais de séjour ; il dispose d'un solde de plus de 6 millions de francs CFA.",
      "sources": [
       "Relevé du garant"
      ],
      "alerte": "Réponse provisoire : la lettre du garant n'est pas encore déposée."
     },
     {
      "q": "Où allez-vous loger ?",
      "r": "Chez M. Ibrahima Sow, à Ivry-sur-Seine, du 8 octobre 2026 au 31 mars 2027.",
      "sources": [
       "Attestation d'hébergement (validée)"
      ]
     },
     {
      "q": "Quand commencent vos cours et combien de temps dure la formation ?",
      "r": "Les cours commencent le 12 octobre 2026 ; la formation se termine le 30 septembre 2028.",
      "sources": [
       "Lettre d'inscription (validée)"
      ]
     }
    ]
   },
   "code": "C",
   "bareme": {
    "seuil": 17,
    "zone": "Sénégal",
    "source": "Afrique : 8,5/10 (réunion du 30/06) — à confirmer par Perle"
   }
  }
 }
};
