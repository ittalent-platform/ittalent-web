import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";

import { SessionExpiryListener } from "@/auth/session-expiry-listener";
import { ToastProvider } from "@/components/toast/toast-provider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiryListener />
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}
