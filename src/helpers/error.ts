/**
 * Logs the original error and rethrows it with a user-facing context message prepended, so the
 * single notice shown by `NoteService` explains what went wrong.
 */
export function handleError(error: unknown, contextMessage: string): never {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${contextMessage} ${message}`.trim());
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
