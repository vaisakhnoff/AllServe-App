import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "./config/passport";
import { env } from "./config/env";
import { requestLogger } from "./shared/middleware/requestLogger";
import { errorMiddleware } from "./shared/errors/errorMiddleware";

import {
  authController,
  providerAuthController,
  userController,
  providerController,
  adminController,
  categoryController,
  serviceController,
  homeController,
  slotController,
  bookingController,
  messagingController,
  serviceRequestController,
  providerQuoteController,
  providerStatusController,
  providerScheduleController,
  providerLeaveController,
  serviceOrderController2,
  quotationNewController,
  invoiceNewController,
} from "./di";


import { createAuthRouter }           from "./routes/auth/auth.routes";
import { createProviderAuthRouter }   from "./routes/auth/providerAuth.routes";
import { createUserRouter }           from "./routes/user/user.routes";
import { createProviderRouter }       from "./routes/provider/provider.routes";
import { createAdminRouter }          from "./routes/admin/admin.routes";
import { createCategoryRouter }       from "./routes/category/category.routes";
import { createServiceRouter }        from "./routes/service/service.routes";
import { createHomeRouter }           from "./routes/home/home.routes";
import { createSlotRouter }           from "./routes/slot/slot.routes";
import { createBookingRouter }        from "./routes/booking/booking.routes";
import { createMessagingRouter }      from "./routes/messaging/messaging.routes";
import { createServiceRequestRouter } from "./routes/service-request/serviceRequest.routes";
import { createProviderQuoteRouter }  from "./routes/provider-quote/providerQuote.routes";
import { createProviderStatusRouter } from "./routes/provider-status/providerStatus.routes";
import { createProviderScheduleRouter } from "./routes/provider-schedule/providerSchedule.routes";
import { createProviderLeaveRouter }  from "./routes/provider-leave/providerLeave.routes";
import { createServiceOrderRouter }   from "./routes/service-order/serviceOrder.routes";
import { createQuotationRouter }      from "./routes/quotation/quotation.routes";
import { createInvoiceRouter }        from "./routes/invoice/invoice.routes";

const app = express();


const allowedOrigins = [
  env.FRONTEND_URL,
  ...(env.CORS_ORIGINS?.split(",") ?? []),
  "http://localhost:3000",
]
  .filter(Boolean)
  .map((origin) => origin!.trim());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 10000,
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(helmet());
app.use(passport.initialize());
app.use("/api", limiter);
app.use(requestLogger);



app.use("/api/v1/auth",             createAuthRouter(authController));
app.use("/api/v1/provider-auth",    createProviderAuthRouter(providerAuthController));
app.use("/api/v1/user",             createUserRouter(userController));
app.use("/api/v1/provider",         createProviderRouter(providerController));
app.use("/api/v1/providers",        createProviderRouter(providerController));   // alias
app.use("/api/v1/admin",            createAdminRouter(adminController, serviceController, bookingController));
app.use("/api/v1/category",         createCategoryRouter(categoryController));
app.use("/api/v1/categories",       createCategoryRouter(categoryController));   // alias
app.use("/api/v1/home",             createHomeRouter(homeController));
app.use("/api/v1/services",         createServiceRouter(serviceController));
app.use("/api/v1/slots",            createSlotRouter(slotController));
app.use("/api/v1/bookings",         createBookingRouter(bookingController));
app.use("/api/v1/messaging",        createMessagingRouter(messagingController));
app.use("/api/v1/service-requests", createServiceRequestRouter(serviceRequestController));
app.use("/api/v1/provider-quotes",  createProviderQuoteRouter(providerQuoteController));
app.use("/api/v1/provider-status",  createProviderStatusRouter(providerStatusController));
app.use("/api/v1/provider-schedule", createProviderScheduleRouter(providerScheduleController));
app.use("/api/v1/provider-leave",   createProviderLeaveRouter(providerLeaveController));
app.use("/api/v1/orders",           createServiceOrderRouter(serviceOrderController2));
app.use("/api/v1/quotations",       createQuotationRouter(quotationNewController));
app.use("/api/v1/invoices",         createInvoiceRouter(invoiceNewController));

app.get("/", (_req, res) => {
  res.json({ message: "API running" });
});



app.use(errorMiddleware);

export default app;
