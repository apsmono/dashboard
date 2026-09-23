// Single source of truth for Firestore collection + Storage path names across the
// workspace. Copy into each project (submodules can't import across repo boundaries)
// and keep in sync with firebase/firestore.rules and firebase/storage.rules.

export const COLLECTIONS = {
  // solo-leveling (grandfathered, unprefixed — do not rename)
  reminders: "reminders",
  commands: "commands",
  // wedding-invitation
  weddingRsvps: "wedding_rsvps",
  weddingGuestbook: "wedding_guestbook",
  // koperasi
  koperasiContacts: "koperasi_contacts",
  koperasiMembers: "koperasi_members",
} as const;

export const STORAGE_PATHS = {
  weddingGallery: "wedding",
  uploads: "uploads", // uploads/{project}/{file}
} as const;
