import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { translateUiText, useSitePreferences } from "./Preferences";
import "./SpecialisationExplorer.css";

const EN_FIELDS = {
  Programowanie: "Websites, apps & IT", "Grafika i design": "Design, UX & 3D",
  Marketing: "Marketing & sales", Copywriting: "Writing & translation", Video: "Video, animation & audio",
  Fotografia: "Photography & retouching", "AI i automatyzacje": "AI & automation",
  "Dane, analizy i research": "Data, analysis & research", "Biznes i e-commerce": "Business & e-commerce",
  "Architektura, wnętrza i CAD": "Architecture, interiors & CAD",
};
const EN_INTROS = {
  Programowanie: "Build a website, connect a system or fix a specific technical problem.",
  "Grafika i design": "From a recognisable identity to a finished design or product visual.",
  Marketing: "A defined campaign, channel or sales task with a clear scope.",
  Copywriting: "Content for a specific audience, format and language.",
  Video: "Turn footage and sound into a finished piece, ready to publish.",
  Fotografia: "Plan a shoot or prepare existing images for their final use.",
  "AI i automatyzacje": "Connect tools and remove repetitive work from a specific process.",
  "Dane, analizy i research": "Organise information and turn it into a useful answer.",
  "Biznes i e-commerce": "Complete a concrete task in your store, team or daily operations.",
  "Architektura, wnętrza i CAD": "Develop a space or object, from layout to technical documentation.",
};
const EN_TASK_NAMES = {
  Programowanie: "Landing page|Company website|Online store|Web application|Mobile application|WordPress, Webflow & no-code|API integration|Bug fixes|Performance or security audit|Website or server migration".split("|"),
  "Grafika i design": "Logo|Visual identity|UI/UX design|Advertising graphics|Social media graphics pack|Print materials|Packaging or label|Presentation|Illustration|Canva templates|3D model|Product visualisation".split("|"),
  Marketing: "Marketing strategy|SEO audit|Optimisation of selected pages|Google Ads setup|Meta Ads setup|TikTok Ads setup|Social media posts pack|Email campaign|Analytics setup|Prospect list preparation|Sales materials|UGC or influencer campaign concept".split("|"),
  Copywriting: "Website copy|Articles|Product descriptions|SEO copy|Advertising copy|Social posts pack|Newsletter|Script|Proofreading & editing|Editing AI-generated copy|Translation|Website or app localisation|Transcription|Subtitles".split("|"),
  Video: "Video editing|Reels, Shorts or TikToks pack|YouTube video|Video advertisement|Product film|Animation|Motion design|AI-generated video|Subtitles & localisation|Podcast editing|Audio editing|Voice-over recording|Jingle or music|Sound design".split("|"),
  Fotografia: "Product photography|Brand photography|Event photography|Property photography|Automotive photography|Portrait|Online store photography|360-degree photography|Retouching|Background removal|Photo restoration".split("|"),
  "AI i automatyzacje": "Business chatbot|AI agent|n8n, Make or Zapier automation|AI integration with a website or system|Knowledge base & RAG|AI voice assistant|Document automation|Customer support automation|AI workflow audit|AI data preparation|Business prompt system".split("|"),
  "Dane, analizy i research": "Data cleaning|Excel workbook organisation|PDF to Excel conversion|Data entry|Web scraping|Power BI or Looker dashboard|Data analysis|Data visualisation|Market research|Survey analysis|Database cleanup or migration|AI data annotation".split("|"),
  "Biznes i e-commerce": "Adding products to a store|Product copy & specifications|Marketplace account setup|Product catalogue organisation|CRM setup or cleanup|Customer database preparation|Competitor research|Business presentation|Documentation & procedures|Project delivery plan|Recruitment materials pack|One-off administrative pack|Online store audit".split("|"),
  "Architektura, wnętrza i CAD": "Interior design|Functional room layout|3D visualisation|2D drawing|CAD model|Furniture design|3D printing model|Production documentation|Commercial space arrangement|Property visualisation".split("|"),
};
const SEARCH_ALIASES = {
  "Landing page": "strona ladowania oferta kampania one page",
  "Strona firmowa": "www witryna internetowa wizytowka business website",
  "Sklep internetowy": "woocommerce shopify prestashop ecommerce sprzedaz online shop",
  Logo: "logotyp znak marki branding",
  "Projekt UI/UX": "figma makieta prototyp interface interfejs",
  "Montaż filmu": "montaz wideo video edit obrobka filmu",
  "Pakiet rolek, Shorts lub TikToków": "rolki reels short vertical clips",
  "Usuwanie tła": "usun tlo wytnij tlo wycinanie szparowanie remove background cutout",
  Retusz: "retuszuj zdjecia popraw zdjecie photo edit photoshop",
  Tłumaczenie: "przetlumacz tekst translator translation",
  "Automatyzacja n8n, Make lub Zapier": "polacz aplikacje integracje workflow automatyzuj",
  "Konwersja PDF do Excel": "pdf xlsx przepisz tabele spreadsheet conversion",
};
// Ordered exactly like the platform's canonical subcategories. These descriptions
// describe deliverables, never fabricated demand, earnings or project counts.
const EN_DELIVERABLES = {
  Programowanie: [
    "A focused page for one offer, with a clear action and contact form.",
    "A company website with service pages, contact details and responsive layouts.",
    "A store with a product catalogue, basket and an agreed checkout setup.",
    "An application that runs in a browser, with the screens and features you define.",
    "A mobile app with an agreed user journey and target devices.",
    "A site built or updated in a chosen visual editor or CMS.",
    "A defined connection between services, including data mapping and error handling.",
    "Diagnosis and repair of a reproducible problem in your existing code.",
    "An assessment of performance or security, with prioritised recommendations.",
    "A planned transfer of your site or server, including checks after the move.",
  ],
  "Grafika i design": [
    "A logo concept, final artwork and export formats for agreed uses.",
    "A consistent visual system: colour, typography and brand applications.",
    "User flows and interface screens for a defined website or application.",
    "Campaign visuals prepared for the selected advertising formats.",
    "A coordinated set of social graphics in specified sizes.",
    "Print artwork prepared to the printer's technical requirements.",
    "A packaging or label design matched to the supplied dimensions.",
    "A slide deck with a clear structure and consistent visual treatment.",
    "Original illustration for a defined subject, style and intended use.",
    "Reusable Canva layouts that your team can edit.",
    "A 3D model with an agreed level of detail and output format.",
    "Product images rendered with specified materials, lighting and views.",
  ],
  Marketing: [
    "An audience, positioning and channel plan with clear priorities.",
    "An SEO assessment with a list of issues and recommended changes.",
    "Specific improvements to the selected pages and their search visibility.",
    "Google Ads account structure, targeting and agreed campaign setup.",
    "Meta campaign setup with selected objectives, audiences and placements.",
    "TikTok campaign setup for the agreed audience and creative formats.",
    "A defined batch of posts with copy, formats and publication guidance.",
    "An email sequence with its audience, content and sending setup.",
    "Measurement events, conversion tracking and an agreed reporting setup.",
    "A researched prospect list using the agreed criteria and lawful sources.",
    "Sales documents and messages matched to a specific offer.",
    "A campaign idea, creator brief and list of proposed deliverables.",
  ],
  Copywriting: [
    "Copy for defined website pages, matched to the offer and audience.",
    "Articles based on an agreed subject, outline and source requirements.",
    "Product descriptions with benefits, features and a consistent structure.",
    "Search-focused copy for selected pages and topics.",
    "Advertising headlines and body copy for chosen channels and formats.",
    "A batch of posts with a consistent voice and clear publication purpose.",
    "An email edition or sequence with an agreed message and action.",
    "A script with scenes or segments, narration and timing guidance.",
    "Corrections to language, structure and consistency in supplied text.",
    "Human editing, fact checks and a coherent voice for AI-assisted drafts.",
    "Translation for a specified language pair, subject and intended use.",
    "Adapted interface and website content for the target market.",
    "A text transcript of the supplied audio or video recording.",
    "Timed subtitles in the required language and file format.",
  ],
  Video: [
    "A finished edit of supplied footage, with agreed pacing and output formats.",
    "A batch of vertical clips with hooks, captions and selected aspect ratios.",
    "An edited YouTube video with the structure, sound and graphics you agree.",
    "A short advertisement built around one offer and a clear call to action.",
    "A product film showing selected details, uses and benefits.",
    "An animated sequence with an agreed script, style and duration.",
    "Animated type and graphics for a specific sequence or visual identity.",
    "AI-assisted footage created and edited to an agreed brief.",
    "Timed subtitles and language adaptation for a finished video.",
    "An edited episode with clean transitions and consistent sound levels.",
    "Noise reduction, dialogue cleanup and an agreed audio mix.",
    "A voice recording with the chosen delivery and usage rights.",
    "A musical identity or piece with specified length and licensed uses.",
    "Sound effects and an audio atmosphere matched to the picture.",
  ],
  Fotografia: [
    "Product photographs with defined angles, lighting and final image formats.",
    "A brand or business portrait session planned around its intended use.",
    "Coverage of an event, with an agreed shot list and image selection.",
    "Images of interiors and exteriors for a property listing or portfolio.",
    "A vehicle shoot with selected details, views and locations.",
    "A portrait session with an agreed style, location and final selection.",
    "Consistent catalogue images prepared for your store's requirements.",
    "A 360-degree image set or panorama in the agreed viewing format.",
    "Detailed retouching of a specified batch of existing images.",
    "Accurate cutouts with transparent or replacement backgrounds.",
    "Repair and restoration of damaged or faded photographs.",
  ],
  "AI i automatyzacje": [
    "A chatbot based on your business content, with a defined purpose and limits.",
    "An assistant that completes an agreed task using selected tools.",
    "A working automation between apps, with documented triggers and actions.",
    "An AI feature connected to an existing website or business system.",
    "A searchable knowledge base with retrieval and source-grounded answers.",
    "A voice workflow with defined conversations and escalation paths.",
    "A process for extracting, routing or generating agreed documents.",
    "Support automation with clear routing and a human handoff.",
    "An assessment of workflows and concrete opportunities for automation.",
    "A cleaned and structured dataset for the agreed AI application.",
    "A documented prompt library for repeatable tasks in your team.",
  ],
  "Dane, analizy i research": [
    "A dataset with duplicates, inconsistent values and specified errors resolved.",
    "A structured workbook with the formulas and views you need.",
    "Tables extracted from supplied PDFs into a usable spreadsheet.",
    "Accurate entry of an agreed volume of information into your system.",
    "Data collection from agreed, permitted web sources and fields.",
    "A dashboard with defined metrics, filters and data connections.",
    "An analysis answering your questions, with assumptions and findings stated.",
    "Charts and visuals that explain the important patterns in your data.",
    "Research into a defined market, with sources and a clear report.",
    "Survey results cleaned, summarised and interpreted for your questions.",
    "A database cleanup or transfer with defined mappings and checks.",
    "A labelled dataset prepared to the supplied annotation guidelines.",
  ],
  "Biznes i e-commerce": [
    "A batch of products added to your store with required fields completed.",
    "Consistent product copy and technical attributes for a specified catalogue.",
    "An account or shop configured on the chosen marketplace.",
    "Product categories, names and attributes organised into a usable catalogue.",
    "A CRM setup or cleanup with agreed stages, fields and automations.",
    "A structured customer database assembled from agreed, lawful sources.",
    "A comparison of competitors, offers and positioning with referenced sources.",
    "A presentation that turns your business material into a clear story.",
    "Documented procedures that make a defined process easier to repeat.",
    "A project plan with deliverables, dependencies and a working schedule.",
    "A recruitment pack for specified roles and stages of the hiring process.",
    "An agreed one-off set of administrative tasks and finished documents.",
    "A store review with prioritised issues affecting its operation or usability.",
  ],
  "Architektura, wnętrza i CAD": [
    "An interior concept with selected materials, furniture and agreed drawings.",
    "A practical room layout based on dimensions and intended use.",
    "Rendered views of an agreed space or object, with defined detail.",
    "A precise 2D drawing prepared to your dimensions and format requirements.",
    "A CAD model with specified geometry, dimensions and exchange formats.",
    "A furniture design developed around its function, materials and dimensions.",
    "A model checked and prepared for the chosen 3D printing process.",
    "Technical drawings and specifications for the defined production task.",
    "A functional arrangement for a commercial space and its users.",
    "Visuals presenting a property in agreed views, finishes and lighting.",
  ],
};

