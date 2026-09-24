import { createContext, useContext, type ReactNode } from "react";

type AdminLayoutContextValue = {
  collapsed: boolean;
  toggleSidebar: () => void;
};

const AdminLayoutContext = createContext<AdminLayoutContextValue | null>(null);

export function AdminLayoutProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AdminLayoutContextValue;
}) {
  return <AdminLayoutContext.Provider value={value}>{children}</AdminLayoutContext.Provider>;
}

export function useAdminLayout() {
  return useContext(AdminLayoutContext);
}
