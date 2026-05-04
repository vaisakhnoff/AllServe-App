import express from "express";
import cors from "cors";
import helmet from 'helmet';
import { errorMiddleware } from "./shared/errors/errorMiddleware";
import { requestLogger } from "./shared/middleware/requestLogger";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import providerRoutes from "./modules/provider/provider.routes";
import adminRoutes from "./modules/admin/admin.routes";



const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(requestLogger)


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/provider", providerRoutes);
app.use("/api/v1/admin", adminRoutes);


app.get("/",(req,res)=>{
      res.json({ message: "API running" });

})

app.use(errorMiddleware);



export default app