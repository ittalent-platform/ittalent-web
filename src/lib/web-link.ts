function parse(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

/** A web address the server will accept: http(s), a host with a dot, no credentials. */
export function isWebLink(value: string): boolean {
  const url = parse(value);
  return Boolean(url && (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".") && !url.username && !url.password);
}

/** A web address that carries a username or password: refused, and worth saying so. */
export function hasLinkCredentials(value: string): boolean {
  const url = parse(value);
  return Boolean(url && (url.username || url.password));
}

/** The host people recognise ("credly.com"), never fetched. */
export function linkHost(url: string): string {
  return parse(url)?.hostname.replace(/^www\./, "") ?? url;
}

/** Host and path without the scheme ("anguyen.dev/work/loan-dashboard"), for telling two links apart. */
export function linkSummary(url: string): string {
  const parsed = parse(url);
  return parsed ? `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname === "/" ? "" : parsed.pathname}` : url;
}

/** Read from the address only (BR-S4-LINK-002): the page itself is never opened. */
export function isInsecureLink(url: string): boolean {
  return url.toLowerCase().startsWith("http://");
}
