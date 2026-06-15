# AllServe-App → Migration Plan
## Module-Based → Talentra-Style Layer-Based Architecture

> **Goal**: Restructure your `backend/src/` to match the clean layer-based architecture your senior used in Talentra, fixing all 7 reviewer complaints in the process.
> 
> **Rule**: Do NOT touch `frontend/`. Everything here is `backend/src/` only.

---

## Current vs. Target Structure

```
CURRENT (module-based)                   TARGET (layer-based, like Talentra)
─────────────────────────────────────    ─────────────────────────────────────
src/                                     src/
├── app.ts                               ├── app.ts          (cleaned up)
├── server.ts                            ├── server.ts       (add process handlers)
├── container.ts          ← DELETE       ├── config/
├── config/                              ├── models/         ← NEW top-level
├── database/                            │   ├── user.model.ts
├── shared/                              │   ├── otp.model.ts
│   ├── constants/                       │   ├── token.model.ts
│   ├── enums/                           │   ├── provider.model.ts
│   ├── errors/                          │   └── ...all models here
│   ├── interfaces/                      ├── interfaces/     ← NEW top-level
│   ├── logger/                          │   ├── IBaseRepository.ts
│   ├── middleware/                      │   ├── auth/
│   └── utils/                           │   │   ├── IAuthService.ts
└── modules/                             │   │   └── IAuthRepository.ts
    ├── auth/                            │   ├── user/
    │   ├── auth.controller.ts           │   ├── provider/
    │   ├── auth.service.ts              │   ├── booking/
    │   ├── auth.repository.ts           │   ├── admin/
    │   ├── auth.interface.ts            │   └── ...one folder per domain
    │   ├── auth.model.ts                ├── repositories/   ← NEW top-level
    │   ├── auth.routes.ts               │   ├── base.repository.ts
    │   └── auth.types.ts                │   ├── auth.repository.ts
    └── ...11 more modules               │   └── ...one file per domain
                                         ├── services/       ← NEW top-level
                                         │   ├── auth.service.ts
                                         │   └── ...
                                         ├── controllers/    ← NEW top-level
                                         │   ├── auth/
                                         │   │   └── auth.controller.ts
                                         │   └── ...
                                         ├── routes/         ← NEW top-level
                                         │   ├── auth/
                                         │   │   └── auth.routes.ts
                                         │   └── ...
                                         ├── dto/            ← RENAME from types
                                         │   ├── auth/
                                         │   │   └── auth.dto.ts
                                         │   └── ...
                                         └── shared/         ← Keep, trimmed
                                             ├── constants/
                                             ├── enums/
                                             ├── errors/
                                             ├── logger/
                                             ├── middleware/
                                             └── utils/
```

---

## Step-by-Step Implementation

---

### STEP 1 — Create New Top-Level Folders

**Create these new empty directories** inside `backend/src/`:

```
src/interfaces/
src/interfaces/auth/
src/interfaces/user/
src/interfaces/provider/
src/interfaces/booking/
src/interfaces/slot/
src/interfaces/admin/
src/interfaces/category/
src/interfaces/service/
src/interfaces/messaging/
src/interfaces/service-request/
src/interfaces/provider-quote/
src/interfaces/home/

src/repositories/
src/services/
src/controllers/
src/controllers/auth/
src/controllers/user/
src/controllers/provider/
src/controllers/booking/
src/controllers/slot/
src/controllers/admin/
src/controllers/category/
src/controllers/service/
src/controllers/messaging/
src/controllers/service-request/
src/controllers/provider-quote/
src/controllers/home/

src/routes/
src/routes/auth/
src/routes/user/
src/routes/provider/
src/routes/booking/
src/routes/slot/
src/routes/admin/
src/routes/category/
src/routes/service/
src/routes/messaging/
src/routes/service-request/
src/routes/provider-quote/
src/routes/home/

src/models/
src/dto/
src/dto/auth/
src/dto/user/
src/dto/provider/
src/dto/booking/
src/dto/slot/
src/dto/admin/
src/dto/category/
src/dto/service/
src/dto/messaging/
src/dto/service-request/
src/dto/provider-quote/
```

---

### STEP 2 — Create `IBaseRepository` Interface

**File to create**: `src/interfaces/IBaseRepository.ts`

```ts
import { FilterQuery, UpdateQuery, PipelineStage } from "mongoose";

export interface IBaseRepository<T, TCreate = Partial<T>> {
  create(data: TCreate): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByEmail?(email: string): Promise<T | null>;
  findAll(query?: FilterQuery<T>, page?: number, limit?: number): Promise<T[]>;
  count(query?: FilterQuery<T>): Promise<number>;
  update(id: string, data: UpdateQuery<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  aggregate?<R = Record<string, unknown>>(pipeline: PipelineStage[]): Promise<R[]>;
}
```

