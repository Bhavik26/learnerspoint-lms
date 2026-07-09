import { S3Client } from "@aws-sdk/client-s3";

const globalForAws = globalThis as unknown as {
  s3Client: S3Client | undefined;
};

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "us-east-1";

if (!accessKeyId || !secretAccessKey) {
  console.warn(
    "AWS Credentials not configured in env. S3 streaming integrations will use sandbox fallback modes. Define AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  );
}

export const s3Client =
  globalForAws.s3Client ??
  new S3Client({
    region,
    credentials: {
      accessKeyId: accessKeyId || "mock-access-key-id",
      secretAccessKey: secretAccessKey || "mock-secret-access-key",
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForAws.s3Client = s3Client;
}

export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "learnerspoint-private-bucket";
