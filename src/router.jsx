
import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import App from "./App";
import { supabase } from "./supabase";

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = React.createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("GET SESSION ERROR:", error);
        }

        if (!mounted) return;

        const currentSession = data?.session || null;

        setSession(currentSession);
        setUser(currentSession?.user || null);
        setLoading(false);
      } catch (error) {
        console.error("SESSION LOAD ERROR:", error);

        if (mounted) {
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;

        setSession(newSession || null);
        setUser(newSession?.user || null);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isLoggedIn: !!session && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return React.useContext(AuthContext);
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div className="page">
      <div className="auth-card">
        <div className="logo">
          Idea<span>Hire</span>
        </div>

        <p>Ładowanie...</p>
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ONLY
========================================================= */

function PublicOnlyRoute({ children }) {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return <Navigate to="/account" replace />;
  }

  return children;
}

/* =========================================================
   NAVBAR
========================================================= */

function AccountNavbar({ profile }) {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`Nie udało się wylogować: ${error.message}`);
      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  const avatarUrl = profile?.avatar_url || "";

  const userName =
    profile?.name ||
    "Użytkownik";

  const initial =
    userName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <Link className="logo" to="/">
        Idea<span>Hire</span>
      </Link>

      <nav className="nav-links">
        <Link to="/account">
          Moje konto
        </Link>

        <Link to="/find-talent">
          Dodaj zlecenie
        </Link>

        <Link to="/jobs">
          Znajdź zlecenie
        </Link>
      </nav>

      <div className="nav-actions">
        <Link
          className="account-mini"
          to="/account"
        >
          <span className="account-mini-avatar">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
              />
            ) : (
              initial
            )}
          </span>

          <span className="account-mini-name">
            {userName}
          </span>
        </Link>

        <button
          className="btn btn-dark"
          type="button"
          onClick={handleLogout}
        >
          Wyloguj się
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleLogin(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        console.error("LOGIN ERROR:", error);

        setMessage(
          `Nie udało się zalogować: ${error.message}`
        );

        return;
      }

      if (!data?.session || !data?.user) {
        setMessage(
          "Logowanie nie utworzyło aktywnej sesji."
        );

        return;
      }

      navigate("/account", {
        replace: true,
      });
    } catch (error) {
      console.error("LOGIN FETCH ERROR:", error);

      setMessage(
        `Nie udało się zalogować: ${
          error?.message || "Failed to fetch"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Witaj ponownie
          </span>

          <h1>
            Zaloguj się
          </h1>

          <p>
            Zaloguj się do swojego konta IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <label>
            Adres e-mail

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="twoj@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Hasło

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Wpisz swoje hasło"
              autoComplete="current-password"
              required
            />
          </label>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logowanie..."
              : "Zaloguj się →"}
          </button>
        </form>

        <p className="auth-footer">
          Nie masz jeszcze konta?{" "}
          <Link to="/register">
            Utwórz konto
          </Link>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   REGISTER
========================================================= */

function Register() {
  const navigate = useNavigate();

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      navigate("/account", {
        replace: true,
      });
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

      if (error) {
        console.error("REGISTER ERROR:", error);

        setMessage(
          `Nie udało się utworzyć konta: ${error.message}`
        );

        return;
      }

      if (!data?.user) {
        setMessage(
          "Supabase nie zwrócił użytkownika."
        );

        return;
      }

      /*
        Profil jest tworzony przez trigger
        public.handle_new_user().
      */

      if (!data.session) {
        alert(
          "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres."
        );

        navigate("/login", {
          replace: true,
        });

        return;
      }

      navigate("/account", {
        replace: true,
      });
    } catch (error) {
      console.error("REGISTER FETCH ERROR:", error);

      setMessage(
        `Nie udało się utworzyć konta: ${
          error?.message || "Failed to fetch"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || isLoggedIn) {
    return <LoadingScreen />;
  }

  return (
    <div className="page">
      <div className="auth-card">
        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>

        <div className="auth-header">
          <span className="section-label">
            Dołącz do IdeaHire
          </span>

          <h1>
            Utwórz konto
          </h1>

          <p>
            Załóż konto i zacznij korzystać z IdeaHire.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
        >
          <label>
            Imię / nazwa

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Twoje imię"
              autoComplete="name"
              required
            />
          </label>

          <label>
            Adres e-mail

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="twoj@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Hasło

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Utwórz hasło"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Tworzenie konta..."
              : "Utwórz konto →"}
          </button>
        </form>

        <p className="auth-footer">
          Masz już konto?{" "}
          <Link to="/login">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AVATAR — 400 × 400 JPEG
========================================================= */

async function resizeAndConvertImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    const objectUrl =
      URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const SIZE = 400;

      const sourceWidth =
        image.naturalWidth;

      const sourceHeight =
        image.naturalHeight;

      if (!sourceWidth || !sourceHeight) {
        reject(
          new Error(
            "Zdjęcie ma nieprawidłowe wymiary."
          )
        );

        return;
      }

      const sourceSize =
        Math.min(
          sourceWidth,
          sourceHeight
        );

      const sourceX =
        (sourceWidth - sourceSize) / 2;

      const sourceY =
        (sourceHeight - sourceSize) / 2;

      const canvas =
        document.createElement("canvas");

      canvas.width = SIZE;
      canvas.height = SIZE;

      const context =
        canvas.getContext("2d");

      if (!context) {
        reject(
          new Error(
            "Przeglądarka nie obsługuje Canvas."
          )
        );

        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        SIZE,
        SIZE
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Nie udało się skonwertować zdjęcia."
              )
            );

            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.82
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          "Nie udało się odczytać zdjęcia."
        )
      );
    };

    image.src = objectUrl;
  });
}

