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
- **Character Import**: GMs can import characters from their other sessions. Stats, skills, and avatars are copied while HP/Sanity/MP are reset to max and history is cleared (inventory, effects, conditions, roll history)
- **Dice System**: Custom dice rolling engine supporting all Call of Cthulhu mechanics (1d100, damage dice, etc.)
- **Sanity System**: Complete sanity tracking with phobias, manias, and temporary insanity effects
- **Skills Management**: Full skill system with occupation-based starting values and advancement tracking

## Real-time Features
- **WebSocket Integration**: Live session updates for GM dashboard and player interactions
- **Roll Broadcasting**: Real-time dice roll sharing between GM and players
- **Session Management**: Live player status updates and session state synchronization
- **Visual Projection System**: GM-controlled image projection to gameboard via WebSocket
  - Floating button on GM dashboard opens projection dialog
  - AI image generation, URL loading, and projection clearing capabilities
  - Real-time sync to public gameboard display (no authentication required)
  - Gameboard displays projections only (no generation controls)

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

# Testing & Validation Framework

## Testing Philosophy
Every feature addition or update requires comprehensive testing across all application layers to ensure robustness, performance, and user experience integrity. Testing follows a systematic approach covering backend API endpoints, frontend components, real-time features, and user interface interactions.

## Testing Tools & Infrastructure

### Development Environment Testing
- **LSP Diagnostics**: TypeScript error checking with `get_latest_lsp_diagnostics` for compile-time validation
- **Workflow Management**: Server restart validation with `restart_workflow` to ensure changes are properly applied
- **Hot Module Replacement**: Vite HMR monitoring for frontend development cycle validation

### Backend API Testing
- **Route Validation**: Manual API endpoint testing for all CRUD operations
- **Authentication Testing**: Session-based auth validation for protected routes
- **WebSocket Testing**: Real-time connection and message broadcasting validation
- **Database Operations**: Drizzle ORM query validation and data integrity checks

### Frontend Component Testing
- **Component Integration**: Visual and functional testing of React components
- **State Management**: TanStack Query cache validation and data flow testing
- **Form Validation**: React Hook Form with Zod schema testing for all user inputs
- **Responsive Design**: Multi-device layout and interaction testing

### UI/UX Validation
- **Accessibility Testing**: Radix UI primitive compliance and keyboard navigation
- **Visual Consistency**: Lovecraftian theme integrity and typography validation
- **Interactive Elements**: Button states, hover effects, and loading states testing
- **Error States**: User-friendly error handling and feedback validation

## Testing Procedures by Component

### Backend Testing Checklist
1. **API Endpoints**
   - Route accessibility and HTTP status codes
   - Request/response data structure validation
   - Authentication and authorization checks
   - Error handling and edge cases
   - Database transaction integrity

2. **WebSocket Features**
   - Connection establishment and persistence
   - Message broadcasting to correct recipients
   - Real-time state synchronization
   - Reconnection handling and failover

3. **Database Operations**
   - CRUD operations for all entities
   - Foreign key relationships integrity
   - Migration scripts execution
   - Data persistence and retrieval accuracy

### Frontend Testing Checklist
1. **Component Functionality**
   - Props handling and state management
   - Event handlers and user interactions
   - Conditional rendering and dynamic content
   - Component lifecycle and cleanup

2. **User Interface**
   - Visual consistency across pages
   - Responsive design on different screen sizes
   - Loading states and skeleton screens
   - Error boundaries and graceful degradation

3. **User Experience**
   - Intuitive navigation and workflow
   - Form validation and feedback
   - Real-time updates and notifications
   - Performance and loading times

### Game Logic Testing
1. **Character Management**
   - Character creation with correct stat calculations
   - Skill point distribution and validation
   - Inventory management and item interactions
   - Money handling and transaction accuracy

2. **Dice Rolling System**
   - Probability distribution validation
   - Critical success/failure detection
   - Sound effects and visual feedback
   - Roll history and logging

3. **Session Management**
   - GM dashboard functionality
   - Player invitation and joining
   - Real-time session synchronization
   - Session persistence and recovery

## Validation Standards

### Performance Criteria
- **Page Load Time**: < 3 seconds for initial load
- **API Response Time**: < 500ms for standard operations
- **WebSocket Latency**: < 100ms for real-time updates
- **Memory Usage**: Efficient cleanup and garbage collection

