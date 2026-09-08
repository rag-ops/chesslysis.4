export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "An unexpected server error occurred.";
}
