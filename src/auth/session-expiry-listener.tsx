import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { SESSION_EXPIRED_EVENT } from "@/api/client";
import { authKeys } from "./use-session";

/** A request that could not renew the session (401) clears it here, so route guards redirect to Sign in. */
export function SessionExpiryListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const expire = () => queryClient.setQueryData(authKeys.me(), null);
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [queryClient]);

  return null;
}
