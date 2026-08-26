import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

export const COUNTRIES = [
  ["PL", "Polska", "🇵🇱"], ["DE", "Niemcy", "🇩🇪"], ["GB", "Wielka Brytania", "🇬🇧"], ["US", "Stany Zjednoczone", "🇺🇸"],
  ["FR", "Francja", "🇫🇷"], ["ES", "Hiszpania", "🇪🇸"], ["IT", "Włochy", "🇮🇹"], ["NL", "Holandia", "🇳🇱"],
  ["BE", "Belgia", "🇧🇪"], ["AT", "Austria", "🇦🇹"], ["CH", "Szwajcaria", "🇨🇭"], ["SE", "Szwecja", "🇸🇪"],
  ["NO", "Norwegia", "🇳🇴"], ["DK", "Dania", "🇩🇰"], ["FI", "Finlandia", "🇫🇮"], ["IE", "Irlandia", "🇮🇪"],
  ["PT", "Portugalia", "🇵🇹"], ["CZ", "Czechy", "🇨🇿"], ["SK", "Słowacja", "🇸🇰"], ["HU", "Węgry", "🇭🇺"],
  ["UA", "Ukraina", "🇺🇦"], ["RO", "Rumunia", "🇷🇴"], ["BG", "Bułgaria", "🇧🇬"], ["HR", "Chorwacja", "🇭🇷"],
  ["SI", "Słowenia", "🇸🇮"], ["LT", "Litwa", "🇱🇹"], ["LV", "Łotwa", "🇱🇻"], ["EE", "Estonia", "🇪🇪"],
  ["GR", "Grecja", "🇬🇷"], ["TR", "Turcja", "🇹🇷"], ["IS", "Islandia", "🇮🇸"], ["CA", "Kanada", "🇨🇦"],
  ["MX", "Meksyk", "🇲🇽"], ["BR", "Brazylia", "🇧🇷"], ["AR", "Argentyna", "🇦🇷"], ["AU", "Australia", "🇦🇺"],
  ["NZ", "Nowa Zelandia", "🇳🇿"], ["JP", "Japonia", "🇯🇵"], ["CN", "Chiny", "🇨🇳"], ["KR", "Korea Południowa", "🇰🇷"],
  ["IN", "Indie", "🇮🇳"], ["IL", "Izrael", "🇮🇱"], ["AE", "Zjednoczone Emiraty Arabskie", "🇦🇪"], ["ZA", "Republika Południowej Afryki", "🇿🇦"]
].map(([code, name, flag]) => ({ code, name, flag }));

export function getCountryByCode(code) {
  return COUNTRIES.find((country) => country.code === code) || null;
}

export function getCountryName(code) {
  return getCountryByCode(code)?.name || "";
}

export function getCountryFlag(code) {
  return getCountryByCode(code)?.flag || "";
}

