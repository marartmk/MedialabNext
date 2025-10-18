export function handleApiError(
  error: unknown, 
  fallbackMessage: string,
  context?: string
): string {
  // Log l'errore con contesto
  console.error(`[${context || 'API Error'}]:`, error);
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object') {
    const err = error as { response?: { data?: { message?: string } } };
    if (err.response?.data?.message) {
      return err.response.data.message;
    }
  }
  
  return fallbackMessage;
}
