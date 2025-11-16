# Overview

Rôle Plug is a digital role-playing platform for Call of Cthulhu 7th Edition. It enables players to create investigators, manage character sheets, and GMs to run real-time sessions with dedicated tools. The application features a Lovecraftian-themed interface, AI-generated character avatars, comprehensive dice mechanics, sanity tracking, and full session management capabilities. Its purpose is to enhance the digital TTRPG experience for Call of Cthulhu.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript (Vite)
- **Routing**: Wouter for client-side routing with role-based access
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with custom Lovecraftian theme
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit's OpenID Connect integration with session-based auth
- **Real-time Features**: WebSocket server for live GM-player interactions
- **Development**: Custom Vite integration for HMR

## Database Design
- **Schema**: Comprehensive Call of Cthulhu data model (users, sessions, characters, sanity, effects, roll history)
- **Relationships**: Proper foreign key relationships
- **Session Storage**: PostgreSQL for authentication persistence
- **Migrations**: Drizzle Kit for schema management

## Game Logic Implementation
- **Character Creation**: 7th Edition rules, automatic characteristic generation, derived stats, and physical characteristics storage
- **Character Import**: GMs can import characters, copying core data while resetting ephemeral stats
- **Dice System**: Custom dice rolling engine supporting Call of Cthulhu mechanics
- **Sanity System**: Full sanity tracking including phobias, manias, and temporary insanity
- **Skills Management**: Occupation-based starting values and advancement tracking

## Real-time Features
- **WebSocket Integration**: Live session updates and roll broadcasting
- **Session Management**: Live player status and state synchronization
- **Visual Projection System**: GM-controlled image projection to a public gameboard via WebSocket, supporting AI image generation, URL loading, and clearing.

## UI/UX Decisions
- Lovecraftian aesthetic with custom color palette and typography (Cinzel, Crimson Text).
- Focus on character-centric interfaces and integrated actions within the GM dashboard.
- User-friendly error handling and feedback.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database using `@neondatabase/serverless`.

## AI Services
- **OpenAI API**: DALL-E 3 for character avatar generation and GPT-4 for dynamic content (e.g., phobia/mania descriptions).

## Authentication Provider
- **Replit Auth**: OAuth 2.0/OpenID Connect for user authentication.

## Development Tools
- **Replit Platform**: Development environment and runtime error handling.

## UI Framework Dependencies
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **Class Variance Authority**: Type-safe variant management for styling.