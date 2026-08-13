# Frontend — Gestion de Stock Tunisie Telecom

Interface React de l'application de gestion de stock centralisée de Tunisie Telecom.

## Stack

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **react-router-dom** — routage côté client
- **Recharts** — graphiques du tableau de bord
- **lucide-react** — icônes
- **react-hot-toast** — notifications visuelles
- **xlsx** — export Excel
- **jsPDF / jspdf-autotable** — export PDF

## Prérequis

- Node.js 18+
- Le backend Spring Boot doit tourner sur `http://localhost:8081`

## Installation et démarrage

```bash
npm install
npm run dev
```

Le frontend démarre sur `http://localhost:5173`.  
Les appels `/api/*` sont proxifiés vers `http://localhost:8081` (voir `vite.config.js`).

## Structure de `src/`

```
src/
├── api/             Instance Axios configurée (baseURL, intercepteur JWT)
├── auth/            Contexte d'authentification, hook useAuth, ProtectedRoute
├── components/      Composants réutilisables
│   └── ui/          Composants d'interface génériques (PageHeader, StatusBadge, …)
├── hooks/           Hooks réutilisables (useTableControls : recherche/tri/pagination)
├── pages/           Une page par module (une par entrée de la barre latérale)
├── theme/           Contexte de thème clair/sombre
└── utils/
    ├── format.js    Fonctions de formatage partagées (formatNumber, formatDateTime, …)
    └── exportPdf.js Export PDF générique basé sur jsPDF
```

## Conventions

### Formatage des nombres et des dates
Toujours utiliser les fonctions de `utils/format.js` plutôt que des appels directs à `toLocaleString` ou `Intl` :

| Fonction | Usage |
|---|---|
| `formatNumber(value)` | Quantités, prix (séparateur de milliers français) |
| `formatDateTime(value)` | Date + heure au format `jj/mm/aaaa hh:mm` |
| `formatDate(value)` | Date seule `jj/mm/aaaa` |
| `formatDateLong(value)` | Date narrative (ex: `12 juillet 2026, 14:30`) |
| `getMostRecentUpdate(items)` | Date de dernière MAJ d'une liste d'entités |

### Dernière mise à jour
Chaque page liste passe `lastUpdatedItems={data}` au composant `PageHeader` — le badge "Dernière mise à jour" est alors affiché automatiquement.

### Rôles
- `ADMIN` : accès complet, voit tous les modules.
- `RESPONSABLE_REGION` : accès restreint à sa propre région ; les routes `adminOnly` sont masquées dans la sidebar et protégées côté backend.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Démarrage en mode développement (HMR) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build de production |
| `npm run lint` | Vérification ESLint |
