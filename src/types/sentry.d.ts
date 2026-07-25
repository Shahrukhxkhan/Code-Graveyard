declare module "@sentry/nextjs" {
  export function init(options: any): void;
  export function captureException(error: any, options?: any): string;
  export function withScope(callback: (scope: any) => void): void;
  export function withSentryConfig(nextConfig: any, sentryOptions?: any): any;
  export interface Event {
    request?: {
      headers?: Record<string, string>;
      [key: string]: any;
    };
    extra?: Record<string, any>;
    tags?: Record<string, any>;
    user?: Record<string, any>;
    [key: string]: any;
  }
  export interface Breadcrumb {
    category?: string;
    data?: Record<string, any>;
    [key: string]: any;
  }
}
