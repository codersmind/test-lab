import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface SendEmailOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmailViaSES(options: SendEmailOptions) {
  const { from, to, cc = [], bcc = [], subject, html, text } = options;

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: to,
      CcAddresses: cc.length ? cc : undefined,
      BccAddresses: bcc.length ? bcc : undefined,
    },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text || html.replace(/<[^>]*>/g, ""), Charset: "UTF-8" },
      },
    },
  });

  const result = await sesClient.send(command);
  return { messageId: result.MessageId };
}

export async function sendRawEmailViaSES(
  from: string,
  to: string[],
  rawMessage: string
) {
  const command = new SendRawEmailCommand({
    Source: from,
    Destinations: to,
    RawMessage: { Data: Buffer.from(rawMessage) },
  });

  const result = await sesClient.send(command);
  return { messageId: result.MessageId };
}
