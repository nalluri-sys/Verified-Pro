type EntityWithId = {
  id?: string | number;
  _id?: string | number;
};

export function entityId(entity: EntityWithId | null | undefined): string {
  if (!entity) return "";
  const value = entity.id ?? entity._id ?? "";
  return String(value);
}
