# Rôle Plug - Call of Cthulhu Digital RPG Platform

> Une plateforme numérique complète pour jouer à Call of Cthulhu 7ème Édition avec des outils avancés pour maîtres de jeu et joueurs.

## 📖 Description du Projet

Rôle Plug est une application web moderne dédiée au jeu de rôle Call of Cthulhu. Elle propose une interface thématique lovecraftienne permettant aux joueurs de créer et gérer leurs investigateurs, et aux maîtres de jeu de diriger des sessions avec des outils temps réel avancés.

### ✨ Fonctionnalités Principales

- **Création de Personnages** : Système complet basé sur les règles CoC 7e avec génération automatique des caractéristiques
- **Gestion de Sessions** : Interface GM avec tableau de bord temps réel et outils narratifs
- **GameBoard de Projection** : Système de projection visuel avec génération d'images IA pour l'immersion
- **Système de Dés Avancé** : Moteur de jets de dés avec sons et animations
- **Suivi de Sanité Mentale** : Gestion complète des phobies, manies et conditions psychologiques
- **Avatars Générés par IA** : Portraits automatiques style années 1920 via DALL-E 3
- **Temps Réel** : Synchronisation WebSocket entre GM et joueurs
- **Gestion d'Inventaire** : Système complet d'objets et d'argent

## 🏗️ Architecture Technique

### Frontend
- **Framework** : React 18 avec TypeScript
- **Build Tool** : Vite pour le développement et la compilation
- **Routing** : Wouter pour la navigation client
- **State Management** : TanStack Query pour la gestion d'état serveur
- **UI Framework** : Radix UI + shadcn/ui avec Tailwind CSS
- **Animations** : Framer Motion
- **Forms** : React Hook Form avec validation Zod

### Backend
- **Server** : Express.js avec TypeScript
- **Base de Données** : PostgreSQL avec Drizzle ORM
- **Authentification** : Système basé sur sessions avec express-session
- **Temps Réel** : WebSocket Server pour la synchronisation live
- **IA** : Intégration OpenAI (DALL-E 3 + GPT-5) pour génération de contenu

### DevOps & Outils
- **Package Manager** : npm
- **Linting** : TypeScript strict mode
- **Styling** : Tailwind CSS avec thème Lovecraft personnalisé
- **Database** : Drizzle Kit pour les migrations

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Base de données PostgreSQL
- Compte OpenAI (pour génération d'avatars)

### Installation

```bash
# Cloner le repository
git clone <votre-repository-url>
cd role-plug

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
```

### Variables d'Environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# OpenAI
OPENAI_API_KEY="sk-..."

# Session Secret
SESSION_SECRET="your-secret-key-here"

# App Configuration
PORT=5000
NODE_ENV=development
```

### Configuration de la Base de Données

```bash
# Pousser le schéma vers la base de données
npm run db:push
```

## 🎮 Utilisation

### Développement

```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

### Production

```bash
# Compiler l'application
npm run build

# Démarrer en production
npm start
```

### Scripts Disponibles

- `npm run dev` : Serveur de développement avec hot reload
- `npm run build` : Compilation pour la production
- `npm start` : Démarrage en mode production
- `npm run check` : Vérification TypeScript
- `npm run db:push` : Mise à jour du schéma de base de données

## 🎯 Guide d'Utilisation

### Pour les Maîtres de Jeu

1. **Créer une Session** : Générez un code de session unique
2. **Dashboard GM** : Gérez les personnages, effets et jets en temps réel
3. **GameBoard** : Projetez des images et ambiances via l'écran de projection
4. **Outils Narratifs** : Utilisez les générateurs de contenu IA

### Pour les Joueurs

1. **Rejoindre une Session** : Utilisez le code fourni par le MJ
2. **Créer un Personnage** : Assistant de création avec règles CoC 7e
3. **Feuille Interactive** : Interface complète avec jets de dés intégrés
4. **Synchronisation** : Vos actions sont visibles en temps réel par le MJ

## 🛠️ Développement

### Structure du Projet

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── hooks/         # Hooks personnalisés
│   │   └── lib/           # Utilitaires et configuration
├── server/                # Backend Express
│   ├── routes.ts         # Routes API
│   ├── websocket.ts      # Gestion WebSocket
│   └── openai.ts         # Intégration OpenAI
├── shared/               # Types partagés
└── public/              # Assets statiques
```

### Conventions de Code

- **TypeScript** : Mode strict activé
- **ESLint** : Configuration recommandée
- **Tailwind** : Classes utilitaires avec thème personnalisé
- **Components** : Architecture atomique (UI → Components → Pages)

### Tests

Les tests sont intégrés via les outils de développement. Le projet inclut :
- Validation TypeScript compile-time
- Tests d'intégration manuels
- Monitoring des performances

## 🔐 Sécurité

- **Authentification** : Sessions sécurisées côté serveur
- **Validation** : Schémas Zod pour toutes les entrées
- **Environment** : Variables sensibles isolées
- **CORS** : Configuration restrictive en production

## 📄 Licence et Propriété Intellectuelle

**© 2025 - Tous droits réservés**

Ce projet est mis à disposition en open source sous les conditions suivantes :

### ✅ Permissions
- Utilisation personnelle et éducative
- Modification et contribution au code source
- Distribution du code source modifié

### ❌ Restrictions
- **Usage commercial interdit** sans autorisation écrite
- **Redistribution de versions dérivées commerciales interdite**
- **Utilisation de la marque "Rôle Plug" interdite** pour des projets dérivés

### 📝 Attribution
Toute utilisation doit inclure l'attribution suivante :
```
Basé sur Rôle Plug - Plateforme RPG Call of Cthulhu
Projet original : [lien du repository]
```

### 🤝 Contributions
Les contributions sont les bienvenues ! En contribuant, vous acceptez que votre code soit soumis aux mêmes conditions de licence.

## 🆘 Support et Contribution

### Rapporter des Bugs
Ouvrez une issue GitHub avec :
- Description du problème
- Étapes de reproduction
- Environnement (OS, navigateur, Node.js version)

### Proposer des Fonctionnalités
- Vérifiez qu'elle n'existe pas déjà dans les issues
- Décrivez clairement l'utilité et l'implémentation proposée
- Considérez l'impact sur les performances et l'UX

### Guidelines de Contribution
1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos modifications (`git commit -m 'Add AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 🔗 Ressources

- **Call of Cthulhu 7e** : [Chaosium Official](https://www.chaosium.com/call-of-cthulhu-rpg/)
- **React Documentation** : [React.dev](https://react.dev/)
- **Tailwind CSS** : [tailwindcss.com](https://tailwindcss.com/)
- **Drizzle ORM** : [orm.drizzle.team](https://orm.drizzle.team/)

---

**Développé avec ❤️ pour la communauté Call of Cthulhu**