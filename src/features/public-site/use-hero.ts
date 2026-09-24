import { useEffect, useState } from "react";

export function useHero(enabled = true) {
  const [onHero, setOnHero] = useState(enabled);

  useEffect(() => {
    let raf = 0;

    const tick = () => {
      const hero = document.getElementById("page-hero");
      const nextOnHero = enabled && hero ? hero.getBoundingClientRect().bottom > 74 : false;
      setOnHero((current) => (current === nextOnHero ? current : nextOnHero));
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [enabled]);

  return onHero;
}
