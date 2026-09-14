/** Nepal's 7 provinces — reference data, not demo records. */
export const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
] as const;

export type NepalProvince = (typeof NEPAL_PROVINCES)[number];
