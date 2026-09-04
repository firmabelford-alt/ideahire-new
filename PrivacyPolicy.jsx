import React from "react";

const DATA_CATEGORIES_PL = [
  {
    title: "Konto i logowanie",
    text: "Adres e-mail, identyfikator konta, dane sesji, informacje o potwierdzeniu adresu oraz zdarzenia związane z bezpieczeństwem logowania.",
  },
  {
    title: "Wiek i uprawnienia",
    text: "Prywatna data urodzenia używana do ustalenia, czy konto może zostać utworzone i jaki zakres funkcji jest dostępny.",
  },
  {
    title: "Profil użytkownika",
    text: "Nazwa, zdjęcie profilowe, kraj, opis „O mnie”, specjalizacje, kategorie, umiejętności i statystyki aktywności.",
  },
  {
    title: "Zlecenia i zgłoszenia",
    text: "Tytuł, opis, kategoria, budżet, terminy, status zlecenia oraz zgłoszenia wykonawców.",
  },
  {
    title: "Wiadomości i współpraca",
    text: "Uczestnicy rozmowy, treść wiadomości, status odczytu, formularze warunków współpracy oraz historia ich akceptacji.",
  },
  {
    title: "Spory i bezpieczeństwo",
    text: "Zgłoszenia sporów, oświadczenia, dowody, wskazane wiadomości, odwołania, decyzje, powiadomienia oraz historia działań administratora.",
  },
];

const DATA_CATEGORIES_EN = [
  {
    title: "Account and sign-in",
    text: "Email address, account identifier, session data, email confirmation information and sign-in security events.",
  },
  {
    title: "Age and permissions",
    text: "A private date of birth used to determine whether an account can be created and which features are available.",
  },
  {
    title: "User profile",
    text: "Name, profile picture, country, About section, specialisations, categories, skills and activity statistics.",
  },
  {
    title: "Jobs and applications",
    text: "Title, description, category, budget, deadlines, job status and contractor applications.",
  },
  {
    title: "Messages and collaboration",
    text: "Conversation participants, message content, read status, collaboration terms forms and their acceptance history.",
  },
  {
    title: "Disputes and security",
    text: "Dispute reports, statements, evidence, selected messages, appeals, decisions, notifications and administrator activity history.",
  },
];

const LEGAL_BASES_PL = [
  {
    purpose: "Założenie i obsługa konta",
    data: "E-mail, nazwa, identyfikator konta i ustawienia",
    basis: "Niezbędność do świadczenia usługi — art. 6 ust. 1 lit. b RODO",
  },
  {
    purpose: "Weryfikacja wieku i uprawnień",
    data: "Data urodzenia i przypisany poziom dostępu",
    basis: "Świadczenie usługi i bezpieczeństwo platformy — art. 6 ust. 1 lit. b oraz f RODO",
  },
  {
    purpose: "Profile, zlecenia, zgłoszenia i rozmowy",
    data: "Treści podane przez użytkowników i historia współpracy",
    basis: "Niezbędność do świadczenia usługi — art. 6 ust. 1 lit. b RODO",
  },
  {
    purpose: "Rozpatrywanie sporów i odwołań",
    data: "Ustalenia, wiadomości udostępnione w sprawie, oświadczenia i dowody",
    basis: "Świadczenie usługi oraz ustalenie, dochodzenie lub obrona roszczeń — art. 6 ust. 1 lit. b i f RODO",
  },
  {
    purpose: "Bezpieczeństwo i przeciwdziałanie nadużyciom",
    data: "Logi, zdarzenia techniczne, blokady i działania administratorów",
    basis: "Prawnie uzasadniony interes administratora — art. 6 ust. 1 lit. f RODO",
  },
  {
    purpose: "Wykonanie obowiązków prawnych",
    data: "Dane wymagane właściwymi przepisami lub żądaniem uprawnionego organu",
    basis: "Obowiązek prawny — art. 6 ust. 1 lit. c RODO",
  },
];

