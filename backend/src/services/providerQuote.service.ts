import { IProviderQuoteRepository } from "../interfaces/provider-quote/IProviderQuoteRepository";
import { IServiceRequestRepository } from "../interfaces/service-request/IServiceRequestRepository";
import { IProviderQuoteService, ProviderQuoteListResult, ProviderQuoteStats, AcceptQuoteResult } from "../interfaces/provider-quote/IProviderQuoteService";
import { CreateProviderQuoteDto, UpdateProviderQuoteDto } from "../dto/provider-quote/providerQuote.dto";
import { IProviderQuote } from "../models/providerQuote.model";
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from "../shared/errors/HttpErrors";

export class ProviderQuoteService implements IProviderQuoteService {
  constructor(
    private readonly repo: IProviderQuoteRepository,
    private readonly requestRepo: IServiceRequestRepository
  ) {}

  async submitQuote(providerId: string, dto: CreateProviderQuoteDto): Promise<IProviderQuote | null> {
    const request = await this.requestRepo.findById(dto.serviceRequestId);
    if (!request) throw new NotFoundError("Service request not found");
    if (!["open", "receiving_quotes"].includes(request.status)) {
      throw new BadRequestError("This request is no longer accepting quotes");
    }
    const existing = await this.repo.findExisting(dto.serviceRequestId, providerId);
    if (existing) throw new ConflictError("You have already submitted a quote");

    const quote = await this.repo.create({
      ...dto,
      providerId: providerId as unknown as IProviderQuote["providerId"],
      serviceRequestId: dto.serviceRequestId as unknown as IProviderQuote["serviceRequestId"],
    });

    await this.requestRepo.incrementQuoteCount(dto.serviceRequestId);
    if (request.status === "open") {
      await this.requestRepo.updateStatus(dto.serviceRequestId, "receiving_quotes");
    }
    return this.repo.findById(String(quote._id));
  }

  async updateQuote(quoteId: string, providerId: string, dto: UpdateProviderQuoteDto): Promise<IProviderQuote | null> {
    const existing = await this.repo.findById(quoteId);
    if (!existing) throw new NotFoundError("Quote not found");
    if (existing.status !== "pending") throw new BadRequestError("Cannot edit a non-pending quote");
    return this.repo.updateQuote(quoteId, providerId, dto as Partial<IProviderQuote>);
  }

  async withdrawQuote(quoteId: string, providerId: string): Promise<{ message: string }> {
    const quote = await this.repo.findById(quoteId);
    if (!quote) throw new NotFoundError("Quote not found");
    const pid = (quote.providerId as unknown as { _id?: unknown })._id || quote.providerId;
    if (String(pid) !== providerId) throw new ForbiddenError("Unauthorized");
    if (quote.status !== "pending") throw new BadRequestError("Cannot withdraw this quote");
    await this.repo.updateStatus(quoteId, "withdrawn");
    await this.requestRepo.decrementQuoteCount(String(quote.serviceRequestId));
    return { message: "Quote withdrawn" };
  }

  async getQuotesForRequest(serviceRequestId: string): Promise<IProviderQuote[]> {
    return this.repo.findByRequestId(serviceRequestId);
  }

  async getProviderQuotes(providerId: string, page?: number, limit?: number): Promise<ProviderQuoteListResult> {
    return this.repo.findByProvider(providerId, page, limit);
  }

  async acceptQuote(quoteId: string, userId: string): Promise<AcceptQuoteResult> {
    const quote = await this.repo.findById(quoteId);
    if (!quote) throw new NotFoundError("Quote not found");

    const request = await this.requestRepo.findById(String(quote.serviceRequestId));
    if (!request) throw new NotFoundError("Service request not found");
    const uid = (request.userId as unknown as { _id?: unknown })._id || request.userId;
    if (String(uid) !== userId) throw new ForbiddenError("Unauthorized");
    if (quote.status !== "pending") throw new BadRequestError("Quote is no longer pending");

    await this.repo.updateStatus(quoteId, "accepted");
    await this.repo.rejectAllExcept(String(quote.serviceRequestId), quoteId);

    // Create a Service Order so it shows in provider bookings with full lifecycle
    const { ServiceOrderModel } = await import("../models/serviceOrder.model");
    const { nanoid } = await import("nanoid");

    const order = await ServiceOrderModel.create({
      orderId: `ORD-${nanoid(8).toUpperCase()}`,
      customerId: request.userId,
      providerId: quote.providerId,
      categoryId: request.categoryId,
      deliveryModel: "custom",
      subMode: "service_request",
      status: "quotation_accepted",
      statusHistory: [
        { status: "broadcast_open", at: request.createdAt },
        { status: "quotation_accepted", at: new Date(), note: "Quote accepted from service request" },
      ],
      title: request.title,
      description: request.description,
      images: request.images || [],
      address: request.address,
      budget: quote.price,
      platformFee: 0,
      platformFeeStatus: "paid",
      quoteCount: request.quoteCount || 1,
    });

    await this.requestRepo.updateStatus(String(request._id), "booking_created", {
      selectedQuoteId: quote._id,
      selectedProviderId: quote.providerId as unknown as IProviderQuote["providerId"],
      bookingId: order._id,
    } as never);

    return { quote, booking: order };
  }

  async getProviderStats(providerId: string): Promise<ProviderQuoteStats> {
    const [total, accepted, pending] = await Promise.all([
      this.repo.countByProvider(providerId),
      this.repo.countByProvider(providerId, "accepted"),
      this.repo.countByProvider(providerId, "pending"),
    ]);
    return { total, accepted, pending, acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0 };
  }
}
