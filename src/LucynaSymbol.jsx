/* Lucyna's original handwritten L, shared by the launcher, menu and chat. */
import React from "react";

export default function LucynaSymbol({ className = "" }) {
  return <svg className={`ih65-lucyna-symbol ${className}`.trim()} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M24 6C15 7 10 23 13 30C16 36 29 32 33 26C23 23 11 28 6 33M24 33H35" pathLength="1"/>
    <path d="M30 8h5M32.5 5.5v5" strokeWidth="1.5" pathLength="1"/>
  </svg>;
}
