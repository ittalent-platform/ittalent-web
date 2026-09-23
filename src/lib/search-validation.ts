const UNSAFE_SEARCH_PATTERN = /[<>\x7F\u202A-\u202E\u2066-\u2069]/u;

export const INVALID_SEARCH_MESSAGE = "Search keyword contains invalid characters. Please revise your input.";

export function hasUnsafeSearchText(value: string) {
  return UNSAFE_SEARCH_PATTERN.test(value) || Array.from(value).some((character) => character.charCodeAt(0) < 32);
}
