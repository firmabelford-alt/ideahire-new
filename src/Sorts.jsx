import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

/*
=========================================================
 SORTS.JSX
 Wspólne komponenty i logika nowych elementów IdeaHire
=========================================================
*/

export const COUNTRIES = [
  { code: "PL", name: "Polska", flag: "🇵🇱" },
  { code: "DE", name: "Niemcy", flag: "🇩🇪" },
  { code: "GB", name: "Wielka Brytania", flag: "🇬🇧" },
  { code: "US", name: "Stany Zjednoczone", flag: "🇺🇸" },
  { code: "FR", name: "Francja", flag: "🇫🇷" },
  { code: "ES", name: "Hiszpania", flag: "🇪🇸" },
  { code: "IT", name: "Włochy", flag: "🇮🇹" },
  { code: "NL", name: "Holandia", flag: "🇳🇱" },
  { code: "BE", name: "Belgia", flag: "🇧🇪" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "CH", name: "Szwajcaria", flag: "🇨🇭" },
  { code: "SE", name: "Szwecja", flag: "🇸🇪" },
  { code: "NO", name: "Norwegia", flag: "🇳🇴" },
  { code: "DK", name: "Dania", flag: "🇩🇰" },
  { code: "FI", name: "Finlandia", flag: "🇫🇮" },
  { code: "IE", name: "Irlandia", flag: "🇮🇪" },
  { code: "PT", name: "Portugalia", flag: "🇵🇹" },
  { code: "CZ", name: "Czechy", flag: "🇨🇿" },
  { code: "SK", name: "Słowacja", flag: "🇸🇰" },
  { code: "HU", name: "Węgry", flag: "🇭🇺" },
  { code: "UA", name: "Ukraina", flag: "🇺🇦" },
  { code: "RO", name: "Rumunia", flag: "🇷🇴" },
  { code: "BG", name: "Bułgaria", flag: "🇧🇬" },
  { code: "HR", name: "Chorwacja", flag: "🇭🇷" },
  { code: "SI", name: "Słowenia", flag: "🇸🇮" },
  { code: "LT", name: "Litwa", flag: "🇱🇹" },
  { code: "LV", name: "Łotwa", flag: "🇱🇻" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "GR", name: "Grecja", flag: "🇬🇷" },
  { code: "TR", name: "Turcja", flag: "🇹🇷" },
  { code: "IS", name: "Islandia", flag: "🇮🇸" },
  { code: "CA", name: "Kanada", flag: "🇨🇦" },
  { code: "MX", name: "Meksyk", flag: "🇲🇽" },
  { code: "BR", name: "Brazylia", flag: "🇧🇷" },
  { code: "AR", name: "Argentyna", flag: "🇦🇷" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "NZ", name: "Nowa Zelandia", flag: "🇳🇿" },
  { code: "JP", name: "Japonia", flag: "🇯🇵" },
  { code: "CN", name: "Chiny", flag: "🇨🇳" },
  { code: "KR", name: "Korea Południowa", flag: "🇰🇷" },
  { code: "IN", name: "Indie", flag: "🇮🇳" },
  { code: "IL", name: "Izrael", flag: "🇮🇱" },
  { code: "AE", name: "Zjednoczone Emiraty Arabskie", flag: "🇦🇪" },
  { code: "ZA", name: "Republika Południowej Afryki", flag: "🇿🇦" },
];

/*
=========================================================
 POMOCNICZE
=========================================================
*/

export function getCountryByCode(code) {
  if (!code) return null;

  return (
    COUNTRIES.find(
      (country) => country.code === code
    ) || null
  );
}

export function getCountryName(code) {
  return getCountryByCode(code)?.name || "";
}

export function getCountryFlag(code) {
  return getCountryByCode(code)?.flag || "";
}

/*
=========================================================
 COUNTRY PICKER
=========================================================
*/

