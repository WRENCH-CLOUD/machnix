//lib\supabase\storage\get-url.ts
import { GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { client } from "../storage/aws-helper.js";

export async function getUrl(bucket: string, path: string, expiresIn = 60) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: path,
  });
  return await getSignedUrl(client, command, { expiresIn });
}   