> **Why**: This is the contract all repositories sign. It guarantees every repo has the same base methods.

---

### STEP 3 — Create `BaseRepository<T>` Class

**File to create**: `src/repositories/base.repository.ts`

```ts
import { Model, Document, FilterQuery, UpdateQuery, PipelineStage } from "mongoose";
import { IBaseRepository } from "../interfaces/IBaseRepository";

export abstract class BaseRepository<T extends Document, TCreate = Partial<T>>
  implements IBaseRepository<T, TCreate>
{
  constructor(protected readonly model: Model<T>) {}

  async create(data: TCreate): Promise<T> {
    return new this.model(data).save() as Promise<T>;
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findByEmail(email: string): Promise<T | null> {
    return this.model.findOne({ email } as FilterQuery<T>).exec();
  }

  async findAll(query: FilterQuery<T> = {}, page = 1, limit = 10): Promise<T[]> {
    return this.model
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async count(query: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(query).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async aggregate<R = Record<string, unknown>>(pipeline: PipelineStage[]): Promise<R[]> {
    return this.model.aggregate<R>(pipeline).exec();
  }
}
```

> **Why**: Every specific repository (`AuthRepository`, `UserRepository`, etc.) will `extend` this. They only need to add methods that are unique to their domain.

---

### STEP 4 — Move All Models to `src/models/`

**Move these files** (copy content, create in new location, then delete originals):

| From | To |
|------|----|
| `modules/auth/auth.model.ts` | `models/user.model.ts` |
| `modules/auth/otp.model.ts` | `models/otp.model.ts` |
| `modules/auth/token.model.ts` | `models/token.model.ts` |
| `modules/provider/providerAccount.model.ts` | `models/providerAccount.model.ts` |
| `modules/booking/booking.model.ts` | `models/booking.model.ts` |
| `modules/slot/slot.model.ts` | `models/slot.model.ts` |
| `modules/category/category.model.ts` | `models/category.model.ts` |
| `modules/service/service.model.ts` | `models/service.model.ts` |
| `modules/messaging/messaging.model.ts` | `models/messaging.model.ts` |
| `modules/service-request/serviceRequest.model.ts` | `models/serviceRequest.model.ts` |
| `modules/provider-quote/providerQuote.model.ts` | `models/providerQuote.model.ts` |

> After moving, update all import paths in repositories and services that referenced these models.

---

### STEP 5 — Move & Rename Types to `src/dto/`

**Move these files** (rename `*.types.ts` → `*.dto.ts`):

| From | To |
|------|----|
| `modules/auth/auth.types.ts` | `dto/auth/auth.dto.ts` |
| `modules/user/user.types.ts` | `dto/user/user.dto.ts` |
| `modules/provider/provider.types.ts` | `dto/provider/provider.dto.ts` |
| `modules/booking/booking.types.ts` | `dto/booking/booking.dto.ts` |
| `modules/slot/slot.types.ts` | `dto/slot/slot.dto.ts` |
| `modules/admin/` *(no types file — create one)* | `dto/admin/admin.dto.ts` |
| `modules/category/category.types.ts` | `dto/category/category.dto.ts` |
| `modules/service/service.types.ts` | `dto/service/service.dto.ts` |
| `modules/service-request/serviceRequest.types.ts` | `dto/service-request/serviceRequest.dto.ts` |
| `modules/provider-quote/providerQuote.types.ts` | `dto/provider-quote/providerQuote.dto.ts` |

---

### STEP 6 — Create All Interface Files (The Big One)

For **every domain**, create **two** separate interface files in `src/interfaces/<domain>/`:

#### Pattern (follow for all 12 domains):

**`src/interfaces/auth/IAuthRepository.ts`**
```ts
// Contains ONLY the interface for AuthRepository
// NO class implementation here
import { IBaseRepository } from "../IBaseRepository";
import { IUser } from "../../models/user.model";

export interface IAuthRepository extends IBaseRepository<IUser> {
  // Only auth-specific methods beyond base CRUD
  createOTP(email: string, otp: string, expiresAt: Date): Promise<void>;
  findOTP(email: string, otp: string): Promise<IOtpDoc | null>;
  deleteOTP(email: string): Promise<void>;
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findRefreshToken(token: string): Promise<ITokenDoc | null>;
  deleteRefreshToken(token: string): Promise<void>;
}
```

