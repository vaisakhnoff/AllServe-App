import express from "express";
import cors from "cors";
import helmet from 'helmet';
import { errorMiddleware } from "./shared/errors/errorMiddleware";
import { requestLogger } from "./shared/middleware/requestLogger";




const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());

app.use(requestLogger)

app.get("/",(req,res)=>{
      res.json({ message: "API running" });

})

app.use(errorMiddleware);



export default app