
import React from "react";
import LegalDocument from "./LegalDocument";
import termsHtml from "./legal/terms-pl.html?raw";

export default function TermsOfService() {
  return <LegalDocument kind="terms" html={termsHtml} />;
}
