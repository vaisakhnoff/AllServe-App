/**
 * Safely extracts a string ID from either a plain string/ObjectId
 * or a populated Mongoose document reference ({ _id: ... }).
 */
export function extractId(ref: unknown): string {
  if (ref && typeof ref === "object" && "_id" in (ref as Record<string, unknown>)) {
    return String((ref as Record<string, unknown>)._id);
  }
  return String(ref);
}
