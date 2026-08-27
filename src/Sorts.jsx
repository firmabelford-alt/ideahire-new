import React, { useMemo, useState, useEffect } from "react";
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
  if (!userId) {
    throw new Error("Brak identyfikatora użytkownika.");
  }

  const countryCode =
    country?.code || null;

  const {
    data: existingProfile,
    error: readError,
  } = await supabase
    .from("public_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existingProfile?.user_id) {
    const { error } = await supabase
      .from("public_profiles")
      .update({
        country_code: countryCode,
      })
      .eq("user_id", userId);

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("public_profiles")
    .insert({
      user_id: userId,
      country_code: countryCode,
    });

  if (error) throw error;
}

function CountryFlag({ country, className = "" }) {
  if (!country) return null;

  const imageUrl =
    `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;

  return (
    <span className={`ideahire-flag-shell ${className}`.trim()}>
      <img
        className="ideahire-flag-image"
        src={imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <span className="ideahire-flag-emoji" aria-hidden="true">
        {country.flag}
      </span>
    </span>
  );
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
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (!event.target.closest(".ideahire-country-picker")) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

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
              <CountryFlag country={selected} className="ideahire-country-flag" />
              <span className="ideahire-country-selected-name">{selected.name}</span>
              <span className="ideahire-country-selected-code">{selected.code}</span>
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
            {filtered.length ? (
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
                  <CountryFlag country={country} className="ideahire-country-option-flag" />
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
      {country ? (
        <CountryFlag
          country={country}
          className="ideahire-country-badge-flag"
        />
      ) : (
        <span className="ideahire-country-badge-flag">🌍</span>
      )}
      <span className="ideahire-country-badge-name">
        {country?.name || countryName}
      </span>
    </span>
  );
}

function Sorts({ children }) {
  return (
    <>
      <style>{`
        .ideahire-country-picker {
          position: relative;
          width: 100%;
          font-family: inherit;
        }

        .ideahire-country-trigger {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 0 15px;
          border: 1px solid rgba(20,20,20,.12);
          border-radius: 14px;
          background: #fff;
          color: #161616;
          font: inherit;
          cursor: pointer;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }

        .ideahire-country-trigger:hover {
          border-color: rgba(20,20,20,.24);
        }

        .ideahire-country-trigger:focus,
        .ideahire-country-trigger.is-open {
          outline: none;
          border-color: #161616;
          box-shadow: 0 0 0 4px rgba(20,20,20,.06);
        }

        .ideahire-country-trigger:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        .ideahire-country-selected {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .ideahire-country-flag,
        .ideahire-country-option-flag,
        .ideahire-country-badge-flag {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 30px;
          border-radius: 999px;
          background: #f4f4f1;
          box-shadow: inset 0 0 0 1px rgba(20,20,20,.06);
          font-size: 19px;
          line-height: 1;
        }

        .ideahire-flag-shell {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          flex: 0 0 auto;
          background: transparent;
          box-sizing: border-box;
          isolation: isolate;
          clip-path: circle(50% at 50% 50%);
        }

        .ideahire-flag-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          border-radius: 50%;
          transform: none;
          transition: transform .18s ease;
        }

        .ideahire-flag-shell:hover .ideahire-flag-image {
          transform: scale(1.04);
        }

        .ideahire-flag-emoji {
          display: none;
          font-size: inherit;
          line-height: 1;
        }

        .ideahire-country-selected-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 600;
        }

        .ideahire-country-selected-code,
        .ideahire-country-option-code,
        .ideahire-country-badge-code {
          color: #8d8d8d;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .06em;
        }

        .ideahire-country-placeholder {
          color: #8a8a8a;
        }

        .ideahire-country-chevron {
          flex-shrink: 0;
          color: #777;
        }

        .ideahire-country-menu {
          position: absolute;
          z-index: 1000;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(20,20,20,.1);
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 18px 45px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.05);
        }

        .ideahire-country-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-bottom: 1px solid rgba(20,20,20,.08);
        }

        .ideahire-country-search input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #161616;
          font: inherit;
        }

        .ideahire-country-list {
          max-height: 310px;
          overflow-y: auto;
          padding: 6px;
        }

        .ideahire-country-option {
          width: 100%;
          display: grid;
          grid-template-columns: 34px 1fr auto;
          align-items: center;
          gap: 10px;
          padding: 9px 11px;
          border: 0;
          border-radius: 12px;
          background: transparent;
          color: #161616;
          text-align: left;
          font: inherit;
          cursor: pointer;
        }

        .ideahire-country-option:hover,
        .ideahire-country-option.is-selected {
          background: #f3f3f1;
        }

        .ideahire-country-option-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ideahire-country-empty {
          padding: 24px 16px;
          text-align: center;
          color: #888;
          font-size: 14px;
        }

        .ideahire-country-badge {
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          width: fit-content;
          max-width: 100%;
          margin: 8px 0 0;
          padding: 5px 11px 5px 6px;
          border: 1px solid rgba(20,20,20,.07);
          border-radius: 999px;
          background: #f7f7f4;
          color: #242424;
          font-size: 13px;
          line-height: 1;
          vertical-align: middle;
          box-sizing: border-box;
        }

        .ideahire-country-badge-flag {
          width: 26px;
          height: 26px;
          flex: 0 0 26px;
          font-size: 17px;
          background: transparent;
          border: 1px solid rgba(20,20,20,.06);
        }

        .ideahire-country-badge-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 650;
          line-height: 1.2;
        }

        @media (min-width: 601px) {
          .profile-info .ideahire-country-badge {
            display: flex;
            margin-top: 9px;
            margin-left: 0;
            margin-right: auto;
          }
        }

        @media (max-width: 600px) {
          .ideahire-flag-image {
            display: none;
          }

          .ideahire-flag-emoji {
            display: inline;
          }
          .ideahire-country-list {
            max-height: 260px;
          }

          .ideahire-country-selected-code {
            display: none;
          }
        }
      `}</style>
      <div className="sorts-root">{children}</div>
    </>
  );
}

export default Sorts;
