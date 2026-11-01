import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from '@/api/client';
import { postApiV1MeReports } from '@/api/generated/sdk.gen';
import type {
  CreateReportResponse,
  PostApiV1MeReportsErrors,
  PostApiV1MeReportsResponses,
} from '@/api/generated/types.gen';
import { unwrap } from '@/api/request-error';
import {
  REPORT_QUERY_KEYS,
  normalizeEvidenceFileForUpload,
  type ReportReason,
  type ReportTargetType,
} from '@/config/reports';

export interface SubmitReportPayload {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  statement: string;
  idempotencyKey?: string;
  files?: File[];
}

export function useSubmitReportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitReportPayload): Promise<CreateReportResponse> => {
      const normalizedTargetType =
        payload.targetType === 'enterprise' ? 'company' : payload.targetType;
      const trimmedStatement = payload.statement.trim();

      if (payload.files && payload.files.length > 0) {
        const formData = new FormData();
        formData.append('targetType', normalizedTargetType);
        formData.append('targetId', payload.targetId);
        formData.append('reason', payload.reason);
        formData.append('statement', trimmedStatement);
        if (payload.idempotencyKey) {
          formData.append('idempotencyKey', payload.idempotencyKey);
        }
        for (const file of payload.files) {
          const normalizedFile = normalizeEvidenceFileForUpload(file);
          formData.append('files', normalizedFile, normalizedFile.name);
        }

        const res = await client.post<PostApiV1MeReportsResponses, PostApiV1MeReportsErrors>({
          security: [{ scheme: 'bearer', type: 'http' }],
          url: '/api/v1/me/reports',
          body: formData,
          bodySerializer: null,
          headers: {
            'Content-Type': null,
          },
        });
        return unwrap(res, 'Unable to submit report');
      }

      const res = await postApiV1MeReports({
        body: {
          targetType: normalizedTargetType,
          targetId: payload.targetId,
          reason: payload.reason,
          statement: trimmedStatement,
          idempotencyKey: payload.idempotencyKey,
        },
      });
      return unwrap(res, 'Unable to submit report');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...REPORT_QUERY_KEYS.myReports] });
      void queryClient.invalidateQueries({ queryKey: [...REPORT_QUERY_KEYS.adminReports] });
    },
  });
}

