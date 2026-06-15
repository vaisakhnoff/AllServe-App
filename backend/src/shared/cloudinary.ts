import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const uploadImageToCloudinary = async (file: { mimetype: string; buffer: Buffer }, folder = "allserve/profile-images") => {
  const payload = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  return cloudinary.uploader.upload(payload, {
    folder,
    resource_type: "image",
    quality: "auto",
    fetch_format: "auto",
  });
};

export { cloudinary };