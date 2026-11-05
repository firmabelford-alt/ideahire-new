import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSitePreferences } from "./Preferences";
import "./HomeEnding.css";

const SETTLEMENT_TERMS = "/regulamin#stripe-connect-i-uruchomienie-płatności";

export default function HomeEnding({ en = false }) {
  const { theme } = useSitePreferences();
  const paymentsTitle = useId();
  const ending = useRef(null);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!ending.current || typeof IntersectionObserver !== "function" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setArrived(true);
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(ending.current);
    return () => observer.disconnect();
  }, []);

  const dark = theme === "dark";
  return (
    <section ref={ending} className="ih-home-finale" data-arrived={arrived || undefined}
      aria-label={en ? "IdeaHire and payments" : "IdeaHire i rozliczenia"} data-no-translate="true">
      <div className="ih-finale-cut" aria-hidden="true" />
      <div className="ih-finale-main">
        <p className="ih-finale-signature">
          {en ? "From the first hello" : "Od pierwszej rozmowy"}<br />
          <span>{en ? "to the final payment." : "do rozliczenia."}</span>
        </p>
        <section className="ih-finale-payments" aria-labelledby={paymentsTitle}>
          <div>
            <h2 id={paymentsTitle}>{en ? "Payments and payouts" : "Płatności i wypłaty"}</h2>
            <Link to={SETTLEMENT_TERMS}>
              {en ? "Payment terms" : "Zasady płatności"}
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10h12m-5-5 5 5-5 5" /></svg>
            </Link>
          </div>
          <img className="ih-finale-stripe" src={dark ? "/brand/stripe-wordmark-white.svg" : "/brand/stripe-wordmark.svg"}
            width="360" height={dark ? "151" : "150"} loading="lazy" decoding="async" alt="Stripe" />
        </section>
      </div>
      <small className="ih-finale-credit">© 2026 IdeaHire</small>
    </section>
  );
}
