// Client-side validation contract for public writes. Mirrors firebase/firestore.rules
// exactly — if you change one, change the other. Copy into the relevant project.
//
// No dependency on a validation library so it drops into any TS project as-is.

export interface RsvpInput {
  name: string;
  attending: boolean;
  guests: number;
  message?: string;
}

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function validateRsvp(input: RsvpInput): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.length === 0 || input.name.length > 120)
    errors.push("name must be 1–120 chars");
  if (typeof input.attending !== "boolean")
    errors.push("attending must be boolean");
  if (!Number.isInteger(input.guests) || input.guests < 0 || input.guests > 20)
    errors.push("guests must be an integer 0–20");
  if (input.message !== undefined && input.message.length > 2000)
    errors.push("message must be ≤ 2000 chars");
  return errors;
}

export function validateContact(input: ContactInput): string[] {
  const errors: string[] = [];
  if (!input.name || input.name.length === 0 || input.name.length > 120)
    errors.push("name must be 1–120 chars");
  if (!input.email || input.email.length === 0 || input.email.length > 254)
    errors.push("email must be 1–254 chars");
  if (input.phone !== undefined && input.phone.length > 40)
    errors.push("phone must be ≤ 40 chars");
  if (!input.message || input.message.length === 0 || input.message.length > 2000)
    errors.push("message must be 1–2000 chars");
  return errors;
}
