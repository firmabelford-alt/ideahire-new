import { FormSelect, AutoTextarea } from "./FormControls";
/* IdeaHire | PACZKA 26 | 2026-10-10 | Pełny plik: src/ServiceMarketplace.jsx */
import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";
import { useSitePreferences, translateUiText } from "./Preferences";
import { SubpageHeading, SubpageCatalogTabs, SubpageLoading } from "./Subpages";
import { IdeaHireDateField, MarketFilters, MarketHeader, MarketIcon, IDEA_HIRE_PUBLIC_OFFER, MarketCatalogHeader, MarketCatalogHero } from "./MarketUI";

const SERVICE_CATEGORIES = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
  "AI i automatyzacje",
  "Dane, analizy i research",
  "Biznes i e-commerce",
  "Architektura, wnętrza i CAD",
];

const SERVICE_CATEGORY_COPY = {
  Programowanie: "Strony, aplikacje i automatyzacje",
  "Grafika i design": "Identyfikacja, UI i materiały wizualne",
  Marketing: "Kampanie, analityka i social media",
  Copywriting: "Teksty, opisy i komunikacja marki",
  Video: "Montaż, animacja i materiały wideo",
  Fotografia: "Sesje, retusz i obróbka zdjęć",
  "AI i automatyzacje": "Agenci AI, integracje i automatyzacja procesów",
  "Dane, analizy i research": "Dane, dashboardy i badania rynku",
  "Biznes i e-commerce": "Sklepy, katalogi, CRM i materiały biznesowe",
  "Architektura, wnętrza i CAD": "Projekty, wizualizacje i dokumentacja techniczna",
};

const SERVICE_CATEGORY_MARKS = {
  Programowanie: "</>",
  "Grafika i design": "◇",
  Marketing: "◎",
  Copywriting: "Aa",
  Video: "▶",
  Fotografia: "◎",
  "AI i automatyzacje": "AI",
  "Dane, analizy i research": "∑",
  "Biznes i e-commerce": "▣",
  "Architektura, wnętrza i CAD": "⌂",
};

const SERVICE_SUBCATEGORIES = {
  Programowanie: [
    "Landing page",
    "Strona firmowa",
    "Sklep internetowy",
    "Aplikacja webowa",
    "Aplikacja mobilna",
    "WordPress, Webflow i no-code",
    "Integracja API",
    "Naprawa błędów",
    "Audyt szybkości lub bezpieczeństwa",
    "Migracja strony albo serwera",
  ],
  "Grafika i design": [
    "Logo",
    "Identyfikacja wizualna",
    "Projekt UI/UX",
    "Grafiki reklamowe",
    "Pakiet grafik do social mediów",
    "Materiały do druku",
    "Opakowanie lub etykieta",
    "Prezentacja",
    "Ilustracja",
    "Szablony Canva",
    "Model 3D",
    "Wizualizacja produktu",
  ],
  Marketing: [
    "Strategia marketingowa",
    "Audyt SEO",
    "Optymalizacja wskazanych podstron",
    "Konfiguracja Google Ads",
    "Konfiguracja Meta Ads",
    "Konfiguracja TikTok Ads",
    "Pakiet postów do social mediów",
    "Kampania e-mail",
    "Konfiguracja analityki",
    "Przygotowanie bazy leadów",
    "Materiały sprzedażowe",
    "Koncepcja kampanii UGC lub influencerskiej",
  ],
  Copywriting: [
    "Teksty na stronę",
    "Artykuły",
    "Opisy produktów",
    "Teksty SEO",
    "Teksty reklamowe",
    "Pakiet postów",
    "Newsletter",
    "Scenariusz",
    "Korekta i redakcja",
    "Poprawa treści wygenerowanej przez AI",
    "Tłumaczenie",
    "Lokalizacja strony lub aplikacji",
    "Transkrypcja",
    "Przygotowanie napisów",
  ],
  Video: [
    "Montaż filmu",
    "Pakiet rolek, Shorts lub TikToków",
    "Film na YouTube",
    "Reklama wideo",
    "Film produktowy",
    "Animacja",
    "Motion design",
    "Wideo generowane przez AI",
    "Napisy i lokalizacja",
    "Montaż podcastu",
    "Obróbka dźwięku",
    "Nagranie lektorskie",
    "Jingle lub muzyka",
    "Sound design",
  ],
  Fotografia: [
    "Fotografia produktowa",
    "Fotografia wizerunkowa",
    "Fotografia wydarzenia",
    "Fotografia nieruchomości",
    "Fotografia motoryzacyjna",
    "Portret",
    "Zdjęcia do sklepu internetowego",
    "Fotografia 360°",
    "Retusz",
    "Usuwanie tła",
    "Renowacja zdjęć",
  ],
  "AI i automatyzacje": [
    "Chatbot dla firmy",
    "Agent AI",
    "Automatyzacja n8n, Make lub Zapier",
    "Integracja AI ze stroną lub systemem",
    "Baza wiedzy i RAG",
    "Asystent głosowy AI",
    "Automatyzacja dokumentów",
    "Automatyzacja obsługi klienta",
    "Audyt procesów pod AI",
    "Przygotowanie danych dla AI",
    "System promptów dla firmy",
  ],
  "Dane, analizy i research": [
    "Czyszczenie danych",
    "Porządkowanie arkusza Excel",
    "Konwersja PDF do Excel",
    "Wprowadzanie danych",
    "Web scraping",
    "Dashboard Power BI lub Looker",
    "Analiza danych",
    "Wizualizacja danych",
    "Badanie rynku",
    "Analiza ankiety",
    "Porządkowanie lub migracja bazy",
    "Anotacja danych dla AI",
  ],
  "Biznes i e-commerce": [
    "Dodanie produktów do sklepu",
    "Przygotowanie opisów i parametrów produktów",
    "Konfiguracja konta marketplace",
    "Porządkowanie katalogu produktów",
    "Konfiguracja lub uporządkowanie CRM",
    "Przygotowanie bazy klientów",
    "Research konkurencji",
    "Prezentacja biznesowa",
    "Dokumentacja i procedury",
    "Plan realizacji projektu",
    "Pakiet materiałów rekrutacyjnych",
    "Jednorazowy pakiet administracyjny",
    "Audyt sklepu internetowego",
  ],
  "Architektura, wnętrza i CAD": [
    "Projekt wnętrza",
    "Układ funkcjonalny pomieszczenia",
    "Wizualizacja 3D",
    "Rysunek 2D",
    "Model CAD",
    "Projekt mebla",
    "Model do druku 3D",
    "Dokumentacja produkcyjna",
    "Aranżacja lokalu",
    "Wizualizacja nieruchomości",
  ],
};

const EMPTY_SERVICE_FORM = {
  title: "",
  summary: "",
  description: "",
  category: SERVICE_CATEGORIES[0],
  subcategory: SERVICE_SUBCATEGORIES[SERVICE_CATEGORIES[0]][0],
  skills: "",
  deliverables: "",
  clientRequirements: "",
  priceMode: "custom",
  basePrice: "",
  deliveryDays: "7",
  revisions: "2",
  capacityLimit: "2",
  queueEnabled: true,
};

