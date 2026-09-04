import React from "react";

const TECHNOLOGIES_PL = [
  {
    name: "sb-lvdymbaltnzjrcizlspd-auth-token",
    provider: "IdeaHire / Supabase",
    purpose:
      "Utrzymanie bezpiecznej sesji po zalogowaniu oraz odświeżanie tokenu dostępu.",
    duration:
      "Do wylogowania, wygaśnięcia lub unieważnienia sesji albo usunięcia danych przeglądarki.",
    status: "Niezbędna do obsługi konta",
  },
  {
    name: "ideahire_theme",
    provider: "IdeaHire",
    purpose:
      "Zapamiętanie wybranego przez użytkownika jasnego albo ciemnego wyglądu strony.",
    duration:
      "Do zmiany ustawienia lub usunięcia danych przeglądarki.",
    status: "Funkcjonalna — uruchamiana wyborem użytkownika",
  },
  {
    name: "ideahire_language",
    provider: "IdeaHire",
    purpose:
      "Zapamiętanie wybranego przez użytkownika języka interfejsu.",
    duration:
      "Do zmiany ustawienia lub usunięcia danych przeglądarki.",
    status: "Funkcjonalna — uruchamiana wyborem użytkownika",
  },
  {
    name: "ideahire_read_notifications_<ID użytkownika>",
    provider: "IdeaHire",
    purpose:
      "Zapamiętanie, które powiadomienia danego konta zostały już wyświetlone.",
    duration:
      "Do usunięcia wpisu przez aplikację lub wyczyszczenia danych przeglądarki.",
    status: "Funkcjonalna dla skrzynki powiadomień",
  },
  {
    name: "ideahire_cookie_notice_v1",
    provider: "IdeaHire",
    purpose:
      "Zapamiętanie zamknięcia komunikatu informacyjnego, aby nie pojawiał się przy każdej wizycie.",
    duration: "12 miesięcy",
    status: "Niezbędna do zapamiętania ustawienia interfejsu",
  },
];

const TECHNOLOGIES_EN = [
  {
    name: "sb-lvdymbaltnzjrcizlspd-auth-token",
    provider: "IdeaHire / Supabase",
    purpose:
      "Maintaining a secure signed-in session and refreshing the access token.",
    duration:
      "Until sign-out, session expiry or revocation, or removal of browser data.",
    status: "Necessary for account access",
  },
  {
    name: "ideahire_theme",
    provider: "IdeaHire",
    purpose:
      "Remembering the light or dark appearance selected by the user.",
    duration:
      "Until the setting is changed or browser data is removed.",
    status: "Functional — activated by the user's choice",
  },
  {
    name: "ideahire_language",
    provider: "IdeaHire",
    purpose:
      "Remembering the interface language selected by the user.",
    duration:
      "Until the setting is changed or browser data is removed.",
    status: "Functional — activated by the user's choice",
  },
  {
    name: "ideahire_read_notifications_<user ID>",
    provider: "IdeaHire",
    purpose:
      "Remembering which notifications for an account have already been displayed.",
    duration:
      "Until the entry is removed by the application or browser data is cleared.",
    status: "Functional for the notification inbox",
  },
  {
    name: "ideahire_cookie_notice_v1",
    provider: "IdeaHire",
    purpose:
      "Remembering that the information notice was closed so it is not shown on every visit.",
    duration: "12 months",
    status: "Necessary to remember an interface setting",
  },
];

