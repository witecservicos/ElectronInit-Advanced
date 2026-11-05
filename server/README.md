# WIWITRACK ESCOLA & CRECHE — Backend (serveur)

API REST **Express 5 + Sequelize (MySQL 8)**, architecture **Local-First**, en **ESM** (`"type": "module"`). Pensée pour tourner sur le poste serveur de l'école et être jointe par les postes clients via un **nom de domaine mDNS** (pas d'IP à retenir).

## Arborescence

```
server/
├── config/
│   ├── env.js          # Lecture .env + objet config validé
│   ├── database.js     # Sequelize LOCAL + instance DISTANTE (template)
│   └── discovery.js    # Publication/decouverte mDNS (bonjour-service)
├── database/
│   ├── models.js       # 45 modèles + 93 associations (consolidés)
│   └── seed.js         # Amorçage : permissions, rôle ADMIN, super-user
├── middleware/
│   ├── auth.js         # JWT (authenticate + signToken)
│   ├── rbac.js         # requirePermission / requireRole
│   ├── security.js     # helmet, CORS, rate-limit
│   └── error.js        # 404 + gestionnaire d'erreurs (Sequelize -> HTTP)
├── controllers/
│   ├── auth.controller.js      # login / me / change-password
│   ├── students.controller.js  # élèves + âge calculé
│   ├── billing.controller.js   # factures, feuilles de composition, paiements
│   ├── sync.controller.js      # pilotage synchro
│   └── crud.factory.js         # CRUD générique réutilisable
├── routes/
│   ├── index.js        # agrégateur /api
│   ├── auth / students / billing / sync / bulletin
│   └── resources.routes.js     # CRUD auto pour 33 ressources simples
├── services/
│   ├── sync.service.js     # synchro Local <-> Cloud (TEMPLATE non relié)
│   └── bulletin.service.js # données bulletin MINED (gabarit à finaliser)
├── app.js              # assemblage Express
├── index.js            # point d'entrée (boot + mDNS + cron)
└── .env.example
```

## Démarrage

```bash
npm install
cp server/.env.example server/.env   # puis renseigner DB_*
npm run seed          # 1re fois : crée permissions + admin
npm run server:dev    # démarre l'API (nodemon)
```

Connexion par défaut (à changer) : `admin@wiwitrack.com` / `admin`

## Nom de domaine au lieu de l'IP

Le serveur publie un service mDNS `wiwitrack-escola`. Les clients joignent :

```
http://wiwitrack-escola.local:4000
```

Côté client, `findServer()` (dans `config/discovery.js`) retrouve le serveur sur le LAN automatiquement.

## Feuilles de composition (règle métier)

**1 feuille par matière.** Pour un élève inscrit dans une filière à *N* matières, avec un tarif unitaire *F* (type de frais `EXAM_SHEET`), la facture vaut **N × F**.

Exemple : 14 matières × 100 AOA = **1400 AOA**.

```
POST /api/billing/invoices/composition
{ "enrollmentId": "...", "referenceLabel": "Compo T1" }
```

Réponse : facture créée + détail `{ subjects, unitFee, total, formula }`.

## Synchronisation cloud (template)

`services/sync.service.js` est un **squelette non relié**. La connexion distante reste coupée tant que `.env` ne contient pas :

```
REMOTE_SYNC_ENABLED=true
REMOTE_DB_HOST=...
REMOTE_DB_NAME=...
REMOTE_DB_USER=...
REMOTE_DB_PASS=...
```

Les écritures locales se déposent dans `sync_outbox` ; un job `node-cron` les pousse vers le cloud (stratégie *last-write-wins* sur `client_timestamp`, à affiner). Vous branchez vos **vrais accès** manuellement, sans toucher au code.

## Bulletins MINED

Le gabarit officiel du bulletin est réalisé **manuellement** (décision client). `services/bulletin.service.js` ne fournit que les **données agrégées** (élève, section, matières + coefficients) ; les emplacements de notes/moyenne/mention sont marqués `TODO`.

## Points appliqués suite à vos décisions

- **Date de naissance** stockée ; l'âge est **calculé à la volée**.
- **Chauffeurs = personnel** : `bus_routes.driver_id` référence désormais `staff_members`.
- **Feuilles de composition** : facturation N matières × tarif unitaire.
- **Bulletin MINED** : laissé en gabarit/TODO.
- **mDNS** : nom de domaine au lieu de l'IP.
- **Synchro cloud** : template MySQL non relié.