export function CountryPicker({
  value,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = getCountryByCode(value);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return COUNTRIES;
    }

    return COUNTRIES.filter((country) =>
      `${country.name} ${country.code}`
        .toLowerCase()
        .includes(query)
    );
  }, [search]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        !event.target.closest(
          ".ideahire-country-picker"
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  function handleSelect(country) {
    onChange?.(country);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="ideahire-country-picker">
      <button
        type="button"
        className={`ideahire-country-trigger ${
          open ? "is-open" : ""
        }`}
        onClick={() =>
          !disabled && setOpen((current) => !current)
        }
        disabled={disabled}
      >
        <span className="ideahire-country-selected">
          {selectedCountry ? (
            <>
              <span className="ideahire-country-flag">
                {selectedCountry.flag}
              </span>

              <span>
                {selectedCountry.name}
              </span>
            </>
          ) : (
            <span className="ideahire-country-placeholder">
              Wybierz kraj
            </span>
          )}
        </span>

        <span className="ideahire-country-chevron">
          {open ? "⌃" : "⌄"}
        </span>
      </button>

      {open && (
        <div className="ideahire-country-menu">
          <div className="ideahire-country-search">
            <span>⌕</span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Wyszukaj kraj..."
              autoFocus
            />
          </div>

          <div className="ideahire-country-list">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  type="button"
                  key={country.code}
                  className={`ideahire-country-option ${
                    value === country.code
                      ? "is-selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleSelect(country)
                  }
                >
                  <span className="ideahire-country-option-flag">
                    {country.flag}
                  </span>

                  <span className="ideahire-country-option-name">
                    {country.name}
                  </span>

                  <span className="ideahire-country-option-code">
                    {country.code}
                  </span>
                </button>
              ))
            ) : (
              <div className="ideahire-country-empty">
                Nie znaleziono kraju
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/*
=========================================================
 COUNTRY PROFILE BADGE
=========================================================
*/

export function CountryBadge({ countryCode }) {
  const country = getCountryByCode(countryCode);

  if (!country) {
    return null;
  }

  return (
    <span className="ideahire-country-badge">
      <span>{country.flag}</span>
      <span>{country.name}</span>
    </span>
  );
}

/*
=========================================================
 ZAPIS KRAJU DO SUPABASE
=========================================================
*/

export async function saveUserCountry(
  userId,
  country
) {
  if (!userId) {
    throw new Error(
      "Brak identyfikatora użytkownika."
    );
  }

  if (!country) {
    const { error } = await supabase
      .from("public_profiles")
      .update({
        country_code: null,
        country_name: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase
    .from("public_profiles")
    .update({
      country_code: country.code,
      country_name: country.name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

/*
=========================================================
 GŁÓWNY WRAPPER SORTS
=========================================================
*/

function Sorts({ children }) {
  return (
    <>
      <style>{`
        .ideahire-country-picker {
          position: relative;
          width: 100%;
          max-width: 420px;
          font-family: inherit;
        }

        .ideahire-country-trigger {
          width: 100%;
          min-height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          border: 1px solid rgba(20, 20, 20, 0.12);
          border-radius: 14px;
          background: #fff;
          color: #161616;
          font: inherit;
          cursor: pointer;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .ideahire-country-trigger:hover {
          border-color: rgba(20, 20, 20, 0.25);
        }

        .ideahire-country-trigger:focus,
        .ideahire-country-trigger.is-open {
          outline: none;
          border-color: #161616;
          box-shadow: 0 0 0 4px rgba(20, 20, 20, 0.06);
        }

        .ideahire-country-selected {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .ideahire-country-flag {
          font-size: 24px;
          line-height: 1;
        }

        .ideahire-country-placeholder {
          color: #8a8a8a;
        }

        .ideahire-country-chevron {
          flex-shrink: 0;
          font-size: 17px;
          color: #777;
        }

        .ideahire-country-menu {
          position: absolute;
          z-index: 1000;
          top: calc(100% + 8px);
          left: 0;
          width: 100%;
          overflow: hidden;
          border: 1px solid rgba(20, 20, 20, 0.1);
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 18px 45px rgba(0, 0, 0, 0.12),
            0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .ideahire-country-search {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-bottom: 1px solid rgba(20, 20, 20, 0.08);
        }

        .ideahire-country-search span {
          color: #777;
          font-size: 19px;
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
          padding: 10px 11px;
          border: 0;
          border-radius: 11px;
          background: transparent;
          color: #161616;
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: background 140ms ease;
        }

        .ideahire-country-option:hover {
          background: #f5f5f3;
        }

        .ideahire-country-option.is-selected {
          background: #f0f0ed;
        }

        .ideahire-country-option-flag {
          font-size: 22px;
          line-height: 1;
        }

        .ideahire-country-option-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .ideahire-country-option-code {
          color: #999;
          font-size: 12px;
          letter-spacing: 0.04em;
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
          gap: 7px;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f3f3f1;
          color: #242424;
          font-size: 14px;
          line-height: 1;
        }

        .ideahire-country-badge span:first-child {
          font-size: 17px;
        }

        @media (max-width: 600px) {
          .ideahire-country-picker {
            max-width: 100%;
          }

          .ideahire-country-menu {
            max-width: 100%;
          }

          .ideahire-country-list {
            max-height: 280px;
          }
        }
      `}</style>

      <div className="sorts-root">
        {children}
      </div>
    </>
  );
}

export default Sorts;
