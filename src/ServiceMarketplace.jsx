/* IdeaHire | PACZKA 12 | 2026-10-08 | Pelny plik: src/ServiceMarketplace.jsx */
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
import { MarketFilters, MarketHeader, MarketIcon, IDEA_HIRE_PUBLIC_OFFER } from "./MarketUI";

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
  Marketing: "↗",
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
  const isCustom = service.price_mode === "custom";

  return (
    <article className="ih5-service-card">
      <Link
        className="ih5-service-card-hitbox"
        to={`/services/${service.id}`}
        aria-label={`Zobacz usługę: ${service.title}`}
      />

      <div className="ih5-service-card-topline">
        <span className="ih5-service-category-mark" aria-hidden="true">
          {SERVICE_CATEGORY_MARKS[service.category] || "✦"}
        </span>
        <span className={`ih5-service-capacity ${capacity.className}`}>
          <i aria-hidden="true" />
          {capacity.label}
        </span>
      </div>

      <div className="ih5-service-card-copy">
        <span className="ih5-service-card-category">{service.category}</span>
        <h2>{service.title}</h2>
        <p>{service.summary}</p>
      </div>

      <div className="ih5-service-card-owner">
        <ServiceAvatar service={service} />
        <span>
          <strong>{service.owner_name || "Wykonawca IdeaHire"}</strong>
          <small>{service.subcategory || SERVICE_CATEGORY_COPY[service.category]}</small>
        </span>
      </div>

      <footer className="ih5-service-card-footer">
        <span>
          <small>{isCustom ? "Wycena" : "Cena usługi"}</small>
          <strong>
            {isCustom ? "Indywidualna" : `od ${formatMoney(service.base_price)}`}
          </strong>
        </span>
        <span className="ih5-service-card-arrow" aria-hidden="true">→</span>
      </footer>
    </article>
  );
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

  return (
    <ServiceShell Navbar={Navbar} className="ih5-service-list-page">
      <MarketplaceSwitch />
      <MarketHeader eyebrow="Usługi" title="Gotowy pomysł na dobry efekt." description="Wybierz gotową usługę albo przejdź do freelancerów, poznaj ich profile i napisz o projekcie, który chcesz zlecić.">
        <Link className="ih5-button is-quiet" to="/services/mine">Moje usługi</Link>
        <Link className="ih5-button is-primary" to="/services/new"><MarketIcon kind="plus" /> Dodaj usługę</Link>
      </MarketHeader>
      <MarketFilters search={search} onSearch={setSearch} categories={SERVICE_CATEGORIES} category={selectedCategory} onCategory={chooseCategory} kind="usług" />

      <section className="ih5-service-results" aria-live="polite">
        <div className="ih5-service-results-heading">
          <div>
            <span className="ih5-service-eyebrow">Katalog</span>
            <h2>
              {selectedCategory === "Wszystkie"
                ? "Wszystkie usługi"
                : selectedCategory}
            </h2>
          </div>
          <span className="ih5-service-results-count">
            {loading ? "Ładowanie" : `${services.length} wyników`}
          </span>
        </div>

        {message && (
          <div className="ih5-service-notice is-error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{message}</p>
            <button type="button" onClick={loadServices}>Spróbuj ponownie</button>
          </div>
        )}

        {loading ? (
          <div className="ih5-service-card-grid is-loading" aria-label="Ładowanie usług">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div className="ih5-service-card-skeleton" key={item} />
            ))}
          </div>
        ) : services.length > 0 ? (
          <div className="ih5-service-card-grid">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="ih5-service-empty">
            <span aria-hidden="true">◇</span>
            <h3>Nie ma jeszcze takiej usługi</h3>
            <p>Zmień wyszukiwanie albo opublikuj pierwszą ofertę w tej niszy.</p>
            <Link to="/services/new">Dodaj usługę</Link>
          </div>
        )}
      </section>
    </ServiceShell>
  );
}

