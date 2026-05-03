import app from "./app";

import {env} from "./config/env"
import { connectDB } from "./database/db";


const PORT = env.PORT

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start", error);
    process.exit(1);
  }
};

startServer();