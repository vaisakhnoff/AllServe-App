import cron from "node-cron";
import { OrderTimerService } from "../services/service-order/orderTimer.service";
import { logger } from "../shared/logger/logger";

export function startOrderExpiryCron(timerService: OrderTimerService) {
  // Run every minute to check for expired orders
  cron.schedule("* * * * *", async () => {
    try {
      const result = await timerService.runAll();
      if (result.instantExpired > 0) {
        logger.info("Order expiry cron ran", result);
      }
    } catch (error) {
      logger.error("Order expiry cron failed", { error });
    }
  });

  logger.info("Order expiry cron job started (runs every minute)");
}
