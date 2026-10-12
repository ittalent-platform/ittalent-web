import { Outlet, useLocation } from "react-router";

import { MarketplaceFooter } from "./marketplace-footer";
import { MarketplaceHeader } from "./marketplace-header";

/** Public marketplace shell (Jobs / Companies) — header, page, dark footer. */
export function MarketplaceLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-mkt-canvas font-['Instrument_Sans',system-ui,sans-serif] text-mkt-ink">
      <MarketplaceHeader dark={pathname === "/"} />
      <div className="flex-1">
        <Outlet />
      </div>
      <MarketplaceFooter />
    </div>
  );
}