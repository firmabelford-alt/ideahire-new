
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import App from "./App";
import { supabase } from "./supabase";

/* =========================================================
   AUTH
========================================================= */

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("AUTH ERROR:", error);
        }

        if (!mounted) return;

        const currentSession =
          data?.session || null;

        setSession(currentSession);
        setUser(
          currentSession?.user || null
        );
      } catch (error) {
        console.error(
          "AUTH INIT ERROR:",
          error
        );

        if (!mounted) return;

        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;

          setSession(
            newSession || null
          );

          setUser(
            newSession?.user || null
          );

          setLoading(false);
        }
      );

    return () => {
      mounted = false;

      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        isLoggedIn:
          !!session && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

/* =========================================================
   PUBLIC PROFILE SYNC
========================================================= */

async function syncPublicProfile(user) {
  if (!user?.id) return;

  const name =
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user.user_metadata?.avatar_url ||
    null;

  const about =
    user.user_metadata?.about ||
    null;

  const { error } =
    await supabase
      .from("public_profiles")
      .upsert(
        {
          user_id: user.id,
          name,
          avatar_url: avatarUrl,
          about,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

  if (error) {
    console.error(
      "PUBLIC PROFILE SYNC ERROR:",
      error
    );
  }
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

   Najważniejsze:
   - czekamy aż AuthProvider skończy sprawdzać sesję
   - dopiero później decydujemy o przekierowaniu
   - nie robimy dodatkowych redirectów w Login/Register
========================================================= */

function ProtectedRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,
        }}
      />
    );
  }

  return children;
}

/* =========================================================
   PUBLIC ROUTE

   Zalogowany użytkownik nie powinien wracać
   na login/register.
========================================================= */

function PublicOnlyRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
  } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return (
      <Navigate
        to="/account"
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   NAVBAR
========================================================= */

function AccountNavbar() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    "";

  const initial =
    userName
      .charAt(0)
      .toUpperCase();

  async function handleLogout() {
    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        alert(
          `Nie udało się wylogować: ${error.message}`
        );

        return;
      }

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      alert(
        `Nie udało się wylogować: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    }
  }

  return (
    <header className="navbar">
      <Link
        className="logo"
        to="/"
      >
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
          onClick={
            handleLogout
          }
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
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    loading: authLoading,
    isLoggedIn,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * NIE przekierowujemy tutaj automatycznie
   * na podstawie isLoggedIn.
   *
   * Redirect robi PublicOnlyRoute.
   *
   * Dzięki temu nie powstaje pętla.
   */

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),
            password,
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zalogować: ${error.message}`
        );

        return;
      }

      if (
        !data?.session ||
        !data?.user
      ) {
        setMessage(
          "Logowanie nie utworzyło aktywnej sesji."
        );

        return;
      }

      await syncPublicProfile(
        data.user
      );

      const from =
        location.state?.from;

      const destination =
        typeof from === "string" &&
        from.startsWith("/")
          ? from
          : "/account";

      navigate(
        destination,
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setMessage(
        `Nie udało się zalogować: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
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
                setEmail(
                  event.target.value
                )
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
                setPassword(
                  event.target.value
                )
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
  const navigate =
    useNavigate();

  const {
    loading: authLoading,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    if (loading) return;

    setMessage("");
    setLoading(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              email.trim(),
            password,
            options: {
              data: {
                name:
                  name.trim(),
              },
            },
          }
        );

      if (error) {
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

      await syncPublicProfile(
        data.user
      );

      if (!data.session) {
        setMessage(
          "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres."
        );

        return;
      }

      navigate(
        "/account",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error
      );

      setMessage(
        `Nie udało się utworzyć konta: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
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
          onSubmit={
            handleRegister
          }
        >
          <label>
            Imię / nazwa

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
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
                setEmail(
                  event.target.value
                )
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
                setPassword(
                  event.target.value
                )
              }
              placeholder="Utwórz hasło"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {message && (
            <p
              className={
                message.startsWith(
                  "Konto zostało"
                )
                  ? "auth-message"
                  : "auth-error"
              }
            >
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
   RESET PASSWORD
========================================================= */

function ResetPassword() {
  const navigate =
    useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    passwordAgain,
    setPasswordAgain,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password.length < 6) {
      setMessage(
        "Hasło musi mieć co najmniej 6 znaków."
      );

      return;
    }

    if (
      password !== passwordAgain
    ) {
      setMessage(
        "Hasła nie są takie same."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser(
          {
            password,
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zmienić hasła: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Hasło zostało zmienione. Za chwilę przejdziesz do logowania."
      );

      setPassword("");
      setPasswordAgain("");

      setTimeout(() => {
        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }, 1800);
    } catch (error) {
      setMessage(
        `Nie udało się zmienić hasła: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
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
            Odzyskiwanie konta
          </span>

          <h1>
            Ustaw nowe hasło
          </h1>

          <p>
            Wpisz nowe hasło do swojego konta.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Nowe hasło

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            Powtórz nowe hasło

            <input
              type="password"
              value={passwordAgain}
              onChange={(event) =>
                setPasswordAgain(
                  event.target.value
                )
              }
              minLength={6}
              autoComplete="new-password"
              required
            />
          </label>

          {message && (
            <p
              className={
                success
                  ? "auth-message"
                  : "auth-error"
              }
            >
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Zapisywanie..."
              : "Ustaw nowe hasło →"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">
            Wróć do logowania
          </Link>
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   AVATAR
========================================================= */

async function resizeAndConvertImage(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        const SIZE = 400;

        const width =
          image.naturalWidth;

        const height =
          image.naturalHeight;

        const sourceSize =
          Math.min(
            width,
            height
          );

        const sourceX =
          (width -
            sourceSize) /
          2;

        const sourceY =
          (height -
            sourceSize) /
          2;

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width = SIZE;
        canvas.height = SIZE;

        const context =
          canvas.getContext(
            "2d"
          );

        if (!context) {
          reject(
            new Error(
              "Przeglądarka nie obsługuje Canvas."
            )
          );

          return;
        }

        context.imageSmoothingEnabled =
          true;

        context.imageSmoothingQuality =
          "high";

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

            resolve(
              new File(
                [blob],
                "avatar.jpg",
                {
                  type:
                    "image/jpeg",
                }
              )
            );
          },
          "image/jpeg",
          0.82
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "Nie udało się odczytać zdjęcia."
          )
        );
      };

      image.src =
        objectUrl;
    }
  );
}

/* =========================================================
   ACCOUNT
========================================================= */

function Account() {
  const { user } =
    useAuth();

  const [name, setName] =
    useState("");

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * Powiadomienia są w karcie profilu.
   * Na tym etapie trzymamy je lokalnie,
   * żeby nie uzależniać działania konta
   * od nieznanego schematu tabeli notifications.
   */
  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  useEffect(() => {
    if (!user) return;

    setName(
      user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );

    setAvatarUrl(
      user.user_metadata?.avatar_url ||
        ""
    );
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const key =
      `ideahire_notifications_${user.id}`;

    try {
      const saved =
        JSON.parse(
          localStorage.getItem(
            key
          ) || "[]"
        );

      setNotifications(
        Array.isArray(saved)
          ? saved
          : []
      );
    } catch {
      setNotifications([]);
    }
  }, [user]);

  function markNotificationsRead() {
    if (!user?.id) return;

    const updated =
      notifications.map(
        (item) => ({
          ...item,
          read: true,
        })
      );

    setNotifications(
      updated
    );

    localStorage.setItem(
      `ideahire_notifications_${user.id}`,
      JSON.stringify(updated)
    );
  }

  async function handleAvatarChange(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setMessage("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "Wybierz plik graficzny."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "Zdjęcie może mieć maksymalnie 10 MB."
      );

      event.target.value = "";

      return;
    }

    setUploading(true);

    try {
      const convertedFile =
        await resizeAndConvertImage(
          file
        );

      const filePath =
        `${user.id}/avatar-${Date.now()}.jpg`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            convertedFile,
            {
              contentType:
                "image/jpeg",
              cacheControl:
                "3600",
              upsert: false,
            }
          );

      if (uploadError) {
        setMessage(
          `Nie udało się przesłać zdjęcia: ${uploadError.message}`
        );

        return;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

      const publicUrl =
        publicUrlData?.publicUrl;

      if (!publicUrl) {
        setMessage(
          "Nie udało się pobrać adresu zdjęcia."
        );

        return;
      }

      const {
        data:
          updatedUser,
        error:
          metadataError,
      } =
        await supabase.auth.updateUser(
          {
            data: {
              avatar_url:
                publicUrl,
            },
          }
        );

      if (metadataError) {
        setMessage(
          `Zdjęcie przesłane, ale nie udało się zapisać profilu: ${metadataError.message}`
        );

        return;
      }

      setAvatarUrl(
        updatedUser?.user
          ?.user_metadata
          ?.avatar_url ||
          publicUrl
      );

      await syncPublicProfile(
        updatedUser?.user ||
          user
      );

      setMessage(
        "Zdjęcie profilowe zostało zapisane."
      );
    } catch (error) {
      setMessage(
        `Nie udało się ustawić zdjęcia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSave(
    event
  ) {
    event.preventDefault();

    const cleanName =
      name.trim();

    setMessage("");

    if (!cleanName) {
      setMessage(
        "Imię / nazwa nie może być puste."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.updateUser(
          {
            data: {
              name: cleanName,
              avatar_url:
                avatarUrl ||
                null,
            },
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zapisać profilu: ${error.message}`
        );

        return;
      }

      if (!data?.user) {
        setMessage(
          "Profil nie został zaktualizowany."
        );

        return;
      }

      setName(
        data.user.user_metadata
          ?.name ||
          cleanName
      );

      setAvatarUrl(
        data.user.user_metadata
          ?.avatar_url ||
          ""
      );

      await syncPublicProfile(
        data.user
      );

      setMessage(
        "Profil został zapisany."
      );
    } catch (error) {
      setMessage(
        `Nie udało się zapisać profilu: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  const displayName =
    name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  const unreadCount =
    notifications.filter(
      (item) =>
        !item.read
    ).length;

  return (
    <div className="page">
      <AccountNavbar />

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
                {user?.email}
              </p>
            </div>
          </div>

          {/* =================================================
              POWIADOMIENIA — W KARCIE PROFILU
          ================================================= */}

          <div
            style={{
              marginTop: "28px",
              paddingTop: "24px",
              borderTop:
                "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                gap: "16px",
                flexWrap:
                  "wrap",
              }}
            >
              <div>
                <span className="section-label">
                  Powiadomienia
                </span>

                <p
                  style={{
                    marginBottom: 0,
                  }}
                >
                  Informacje dotyczące Twoich zleceń i aktywności.
                </p>
              </div>

              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  const next =
                    !notificationsOpen;

                  setNotificationsOpen(
                    next
                  );

                  if (next) {
                    markNotificationsRead();
                  }
                }}
              >
                {notificationsOpen
                  ? "Ukryj powiadomienia ↑"
                  : unreadCount > 0
                  ? `Powiadomienia (${unreadCount})`
                  : "Powiadomienia"}
              </button>
            </div>

            {notificationsOpen && (
              <div
                style={{
                  marginTop: "18px",
                }}
              >
                {notifications.length ===
                0 ? (
                  <div
                    style={{
                      padding:
                        "18px",
                      borderRadius:
                        "14px",
                      background:
                        "rgba(0,0,0,0.035)",
                    }}
                  >
                    <strong>
                      Brak nowych powiadomień
                    </strong>

                    <p
                      style={{
                        marginBottom: 0,
                      }}
                    >
                      Kiedy ktoś zgłosi się do Twojego zlecenia albo pojawi się ważna informacja, zobaczysz ją tutaj.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    {notifications.map(
                      (
                        notification,
                        index
                      ) => (
                        <div
                          key={
                            notification.id ||
                            index
                          }
                          style={{
                            padding:
                              "16px",
                            borderRadius:
                              "14px",
                            background:
                              "rgba(0,0,0,0.035)",
                          }}
                        >
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          <p
                            style={{
                              marginBottom:
                                "4px",
                            }}
                          >
                            {
                              notification.message
                            }
                          </p>

                          {notification.created_at && (
                            <small>
                              {new Date(
                                notification.created_at
                              ).toLocaleString(
                                "pl-PL"
                              )}
                            </small>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            className="auth-form account-form"
            onSubmit={
              handleSave
            }
          >
            <label>
              Zdjęcie profilowe

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
                disabled={
                  uploading ||
                  saving
                }
              />

              <small>
                JPG, PNG lub WEBP.
                Zdjęcie zostanie automatycznie przycięte do 400 × 400 px.
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
                  setName(
                    event.target.value
                  )
                }
                placeholder="Np. Jan Kowalski"
                autoComplete="name"
                required
              />
            </label>

            <label>
              E-mail

              <input
                type="email"
                value={
                  user?.email || ""
                }
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
      </main>
    </div>
  );
}

/* =========================================================
   JOB CATEGORIES
========================================================= */

const JOB_CATEGORIES = [
  "Programowanie",
  "Grafika i design",
  "Marketing",
  "Copywriting",
  "Video",
  "Fotografia",
];

/* =========================================================
   FIND TALENT
========================================================= */

function FindTalent() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [title, setTitle] =
    useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [category, setCategory] =
    useState(
      JOB_CATEGORIES[0]
    );

  const [budget, setBudget] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  function handleBudgetChange(
    event
  ) {
    setBudget(
      event.target.value.replace(
        /\D/g,
        ""
      )
    );
  }

  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const numericBudget =
      Number(budget);

    if (!cleanTitle) {
      setMessage(
        "Wpisz nazwę zlecenia."
      );

      return;
    }

    if (!cleanDescription) {
      setMessage(
        "Opisz krótko swoje zlecenie."
      );

      return;
    }

    if (
      !budget ||
      !Number.isInteger(
        numericBudget
      ) ||
      numericBudget <= 0
    ) {
      setMessage(
        "Budżet musi zawierać wyłącznie cyfry i być większy od 0."
      );

      return;
    }

    if (!user?.id) {
      setMessage(
        "Twoja sesja wygasła. Zaloguj się ponownie."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } =
        await supabase
          .from("jobs")
          .insert({
            user_id:
              user.id,
            title:
              cleanTitle,
            description:
              cleanDescription,
            category,
            budget:
              numericBudget,
          });

      if (error) {
        setMessage(
          `Nie udało się opublikować zlecenia: ${error.message}`
        );

        return;
      }

      await syncPublicProfile(
        user
      );

      setSuccess(true);

      setMessage(
        "Zlecenie zostało opublikowane."
      );

      setTitle("");
      setDescription("");
      setCategory(
        JOB_CATEGORIES[0]
      );
      setBudget("");

      setTimeout(() => {
        navigate("/jobs");
      }, 700);
    } catch (error) {
      setMessage(
        `Nie udało się opublikować zlecenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla zlecających
          </span>

          <h1>
            Dodaj zlecenie
          </h1>

          <p>
            Opisz projekt, wybierz kategorię i ustaw budżet.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={
            handleSubmit
          }
        >
          <label>
            Czego potrzebujesz?

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="Np. nowoczesna strona internetowa"
              maxLength={120}
              required
            />
          </label>

          <label>
            Kategoria

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              required
            >
              {JOB_CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            Opisz swój projekt

            <textarea
              rows="6"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Napisz kilka słów o tym, czego potrzebujesz..."
              maxLength={2000}
              required
            />
          </label>

          <label>
            Budżet (zł)

            <input
              type="text"
              value={budget}
              onChange={
                handleBudgetChange
              }
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Np. 3000"
              maxLength={9}
              required
            />

            <small>
              Wpisz tylko cyfry, bez zł, spacji i kropek.
            </small>
          </label>

          <div
            className="account-card"
            style={{
              margin: 0,
            }}
          >
            <strong>
              Ważne
            </strong>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Cena jest ustalana przez zlecającego przy publikacji i nie może być później edytowana.
            </p>
          </div>

          {message && (
            <p
              className={
                success
                  ? "auth-message"
                  : "auth-error"
              }
            >
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Publikowanie..."
              : "Opublikuj zlecenie →"}
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
  const { user } =
    useAuth();

  const [jobs, setJobs] =
    useState([]);

  const [profiles, setProfiles] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [openJobId, setOpenJobId] =
    useState(null);

  const [
    editingJobId,
    setEditingJobId,
  ] = useState(null);

  const [
    savingEdit,
    setSavingEdit,
  ] = useState(false);

  const [
    deletingJobId,
    setDeletingJobId,
  ] = useState(null);

  const [
    editTitle,
    setEditTitle,
  ] = useState("");

  const [
    editDescription,
    setEditDescription,
  ] = useState("");

  const [
    editCategory,
    setEditCategory,
  ] = useState(
    JOB_CATEGORIES[0]
  );

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    try {
      /*
       * UWAGA:
       * Nie używamy status, ponieważ poprzednio
       * Supabase zwracał:
       * "column jobs.status does not exist".
       */
      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, created_at, updated_at"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        setMessage(
          `Nie udało się pobrać zleceń: ${error.message}`
        );

        return;
      }

      const loadedJobs =
        data || [];

      setJobs(
        loadedJobs
      );

      const userIds = [
        ...new Set(
          loadedJobs
            .map(
              (job) =>
                job.user_id
            )
            .filter(Boolean)
        ),
      ];

      if (
        userIds.length === 0
      ) {
        setProfiles({});
        return;
      }

      const {
        data:
          profileData,
      } =
        await supabase
          .from(
            "public_profiles"
          )
          .select(
            "user_id, name, avatar_url"
          )
          .in(
            "user_id",
            userIds
          );

      const profileMap =
        {};

      (
        profileData || []
      ).forEach(
        (profile) => {
          profileMap[
            profile.user_id
          ] = profile;
        }
      );

      setProfiles(
        profileMap
      );
    } catch (error) {
      setMessage(
        `Nie udało się pobrać zleceń: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function formatBudget(
    value
  ) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "pl-PL"
    )} zł`;
  }

  function formatDate(
    value
  ) {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleDateString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  function startEditing(
    job
  ) {
    setEditingJobId(
      job.id
    );

    setEditTitle(
      job.title || ""
    );

    setEditDescription(
      job.description || ""
    );

    setEditCategory(
      job.category ||
        JOB_CATEGORIES[0]
    );

    setOpenJobId(
      job.id
    );
  }

  function cancelEditing() {
    setEditingJobId(null);
    setEditTitle("");
    setEditDescription("");
    setEditCategory(
      JOB_CATEGORIES[0]
    );
  }

  async function handleEditSubmit(
    event,
    job
  ) {
    event.preventDefault();

    const cleanTitle =
      editTitle.trim();

    const cleanDescription =
      editDescription.trim();

    if (!cleanTitle) {
      setMessage(
        "Nazwa zlecenia nie może być pusta."
      );

      return;
    }

    if (!cleanDescription) {
      setMessage(
        "Opis zlecenia nie może być pusty."
      );

      return;
    }

    if (
      job.user_id !==
      user?.id
    ) {
      setMessage(
        "Nie możesz edytować tego zlecenia."
      );

      return;
    }

    setSavingEdit(true);
    setMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .update({
            title:
              cleanTitle,
            description:
              cleanDescription,
            category:
              editCategory,
          })
          .eq(
            "id",
            job.id
          )
          .eq(
            "user_id",
            user.id
          )
          .select(
            "id, user_id, title, description, category, budget, created_at, updated_at"
          )
          .single();

      if (error) {
        setMessage(
          `Nie udało się zapisać zmian: ${error.message}`
        );

        return;
      }

      setJobs(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              job.id
                ? data
                : item
          )
      );

      cancelEditing();

      setMessage(
        "Zlecenie zostało zaktualizowane. Budżet pozostał bez zmian."
      );
    } catch (error) {
      setMessage(
        `Nie udało się zapisać zmian: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(
    job
  ) {
    if (
      job.user_id !==
      user?.id
    ) {
      setMessage(
        "Nie możesz usunąć tego zlecenia."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Czy na pewno chcesz usunąć zlecenie „${job.title}”? Tej operacji nie można cofnąć.`
      );

    if (!confirmed) return;

    setDeletingJobId(
      job.id
    );

    try {
      const { error } =
        await supabase
          .from("jobs")
          .delete()
          .eq(
            "id",
            job.id
          )
          .eq(
            "user_id",
            user.id
          );

      if (error) {
        setMessage(
          `Nie udało się usunąć zlecenia: ${error.message}`
        );

        return;
      }

      setJobs(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              job.id
          )
      );

      setMessage(
        "Zlecenie zostało usunięte."
      );
    } catch (error) {
      setMessage(
        `Nie udało się usunąć zlecenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setDeletingJobId(
        null
      );
    }
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Dla wykonawców
          </span>

          <h1>
            Znajdź zlecenie
          </h1>

          <p>
            Przeglądaj prawdziwe zlecenia opublikowane przez użytkowników IdeaHire.
          </p>
        </div>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        {loading && (
          <p>
            Ładowanie zleceń...
          </p>
        )}

        {!loading &&
          jobs.length ===
            0 && (
            <section className="account-card">
              <span className="section-label">
                Brak zleceń
              </span>

              <h2>
                Na razie nie ma żadnych zleceń.
              </h2>

              <p>
                Dodaj pierwsze zlecenie, aby pojawiło się tutaj dla innych użytkowników.
              </p>

              <Link
                className="btn btn-dark"
                to="/find-talent"
              >
                Dodaj zlecenie →
              </Link>
            </section>
          )}

        <div className="jobs-list">
          {jobs.map(
            (job) => {
              const isOpen =
                openJobId ===
                job.id;

              const isEditing =
                editingJobId ===
                job.id;

              const isOwner =
                job.user_id ===
                user?.id;

              const profile =
                profiles[
                  job.user_id
                ];

              const profileName =
                profile?.name ||
                "Użytkownik";

              const profileInitial =
                profileName
                  .charAt(0)
                  .toUpperCase();

              return (
                <article
                  className="job-card"
                  key={job.id}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "16px",
                    }}
                  >
                    <span className="section-label">
                      {job.category}
                    </span>

                    <small>
                      {formatDate(
                        job.created_at
                      )}
                    </small>
                  </div>

                  <h2>
                    {job.title}
                  </h2>

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "10px",
                      margin:
                        "14px 0",
                    }}
                  >
                    <Link
                      to={`/profile/${job.user_id}`}
                      style={{
                        display:
                          "inline-flex",
                        alignItems:
                          "center",
                        gap: "10px",
                        textDecoration:
                          "none",
                      }}
                    >
                      <span className="account-mini-avatar">
                        {profile?.avatar_url ? (
                          <img
                            src={
                              profile.avatar_url
                            }
                            alt=""
                          />
                        ) : (
                          profileInitial
                        )}
                      </span>

                      <strong>
                        {profileName}
                      </strong>
                    </Link>
                  </div>

                  <p>
                    <strong>
                      Budżet:
                    </strong>{" "}
                    {formatBudget(
                      job.budget
                    )}
                  </p>

                  {isEditing ? (
                    <form
                      className="project-form"
                      onSubmit={(
                        event
                      ) =>
                        handleEditSubmit(
                          event,
                          job
                        )
                      }
                    >
                      <label>
                        Nazwa zlecenia

                        <input
                          value={
                            editTitle
                          }
                          onChange={(
                            event
                          ) =>
                            setEditTitle(
                              event
                                .target
                                .value
                            )
                          }
                          maxLength={
                            120
                          }
                          required
                        />
                      </label>

                      <label>
                        Kategoria

                        <select
                          value={
                            editCategory
                          }
                          onChange={(
                            event
                          ) =>
                            setEditCategory(
                              event
                                .target
                                .value
                            )
                          }
                        >
                          {JOB_CATEGORIES.map(
                            (
                              item
                            ) => (
                              <option
                                key={
                                  item
                                }
                                value={
                                  item
                                }
                              >
                                {
                                  item
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        Opis zlecenia

                        <textarea
                          rows="6"
                          value={
                            editDescription
                          }
                          onChange={(
                            event
                          ) =>
                            setEditDescription(
                              event
                                .target
                                .value
                            )
                          }
                          maxLength={
                            2000
                          }
                          required
                        />
                      </label>

                      <div
                        className="account-card"
                        style={{
                          margin: 0,
                        }}
                      >
                        <strong>
                          Budżet:{" "}
                          {formatBudget(
                            job.budget
                          )}
                        </strong>

                        <p
                          style={{
                            marginBottom: 0,
                          }}
                        >
                          Budżet jest ustalany przy publikacji i nie można go później zmienić.
                        </p>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          className="btn btn-dark"
                          type="submit"
                          disabled={
                            savingEdit
                          }
                        >
                          {savingEdit
                            ? "Zapisywanie..."
                            : "Zapisz zmiany →"}
                        </button>

                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={
                            cancelEditing
                          }
                          disabled={
                            savingEdit
                          }
                        >
                          Anuluj
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {isOpen && (
                        <div
                          style={{
                            marginTop:
                              "18px",
                          }}
                        >
                          <p>
                            {
                              job.description
                            }
                          </p>

                          <small>
                            Cena została ustalona przy publikacji i nie podlega późniejszej edycji.
                          </small>
                        </div>
                      )}

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                          marginTop:
                            "16px",
                        }}
                      >
                        <button
                          className="btn btn-dark"
                          type="button"
                          onClick={() =>
                            setOpenJobId(
                              isOpen
                                ? null
                                : job.id
                            )
                          }
                        >
                          {isOpen
                            ? "Ukryj szczegóły ↑"
                            : "Zobacz zlecenie →"}
                        </button>

                        <Link
                          className="btn btn-outline"
                          to={`/profile/${job.user_id}`}
                        >
                          Zobacz profil zlecającego
                        </Link>

                        {isOwner && (
                          <>
                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={() =>
                                startEditing(
                                  job
                                )
                              }
                            >
                              Edytuj
                            </button>

                            <button
                              className="btn btn-outline"
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  job
                                )
                              }
                              disabled={
                                deletingJobId ===
                                job.id
                              }
                            >
                              {deletingJobId ===
                              job.id
                                ? "Usuwanie..."
                                : "Usuń"}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            }
          )}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   PUBLIC PROFILE
========================================================= */

function PublicProfile() {
  const { userId } =
    useParams();

  const {
    user: currentUser,
  } = useAuth();

  const [profile, setProfile] =
    useState(null);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!userId) return;

      setLoading(true);
      setMessage("");

      try {
        const [
          profileResult,
          jobsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "public_profiles"
              )
              .select(
                "user_id, name, avatar_url, about, created_at"
              )
              .eq(
                "user_id",
                userId
              )
              .maybeSingle(),

            supabase
              .from("jobs")
              .select(
                "id, user_id, title, description, category, budget, created_at"
              )
              .eq(
                "user_id",
                userId
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              ),
          ]);

        if (
          profileResult.error
        ) {
          throw profileResult.error;
        }

        if (
          jobsResult.error
        ) {
          throw jobsResult.error;
        }

        if (!mounted) return;

        const profileData =
          profileResult.data;

        const jobData =
          jobsResult.data ||
          [];

        if (
          !profileData &&
          jobData.length === 0
        ) {
          setMessage(
            "Nie znaleziono tego profilu."
          );

          return;
        }

        setProfile(
          profileData || {
            user_id:
              userId,
            name:
              "Użytkownik",
            avatar_url:
              null,
            about:
              null,
          }
        );

        setJobs(
          jobData
        );
      } catch (error) {
        if (!mounted) return;

        setMessage(
          `Nie udało się pobrać profilu: ${
            error?.message ||
            "Nieznany błąd"
          }`
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [userId]);

  function formatBudget(
    value
  ) {
    return `${Number(
      value || 0
    ).toLocaleString(
      "pl-PL"
    )} zł`;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (message) {
    return (
      <div className="page">
        <AccountNavbar />

        <main className="app-page">
          <section className="account-card">
            <p className="auth-error">
              {message}
            </p>

            <Link
              className="btn btn-dark"
              to="/jobs"
            >
              Wróć do zleceń →
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const displayName =
    profile?.name ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  const isOwnProfile =
    currentUser?.id ===
    profile?.user_id;

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <section className="account-card">
          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {profile?.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
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
              <span className="section-label">
                Profil użytkownika
              </span>

              <h1>
                {displayName}
              </h1>

              {profile?.about && (
                <p>
                  {profile.about}
                </p>
              )}

              <p>
                {jobs.length}{" "}
                {jobs.length === 1
                  ? "zlecenie"
                  : "zleceń"}{" "}
                opublikowanych na IdeaHire.
              </p>

              {isOwnProfile && (
                <Link
                  className="btn btn-outline"
                  to="/account"
                >
                  Edytuj profil
                </Link>
              )}
            </div>
          </div>
        </section>

        <section
          className="account-card"
          style={{
            marginTop:
              "28px",
          }}
        >
          <span className="section-label">
            Zlecenia
          </span>

          <h2>
            Zlecenia użytkownika
          </h2>

          {jobs.length ===
          0 ? (
            <p>
              Ten użytkownik nie ma jeszcze opublikowanych zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {jobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={
                      job.id
                    }
                  >
                    <span className="section-label">
                      {
                        job.category
                      }
                    </span>

                    <h2>
                      {
                        job.title
                      }
                    </h2>

                    <p>
                      {
                        job.description
                      }
                    </p>

                    <p>
                      <strong>
                        Budżet:
                      </strong>{" "}
                      {formatBudget(
                        job.budget
                      )}
                    </p>

                    <small>
                      Cena ustalona przy publikacji i nie podlega edycji.
                    </small>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const {
    loading,
  } = useAuth();

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
          {/* HOME */}
          <Route
            path="/"
            element={
              <Home />
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          {/* REGISTER */}
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* RESET PASSWORD */}
          <Route
            path="/reset-password"
            element={
              <ResetPassword />
            }
          />

          {/* ACCOUNT */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* ADD JOB */}
          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <FindTalent />
              </ProtectedRoute>
            }
          />

          {/* JOBS */}
          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            }
          />

          {/* PUBLIC PROFILE */}
          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <PublicProfile />
              </ProtectedRoute>
            }
          />

          {/* FALLBACK */}
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
