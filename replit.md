# Overview

Rôle Plug est une plateforme de jeu de rôle numérique pour Call of Cthulhu 7th Edition qui permet aux joueurs de créer des investigateurs, gérer des fiches de personnages, et diriger des sessions avec des outils MJ en temps réel. L'application propose une interface thématique lovecraftienne avec avatars de personnages générés par IA, mécaniques de jets de dés complètes, suivi de sanité mentale, et gestion de sessions.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **Routing**: Wouter for client-side routing with role-based page access (player vs GM views)
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom Lovecraftian color palette and typography (Cinzel, Crimson Text fonts)
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript for API server
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit's OpenID Connect integration with session-based auth using express-session
- **Real-time Features**: WebSocket server for live GM-player interactions during sessions
- **Development**: Custom Vite integration for hot module replacement in development

## Database Design
- **Schema**: Comprehensive Call of Cthulhu data model including users, game sessions, characters, sanity conditions, active effects, and roll history
- **Relationships**: Proper foreign key relationships between GM sessions, characters, and player data
- **Session Storage**: PostgreSQL-based session storage for authentication persistence
- **Migrations**: Drizzle Kit for database schema migrations and management

## Game Logic Implementation
- **Character Creation**: 7th Edition rules implementation with automatic characteristic generation and derived stat calculation
- **Dice System**: Custom dice rolling engine supporting all Call of Cthulhu mechanics (1d100, damage dice, etc.)
- **Sanity System**: Complete sanity tracking with phobias, manias, and temporary insanity effects
- **Skills Management**: Full skill system with occupation-based starting values and advancement tracking

## Real-time Features
- **WebSocket Integration**: Live session updates for GM dashboard and player interactions
- **Roll Broadcasting**: Real-time dice roll sharing between GM and players
- **Session Management**: Live player status updates and session state synchronization

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with connection pooling via @neondatabase/serverless
- **Connection Management**: WebSocket constructor override for serverless database connections

## AI Services
- **OpenAI API**: DALL-E 3 for character avatar generation and GPT-4 for dynamic content generation (phobia/mania descriptions)
- **Image Generation**: 1920s portrait style character avatars matching game theme

## Authentication Provider
- **Replit Auth**: OAuth 2.0/OpenID Connect integration for user authentication
- **Session Management**: Server-side session storage with automatic user profile management

## Development Tools
- **Replit Platform**: Development environment integration with cartographer plugin for enhanced debugging
- **Runtime Error Handling**: Replit's runtime error modal for development feedback

## UI Framework Dependencies
- **Radix UI**: Comprehensive set of accessible UI primitives for all interactive components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent icon library for UI elements
- **Class Variance Authority**: Type-safe variant management for component styling