/**
 * Network Utilities - Timeout, Retry, and Error Handling
 * Provides resilient network operations for production environments
 */

/**
 * Network error types for better error handling
 */
export enum NetworkErrorType {
    TIMEOUT = 'TIMEOUT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    ABORT = 'ABORT',
    SERVER_ERROR = 'SERVER_ERROR',
    UNKNOWN = 'UNKNOWN'
}

/**
 * Custom network error class with additional context
 */
export class NetworkError extends Error {
    type: NetworkErrorType;
    statusCode?: number;
    retryable: boolean;
    originalError?: Error;

    constructor(
        message: string,
        type: NetworkErrorType,
        retryable: boolean = false,
        statusCode?: number,
        originalError?: Error
    ) {
        super(message);
        this.name = 'NetworkError';
        this.type = type;
        this.retryable = retryable;
        this.statusCode = statusCode;
        this.originalError = originalError;
    }
}

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number; // exponential backoff multiplier
    retryableErrors: NetworkErrorType[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
};

/**
 * Timeout wrapper for promises
 * @param promise - The promise to wrap with timeout
 * @param timeoutMs - Timeout in milliseconds
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that rejects on timeout
 */
export function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal?: AbortSignal
): Promise<T> {
    return new Promise((resolve, reject) => {
        // Check if already aborted
        if (signal?.aborted) {
            reject(new NetworkError('Request aborted', NetworkErrorType.ABORT, false));
            return;
        }

        const timeoutId = setTimeout(() => {
            reject(new NetworkError(
                `Request timed out after ${timeoutMs}ms`,
                NetworkErrorType.TIMEOUT,
                true
            ));
        }, timeoutMs);

        // Handle abort signal
        const abortHandler = () => {
            clearTimeout(timeoutId);
            reject(new NetworkError('Request aborted', NetworkErrorType.ABORT, false));
        };

        signal?.addEventListener('abort', abortHandler);

        promise
            .then((result) => {
                clearTimeout(timeoutId);
                signal?.removeEventListener('abort', abortHandler);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                signal?.removeEventListener('abort', abortHandler);
                reject(error);
            });
    });
}

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current retry attempt (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds with jitter
 */
function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    // Add jitter (±20%) to prevent thundering herd
    const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);
    return Math.floor(cappedDelay + jitter);
}

/**
 * Delay utility
 * @param ms - Milliseconds to delay
 * @param signal - Optional AbortSignal for cancellation
 */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(new NetworkError('Delay aborted', NetworkErrorType.ABORT, false));
            return;
        }

        const timeoutId = setTimeout(resolve, ms);

        const abortHandler = () => {
            clearTimeout(timeoutId);
            reject(new NetworkError('Delay aborted', NetworkErrorType.ABORT, false));
        };

        signal?.addEventListener('abort', abortHandler, { once: true });
    });
}

/**
 * Retry wrapper with exponential backoff
 * @param fn - Async function to retry
 * @param config - Retry configuration
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise that resolves with function result or rejects after max retries
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    signal?: AbortSignal
): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: NetworkError | Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            // Check if aborted before each attempt
            if (signal?.aborted) {
                throw new NetworkError('Request aborted', NetworkErrorType.ABORT, false);
            }

            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Convert to NetworkError if not already
            const networkError = error instanceof NetworkError
                ? error
                : classifyError(error as Error);

            // Don't retry if not retryable or if it's the last attempt
            if (!networkError.retryable || attempt === retryConfig.maxRetries) {
                throw networkError;
            }

            // Don't retry if error type is not in retryable list
            if (!retryConfig.retryableErrors.includes(networkError.type)) {
                throw networkError;
            }

            // Calculate delay and wait before next attempt
            const delayMs = calculateBackoffDelay(attempt, retryConfig);
            console.warn(
                `Network request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}). ` +
                `Retrying in ${delayMs}ms...`,
                networkError.message
            );

            await delay(delayMs, signal);
        }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError!;
}

/**
 * Classify error into NetworkError type
 * @param error - Original error
 * @returns NetworkError with appropriate type
 */
export function classifyError(error: Error): NetworkError {
    const message = error.message?.toLowerCase() || '';

    // Timeout errors
    if (message.includes('timeout') || error.name === 'TimeoutError') {
        return new NetworkError(
            error.message || 'Request timed out',
            NetworkErrorType.TIMEOUT,
            true,
            undefined,
            error
        );
    }

    // Abort errors
    if (error.name === 'AbortError' || message.includes('abort')) {
        return new NetworkError(
            error.message || 'Request aborted',
            NetworkErrorType.ABORT,
            false,
            undefined,
            error
        );
    }

    // Network errors
    if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        error.name === 'NetworkError'
    ) {
        return new NetworkError(
            error.message || 'Network error occurred',
            NetworkErrorType.NETWORK_ERROR,
            true,
            undefined,
            error
        );
    }

    // Server errors (5xx)
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
        return new NetworkError(
            error.message || 'Server error occurred',
            NetworkErrorType.SERVER_ERROR,
            true,
            500,
            error
        );
    }

    // Unknown errors - not retryable by default
    return new NetworkError(
        error.message || 'Unknown error occurred',
        NetworkErrorType.UNKNOWN,
        false,
        undefined,
        error
    );
}

/**
 * User-friendly error messages for different error types
 */