### User Experience Standards
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile Responsiveness**: Full functionality on devices ≥ 320px width
- **Browser Compatibility**: Chrome, Firefox, Safari, Edge latest versions
- **Error Recovery**: Clear error messages and recovery paths

### Code Quality Standards
- **TypeScript Coverage**: 100% type safety with strict mode
- **Component Reusability**: DRY principles and modular architecture
- **Security**: Input validation, XSS prevention, secure authentication
- **Documentation**: Inline comments for complex logic and API documentation

## Continuous Testing Protocol

### Pre-Deployment Checklist
1. **Compile-time Validation**
   - TypeScript errors resolved (LSP diagnostics clear)
   - Build process completes without warnings
   - Import/export consistency verified

2. **Runtime Validation**
   - Server starts successfully with all routes registered
   - Database connections established and migrations applied
   - WebSocket server operational and accepting connections

3. **Feature Integration Testing**
   - New functionality works in isolation
   - Integration with existing features validated
   - No regression in previously working features
   - Cross-browser compatibility verified

4. **User Acceptance Testing**
   - Complete user workflow testing
   - Error scenarios and edge cases covered
   - Performance benchmarks met
   - Security vulnerabilities assessed

### Post-Deployment Monitoring
- **Error Logging**: Console error monitoring and resolution
- **Performance Metrics**: Load time and response time tracking
- **User Feedback**: Interface usability and bug reports
- **System Health**: Database performance and connection stability

## Recent Updates & Testing Status

### Latest Features Tested (November 2025)
1. **Dual Authentication System** (Nov 16): Complete OIDC + local auth support across all routes
   - All 25+ backend routes converted to use `getUserId()` helper
   - Signup flow robustified with deterministic cache updates
   - End-to-end auth testing validated (signup, login, session creation)

2. **QR Code Join Flow** (Nov 16): Fixed missing route for QR code-based session joining
   - Added `/join/:code` route in App.tsx for automatic session joining
   - Created `JoinWithCode` page for seamless QR code experience
   - Players can now scan QR codes to auto-join sessions
   - Complete flow: QR scan → /join/CODE → Auto-join → Character selection → Character sheet
   - End-to-end player access validated: QR join → Character selection → Full character sheet access

3. **Visual Projection System** (Nov 16): Integrated floating button for gameboard image management
   - Added floating projection button in GM dashboard (bottom-right, circular gold button with Monitor icon)
   - Integrated VisualProjectionDialog component with 3 control tabs
   - AI Generation: Create scenes with DALL-E prompts and project to gameboard
   - URL Loading: Load images from external URLs for instant projection
   - Control Panel: Clear projections with single click
   - Real-time WebSocket synchronization to gameboard display
   - Complete GM-to-gameboard projection workflow operational

4. **UI Polish** (Nov 16): Removed distracting pulse animations from critical character states
   - Removed animate-pulse from character-card.tsx sanity status
   - Removed animate-pulse from enhanced-character-card.tsx (card border & Skull icon)
   - Removed animate-pulse from gameboard.tsx (Skull icon & sanity progress bar)
   - Removed animate-pulse from character-sheet.tsx (HP & sanity borders)
   - Critical states now use solid visual indicators (colors, icons) for better readability

5. **Enhanced GM Dashboard**: Character-centric interface with integrated actions
6. **Inventory Management**: Complete item catalog with quantity controls and money management
7. **Skill Points System**: GM allocation and player distribution with validation
8. **Enhanced Character Cards**: Expandable interface with all major actions integrated

### Current Test Coverage
- ✅ Dual authentication (OIDC + local) across all routes
- ✅ QR code join flow and auto-redirect
- ✅ Character selection and session joining
- ✅ Backend API routes (character, inventory, session management)
- ✅ Frontend component integration (cards, modals, forms)
- ✅ Real-time WebSocket functionality
- ✅ Database operations and data integrity
- ✅ User interface responsiveness and accessibility
- ✅ Game logic implementation (dice rolling, sanity tracking)

### Known Testing Gaps
- Automated test suite implementation pending
- Load testing under concurrent user scenarios
- Mobile device specific testing expansion needed
- Integration testing with external AI services