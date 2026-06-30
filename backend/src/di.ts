

// ── Repositories ──────────────────────────────────────────────────────────────
import { AuthRepository }            from "./repositories/auth.repository";
import { UserRepository }            from "./repositories/user.repository";
import { ProviderRepository }        from "./repositories/provider.repository";
import { CategoryRepository }        from "./repositories/category.repository";
import { ServiceRepository }         from "./repositories/service.repository";
import { AdminRepository }           from "./repositories/admin.repository";
import { SlotRepository }            from "./repositories/slot.repository";
import { BookingRepository }         from "./repositories/booking.repository";
import { ConversationRepository, MessageRepository } from "./repositories/messaging.repository";
import { ProviderScheduleRepository } from "./repositories/providerSchedule.repository";
import { ProviderLeaveRepository }    from "./repositories/providerLeave.repository";
import { ServiceOrderRepository }     from "./repositories/serviceOrder.repository";
import { QuotationRepository }        from "./repositories/quotation.repository";
import { InvoiceRepository }          from "./repositories/invoice.repository";

// ── Services ──────────────────────────────────────────────────────────────────
import { AuthService }               from "./services/auth/auth.service";
import { UserService }               from "./services/user/user.service";
import { ProviderService }           from "./services/provider/provider.service";
import { ProviderAuthService }       from "./services/provider/providerAuth.service";
import { CategoryService }           from "./services/category/category.service";
import { ServiceService }            from "./services/service/service.service";
import { AdminService }              from "./services/admin/admin.service";
import { HomeService }               from "./services/home/home.service";
import { SlotService }               from "./services/slot/slot.service";
import { BookingService }            from "./services/booking/booking.service";
import { MessagingService }          from "./services/messaging/messaging.service";
import { ProviderStatusService }     from "./services/provider/providerStatus.service";
import { ProviderScheduleService }   from "./services/provider/providerSchedule.service";
import { ProviderLeaveService }      from "./services/provider/providerLeave.service";
import { DirectRequestService }      from "./services/service-order/directRequest.service";
import { InspectionRequestService }  from "./services/service-order/inspectionRequest.service";
import { CustomRequestService }      from "./services/service-order/customRequest.service";
import { CustomOrderLifecycleService } from "./services/service-order/customOrderLifecycle.service";
import { ServiceOrderQueryService }  from "./services/service-order/serviceOrderQuery.service";
import { QuotationService }          from "./services/quotation/quotation.service";
import { InvoiceService }            from "./services/invoice/invoice.service";
import { OrderTimerService }         from "./services/service-order/orderTimer.service";

// ── Controllers ───────────────────────────────────────────────────────────────
import { AuthController }            from "./controllers/auth/auth.controller";
import { ProviderAuthController }    from "./controllers/auth/providerAuth.controller";
import { UserController }            from "./controllers/user/user.controller";
import { ProviderController }        from "./controllers/provider/provider.controller";
import { AdminController }           from "./controllers/admin/admin.controller";
import { CategoryController }        from "./controllers/category/category.controller";
import { ServiceController }         from "./controllers/service/service.controller";
import { HomeController }            from "./controllers/home/home.controller";
import { SlotController }            from "./controllers/slot/slot.controller";
import { BookingController }         from "./controllers/booking/booking.controller";
import { MessagingController }       from "./controllers/messaging/messaging.controller";
import { ProviderStatusController }  from "./controllers/provider-status/providerStatus.controller";
import { ProviderScheduleController } from "./controllers/provider-schedule/providerSchedule.controller";
import { ProviderLeaveController }   from "./controllers/provider-leave/providerLeave.controller";
import { ServiceOrderController }    from "./controllers/service-order/serviceOrder.controller";
import { QuotationController }       from "./controllers/quotation/quotation.controller";
import { InvoiceController }         from "./controllers/invoice/invoice.controller";

// =============================================================================
// 1. Repositories
// =============================================================================

const authRepository            = new AuthRepository();
const userRepository            = new UserRepository();
const providerRepository        = new ProviderRepository();
const categoryRepository        = new CategoryRepository();
const serviceRepository         = new ServiceRepository();
const adminRepository           = new AdminRepository();
const slotRepository            = new SlotRepository();
const bookingRepository         = new BookingRepository();
const conversationRepository    = new ConversationRepository();
const messageRepository         = new MessageRepository();
const providerScheduleRepository = new ProviderScheduleRepository();
const providerLeaveRepository    = new ProviderLeaveRepository();
const serviceOrderRepository     = new ServiceOrderRepository();
const quotationRepository        = new QuotationRepository();
const invoiceRepository          = new InvoiceRepository();

// =============================================================================
// 2. Services - inject repository interfaces
// =============================================================================

export const authService            = new AuthService(authRepository);
export const userService            = new UserService(userRepository);
export const providerAuthService    = new ProviderAuthService(providerRepository);
export const categoryService        = new CategoryService(categoryRepository);
export const serviceService         = new ServiceService(serviceRepository);
export const adminService           = new AdminService(adminRepository);
export const slotService            = new SlotService(slotRepository);
export const bookingService         = new BookingService(bookingRepository, slotRepository);
export const messagingService       = new MessagingService(conversationRepository, messageRepository);
export const providerStatusService  = new ProviderStatusService(providerRepository);
export const providerScheduleService = new ProviderScheduleService(providerScheduleRepository, providerLeaveRepository);
export const providerLeaveService   = new ProviderLeaveService(providerLeaveRepository);
export const directRequestService   = new DirectRequestService(serviceOrderRepository, providerRepository);
export const inspectionRequestService = new InspectionRequestService(serviceOrderRepository);
export const customRequestService   = new CustomRequestService(serviceOrderRepository);
export const customOrderLifecycleService = new CustomOrderLifecycleService(serviceOrderRepository, providerRepository);
export const serviceOrderQueryService = new ServiceOrderQueryService(serviceOrderRepository);
export const quotationNewService    = new QuotationService(quotationRepository, serviceOrderRepository);
export const invoiceNewService      = new InvoiceService(invoiceRepository, serviceOrderRepository);
export const orderTimerService      = new OrderTimerService(serviceOrderRepository);

// Services with cross-service dependencies
export const providerService = new ProviderService(providerRepository, serviceRepository);
export const homeService     = new HomeService(categoryService, providerService);

// =============================================================================
// 3. Controllers - inject service interfaces
// =============================================================================

export const authController            = new AuthController(authService);
export const providerAuthController    = new ProviderAuthController(providerAuthService);
export const userController            = new UserController(userService);
export const providerController        = new ProviderController(providerService);
export const categoryController        = new CategoryController(categoryService);
export const serviceController         = new ServiceController(serviceService, providerRepository);
export const adminController           = new AdminController(adminService);
export const homeController            = new HomeController(homeService);
export const slotController            = new SlotController(slotService);
export const bookingController         = new BookingController(bookingService);
export const messagingController       = new MessagingController(messagingService);
export const providerStatusController  = new ProviderStatusController(providerStatusService);
export const providerScheduleController = new ProviderScheduleController(providerScheduleService);
export const providerLeaveController   = new ProviderLeaveController(providerLeaveService);
export const serviceOrderController2   = new ServiceOrderController(directRequestService, inspectionRequestService, customRequestService, customOrderLifecycleService, serviceOrderQueryService);
export const quotationNewController    = new QuotationController(quotationNewService);
export const invoiceNewController      = new InvoiceController(invoiceNewService);

// Exported for socket.ts which needs direct repo access
export { conversationRepository };