/* =========================================================
   PROFILE DATABASE HELPERS
========================================================= */

async function getProfile(userId) {
  const {
    data,
    error,
  } = await supabase
    .from("users")
    .select("id, name, email, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function updateProfile(
  userId,
  email,
  name,
  avatarUrl
) {
  const {
    data,
    error,
  } = await supabase
    .from("users")
    .update({
      name,
      email,
      avatar_url: avatarUrl || null,
    })
    .eq("id", userId)
    .select("id, name, email, avatar_url")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   ACCOUNT
========================================================= */

function Account() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const navigate = useNavigate();

  const [profile, setProfile] =
    useState(null);

  const [name, setName] =
    useState("");

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const [loadingProfile, setLoadingProfile] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /* =======================================================
     LOAD PROFILE FROM public.users
  ======================================================= */

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    async function loadProfile() {
      try {
        setLoadingProfile(true);
        setMessage("");

        const existingProfile =
          await getProfile(user.id);

        if (!mounted) return;

        if (existingProfile) {
          setProfile(existingProfile);

          setName(
            existingProfile.name ||
            user.email?.split("@")[0] ||
            ""
          );

          setAvatarUrl(
            existingProfile.avatar_url ||
            ""
          );
        } else {
          /*
            Awaryjnie tworzymy profil,
            gdyby użytkownik nie miał rekordu.
          */

          const fallbackName =
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Użytkownik";

          const {
            data: createdProfile,
            error: createError,
          } = await supabase
            .from("users")
            .insert({
              id: user.id,
              name: fallbackName,
              email: user.email || "",
              avatar_url: null,
            })
            .select(
              "id, name, email, avatar_url"
            )
            .single();

          if (createError) {
            throw createError;
          }

          if (!mounted) return;

          setProfile(createdProfile);
          setName(createdProfile.name || "");
          setAvatarUrl(
            createdProfile.avatar_url || ""
          );
        }
      } catch (error) {
        console.error(
          "PROFILE LOAD ERROR:",
          error
        );

        if (mounted) {
          setMessage(
            `Nie udało się pobrać profilu: ${
              error?.message || "Nieznany błąd"
            }`
          );
        }
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (authLoading || loadingProfile) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* =======================================================
     UPLOAD AVATARA
  ======================================================= */

  async function handleAvatarChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage(
        "Wybierz plik graficzny."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "Oryginalne zdjęcie może mieć maksymalnie 10 MB."
      );

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      /*
        1. Konwersja do 400 × 400 JPEG.
      */

      const convertedFile =
        await resizeAndConvertImage(file);

      /*
        2. Ścieżka w bucketcie avatars.
      */

      const filePath =
        `${user.id}/avatar-${Date.now()}.jpg`;

      /*
        3. Upload do Storage.
      */

      const {
        error: uploadError,
      } = await supabase.storage
        .from("avatars")
        .upload(
          filePath,
          convertedFile,
          {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          }
        );

      if (uploadError) {
        console.error(
          "AVATAR UPLOAD ERROR:",
          uploadError
        );

        throw uploadError;
      }

      /*
        4. Publiczny URL.
      */

      const {
        data: publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Nie udało się pobrać publicznego URL zdjęcia."
        );
      }

      /*
        5. Zapisujemy avatar_url
        w public.users.

        UWAGA:
        Nie używamy tutaj auth.updateUser().
      */

      const updatedProfile =
        await updateProfile(
          user.id,
          user.email || "",
          name.trim() ||
            user.email?.split("@")[0] ||
            "Użytkownik",
          publicUrl
        );

      /*
        6. Aktualizujemy ekran.
      */

      setProfile(updatedProfile);

      setName(
        updatedProfile.name || ""
      );

      setAvatarUrl(
        updatedProfile.avatar_url || ""
      );

      setMessage(
        "Zdjęcie profilowe zostało zapisane."
      );
    } catch (error) {
      console.error(
        "AVATAR ERROR:",
        error
      );

      setMessage(
        `Nie udało się ustawić zdjęcia: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  /* =======================================================
     ZAPIS PROFILU
  ======================================================= */

  async function handleSave(event) {
    event.preventDefault();

    const cleanName =
      name.trim();

    if (!cleanName) {
      setMessage(
        "Imię / nazwa nie może być puste."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");

      /*
        Najważniejsza zmiana:

        NIE:
        supabase.auth.updateUser()

        TAK:
        public.users
      */

      const updatedProfile =
        await updateProfile(
          user.id,
          user.email || "",
          cleanName,
          avatarUrl
        );

      setProfile(updatedProfile);

      setName(
        updatedProfile.name || cleanName
      );

      setAvatarUrl(
        updatedProfile.avatar_url || ""
      );

      setMessage(
        "Zmiany zostały zapisane."
      );
    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      setMessage(
        `Nie udało się zapisać profilu: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    const {
      error,
    } = await supabase.auth.signOut();

    if (error) {
      alert(
        `Nie udało się wylogować: ${error.message}`
      );

      return;
    }

    navigate("/", {
      replace: true,
    });
  }

  const displayName =
    profile?.name ||
    name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  return (
    <div className="page">
      <AccountNavbar profile={profile} />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Twoje konto
          </span>

          <h1>
            Mój profil
          </h1>

          <p>
            Zarządzaj swoim profilem IdeaHire.
          </p>
        </div>

        <section className="account-card">
          {/* =================================================
              PODGLĄD PROFILU
          ================================================= */}

          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Zdjęcie profilowe"
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-placeholder">
                  {initial}
                </div>
              )}
            </div>

            <div className="profile-info">
              <h2>
                {displayName}
              </h2>

              <p>
                {user.email}
              </p>
            </div>
          </div>

          {/* =================================================
              FORMULARZ
          ================================================= */}

          <form
            className="auth-form account-form"
            onSubmit={handleSave}
          >
            <label>
              Zdjęcie profilowe

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                disabled={uploading}
              />

              <small>
                JPG, PNG lub WEBP. Zdjęcie zostanie
                automatycznie przycięte do kwadratu
                400 × 400 px i zapisane jako JPEG.
              </small>
            </label>

            {uploading && (
              <div className="profile-upload-status">
                Przetwarzanie i zapisywanie zdjęcia...
              </div>
            )}

            <label>
              Imię / nazwa

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                value={user.email || ""}
                disabled
              />
            </label>

            {message && (
              <p className="auth-message">
                {message}
              </p>
            )}

            <button
              className="btn btn-dark btn-large"
              type="submit"
              disabled={
                saving ||
                uploading
              }
            >
              {saving
                ? "Zapisywanie..."
                : "Zapisz zmiany →"}
            </button>
          </form>
        </section>

        <section className="account-actions">
          <Link
            className="btn btn-outline btn-large"
            to="/find-talent"
          >
            Dodaj zlecenie →
          </Link>

          <Link
            className="btn btn-outline btn-large"
            to="/jobs"
          >
            Znajdź zlecenie →
          </Link>
        </section>

        <button
          className="btn btn-ghost"
          type="button"
          onClick={handleLogout}
        >
          Wyloguj się
        </button>
      </main>
    </div>
  );
}

