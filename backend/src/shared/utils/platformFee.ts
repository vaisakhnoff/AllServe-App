import { CategoryModel } from "../../models/category.model";

/**
 * Compute the upfront platform booking fee.
 * = service.price * (category.commissionRate / 100)
 * Defaults to 15% if category not found or price is 0.
 */
export async function computePlatformFee(
  servicePrice: number,
  categoryId: unknown
): Promise<number> {
  if (!servicePrice || servicePrice <= 0) return 0;
  try {
    const category = await CategoryModel.findById(categoryId).lean();
    const rate = category?.commissionRate ?? 15;
    return Math.round((servicePrice * rate) / 100);
  } catch {
    return Math.round((servicePrice * 15) / 100);
  }
}
