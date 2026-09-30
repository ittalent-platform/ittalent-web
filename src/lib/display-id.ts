export function userDisplayId(id?: string) {
  return id ? `USR-${id.slice(-4).toUpperCase()}` : "";
}

export function newsDisplayId(id?: string) {
  return id ? `NEWS-${id.slice(-4).toUpperCase()}` : "";
}

export function applicationDisplayId(id?: string) {
  return id ? `APP-${id.slice(-4).toUpperCase()}` : "";
}
