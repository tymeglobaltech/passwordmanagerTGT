/**
 * Minimal ambient declarations for the Trusted Types API.
 *
 * TypeScript's bundled DOM lib does not yet include this API. Only the
 * members main.tsx actually uses are declared - this is not a full
 * implementation of the spec, just enough to type-check our one call site.
 * See https://www.w3.org/TR/trusted-types/
 */

interface TrustedTypePolicyOptions {
  createHTML?: (input: string) => string;
  createScript?: (input: string) => string;
  createScriptURL?: (input: string) => string;
}

interface TrustedTypePolicyFactory {
  createPolicy(name: string, options: TrustedTypePolicyOptions): unknown;
}

interface Window {
  readonly trustedTypes?: TrustedTypePolicyFactory;
}
