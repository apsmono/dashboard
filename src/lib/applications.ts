// Job-application tracker data layer — Firestore direct (no brain backend).
// Deliberately self-contained: this module is only imported by the lazy-loaded
// ApplicationsPage, so firebase/firestore stays out of the main bundle.
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
// Side-effect import: ensures the default Firebase app is initialized.
import "@/lib/firebase";

export const TRACKS = ["fullstack", "frontend", "ai"] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_LABELS: Record<Track, string> = {
  fullstack: "#1 Fullstack",
  frontend: "#2 Frontend",
  ai: "#3 AI",
};

export const STATUSES = [
  "found",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "ghosted",
] as const;
export type ApplicationStatus = (typeof STATUSES)[number];

/** Pay floor from [[Remote Job Application Readiness]]: 30M IDR/mo ≈ $1,850/mo. */
export const PAY_FLOOR_USD = 1850;

export interface Application {
  id: string;
  /** Date found/applied, YYYY-MM-DD. */
  date: string;
  company: string;
  role: string;
  track: Track;
  /** Monthly pay in USD, if known. */
  payUsd?: number;
  status: ApplicationStatus;
  link?: string;
  notes?: string;
}

export type ApplicationInput = Omit<Application, "id">;

const col = () => collection(getFirestore(), "applications");

/** Client-generated id so optimistic inserts and the server doc share a key. */
export function newApplicationId(): string {
  return doc(col()).id;
}

/** Firestore rejects `undefined` values — strip them before writing. */
function stripUndefined<T extends object>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

function toApplication(id: string, data: Record<string, unknown>): Application {
  return {
    id,
    date: typeof data.date === "string" ? data.date : "",
    company: typeof data.company === "string" ? data.company : "",
    role: typeof data.role === "string" ? data.role : "",
    track: TRACKS.includes(data.track as Track) ? (data.track as Track) : "fullstack",
    payUsd: typeof data.payUsd === "number" ? data.payUsd : undefined,
    status: STATUSES.includes(data.status as ApplicationStatus)
      ? (data.status as ApplicationStatus)
      : "found",
    link: typeof data.link === "string" && data.link !== "" ? data.link : undefined,
    notes: typeof data.notes === "string" && data.notes !== "" ? data.notes : undefined,
  };
}

export async function fetchApplications(): Promise<Application[]> {
  const snap = await getDocs(query(col(), orderBy("date", "desc")));
  return snap.docs.map((d) => toApplication(d.id, d.data()));
}

export async function createApplication(
  id: string,
  input: ApplicationInput
): Promise<void> {
  await setDoc(doc(col(), id), {
    ...stripUndefined(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateApplication(
  id: string,
  patch: Partial<ApplicationInput>
): Promise<void> {
  await updateDoc(doc(col(), id), {
    ...stripUndefined(patch),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteApplication(id: string): Promise<void> {
  await deleteDoc(doc(col(), id));
}
