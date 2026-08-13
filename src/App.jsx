import "./App.css";

const categories = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

function App() {
  return (
    <div className="app">
      <header className="navbar">
        <a className="logo" href="/">
          Idea<span>Hire</span>
        </a>

        <nav className="nav-links">
          <a href="#how-it-works">Jak to działa</a>
          <a href="#categories">Kategorie</a>
          <a href="#for-users">Dla Ciebie</a>
        </nav>

        <div className="nav-actions">
          <button className="btn btn-ghost">Zaloguj się</button>
          <button className="btn btn-dark">Zacznij teraz</button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              Miejsce, gdzie pomysły spotykają ludzi
            </div>

            <h1>
              Masz pomysł.
              <br />
              <span>Znajdź kogoś,</span>
              <br />
              kto go zrealizuje.
            </h1>

            <p className="hero-text">
              IdeaHire łączy osoby szukające wykonawców z ludźmi,
              którzy potrafią zamienić pomysł w gotowy projekt.
            </p>

            <div className="hero-actions">
              <button className="btn btn-dark btn-large">
                Znajdź wykonawcę
                <span>→</span>
              </button>

              <button className="btn btn-outline btn-large">
                Znajdź zlecenie
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>Prosto</strong>
                <span>bez zbędnych kroków</span>
              </div>

              <div>
                <strong>Szybko</strong>
                <span>znajdź odpowiednią osobę</span>
              </div>

              <div>
                <strong>Skutecznie</strong>
                <span>realizuj swoje projekty</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-main">
              <div className="card-header">
                <span>Nowe zlecenie</span>
                <span className="live-dot">●</span>
              </div>

              <h3>
                Potrzebuję nowoczesnej
                <br />
                strony internetowej
              </h3>

              <p>
                Szukam osoby, która stworzy prostą i szybką
                stronę dla nowej marki.
              </p>

              <div className="card-meta">
                <span>1 500–3 000 zł</span>
                <span>3 zgłoszenia</span>
              </div>
            </div>

            <div className="floating-card card-small card-top">
              <span className="mini-icon">✦</span>
              <div>
                <strong>Nowe zgłoszenie</strong>
                <span>Projektant UI/UX</span>
              </div>
            </div>

            <div className="floating-card card-small card-bottom">
              <span className="check-icon">✓</span>
              <div>
                <strong>Projekt zakończony</strong>
                <span>Wszystko gotowe</span>
              </div>
            </div>

            <div className="visual-glow" />
          </div>
        </section>

        <section className="categories section" id="categories">
          <div className="section-heading">
            <div>
              <span className="section-label">Kategorie</span>
              <h2>Znajdź dokładnie to,<br />czego potrzebujesz.</h2>
            </div>

            <p>
              Od małych zadań po większe projekty.
              Wybierz kategorię i zacznij szukać.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <button className="category-card" key={category}>
                <span className="category-number">
                  0{index + 1}
                </span>

                <span className="category-name">
                  {category}
                </span>

                <span className="category-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>

        <section className="how section" id="how-it-works">
          <div className="section-heading centered">
            <span className="section-label">Jak to działa</span>
            <h2>Prościej się nie da.</h2>
            <p>
              Trzy kroki. Jeden konkretny cel.
            </p>
          </div>

          <div className="steps">
            <article className="step">
              <span>01</span>
              <h3>Opisz potrzebę</h3>
              <p>
                Powiedz nam, czego potrzebujesz i określ
                podstawowe szczegóły projektu.
              </p>
