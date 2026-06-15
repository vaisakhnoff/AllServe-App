/**
 * Application/provider application status enum.
 * Separate from user Status enum (active/blocked/pending).
 */
export enum ApplicationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  NOT_APPLIED = "not_applied",
}
