/* Plain IdeaHire mark: no badge, orbit or decorative AI symbol. */
import React from "react";
import { IDEA_HIRE_MARK } from "./Brand";

export default function LucynaSymbol({ className = "" }) {
  return <svg className={`ih65-lucyna-symbol ${className}`.trim()} viewBox="0 0 64 64" width="28" height="28" fill="currentColor" stroke="none" aria-hidden="true" focusable="false">
    <g fill="currentColor" stroke="none"><path className="lu-brand-fill" d={IDEA_HIRE_MARK.dot}/><path className="lu-brand-fill" d={IDEA_HIRE_MARK.join}/></g>
  </svg>;
}
