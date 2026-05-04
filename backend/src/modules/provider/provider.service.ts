import { ProviderApplicationModel } from "./providerApplication.model";

export class ProviderService {
  async applyProvider(userId: string, data: any) {
    return ProviderApplicationModel.create({
      userId,
      ...data,
    });
  }
}
