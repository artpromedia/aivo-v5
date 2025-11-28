/**
 * Next.js API Route Validation Middleware
 * 
 * Provides request body and query parameter validation
 */

import { ZodSchema, formatZodError, createErrorResponse } from './index';

// Type for Next.js request/response (works with both App Router and Pages Router)
interface NextRequest {
  json(): Promise<unknown>;
  url: string;
  headers: Headers;
}

interface NextResponse {
  status: number;
}

// Response creator type
type ResponseCreator = {
  json(data: unknown, init?: { status?: number }): NextResponse;
};

/**
 * Wrap an API route handler with body validation
 * 
 * @example
 * ```typescript
 * export const POST = withValidation(
 *   createUserSchema,
 *   async (request, validatedBody) => {
 *     const user = await createUser(validatedBody);
 *     return NextResponse.json(user);
 *   }
 * );
 * ```
 */
export function withValidation<T, Ctx = unknown>(
  schema: ZodSchema<T>,
  handler: (
    request: NextRequest,
    validatedBody: T,
    ctx: Ctx
  ) => Promise<NextResponse>,
  NextResponse: ResponseCreator
) {
  return async (request: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        const requestId = request.headers.get('x-request-id') || undefined;
        return NextResponse.json(
          createErrorResponse(
            'Validation failed',
            'VALIDATION_ERROR',
            formatZodError(result.error),
            requestId
          ),
          { status: 400 }
        );
      }

      return handler(request, result.data, ctx);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          createErrorResponse('Invalid JSON', 'INVALID_JSON'),
          { status: 400 }
        );
      }
      throw error;
    }
  };
}

/**
 * Wrap an API route handler with query parameter validation
 * 
 * @example
 * ```typescript
 * export const GET = withQueryValidation(
 *   paginationSchema,
 *   async (request, validatedQuery) => {
 *     const { limit, offset } = validatedQuery;
 *     return NextResponse.json({ limit, offset });
 *   }
 * );
 * ```
 */
export function withQueryValidation<T, Ctx = unknown>(
  schema: ZodSchema<T>,
  handler: (
    request: NextRequest,
    validatedQuery: T,
    ctx: Ctx
  ) => Promise<NextResponse>,
  NextResponse: ResponseCreator
) {
  return async (request: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const result = schema.safeParse(query);

    if (!result.success) {
      const requestId = request.headers.get('x-request-id') || undefined;
      return NextResponse.json(
        createErrorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          formatZodError(result.error),
          requestId
        ),
        { status: 400 }
      );
    }

    return handler(request, result.data, ctx);
  };
}

/**
 * Wrap an API route handler with both body and query validation
 */
export function withFullValidation<TBody, TQuery, Ctx = unknown>(
  bodySchema: ZodSchema<TBody>,
  querySchema: ZodSchema<TQuery>,
  handler: (
    request: NextRequest,
    validatedBody: TBody,
    validatedQuery: TQuery,
    ctx: Ctx
  ) => Promise<NextResponse>,
  NextResponse: ResponseCreator
) {
  return async (request: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    // Validate query params
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const queryResult = querySchema.safeParse(query);

    if (!queryResult.success) {
      const requestId = request.headers.get('x-request-id') || undefined;
      return NextResponse.json(
        createErrorResponse(
          'Invalid query parameters',
          'VALIDATION_ERROR',
          formatZodError(queryResult.error),
          requestId
        ),
        { status: 400 }
      );
    }

    // Validate body
    try {
      const body = await request.json();
      const bodyResult = bodySchema.safeParse(body);

      if (!bodyResult.success) {
        const requestId = request.headers.get('x-request-id') || undefined;
        return NextResponse.json(
          createErrorResponse(
            'Validation failed',
            'VALIDATION_ERROR',
            formatZodError(bodyResult.error),
            requestId
          ),
          { status: 400 }
        );
      }

      return handler(request, bodyResult.data, queryResult.data, ctx);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          createErrorResponse('Invalid JSON', 'INVALID_JSON'),
          { status: 400 }
        );
      }
      throw error;
    }
  };
}
