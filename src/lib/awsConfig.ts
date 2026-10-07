// src/lib/awsConfig.ts
// Shared region + credentials for every server-side AWS client.
//
// Credential lookup order:
//   1. APP_AWS_ACCESS_KEY_ID / APP_AWS_SECRET_ACCESS_KEY — explicit keys under names
//      Amplify allows (it rejects env vars starting with "AWS_").
//   2. Otherwise `credentials` is left undefined so the SDK's default chain runs:
//      AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from .env.local when developing
//      locally, or the Amplify compute role when deployed.
//
// Region: APP_AWS_REGION (settable on Amplify) → AWS_REGION → us-east-2.

export const AWS_REGION =
  process.env.APP_AWS_REGION || process.env.AWS_REGION || 'us-east-2';

export function awsClientConfig(): {
  region: string;
  credentials?: { accessKeyId: string; secretAccessKey: string };
} {
  const accessKeyId = process.env.APP_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.APP_AWS_SECRET_ACCESS_KEY;
  if (accessKeyId && secretAccessKey) {
    return { region: AWS_REGION, credentials: { accessKeyId, secretAccessKey } };
  }
  return { region: AWS_REGION };
}