const LEGAL_BASES_EN = [
  {
    purpose: "Creating and operating an account",
    data: "Email, name, account identifier and settings",
    basis: "Necessary to provide the service — Article 6(1)(b) GDPR",
  },
  {
    purpose: "Age and permission verification",
    data: "Date of birth and assigned access level",
    basis: "Providing the service and platform safety — Article 6(1)(b) and (f) GDPR",
  },
  {
    purpose: "Profiles, jobs, applications and conversations",
    data: "User-provided content and collaboration history",
    basis: "Necessary to provide the service — Article 6(1)(b) GDPR",
  },
  {
    purpose: "Handling disputes and appeals",
    data: "Terms, messages made available in the case, statements and evidence",
    basis: "Providing the service and establishing, pursuing or defending claims — Article 6(1)(b) and (f) GDPR",
  },
  {
    purpose: "Security and abuse prevention",
    data: "Logs, technical events, blocks and administrator actions",
    basis: "The controller's legitimate interests — Article 6(1)(f) GDPR",
  },
  {
    purpose: "Compliance with legal obligations",
    data: "Data required by applicable law or by an authorised public authority",
    basis: "Legal obligation — Article 6(1)(c) GDPR",
  },
];

const RETENTION_PL = [
  ["Konto i profil", "Przez okres posiadania konta, a następnie do zakończenia procesu jego usuwania."],
  ["Data urodzenia", "Do usunięcia konta albo wcześniejszej utraty celu jej przetwarzania."],
  ["Wiadomości i formularze", "Przez okres współpracy, a później wyłącznie przez czas potrzebny do obsługi sporów i roszczeń."],
  ["Spory, dowody i decyzje", "Do zamknięcia sprawy, a następnie przez okres właściwy dla możliwych roszczeń, zasadniczo nie dłużej niż 6 lat."],
  ["Logi administracyjne i bezpieczeństwa", "Standardowo do 12 miesięcy; dłużej tylko, gdy zapis dotyczy incydentu, nadużycia lub postępowania."],
  ["Niepotrzebne załączniki", "Do 30 dni od uznania ich za zbędne albo odrzucone."],
  ["Kopie zapasowe", "Do 90 dni, po czym dane są nadpisywane zgodnie z cyklem kopii."],
];

const RETENTION_EN = [
  ["Account and profile", "For as long as the account exists and then until the account deletion process is completed."],
  ["Date of birth", "Until the account is deleted or the processing purpose ends earlier."],
  ["Messages and forms", "For the duration of the collaboration and afterwards only for as long as required to handle disputes and claims."],
  ["Disputes, evidence and decisions", "Until the case is closed and then for the period applicable to potential claims, generally no longer than six years."],
  ["Administrative and security logs", "Normally for up to 12 months; longer only where a record concerns an incident, abuse or proceedings."],
  ["Unnecessary attachments", "Up to 30 days after they are found to be unnecessary or rejected."],
  ["Backups", "Up to 90 days, after which data is overwritten as part of the backup cycle."],
];

