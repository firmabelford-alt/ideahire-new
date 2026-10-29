/* IdeaHire's own mark inside a circle: one identity for Lucyna everywhere. */
import React from "react";
import { IDEA_HIRE_MARK } from "./Brand";

export default function LucynaSymbol({ className = "" }) {
  return <svg className={`ih65-lucyna-symbol ${className}`.trim()} viewBox="0 0 64 64" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false">
    <circle className="lu-brand-ring" cx="32" cy="32" r="29"/>
    <g transform="translate(11 11) scale(.65625)" fill="currentColor" stroke="none"><path className="lu-brand-fill" d={IDEA_HIRE_MARK.dot}/><path className="lu-brand-fill" d={IDEA_HIRE_MARK.join}/></g>
  </svg>;
}
