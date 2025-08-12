# Mind My Money - Personal Finance Management Platform

## Overview

Mind My Money is a comprehensive personal finance management platform designed to empower users with effective money management. It integrates bank accounts, provides AI-powered financial coaching via "Money Mind," and offers intelligent analytics for spending patterns, budget tracking, and credit score monitoring. The platform aims to deliver real-time financial insights and personalized advice.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components and Radix UI primitives for a clean, modern aesthetic.
- **Branding**: Utilizes a custom "brain-dollar" logo, consistent color schemes (e.g., red for spent, blue for remaining), and professional email templates.
- **Workflow**: Guided onboarding process, intuitive navigation, and interactive elements for a seamless user experience, including password visibility toggles and clear call-to-actions.

### Technical Implementations
- **Frontend**: Vite for fast development, Wouter for lightweight routing, and TanStack Query for server state management.
- **Backend**: Node.js with Express.js, TypeScript with ES modules, Passport.js for session-based authentication, and Drizzle ORM for type-safe PostgreSQL interactions.
- **Mobile**: Completely rebuilt React Native application (v2.0.0) with modern architecture, updated dependencies, and full feature parity including the enhanced credit simulator with all 5 FICO factors, progress tracking, authentication context, and comprehensive mobile-optimized UI components. Includes detailed deployment guides for smooth Android builds using Cursor IDE.
- **Authentication**: Secure session management, bcrypt hashing for passwords, email verification, and password reset functionality.
- **Financial Data Handling**: Secure integration with Plaid for bank connections and transactions, including transaction categorization, balance refresh, and duplicate prevention. **CRITICAL FIX (Aug 11, 2025)**: Disabled automatic balance refresh scheduler and implemented strict 12-hour rate limiting per user to prevent excessive API charges.
- **AI Integration**: Leverages OpenAI's GPT-4o for personalized financial coaching, budget recommendations, and comprehensive credit improvement plans with detailed monthly action items based on user financial data.
- **Subscription Management**: Stripe for secure payment processing, supporting both monthly and annual plans with a 30-day free trial.
- **Notifications**: SendGrid for transactional emails (welcome, trial, admin alerts).
- **Scalability**: Implemented connection pooling, Redis session store (with memory fallback), enhanced rate limiting, and caching for high-volume user support.
- **Security**: Includes input validation, CSRF protection, Helmet.js security headers, and role-based access control (for admin features).
- **API Rate Limiting**: Implemented comprehensive Plaid API rate limiting system to prevent billing overages. Balance refreshes now limited to once every 12 hours per user, with clear user feedback on rate limit status.
- **Login Balance Refresh**: Automatic balance updates triggered on user login (bypasses manual rate limiting) to ensure users always see fresh data when they access the app.
- **Credit Assessment Database**: Added credit_assessments table storing user credit profiles, AI-generated improvement plans, and historical progress tracking (Aug 11, 2025).
- **Enhanced Credit Education**: Added comprehensive credit score factors education with visual progress bars, color-coded indicators, and detailed explanations for all 5 FICO scoring factors (Aug 11, 2025).
- **Progress Tracking System**: Implemented user-friendly progress monitoring with assessment date tracking, "Retake Assessment" functionality, key metrics dashboard, and progress tips for ongoing credit improvement (Aug 11, 2025).

### Feature Specifications
- **Dashboard**: Overview of accounts, recent transactions, spending trends, and savings goals summary.
- **Accounts**: Management of connected bank accounts, manual refresh, and secure disconnection.
- **Budgeting**: AI-generated and user-customizable budget plans with real-time tracking, color-coded progress, and persistence.
- **Goals**: Creation and tracking of savings goals with progress visualization, milestone celebrations, and deletion functionality.
- **AI Coach**: Interactive "Money Mind" providing personalized financial advice based on linked financial data.
- **Credit Simulator**: Comprehensive AI-powered credit score improvement system with detailed assessment forms, personalized improvement plans, the 5 credit scoring factors with exact percentages (Payment History 35%, Credit Utilization 30%, etc.), and enhanced progress tracking with assessment update capabilities (launched Aug 11, 2025).
- **Admin Panel**: For managing user feedback and performing administrative tasks.

## External Dependencies

- **Plaid**: For secure bank account connection and transaction data.
- **Experian**: For credit score monitoring.
- **Stripe**: For payment processing and subscription management.
- **OpenAI**: GPT-4o model for AI-powered financial coaching and insights.
- **SendGrid**: For transactional email delivery.
- **Neon Database**: PostgreSQL hosting for relational data.
- **Replit**: Development and deployment platform.
- **Redis**: For session storage and caching.