/**
 * Safely serialize any value to JSON, handling BigInt.
 * Use this instead of JSON.stringify for any Prisma query results.
 */
export function safeJson(data: unknown): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}

/**
 * Create a NextResponse with safe BigInt serialization.
 */
export function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(safeJson(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}
