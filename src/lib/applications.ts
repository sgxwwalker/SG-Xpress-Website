import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { dataPath, readJson, writeJson } from "./data-files";

// Job applications. Details go in applications.json and CVs in an "applications" folder,
// both next to content.json and outside the public website. Only logged-in staff can open them.

import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "./applications-shared";

export { APPLICATION_STATUSES, type Application, type ApplicationStatus };

export const MAX_CV_BYTES = 5 * 1024 * 1024;
const KEEP = 1000;
const listFile = () => dataPath("applications.json");
const cvDir = () => dataPath("applications");

const CV_TYPES: Record<string, { type: string; magic: number[] }> = {
  ".pdf": { type: "application/pdf", magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  ".docx": { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: [0x50, 0x4b] }, // zip
  ".doc": { type: "application/msword", magic: [0xd0, 0xcf, 0x11, 0xe0] }, // OLE
};

/** Checks a CV by extension, size and file signature (not just the name). Returns an error message or null. */
export function checkCv(fileName: string, bytes: Uint8Array): string | null {
  const ext = path.extname(fileName).toLowerCase();
  const kind = CV_TYPES[ext];
  if (!kind) return "Please upload your CV as a PDF or Word document (.pdf, .doc or .docx).";
  if (bytes.length === 0) return "Please attach your CV.";
  if (bytes.length > MAX_CV_BYTES) return "Your CV is larger than 5 MB. Please upload a smaller file.";
  if (!kind.magic.every((b, i) => bytes[i] === b)) return "That file doesn't look like a real PDF or Word document.";
  return null;
}

export async function readApplications(): Promise<Application[]> {
  return readJson<Application[]>(listFile(), []);
}

export async function saveApplication(
  input: Omit<Application, "id" | "receivedAt" | "cv" | "status">,
  cv: { fileName: string; bytes: Uint8Array },
): Promise<Application> {
  const id = crypto.randomUUID();
  const ext = path.extname(cv.fileName).toLowerCase();
  const storedName = `${id}${ext}`;
  await fs.mkdir(/*turbopackIgnore: true*/ cvDir(), { recursive: true });
  await fs.writeFile(/*turbopackIgnore: true*/ path.join(cvDir(), storedName), cv.bytes);
  const app: Application = {
    id,
    receivedAt: new Date().toISOString(),
    ...input,
    cv: { fileName: path.basename(cv.fileName).slice(0, 120), storedName, size: cv.bytes.length, type: CV_TYPES[ext].type },
    status: "New",
  };
  const list = await readApplications();
  const kept = [app, ...list];
  // Drop the oldest beyond the limit, CVs included.
  for (const old of kept.slice(KEEP)) await fs.rm(/*turbopackIgnore: true*/ path.join(cvDir(), old.cv.storedName), { force: true });
  await writeJson(listFile(), kept.slice(0, KEEP));
  return app;
}

export async function setApplicationStatus(id: string, status: ApplicationStatus): Promise<Application | null> {
  const list = await readApplications();
  const app = list.find((a) => a.id === id);
  if (!app) return null;
  app.status = status;
  await writeJson(listFile(), list);
  return app;
}

export async function deleteApplication(id: string): Promise<Application | null> {
  const list = await readApplications();
  const app = list.find((a) => a.id === id);
  if (!app) return null;
  await fs.rm(/*turbopackIgnore: true*/ path.join(cvDir(), app.cv.storedName), { force: true });
  await writeJson(listFile(), list.filter((a) => a.id !== id));
  return app;
}

export async function readCv(id: string): Promise<{ app: Application; bytes: Buffer } | null> {
  const app = (await readApplications()).find((a) => a.id === id);
  if (!app) return null;
  try {
    return { app, bytes: await fs.readFile(/*turbopackIgnore: true*/ path.join(cvDir(), app.cv.storedName)) };
  } catch {
    return null;
  }
}

/** Emails the application (CV attached) when SMTP is configured. Never throws. */
export async function emailApplication(app: Application, cvBytes: Uint8Array): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, CONTACT_TO, CAREERS_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;
  try {
    const port = Number(SMTP_PORT || 587);
    const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
    await transport.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: CAREERS_TO || CONTACT_TO || "info@sgxpressja.com",
      replyTo: `${app.name} <${app.email}>`,
      subject: `Job application: ${app.jobTitle} from ${app.name}`,
      text: [
        `Position: ${app.jobTitle}`,
        `Name: ${app.name}`,
        `Email: ${app.email}`,
        `Phone: ${app.phone}`,
        `Parish: ${app.parish || "—"}`,
        "",
        app.message || "(No cover note)",
        "",
        "CV attached. Also saved in the website admin under Applications.",
      ].join("\n"),
      attachments: [{ filename: app.cv.fileName, content: Buffer.from(cvBytes), contentType: app.cv.type }],
    });
    return true;
  } catch (err) {
    console.error("Application email failed; it is still saved in admin.", err);
    return false;
  }
}
