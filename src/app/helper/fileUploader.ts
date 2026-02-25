import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import config from "../../config";
import { Readable } from "stream";

// Use memory storage so files are kept in RAM as Buffer objects.
// This is required for serverless environments (e.g. Vercel) where the
// filesystem is read-only and /uploads directories are not writable.
const storage = multer.memoryStorage();

const upload = multer({ storage });

const uploadToCloudinary = async (file: Express.Multer.File) => {
  // Configuration
  cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret,
  });

  // Upload from the in-memory buffer using an upload stream
  return new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}` },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const readable = new Readable();
    readable.push(file.buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const fileUploader = {
  upload,
  uploadToCloudinary,
};
