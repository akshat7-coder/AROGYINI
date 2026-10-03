const PARTS = ["body", "query", "params"];

// Accepts validate(bodySchema) or validate({ body, query, params }).
export function validate(schemas) {
  const map = typeof schemas?.safeParse === "function" ? { body: schemas } : schemas ?? {};

  return (req, res, next) => {
    for (const part of PARTS) {
      if (!map[part]) continue;
      const parsed = map[part].safeParse(req[part]);
      if (!parsed.success) return next(parsed.error);
      // req.query is a getter in Express 5, so replace it instead of assigning.
      Object.defineProperty(req, part, { value: parsed.data, writable: true, configurable: true });
    }
    next();
  };
}