export function normaliseSpecialisation(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").replace(/Ł/g, "L").toLowerCase();
}

/* P62 — a single-column accordion; one field open at a time. */
export default function SpecialisationExplorer({ groups = [], details = {} }) {
  const { language } = useSitePreferences();
  const en = language === "en";
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState("");
  const searchInput = useRef(null);
  const triggers = useRef(new Map());
  const panels = useRef(new Map());
  const words = normaliseSpecialisation(search).trim().split(/\s+/).filter(Boolean);
  const searching = words.length > 0;
  const label = item => en
    ? EN_FIELDS[item.value] || translateUiText(item.label || item.value)
    : item.label || item.value;
  const all = groups.flatMap(group => (group.subcategories || []).map((value, index) => ({
    group, value, index,
    title: en ? EN_TASK_NAMES[group.value]?.[index] || translateUiText(value) : value,
    description: en
      ? EN_DELIVERABLES[group.value]?.[index] || EN_INTROS[group.value] || ""
      : details[group.value]?.descriptions?.[index] || details[group.value]?.summary || "",
  })));
  const matches = searching ? all.filter(item => {
    const haystack = normaliseSpecialisation([
      item.value, item.title, EN_TASK_NAMES[item.group.value]?.[item.index],
      label(item.group), item.description, SEARCH_ALIASES[item.value],
    ].join(" "));
    return words.every(word => haystack.includes(word));
  }) : [];
  const categoryUrl = (category, subcategory) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    return "/jobs" + (params.size ? "?" + params : "");
  };

  function toggle(value) {
    // Restore focus before hiding a panel, including browsers that do not focus
    // a button on pointer activation. No programmatic page scrolling.
    if (active && panels.current.get(active)?.contains(document.activeElement)) {
      triggers.current.get(value)?.focus({ preventScroll: true });
    }
    setActive(previous => previous === value ? null : value);
  }
  function moveHeader(event, index) {
    const direction = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? groups.length - 1
      : (index + direction + groups.length) % groups.length;
    triggers.current.get(groups[next]?.value)?.focus();
  }
  function clearSearch() {
    setSearch("");
    searchInput.current?.focus({ preventScroll: true });
  }
  function onKeyDown(event) {
    if (event.key !== "Escape") return;
    if (search && event.target === searchInput.current) {
      event.preventDefault();
      clearSearch();
    } else if (active && panels.current.get(active)?.contains(event.target)) {
      event.preventDefault();
      triggers.current.get(active)?.focus({ preventScroll: true });
      setActive(null);
    }
  }
  function services(items) {
    return <ul className="ih62-services">
      {items.map(item => <li key={item.group.value + "/" + item.value}>
        <Link className="ih62-service" to={categoryUrl(item.group.value, item.value)}>
          <span className="ih62-service-copy"><strong>{item.title}</strong><span>{item.description}</span></span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg>
        </Link>
      </li>)}
    </ul>;
  }

  return <section id="ih62-specialisations" className="ih62-specialisations" aria-labelledby="ih62-title" data-no-translate="true" onKeyDown={onKeyDown}>
    <header className="ih62-heading">
      <div><h2 id="ih62-title">{en ? "Specialisations" : "Specjalizacje"}</h2><p>{en ? "Choose a field, then the service you need." : "Wybierz dziedzinę, a potem konkretną usługę."}</p></div>
      <div className="ih62-search-area">
        <label className="ih62-search-label" htmlFor="ih62-search">{en ? "Search all services" : "Szukaj we wszystkich usługach"}</label>
        <div className="ih62-search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          <input ref={searchInput} id="ih62-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={en ? "E.g. logo, website, retouching" : "Np. logo, strona, retusz"} aria-controls={searching ? "ih62-results" : "ih62-fields"} autoComplete="off" onKeyDown={event => {
            if (event.key !== "ArrowDown") return;
            const first = searching ? document.querySelector("#ih62-results .ih62-service") : triggers.current.get(groups[0]?.value);
            if (first) { event.preventDefault(); first.focus(); }
          }}/>
          {search && <button type="button" onClick={clearSearch} aria-label={en ? "Clear search" : "Wyczyść wyszukiwanie"}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 6 8 8m0-8-8 8"/></svg></button>}
        </div>
      </div>
    </header>

    <p className="ih62-result-status" role="status" aria-live="polite">{searching
      ? en ? `${matches.length} matching services` : `Pasujące usługi: ${matches.length}`
      : en ? `${groups.length} fields, ${all.length} services` : `${groups.length} dziedzin, ${all.length} usług`}</p>

    {searching ? <div className="ih62-results" id="ih62-results">
      {groups.map(group => {
        const items = matches.filter(item => item.group.value === group.value);
        return items.length ? <section className="ih62-result-group" key={group.value} aria-label={label(group)}><h3>{label(group)}</h3>{services(items)}</section> : null;
      })}
      {!matches.length && <div className="ih62-empty"><h3>{en ? "No matching service." : "Brak pasującej usługi."}</h3><p>{en ? "Try a shorter phrase or browse the fields." : "Spróbuj krótszej frazy albo przejrzyj dziedziny."}</p><button type="button" onClick={clearSearch}>{en ? "Browse fields" : "Pokaż dziedziny"}</button></div>}
    </div> : <div className="ih62-fields" id="ih62-fields">
      {groups.map((group, index) => {
        const expanded = active === group.value;
        const items = all.filter(item => item.group.value === group.value);
        const buttonId = `ih62-field-${index}`;
        const panelId = `ih62-panel-${index}`;
        return <article className="ih62-field" key={group.value} data-open={expanded}>
          <h3 className="ih62-field-heading"><button ref={node => node ? triggers.current.set(group.value, node) : triggers.current.delete(group.value)} id={buttonId} type="button" className="ih62-field-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={() => toggle(group.value)} onKeyDown={event => moveHeader(event, index)}>
            <span className="ih62-field-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span className="ih62-field-name">{label(group)}</span>
            <span className="ih62-field-count">{items.length} {en ? "services" : "usług"}</span>
            <svg className="ih62-plus" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12"/><path className="ih62-plus-vertical" d="M10 4v12"/></svg>
          </button></h3>
          <div ref={node => node ? panels.current.set(group.value, node) : panels.current.delete(group.value)} className="ih62-panel" id={panelId} data-open={expanded} role={expanded ? "region" : undefined} aria-labelledby={buttonId} aria-hidden={!expanded} inert={expanded ? undefined : ""}>
            <div className="ih62-panel-clip"><div className="ih62-panel-content">
              <p className="ih62-field-summary">{en ? EN_INTROS[group.value] : details[group.value]?.summary}</p>
              {services(items)}
              <Link className="ih62-field-all" to={categoryUrl(group.value)}>{en ? "All projects in this field" : "Wszystkie zlecenia w tej dziedzinie"}<span aria-hidden="true">↗</span></Link>
            </div></div>
          </div>
        </article>;
      })}
      {!groups.length && <p className="ih62-unavailable">{en ? "The service list is currently unavailable." : "Lista usług jest teraz niedostępna."}</p>}
    </div>}

    <footer className="ih62-footer"><Link to="/jobs">{en ? "All projects" : "Wszystkie zlecenia"}<span aria-hidden="true">↗</span></Link><Link to="/freelancers">{en ? "Browse professionals" : "Przeglądaj wykonawców"}<span aria-hidden="true">↗</span></Link></footer>
  </section>;
}
