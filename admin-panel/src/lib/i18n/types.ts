export type Locale = "en" | "ne";

export type MessageTree = {
  [key: string]: string | MessageTree;
};