**`src/interfaces/auth/IAuthService.ts`**
```ts
// Contains ONLY the interface for AuthService
// NO class implementation here
import { SignupDto, LoginDto } from "../../dto/auth/auth.dto";
import { Role } from "../../shared/enums/role.enum";

export interface IAuthService {
  signup(dto: SignupDto): Promise<{ message: string }>;
  verifyOtp(email: string, otp: string, phone?: string, phoneOtp?: string): Promise<{ message: string }>;
  resendOtp(email?: string, phone?: string): Promise<{ message: string }>;
  login(dto: LoginDto, isOAuth?: boolean, expectedRole?: Role): Promise<{ user: IUserSafe; accessToken: string; refreshToken: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<{ message: string }>;
  refreshToken(token: string): Promise<{ accessToken: string }>;
  logout(token: string): Promise<void>;
}
```

**Repeat this pattern for all domains:**

| Domain | Files to create |
|--------|----------------|
| `auth` | `IAuthRepository.ts`, `IAuthService.ts` |
| `user` | `IUserRepository.ts`, `IUserService.ts` |
| `provider` | `IProviderRepository.ts`, `IProviderService.ts` |
| `booking` | `IBookingRepository.ts`, `IBookingService.ts` |
| `slot` | `ISlotRepository.ts`, `ISlotService.ts` |
| `admin` | `IAdminRepository.ts`, `IAdminService.ts` |
| `category` | `ICategoryRepository.ts`, `ICategoryService.ts` |
| `service` | `IServiceRepository.ts`, `IServiceService.ts` |
| `messaging` | `IMessagingRepository.ts`, `IMessagingService.ts` |
| `service-request` | `IServiceRequestRepository.ts`, `IServiceRequestService.ts` |
| `provider-quote` | `IProviderQuoteRepository.ts`, `IProviderQuoteService.ts` |
| `home` | `IHomeService.ts` *(no repo, uses others)* |

> **Move the interfaces currently sitting inside `*.repository.ts` files** into these new dedicated files.
> **Move the interfaces currently in `*.interface.ts` files** into these new dedicated files.
> Then **delete** the old `*.interface.ts` files from modules.

---

### STEP 7 — Rewrite All Repositories to Extend `BaseRepository`

**Move** each repository to `src/repositories/` and rewrite to extend `BaseRepository`.

**Pattern:**

```ts
// src/repositories/auth.repository.ts
import { BaseRepository } from "./base.repository";
import { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import { UserModel, IUser } from "../models/user.model";
import { OTPModel } from "../models/otp.model";
import { TokenModel } from "../models/token.model";

export class AuthRepository
  extends BaseRepository<IUser>   // ← extends base, gets create/findById/etc FREE
  implements IAuthRepository      // ← depends on interface
{
  constructor() {
    super(UserModel);   // ← pass the model to base
  }

  // Only implement what's NOT in BaseRepository:
  async createOTP(email: string, otp: string, expiresAt: Date) {
    await OTPModel.create({ email, otp, expiresAt });
  }

  async findOTP(email: string, otp: string) {
    return OTPModel.findOne({ email, otp }).exec();
  }

  async deleteOTP(email: string) {
    await OTPModel.deleteMany({ email });
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    await TokenModel.create({ userId, token, expiresAt });
  }

  async findRefreshToken(token: string) {
    return TokenModel.findOne({ token }).exec();
  }

  async deleteRefreshToken(token: string) {
    await TokenModel.deleteOne({ token });
  }
}
```

**Files to create in `src/repositories/`:**
- `base.repository.ts`
- `auth.repository.ts`
- `user.repository.ts`
- `provider.repository.ts`
- `providerAuth.repository.ts`
- `booking.repository.ts`
- `slot.repository.ts`
- `admin.repository.ts`
- `category.repository.ts`
- `service.repository.ts`
- `messaging.repository.ts`
- `serviceRequest.repository.ts`
- `providerQuote.repository.ts`

**Key fixes during this step:**
- Replace all `filter: any` with `FilterQuery<IModel>` from Mongoose
- Replace all `Promise<any>` return types with `Promise<IModel | null>`

---

### STEP 8 — Move Services to `src/services/`

**Move** each service file to `src/services/`. **Update imports** to point to new interface and model locations.

**Key fix**: Each service constructor must now accept the **interface**, not the concrete class:

```ts
// BEFORE (wrong DIP)
constructor(private repo: AuthRepository) {}

// AFTER (correct DIP)
constructor(private repo: IAuthRepository) {}
```

