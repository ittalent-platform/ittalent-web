import type { ReactNode } from "react";
import { SidebarToggleButton } from "@/components/layout/sidebar-toggle-button";
import { useAdminLayout } from "@/components/layout/admin-layout-context";

export type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  title: ReactNode;
};

export function PageHeader({
  actions,
  description,
  leading,
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {leading}
        <div className="min-w-0">
          <h1 className="itt-display text-2xl font-semibold leading-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function AdminPageHeader({
  actions,
  description,
  title,
}: Omit<PageHeaderProps, "leading">) {
  const adminLayout = useAdminLayout();

  return (
    <PageHeader
      actions={actions}
      description={description}
      leading={
        adminLayout?.collapsed ? (
          <SidebarToggleButton
            className="mt-0.5 hidden lg:inline-flex"
            collapsed={adminLayout.collapsed}
            onClick={adminLayout.toggleSidebar}
          />
        ) : null
      }
      title={title}
    />
  );
}
