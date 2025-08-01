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
- **Mobile**: React Native application developed alongside the web version, ensuring feature parity with shared backend APIs. Includes mobile-specific screens and navigation.
- **Authentication**: Secure session management, bcrypt hashing for passwords, email verification, and password reset functionality.
- **Financial Data Handling**: Secure integration with Plaid for bank connections and transactions, including transaction categorization, balance refresh, and duplicate prevention.
- **AI Integration**: Leverages OpenAI's GPT-4o for personalized financial coaching, budget recommendations, and credit improvement suggestions based on user data.
- **Subscription Management**: Stripe for secure payment processing, supporting both monthly and annual plans with a 30-day free trial.
- **Notifications**: SendGrid for transactional emails (welcome, trial, admin alerts).
- **Scalability**: Implemented connection pooling, Redis session store (with memory fallback), enhanced rate limiting, and caching for high-volume user support.
- **Security**: Includes input validation, CSRF protection, Helmet.js security headers, and role-based access control (for admin features).

### Feature Specifications
- **Dashboard**: Overview of accounts, recent transactions, spending trends, and savings goals summary.
- **Accounts**: Management of connected bank accounts, manual refresh, and secure disconnection.
- **Budgeting**: AI-generated and user-customizable budget plans with real-time tracking, color-coded progress, and persistence.
- **Goals**: Creation and tracking of savings goals with progress visualization, milestone celebrations, and deletion functionality.
- **AI Coach**: Interactive "Money Mind" providing personalized financial advice based on linked financial data.
- **Credit Monitoring**: Integration with Experian for credit score data and recommendations (feature marked as "coming soon" for users).
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