export async function saveUserCountry(userId, country) {
  if (!userId) throw new Error("Brak identyfikatora użytkownika.");

  const { error } = await supabase
    .from("public_profiles")
    .update({
      country_code: country?.code || null,
      country_name: country?.name || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export function CountryPicker({ value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = getCountryByCode(value);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter((country) =>
      `${country.name} ${country.code}`.toLowerCase().includes(query)
    );
  }, [search]);

  useEffect(() => {
    const close = (event) => {
      if (!event.target.closest(".ideahire-country-picker")) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="ideahire-country-picker">
      <button
        type="button"
        className={`ideahire-country-trigger ${open ? "is-open" : ""}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="ideahire-country-selected">
          {selected ? (
            <>
              <span className="ideahire-country-flag">{selected.flag}</span>
              <span>{selected.name}</span>
            </>
          ) : (
            <span className="ideahire-country-placeholder">Wybierz kraj</span>
          )}
        </span>
        <span className="ideahire-country-chevron">{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div className="ideahire-country-menu">
          <div className="ideahire-country-search">
            <span>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Wyszukaj kraj..."
              autoFocus
            />
          </div>

          <div className="ideahire-country-list">
            {filtered.length > 0 ? (
              filtered.map((country) => (
                <button
                  type="button"
                  key={country.code}
                  className={`ideahire-country-option ${value === country.code ? "is-selected" : ""}`}
                  onClick={() => {
                    onChange?.(country);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <span className="ideahire-country-option-flag">{country.flag}</span>
                  <span className="ideahire-country-option-name">{country.name}</span>
                  <span className="ideahire-country-option-code">{country.code}</span>
                </button>
              ))
            ) : (
              <div className="ideahire-country-empty">Nie znaleziono kraju</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function CountryBadge({ countryCode, countryName }) {
  const country = getCountryByCode(countryCode);
  if (!country && !countryName) return null;

  return (
    <span className="ideahire-country-badge">
      <span>{country?.flag || "🌍"}</span>
      <span>{country?.name || countryName}</span>
    </span>
  );
}

function Sorts({ children }) {
  return (
    <>
      <style>{`
        .ideahire-country-picker { position: relative; width: 100%; max-width: 420px; font-family: inherit; }
        .ideahire-country-trigger { width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 0 16px; border: 1px solid rgba(20, 20, 20, 0.12); border-radius: 14px; background: #fff; color: #161616; font: inherit; cursor: pointer; transition: border-color .16s ease, box-shadow .16s ease; }
        .ideahire-country-trigger:hover { border-color: rgba(20, 20, 20, .25); }
        .ideahire-country-trigger:focus, .ideahire-country-trigger.is-open { outline: none; border-color: #161616; box-shadow: 0 0 0 4px rgba(20, 20, 20, .06); }
        .ideahire-country-selected { display: flex; align-items: center; gap: 11px; min-width: 0; }
        .ideahire-country-flag { font-size: 24px; line-height: 1; }
        .ideahire-country-placeholder { color: #8a8a8a; }
        .ideahire-country-chevron { flex-shrink: 0; color: #777; }
        .ideahire-country-menu { position: absolute; z-index: 1000; top: calc(100% + 8px); left: 0; width: 100%; overflow: hidden; border: 1px solid rgba(20, 20, 20, .1); border-radius: 16px; background: #fff; box-shadow: 0 18px 45px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.05); }
        .ideahire-country-search { display: flex; align-items: center; gap: 10px; padding: 12px; border-bottom: 1px solid rgba(20,20,20,.08); }
        .ideahire-country-search input { width: 100%; border: 0; outline: 0; background: transparent; color: #161616; font: inherit; }
        .ideahire-country-list { max-height: 310px; overflow-y: auto; padding: 6px; }
        .ideahire-country-option { width: 100%; display: grid; grid-template-columns: 34px 1fr auto; align-items: center; gap: 10px; padding: 10px 11px; border: 0; border-radius: 11px; background: transparent; color: #161616; text-align: left; font: inherit; cursor: pointer; }
        .ideahire-country-option:hover, .ideahire-country-option.is-selected { background: #f3f3f1; }
        .ideahire-country-option-flag { font-size: 22px; }
        .ideahire-country-option-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ideahire-country-option-code { color: #999; font-size: 12px; }
        .ideahire-country-empty { padding: 24px 16px; text-align: center; color: #888; font-size: 14px; }
        .ideahire-country-badge { display: inline-flex; align-items: center; gap: 7px; width: fit-content; padding: 6px 10px; border-radius: 999px; background: #f3f3f1; color: #242424; font-size: 14px; line-height: 1; }
        .ideahire-country-badge span:first-child { font-size: 17px; }
        @media (max-width: 600px) { .ideahire-country-picker, .ideahire-country-menu { max-width: 100%; } .ideahire-country-list { max-height: 280px; } }
      `}</style>
      <div className="sorts-root">
        {children}
      </div>
    </>
  );
}

export default Sorts;