**Files to create in `src/services/`:**
- `auth.service.ts`
- `user.service.ts`
- `provider.service.ts`
- `providerAuth.service.ts`
- `booking.service.ts`
- `slot.service.ts`
- `admin.service.ts`
- `category.service.ts`
- `service.service.ts`
- `home.service.ts`
- `messaging.service.ts`
- `serviceRequest.service.ts`
- `providerQuote.service.ts`

**Key fix for `provider.service.ts`**: Replace all `(provider: any)` mapper functions with typed versions using the `IProviderAccount` interface. Example:
```ts
// BEFORE
const mapProviderListItem = (provider: any) => ({...})

// AFTER
const mapProviderListItem = (provider: IProviderAccount): ProviderListItemDto => ({...})
```

---

### STEP 9 — Move Controllers to `src/controllers/<domain>/`

**Move** each controller to its own subfolder. **Update** constructor types to accept service **interfaces**:

```ts
// BEFORE (DIP violation)
constructor(private readonly service: AuthService) {}

// AFTER (correct DIP — depends on interface)
constructor(private readonly service: IAuthService) {}
```

**Files to create:**
```
src/controllers/
├── auth/
│   ├── auth.controller.ts
│   └── providerAuth.controller.ts
├── user/
│   └── user.controller.ts
├── provider/
│   └── provider.controller.ts
├── booking/
│   └── booking.controller.ts
├── slot/
│   └── slot.controller.ts
├── admin/
│   └── admin.controller.ts
├── category/
│   └── category.controller.ts
├── service/
│   └── service.controller.ts
├── home/
│   └── home.controller.ts
├── messaging/
│   └── messaging.controller.ts
├── service-request/
│   └── serviceRequest.controller.ts
└── provider-quote/
    └── providerQuote.controller.ts
```

---

### STEP 10 — Move Routes to `src/routes/<domain>/`

**Move** each route file to a subfolder. Routes no longer import from `../../container` — they get their controller passed in, or import from a new DI setup.

```ts
// src/routes/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../../controllers/auth/auth.controller";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  router.post("/signup", controller.signup.bind(controller));
  router.post("/login", controller.login.bind(controller));
  // ...etc
  return router;
}
```

**Files to create in `src/routes/`:**
```
src/routes/
├── auth/
│   ├── auth.routes.ts
│   └── providerAuth.routes.ts
├── user/
│   └── user.routes.ts
├── provider/
│   └── provider.routes.ts
├── booking/
│   └── booking.routes.ts
├── slot/
│   └── slot.routes.ts
├── admin/
│   └── admin.routes.ts
├── category/
│   └── category.routes.ts
├── service/
│   └── service.routes.ts
├── home/
│   └── home.routes.ts
├── messaging/
│   └── messaging.routes.ts
├── service-request/
│   └── serviceRequest.routes.ts
└── provider-quote/
    └── providerQuote.routes.ts
```

---

### STEP 11 — Replace `container.ts` with a Clean DI File

**Delete**: `src/container.ts`

**Create**: `src/di.ts` (Dependency Injection — wires everything cleanly)

```ts
// src/di.ts
// All instantiation lives here. This is the ONLY place that uses `new`.

import { AuthRepository } from "./repositories/auth.repository";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth/auth.controller";
// ... import all

// ── Repositories ──────────────────────────────────────────────────
const authRepository = new AuthRepository();
const userRepository = new UserRepository();
// ...

// ── Services ──────────────────────────────────────────────────────
export const authService = new AuthService(authRepository);
export const userService = new UserService(userRepository);
// ...

// ── Controllers ───────────────────────────────────────────────────
export const authController = new AuthController(authService);
export const userController = new UserController(userService);
// ...
```

> This is still a manual DI file (not a DI framework), but it's now a clean, intentional wiring file — not a mix of instantiation AND exported instances.

---

### STEP 12 — Fix `app.ts`

**Rewrite** `app.ts` to only do 3 things:
1. Setup middleware
2. Mount routes
3. Register error handler

```ts
// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { requestLogger } from "./shared/middleware/requestLogger";
import { errorMiddleware } from "./shared/errors/errorMiddleware";
import { authController, userController, ... } from "./di";

// Import route factory functions
import { createAuthRouter } from "./routes/auth/auth.routes";
import { createUserRouter } from "./routes/user/user.routes";
// ...

const app = express();

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(cors({ ... }));
app.use(helmet());
app.use(requestLogger);

// ── Routes ────────────────────────────────────────────────────────
app.use("/api/v1/auth", createAuthRouter(authController));
app.use("/api/v1/user", createUserRouter(userController));
// ...

// ── Error Handler (MUST be last) ──────────────────────────────────
app.use(errorMiddleware);

export default app;
```

---

### STEP 13 — Fix `server.ts` (Global Error Handlers)

