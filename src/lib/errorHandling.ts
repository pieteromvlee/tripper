// Convex error type (based on observed structure)
interface ConvexErrorData {
  data?: string;
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  // Handle Convex errors
  if (typeof error === 'object' && error !== null) {
    const convexError = error as ConvexErrorData;
    return convexError.data || convexError.message || 'An unexpected error occurred';
  }

  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}
