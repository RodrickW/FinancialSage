# Mind My Money - Personal Finance Management Platform

## Overview

Mind My Money is a comprehensive personal finance management platform designed to empower users with effective money management. It integrates bank accounts, provides AI-powered financial coaching via "Money Mind," and offers intelligent analytics for spending patterns, budget tracking, and credit score monitoring. The platform aims to deliver real-time financial insights and personalized advice.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS with shadcn/ui components and Radix UI primitives for a clean, modern aesthetic.
- **Branding**: Utilizes a custom "brain-dollar" logo, consistent color schemes (e.g., red for spent, blue for remaining), and professional email templates.
- **Workflow**: Guided onboarding process, intuitive navigation, and interactive elements for a seamless user experience, including password visibility toggles and clear call-to-actions.

### Technical Implementations
- **Frontend**: Vite for fast development, Wouter for lightweight routing, and TanStack Query for server state management.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, Passport.js for session-based authentication, and Drizzle ORM for type-safe PostgreSQL interactions.
- **Mobile**: Hybrid native+WebView architecture with RevenueCat integration for Apple App Store compliance, supporting multiplatform access for subscribers.
- **Authentication**: Secure session management, bcrypt hashing for passwords, email verification, and password reset functionality.
- **Financial Data Handling**: Secure integration with Plaid for bank connections and transactions, including categorization, balance refresh, and duplicate prevention with rate limiting.
- **AI Integration**: Leverages OpenAI's GPT-4o for personalized financial coaching, budget recommendations, and comprehensive credit improvement plans.
- **Subscription Management**: Three-tier freemium model (Basic, Plus, Pro) implemented with Stripe for web and RevenueCat for mobile, enforcing tier access via middleware.
- **Notifications**: SendGrid for transactional emails.
- **Scalability**: Implemented connection pooling, Redis session store, enhanced rate limiting, and caching.
- **Security**: Includes input validation, CSRF protection, Helmet.js security headers, and role-based access control.
- **Core Features**:
    - **Dashboard**: Overview of accounts, recent transactions, spending trends, and savings goals summary.
    - **Accounts**: Management of connected bank accounts, manual refresh, and secure disconnection.
    - **Budgeting**: AI-generated and user-customizable budget plans with real-time tracking.
    - **Goals**: Creation and tracking of savings goals with progress visualization.
    - **AI Coach**: Interactive "Money Mind" providing personalized financial advice.
    - **Account Deletion**: User-initiated account deletion with Stripe subscription cancellation and full data removal.
    - **Onboarding**: Interview-as-onboarding flow for new users, saving responses and generating personalized plans.
    - **Financial Tools**:
        - **What If Financial Simulator**: Interactive projections based on savings, debt payments, and spending reductions.
        - **Debt Payoff Visualizer**: Supports Snowball and Avalanche strategies with editable debts and progress tracking.
        - **Money Story Monthly Recap**: Shareable monthly financial summaries.
        - **Faith Mode**: Daily scripture, Generosity Score, tithing calculator, and tips.

## External Dependencies

- **Plaid**: For secure bank account connection and transaction data.
- **Stripe**: For web payment processing and subscription management.
- **RevenueCat**: For mobile Apple In-App Purchase management and App Store compliance.
- **OpenAI**: GPT-4o model for AI-powered financial coaching and insights.
- **SendGrid**: For transactional email delivery.
- **Neon Database**: PostgreSQL hosting for relational data.
- **Replit**: Development and deployment platform.
- **Redis**: For session storage and caching.