function InformationCards({ items }) {
  return (
    <div className="privacy-policy-card-grid">
      {items.map((item) => (
        <article className="privacy-policy-card" key={item.title}>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function LegalBases({ items, labels }) {
  return (
    <div className="privacy-policy-bases">
      {items.map((item) => (
        <article className="privacy-policy-basis" key={item.purpose}>
          <div>
            <span>{labels.purpose}</span>
            <strong>{item.purpose}</strong>
          </div>
          <div>
            <span>{labels.data}</span>
            <p>{item.data}</p>
          </div>
          <div>
            <span>{labels.basis}</span>
            <p>{item.basis}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function RetentionList({ items }) {
  return (
    <div className="privacy-policy-retention">
      {items.map(([name, period]) => (
        <div key={name}>
          <strong>{name}</strong>
          <p>{period}</p>
        </div>
      ))}
    </div>
  );
}

function PolishPolicy() {
  return (
    <div className="cookie-policy-language cookie-policy-language-pl" lang="pl">
      <header className="cookie-policy-hero privacy-policy-hero">
        <span className="cookie-policy-eyebrow">Twoje dane w IdeaHire</span>
        <h1>Polityka prywatności</h1>
        <p>
          Wyjaśniamy, jakie dane są potrzebne do prowadzenia konta, realizacji
          współpracy i rozpatrywania sporów oraz jakie prawa ma użytkownik.
        </p>
        <div className="cookie-policy-meta">
          <span>Wersja 1.0 — wdrożenie początkowe</span>
          <span>Obowiązuje od 4 września 2026 r.</span>
        </div>
      </header>

      <section className="cookie-policy-highlight privacy-policy-highlight">
        <span className="cookie-policy-highlight-icon" aria-hidden="true">i</span>
        <div>
          <strong>Prywatność jest częścią działania platformy</strong>
          <p>
            Dokładna data urodzenia, prywatne rozmowy, warunki współpracy i
            materiały dotyczące sporów nie są publicznie widoczne.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">01</span>
        <div>
          <h2>Administrator i kontakt</h2>
          <p>
            Administratorem danych jest podmiot prowadzący platformę IdeaHire.
            W sprawach prywatności można skontaktować się pod adresem {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
          </p>
          <div className="privacy-policy-status-note">
            <strong>Informacja dla wersji początkowej</strong>
            <p>
              Pełne dane identyfikacyjne i adres administratora zostaną podane
              przed uruchomieniem komercyjnej wersji platformy.
            </p>
          </div>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">02</span>
          <div>
            <h2>Jakie dane przetwarzamy?</h2>
            <p>
              Zakres zależy od sposobu korzystania z IdeaHire. Nie każda osoba
              przekazuje wszystkie wymienione niżej informacje.
            </p>
          </div>
        </div>
        <InformationCards items={DATA_CATEGORIES_PL} />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">03</span>
        <div>
          <h2>Skąd pochodzą dane?</h2>
          <p>
            Dane otrzymujemy bezpośrednio od użytkownika, z jego aktywności w
            serwisie, od drugiej strony współpracy lub sporu oraz z systemów
            technicznych potrzebnych do logowania, hostingu, poczty i ochrony
            platformy.
          </p>
          <p>
            IdeaHire nie otrzymuje hasła w postaci jawnej. Uwierzytelnianie i
            bezpieczne przechowywanie danych logowania obsługuje Supabase.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">04</span>
          <div>
            <h2>Po co i na jakiej podstawie?</h2>
            <p>
              Dane przetwarzamy tylko w określonych celach i na właściwej
              podstawie prawnej. Zapoznanie się z tą polityką nie jest zgodą
              marketingową.
            </p>
          </div>
        </div>
        <LegalBases
          items={LEGAL_BASES_PL}
          labels={{ purpose: "Cel", data: "Zakres", basis: "Podstawa" }}
        />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">05</span>
        <div>
          <h2>Co jest publiczne?</h2>
          <div className="privacy-policy-visibility-grid">
            <article>
              <strong>Może być widoczne publicznie</strong>
              <ul>
                <li>nazwa i zdjęcie profilowe,</li>
                <li>kraj, opis, kategorie i umiejętności,</li>
                <li>opublikowane zlecenia,</li>
                <li>podstawowe statystyki profilu.</li>
              </ul>
            </article>
            <article>
              <strong>Pozostaje prywatne</strong>
              <ul>
                <li>dokładna data urodzenia i adres e-mail,</li>
                <li>prywatne wiadomości i formularze współpracy,</li>
                <li>dowody oraz materiały dotyczące sporów,</li>
                <li>dane logowania, bezpieczeństwa i działań administratora.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">06</span>
        <div>
          <h2>Rozmowy, formularze i spory</h2>
          <p>
            Wiadomości oraz formularze współpracy są dostępne uczestnikom danej
            rozmowy. Administrator nie powinien swobodnie przeglądać wszystkich
            czatów użytkowników.
          </p>
          <p>
            Po otwarciu sporu i przejęciu konkretnej sprawy upoważniony
            administrator może uzyskać dostęp do rozmowy, zaakceptowanego
            formularza i dowodów w zakresie koniecznym do rozpoznania sprawy.
            Takie działanie powinno zostać zapisane w rejestrze administracyjnym.
          </p>
          <p>
            Użytkownik nie powinien przesyłać danych niezwiązanych ze zleceniem,
            w szczególności dokumentów tożsamości ani informacji o zdrowiu,
            przekonaniach, religii lub orientacji. Dane zbędne dla sprawy mogą
            zostać usunięte albo objęte dodatkowym ograniczeniem dostępu.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">07</span>
        <div>
          <h2>Dostawcy i odbiorcy danych</h2>
          <p>
            W działaniu IdeaHire pomagają Supabase — uwierzytelnianie, baza i
            przechowywanie plików — oraz Cloudflare — hosting, dostarczanie strony
            i bezpieczeństwo. Dane niezbędne do wysłania wiadomości systemowej
            może również przetwarzać dostawca poczty lub skonfigurowanej usługi
            SMTP.
          </p>
          <p>
            Dane mogą zostać udostępnione uprawnionemu organowi wyłącznie wtedy,
            gdy wynika to z prawa. Operator płatności zostanie opisany przed
            uruchomieniem płatności. Obecna wersja platformy ich nie obsługuje.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">08</span>
        <div>
          <h2>Przekazywanie danych poza EOG</h2>
          <p>
            Niektórzy dostawcy techniczni mogą korzystać z infrastruktury poza
            Europejskim Obszarem Gospodarczym. W takim przypadku dane mogą być
            przekazywane wyłącznie z zastosowaniem mechanizmu przewidzianego przez
            RODO, w szczególności decyzji o odpowiednim poziomie ochrony lub
            standardowych klauzul umownych.
          </p>
          <p>
            Szczegółowa informacja zostanie uzupełniona po zatwierdzeniu regionów
            usług i umów z dostawcami przed uruchomieniem komercyjnym.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">09</span>
          <div>
            <h2>Jak długo przechowujemy dane?</h2>
            <p>
              Danych nie przechowujemy bezterminowo. Okres zależy od celu,
              obowiązków prawnych, bezpieczeństwa i możliwych roszczeń.
            </p>
          </div>
        </div>
        <RetentionList items={RETENTION_PL} />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">10</span>
        <div>
          <h2>Prawa użytkownika</h2>
          <p>
            Użytkownik może żądać dostępu do danych i ich kopii, sprostowania,
            usunięcia, ograniczenia przetwarzania lub przeniesienia danych. Może
            także wnieść sprzeciw wobec przetwarzania opartego na prawnie
            uzasadnionym interesie oraz wycofać zgodę, jeżeli była podstawą danej
            operacji.
          </p>
          <p>
            Żądanie można wysłać na {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
            Przed realizacją możemy poprosić o potwierdzenie tożsamości.
            Odpowiadamy bez zbędnej zwłoki, co do zasady w ciągu miesiąca.
          </p>
          <p>
            Użytkownik może również złożyć skargę do Prezesa Urzędu Ochrony
            Danych Osobowych.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">11</span>
        <div>
          <h2>Wiek użytkowników</h2>
          <p>
            Osoba poniżej 16 lat nie może utworzyć konta. Osoba w wieku 16–17 lat
            otrzymuje konto ograniczone, które pozwala poznawać platformę, ale nie
            pozwala publikować ani przyjmować płatnych zleceń, uzgadniać współpracy,
            korzystać z płatności ani otwierać nowego sporu. Pełne funkcje są
            dostępne od ukończenia 18 lat.
          </p>
          <p>
            Data urodzenia jest prywatna i służy ustaleniu uprawnień. Jej korekta
            wymaga kontaktu z pomocą IdeaHire. Nie wykorzystujemy danych znanych
            małoletnich do profilowanej reklamy.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">12</span>
        <div>
          <h2>Automatyczne decyzje i bezpieczeństwo</h2>
          <p>
            IdeaHire nie podejmuje wobec użytkowników decyzji opartych wyłącznie
            na automatycznym przetwarzaniu, które wywoływałyby skutki prawne lub
            podobnie istotnie na nich wpływały. Automatyczne przypisanie poziomu
            dostępu na podstawie wieku jest zasadą techniczną; błąd można zgłosić
            do ręcznego sprawdzenia.
          </p>
          <p>
            Stosujemy kontrolę dostępu, indywidualne konta administratorów,
            rejestry działań, szyfrowane połączenie, zabezpieczenia bazy danych i
            ograniczenie dostępu do materiałów sporu do osób, które prowadzą daną
            sprawę.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">13</span>
        <div>
          <h2>Technologie przeglądarki i zmiany polityki</h2>
          <p>
            Informacje o pamięci przeglądarki opisujemy w {" "}
            <a href="/polityka-cookies">Polityce cookies</a>. Obecnie IdeaHire nie
            korzysta z cookies reklamowych ani analitycznych.
          </p>
          <p>
            Dokument może zostać zaktualizowany po dodaniu nowych funkcji,
            dostawców lub płatności. Istotne zmiany otrzymają nowy numer wersji i
            datę, a użytkownicy zostaną o nich poinformowani w odpowiedni sposób.
          </p>
        </div>
      </section>

      <section className="privacy-policy-sources" aria-label="Podstawy prawne">
        <strong>Oficjalne materiały</strong>
        <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/pol" target="_blank" rel="noreferrer">RODO — EUR-Lex</a>
        <a href="https://uodo.gov.pl/pl/676/4255" target="_blank" rel="noreferrer">Obowiązek informacyjny — UODO</a>
        <a href="https://uodo.gov.pl/pl/676/4260" target="_blank" rel="noreferrer">Ograniczenie przechowywania — UODO</a>
      </section>
    </div>
  );
}

function EnglishPolicy() {
  return (
    <div className="cookie-policy-language cookie-policy-language-en" lang="en">
      <header className="cookie-policy-hero privacy-policy-hero">
        <span className="cookie-policy-eyebrow">Your data at IdeaHire</span>
        <h1>Privacy Policy</h1>
        <p>
          We explain what data is required to operate an account, support
          collaboration and handle disputes, and what rights each user has.
        </p>
        <div className="cookie-policy-meta">
          <span>Version 1.0 — initial implementation</span>
          <span>Effective from 4 September 2026</span>
        </div>
      </header>

      <section className="cookie-policy-highlight privacy-policy-highlight">
        <span className="cookie-policy-highlight-icon" aria-hidden="true">i</span>
        <div>
          <strong>Privacy is built into the platform</strong>
          <p>
            The exact date of birth, private conversations, collaboration terms
            and dispute materials are not publicly visible.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">01</span>
        <div>
          <h2>Controller and contact</h2>
          <p>
            The data controller is the entity operating the IdeaHire platform.
            For privacy matters, contact {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
          </p>
          <div className="privacy-policy-status-note">
            <strong>Initial version information</strong>
            <p>
              The controller's full identification and address details will be
              provided before the commercial version of the platform is launched.
            </p>
          </div>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">02</span>
          <div>
            <h2>What data do we process?</h2>
            <p>
              The scope depends on how IdeaHire is used. Not every person provides
              every category listed below.
            </p>
          </div>
        </div>
        <InformationCards items={DATA_CATEGORIES_EN} />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">03</span>
        <div>
          <h2>Where does the data come from?</h2>
          <p>
            We receive data directly from the user, from their activity on the
            service, from the other party to a collaboration or dispute, and from
            technical systems required for sign-in, hosting, email and platform
            protection.
          </p>
          <p>
            IdeaHire does not receive passwords in plain text. Authentication and
            secure storage of sign-in credentials are handled by Supabase.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">04</span>
          <div>
            <h2>Why do we process data?</h2>
            <p>
              Data is processed only for defined purposes and under an applicable
              legal basis. Acknowledging this policy is not marketing consent.
            </p>
          </div>
        </div>
        <LegalBases
          items={LEGAL_BASES_EN}
          labels={{ purpose: "Purpose", data: "Scope", basis: "Legal basis" }}
        />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">05</span>
        <div>
          <h2>What is public?</h2>
          <div className="privacy-policy-visibility-grid">
            <article>
              <strong>May be publicly visible</strong>
              <ul>
                <li>profile name and picture,</li>
                <li>country, description, categories and skills,</li>
                <li>published jobs,</li>
                <li>basic profile statistics.</li>
              </ul>
            </article>
            <article>
              <strong>Remains private</strong>
              <ul>
                <li>exact date of birth and email address,</li>
                <li>private messages and collaboration forms,</li>
                <li>evidence and dispute materials,</li>
                <li>sign-in, security and administrator activity data.</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">06</span>
        <div>
          <h2>Conversations, forms and disputes</h2>
          <p>
            Messages and collaboration forms are available to the participants of
            that conversation. Administrators should not freely browse all user
            chats.
          </p>
          <p>
            Once a dispute is opened and an authorised administrator takes over
            that specific case, they may access the conversation, accepted form
            and evidence to the extent necessary to handle it. The action should
            be recorded in the administrative audit log.
          </p>
          <p>
            Users should not submit data unrelated to the job, especially identity
            documents or information about health, beliefs, religion or sexual
            orientation. Data unnecessary for a case may be removed or subjected
            to additional access restrictions.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">07</span>
        <div>
          <h2>Providers and data recipients</h2>
          <p>
            IdeaHire is supported by Supabase for authentication, database and
            file storage, and by Cloudflare for hosting, website delivery and
            security. An email or configured SMTP provider may also process the
            data required to send a system email.
          </p>
          <p>
            Data may be disclosed to an authorised public authority only where
            required by law. A payment provider will be described before payments
            are launched. The current platform version does not process them.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">08</span>
        <div>
          <h2>Transfers outside the EEA</h2>
          <p>
            Some technical providers may use infrastructure outside the European
            Economic Area. In such cases, data may only be transferred using a
            mechanism recognised by the GDPR, including an adequacy decision or
            Standard Contractual Clauses.
          </p>
          <p>
            Detailed information will be completed after service regions and
            provider agreements are confirmed before commercial launch.
          </p>
        </div>
      </section>

      <section className="cookie-policy-inventory">
        <div className="cookie-policy-section-heading">
          <span className="cookie-policy-section-number">09</span>
          <div>
            <h2>How long do we keep data?</h2>
            <p>
              We do not keep data indefinitely. The period depends on the purpose,
              legal obligations, security requirements and potential claims.
            </p>
          </div>
        </div>
        <RetentionList items={RETENTION_EN} />
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">10</span>
        <div>
          <h2>User rights</h2>
          <p>
            A user may request access to and a copy of their data, rectification,
            erasure, restriction of processing or data portability. They may also
            object to processing based on legitimate interests and withdraw
            consent where consent was the legal basis for a specific operation.
          </p>
          <p>
            Send a request to {" "}
            <a href="mailto:firmabelford@gmail.com">firmabelford@gmail.com</a>.
            We may first request identity verification. We respond without undue
            delay, normally within one month.
          </p>
          <p>
            A user may also lodge a complaint with the Polish President of the
            Personal Data Protection Office.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">11</span>
        <div>
          <h2>User age</h2>
          <p>
            A person under 16 cannot create an account. A person aged 16–17
            receives a limited account for exploring the platform, but cannot post
            or accept paid jobs, agree collaboration terms, use payments or open a
            new dispute. Full features become available at the age of 18.
          </p>
          <p>
            The date of birth is private and used to determine permissions. A
            correction requires contacting IdeaHire support. We do not use data of
            known minors for profiled advertising.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">12</span>
        <div>
          <h2>Automated decisions and security</h2>
          <p>
            IdeaHire does not make decisions based solely on automated processing
            that produce legal or similarly significant effects. Automatically
            assigning access based on age is a technical rule; an error can be
            reported for manual review.
          </p>
          <p>
            We use access controls, individual administrator accounts, activity
            logs, encrypted connections, database safeguards and access limits so
            that dispute materials are available only to people handling a case.
          </p>
        </div>
      </section>

      <section className="cookie-policy-section">
        <span className="cookie-policy-section-number">13</span>
        <div>
          <h2>Browser technologies and policy changes</h2>
          <p>
            Browser storage is explained in the {" "}
            <a href="/polityka-cookies">Cookies Policy</a>. IdeaHire currently does
            not use advertising or analytics cookies.
          </p>
          <p>
            This document may be updated when new features, providers or payments
            are added. Material changes will receive a new version number and date,
            and users will be informed in an appropriate way.
          </p>
        </div>
      </section>

      <section className="privacy-policy-sources" aria-label="Official sources">
        <strong>Official resources</strong>
        <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng" target="_blank" rel="noreferrer">GDPR — EUR-Lex</a>
        <a href="https://uodo.gov.pl/pl/676/4255" target="_blank" rel="noreferrer">Transparency duties — UODO</a>
        <a href="https://uodo.gov.pl/pl/676/4260" target="_blank" rel="noreferrer">Storage limitation — UODO</a>
      </section>
    </div>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="cookie-policy-page privacy-policy-page" data-no-translate="true">
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

        <footer className="cookie-policy-footer privacy-policy-footer">
          <a href="/">IdeaHire</a>
          <nav aria-label="Dokumenty prawne">
            <a href="/polityka-prywatnosci">
              <span className="cookie-policy-back-pl">Prywatność</span>
              <span className="cookie-policy-back-en">Privacy</span>
            </a>
            <a href="/polityka-cookies">
              <span className="cookie-policy-back-pl">Cookies</span>
              <span className="cookie-policy-back-en">Cookies</span>
            </a>
          </nav>
          <span>© 2026</span>
        </footer>
      </div>
    </main>
  );
}
