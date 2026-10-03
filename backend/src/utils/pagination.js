const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requested = Number.parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requested));
  return { page, limit, skip: (page - 1) * limit };
}
