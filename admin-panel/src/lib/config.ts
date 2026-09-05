/** Shared API configuration for admin panel and website. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "NHMS Admin";