function splitLines(value, limit = 12) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function serviceFormFromRow(row) {
  if (!row) return EMPTY_SERVICE_FORM;

  const category = SERVICE_CATEGORIES.includes(row.category)
    ? row.category
    : SERVICE_CATEGORIES[0];
  const availableSubcategories = SERVICE_SUBCATEGORIES[category] || [];
  const subcategory = availableSubcategories.includes(row.subcategory)
    ? row.subcategory
    : availableSubcategories[0] || "";

  return {
    title: row.title || "",
    summary: row.summary || "",
    description: row.description || "",
    category,
    subcategory,
    skills: Array.isArray(row.skills) ? row.skills.join(", ") : "",
    deliverables: Array.isArray(row.deliverables)
      ? row.deliverables.join("\n")
      : "",
    clientRequirements: Array.isArray(row.client_requirements)
      ? row.client_requirements.join("\n")
      : "",
    priceMode: row.price_mode || "custom",
    basePrice:
      row.base_price === null || row.base_price === undefined
        ? ""
        : String(row.base_price),
    deliveryDays: String(row.delivery_days || 7),
    revisions: String(row.revisions ?? 2),
    capacityLimit: String(row.capacity_limit || 2),
    queueEnabled: row.queue_enabled !== false,
  };
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "Cena po ustaleniu zakresu";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatServiceDate(value) {
  if (!value) return "Termin do ustalenia";

  return new Date(value).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function serviceCapacity(row) {
  const limit = Math.max(1, Number(row?.capacity_limit || 1));
  const occupied = Math.max(0, Number(row?.occupied_slots || 0));
  const available = Math.max(
    0,
    Number.isFinite(Number(row?.available_slots))
      ? Number(row.available_slots)
      : limit - occupied
  );

  if (available === 0) {
    return {
      label: "Pełne obłożenie",
      className: "is-full",
      available,
    };
  }

  if (available === 1) {
    return {
      label: "Ostatnie miejsce",
      className: "is-last",
      available,
    };
  }

  return {
    label: `${available} wolne miejsca`,
    className: "is-open",
    available,
  };
}

function ServiceAvatar({ service, size = "normal" }) {
  const name = service?.owner_name || service?.freelancer_name || "Wykonawca";
  const image = service?.owner_avatar_url || service?.freelancer_avatar_url || "";

  return (
    <span className={`ih5-service-avatar is-${size}`} aria-hidden="true">
      {image ? <img src={image} alt="" /> : name.charAt(0).toUpperCase()}
    </span>
  );
}

function ServiceCard({ service }) {
  const capacity = serviceCapacity(service);
  const isCustom = service.price_mode === 'custom';
  const en = useSitePreferences().language === 'en';
  const category = en ? translateUiText(service.category) : service.category;
  const days = Number(service.delivery_days);
  const revisions = Number(service.revisions);
  const serviceUrl = '/services/' + service.id;
  const ownerName = service.owner_name || service.freelancer_name || (en ? 'IdeaHire freelancer' : 'Wykonawca IdeaHire');
  const Owner = service.freelancer_id ? Link : 'div';
  return <article className="ih78-service-offer">
    <header className="ih86-offer-heading">
      <div className="ih78-offer-field"><span>{category}</span>{service.subcategory && <small>{en ? translateUiText(service.subcategory) : service.subcategory}</small>}</div>
      <span className={'ih86-offer-availability ' + capacity.className}>{en ? translateUiText(capacity.label) : capacity.label}</span>
    </header>
    <div className="ih78-offer-copy">
      <h2><Link to={serviceUrl}>{service.title}</Link></h2>
      {service.summary && <p>{service.summary}</p>}
    </div>
    <div className="ih80-offer-terms">
      <div className={'ih78-offer-price' + (isCustom ? ' is-custom' : '')}><span>{isCustom ? (en ? 'Quote' : 'Wycena') : (en ? 'From' : 'Od')}</span><strong>{isCustom ? (en ? 'On request' : 'Indywidualna') : formatMoney(service.base_price)}</strong></div>
      <dl className="ih80-offer-facts">
        {service.delivery_days != null && days > 0 && <div><dt>{en ? 'Delivery' : 'Realizacja'}</dt><dd>{days} {en ? (days === 1 ? 'day' : 'days') : (days === 1 ? 'dzień' : 'dni')}</dd></div>}
        {service.revisions != null && revisions >= 0 && <div><dt>{en ? 'Included revisions' : 'Poprawki w cenie'}</dt><dd>{revisions}</dd></div>}
      </dl>
    </div>
    <footer className="ih78-offer-footer">
      <Owner className="ih78-offer-person" {...(service.freelancer_id ? { to: '/profile/' + service.freelancer_id } : {})}><ServiceAvatar service={service} /><span><strong>{ownerName}</strong><small>{en ? 'Freelancer' : 'Wykonawca'}</small></span></Owner>
      <Link to={serviceUrl} className="ih80-offer-open" aria-label={(en ? 'Service details: ' : 'Szczegóły usługi: ') + service.title}><span>{en ? 'Details' : 'Szczegóły'}</span><MarketIcon kind="arrow" /></Link>
    </footer>
  </article>;
}

function ServiceShell({ Navbar, children, className = "" }) {
  return (
    <div className={`page ih-market-v5 ih5-service-page ${className}`.trim()}>
      <Navbar />
      <main className="ih-market-shell">{children}</main>
    </div>
  );
}

function ServiceList({ supabase, user, navigate, Navbar }) {
  const english = useSitePreferences().language === "en";
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Wszystkie");

  useEffect(() => {
    const requestedCategory = new URLSearchParams(location.search).get("category");
    setSelectedCategory(
      SERVICE_CATEGORIES.includes(requestedCategory)
        ? requestedCategory
        : "Wszystkie"
    );
  }, [location.search]);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("list_freelancer_services", {
        p_category: selectedCategory === "Wszystkie" ? null : selectedCategory,
        p_search: search.trim() || null,
      });

      if (error) throw error;
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage(
        error?.message || "Nie udało się pobrać usług. Spróbuj ponownie."
      );
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, supabase]);

  useEffect(() => {
    const timeout = window.setTimeout(loadServices, 220);
    return () => window.clearTimeout(timeout);
  }, [loadServices]);

  function chooseCategory(category) {
    setSelectedCategory(category);
    navigate(
      category === "Wszystkie"
        ? "/services"
        : `/services?category=${encodeURIComponent(category)}`,
      { replace: true }
    );
  }

  const resultNoun = english ? (services.length === 1 ? "service" : "services") : services.length === 1 ? "usługa" : services.length % 10 >= 2 && services.length % 10 <= 4 && (services.length % 100 < 12 || services.length % 100 > 14) ? "usługi" : "usług";
  const hasFilters = Boolean(search.trim()) || selectedCategory !== "Wszystkie";

  return (
    <ServiceShell Navbar={Navbar} className="ih5-service-list-page ih75-services-page ih78-services-page">
      <MarketCatalogHero active="services" className="ih78-services-hero"
        eyebrow={english ? "Offers from freelancers" : "Oferty wykonawców"}
        title={english ? "Services" : "Usługi"}
        description={english ? "Compare the scope, price and delivery time. Choose a service for your project." : "Porównaj zakres, cenę i termin. Wybierz usługę do swojego projektu."}
        actions={<><Link className="ih79-text-action" to="/services/mine">{english ? "My services" : "Moje usługi"}</Link><Link className="ih78-add-service" to="/services/new" aria-label={english ? "Add a service" : "Dodaj usługę"}><MarketIcon kind="plus" /><span>{english ? "Add a service" : "Dodaj usługę"}</span></Link></>} />
      <MarketFilters search={search} onSearch={setSearch} categories={SERVICE_CATEGORIES} category={selectedCategory} onCategory={chooseCategory} kind="usług">
      <section className="ih78-service-results" aria-label={english ? "Services" : "Usługi"} aria-busy={loading}>
        <header className="ih78-results-heading">
          <p className="ih-result-badge" role="status" aria-live="polite" aria-atomic="true"><span>{english ? "Results" : "Wyniki"}</span>{loading ? (english ? "Finding services…" : "Szukamy usług…") : message ? (english ? "Results unavailable" : "Wyniki niedostępne") : <strong>{services.length} {resultNoun}</strong>}</p>
          {hasFilters && <button type="button" onClick={() => { setSearch(""); chooseCategory("Wszystkie"); }}><MarketIcon kind="close" />{english ? "Clear filters" : "Wyczyść filtry"}</button>}
        </header>
        {message ? (
          <div className="ih78-services-error" role="alert"><p>{message}</p><button type="button" onClick={loadServices}>{english ? "Try again" : "Spróbuj ponownie"}<MarketIcon kind="arrow" /></button></div>
        ) : loading ? (
          <SubpageLoading label={english ? "Finding services…" : "Szukamy usług…"} />
        ) : services.length > 0 ? (
          <div className="ih78-service-grid">
            {services.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
        ) : (
          <div className="ih78-services-empty">
            <div><h2>{english ? "No services found" : "Nie znaleźliśmy usług"}</h2><p>{english ? "We haven't found this service yet. Try another phrase or field." : "Nie znaleźliśmy takiej usługi. Spróbuj innej frazy lub dziedziny."}</p><Link to="/services/new">{english ? "Publish your service" : "Dodaj swoją usługę"}<MarketIcon kind="arrow" /></Link></div>
          </div>
        )}
      </section>
      </MarketFilters>
    </ServiceShell>
  );
}

function ServiceForm({ supabase, user, navigate, Navbar, editing = false }) {
  const english = useSitePreferences().language === "en";
  const { id } = useParams();
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editing || !id || !user?.id) return;

    let active = true;

    async function loadService() {
      setLoading(true);
      const { data, error } = await supabase
        .from("freelancer_services")
        .select("*")
        .eq("id", id)
        .eq("freelancer_id", user.id)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setMessage(
          error?.message || "Nie znaleziono usługi albo nie możesz jej edytować."
        );
      } else {
        setForm(serviceFormFromRow(data));
      }
      setLoading(false);
    }

    loadService();
    return () => {
      active = false;
    };
  }, [editing, id, supabase, user?.id]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
  }

  function updateCategory(value) {
    setForm((current) => ({
      ...current,
      category: value,
      subcategory: SERVICE_SUBCATEGORIES[value]?.[0] || "",
    }));
    setMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const basePrice = Number(form.basePrice);
    const deliveryDays = Number(form.deliveryDays);
    const revisions = Number(form.revisions);
    const capacityLimit = Number(form.capacityLimit);

    if (form.title.trim().length < 8) {
      setMessage("Nazwa usługi musi mieć co najmniej 8 znaków.");
      return;
    }

    if (form.summary.trim().length < 20) {
      setMessage("Dodaj krótkie podsumowanie — co najmniej 20 znaków.");
      return;
    }

    if (form.description.trim().length < 80) {
      setMessage("Opis usługi musi mieć co najmniej 80 znaków.");
      return;
    }

    if (!SERVICE_CATEGORIES.includes(form.category)) {
      setMessage("Wybierz prawidłową kategorię usługi.");
      return;
    }

    if (!(SERVICE_SUBCATEGORIES[form.category] || []).includes(form.subcategory)) {
      setMessage("Wybierz specjalizację pasującą do kategorii.");
      return;
    }

    if (splitLines(form.deliverables).length === 0) {
      setMessage("Wpisz przynajmniej jeden rezultat pracy.");
      return;
    }

    if (
      form.priceMode === "fixed" &&
      (!Number.isFinite(basePrice) || basePrice < IDEA_HIRE_PUBLIC_OFFER.orderMinimum || basePrice > IDEA_HIRE_PUBLIC_OFFER.orderLimit)
    ) {
      setMessage(`Cena stała musi mieścić się w zakresie od ${IDEA_HIRE_PUBLIC_OFFER.orderMinimum} zł do ${IDEA_HIRE_PUBLIC_OFFER.orderLimit.toLocaleString("pl-PL")} zł.`);
      return;
    }

    if (!Number.isInteger(deliveryDays) || deliveryDays < 1 || deliveryDays > 365) {
      setMessage("Termin realizacji musi mieścić się w zakresie od 1 do 365 dni.");
      return;
    }

    if (!Number.isInteger(revisions) || revisions < 0 || revisions > 100) {
      setMessage("Liczba poprawek musi mieścić się w zakresie od 0 do 100.");
      return;
    }

    if (!Number.isInteger(capacityLimit) || capacityLimit < 1 || capacityLimit > 10) {
      setMessage("Jednocześnie możesz prowadzić od 1 do 10 realizacji.");
      return;
    }

    setSaving(true);

    const payload = {
      freelancer_id: user.id,
      title: form.title.trim(),
      summary: form.summary.trim(),
      description: form.description.trim(),
      category: form.category,
      subcategory: form.subcategory.trim() || null,
      skills: splitLines(form.skills, 10),
      deliverables: splitLines(form.deliverables, 12),
      client_requirements: splitLines(form.clientRequirements, 12),
      price_mode: form.priceMode,
      base_price: form.priceMode === "fixed" ? basePrice : null,
      delivery_days: deliveryDays,
      revisions,
      capacity_limit: capacityLimit,
      queue_enabled: form.queueEnabled,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    try {
      const request = editing
        ? supabase
            .from("freelancer_services")
            .update(payload)
            .eq("id", id)
            .eq("freelancer_id", user.id)
            .select("id")
            .single()
        : supabase
            .from("freelancer_services")
            .insert(payload)
            .select("id")
            .single();

      const { data, error } = await request;
      if (error) throw error;

      navigate(`/services/${data.id}`, { replace: true });
    } catch (error) {
      setMessage(error?.message || "Nie udało się zapisać usługi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ServiceShell Navbar={Navbar} className="ih5-service-form-page">
      <SubpageHeading eyebrow={english ? "For freelancers" : "Dla wykonawców"}
        title={editing ? (english ? "Edit your service" : "Edytuj usługę") : (english ? "Add a service" : "Dodaj usługę")}
        description={english ? "Describe the result, scope, price and availability." : "Opisz rezultat, zakres, cenę i dostępność swojej usługi."}
        variant="editor" />

      {loading ? (
        <SubpageLoading label="Przygotowujemy formularz…" />
      ) : (
        <form className="ih5-service-editor" onSubmit={handleSubmit} onInvalidCapture={event => { const section = event.target.closest("details"); if (section) section.open = true; }}>
          <details className="ih5-service-editor-section" open>
            <summary className="ih76-service-step">
              <span className="ih5-service-editor-index">01</span>
              <span><strong>{english ? "Your service" : "Twoja oferta"}</strong><small>{english ? "Name, field and description" : "Nazwa, dziedzina i opis"}</small></span>
              <MarketIcon kind="chevron" />
            </summary>
            <div className="ih5-service-editor-heading">
              <p>Zacznij od efektu, który zleceniodawca łatwo zrozumie.</p>
            </div>
            <div className="ih5-service-editor-fields">
              <label className="is-wide">
                <span>Nazwa usługi *</span>
                <input
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="Np. Zaprojektuję czytelną stronę sprzedażową"
                  minLength={8}
                  maxLength={120}
                  required
                />
              </label>

              <label>
                <span>Kategoria *</span>
                <FormSelect
                  value={form.category}
                  onChange={(event) => updateCategory(event.target.value)}
                  required
                >
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </FormSelect>
              </label>

              <label>
                <span>Podkategoria *</span>
                <FormSelect
                  value={form.subcategory}
                  onChange={(event) => update("subcategory", event.target.value)}
                  required
                >
                  {(SERVICE_SUBCATEGORIES[form.category] || []).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </FormSelect>
              </label>

              <label className="is-wide">
                <span>Krótkie podsumowanie *</span>
                <AutoTextarea
                  value={form.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  placeholder="Jednym–dwoma zdaniami opisz rezultat i dla kogo jest ta usługa."
                  minLength={20}
                  maxLength={240}
                  rows={3}
                  required
                />
              </label>

              <label className="is-wide">
                <span>Pełny opis *</span>
                <AutoTextarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Opisz sposób działania, granice zakresu i rezultat. Bez danych kontaktowych i obietnic, których nie da się zweryfikować."
                  minLength={80}
                  maxLength={4000}
                  rows={9}
                  required
                />
              </label>
            </div>
          </details>

          <details className="ih5-service-editor-section">
            <summary className="ih76-service-step">
              <span className="ih5-service-editor-index">02</span>
              <span><strong>{english ? "Deliverables" : "Rezultaty pracy"}</strong><small>{english ? "Scope and client materials" : "Zakres i materiały od klienta"}</small></span>
              <MarketIcon kind="chevron" />
            </summary>
            <div className="ih5-service-editor-heading">
              <p>Krótkie punkty są łatwiejsze do porównania niż ściana tekstu.</p>
            </div>
            <div className="ih5-service-editor-fields">
              <label>
                <span>Rezultaty pracy * <em>jeden w wierszu</em></span>
                <AutoTextarea
                  value={form.deliverables}
                  onChange={(event) => update("deliverables", event.target.value)}
                  placeholder={"Gotowy projekt strony\nPliki źródłowe\nInstrukcja wdrożenia"}
                  maxLength={1400}
                  rows={6}
                  required
                />
              </label>

              <label>
                <span>Czego potrzebujesz od klienta? <em>jeden punkt w wierszu</em></span>
                <AutoTextarea
                  value={form.clientRequirements}
                  onChange={(event) => update("clientRequirements", event.target.value)}
                  placeholder={"Treści i logo\nPrzykłady stron, które się podobają\nDostęp do obecnych materiałów"}
                  maxLength={1400}
                  rows={5}
                />
              </label>

              <label className="is-wide">
                <span>Umiejętności <em>oddziel przecinkami</em></span>
                <input
                  value={form.skills}
                  onChange={(event) => update("skills", event.target.value)}
                  placeholder="Np. React, Figma, SEO"
                  maxLength={300}
                />
              </label>
            </div>
          </details>

          <details className="ih5-service-editor-section">
            <summary className="ih76-service-step">
              <span className="ih5-service-editor-index">03</span>
              <span><strong>{english ? "Delivery terms" : "Warunki realizacji"}</strong><small>{english ? "Price, timing and availability" : "Cena, terminy i dostępność"}</small></span>
              <MarketIcon kind="chevron" />
            </summary>
            <div className="ih5-service-editor-heading">
              <p>Rozmowa nie blokuje miejsca. Rezerwacja powstaje dopiero po wysłaniu oferty.</p>
            </div>
            <div className="ih5-service-editor-fields">
              <fieldset className="ih5-service-choice-field is-wide">
                <legend>Sposób wyceny *</legend>
                <label className={form.priceMode === "custom" ? "is-selected" : ""}>
                  <input
                    type="radio"
                    name="price-mode"
                    value="custom"
                    checked={form.priceMode === "custom"}
                    onChange={() => update("priceMode", "custom")}
                  />
                  <span>
                    <b>Wycena indywidualna</b>
                    <small>Cena zależy od briefu i zostanie zapisana w ofercie.</small>
                  </span>
                </label>
                <label className={form.priceMode === "fixed" ? "is-selected" : ""}>
                  <input
                    type="radio"
                    name="price-mode"
                    value="fixed"
                    checked={form.priceMode === "fixed"}
                    onChange={() => update("priceMode", "fixed")}
                  />
                  <span>
                    <b>Cena stała</b>
                    <small>Klient od początku widzi dokładną kwotę usługi.</small>
                  </span>
                </label>
              </fieldset>

              {form.priceMode === "fixed" && (
                <label>
                  <span>Cena usługi *</span>
                  <span className="ih5-service-price-input">
                    <input
                      type="number"
                      min={IDEA_HIRE_PUBLIC_OFFER.orderMinimum}
                      max={IDEA_HIRE_PUBLIC_OFFER.orderLimit}
                      step="1"
                      inputMode="numeric"
                      value={form.basePrice}
                      onChange={(event) => update("basePrice", event.target.value)}
                      required
                    />
                    <b>PLN</b>
                  </span>
                </label>
              )}

              <label>
                <span>Standardowy czas realizacji *</span>
                <span className="ih5-service-price-input">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={form.deliveryDays}
                    onChange={(event) => update("deliveryDays", event.target.value)}
                    required
                  />
                  <b>dni</b>
                </span>
              </label>

              <label>
                <span>Poprawki w cenie *</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.revisions}
                  onChange={(event) => update("revisions", event.target.value)}
                  required
                />
              </label>

              <label>
                <span>Maks. równoległych realizacji *</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.capacityLimit}
                  onChange={(event) => update("capacityLimit", event.target.value)}
                  required
                />
              </label>

              <label className="ih5-service-switch is-wide">
                <input
                  type="checkbox"
                  checked={form.queueEnabled}
                  onChange={(event) => update("queueEnabled", event.target.checked)}
                />
                <span aria-hidden="true"><i /></span>
                <b>
                  Pozwól zapytać o następny termin przy pełnym obłożeniu
                  <small>Nowe zapytanie nie rezerwuje miejsca i nie zobowiązuje do przyjęcia pracy.</small>
                </b>
              </label>
            </div>
          </details>

          {message && <p className="ih5-service-form-message" role="alert">{message}</p>}

          <footer className="ih5-service-editor-actions">
            <Link to={editing ? `/services/${id}` : "/services"}>Anuluj</Link>
            <button type="submit" disabled={saving}>
              {saving
                ? "Zapisywanie…"
                : editing
                ? "Zapisz zmiany"
                : "Opublikuj usługę"}
            </button>
          </footer>
        </form>
      )}
    </ServiceShell>
  );
}

function ServiceOrderProcess() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const en = useSitePreferences().language === "en";
  const steps = en ? [
    ["Discuss your project", "Send a brief and check availability. An inquiry does not reserve a place or start payment."],
    ["Review the offer", "The freelancer proposes scope, price and deadline. An offer reserves a place for 24 hours."],
    ["Agree and pay", "Review the final terms together. Payment through IdeaHire starts the project."],
  ] : [
    ["Porozmawiaj o projekcie", "Wyślij opis i zapytaj o dostępność. Samo zapytanie nie rezerwuje miejsca i nie uruchamia płatności."],
    ["Sprawdź ofertę", "Wykonawca proponuje zakres, cenę i termin. Po wysłaniu oferty miejsce czeka 24 godziny."],
    ["Potwierdź i opłać", "Sprawdźcie ostateczne warunki. Płatność przez IdeaHire uruchamia realizację."],
  ];
  return <section className="ih5-service-process" data-expanded={open}>
    <button type="button" id={`${id}-trigger`} aria-expanded={open} aria-controls={`${id}-content`} onClick={() => setOpen(value => !value)}><span><strong>{en ? "How to order" : "Jak zamówić"}</strong><small>{en ? "From a conversation to a finished project" : "Od rozmowy do realizacji"}</small></span><MarketIcon kind="chevron" /></button>
    <div id={`${id}-content`} className="ih-service-process-collapse" role="region" aria-labelledby={`${id}-trigger`} aria-hidden={!open} inert={open ? undefined : ""}><div className="ih-service-process-clip"><div className="ih-service-process-steps">{steps.map(([title, description], index) => <article key={title}><span className="ih-service-step-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}</div></div></div>
  </section>;
}

function ServiceInquiryDialog({ service, user, supabase, navigate, onClose }) {
  const capacity = serviceCapacity(service);
  const isFull = capacity.available === 0;
  const [brief, setBrief] = useState("");
  const [deadline, setDeadline] = useState("");
  const [materials, setMaterials] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector("#service-inquiry-title")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = oldOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", closeWithEscape);
    return () => document.removeEventListener("keydown", closeWithEscape);
  }, [onClose, saving]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (brief.trim().length < 30) {
      setMessage("Brief musi mieć co najmniej 30 znaków.");
      return;
    }

    if (!confirmed) {
      setMessage("Potwierdź, że rozumiesz zasady zapytania.");
      return;
    }

    setSaving(true);

    try {
      const { data, error } = await supabase.rpc("create_service_inquiry", {
        p_service_id: service.id,
        p_brief: brief.trim(),
        p_desired_deadline: deadline || null,
        p_materials: materials.trim() || null,
      });

      if (error) throw error;

      const conversationId = data?.conversation_id || data?.[0]?.conversation_id;
      if (!conversationId) throw new Error("Serwer nie zwrócił numeru rozmowy.");

      navigate(`/chat/${conversationId}`);
    } catch (error) {
      setMessage(error?.message || "Nie udało się otworzyć rozmowy.");
      setSaving(false);
    }
  }

  return (
    <div className="ih5-service-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section
        ref={modalRef}
        className="ih5-service-inquiry-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-inquiry-title"
        aria-describedby="service-inquiry-description"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(modalRef.current?.querySelectorAll("a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)") || [])
            .filter(control => control.tabIndex >= 0 && control.getClientRects().length);
          if (!controls.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
        }}
      >
        <header>
          <div>
            <span className="ih5-service-eyebrow">
              {isFull ? "Następny wolny termin" : "Zapytanie o realizację"}
            </span>
            <h2 id="service-inquiry-title" tabIndex={-1}>Zapytaj wykonawcę</h2>
            <p id="service-inquiry-description">Opisz, czego potrzebujesz. Szczegóły realizacji ustalisz w rozmowie.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Zamknij">×</button>
        </header>

        <div className="ih5-service-modal-summary">
          <span><MarketIcon kind="files" /></span>
          <div>
            <strong>{service.title}</strong>
            <small>
              {service.price_mode === "fixed"
                ? `Cena usługi: ${formatMoney(service.base_price)}`
                : "Wycena po ustaleniu zakresu"}
            </small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            <span>Co ma powstać? <small>(wymagane)</small></span>
            <AutoTextarea
              id="service-inquiry-brief"

              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Opisz oczekiwany efekt, zakres i odbiorców projektu."
              minLength={30}
              maxLength={2500}
              rows={6}
              required
            />

          </label>

          <div className="ih5-service-modal-fields">
            <label>
              <span>Preferowany termin <small>(opcjonalnie)</small></span>
              <IdeaHireDateField
                aria-label="Preferowany termin realizacji"
                type="date"
                min={localProjectDate()}
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </label>
            <label>
              <span>Materiały, które już masz <small>(opcjonalnie)</small></span>
              <input
                value={materials}
                onChange={(event) => setMaterials(event.target.value)}
                placeholder="Np. teksty, logo, makieta"
                maxLength={500}
              />
            </label>
          </div>

          <div className="ih5-service-inquiry-rules">
            <strong>Co dzieje się po wysłaniu?</strong>
            <p>Otworzysz rozmowę z wykonawcą. Zapytanie jest bezpłatne i nie rezerwuje miejsca.</p>
            <p>Miejsce zostaje czasowo zarezerwowane po wysłaniu oferty przez wykonawcę.
              Realizacja rusza po akceptacji warunków przez obie strony i płatności.</p>
          </div>

          <label className="ih5-service-modal-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>Rozumiem, że wysyłam zapytanie, a nie zamówienie.</span>
          </label>

          {message && <p className="ih5-service-modal-message" role="alert">{message}</p>}

          <footer>
            <button type="button" onClick={onClose} disabled={saving}>Anuluj</button>
            <button type="submit" disabled={saving || !confirmed}>
              {saving
                ? "Otwieranie rozmowy…"
                : isFull
                ? "Zapytaj o następny termin"
                : "Wyślij zapytanie"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function ServiceDetails({ supabase, user, navigate, Navbar }) {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const loadService = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc("get_freelancer_service", {
        p_service_id: id,
      });

      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Ta usługa nie jest już dostępna.");
      setService(row);
    } catch (error) {
      setMessage(error?.message || "Nie udało się otworzyć usługi.");
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  useEffect(() => {
    loadService();
  }, [loadService]);

  const capacity = useMemo(() => serviceCapacity(service), [service]);
  const isOwner = service?.freelancer_id === user?.id;
  const canAskWhenFull = service?.queue_enabled !== false;

  if (loading) {
    return (
      <ServiceShell Navbar={Navbar} className="ih5-service-detail-page">
        <SubpageLoading label="Przygotowujemy usługę…" />
      </ServiceShell>
    );
  }

  if (!service) {
    return (
      <ServiceShell Navbar={Navbar} className="ih5-service-detail-page">
        <div className="ih5-service-empty">
          <span aria-hidden="true">!</span>
          <h1>Nie możemy pokazać tej usługi</h1>
          <p>{message || "Usługa mogła zostać wstrzymana albo usunięta."}</p>
          <Link to="/services">Wróć do usług</Link>
        </div>
      </ServiceShell>
    );
  }

  const deliverables = Array.isArray(service.deliverables) ? service.deliverables : [];
  const requirements = Array.isArray(service.client_requirements)
    ? service.client_requirements
    : [];
  const skills = Array.isArray(service.skills) ? service.skills : [];

  return (
    <ServiceShell Navbar={Navbar} className="ih5-service-detail-page">
      <div className="ih5-service-detail-layout">
      <header className="ih5-service-detail-header">
        <div className="ih5-service-detail-category">
          <Link to={`/services?category=${encodeURIComponent(service.category)}`}>{service.category}</Link>
          <span>{service.subcategory || SERVICE_CATEGORY_COPY[service.category]}</span>
        </div>
        <h1>{service.title}</h1>
        <p>{service.summary}</p>
      </header>

        <article className="ih5-service-detail-main">
          <section className="ih5-service-detail-section ih-service-description">
            <h2>Opis usługi</h2>
            <div className="ih5-service-rich-copy">{service.description}</div>
          </section>

          {(deliverables.length > 0 || requirements.length > 0) && <div className="ih80-service-scope">
            {deliverables.length > 0 && <section className="ih5-service-detail-section">
              <header className="ih-service-section-title"><span aria-hidden="true">01</span><div><h2>Co otrzymasz</h2><p>Rezultaty opisane przez wykonawcę</p></div></header>
              <ul className="ih5-service-check-list">
                {deliverables.map((item, index) => (
                  <li key={`${item}-${index}`}><span aria-hidden="true">✓</span>{item}</li>
                ))}
              </ul>
            </section>}
            {requirements.length > 0 && <section className="ih5-service-detail-section ih80-scope-inputs">
              <header className="ih-service-section-title"><span aria-hidden="true">02</span><div><h2>Materiały od Ciebie</h2><p>Przygotuj je przed rozpoczęciem realizacji</p></div></header>
              <ol className="ih5-service-requirement-list">
                {requirements.map((item, index) => (
                  <li key={`${item}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{item}</li>
                ))}
              </ol>
            </section>}
          </div>}

          <ServiceOrderProcess />
        </article>

        <aside className="ih5-service-order-card">
          <div className="ih5-service-order-owner">
            <ServiceAvatar service={service} size="large" />
            <span>
              <small>Usługę realizuje</small>
              <strong>{service.owner_name || "Wykonawca IdeaHire"}</strong>
            </span>
            <Link to={`/profile/${service.freelancer_id}`} aria-label="Zobacz profil"><MarketIcon kind="arrow"/></Link>
          </div>

          <div className={"ih5-service-order-price " + (service.price_mode === "fixed" ? "is-fixed" : "is-custom")}>
            <div className="ih80-order-amount">
              <span>{service.price_mode === "fixed" ? "Cena usługi" : "Sposób wyceny"}</span>
              <strong>
                {service.price_mode === "fixed"
                  ? formatMoney(service.base_price)
                  : "Indywidualna"}
              </strong>
            </div>
            <small>
              {service.price_mode === "fixed"
                ? "Pełna kwota dla wykonawcy. Opłatę IdeaHire zobaczysz przed płatnością."
                : "Dokładna cena pojawi się w ofercie po poznaniu briefu."}
            </small>
          </div>

          <dl className="ih5-service-order-facts">
            <div><dt>Realizacja</dt><dd>{service.delivery_days} dni</dd></div>
            <div><dt>Poprawki w cenie</dt><dd>{service.revisions}</dd></div>
          </dl>

          <span className={`ih5-service-capacity ${capacity.className}`}>
            <i aria-hidden="true" />
            {capacity.label}
          </span>

          {isOwner ? (
            <Link className="ih5-service-order-button" to={`/services/${service.id}/edit`}>
              Edytuj usługę
            </Link>
          ) : capacity.available > 0 || canAskWhenFull ? (
            <button
              type="button"
              className="ih5-service-order-button"
              onClick={() => setInquiryOpen(true)}
            >
              {capacity.available > 0
                ? "Zapytaj o realizację"
                : "Zapytaj o następny termin"}
            </button>
          ) : (
            <button type="button" className="ih5-service-order-button" disabled>
              Brak wolnych terminów
            </button>
          )}

          <p className="ih5-service-order-legal">
            Najpierw ustalasz zakres w rozmowie. Realizacja rusza po akceptacji
            warunków przez obie strony i płatności.
          </p>

          {skills.length > 0 && (
            <div className="ih5-service-skill-list">
              {skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          )}
        </aside>
      </div>

      {inquiryOpen && (
        <ServiceInquiryDialog
          service={service}
          user={user}
          supabase={supabase}
          navigate={navigate}
          onClose={() => setInquiryOpen(false)}
        />
      )}
    </ServiceShell>
  );
}

function MyServices({ supabase, user, Navbar }) {
  const english = useSitePreferences().language === "en";
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("freelancer_services")
      .select("*")
      .eq("freelancer_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) setMessage(error.message);
    else setServices(data || []);
    setLoading(false);
  }, [supabase, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(service) {
    const nextStatus = service.status === "active" ? "paused" : "active";
    setBusyId(service.id);
    setMessage("");

    const { error } = await supabase
      .from("freelancer_services")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", service.id)
      .eq("freelancer_id", user.id);

    if (error) setMessage(error.message);
    else {
      setServices((current) => current.map((item) =>
        item.id === service.id ? { ...item, status: nextStatus } : item
      ));
    }
    setBusyId("");
  }

  return (
    <ServiceShell Navbar={Navbar} className="ih5-my-services-page">
      <SubpageHeading eyebrow={english ? "Freelancer workspace" : "Panel wykonawcy"}
        title={english ? "My services" : "Moje usługi"}
        description={english ? "Edit your offers, check availability and manage visibility." : "Edytuj oferty, sprawdzaj dostępność i zarządzaj widocznością."}
        actions={<Link className="ih5-button is-primary" to="/services/new"><MarketIcon kind="plus" />{english ? "Add a service" : "Dodaj usługę"}</Link>} />

      {message && <p className="ih5-service-form-message" role="alert">{message}</p>}

      {loading ? (
        <SubpageLoading label={english ? "Loading your services…" : "Przygotowujemy Twoje usługi…"} />
      ) : services.length > 0 ? (
        <div className="ih5-my-services-list">
          {services.map((service) => (
            <article key={service.id}>
              <span className="ih5-service-category-mark" aria-hidden="true">
                <MarketIcon kind="files" />
              </span>
              <div className="ih5-my-service-copy">
                <span>{service.category}</span>
                <h2>{service.title}</h2>
                <p>{service.summary}</p>
              </div>
              <div className="ih5-my-service-state">
                <span className={service.status === "active" ? "is-active" : "is-paused"}>
                  {service.status === "active" ? "Widoczna" : "Wstrzymana"}
                </span>
                <small>Aktualizacja: {formatServiceDate(service.updated_at)}</small>
              </div>
              <div className="ih5-my-service-actions">
                <Link to={`/services/${service.id}`}>Podgląd</Link>
                <Link to={`/services/${service.id}/edit`}>Edytuj</Link>
                <button
                  type="button"
                  disabled={busyId === service.id}
                  onClick={() => toggleStatus(service)}
                >
                  {busyId === service.id
                    ? "Zapisywanie…"
                    : service.status === "active"
                    ? "Wstrzymaj"
                    : "Wznów"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ih5-service-empty">
          <span aria-hidden="true">+</span>
          <h2>Jeszcze nie masz własnej usługi</h2>
          <p>Opisz konkretny rezultat, ustaw dostępność i daj klientom prosty start rozmowy.</p>
          <Link to="/services/new">Utwórz pierwszą usługę</Link>
        </div>
      )}
    </ServiceShell>
  );
}

export default function ServiceMarketplace({
  mode = "list",
  supabase,
  user,
  navigate,
  Navbar,
}) {
  if (mode === "new") {
    return (
      <ServiceForm
        supabase={supabase}
        user={user}
        navigate={navigate}
        Navbar={Navbar}
      />
    );
  }

  if (mode === "edit") {
    return (
      <ServiceForm
        supabase={supabase}
        user={user}
        navigate={navigate}
        Navbar={Navbar}
        editing
      />
    );
  }

  if (mode === "detail") {
    return (
      <ServiceDetails
        supabase={supabase}
        user={user}
        navigate={navigate}
        Navbar={Navbar}
      />
    );
  }

  if (mode === "mine") {
    return (
      <MyServices supabase={supabase} user={user} Navbar={Navbar} />
    );
  }

  return (
    <ServiceList
      supabase={supabase}
      user={user}
      navigate={navigate}
      Navbar={Navbar}
    />
  );
}

/* P11: katalog freelancerów i zapytania — połączone bez zmiany zachowania. */
// IdeaHire P11 — public profile data and project enquiries, never private contact data.
export const FREELANCER_CATEGORIES = [
  "Programowanie", "Grafika i design", "Marketing", "Copywriting", "Video",
  "Fotografia", "AI i automatyzacje", "Dane, analizy i research",
  "Biznes i e-commerce", "Architektura, wnętrza i CAD",
];

export function normalizeFreelancerSearch(value) {
  return String(value || "").trim().slice(0, 100);
}

export function getFreelancerResult(data) {
  const payload = Array.isArray(data) ? data[0] : data;
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: Math.max(0, Number(payload?.total) || 0),
  };
}

export function getInquiryError(error) {
  const code = String(error?.message || "");
  if (/IH_CONTACT_DISABLED/.test(code)) return "Ta osoba nie przyjmuje teraz nowych zapytań. Możesz nadal obejrzeć jej profil.";
  if (/IH_CONTACT_BLOCKED/.test(code)) return "Kontakt z tym użytkownikiem jest zablokowany.";
  if (/IH_CONTACT_LIMIT/.test(code)) return "Osiągnięto limit nowych zapytań. Wróć do prowadzonych rozmów lub spróbuj później.";
  if (/IH_CONTACT_AGE/.test(code)) return "Zapytania o współpracę są dostępne dla pełnoletnich użytkowników.";
  if (/IH_CONTACT_RESTRICTED/.test(code)) return "To konto nie może teraz rozpoczynać współpracy.";
  if (/IH_CONTACT_SELF/.test(code)) return "To Twój profil. Wybierz inną osobę do współpracy.";
  if (/IH_CONTACT_BRIEF/.test(code)) return "Dodaj tytuł i opis projektu: od 30 do 2000 znaków.";
  if (/IH_CONTACT_CONFIRM/.test(code)) return "Potwierdź, że kontakt dotyczy współpracy lub projektu do zlecenia.";
  if (/IH_CONTACT_DETAILS/.test(code)) return "Sprawdź kategorię, rezultat, budżet i termin projektu.";
  if (/IH_CONTACT_RETRY_CHANGED/.test(code)) return "Treść zapytania zmieniła się podczas wysyłania. Zamknij formularz i spróbuj ponownie.";
  if (/PGRST202|could not find.*function/i.test(code)) return "Kontakt jest chwilowo niedostępny. Spróbuj ponownie później.";
  return "Nie udało się wysłać zapytania. Spróbuj ponownie za chwilę.";
}

export function getInquiryConversationId(data) {
  const payload = Array.isArray(data) ? data[0] : data;
  return typeof payload?.conversation_id === "string" ? payload.conversation_id : null;
}

export function validateProjectInquiry(title, brief, confirmed) {
  if (String(title || "").trim().length < 3 || String(title || "").trim().length > 120) return "Podaj tytuł projektu: od 3 do 120 znaków.";
  if (String(brief || "").trim().length < 30 || String(brief || "").trim().length > 2000) return "Opisz, co chcesz zlecić: od 30 do 2000 znaków.";
  if (!confirmed) return "Potwierdź, że kontakt dotyczy projektu do zlecenia.";
  return "";
}

export function localProjectDate(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function parseProjectBudget(value) {
  const clean = String(value ?? "").replace(/\s/g, "").replace(",", ".");
  return /^\d{1,5}(\.\d{1,2})?$/.test(clean) ? Number(clean) : NaN;
}

export function validateProfileContact({ mode, title, brief, details, confirmed }, today = localProjectDate()) {
  const invalid = validateProjectInquiry(title, brief, confirmed);
  if (invalid) return invalid;
  if (mode === "message") return "";
  if (mode !== "project") return "Wybierz rodzaj kontaktu.";
  if (!FREELANCER_CATEGORIES.includes(details.category)) return "Wybierz kategorię projektu.";
  if (String(details.deliverables || "").trim().length < 3 || String(details.deliverables || "").trim().length > 1000) return "Podaj oczekiwany rezultat: od 3 do 1000 znaków.";
  if (details.budget !== null && (!Number.isFinite(details.budget) || details.budget < IDEA_HIRE_PUBLIC_OFFER.orderMinimum || details.budget > IDEA_HIRE_PUBLIC_OFFER.orderLimit || Math.abs(details.budget * 100 - Math.round(details.budget * 100)) > 0.000001)) return `Podaj budżet od ${IDEA_HIRE_PUBLIC_OFFER.orderMinimum} do ${IDEA_HIRE_PUBLIC_OFFER.orderLimit.toLocaleString("pl-PL")} zł, z dokładnością do grosza, lub wybierz „Do ustalenia”.`;
  if (details.deadline) {
    const date = new Date(`${details.deadline}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.deadline) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== details.deadline || details.deadline < today) return "Wybierz dzisiejszy lub przyszły termin, albo „Do ustalenia”.";
  }
  if (String(details.delivery_format || "").length > 200 || String(details.materials || "").length > 700) return "Skróć informacje o formacie lub materiałach.";
  return "";
}

export function profileInquiryToJob(inquiry) {
  if (!inquiry) return null;
  const details = inquiry.project_details && typeof inquiry.project_details === "object" ? inquiry.project_details : {};
  return {
    title: inquiry.title, description: inquiry.brief, contact_kind: inquiry.contact_kind || "project",
    budget: typeof details.budget === "number" ? details.budget : null, budget_negotiable: true,
    category: details.category || "", project_deadline: details.deadline || "",
    project_details: details,
  };
}

export function MarketplaceSwitch({ active = "services" }) {
  return <SubpageCatalogTabs active={active === 'freelancers' ? 'people' : active} />;
}

export function ProjectInquiryDialog(props) {
  return props.mode === "message" ? <ProfileMessageDialog {...props} /> : <ProjectInquiryFormDialog {...props} />;
}

function ProfileMessageDialog({ profile, supabase, navigate, onClose }) {
  const id = useId();
  const en = useSitePreferences().language === "en";
  const copy = (pl, english) => en ? english : pl;
  const rootRef = useRef(null), draftRef = useRef(null), requestRef = useRef(null), sendingRef = useRef(false);
  const [draft, setDraft] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const app = document.getElementById("root"), inert = app?.inert;
    document.body.style.overflow = "hidden";
    if (app) app.inert = true;
    const viewport = window.visualViewport;
    const measure = () => {
      rootRef.current?.style.setProperty("--ih-contact-height", `${viewport?.height || window.innerHeight}px`);
      rootRef.current?.style.setProperty("--ih-contact-top", `${viewport?.offsetTop || 0}px`);
      if (rootRef.current) rootRef.current.dataset.compact = String((viewport?.height || window.innerHeight) < 500);
    };
    measure();
    viewport?.addEventListener("resize", measure);
    viewport?.addEventListener("scroll", measure);
    rootRef.current?.querySelector("button")?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (app) app.inert = Boolean(inert);
      viewport?.removeEventListener("resize", measure);
      viewport?.removeEventListener("scroll", measure);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);
  function keyboard(event) {
    if (event.key === "Escape" && !sendingRef.current) { event.preventDefault(); onClose(); }
    if (event.key !== "Tab") return;
    const items = [...(rootRef.current?.querySelectorAll("button:not(:disabled),textarea:not(:disabled),input:not(:disabled),a[href]") || [])].filter(item => item.getClientRects().length);
    if (!items.length) return;
    if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
  }
  async function submit(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    const brief = draft.trim();
    const title = copy("Rozmowa o projekcie", "Project conversation");
    const invalid = validateProjectInquiry(title, brief, confirmed);
    if (invalid) { setError(invalid); return; }
    sendingRef.current = true; setSending(true); setError("");
    try {
      const signature = JSON.stringify([profile.id, title, brief]);
      if (requestRef.current?.signature !== signature) requestRef.current = { signature, id: window.crypto.randomUUID() };
      const { data, error: rpcError } = await supabase.rpc("create_ideahire_profile_contact", {
        p_recipient_id: profile.id, p_title: title, p_brief: brief, p_project_only: confirmed,
        p_request_id: requestRef.current.id, p_contact_kind: "message", p_project_details: {},
      });
      if (rpcError) throw rpcError;
      const conversationId = getInquiryConversationId(data);
      if (!conversationId) throw new Error("Missing conversation");
      onClose(); navigate(`/chat/${conversationId}`);
    } catch (rpcError) { setError(getInquiryError(rpcError)); setSending(false); sendingRef.current = false; }
  }
  return createPortal(<div className="ih-profile-chat-backdrop" ref={rootRef} onKeyDown={keyboard} onClick={event => { if (event.target === event.currentTarget && !sendingRef.current) onClose(); }}>
    <section className="ih-profile-chat" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-intro`}>
      <header className="ih-profile-chat-header">
        <span className="ih-profile-chat-avatar" aria-hidden="true">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : Array.from(profile.name || "F")[0]}</span>
        <div><h2 id={`${id}-title`}>{profile.name || "Freelancer"}</h2><p>{copy("Rozmowa o projekcie", "Project conversation")}</p></div>
        <button type="button" onClick={onClose} disabled={sending} aria-label={copy("Zamknij rozmowę", "Close conversation")}><MarketIcon kind="close" /></button>
      </header>
      <div className="ih-profile-chat-content">
        <p id={`${id}-intro`} className="ih-profile-chat-notice">{copy("Zapytaj o zakres i dostępność. Po wysłaniu przejdziesz do rozmowy w IdeaHire.", "Ask about scope and availability. Sending opens your IdeaHire conversation.")}</p>
        <div className="ih-profile-chat-empty"><MarketIcon kind="message" /><h3>{copy("Tu zaczyna się współpraca", "Start with a conversation")}</h3><p>{copy("Opisz, czego potrzebujesz. Szczegóły ustalicie w rozmowie.", "Describe what you need. Discuss the details together.")}</p></div>
        <div className="ih-profile-chat-next"><MarketIcon kind="plus" /><div><strong>{copy("Najpierw rozmowa, potem zlecenie", "Chat first, then prepare the project")}</strong><p>{copy("Po odpowiedzi wykonawcy możesz otworzyć panel zakresu, ceny i terminu.", "After the freelancer replies, you can prepare scope, price and deadline.")}</p></div></div>
      </div>
      <form className="ih-profile-chat-form" onSubmit={submit}>
        <label className="ih-profile-chat-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={sending} required /><span>{copy("Piszę w sprawie projektu. Nie wysyłam reklam ani ofert własnych usług.", "I am asking about a project, not sending ads or selling my own services.")}</span></label>
        <div className="ih-profile-chat-composer"><label className="ih5-sr-only" htmlFor={`${id}-draft`}>{copy("Twoja wiadomość", "Your message")}</label><AutoTextarea id={`${id}-draft`} ref={draftRef} rows={3} value={draft} onChange={event => setDraft(event.target.value)} minLength={30} maxLength={2000} required disabled={sending} placeholder={copy("Napisz, w czym potrzebujesz pomocy…", "Tell them what you need help with…")} /><button type="submit" disabled={sending || !confirmed || draft.trim().length < 30} aria-label={copy("Wyślij wiadomość", "Send message")}>{sending ? <span aria-hidden="true">…</span> : <MarketIcon kind="arrow" />}</button></div>
        <div className="ih-profile-chat-foot"><small>{copy("Warunki i płatność ustalicie w panelu zlecenia.", "Agree on terms and payment in the project panel.")}</small></div>
        {error && <p role="alert" className="ih-profile-chat-error">{error}</p>}
      </form>
    </section>
  </div>, document.body);
}

function ProjectInquiryFormDialog({ profile, supabase, navigate, onClose, mode = "project" }) {
  const id = useId();
  const rootRef = useRef(null);
  const requestId = useRef(null);
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const sendingRef = useRef(false);
  const [category, setCategory] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetOpen, setBudgetOpen] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [deadlineOpen, setDeadlineOpen] = useState(true);
  const [deliveryFormat, setDeliveryFormat] = useState("");
  const [materials, setMaterials] = useState("");
  const isProject = mode === "project";
  useEffect(() => {
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    rootRef.current?.querySelector("input[type=text]")?.focus();
    return () => { document.body.style.overflow = oldOverflow; previous?.focus?.({ preventScroll: true }); };
  }, []);
  function keyboard(event) {
    if (event.key === "Escape" && !sending) { event.preventDefault(); onClose(); }
    if (event.key !== "Tab") return;
    const items = Array.from(rootRef.current?.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]") || []).filter((element) => element.getClientRects().length);
    if (!items.length) { event.preventDefault(); rootRef.current?.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  async function submit(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    const details = isProject ? { category, deliverables: deliverables.trim(), budget: budgetOpen ? null : parseProjectBudget(budget), deadline: deadlineOpen ? null : deadline, delivery_format: deliveryFormat.trim(), materials: materials.trim() } : {};
    const invalid = validateProfileContact({ mode, title, brief, details, confirmed });
    if (invalid) { setError(invalid); return; }
    sendingRef.current = true;
    setSending(true); setError("");
    try {
      const signature = JSON.stringify([profile.id, mode, title.trim(), brief.trim(), details]);
      if (requestId.current?.signature !== signature) requestId.current = { signature, id: window.crypto.randomUUID() };
      const { data, error: rpcError } = await supabase.rpc("create_ideahire_profile_contact", {
        p_recipient_id: profile.id, p_title: title.trim(), p_brief: brief.trim(), p_project_only: confirmed, p_request_id: requestId.current.id,
        p_contact_kind: mode, p_project_details: details,
      });
      if (rpcError) throw rpcError;
      const conversationId = getInquiryConversationId(data);
      if (!conversationId) throw new Error("Missing conversation");
      onClose(); navigate(`/chat/${conversationId}`);
    } catch (rpcError) { setError(getInquiryError(rpcError)); setSending(false); sendingRef.current = false; }
  }
  return createPortal(<div className="ih11-dialog-backdrop ih12-contact-backdrop" onClick={(event) => { if (event.target === event.currentTarget && !sendingRef.current) onClose(); }}>
    <section className="ih12-contact-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-intro`} tabIndex={-1} ref={rootRef} onKeyDown={keyboard}>
      <header><div><span className="ih12-kicker">{isProject ? "Nowy projekt" : "Dobry początek współpracy"}</span><h2 id={`${id}-title`}>{isProject ? "Zleć pracę" : "Napisz wiadomość"}</h2></div>
        <button type="button" className="ih12-icon-button" aria-label="Zamknij zapytanie" onClick={onClose} disabled={sending}><MarketIcon kind="close" /></button>
      </header>
      <div className="ih12-contact-person"><span className="ih12-contact-avatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : Array.from(profile.name || "F")[0]}</span><div><strong>{profile.name || "Freelancer"}</strong><small>{isProject ? "Otrzyma opis projektu i Twoją propozycję." : "Otrzyma wiadomość w IdeaHire."}</small></div></div>
      <p id={`${id}-intro`}>{isProject ? "Zbierz najważniejsze informacje. Ostateczne warunki zaakceptujecie później w rozmowie." : "Zapytaj o dostępność, doświadczenie lub szczegóły współpracy."}</p>
      <form onSubmit={submit}>
        <div className="ih12-contact-fields">
          {isProject && <h3 className="ih12-form-section"><span>01</span> Pomysł i zakres</h3>}
          <label htmlFor={`${id}-subject`}>{isProject ? "Nazwa projektu *" : "Temat wiadomości *"}<input id={`${id}-subject`} type="text" value={title} minLength={3} maxLength={120} onChange={(event) => setTitle(event.target.value)} disabled={sending} placeholder={isProject ? "Np. strona dla mojej marki" : "Np. dostępność do projektu strony"} required /></label>
          {isProject && <label htmlFor={`${id}-category`}>Kategoria *<FormSelect id={`${id}-category`} value={category} onChange={(event) => setCategory(event.target.value)} disabled={sending} required><option value="">Wybierz kategorię</option>{FREELANCER_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</FormSelect></label>}
          <label htmlFor={`${id}-brief`}>{isProject ? "Co ma zostać wykonane? *" : "Twoja wiadomość *"}<AutoTextarea id={`${id}-brief`} rows={isProject ? 4 : 5} value={brief} minLength={30} maxLength={2000} onChange={(event) => setBrief(event.target.value)} disabled={sending} placeholder={isProject ? "Cel projektu, zakres prac i najważniejsze wymagania…" : "Napisz, w czym potrzebujesz pomocy i o co chcesz zapytać…"} required /></label>

          {isProject && <>
            <label htmlFor={`${id}-deliverables`}>Oczekiwany rezultat *<AutoTextarea id={`${id}-deliverables`} rows={2} value={deliverables} minLength={3} maxLength={1000} onChange={(event) => setDeliverables(event.target.value)} disabled={sending} placeholder="Np. działająca strona z 5 podstronami i pliki projektu" required /></label>
            <h3 className="ih12-form-section"><span>02</span> Budżet i termin</h3>
            <div className="ih12-contact-grid">
              <div><label htmlFor={`${id}-budget`}>Proponowany budżet (PLN)<input id={`${id}-budget`} type="text" inputMode="decimal" value={budget} maxLength={12} onChange={(event) => setBudget(event.target.value)} disabled={sending || budgetOpen} placeholder={budgetOpen ? "Do ustalenia" : "Np. 1500"} required={!budgetOpen} /></label><label className="ih12-inline-check"><input type="checkbox" checked={budgetOpen} onChange={(event) => setBudgetOpen(event.target.checked)} disabled={sending} />Do ustalenia w rozmowie</label></div>
              <div><label htmlFor={`${id}-deadline`}>Oczekiwany termin<IdeaHireDateField aria-label="Oczekiwany termin realizacji" id={`${id}-deadline`} type="date" min={localProjectDate()} value={deadline} onChange={(event) => setDeadline(event.target.value)} disabled={sending || deadlineOpen} required={!deadlineOpen} /></label><label className="ih12-inline-check"><input type="checkbox" checked={deadlineOpen} onChange={(event) => setDeadlineOpen(event.target.checked)} disabled={sending} />Do ustalenia w rozmowie</label></div>
            </div>
            <small>Budżet dotyczy wynagrodzenia wykonawcy. Ostateczną cenę i opłatę IdeaHire zobaczysz przed płatnością.</small>
            <h3 className="ih12-form-section"><span>03</span> Materiały i przekazanie</h3>
            <label htmlFor={`${id}-format`}>Format przekazania (opcjonalnie)<input id={`${id}-format`} type="text" value={deliveryFormat} maxLength={200} onChange={(event) => setDeliveryFormat(event.target.value)} disabled={sending} placeholder="Np. Figma, PDF, pliki źródłowe" /></label>
            <label htmlFor={`${id}-materials`}>Co dostarczysz wykonawcy? (opcjonalnie)<AutoTextarea id={`${id}-materials`} rows={2} value={materials} maxLength={700} onChange={(event) => setMaterials(event.target.value)} disabled={sending} placeholder="Np. logo, teksty, inspiracje. Pliki dodasz w rozmowie." /></label>
          </>}
          <label className="ih12-inline-check ih12-contact-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} disabled={sending} required /><span>Kontakt dotyczy współpracy lub projektu do zlecenia. Nie wysyłam reklamy ani oferty sprzedaży własnych usług.</span></label>
          {error && <p className="ih12-contact-error" role="alert">{error}</p>}
        </div>
        <footer><span>Wysłanie {isProject ? "projektu" : "wiadomości"} nie zawiera umowy ani nie uruchamia płatności.</span><button className="ih12-button is-primary" type="submit" disabled={sending}>{sending ? "Wysyłanie…" : isProject ? "Wyślij opis projektu" : "Wyślij wiadomość"}<MarketIcon kind="arrow" /></button></footer>
      </form>
    </section>
  </div>, document.body);
}

export function ProfileContactAction({ profile, user, supabase, navigate, disabled = false, canContact = true }) {
  const [available, setAvailable] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    let active = true; setAvailable(false); setResolved(false); setOpen(false);
    if (!profile?.id || profile.id === user?.id || disabled) { setResolved(true); return undefined; }
    supabase.rpc("get_ideahire_profile_contact", { p_user_id: profile.id }).then(({ data, error }) => {
      if (!active) return;
      setAvailable(!error && data?.allow_project_inquiries === true); setResolved(true);
    }).catch(() => { if (active) { setAvailable(false); setResolved(true); } });
    return () => { active = false; };
  }, [profile?.id, user?.id, disabled, supabase]);
  if (profile?.id === user?.id || disabled) return null;
  return <div className="ih11-profile-contact">
    <div className="ih12-contact-actions"><button className="ih11-button is-primary" type="button" disabled={!resolved || !available || !canContact} onClick={() => setOpen("message")}><MarketIcon kind="message" />Napisz wiadomość</button></div>
    <small>{!resolved ? "Sprawdzanie dostępności…" : !canContact ? "Zapytania o współpracę są dostępne dla pełnoletnich kont." : available ? "Napisz o projekcie i ustal szczegóły w rozmowie." : "Ta osoba nie przyjmuje teraz nowych zapytań o projekt."}</small>
    {open && <ProjectInquiryDialog key={open} mode={open} profile={profile} supabase={supabase} navigate={navigate} onClose={() => setOpen(null)} />}
  </div>;
}

export function FreelancerVisibility({ supabase, user, canContact = true }) {
  const [settings, setSettings] = useState({ directory_visible: false, allow_project_inquiries: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    setLoading(true); setFailed(false); setMessage("");
    if (!user?.id) { setLoading(false); return undefined; }
    supabase.rpc("get_my_ideahire_profile_discovery").then(({ data, error }) => {
      if (!mounted) return;
      if (error) { setFailed(true); setMessage("Nie udało się pobrać ustawień widoczności. Odśwież stronę i spróbuj ponownie."); }
      else setSettings({ directory_visible: data?.directory_visible === true, allow_project_inquiries: data?.allow_project_inquiries === true });
      setLoading(false);
    }).catch(() => { if (mounted) { setFailed(true); setMessage("Nie udało się pobrać ustawień widoczności. Odśwież stronę i spróbuj ponownie."); setLoading(false); } });
    return () => { mounted = false; };
  }, [supabase, user?.id]);
  async function save(event) {
    event.preventDefault(); if (saving || failed) return;
    setSaving(true); setMessage("");
    try {
      const { error } = await supabase.rpc("save_my_ideahire_profile_discovery", {
        p_directory_visible: settings.directory_visible, p_allow_project_inquiries: settings.allow_project_inquiries,
      });
      if (error) throw error;
      setMessage("Ustawienia widoczności i kontaktu zapisane.");
    } catch (error) { setMessage(getInquiryError(error)); }
    finally { setSaving(false); }
  }
  return <section className="ih11-visibility-panel" aria-label="Widoczność i zapytania o współpracę">
    <span className="ih11-eyebrow">Twój profil w katalogu</span><h2>Widoczność i kontakt</h2>
    <p>Pokaż swój profil osobom szukającym pomocy. To Ty wybierasz, czy mogą pisać do Ciebie w sprawie współpracy i projektów do zlecenia.</p>
    <form onSubmit={save}>
      <label className="ih11-setting"><input type="checkbox" checked={settings.directory_visible} disabled={loading || saving || failed || !canContact} onChange={(event) => setSettings((previous) => ({ ...previous, directory_visible: event.target.checked }))} /><span><b>Pokaż mnie w przeglądzie freelancerów</b><small>Widoczne będą dane publicznego profilu. E-mail i data urodzenia pozostają prywatne.</small></span></label>
      <label className="ih11-setting"><input type="checkbox" checked={settings.allow_project_inquiries} disabled={loading || saving || failed || !canContact} onChange={(event) => setSettings((previous) => ({ ...previous, allow_project_inquiries: event.target.checked }))} /><span><b>Przyjmuj wiadomości o współpracy i projekty</b><small>Pozwól zalogowanym, pełnoletnim osobom pisać w sprawie zlecenia pracy. Nie jest to zgoda na reklamy.</small></span></label>
      {!canContact && <p className="ih11-notice">Te ustawienia są dostępne dla pełnoletnich kont.</p>}
      {message && <p className="ih11-notice" role="status">{message}</p>}
      <button className="ih11-button is-quiet" disabled={loading || saving || failed || !canContact}>{loading ? "Ładowanie…" : saving ? "Zapisywanie…" : "Zapisz widoczność"}</button>
    </form>
  </section>;
}

export function FreelancerDirectory({ supabase, user, navigate, Navbar, canContact = true }) {
  const english = useSitePreferences().language === "en";
  const location = useLocation();
  const requestedCategory = new URLSearchParams(location.search).get("category");
  const category = FREELANCER_CATEGORIES.includes(requestedCategory) ? requestedCategory : "Wszystkie";
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const requestRef = useRef(0);
  const pageSize = 12;
  useEffect(() => { setPage(0); }, [search, category]);
  useEffect(() => {
    let current = true;
    const request = ++requestRef.current;
    setLoading(true); setError("");
    const timer = window.setTimeout(async () => {
      try {
        const { data, error: rpcError } = await supabase.rpc("list_ideahire_freelancers", {
          p_search: normalizeFreelancerSearch(search) || null, p_category: category === "Wszystkie" ? null : category,
          p_offset: page * pageSize, p_limit: pageSize,
        });
        if (!current || request !== requestRef.current) return;
        if (rpcError) throw rpcError;
        setResult(getFreelancerResult(data));
      } catch { if (current && request === requestRef.current) { setResult({ items: [], total: 0 }); setError("Nie udało się pobrać freelancerów. Spróbuj ponownie."); } }
      finally { if (current && request === requestRef.current) setLoading(false); }
    }, 220);
    return () => { current = false; window.clearTimeout(timer); };
  }, [supabase, search, category, page, refresh]);
  return <div className="page ih-market-v5 ih5-service-page ih11-freelancers ih75-people-page">
    <Navbar /><main className="ih-market-shell">
      <MarketCatalogHeader eyebrow={english ? "People for your project" : "Ludzie do Twojego projektu"} title={english ? "Freelancers" : "Freelancerzy"} description={english ? "Compare skills, experience and portfolios. Agree on the details in a conversation." : "Porównaj umiejętności, doświadczenie i portfolio. Szczegóły ustalisz w rozmowie."}
        tabs={<MarketplaceSwitch active="freelancers" />} count={result.total} noun="profiles" status={loading ? "Szukamy freelancerów…" : error ? "Wyniki niedostępne" : undefined}
        actions={<Link className="ih11-button is-quiet" to="/account#account-profile-data">{english ? "My profile" : "Mój profil"}</Link>} />
      <MarketFilters search={search} onSearch={setSearch} categories={FREELANCER_CATEGORIES} category={category} onCategory={(value) => { setPage(0); navigate(value === "Wszystkie" ? "/freelancers" : `/freelancers?category=${encodeURIComponent(value)}`, { replace: true }); }} kind="freelancerów">
      <section className="ih11-directory-results" aria-busy={loading} aria-label="Wyniki wyszukiwania freelancerów">
        <h2 className="ih5-sr-only">{category === "Wszystkie" ? "Poznaj freelancerów" : category}</h2>
        {error ? <div className="ih11-empty" role="alert"><h3>Spróbujmy jeszcze raz.</h3><p>{error}</p><button className="ih11-button is-quiet" onClick={() => setRefresh((value) => value + 1)}>Odśwież</button></div> : loading ? <SubpageLoading label={english ? "Finding freelancers…" : "Szukamy freelancerów…"} /> : result.items.length ? <div className="ih11-freelancer-grid" key={`${page}-${category}-${normalizeFreelancerSearch(search)}`}>
          {result.items.map((profile, index) => {
            const completed = Math.max(0, Number(profile.completed_jobs) || 0);
            const reviews = Math.max(0, Number(profile.positive_reviews) || 0);
            const plural = (value, one, few, many) => value === 1 ? one : value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 12 || value % 100 > 14) ? few : many;
            const own = profile.id === user?.id;
            const skills = (Array.isArray(profile.skills) ? profile.skills : []).slice(0, 3);
            return <article className="ih11-freelancer-card ih73-person-card ih79-person" key={profile.id} style={{ "--ih11-order": Math.min(index, 5) }}>
              <div className="ih80-person-main">
                <div className="ih11-freelancer-person">
                  <Link className="ih11-freelancer-avatar" to={`/profile/${profile.id}`} aria-label={`${english ? 'Profile' : 'Profil'}: ${profile.name || 'freelancer'}`}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{Array.from(profile.name || 'F')[0]}</span>}</Link>
                  <div><h3><Link to={`/profile/${profile.id}`}>{profile.name || 'Freelancer'}</Link></h3>{profile.specialization && <p>{profile.specialization}</p>}</div>
                </div>
                {profile.about && <p className="ih11-freelancer-about">{profile.about}</p>}
                {skills.length > 0 && <div className="ih11-freelancer-skills" aria-label={english ? 'Skills' : 'Umiejętności'}>{skills.map(skill => <span key={skill}>{skill}</span>)}</div>}
              </div>
              <dl className="ih11-freelancer-meta" aria-label={english ? 'Experience on IdeaHire' : 'Doświadczenie na IdeaHire'}>
                <div><dt>{english ? 'Completed jobs' : plural(completed, 'Zakończone zlecenie', 'Zakończone zlecenia', 'Zakończonych zleceń')}</dt><dd>{completed}</dd></div>
                <div><dt>{english ? 'Positive reviews' : plural(reviews, 'Pozytywna opinia', 'Pozytywne opinie', 'Pozytywnych opinii')}</dt><dd>{reviews}</dd></div>
              </dl>
              <footer className="ih12-directory-contact ih73-person-contact">
                <Link className="ih11-button is-quiet" to={`/profile/${profile.id}`}>{english ? 'View profile' : 'Zobacz profil'}<MarketIcon kind="arrow" /></Link>
                {own ? <Link className="ih11-button is-primary" to="/account#account-profile-data">{english ? 'Edit profile' : 'Edytuj profil'}</Link> : <div className="ih12-contact-actions">
                  <button type="button" className="ih11-button is-primary" disabled={!canContact || !profile.allow_project_inquiries} onClick={() => setSelected({ profile, mode: 'message' })} title={!canContact ? (english ? 'An adult account is required' : 'Wymagane pełnoletnie konto') : !profile.allow_project_inquiries ? (english ? 'New inquiries are turned off' : 'Nowe zapytania są wyłączone') : (english ? 'Ask about collaboration' : 'Zapytaj o współpracę')}><MarketIcon kind="message" />{english ? 'Write a message' : 'Wiadomość'}</button>

                </div>}
                {!own && (!canContact || !profile.allow_project_inquiries) && <small className="ih80-contact-note">{!canContact ? (english ? 'Contact requires an adult account.' : 'Kontakt wymaga pełnoletniego konta.') : (english ? 'New project inquiries are turned off.' : 'Nowe zapytania o projekt są wyłączone.')}</small>}
              </footer>
            </article>;
          })}
        </div> : <div className="ih11-empty"><h3>{search || category !== "Wszystkie" ? "Spróbuj innego wyszukiwania." : "Brak dostępnych profili"}</h3><p>{search || category !== "Wszystkie" ? "Zmień nazwę, umiejętność lub kategorię." : "Freelancerzy pojawią się tu po włączeniu widoczności na swoim koncie."}</p><Link className="ih11-button is-quiet" to="/account#account-profile-data">Ustaw widoczność profilu</Link></div>}
        {result.total > pageSize && !loading && !error && <nav className="ih11-pagination" aria-label="Strony freelancerów"><button className="ih11-icon-button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Poprzednia strona">Wstecz</button><span>{page + 1} / {Math.ceil(result.total / pageSize)}</span><button className="ih11-icon-button" disabled={(page + 1) * pageSize >= result.total} onClick={() => setPage((value) => value + 1)} aria-label="Następna strona">Dalej</button></nav>}
      </section>
      </MarketFilters>
      {selected && <ProjectInquiryDialog key={selected.mode} mode={selected.mode} profile={selected.profile} supabase={supabase} navigate={navigate} onClose={() => setSelected(null)} />}
    </main>
  </div>;
}

