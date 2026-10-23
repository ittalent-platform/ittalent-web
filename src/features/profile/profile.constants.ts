export const PROFILE_QUERY_KEY = ["my-profile"] as const;
export const AVATAR_MAX_BYTES = 5 * 1_048_576;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PROFILE_PHONE_PATTERN = /^0[35789]\d{8}$/;
export const PROFILE_NAME_MIN = 2;
export const PROFILE_NAME_MAX = 100;
