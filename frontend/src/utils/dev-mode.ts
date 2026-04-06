import type { User } from "@/utils/auth"

export const DEV_MODE_ENABLED = import.meta.env.VITE_DEV_MODE === "true"


export const DEV_MODE_USER: User = {
  id: "dev-user-1",
  email: "admin@example.com",
  username: "admin",
  fullName: "Dev Admin",
  roles: [{ name: "ADMIN" }],
}

