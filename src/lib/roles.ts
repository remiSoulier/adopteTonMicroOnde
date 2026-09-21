export type Role = 1 | 2 | 3;

export const ROLE_LABELS: Record<Role, string> = {
  1: "Utilisateur",
  2: "Admin",
  3: "Superadmin",
};

export function isRole(value: unknown): value is Role {
  return value === 1 || value === 2 || value === 3;
}
