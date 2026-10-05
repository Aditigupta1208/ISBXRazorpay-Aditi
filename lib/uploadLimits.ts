/** Shared by the browser form and the server. Kept free of server-only imports. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024; // base64 of this stays under Vercel's 4.5 MB request limit
export const FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
export type FileType = (typeof FILE_TYPES)[number];
