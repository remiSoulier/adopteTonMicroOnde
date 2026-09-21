export const AVATAR_BUCKET = "profile-avatars";
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export type PersonalProfile = { pseudo: string; avatar_url: string | null };
export type PersonalState = { error?: string; success?: string; profile?: PersonalProfile } | null;

export function validatePseudo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length >= 2 && clean.length <= 32 && !/[\u0000-\u001f\u007f]/.test(clean) ? clean : null;
}

export function avatarFormat(bytes: Uint8Array): { extension: string; contentType: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", contentType: "image/jpeg" };
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte)) return { extension: "png", contentType: "image/png" };
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4)) === "RIFF" && String.fromCharCode(...bytes.slice(8,12)) === "WEBP") return { extension: "webp", contentType: "image/webp" };
  return null;
}
