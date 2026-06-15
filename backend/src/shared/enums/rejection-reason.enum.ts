
//  Predefined rejection reason codes for provider applications.

export enum RejectionReasonCode {
  UNCLEAR_DOCUMENTS = "UNCLEAR_DOCUMENTS",
  DOCUMENT_MISMATCH = "DOCUMENT_MISMATCH",
  EXPIRED_DOCUMENT = "EXPIRED_DOCUMENT",
  INCOMPLETE_FIELDS = "INCOMPLETE_FIELDS",
  DUPLICATE_APPLICATION = "DUPLICATE_APPLICATION",
  UNVERIFIABLE_BUSINESS = "UNVERIFIABLE_BUSINESS",
  INVALID_CONTACT = "INVALID_CONTACT",
  OTHER = "OTHER",
}


export const REJECTION_REASON_LABELS: Record<RejectionReasonCode, string> = {
  [RejectionReasonCode.UNCLEAR_DOCUMENTS]: "Verification proof is unclear or not visible",
  [RejectionReasonCode.DOCUMENT_MISMATCH]: "Uploaded document does not match entered information",
  [RejectionReasonCode.EXPIRED_DOCUMENT]: "Invalid or expired verification document",
  [RejectionReasonCode.INCOMPLETE_FIELDS]: "Required fields are incomplete",
  [RejectionReasonCode.DUPLICATE_APPLICATION]: "Duplicate application detected",
  [RejectionReasonCode.UNVERIFIABLE_BUSINESS]: "Business details could not be verified",
  [RejectionReasonCode.INVALID_CONTACT]: "Contact information is invalid",
  [RejectionReasonCode.OTHER]: "Other (see admin remarks)",
};