function ServiceForm({ supabase, user, navigate, Navbar, editing = false }) {
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
      (!Number.isFinite(basePrice) || basePrice < 1 || basePrice > IDEA_HIRE_PUBLIC_OFFER.orderLimit)
    ) {
      setMessage("Cena stała musi mieścić się w zakresie od 1 zł do 10 000 zł.");
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
      <header className="ih5-service-form-header ih7-service-centered-header">
        <Link to={editing ? `/services/${id}` : "/services"} aria-label="Wróć">←</Link>
        <div>
          <span className="ih5-service-eyebrow">Dla wykonawców</span>
          <h1>{editing ? "Dopracuj swoją usługę" : "Pokaż, co potrafisz zrobić."}</h1>
          <p>
            Jedna czytelna oferta, konkretny rezultat i realna dostępność.
            Lokalizacja nie jest wymagana — podajesz tylko informacje potrzebne
            do jednorazowej realizacji.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="ih5-service-form-loading" aria-label="Ładowanie formularza" />
      ) : (
        <form className="ih5-service-editor" onSubmit={handleSubmit}>
          <section className="ih5-service-editor-section">
            <div className="ih5-service-editor-index">01</div>
            <div className="ih5-service-editor-heading">
              <span>Podstawa</span>
              <h2>Co dokładnie oferujesz?</h2>
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
                <small>{form.title.length}/120</small>
              </label>

              <label>
                <span>Kategoria *</span>
                <select
                  value={form.category}
                  onChange={(event) => updateCategory(event.target.value)}
                  required
                >
                  {SERVICE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Podkategoria *</span>
                <select
                  value={form.subcategory}
                  onChange={(event) => update("subcategory", event.target.value)}
                  required
                >
                  {(SERVICE_SUBCATEGORIES[form.category] || []).map((subcategory) => (
                    <option key={subcategory} value={subcategory}>{subcategory}</option>
                  ))}
                </select>
              </label>

              <label className="is-wide">
                <span>Krótkie podsumowanie *</span>
                <textarea
                  value={form.summary}
                  onChange={(event) => update("summary", event.target.value)}
                  placeholder="Jednym–dwoma zdaniami opisz rezultat i dla kogo jest ta usługa."
                  minLength={20}
                  maxLength={240}
                  rows={3}
                  required
                />
                <small>{form.summary.length}/240</small>
              </label>

              <label className="is-wide">
                <span>Pełny opis *</span>
                <textarea
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="Opisz sposób działania, granice zakresu i rezultat. Bez danych kontaktowych i obietnic, których nie da się zweryfikować."
                  minLength={80}
                  maxLength={4000}
                  rows={9}
                  required
                />
                <small>{form.description.length}/4000</small>
              </label>
            </div>
          </section>

          <section className="ih5-service-editor-section">
            <div className="ih5-service-editor-index">02</div>
            <div className="ih5-service-editor-heading">
              <span>Zakres</span>
              <h2>Co otrzyma klient?</h2>
              <p>Krótkie punkty są łatwiejsze do porównania niż ściana tekstu.</p>
            </div>
            <div className="ih5-service-editor-fields">
              <label className="is-wide">
                <span>Rezultaty pracy * <em>jeden w wierszu</em></span>
                <textarea
                  value={form.deliverables}
                  onChange={(event) => update("deliverables", event.target.value)}
                  placeholder={"Gotowy projekt strony\nPliki źródłowe\nInstrukcja wdrożenia"}
                  maxLength={1400}
                  rows={6}
                  required
                />
              </label>

              <label className="is-wide">
                <span>Czego potrzebujesz od klienta? <em>jeden punkt w wierszu</em></span>
                <textarea
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
          </section>

          <section className="ih5-service-editor-section">
            <div className="ih5-service-editor-index">03</div>
            <div className="ih5-service-editor-heading">
              <span>Warunki</span>
              <h2>Cena, czas i obłożenie</h2>
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
                      min="1"
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
          </section>

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
    modalRef.current?.querySelector("textarea")?.focus({ preventScroll: true });
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
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(modalRef.current?.querySelectorAll("a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)") || []);
          if (!controls.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        <header>
          <div>
            <span className="ih5-service-eyebrow">
              {isFull ? "Następny wolny termin" : "Zapytanie o realizację"}
            </span>
            <h2 id="service-inquiry-title">Opowiedz krótko o swoim celu.</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Zamknij">×</button>
        </header>

        <div className="ih5-service-modal-summary">
          <span>{SERVICE_CATEGORY_MARKS[service.category] || "✦"}</span>
          <div>
            <strong>{service.title}</strong>
            <small>
              {service.price_mode === "fixed"
                ? formatMoney(service.base_price)
                : "Wycena po poznaniu zakresu"}
            </small>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            <span>Co chcesz osiągnąć? *</span>
            <textarea
              autoFocus
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Opisz rezultat, najważniejszy zakres i to, po czym poznasz, że praca jest wykonana dobrze."
              minLength={30}
              maxLength={2500}
              rows={7}
              required
            />
            <small>{brief.length}/2500</small>
          </label>

          <div className="ih5-service-modal-fields">
            <label>
              <span>Preferowany termin</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </label>
            <label>
              <span>Materiały, które już masz</span>
              <input
                value={materials}
                onChange={(event) => setMaterials(event.target.value)}
                placeholder="Np. teksty, logo, makieta"
                maxLength={500}
              />
            </label>
          </div>

          <div className="ih5-service-inquiry-rules">
            <span aria-hidden="true">i</span>
            <p>
              To niewiążące zapytanie i otwarcie czatu — bez płatności i bez
              rezerwacji miejsca. Miejsce zostanie czasowo zarezerwowane dopiero,
              gdy wykonawca wyśle ofertę. Współpraca ruszy po akceptacji warunków
              przez obie strony i opłaceniu zamówienia.
            </p>
          </div>

          <label className="ih5-service-modal-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>Rozumiem, że samo wysłanie zapytania nie jest zamówieniem ani płatnością.</span>
          </label>

          {message && <p className="ih5-service-modal-message" role="alert">{message}</p>}

          <footer>
            <button type="button" onClick={onClose} disabled={saving}>Anuluj</button>
            <button type="submit" disabled={saving || !confirmed}>
              {saving
                ? "Otwieranie rozmowy…"
                : isFull
                ? "Zapytaj o następny termin"
                : "Wyślij zapytanie i otwórz czat"}
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
        <div className="ih5-service-detail-loading" aria-label="Ładowanie usługi" />
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
      <nav className="ih5-service-detail-breadcrumb" aria-label="Okruszki">
        <Link to="/services">Usługi</Link>
        <span>/</span>
        <Link to={`/services?category=${encodeURIComponent(service.category)}`}>
          {service.category}
        </Link>
      </nav>

      <div className="ih5-service-detail-layout">
        <article className="ih5-service-detail-main">
          <header className="ih5-service-detail-header">
            <div className="ih5-service-detail-category">
              <span aria-hidden="true">{SERVICE_CATEGORY_MARKS[service.category] || "✦"}</span>
              <div>
                <b>{service.category}</b>
                <small>{service.subcategory || SERVICE_CATEGORY_COPY[service.category]}</small>
              </div>
            </div>
            <h1>{service.title}</h1>
            <p>{service.summary}</p>
          </header>

          <section className="ih5-service-detail-section">
            <span className="ih5-service-eyebrow">O usłudze</span>
            <h2>Jasny zakres od pierwszej rozmowy.</h2>
            <div className="ih5-service-rich-copy">{service.description}</div>
          </section>

          <section className="ih5-service-detail-section">
            <span className="ih5-service-eyebrow">Rezultat</span>
            <h2>Co otrzymasz</h2>
            <ul className="ih5-service-check-list">
              {deliverables.map((item, index) => (
                <li key={`${item}-${index}`}><span>✓</span>{item}</li>
              ))}
            </ul>
          </section>

          {requirements.length > 0 && (
            <section className="ih5-service-detail-section">
              <span className="ih5-service-eyebrow">Dobry start</span>
              <h2>Co przygotować przed rozmową</h2>
              <ol className="ih5-service-requirement-list">
                {requirements.map((item, index) => (
                  <li key={`${item}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="ih5-service-process">
            <span className="ih5-service-eyebrow">Jak zaczynamy</span>
            <div>
              <article><i>01</i><h3>Wyślij brief</h3><p>Otwierasz rozmowę bez opłaty i rezerwacji miejsca.</p></article>
              <article><i>02</i><h3>Odbierz ofertę</h3><p>Wykonawca zapisuje zakres, termin i cenę. Miejsce czeka 24 godziny.</p></article>
              <article><i>03</i><h3>Zaakceptuj i zapłać</h3><p>Po zgodzie obu stron płatność w IdeaHire uruchamia realizację.</p></article>
            </div>
          </section>
        </article>

        <aside className="ih5-service-order-card">
          <div className="ih5-service-order-owner">
            <ServiceAvatar service={service} size="large" />
            <span>
              <small>Usługę realizuje</small>
              <strong>{service.owner_name || "Wykonawca IdeaHire"}</strong>
            </span>
            <Link to={`/profile/${service.freelancer_id}`} aria-label="Zobacz profil">↗</Link>
          </div>

          <div className="ih5-service-order-price">
            <span>{service.price_mode === "fixed" ? "Cena usługi" : "Sposób wyceny"}</span>
            <strong>
              {service.price_mode === "fixed"
                ? formatMoney(service.base_price)
                : "Indywidualna"}
            </strong>
            <small>
              {service.price_mode === "fixed"
                ? "Pełna kwota dla wykonawcy. Opłatę IdeaHire zobaczysz przed płatnością."
                : "Dokładna cena pojawi się w ofercie po poznaniu briefu."}
            </small>
          </div>

          <div className="ih5-service-order-facts">
            <span><i>◷</i><b>{service.delivery_days} dni</b><small>standardowy czas</small></span>
            <span><i>↻</i><b>{service.revisions}</b><small>poprawki w cenie</small></span>
          </div>

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
                ? service.price_mode === "fixed"
                  ? "Zamów usługę"
                  : "Zapytaj o realizację"
                : "Zapytaj o następny termin"}
              <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="button" className="ih5-service-order-button" disabled>
              Brak wolnych terminów
            </button>
          )}

          <p className="ih5-service-order-legal">
            Pierwszy formularz jest niewiążącym zapytaniem. Zamówienie powstaje
            dopiero po zaakceptowaniu zapisanych warunków i płatności.
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
      <header className="ih5-my-services-header ih7-service-centered-header">
        <div>
          <span className="ih5-service-eyebrow">Panel wykonawcy</span>
          <h1>Twoje usługi</h1>
          <p>Zarządzaj widocznością, obłożeniem i treścią ofert bez usuwania historii rozmów.</p>
        </div>
        <Link className="ih5-service-primary-action" to="/services/new">
          <span>+</span> Dodaj usługę
        </Link>
      </header>

      {message && <p className="ih5-service-form-message" role="alert">{message}</p>}

      {loading ? (
        <div className="ih5-service-form-loading" aria-label="Ładowanie usług" />
      ) : services.length > 0 ? (
        <div className="ih5-my-services-list">
          {services.map((service) => (
            <article key={service.id}>
              <span className="ih5-service-category-mark" aria-hidden="true">
                {SERVICE_CATEGORY_MARKS[service.category] || "✦"}
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
  if (details.budget !== null && (!Number.isFinite(details.budget) || details.budget < 1 || details.budget > IDEA_HIRE_PUBLIC_OFFER.orderLimit || Math.abs(details.budget * 100 - Math.round(details.budget * 100)) > 0.000001)) return "Podaj budżet od 1 do 10 000 zł, z dokładnością do grosza, lub wybierz „Do ustalenia”.";
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
  return <nav className="ih11-market-switch" aria-label="Usługi i freelancerzy">
    <Link to="/services" aria-current={active === "services" ? "page" : undefined} className={active === "services" ? "is-active" : ""}>Usługi</Link>
    <span aria-hidden="true">/</span>
    <Link to="/freelancers" aria-current={active === "freelancers" ? "page" : undefined} className={active === "freelancers" ? "is-active" : ""}>Freelancerzy <span aria-hidden="true">↗</span></Link>
  </nav>;
}

export function ProjectInquiryDialog({ profile, supabase, navigate, onClose, mode = "project" }) {
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
          {isProject && <label htmlFor={`${id}-category`}>Kategoria *<select id={`${id}-category`} value={category} onChange={(event) => setCategory(event.target.value)} disabled={sending} required><option value="">Wybierz kategorię</option>{FREELANCER_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>}
          <label htmlFor={`${id}-brief`}>{isProject ? "Co ma zostać wykonane? *" : "Twoja wiadomość *"}<textarea id={`${id}-brief`} rows={isProject ? 4 : 5} value={brief} minLength={30} maxLength={2000} onChange={(event) => setBrief(event.target.value)} disabled={sending} placeholder={isProject ? "Cel projektu, zakres prac i najważniejsze wymagania…" : "Napisz, w czym potrzebujesz pomocy i o co chcesz zapytać…"} aria-describedby={`${id}-counter`} required /></label>
          <small id={`${id}-counter`}>{brief.trim().length} / 2000 znaków · minimum 30</small>
          {isProject && <>
            <label htmlFor={`${id}-deliverables`}>Oczekiwany rezultat *<textarea id={`${id}-deliverables`} rows={2} value={deliverables} minLength={3} maxLength={1000} onChange={(event) => setDeliverables(event.target.value)} disabled={sending} placeholder="Np. działająca strona z 5 podstronami i pliki projektu" required /></label>
            <h3 className="ih12-form-section"><span>02</span> Budżet i termin</h3>
            <div className="ih12-contact-grid">
              <div><label htmlFor={`${id}-budget`}>Proponowany budżet (PLN)<input id={`${id}-budget`} type="text" inputMode="decimal" value={budget} maxLength={12} onChange={(event) => setBudget(event.target.value)} disabled={sending || budgetOpen} placeholder={budgetOpen ? "Do ustalenia" : "Np. 1500"} required={!budgetOpen} /></label><label className="ih12-inline-check"><input type="checkbox" checked={budgetOpen} onChange={(event) => setBudgetOpen(event.target.checked)} disabled={sending} />Do ustalenia w rozmowie</label></div>
              <div><label htmlFor={`${id}-deadline`}>Oczekiwany termin<input id={`${id}-deadline`} type="date" min={localProjectDate()} value={deadline} onChange={(event) => setDeadline(event.target.value)} disabled={sending || deadlineOpen} required={!deadlineOpen} /></label><label className="ih12-inline-check"><input type="checkbox" checked={deadlineOpen} onChange={(event) => setDeadlineOpen(event.target.checked)} disabled={sending} />Do ustalenia w rozmowie</label></div>
            </div>
            <small>Budżet dotyczy wynagrodzenia wykonawcy. Ostateczną cenę i opłatę IdeaHire zobaczysz przed płatnością.</small>
            <h3 className="ih12-form-section"><span>03</span> Materiały i przekazanie</h3>
            <label htmlFor={`${id}-format`}>Format przekazania (opcjonalnie)<input id={`${id}-format`} type="text" value={deliveryFormat} maxLength={200} onChange={(event) => setDeliveryFormat(event.target.value)} disabled={sending} placeholder="Np. Figma, PDF, pliki źródłowe" /></label>
            <label htmlFor={`${id}-materials`}>Co dostarczysz wykonawcy? (opcjonalnie)<textarea id={`${id}-materials`} rows={2} value={materials} maxLength={700} onChange={(event) => setMaterials(event.target.value)} disabled={sending} placeholder="Np. logo, teksty, inspiracje. Pliki dodasz w rozmowie." /></label>
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
    <div className="ih12-contact-actions"><button className="ih11-button is-quiet" type="button" disabled={!resolved || !available || !canContact} onClick={() => setOpen("message")}><MarketIcon kind="message" />Napisz wiadomość</button><button className="ih11-button is-primary" type="button" disabled={!resolved || !available || !canContact} onClick={() => setOpen("project")}><MarketIcon kind="plus" />Zleć pracę</button></div>
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
    <span className="ih11-eyebrow">Twój profil w katalogu</span><h2>Daj się znaleźć.</h2>
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
  return <div className="page ih-market-v5 ih5-service-page ih11-freelancers">
    <Navbar /><main className="ih-market-shell">
      <MarketplaceSwitch active="freelancers" />
      <MarketHeader eyebrow="Freelancerzy" title="Dobry projekt zaczyna się od dobrego kontaktu." description="Znajdź osobę po nazwie, umiejętnościach lub kategorii. Zobacz jej profil i portfolio, a potem napisz, co chcesz zlecić."><Link className="ih11-button is-quiet" to="/account#profile">Mój profil</Link></MarketHeader>
      <MarketFilters search={search} onSearch={setSearch} categories={FREELANCER_CATEGORIES} category={category} onCategory={(value) => { setPage(0); navigate(value === "Wszystkie" ? "/freelancers" : `/freelancers?category=${encodeURIComponent(value)}`, { replace: true }); }} kind="freelancerów" />
      <section className="ih11-directory-results" aria-busy={loading} aria-label="Wyniki wyszukiwania freelancerów">
        <div className="ih11-directory-heading"><h2>{category === "Wszystkie" ? "Poznaj freelancerów" : category}</h2><span role="status">{loading ? "Szukamy…" : `${result.total} ${result.total === 1 ? "profil" : "profili"}`}</span></div>
        {error ? <div className="ih11-empty" role="alert"><h3>Spróbujmy jeszcze raz.</h3><p>{error}</p><button className="ih11-button is-quiet" onClick={() => setRefresh((value) => value + 1)}>Odśwież</button></div> : loading ? <div className="ih11-freelancer-grid" aria-hidden="true">{[0, 1, 2].map((value) => <div className="ih11-freelancer-skeleton" key={value}><i /><i /><i /></div>)}</div> : result.items.length ? <div className="ih11-freelancer-grid" key={`${page}-${category}-${normalizeFreelancerSearch(search)}`}>
          {result.items.map((profile, index) => <article className="ih11-freelancer-card" key={profile.id} style={{ "--ih11-order": Math.min(index, 5) }}>
            <div className="ih11-freelancer-person"><Link className="ih11-freelancer-avatar" to={`/profile/${profile.id}`} aria-label={`Profil: ${profile.name || "freelancer"}`}>{profile.avatar_url ? <img src={profile.avatar_url} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span>{Array.from(profile.name || "F")[0]}</span>}</Link><div><h3><Link to={`/profile/${profile.id}`}>{profile.name || "Freelancer"}</Link></h3><p>{profile.specialization || "Tworzę i realizuję projekty."}</p></div></div>
            <p className="ih11-freelancer-about">{profile.about || "Poznaj doświadczenie i portfolio na profilu."}</p>
            <div className="ih11-freelancer-skills">{(Array.isArray(profile.skills) ? profile.skills : []).slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div>
            <div className="ih11-freelancer-meta"><span>{Number(profile.completed_jobs) || 0} zakończonych zleceń</span><span>{Number(profile.positive_reviews) || 0} pozytywnych opinii</span></div>
            <footer className="ih12-directory-contact"><Link className="ih11-button is-quiet" to={`/profile/${profile.id}`}>Zobacz profil<MarketIcon kind="arrow" /></Link>{profile.id === user?.id ? <Link className="ih11-button is-primary" to="/account#profile">Edytuj profil</Link> : <div className="ih12-contact-actions"><button type="button" className="ih11-button is-quiet" disabled={!canContact || !profile.allow_project_inquiries} onClick={() => setSelected({ profile, mode: "message" })} title={!canContact ? "Wymagane pełnoletnie konto" : !profile.allow_project_inquiries ? "Nowe zapytania są wyłączone" : "Zapytaj o współpracę"}><MarketIcon kind="message" />Napisz wiadomość</button><button type="button" className="ih11-button is-primary" disabled={!canContact || !profile.allow_project_inquiries} onClick={() => setSelected({ profile, mode: "project" })}><MarketIcon kind="plus" />Zleć pracę</button></div>}</footer>
          </article>)}
        </div> : <div className="ih11-empty"><span aria-hidden="true">↗</span><h3>{search || category !== "Wszystkie" ? "Spróbuj innego wyszukiwania." : "Tu spotkają się pomysły i umiejętności."}</h3><p>{search || category !== "Wszystkie" ? "Zmień nazwę, umiejętność lub kategorię." : "Freelancerzy pojawią się tu po włączeniu widoczności na swoim koncie."}</p><Link className="ih11-button is-quiet" to="/account#profile">Ustaw widoczność profilu</Link></div>}
        {result.total > pageSize && !loading && !error && <nav className="ih11-pagination" aria-label="Strony freelancerów"><button className="ih11-icon-button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Poprzednia strona">←</button><span>{page + 1} / {Math.ceil(result.total / pageSize)}</span><button className="ih11-icon-button" disabled={(page + 1) * pageSize >= result.total} onClick={() => setPage((value) => value + 1)} aria-label="Następna strona">→</button></nav>}
      </section>
      {selected && <ProjectInquiryDialog key={selected.mode} mode={selected.mode} profile={selected.profile} supabase={supabase} navigate={navigate} onClose={() => setSelected(null)} />}
    </main>
  </div>;
}