export function getErrorMessage(error: NetworkError | Error): string {
    if (error instanceof NetworkError) {
        switch (error.type) {
            case NetworkErrorType.TIMEOUT:
                return 'Request timed out. Please check your connection and try again.';
            case NetworkErrorType.NETWORK_ERROR:
                return 'Network error. Please check your internet connection.';
            case NetworkErrorType.ABORT:
                return 'Request was cancelled.';
            case NetworkErrorType.SERVER_ERROR:
                return 'Server is experiencing issues. Please try again later.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }
    return error.message || 'An error occurred. Please try again.';
}

/**
 * Combined timeout + retry wrapper
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds
 * @param retryConfig - Retry configuration
 * @param signal - Optional AbortSignal for cancellation
 */
export async function withTimeoutAndRetry<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    retryConfig: Partial<RetryConfig> = {},
    signal?: AbortSignal
): Promise<T> {
    return withRetry(
        () => withTimeout(fn(), timeoutMs, signal),
        retryConfig,
        signal
    );
}

// ============================================================================
// REST API Helper Functions
// ============================================================================

/**
 * HTTP Methods
 */
export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE'
}

/**
 * Request configuration for API calls
 */
export interface ApiRequestConfig {
    method: HttpMethod;
    endpoint: string;
    body?: any;
    headers?: Record<string, string>;
    queryParams?: Record<string, string | number | boolean>;
    signal?: AbortSignal;
    timeout?: number;
    retry?: Partial<RetryConfig>;
}

/**
 * Default API configuration
 */
const DEFAULT_API_CONFIG = {
    timeout: 10000, // 10 seconds
    retry: {
        maxRetries: 2,
        initialDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR, NetworkErrorType.SERVER_ERROR]
    }
};

/**
 * Build URL with query parameters
 */
function buildUrl(baseUrl: string, endpoint: string, queryParams?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint, baseUrl);

    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
        });
    }

    return url.toString();
}

/**
 * Convert HTTP response to NetworkError if not OK
 */
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const statusCode = response.status;
        let errorMessage = `HTTP ${statusCode}`;

        // Try to extract error message from response body
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
            // Ignore JSON parse errors
        }

        // Classify by status code
        if (statusCode >= 500) {
            throw new NetworkError(
                errorMessage,
                NetworkErrorType.SERVER_ERROR,
                true, // Server errors are retryable
                statusCode
            );
        } else if (statusCode === 408 || statusCode === 504) {
            throw new NetworkError(
                'Request timeout',
                NetworkErrorType.TIMEOUT,
                true,
                statusCode
            );
        } else {
            throw new NetworkError(
                errorMessage,
                NetworkErrorType.UNKNOWN,
                false, // Client errors (4xx) are not retryable
                statusCode
            );
        }
    }

    // Parse JSON response
    try {
        return await response.json();
    } catch (error) {
        throw new NetworkError(
            'Failed to parse response JSON',
            NetworkErrorType.UNKNOWN,
            false,
            undefined,
            error as Error
        );
    }
}

/**
 * Generic API request function with timeout and retry
 *
 * @example
 * ```typescript
 * const data = await apiRequest({
 *   method: HttpMethod.POST,
 *   endpoint: '/api/search',
 *   body: { query: 'test' },
 *   timeout: 5000
 * });
 * ```
 */
export async function apiRequest<T = any>(config: ApiRequestConfig): Promise<T> {
    const {
        method,
        endpoint,
        body,
        headers = {},
        queryParams,
        signal,
        timeout = DEFAULT_API_CONFIG.timeout,
        retry = DEFAULT_API_CONFIG.retry
    } = config;

    // Build full URL (in production, baseUrl would come from env config)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildUrl(baseUrl, endpoint, queryParams);

    // Prepare request options
    const requestOptions: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        signal
    };

    // Add body for non-GET requests
    if (body && method !== HttpMethod.GET) {
        requestOptions.body = JSON.stringify(body);
    }

    // Perform request with timeout and retry
    return withTimeoutAndRetry(
        async () => {
            const response = await fetch(url, requestOptions);
            return handleResponse<T>(response);
        },
        timeout,
        retry,
        signal
    );
}

/**
 * Convenience function for GET requests
 */
export async function apiGet<T = any>(
    endpoint: string,
    options: Omit<ApiRequestConfig, 'method' | 'endpoint' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>({
        ...options,
        method: HttpMethod.GET,
        endpoint
    });
}

/**
 * Convenience function for POST requests
 */
export async function apiPost<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<ApiRequestConfig, 'method' | 'endpoint' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>({
        ...options,
        method: HttpMethod.POST,
        endpoint,
        body
    });
}

/**
 * Convenience function for PUT requests
 */
export async function apiPut<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<ApiRequestConfig, 'method' | 'endpoint' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>({
        ...options,
        method: HttpMethod.PUT,
        endpoint,
        body
    });
}

/**
 * Convenience function for PATCH requests
 */
export async function apiPatch<T = any>(
    endpoint: string,
    body?: any,
    options: Omit<ApiRequestConfig, 'method' | 'endpoint' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>({
        ...options,
        method: HttpMethod.PATCH,
        endpoint,
        body
    });
}

/**
 * Convenience function for DELETE requests
 */
export async function apiDelete<T = any>(
    endpoint: string,
    options: Omit<ApiRequestConfig, 'method' | 'endpoint' | 'body'> = {}
): Promise<T> {
    return apiRequest<T>({
        ...options,
        method: HttpMethod.DELETE,
        endpoint
    });
}
