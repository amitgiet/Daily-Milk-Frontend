import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "https://api.dairybook.in"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null

  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("//")) return `https:${trimmed}`

  const base = API_BASE.replace(/\/$/, "")
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return `${base}${path}`
}

export function getProfilePictureUrl(source?: object | null): string | null {
  if (!source) return null

  const record = source as Record<string, unknown>
  const nestedUser = record.user as Record<string, unknown> | undefined
  const candidates = [
    record.profilePictureUrl,
    record.profilePicture,
    record.profile_picture_url,
    record.profile_picture,
    record.image,
    record.imageUrl,
    record.avatar,
    nestedUser?.profilePictureUrl,
    nestedUser?.profilePicture,
    nestedUser?.profile_picture_url,
    nestedUser?.profile_picture,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return resolveImageUrl(candidate)
    }
  }

  return null
}
