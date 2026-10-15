// Types and statuses for job applications, safe to use in the browser (no server code).

export const APPLICATION_STATUSES = ["New", "Reviewed", "Shortlisted", "Not suitable", "Hired"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface Application {
  id: string;
  receivedAt: string;
  jobId: string; // "" for a general application
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  parish: string;
  message: string;
  cv: { fileName: string; storedName: string; size: number; type: string };
  status: ApplicationStatus;
}
