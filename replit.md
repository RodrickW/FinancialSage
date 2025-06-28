# Mind My Money - Personal Finance Management Platform

## Overview

Mind My Money is a comprehensive personal finance management platform that combines bank account integration, AI-powered financial coaching, and intelligent analytics to help users manage their money effectively. The application provides real-time insights into spending patterns, budget tracking, credit score monitoring, and personalized financial advice through an AI coach called "Money Mind."

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session management
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Structure**: RESTful APIs with proper error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL for relational data storage
- **Schema Management**: Drizzle migrations for database schema versioning
- **Session Storage**: In-memory store using MemoryStore for development

## Key Components

### Authentication & Authorization
- Session-based authentication using Passport.js
- User registration with email verification capability
- Password reset functionality with secure token generation
- Protected routes requiring authentication

### Financial Data Integration
- **Plaid Integration**: Secure bank account connection and transaction fetching
- **Credit Monitoring**: Integration with Experian for credit score data
- **Transaction Processing**: Automatic categorization and analysis

### AI-Powered Features
- **OpenAI Integration**: GPT-4o model for financial coaching and insights
- **Financial Coach**: Personalized advice based on user spending patterns
- **Budget Recommendations**: AI-generated budget suggestions
- **Credit Score Analysis**: Intelligent credit improvement recommendations

### Subscription Management
- **Stripe Integration**: Secure payment processing and subscription management
- **Trial System**: 30-day free trial with automatic billing
- **Tiered Pricing**: Standard and Premium subscription plans

### Email Notifications
- **SendGrid Integration**: Automated email notifications for user actions
- **Welcome Emails**: Onboarding sequence for new users
- **Admin Notifications**: Alerts for new user registrations

## Data Flow

1. **User Registration**: New users create accounts → Email notifications sent → Trial period initiated
2. **Bank Connection**: Users connect accounts via Plaid → Transaction data synchronized → Spending analysis generated
3. **AI Insights**: User data processed by OpenAI → Personalized recommendations generated → Displayed in dashboard
4. **Subscription Flow**: Users upgrade to premium → Stripe processes payment → Premium features unlocked
5. **Ongoing Sync**: Daily scheduler checks for trial notifications and updates financial data

## External Dependencies

### Financial Services
- **Plaid**: Bank account connection and transaction data (Sandbox environment)
- **Experian**: Credit score monitoring and reporting
- **Stripe**: Payment processing and subscription management

### AI Services
- **OpenAI**: GPT-4o model for financial coaching and insights generation

### Communication Services
- **SendGrid**: Transactional email delivery and notifications

### Infrastructure
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Replit**: Development and deployment platform

## Deployment Strategy

### Development Environment
- Local development using Vite dev server
- Hot module replacement for fast iteration
- PostgreSQL database connection via Neon

### Production Build
- Vite builds client-side assets to `dist/public`
- ESBuild bundles server code for Node.js deployment
- Static assets served via Express.js

### Environment Configuration
- Development: Sandbox APIs for Plaid and Stripe
- Production: Live API keys and verified SendGrid sender domains
- Database: PostgreSQL connection string via `DATABASE_URL`

### Monitoring & Logging
- Request/response logging for API endpoints
- Error tracking and performance monitoring
- Session management with configurable storage

## Changelog

```
Changelog:
- June 24, 2025. Initial setup
- June 25, 2025. Production launch preparation:
  * Updated Plaid to production environment for real bank connections
  * Fixed Stripe checkout flow with 30-day free trial
  * Implemented proper demo mode for marketing preview
  * Added subscription cancellation functionality
  * Separated demo users (sample data) from real users (authentic data only)
  * Ready for production deployment
- June 28, 2025. Final system verification and launch readiness:
  * Confirmed all integrations operational (Plaid production, Stripe live, OpenAI active)
  * Enhanced Plaid error handling with detailed logging and user-friendly messages
  * Verified secure API key configuration across all services
  * System fully ready for comprehensive testing and production launch
- June 28, 2025. Enterprise-grade security implementation:
  * Implemented bcrypt password hashing with 12 salt rounds for secure authentication
  * Added comprehensive rate limiting (100 requests/15min, 5 auth attempts/15min)
  * Configured Helmet.js security headers and CORS protection
  * Implemented input validation, sanitization, and CSRF protection
  * Added security event logging and audit trail system for compliance
  * Updated demo user credentials (username: demo, password: demo123)
  * Production-ready security suitable for financial data handling
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```