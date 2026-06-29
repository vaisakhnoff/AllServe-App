import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createInvoiceSchema = z.object({
  orderId: objectIdField,
  // For direct orders: provider fills all amounts manually.
  // For inspection/custom orders: labourCharge and materialCost are auto-populated
  // from the accepted quotation and ignored if provided. Only additionalCharges and
  // discount need to be supplied.
  labourCharge: z.number().min(0, "Labour charge cannot be negative").default(0),
  materialCost: z.number().min(0).default(0),
  additionalCharges: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  lineItemNotes: z.object({
    labour: z.string().trim().max(500).optional(),
    material: z.string().trim().max(500).optional(),
    additional: z.string().trim().max(500).optional(),
    discount: z.string().trim().max(500).optional(),
  }).optional(),
  overallRemark: z.string().trim().max(1000).optional(),
});

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
