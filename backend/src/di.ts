

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
import { ServiceRequestRepository }  from "./repositories/serviceRequest.repository";
import { ProviderQuoteRepository }   from "./repositories/providerQuote.repository";
import { ProviderScheduleRepository } from "./repositories/providerSchedule.repository";
import { ProviderLeaveRepository }    from "./repositories/providerLeave.repository";

// ── Services ──────────────────────────────────────────────────────────────────
import { AuthService }               from "./services/auth.service";
import { UserService }               from "./services/user.service";
import { ProviderService }           from "./services/provider.service";
import { ProviderAuthService }       from "./services/providerAuth.service";
import { CategoryService }           from "./services/category.service";
import { ServiceService }            from "./services/service.service";
import { AdminService }              from "./services/admin.service";
import { HomeService }               from "./services/home.service";
import { SlotService }               from "./services/slot.service";
import { BookingService }            from "./services/booking.service";
import { MessagingService }          from "./services/messaging.service";
import { ServiceRequestService }     from "./services/serviceRequest.service";
import { ProviderQuoteService }      from "./services/providerQuote.service";
import { ProviderStatusService }     from "./services/providerStatus.service";
import { ProviderScheduleService }   from "./services/providerSchedule.service";
import { ProviderLeaveService }      from "./services/providerLeave.service";

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
import { ServiceRequestController }  from "./controllers/service-request/serviceRequest.controller";
import { ProviderQuoteController }   from "./controllers/provider-quote/providerQuote.controller";
import { ProviderStatusController }  from "./controllers/provider-status/providerStatus.controller";
import { ProviderScheduleController } from "./controllers/provider-schedule/providerSchedule.controller";
import { ProviderLeaveController }   from "./controllers/provider-leave/providerLeave.controller";

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
const serviceRequestRepository  = new ServiceRequestRepository();
const providerQuoteRepository   = new ProviderQuoteRepository();
const providerScheduleRepository = new ProviderScheduleRepository();
const providerLeaveRepository    = new ProviderLeaveRepository();

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
export const serviceRequestService  = new ServiceRequestService(serviceRequestRepository);
export const providerQuoteService   = new ProviderQuoteService(providerQuoteRepository, serviceRequestRepository);
export const providerStatusService  = new ProviderStatusService(providerRepository);
export const providerScheduleService = new ProviderScheduleService(providerScheduleRepository, providerLeaveRepository);
export const providerLeaveService   = new ProviderLeaveService(providerLeaveRepository);

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
export const serviceRequestController  = new ServiceRequestController(serviceRequestService);
export const providerQuoteController   = new ProviderQuoteController(providerQuoteService);
export const providerStatusController  = new ProviderStatusController(providerStatusService);
export const providerScheduleController = new ProviderScheduleController(providerScheduleService);
export const providerLeaveController   = new ProviderLeaveController(providerLeaveService);

// Exported for socket.ts which needs direct repo access
export { conversationRepository };
