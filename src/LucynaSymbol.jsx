/* P65 — Lucyna's own dialogue mark, shared by the launcher and chat. */
import React from "react";

export default function LucynaSymbol({ className = "" }) {
  return <svg className={`ih65-lucyna-symbol ${className}`.trim()} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M11 7H30a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H19l-8 7v-7H8a3 3 0 0 1-3-3V14"/>
    <path d="M13 13v9h12M20 13h6"/>
    <path d="M5 7h1" strokeWidth="3"/>
  </svg>;
}
