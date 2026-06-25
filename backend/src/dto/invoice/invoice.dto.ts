import { z } from "zod";

const objectIdField = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const createInvoiceSchema = z.object({
  orderId: objectIdField,
  labourCharge: z.number().min(0, "Labour charge cannot be negative"),
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
}).refine(
  (data) => {
    const subtotal = data.labourCharge + data.materialCost + data.additionalCharges;
    return data.discount <= subtotal;
  },
  { message: "Discount cannot exceed the subtotal", path: ["discount"] }
);

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
