import type { RootStackParamList } from "@/core/navigation/types";

/** Kept so screens can opt in later. Alerts stay unread until mark-as-read is tapped. */
export function useClearTopics(_screen: keyof RootStackParamList) {}
