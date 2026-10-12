import { Link } from "react-router";

import { useSession } from "@/auth/use-session";
import { APPLICATIONS_PATH } from "@/config/routes";

import { MarketplaceLogo } from "./marketplace-logo";

const colTitle =
  "font-mono text-[11px] font-bold tracking-[0.12em] text-mkt-on-dark-muted";
const link = "text-white hover:text-mkt-brand transition-colors";

export function MarketplaceFooter() {
  const { data: session } = useSession();
  const signedIn = Boolean(session);
  return (
    <footer className="box-border flex flex-col gap-10 bg-mkt-ink px-4 pb-7 pt-14 text-white md:px-12">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5">
            <MarketplaceLogo size={28} />
            <span className="font-['Space_Grotesk',sans-serif] text-[17px] font-bold tracking-[0.04em]">
              ITTALENT
            </span>
          </div>
          <p className="max-w-[280px] text-[13.5px] leading-[1.6] text-mkt-on-dark">
            The recruitment marketplace for IT roles in Vietnam. One profile,
            many companies.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-[13.5px]">
          <div className={colTitle}>FOR CANDIDATES</div>
          <Link className={link} to="/career">
            Browse jobs
          </Link>
          <Link className={link} to="/enterprises">
            Browse companies
          </Link>
          {signedIn ? (
            session?.user.role === "user" ? (
              <>
                <Link className={link} to={APPLICATIONS_PATH}>
                  My applications
                </Link>
                <Link className={link} to="/documents">
                  My documents
                </Link>
              </>
            ) : null
          ) : (
            <>
              <Link className={link} to="/register">
                Create an account
              </Link>
              <Link className={link} to="/login">
                Sign in
              </Link>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 text-[13.5px]">
          <div className={colTitle}>FOR EMPLOYERS</div>
          <Link className={link} to="/#employers">
            Register your company
          </Link>
          <Link className={link} to="/#employers">
            How hiring works
          </Link>
          {signedIn ? null : (
            <Link className={link} to="/login">
              Employer sign in
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 text-[13.5px] text-mkt-on-dark">
          <div className={colTitle}>CONTACT</div>
          <span>SE1903.g05@gmail.com</span>
          <span className="font-mono text-[12.5px]">0912 345 678</span>
          <span className="leading-normal">
            600 Nguyen Van Cu noi dai,
            <br />
            Ninh Kieu, Can Tho, Vietnam
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.12] pt-5 text-[12.5px] text-mkt-on-dark-muted">
        <span>© 2026 ITTalent SE1903 G5. All rights reserved.</span>
        <div className="flex-1" />
        <a className="hover:text-white" href="#">
          Terms
        </a>
        <a className="hover:text-white" href="#">
          Privacy
        </a>
      </div>
    </footer>
  );
}