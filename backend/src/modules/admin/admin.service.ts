import { ProviderApplicationModel } from "../provider/providerApplication.model";
import { UserModel } from "../auth/auth.model";
import { AppError } from "../../shared/errors/AppError";

export class AdminService {
  async viewApplications() {
    return ProviderApplicationModel.find().populate("userId", "name email");
  }

  async approveProvider(appId: string) {
    const app = await ProviderApplicationModel.findById(appId);
    if (!app) throw new AppError("Application not found", 404);

    app.status = "approved";
    await app.save();

    await UserModel.findByIdAndUpdate(app.userId, {
      role: "provider",
    });

    return app;
  }
}
