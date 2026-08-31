
import { useEffect, useState } from "react";
import "./App.css";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const categories = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

const fallbackJobs = [
  {
    id: "fallback-1",
    title: "Nowoczesna strona internetowa",
    description:
      "Szukam osoby, która stworzy prostą i szybką stronę dla nowej marki.",
    category: "Programowanie",
    budget: 3000,
  },
  {
    id: "fallback-2",
    title: "Identyfikacja wizualna marki",
    description:
      "Potrzebuję spójnego logo oraz podstawowych materiałów graficznych.",
    category: "Grafika i design",
    budget: 1800,
  },
  {
    id: "fallback-3",
    title: "Teksty na stronę firmową",
    description:
      "Zlecę przygotowanie przejrzystych tekstów do sześciu podstron.",
    category: "Copywriting",
    budget: 900,
  },
];

function App({ session, loading }) {
  const [hasNotifications, setHasNotifications] = useState(false);
  const [recentJobs, setRecentJobs] = useState(fallbackJobs);
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    checkNotifications(session);

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          session?.user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
        `ideahire_read_notifications_${session?.user?.id}`
      ) {
        checkNotifications(session);
      }
    }

    window.addEventListener(
      "ideahire:notifications-read",
      handleNotificationsRead
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    const interval = setInterval(() => {
      if (mounted) {
        checkNotifications(session);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;

    async function loadRecentJobs() {
      try {
        const { data, error } =
          await supabase
            .from("jobs")
            .select(
              "id, title, description, category, budget, created_at"
            )
            .order("created_at", {
              ascending: false,
            })
            .limit(8);

        if (error) {
          console.error(
            "HOME RECENT JOBS ERROR:",
            error
          );
          return;
        }

        if (
          mounted &&
          Array.isArray(data) &&
          data.length > 0
        ) {
          setRecentJobs(data);
          setActiveJobIndex(0);
        }
      } catch (error) {
        console.error(
          "HOME RECENT JOBS ERROR:",
          error
        );
      }
    }

    loadRecentJobs();

    const channel = supabase
      .channel("home-recent-jobs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "jobs",
        },
        () => {
          loadRecentJobs();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (recentJobs.length <= 1) return undefined;

    const interval = window.setInterval(
      () => {
        setActiveJobIndex(
          (current) =>
            (current + 1) % recentJobs.length
        );
      },
      4500
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [recentJobs.length]);

  async function checkNotifications(currentSession) {
    const userId = currentSession?.user?.id;

    if (!userId) {
      setHasNotifications(false);
      return;
    }

    try {
      const { data: myJobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id")
        .eq("user_id", userId);

      if (jobsError) {
        console.error("HOME NOTIFICATION JOBS ERROR:", jobsError);
        return;
      }

      const jobIds = (myJobs || []).map((job) => job.id);

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select("id, job_id, applicant_id, created_at")
          .in("job_id", jobIds)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (applicationsError) {
          console.error(
            "HOME NOTIFICATION APPLICATIONS ERROR:",
            applicationsError
          );
          return;
        }

        applications = data || [];
      }

      const readKey = `ideahire_read_notifications_${userId}`;

      let readIds = [];

      try {
        const storedReadIds = JSON.parse(
          localStorage.getItem(readKey) || "[]"
        );

        readIds = Array.isArray(storedReadIds)
          ? storedReadIds
          : [];
      } catch {
        readIds = [];
      }

      const [
        rejectedResult,
        acceptedResult,
        blockedResult,
      ] = await Promise.all([
        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "rejected"),

        supabase
          .from("job_applications")
          .select("id")
          .eq("applicant_id", userId)
          .eq("status", "accepted"),

        supabase
          .from("user_blocks")
          .select("id")
          .eq("blocked_id", userId),
      ]);

      if (rejectedResult.error) {
        console.error(
          "HOME REJECTED NOTIFICATIONS ERROR:",
          rejectedResult.error
        );
      }

      if (acceptedResult.error) {
        console.error(
          "HOME ACCEPTED NOTIFICATIONS ERROR:",
          acceptedResult.error
        );
      }

      if (blockedResult.error) {
        console.error(
          "HOME BLOCK NOTIFICATIONS ERROR:",
          blockedResult.error
        );
      }

      const hasUnreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const hasUnreadRejected =
        (rejectedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const hasUnreadAccepted =
        (acceptedResult.data || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      const hasUnreadBlock =
        (blockedResult.data || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        hasUnreadIncoming ||
          hasUnreadRejected ||
          hasUnreadAccepted ||
          hasUnreadBlock
      );
    } catch (error) {
      console.error("HOME NOTIFICATION CHECK ERROR:", error);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/");
  }

  const userName =
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    session?.user?.user_metadata
      ?.avatar_url || "";

  const userInitial = userName
    .charAt(0)
    .toUpperCase();

  const activeJob =
    recentJobs[
      activeJobIndex % recentJobs.length
    ] || fallbackJobs[0];

  const nextJob =
    recentJobs[
      (activeJobIndex + 1) %
        recentJobs.length
    ] || fallbackJobs[1];

  const followingJob =
    recentJobs[
      (activeJobIndex + 2) %
        recentJobs.length
    ] || fallbackJobs[2];

  function formatBudget(value) {
    return `${Number(
      value || 0
    ).toLocaleString("pl-PL")} zł`;
  }

  return (
    <div className="app">
      <header className="navbar home-navbar">
        <Link className="logo" to="/">
          Idea<span>Hire</span>
        </Link>

        <nav className="nav-links home-nav-links">
          <a href="#how-it-works">Jak to działa</a>
          <a href="#categories">Kategorie</a>
          <a href="#for-users">Dla Ciebie</a>
        </nav>

        <div className="nav-actions">
          {loading ? (
            <span>Ładowanie...</span>
          ) : session ? (
            <>
              <Link
                className="home-account-avatar-link"
                to="/account"
                aria-label="Otwórz moje konto"
              >
                <span className="account-mini-avatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                    />
                  ) : (
                    userInitial
                  )}
                </span>
              </Link>

              <div className="home-account-cluster">
                <span className="auth-user">
                  Cześć, {userName}
                </span>

                <Link
                  className="home-notifications-link btn btn-ghost"
                  to="/notifications"
                >
                  Powiadomienia
                  {hasNotifications && (
                    <span className="home-notifications-dot" />
                  )}
                </Link>

                <Link
                  className="btn btn-ghost"
                  to="/account"
                >
                  Moje konto
                </Link>
              </div>

              <button
                className="btn btn-dark"
                type="button"
                onClick={handleLogout}
              >
                Wyloguj się
              </button>
            </>
          ) : (
            <>
              <Link
                className="btn btn-ghost"
                to="/login"
              >
                Zaloguj się
              </Link>

              <Link
                className="btn btn-dark"
                to="/register"
              >
                Zacznij teraz
              </Link>
            </>
          )}
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
              <Link
                className="btn btn-dark btn-large"
                to="/find-talent"
              >
                Znajdź wykonawcę <span>→</span>
              </Link>

              <Link
                className="btn btn-outline btn-large"
                to="/jobs"
              >
                Znajdź zlecenie
              </Link>
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
            <div
              className="floating-card card-main rotating-job-card"
              key={activeJob.id}
            >
              <div className="card-header">
                <span>Aktualne zlecenie</span>
                <span className="live-dot">●</span>
              </div>

              <h3>{activeJob.title}</h3>

              <p>
                {activeJob.description}
              </p>

              <div className="card-meta">
                <span>
                  {formatBudget(activeJob.budget)}
                </span>
                <span>{activeJob.category}</span>
              </div>
            </div>

            <div className="floating-card card-small card-top">
              <span className="mini-icon">✦</span>

              <div>
                <strong>Najnowsze zlecenia</strong>
                <span>{nextJob.title}</span>
              </div>
            </div>

            <div className="floating-card card-small card-bottom">
              <span className="check-icon">↗</span>

              <div>
                <strong>Kolejne zlecenie</strong>
                <span>{followingJob.title}</span>
              </div>
            </div>

            <div className="visual-glow" />
          </div>
        </section>

        <section
          className="categories section"
          id="categories"
        >
          <div className="section-heading">
            <div>
              <span className="section-label">Kategorie</span>

              <h2>
                Znajdź dokładnie to,
                <br />
                czego potrzebujesz.
              </h2>
            </div>

            <p>
              Od małych zadań po większe projekty.
              Wybierz kategorię i zacznij szukać.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <button
                className="category-card"
                key={category}
                type="button"
                onClick={() =>
                  navigate(
                    `/jobs?category=${encodeURIComponent(
                      category
                    )}`
                  )
                }
                aria-label={`Pokaż zlecenia: ${category}`}
              >
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

        <section
          className="how section"
          id="how-it-works"
        >
          <div className="section-heading centered">
            <span className="section-label">
              Jak to działa
            </span>

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
            </article>

            <article className="step">
              <span>02</span>

              <h3>Wybierz osobę</h3>

              <p>
                Przejrzyj zgłoszenia i wybierz wykonawcę,
                który najlepiej pasuje do Twojego projektu.
              </p>
            </article>

            <article className="step">
              <span>03</span>

              <h3>Zrealizuj projekt</h3>

              <p>
                Ustal szczegóły, rozpocznij współpracę
                i doprowadź projekt do końca.
              </p>
            </article>
          </div>
        </section>

        <section
          className="split-section section"
          id="for-users"
        >
          <div className="split-card">
            <span className="section-label">
              Dla zlecających
            </span>

            <h2>Masz coś do zrobienia?</h2>

            <p>
              Znajdź osobę, która ma odpowiednie umiejętności
              i może zająć się Twoim projektem.
            </p>

            <Link
              className="btn btn-light"
              to="/find-talent"
            >
              Dodaj zlecenie →
            </Link>
          </div>

          <div className="split-card light">
            <span className="section-label">
              Dla wykonawców
            </span>

            <h2>Masz coś do zaoferowania?</h2>

            <p>
              Pokaż swoje umiejętności, znajdź interesujące
              projekty i rozwijaj swoje portfolio.
            </p>

            <Link
              className="btn btn-outline"
              to="/jobs"
            >
              Znajdź zlecenia →
            </Link>
          </div>
        </section>

        <section className="final-cta">
          <span className="section-label">IdeaHire</span>

          <h2>
            Twój następny projekt
            <br />
            zaczyna się tutaj.
          </h2>

          <Link
            className="btn btn-light btn-large"
            to={session ? "/account" : "/register"}
          >
            {session
              ? "Przejdź do konta →"
              : "Zacznij teraz →"}
          </Link>
        </section>
      </main>

      <footer className="footer">
        <div>
          <Link className="logo" to="/">
            Idea<span>Hire</span>
          </Link>

          <p>Prosto. Szybko. Skutecznie.</p>
        </div>

        <div className="footer-links">
          <a href="#how-it-works">Jak to działa</a>
          <a href="#categories">Kategorie</a>
          <a href="#for-users">Dla Ciebie</a>
        </div>

        <span>© 2026 IdeaHire</span>
      </footer>
    </div>
  );
}

export default App;
