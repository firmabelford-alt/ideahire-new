/* P61 — the IdeaHire iH ligature. Vector artwork shared by navigation and opening. */
import React from "react";
import { Link } from "react-router-dom";

export const IDEA_HIRE_MARK = Object.freeze({ dot: "M8 8H22V20H8Z", join: "M42 8H50L56 14V56H42V42H22V56H8V28H42Z" });
export function BrandMark({ className = "ih-brand-mark" }) {
  return <svg className={className} viewBox="0 0 64 64" width="34" height="34" fill="currentColor" aria-hidden="true" focusable="false"><path className="ih-brand-dot" d={IDEA_HIRE_MARK.dot}/><path className="ih-brand-join" d={IDEA_HIRE_MARK.join}/></svg>;
}

export function BrandSignature({ className = "" }) {
  return <span className={`ih-brand-signature ${className}`.trim()} role="img" aria-label="IdeaHire" data-no-translate="true"><BrandMark/><span className="ih-brand-wordmark" aria-hidden="true">IdeaHire</span></span>;
}

export function BrandLogo({ className = "logo", to = "/" }) {
  return <Link className={`${className} ih-brand-link`.trim()} to={to} aria-label="IdeaHire"><BrandSignature/></Link>;
}

export function drawBrandMark(context, x, y, size, colour) {
  if (typeof Path2D === "undefined") return;
  context.save();
  context.translate(x, y);
  context.scale(size / 64, size / 64);
  context.fillStyle = colour;
  context.fill(new Path2D(IDEA_HIRE_MARK.dot));
  context.fill(new Path2D(IDEA_HIRE_MARK.join));
  context.restore();
}

export function drawBrandSignature(context, x, y, size, colour) {
  if (typeof Path2D === "undefined") return;
  drawBrandMark(context, x, y, size, colour);
  context.save();
  context.fillStyle = colour;
  context.font = `800 ${size * .82}px Inter, Arial, sans-serif`;
  context.textBaseline = "middle";
  context.fillText("IdeaHire", x + size + 6, y + size / 2);
  context.restore();
}
