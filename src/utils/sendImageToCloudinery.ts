import { UploadApiResponse, v2 as cloudinary } from "cloudinary";

import fs from "fs";
import { promises as fsPromises } from "fs";
import multer from "multer";
import config from "@/core/config";

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});
console.log({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});
export const sendImageToCloudinary = (
  imageName: string,
  path: string,
  folderName?: string | null,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!path) return reject(new Error("File path missing"));
    console.log("Uploading to Cloudinary:", { imageName, path, folderName });
    cloudinary.uploader.upload(
      path,
      {
        public_id: imageName,
        folder: folderName || config.cloudinary.imageFolderName,
      },
      async (error, result) => {
        console.log({ error, result });
        if (error) return reject(error);

        try {
          // ✅ upload successful → now delete local file
          await fsPromises.unlink(path);
        } catch (e) {
          console.error("Failed to delete local file:", e);
        }

        resolve(result as UploadApiResponse);
      },
    );
  });
};
export const sendImagesToCloudinary = async (
  images: Express.Multer.File[], // Expecting multiple files
  folderName: string | undefined | null,
): Promise<string[]> => {
  try {
    const uploadPromises = images.map((image) => {
      return new Promise<string>((resolve, reject) => {
        const resourceType = image.mimetype.startsWith("image/")
          ? "image"
          : "video";
        cloudinary.uploader.upload(
          image.path,
          {
            public_id: image.filename, // Unique filename for Cloudinary
            folder: folderName || config.cloudinary.imageFolderName,
            resource_type: resourceType,
          },
          (error, result) => {
            // Remove file from local storage after upload
            fs.unlink(image.path, (err) => {
              if (err) {
                console.error("Failed to delete local file:", err);
              }
            });

            if (error) {
              return reject(error);
            }

            resolve(result?.secure_url || "");
          },
        );
      });
    });

    // Wait for all images to upload
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload images.");
  }
};
const isProd = process.env.NODE_ENV === "production";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = isProd ? "/tmp" : process.cwd() + "/uploads";
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.fieldname + "-" + uniqueSuffix;
    cb(null, filename);
  },
});

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  },
});

export default cloudinary;
