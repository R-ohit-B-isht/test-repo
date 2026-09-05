// Resolved field list → { key: field } for fields that carry a value (any tier, including rejected so callers
// can label implausible claims); missing fields are simply absent.
function fieldMap(fields) {
  const F = {};
  for (const f of fields) if (f.value !== null && f.value !== undefined) F[f.key] = f;
  return F;
}

module.exports = { fieldMap };
