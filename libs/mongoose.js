import mongoose from "mongoose";
import User from "@/models/User";

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
    );
  }
  return mongoose
    .connect(process.env.MONGODB_URI, {
      // Fail-fast en serverless: sin estos timeouts, un Atlas inalcanzable
      // (cluster pausado, IP no permitida) cuelga la función hasta el max
      // duration (~5 min) y la tumba con unhandledRejection (visto en prod).
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    })
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
