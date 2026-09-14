import { useEffect, useRef } from "react";

import { AppConfig } from "@/core/config";

type EventHandler = (eventType: string, data: Record<string, unknown>) => void;

function parseSseChunk(chunk: string, onEvent: EventHandler) {
  const blocks = chunk.split("\n\n");
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    let eventType = "message";
    let dataText = "";
    for (const line of lines) {
      if (line.startsWith("event:")) eventType = line.slice(6).trim();
      if (line.startsWith("data:")) dataText += line.slice(5).trim();
    }
    if (!dataText) continue;
    try {
      onEvent(eventType, JSON.parse(dataText) as Record<string, unknown>);
    } catch {
      onEvent(eventType, {});
    }
  }
}

/** Long-lived SSE connection — server pushes updates; no polling. */
export function usePatientEventStream(token: string | undefined, enabled: boolean, onEvent: EventHandler) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!token || !enabled) return;

    const xhr = new XMLHttpRequest();
    let lastIndex = 0;
    let closed = false;

    xhr.open("GET", `${AppConfig.apiBaseUrl}/me/patient/events/`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "text/event-stream");

    xhr.onprogress = () => {
      const text = xhr.responseText ?? "";
      const chunk = text.slice(lastIndex);
      lastIndex = text.length;
      if (chunk) parseSseChunk(chunk, (type, data) => onEventRef.current(type, data));
    };

    xhr.onerror = () => {
      closed = true;
    };

    xhr.onloadend = () => {
      closed = true;
    };

    xhr.send();

    return () => {
      if (!closed) xhr.abort();
    };
  }, [token, enabled]);
}
