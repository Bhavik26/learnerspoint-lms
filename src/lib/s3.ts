import { S3Client } from "@aws-sdk/client-s3";

const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || "mock-access-key-id";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || "mock-secret-access-key";
const endpoint = process.env.R2_ENDPOINT || undefined;
const region = process.env.AWS_REGION || "us-east-1";

export const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "learnerspoint-private-vault";
