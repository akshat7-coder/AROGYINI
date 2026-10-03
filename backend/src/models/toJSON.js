// Shared across every model: map _id to id, hide __v. `_id` is guarded because a query that
// deselects it (.select("-_id")) would otherwise crash the transform.
export const toJSON = {
  transform(doc, ret) {
    if (ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
};
