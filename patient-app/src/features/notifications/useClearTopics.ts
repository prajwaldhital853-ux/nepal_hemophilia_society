import { useEffect } from "react";

import type { RootStackParamList } from "@/core/navigation/types";
import { usePatientNotifications } from "@/core/providers/PatientNotificationsProvider";
import { TOPICS_BY_SCREEN } from "@/features/notifications/notificationRoutes";

export function useClearTopics(screen: keyof RootStackParamList) {
  const { markTopicsSeen } = usePatientNotifications();
  const topics = TOPICS_BY_SCREEN[screen];
  useEffect(() => {
    if (topics?.length) void markTopicsSeen(topics);
  }, [markTopicsSeen, topics]);
}
