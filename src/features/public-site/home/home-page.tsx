import { useEffect } from "react";
import { useLocation } from "react-router";

import { HomeCompanies } from "./home-companies";
import { HomeCta } from "./home-cta";
import { HomeFields } from "./home-fields";
import { HomeHero } from "./home-hero";
import { HomeHowItWorks } from "./home-how-it-works";
import { HomeLatestJobs } from "./home-latest-jobs";
import { HomeStats } from "./home-stats";

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    const target = hash ? document.getElementById(hash.slice(1)) : null;
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "auto" });
  }, [hash]);

  return (
    <main className="flex flex-col bg-white">
      <HomeHero />
      <HomeStats />
      <HomeFields />
      <HomeLatestJobs />
      <HomeCompanies />
      <HomeHowItWorks />
      <HomeCta />
    </main>
  );
}
