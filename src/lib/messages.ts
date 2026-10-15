import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";

// Contact-form messages: always saved to a JSON file (read in /admin → Messages),
// and also emailed when SMTP settings are present in the environment.

export interface ContactMessage {
  id: string;
  receivedAt: string;
  name: string;
  email: string;
  phone: string;
  sgxNumber: string;
  topic: string;
  message: string;
}

const KEEP = 500;

function messagesFile(): string {
  if (process.env.MESSAGES_FILE) return process.env.MESSAGES_FILE;
  const content = process.env.CONTENT_FILE;
  return content ? path.join(path.dirname(content), "messages.json") : path.join(process.cwd(), "data", "messages.json");
}

export async function readMessages(): Promise<ContactMessage[]> {
  try {
    return JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ messagesFile(), "utf8")) as ContactMessage[];
  } catch {
    return [];
  }
}

async function writeMessages(list: ContactMessage[]): Promise<void> {
  const file = messagesFile();
  await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(list, null, 2), "utf8");
  await fs.rename(/*turbopackIgnore: true*/ tmp, file);
}

export async function saveMessage(msg: Omit<ContactMessage, "id" | "receivedAt">): Promise<ContactMessage> {
  const full: ContactMessage = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), ...msg };
  const list = await readMessages();
  await writeMessages([full, ...list].slice(0, KEEP));
  return full;
}

export async function deleteMessage(id: string): Promise<void> {
  const list = await readMessages();
  await writeMessages(list.filter((m) => m.id !== id));
}

/** Emails the message if SMTP is configured. Returns false (without throwing) when it isn't or sending fails. */
export async function emailMessage(msg: ContactMessage): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;
  try {
    const port = Number(SMTP_PORT || 587);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: CONTACT_TO || "info@sgxpressja.com",
      replyTo: `${msg.name} <${msg.email}>`,
      subject: `Website message: ${msg.topic} from ${msg.name}`,
      text: [
        `Name: ${msg.name}`,
        `Email: ${msg.email}`,
        `Phone: ${msg.phone || "—"}`,
        `SGX number: ${msg.sgxNumber || "—"}`,
        `Topic: ${msg.topic}`,
        "",
        msg.message,
        "",
        `Received ${msg.receivedAt}. Also saved in the website admin under Messages.`,
      ].join("\n"),
    });
    return true;
  } catch (err) {
    console.error("Contact email failed; the message is still saved in admin.", err);
    return false;
  }
}