Add the missing process-level error handling:

```ts
// src/server.ts
import app from "./app";
import { env } from "./config/env";
import { logger } from "./shared/logger/logger";
import { connectDB } from "./database/connect";

connectDB();

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

// ── Global Error Handlers ──────────────────────────────────────
process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Promise Rejection", { reason });
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
  process.exit(1);
});
```

---

### STEP 14 — Fix `errorMiddleware.ts`

Replace the fragile `as { ... }` cast with proper `instanceof` checks:

```ts
// src/shared/errors/errorMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";
import { ZodError } from "zod";
import { StatusCodes } from "../constants/statusCodes";
import { Messages } from "../constants/messages";
import { logger } from "../logger/logger";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {

  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: err.errors.map((e) => e.message).join(", "),
    });
  }

  // Mongoose duplicate key
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue ?? {};
    const field = Object.keys(keyValue)[0] ?? "field";
    const value = keyValue[field];
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      message: `${field} "${value}" already exists.`,
    });
  }

  // Unknown error fallback
  logger.error("Unhandled error", { err });
  res.status(StatusCodes.INTERNAL_ERROR).json({
    success: false,
    message: Messages.SOMETHING_WENT_WRONG,
  });
};
```

---

### STEP 15 — Start Using `HttpErrors` Subclasses in Services

**Currently**: every service does `new AppError(message, StatusCodes.NOT_FOUND)` (raw)

**Should be**: `new NotFoundError(message)`, `new BadRequestError(message)`, etc.

Replace across all service files:

```ts
// BEFORE
throw new AppError(Messages.USER_NOT_FOUND, StatusCodes.NOT_FOUND);

// AFTER
import { NotFoundError } from "../../shared/errors/HttpErrors";
throw new NotFoundError(Messages.USER_NOT_FOUND);
```

---

### STEP 16 — Delete the Old `modules/` Folder

Once every file has been moved and all imports updated and tested:

```
DELETE: src/modules/   (entire folder)
DELETE: src/container.ts
```

The old `shared/interfaces/` folder can be renamed/kept as-is since `AuthRequest.ts` lives there — that's a shared Express interface, not a domain interface.

---

## Summary — What Gets Created vs Deleted

### 🆕 New Files to Create
| File | Purpose |
|------|---------|
| `src/interfaces/IBaseRepository.ts` | Generic repo contract |
| `src/repositories/base.repository.ts` | Generic repo implementation |
| `src/interfaces/<domain>/I<Domain>Repository.ts` | ×12 domain |
| `src/interfaces/<domain>/I<Domain>Service.ts` | ×12 domain |
| `src/repositories/<domain>.repository.ts` | ×13 repos |
| `src/services/<domain>.service.ts` | ×13 services |
| `src/controllers/<domain>/<domain>.controller.ts` | ×13 controllers |
| `src/routes/<domain>/<domain>.routes.ts` | ×13 routes |
| `src/models/*.model.ts` | ×11 models |
| `src/dto/<domain>/<domain>.dto.ts` | ×12 DTOs |
| `src/di.ts` | DI wiring (replaces container.ts) |

### ❌ Files to Delete After Migration
| File/Folder | Reason |
|-------------|--------|
| `src/modules/` (entire folder) | All contents moved to separate layers |
| `src/container.ts` | Replaced by `src/di.ts` |

### ✏️ Files to Update In-Place
| File | What Changes |
|------|-------------|
| `src/app.ts` | Clean route mounting |
| `src/server.ts` | Add `unhandledRejection` + `uncaughtException` |
| `src/shared/errors/errorMiddleware.ts` | Use `instanceof` instead of type cast |

---

## Implementation Order (To Avoid Breaking Things)

```
1 → Create interfaces/IBaseRepository.ts
2 → Create repositories/base.repository.ts
3 → Move models to src/models/
4 → Create all Interface files (interfaces/<domain>/)
5 → Create DTOs (src/dto/)
6 → Rewrite Repositories (extend BaseRepository)
7 → Move Services (update imports + fix DIP in constructor)
8 → Move Controllers (update imports + fix DIP in constructor)
9 → Move Routes (update imports)
10 → Create di.ts (replaces container.ts)
11 → Update app.ts
12 → Update server.ts
13 → Fix errorMiddleware.ts
14 → Replace AppError usages with HttpErrors subclasses in services
15 → Delete src/modules/ and src/container.ts
16 → Run TypeScript compiler to catch remaining import errors
```

> **Important**: Do NOT delete any old files until the new ones are fully working. Work copy-by-copy, module-by-module. Start with `auth` as it's the simplest full-stack example to validate the pattern.