/* =========================================================
   FIND TALENT
========================================================= */

function FindTalent() {
  const {
    isLoggedIn,
    loading,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="page">
      {isLoggedIn ? (
        <AccountNavbar profile={null} />
      ) : (
        <header className="navbar">
          <Link
            className="logo"
            to="/"
          >
            Idea<span>Hire</span>
          </Link>

          <div className="nav-actions">
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
          </div>
        </header>
      )}

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla zlecających
          </span>

          <h1>
            Dodaj zlecenie
          </h1>

          <p>
            Opisz swój projekt i znajdź osobę,
            która pomoże Ci go zrealizować.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >
          <label>
            Czego potrzebujesz?

            <input
              type="text"
              placeholder="Np. nowoczesna strona internetowa"
              required
            />
          </label>

          <label>
            Opisz swój projekt

            <textarea
              rows="6"
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
              required
            />
          </label>

          <label>
            Budżet

            <input
              type="text"
              placeholder="Np. 1 500–3 000 zł"
              required
            />
          </label>

          <button
            className="btn btn-dark btn-large"
            type="submit"
          >
            Opublikuj zlecenie →
          </button>
        </form>
      </main>
    </div>
  );
}

/* =========================================================
   JOBS
========================================================= */

function Jobs() {
  const jobs = [
    {
      title:
        "Nowoczesna strona internetowa",
      category:
        "Programowanie",
      budget:
        "1 500–3 000 zł",
    },
    {
      title:
        "Logo dla nowej marki",
      category:
        "Grafika i design",
      budget:
        "500–1 000 zł",
    },
    {
      title:
        "Materiały do social media",
      category:
        "Marketing",
      budget:
        "800–1 500 zł",
    },
  ];

  return (
    <div className="page">
      <AccountNavbar profile={null} />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla wykonawców
          </span>

          <h1>
            Znajdź zlecenie
          </h1>

          <p>
            Przeglądaj projekty i znajdź zlecenie
            dopasowane do Twoich umiejętności.
          </p>
        </div>

        <div className="jobs-list">
          {jobs.map((job) => (
            <article
              className="job-card"
              key={job.title}
            >
              <span className="section-label">
                {job.category}
              </span>

              <h2>
                {job.title}
              </h2>

              <p>
                Budżet: {job.budget}
              </p>

              <button
                className="btn btn-dark"
                type="button"
              >
                Zobacz zlecenie →
              </button>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return <App />;
}

/* =========================================================
   ROUTER
========================================================= */

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <FindTalent />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;
