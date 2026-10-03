export function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

export function paginated(res, data, { page, limit, total }) {
  return res.status(200).json({ success: true, data, meta: { page, limit, total } });
}

export function noContent(res) {
  return res.status(204).end();
}
