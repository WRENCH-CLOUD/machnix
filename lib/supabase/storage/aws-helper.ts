// lib/supabase/storage/aws-helper.ts
import { S3Client } from "@aws-sdk/client-s3";

export const client = new S3Client({
  forcePathStyle: true,
  region: process.env.SUPABASE_REGION,
  endpoint: process.env.SUPABASE_S3_ENDPOINT, // e.g. https://<project-ref>.supabase.co/storage/v1/s3
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY!,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY!,
  },
});
