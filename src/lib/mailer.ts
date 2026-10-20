import nodemailer from "nodemailer";

// One place that sends email (contact messages, job applications, password resets),
// using the SMTP settings in the server environment.

export interface Mail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export function mailConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/** On a developer's computer without SMTP, reset emails are printed to the terminal instead. */
export function mailToConsole(): boolean {
  return !mailConfigured() && process.env.NODE_ENV !== "production";
}

/** Sends an email. Returns false (never throws) when SMTP isn't set up or sending fails. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;
  try {
    const port = Number(SMTP_PORT || 587);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({ from: SMTP_FROM || SMTP_USER, ...mail });
    return true;
  } catch (err) {
    console.error(`Email "${mail.subject}" failed.`, err);
    return false;
  }
}
