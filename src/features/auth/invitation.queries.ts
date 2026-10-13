import { getApiV1UserInvitationsPreview, postApiV1UserInvitationsAccept } from "@/api/generated";
import type { AcceptNewAccountInvitationRequest, InvitationPreviewResponse } from "@/api/generated/types.gen";

function invitationError(error: unknown, status: number | undefined): Error {
  const message = typeof error === "object" && error && "message" in error && typeof error.message === "string"
    ? error.message : "Unable to verify invitation";
  return Object.assign(new Error(message), { status });
}

export async function previewAccountInvitation(token: string): Promise<InvitationPreviewResponse> {
  const result = await getApiV1UserInvitationsPreview({ query: { token } });
  if (result.error || !result.data) throw invitationError(result.error, result.response?.status);
  return result.data;
}

export async function acceptAccountInvitation(body: AcceptNewAccountInvitationRequest) {
  const result = await postApiV1UserInvitationsAccept({ body });
  if (result.error || !result.data) throw invitationError(result.error, result.response?.status);
  return result.data;
}
