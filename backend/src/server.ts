import http from "http";
import app from "./app";
import { env } from "./config/env";
import { logger } from "./shared/logger/logger";
import { connectDB } from "./database/db";
import { setupSocket } from "./socket/socket";
import { setIo } from "./socket/io";
import { messagingService, conversationRepository, orderTimerService } from "./di";
import { startOrderExpiryCron } from "./cron/orderExpiry.cron";

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = setupSocket(server, messagingService, conversationRepository);
    setIo(io);

    // Start cron jobs
    startOrderExpiryCron(orderTimerService);

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });

    // ── Global Error Handlers ─────────────────────────────────────────────────

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled Promise Rejection", { reason });
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
      process.exit(1);
    });

  } catch (error) {
    logger.error("Server failed to start", { error });
    process.exit(1);
  }
};

startServer();
