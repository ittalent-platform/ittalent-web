import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { client, getStoredTokens } from "@/api/client";
import type { NotificationItemDto } from "@/api/generated/types.gen";
import { useSession } from "@/auth/use-session";
import { useToast, type ToastTone } from "@/components/toast/toast-provider";
import { getPublicEnv } from "@/config/env";
import { notificationKeys } from "@/features/notifications/api/notifications.queries";

export interface UseNotificationStreamOptions {
  enabled?: boolean;
  onNotification?: (item: NotificationItemDto) => void;
}

export function useNotificationStream(options: UseNotificationStreamOptions = {}) {
  const { enabled = true, onNotification } = options;
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!enabled || !session?.user) {
      return;
    }

    const tokens = getStoredTokens();
    const token = tokens?.accessToken;
    if (!token) {
      return;
    }

    const baseUrl = client.getConfig().baseUrl ?? getPublicEnv(import.meta.env).VITE_API_URL;
    const streamUrl = `${baseUrl}/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(streamUrl);
    } catch (err) {
      console.error("Failed to initialize EventSource for notifications", err);
      return;
    }

    const handleNotification = (event: MessageEvent) => {
      try {
        const item = JSON.parse(event.data) as NotificationItemDto;

        // Invalidate active query caches so badge and lists reflect new notification immediately
        void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        void queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
        void queryClient.invalidateQueries({ queryKey: notificationKeys.infiniteLists() });

        // Map category to toast tone
        let tone: ToastTone = "success";
        if (item.category === "warning" || item.category === "action_required") {
          tone = "warning";
        }

        showToast({
          title: "New Notification",
          message: item.title ? `${item.title}: ${item.message}` : item.message,
          tone,
          action: item.actionUrl
            ? {
                label: "View",
                onClick: () => {
                  window.location.assign(item.actionUrl!);
                },
              }
            : undefined,
        });

        onNotification?.(item);
      } catch (parseError) {
        console.error("Failed to parse SSE notification payload", parseError);
      }
    };

    eventSource.addEventListener("notification", handleNotification);

    return () => {
      if (eventSource) {
        eventSource.removeEventListener("notification", handleNotification);
        eventSource.close();
      }
    };
  }, [enabled, session?.user, queryClient, showToast, onNotification]);
}

/**
 * Headless companion component to mount inside ToastProvider for global listening
 */
export function NotificationStreamListener() {
  useNotificationStream();
  return null;
}
