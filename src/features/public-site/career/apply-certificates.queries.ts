import { useQuery } from "@tanstack/react-query";

import { getApiV1MeCertificateLinks } from "@/api/generated";
import { requestError } from "@/api/request-error";

// shortcut: the picker shows the first 100 certificates only, page through them if candidates ever keep more.
const PICKER_PARAMS = { limit: 100, page: 1 } as const;

/** The candidate's certificates for the Apply dialog; the key matches the Certificates page so its edits refresh this list. */
export function useApplyCertificates(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: ["certificates", PICKER_PARAMS],
    queryFn: async () => {
      const result = await getApiV1MeCertificateLinks({ query: PICKER_PARAMS });
      if (result.error || !result.data) throw requestError(result, "Could not load certificates.");
      return result.data;
    },
  });
}
