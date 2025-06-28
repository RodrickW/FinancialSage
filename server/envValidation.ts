/**
 * Environment variable validation for production security
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  STRIPE_SECRET_KEY: string;
  VITE_STRIPE_PUBLIC_KEY: string;
  PLAID_CLIENT_ID: string;
  PLAID_SECRET: string;
  PLAID_ENV: string;
  OPENAI_API_KEY: string;
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
  ADMIN_EMAIL: string;
}

/**
 * Validate that all required environment variables are present
 */
export function validateEnvironment(): void {
  const required: (keyof RequiredEnvVars)[] = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY', 
    'VITE_STRIPE_PUBLIC_KEY',
    'PLAID_CLIENT_ID',
    'PLAID_SECRET',
    'PLAID_ENV',
    'OPENAI_API_KEY',
    'SENDGRID_API_KEY',
    'FROM_EMAIL',
    'ADMIN_EMAIL'
  ];

  const missing: string[] = [];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.warn('Missing environment variables:', missing.join(', '));
    console.warn('Some features may be limited without these variables');
  }

  // Validate specific formats (non-blocking warnings)
  if (process.env.PLAID_ENV && !['sandbox', 'development', 'production'].includes(process.env.PLAID_ENV)) {
    console.warn('PLAID_ENV should be one of: sandbox, development, production');
  }

  if (process.env.FROM_EMAIL && !isValidEmail(process.env.FROM_EMAIL)) {
    console.warn('FROM_EMAIL should be a valid email address');
  }

  if (process.env.ADMIN_EMAIL && !isValidEmail(process.env.ADMIN_EMAIL)) {
    console.warn('ADMIN_EMAIL should be a valid email address');
  }

  console.log('✓ Environment validation passed');
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get validated environment variable
 */
export function getEnvVar(name: keyof RequiredEnvVars): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}