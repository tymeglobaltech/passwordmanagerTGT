/**
 * Environment flags.
 *
 * Production is the default: only an explicit NODE_ENV=development enables
 * developer-facing output. An unset, empty or mistyped NODE_ENV therefore
 * fails safe rather than disclosing stack traces and internal error detail.
 *
 * These are functions, not constants, because `dotenv.config()` runs after all
 * imports have been evaluated - reading process.env at import time would see
 * the value from before the .env file was loaded.
 */

export const isDevelopment = (): boolean =>
  (process.env.NODE_ENV || '').trim().toLowerCase() === 'development';

export const isProduction = (): boolean => !isDevelopment();

export const currentEnvironment = (): 'development' | 'production' =>
  isDevelopment() ? 'development' : 'production';