function TechnologyList({ items, labels }) {
  return (
    <div className="cookie-policy-technology-list">
      {items.map((item) => (
        <article className="cookie-policy-technology" key={item.name}>
          <div className="cookie-policy-technology-heading">
            <code>{item.name}</code>
            <span>{item.status}</span>
          </div>

          <dl>
            <div>
              <dt>{labels.provider}</dt>
              <dd>{item.provider}</dd>
            </div>
            <div>
              <dt>{labels.purpose}</dt>
              <dd>{item.purpose}</dd>
            </div>
            <div>
              <dt>{labels.duration}</dt>
              <dd>{item.duration}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}

function PolishPolicy() {
  return (
    <div className="cookie-policy-language cookie-policy-language-pl" lang="pl">
      <header className="cookie-policy-hero">
        <span className="cookie-policy-eyebrow">Prywatność w IdeaHire</span>
        <h1>Polityka cookies i podobnych technologii</h1>
        <p>
          Wyjaśniamy prostym językiem, jakie informacje zapisuje przeglądarka,
          po co są potrzebne i jak użytkownik może nad nimi zapanować.
        </p>
        <div className="cookie-policy-meta">
          <span>Wersja 1.0</span>
          <span>Obowiązuje od 4 września 2026 r.</span>
        </div>
      </header>

      <section className="cookie-policy-highlight">
        <span className="cookie-policy-highlight-icon" aria-hidden="true">✓</span>
        <div>
          <strong>Bez reklam i śledzenia marketingowego</strong>
          <p>
            Obecnie IdeaHire nie używa technologii reklamowych ani analitycznych.
            Korzystamy wyłącznie z rozwiązań potrzebnych do logowania,
            bezpieczeństwa i funkcji wybranych przez użytkownika.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">01</span>
        <div>
          <h2>Czym są podobne technologie?</h2>
          <p>
            Poza klasycznymi plikami cookies strona może korzystać z pamięci
            przeglądarki, w szczególności z mechanizmu localStorage. Służy on
            do przechowywania niewielkich informacji bezpośrednio na urządzeniu.
            Przepisy dotyczące dostępu do urządzenia obejmują również takie
            rozwiązania, dlatego opisujemy je w jednym dokumencie.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">02</span>
        <div>
          <h2>Podstawa korzystania</h2>
          <p>
            Technologie konieczne do dostarczenia usługi wyraźnie żądanej przez
            użytkownika mogą działać bez zgody na cele reklamowe. Dotyczy to
            między innymi bezpiecznego logowania i podstawowej obsługi konta.
            Ustawienia wyglądu i języka są zapisywane dopiero w związku z wyborem
            dokonanym przez użytkownika.
          </p>
          <p>
            Podstawę stanowią art. 399–400 ustawy Prawo komunikacji elektronicznej
            oraz — gdy dochodzi do przetwarzania danych osobowych — odpowiednie
            przepisy RODO.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">03</span>
          <div>
            <h2>Aktualny wykaz technologii</h2>
            <p>
              Poniższy wykaz odpowiada obecnej wersji kodu IdeaHire. Wszystkie
              wymienione wpisy są zapisywane w pamięci localStorage przeglądarki.
            </p>
          </div>
        </div>
        <TechnologyList
          items={TECHNOLOGIES_PL}
          labels={{
            provider: "Dostawca",
            purpose: "Cel",
            duration: "Okres przechowywania",
          }}
        />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">04</span>
        <div>
          <h2>Dostawcy techniczni</h2>
          <p>
            IdeaHire korzysta z Supabase do obsługi logowania i usług bazodanowych
            oraz z Cloudflare do hostingu, bezpieczeństwa i dostarczania strony.
            Dostawcy mogą otrzymywać dane techniczne niezbędne do wykonania
            połączenia, takie jak adres IP, czas żądania, informacje o przeglądarce
            i zdarzenia związane z bezpieczeństwem.
          </p>
          <p>
            Szczegółowe zasady przetwarzania danych przez operatora platformy
            zostaną opisane również w Polityce prywatności.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">05</span>
        <div>
          <h2>Jak zarządzać danymi na urządzeniu?</h2>
          <p>
            Użytkownik może usunąć dane strony w ustawieniach swojej przeglądarki.
            Usunięcie tokenu sesji spowoduje wylogowanie. Usunięcie ustawień języka,
            wyglądu lub przeczytanych powiadomień przywróci ich wartości domyślne.
          </p>
          <p>
            Jeśli w przyszłości IdeaHire uruchomi opcjonalną analitykę lub
            marketing, takie narzędzia pozostaną wyłączone do czasu dobrowolnej
            zgody, a na stronie pojawi się możliwość jej równie łatwego wycofania.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">06</span>
        <div>
          <h2>Zmiany i kontakt</h2>
          <p>
            Wykaz będzie aktualizowany przed uruchomieniem nowej technologii lub
            zmianą jej celu. Istotne zmiany będą oznaczone nową datą i wersją
            dokumentu.
          </p>
          <p>
            Operatorem serwisu jest podmiot prowadzący platformę IdeaHire.
            Kontakt w sprawach prywatności: {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
            Pełne dane identyfikacyjne operatora zostaną uzupełnione przed
            uruchomieniem komercyjnej wersji platformy.
          </p>
        </div>
      </section>
    </div>
  );
}

function EnglishPolicy() {
  return (
    <div className="cookie-policy-language cookie-policy-language-en" lang="en">
      <header className="cookie-policy-hero">
        <span className="cookie-policy-eyebrow">Privacy at IdeaHire</span>
        <h1>Cookies and similar technologies policy</h1>
        <p>
          This page explains in plain language what information the browser
          stores, why it is needed and how users can control it.
        </p>
        <div className="cookie-policy-meta">
          <span>Version 1.0</span>
          <span>Effective from 4 September 2026</span>
        </div>
      </header>

      <section className="cookie-policy-highlight">
        <span className="cookie-policy-highlight-icon" aria-hidden="true">✓</span>
        <div>
          <strong>No advertising or marketing tracking</strong>
          <p>
            IdeaHire currently does not use advertising or analytics technologies.
            We only use solutions required for sign-in, security and features
            selected by the user.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">01</span>
        <div>
          <h2>What are similar technologies?</h2>
          <p>
            In addition to traditional cookies, a website may use browser storage,
            including localStorage. It stores small pieces of information directly
            on the device. Rules protecting access to a user's device also cover
            these solutions, so they are described in one document.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">02</span>
        <div>
          <h2>Why we may use them</h2>
          <p>
            Technologies necessary to provide a service explicitly requested by
            the user may operate without advertising consent. This includes secure
            sign-in and essential account access. Appearance and language settings
            are stored in connection with a choice actively made by the user.
          </p>
          <p>
            The relevant rules include Articles 399–400 of the Polish Electronic
            Communications Law and, where personal data is processed, the
            applicable provisions of the GDPR.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">03</span>
          <div>
            <h2>Current technology inventory</h2>
            <p>
              The list below reflects the current IdeaHire code. Every listed
              entry is stored in the browser's localStorage.
            </p>
          </div>
        </div>
        <TechnologyList
          items={TECHNOLOGIES_EN}
          labels={{
            provider: "Provider",
            purpose: "Purpose",
            duration: "Storage period",
          }}
        />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">04</span>
        <div>
          <h2>Technical providers</h2>
          <p>
            IdeaHire uses Supabase for authentication and database services and
            Cloudflare for hosting, security and delivery of the website. These
            providers may receive technical data required to establish the
            connection, such as an IP address, request time, browser information
            and security events.
          </p>
          <p>
            The platform operator's personal data processing rules will also be
            explained in the Privacy Policy.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">05</span>
        <div>
          <h2>How can browser data be managed?</h2>
          <p>
            Users can remove website data in their browser settings. Removing the
            session token signs the user out. Removing language, appearance or read
            notification settings restores their default values.
          </p>
          <p>
            If IdeaHire introduces optional analytics or marketing in the future,
            such tools will remain disabled until voluntary consent is given, and
            the website will provide an equally easy way to withdraw it.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">06</span>
        <div>
          <h2>Changes and contact</h2>
          <p>
            The inventory will be updated before a new technology is enabled or
            its purpose changes. Material changes will receive a new date and
            document version.
          </p>
          <p>
            The service is operated by the entity running the IdeaHire platform.
            Privacy contact: {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
            Full operator identification details will be added before the
            commercial version of the platform is launched.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CookiePolicy() {
  return (
    <main className="cookie-policy-page" data-no-translate="true">
      <div className="cookie-policy-shell">
        <nav className="cookie-policy-nav" aria-label="IdeaHire">
          <a className="cookie-policy-logo" href="/" aria-label="IdeaHire — strona główna">
            Idea<span>Hire</span>
          </a>
          <a className="cookie-policy-back" href="/">
            <span className="cookie-policy-back-pl">← Wróć na stronę</span>
            <span className="cookie-policy-back-en">← Back to website</span>
          </a>
        </nav>

        <PolishPolicy />
        <EnglishPolicy />

        <footer className="cookie-policy-footer">
          <a href="/">IdeaHire</a>
          <span>© 2026</span>
        </footer>
      </div>
    </main>
  );
}
