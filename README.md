# Gestion de Stock — Tunisie Telecom

Application web de gestion de stock centralisée pour Tunisie Telecom :
suivi du matériel (téléphones, modems, câbles, équipements réseau) entre
un entrepôt central et les 24 régions, avec traçabilité complète et aide
à la décision.

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Cycle métier](#cycle-métier)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Flux d'authentification (OTP)](#flux-dauthentification-otp)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Rôles et accès](#rôles-et-accès)
- [Modules principaux](#modules-principaux)
- [Gestion des régions](#gestion-des-régions)
- [Limitations connues](#limitations-connues)

## Aperçu

Le stock est réparti entre un **Stock Central** (entrepôt national) et un
**stock régional** propre à chacune des 24 régions. Chaque action sur le
stock (création, modification) est tracée : utilisateur, date, quantité.
La plateforme fournit également des outils d'aide à la décision basés sur
des règles simples (pas de machine learning) : alertes de rupture,
détection d'anomalies de consommation, suggestions de transfert entre
régions.

## Stack technique

**Backend**
- Java, Spring Boot
- Spring Data JPA (Hibernate) + PostgreSQL
- Spring Security + JWT pour l'authentification
- Authentification à deux facteurs (OTP par e-mail, via Spring Mail)
- Lombok
- Bean Validation (`@Valid`, `@NotNull`, etc.)

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- react-router-dom
- Recharts (graphiques du tableau de bord)
- lucide-react (icônes)
- react-hot-toast (notifications visuelles)
- xlsx (export Excel), export PDF

## Cycle métier

Le cœur fonctionnel de l'application suit ce cycle :

```
Fournisseur → Commande → Stock Central → Demande (région) → Stock régional
   → Mouvement / Consommation → Retour (bon état ou défectueux)
   → Maintenance → Réparé / Réformé / Retour fournisseur
```

Points clés de ce cycle :
- Une **Demande** ne peut jamais être approuvée au-delà du stock central
  réellement disponible au moment du traitement (approbation partielle
  possible).
- Un **Retour défectueux** ne peut porter que sur du matériel déjà
  signalé comme défectueux dans la région d'origine (via "Signaler
  défectueux" dans la page Stock) — sans quoi le retour serait
  approuvé avec une quantité traitée de zéro.
- Un dossier de **Maintenance** est créé dès qu'une région signale du
  matériel défectueux, puis un second dossier (niveau central) est créé
  quand ce matériel arrive physiquement au Stock Central via un retour
  approuvé.

## Structure du projet

```
Gestion-Stock-TT/
├── backend/gestion-stock-backend/
│   └── src/main/java/com/tunisietelecom/gestionstock/
│       ├── controller/     API REST (un contrôleur par ressource)
│       ├── service/        Interfaces de service
│       ├── service/impl/   Logique métier
│       ├── repository/     Accès aux données (Spring Data JPA)
│       ├── entity/         Entités JPA
│       ├── dto/request/    Objets de requête (entrée API)
│       ├── dto/response/   Objets de réponse (sortie API)
│       ├── config/         Sécurité, JWT, audit JPA, CORS,
│       │                   initialisation des données (DataInitializer)
│       └── exception/      Gestion centralisée des erreurs
├── frontend/src/
│   ├── pages/           Une page par module (Stock, Demandes, ...)
│   ├── components/      Composants réutilisables (tableaux, badges, ...)
│   ├── components/ui/   Composants d'interface génériques (PageHeader, ...)
│   ├── hooks/            Hooks réutilisables (ex: useTableControls)
│   ├── auth/             Contexte d'authentification, route protégée
│   └── utils/            Fonctions utilitaires (formatage, export)
└── database/
    └── seed.sql          Jeu de données de démonstration (comptes région)
```

## Installation

### Prérequis
- Java 21+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend/gestion-stock-backend

# Copier le fichier d'exemple et renseigner vos propres valeurs
cp src/main/resources/application.properties.example src/main/resources/application.properties
# puis éditer application.properties :
#   spring.datasource.url / username / password
#   jwt.secret (chaîne aléatoire d'au moins 32 caractères)
#   spring.mail.* (pour l'envoi des codes OTP)

mvn spring-boot:run
```
Le backend démarre sur `http://localhost:8081`.

> `application.properties` est volontairement absent du dépôt (voir
> `.gitignore`) car il contient des identifiants réels. Seul
> `application.properties.example`, avec des valeurs de substitution,
> est versionné.

Au tout premier démarrage sur une base vide, `DataInitializer`
initialise automatiquement les 24 régions, l'entrepôt Stock Central
(`region.central = true`), et un compte administrateur par défaut
(identifiants configurables via `app.admin.*`, voir plus bas). Cette
étape est idempotente : elle ne s'exécute que si les tables sont vides,
donc elle reste sans effet sur les démarrages suivants.

### Base de données (jeu de données de démonstration)

`DataInitializer` couvre le strict minimum pour démarrer (régions,
Stock Central, admin). Pour disposer en plus des comptes
`RESPONSABLE_REGION` de démonstration et d'un jeu de données plus
complet, chargez ensuite :

```bash
psql -U postgres -d gestion_stock_tt -f database/seed.sql
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```
Le frontend démarre sur `http://localhost:5173` et proxifie les appels
`/api` vers le backend (voir `vite.config.js`).

## Variables d'environnement

Toutes les valeurs sensibles sont dans
`backend/gestion-stock-backend/src/main/resources/application.properties`
(non versionné — voir `.gitignore`). Le fichier
`application.properties.example`, versionné, documente la structure
attendue avec des valeurs de substitution.

| Propriété | Description | Exemple |
|---|---|---|
| `spring.datasource.url` | URL JDBC PostgreSQL | `jdbc:postgresql://localhost:5432/gestion_stock_tt` |
| `spring.datasource.username` | Utilisateur PostgreSQL | `postgres` |
| `spring.datasource.password` | Mot de passe PostgreSQL | `••••` |
| `jwt.secret` | Clé secrète HMAC-SHA256 (≥ 32 caractères) | `change-this-to-a-long-random-string` |
| `jwt.expiration` | Durée de validité du JWT en ms | `86400000` (24 h) |
| `spring.mail.host` | Serveur SMTP pour l'envoi des OTP | `smtp.gmail.com` |
| `spring.mail.port` | Port SMTP | `587` |
| `spring.mail.username` | Adresse e-mail expéditrice | `votre@gmail.com` |
| `spring.mail.password` | Mot de passe applicatif Gmail (App Password) | `••••` |
| `otp.expiration-minutes` | Durée de validité du code OTP | `5` |
| `app.admin.username` | Identifiant du compte admin créé par `DataInitializer` | `admin` |
| `app.admin.password` | Mot de passe du compte admin créé par `DataInitializer` | `••••` |
| `app.admin.email` | E-mail du compte admin (réception des OTP) | `admin@example.com` |

> Pour Gmail, activez la validation en deux étapes puis générez un
> **App Password** dédié — ne mettez pas votre mot de passe principal.
> Si un App Password a été exposé par erreur (ex: commit accidentel),
> révoquez-le immédiatement depuis
> [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
> et générez-en un nouveau.

## Flux d'authentification (OTP)

L'authentification se déroule en deux étapes :

1. **Étape 1 — Identifiants** : `POST /api/auth/login` avec
   `{ username, password }`. Si les identifiants sont corrects, un code
   OTP à 6 chiffres est envoyé à l'adresse e-mail du compte.
2. **Étape 2 — Vérification OTP** : `POST /api/auth/verify-otp` avec
   `{ username, otp }`. Si le code est valide et non expiré (5 min),
   un jeton JWT est délivré.
3. **Utilisation du JWT** : toutes les requêtes protégées doivent inclure
   l'en-tête `Authorization: Bearer <token>`. Le token expire après 24 h.

> En développement, tous les comptes du seed pointent vers la même adresse
> e-mail (celle configurée dans `spring.mail.username`). Changez
> `email` dans `seed.sql` ou via la page Utilisateurs pour tester
> avec plusieurs boîtes mail.

## Comptes de démonstration

Le compte administrateur par défaut (`app.admin.*`) est créé
automatiquement par `DataInitializer` au premier démarrage. Après avoir
chargé `database/seed.sql`, les comptes suivants sont également
disponibles. **Mot de passe commun : `Admin@123`**

| Identifiant | Rôle | Région |
|---|---|---|
| `admin` | ADMIN | — (accès global) |
| `resp_tunis` | RESPONSABLE_REGION | Tunis |
| `resp_sfax` | RESPONSABLE_REGION | Sfax |
| `resp_sousse` | RESPONSABLE_REGION | Sousse |
| `resp_bizerte` | RESPONSABLE_REGION | Bizerte |

> Le code OTP est envoyé à l'adresse e-mail configurée dans
> `spring.mail.username` (tous les comptes seed partagent la même boîte
> en développement).

## Rôles et accès

| Rôle | Portée |
|---|---|
| **ADMIN** | Accès complet : toutes les régions, gestion des utilisateurs, approbation des demandes/retours, résolution des dossiers de maintenance, rapports globaux. |
| **RESPONSABLE_REGION** | Accès restreint à sa propre région : consultation du stock régional, soumission de demandes et de retours, signalement de matériel défectueux. |

L'authentification se fait en deux étapes : identifiants classiques, puis
un code OTP envoyé par e-mail, avant la délivrance du jeton JWT.

## Modules principaux

- **Tableau de bord** — KPIs, alertes de rupture, anomalies de
  consommation, tendance des mouvements, top produits transférés.
- **Produits / Catégories** — catalogue du matériel.
- **Stock / Stock Central** — quantités disponibles par région et au
  niveau central, avec compteur distinct pour le matériel défectueux.
- **Commandes** — commandes fournisseurs alimentant le Stock Central.
- **Demandes** — demandes de réapprovisionnement des régions.
- **Mouvements** — journal des entrées/sorties/transferts.
- **Retours** — restitution de matériel (bon état ou défectueux) vers
  le Stock Central.
- **Maintenance** — suivi des équipements défectueux jusqu'à leur
  résolution.
- **Ajustements** — corrections manuelles de stock, motif obligatoire.
- **Historique produit** — chronologie complète d'un produit donné.
- **Rapports** — exports Excel/PDF (mouvements, valeur du stock,
  maintenance, retours...).
- **Notifications**, **Profil utilisateur**, **Gestion des utilisateurs**.

## Gestion des régions

Les 24 régions de Tunisie Telecom ainsi que le Stock Central sont
initialisés automatiquement par `DataInitializer` au premier démarrage
(sur base vide), et **ne sont pas gérables depuis l'interface
utilisateur** (pas de page dédiée). L'API backend `/api/regions` reste
disponible (lecture seule pour tous les rôles, CRUD pour les admins)
car elle alimente les listes déroulantes de sélection de région dans
les formulaires (Demandes, Retours, Mouvements, Utilisateurs).

Pour ajouter ou modifier une région après l'initialisation, utilisez
directement la base de données ou appelez l'API avec un client HTTP
(Postman, curl) en tant qu'admin.

- `spring.jpa.hibernate.ddl-auto=update` : convient au développement,
  mais une vraie stratégie de migration (Flyway/Liquibase) serait
  nécessaire avant un déploiement en production.
