import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import "@/api/client";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  postApiV1AuthChangePassword,
} from "@/api/generated";
import type { MyProfile, UpdateMyProfile } from "@/api/generated/types.gen";
import { requestError, unwrap } from "@/api/request-error";
import { authKeys } from "@/auth/use-session";

import { PROFILE_QUERY_KEY } from "./profile.constants";

async function getProfile(): Promise<MyProfile> {
  const result = await getMyProfile();
  return unwrap(result, "Unable to load your profile.");
}

async function updateProfile(body: UpdateMyProfile): Promise<MyProfile> {
  const result = await updateMyProfile({ body });
  return unwrap(result, "Unable to save your profile.");
}

async function uploadAvatar(file: File): Promise<MyProfile> {
  const result = await uploadMyAvatar({ body: { avatar: file } });
  return unwrap(result, "Unable to upload your avatar.");
}

async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const result = await postApiV1AuthChangePassword({ body });
  if (result.error || !result.data)
    throw requestError(result, "Unable to change your password.");
}

export function useMyProfile() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    retry: false,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useUploadMyAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      void queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
}

export function useChangeMyPassword() {
  return useMutation({ mutationFn: changePassword });
}
