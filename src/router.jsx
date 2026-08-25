
import React, {
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
   AUTH CONTEXT
========================================================= */

const AuthContext =
  React.createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] =
    useState(null);

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            "GET SESSION ERROR:",
            error
          );
        }

        if (!mounted) return;

        const currentSession =
          data?.session || null;

        setSession(
          currentSession
        );

        setUser(
          currentSession?.user ||
            null
        );

        setLoading(false);
      } catch (error) {
        console.error(
          "SESSION LOAD ERROR:",
          error
        );

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          if (!mounted) return;

          setSession(
            newSession || null
          );

          setUser(
            newSession?.user ||
              null
          );

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
        isLoggedIn:
          !!session && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return React.useContext(
    AuthContext
  );
}

/* =========================================================
   PUBLIC PROFILE SYNC
========================================================= */

async function syncPublicProfile(
  user
) {
  if (!user?.id) return;

  const name =
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user.user_metadata
      ?.avatar_url || null;

  const { error } =
    await supabase
      .from("public_profiles")
      .upsert(
        {
          user_id: user.id,
          name,
          avatar_url:
            avatarUrl,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "user_id",
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

        <p>
          Ładowanie...
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED ROUTE
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
    return (
      <LoadingScreen />
    );
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
   PUBLIC ONLY
========================================================= */

function PublicOnlyRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
  } = useAuth();

  if (loading) {
    return (
      <LoadingScreen />
    );
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

  useEffect(() => {
    if (user) {
      syncPublicProfile(
        user
      );
    }
  }, [user]);

  const userName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Użytkownik";

  const avatarUrl =
    user?.user_metadata
      ?.avatar_url || "";

  const initial =
    userName
      .charAt(0)
      .toUpperCase();

  async function handleLogout() {
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

        <Link to="/applications">
          Zgłoszenia
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

  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const [mode, setMode] =
    useState("login");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (
      !authLoading &&
      isLoggedIn
    ) {
      navigate(
        "/account",
        {
          replace: true,
        }
      );
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  function switchToReset() {
    setMode("reset");
    setMessage("");
    setSuccess(false);
    setPassword("");
  }

  function switchToLogin() {
    setMode("login");
    setMessage("");
    setSuccess(false);
  }

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);
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

      navigate(
        "/account",
        {
          replace: true,
        }
      );
    } catch (error) {
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

  async function handlePasswordReset(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setMessage(
        "Wpisz adres e-mail."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        );

      if (error) {
        setMessage(
          `Nie udało się wysłać wiadomości: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Link do resetowania hasła został wysłany na podany adres e-mail."
      );
    } catch (error) {
      setMessage(
        `Nie udało się wysłać wiadomości: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  if (
    authLoading ||
    isLoggedIn
  ) {
    return (
      <LoadingScreen />
    );
  }

  if (mode === "reset") {
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
              Reset hasła
            </h1>

            <p>
              Podaj adres e-mail
              przypisany do Twojego
              konta. Wyślemy Ci link
              do ustawienia nowego
              hasła.
            </p>
          </div>

          <form
            className="auth-form"
            onSubmit={
              handlePasswordReset
            }
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
              disabled={
                loading
              }
            >
              {loading
                ? "Wysyłanie..."
                : "Wyślij link →"}
            </button>
          </form>

          <p className="auth-footer">
            Pamiętasz hasło?{" "}

            <button
              type="button"
              onClick={
                switchToLogin
              }
              className="auth-link-button"
            >
              Wróć do logowania
            </button>
          </p>
        </div>
      </div>
    );
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
            Zaloguj się do swojego
            konta IdeaHire.
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

          <div
            style={{
              display:
                "flex",
              justifyContent:
                "flex-end",
              marginTop:
                "-8px",
              marginBottom:
                "4px",
            }}
          >
            <button
              type="button"
              onClick={
                switchToReset
              }
              className="auth-link-button"
            >
              Nie pamiętasz hasła?
            </button>
          </div>

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
          Nie masz jeszcze
          konta?{" "}

          <Link to="/register">
            Utwórz konto
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

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    passwordAgain,
    setPasswordAgain,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

  async function handleUpdatePassword(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (
      password.length < 6
    ) {
      setMessage(
        "Hasło musi mieć co najmniej 6 znaków."
      );

      return;
    }

    if (
      password !==
      passwordAgain
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
        "Hasło zostało zmienione. Możesz teraz się zalogować."
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
            Nowe hasło
          </span>

          <h1>
            Ustaw nowe hasło
          </h1>

          <p>
            Wpisz nowe hasło do
            swojego konta.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={
            handleUpdatePassword
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
              placeholder="Wpisz nowe hasło"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          <label>
            Powtórz nowe hasło

            <input
              type="password"
              value={
                passwordAgain
              }
              onChange={(event) =>
                setPasswordAgain(
                  event.target.value
                )
              }
              placeholder="Wpisz hasło ponownie"
              autoComplete="new-password"
              minLength={6}
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
   REGISTER
========================================================= */

function Register() {
  const navigate =
    useNavigate();

  const {
    isLoggedIn,
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

  useEffect(() => {
    if (
      !authLoading &&
      isLoggedIn
    ) {
      navigate(
        "/account",
        {
          replace: true,
        }
      );
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
  ]);

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim();

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signUp(
          {
            email:
              cleanEmail,
            password,
            options: {
              data: {
                name:
                  cleanName,
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
        alert(
          "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres."
        );

        navigate(
          "/login",
          {
            replace: true,
          }
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

  if (
    authLoading ||
    isLoggedIn
  ) {
    return (
      <LoadingScreen />
    );
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
            Załóż konto i zacznij
            korzystać z IdeaHire.
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
        URL.createObjectURL(
          file
        );

      image.onload = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        const SIZE = 400;

        const sourceWidth =
          image.naturalWidth;

        const sourceHeight =
          image.naturalHeight;

        if (
          !sourceWidth ||
          !sourceHeight
        ) {
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
          (sourceWidth -
            sourceSize) /
          2;

        const sourceY =
          (sourceHeight -
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
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [name, setName] =
    useState("");

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    if (!user) return;

    setName(
      user.user_metadata?.name ||
        user.email?.split(
          "@"
        )[0] ||
        ""
    );

    setAvatarUrl(
      user.user_metadata
        ?.avatar_url || ""
    );
  }, [user]);

  if (authLoading) {
    return (
      <LoadingScreen />
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
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

      event.target.value =
        "";

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "Zdjęcie może mieć maksymalnie 10 MB."
      );

      event.target.value =
        "";

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
        error:
          uploadError,
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
          "Zdjęcie zostało przesłane, ale nie udało się pobrać adresu."
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
              name:
                cleanName,
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
        data.user
          .user_metadata
          ?.name ||
          cleanName
      );

      setAvatarUrl(
        data.user
          .user_metadata
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
    user.email?.split(
      "@"
    )[0] ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

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
            Zarządzaj swoim
            profilem IdeaHire.
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
                {user.email}
              </p>
            </div>
          </div>

          <form
            className="auth-form account-form"
            onSubmit={handleSave}
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
                Zdjęcie zostanie
                automatycznie
                przycięte do
                400 × 400 px.
              </small>
            </label>

            {uploading && (
              <div className="profile-upload-status">
                Przetwarzanie i
                zapisywanie
                zdjęcia...
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
                  user.email || ""
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

  const [
    category,
    setCategory,
  ] = useState(
    JOB_CATEGORIES[0]
  );

  const [budget, setBudget] =
    useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState(false);

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
      }, 900);
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
            Opisz projekt, wybierz
            kategorię i ustaw
            prosty budżet.
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
              Wpisz tylko cyfry,
              bez zł, spacji i kropek.
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
              Budżet ustalasz przy
              publikacji. Po
              opublikowaniu nie
              można go zmienić.
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

  const [applications, setApplications] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [openJobId, setOpenJobId] =
    useState(null);

  const [
    applyingJobId,
    setApplyingJobId,
  ] = useState(null);

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
        userIds.length > 0
      ) {
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
          profileData ||
          []
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
      }

      if (user?.id) {
        const {
          data:
            applicationData,
        } =
          await supabase
            .from(
              "job_applications"
            )
            .select(
              "id, job_id, applicant_id, status, created_at"
            )
            .eq(
              "applicant_id",
              user.id
            );

        const applicationMap =
          {};

        (
          applicationData ||
          []
        ).forEach(
          (application) => {
            applicationMap[
              application.job_id
            ] = application;
          }
        );

        setApplications(
          applicationMap
        );
      }
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
  }, [user?.id]);

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

  async function handleApply(
    job
  ) {
    if (!user?.id) {
      setMessage(
        "Musisz być zalogowany, aby zgłosić się do zlecenia."
      );

      return;
    }

    if (
      job.user_id ===
      user.id
    ) {
      setMessage(
        "Nie możesz zgłosić się do własnego zlecenia."
      );

      return;
    }

    if (
      applications[job.id]
    ) {
      setMessage(
        "Już zgłosiłeś się do tego zlecenia."
      );

      return;
    }

    setApplyingJobId(
      job.id
    );

    setMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .insert({
            job_id:
              job.id,
            applicant_id:
              user.id,
            status:
              "pending",
          })
          .select(
            "id, job_id, applicant_id, status, created_at"
          )
          .single();

      if (error) {
        if (
          error.code ===
          "23505"
        ) {
          setMessage(
            "Już zgłosiłeś się do tego zlecenia."
          );
        } else {
          setMessage(
            `Nie udało się wysłać zgłoszenia: ${error.message}`
          );
        }

        return;
      }

      setApplications(
        (current) => ({
          ...current,
          [job.id]:
            data,
        })
      );

      setMessage(
        "Zgłoszenie zostało wysłane. Zlecający otrzyma je do rozpatrzenia."
      );
    } catch (error) {
      setMessage(
        `Nie udało się wysłać zgłoszenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setApplyingJobId(
        null
      );
    }
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

    setMessage("");
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

    setMessage("");

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

    if (!confirmed)
      return;

    setDeletingJobId(
      job.id
    );

    setMessage("");

    try {
      const {
        error,
      } =
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

      if (
        openJobId ===
        job.id
      ) {
        setOpenJobId(null);
      }

      if (
        editingJobId ===
        job.id
      ) {
        cancelEditing();
      }

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
            Przeglądaj prawdziwe
            zlecenia opublikowane
            przez użytkowników
            IdeaHire.
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
          jobs.length === 0 && (
            <section className="account-card">
              <span className="section-label">
                Brak zleceń
              </span>

              <h2>
                Na razie nie ma
                żadnych zleceń.
              </h2>

              <p>
                Dodaj pierwsze
                zlecenie, aby
                pojawiło się tutaj
                dla innych
                użytkowników.
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

              const application =
                applications[
                  job.id
                ];

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
                      alignItems:
                        "flex-start",
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
                        "12px 0",
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
                      style={{
                        marginTop:
                          "20px",
                      }}
                    >
                      <label>
                        Nazwa zlecenia

                        <input
                          type="text"
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
                          required
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
                            marginBottom:
                              0,
                          }}
                        >
                          Budżet jest
                          ustalany
                          podczas
                          publikacji
                          i nie można
                          go później
                          zmienić.
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

                          <p
                            style={{
                              marginTop:
                                "12px",
                            }}
                          >
                            <small>
                              Budżet jest
                              ustalany
                              z góry i nie
                              może zostać
                              zmieniony po
                              publikacji.
                            </small>
                          </p>
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

                        {!isOwner && (
                          <button
                            className="btn btn-dark"
                            type="button"
                            onClick={() =>
                              handleApply(
                                job
                              )
                            }
                            disabled={
                              applyingJobId ===
                                job.id ||
                              !!application
                            }
                          >
                            {application
                              ? "Zgłoszenie wysłane ✓"
                              : applyingJobId ===
                                job.id
                              ? "Wysyłanie..."
                              : "Zgłoś się do zlecenia →"}
                          </button>
                        )}

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

                            <Link
                              className="btn btn-outline"
                              to="/applications"
                            >
                              Zobacz zgłoszenia
                            </Link>
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
   APPLICATIONS
   ZGŁOSZENIA DO TWOICH ZLECEŃ
========================================================= */

function Applications() {
  const { user } =
    useAuth();

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [
    processingId,
    setProcessingId,
  ] = useState(null);

  async function loadApplications() {
    if (!user?.id) return;

    setLoading(true);
    setMessage("");

    try {
      const {
        data: jobsData,
        error: jobsError,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, title, budget, user_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (jobsError) {
        throw jobsError;
      }

      const jobs =
        jobsData || [];

      if (jobs.length === 0) {
        setApplications([]);
        return;
      }

      const jobIds =
        jobs.map(
          (job) =>
            job.id
        );

      const {
        data:
          applicationData,
        error:
          applicationError,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .select(
            "id, job_id, applicant_id, status, created_at"
          )
          .in(
            "job_id",
            jobIds
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );

      if (applicationError) {
        throw applicationError;
      }

      const applicantIds = [
        ...new Set(
          (
            applicationData ||
            []
          )
            .map(
              (
                application
              ) =>
                application.applicant_id
            )
            .filter(Boolean)
        ),
      ];

      let profiles =
        {};

      if (
        applicantIds.length >
        0
      ) {
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
              applicantIds
            );

        (
          profileData ||
          []
        ).forEach(
          (profile) => {
            profiles[
              profile.user_id
            ] = profile;
          }
        );
      }

      const jobMap =
        {};

      jobs.forEach(
        (job) => {
          jobMap[
            job.id
          ] = job;
        }
      );

      const combined =
        (
          applicationData ||
          []
        ).map(
          (application) => ({
            ...application,
            job:
              jobMap[
                application.job_id
              ],
            applicant:
              profiles[
                application
                  .applicant_id
              ],
          })
        );

      setApplications(
        combined
      );
    } catch (error) {
      setMessage(
        `Nie udało się pobrać zgłoszeń: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, [user?.id]);

  function statusLabel(
    status
  ) {
    if (
      status ===
      "accepted"
    ) {
      return "Zaakceptowane";
    }

    if (
      status ===
      "rejected"
    ) {
      return "Odrzucone";
    }

    return "Oczekuje";
  }

  async function handleStatus(
    application,
    status
  ) {
    if (
      application.job
        ?.user_id !==
      user?.id
    ) {
      setMessage(
        "Nie masz uprawnień do zmiany tego zgłoszenia."
      );

      return;
    }

    setProcessingId(
      application.id
    );

    setMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .update({
            status,
          })
          .eq(
            "id",
            application.id
          )
          .select(
            "id, job_id, applicant_id, status, created_at"
          )
          .single();

      if (error) {
        throw error;
      }

      setApplications(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              application.id
                ? {
                    ...item,
                    ...data,
                  }
                : item
          )
      );

      if (
        status ===
        "accepted"
      ) {
        setMessage(
          "Wykonawca został zaakceptowany. To jest moment przejścia do kolejnego etapu współpracy."
        );
      } else {
        setMessage(
          "Zgłoszenie zostało odrzucone."
        );
      }
    } catch (error) {
      setMessage(
        `Nie udało się zmienić statusu zgłoszenia: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setProcessingId(
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
            Twoje zlecenia
          </span>

          <h1>
            Zgłoszenia wykonawców
          </h1>

          <p>
            Tutaj zobaczysz osoby,
            które zgłosiły się do
            Twoich zleceń.
          </p>
        </div>

        {message && (
          <p className="auth-message">
            {message}
          </p>
        )}

        {loading && (
          <p>
            Ładowanie zgłoszeń...
          </p>
        )}

        {!loading &&
          applications.length ===
            0 && (
            <section className="account-card">
              <span className="section-label">
                Brak zgłoszeń
              </span>

              <h2>
                Nikt jeszcze nie
                zgłosił się do
                Twoich zleceń.
              </h2>

              <p>
                Gdy wykonawca
                kliknie „Zgłoś się
                do zlecenia”, jego
                zgłoszenie pojawi się
                tutaj.
              </p>
            </section>
          )}

        <div className="jobs-list">
          {applications.map(
            (application) => {
              const applicant =
                application.applicant;

              const name =
                applicant?.name ||
                "Użytkownik";

              const initial =
                name
                  .charAt(0)
                  .toUpperCase();

              return (
                <article
                  className="job-card"
                  key={
                    application.id
                  }
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                    }}
                  >
                    <span className="account-mini-avatar">
                      {applicant?.avatar_url ? (
                        <img
                          src={
                            applicant.avatar_url
                          }
                          alt=""
                        />
                      ) : (
                        initial
                      )}
                    </span>

                    <div>
                      <strong>
                        {name}
                      </strong>

                      <p
                        style={{
                          margin:
                            "4px 0 0",
                        }}
                      >
                        <small>
                          Chce wykonać:
                        </small>
                      </p>
                    </div>
                  </div>

                  <h2
                    style={{
                      marginTop:
                        "16px",
                    }}
                  >
                    {
                      application.job
                        ?.title
                    }
                  </h2>

                  <p>
                    <strong>
                      Budżet:
                    </strong>{" "}
                    {Number(
                      application.job
                        ?.budget ||
                        0
                    ).toLocaleString(
                      "pl-PL"
                    )}{" "}
                    zł
                  </p>

                  <p>
                    <small>
                      Status:{" "}
                      {
                        statusLabel(
                          application.status
                        )
                      }
                    </small>
                  </p>

                  <Link
                    className="btn btn-outline"
                    to={`/profile/${application.applicant_id}`}
                  >
                    Zobacz profil wykonawcy →
                  </Link>

                  {application.status ===
                    "pending" && (
                    <div
                      style={{
                        display:
                          "flex",
                        gap: "10px",
                        flexWrap:
                          "wrap",
                        marginTop:
                          "14px",
                      }}
                    >
                      <button
                        className="btn btn-dark"
                        type="button"
                        disabled={
                          processingId ===
                          application.id
                        }
                        onClick={() =>
                          handleStatus(
                            application,
                            "accepted"
                          )
                        }
                      >
                        {processingId ===
                        application.id
                          ? "Zapisywanie..."
                          : "Zaakceptuj wykonawcę →"}
                      </button>

                      <button
                        className="btn btn-outline"
                        type="button"
                        disabled={
                          processingId ===
                          application.id
                        }
                        onClick={() =>
                          handleStatus(
                            application,
                            "rejected"
                          )
                        }
                      >
                        Odrzuć
                      </button>
                    </div>
                  )}

                  {application.status ===
                    "accepted" && (
                    <div
                      className="account-card"
                      style={{
                        marginTop:
                          "16px",
                        marginBottom:
                          0,
                      }}
                    >
                      <strong>
                        Wykonawca
                        zaakceptowany
                      </strong>

                      <p
                        style={{
                          marginBottom:
                            0,
                        }}
                      >
                        Kolejny etap to
                        ustalenie szczegółów
                        współpracy i
                        przejście do
                        realizacji zlecenia.
                      </p>
                    </div>
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

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
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
                "user_id, name, avatar_url, created_at"
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
          jobsResult.error
        ) {
          throw jobsResult.error;
        }

        if (!mounted)
          return;

        const profileData =
          profileResult.data;

        const jobData =
          jobsResult.data ||
          [];

        if (
          !profileData &&
          jobData.length ===
            0
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
          }
        );

        setJobs(
          jobData
        );
      } catch (error) {
        if (mounted) {
          setMessage(
            `Nie udało się pobrać profilu: ${
              error?.message ||
              "Nieznany błąd"
            }`
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (userId) {
      loadProfile();
    }

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

  if (loading) {
    return (
      <LoadingScreen />
    );
  }

  if (!profile) {
    return (
      <div className="page">
        <AccountNavbar />

        <main className="app-page">
          <p className="auth-error">
            {message ||
              "Nie znaleziono profilu."}
          </p>
        </main>
      </div>
    );
  }

  const displayName =
    profile.name ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  const isOwnProfile =
    currentUser?.id ===
    profile.user_id;

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <section className="account-card">
          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {profile.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt=""
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
              Ten użytkownik nie
              ma jeszcze
              opublikowanych
              zleceń.
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
                      Cena ustalona
                      przy publikacji.
                      {" "}
                      Opublikowano:{" "}
                      {formatDate(
                        job.created_at
                      )}
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
  const { loading } =
    useAuth();

  if (loading) {
    return (
      <LoadingScreen />
    );
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
            element={
              <Home />
            }
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
            path="/reset-password"
            element={
              <ResetPassword />
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
            path="/applications"
            element={
              <ProtectedRoute>
                <Applications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:userId"
            element={
              <ProtectedRoute>
                <PublicProfile />
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
