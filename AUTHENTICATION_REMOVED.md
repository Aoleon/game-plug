# 🔐 Authentification Replit Retirée

## Modifications Apportées

L'authentification Replit OAuth a été complètement retirée de l'application. Le système utilise maintenant **uniquement l'authentification locale** pour les Game Masters (GMs).

### Fichiers Modifiés

1. **Nouveau fichier d'authentification** : `server/auth.ts`
   - Remplace `server/replitAuth.ts`
   - Gère uniquement les sessions locales
   - Plus de dépendances sur `openid-client` ou `passport`

2. **Routes mises à jour** : `server/routes.ts`
   - Import changé de `./replitAuth` à `./auth`
   - Route `/api/auth/logout` ajoutée
   - Fonction `getUserId()` simplifiée (retire `req.user.claims`)
   - Route `/api/auth/user` simplifiée

3. **Variables d'environnement** : `.env` et `.env.example`
   - Variables `REPLIT_DOMAINS` et `REPL_ID` retirées
   - Commentaire ajouté expliquant le changement

### Système d'Authentification Actuel

#### Pour les Game Masters (GMs)
- **Inscription** : `POST /api/auth/signup`
  - Email + mot de passe
  - Compte stocké dans la base de données PostgreSQL
  - Mot de passe hashé avec bcrypt

- **Connexion** : `POST /api/auth/login`
  - Email + mot de passe
  - Session créée dans PostgreSQL (table `sessions`)
  - Cookie de session sécurisé

- **Déconnexion** : `POST /api/auth/logout`
  - Destruction de la session
  - Suppression du cookie

#### Pour les Joueurs
- **Aucune authentification requise**
- Accès via code de session (6 caractères)
- Création de personnage sans compte utilisateur

### Middleware d'Authentification

Le middleware `isAuthenticated` vérifie maintenant uniquement :
```typescript
const localUser = (req.session as any)?.user;
if (localUser && localUser.authType === 'local') {
  // Authentifié ✓
}
```

Plus de vérification de token OAuth, refresh token, ou expiration OIDC.

### Routes Protégées

Les routes suivantes nécessitent une authentification GM :
- `GET /api/auth/user` - Récupérer les infos utilisateur
- `POST /api/sessions` - Créer une session de jeu
- `GET /api/sessions` - Lister les sessions
- `PATCH /api/sessions/:id` - Modifier une session
- `DELETE /api/sessions/:id` - Supprimer une session
- `POST /api/sessions/:sessionId/chapters` - Créer un chapitre
- `PATCH /api/chapters/:id` - Modifier un chapitre
- `DELETE /api/chapters/:id` - Supprimer un chapitre
- Toutes les routes de gestion des personnages, inventaire, etc.

### Routes Publiques

Ces routes ne nécessitent PAS d'authentification :
- `GET /api/health` - Health check
- `POST /api/auth/signup` - Inscription GM
- `POST /api/auth/login` - Connexion GM
- `POST /api/auth/logout` - Déconnexion
- `GET /api/sessions/join/:code` - Rejoindre une session avec code
- Création et consultation de personnages (pour les joueurs)

### Dépendances Retirées

Les packages suivants ne sont plus utilisés pour l'authentification :
- `openid-client` - OAuth OIDC (toujours dans package.json mais non utilisé)
- `passport` - Framework d'authentification (toujours dans package.json mais non utilisé)
- `passport-local` - Stratégie locale Passport (toujours dans package.json mais non utilisé)

**Note** : Ces packages restent dans `package.json` pour éviter de casser d'éventuelles importations existantes, mais ne sont plus utilisés dans le code.

### Configuration Simplifiée

#### Variables d'environnement requises

```bash
# Base de données
DATABASE_URL=postgresql://...

# Session
SESSION_SECRET=your-secret-here

# Application
PORT=5002
NODE_ENV=production

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...
```

Plus besoin de :
- ~~REPLIT_DOMAINS~~
- ~~REPL_ID~~
- ~~ISSUER_URL~~

### Déploiement

#### Build et déploiement Docker

```bash
# Build
npm run build

# Rebuild Docker
docker compose down
docker compose build --no-cache app
docker compose up -d

# Vérifier
docker ps --filter "name=role-plug"
curl https://work.robinswood.io/game-plug/api/health
```

### Tests de Fonctionnement

#### Test de l'API
```bash
# Health check
curl https://work.robinswood.io/game-plug/api/health

# Inscription GM (remplacer avec vos vraies données)
curl -X POST https://work.robinswood.io/game-plug/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"gm@example.com","password":"secure123","firstName":"John","lastName":"Doe"}'

# Connexion
curl -X POST https://work.robinswood.io/game-plug/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gm@example.com","password":"secure123"}' \
  -c cookies.txt

# Récupérer l'utilisateur (avec cookie)
curl https://work.robinswood.io/game-plug/api/auth/user \
  -b cookies.txt
```

### Migration depuis Replit Auth

Si vous aviez des comptes Replit existants :
1. Les comptes Replit **ne fonctionnent plus**
2. Les GMs doivent **créer un nouveau compte local** via l'interface
3. Les sessions de jeu existantes restent valides (liées au GM par `gmId`)

**Note** : Les `gmId` des sessions existantes correspondent aux anciens IDs Replit. Ces sessions devront être réassignées manuellement si nécessaire.

### Sécurité

#### Points d'attention

✅ **Améliorations** :
- Plus de dépendance externe (OAuth provider)
- Contrôle total sur l'authentification
- Pas de redirection OAuth hors du domaine

⚠️ **Considérations** :
- Mot de passe stocké hashé (bcrypt)
- HTTPS requis en production
- Rate limiting recommandé sur `/api/auth/login`

#### Recommandations

1. **HTTPS obligatoire** en production (déjà configuré via Nginx)
2. **SESSION_SECRET** doit être une valeur aléatoire forte
3. **Politique de mot de passe** : minimum 6 caractères (configurable dans `gmSignupSchema`)

### Rollback (si nécessaire)

Pour revenir à l'authentification Replit :

```bash
# Restaurer les fichiers
git checkout HEAD~1 server/replitAuth.ts server/routes.ts .env .env.example

# Rebuild
npm run build
docker compose down
docker compose build --no-cache app
docker compose up -d
```

---

**Date de modification** : 2025-12-04
**Version** : Rôle Plug v1.1 (Post-Replit)
