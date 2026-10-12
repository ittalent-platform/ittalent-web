export function userDisplayId(id?: string) {
  return id ? `USR-${id.slice(-4).toUpperCase()}` : "";
}

export function enterpriseDisplayId(id?: string) {
  return id ? `ENT-${id.slice(-4).toUpperCase()}` : "";
}

export function newsDisplayId(id?: string) {
  return id ? `NEWS-${id.slice(-4).toUpperCase()}` : "";
}
