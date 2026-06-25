import { IServiceOrderRepository } from "../interfaces/service-order/IServiceOrderRepository";

/**
 * Handles expiration of time-sensitive orders:
 * - Instant requests: 30-min provider response deadline
 * - Custom requests: 7-day expiry
 *
 * Should be called periodically (e.g., via cron every minute).
 */
export class OrderTimerService {
  constructor(private readonly orderRepo: IServiceOrderRepository) {}

  /**
   * Check and expire instant requests that have passed their 30-minute deadline.
   */
  async expireInstantRequests(): Promise<number> {
    const now = new Date();
    const expired = await this.orderRepo.findExpiredInstantRequests(now);

    for (const order of expired) {
      await this.orderRepo.updateStatus(String(order._id), "provider_unresponsive");
    }

    return expired.length;
  }

  /**
   * Check and expire custom requests that have passed their expiry date.
   */
  async expireCustomRequests(): Promise<number> {
    const now = new Date();
    const expired = await this.orderRepo.findExpiredCustomRequests(now);

    for (const order of expired) {
      await this.orderRepo.updateStatus(String(order._id), "expired");
    }

    return expired.length;
  }

  /**
   * Run all expiry checks. Call this from a cron job.
   */
  async runAll(): Promise<{ instantExpired: number; customExpired: number }> {
    const [instantExpired, customExpired] = await Promise.all([
      this.expireInstantRequests(),
      this.expireCustomRequests(),
    ]);
    return { instantExpired, customExpired };
  }
}
