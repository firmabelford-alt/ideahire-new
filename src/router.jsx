/* IDEA HIRE — STRIPE CONNECT PANEL — BUILD 2026-09-05 */

import React, {
  useEffect,
  useState,
  useContext,
  createContext,
  useRef,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import App from "./App";
import CookiePolicy from "./CookiePolicy";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Sorts, {
  CountryPicker,
  CountryBadge,
  getCountryByCode,
  saveUserCountry,
  ApplicationActions,
} from "./Sorts";
import {
  passwordRecoveryRequested,
  supabase,
} from "./supabase";
import {
  getLoginErrorMessage,
  getPasswordRecoveryRedirectUrl,
  normalizeEmail,
} from "./auth";

/* =========================================================
   AUTH CONTEXT
========================================================= */

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function adoptSession(newSession) {
    setSession(newSession || null);
    setUser(newSession?.user || null);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    let subscription = null;
    let confirmedSession = false;
    let signedOut = false;
    let signedOutTimer = null;

    function applySession(newSession) {
      if (!mounted) return;

      if (newSession) {
        confirmedSession = true;
        signedOut = false;
      }

      adoptSession(newSession);
    }

    function wait(milliseconds) {
      return new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            milliseconds
          );
        }
      );
    }

    async function initializeAuth() {
      try {
        const {
          data: {
            subscription:
              authSubscription,
          },
        } =
          supabase.auth.onAuthStateChange(
            (event, newSession) => {
              if (!mounted) return;

              /*
               * INITIAL_SESSION z prawidłową sesją przyjmujemy od razu.
               * Chwilowego null nie traktujemy jako wylogowania, dopóki
               * initializeAuth nie zakończy bezpiecznych ponownych prób.
               */
              if (
                event ===
                "INITIAL_SESSION"
              ) {
                if (newSession) {
                  applySession(
                    newSession
                  );
                }

                return;
              }

              if (
                event === "SIGNED_OUT"
              ) {
                signedOut = true;
                confirmedSession = false;

                /*
                 * Nie przekierowujemy w tej samej milisekundzie. Najpierw
                 * sprawdzamy, czy zdarzenie nie było chwilowym efektem
                 * synchronizacji karty lub odświeżania tokenu.
                 */
                setLoading(true);

                if (signedOutTimer) {
                  window.clearTimeout(
                    signedOutTimer
                  );
                }

                signedOutTimer =
                  window.setTimeout(
                    async () => {
                      try {
                        const {
                          data,
                          error,
                        } =
                          await supabase.auth.getSession();

                        if (!mounted) return;

                        if (error) {
                          console.error(
                            "AUTH SIGN OUT CHECK ERROR:",
                            error
                          );
                        }

                        if (data?.session) {
                          applySession(
                            data.session
                          );
                          return;
                        }
                      } catch (error) {
                        console.error(
                          "AUTH SIGN OUT CHECK ERROR:",
                          error
                        );
                      }

                      if (mounted) {
                        adoptSession(null);
                      }
                    },
                    240
                  );

                return;
              }

              if (newSession) {
                applySession(
                  newSession
                );
              }
            }
          );

        subscription =
          authSubscription;

        /*
         * Na części urządzeń zapis sesji w localStorage może być przez
         * moment niedostępny po przeładowaniu karty. Nie przekierowujemy
         * wtedy od razu do logowania — wykonujemy kilka krótkich odczytów.
         */
        const retryDelays = [
          0,
          180,
          520,
        ];

        for (
          let attempt = 0;
          attempt <
          retryDelays.length;
          attempt += 1
        ) {
          if (
            !mounted ||
            confirmedSession ||
            signedOut
          ) {
            return;
          }

          if (
            retryDelays[attempt] > 0
          ) {
            await wait(
              retryDelays[attempt]
            );
          }

          if (
            !mounted ||
            confirmedSession ||
            signedOut
          ) {
            return;
          }

          const { data, error } =
            await supabase.auth.getSession();

          if (error) {
            console.error(
              "AUTH SESSION ERROR:",
              error
            );
          }

          if (data?.session) {
            applySession(
              data.session
            );
            return;
          }
        }

        if (
          mounted &&
          !confirmedSession &&
          !signedOut
        ) {
          applySession(null);
        }
      } catch (error) {
        console.error(
          "AUTH ERROR:",
          error
        );

        if (!mounted) return;

        setSession(null);
        setUser(null);
        setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      mounted = false;

      if (signedOutTimer) {
        window.clearTimeout(
          signedOutTimer
        );
      }

      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const accessToken =
      session?.access_token;

    const currentUserId =
      user?.id;

    if (
      !accessToken ||
      !currentUserId
    ) {
      return undefined;
    }

    let mounted = true;

    async function synchronizeErasureState() {
      try {
        const [
          freshUserResult,
          lifecycleResult,
        ] = await Promise.all([
          supabase.auth.getUser(
            accessToken
          ),
          supabase
            .from(
              "ideahire_account_lifecycle"
            )
            .select(
              "status, data_minimized_at, closed_at"
            )
            .eq(
              "user_id",
              currentUserId
            )
            .maybeSingle(),
        ]);

        if (!mounted) return;

        const freshUser =
          freshUserResult
            ?.data?.user;

        if (
          freshUser?.id ===
          currentUserId
        ) {
          /*
           * getSession może zawierać starszą kopię user_metadata.
           * getUser pobiera bieżący rekord z Auth, dlatego usunięty
           * avatar nie wraca z lokalnie zapisanego tokenu.
           */
          setUser(freshUser);
        }

        if (
          lifecycleResult.error ||
          !lifecycleResult.data
        ) {
          if (lifecycleResult.error) {
            console.error(
              "ERASURE LIFECYCLE SYNC ERROR:",
              lifecycleResult.error
            );
          }

          return;
        }

        const minimizedAt =
          lifecycleResult.data
            .data_minimized_at || "";

        if (!minimizedAt) return;

        const cleanupMarkerKey =
          `ideahire_erasure_local_cleanup_${currentUserId}`;

        if (
          localStorage.getItem(
            cleanupMarkerKey
          ) === minimizedAt
        ) {
          return;
        }

        [
          `ideahire_notifications_${currentUserId}`,
          `ideahire_read_notifications_${currentUserId}`,
          `ideahire_dismissed_notifications_${currentUserId}`,
        ].forEach((key) => {
          localStorage.removeItem(key);
        });

        localStorage.setItem(
          cleanupMarkerKey,
          minimizedAt
        );
      } catch (error) {
        console.error(
          "ERASURE SESSION SYNC ERROR:",
          error
        );
      }
    }

    synchronizeErasureState();

    return () => {
      mounted = false;
    };
  }, [
    session?.access_token,
    user?.id,
  ]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        adoptSession,
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
   ACCOUNT RESTRICTION CONTEXT
========================================================= */

const AccountRestrictionContext = createContext(null);
const ACCOUNT_RESTRICTION_STATUS_RPC =
  "get_my_ideahire_moderation_status_stable";

function AccountRestrictionProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [notice, setNotice] = useState(null);
  const [appeal, setAppeal] = useState(null);
  const [restricted, setRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const activeRestrictionUserIdRef = useRef(user?.id || null);
  const restrictionRequestIdRef = useRef(0);
  const restrictionRefreshTimerRef = useRef(null);
  const restrictionSnapshotRef = useRef("");

  async function loadRestriction(
    requestedUserId = user?.id,
    showLoading = false
  ) {
    const requestId = restrictionRequestIdRef.current + 1;
    restrictionRequestIdRef.current = requestId;

    if (!requestedUserId) {
      setNotice(null);
      setAppeal(null);
      setRestricted(false);
      setErrorMessage("");
      restrictionSnapshotRef.current = "";
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
      setErrorMessage("");
    }

    try {
      const { data, error } = await supabase.rpc(
        ACCOUNT_RESTRICTION_STATUS_RPC
      );

      if (error) throw error;
      if (
        requestedUserId !== activeRestrictionUserIdRef.current
        || requestId !== restrictionRequestIdRef.current
      ) {
        return;
      }

      const nextNotice = data?.notice || null;
      const nextAppeal = data?.appeal || null;
      const nextRestricted = Boolean(data?.restricted);
      const nextSnapshot = JSON.stringify({
        notice: nextNotice,
        appeal: nextAppeal,
        restricted: nextRestricted,
      });

      // Kilka zdarzeń tej samej transakcji nie może powodować kilku
      // identycznych renderów ekranu statusu.
      if (nextSnapshot !== restrictionSnapshotRef.current) {
        restrictionSnapshotRef.current = nextSnapshot;
        setNotice(nextNotice);
        setAppeal(nextAppeal);
        setRestricted(nextRestricted);
      }
      setErrorMessage("");
    } catch (error) {
      console.error("ACCOUNT RESTRICTION LOAD ERROR:", error);
      if (
        requestedUserId !== activeRestrictionUserIdRef.current
        || requestId !== restrictionRequestIdRef.current
      ) {
        return;
      }

      setErrorMessage(
        "Nie udało się bezpiecznie potwierdzić statusu konta. Odśwież stronę albo spróbuj ponownie za chwilę."
      );

      // Przy pierwszym odczycie czyścimy niepotwierdzony stan, ale router
      // nadal pozostaje w bezpiecznym centrum statusu. Odświeżenie Realtime
      // zachowuje ostatni poprawny wynik, aby błąd sieci nie odblokował konta.
      if (showLoading) {
        restrictionSnapshotRef.current = "";
        setNotice(null);
        setAppeal(null);
        setRestricted(false);
      }
    } finally {
      if (
        requestedUserId === activeRestrictionUserIdRef.current
        && requestId === restrictionRequestIdRef.current
      ) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (authLoading) return;

    const nextUserId = user?.id || null;
    activeRestrictionUserIdRef.current = nextUserId;
    setNotice(null);
    setAppeal(null);
    setRestricted(false);
    setErrorMessage("");
    restrictionSnapshotRef.current = "";
    loadRestriction(nextUserId, true);
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Jedna transakcja administracyjna może wysłać kilka zdarzeń Realtime.
    // Łączymy je w jeden cichy odczyt, aby nie uruchamiać serii renderów.
    const refresh = () => {
      if (restrictionRefreshTimerRef.current) {
        window.clearTimeout(restrictionRefreshTimerRef.current);
      }

      restrictionRefreshTimerRef.current = window.setTimeout(() => {
        restrictionRefreshTimerRef.current = null;
        loadRestriction(user.id, false);
      }, 180);
    };
    const channel = supabase
      .channel(`account-restriction-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_moderation_notices",
          filter: `target_user_id=eq.${user.id}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_moderation_appeals",
          filter: `target_user_id=eq.${user.id}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      if (restrictionRefreshTimerRef.current) {
        window.clearTimeout(restrictionRefreshTimerRef.current);
        restrictionRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !restricted || !notice?.ends_at) return;

    const endsAt = new Date(notice.ends_at).getTime();
    if (Number.isNaN(endsAt)) return;

    const maximumTimerDelay = 2147480000;
    let timerId;

    function scheduleExpiryRefresh() {
      const remaining = endsAt - Date.now();

      if (remaining <= 0) {
        timerId = window.setTimeout(
          () => loadRestriction(user.id, false),
          1000
        );
        return;
      }

      const delay = Math.min(remaining + 1000, maximumTimerDelay);
      timerId = window.setTimeout(() => {
        if (Date.now() < endsAt) {
          scheduleExpiryRefresh();
          return;
        }

        loadRestriction(user.id, false);
      }, delay);
    }

    scheduleExpiryRefresh();

    return () => {
      window.clearTimeout(timerId);
    };
  }, [user?.id, restricted, notice?.ends_at]);

  return (
    <AccountRestrictionContext.Provider
      value={{
        notice,
        appeal,
        isRestricted: restricted,
        loading: authLoading || loading,
        errorMessage,
        refreshRestriction: loadRestriction,
      }}
    >
      {children}
    </AccountRestrictionContext.Provider>
  );
}

function useAccountRestriction() {
  return useContext(AccountRestrictionContext) || {
    notice: null,
    appeal: null,
    isRestricted: false,
    loading: true,
    errorMessage: "",
    refreshRestriction: async () => {},
  };
}

/* =========================================================
   AGE ACCESS
========================================================= */

const MIN_ACCOUNT_AGE = 16;
const FULL_ACCOUNT_AGE = 18;
const AGE_NOTICE_VERSION = "2026-09-03-v1";
const LEGAL_TERMS_VERSION = "0.9-prelaunch-2026-09-06";
const PRIVACY_NOTICE_VERSION = "0.9-prelaunch-2026-09-06";

const AgeAccessContext = createContext(null);

function parseDateOnly(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day, date };
}

function getAgeAnniversary(birthDate, age) {
  const parsed = parseDateOnly(birthDate);

  if (!parsed) return null;

  const anniversary = new Date(
    parsed.year + age,
    parsed.month - 1,
    parsed.day
  );

  if (anniversary.getMonth() !== parsed.month - 1) {
    anniversary.setDate(0);
  }

  anniversary.setHours(0, 0, 0, 0);
  return anniversary;
}

function hasReachedAge(birthDate, age) {
  const anniversary = getAgeAnniversary(birthDate, age);

  if (!anniversary) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= anniversary;
}

function getDateInputBoundary(yearsAgo = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setFullYear(date.getFullYear() - yearsAgo);

  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getBirthDateValidation(birthDate) {
  const parsed = parseDateOnly(birthDate);

  if (!parsed) {
    return {
      valid: false,
      code: "invalid",
      message: "Wpisz prawidłową datę urodzenia.",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const oldestAllowed = new Date(today);
  oldestAllowed.setFullYear(today.getFullYear() - 120);

  if (parsed.date > today || parsed.date < oldestAllowed) {
    return {
      valid: false,
      code: "invalid",
      message: "Wpisz prawidłową datę urodzenia.",
    };
  }

  if (!hasReachedAge(birthDate, MIN_ACCOUNT_AGE)) {
    return {
      valid: false,
      code: "under_16",
      message: "Konto IdeaHire można utworzyć po ukończeniu 16 lat.",
    };
  }

  if (!hasReachedAge(birthDate, FULL_ACCOUNT_AGE)) {
    return {
      valid: true,
      code: "minor_limited",
      message: "Utworzysz konto ograniczone. Pełne funkcje zostaną udostępnione po ukończeniu 18 lat.",
    };
  }

  return {
    valid: true,
    code: "adult",
    message: "Spełniasz wymaganie wieku dla pełnego konta IdeaHire.",
  };
}

function AgeAccessProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const activeUserIdRef = useRef(user?.id || null);

  async function loadAgeAccess(requestedUserId = user?.id) {
    if (!requestedUserId) {
      setDateOfBirth("");
      setResolvedUserId(null);
      setErrorMessage("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("ideahire_age_profiles")
        .select("date_of_birth")
        .eq("user_id", requestedUserId)
        .maybeSingle();

      if (error) throw error;

      if (activeUserIdRef.current !== requestedUserId) return;

      setDateOfBirth(data?.date_of_birth || "");
      setResolvedUserId(requestedUserId);
    } catch (error) {
      if (activeUserIdRef.current !== requestedUserId) return;

      console.error("AGE ACCESS LOAD ERROR:", error);
      setDateOfBirth("");
      setResolvedUserId(requestedUserId);
      setErrorMessage(
        "Nie udało się sprawdzić uprawnień wiekowych konta."
      );
    } finally {
      if (activeUserIdRef.current === requestedUserId) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (authLoading) return;

    const nextUserId = user?.id || null;
    activeUserIdRef.current = nextUserId;

    if (nextUserId !== resolvedUserId) {
      setDateOfBirth("");
      setErrorMessage("");
    }

    loadAgeAccess(nextUserId);
  }, [authLoading, user?.id]);

  const validation = dateOfBirth
    ? getBirthDateValidation(dateOfBirth)
    : null;

  const ageRequired = Boolean(user?.id && !dateOfBirth);
  const isLimited = validation?.code === "minor_limited";
  const isAdult = validation?.code === "adult";

  return (
    <AgeAccessContext.Provider
      value={{
        dateOfBirth,
        status: validation?.code || (ageRequired ? "age_required" : "unknown"),
        ageRequired,
        isLimited,
        isAdult,
        canTransact: isAdult,
        loading:
          authLoading ||
          loading ||
          Boolean(user?.id && resolvedUserId !== user.id),
        errorMessage,
        refreshAgeAccess: loadAgeAccess,
      }}
    >
      {children}
    </AgeAccessContext.Provider>
  );
}

function useAgeAccess() {
  return useContext(AgeAccessContext) || {
    dateOfBirth: "",
    status: "unknown",
    ageRequired: false,
    isLimited: false,
    isAdult: false,
    canTransact: false,
    loading: true,
    errorMessage: "",
    refreshAgeAccess: async () => {},
  };
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
   PUBLIC ONLY
========================================================= */

function PublicOnlyRoute({
  children,
}) {
  const {
    loading,
    isLoggedIn,
    user,
  } = useAuth();

  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  const {
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();

  if (
    loading ||
    (isLoggedIn && (staffLoading || restrictionLoading))
  ) {
    return <LoadingScreen />;
  }

  if (isLoggedIn) {
    return (
      <Navigate
        to={
          isStaff
            ? "/admin"
            : isRestricted || restrictionError
              ? "/account-status"
            : "/account"
        }
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ACCOUNT MODE ROUTES
========================================================= */

function UserOnlyRoute({
  children,
  allowLimited = false,
  allowRestricted = false,
}) {
  const { user } = useAuth();
  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);
  const {
    ageRequired,
    isLimited,
    loading: ageLoading,
  } = useAgeAccess();

  const {
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();

  if (staffLoading || restrictionLoading) {
    return <LoadingScreen />;
  }

  if (isStaff) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (restrictionError) {
    if (!allowRestricted) {
      return (
        <Navigate
          to="/account-status"
          replace
        />
      );
    }

    return children;
  }

  if (isRestricted) {
    if (!allowRestricted) {
      return (
        <Navigate
          to="/account-status"
          replace
        />
      );
    }

    // Status bana i centrum prywatności nie zależą od odczytu wieku.
    // Zapobiega to zmianie całego widoku, gdy niezależny profil wieku się odświeża.
    return children;
  }

  if (ageLoading) {
    return <LoadingScreen />;
  }

  if (ageRequired) {
    return <AgeCompletionScreen />;
  }

  if (isLimited && !allowLimited) {
    return (
      <Navigate
        to="/account"
        replace
        state={{ ageRestricted: true }}
      />
    );
  }

  return children;
}

function RestrictedAccountRoute({ children }) {
  const { user } = useAuth();
  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);
  const {
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();

  if (staffLoading || restrictionLoading) {
    return <LoadingScreen />;
  }

  if (!isStaff && (isRestricted || restrictionError)) {
    return <Navigate to="/account-status" replace />;
  }

  return children;
}

function AgeCompletionScreen() {
  const { refreshAgeAccess, errorMessage } = useAgeAccess();
  const [birthDate, setBirthDate] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const validation = birthDate
    ? getBirthDateValidation(birthDate)
    : null;

  async function handleCompleteAge(event) {
    event.preventDefault();

    if (saving) return;

    if (!validation?.valid) {
      setMessage(
        validation?.message || "Wpisz prawidłową datę urodzenia."
      );
      return;
    }

    if (!acknowledged) {
      setMessage("Potwierdź prawidłowość podanej daty urodzenia.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "complete_ideahire_age_profile",
        {
          p_date_of_birth: birthDate,
          p_age_notice_acknowledged: acknowledged,
        }
      );

      if (error) throw error;
      await refreshAgeAccess();
    } catch (error) {
      setMessage(
        error?.message || "Nie udało się zapisać daty urodzenia."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page age-access-page">
      <AccountNavbar />

      <main className="age-access-shell">
        <section className="age-access-card">
          <span className="section-label">Bezpieczeństwo konta</span>
          <h1>Uzupełnij datę urodzenia</h1>
          <p>
            Potrzebujemy jej wyłącznie do przyznania właściwych uprawnień
            konta. Data nie będzie widoczna na Twoim profilu.
          </p>

          <form className="age-access-form" onSubmit={handleCompleteAge}>
            <label>
              Data urodzenia
              <input
                type="date"
                value={birthDate}
                min={getDateInputBoundary(120)}
                max={getDateInputBoundary()}
                onChange={(event) => {
                  setBirthDate(event.target.value);
                  setMessage("");
                }}
                autoComplete="bday"
                required
              />
            </label>

            {validation && (
              <div
                className={`age-access-result is-${validation.code}`}
                role="status"
              >
                <strong>
                  {validation.code === "adult"
                    ? "Pełne konto 18+"
                    : validation.code === "minor_limited"
                    ? "Konto ograniczone 16–17"
                    : "Konto niedostępne"}
                </strong>
                <span>{validation.message}</span>
              </div>
            )}

            <label className="age-access-confirmation">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(event) => {
                  setAcknowledged(event.target.checked);
                  setMessage("");
                }}
                required
              />
              <span>
                <strong>Potwierdzam prawidłowość daty urodzenia.</strong>
                <small>
                  Po zapisaniu samodzielna zmiana daty nie będzie możliwa.
                </small>
              </span>
            </label>

            {(message || errorMessage) && (
              <p className="auth-error" role="alert">
                {message || errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-dark btn-large"
              disabled={saving || !validation?.valid || !acknowledged}
            >
              {saving ? "Zapisywanie..." : "Zapisz i kontynuuj →"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function StaffOnlyRoute({ children }) {
  const { user } = useAuth();
  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  if (staffLoading) {
    return <LoadingScreen />;
  }

  if (!isStaff) {
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

const MAX_JOB_BUDGET = 15000;

const MAX_JOB_BUDGET_MESSAGE =
  "Nie możesz wpisać wyższej ceny. Maksymalny budżet jednego zlecenia to 15 000 zł.";

const DISPUTE_STATUS_LABELS = {
  awaiting_response: "Oczekiwanie na odpowiedź",
  evidence_collection: "Zbieranie wyjaśnień",
  under_review: "Analiza administratora",
  decision_issued: "Decyzja wydana",
  appealed: "Odwołanie w toku",
  closed: "Sprawa zamknięta",
  cancelled: "Sprawa wycofana",
};

const DISPUTE_REASON_OPTIONS = [
  ["work_not_delivered", "Praca nie została dostarczona"],
  ["work_incomplete", "Praca jest niekompletna"],
  ["quality_issue", "Jakość nie odpowiada ustaleniom"],
  ["deadline_missed", "Nie dotrzymano terminu"],
  ["requirements_dispute", "Spór dotyczący zakresu prac"],
  ["communication_problem", "Problem z komunikacją"],
  ["cancellation", "Anulowanie współpracy"],
  ["payment_issue", "Problem dotyczący płatności"],
  ["other", "Inny powód"],
];

const DISPUTE_OUTCOME_OPTIONS = [
  ["complete_or_correct_work", "Dokończenie lub poprawienie pracy"],
  ["extend_deadline", "Ustalenie nowego terminu"],
  ["cancel_cooperation", "Anulowanie współpracy"],
  ["full_refund", "Pełny zwrot środków"],
  ["partial_refund", "Częściowy zwrot środków"],
  ["release_payment", "Przekazanie płatności wykonawcy"],
  ["other", "Inne rozwiązanie"],
];

const ADMIN_DECISION_OPTIONS = [
  ["work_continue", "Kontynuacja lub poprawienie pracy"],
  ["deadline_extension", "Przedłużenie terminu"],
  ["cancel_no_refund", "Anulowanie bez zwrotu"],
  ["full_refund", "Pełny zwrot"],
  ["partial_refund", "Częściowy zwrot"],
  ["release_payment", "Przekazanie płatności wykonawcy"],
  ["no_action", "Brak dodatkowych działań"],
  ["other", "Inna decyzja"],
];

const PRIVACY_REQUEST_TYPES = [
  ["access", "Dostęp do danych"],
  ["copy", "Kopia przetwarzanych danych"],
  ["rectification", "Sprostowanie danych"],
  ["erasure", "Usunięcie danych lub konta"],
  ["restriction", "Ograniczenie przetwarzania"],
  ["objection", "Sprzeciw wobec przetwarzania"],
  ["portability", "Przeniesienie danych"],
  ["security_review", "Analiza ochrony moich danych"],
  ["other", "Inna sprawa dotycząca prywatności"],
];

const PRIVACY_REQUEST_STATUSES = {
  submitted: "Otrzymany",
  identity_verification: "Weryfikacja tożsamości",
  in_progress: "W realizacji",
  awaiting_user: "Oczekiwanie na odpowiedź użytkownika",
  completed: "Zrealizowany",
  partially_completed: "Zrealizowany częściowo",
  rejected: "Odmowa realizacji",
  withdrawn: "Wycofany",
};

const PRIVACY_RESPONSE_FORMATS = [
  ["electronic", "Odpowiedź elektroniczna"],
  ["json", "Dane w formacie JSON"],
  ["csv", "Dane tabelaryczne CSV"],
  ["pdf", "Dokument PDF"],
];

const PRIVACY_AUDIT_STATUSES = {
  not_started: "Oczekuje na rozpoczęcie",
  in_review: "Analiza w toku",
  remediation_required: "Wymaga działań naprawczych",
  ready_for_approval: "Oczekuje na zatwierdzenie",
  approved: "Zatwierdzona",
};

const PRIVACY_AUDIT_RISK_LEVELS = [
  ["not_assessed", "Jeszcze nie oceniono"],
  ["low", "Niskie"],
  ["medium", "Średnie"],
  ["high", "Wysokie"],
  ["critical", "Krytyczne"],
];

const PRIVACY_AUDIT_CHECKS = [
  {
    key: "identity_and_scope",
    label: "Tożsamość i zakres",
    description: "Potwierdzenie osoby składającej wniosek i dokładnego zakresu analizy.",
  },
  {
    key: "data_inventory",
    label: "Inwentaryzacja danych",
    description: "Ustalenie kategorii danych i miejsc, w których są przetwarzane.",
  },
  {
    key: "access_control",
    label: "Kontrola dostępu",
    description: "Ocena uprawnień użytkowników, administratorów i usług technicznych.",
  },
  {
    key: "rls_and_api",
    label: "RLS i dostęp przez API",
    description: "Sprawdzenie reguł dostępu do rekordów oraz wywołań funkcji bazy.",
  },
  {
    key: "storage_security",
    label: "Bezpieczeństwo przechowywania",
    description: "Ocena ochrony bazy, plików, kopii oraz transmisji danych.",
  },
  {
    key: "purpose_and_legal_basis",
    label: "Cel i podstawa przetwarzania",
    description: "Przypisanie danych do deklarowanych celów i podstaw przetwarzania.",
  },
  {
    key: "data_minimization",
    label: "Minimalizacja danych",
    description: "Ocena, czy system nie zbiera danych szerszych niż potrzebne.",
  },
  {
    key: "retention_and_deletion",
    label: "Retencja i usuwanie",
    description: "Sprawdzenie okresów przechowywania i możliwości bezpiecznego usunięcia.",
  },
  {
    key: "processors_and_transfers",
    label: "Podmioty i transfery",
    description: "Ustalenie usług zewnętrznych oraz przepływów danych między systemami.",
  },
  {
    key: "incident_history",
    label: "Historia incydentów",
    description: "Sprawdzenie zgłoszonych naruszeń i zdarzeń związanych z bezpieczeństwem.",
  },
  {
    key: "user_rights",
    label: "Realizacja praw użytkownika",
    description: "Ocena możliwości dostępu, sprostowania, usunięcia i innych praw.",
  },
  {
    key: "remediation_plan",
    label: "Plan działań naprawczych",
    description: "Określenie działań, odpowiedzialności i dalszej kontroli wykrytych problemów.",
  },
];

const PRIVACY_AUDIT_CHECK_STATUSES = [
  ["pending", "Do sprawdzenia"],
  ["passed", "Sprawdzone — bez zastrzeżeń"],
  ["issue_found", "Wykryto problem"],
  ["not_applicable", "Nie dotyczy"],
];

const PRIVACY_AUDIT_EVENT_LABELS = {
  created: "Utworzono kartę analizy",
  draft_saved: "Zapisano roboczą analizę",
  submitted_for_approval: "Przekazano do zatwierdzenia",
  returned_for_revision: "Odesłano do poprawy",
  approved: "Zatwierdzono analizę",
};

const MODERATION_REASON_LABELS = {
  fraud_or_scam: "Podejrzenie oszustwa lub wyłudzenia",
  account_security: "Zagrożenie bezpieczeństwa konta lub serwisu",
  harassment_or_threats: "Nękanie, groźby lub poważne naruszenie bezpieczeństwa",
  illegal_content: "Treść potencjalnie niezgodna z prawem",
  payment_abuse: "Nadużycie związane z płatnością lub rozliczeniem",
  impersonation: "Podszywanie się pod inną osobę lub podmiot",
  repeated_terms_breach: "Powtarzające się naruszenia regulaminu",
  other_terms_breach: "Inne udokumentowane naruszenie regulaminu",
};

const MODERATION_DECISION_LABELS = {
  temporary_suspension: "Czasowe zawieszenie konta",
  indefinite_suspension: "Bezterminowe zawieszenie konta",
};

const MODERATION_STATUS_LABELS = {
  scheduled: "Zaplanowana",
  active: "Aktywna",
  lifted: "Zdjęta",
  expired: "Wygasła",
  cancelled: "Anulowana",
};

const MODERATION_APPEAL_STATUS_LABELS = {
  submitted: "Oczekuje na rozpoznanie",
  in_review: "W analizie",
  accepted: "Uwzględnione",
  rejected: "Oddalone",
  withdrawn: "Wycofane",
};

const MODERATION_EXCEPTION_OPTIONS = [
  ["legal_obligation", "Obowiązek prawny wymagający natychmiastowej reakcji"],
  ["overriding_legal_reason", "Nadrzędny powód wynikający z prawa"],
  ["repeated_terms_breach", "Wykazane powtarzające się naruszenia regulaminu"],
  ["urgent_fraud_or_security_risk", "Pilne ryzyko oszustwa lub bezpieczeństwa"],
];

const MODERATION_DURATION_PRESETS = [1, 3, 7, 14, 30];

const MODERATION_CONFIRMED_TERMS_REFERENCES = {
  repeated_terms_breach: "Regulamin IdeaHire § 27 pkt 107",
};

const MODERATION_REASON_GUIDANCE = {
  fraud_or_scam:
    "Wskaż konkretne zachowanie, identyfikator zlecenia lub wiadomości oraz przesłanki wskazujące na próbę oszustwa. Nie przesądzaj o przestępstwie bez podstaw.",
  account_security:
    "Opisz konkretne zagrożenie techniczne, przejęcie konta albo ryzyko dla innych użytkowników oraz pilność działania.",
  harassment_or_threats:
    "Opisz treść i kontekst zachowania bez ujawniania użytkownikowi danych osoby zgłaszającej, jeśli nie jest to bezwzględnie konieczne.",
  illegal_content:
    "Wskaż konkretną treść i właściwy przepis. Jeżeli nielegalność nie jest oczywista, przekaż sprawę do konsultacji prawnej.",
  payment_abuse:
    "Wskaż transakcję lub próbę obejścia rozliczenia oraz sprawdzone fakty. Nie zapisuj pełnych danych karty ani danych zbędnych.",
  impersonation:
    "Opisz, kogo konto miało naśladować i jakie elementy zostały zweryfikowane. Zachowaj tylko niezbędny materiał dowodowy.",
  repeated_terms_breach:
    "Wymień wcześniejsze udokumentowane naruszenia i daty. Ten powód nie może opierać się na pojedynczym zdarzeniu.",
  other_terms_breach:
    "Opisz konkretną treść lub zachowanie oraz dokładnie wskaż naruszony punkt regulaminu.",
};

function createEmptyDisputeDecisionForm() {
  return {
    outcome: "",
    amount: "",
    rationale: "",
    applyRestriction: false,
    moderationTargetUserId: "",
    durationDays: "7",
    reasonCode: "repeated_terms_breach",
    publicReason: "",
    termsReference:
      MODERATION_CONFIRMED_TERMS_REFERENCES.repeated_terms_breach,
    legalBasis: "",
    internalNote: "",
  };
}

function getDisputeStatusLabel(status) {
  return DISPUTE_STATUS_LABELS[status] || "Nieznany status";
}

function getOptionLabel(options, value) {
  return options.find(([key]) => key === value)?.[1] || value || "—";
}

function formatDisputeNumber(caseNumber) {
  return `IH-${String(caseNumber || 0).padStart(8, "0")}`;
}

function formatDisputeDate(value, includeTime = true) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  });
}

function formatPolishDays(value) {
  const days = Math.max(0, Math.trunc(Number(value) || 0));
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (days === 1) return "1 dzień";
  if (
    lastDigit >= 2
    && lastDigit <= 4
    && (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${days} dni`;
  }

  return `${days} dni`;
}

function getModerationDurationDetails(notice) {
  if (!notice) return null;

  if (
    notice.decision_type === "indefinite_suspension"
    || !notice.ends_at
  ) {
    return {
      headline: "Zawieszenie bezterminowe",
      detail: notice.status === "lifted"
        ? "Ograniczenie zostało zdjęte przez administrację."
        : "Decyzja nie ma automatycznej daty zakończenia.",
    };
  }

  const effectiveAt = new Date(notice.effective_at).getTime();
  const endsAt = new Date(notice.ends_at).getTime();

  if (!Number.isFinite(effectiveAt) || !Number.isFinite(endsAt)) {
    return {
      headline: "Zawieszenie czasowe",
      detail: `Koniec: ${formatDisputeDate(notice.ends_at)}.`,
    };
  }

  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  const totalDays = Math.max(
    1,
    Math.round((endsAt - effectiveAt) / dayInMilliseconds)
  );
  const remainingDays = Math.max(
    0,
    Math.ceil((endsAt - Date.now()) / dayInMilliseconds)
  );

  if (["lifted", "cancelled"].includes(notice.status)) {
    return {
      headline: `Zawieszenie było na ${formatPolishDays(totalDays)}`,
      detail: "Ograniczenie zakończono przed pierwotnym terminem.",
    };
  }

  if (notice.status === "expired" || remainingDays === 0) {
    return {
      headline: `Zawieszenie było na ${formatPolishDays(totalDays)}`,
      detail: `Okres zawieszenia zakończył się ${formatDisputeDate(notice.ends_at)}.`,
    };
  }

  if (notice.status === "scheduled") {
    return {
      headline: `Zawieszenie na ${formatPolishDays(totalDays)}`,
      detail: `Rozpocznie się ${formatDisputeDate(notice.effective_at)} i zakończy ${formatDisputeDate(notice.ends_at)}.`,
    };
  }

  return {
    headline: `Zawieszenie na ${formatPolishDays(totalDays)}`,
    detail: `Pozostało ${formatPolishDays(remainingDays)}. Automatyczne odblokowanie: ${formatDisputeDate(notice.ends_at)}.`,
  };
}

function cleanSupabaseError(error, fallback) {
  return error?.message || fallback;
}

function useStaffRole(userId) {
  const [staffRole, setStaffRole] = useState(null);
  const [staffLoading, setStaffLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setStaffRole(null);
      setStaffLoading(false);
      return;
    }

    let mounted = true;

    async function loadStaffRole() {
      setStaffLoading(true);

      const { data, error } = await supabase
        .from("ideahire_staff")
        .select("role, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("STAFF ROLE ERROR:", error);
        setStaffRole(null);
      } else {
        setStaffRole(data?.role || null);
      }

      setStaffLoading(false);
    }

    loadStaffRole();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return {
    staffRole,
    staffLoading,
    isStaff: staffRole === "owner" || staffRole === "admin",
    isOwner: staffRole === "owner",
  };
}

function getStoredNotificationIds(
  key
) {
  try {
    const value = JSON.parse(
      localStorage.getItem(key) ||
        "[]"
    );

    return Array.isArray(value)
      ? value.filter(
          (item) =>
            typeof item ===
            "string"
        )
      : [];
  } catch {
    return [];
  }
}

function saveNotificationIds(
  key,
  ids
) {
  localStorage.setItem(
    key,
    JSON.stringify([
      ...new Set(ids),
    ])
  );
}

function announceNotificationsRead(
  userId
) {
  window.dispatchEvent(
    new CustomEvent(
      "ideahire:notifications-read",
      {
        detail: {
          userId,
        },
      }
    )
  );
}

/* =========================================================
   NAVBAR
========================================================= */

function AccountNavbar() {
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const {
    notice: moderationNotice,
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();

  const {
    isLimited,
    ageRequired,
    loading: ageAccessLoading,
  } = useAgeAccess();

  const hasRestrictedAgeAccess =
    !ageAccessLoading &&
    (isLimited || ageRequired);

  const [
    hasNotifications,
    setHasNotifications,
  ] = useState(false);

  const [
    hasDisputeNotifications,
    setHasDisputeNotifications,
  ] = useState(false);

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

  async function checkNotifications() {
    if (!user?.id) return;

    if (
      restrictionLoading ||
      isRestricted ||
      restrictionError ||
      hasRestrictedAgeAccess
    ) {
      setHasNotifications(false);
      setHasDisputeNotifications(false);
      return;
    }

    try {
      const {
        data: myJobs,
        error: jobsError,
      } = await supabase
        .from("jobs")
        .select("id")
        .eq(
          "user_id",
          user.id
        );

      if (jobsError) {
        console.error(
          "NOTIFICATION JOBS ERROR:",
          jobsError
        );
        return;
      }

      const jobIds =
        (myJobs || []).map(
          (job) => job.id
        );

      let applications = [];

      if (jobIds.length > 0) {
        const {
          data,
          error:
            applicationsError,
        } = await supabase
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
          .eq(
            "status",
            "pending"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (applicationsError) {
          console.error(
            "NOTIFICATION APPLICATIONS ERROR:",
            applicationsError
          );
          return;
        }

        applications =
          data || [];
      }

      const {
        data: rejectedApplications,
        error: rejectedApplicationsError,
      } = await supabase
        .from("job_applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "rejected");

      const {
        data: acceptedApplications,
        error: acceptedApplicationsError,
      } = await supabase
        .from("job_applications")
        .select("id")
        .eq("applicant_id", user.id)
        .eq("status", "accepted");

      const {
        data: blockNotifications,
        error: blockNotificationsError,
      } = await supabase
        .from("user_blocks")
        .select("id")
        .eq("blocked_id", user.id);

      const {
        data: disputeNotifications,
        error: disputeNotificationsError,
      } = await supabase
        .from("dispute_notifications")
        .select("id")
        .eq("user_id", user.id)
        .is("read_at", null)
        .limit(1);

      if (rejectedApplicationsError) {
        console.error(
          "REJECTED APPLICATION NOTIFICATION ERROR:",
          rejectedApplicationsError
        );
      }

      if (acceptedApplicationsError) {
        console.error(
          "ACCEPTED APPLICATION NOTIFICATION ERROR:",
          acceptedApplicationsError
        );
      }

      if (blockNotificationsError) {
        console.error(
          "BLOCK NOTIFICATION ERROR:",
          blockNotificationsError
        );
      }

      if (disputeNotificationsError) {
        console.error(
          "DISPUTE NOTIFICATION ERROR:",
          disputeNotificationsError
        );
      }

      setHasDisputeNotifications(
        !disputeNotificationsError &&
          (disputeNotifications || []).length > 0
      );

      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds =
        getStoredNotificationIds(
          readKey
        );

      const unreadIncoming =
        (applications || []).some(
          (application) =>
            !readIds.includes(
              `incoming:${application.id}`
            )
        );

      const unreadRejected =
        (rejectedApplications || []).some(
          (application) =>
            !readIds.includes(
              `rejected:${application.id}`
            )
        );

      const unreadAccepted =
        (acceptedApplications || []).some(
          (application) =>
            !readIds.includes(
              `accepted:${application.id}`
            )
        );

      const unreadBlock =
        (blockNotifications || []).some(
          (block) =>
            !readIds.includes(
              `blocked:${block.id}`
            )
        );

      setHasNotifications(
        unreadIncoming ||
        unreadRejected ||
        unreadAccepted ||
        unreadBlock
      );
    } catch (error) {
      console.error(
        "NOTIFICATION CHECK ERROR:",
        error
      );
    }
  }

  useEffect(() => {
    if (
      !user?.id ||
      restrictionLoading ||
      isRestricted ||
      restrictionError
    ) {
      setHasNotifications(false);
      setHasDisputeNotifications(false);
      return;
    }

    checkNotifications();

    function handleNotificationsRead(
      event
    ) {
      if (
        !event?.detail?.userId ||
        event.detail.userId ===
          user?.id
      ) {
        setHasNotifications(false);
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
          `ideahire_read_notifications_${user?.id}` ||
        event.key ===
          `ideahire_dismissed_notifications_${user?.id}`
      ) {
        checkNotifications();
      }
    }

    function handleDisputeNotificationsRead(event) {
      if (
        !event?.detail?.userId ||
        event.detail.userId === user?.id
      ) {
        setHasDisputeNotifications(false);
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

    window.addEventListener(
      "ideahire:dispute-notifications-read",
      handleDisputeNotificationsRead
    );

    const interval =
      setInterval(
        checkNotifications,
        10000
      );

    return () => {
      clearInterval(
        interval
      );

      window.removeEventListener(
        "ideahire:notifications-read",
        handleNotificationsRead
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "ideahire:dispute-notifications-read",
        handleDisputeNotificationsRead
      );
    };
  }, [
    user?.id,
    hasRestrictedAgeAccess,
    isRestricted,
    restrictionError,
    restrictionLoading,
  ]);

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

  if (isRestricted || restrictionError) {
    return (
      <header className="navbar account-navbar restricted-account-navbar">
        <Link
          className="restricted-navbar-brand"
          to="/account-status"
          aria-label="Przejdź do statusu konta"
        >
          <span className="logo">
            Idea<span>Hire</span>
          </span>
          <span className="restricted-navbar-badge">
            {isRestricted
              ? "Konto zawieszone"
              : "Status konta wymaga sprawdzenia"}
          </span>
        </Link>

        <nav
          className="nav-links restricted-navbar-links"
          aria-label="Dostępne funkcje zawieszonego konta"
        >
          <NavLink
            to="/account-status"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            Status konta
          </NavLink>
          <NavLink
            to="/privacy-center"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            Prywatność i dane
          </NavLink>
          <NavLink
            to="/regulamin"
            className={({ isActive }) => (isActive ? "is-active" : "")}
          >
            Regulamin
          </NavLink>
        </nav>

        <div className="nav-actions restricted-navbar-actions">
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

  return (
    <header className="navbar account-navbar">
      <div className="account-navbar-brand">
        <Link
          className="navbar-home-back"
          to="/"
          aria-label="Wróć na stronę główną"
          title="Wróć na stronę główną"
        >
          ←
        </Link>

        <Link
          className="logo"
          to="/"
        >
          Idea<span>Hire</span>
        </Link>
      </div>

      <nav className="nav-links">
        <NavLink
          to="/account"
          end
          className={({
            isActive,
          }) =>
            isActive
              ? "is-active"
              : ""
          }
        >
          <span className="account-nav-label-full">Moje konto</span>
          <span className="account-nav-label-short">Moje konto</span>
        </NavLink>

        {!hasRestrictedAgeAccess && (
          <NavLink
            to="/find-talent"
            className={({
              isActive,
            }) =>
              isActive
                ? "is-active"
                : ""
            }
          >
            <span className="account-nav-label-full">Dodaj zlecenie</span>
            <span className="account-nav-label-short">Dodaj</span>
          </NavLink>
        )}

        <NavLink
          to="/jobs"
          className={({
            isActive,
          }) =>
            isActive
              ? "is-active"
              : ""
          }
        >
          <span className="account-nav-label-full">Znajdź zlecenie</span>
          <span className="account-nav-label-short">Zlecenia</span>
        </NavLink>

        {!hasRestrictedAgeAccess && (
          <>
            <NavLink
              to="/messages"
              className={({
                isActive,
              }) =>
                isActive
                  ? "is-active"
                  : ""
              }
            >
              <span className="account-nav-label-full">Wiadomości</span>
              <span className="account-nav-label-short">Wiadomości</span>
            </NavLink>

            <NavLink
              to="/disputes"
              className={({ isActive }) =>
                `notifications-nav-link${
                  isActive ? " is-active" : ""
                }`
              }
            >
              <span className="account-nav-label-full">Spory</span>
              <span className="account-nav-label-short">Spory</span>

              {hasDisputeNotifications && (
                <span className="notification-dot" />
              )}
            </NavLink>

            <NavLink
              to="/notifications"
              className={({
                isActive,
              }) =>
                `notifications-nav-link${
                  isActive
                    ? " is-active"
                    : ""
                }`
              }
            >
              <span className="account-nav-label-full">Powiadomienia</span>
              <span className="account-nav-label-short">Powiadomienia</span>

              {hasNotifications && (
                <span className="notification-dot" />
              )}
            </NavLink>
          </>
        )}

        {moderationNotice && (
          <NavLink
            to="/account-status"
            className={({ isActive }) =>
              `notifications-nav-link${isActive ? " is-active" : ""}`
            }
          >
            <span className="account-nav-label-full">Decyzja administracji</span>
            <span className="account-nav-label-short">Decyzja</span>
            {["scheduled", "active"].includes(moderationNotice.status) && (
              <span className="notification-dot" />
            )}
          </NavLink>
        )}
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

function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);

  const displayName =
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Administracja";

  async function handleAdminLogout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      navigate("/login", { replace: true });
    } catch (error) {
      alert(
        `Nie udało się wylogować: ${
          error?.message || "Nieznany błąd"
        }`
      );
    }
  }

  return (
    <header className="navbar admin-navbar">
      <Link className="admin-navbar-brand" to="/admin">
        <span className="logo">
          Idea<span>Hire</span>
        </span>
        <span className="admin-navbar-label">Administracja</span>
      </Link>

      <nav className="admin-nav-links" aria-label="Nawigacja administracji">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            isActive || location.pathname.startsWith("/disputes/")
              ? "is-active"
              : ""
          }
        >
          Spory
        </NavLink>

        <NavLink
          to="/admin/jobs"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Zlecenia
        </NavLink>

        <NavLink
          to="/admin/messages"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Wiadomości dowodowe
        </NavLink>

        <NavLink
          to="/admin/privacy"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Wnioski RODO
        </NavLink>

        <NavLink
          to="/admin/moderation"
          className={({ isActive }) => (isActive ? "is-active" : "")}
        >
          Moderacja
        </NavLink>
      </nav>

      <div className="admin-navbar-actions">
        <div className="admin-navbar-identity">
          <strong>{displayName}</strong>
          <span>
            {staffRole === "owner" ? "Właściciel" : "Administrator"}
          </span>
        </div>

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleAdminLogout}
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
    adoptSession,
  } = useAuth();

  const location =
    useLocation();

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
      const from =
        location.state?.from;

      if (
        typeof from ===
          "string" &&
        from.startsWith("/")
      ) {
        navigate(from, {
          replace: true,
        });
      }
    }
  }, [
    authLoading,
    isLoggedIn,
    navigate,
    location.state,
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

    if (loading) return;

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
              normalizeEmail(email),
            password,
          }
        );

      if (error) {
        setMessage(
          getLoginErrorMessage(error)
        );

        return;
      }

      if (
        !data?.user ||
        !data?.session
      ) {
        setMessage(
          "Logowanie nie utworzyło aktywnej sesji."
        );

        return;
      }

      /*
       * Przekazujemy świeżą sesję do routera przed przejściem na stronę
       * chronioną. Zapobiega to pętli login -> konto -> login na wolniejszych
       * urządzeniach i przy opóźnionym zdarzeniu SIGNED_IN.
       */
      adoptSession(
        data.session
      );

      const from =
        location.state?.from;

      navigate(
        typeof from === "string" &&
          from.startsWith("/")
          ? from
          : "/account",
        {
          replace: true,
        }
      );
    } catch (error) {
      setMessage(
        getLoginErrorMessage(error)
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
      normalizeEmail(email);

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
              getPasswordRecoveryRedirectUrl(
                window.location.origin
              ),
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
    return <LoadingScreen />;
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
              disabled={loading}
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
              className="auth-link-button"
              onClick={
                switchToLogin
              }
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

          <div className="forgot-password-row">
            <button
              type="button"
              className="auth-link-button"
              onClick={
                switchToReset
              }
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
    useState(true);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [
    recoveryReady,
    setRecoveryReady,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;
    let recoveryResolved = false;
    let failureTimer = null;

    function markRecoveryReady() {
      if (!mounted) return;

      recoveryResolved = true;

      if (failureTimer) {
        window.clearTimeout(
          failureTimer
        );
      }

      window.history.replaceState(
        {},
        document.title,
        getPasswordRecoveryRedirectUrl(
          window.location.origin
        )
      );

      setRecoveryReady(true);
      setMessage("");
      setLoading(false);
    }

    function showRecoveryError(error) {
      if (!mounted) return;

      console.error(
        "PASSWORD RECOVERY ERROR:",
        error
      );

      setMessage(
        `Nie udało się aktywować resetowania hasła: ${
          error?.message ||
          "Link jest nieprawidłowy albo wygasł."
        }`
      );
      setLoading(false);
    }

    function scheduleMissingSessionError() {
      failureTimer = window.setTimeout(
        () => {
          if (
            !mounted ||
            recoveryResolved
          ) {
            return;
          }

          setMessage(
            "Nie udało się aktywować linku resetującego. Poproś o nowy link i otwórz najnowszą wiadomość."
          );
          setLoading(false);
        },
        3000
      );
    }

    async function prepareRecovery() {
      try {
        const searchParams =
          new URLSearchParams(
            window.location.search
          );

        const hashParams =
          new URLSearchParams(
            window.location.hash.replace(
              /^#/,
              ""
            )
          );

        const tokenHash =
          searchParams.get(
            "token_hash"
          );

        const type =
          searchParams.get("type");

        const callbackError =
          searchParams.get(
            "error_description"
          ) ||
          hashParams.get(
            "error_description"
          );

        if (callbackError) {
          throw new Error(
            callbackError.replace(
              /\+/g,
              " "
            )
          );
        }

        /*
         * 1. Link oparty o token_hash.
         * Ten wariant jest odporny na otwarcie linku
         * z klienta pocztowego / innej karty.
         */
        if (
          tokenHash &&
          type === "recovery"
        ) {
          const {
            data,
            error,
          } =
            await supabase.auth.verifyOtp(
              {
                token_hash:
                  tokenHash,
                type: "recovery",
              }
            );

          if (error) {
            throw error;
          }

          if (data?.session) {
            markRecoveryReady();
            return;
          }
        }

        /*
         * Dla standardowego linku klient Supabase sam odczytuje
         * tokeny z URL (detectSessionInUrl). Nie przetwarzamy ich
         * drugi raz, bo kod/link odzyskiwania jest jednorazowy.
         */
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (
          passwordRecoveryRequested &&
          sessionData?.session
        ) {
          markRecoveryReady();
          return;
        }

        scheduleMissingSessionError();
      } catch (error) {
        showRecoveryError(error);
      }
    }

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!mounted) return;

          if (
            event ===
              "PASSWORD_RECOVERY" &&
            session
          ) {
            markRecoveryReady();
          }
        }
      );

    prepareRecovery();

    return () => {
      mounted = false;

      if (failureTimer) {
        window.clearTimeout(
          failureTimer
        );
      }

      subscription.unsubscribe();
    };
  }, []);

  async function handleUpdatePassword(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (!recoveryReady) {
      setMessage(
        "Sesja resetowania hasła nie jest aktywna. Poproś o nowy link resetujący."
      );

      return;
    }

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
      const {
        data,
        error,
      } =
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

      if (!data?.user) {
        setMessage(
          "Supabase nie potwierdził zmiany hasła."
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Hasło zostało zmienione. Możesz zalogować się nowym hasłem."
      );

      setPassword("");
      setPasswordAgain("");

      await supabase.auth.signOut();

      window.setTimeout(
        () => {
          navigate(
            "/login",
            {
              replace: true,
            }
          );
        },
        900
      );
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

  if (loading) {
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
            Odzyskiwanie konta
          </span>

          <h1>
            Ustaw nowe hasło
          </h1>

          <p>
            Wpisz nowe hasło do
            swojego konta.
          </p>
        </div>

        {!recoveryReady ? (
          <>
            {message && (
              <p className="auth-error">
                {message}
              </p>
            )}

            <div className="reset-back-button">
              <Link
                className="btn btn-dark btn-large"
                to="/login"
              >
                Wróć do logowania
              </Link>
            </div>
          </>
        ) : (
          <>
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
                  value={passwordAgain}
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
          </>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   REGISTER
========================================================= */

function Register() {
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

  const [birthDate, setBirthDate] =
    useState("");

  const [ageNoticeAcknowledged, setAgeNoticeAcknowledged] =
    useState(false);

  const [privacyNoticeAcknowledged, setPrivacyNoticeAcknowledged] =
    useState(false);

  const [termsAccepted, setTermsAccepted] =
    useState(false);

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

    const birthDateValidation =
      getBirthDateValidation(birthDate);

    if (!birthDateValidation.valid) {
      setMessage(birthDateValidation.message);
      return;
    }

    if (!ageNoticeAcknowledged) {
      setMessage("Potwierdź prawidłowość podanej daty urodzenia.");
      return;
    }

    if (!privacyNoticeAcknowledged) {
      setMessage("Potwierdź zapoznanie się z Polityką prywatności.");
      return;
    }

    if (!termsAccepted) {
      setMessage("Zaakceptuj Regulamin IdeaHire, aby utworzyć konto.");
      return;
    }

    setLoading(true);

    try {
      const acceptedAtClient = new Date().toISOString();

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            normalizeEmail(email),
          password,
          options: {
            data: {
              name:
                name.trim(),
              date_of_birth:
                birthDate,
              age_notice_acknowledged:
                true,
              age_notice_version:
                AGE_NOTICE_VERSION,
              privacy_notice_acknowledged:
                true,
              privacy_notice_version:
                PRIVACY_NOTICE_VERSION,
              privacy_notice_acknowledged_at:
                acceptedAtClient,
              terms_accepted:
                true,
              terms_version:
                LEGAL_TERMS_VERSION,
              terms_accepted_at_client:
                acceptedAtClient,
            },
          },
        });

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

      if (!data.session) {
        alert(
          "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres."
        );
      }
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
            Data urodzenia

            <input
              type="date"
              value={birthDate}
              min={getDateInputBoundary(120)}
              max={getDateInputBoundary()}
              onChange={(event) => {
                setBirthDate(event.target.value);
                setMessage("");
              }}
              autoComplete="bday"
              required
            />

            <small>
              Data pozostaje prywatna i służy wyłącznie do ustalenia
              uprawnień konta.
            </small>
          </label>

          {birthDate && (
            <div
              className={`registration-age-result is-${
                getBirthDateValidation(birthDate).code
              }`}
              role="status"
            >
              <strong>
                {getBirthDateValidation(birthDate).code === "adult"
                  ? "Pełne konto 18+"
                  : getBirthDateValidation(birthDate).code === "minor_limited"
                  ? "Konto ograniczone 16–17"
                  : "Konto niedostępne"}
              </strong>
              <span>{getBirthDateValidation(birthDate).message}</span>
            </div>
          )}

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

          <label className="age-access-confirmation">
            <input
              type="checkbox"
              checked={ageNoticeAcknowledged}
              onChange={(event) => {
                setAgeNoticeAcknowledged(event.target.checked);
                setMessage("");
              }}
              required
            />
            <span>
              <strong>Potwierdzam prawidłowość daty urodzenia.</strong>
              <small>
                Osoby w wieku 16–17 lat otrzymują konto ograniczone. Pełne
                funkcje płatnych zleceń są dostępne od 18 lat.
              </small>
            </span>
          </label>

          <div className="registration-privacy-confirmation">
            <input
              id="privacy-notice-acknowledgement"
              type="checkbox"
              checked={privacyNoticeAcknowledged}
              onChange={(event) => {
                setPrivacyNoticeAcknowledged(event.target.checked);
                setMessage("");
              }}
              required
            />
            <div>
              <label htmlFor="privacy-notice-acknowledgement">
                Zapoznałem się z Polityką prywatności.
              </label>
              <small>
                Dokument wyjaśnia, jak IdeaHire przetwarza i chroni dane. {" "}
                <Link to="/polityka-prywatnosci" target="_blank">
                  Otwórz Politykę prywatności
                </Link>
              </small>
            </div>
          </div>

          <div className="registration-privacy-confirmation registration-terms-confirmation">
            <input
              id="terms-acceptance"
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => {
                setTermsAccepted(event.target.checked);
                setMessage("");
              }}
              required
            />
            <div>
              <label htmlFor="terms-acceptance">
                Akceptuję Regulamin IdeaHire.
              </label>
              <small>
                Akceptacja Regulaminu jest wymagana do utworzenia konta. {" "}
                <Link to="/regulamin" target="_blank" rel="noreferrer">
                  Otwórz Regulamin — wersja 0.9
                </Link>
              </small>
            </div>
          </div>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={
              loading ||
              !ageNoticeAcknowledged ||
              !privacyNoticeAcknowledged ||
              !termsAccepted
            }
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
        URL.createObjectURL(file);

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

      image.src = objectUrl;
    }
  );
}

function AccountStatus() {
  const { user } = useAuth();
  const {
    notice,
    appeal,
    isRestricted,
    loading,
    errorMessage: restrictionError,
    refreshRestriction,
  } = useAccountRestriction();
  const [appealStatement, setAppealStatement] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmitAppeal(event) {
    event.preventDefault();
    if (!notice?.case_id || busy) return;

    if (appealStatement.trim().length < 30) {
      setMessage("Odwołanie musi mieć co najmniej 30 znaków.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "submit_my_ideahire_moderation_appeal",
        {
          p_case_id: notice.case_id,
          p_statement: appealStatement.trim(),
        }
      );

      if (error) throw error;
      setAppealStatement("");
      setMessage("Odwołanie zostało zapisane i przekazane do rozpoznania.");
      await refreshRestriction(user.id, false);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się złożyć odwołania."));
    } finally {
      setBusy(false);
    }
  }

  const durationDetails = getModerationDurationDetails(notice);

  function downloadDecisionNotice() {
    if (!notice) return;

    const content = [
      `IdeaHire — zawiadomienie ${notice.notice_number}`,
      "",
      `Rodzaj decyzji: ${MODERATION_DECISION_LABELS[notice.decision_type] || notice.decision_type}`,
      `Status: ${MODERATION_STATUS_LABELS[notice.status] || notice.status}`,
      `Okres: ${durationDetails?.headline || "—"}`,
      `Powód: ${MODERATION_REASON_LABELS[notice.reason_code] || notice.reason_code}`,
      "Zakres: wykonywanie nowych czynności w serwisie oraz publiczna widoczność profilu i zleceń",
      ...(notice.source_job_title
        ? [`Powiązane zlecenie: ${notice.source_job_title} (${notice.source_job_id})`]
        : []),
      `Doręczono: ${formatDisputeDate(notice.delivered_at)}`,
      `Obowiązuje od: ${formatDisputeDate(notice.effective_at)}`,
      `Obowiązuje do: ${notice.ends_at ? formatDisputeDate(notice.ends_at) : "bezterminowo"}`,
      `Termin odwołania: ${formatDisputeDate(notice.appeal_available_until)}`,
      "",
      "Uzasadnienie:",
      notice.public_reason,
      "",
      "Podstawa regulaminowa:",
      notice.terms_reference,
      ...(notice.legal_basis
        ? ["", "Podstawa prawna:", notice.legal_basis]
        : []),
      "",
      "Decyzja została podjęta po analizie człowieka.",
    ].join("\n");

    const file = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${notice.notice_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const appealDeadlineOpen = notice
    && new Date(notice.appeal_available_until).getTime() >= Date.now();

  return (
    <div
      className="account-page moderation-user-page"
      data-moderation-ui-version="2026-09-11-flicker-fix-v3"
    >
      <AccountNavbar />

      <main className="app-page moderation-user-shell">
        <header className="moderation-user-header">
          <span className="section-label">Bezpieczeństwo i moderacja</span>
          <h1>Status Twojego konta</h1>
          <p>
            Tutaj znajdziesz decyzję administracji, jej podstawę, czas
            obowiązywania oraz bezpłatną możliwość odwołania.
          </p>
        </header>

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        {restrictionError && notice && (
          <p className="moderation-status-read-error" role="alert">
            {restrictionError} Wyświetlamy ostatni poprawnie pobrany stan i nie
            odblokowujemy pozostałych funkcji konta.
          </p>
        )}

        {loading ? (
          <div className="privacy-empty-state">Ładowanie statusu konta...</div>
        ) : restrictionError && !notice ? (
          <section className="moderation-status-error-card" role="alert">
            <span aria-hidden="true">!</span>
            <div>
              <span className="section-label">Bezpieczny tryb konta</span>
              <h2>Nie możemy teraz potwierdzić statusu konta</h2>
              <p>{restrictionError}</p>
              <p>
                Do czasu poprawnego odczytu nie udostępniamy czynności na
                koncie. Możesz ponowić próbę, przejść do centrum prywatności
                albo się wylogować.
              </p>
              <div className="moderation-status-error-actions">
                <button
                  type="button"
                  className="privacy-primary-button"
                  onClick={() => refreshRestriction(user?.id, false)}
                >
                  Spróbuj ponownie
                </button>
                <Link className="privacy-secondary-button" to="/privacy-center">
                  Prywatność i moje dane
                </Link>
              </div>
            </div>
          </section>
        ) : !notice ? (
          <section className="moderation-clear-card">
            <span aria-hidden="true">✓</span>
            <div>
              <h2>Brak ograniczeń konta</h2>
              <p>Na Twoim koncie nie ma decyzji o zawieszeniu.</p>
              <Link className="privacy-primary-button" to="/account">
                Wróć do konta
              </Link>
            </div>
          </section>
        ) : (
          <>
            {isRestricted && (
              <section className="restricted-account-lock-card" role="alert">
                <span className="restricted-account-lock-icon" aria-hidden="true">
                  !
                </span>
                <div>
                  <span className="section-label">Dostęp do konta ograniczony</span>
                  <h2>Twoje konto zostało zawieszone</h2>
                  <p>
                    W czasie obowiązywania decyzji nie możesz publikować ani
                    edytować zleceń, aplikować, wysyłać wiadomości ani wykonywać
                    innych czynności na platformie. Nadal możesz sprawdzić pełną
                    decyzję, złożyć odwołanie, skorzystać z praw dotyczących danych
                    i wylogować się.
                  </p>
                  {durationDetails && (
                    <div className="restricted-account-lock-duration">
                      <span>Czas zawieszenia</span>
                      <strong>{durationDetails.headline}</strong>
                      <p>{durationDetails.detail}</p>
                    </div>
                  )}
                  <div className="restricted-account-lock-reason">
                    <span>Powód zawieszenia</span>
                    <strong>
                      {MODERATION_REASON_LABELS[notice.reason_code]
                        || notice.reason_code}
                    </strong>
                    <p>{notice.public_reason}</p>
                  </div>
                  {(appeal || appealDeadlineOpen) && (
                    <div className="restricted-account-lock-actions">
                      <a
                        className="privacy-primary-button"
                        href="#moderation-appeal"
                      >
                        {appeal
                          ? "Sprawdź status odwołania"
                          : "Złóż bezpłatne odwołanie"}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className={`moderation-decision-card is-${notice.status}`}>
              <div className="moderation-decision-topline">
                <div>
                  <span className="section-label">{notice.notice_number}</span>
                  <h2>{MODERATION_DECISION_LABELS[notice.decision_type]}</h2>
                </div>
                <span className={`moderation-status-pill is-${notice.status}`}>
                  {MODERATION_STATUS_LABELS[notice.status] || notice.status}
                </span>
              </div>

              {durationDetails && (
                <div
                  className="moderation-duration-banner"
                  aria-live="polite"
                >
                  <span>Czas obowiązywania decyzji</span>
                  <strong>{durationDetails.headline}</strong>
                  <p>{durationDetails.detail}</p>
                </div>
              )}

              <dl className="moderation-decision-meta">
                <div>
                  <dt>Powód</dt>
                  <dd>{MODERATION_REASON_LABELS[notice.reason_code] || notice.reason_code}</dd>
                </div>
                <div>
                  <dt>Zakres</dt>
                  <dd>Nowe czynności w serwisie oraz publiczna widoczność profilu i zleceń</dd>
                </div>
                <div>
                  <dt>Obowiązuje od</dt>
                  <dd>{formatDisputeDate(notice.effective_at)}</dd>
                </div>
                <div>
                  <dt>Obowiązuje do</dt>
                  <dd>{notice.ends_at ? formatDisputeDate(notice.ends_at) : "Bezterminowo"}</dd>
                </div>
                <div>
                  <dt>Decyzja</dt>
                  <dd>Analiza człowieka — bez decyzji automatycznej</dd>
                </div>
              </dl>

              <article className="moderation-reason-block">
                <h3>Konkretne uzasadnienie</h3>
                <p>{notice.public_reason}</p>
              </article>

              {notice.source_job_title && (
                <article className="moderation-notice-source">
                  <strong>Decyzja powiązana ze zleceniem</strong>
                  <p>{notice.source_job_title}</p>
                  <small>ID zlecenia: {notice.source_job_id}</small>
                </article>
              )}

              <div className="moderation-basis-grid">
                <article>
                  <h3>Podstawa regulaminowa</h3>
                  <p>{notice.terms_reference}</p>
                </article>
                <article>
                  <h3>Podstawa prawna</h3>
                  <p>{notice.legal_basis || "Decyzja opiera się na wskazanym postanowieniu regulaminu."}</p>
                </article>
              </div>

              {notice.last_adjusted_at && notice.last_adjustment_reason && (
                <div className="moderation-adjustment-banner">
                  <strong>Zmieniono czas obowiązywania decyzji</strong>
                  <p>{notice.last_adjustment_reason}</p>
                  <small>
                    Zmieniono: {formatDisputeDate(notice.last_adjusted_at)}
                  </small>
                </div>
              )}

              {notice.lift_reason && (
                <div className="moderation-lift-banner">
                  <strong>Ograniczenie zostało zdjęte</strong>
                  <p>{notice.lift_reason}</p>
                </div>
              )}

              <div className="moderation-decision-actions">
                <button
                  type="button"
                  className="privacy-secondary-button"
                  onClick={downloadDecisionNotice}
                >
                  Pobierz kopię zawiadomienia
                </button>
                <Link className="privacy-secondary-button" to="/privacy-center">
                  Prywatność i moje dane
                </Link>
              </div>
            </section>

            {appeal ? (
              <section
                id="moderation-appeal"
                className="moderation-appeal-card"
                tabIndex="-1"
              >
                <div className="moderation-decision-topline">
                  <div>
                    <span className="section-label">Twoje odwołanie</span>
                    <h2>{MODERATION_APPEAL_STATUS_LABELS[appeal.status] || appeal.status}</h2>
                  </div>
                  <span className={`moderation-status-pill is-${appeal.status}`}>
                    {MODERATION_APPEAL_STATUS_LABELS[appeal.status] || appeal.status}
                  </span>
                </div>
                <p>{appeal.user_statement}</p>
                <dl className="moderation-appeal-meta">
                  <div>
                    <dt>Złożono</dt>
                    <dd>{formatDisputeDate(appeal.submitted_at)}</dd>
                  </div>
                  <div>
                    <dt>Sposób rozpoznania</dt>
                    <dd>Analiza przez uprawnionego członka administracji</dd>
                  </div>
                  {appeal.resolved_at && (
                    <div>
                      <dt>Rozstrzygnięto</dt>
                      <dd>{formatDisputeDate(appeal.resolved_at)}</dd>
                    </div>
                  )}
                </dl>
                {appeal.resolution_reason && (
                  <div className="moderation-reason-block">
                    <h3>Wynik ponownej analizy</h3>
                    <p>{appeal.resolution_reason}</p>
                  </div>
                )}
              </section>
            ) : appealDeadlineOpen ? (
              <form
                id="moderation-appeal"
                className="moderation-appeal-card"
                onSubmit={handleSubmitAppeal}
                tabIndex="-1"
              >
                <span className="section-label">Bezpłatne odwołanie</span>
                <h2>Wyjaśnij fakty lub wskaż błąd decyzji</h2>
                <p>
                  Termin złożenia odwołania: {formatDisputeDate(notice.appeal_available_until)}.
                  Odwołanie zostanie rozpoznane przez uprawnionego członka
                  administracji i nie będzie rozstrzygane wyłącznie automatycznie.
                </p>
                <div className="moderation-appeal-guidance" id="appeal-guidance">
                  <strong>Co warto podać?</strong>
                  <p>
                    Wskaż konkretny błąd, istotne fakty, daty lub identyfikator
                    zlecenia. Nie podawaj hasła, danych karty ani innych danych,
                    które nie są potrzebne do rozpoznania sprawy.
                  </p>
                </div>
                <textarea
                  value={appealStatement}
                  onChange={(event) => setAppealStatement(event.target.value)}
                  minLength={30}
                  maxLength={5000}
                  rows={7}
                  placeholder="Opisz, dlaczego decyzja powinna zostać zmieniona, i wskaż istotne fakty..."
                  disabled={busy}
                  aria-describedby="appeal-guidance"
                />
                <div className="moderation-form-footer">
                  <small>{appealStatement.length}/5000</small>
                  <button
                    type="submit"
                    className="privacy-primary-button"
                    disabled={busy || appealStatement.trim().length < 30}
                  >
                    {busy ? "Wysyłanie..." : "Złóż odwołanie"}
                  </button>
                </div>
              </form>
            ) : (
              <section className="moderation-appeal-card">
                <h2>Termin odwołania upłynął</h2>
                <p>Kopia decyzji pozostaje dostępna w historii konta.</p>
              </section>
            )}

            <section className="moderation-redress-card">
              <span className="section-label">Dalsze środki ochrony prawnej</span>
              <h2>Odwołanie wewnętrzne nie zamyka innych możliwości</h2>
              <p>
                Po otrzymaniu uzasadnionego rozstrzygnięcia możesz skorzystać
                także z innych środków dostępnych na podstawie prawa. Zależnie
                od przepisów mających zastosowanie do operatora może to obejmować
                certyfikowany organ pozasądowego rozstrzygania sporów. Prawo do
                dochodzenia roszczeń przed właściwym sądem pozostaje nienaruszone.
              </p>
              <Link className="privacy-secondary-button" to="/regulamin">
                Sprawdź zasady moderacji i odwołań
              </Link>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function AccountEntry() {
  const { isLimited } = useAgeAccess();

  return isLimited ? <LimitedAccount /> : <Account />;
}

function LimitedAccount() {
  const location = useLocation();
  const { dateOfBirth } = useAgeAccess();
  const fullAccessDate = getAgeAnniversary(
    dateOfBirth,
    FULL_ACCOUNT_AGE
  );

  const fullAccessLabel = fullAccessDate
    ? fullAccessDate.toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "po ukończeniu 18 lat";

  return (
    <div className="page limited-account-page">
      <AccountNavbar />

      <main className="app-page limited-account-shell">
        <div className="app-page-header">
          <span className="section-label">Twoje konto</span>
          <h1>Konto ograniczone</h1>
          <p>
            Możesz bezpiecznie poznawać IdeaHire. Funkcje związane z umowami
            i płatnymi zleceniami zostaną udostępnione po ukończeniu 18 lat.
          </p>
        </div>

        {location.state?.ageRestricted && (
          <p className="limited-account-route-message" role="status">
            Ta funkcja jest dostępna wyłącznie dla pełnych kont 18+.
          </p>
        )}

        <section className="limited-account-hero">
          <div className="limited-account-status-icon" aria-hidden="true">
            16+
          </div>
          <div>
            <span>Konto młodzieżowe 16–17</span>
            <h2>Pełny dostęp od {fullAccessLabel}</h2>
            <p>
              Nie musisz ponownie zakładać konta. Wiek jest obliczany
              automatycznie na podstawie zapisanej, prywatnej daty urodzenia.
            </p>
          </div>
        </section>

        <div className="limited-account-grid">
          <section className="limited-account-panel is-available">
            <span className="limited-account-panel-icon" aria-hidden="true">✓</span>
            <h2>Dostępne teraz</h2>
            <ul>
              <li>przeglądanie zleceń,</li>
              <li>przeglądanie publicznych profili,</li>
              <li>ustawienia języka i wyglądu strony.</li>
            </ul>
            <Link className="btn btn-dark" to="/jobs">
              Przeglądaj zlecenia →
            </Link>
          </section>

          <section className="limited-account-panel is-locked">
            <span className="limited-account-panel-icon" aria-hidden="true">○</span>
            <h2>Dostępne od 18 lat</h2>
            <ul>
              <li>publikowanie i przyjmowanie zleceń,</li>
              <li>wiadomości i formularze współpracy,</li>
              <li>płatności oraz otwieranie nowych sporów.</li>
            </ul>
          </section>
        </div>

        <section className="limited-account-privacy">
          <strong>Twoja data urodzenia pozostaje prywatna</strong>
          <p>
            Nie wyświetlamy jej na profilu ani innym użytkownikom. Jeżeli
            została podana błędnie, korektę przeprowadzi pomoc IdeaHire.
          </p>
          <Link className="privacy-entry-link" to="/privacy-center">
            Prywatność i moje dane →
          </Link>
        </section>
      </main>
    </div>
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

  const { isAdult } = useAgeAccess();

  const location = useLocation();
  const navigate = useNavigate();

  const connectReturnHandledRef =
    useRef("");

  const [name, setName] =
    useState("");

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const [about, setAbout] =
    useState("");

  const [
    specialtyCategories,
    setSpecialtyCategories,
  ] = useState([]);

  const [
    specialization,
    setSpecialization,
  ] = useState("");

  const [skills, setSkills] =
    useState([]);

  const [skillDraft, setSkillDraft] =
    useState("");

  const [
    profileDetailsLoading,
    setProfileDetailsLoading,
  ] = useState(true);

  const [countryCode, setCountryCode] =
    useState("");

  const [countryLoading, setCountryLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [myJobs, setMyJobs] =
    useState([]);

  const [jobsLoading, setJobsLoading] =
    useState(true);

  const [connectStatus, setConnectStatus] =
    useState("not_started");

  const [connectStatusLoading, setConnectStatusLoading] =
    useState(true);

  const [connectActionLoading, setConnectActionLoading] =
    useState(false);

  const [connectFeedback, setConnectFeedback] =
    useState(null);

  useEffect(() => {
    if (!user) return;

    /*
     * Formularz inicjalizujemy tylko po zmianie konta.
     * Aktualizacje Auth (np. USER_UPDATED po zapisie nazwy,
     * opisu albo avatara) nie mogą nadpisywać wpisywanych
     * właśnie wartości i powodować migania starej nazwy.
     */
    setName(
      user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        ""
    );

    setAvatarUrl(
      user.user_metadata?.avatar_url ||
        ""
    );

    setAbout(
      user.user_metadata?.about ||
        ""
    );
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setCountryCode("");
      setCountryLoading(false);
      return;
    }

    let mounted = true;

    async function loadCountry() {
      setCountryLoading(true);

      try {
        const {
          data,
          error,
        } = await supabase
          .from("public_profiles")
          .select("country_code")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error(
            "COUNTRY LOAD ERROR:",
            error
          );
          return;
        }

        if (mounted) {
          setCountryCode(
            data?.country_code || ""
          );
        }
      } finally {
        if (mounted) {
          setCountryLoading(false);
        }
      }
    }

    loadCountry();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setSpecialtyCategories([]);
      setSpecialization("");
      setSkills([]);
      setSkillDraft("");
      setProfileDetailsLoading(false);
      return;
    }

    let mounted = true;

    async function loadProfileDetails() {
      setProfileDetailsLoading(true);

      try {
        const { data, error } =
          await supabase
            .from("profiles")
            .select(
              "specialty_categories, specialization, skills"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (error) {
          console.error(
            "PROFILE DETAILS LOAD ERROR:",
            error
          );
          return;
        }

        if (!mounted) return;

        const storedCategories =
          Array.isArray(
            data?.specialty_categories
          )
            ? data.specialty_categories
            : [];

        setSpecialtyCategories(
          storedCategories.filter(
            (category) =>
              JOB_CATEGORIES.includes(
                category
              )
          )
        );

        setSpecialization(
          data?.specialization || ""
        );

        setSkills(
          Array.isArray(data?.skills)
            ? data.skills.filter(
                (skill) =>
                  typeof skill ===
                    "string" &&
                  !!skill.trim()
              )
            : []
        );
      } finally {
        if (mounted) {
          setProfileDetailsLoading(false);
        }
      }
    }

    loadProfileDetails();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    async function loadMyJobs() {
      setJobsLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("jobs")
        .select(
          "id, user_id, title, description, category, budget, created_at"
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

      if (error) {
        console.error(
          "MY JOBS ERROR:",
          error
        );
      } else {
        setMyJobs(
          data || []
        );
      }

      setJobsLoading(false);
    }

    loadMyJobs();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isAdult) {
      setConnectStatus("not_started");
      setConnectStatusLoading(false);
      return;
    }

    let mounted = true;

    async function loadInitialConnectStatus() {
      setConnectStatusLoading(true);

      try {
        const { data, error } = await supabase.rpc(
          "get_my_ideahire_connect_status"
        );

        if (error) throw error;
        if (!mounted) return;

        setConnectStatus(
          data?.[0]?.onboarding_status || "not_started"
        );
      } catch (error) {
        console.error(
          "CONNECT STATUS LOAD ERROR:",
          error
        );

        if (mounted) {
          setConnectFeedback({
            type: "error",
            text: "Nie udało się pobrać statusu konta Stripe.",
          });
        }
      } finally {
        if (mounted) {
          setConnectStatusLoading(false);
        }
      }
    }

    loadInitialConnectStatus();

    return () => {
      mounted = false;
    };
  }, [user?.id, isAdult]);

  useEffect(() => {
    if (!user?.id || !isAdult) return;

    const returnMode = new URLSearchParams(
      location.search
    ).get("stripe_connect");

    if (
      returnMode !== "return" &&
      returnMode !== "refresh"
    ) {
      return;
    }

    const handledKey = `${user.id}:${returnMode}`;

    if (
      connectReturnHandledRef.current === handledKey
    ) {
      return;
    }

    connectReturnHandledRef.current = handledKey;

    handleConnectOnboarding({
      redirectToStripe: returnMode === "refresh",
      returningFromStripe: true,
    }).finally(() => {
      if (returnMode === "return") {
        navigate("/account", {
          replace: true,
        });
      }
    });
  }, [user?.id, isAdult, location.search]);

  if (authLoading) {
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
        data: updatedUser,
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

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name:
              name.trim() ||
              user.user_metadata?.name ||
              user.email?.split("@")[0] ||
              "Użytkownik",
            avatar_url: publicUrl,
            about:
              about.trim() ||
              user.user_metadata?.about ||
              null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "PROFILE AVATAR UPDATE ERROR:",
          profileError
        );

        setMessage(
          `Zdjęcie zostało przesłane, ale nie udało się zaktualizować profilu publicznego: ${profileError.message}`
        );

        return;
      }

      setAvatarUrl(
        updatedUser?.user
          ?.user_metadata
          ?.avatar_url ||
          publicUrl
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

    const cleanAbout =
      about.trim();

    const cleanSpecialization =
      specialization.trim();

    if (!cleanName) {
      setMessage(
        "Imię / nazwa nie może być puste."
      );

      return;
    }

    setSaving(true);
    setMessage("");

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
              about:
                cleanAbout ||
                null,
              specialty_categories:
                specialtyCategories,
              specialization:
                cleanSpecialization ||
                null,
              skills,
            },
          }
        );

      if (error) {
        setMessage(
          `Nie udało się zapisać profilu: ${error.message}`
        );

        return;
      }

      /*
       * Synchronizujemy publiczny profil.
       * Inni użytkownicy pobierają opis, nazwę i avatar
       * z tabeli public.profiles, więc samo Auth metadata
       * nie wystarcza.
       */
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            name: cleanName,
            avatar_url:
              avatarUrl ||
              null,
            about:
              cleanAbout ||
              null,
            specialty_categories:
              specialtyCategories,
            specialization:
              cleanSpecialization ||
              null,
            skills,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "PROFILE SAVE ERROR:",
          profileError
        );

        setMessage(
          `Dane konta zostały zapisane, ale nie udało się zaktualizować profilu publicznego: ${profileError.message}`
        );

        return;
      }

      try {
        await saveUserCountry(
          user.id,
          getCountryByCode(countryCode)
        );
      } catch (countryError) {
        console.error(
          "COUNTRY SAVE ERROR:",
          countryError
        );

        setMessage(
          `Profil został zapisany, ale nie udało się zapisać kraju: ${countryError.message}`
        );

        return;
      }

      /*
       * Używamy dokładnie wartości zatwierdzonych w formularzu.
       * Nie czekamy na ponowne odświeżenie user_metadata, dzięki
       * czemu interfejs nie przeskakuje przez starsze dane.
       */
      setName(cleanName);
      setAvatarUrl(
        avatarUrl || ""
      );
      setAbout(cleanAbout);
      setSpecialization(
        cleanSpecialization
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

  async function handleDeleteJob(
    jobId
  ) {
    const confirmed =
      window.confirm(
        "Czy na pewno chcesz usunąć to zlecenie?"
      );

    if (!confirmed) return;

    const {
      error,
    } =
      await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .eq(
          "user_id",
          user.id
        );

    if (error) {
      alert(
        `Nie udało się usunąć zlecenia: ${error.message}`
      );

      return;
    }

    setMyJobs(
      (current) =>
        current.filter(
          (job) =>
            job.id !== jobId
        )
    );
  }

  async function refreshConnectStatus() {
    const { data, error } = await supabase.rpc(
      "get_my_ideahire_connect_status"
    );

    if (error) throw error;

    const nextStatus =
      data?.[0]?.onboarding_status || "not_started";

    setConnectStatus(nextStatus);
    return nextStatus;
  }

  async function readFunctionError(error) {
    if (!error) return "";

    try {
      const response = error.context;

      if (
        response &&
        typeof response.clone === "function"
      ) {
        const payload = await response.clone().json();

        if (payload?.error) {
          return payload.error;
        }
      }
    } catch {
      // Gdy odpowiedź nie jest JSON-em, używamy bezpiecznego komunikatu niżej.
    }

    return error.message || "";
  }

  async function handleConnectOnboarding({
    redirectToStripe = true,
    returningFromStripe = false,
  } = {}) {
    if (connectActionLoading) return;

    setConnectActionLoading(true);
    setConnectFeedback(null);

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData?.session?.access_token
      ) {
        throw new Error(
          "Twoja sesja wygasła. Zaloguj się ponownie."
        );
      }

      const { data, error } =
        await supabase.functions.invoke(
          "create-connect-onboarding",
          {
            body: {},
            headers: {
              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },
          }
        );

      if (error) {
        const functionMessage =
          await readFunctionError(error);

        throw new Error(
          functionMessage ||
            "Nie udało się połączyć ze Stripe."
        );
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const nextStatus =
        await refreshConnectStatus();

      if (
        data?.status === "ready" ||
        nextStatus === "ready"
      ) {
        setConnectFeedback({
          type: "success",
          text: "Konto Stripe jest połączone i gotowe do otrzymywania wypłat.",
        });
        return;
      }

      if (
        redirectToStripe &&
        data?.onboarding_url
      ) {
        window.location.assign(
          data.onboarding_url
        );
        return;
      }

      setConnectFeedback({
        type: "info",
        text: returningFromStripe
          ? "Konfiguracja Stripe nie jest jeszcze kompletna. Możesz ją teraz dokończyć."
          : "Dokończ dane wymagane przez Stripe.",
      });
    } catch (error) {
      console.error(
        "CONNECT ONBOARDING ERROR:",
        error
      );

      setConnectFeedback({
        type: "error",
        text:
          error?.message ||
          "Nie udało się przygotować konfiguracji Stripe.",
      });
    } finally {
      setConnectActionLoading(false);
    }
  }

  function toggleSpecialtyCategory(
    category
  ) {
    setMessage("");

    setSpecialtyCategories(
      (current) => {
        if (
          current.includes(
            category
          )
        ) {
          return current.filter(
            (item) =>
              item !== category
          );
        }

        if (current.length >= 3) {
          setMessage(
            "Możesz wybrać maksymalnie 3 kategorie specjalizacji."
          );
          return current;
        }

        return [
          ...current,
          category,
        ];
      }
    );
  }

  function addSkill() {
    const cleanSkill =
      skillDraft
        .trim()
        .replace(/\s+/g, " ");

    setMessage("");

    if (!cleanSkill) return;

    if (skills.length >= 12) {
      setMessage(
        "Możesz dodać maksymalnie 12 umiejętności."
      );
      return;
    }

    if (
      skills.some(
        (skill) =>
          skill.toLocaleLowerCase(
            "pl-PL"
          ) ===
          cleanSkill.toLocaleLowerCase(
            "pl-PL"
          )
      )
    ) {
      setMessage(
        "Ta umiejętność jest już dodana."
      );
      return;
    }

    setSkills((current) => [
      ...current,
      cleanSkill,
    ]);
    setSkillDraft("");
  }

  function handleSkillKeyDown(
    event
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addSkill();
    }
  }

  function removeSkill(skillToRemove) {
    setSkills(
      (current) =>
        current.filter(
          (skill) =>
            skill !== skillToRemove
        )
    );
  }

  const displayName =
    name ||
    user.email?.split("@")[0] ||
    "Użytkownik";

  const initial =
    displayName
      .charAt(0)
      .toUpperCase();

  const connectCopy = {
    not_started: {
      label: "Niepołączone",
      title: "Skonfiguruj bezpieczne wypłaty",
      description:
        "Połącz konto ze Stripe, aby w przyszłości otrzymywać pieniądze za zrealizowane zlecenia.",
      action: "Połącz konto Stripe",
    },
    in_progress: {
      label: "Do dokończenia",
      title: "Dokończ konfigurację wypłat",
      description:
        "Konto zostało utworzone. Uzupełnij informacje wymagane przez Stripe.",
      action: "Dokończ konfigurację",
    },
    restricted: {
      label: "Wymaga działania",
      title: "Uzupełnij dane konta Stripe",
      description:
        "Stripe wymaga uzupełnienia lub poprawienia informacji przed uruchomieniem wypłat.",
      action: "Uzupełnij dane",
    },
    ready: {
      label: "Gotowe",
      title: "Konto Stripe jest połączone",
      description:
        "Twoje konto przeszło konfigurację i jest gotowe do otrzymywania wypłat.",
      action: "Konto połączone",
    },
    disabled: {
      label: "Wyłączone",
      title: "Wypłaty są niedostępne",
      description:
        "Konto Stripe zostało wyłączone. Skontaktuj się z pomocą IdeaHire.",
      action: "Wypłaty niedostępne",
    },
  };

  const currentConnectCopy =
    connectCopy[connectStatus] ||
    connectCopy.not_started;

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

              {countryCode && (
                <CountryBadge
                  countryCode={countryCode}
                />
              )}

              {isAdult && (
                <span className="account-age-status">Pełne konto · 18+</span>
              )}
            </div>
          </div>

          {isAdult && (
            <section
              className={`stripe-connect-panel is-${connectStatus}`}
              aria-labelledby="stripe-connect-title"
            >
              <div className="stripe-connect-icon" aria-hidden="true">
                <span>→</span>
              </div>

              <div className="stripe-connect-content">
                <div className="stripe-connect-heading">
                  <div>
                    <span className="stripe-connect-eyebrow">
                      Wypłaty dla wykonawcy
                    </span>

                    <h2 id="stripe-connect-title">
                      {connectStatusLoading
                        ? "Sprawdzamy połączenie ze Stripe..."
                        : currentConnectCopy.title}
                    </h2>
                  </div>

                  <span className={`stripe-connect-status is-${connectStatus}`}>
                    {connectStatusLoading
                      ? "Sprawdzanie"
                      : currentConnectCopy.label}
                  </span>
                </div>

                <p>
                  {connectStatusLoading
                    ? "Pobieramy aktualny status konfiguracji wypłat."
                    : currentConnectCopy.description}
                </p>

                {connectFeedback && (
                  <p
                    className={`stripe-connect-feedback is-${connectFeedback.type}`}
                    role="status"
                  >
                    {connectFeedback.text}
                  </p>
                )}

                <div className="stripe-connect-footer">
                  <button
                    type="button"
                    className="stripe-connect-button"
                    onClick={() =>
                      handleConnectOnboarding()
                    }
                    disabled={
                      connectStatusLoading ||
                      connectActionLoading ||
                      connectStatus === "ready" ||
                      connectStatus === "disabled"
                    }
                  >
                    {connectActionLoading
                      ? "Łączenie ze Stripe..."
                      : currentConnectCopy.action}

                    {connectStatus !== "ready" &&
                      connectStatus !== "disabled" && (
                        <span aria-hidden="true">↗</span>
                      )}
                  </button>

                  <small>
                    Formularz otworzy się na bezpiecznej stronie Stripe.
                    IdeaHire nie przechowuje danych Twojego rachunku bankowego.
                  </small>
                </div>
              </div>
            </section>
          )}

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
                required
              />
            </label>

            <label>
              O mnie

              <textarea
                className="ideahire-multiline-field ideahire-about-field"
                rows="5"
                value={about}
                onChange={(event) =>
                  setAbout(
                    event.target.value
                  )
                }
                maxLength={1000}
                placeholder="Napisz kilka słów o sobie..."
              />

              <small>
                Opis będzie widoczny
                na Twoim profilu.
              </small>
            </label>

            <fieldset className="profile-specialties-field">
              <legend>
                Kategorie specjalizacji
              </legend>

              <p className="profile-field-hint">
                Wybierz maksymalnie 3 obszary, w których najlepiej się odnajdujesz.
              </p>

              <div className="profile-category-options">
                {JOB_CATEGORIES.map(
                  (category) => {
                    const selected =
                      specialtyCategories.includes(
                        category
                      );

                    return (
                      <button
                        key={category}
                        type="button"
                        className={`profile-category-option ${
                          selected
                            ? "is-selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleSpecialtyCategory(
                            category
                          )
                        }
                        disabled={
                          saving ||
                          uploading ||
                          profileDetailsLoading
                        }
                        aria-pressed={selected}
                      >
                        <span aria-hidden="true">
                          {selected
                            ? "✓"
                            : "+"}
                        </span>

                        {category}
                      </button>
                    );
                  }
                )}
              </div>

              <small>
                Wybrano: {specialtyCategories.length}/3
              </small>
            </fieldset>

            <fieldset className="profile-skills-field">
              <legend>
                Umiejętności
              </legend>

              <p className="profile-field-hint">
                Dodaj konkretne narzędzia i umiejętności. Każda pozycja pojawi się na profilu jako osobny kafelek.
              </p>

              <div className="profile-skill-entry">
                <input
                  type="text"
                  value={skillDraft}
                  onChange={(event) =>
                    setSkillDraft(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleSkillKeyDown
                  }
                  maxLength={40}
                  placeholder="Np. Adobe Illustrator"
                  disabled={
                    saving ||
                    uploading ||
                    profileDetailsLoading
                  }
                />

                <button
                  type="button"
                  className="profile-add-skill"
                  onClick={addSkill}
                  disabled={
                    !skillDraft.trim() ||
                    skills.length >= 12 ||
                    saving ||
                    uploading ||
                    profileDetailsLoading
                  }
                >
                  Dodaj
                </button>
              </div>

              {skills.length > 0 && (
                <div className="profile-edit-skill-chips">
                  {skills.map(
                    (skill) => (
                      <span
                        className="profile-edit-skill-chip"
                        key={skill}
                      >
                        {skill}

                        <button
                          type="button"
                          onClick={() =>
                            removeSkill(
                              skill
                            )
                          }
                          aria-label={`Usuń umiejętność: ${skill}`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  )}
                </div>
              )}

              <small>
                Dodano: {skills.length}/12. Naciśnij Enter lub przecinek, aby szybko dodać pozycję.
              </small>
            </fieldset>

            <label>
              W czym się specjalizujesz?

              <textarea
                className="ideahire-multiline-field ideahire-specialization-field"
                rows="5"
                value={specialization}
                onChange={(event) =>
                  setSpecialization(
                    event.target.value
                  )
                }
                maxLength={1200}
                placeholder="Np. tworzę nowoczesne strony internetowe, projektuję identyfikację wizualną i dbam o czytelne doświadczenie użytkownika..."
                disabled={
                  saving ||
                  uploading ||
                  profileDetailsLoading
                }
              />

              <small>
                Opisz konkretnie swoje najmocniejsze umiejętności, doświadczenie i rodzaj projektów, które realizujesz.
              </small>
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

            <label>
              Skąd jesteś?

              <CountryPicker
                value={countryCode}
                onChange={(country) =>
                  setCountryCode(
                    country?.code || ""
                  )
                }
                disabled={
                  saving ||
                  uploading ||
                  countryLoading
                }
              />

              <small>
                Wybierz kraj, który będzie
                widoczny na Twoim profilu.
              </small>
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
                uploading ||
                profileDetailsLoading
              }
            >
              {saving
                ? "Zapisywanie..."
                : "Zapisz zmiany →"}
            </button>
          </form>
        </section>

        <section className="privacy-entry-card" aria-labelledby="privacy-entry-title">
          <div className="privacy-entry-icon" aria-hidden="true">◉</div>
          <div className="privacy-entry-copy">
            <span className="section-label">Prywatność</span>
            <h2 id="privacy-entry-title">Twoje dane w IdeaHire</h2>
            <p>
              Sprawdź swoje prawa albo wyślij bezpieczny wniosek dotyczący
              dostępu, kopii, poprawienia, ograniczenia lub usunięcia danych.
            </p>
          </div>
          <Link className="privacy-entry-link" to="/privacy-center">
            Otwórz centrum prywatności →
          </Link>
        </section>

        <section className="account-card my-jobs-section">
          <span className="section-label">
            Moje zlecenia
          </span>

          <h2>
            Zlecenia, które
            opublikowałeś
          </h2>

          {jobsLoading ? (
            <p>
              Ładowanie zleceń...
            </p>
          ) : myJobs.length ===
            0 ? (
            <p>
              Nie masz jeszcze
              żadnych zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {myJobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <span className="section-label">
                      {job.category}
                    </span>

                    <h2>
                      {job.title}
                    </h2>

                    <p>
                      Budżet:{" "}
                      <strong>
                        {Number(
                          job.budget ||
                            0
                        ).toLocaleString(
                          "pl-PL"
                        )}{" "}
                        zł
                      </strong>
                    </p>

                    <div className="job-actions">
                      <Link
                        className="btn btn-dark"
                        to={`/edit-job/${job.id}`}
                      >
                        Edytuj
                      </Link>

                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() =>
                          handleDeleteJob(
                            job.id
                          )
                        }
                      >
                        Usuń
                      </button>
                    </div>
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
   PRIVACY CENTER — USER
========================================================= */

function formatPrivacyRequestNumber(value) {
  return `RODO-${String(value || 0).padStart(6, "0")}`;
}

function isPrivacyRequestOpen(status) {
  return ![
    "completed",
    "partially_completed",
    "rejected",
    "withdrawn",
  ].includes(status);
}

const ERASURE_ACTION_LABELS = {
  minimize_data: "Usuń dane możliwe do usunięcia",
  close_account: "Usuń dane i zamknij konto",
};

const ERASURE_ACTION_DESCRIPTIONS = {
  minimize_data:
    "IdeaHire usunie lub zanonimizuje pełny możliwy zakres danych: dane profilu, zdjęcia, opcjonalne metadane, ustawienia oraz niepowiązane dane operacyjne. Konto logowania pozostanie aktywne.",
  close_account:
    "IdeaHire usunie lub zanonimizuje możliwe dane i wyłączy możliwość logowania do konta.",
};

const ERASURE_CASE_STATUS_LABELS = {
  awaiting_owner: "Oczekuje na zatwierdzenie ownera",
  authorized: "Zatwierdzona — gotowa do wykonania",
  processing: "Operacja w toku",
  completed: "Operacja zakończona",
  partially_completed: "Operacja wykonana częściowo",
  rejected: "Operacja odrzucona",
  failed: "Wymaga interwencji administratora",
  cancelled: "Operacja anulowana",
};

const ERASURE_LIFECYCLE_LABELS = {
  active: "Konto aktywne",
  erasure_pending: "Analiza usunięcia danych",
  data_minimized: "Dane zminimalizowane",
  closure_pending: "Zamykanie konta",
  closed: "Konto zamknięte",
};

const ERASURE_INVENTORY_LABELS = {
  private_profile_rows: "Prywatny profil",
  public_profile_rows: "Profil publiczny",
  avatar_objects: "Zdjęcia profilowe",
  age_profile_rows: "Dane wieku",
  user_preference_rows: "Ustawienia rozmów",
  block_rows: "Ustawienia blokad",
  dispute_notifications: "Niepotrzebne powiadomienia o sporach",
  removable_job_applications: "Niepowiązane zgłoszenia do zleceń",
  removable_messages: "Wiadomości bez podstawy dalszej retencji",
  removable_conversations: "Puste rozmowy bez rozliczeń i sporów",
  removable_jobs: "Zlecenia bez zgłoszeń i współpracy",
  unused_stripe_rows: "Nieużywane wpisy konfiguracji wypłat",
  auth_optional_metadata: "Opcjonalne metadane konta",
  browser_local_preferences: "Dane zapisane lokalnie w przeglądarce",
  auth_login_account: "Konto i identyfikator logowania",
  legal_acceptances: "Potwierdzenia dokumentów prawnych",
  privacy_requests_open: "Otwarte wnioski RODO",
  payments_total: "Rekordy płatności",
  disputes_total: "Sprawy sporne",
  conversations_total: "Rozmowy związane ze współpracą",
  messages_total: "Wiadomości związane ze współpracą",
  agreements_total: "Ustalenia i umowy",
  job_applications_total: "Zgłoszenia do zleceń",
  jobs_total: "Opublikowane zlecenia",
};

const ERASURE_EXECUTION_RESULT_LABELS = {
  avatar_objects_removed: "Usunięte pliki zdjęć profilowych",
  profile_rows_anonymized: "Zanonimizowane profile prywatne",
  public_profile_rows_anonymized: "Zanonimizowane profile publiczne",
  age_rows_minimized: "Wyczyszczone rekordy wieku",
  preference_rows_deleted: "Usunięte ustawienia rozmów",
  block_rows_deleted: "Usunięte ustawienia blokad",
  dispute_notifications_deleted: "Usunięte powiadomienia o sporach",
  job_applications_deleted: "Usunięte niepowiązane zgłoszenia",
  messages_deleted: "Usunięte wiadomości bez podstawy retencji",
  conversations_deleted: "Usunięte puste rozmowy",
  jobs_deleted: "Usunięte niepowiązane zlecenia",
  unused_stripe_rows_deleted: "Usunięte nieużywane wpisy wypłat",
};

function buildErasureExecutionRows(executionResult) {
  if (!executionResult || typeof executionResult !== "object") {
    return [];
  }

  const dataResult =
    executionResult.data_minimization &&
    typeof executionResult.data_minimization === "object"
      ? executionResult.data_minimization
      : {};

  const normalizedResult = {
    avatar_objects_removed:
      executionResult.avatar_objects_removed,
    profile_rows_anonymized:
      dataResult.profile_rows_anonymized ??
      dataResult.profile_rows,
    public_profile_rows_anonymized:
      dataResult.public_profile_rows_anonymized ??
      dataResult.public_profile_rows,
    age_rows_minimized:
      dataResult.age_rows_minimized ??
      dataResult.age_rows,
    preference_rows_deleted:
      dataResult.preference_rows_deleted,
    block_rows_deleted:
      dataResult.block_rows_deleted,
    dispute_notifications_deleted:
      dataResult.dispute_notifications_deleted,
    job_applications_deleted:
      dataResult.job_applications_deleted,
    messages_deleted:
      dataResult.messages_deleted,
    conversations_deleted:
      dataResult.conversations_deleted,
    jobs_deleted:
      dataResult.jobs_deleted,
    unused_stripe_rows_deleted:
      dataResult.unused_stripe_rows_deleted,
  };

  return Object.entries(normalizedResult)
    .filter(([, value]) => (
      value !== null &&
      value !== undefined &&
      Number.isFinite(Number(value))
    ))
    .map(([key, value]) => ({
      key,
      label:
        ERASURE_EXECUTION_RESULT_LABELS[key] || key,
      value: Number(value),
    }));
}

const ERASURE_BLOCKER_LABELS = {
  active_staff_account: "Aktywna rola administracyjna",
  published_jobs: "Opublikowane zlecenia",
  pending_job_applications: "Oczekujące zgłoszenia do zleceń",
  active_payments: "Aktywne lub nierozliczone płatności",
  active_disputes: "Aktywne spory",
  active_agreements_without_terminal_payment:
    "Aktywne ustalenia bez zamkniętego rozliczenia",
  active_moderation_cases: "Aktywne sprawy moderacyjne",
  other_open_privacy_requests: "Inne otwarte wnioski dotyczące prywatności",
  connected_stripe_accounts: "Połączone konto Stripe",
};

const ERASURE_BLOCKER_GUIDANCE = {
  active_staff_account:
    "Owner musi najpierw bezpiecznie odebrać rolę administracyjną i przekazać prowadzone sprawy.",
  published_jobs:
    "Zakończ albo usuń opublikowane zlecenia, które nie są już potrzebne.",
  pending_job_applications:
    "Wycofaj oczekujące zgłoszenia albo poczekaj na ich rozstrzygnięcie.",
  active_payments:
    "Poczekaj na zakończenie, zwrot lub pełne rozliczenie każdej płatności.",
  active_disputes:
    "Najpierw zakończ aktywne postępowania sporne.",
  active_agreements_without_terminal_payment:
    "Zakończ współpracę i rozliczenie powiązane z zaakceptowanymi ustaleniami.",
  active_moderation_cases:
    "Poczekaj na zakończenie sprawy moderacyjnej lub rozstrzygnięcie odwołania.",
  other_open_privacy_requests:
    "Zakończ albo wycofaj pozostałe otwarte wnioski w sekcji „Twoje wnioski”.",
  connected_stripe_accounts:
    "Dokończ rozliczenia i odłącz konto wypłat Stripe.",
};

function ErasureBlockerList({ blockers }) {
  if (!Array.isArray(blockers) || blockers.length === 0) return null;

  return (
    <ul className="erasure-blocker-list">
      {blockers.map(([key, value]) => (
        <li key={key}>
          <span className="erasure-blocker-count" aria-label="Liczba przeszkód">
            {typeof value === "number" ? value : "!"}
          </span>
          <span>
            <strong>{ERASURE_BLOCKER_LABELS[key] || "Inna aktywna sprawa"}</strong>
            <small>
              {ERASURE_BLOCKER_GUIDANCE[key]
                || "Skontaktuj się z administracją, aby ustalić sposób zakończenia tej sprawy."}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

function getSecurityReviewProgress(status) {
  if (status === "submitted") {
    return {
      title: "Wniosek czeka na przypisanie",
      description: "Po przejęciu sprawy administrator rozpocznie kontrolę 12 obszarów ochrony danych.",
    };
  }

  if (status === "identity_verification") {
    return {
      title: "Trwa weryfikacja zakresu",
      description: "Możemy poprosić o dodatkowe informacje potrzebne do bezpiecznego przeprowadzenia analizy.",
    };
  }

  if (status === "in_progress") {
    return {
      title: "Administrator prowadzi analizę",
      description: "Po zatwierdzeniu otrzymasz na swoim koncie pełny raport przeznaczony dla Ciebie wraz z wynikiem 12 punktów.",
    };
  }

  if (status === "awaiting_user") {
    return {
      title: "Potrzebujemy Twojej odpowiedzi",
      description: "Sprawdź historię sprawy poniżej i uzupełnij informacje wskazane przez administratora.",
    };
  }

  if (status === "completed") {
    return {
      title: "Analiza została zakończona",
      description: "Zatwierdzony raport i cała historia sprawy pozostają dostępne poniżej.",
    };
  }

  return null;
}

function PrivacyCenter() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [eventsByRequest, setEventsByRequest] = useState({});
  const [reportsByRequest, setReportsByRequest] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [erasureEligibility, setErasureEligibility] = useState(null);
  const [erasureEligibilityLoading, setErasureEligibilityLoading] = useState(false);
  const [erasureEligibilityError, setErasureEligibilityError] = useState("");
  const [erasureEligibilityRefresh, setErasureEligibilityRefresh] = useState(0);
  const [form, setForm] = useState({
    requestType: "access",
    preferredFormat: "electronic",
    description: "",
    requestedErasureAction: "",
  });

  async function loadPrivacyRequests() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("ideahire_privacy_requests")
      .select(
        "id, request_number, request_type, requested_erasure_action, description, preferred_format, status, identity_status, submitted_at, due_at, extended_due_at, extension_reason, decision_summary, updated_at, completed_at, requester_closed_at, withdrawn_at"
      )
      .eq("requester_user_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    const rows = data || [];
    setRequests(rows);

    if (rows.length === 0) {
      setEventsByRequest({});
      setReportsByRequest({});
      return;
    }

    const [eventsResult, reportsResult] = await Promise.all([
      supabase
        .from("ideahire_privacy_request_events")
        .select("id, request_id, actor_role, event_type, message, created_at")
        .in("request_id", rows.map((item) => item.id))
        .order("created_at", { ascending: true }),
      supabase.rpc("get_my_ideahire_privacy_audits"),
    ]);

    if (eventsResult.error) throw eventsResult.error;
    if (reportsResult.error) throw reportsResult.error;

    setEventsByRequest(
      (eventsResult.data || []).reduce((result, event) => {
        if (!result[event.request_id]) result[event.request_id] = [];
        result[event.request_id].push(event);
        return result;
      }, {})
    );

    setReportsByRequest(Object.fromEntries(
      (Array.isArray(reportsResult.data) ? reportsResult.data : [])
        .map((report) => [report.request_id, report])
    ));
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadPrivacyRequests();
      } catch (error) {
        if (mounted) {
          setMessage(
            cleanSupabaseError(
              error,
              "Nie udało się pobrać Twoich wniosków dotyczących prywatności."
            )
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || form.requestType !== "erasure") {
      setErasureEligibility(null);
      setErasureEligibilityError("");
      setErasureEligibilityLoading(false);
      return;
    }

    let mounted = true;

    async function loadErasureEligibility() {
      setErasureEligibilityLoading(true);
      setErasureEligibilityError("");

      const { data, error } = await supabase.rpc(
        "get_my_ideahire_erasure_eligibility"
      );

      if (!mounted) return;

      if (error) {
        console.error("ERASURE ELIGIBILITY ERROR:", error);
        setErasureEligibility(null);
        setErasureEligibilityError(
          "Nie udało się teraz sprawdzić warunków zamknięcia konta."
        );
      } else {
        setErasureEligibility(data || null);

        if (!data?.can_close_account) {
          setForm((current) => current.requestedErasureAction === "close_account"
            ? { ...current, requestedErasureAction: "" }
            : current);
        }
      }

      setErasureEligibilityLoading(false);
    }

    loadErasureEligibility();

    return () => {
      mounted = false;
    };
  }, [user?.id, form.requestType, erasureEligibilityRefresh]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshPrivacyCenter = () => {
      loadPrivacyRequests().catch((error) => {
        setMessage(cleanSupabaseError(
          error,
          "Nie udało się odświeżyć historii sprawy."
        ));
      });
    };

    const channel = supabase
      .channel(`privacy-center-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_privacy_requests",
          filter: `requester_user_id=eq.${user.id}`,
        },
        refreshPrivacyCenter
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_privacy_request_events",
        },
        refreshPrivacyCenter
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.description.trim().length < 20) {
      setMessage("Opisz wniosek w co najmniej 20 znakach.");
      return;
    }

    if (
      form.requestType === "erasure"
      && !["minimize_data", "close_account"].includes(
        form.requestedErasureAction
      )
    ) {
      setMessage("Wybierz, czy chcesz usunąć możliwe dane, czy zamknąć całe konto.");
      return;
    }

    if (
      form.requestType === "erasure"
      && form.requestedErasureAction === "close_account"
      && erasureEligibility?.can_close_account !== true
    ) {
      setMessage("Zamknięcie konta nie jest teraz dostępne. Zakończ wskazane sprawy albo wybierz usunięcie możliwych danych.");
      return;
    }

    setBusy("submit");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "submit_ideahire_privacy_request",
        {
          p_request_type: form.requestType,
          p_description: form.description.trim(),
          p_preferred_format: form.preferredFormat,
          p_requested_erasure_action:
            form.requestType === "erasure"
              ? form.requestedErasureAction
              : null,
        }
      );

      if (error) throw error;

      setForm({
        requestType: "access",
        preferredFormat: "electronic",
        description: "",
        requestedErasureAction: "",
      });
      setMessage("Wniosek został bezpiecznie zapisany i przekazany administracji IdeaHire.");
      await loadPrivacyRequests();
    } catch (error) {
      setMessage(
        cleanSupabaseError(error, "Nie udało się wysłać wniosku.")
      );
    } finally {
      setBusy("");
    }
  }

  async function handleWithdraw(requestId) {
    const confirmed = window.confirm(
      "Czy na pewno chcesz wycofać ten wniosek? Historia jego obsługi pozostanie zapisana."
    );

    if (!confirmed) return;

    setBusy(requestId);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "withdraw_my_ideahire_privacy_request",
        { p_request_id: requestId }
      );

      if (error) throw error;

      setMessage("Wniosek został wycofany.");
      await loadPrivacyRequests();
    } catch (error) {
      setMessage(
        cleanSupabaseError(error, "Nie udało się wycofać wniosku.")
      );
    } finally {
      setBusy("");
    }
  }

  async function handlePrivacyReply(event, requestId) {
    event.preventDefault();
    const reply = (replyDrafts[requestId] || "").trim();

    if (reply.length < 3) {
      setMessage("Wiadomość musi mieć co najmniej 3 znaki.");
      return;
    }

    setBusy(`${requestId}:reply`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "reply_to_my_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_message: reply,
        }
      );

      if (error) throw error;

      setReplyDrafts((current) => ({ ...current, [requestId]: "" }));
      setMessage("Twoja wiadomość została przekazana administratorowi.");
      await loadPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się wysłać wiadomości."));
    } finally {
      setBusy("");
    }
  }

  async function handleClosePrivacyReview(requestId, hasApprovedReport) {
    const confirmed = window.confirm(
      hasApprovedReport
        ? "Czy na pewno chcesz zamknąć analizę? Raport i historia pozostaną dostępne. Zamknięcie nie oznacza zrzeczenia się praw dotyczących Twoich danych ani potwierdzenia zgodności IdeaHire z prawem."
        : "Czy na pewno chcesz zakończyć analizę przed opublikowaniem raportu? Administrator zobaczy, że sprawa została zamknięta przez Ciebie. Historia pozostanie zapisana, ale raport nie zostanie dostarczony w ramach tej sprawy. Nie ogranicza to Twoich praw dotyczących danych."
    );

    if (!confirmed) return;

    setBusy(`${requestId}:close-review`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "close_my_ideahire_privacy_review",
        { p_request_id: requestId }
      );

      if (error) throw error;

      setMessage(
        hasApprovedReport
          ? "Analiza została przez Ciebie zamknięta. Raport i historia pozostają dostępne."
          : "Analiza została przez Ciebie zamknięta. Administrator od razu zobaczy jej nowy status, a historia pozostanie zachowana."
      );
      await loadPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zamknąć analizy."));
    } finally {
      setBusy("");
    }
  }

  const erasureBlockers = Object.entries(
    erasureEligibility?.blockers || {}
  ).filter(([, value]) => value === true || Number(value) > 0);

  const erasureEligibilityPending = Boolean(
    form.requestType === "erasure"
    && !erasureEligibility
    && !erasureEligibilityError
  ) || erasureEligibilityLoading;

  const canSelectAccountClosure = Boolean(
    !erasureEligibilityPending
    && !erasureEligibilityError
    && erasureEligibility?.can_close_account === true
  );

  return (
    <div className="page privacy-center-page">
      <AccountNavbar />

      <main className="privacy-center-shell">
        <header className="privacy-center-header">
          <div>
            <span className="section-label">Prywatność i moje dane</span>
            <h1>Centrum prywatności</h1>
            <p>
              Wyślij wniosek dotyczący swoich danych i śledź jego realizację
              bezpośrednio na koncie IdeaHire.
            </p>
          </div>
          <Link className="privacy-back-link" to="/account">
            ← Wróć do konta
          </Link>
        </header>

        <section className="privacy-trust-panel">
          <div className="privacy-trust-mark" aria-hidden="true">✓</div>
          <div>
            <strong>Bezpieczna obsługa wniosku</strong>
            <p>
              Wniosek jest przypisany do zalogowanego konta. Możemy poprosić
              o dodatkową weryfikację wyłącznie wtedy, gdy pojawią się
              uzasadnione wątpliwości dotyczące tożsamości.
            </p>
          </div>
        </section>

        <div className="privacy-center-grid">
          <section className="privacy-request-form-card">
            <span className="privacy-card-number">01</span>
            <h2>Złóż nowy wniosek</h2>
            <p>
              {form.requestType === "security_review"
                ? "Poproś o techniczną i organizacyjną analizę ochrony danych powiązanych z Twoim kontem."
                : "Opisz dokładnie, czego potrzebujesz. Standardowy termin odpowiedzi wynosi jeden miesiąc od otrzymania wniosku."}
            </p>

            <form className="privacy-request-form" onSubmit={handleSubmit}>
              <label>
                Rodzaj wniosku
                <select
                  value={form.requestType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requestType: event.target.value,
                      requestedErasureAction: "",
                    }))
                  }
                  disabled={Boolean(busy)}
                >
                  {PRIVACY_REQUEST_TYPES.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                Preferowany format odpowiedzi
                <select
                  value={form.preferredFormat}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      preferredFormat: event.target.value,
                    }))
                  }
                  disabled={Boolean(busy)}
                >
                  {PRIVACY_RESPONSE_FORMATS.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                Opis wniosku
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder={form.requestType === "security_review"
                    ? "Napisz, które dane, funkcje konta albo zdarzenia związane z bezpieczeństwem mamy objąć analizą..."
                    : "Napisz, jakich danych lub działań dotyczy Twój wniosek..."}
                  minLength={20}
                  maxLength={5000}
                  rows={6}
                  disabled={Boolean(busy)}
                  required
                />
                <small>{form.description.length}/5000 · minimum 20 znaków</small>
              </label>

              {form.requestType === "erasure" && (
                <fieldset className="privacy-erasure-choice-fieldset">
                  <legend>Co dokładnie mamy zrobić?</legend>
                  <p className="privacy-erasure-choice-intro">
                    Twój wybór zostanie zapisany we wniosku i administracja nie
                    będzie mogła samodzielnie zmienić go na inną operację.
                  </p>

                  <div className="privacy-erasure-choice-grid">
                    <label className={`privacy-erasure-choice${
                      form.requestedErasureAction === "minimize_data"
                        ? " is-selected"
                        : ""
                    }`}>
                      <input
                        type="radio"
                        name="requested-erasure-action"
                        value="minimize_data"
                        checked={form.requestedErasureAction === "minimize_data"}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          requestedErasureAction: event.target.value,
                        }))}
                        disabled={Boolean(busy)}
                      />
                      <span className="privacy-erasure-choice-mark" aria-hidden="true">01</span>
                      <span>
                        <strong>Usuń możliwe dane</strong>
                        <small>{ERASURE_ACTION_DESCRIPTIONS.minimize_data}</small>
                      </span>
                    </label>

                    <label className={`privacy-erasure-choice is-danger${
                      form.requestedErasureAction === "close_account"
                        ? " is-selected"
                        : ""
                    }${!canSelectAccountClosure ? " is-disabled" : ""}`}>
                      <input
                        type="radio"
                        name="requested-erasure-action"
                        value="close_account"
                        checked={form.requestedErasureAction === "close_account"}
                        onChange={(event) => setForm((current) => ({
                          ...current,
                          requestedErasureAction: event.target.value,
                        }))}
                        disabled={Boolean(busy) || !canSelectAccountClosure}
                      />
                      <span className="privacy-erasure-choice-mark" aria-hidden="true">02</span>
                      <span>
                        <strong>Usuń dane i zamknij konto</strong>
                        <small>{ERASURE_ACTION_DESCRIPTIONS.close_account}</small>
                      </span>
                    </label>
                  </div>

                  <div
                    className={`privacy-erasure-eligibility${
                      erasureEligibility?.can_close_account
                        ? " is-ready"
                        : erasureEligibilityError
                          ? " is-error"
                          : " is-blocked"
                    }`}
                    aria-live="polite"
                  >
                    {erasureEligibilityPending ? (
                      <p>Sprawdzamy zlecenia, sprawy i rozliczenia konta...</p>
                    ) : erasureEligibilityError ? (
                      <>
                        <strong>Nie można teraz sprawdzić warunków zamknięcia konta</strong>
                        <p>
                          Nie wysłaliśmy żądania zamknięcia konta. Spróbuj ponownie
                          albo wybierz usunięcie możliwych danych — konto logowania
                          pozostanie wtedy aktywne.
                        </p>
                        <button
                          type="button"
                          className="privacy-eligibility-refresh"
                          onClick={() => setErasureEligibilityRefresh((value) => value + 1)}
                          disabled={erasureEligibilityLoading || Boolean(busy)}
                        >
                          Sprawdź ponownie
                        </button>
                      </>
                    ) : erasureEligibility?.can_close_account ? (
                      <>
                        <strong>Konto spełnia warunki zamknięcia</strong>
                        <p>Nie znaleźliśmy aktywnych zleceń, spraw ani nierozliczonych transakcji.</p>
                      </>
                    ) : (
                      <>
                        <strong>Konta nie można jeszcze zamknąć</strong>
                        <p>
                          To zabezpiecza trwające współprace, rozliczenia oraz prawa
                          innych użytkowników. Zamknięcie stanie się dostępne po
                          rozwiązaniu poniższych spraw. Nadal możesz wybrać usunięcie
                          możliwych danych bez zamykania konta.
                        </p>
                        <ErasureBlockerList blockers={erasureBlockers} />
                        <button
                          type="button"
                          className="privacy-eligibility-refresh"
                          onClick={() => setErasureEligibilityRefresh((value) => value + 1)}
                          disabled={erasureEligibilityLoading || Boolean(busy)}
                        >
                          Sprawdź ponownie po rozwiązaniu spraw
                        </button>
                      </>
                    )}
                  </div>
                </fieldset>
              )}

              {form.requestType === "security_review" ? (
                <div className="privacy-form-notice is-security-review">
                  <strong>Jak działa analiza ochrony danych</strong>
                  <p>
                    Przypisany administrator sprawdzi 12 obszarów technicznych
                    i organizacyjnych. Wynik zostanie zweryfikowany wewnętrznie,
                    a zatwierdzony raport z wynikiem każdego punktu zobaczysz
                    wyłącznie na swoim koncie.
                    Ta analiza nie jest certyfikatem ani opinią prawną.
                  </p>
                </div>
              ) : form.requestType === "erasure" ? (
                <div className="privacy-form-notice">
                  <strong>Ważne przy usuwaniu danych</strong>
                  <p>
                    Złożenie wniosku nie powoduje natychmiastowego skasowania konta.
                    Najpierw sprawdzimy obowiązki dotyczące rozliczeń, sporów,
                    bezpieczeństwa i przechowywania wymaganych prawem danych.
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                className="privacy-primary-button"
                disabled={
                  Boolean(busy)
                  || form.description.trim().length < 20
                  || (
                    form.requestType === "erasure"
                    && !["minimize_data", "close_account"].includes(
                      form.requestedErasureAction
                    )
                  )
                  || (
                    form.requestedErasureAction === "close_account"
                    && !canSelectAccountClosure
                  )
                }
              >
                {busy === "submit" ? "Wysyłanie..." : "Wyślij bezpieczny wniosek →"}
              </button>
            </form>
          </section>

          <aside className="privacy-rights-card">
            <span className="privacy-card-number">02</span>
            <h2>Twoje prawa</h2>
            <ul>
              <li><strong>Dostęp i kopia</strong><span>Sprawdź, jakie dane przetwarzamy.</span></li>
              <li><strong>Sprostowanie</strong><span>Popraw dane nieprawidłowe lub nieaktualne.</span></li>
              <li><strong>Usunięcie</strong><span>Poproś o usunięcie danych, gdy zachodzą podstawy.</span></li>
              <li><strong>Ograniczenie i sprzeciw</strong><span>Zażądaj ograniczenia albo zgłoś sprzeciw.</span></li>
              <li><strong>Przenoszenie</strong><span>Odbierz właściwe dane w ustrukturyzowanym formacie.</span></li>
            </ul>
            <a href="/polityka-prywatnosci">Przeczytaj Politykę prywatności →</a>
            <small>
              Możesz również napisać na ideahireprywatnosc@gmail.com.
            </small>
          </aside>
        </div>

        {message && (
          <p className="privacy-page-message" role="status">{message}</p>
        )}

        <section className="privacy-history-section">
          <div className="privacy-section-heading">
            <div>
              <span className="section-label">Historia</span>
              <h2>Twoje wnioski</h2>
            </div>
            <span className="privacy-count-badge">{requests.length}</span>
          </div>

          {loading ? (
            <div className="privacy-empty-state">Ładowanie wniosków...</div>
          ) : requests.length === 0 ? (
            <div className="privacy-empty-state">
              <strong>Nie masz jeszcze żadnych wniosków</strong>
              <p>Po wysłaniu pierwszego wniosku jego status pojawi się tutaj.</p>
            </div>
          ) : (
            <div className="privacy-request-list">
              {requests.map((request) => {
                const deadline = request.extended_due_at || request.due_at;
                const events = eventsByRequest[request.id] || [];
                const report = reportsByRequest[request.id] || null;
                const reportChecksByKey = Object.fromEntries(
                  (report?.checks || []).map((check) => [check.check_key, check])
                );
                const securityReviewProgress = request.request_type !== "security_review"
                  ? null
                  : report && request.status === "awaiting_user"
                    ? {
                      title: "Raport czeka na Twoją decyzję",
                      description: "Przeczytaj pełny wynik, odpowiedz administratorowi albo potwierdź odbiór i zamknij analizę.",
                    }
                    : getSecurityReviewProgress(request.status);

                return (
                  <article className="privacy-request-card" key={request.id}>
                    <div className="privacy-request-topline">
                      <div>
                        <span>{formatPrivacyRequestNumber(request.request_number)}</span>
                        <h3>{getOptionLabel(PRIVACY_REQUEST_TYPES, request.request_type)}</h3>
                      </div>
                      <span className={`privacy-status-pill is-${
                        request.requester_closed_at ? "requester_closed" : request.status
                      }`}>
                        {request.requester_closed_at
                          ? "Zamknięta przez Ciebie"
                          : PRIVACY_REQUEST_STATUSES[request.status] || request.status}
                      </span>
                    </div>

                    <p className="privacy-request-description">{request.description}</p>

                    {request.request_type === "erasure" && (
                      <div className={`privacy-erasure-requested-action is-${
                        request.requested_erasure_action || "legacy"
                      }`}>
                        <span>Wybrana operacja</span>
                        <strong>
                          {request.requested_erasure_action
                            ? ERASURE_ACTION_LABELS[request.requested_erasure_action]
                            : "Starszy wniosek — wybór nie został zapisany"}
                        </strong>
                        <p>
                          {request.requested_erasure_action
                            ? ERASURE_ACTION_DESCRIPTIONS[request.requested_erasure_action]
                            : "Administracja musi potwierdzić zakres na podstawie treści i historii tego wniosku."}
                        </p>
                      </div>
                    )}

                    {securityReviewProgress && (
                      <div className="privacy-security-progress">
                        <strong>{securityReviewProgress.title}</strong>
                        <p>{securityReviewProgress.description}</p>
                      </div>
                    )}

                    <dl className="privacy-request-meta">
                      <div><dt>Wysłano</dt><dd>{formatDisputeDate(request.submitted_at)}</dd></div>
                      <div><dt>Termin odpowiedzi</dt><dd>{formatDisputeDate(deadline, false)}</dd></div>
                      <div><dt>Format</dt><dd>{getOptionLabel(PRIVACY_RESPONSE_FORMATS, request.preferred_format)}</dd></div>
                    </dl>

                    {request.extension_reason && (
                      <p className="privacy-extension-note">
                        <strong>Przedłużenie terminu:</strong> {request.extension_reason}
                      </p>
                    )}

                    {request.request_type === "security_review"
                      && isPrivacyRequestOpen(request.status) && (
                      <div className="privacy-user-acceptance-panel is-prominent">
                        <div>
                          <strong>
                            {report
                              ? "Raport jest opublikowany — decyzja należy do Ciebie"
                              : "To Ty decydujesz, czy analiza ma trwać dalej"}
                          </strong>
                          <p>
                            {report
                              ? "Możesz najpierw odpowiedzieć administratorowi albo od razu zamknąć analizę. Raport i historia nie znikną."
                              : "Możesz napisać do administratora albo zakończyć analizę przed publikacją raportu. Administrator od razu zobaczy, że sprawa została zamknięta przez Ciebie."}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="privacy-accept-button"
                          onClick={() => handleClosePrivacyReview(request.id, Boolean(report))}
                          disabled={Boolean(busy)}
                        >
                          {busy === `${request.id}:close-review`
                            ? "Zamykanie analizy..."
                            : "Zamknij analizę"}
                        </button>
                        <small>
                          {report
                            ? "Zamknięcie potwierdza odbiór raportu, ale nie ogranicza Twoich praw dotyczących danych osobowych i nie jest certyfikatem zgodności IdeaHire."
                            : "Zamknięcie przed publikacją kończy tę analizę bez raportu. Nie usuwa historii, nie ogranicza Twoich praw i nie uniemożliwia złożenia nowego wniosku w przyszłości."}
                        </small>
                      </div>
                    )}

                    {request.requester_closed_at && (
                      <div className="privacy-user-closed-banner" role="status">
                        <span aria-hidden="true">✓</span>
                        <div>
                          <strong>Sprawa zamknięta przez Ciebie</strong>
                          <p>
                            Zamknięto {formatDisputeDate(request.requester_closed_at)}.
                            {request.status === "withdrawn"
                              ? " Historia sprawy pozostaje dostępna na koncie."
                              : " Raport i historia pozostają dostępne na koncie."}
                          </p>
                        </div>
                      </div>
                    )}

                    {report && (
                      <section className="privacy-user-audit-report" aria-labelledby={`report-${request.id}`}>
                        <div className="privacy-user-audit-heading">
                          <div>
                            <span className="section-label">Zatwierdzony raport</span>
                            <h4 id={`report-${request.id}`}>Analiza ochrony Twoich danych</h4>
                          </div>
                          <span className={`privacy-user-risk is-${report.risk_level}`}>
                            Ryzyko: {getOptionLabel(PRIVACY_AUDIT_RISK_LEVELS, report.risk_level)}
                          </span>
                        </div>

                        <div className="privacy-user-report-intro">
                          <strong>Wniosek końcowy</strong>
                          <p>{report.summary}</p>
                          <small>Zatwierdzono: {formatDisputeDate(report.approved_at)}</small>
                        </div>

                        <div className="privacy-user-report-grid">
                          <article>
                            <span>01</span>
                            <div>
                              <h5>Zakres analizy</h5>
                              <p>{report.scope}</p>
                            </div>
                          </article>
                          <article>
                            <span>02</span>
                            <div>
                              <h5>Najważniejsze ustalenia</h5>
                              <p>{report.findings_summary}</p>
                            </div>
                          </article>
                          <article>
                            <span>03</span>
                            <div>
                              <h5>Działania i zalecenia</h5>
                              <p>{report.remediation_summary}</p>
                            </div>
                          </article>
                        </div>

                        <div className="privacy-user-checks-heading">
                          <div>
                            <span>Pełna checklista</span>
                            <p>Wynik i wyjaśnienie każdego z 12 sprawdzonych obszarów.</p>
                          </div>
                          <strong>12/12</strong>
                        </div>

                        <ol className="privacy-user-checklist">
                          {PRIVACY_AUDIT_CHECKS.map((definition, index) => {
                            const check = reportChecksByKey[definition.key];
                            const status = check?.status || "pending";

                            return (
                              <li className={`is-${status}`} key={definition.key}>
                                <span className="privacy-user-check-number">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <div>
                                  <div className="privacy-user-check-title">
                                    <h5>{definition.label}</h5>
                                    <span>{getOptionLabel(PRIVACY_AUDIT_CHECK_STATUSES, status)}</span>
                                  </div>
                                  <p>{check?.note || "Brak opisu punktu."}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ol>

                        <p className="privacy-user-report-boundary">
                          Raport pokazuje komplet ustaleń przeznaczonych dla Ciebie.
                          Surowe dane techniczne, informacje o innych osobach i szczegóły,
                          których ujawnienie mogłoby osłabić bezpieczeństwo, pozostają chronione.
                          Możesz poprosić administratora o wyjaśnienie każdego punktu poniżej.
                        </p>
                      </section>
                    )}

                    {request.decision_summary && !report && (
                      <p className="privacy-decision-note">
                        <strong>Odpowiedź IdeaHire:</strong> {request.decision_summary}
                      </p>
                    )}

                    {events.length > 0 && (
                      <details className="privacy-timeline">
                        <summary>Pokaż historię sprawy</summary>
                        <ol>
                          {events.map((item) => (
                            <li key={item.id}>
                              <div>
                                <strong>
                                  {item.actor_role === "requester"
                                    ? "Ty"
                                    : ["owner", "admin"].includes(item.actor_role)
                                      ? "IdeaHire"
                                      : "System"}
                                </strong>
                                <span>{item.message || "Status został zaktualizowany."}</span>
                              </div>
                              <time>{formatDisputeDate(item.created_at)}</time>
                            </li>
                          ))}
                        </ol>
                      </details>
                    )}

                    {isPrivacyRequestOpen(request.status) && (
                      <form
                        className="privacy-user-reply-form"
                        onSubmit={(event) => handlePrivacyReply(event, request.id)}
                      >
                        <label htmlFor={`privacy-reply-${request.id}`}>
                          {report ? "Odpowiedz administratorowi" : "Napisz do administratora"}
                        </label>
                        <p>
                          {report
                            ? "Wskaż punkt raportu, o który pytasz, albo opisz swoje zastrzeżenie. Wysłanie odpowiedzi nie zamyka analizy."
                            : "Uzupełnij informacje albo poproś o wyjaśnienie. Wiadomość zapisze się w historii sprawy."}
                        </p>
                        <textarea
                          id={`privacy-reply-${request.id}`}
                          value={replyDrafts[request.id] || ""}
                          onChange={(event) => setReplyDrafts((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))}
                          placeholder="Napisz wiadomość..."
                          minLength={3}
                          maxLength={5000}
                          rows={4}
                          disabled={Boolean(busy)}
                        />
                        <div>
                          <small>{(replyDrafts[request.id] || "").length}/5000</small>
                          <button
                            type="submit"
                            className="privacy-secondary-button"
                            disabled={Boolean(busy) || (replyDrafts[request.id] || "").trim().length < 3}
                          >
                            {busy === `${request.id}:reply`
                              ? "Wysyłanie..."
                              : "Wyślij wiadomość"}
                          </button>
                        </div>
                      </form>
                    )}

                    {isPrivacyRequestOpen(request.status)
                      && request.request_type !== "security_review" && (
                      <button
                        type="button"
                        className="privacy-withdraw-button"
                        onClick={() => handleWithdraw(request.id)}
                        disabled={Boolean(busy)}
                      >
                        {busy === request.id ? "Wycofywanie..." : "Wycofaj wniosek"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

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
    const digits =
      event.target.value.replace(
        /\D/g,
        ""
      );

    if (!digits) {
      setBudget("");

      if (
        message ===
        MAX_JOB_BUDGET_MESSAGE
      ) {
        setMessage("");
      }

      return;
    }

    const normalizedDigits =
      digits.replace(
        /^0+(?=\d)/,
        ""
      );

    if (
      Number(normalizedDigits) >
      MAX_JOB_BUDGET
    ) {
      setSuccess(false);
      setMessage(
        MAX_JOB_BUDGET_MESSAGE
      );
      return;
    }

    setBudget(normalizedDigits);

    if (
      message ===
      MAX_JOB_BUDGET_MESSAGE
    ) {
      setMessage("");
    }
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
        "Budżet musi być większy od 0."
      );

      return;
    }

    if (
      numericBudget >
      MAX_JOB_BUDGET
    ) {
      setMessage(
        MAX_JOB_BUDGET_MESSAGE
      );

      return;
    }

    if (!user?.id) {
      setMessage(
        "Twoja sesja wygasła."
      );

      return;
    }

    setSaving(true);

    try {
      /*
       * WAŻNE:
       * NIE DODAJEMY jobs.status.
       */

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
        if (
          error.code === "23514"
        ) {
          setMessage(
            MAX_JOB_BUDGET_MESSAGE
          );

          return;
        }

        setMessage(
          `Nie udało się opublikować zlecenia: ${error.message}`
        );

        return;
      }

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

      <style>{`
        .project-form .job-budget-limit-note {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 13px;
          margin-top: 3px;
          padding: 15px 16px;
          border: 1px solid #e1e1dc;
          border-radius: 15px;
          background: #f5f5f1;
          color: #555550;
        }

        .project-form .job-budget-limit-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #d7d7d1;
          border-radius: 50%;
          background: #ffffff;
          color: #62625d;
          font-size: 15px;
          font-style: normal;
          font-weight: 850;
        }

        .project-form .job-budget-limit-copy {
          min-width: 0;
        }

        .project-form .job-budget-limit-copy strong,
        .project-form .job-budget-limit-copy small {
          display: block;
        }

        .project-form .job-budget-limit-copy strong {
          color: #343431;
          font-size: 19px;
          line-height: 1.25;
          letter-spacing: -0.25px;
        }

        .project-form .job-budget-limit-copy small {
          margin-top: 4px;
          color: #777771;
          font-size: 12px;
          font-weight: 550;
          line-height: 1.5;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-note {
          border-color: #393935;
          background: #20201e;
          color: #b7b7b1;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-icon {
          border-color: #454540;
          background: #2a2a27;
          color: #eeeeea;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-copy strong {
          color: #f1f1ed !important;
        }

        html[data-theme="dark"] .project-form .job-budget-limit-copy small {
          color: #aaa9a3 !important;
        }

        @media (max-width: 600px) {
          .project-form .job-budget-limit-note {
            padding: 13px 14px;
          }

          .project-form .job-budget-limit-copy strong {
            font-size: 17px;
          }
        }
      `}</style>

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
          onSubmit={handleSubmit}
        >
          <label>
            Czego potrzebujesz?

            <textarea
              className="ideahire-multiline-field ideahire-title-field"
              rows="2"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
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
              className="ideahire-multiline-field ideahire-description-field"
              rows="6"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
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
              maxLength={5}
              aria-describedby="job-budget-help"
              aria-label="Budżet zlecenia, maksymalnie 15 000 zł"
              required
            />

            <div
              className="job-budget-limit-note"
              id="job-budget-help"
              role="note"
            >
              <i
                className="job-budget-limit-icon"
                aria-hidden="true"
              >
                i
              </i>

              <span className="job-budget-limit-copy">
                <strong>
                  Maksymalnie 15 000 zł
                </strong>

                <small>
                  Wyższej kwoty nie można wpisać ani opublikować. Cena po publikacji pozostaje zablokowana.
                </small>
              </span>
            </div>
          </label>

          {message && (
            <p
              className={
                success
                  ? "auth-message"
                  : "auth-error"
              }
              role={
                success
                  ? "status"
                  : "alert"
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
   EDIT JOB
========================================================= */

function EditJob() {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [job, setJob] =
    useState(null);

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

  const [saving, setSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    if (!user?.id || !id)
      return;

    async function loadJob() {
      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, created_at"
          )
          .eq("id", id)
          .eq(
            "user_id",
            user.id
          )
          .single();

      if (error) {
        setMessage(
          `Nie udało się pobrać zlecenia: ${error.message}`
        );

        setLoading(false);

        return;
      }

      setJob(data);
      setTitle(
        data.title || ""
      );
      setDescription(
        data.description || ""
      );
      setCategory(
        data.category ||
          JOB_CATEGORIES[0]
      );

      setLoading(false);
    }

    loadJob();
  }, [id, user?.id]);

  async function handleSave(
    event
  ) {
    event.preventDefault();

    if (
      !job ||
      !user?.id
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      /*
       * BUDŻET NIE JEST
       * AKTUALIZOWANY.
       */

      const {
        error,
      } =
        await supabase
          .from("jobs")
          .update({
            title:
              title.trim(),
            description:
              description.trim(),
            category,
          })
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
          `Nie udało się zapisać zmian: ${error.message}`
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
        `Nie udało się zapisać zmian: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!job) {
    return (
      <div className="page">
        <AccountNavbar />

        <main className="app-page">
          <p className="auth-error">
            {message ||
              "Nie znaleziono zlecenia."}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Edycja zlecenia
          </span>

          <h1>
            Edytuj zlecenie
          </h1>

          <p>
            Cena zlecenia
            pozostaje bez zmian.
          </p>
        </div>

        <form
          className="project-form"
          onSubmit={handleSave}
        >
          <label>
            Tytuł

            <textarea
              className="ideahire-multiline-field ideahire-title-field"
              rows="2"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
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
            Opis

            <textarea
              className="ideahire-multiline-field ideahire-description-field"
              rows="7"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              maxLength={2000}
              required
            />
          </label>

          <div className="fixed-budget-note">
            <strong>
              Budżet:
            </strong>{" "}
            {Number(
              job.budget || 0
            ).toLocaleString(
              "pl-PL"
            )}{" "}
            zł

            <br />

            <small>
              Cena została
              ustalona przy
              publikacji i nie
              może być edytowana.
            </small>
          </div>

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Zapisywanie..."
              : "Zapisz zmiany →"}
          </button>
        </form>
      </main>
    </div>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function Profile() {
  const { id } =
    useParams();

  const { user } =
    useAuth();

  const [profile, setProfile] =
    useState(null);

  const [countryCode, setCountryCode] =
    useState("");

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [blockedByMe, setBlockedByMe] =
    useState(false);

  const [blockedMe, setBlockedMe] =
    useState(false);

  const [blockSaving, setBlockSaving] =
    useState(false);

  const [blockMessage, setBlockMessage] =
    useState("");

  useEffect(() => {
    if (!id) return;

    async function loadProfile() {
      setLoading(true);

      try {
        const {
          data:
            profileData,
          error:
            profileError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about, specialty_categories, specialization, skills, completed_jobs, disputed_jobs, positive_reviews, neutral_reviews, negative_reviews, posted_jobs"
            )
            .eq("id", id)
            .single();

        if (profileError) {
          setMessage(
            `Nie udało się pobrać profilu: ${profileError.message}`
          );

          return;
        }

        setProfile(
          profileData
        );

        if (
          user?.id &&
          user.id !== id
        ) {
          const [
            blockedByMeResult,
            blockedMeResult,
          ] = await Promise.all([
            supabase
              .from("user_blocks")
              .select("id")
              .eq("blocker_id", user.id)
              .eq("blocked_id", id)
              .maybeSingle(),

            supabase
              .from("user_blocks")
              .select("id")
              .eq("blocker_id", id)
              .eq("blocked_id", user.id)
              .maybeSingle(),
          ]);

          if (blockedByMeResult.error) {
            console.error(
              "PROFILE BLOCK STATUS ERROR:",
              blockedByMeResult.error
            );
          }

          if (blockedMeResult.error) {
            console.error(
              "PROFILE BLOCKED STATUS ERROR:",
              blockedMeResult.error
            );
          }

          setBlockedByMe(
            !!blockedByMeResult.data?.id
          );

          setBlockedMe(
            !!blockedMeResult.data?.id
          );
        }

        const {
          data: countryData,
          error: countryError,
        } = await supabase
          .from("public_profiles")
          .select("country_code")
          .eq("user_id", id)
          .maybeSingle();

        if (countryError) {
          console.error(
            "PROFILE COUNTRY ERROR:",
            countryError
          );
        } else {
          setCountryCode(
            countryData?.country_code || ""
          );
        }

        const {
          data:
            jobsData,
          error:
            jobsError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, user_id, title, description, category, budget, created_at"
            )
            .eq(
              "user_id",
              id
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (jobsError) {
          console.error(
            "PROFILE JOBS ERROR:",
            jobsError
          );
        } else {
          setJobs(
            jobsData || []
          );
        }
      } catch (error) {
        setMessage(
          `Nie udało się pobrać profilu: ${
            error?.message ||
            "Nieznany błąd"
          }`
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id, user?.id]);

  async function handleBlockToggle(
    event
  ) {
    const menu =
      event?.currentTarget?.closest(
        "details"
      );

    if (
      !user?.id ||
      !id ||
      user.id === id ||
      blockSaving
    ) {
      return;
    }

    setBlockSaving(true);
    setBlockMessage("");

    try {
      if (blockedByMe) {
        const { error } =
          await supabase
            .from("user_blocks")
            .delete()
            .eq("blocker_id", user.id)
            .eq("blocked_id", id);

        if (error) {
          throw error;
        }

        setBlockedByMe(false);
        setBlockMessage(
          "Użytkownik został odblokowany."
        );
      } else {
        const { error } =
          await supabase
            .from("user_blocks")
            .insert({
              blocker_id: user.id,
              blocked_id: id,
            });

        if (error) {
          throw error;
        }

        setBlockedByMe(true);
        setBlockMessage(
          "Użytkownik został zablokowany. Nie może już wysyłać Ci wiadomości."
        );
      }
    } catch (error) {
      setBlockMessage(
        `Nie udało się zmienić blokady: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setBlockSaving(false);
      menu?.removeAttribute(
        "open"
      );
    }
  }

  if (loading) {
    return <LoadingScreen />;
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

  const name =
    profile.name ||
    "Użytkownik";

  const initial =
    name
      .charAt(0)
      .toUpperCase();

  const isOtherProfile =
    !!user?.id &&
    user.id !== id;

  const profileHidden =
    isOtherProfile &&
    (blockedByMe || blockedMe);

  const visibleSpecialtyCategories =
    Array.isArray(
      profile.specialty_categories
    )
      ? profile.specialty_categories.filter(
          (category) =>
            JOB_CATEGORIES.includes(
              category
            )
        )
      : [];

  const visibleSkills =
    Array.isArray(profile.skills)
      ? profile.skills.filter(
          (skill) =>
            typeof skill ===
              "string" &&
            !!skill.trim()
        )
      : [];

  const completedJobs =
    Math.max(
      0,
      Number(
        profile.completed_jobs
      ) || 0
    );

  const disputedJobs =
    Math.max(
      0,
      Number(
        profile.disputed_jobs
      ) || 0
    );

  const positiveReviews =
    Math.max(
      0,
      Number(
        profile.positive_reviews
      ) || 0
    );

  const neutralReviews =
    Math.max(
      0,
      Number(
        profile.neutral_reviews
      ) || 0
    );

  const negativeReviews =
    Math.max(
      0,
      Number(
        profile.negative_reviews
      ) || 0
    );

  const totalReviews =
    positiveReviews +
    neutralReviews +
    negativeReviews;

  const hasExpertiseDetails =
    visibleSpecialtyCategories.length > 0 ||
    visibleSkills.length > 0;

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <style>{`
          .profile-card-with-menu {
            position: relative;
          }

          .profile-card-with-menu .profile-preview {
            padding-right: 58px;
          }

          .profile-more-menu {
            position: absolute;
            z-index: 20;
            top: 18px;
            right: 18px;
          }

          .profile-more-menu summary {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            border: 1px solid #e2e2de;
            border-radius: 50%;
            background: #fff;
            color: #555550;
            font-size: 21px;
            font-weight: 800;
            line-height: 1;
            letter-spacing: 2px;
            cursor: pointer;
            list-style: none;
            box-shadow: 0 6px 18px rgba(20,20,20,.06);
          }

          .profile-more-menu summary::-webkit-details-marker {
            display: none;
          }

          .profile-more-menu summary:hover,
          .profile-more-menu[open] summary {
            border-color: #cfcfca;
            background: #f7f7f4;
          }

          .profile-more-dropdown {
            position: absolute;
            top: 49px;
            right: 0;
            width: max-content;
            min-width: 210px;
            padding: 7px;
            border: 1px solid #e4e4df;
            border-radius: 14px;
            background: #fff;
            box-shadow: 0 16px 38px rgba(20,20,20,.14);
          }

          .profile-more-dropdown button {
            width: 100%;
            min-height: 42px;
            padding: 10px 12px;
            border: 0;
            border-radius: 10px;
            background: transparent;
            color: #8e352b;
            font: inherit;
            font-size: 13px;
            font-weight: 700;
            text-align: left;
            cursor: pointer;
          }

          .profile-more-dropdown button.is-unblock {
            color: #315b35;
          }

          .profile-more-dropdown button:hover {
            background: #f7f7f4;
          }

          .profile-more-dropdown button:disabled {
            cursor: wait;
            opacity: .6;
          }

          .profile-hidden-avatar {
            display: grid;
            place-items: center;
            background: #dfdfda;
            color: #74746f;
            font-size: 38px;
            font-weight: 400;
          }

          .profile-hidden-copy h1 {
            color: #555550;
          }

          .profile-hidden-copy p {
            max-width: 540px;
            margin: 8px 0 0;
            color: #85857f;
            font-size: 13px;
            line-height: 1.6;
          }

          .profile-expertise {
            display: grid;
            grid-template-columns: minmax(0, .9fr) minmax(0, 1.4fr);
            gap: 18px;
            margin-top: 26px;
            padding-top: 24px;
            border-top: 1px solid #ededeb;
          }

          .profile-stats {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
            margin-top: 2px;
          }

          .profile-stat-card {
            min-width: 0;
            padding: 19px 20px;
            border: 1px solid #e7e7e2;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-stat-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .profile-stat-top strong {
            color: #33332f;
            font-size: 14px;
          }

          .profile-stat-value {
            color: #171717;
            font-size: 27px;
            font-weight: 850;
            line-height: 1;
          }

          .profile-stat-breakdown {
            display: flex;
            flex-wrap: wrap;
            gap: 6px 13px;
            margin-top: 13px;
            color: #85857f;
            font-size: 11px;
            line-height: 1.4;
          }

          .profile-content-card {
            min-width: 0;
            margin-top: 18px;
            padding: 20px;
            border: 1px solid #e8e8e3;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-about-copy {
            margin: 0;
            color: #555550;
            font-size: 14px;
            line-height: 1.7;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .profile-expertise-card {
            min-width: 0;
            padding: 20px;
            border: 1px solid #e8e8e3;
            border-radius: 18px;
            background: #fafaf8;
          }

          .profile-expertise-label {
            display: block;
            margin-bottom: 12px;
            color: #888882;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
          }

          .profile-specialty-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .profile-specialty-chip {
            display: inline-flex;
            align-items: center;
            min-height: 34px;
            padding: 7px 11px;
            border: 1px solid #dcdcd6;
            border-radius: 999px;
            background: #fff;
            color: #33332f;
            font-size: 12px;
            font-weight: 700;
          }

          .profile-specialization-copy {
            margin: 0;
            color: #555550;
            font-size: 14px;
            line-height: 1.7;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
          }

          .profile-specialization-card {
            margin-top: 18px;
          }

          .profile-block-notice,
          .profile-block-message {
            margin: 14px 0 0;
            padding: 12px 14px;
            border-radius: 12px;
            background: #f7f7f4;
            color: #666;
            font-size: 13px;
            line-height: 1.55;
          }

          @media (max-width: 600px) {
            .profile-card-with-menu .profile-preview {
              padding-right: 46px;
            }

            .profile-more-menu {
              top: 13px;
              right: 13px;
            }

            .profile-more-menu summary {
              width: 38px;
              height: 38px;
            }

            .profile-more-dropdown {
              top: 45px;
            }

            .profile-expertise {
              grid-template-columns: 1fr;
            }

            .profile-expertise-card {
              padding: 17px;
            }

            .profile-stats {
              grid-template-columns: 1fr;
            }

            .profile-stat-card,
            .profile-content-card {
              padding: 17px;
            }
          }
        `}</style>

        <section className={`account-card ${
          isOtherProfile
            ? "profile-card-with-menu"
            : ""
        }`}>
          {isOtherProfile && (
            <details className="profile-more-menu">
              <summary
                aria-label="Więcej opcji profilu"
                title="Więcej opcji"
              >
                ···
              </summary>

              <div className="profile-more-dropdown">
                <button
                  type="button"
                  className={
                    blockedByMe
                      ? "is-unblock"
                      : ""
                  }
                  onClick={
                    handleBlockToggle
                  }
                  disabled={blockSaving}
                >
                  {blockSaving
                    ? "Zapisywanie..."
                    : blockedByMe
                    ? "Odblokuj użytkownika"
                    : "Zablokuj użytkownika"}
                </button>
              </div>
            </details>
          )}

          <div className="profile-preview">
            <div className="profile-avatar-wrapper">
              {profileHidden ? (
                <div
                  className="profile-avatar profile-hidden-avatar"
                  aria-hidden="true"
                >
                  ×
                </div>
              ) : profile.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt={name}
                  className="profile-avatar"
                />
              ) : (
                <div className="profile-avatar profile-avatar-placeholder">
                  {initial}
                </div>
              )}
            </div>

            <div className={`profile-info ${
              profileHidden
                ? "profile-hidden-copy"
                : ""
            }`}>
              <h1>
                {profileHidden
                  ? "Zablokowany użytkownik"
                  : name}
              </h1>

              {!profileHidden &&
                countryCode && (
                <CountryBadge
                  countryCode={countryCode}
                />
              )}

              {profileHidden && (
                <p>
                  Zdjęcie, nazwa, opis i aktywność tego profilu są ukryte.
                </p>
              )}
            </div>
          </div>

          {isOtherProfile && (
              <>
                {blockedMe && (
                  <p className="profile-block-notice">
                    Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości między Wami jest wyłączone.
                  </p>
                )}

                {blockMessage && (
                  <p className="profile-block-message">
                    {blockMessage}
                  </p>
                )}
              </>
            )}

          {!profileHidden && (
            <div className="profile-stats">
              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <strong>
                    Wykonane zlecenia
                  </strong>

                  <span className="profile-stat-value">
                    {completedJobs}
                  </span>
                </div>

                <div className="profile-stat-breakdown">
                  <span>
                    Zakończone: {completedJobs}
                  </span>

                  <span>
                    Sporne: {disputedJobs}
                  </span>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-top">
                  <strong>
                    Opinie
                  </strong>

                  <span className="profile-stat-value">
                    {totalReviews}
                  </span>
                </div>

                <div className="profile-stat-breakdown">
                  <span>
                    Pozytywne: {positiveReviews}
                  </span>

                  <span>
                    Neutralne: {neutralReviews}
                  </span>

                  <span>
                    Negatywne: {negativeReviews}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!profileHidden &&
            profile.about?.trim() && (
              <div className="profile-content-card">
                <span className="profile-expertise-label">
                  O mnie
                </span>

                <p className="profile-about-copy">
                  {profile.about}
                </p>
              </div>
            )}

          {!profileHidden &&
            hasExpertiseDetails && (
              <div className="profile-expertise">
                {visibleSpecialtyCategories.length > 0 && (
                  <div className="profile-expertise-card">
                    <span className="profile-expertise-label">
                      Kategorie specjalizacji
                    </span>

                    <div className="profile-specialty-chips">
                      {visibleSpecialtyCategories.map(
                        (category) => (
                          <span
                            className="profile-specialty-chip"
                            key={category}
                          >
                            {category}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

                {visibleSkills.length > 0 && (
                  <div className="profile-expertise-card">
                    <span className="profile-expertise-label">
                      Umiejętności
                    </span>

                    <div className="profile-specialty-chips">
                      {visibleSkills.map(
                        (skill) => (
                          <span
                            className="profile-specialty-chip"
                            key={skill}
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          {!profileHidden &&
            profile.specialization?.trim() && (
              <div className="profile-expertise-card profile-specialization-card">
                <span className="profile-expertise-label">
                  W czym się specjalizuję
                </span>

                <p className="profile-specialization-copy">
                  {profile.specialization}
                </p>
              </div>
            )}
        </section>

        {!profileHidden && (
          <section className="account-card profile-jobs-section">
          <span className="section-label">
            Zlecenia
          </span>

          <h2>
            Zlecenia tego
            użytkownika
          </h2>

          {jobs.length ===
          0 ? (
            <p>
              Ten użytkownik
              nie ma jeszcze
              opublikowanych
              zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {jobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <span className="section-label">
                      {job.category}
                    </span>

                    <h2>
                      {job.title}
                    </h2>

                    <p>
                      Budżet:{" "}
                      <strong>
                        {Number(
                          job.budget ||
                            0
                        ).toLocaleString(
                          "pl-PL"
                        )}{" "}
                        zł
                      </strong>
                    </p>

                    <p>
                      <small>
                        Cena została
                        ustalona przy
                        publikacji.
                      </small>
                    </p>
                  </article>
                )
              )}
            </div>
          )}
          </section>
        )}
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

  const {
    canTransact,
    isLimited,
  } = useAgeAccess();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [jobs, setJobs] =
    useState([]);

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
    appliedJobIds,
    setAppliedJobIds,
  ] = useState([]);

  /* =======================================================
     NOWE:
     WYSZUKIWANIE
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(
    "Wszystkie"
  );

  useEffect(() => {
    const category =
      new URLSearchParams(
        location.search
      ).get("category");

    setSelectedCategory(
      category &&
        JOB_CATEGORIES.includes(
          category
        )
        ? category
        : "Wszystkie"
    );
  }, [location.search]);

  function chooseCategory(
    category
  ) {
    setSelectedCategory(
      category
    );

    navigate(
      category === "Wszystkie"
        ? "/jobs"
        : `/jobs?category=${encodeURIComponent(
            category
          )}`,
      { replace: true }
    );
  }

  async function loadJobs() {
    setLoading(true);
    setMessage("");

    try {
      /*
       * NIE MA jobs.status.
       * Pobieramy tylko kolumny,
       * które faktycznie istnieją.
       */

      const {
        data,
        error,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, user_id, title, description, category, budget, created_at"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (error) {
        console.error(
          "LOAD JOBS ERROR:",
          error
        );

        setMessage(
          `Nie udało się pobrać zleceń: ${error.message}`
        );

        return;
      }

      setJobs(
        data || []
      );

      /*
       * Sprawdzamy, do których
       * zleceń użytkownik już
       * się zgłosił.
       */

      if (user?.id) {
        const {
          data:
            applications,
          error:
            applicationsError,
        } =
          await supabase
            .from(
              "job_applications"
            )
            .select(
              "job_id"
            )
            .eq(
              "applicant_id",
              user.id
            );

        if (
          !applicationsError
        ) {
          setAppliedJobIds(
            (applications || []).map(
              (item) =>
                item.job_id
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "LOAD JOBS ERROR:",
        error
      );

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

  /* =======================================================
     ZGŁOSZENIE DO ZLECENIA
  ======================================================= */

  async function handleApply(
    job
  ) {
    if (!user?.id) {
      alert(
        "Musisz być zalogowany."
      );

      return;
    }

    if (!canTransact) {
      setMessage(
        "Zgłaszanie się do płatnych zleceń jest dostępne od 18 lat."
      );
      return;
    }

    if (
      user.id ===
      job.user_id
    ) {
      alert(
        "Nie możesz zgłosić się do własnego zlecenia."
      );

      return;
    }

    if (
      appliedJobIds.includes(
        job.id
      )
    ) {
      return;
    }

    setApplyingJobId(
      job.id
    );

    try {
      const {
        data: existing,
        error:
          existingError,
      } =
        await supabase
          .from(
            "job_applications"
          )
          .select("id")
          .eq(
            "job_id",
            job.id
          )
          .eq(
            "applicant_id",
            user.id
          )
          .maybeSingle();

      if (existingError) {
        setMessage(
          `Nie udało się sprawdzić zgłoszenia: ${existingError.message}`
        );

        return;
      }

      if (existing) {
        setAppliedJobIds(
          (current) => [
            ...current,
            job.id,
          ]
        );

        return;
      }

      const {
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
          });

      if (error) {
        setMessage(
          `Nie udało się wysłać zgłoszenia: ${error.message}`
        );

        return;
      }

      setAppliedJobIds(
        (current) => [
          ...current,
          job.id,
        ]
      );

      alert(
        "Zgłoszenie zostało wysłane do zleceniodawcy."
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

  /* =======================================================
     WYSZUKIWANIE
  ======================================================= */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredJobs =
    jobs.filter(
      (job) => {
        const categoryMatches =
          selectedCategory ===
            "Wszystkie" ||
          job.category ===
            selectedCategory;

        if (
          !categoryMatches
        ) {
          return false;
        }

        if (
          !normalizedSearch
        ) {
          return true;
        }

        const title =
          String(
            job.title || ""
          ).toLowerCase();

        const description =
          String(
            job.description ||
              ""
          ).toLowerCase();

        const category =
          String(
            job.category ||
              ""
          ).toLowerCase();

        return (
          title.includes(
            normalizedSearch
          ) ||
          description.includes(
            normalizedSearch
          ) ||
          category.includes(
            normalizedSearch
          )
        );
      }
    );

  function clearFilters() {
    setSearch("");
    setSelectedCategory(
      "Wszystkie"
    );
    navigate("/jobs", {
      replace: true,
    });
  }

  const hasFilters =
    search.trim() !== "" ||
    selectedCategory !==
      "Wszystkie";

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
            Przeglądaj zlecenia
            opublikowane przez
            użytkowników
            IdeaHire.
          </p>
        </div>

        {isLimited && (
          <section className="jobs-age-notice">
            <span className="jobs-age-notice-icon" aria-hidden="true">16+</span>
            <div>
              <strong>Przeglądanie dostępne</strong>
              <p>
                Na koncie ograniczonym możesz oglądać zlecenia i profile.
                Zgłaszanie się do płatnych zleceń zostanie odblokowane po
                ukończeniu 18 lat.
              </p>
            </div>
          </section>
        )}

        <style>{`
          .jobs-search {
            margin: 0 0 34px;
            padding: 18px;
            background: #fff;
            border: 1px solid #e8e8e5;
            border-radius: 22px;
            box-shadow: 0 12px 35px rgba(17, 17, 17, 0.045);
          }

          .jobs-search-box {
            position: relative;
            display: flex;
            align-items: center;
            min-height: 58px;
            padding: 0 16px 0 18px;
            border: 1px solid #deded9;
            border-radius: 15px;
            background: #fafaf8;
            transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
          }

          .jobs-search-box:focus-within {
            border-color: #b9b9b3;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(17, 17, 17, .045);
          }

          .jobs-search-icon {
            width: 20px;
            margin-right: 12px;
            color: #777;
            font-size: 22px;
            line-height: 1;
            transform: translateY(-1px);
          }

          .jobs-search-box input {
            width: 100%;
            min-width: 0;
            border: 0;
            outline: 0;
            background: transparent;
            color: #111;
            font-size: 15px;
            font-weight: 500;
          }

          .jobs-search-box input::placeholder {
            color: #999;
            font-weight: 400;
          }

          .jobs-search-clear {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            display: grid;
            place-items: center;
            margin-left: 10px;
            padding: 0;
            border: 0;
            border-radius: 50%;
            background: #ededeb;
            color: #555;
            font-size: 19px;
            line-height: 1;
            transition: background .2s ease, color .2s ease, transform .2s ease;
          }

          .jobs-search-clear:hover {
            background: #deded9;
            color: #111;
            transform: none;
          }

          .jobs-filter-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 14px;
            padding: 2px 1px;
            overflow-x: auto;
            scrollbar-width: none;
          }

          .jobs-filter-row::-webkit-scrollbar {
            display: none;
          }

          .jobs-filter {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 8px 14px;
            border: 1px solid #e1e1dc;
            border-radius: 999px;
            background: #fff;
            color: #666;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: .1px;
            white-space: nowrap;
            transition: background .2s ease, color .2s ease, border-color .2s ease, transform .2s ease;
          }

          .jobs-filter:hover {
            border-color: #c8c8c2;
            background: #f7f7f4;
            color: #111;
            transform: none;
          }

          .jobs-filter.active {
            border-color: #111;
            background: #111;
            color: #fff;
          }

          .jobs-filter.active:hover {
            border-color: #111;
            background: #111;
            color: #fff;
          }

          @media (max-width: 600px) {
            .jobs-search {
              margin-bottom: 28px;
              padding: 12px;
              border-radius: 18px;
            }

            .jobs-search-box {
              min-height: 54px;
              padding-left: 15px;
            }

            .jobs-filter-row {
              margin-top: 11px;
            }
          }
        `}</style>

        {/* =================================================
            WYSZUKIWARKA
        ================================================= */}

        <section
          className="jobs-search"
          aria-label="Wyszukiwarka zleceń"
        >
          <div className="jobs-search-box">
            <span
              className="jobs-search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Czego szukasz?"
              aria-label="Szukaj zleceń"
            />

            {search && (
              <button
                type="button"
                className="jobs-search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Wyczyść wyszukiwanie"
              >
                ×
              </button>
            )}
          </div>

          {/* =================================================
              FILTRY KATEGORII
          ================================================= */}

          <div className="jobs-filter-row">
            <button
              type="button"
              className={
                selectedCategory ===
                "Wszystkie"
                  ? "jobs-filter active"
                  : "jobs-filter"
              }
              onClick={() =>
                chooseCategory(
                  "Wszystkie"
                )
              }
            >
              Wszystkie
            </button>

            {JOB_CATEGORIES.map(
              (category) => (
                <button
                  type="button"
                  key={category}
                  className={
                    selectedCategory ===
                    category
                      ? "jobs-filter active"
                      : "jobs-filter"
                  }
                  onClick={() =>
                    chooseCategory(
                      category
                    )
                  }
                >
                  {category}
                </button>
              )
            )}
          </div>
        </section>

        {/* =================================================
            WYNIKI
        ================================================= */}

        {!loading &&
          !message &&
          jobs.length > 0 && (
            <div className="jobs-results-header">
              <div>
                <strong>
                  {
                    filteredJobs.length
                  }
                </strong>{" "}
                {filteredJobs.length ===
                1
                  ? "zlecenie"
                  : filteredJobs.length >=
                      2 &&
                    filteredJobs.length <=
                      4
                  ? "zlecenia"
                  : "zleceń"}
              </div>

              {hasFilters && (
                <button
                  type="button"
                  className="jobs-clear-filters"
                  onClick={
                    clearFilters
                  }
                >
                  Wyczyść filtry
                </button>
              )}
            </div>
          )}

        {loading && (
          <p>
            Ładowanie zleceń...
          </p>
        )}

        {!loading &&
          message && (
            <p className="auth-error">
              {message}
            </p>
          )}

        {!loading &&
          !message &&
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
                pojawiło się tutaj.
              </p>
            </section>
          )}

        {!loading &&
          !message &&
          jobs.length > 0 &&
          filteredJobs.length ===
            0 && (
            <section className="account-card jobs-empty-search">
              <span className="section-label">
                Brak wyników
              </span>

              <h2>
                Nie znaleźliśmy
                takiego zlecenia.
              </h2>

              <p>
                Spróbuj użyć innej
                frazy albo wybierz
                inną kategorię.
              </p>

              <button
                type="button"
                className="btn btn-dark"
                onClick={
                  clearFilters
                }
              >
                Wyczyść wyszukiwanie →
              </button>
            </section>
          )}

        {/* =================================================
            LISTA ZLECEŃ
        ================================================= */}

        <div className="jobs-list">
          {filteredJobs.map(
            (job) => {
              const isOpen =
                openJobId ===
                job.id;

              const isOwner =
                user?.id ===
                job.user_id;

              const alreadyApplied =
                appliedJobIds.includes(
                  job.id
                );

              return (
                <article
                  className="job-card"
                  key={job.id}
                >
                  <div className="job-card-top">
                    <span className="section-label">
                      {job.category}
                    </span>

                    <span className="job-active-badge">
                      Aktywne
                    </span>
                  </div>

                  <h2>
                    {job.title}
                  </h2>

                  <p>
                    <strong>
                      Budżet:
                    </strong>{" "}
                    {formatBudget(
                      job.budget
                    )}
                  </p>

                  <p>
                    <small>
                      Opublikowano:{" "}
                      {formatDate(
                        job.created_at
                      )}
                    </small>
                  </p>

                  {isOpen && (
                    <div className="job-details">
                      <p>
                        {
                          job.description
                        }
                      </p>

                      <div className="job-details-actions">
                        <Link
                          to={`/profile/${job.user_id}`}
                          className="btn btn-outline"
                        >
                          Zobacz profil zleceniodawcy →
                        </Link>

                        {!isOwner && (
                          <button
                            className="btn btn-dark"
                            type="button"
                            disabled={
                              !canTransact ||
                              applyingJobId ===
                                job.id ||
                              alreadyApplied
                            }
                            onClick={() =>
                              handleApply(
                                job
                              )
                            }
                          >
                            {!canTransact
                              ? "Dostępne od 18 lat"
                              : alreadyApplied
                              ? "Zgłoszono ✓"
                              : applyingJobId ===
                                  job.id
                              ? "Wysyłanie..."
                              : "Zgłoś się do zlecenia →"}
                          </button>
                        )}

                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() =>
                            setOpenJobId(
                              null
                            )
                          }
                        >
                          Ukryj szczegóły ↑
                        </button>
                      </div>

                      {isOwner && (
                        <p className="job-owner-note">
                          <small>
                            To jest Twoje
                            zlecenie.
                          </small>
                        </p>
                      )}
                    </div>
                  )}

                  {!isOpen && (
                    <div className="job-actions">
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
                      Zobacz zlecenie →
                    </button>

                    {!isOwner && (
                        <button
                          className="btn btn-outline"
                          type="button"
                          disabled={
                            !canTransact ||
                            applyingJobId ===
                              job.id ||
                            alreadyApplied
                          }
                          onClick={() =>
                            handleApply(
                              job
                            )
                          }
                        >
                          {!canTransact
                            ? "Dostępne od 18 lat"
                            : alreadyApplied
                            ? "Zgłoszono ✓"
                            : applyingJobId ===
                                job.id
                            ? "Wysyłanie..."
                            : "Zgłoś się do zlecenia →"}
                        </button>
                      )}
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
   NOTIFICATIONS
========================================================= */

function Notifications() {
  const { user } =
    useAuth();

  const navigate =
    useNavigate();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    rejectedDecisions,
    setRejectedDecisions,
  ] = useState([]);

  const [
    acceptedDecisions,
    setAcceptedDecisions,
  ] = useState([]);

  const [
    blockNotifications,
    setBlockNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  async function loadNotifications() {
    if (!user?.id) return;

    setLoading(true);
    setMessage("");

    const dismissedKey =
      `ideahire_dismissed_notifications_${user.id}`;

    const dismissedIds =
      getStoredNotificationIds(
        dismissedKey
      );

    try {
      /*
       * 1. Zgłoszenia do zleceń, których jesteś właścicielem.
       * Pokazujemy wyłącznie aktywne zgłoszenia "pending".
       */
      const {
        data: myJobs,
        error: jobsError,
      } =
        await supabase
          .from("jobs")
          .select(
            "id, title"
          )
          .eq(
            "user_id",
            user.id
          );

      if (jobsError) {
        throw jobsError;
      }

      const jobIds =
        (myJobs || []).map(
          (job) => job.id
        );

      let incomingApplications = [];

      if (jobIds.length > 0) {
        const {
          data: applications,
          error:
            applicationsError,
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
            .eq(
              "status",
              "pending"
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            );

        if (applicationsError) {
          throw applicationsError;
        }

        incomingApplications =
          applications || [];
      }

      let incomingResult = [];

      if (
        incomingApplications.length >
        0
      ) {
        const applicantIds = [
          ...new Set(
            incomingApplications.map(
              (item) =>
                item.applicant_id
            )
          ),
        ];

        const {
          data: profiles,
          error: profilesError,
        } =
          await supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about"
            )
            .in(
              "id",
              applicantIds
            );

        if (profilesError) {
          console.error(
            "NOTIFICATION PROFILE ERROR:",
            profilesError
          );
        }

        const profileMap =
          new Map(
            (profiles || []).map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        const jobMap =
          new Map(
            (myJobs || []).map(
              (job) => [
                job.id,
                job,
              ]
            )
          );

        incomingResult =
          incomingApplications.map(
            (application) => ({
              ...application,
              applicant:
                profileMap.get(
                  application.applicant_id
                ),
              job:
                jobMap.get(
                  application.job_id
                ),
            })
          );
      }

      setNotifications(
        incomingResult
      );

      /*
       * 2. Decyzje dotyczące zgłoszeń wysłanych przez Ciebie.
       * Na tym etapie obsługujemy odrzucenie.
       */
      const {
        data: myRejected,
        error: rejectedError,
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
          )
          .eq(
            "status",
            "rejected"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (rejectedError) {
        throw rejectedError;
      }

      let rejectedResult = [];

      if (
        myRejected &&
        myRejected.length > 0
      ) {
        const rejectedJobIds = [
          ...new Set(
            myRejected.map(
              (application) =>
                application.job_id
            )
          ),
        ];

        const {
          data: rejectedJobs,
          error: rejectedJobsError,
        } =
          await supabase
            .from("jobs")
            .select(
              "id, title"
            )
            .in(
              "id",
              rejectedJobIds
            );

        if (rejectedJobsError) {
          console.error(
            "REJECTED JOBS ERROR:",
            rejectedJobsError
          );
        }

        const rejectedJobMap =
          new Map(
            (rejectedJobs || []).map(
              (job) => [
                job.id,
                job,
              ]
            )
          );

        rejectedResult =
          myRejected
            .filter(
              (application) =>
                !dismissedIds.includes(
                  `rejected:${application.id}`
                )
            )
            .map(
              (application) => ({
                ...application,
                job:
                  rejectedJobMap.get(
                    application.job_id
                  ),
              })
            );
      }

      setRejectedDecisions(
        rejectedResult
      );

      /*
       * 3. Zaakceptowane zgłoszenia wykonawcy.
       * Rozmowa jest już utworzona, więc od razu dajemy
       * wykonawcy wejście do czatu.
       */
      const {
        data: myAccepted,
        error: acceptedError,
      } = await supabase
        .from("job_applications")
        .select(
          "id, job_id, applicant_id, status, created_at"
        )
        .eq("applicant_id", user.id)
        .eq("status", "accepted")
        .order("created_at", {
          ascending: false,
        });

      if (acceptedError) {
        throw acceptedError;
      }

      let acceptedResult = [];

      if (myAccepted?.length) {
        const acceptedJobIds = [
          ...new Set(
            myAccepted.map(
              (application) =>
                application.job_id
            )
          ),
        ];

        const {
          data: acceptedJobs,
          error: acceptedJobsError,
        } = await supabase
          .from("jobs")
          .select("id, title, user_id")
          .in("id", acceptedJobIds);

        if (acceptedJobsError) {
          console.error(
            "ACCEPTED JOBS ERROR:",
            acceptedJobsError
          );
        }

        const {
          data: acceptedConversations,
          error: acceptedConversationsError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, agreements_required, created_at"
          )
          .eq("contractor_id", user.id)
          .in("job_id", acceptedJobIds);

        if (acceptedConversationsError) {
          console.error(
            "ACCEPTED CONVERSATIONS ERROR:",
            acceptedConversationsError
          );
        }

        const jobMap = new Map(
          (acceptedJobs || []).map(
            (job) => [job.id, job]
          )
        );

        const conversationMap = new Map(
          (acceptedConversations || []).map(
            (conversation) => [
              conversation.job_id,
              conversation,
            ]
          )
        );

        acceptedResult = myAccepted
          .filter(
            (application) =>
              !dismissedIds.includes(
                `accepted:${application.id}`
              )
          )
          .map(
            (application) => ({
              ...application,
              job: jobMap.get(
                application.job_id
              ),
              conversation:
                conversationMap.get(
                  application.job_id
                ),
            })
          );
      }

      setAcceptedDecisions(
        acceptedResult
      );

      /*
       * 4. Informacje o zablokowaniu profilu.
       * Osoba zablokowana widzi czytelny status w skrzynce.
       */
      const {
        data: blockRows,
        error: blockRowsError,
      } = await supabase
        .from("user_blocks")
        .select(
          "id, blocker_id, blocked_id, created_at"
        )
        .eq("blocked_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (blockRowsError) {
        throw blockRowsError;
      }

      const visibleBlockRows =
        (blockRows || []).filter(
          (block) =>
            !dismissedIds.includes(
              `blocked:${block.id}`
            )
        );

      let blockResult = [];

      if (visibleBlockRows.length > 0) {
        const blockerIds = [
          ...new Set(
            visibleBlockRows.map(
              (block) =>
                block.blocker_id
            )
          ),
        ];

        const {
          data: blockerProfiles,
          error: blockerProfilesError,
        } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", blockerIds);

        if (blockerProfilesError) {
          console.error(
            "BLOCK NOTIFICATION PROFILE ERROR:",
            blockerProfilesError
          );
        }

        const blockerProfileMap =
          new Map(
            (blockerProfiles || []).map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        blockResult =
          visibleBlockRows.map(
            (block) => ({
              ...block,
              blocker:
                blockerProfileMap.get(
                  block.blocker_id
                ),
            })
          );
      }

      setBlockNotifications(
        blockResult
      );

      /*
       * Po otwarciu skrzynki zaznaczamy aktualne elementy
       * jako przeczytane dla kropki w navbarze.
       */
      const readKey =
        `ideahire_read_notifications_${user.id}`;

      const readIds = [
        ...incomingResult.map(
          (item) =>
            `incoming:${item.id}`
        ),
        ...rejectedResult.map(
          (item) =>
            `rejected:${item.id}`
        ),
        ...acceptedResult.map(
          (item) =>
            `accepted:${item.id}`
        ),
        ...blockResult.map(
          (item) =>
            `blocked:${item.id}`
        ),
      ];

      saveNotificationIds(
        readKey,
        [
          ...getStoredNotificationIds(
            readKey
          ),
          ...dismissedIds,
          ...readIds,
        ]
      );

      announceNotificationsRead(
        user.id
      );
    } catch (error) {
      setMessage(
        `Nie udało się pobrać powiadomień: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  function handleClearNotifications() {
    if (!user?.id) return;

    const visibleIds = [
      ...rejectedDecisions.map(
        (item) =>
          `rejected:${item.id}`
      ),
      ...acceptedDecisions.map(
        (item) =>
          `accepted:${item.id}`
      ),
      ...blockNotifications.map(
        (item) =>
          `blocked:${item.id}`
      ),
    ];

    if (visibleIds.length === 0) {
      return;
    }

    const dismissedKey =
      `ideahire_dismissed_notifications_${user.id}`;

    const readKey =
      `ideahire_read_notifications_${user.id}`;

    saveNotificationIds(
      dismissedKey,
      [
        ...getStoredNotificationIds(
          dismissedKey
        ),
        ...visibleIds,
      ]
    );

    saveNotificationIds(
      readKey,
      [
        ...getStoredNotificationIds(
          readKey
        ),
        ...visibleIds,
      ]
    );

    setRejectedDecisions([]);
    setAcceptedDecisions([]);
    setBlockNotifications([]);

    announceNotificationsRead(
      user.id
    );
  }

  async function handleAccepted(
    applicationId
  ) {
    if (!user?.id) {
      throw new Error("Brak aktywnej sesji użytkownika.");
    }

    const application =
      notifications.find(
        (item) =>
          item.id === applicationId
      );

    if (!application) {
      throw new Error(
        "Nie znaleziono tego zgłoszenia. Odśwież stronę i spróbuj ponownie."
      );
    }

    const jobId =
      application.job_id;

    const contractorId =
      application.applicant_id;

    if (!jobId || !contractorId) {
      throw new Error(
        "Zgłoszenie nie zawiera kompletnych danych."
      );
    }

    /*
     * Najpierw szukamy istniejącej rozmowy.
     * Dzięki temu ponowne kliknięcie nie tworzy duplikatów.
     */
    const {
      data: existingConversation,
      error: existingError,
    } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", jobId)
      .eq("client_id", user.id)
      .eq(
        "contractor_id",
        contractorId
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let conversationId =
      existingConversation?.id || null;

    if (!conversationId) {
      const {
        data: createdConversation,
        error: conversationError,
      } = await supabase
        .from("conversations")
        .insert({
          job_id: jobId,
          client_id: user.id,
          contractor_id:
            contractorId,
        })
        .select("id")
        .single();

      if (conversationError) {
        throw conversationError;
      }

      conversationId =
        createdConversation?.id;
    }

    if (!conversationId) {
      throw new Error(
        "Nie udało się utworzyć rozmowy."
      );
    }

    const {
      data: acceptedApplication,
      error: acceptError,
    } = await supabase
      .from("job_applications")
      .update({
        status: "accepted",
      })
      .eq("id", applicationId)
      .eq("status", "pending")
      .select("id, status")
      .maybeSingle();

    if (acceptError) {
      throw acceptError;
    }

    if (!acceptedApplication?.id) {
      throw new Error(
        "Rozmowa została przygotowana, ale nie udało się zmienić statusu zgłoszenia na accepted."
      );
    }

    setNotifications(
      (current) =>
        current.filter(
          (notification) =>
            notification.id !==
            applicationId
        )
    );

    navigate(
      `/chat/${conversationId}`
    );
  }

  function handleRejected(
    applicationId
  ) {
    setNotifications(
      (current) =>
        current.filter(
          (notification) =>
            notification.id !==
            applicationId
        )
    );
  }

  function formatDate(
    value
  ) {
    if (!value) return "";

    return new Date(
      value
    ).toLocaleString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  const isInboxEmpty =
    notifications.length === 0 &&
    rejectedDecisions.length === 0 &&
    acceptedDecisions.length === 0 &&
    blockNotifications.length === 0;

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        <div className="app-page-header">
          <span className="section-label">
            Skrzynka odbiorcza
          </span>

          <h1>
            Powiadomienia
          </h1>

          <p>
            Tutaj znajdziesz zgłoszenia
            wykonawców oraz decyzje
            dotyczące Twoich własnych
            zgłoszeń.
          </p>
        </div>

        {loading && (
          <p>
            Ładowanie powiadomień...
          </p>
        )}

        {!loading &&
          message && (
            <p className="auth-error">
              {message}
            </p>
          )}

        {!loading &&
          !message &&
          isInboxEmpty && (
            <section className="account-card">
              <span className="section-label">
                Skrzynka jest pusta
              </span>

              <h2>
                Nie masz nowych
                powiadomień.
              </h2>

              <p>
                Gdy ktoś zgłosi się
                do Twojego zlecenia
                albo pojawi się decyzja
                dotycząca Twojego
                zgłoszenia, zobaczysz
                ją tutaj.
              </p>
            </section>
          )}

        <style>{`
          .notification-person {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            margin-bottom: 24px;
          }

          .notification-avatar {
            width: 56px;
            height: 56px;
            flex: 0 0 56px;
            display: grid;
            place-items: center;
            overflow: hidden;
            border: 1px solid #e2e2de;
            border-radius: 50%;
            background: #f3f3f0;
            color: #111;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .notification-avatar img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
            object-position: center;
          }

          .notification-person > div:last-child {
            min-width: 0;
          }

          .notification-person strong {
            display: block;
            margin: 0 0 5px;
            color: #111;
            font-size: 15px;
            font-weight: 700;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .notification-person p {
            margin: 0;
            color: #777;
            font-size: 13px;
            line-height: 1.5;
          }

          .notification-job {
            min-width: 0;
            margin-bottom: 18px;
            padding-top: 20px;
            border-top: 1px solid #ededeb;
          }

          .notification-job .section-label {
            margin-bottom: 8px;
          }

          .notification-job h2 {
            margin: 0 0 9px;
            font-size: 21px;
            line-height: 1.3;
            letter-spacing: -0.5px;
            overflow-wrap: anywhere;
          }

          .notification-job small {
            display: block;
            color: #999;
            font-size: 12px;
            line-height: 1.5;
          }

          .notification-card-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 10px;
          }

          .notification-card-actions > .btn {
            width: fit-content;
          }

          .notification-section-title {
            margin: 30px 0 14px;
          }

          .notification-toolbar {
            display: flex;
            justify-content: flex-end;
            margin: 4px 0 10px;
          }

          .notification-clear-button {
            min-height: 42px;
            padding: 10px 16px;
            border: 1px solid #deded9;
            border-radius: 12px;
            background: #fff;
            color: #555;
            font: inherit;
            font-size: 13px;
            font-weight: 650;
            transition:
              color 0.18s ease,
              border-color 0.18s ease,
              background 0.18s ease,
              transform 0.18s ease;
          }

          .notification-clear-button:hover {
            transform: translateY(-1px);
            border-color: #bdbdb7;
            background: #f7f7f4;
            color: #171717;
          }

          .notification-decision-card {
            border-color: #eadfdc;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #fffaf8 100%
              );
          }

          .notification-decision-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #f7e9e5;
            color: #9c392d;
            font-size: 18px;
            font-weight: 800;
          }

          .notification-decision-card h2 {
            margin: 0 0 9px;
            font-size: 20px;
            line-height: 1.3;
          }

          .notification-decision-card p {
            margin: 0;
            color: #666;
            line-height: 1.65;
          }

          .notification-decision-job {
            margin-top: 14px;
            color: #333;
            font-size: 14px;
          }

          .notification-accepted-card {
            border-color: #dfe7df;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #f8fbf7 100%
              );
          }

          .notification-accepted-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #e8f1e7;
            color: #315b35;
            font-size: 18px;
            font-weight: 800;
          }

          .notification-chat-button {
            display: inline-flex;
            margin-top: 18px;
          }

          .notification-block-card {
            border-color: #e4dedc;
            background:
              linear-gradient(
                180deg,
                #fff 0%,
                #fbf8f7 100%
              );
          }

          .notification-block-icon {
            width: 42px;
            height: 42px;
            display: grid;
            place-items: center;
            margin-bottom: 14px;
            border-radius: 50%;
            background: #efe9e7;
            color: #704a43;
            font-size: 17px;
            font-weight: 800;
          }

          .notification-block-card h2 {
            margin: 0 0 9px;
            font-size: 20px;
            line-height: 1.35;
          }

          .notification-block-card p {
            margin: 0;
            color: #666;
            line-height: 1.65;
          }

          @media (max-width: 600px) {
            .notification-person {
              gap: 12px;
              margin-bottom: 20px;
            }

            .notification-avatar {
              width: 48px;
              height: 48px;
              flex-basis: 48px;
            }

            .notification-job {
              margin-bottom: 16px;
              padding-top: 16px;
            }

            .notification-job h2 {
              font-size: 18px;
            }

            .notification-card-actions {
              display: grid;
              grid-template-columns: 1fr;
            }

            .notification-card-actions > .btn {
              width: 100%;
            }

            .notification-toolbar {
              margin-top: 8px;
            }

            .notification-clear-button {
              width: 100%;
            }
          }
        `}</style>

        {!loading &&
          !message &&
          (rejectedDecisions.length > 0 ||
            acceptedDecisions.length > 0 ||
            blockNotifications.length > 0) && (
            <div className="notification-toolbar">
              <button
                type="button"
                className="notification-clear-button"
                onClick={
                  handleClearNotifications
                }
              >
                Wyczyść przeczytane
              </button>
            </div>
          )}

        {!loading &&
          !message &&
          notifications.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Zgłoszenia do Twoich zleceń
                </span>
              </div>

              <div className="jobs-list">
                {notifications.map(
                  (notification) => {
                    const applicant =
                      notification.applicant;

                    const applicantName =
                      applicant?.name ||
                      "Użytkownik";

                    const initial =
                      applicantName
                        .charAt(0)
                        .toUpperCase();

                    return (
                      <article
                        className="job-card"
                        key={
                          notification.id
                        }
                      >
                        <Link
                          to={`/profile/${notification.applicant_id}`}
                          className="notification-person"
                        >
                          <div className="notification-avatar">
                            {applicant?.avatar_url ? (
                              <img
                                src={
                                  applicant.avatar_url
                                }
                                alt={
                                  applicantName
                                }
                              />
                            ) : (
                              initial
                            )}
                          </div>

                          <div>
                            <strong>
                              {
                                applicantName
                              }
                            </strong>

                            <p>
                              chce wykonać
                              Twoje zlecenie
                            </p>
                          </div>
                        </Link>

                        <div className="notification-job">
                          <span className="section-label">
                            Zlecenie
                          </span>

                          <h2>
                            {
                              notification
                                .job
                                ?.title
                            }
                          </h2>

                          <small>
                            Zgłoszenie:{" "}
                            {formatDate(
                              notification.created_at
                            )}
                          </small>
                        </div>

                        <div className="notification-card-actions">
                          <Link
                            className="btn btn-outline"
                            to={`/profile/${notification.applicant_id}`}
                          >
                            Zobacz profil →
                          </Link>

                          <ApplicationActions
                            applicationId={
                              notification.id
                            }
                            onAccepted={
                              handleAccepted
                            }
                            onRejected={
                              handleRejected
                            }
                          />
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

        {!loading &&
          !message &&
          blockNotifications.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Informacje o profilach
                </span>
              </div>

              <div className="jobs-list">
                {blockNotifications.map(
                  (block) => {
                    const blockerName =
                      block.blocker?.name ||
                      "Użytkownik";

                    return (
                      <article
                        className="job-card notification-block-card"
                        key={`blocked-${block.id}`}
                      >
                        <div className="notification-block-icon">
                          !
                        </div>

                        <span className="section-label">
                          Zmiana możliwości kontaktu
                        </span>

                        <h2>
                          {blockerName} zablokował Twój profil
                        </h2>

                        <p>
                          Nie możecie obecnie wysyłać sobie wiadomości. Informację możesz usunąć przyciskiem „Wyczyść przeczytane”.
                        </p>

                        <Link
                          className="btn btn-outline notification-chat-button"
                          to={`/profile/${block.blocker_id}`}
                        >
                          Zobacz profil →
                        </Link>
                      </article>
                    );
                  }
                )}
              </div>
            </>
          )}

        {!loading &&
          !message &&
          acceptedDecisions.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Zaakceptowane zgłoszenia
                </span>
              </div>

              <div className="jobs-list">
                {acceptedDecisions.map(
                  (decision) => (
                    <article
                      className="job-card notification-accepted-card"
                      key={
                        `accepted-${decision.id}`
                      }
                    >
                      <div className="notification-accepted-icon">
                        ✓
                      </div>

                      <span className="section-label">
                        Dobra wiadomość
                      </span>

                      <h2>
                        Twoje zgłoszenie zostało zaakceptowane
                      </h2>

                      <p>
                        Zleceniodawca wybrał Cię do realizacji
                        tego zlecenia. Możecie teraz ustalić
                        szczegóły współpracy w prywatnej rozmowie.
                      </p>

                      <div className="notification-decision-job">
                        <strong>Zlecenie:</strong>{" "}
                        {decision.job?.title ||
                          "Zlecenie"}
                      </div>

                      {decision.conversation?.id ? (
                        <Link
                          className="btn btn-dark notification-chat-button"
                          to={`/chat/${decision.conversation.id}`}
                        >
                          Przejdź do rozmowy →
                        </Link>
                      ) : (
                        <p
                          style={{
                            marginTop: "14px",
                            color: "#8a6b24",
                            fontSize: "13px",
                          }}
                        >
                          Rozmowa jest przygotowywana. Odśwież
                          powiadomienia za chwilę.
                        </p>
                      )}
                    </article>
                  )
                )}
              </div>
            </>
          )}

        {!loading &&
          !message &&
          rejectedDecisions.length >
            0 && (
            <>
              <div className="notification-section-title">
                <span className="section-label">
                  Decyzje dotyczące Twoich zgłoszeń
                </span>
              </div>

              <div className="jobs-list">
                {rejectedDecisions.map(
                  (decision) => (
                    <article
                      className="job-card notification-decision-card"
                      key={
                        `rejected-${decision.id}`
                      }
                    >
                      <div className="notification-decision-icon">
                        ×
                      </div>

                      <span className="section-label">
                        Decyzja dotycząca zgłoszenia
                      </span>

                      <h2>
                        Twoje zgłoszenie nie zostało zaakceptowane
                      </h2>

                      <p>
                        Zleceniodawca zdecydował się
                        nie kontynuować współpracy
                        w ramach tego zgłoszenia.
                        Możesz nadal przeglądać
                        pozostałe zlecenia i zgłaszać
                        się do kolejnych ofert.
                      </p>

                      <div className="notification-decision-job">
                        <strong>
                          Zlecenie:
                        </strong>{" "}
                        {decision.job?.title ||
                          "Zlecenie"}
                      </div>

                      <small
                        style={{
                          display: "block",
                          marginTop: "10px",
                          color: "#999",
                        }}
                      >
                        Zgłoszenie wysłano:{" "}
                        {formatDate(
                          decision.created_at
                        )}
                      </small>
                    </article>
                  )
                )}
              </div>
            </>
          )}
      </main>
    </div>
  );
}


/* =========================================================
   MESSAGES / CONVERSATION LIST
========================================================= */

function Messages() {
  const { user } =
    useAuth();

  const [conversations, setConversations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function loadConversations() {
      setLoading(true);
      setErrorMessage("");

      try {
        /*
         * RLS w conversations zwraca tylko rozmowy,
         * w których zalogowany użytkownik jest stroną.
         */
        const {
          data: conversationRows,
          error: conversationsError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, created_at"
          )
          .order("created_at", {
            ascending: false,
          });

        if (conversationsError) {
          throw conversationsError;
        }

        const rows =
          conversationRows || [];

        if (!rows.length) {
          if (mounted) {
            setConversations([]);
          }
          return;
        }

        const otherUserIds = [
          ...new Set(
            rows.map((conversation) =>
              conversation.client_id ===
              user.id
                ? conversation.contractor_id
                : conversation.client_id
            )
          ),
        ];

        const jobIds = [
          ...new Set(
            rows.map(
              (conversation) =>
                conversation.job_id
            )
          ),
        ];

        const conversationIds =
          rows.map(
            (conversation) =>
              conversation.id
          );

        const [
          profilesResult,
          jobsResult,
          messagesResult,
          statesResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .in("id", otherUserIds),

          supabase
            .from("jobs")
            .select("id, title")
            .in("id", jobIds),

          supabase
            .from("messages")
            .select(
              "id, conversation_id, sender_id, content, created_at, read_at"
            )
            .in(
              "conversation_id",
              conversationIds
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from(
              "conversation_user_state"
            )
            .select(
              "conversation_id, hidden_at"
            )
            .eq("user_id", user.id)
            .in(
              "conversation_id",
              conversationIds
            ),
        ]);

        if (profilesResult.error) {
          console.error(
            "MESSAGES PROFILES ERROR:",
            profilesResult.error
          );
        }

        if (jobsResult.error) {
          console.error(
            "MESSAGES JOBS ERROR:",
            jobsResult.error
          );
        }

        if (messagesResult.error) {
          throw messagesResult.error;
        }

        if (statesResult.error) {
          throw statesResult.error;
        }

        const profileMap =
          new Map(
            (profilesResult.data || []).map(
              (profile) => [
                profile.id,
                profile,
              ]
            )
          );

        const jobMap =
          new Map(
            (jobsResult.data || []).map(
              (job) => [
                job.id,
                job,
              ]
            )
          );

        const lastMessageMap =
          new Map();

        const hiddenAtMap =
          new Map(
            (statesResult.data || []).map(
              (state) => [
                state.conversation_id,
                state.hidden_at,
              ]
            )
          );

        for (
          const message of
          messagesResult.data || []
        ) {
          if (
            !lastMessageMap.has(
              message.conversation_id
            )
          ) {
            lastMessageMap.set(
              message.conversation_id,
              message
            );
          }
        }

        const result =
          rows
            .filter((conversation) => {
              const hiddenAt =
                hiddenAtMap.get(
                  conversation.id
                );

              if (!hiddenAt) {
                return true;
              }

              const lastMessage =
                lastMessageMap.get(
                  conversation.id
                );

              return (
                !!lastMessage?.created_at &&
                new Date(
                  lastMessage.created_at
                ).getTime() >
                  new Date(
                    hiddenAt
                  ).getTime()
              );
            })
            .map((conversation) => {
              const otherUserId =
                conversation.client_id ===
                user.id
                  ? conversation.contractor_id
                  : conversation.client_id;

              const lastMessage =
                lastMessageMap.get(
                  conversation.id
                );

              return {
                ...conversation,
                otherProfile:
                  profileMap.get(
                    otherUserId
                  ),
                job:
                  jobMap.get(
                    conversation.job_id
                  ),
                lastMessage,
                sortDate:
                  lastMessage?.created_at ||
                  conversation.created_at,
              };
            })
            .sort(
              (a, b) =>
                new Date(
                  b.sortDate
                ).getTime() -
                new Date(
                  a.sortDate
                ).getTime()
            );

        if (mounted) {
          setConversations(
            result
          );
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error?.message ||
              "Nie udało się pobrać rozmów."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadConversations();

    const channel =
      supabase
        .channel(
          `messages-list:${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => {
            loadConversations();
          }
        )
        .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id]);

  function formatConversationDate(
    value
  ) {
    if (!value) return "";

    const date =
      new Date(value);

    const today =
      new Date();

    if (
      date.toDateString() ===
      today.toDateString()
    ) {
      return date.toLocaleTimeString(
        "pl-PL",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    return date.toLocaleDateString(
      "pl-PL",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  }

  return (
    <div className="account-page">
      <AccountNavbar />

      <main className="messages-page">
        <style>{`
          .messages-page {
            width: min(980px, calc(100% - 32px));
            margin: 34px auto 60px;
          }

          .messages-heading {
            margin-bottom: 22px;
          }

          .messages-heading h1 {
            margin: 5px 0 8px;
            font-size: clamp(30px, 5vw, 46px);
            letter-spacing: -1.5px;
          }

          .messages-heading p {
            margin: 0;
            max-width: 600px;
            color: #777;
            line-height: 1.6;
          }

          .messages-list {
            overflow: hidden;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 22px;
            background: #fff;
            box-shadow: 0 16px 45px rgba(20,20,20,.05);
          }

          .messages-row {
            display: grid;
            grid-template-columns: 54px minmax(0, 1fr) auto;
            align-items: center;
            gap: 14px;
            padding: 16px 18px;
            border-bottom: 1px solid rgba(20,20,20,.07);
            color: inherit;
            text-decoration: none;
            transition: background .16s ease;
          }

          .messages-row:last-child {
            border-bottom: 0;
          }

          .messages-row:hover {
            background: #f8f8f5;
          }

          .messages-avatar {
            width: 54px;
            height: 54px;
            overflow: hidden;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #ecece8;
            font-size: 17px;
            font-weight: 800;
          }

          .messages-avatar img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: cover;
          }

          .messages-content {
            min-width: 0;
          }

          .messages-topline {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }

          .messages-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 800;
          }

          .messages-job {
            margin-top: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #777;
            font-size: 12px;
          }

          .messages-preview {
            margin-top: 7px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #555;
            font-size: 14px;
          }

          .messages-date {
            align-self: start;
            padding-top: 3px;
            color: #999;
            font-size: 11px;
            white-space: nowrap;
          }

          .messages-empty {
            padding: 54px 24px;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 22px;
            background: #fff;
            text-align: center;
          }

          .messages-empty h2 {
            margin: 0 0 8px;
          }

          .messages-empty p {
            margin: 0;
            color: #777;
            line-height: 1.6;
          }

          @media (max-width: 600px) {
            .messages-page {
              width: calc(100% - 20px);
              margin: 20px auto 40px;
            }

            .messages-row {
              grid-template-columns: 48px minmax(0, 1fr) auto;
              gap: 11px;
              padding: 14px 12px;
            }

            .messages-avatar {
              width: 48px;
              height: 48px;
            }

            .messages-job {
              max-width: 65vw;
            }
          }
        `}</style>

        <div className="messages-heading">
          <span className="section-label">
            Twoje rozmowy
          </span>

          <h1>Wiadomości</h1>

          <p>
            Tutaj znajdziesz wszystkie rozmowy
            rozpoczęte po zaakceptowaniu wykonawcy.
          </p>
        </div>

        {loading ? (
          <p>Ładowanie rozmów...</p>
        ) : errorMessage ? (
          <p className="auth-error">
            {errorMessage}
          </p>
        ) : conversations.length === 0 ? (
          <section className="messages-empty">
            <h2>
              Nie masz jeszcze rozmów
            </h2>

            <p>
              Gdy zgłoszenie zostanie zaakceptowane,
              rozmowa pojawi się właśnie tutaj.
            </p>
          </section>
        ) : (
          <div className="messages-list">
            {conversations.map(
              (conversation) => {
                const profile =
                  conversation.otherProfile;

                const name =
                  profile?.name ||
                  "Użytkownik";

                const initial =
                  name
                    .charAt(0)
                    .toUpperCase();

                const lastMessage =
                  conversation.lastMessage;

                return (
                  <Link
                    key={
                      conversation.id
                    }
                    className="messages-row"
                    to={`/chat/${conversation.id}`}
                  >
                    <div className="messages-avatar">
                      {profile?.avatar_url ? (
                        <img
                          src={
                            profile.avatar_url
                          }
                          alt=""
                        />
                      ) : (
                        initial
                      )}
                    </div>

                    <div className="messages-content">
                      <div className="messages-topline">
                        <span className="messages-name">
                          {name}
                        </span>
                      </div>

                      <div className="messages-job">
                        {conversation.job?.title ||
                          "Rozmowa dotycząca zlecenia"}
                      </div>

                      <div className="messages-preview">
                        {lastMessage
                          ? `${
                              lastMessage.sender_id ===
                              user.id
                                ? "Ty: "
                                : ""
                            }${lastMessage.content}`
                          : "Rozmowa została otwarta — napisz pierwszą wiadomość."}
                      </div>
                    </div>

                    <time className="messages-date">
                      {formatConversationDate(
                        conversation.sortDate
                      )}
                    </time>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </main>
    </div>
  );
}


/* =========================================================
   CHAT
========================================================= */

const EMPTY_DISPUTE_FORM = {
  reason: "",
  requestedOutcome: "",
  requestedAmount: "",
  description: "",
  contextNoticeAcknowledged: false,
};

function ChatDisputePanel({
  agreement,
  conversation,
}) {
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(EMPTY_DISPUTE_FORM);

  useEffect(() => {
    if (
      !agreement?.id ||
      agreement.status !== "accepted"
    ) {
      setDispute(null);
      setFormOpen(false);
      return;
    }

    let mounted = true;

    async function loadDispute() {
      setLoading(true);

      const { data, error } = await supabase
        .from("disputes")
        .select("*")
        .eq("agreement_id", agreement.id)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setMessage(
          cleanSupabaseError(
            error,
            "Nie udało się sprawdzić statusu sporu."
          )
        );
      } else {
        setDispute(data || null);
      }

      setLoading(false);
    }

    loadDispute();

    return () => {
      mounted = false;
    };
  }, [agreement?.id, agreement?.status]);

  if (
    !conversation?.id ||
    !agreement?.id ||
    agreement.status !== "accepted"
  ) {
    return null;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "requestedOutcome" && value !== "partial_refund"
        ? { requestedAmount: "" }
        : {}),
    }));
    setMessage("");
  }

  async function handleOpenDispute(event) {
    event.preventDefault();

    if (saving) return;

    const description = form.description.trim();

    if (!form.reason) {
      setMessage("Wybierz powód sporu.");
      return;
    }

    if (!form.requestedOutcome) {
      setMessage("Wybierz oczekiwane rozwiązanie.");
      return;
    }

    if (description.length < 20) {
      setMessage("Opisz sytuację w co najmniej 20 znakach.");
      return;
    }

    if (!form.contextNoticeAcknowledged) {
      setMessage(
        "Potwierdź zapoznanie się z informacją o dostępie administratora."
      );
      return;
    }

    let requestedAmount = null;

    if (form.requestedOutcome === "partial_refund") {
      requestedAmount = Number(
        String(form.requestedAmount).replace(",", ".")
      );

      if (
        !Number.isFinite(requestedAmount) ||
        requestedAmount <= 0 ||
        requestedAmount >= Number(agreement.price_amount)
      ) {
        setMessage(
          "Kwota częściowego zwrotu musi być większa od 0 i mniejsza od ceny zlecenia."
        );
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "open_ideahire_dispute_v2",
        {
          p_agreement_id: agreement.id,
          p_reason: form.reason,
          p_description: description,
          p_requested_outcome: form.requestedOutcome,
          p_requested_amount: requestedAmount,
          p_context_notice_acknowledged:
            form.contextNoticeAcknowledged,
        }
      );

      if (error) throw error;

      setForm(EMPTY_DISPUTE_FORM);
      setFormOpen(false);

      if (data) {
        navigate(`/disputes/${data}`);
      }
    } catch (error) {
      setMessage(
        cleanSupabaseError(
          error,
          "Nie udało się otworzyć sporu."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="chat-dispute-card is-loading">
        Sprawdzanie centrum sporu...
      </section>
    );
  }

  if (dispute) {
    return (
      <section className="chat-dispute-card has-dispute">
        <div className="chat-dispute-copy">
          <span className="dispute-eyebrow">
            Centrum sporu
          </span>
          <strong>
            {formatDisputeNumber(dispute.case_number)}
          </strong>
          <small>
            {getDisputeStatusLabel(dispute.status)}
          </small>
        </div>

        <button
          type="button"
          className="dispute-secondary-button"
          onClick={() => navigate(`/disputes/${dispute.id}`)}
        >
          Otwórz sprawę
        </button>
      </section>
    );
  }

  return (
    <section className="chat-dispute-card">
      {!formOpen ? (
        <>
          <div className="chat-dispute-copy">
            <span className="dispute-eyebrow">
              Bezpieczna współpraca
            </span>
            <strong>Problem z realizacją zlecenia?</strong>
            <small>
              Otwórz uporządkowaną sprawę i przedstaw swoje wyjaśnienia.
            </small>
          </div>

          <button
            type="button"
            className="dispute-danger-button"
            onClick={() => {
              setFormOpen(true);
              setMessage("");
            }}
          >
            Zgłoś problem
          </button>
        </>
      ) : (
        <form className="dispute-open-form" onSubmit={handleOpenDispute}>
          <div className="dispute-form-heading">
            <div>
              <span className="dispute-eyebrow">Nowa sprawa</span>
              <h3>Opisz problem</h3>
              <p>
                Druga strona otrzyma Twoje zgłoszenie i będzie mogła odpowiedzieć.
              </p>
            </div>

            <button
              type="button"
              className="dispute-close-form"
              aria-label="Zamknij formularz sporu"
              onClick={() => {
                setFormOpen(false);
                setMessage("");
              }}
            >
              ×
            </button>
          </div>

          <div className="dispute-form-grid">
            <label className="dispute-field">
              <span>Powód sporu</span>
              <select
                value={form.reason}
                onChange={(event) =>
                  updateField("reason", event.target.value)
                }
                required
              >
                <option value="">Wybierz powód</option>
                {DISPUTE_REASON_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="dispute-field">
              <span>Oczekiwane rozwiązanie</span>
              <select
                value={form.requestedOutcome}
                onChange={(event) =>
                  updateField("requestedOutcome", event.target.value)
                }
                required
              >
                <option value="">Wybierz rozwiązanie</option>
                {DISPUTE_OUTCOME_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {form.requestedOutcome === "partial_refund" && (
              <label className="dispute-field">
                <span>Proponowana kwota zwrotu</span>
                <div className="dispute-money-input">
                  <input
                    type="number"
                    min="0.01"
                    max={Math.max(Number(agreement.price_amount) - 0.01, 0.01)}
                    step="0.01"
                    value={form.requestedAmount}
                    onChange={(event) =>
                      updateField("requestedAmount", event.target.value)
                    }
                    required
                  />
                  <span>PLN</span>
                </div>
              </label>
            )}

            <label className="dispute-field dispute-field-wide">
              <span>Opis sytuacji</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                minLength={20}
                maxLength={10000}
                rows={6}
                placeholder="Napisz, co się wydarzyło, kiedy wystąpił problem i które ustalenia nie zostały spełnione."
                required
              />
              <small>{form.description.length}/10 000 znaków</small>
            </label>
          </div>

          <section
            className="dispute-context-notice"
            aria-labelledby="dispute-context-notice-title"
          >
            <div className="dispute-context-notice-heading">
              <span className="dispute-context-notice-icon" aria-hidden="true">
                i
              </span>
              <div>
                <strong id="dispute-context-notice-title">
                  Jak administracja analizuje spór
                </strong>
                <p>
                  Po przejęciu sprawy przypisany administrator IdeaHire otrzyma
                  dostęp do materiałów potrzebnych do jej rozpatrzenia.
                </p>
              </div>
            </div>

            <ul className="dispute-context-notice-list">
              <li>pełna rozmowa dotycząca tego zlecenia,</li>
              <li>wszystkie wersje formularza współpracy,</li>
              <li>wyjaśnienia oraz dowody dołączone do sporu.</li>
            </ul>

            <p className="dispute-context-notice-safety">
              Dostęp ma wyłącznie administrator przypisany do sprawy, tylko do
              odczytu. Każde otwarcie pełnego kontekstu jest zapisywane w
              rejestrze działań.
            </p>

            <label className="dispute-context-acknowledgement">
              <input
                type="checkbox"
                checked={form.contextNoticeAcknowledged}
                onChange={(event) =>
                  updateField(
                    "contextNoticeAcknowledged",
                    event.target.checked
                  )
                }
                required
              />
              <span>
                <strong>
                  Potwierdzam, że zapoznałem się z informacją o dostępie
                  administratora.
                </strong>
                <small>
                  To potwierdzenie dotyczy zasad analizy sporu i zostanie
                  zapisane wraz ze zgłoszeniem.
                </small>
              </span>
            </label>
          </section>

          <p className="dispute-form-notice">
            Zgłoszenie zostanie przypisane do zaakceptowanej wersji ustaleń. Cena i termin nie mogą zostać podmienione.
          </p>

          {message && (
            <p className="dispute-inline-message is-error">{message}</p>
          )}

          <div className="dispute-form-actions">
            <button
              type="button"
              className="dispute-secondary-button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              Anuluj
            </button>

            <button
              type="submit"
              className="dispute-primary-button"
              disabled={saving || !form.contextNoticeAcknowledged}
            >
              {saving ? "Wysyłanie..." : "Otwórz spór"}
            </button>
          </div>
        </form>
      )}

      {!formOpen && message && (
        <p className="dispute-inline-message is-error">{message}</p>
      )}
    </section>
  );
}

const EMPTY_AGREEMENT_FORM = {
  title: "",
  scope: "",
  deliverables: "",
  priceAmount: "",
  priceCurrency: "PLN",
  deadline: "",
  revisions: "1",
  deliveryFormat: "",
  acceptanceMethod: "",
  cancellationTerms: "",
  additionalTerms: "",
};

function parseAgreementPrice(value) {
  let normalized = String(value || "")
    .trim()
    .replace(/[\s\u00a0]/g, "")
    .replace(/PLN|EUR|USD|GBP|ZŁ/gi, "");

  const commaIndex =
    normalized.lastIndexOf(",");

  const dotIndex =
    normalized.lastIndexOf(".");

  if (
    commaIndex >= 0 &&
    dotIndex >= 0
  ) {
    normalized =
      commaIndex > dotIndex
        ? normalized
            .replace(/\./g, "")
            .replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    normalized = normalized.replace(
      ",",
      "."
    );
  } else if (dotIndex >= 0) {
    const parts =
      normalized.split(".");

    if (
      parts.length === 2 &&
      parts[1].length === 3 &&
      parts[0].length <= 3
    ) {
      normalized = parts.join("");
    }
  }

  return Number(normalized);
}

function agreementToForm(
  agreement,
  fallbackTitle = "",
  fallbackPrice = ""
) {
  if (!agreement) {
    return {
      ...EMPTY_AGREEMENT_FORM,
      title: fallbackTitle || "",
      priceAmount:
        fallbackPrice === null ||
        fallbackPrice === undefined
          ? ""
          : String(fallbackPrice),
      priceCurrency: "PLN",
    };
  }

  return {
    title: agreement.title || "",
    scope: agreement.scope || "",
    deliverables:
      agreement.deliverables || "",
    priceAmount:
      agreement.price_amount == null
        ? ""
        : String(agreement.price_amount),
    priceCurrency:
      agreement.price_currency || "PLN",
    deadline: agreement.deadline || "",
    revisions: String(
      agreement.revisions ?? 0
    ),
    deliveryFormat:
      agreement.delivery_format || "",
    acceptanceMethod:
      agreement.acceptance_method || "",
    cancellationTerms:
      agreement.cancellation_terms || "",
    additionalTerms:
      agreement.additional_terms || "",
  };
}

function AgreementDetails({ agreement }) {
  if (!agreement) return null;

  const price = new Intl.NumberFormat(
    "pl-PL",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    Number(agreement.price_amount)
  );

  const deadline = new Date(
    `${agreement.deadline}T12:00:00`
  ).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="agreement-details">
      <div className="agreement-detail agreement-detail-wide">
        <span>Nazwa zlecenia</span>
        <strong>{agreement.title}</strong>
      </div>

      <div className="agreement-detail">
        <span>Cena</span>
        <strong>
          {price} {agreement.price_currency}
        </strong>
      </div>

      <div className="agreement-detail">
        <span>Termin wykonania</span>
        <strong>{deadline}</strong>
      </div>

      <div className="agreement-detail">
        <span>Liczba poprawek</span>
        <strong>{agreement.revisions}</strong>
      </div>

      <div className="agreement-detail">
        <span>Format przekazania pracy</span>
        <strong>
          {agreement.delivery_format}
        </strong>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Zakres pracy</span>
        <p>{agreement.scope}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Rezultat końcowy</span>
        <p>{agreement.deliverables}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Sposób odbioru pracy</span>
        <p>{agreement.acceptance_method}</p>
      </div>

      <div className="agreement-detail agreement-detail-wide">
        <span>Warunki anulowania</span>
        <p>{agreement.cancellation_terms}</p>
      </div>

      {!!agreement.additional_terms && (
        <div className="agreement-detail agreement-detail-wide">
          <span>Dodatkowe ustalenia</span>
          <p>{agreement.additional_terms}</p>
        </div>
      )}
    </div>
  );
}

function AgreementPanel({
  required,
  agreement,
  loading,
  saving,
  mode,
  form,
  message,
  currentUserAccepted,
  otherUserAccepted,
  blocked,
  onFieldChange,
  onOpenForm,
  onCancelForm,
  onSubmit,
  onAccept,
}) {
  const [confirmed, setConfirmed] =
    useState(false);

  const [expanded, setExpanded] =
    useState(true);

  useEffect(() => {
    setConfirmed(false);
    setExpanded(true);
  }, [mode, agreement?.id]);

  if (!required) return null;

  if (loading) {
    return (
      <section className="agreement-gate agreement-loading">
        <span className="agreement-lock-icon">
          ◌
        </span>
        <p>Ładowanie warunków współpracy...</p>
      </section>
    );
  }

  if (agreement?.status === "accepted") {
    return (
      <details className="agreement-summary">
        <summary>
          <span className="agreement-status-icon">
            ✓
          </span>

          <span className="agreement-summary-copy">
            <strong>
              Warunki współpracy zaakceptowane
            </strong>
            <small>
              Wersja {agreement.version} · Czat jest aktywny
            </small>
          </span>

          <span className="agreement-summary-action">
            Pokaż ustalenia
          </span>
        </summary>

        <div className="agreement-summary-body">
          <AgreementDetails
            agreement={agreement}
          />

          <p className="agreement-legal-note">
            Ta zaakceptowana wersja jest zapisem ustaleń obu stron i pozostaje dostępna w historii rozmowy.
          </p>
        </div>
      </details>
    );
  }

  return (
    <section className="agreement-workspace">
      <button
        type="button"
        className="agreement-workspace-toggle"
        onClick={() =>
          setExpanded((current) => !current)
        }
        aria-expanded={expanded}
      >
        <span>
          <strong>Warunki współpracy</strong>
          <small>
            Czat negocjacyjny jest aktywny · realizacja ruszy po wspólnej akceptacji
          </small>
        </span>
        <b aria-hidden="true">
          {expanded ? "−" : "+"}
        </b>
      </button>

      {expanded && (
      <section className="agreement-gate">
      <div className="agreement-gate-heading">
        <span className="agreement-eyebrow">
          Ustalenia przed rozpoczęciem
        </span>

        <h2>Ustalcie warunki współpracy</h2>

        <p>
          Możecie już rozmawiać na czacie. Realizacja zlecenia rozpocznie się, gdy obie strony zaakceptują dokładnie tę samą wersję ustaleń.
        </p>

        <div className="agreement-progress" aria-label="Postęp akceptacji">
          <span className={currentUserAccepted ? "is-complete" : ""}>
            <i>{currentUserAccepted ? "✓" : "1"}</i>
            Twoja akceptacja
          </span>

          <b aria-hidden="true" />

          <span className={otherUserAccepted ? "is-complete" : ""}>
            <i>{otherUserAccepted ? "✓" : "2"}</i>
            Akceptacja drugiej strony
          </span>
        </div>
      </div>

      {mode === "form" ? (
        <form
          className="agreement-form"
          onSubmit={onSubmit}
        >
          <div className="agreement-form-heading">
            <div>
              <span className="agreement-version-pill">
                {agreement
                  ? `Nowa wersja ${agreement.version + 1}`
                  : "Pierwsza propozycja"}
              </span>
              <h3>Warunki realizacji zlecenia</h3>
            </div>

            <p>
              Pola oznaczone gwiazdką są wymagane.
            </p>
          </div>

          <div className="agreement-form-grid">
            <label className="agreement-field agreement-field-wide">
              <span>Nazwa zlecenia *</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  onFieldChange(
                    "title",
                    event.target.value
                  )
                }
                placeholder="Np. Projekt strony internetowej"
                maxLength={140}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Zakres pracy *</span>
              <textarea
                value={form.scope}
                onChange={(event) =>
                  onFieldChange(
                    "scope",
                    event.target.value
                  )
                }
                placeholder="Opisz dokładnie, co ma zostać wykonane..."
                maxLength={4000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Rezultat końcowy *</span>
              <textarea
                value={form.deliverables}
                onChange={(event) =>
                  onFieldChange(
                    "deliverables",
                    event.target.value
                  )
                }
                placeholder="Wymień pliki, materiały lub funkcje, które mają zostać przekazane..."
                maxLength={2500}
                required
              />
            </label>

            <label className="agreement-field">
              <span>Cena zlecenia</span>
              <div className="agreement-price-input">
                <input
                  type="text"
                  value={form.priceAmount}
                  disabled
                  readOnly
                  aria-label="Cena ustalona przy publikacji zlecenia"
                />
                <span className="agreement-price-currency">
                  PLN
                </span>
              </div>
              <small className="agreement-fixed-price-note">
                Cena została ustalona przez zleceniodawcę przy publikacji zlecenia i nie podlega zmianie.
              </small>
            </label>

            <label className="agreement-field">
              <span>Termin wykonania *</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.deadline}
                onChange={(event) =>
                  onFieldChange(
                    "deadline",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="agreement-field">
              <span>Liczba poprawek *</span>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.revisions}
                onChange={(event) =>
                  onFieldChange(
                    "revisions",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className="agreement-field">
              <span>Format przekazania pracy *</span>
              <input
                type="text"
                value={form.deliveryFormat}
                onChange={(event) =>
                  onFieldChange(
                    "deliveryFormat",
                    event.target.value
                  )
                }
                placeholder="Np. PDF, PNG i pliki źródłowe"
                maxLength={500}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Sposób odbioru pracy *</span>
              <textarea
                value={form.acceptanceMethod}
                onChange={(event) =>
                  onFieldChange(
                    "acceptanceMethod",
                    event.target.value
                  )
                }
                placeholder="Po czym obie strony poznają, że zlecenie zostało wykonane prawidłowo?"
                maxLength={2000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Warunki anulowania *</span>
              <textarea
                value={form.cancellationTerms}
                onChange={(event) =>
                  onFieldChange(
                    "cancellationTerms",
                    event.target.value
                  )
                }
                placeholder="Opisz zasady rezygnacji przed ukończeniem pracy..."
                maxLength={2000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Dodatkowe ustalenia</span>
              <textarea
                value={form.additionalTerms}
                onChange={(event) =>
                  onFieldChange(
                    "additionalTerms",
                    event.target.value
                  )
                }
                placeholder="Opcjonalne informacje, które warto zapisać..."
                maxLength={2500}
              />
            </label>
          </div>

          <label className="agreement-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) =>
                setConfirmed(
                  event.target.checked
                )
              }
            />
            <span>
              Potwierdzam, że zapoznałem się z warunkami współpracy i akceptuję treść wysyłanej propozycji.
            </span>
          </label>

          {message && (
            <p className="agreement-message">
              {message}
            </p>
          )}

          <div className="agreement-form-actions">
            {agreement && (
              <button
                type="button"
                className="agreement-secondary-button"
                onClick={onCancelForm}
                disabled={saving}
              >
                Anuluj zmiany
              </button>
            )}

            <button
              type="submit"
              className="agreement-primary-button"
              disabled={
                saving ||
                !confirmed ||
                blocked
              }
            >
              {saving
                ? "Zapisywanie..."
                : agreement
                ? "Wyślij nową propozycję"
                : "Wyślij propozycję"}
            </button>
          </div>
        </form>
      ) : agreement ? (
        <div className="agreement-proposal-card">
          <div className="agreement-proposal-topline">
            <div>
              <span className="agreement-version-pill">
                Wersja {agreement.version}
              </span>
              <h3>Propozycja warunków</h3>
            </div>

            <span className="agreement-pending-pill">
              Oczekuje na wspólną akceptację
            </span>
          </div>

          <AgreementDetails
            agreement={agreement}
          />

          {message && (
            <p className="agreement-message is-success">
              {message}
            </p>
          )}

          {blocked ? (
            <p className="agreement-blocked-note">
              Ustalenia są wstrzymane, ponieważ jeden z użytkowników jest zablokowany.
            </p>
          ) : (
            <div className="agreement-proposal-actions">
              <button
                type="button"
                className="agreement-secondary-button"
                onClick={onOpenForm}
                disabled={saving}
              >
                Zaproponuj zmiany
              </button>

              {!currentUserAccepted ? (
                <button
                  type="button"
                  className="agreement-primary-button"
                  onClick={onAccept}
                  disabled={saving}
                >
                  {saving
                    ? "Akceptowanie..."
                    : "Akceptuję warunki"}
                </button>
              ) : (
                <span className="agreement-waiting-note">
                  ✓ Zaakceptowałeś tę wersję. Czekamy na drugą stronę.
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="agreement-waiting-card">
          <span
            className="agreement-waiting-icon"
            aria-hidden="true"
          >
            ◷
          </span>

          <div>
            <h3>
              Czekamy na propozycję zleceniodawcy
            </h3>
            <p>
              Zleceniodawca wypełnia pierwszy formularz. Gdy go wyśle, zobaczysz wszystkie warunki i będziesz mógł je zaakceptować albo zaproponować zmiany.
            </p>
          </div>
        </div>
      )}
      </section>
      )}
    </section>
  );
}

function Chat() {
  const { user } =
    useAuth();

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [conversation, setConversation] =
    useState(null);

  const [otherProfile, setOtherProfile] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [draft, setDraft] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [blockedByMe, setBlockedByMe] =
    useState(false);

  const [blockedMe, setBlockedMe] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [jobTitle, setJobTitle] =
    useState("");

  const [jobBudget, setJobBudget] =
    useState("");

  const [agreement, setAgreement] =
    useState(null);

  const [agreementLoading, setAgreementLoading] =
    useState(true);

  const [agreementSaving, setAgreementSaving] =
    useState(false);

  const [agreementMode, setAgreementMode] =
    useState("view");

  const [agreementMessage, setAgreementMessage] =
    useState("");

  const [agreementForm, setAgreementForm] =
    useState(EMPTY_AGREEMENT_FORM);

  async function loadAgreement(
    conversationData,
    fallbackTitle = "",
    fallbackPrice = ""
  ) {
    if (
      !conversationData?.agreements_required
    ) {
      setAgreement(null);
      setAgreementLoading(false);
      return null;
    }

    setAgreementLoading(true);

    try {
      const { data, error } =
        await supabase
          .from(
            "conversation_agreements"
          )
          .select("*")
          .eq(
            "conversation_id",
            conversationData.id
          )
          .order("version", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (error) {
        throw error;
      }

      setAgreement(data || null);

      if (!data) {
        if (
          conversationData.client_id ===
          user?.id
        ) {
          setAgreementForm(
            agreementToForm(
              null,
              fallbackTitle,
              fallbackPrice
            )
          );
          setAgreementMode("form");
        } else {
          setAgreementMode("view");
        }
      } else {
        setAgreementMode("view");
      }

      return data || null;
    } finally {
      setAgreementLoading(false);
    }
  }

  async function markIncomingMessagesAsRead(
    messageRows
  ) {
    const unreadIds =
      (messageRows || [])
        .filter(
          (message) =>
            message.sender_id !==
              user?.id &&
            !message.read_at
        )
        .map(
          (message) =>
            message.id
        );

    if (unreadIds.length === 0) {
      return messageRows || [];
    }

    const readAt =
      new Date().toISOString();

    const { error } =
      await supabase
        .from("messages")
        .update({
          read_at: readAt,
        })
        .in("id", unreadIds)
        .eq(
          "conversation_id",
          id
        );

    if (error) {
      console.error(
        "MESSAGE READ ERROR:",
        error
      );

      return messageRows || [];
    }

    return (messageRows || []).map(
      (message) =>
        unreadIds.includes(
          message.id
        )
          ? {
              ...message,
              read_at: readAt,
            }
          : message
    );
  }

  async function loadMessages() {
    if (!id) return;

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, created_at, read_at"
      )
      .eq(
        "conversation_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (error) {
      throw error;
    }

    const preparedMessages =
      await markIncomingMessagesAsRead(
        data || []
      );

    setMessages(preparedMessages);
  }

  useEffect(() => {
    if (!user?.id || !id) return;

    let mounted = true;

    async function loadChat() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: conversationData,
          error: conversationError,
        } = await supabase
          .from("conversations")
          .select(
            "id, job_id, client_id, contractor_id, agreements_required, created_at"
          )
          .eq("id", id)
          .single();

        if (conversationError) {
          throw conversationError;
        }

        if (!mounted) return;

        setConversation(
          conversationData
        );

        const otherUserId =
          conversationData.client_id ===
          user.id
            ? conversationData.contractor_id
            : conversationData.client_id;

        const [
          profileResult,
          blockedByMeResult,
          blockedMeResult,
          jobResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .eq(
              "id",
              otherUserId
            )
            .maybeSingle(),

          supabase
            .from("user_blocks")
            .select("id")
            .eq(
              "blocker_id",
              user.id
            )
            .eq(
              "blocked_id",
              otherUserId
            )
            .maybeSingle(),

          supabase
            .from("user_blocks")
            .select("id")
            .eq(
              "blocker_id",
              otherUserId
            )
            .eq(
              "blocked_id",
              user.id
            )
            .maybeSingle(),

          supabase
            .from("jobs")
            .select("title, budget")
            .eq(
              "id",
              conversationData.job_id
            )
            .maybeSingle(),
        ]);

        const profileData =
          profileResult.data;

        const profileError =
          profileResult.error;

        if (profileError) {
          console.error(
            "CHAT PROFILE ERROR:",
            profileError
          );
        }

        if (blockedByMeResult.error) {
          console.error(
            "CHAT BLOCK STATUS ERROR:",
            blockedByMeResult.error
          );
        }

        if (blockedMeResult.error) {
          console.error(
            "CHAT BLOCKED STATUS ERROR:",
            blockedMeResult.error
          );
        }

        if (jobResult.error) {
          console.error(
            "CHAT JOB ERROR:",
            jobResult.error
          );
        }

        const loadedJobTitle =
          jobResult.data?.title || "";

        const loadedJobBudget =
          jobResult.data?.budget ?? "";

        setJobTitle(
          loadedJobTitle
        );

        setJobBudget(
          loadedJobBudget
        );

        if (mounted) {
          setOtherProfile(
            profileData || null
          );

          setBlockedByMe(
            !!blockedByMeResult.data?.id
          );

          setBlockedMe(
            !!blockedMeResult.data?.id
          );
        }

        await loadAgreement(
          conversationData,
          loadedJobTitle,
          loadedJobBudget
        );

        await loadMessages();
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error?.message ||
            "Nie udało się otworzyć rozmowy."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadChat();

    const channel =
      supabase
        .channel(
          `conversation:${id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            let newMessage =
              payload.new;

            if (
              newMessage.sender_id !==
              user.id
            ) {
              const readAt =
                new Date().toISOString();

              newMessage = {
                ...newMessage,
                read_at: readAt,
              };

              supabase
                .from("messages")
                .update({
                  read_at: readAt,
                })
                .eq("id", newMessage.id)
                .then(({ error }) => {
                  if (error) {
                    console.error(
                      "LIVE MESSAGE READ ERROR:",
                      error
                    );
                  }
                });
            }

            setMessages(
              (current) => {
                if (
                  current.some(
                    (message) =>
                      message.id ===
                      newMessage.id
                  )
                ) {
                  return current;
                }

                return [
                  ...current,
                  newMessage,
                ];
              }
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            const updatedMessage =
              payload.new;

            setMessages(
              (current) =>
                current.map(
                  (message) =>
                    message.id ===
                    updatedMessage.id
                      ? {
                          ...message,
                          ...updatedMessage,
                        }
                      : message
                )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "conversation_agreements",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            setAgreement(
              payload.new
            );
            setAgreementMode("view");
            setAgreementMessage("");
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table:
              "conversation_agreements",
            filter:
              `conversation_id=eq.${id}`,
          },
          (payload) => {
            if (
              payload.new.status ===
              "superseded"
            ) {
              return;
            }

            setAgreement(
              payload.new
            );
            setAgreementMode("view");
            setAgreementMessage("");
          }
        )
        .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id, id]);

  function updateAgreementField(
    field,
    value
  ) {
    setAgreementForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  function openAgreementForm() {
    setAgreementMessage("");
    setAgreementForm({
      ...agreementToForm(
        agreement,
        jobTitle,
        jobBudget
      ),
      priceAmount:
        jobBudget === null ||
        jobBudget === undefined
          ? ""
          : String(jobBudget),
      priceCurrency: "PLN",
    });
    setAgreementMode("form");
  }

  async function handleAgreementSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !user?.id ||
      !id ||
      agreementSaving ||
      messagingBlocked
    ) {
      return;
    }

    if (
      !agreement &&
      conversation?.client_id !==
        user.id
    ) {
      setAgreementMessage(
        "Pierwszą propozycję warunków wysyła zleceniodawca."
      );
      return;
    }

    const price =
      parseAgreementPrice(
        agreementForm.priceAmount
      );

    const revisions = Number(
      agreementForm.revisions
    );

    const today = new Date();
    const todayLocal = [
      today.getFullYear(),
      String(
        today.getMonth() + 1
      ).padStart(2, "0"),
      String(
        today.getDate()
      ).padStart(2, "0"),
    ].join("-");

    if (
      agreementForm.title.trim().length < 3
    ) {
      setAgreementMessage(
        "Nazwa zlecenia musi mieć co najmniej 3 znaki."
      );
      return;
    }

    if (
      agreementForm.scope.trim().length < 10
    ) {
      setAgreementMessage(
        "Zakres pracy musi mieć co najmniej 10 znaków."
      );
      return;
    }

    if (
      agreementForm.deliverables.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz rezultat końcowy zlecenia."
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      price > MAX_JOB_BUDGET
    ) {
      setAgreementMessage(
        "Nie udało się pobrać ceny ze zlecenia. Odśwież stronę i spróbuj ponownie."
      );
      return;
    }

    if (!agreementForm.deadline) {
      setAgreementMessage(
        "Wybierz termin wykonania."
      );
      return;
    }

    if (
      agreementForm.deadline <
      todayLocal
    ) {
      setAgreementMessage(
        "Termin wykonania nie może być wcześniejszy niż dzisiaj."
      );
      return;
    }

    if (
      !Number.isInteger(revisions) ||
      revisions < 0 ||
      revisions > 100
    ) {
      setAgreementMessage(
        "Wpisz pełną liczbę poprawek od 0 do 100."
      );
      return;
    }

    if (
      agreementForm.deliveryFormat.trim().length < 2
    ) {
      setAgreementMessage(
        "Wpisz format przekazania pracy."
      );
      return;
    }

    if (
      agreementForm.acceptanceMethod.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz sposób odbioru pracy."
      );
      return;
    }

    if (
      agreementForm.cancellationTerms.trim().length < 3
    ) {
      setAgreementMessage(
        "Opisz warunki anulowania zlecenia."
      );
      return;
    }

    setAgreementSaving(true);
    setAgreementMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "propose_conversation_agreement",
          {
            p_conversation_id: id,
            p_title:
              agreementForm.title.trim(),
            p_scope:
              agreementForm.scope.trim(),
            p_deliverables:
              agreementForm.deliverables.trim(),
            p_price_amount: price,
            p_price_currency:
              agreementForm.priceCurrency,
            p_deadline:
              agreementForm.deadline,
            p_revisions: revisions,
            p_delivery_format:
              agreementForm.deliveryFormat.trim(),
            p_acceptance_method:
              agreementForm.acceptanceMethod.trim(),
            p_cancellation_terms:
              agreementForm.cancellationTerms.trim(),
            p_additional_terms:
              agreementForm.additionalTerms.trim(),
          }
        );

      if (error) {
        throw error;
      }

      await loadAgreement(
        conversation,
        jobTitle,
        jobBudget
      );

      setAgreementMessage(
        "Propozycja została wysłana. Możecie dalej omawiać ją na czacie."
      );
    } catch (error) {
      setAgreementMessage(
        error?.message ||
          "Nie udało się zapisać warunków współpracy."
      );
    } finally {
      setAgreementSaving(false);
    }
  }

  async function handleAgreementAccept() {
    if (
      !agreement?.id ||
      agreementSaving ||
      messagingBlocked
    ) {
      return;
    }

    setAgreementSaving(true);
    setAgreementMessage("");

    try {
      const { error } =
        await supabase.rpc(
          "accept_conversation_agreement",
          {
            p_agreement_id:
              agreement.id,
          }
        );

      if (error) {
        throw error;
      }

      await loadAgreement(
        conversation,
        jobTitle,
        jobBudget
      );

      setAgreementMessage(
        "Warunki zostały zaakceptowane i zablokowane. Zlecenie może rozpocząć realizację."
      );
    } catch (error) {
      setAgreementMessage(
        error?.message ||
          "Nie udało się zaakceptować warunków współpracy."
      );
    } finally {
      setAgreementSaving(false);
    }
  }

  async function handleSend(
    event
  ) {
    event.preventDefault();

    const content =
      draft.trim();

    if (
      !content ||
      !user?.id ||
      !id ||
      sending ||
      blockedByMe ||
      blockedMe
    ) {
      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .insert({
          conversation_id: id,
          sender_id: user.id,
          content,
        })
        .select(
          "id, conversation_id, sender_id, content, created_at, read_at"
        )
        .single();

      if (error) {
        throw error;
      }

      setDraft("");

      /*
       * Dodajemy wiadomość lokalnie od razu.
       * Realtime ma ochronę przed duplikatem po id.
       */
      if (data?.id) {
        setMessages(
          (current) =>
            current.some(
              (message) =>
                message.id === data.id
            )
              ? current
              : [...current, data]
        );
      }
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Nie udało się wysłać wiadomości."
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteConversation() {
    if (
      !user?.id ||
      !id ||
      deleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Usunąć tę rozmowę z Twojej listy? Druga osoba nadal zachowa historię wiadomości."
      );

    if (!confirmed) return;

    setDeleting(true);
    setErrorMessage("");

    try {
      const { error } =
        await supabase
          .from(
            "conversation_user_state"
          )
          .upsert(
            {
              conversation_id: id,
              user_id: user.id,
              hidden_at:
                new Date().toISOString(),
            },
            {
              onConflict:
                "conversation_id,user_id",
            }
          );

      if (error) {
        throw error;
      }

      navigate(
        "/messages",
        {
          replace: true,
        }
      );
    } catch (error) {
      setErrorMessage(
        `Nie udało się usunąć rozmowy: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setDeleting(false);
    }
  }

  const otherName =
    otherProfile?.name ||
    "Użytkownik";

  const otherInitial =
    otherName
      .charAt(0)
      .toUpperCase();

  const lastReadOwnMessageId =
    [...messages]
      .reverse()
      .find(
        (message) =>
          message.sender_id ===
            user?.id &&
          !!message.read_at
      )?.id || null;

  const messagingBlocked =
    blockedByMe || blockedMe;

  const agreementsRequired =
    !!conversation?.agreements_required;

  const agreementAccepted =
    !agreementsRequired ||
    agreement?.status === "accepted";

  const isClient =
    conversation?.client_id ===
    user?.id;

  const currentUserAccepted =
    !agreementsRequired ||
    (isClient
      ? !!agreement?.client_accepted_at
      : !!agreement?.contractor_accepted_at);

  const otherUserAccepted =
    !agreementsRequired ||
    (isClient
      ? !!agreement?.contractor_accepted_at
      : !!agreement?.client_accepted_at);

  const otherProfileId =
    otherProfile?.id ||
    (conversation
      ? conversation.client_id ===
        user?.id
        ? conversation.contractor_id
        : conversation.client_id
      : null);

  return (
    <div className="account-page">
      <AccountNavbar />

      <main className="chat-page">
        <style>{`
          .chat-page {
            width: min(980px, calc(100% - 32px));
            margin: 34px auto 60px;
          }

          .chat-shell {
            min-height: 68vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(20,20,20,.08);
            border-radius: 24px;
            background: #fff;
            box-shadow: 0 18px 55px rgba(20,20,20,.06);
          }

          .chat-header {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 20px;
            border-bottom: 1px solid rgba(20,20,20,.07);
            background: rgba(250,250,247,.96);
          }

          .chat-back {
            flex: 0 0 auto;
            border: 0;
            background: transparent;
            color: #555;
            font: inherit;
            cursor: pointer;
          }

          .chat-profile-link {
            min-width: 0;
            display: flex;
            align-items: center;
            gap: 12px;
            color: inherit;
            text-decoration: none;
          }

          .chat-profile-link:hover .chat-person strong {
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .chat-profile-blocked {
            cursor: pointer;
          }

          .chat-profile-blocked:hover .chat-person strong {
            text-decoration: underline;
            text-underline-offset: 3px;
          }

          .chat-avatar {
            width: 46px;
            height: 46px;
            flex: 0 0 46px;
            overflow: hidden;
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: #ecece8;
            font-weight: 800;
          }

          .chat-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .chat-avatar-blocked {
            background: #dfdfda;
            color: #74746f;
            font-size: 22px;
            font-weight: 500;
          }

          .chat-person {
            min-width: 0;
          }

          .chat-person strong {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 16px;
          }

          .chat-person span {
            display: block;
            margin-top: 2px;
            color: #8b8b86;
            font-size: 12px;
          }

          .chat-header-actions {
            flex: 0 0 auto;
            margin-left: auto;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .chat-delete-button {
            flex: 0 0 auto;
            min-height: 38px;
            padding: 8px 12px;
            border-radius: 11px;
            background: #fff;
            font: inherit;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
          }

          .chat-delete-button {
            border: 1px solid #e2d9d6;
            color: #8e352b;
          }

          .chat-delete-button:hover {
            background: #fff7f5;
          }

          .chat-delete-button:disabled {
            cursor: wait;
            opacity: .6;
          }

          .chat-messages {
            flex: 1;
            min-height: 420px;
            max-height: 62vh;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 9px;
            padding: 22px;
            background: #f7f7f4;
          }

          .chat-empty {
            margin: auto;
            max-width: 420px;
            color: #888;
            text-align: center;
            line-height: 1.6;
          }

          .chat-message {
            max-width: min(72%, 620px);
            padding: 11px 14px 8px;
            border-radius: 18px;
            background: #fff;
            box-shadow: 0 2px 10px rgba(20,20,20,.04);
          }

          .chat-message.is-mine {
            align-self: flex-end;
            background: #171717;
            color: #fff;
            border-bottom-right-radius: 6px;
          }

          .chat-message.is-theirs {
            align-self: flex-start;
            border-bottom-left-radius: 6px;
          }

          .chat-message p {
            margin: 0;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            line-height: 1.5;
          }

          .chat-message time {
            display: block;
            margin-top: 5px;
            color: #999;
            font-size: 10px;
            text-align: right;
          }

          .chat-message.is-mine time {
            color: rgba(255,255,255,.58);
          }

          .chat-read-receipt {
            align-self: flex-end;
            margin: -3px 5px 3px 0;
            color: #92928d;
            font-size: 10px;
            line-height: 1;
          }

          .chat-block-banner {
            margin: 0;
            padding: 12px 18px;
            border-top: 1px solid #eadfdc;
            background: #fff8f6;
            color: #7f4037;
            font-size: 13px;
            line-height: 1.5;
            text-align: center;
          }

          .chat-form {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            padding: 15px;
            border-top: 1px solid rgba(20,20,20,.07);
            background: #fff;
          }

          .chat-form textarea {
            flex: 1;
            min-height: 48px;
            max-height: 140px;
            resize: vertical;
            padding: 13px 15px;
            border: 1px solid rgba(20,20,20,.12);
            border-radius: 15px;
            outline: none;
            background: #f8f8f5;
            color: #171717;
            font: inherit;
            line-height: 1.45;
          }

          .chat-form textarea:focus {
            border-color: #171717;
            box-shadow: 0 0 0 3px rgba(20,20,20,.05);
          }

          .chat-send {
            min-height: 48px;
            padding: 0 18px;
            border: 1px solid #171717;
            border-radius: 14px;
            background: #171717;
            color: #fff;
            font: inherit;
            font-weight: 750;
            cursor: pointer;
          }

          .chat-send:disabled {
            cursor: wait;
            opacity: .55;
          }

          .chat-error {
            margin: 0;
            padding: 10px 18px;
            border-top: 1px solid #f0d6d1;
            background: #fff7f5;
            color: #9b352b;
            font-size: 13px;
          }

          @media (max-width: 600px) {
            .chat-page {
              width: 100%;
              margin: 0;
            }

            .chat-shell {
              min-height: calc(100vh - 70px);
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .chat-header {
              padding: 14px;
              gap: 10px;
              flex-wrap: wrap;
            }

            .chat-profile-link {
              gap: 9px;
            }

            .chat-person span {
              display: none;
            }

            .chat-header-actions {
              width: 100%;
              justify-content: flex-end;
            }

            .chat-delete-button {
              padding: 8px 10px;
            }

            .chat-messages {
              min-height: 0;
              max-height: none;
              padding: 15px 12px;
            }

            .chat-message {
              max-width: 84%;
            }

            .chat-form {
              padding: 10px;
            }

            .chat-send {
              padding: 0 14px;
            }
          }
        `}</style>

        <div className="chat-shell">
          {loading ? (
            <div className="chat-empty">
              Ładowanie rozmowy...
            </div>
          ) : errorMessage &&
            !conversation ? (
            <div className="chat-empty">
              {errorMessage}
            </div>
          ) : (
            <>
              <header className="chat-header">
                <button
                  type="button"
                  className="chat-back"
                  onClick={() =>
                    navigate(
                      "/messages"
                    )
                  }
                >
                  ← Wróć
                </button>

                {messagingBlocked ? (
                  <Link
                    className="chat-profile-link chat-profile-blocked"
                    to={`/profile/${otherProfileId}`}
                    aria-label="Zablokowany użytkownik"
                  >
                    <div
                      className="chat-avatar chat-avatar-blocked"
                      aria-hidden="true"
                    >
                      ×
                    </div>

                    <div className="chat-person">
                      <strong>
                        Zablokowany użytkownik
                      </strong>
                      <span>
                        Kliknij, aby otworzyć ukryty profil
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    className="chat-profile-link"
                    to={`/profile/${otherProfileId}`}
                    aria-label={`Otwórz profil: ${otherName}`}
                  >
                    <div className="chat-avatar">
                      {otherProfile?.avatar_url ? (
                        <img
                          src={
                            otherProfile.avatar_url
                          }
                          alt=""
                        />
                      ) : (
                        otherInitial
                      )}
                    </div>

                    <div className="chat-person">
                      <strong>
                        {otherName}
                      </strong>
                      <span>
                        Kliknij, aby zobaczyć profil
                      </span>
                    </div>
                  </Link>
                )}

                <div className="chat-header-actions">
                  <button
                    type="button"
                    className="chat-delete-button"
                    onClick={
                      handleDeleteConversation
                    }
                    disabled={deleting}
                  >
                    {deleting
                      ? "Usuwanie..."
                      : "Usuń rozmowę"}
                  </button>
                </div>
              </header>

              <AgreementPanel
                required={agreementsRequired}
                agreement={agreement}
                loading={agreementLoading}
                saving={agreementSaving}
                mode={agreementMode}
                form={agreementForm}
                message={agreementMessage}
                currentUserAccepted={currentUserAccepted}
                otherUserAccepted={otherUserAccepted}
                blocked={messagingBlocked}
                onFieldChange={updateAgreementField}
                onOpenForm={openAgreementForm}
                onCancelForm={() => {
                  setAgreementMode("view");
                  setAgreementMessage("");
                }}
                onSubmit={handleAgreementSubmit}
                onAccept={handleAgreementAccept}
              />

              <ChatDisputePanel
                agreement={agreement}
                conversation={conversation}
              />

              {agreementsRequired &&
                !agreementAccepted && (
                  <p className="agreement-negotiation-banner">
                    Czat negocjacyjny jest otwarty. Możecie omawiać i zmieniać propozycję, ale realizacja zlecenia rozpocznie się dopiero po wspólnej akceptacji warunków.
                  </p>
                )}

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    Rozmowa została otwarta.
                    Napisz pierwszą wiadomość
                    i ustal szczegóły współpracy.
                  </div>
                ) : (
                  messages.map(
                    (message) => (
                      <React.Fragment
                        key={message.id}
                      >
                        <div
                          className={`chat-message ${
                            message.sender_id ===
                            user.id
                              ? "is-mine"
                              : "is-theirs"
                          }`}
                        >
                          <p>
                            {
                              message.content
                            }
                          </p>

                          <time>
                            {new Date(
                              message.created_at
                            ).toLocaleTimeString(
                              "pl-PL",
                              {
                                hour:
                                  "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </time>
                        </div>

                        {message.id ===
                          lastReadOwnMessageId && (
                          <span className="chat-read-receipt">
                            Wyświetlono
                          </span>
                        )}
                      </React.Fragment>
                    )
                  )
                )}
              </div>

              {errorMessage && (
                <p className="chat-error">
                  {errorMessage}
                </p>
              )}

              {messagingBlocked && (
                <p className="chat-block-banner">
                  {blockedByMe
                    ? "Zablokowałeś tego użytkownika. Otwórz ukryty profil i użyj menu z trzema kropkami, aby go odblokować."
                    : "Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości w tej rozmowie jest wyłączone."}
                </p>
              )}

              <form
                className="chat-form"
                onSubmit={
                  handleSend
                }
              >
                <textarea
                  value={draft}
                  onChange={(event) =>
                    setDraft(
                      event.target.value
                    )
                  }
                  placeholder="Napisz wiadomość..."
                  maxLength={4000}
                  disabled={
                    sending ||
                    messagingBlocked
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      event.currentTarget
                        .form
                        ?.requestSubmit();
                    }
                  }}
                />

                <button
                  type="submit"
                  className="chat-send"
                  disabled={
                    sending ||
                    !draft.trim() ||
                    messagingBlocked
                  }
                >
                  {sending
                    ? "Wysyłanie..."
                    : "Wyślij"}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


/* =========================================================
   DISPUTES AND ADMINISTRATION
========================================================= */

const DISPUTE_WRITABLE_STATUSES = [
  "awaiting_response",
  "evidence_collection",
  "under_review",
  "appealed",
];

const EVIDENCE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
];

const ADMIN_AUDIT_LABELS = {
  owner_bootstrapped: "Utworzono konto właściciela",
  admin_granted: "Nadano rolę administratora",
  admin_revoked: "Odebrano rolę administratora",
  dispute_opened: "Otwarto spór",
  dispute_context_notice_acknowledged:
    "Potwierdzono informację o dostępie administracji",
  statement_added: "Dodano wyjaśnienie",
  first_response_added: "Dodano pierwszą odpowiedź",
  dispute_cancelled: "Wycofano spór",
  evidence_registered: "Dodano plik dowodowy",
  chat_message_attached: "Dołączono wiadomość jako dowód",
  dispute_taken_for_review: "Przejęto sprawę do analizy",
  dispute_viewed: "Wyświetlono sprawę",
  case_context_viewed: "Wyświetlono pełny czat i formularz",
  admin_message_added: "Wysłano wiadomość administratora",
  internal_note_added: "Dodano notatkę wewnętrzną",
  decision_issued: "Wydano decyzję",
  appeal_submitted: "Złożono odwołanie",
  dispute_closed: "Zamknięto sprawę",
  erasure_identity_verified: "Potwierdzono tożsamość wnioskodawcy",
  erasure_case_prepared: "Przygotowano operację usunięcia danych",
  erasure_case_authorized: "Owner zatwierdził operację usunięcia",
  erasure_execution_started: "Rozpoczęto operację usunięcia danych",
  erasure_case_completed: "Zakończono operację usunięcia danych",
  erasure_case_failed: "Operacja usunięcia wymaga interwencji",
  moderation_restriction_imposed: "Nałożono ograniczenie konta",
  moderation_restriction_lifted: "Zdjęto ograniczenie konta",
  moderation_appeal_accepted: "Uwzględniono odwołanie od ograniczenia",
  moderation_appeal_rejected: "Utrzymano decyzję po odwołaniu",
};

function formatDisputeMoney(value, currency = "PLN") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return `${amount.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function getDisputeProfileName(profile, fallback) {
  return profile?.name?.trim() || fallback;
}

function DisputeStatusPill({ status }) {
  return (
    <span className={`dispute-status-pill is-${status}`}>
      {getDisputeStatusLabel(status)}
    </span>
  );
}

function DisputeListCard({ dispute, userId, adminView = false }) {
  const participantRole =
    dispute.client_id === userId
      ? "Zleceniodawca"
      : "Wykonawca";

  return (
    <Link
      className="dispute-list-card"
      to={`/disputes/${dispute.id}`}
    >
      <div className="dispute-list-card-main">
        <div className="dispute-list-card-topline">
          <span className="dispute-case-number">
            {formatDisputeNumber(dispute.case_number)}
          </span>
          <DisputeStatusPill status={dispute.status} />
        </div>

        <h2>{dispute.job_title_snapshot}</h2>

        <div className="dispute-card-meta">
          <span>
            {adminView
              ? dispute.assigned_admin_id
                ? "Przypisana do administratora"
                : "Nieprzypisana"
              : `Twoja rola: ${participantRole}`}
          </span>
          <span>{formatDisputeMoney(
            dispute.price_amount_snapshot,
            dispute.price_currency_snapshot
          )}</span>
          <span>Otwarto: {formatDisputeDate(dispute.opened_at)}</span>
        </div>
      </div>

      <span className="dispute-card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}

function Disputes() {
  const { user } = useAuth();
  const { isStaff } = useStaffRole(user?.id);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [filter, setFilter] = useState("active");

  async function loadDisputes() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("disputes")
      .select("*")
      .or(`client_id.eq.${user.id},contractor_id.eq.${user.id}`)
      .order("opened_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    setDisputes(data || []);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function preparePage() {
      setLoading(true);
      setErrorMessage("");

      try {
        await loadDisputes();

        const { error } = await supabase.rpc(
          "mark_dispute_notifications_read",
          { p_notification_ids: null }
        );

        if (error) {
          console.error("DISPUTE NOTIFICATIONS READ ERROR:", error);
        } else {
          window.dispatchEvent(
            new CustomEvent("ideahire:dispute-notifications-read", {
              detail: { userId: user.id },
            })
          );
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            cleanSupabaseError(error, "Nie udało się pobrać spraw.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    preparePage();

    const channel = supabase
      .channel(`disputes-list-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        () => loadDisputes().catch(console.error)
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadDisputes().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const visibleDisputes = disputes.filter((dispute) => {
    if (filter === "all") return true;
    if (filter === "closed") {
      return ["closed", "cancelled"].includes(dispute.status);
    }

    return !["closed", "cancelled"].includes(dispute.status);
  });

  return (
    <div className="account-page disputes-page">
      <AccountNavbar />

      <main className="disputes-shell">
        <header className="disputes-page-header">
          <div>
            <span className="section-label">Bezpieczna współpraca</span>
            <h1>Centrum sporów</h1>
            <p>
              Tutaj znajdziesz zgłoszone problemy, wyjaśnienia, dowody i decyzje administratora.
            </p>
          </div>

          {isStaff && (
            <Link className="dispute-primary-button" to="/admin">
              Otwórz panel administratora
            </Link>
          )}
        </header>

        <div className="disputes-filter-bar" role="group" aria-label="Filtr spraw">
          {[
            ["active", "Aktywne"],
            ["closed", "Zakończone"],
            ["all", "Wszystkie"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? "is-active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="dispute-state-card">Ładowanie spraw...</div>
        ) : errorMessage ? (
          <div className="dispute-state-card is-error">{errorMessage}</div>
        ) : visibleDisputes.length === 0 ? (
          <div className="dispute-state-card">
            <span className="dispute-state-icon" aria-hidden="true">✓</span>
            <h2>Brak spraw w tej sekcji</h2>
            <p>
              Spór można otworzyć z poziomu rozmowy po wspólnej akceptacji warunków współpracy.
            </p>
            <Link className="dispute-secondary-button" to="/messages">
              Przejdź do wiadomości
            </Link>
          </div>
        ) : (
          <div className="dispute-list">
            {visibleDisputes.map((dispute) => (
              <DisputeListCard
                key={dispute.id}
                dispute={dispute}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DisputeDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const { staffRole, staffLoading, isStaff } = useStaffRole(user?.id);
  const recordedAccessRef = useRef("");
  const recordedContextAccessRef = useRef("");
  const fileInputRef = useRef(null);

  const [dispute, setDispute] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [statements, setStatements] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [messageEvidence, setMessageEvidence] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminAgreements, setAdminAgreements] = useState([]);
  const [adminContextLoading, setAdminContextLoading] = useState(false);
  const [adminContextError, setAdminContextError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [statementBody, setStatementBody] = useState("");
  const [fileCaption, setFileCaption] = useState("");
  const [showMessagePicker, setShowMessagePicker] = useState(false);
  const [appealBody, setAppealBody] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [adminNotePublic, setAdminNotePublic] = useState(true);
  const [decisionForm, setDecisionForm] = useState(
    createEmptyDisputeDecisionForm
  );
  const [decisionMessage, setDecisionMessage] = useState("");

  const isParticipant = Boolean(
    dispute &&
      user?.id &&
      [dispute.client_id, dispute.contractor_id].includes(user.id)
  );

  const canAddEvidence = Boolean(
    !isStaff &&
      isParticipant &&
      DISPUTE_WRITABLE_STATUSES.includes(dispute?.status)
  );

  async function loadCase(showLoader = false) {
    if (!id || !user?.id) return;

    if (showLoader) setLoading(true);

    try {
      const { data: disputeData, error: disputeError } = await supabase
        .from("disputes")
        .select("*")
        .eq("id", id)
        .single();

      if (disputeError) throw disputeError;

      const participant = [
        disputeData.client_id,
        disputeData.contractor_id,
      ].includes(user.id);

      const relatedRequests = [
        supabase
          .from("dispute_statements")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_evidence")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: true }),
        supabase
          .from("dispute_message_evidence")
          .select("*")
          .eq("dispute_id", id)
          .order("message_created_at_snapshot", { ascending: true }),
        supabase
          .from("dispute_decisions")
          .select("*")
          .eq("dispute_id", id)
          .order("version", { ascending: false }),
        supabase
          .from("dispute_appeals")
          .select("*")
          .eq("dispute_id", id)
          .order("created_at", { ascending: false }),
      ];

      const [
        statementResult,
        evidenceResult,
        messageEvidenceResult,
        decisionResult,
        appealResult,
      ] = await Promise.all(relatedRequests);

      for (const result of [
        statementResult,
        evidenceResult,
        messageEvidenceResult,
        decisionResult,
        appealResult,
      ]) {
        if (result.error) throw result.error;
      }

      const profileIds = [
        disputeData.client_id,
        disputeData.contractor_id,
        disputeData.assigned_admin_id,
        ...(statementResult.data || []).map((item) => item.author_user_id),
      ].filter(Boolean);

      let profileMap = {};
      const uniqueProfileIds = [...new Set(profileIds)];

      if (uniqueProfileIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", uniqueProfileIds);

        if (profileError) {
          console.error("DISPUTE PROFILES ERROR:", profileError);
        } else {
          profileMap = Object.fromEntries(
            (profileRows || []).map((profile) => [profile.id, profile])
          );
        }
      }

      let conversationMessages = [];
      let fullAdminMessages = [];
      let fullAdminAgreements = [];

      if (participant && !isStaff) {
        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, content, created_at")
          .eq("conversation_id", disputeData.conversation_id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) {
          console.error("DISPUTE CHAT MESSAGES ERROR:", error);
        } else {
          conversationMessages = data || [];
        }
      }

      const canReadAdminContext = Boolean(
        isStaff && disputeData.assigned_admin_id === user.id
      );

      if (canReadAdminContext) {
        setAdminContextLoading(true);
        setAdminContextError("");

        try {
          const { data: agreementRows, error: agreementError } = await supabase
            .from("conversation_agreements")
            .select("*")
            .eq("conversation_id", disputeData.conversation_id)
            .order("version", { ascending: false });

          if (agreementError) throw agreementError;
          fullAdminAgreements = agreementRows || [];

          const pageSize = 500;
          let from = 0;

          while (true) {
            const { data: messageRows, error: messageError } = await supabase
              .from("messages")
              .select("id, conversation_id, sender_id, content, created_at, read_at")
              .eq("conversation_id", disputeData.conversation_id)
              .order("created_at", { ascending: true })
              .range(from, from + pageSize - 1);

            if (messageError) throw messageError;

            const currentPage = messageRows || [];
            fullAdminMessages.push(...currentPage);

            if (currentPage.length < pageSize) break;
            from += pageSize;
          }
        } catch (contextError) {
          console.error("ADMIN CASE CONTEXT ERROR:", contextError);
          setAdminContextError(
            cleanSupabaseError(
              contextError,
              "Nie udało się pobrać pełnego kontekstu sprawy."
            )
          );
        } finally {
          setAdminContextLoading(false);
        }
      } else {
        setAdminContextError("");
      }

      setDispute(disputeData);
      setProfiles(profileMap);
      setStatements(statementResult.data || []);
      setEvidence(evidenceResult.data || []);
      setMessageEvidence(messageEvidenceResult.data || []);
      setDecisions(decisionResult.data || []);
      setAppeals(appealResult.data || []);
      setChatMessages(conversationMessages);
      setAdminChatMessages(fullAdminMessages);
      setAdminAgreements(fullAdminAgreements);
      setPageMessage("");

      const { data: notificationRows, error: notificationError } = await supabase
        .from("dispute_notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("dispute_id", id)
        .is("read_at", null);

      if (!notificationError && notificationRows?.length) {
        await supabase.rpc("mark_dispute_notifications_read", {
          p_notification_ids: notificationRows.map((item) => item.id),
        });

        window.dispatchEvent(
          new CustomEvent("ideahire:dispute-notifications-read", {
            detail: { userId: user.id },
          })
        );
      }
    } catch (error) {
      setPageMessage(
        cleanSupabaseError(error, "Nie udało się pobrać szczegółów sprawy.")
      );
      setDispute(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (staffLoading) return;
    loadCase(true);
  }, [id, user?.id, isStaff, staffLoading]);

  useEffect(() => {
    if (!id || !user?.id || staffLoading) return;

    const refresh = () => loadCase(false);
    const channel = supabase
      .channel(`dispute-details-${id}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "disputes", filter: `id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_statements", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_evidence", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_message_evidence", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dispute_decisions", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, user?.id, staffLoading, isStaff]);

  useEffect(() => {
    if (
      !id ||
      !user?.id ||
      !isStaff ||
      dispute?.assigned_admin_id !== user.id ||
      !dispute?.conversation_id
    ) {
      return;
    }

    const refreshContext = () => loadCase(false);
    const channel = supabase
      .channel(`admin-case-context-${id}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${dispute.conversation_id}`,
        },
        refreshContext
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_agreements",
          filter: `conversation_id=eq.${dispute.conversation_id}`,
        },
        refreshContext
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [
    id,
    user?.id,
    isStaff,
    dispute?.assigned_admin_id,
    dispute?.conversation_id,
  ]);

  useEffect(() => {
    if (
      !id ||
      staffLoading ||
      !isStaff ||
      recordedAccessRef.current === id
    ) {
      return;
    }

    recordedAccessRef.current = id;
    supabase
      .rpc("admin_record_dispute_access", { p_dispute_id: id })
      .then(({ error }) => {
        if (error) console.error("ADMIN ACCESS LOG ERROR:", error);
      });
  }, [id, isStaff, staffLoading]);

  useEffect(() => {
    if (
      !id ||
      !user?.id ||
      staffLoading ||
      !isStaff ||
      dispute?.assigned_admin_id !== user.id ||
      recordedContextAccessRef.current === id
    ) {
      return;
    }

    recordedContextAccessRef.current = id;
    supabase
      .rpc("admin_record_case_context_access", { p_dispute_id: id })
      .then(({ error }) => {
        if (error) console.error("ADMIN CONTEXT ACCESS LOG ERROR:", error);
      });
  }, [id, user?.id, isStaff, staffLoading, dispute?.assigned_admin_id]);

  async function runAction(actionKey, action, successMessage) {
    if (busy) return false;

    setBusy(actionKey);
    setPageMessage("");

    try {
      await action();
      setPageMessage(successMessage);
      await loadCase(false);
      return true;
    } catch (error) {
      setPageMessage(cleanSupabaseError(error, "Nie udało się wykonać operacji."));
      return false;
    } finally {
      setBusy("");
    }
  }

  async function handleAddStatement(event) {
    event.preventDefault();
    const body = statementBody.trim();

    if (body.length < 3) {
      setPageMessage("Wyjaśnienie musi mieć co najmniej 3 znaki.");
      return;
    }

    const completed = await runAction(
      "statement",
      async () => {
        const { error } = await supabase.rpc("add_dispute_statement", {
          p_dispute_id: id,
          p_body: body,
        });
        if (error) throw error;
      },
      "Wyjaśnienie zostało dodane."
    );

    if (completed) setStatementBody("");
  }

  async function handleEvidenceUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!EVIDENCE_MIME_TYPES.includes(file.type)) {
      setPageMessage("Dozwolone pliki: JPG, PNG, WEBP, PDF lub TXT.");
      return;
    }

    if (file.size <= 0 || file.size > 20 * 1024 * 1024) {
      setPageMessage("Plik dowodowy może mieć maksymalnie 20 MB.");
      return;
    }

    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-100) || "dowod";
    const uniquePart =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const storagePath = `${id}/${user.id}/${uniquePart}-${safeName}`;

    await runAction(
      "evidence",
      async () => {
        const { error: uploadError } = await supabase.storage
          .from("dispute-evidence")
          .upload(storagePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { error: registerError } = await supabase.rpc(
          "register_dispute_evidence",
          {
            p_dispute_id: id,
            p_storage_path: storagePath,
            p_caption: fileCaption.trim(),
          }
        );

        if (registerError) throw registerError;
      },
      "Plik dowodowy został bezpiecznie dodany."
    );

    setFileCaption("");
  }

  async function handleAttachMessage(messageId) {
    await runAction(
      `message-${messageId}`,
      async () => {
        const { error } = await supabase.rpc(
          "attach_chat_message_to_dispute",
          { p_dispute_id: id, p_message_id: messageId }
        );
        if (error) throw error;
      },
      "Wiadomość została dołączona jako dowód."
    );
  }

  async function handleOpenEvidence(item) {
    setBusy(`open-${item.id}`);
    setPageMessage("");

    try {
      const { data, error } = await supabase.storage
        .from("dispute-evidence")
        .createSignedUrl(item.storage_path, 60);

      if (error) throw error;
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setPageMessage(cleanSupabaseError(error, "Nie udało się otworzyć pliku."));
    } finally {
      setBusy("");
    }
  }

  async function handleCancelDispute() {
    if (!window.confirm("Czy na pewno chcesz wycofać ten spór?")) return;

    await runAction(
      "cancel",
      async () => {
        const { error } = await supabase.rpc("cancel_ideahire_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Spór został wycofany."
    );
  }

  async function handleAppeal(event) {
    event.preventDefault();
    const reason = appealBody.trim();

    if (reason.length < 20) {
      setPageMessage("Uzasadnienie odwołania musi mieć co najmniej 20 znaków.");
      return;
    }

    const completed = await runAction(
      "appeal",
      async () => {
        const { error } = await supabase.rpc("appeal_ideahire_dispute", {
          p_dispute_id: id,
          p_reason: reason,
        });
        if (error) throw error;
      },
      "Odwołanie zostało przekazane do ponownej analizy."
    );

    if (completed) setAppealBody("");
  }

  async function handleTakeDispute() {
    await runAction(
      "take",
      async () => {
        const { error } = await supabase.rpc("admin_take_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Sprawa została przypisana do Ciebie."
    );
  }

  async function handleAdminNote(event) {
    event.preventDefault();
    const body = adminNote.trim();

    if (body.length < 3) {
      setPageMessage("Wiadomość administratora musi mieć co najmniej 3 znaki.");
      return;
    }

    const completed = await runAction(
      "admin-note",
      async () => {
        const { error } = await supabase.rpc("admin_add_dispute_note", {
          p_dispute_id: id,
          p_body: body,
          p_visible_to_parties: adminNotePublic,
        });
        if (error) throw error;
      },
      adminNotePublic
        ? "Wiadomość została wysłana obu stronom."
        : "Notatka wewnętrzna została zapisana."
    );

    if (completed) setAdminNote("");
  }

  async function handleDecision(event) {
    event.preventDefault();
    if (busy) return;

    const rationale = decisionForm.rationale.trim();
    setDecisionMessage("");

    if (!decisionForm.outcome) {
      setDecisionMessage("Wybierz wynik sprawy.");
      return;
    }

    if (rationale.length < 20) {
      setDecisionMessage("Uzasadnienie decyzji musi mieć co najmniej 20 znaków.");
      return;
    }

    let amount = null;

    if (decisionForm.outcome === "partial_refund") {
      amount = Number(String(decisionForm.amount).replace(",", "."));

      if (
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount >= Number(dispute.price_amount_snapshot)
      ) {
        setDecisionMessage(
          "Częściowy zwrot musi być większy od 0 i mniejszy od ceny zlecenia."
        );
        return;
      }
    }

    const applyRestriction = Boolean(decisionForm.applyRestriction);
    const maximumDuration = staffRole === "owner" ? 365 : 30;
    const durationDays = Number(decisionForm.durationDays);

    if (applyRestriction) {
      if (![dispute.client_id, dispute.contractor_id].includes(
        decisionForm.moderationTargetUserId
      )) {
        setDecisionMessage("Wybierz stronę sporu, której ma dotyczyć zawieszenie.");
        return;
      }

      if (
        !Number.isInteger(durationDays)
        || durationDays < 1
        || durationDays > maximumDuration
      ) {
        setDecisionMessage(
          `Wybierz pełną liczbę dni od 1 do ${maximumDuration}.`
        );
        return;
      }

      if (decisionForm.publicReason.trim().length < 50) {
        setDecisionMessage(
          "Uzasadnienie zawieszenia widoczne dla użytkownika musi mieć co najmniej 50 znaków."
        );
        return;
      }

      if (decisionForm.termsReference.trim().length < 10) {
        setDecisionMessage("Wskaż konkretny punkt regulaminu dla zawieszenia.");
        return;
      }

      if (decisionForm.internalNote.trim().length < 20) {
        setDecisionMessage(
          "Notatka dowodowa dotycząca zawieszenia musi mieć co najmniej 20 znaków."
        );
        return;
      }

      if (!window.confirm(
        "Decyzja w sporze i czasowe zawieszenie konta zostaną zapisane razem. Czy potwierdzasz ręczną analizę dowodów i proporcjonalność zawieszenia?"
      )) return;
    }

    setBusy("decision");

    try {
      const { data, error } = await supabase.rpc(
        "admin_issue_dispute_decision_with_moderation",
        {
          p_dispute_id: id,
          p_outcome: decisionForm.outcome,
          p_rationale: rationale,
          p_amount: amount,
          p_apply_restriction: applyRestriction,
          p_moderation_target_user_id: applyRestriction
            ? decisionForm.moderationTargetUserId
            : null,
          p_duration_days: applyRestriction ? durationDays : null,
          p_reason_code: applyRestriction ? decisionForm.reasonCode : null,
          p_public_reason: applyRestriction
            ? decisionForm.publicReason.trim()
            : null,
          p_terms_reference: applyRestriction
            ? decisionForm.termsReference.trim()
            : null,
          p_legal_basis: applyRestriction
            ? decisionForm.legalBasis.trim() || null
            : null,
          p_internal_note: applyRestriction
            ? decisionForm.internalNote.trim()
            : null,
        }
      );

      if (error) throw error;
      if (!data?.decision_id) {
        throw new Error("Baza nie potwierdziła utworzenia decyzji.");
      }
      if (applyRestriction && !data?.moderation_case_id) {
        throw new Error("Baza nie potwierdziła utworzenia zawieszenia.");
      }

      setDecisionForm(createEmptyDisputeDecisionForm());
      setDecisionMessage(
        applyRestriction
          ? "Decyzja została zapisana, konto zawieszone, a użytkownik otrzymał zawiadomienie."
          : "Decyzja została zapisana i przekazana obu stronom."
      );
      await loadCase(false);
    } catch (error) {
      setDecisionMessage(cleanSupabaseError(
        error,
        "Nie udało się zapisać decyzji. Żadna część operacji nie została wykonana."
      ));
    } finally {
      setBusy("");
    }
  }

  async function handleCloseDispute() {
    await runAction(
      "close",
      async () => {
        const { error } = await supabase.rpc("admin_close_dispute", {
          p_dispute_id: id,
        });
        if (error) throw error;
      },
      "Sprawa została zamknięta."
    );
  }

  if (staffLoading) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <div className="account-page disputes-page">
        {isStaff ? <AdminNavbar /> : <AccountNavbar />}
        <main className="disputes-shell">
          <div className="dispute-state-card">Ładowanie szczegółów sprawy...</div>
        </main>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="account-page disputes-page">
        {isStaff ? <AdminNavbar /> : <AccountNavbar />}
        <main className="disputes-shell">
          <div className="dispute-state-card is-error">
            <h1>Nie znaleziono sprawy</h1>
            <p>{pageMessage || "Nie masz dostępu do tej sprawy albo nie istnieje."}</p>
            <button
              type="button"
              className="dispute-secondary-button"
              onClick={() => navigate(isStaff ? "/admin" : "/disputes")}
            >
              Wróć do centrum sporów
            </button>
          </div>
        </main>
      </div>
    );
  }

  const clientName = getDisputeProfileName(
    profiles[dispute.client_id],
    "Zleceniodawca"
  );
  const contractorName = getDisputeProfileName(
    profiles[dispute.contractor_id],
    "Wykonawca"
  );
  const currentDecision = decisions.find((item) => item.is_current);
  const alreadyAppealed = appeals.some((item) => item.appealed_by === user.id);
  const appealIsOpen = Boolean(
    !isStaff &&
      isParticipant &&
      dispute.status === "decision_issued" &&
      dispute.appeal_deadline_at &&
      new Date(dispute.appeal_deadline_at).getTime() >= Date.now() &&
      !alreadyAppealed
  );
  const canCancel = Boolean(
    !isStaff &&
      isParticipant &&
      dispute.opened_by === user.id &&
      dispute.status === "awaiting_response" &&
      !statements.some(
        (item) =>
          item.author_user_id &&
          item.author_user_id !== dispute.opened_by &&
          ["response", "comment"].includes(item.statement_type)
      )
  );
  const attachedMessageIds = new Set(
    messageEvidence.map((item) => item.message_id)
  );

  return (
    <div className="account-page disputes-page">
      {isStaff ? <AdminNavbar /> : <AccountNavbar />}

      <main className="disputes-shell dispute-details-shell">
        <div className="dispute-back-row">
          <Link to={isStaff ? "/admin" : "/disputes"}>
            ← {isStaff ? "Panel administratora" : "Centrum sporów"}
          </Link>
        </div>

        <header className="dispute-detail-header">
          <div>
            <span className="dispute-case-number">
              {formatDisputeNumber(dispute.case_number)}
            </span>
            <h1>{dispute.job_title_snapshot}</h1>
            <p>Sprawa otwarta {formatDisputeDate(dispute.opened_at)}</p>
          </div>
          <DisputeStatusPill status={dispute.status} />
        </header>

        {pageMessage && (
          <p className="dispute-page-message" role="status">{pageMessage}</p>
        )}

        <section
          className="dispute-transparency-banner"
          aria-labelledby="dispute-transparency-title"
        >
          <span className="dispute-transparency-icon" aria-hidden="true">i</span>
          <div>
            <strong id="dispute-transparency-title">
              Kontrolowany dostęp do kontekstu sprawy
            </strong>
            <p>
              Pełną rozmowę, formularz współpracy i dowody może wyświetlić
              wyłącznie administrator przypisany do tego sporu. Dostęp jest
              tylko do odczytu, a każde otwarcie zostaje zapisane.
            </p>
            {dispute.context_access_acknowledged_at && (
              <small>
                Informację potwierdzono przy otwarciu sporu: {" "}
                {formatDisputeDate(
                  dispute.context_access_acknowledged_at
                )}
              </small>
            )}
          </div>
        </section>

        <div className="dispute-detail-grid">
          <div className="dispute-detail-main">
            {currentDecision && (
              <section className="dispute-panel dispute-decision-panel">
                <span className="dispute-eyebrow">Aktualna decyzja</span>
                <h2>{getOptionLabel(ADMIN_DECISION_OPTIONS, currentDecision.outcome)}</h2>
                {currentDecision.amount != null && (
                  <strong className="dispute-decision-amount">
                    {formatDisputeMoney(
                      currentDecision.amount,
                      dispute.price_currency_snapshot
                    )}
                  </strong>
                )}
                <p>{currentDecision.rationale}</p>
                <div className="dispute-decision-meta">
                  <span>Wersja {currentDecision.version}</span>
                  <span>Wydano: {formatDisputeDate(currentDecision.issued_at)}</span>
                  <span>
                    Operacja płatnicza: {currentDecision.payment_action_status === "not_connected"
                      ? "operator płatności nie jest jeszcze podłączony"
                      : "nie jest wymagana"}
                  </span>
                </div>
                {dispute.appeal_deadline_at && dispute.status === "decision_issued" && (
                  <p className="dispute-deadline-note">
                    Termin odwołania: {formatDisputeDate(dispute.appeal_deadline_at)}
                  </p>
                )}
              </section>
            )}

            <section className="dispute-panel">
              <div className="dispute-panel-heading">
                <div>
                  <span className="dispute-eyebrow">Historia sprawy</span>
                  <h2>Wyjaśnienia i komunikaty</h2>
                </div>
                <span className="dispute-count-badge">{statements.length}</span>
              </div>

              <div className="dispute-timeline">
                {statements.map((item) => {
                  const authorName = item.author_role === "system"
                    ? "System IdeaHire"
                    : ["admin", "owner"].includes(item.author_role)
                    ? item.visibility === "staff"
                      ? "Notatka administracyjna"
                      : "Administrator IdeaHire"
                    : getDisputeProfileName(
                        profiles[item.author_user_id],
                        item.author_role === "client" ? "Zleceniodawca" : "Wykonawca"
                      );

                  return (
                    <article
                      className={`dispute-timeline-item is-${item.author_role} ${
                        item.visibility === "staff" ? "is-private" : ""
                      }`}
                      key={item.id}
                    >
                      <div className="dispute-timeline-dot" aria-hidden="true" />
                      <div className="dispute-timeline-content">
                        <div className="dispute-timeline-meta">
                          <strong>{authorName}</strong>
                          {item.visibility === "staff" && <span>Tylko administracja</span>}
                          <time>{formatDisputeDate(item.created_at)}</time>
                        </div>
                        <p>{item.body}</p>
                      </div>
                    </article>
                  );
                })}
              </div>

              {canAddEvidence && (
                <form className="dispute-inline-form" onSubmit={handleAddStatement}>
                  <label htmlFor="dispute-statement">Dodaj wyjaśnienie</label>
                  <textarea
                    id="dispute-statement"
                    value={statementBody}
                    onChange={(event) => setStatementBody(event.target.value)}
                    placeholder="Opisz nowe okoliczności lub odpowiedz drugiej stronie..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <div className="dispute-form-footer">
                    <small>{statementBody.length}/10 000</small>
                    <button
                      className="dispute-primary-button"
                      type="submit"
                      disabled={Boolean(busy) || statementBody.trim().length < 3}
                    >
                      {busy === "statement" ? "Dodawanie..." : "Dodaj wyjaśnienie"}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {isStaff && (
              <section className="dispute-panel admin-case-context-panel">
                <div className="dispute-panel-heading">
                  <div>
                    <span className="dispute-eyebrow">Pełny kontekst sprawy</span>
                    <h2>Rozmowa i ustalenia współpracy</h2>
                    <p>
                      Materiały są dostępne wyłącznie do analizy sporu. Nie możesz edytować formularza ani pisać na czacie użytkowników.
                    </p>
                  </div>
                  <span className="admin-readonly-badge">Tylko odczyt</span>
                </div>

                {dispute.assigned_admin_id !== user.id ? (
                  <div className="admin-context-locked">
                    <span className="admin-context-lock-icon" aria-hidden="true">⌁</span>
                    <div>
                      <strong>Najpierw przejmij sprawę</strong>
                      <p>
                        Pełny czat i formularz zobaczy tylko administrator przypisany do tej sprawy. Otwarcie tych danych zostanie zapisane w rejestrze działań.
                      </p>
                    </div>
                  </div>
                ) : adminContextLoading ? (
                  <div className="admin-context-loading">Ładowanie pełnego kontekstu...</div>
                ) : adminContextError ? (
                  <div className="admin-context-error" role="alert">
                    <strong>Nie udało się otworzyć kontekstu</strong>
                    <p>{adminContextError}</p>
                  </div>
                ) : (
                  <>
                    <div className="admin-context-access-note">
                      <strong>Dostęp kontrolowany</strong>
                      <span>
                        Jesteś administratorem przypisanym do sprawy. To otwarcie zostało odnotowane.
                      </span>
                    </div>

                    <div className="admin-case-context-grid">
                      <details className="admin-context-section" open>
                        <summary>
                          <span>
                            <small>Dokument sprawy</small>
                            <strong>Formularz współpracy</strong>
                          </span>
                          <span className="dispute-count-badge">
                            {adminAgreements.length}
                          </span>
                        </summary>

                        <div className="admin-context-section-body">
                          {adminAgreements.length === 0 ? (
                            <p className="dispute-empty-copy">
                              Dla tej rozmowy nie zapisano formularza współpracy.
                            </p>
                          ) : (
                            <div className="admin-agreement-history">
                              {adminAgreements.map((agreementItem, index) => (
                                <article
                                  className={`admin-agreement-version ${
                                    agreementItem.status === "accepted" ? "is-accepted" : ""
                                  }`}
                                  key={agreementItem.id}
                                >
                                  <div className="admin-agreement-version-heading">
                                    <div>
                                      <span>Wersja {agreementItem.version}</span>
                                      <strong>
                                        {agreementItem.status === "accepted"
                                          ? "Zaakceptowana przez obie strony"
                                          : agreementItem.status === "superseded"
                                          ? "Poprzednia wersja"
                                          : "Oczekuje na akceptację"}
                                      </strong>
                                    </div>
                                    {index === 0 && (
                                      <span className="admin-current-version-badge">Najnowsza</span>
                                    )}
                                  </div>

                                  <AgreementDetails agreement={agreementItem} />

                                  <div className="admin-agreement-acceptance">
                                    <span>
                                      Zleceniodawca: {agreementItem.client_accepted_at
                                        ? formatDisputeDate(agreementItem.client_accepted_at)
                                        : "brak akceptacji"}
                                    </span>
                                    <span>
                                      Wykonawca: {agreementItem.contractor_accepted_at
                                        ? formatDisputeDate(agreementItem.contractor_accepted_at)
                                        : "brak akceptacji"}
                                    </span>
                                  </div>
                                </article>
                              ))}
                            </div>
                          )}
                        </div>
                      </details>

                      <details className="admin-context-section" open>
                        <summary>
                          <span>
                            <small>Pełny zapis rozmowy</small>
                            <strong>Czat użytkowników</strong>
                          </span>
                          <span className="dispute-count-badge">
                            {adminChatMessages.length}
                          </span>
                        </summary>

                        <div className="admin-context-section-body">
                          {adminChatMessages.length === 0 ? (
                            <p className="dispute-empty-copy">
                              W tej rozmowie nie ma jeszcze wiadomości.
                            </p>
                          ) : (
                            <div className="admin-full-chat" aria-label="Pełna rozmowa użytkowników">
                              {adminChatMessages.map((message) => {
                                const isClientMessage = message.sender_id === dispute.client_id;
                                const authorName = isClientMessage ? clientName : contractorName;

                                return (
                                  <article
                                    className={`admin-chat-message ${
                                      isClientMessage ? "is-client" : "is-contractor"
                                    }`}
                                    key={message.id}
                                  >
                                    <div className="admin-chat-message-meta">
                                      <strong>{authorName}</strong>
                                      <span>{isClientMessage ? "Zleceniodawca" : "Wykonawca"}</span>
                                      <time>{formatDisputeDate(message.created_at)}</time>
                                    </div>
                                    <p>{message.content}</p>
                                  </article>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </section>
            )}

            <section className="dispute-panel">
              <div className="dispute-panel-heading">
                <div>
                  <span className="dispute-eyebrow">Materiały</span>
                  <h2>Dowody w sprawie</h2>
                </div>
                <span className="dispute-count-badge">
                  {evidence.length + messageEvidence.length}
                </span>
              </div>

              {evidence.length === 0 && messageEvidence.length === 0 ? (
                <p className="dispute-empty-copy">Nie dodano jeszcze żadnych dowodów.</p>
              ) : (
                <div className="dispute-evidence-list">
                  {evidence.map((item) => (
                    <article className="dispute-evidence-item" key={item.id}>
                      <span className="dispute-evidence-icon" aria-hidden="true">↗</span>
                      <div>
                        <strong>{item.original_file_name}</strong>
                        <small>
                          Plik · {item.size_bytes
                            ? `${(Number(item.size_bytes) / 1024 / 1024).toFixed(2)} MB`
                            : "rozmiar nieznany"} · {formatDisputeDate(item.created_at)}
                        </small>
                        {item.caption && <p>{item.caption}</p>}
                      </div>
                      <button
                        type="button"
                        className="dispute-text-button"
                        onClick={() => handleOpenEvidence(item)}
                        disabled={busy === `open-${item.id}`}
                      >
                        Otwórz
                      </button>
                    </article>
                  ))}

                  {messageEvidence.map((item) => (
                    <article className="dispute-evidence-item is-message" key={item.id}>
                      <span className="dispute-evidence-icon" aria-hidden="true">“</span>
                      <div>
                        <strong>Wiadomość z rozmowy</strong>
                        <small>{formatDisputeDate(item.message_created_at_snapshot)}</small>
                        <p>{item.message_content_snapshot}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {canAddEvidence && (
                <div className="dispute-evidence-actions">
                  <label htmlFor="dispute-caption">Opis pliku (opcjonalnie)</label>
                  <input
                    id="dispute-caption"
                    type="text"
                    value={fileCaption}
                    onChange={(event) => setFileCaption(event.target.value)}
                    placeholder="Krótko wyjaśnij, co potwierdza plik"
                    maxLength={1000}
                    disabled={Boolean(busy)}
                  />
                  <input
                    ref={fileInputRef}
                    className="dispute-hidden-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,image/jpeg,image/png,image/webp,application/pdf,text/plain"
                    onChange={handleEvidenceUpload}
                  />
                  <div className="dispute-action-row">
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={Boolean(busy)}
                    >
                      {busy === "evidence" ? "Przesyłanie..." : "Dodaj plik"}
                    </button>
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={() => setShowMessagePicker((current) => !current)}
                      disabled={Boolean(busy)}
                    >
                      Dołącz wiadomość z czatu
                    </button>
                  </div>
                  <small>JPG, PNG, WEBP, PDF lub TXT · maksymalnie 20 MB</small>
                </div>
              )}

              {canAddEvidence && showMessagePicker && (
                <div className="dispute-message-picker">
                  <div className="dispute-panel-heading">
                    <div>
                      <h3>Wybierz wiadomość</h3>
                      <p>Administrator zobaczy tylko dołączoną wiadomość, nie cały czat.</p>
                    </div>
                    <button
                      type="button"
                      className="dispute-text-button"
                      onClick={() => setShowMessagePicker(false)}
                    >
                      Zamknij
                    </button>
                  </div>
                  <div className="dispute-message-list">
                    {chatMessages.length === 0 ? (
                      <p>W tej rozmowie nie ma jeszcze wiadomości.</p>
                    ) : (
                      chatMessages.map((message) => {
                        const alreadyAttached = attachedMessageIds.has(message.id);
                        return (
                          <article key={message.id}>
                            <div>
                              <strong>
                                {message.sender_id === user.id ? "Ty" : "Druga strona"}
                              </strong>
                              <time>{formatDisputeDate(message.created_at)}</time>
                              <p>{message.content}</p>
                            </div>
                            <button
                              type="button"
                              className="dispute-text-button"
                              onClick={() => handleAttachMessage(message.id)}
                              disabled={alreadyAttached || Boolean(busy)}
                            >
                              {alreadyAttached ? "Dołączono" : "Dołącz"}
                            </button>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </section>

            {appealIsOpen && (
              <section className="dispute-panel">
                <span className="dispute-eyebrow">Jedno odwołanie na osobę</span>
                <h2>Odwołaj się od decyzji</h2>
                <p>
                  Wskaż konkretny błąd w ocenie lub nowy istotny dowód. Termin upływa {formatDisputeDate(dispute.appeal_deadline_at)}.
                </p>
                <form className="dispute-inline-form" onSubmit={handleAppeal}>
                  <textarea
                    value={appealBody}
                    onChange={(event) => setAppealBody(event.target.value)}
                    placeholder="Uzasadnij odwołanie..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <div className="dispute-form-footer">
                    <small>{appealBody.length}/10 000</small>
                    <button
                      className="dispute-danger-button"
                      type="submit"
                      disabled={Boolean(busy) || appealBody.trim().length < 20}
                    >
                      {busy === "appeal" ? "Wysyłanie..." : "Złóż odwołanie"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {isStaff && !["closed", "cancelled"].includes(dispute.status) && (
              <section className="dispute-panel admin-workbench">
                <div className="dispute-panel-heading">
                  <div>
                    <span className="dispute-eyebrow">Tryb administracyjny</span>
                    <h2>Obsługa sprawy</h2>
                  </div>
                  <span className="admin-role-badge">
                    {staffRole === "owner" ? "Właściciel" : "Administrator"}
                  </span>
                </div>

                {dispute.assigned_admin_id !== user.id && (
                  <button
                    type="button"
                    className="dispute-primary-button"
                    onClick={handleTakeDispute}
                    disabled={Boolean(busy)}
                  >
                    {busy === "take" ? "Przypisywanie..." : "Przejmij sprawę do analizy"}
                  </button>
                )}

                <form className="admin-dispute-form" onSubmit={handleAdminNote}>
                  <h3>Wiadomość lub notatka</h3>
                  <textarea
                    value={adminNote}
                    onChange={(event) => setAdminNote(event.target.value)}
                    placeholder="Napisz prośbę o informacje albo notatkę dla administracji..."
                    maxLength={10000}
                    disabled={Boolean(busy)}
                  />
                  <label className="dispute-check-row">
                    <input
                      type="checkbox"
                      checked={adminNotePublic}
                      onChange={(event) => setAdminNotePublic(event.target.checked)}
                    />
                    <span>Wiadomość widoczna dla obu stron</span>
                  </label>
                  <button
                    type="submit"
                    className="dispute-secondary-button"
                    disabled={Boolean(busy) || adminNote.trim().length < 3}
                  >
                    {busy === "admin-note" ? "Zapisywanie..." : "Zapisz wiadomość"}
                  </button>
                </form>

                <form className="admin-dispute-form is-decision" onSubmit={handleDecision}>
                  <h3>Wydaj decyzję</h3>
                  <label>
                    Wynik sprawy
                    <select
                      value={decisionForm.outcome}
                      onChange={(event) =>
                        setDecisionForm((current) => ({
                          ...current,
                          outcome: event.target.value,
                          amount: event.target.value === "partial_refund" ? current.amount : "",
                        }))
                      }
                    >
                      <option value="">Wybierz wynik</option>
                      {ADMIN_DECISION_OPTIONS.map(([value, label]) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  {decisionForm.outcome === "partial_refund" && (
                    <label>
                      Kwota częściowego zwrotu (PLN)
                      <input
                        type="text"
                        inputMode="decimal"
                        value={decisionForm.amount}
                        onChange={(event) =>
                          setDecisionForm((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        placeholder="Np. 500"
                      />
                    </label>
                  )}
                  <label>
                    Pełne uzasadnienie
                    <textarea
                      value={decisionForm.rationale}
                      onChange={(event) =>
                        setDecisionForm((current) => ({
                          ...current,
                          rationale: event.target.value,
                        }))
                      }
                      placeholder="Opisz ustalenia, ocenione dowody i podstawę decyzji..."
                      maxLength={10000}
                    />
                  </label>

                  <fieldset className="dispute-moderation-box">
                    <legend>Odpowiedzialność jednej ze stron</legend>
                    <label className="dispute-check-row dispute-moderation-toggle">
                      <input
                        type="checkbox"
                        checked={decisionForm.applyRestriction}
                        onChange={(event) =>
                          setDecisionForm((current) => ({
                            ...current,
                            applyRestriction: event.target.checked,
                            moderationTargetUserId: event.target.checked
                              ? current.moderationTargetUserId
                              : "",
                          }))
                        }
                        disabled={Boolean(busy)}
                      />
                      <span>
                        <strong>Dodaj czasowe zawieszenie konta</strong>
                        <small>
                          Zaznacz tylko wtedy, gdy przeanalizowane zachowanie
                          stanowi również naruszenie Regulaminu IdeaHire.
                        </small>
                      </span>
                    </label>

                    {decisionForm.applyRestriction && (
                      <div className="dispute-moderation-fields">
                        <div className="moderation-form-grid">
                          <label>
                            Zawieszana strona sporu
                            <select
                              value={decisionForm.moderationTargetUserId}
                              onChange={(event) =>
                                setDecisionForm((current) => ({
                                  ...current,
                                  moderationTargetUserId: event.target.value,
                                }))
                              }
                              disabled={Boolean(busy)}
                            >
                              <option value="">Wybierz użytkownika</option>
                              <option value={dispute.client_id}>
                                Zleceniodawca — {getDisputeProfileName(
                                  profiles[dispute.client_id],
                                  "Użytkownik"
                                )}
                              </option>
                              <option value={dispute.contractor_id}>
                                Wykonawca — {getDisputeProfileName(
                                  profiles[dispute.contractor_id],
                                  "Użytkownik"
                                )}
                              </option>
                            </select>
                          </label>

                          <div className="moderation-duration-control">
                            <label>
                              Czas zawieszenia w dniach
                              <input
                                type="number"
                                min="1"
                                max={staffRole === "owner" ? "365" : "30"}
                                value={decisionForm.durationDays}
                                onChange={(event) =>
                                  setDecisionForm((current) => ({
                                    ...current,
                                    durationDays: event.target.value,
                                  }))
                                }
                                disabled={Boolean(busy)}
                              />
                            </label>
                            <div
                              className="moderation-duration-presets"
                              aria-label="Szybki wybór czasu zawieszenia"
                            >
                              {[
                                ...MODERATION_DURATION_PRESETS,
                                ...(staffRole === "owner" ? [90, 180, 365] : []),
                              ].map((days) => (
                                <button
                                  type="button"
                                  className={
                                    Number(decisionForm.durationDays) === days
                                      ? "is-selected"
                                      : ""
                                  }
                                  onClick={() =>
                                    setDecisionForm((current) => ({
                                      ...current,
                                      durationDays: String(days),
                                    }))
                                  }
                                  disabled={Boolean(busy)}
                                  key={days}
                                >
                                  {days} {days === 1 ? "dzień" : "dni"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <label>
                            Kategoria naruszenia
                            <select
                              value={decisionForm.reasonCode}
                              onChange={(event) => {
                                const reasonCode = event.target.value;
                                const previousSuggestedReference =
                                  MODERATION_CONFIRMED_TERMS_REFERENCES[
                                    decisionForm.reasonCode
                                  ];
                                const suggestedReference =
                                  MODERATION_CONFIRMED_TERMS_REFERENCES[reasonCode];
                                const canReplaceReference =
                                  !decisionForm.termsReference.trim()
                                  || decisionForm.termsReference
                                    === previousSuggestedReference;

                                setDecisionForm((current) => ({
                                  ...current,
                                  reasonCode,
                                  termsReference: canReplaceReference
                                    ? suggestedReference || ""
                                    : current.termsReference,
                                }));
                              }}
                              disabled={Boolean(busy)}
                            >
                              {Object.entries(MODERATION_REASON_LABELS).map(
                                ([value, label]) => (
                                  <option value={value} key={value}>{label}</option>
                                )
                              )}
                            </select>
                          </label>

                          <label>
                            Podstawa regulaminowa
                            <input
                              value={decisionForm.termsReference}
                              onChange={(event) =>
                                setDecisionForm((current) => ({
                                  ...current,
                                  termsReference: event.target.value,
                                }))
                              }
                              minLength={10}
                              maxLength={1000}
                              placeholder="Np. Regulamin IdeaHire § 27 pkt 107"
                              disabled={Boolean(busy)}
                            />
                          </label>
                        </div>

                        <div className="moderation-reason-guidance">
                          <strong>Zakres ręcznej analizy</strong>
                          <p>
                            {MODERATION_REASON_GUIDANCE[
                              decisionForm.reasonCode
                            ]}
                          </p>
                        </div>

                        <label>
                          Uzasadnienie zawieszenia widoczne dla użytkownika
                          <textarea
                            value={decisionForm.publicReason}
                            onChange={(event) =>
                              setDecisionForm((current) => ({
                                ...current,
                                publicReason: event.target.value,
                              }))
                            }
                            minLength={50}
                            maxLength={4000}
                            rows={5}
                            placeholder="Opisz konkretne zdarzenia, daty, wcześniejsze ostrzeżenia oraz dlaczego łagodniejszy środek jest niewystarczający."
                            disabled={Boolean(busy)}
                          />
                        </label>

                        <div className="moderation-form-grid">
                          <label>
                            Podstawa prawna — gdy dotyczy
                            <input
                              value={decisionForm.legalBasis}
                              onChange={(event) =>
                                setDecisionForm((current) => ({
                                  ...current,
                                  legalBasis: event.target.value,
                                }))
                              }
                              maxLength={1000}
                              placeholder="Pozostaw puste, jeśli decyzja opiera się na regulaminie"
                              disabled={Boolean(busy)}
                            />
                          </label>

                          <label>
                            Wewnętrzna notatka dowodowa
                            <textarea
                              value={decisionForm.internalNote}
                              onChange={(event) =>
                                setDecisionForm((current) => ({
                                  ...current,
                                  internalNote: event.target.value,
                                }))
                              }
                              minLength={20}
                              maxLength={5000}
                              rows={4}
                              placeholder="Wymień dowody przeanalizowane w tej sprawie."
                              disabled={Boolean(busy)}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </fieldset>

                  <p className="dispute-admin-warning">
                    Decyzja zostanie zapisana w historii i przekazana obu stronom.
                    Zawieszenie jest osobnym środkiem i zostanie dodane tylko po
                    zaznaczeniu odpowiedniej opcji. Operacje finansowe pozostają
                    wyłączone do czasu podłączenia operatora płatności.
                  </p>
                  {decisionMessage && (
                    <p
                      className={
                        "dispute-decision-message "
                        + (
                          decisionMessage.startsWith("Decyzja została")
                            ? "is-success"
                            : "is-error"
                        )
                      }
                      role="status"
                    >
                      {decisionMessage}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="dispute-danger-button"
                    disabled={Boolean(busy)}
                  >
                    {busy === "decision"
                      ? "Zapisywanie decyzji..."
                      : decisionForm.applyRestriction
                        ? "Wydaj decyzję i zawieś konto"
                        : "Wydaj decyzję"}
                  </button>
                </form>

                <div className="dispute-moderation-management">
                  <div>
                    <strong>Zarządzanie ograniczeniami stron</strong>
                    <p>
                      Otwórz rejestr moderacji, aby sprawdzić, zmienić albo zdjąć
                      aktywne zawieszenie konkretnego użytkownika.
                    </p>
                  </div>
                  <div className="dispute-moderation-links">
                    <Link
                      className="dispute-secondary-button"
                      to={"/admin/moderation?user=" + dispute.client_id}
                    >
                      Moderacja zleceniodawcy
                    </Link>
                    <Link
                      className="dispute-secondary-button"
                      to={"/admin/moderation?user=" + dispute.contractor_id}
                    >
                      Moderacja wykonawcy
                    </Link>
                  </div>
                </div>

                {dispute.status === "decision_issued" &&
                  dispute.appeal_deadline_at &&
                  new Date(dispute.appeal_deadline_at).getTime() < Date.now() && (
                    <button
                      type="button"
                      className="dispute-secondary-button"
                      onClick={handleCloseDispute}
                      disabled={Boolean(busy)}
                    >
                      {busy === "close" ? "Zamykanie..." : "Zamknij sprawę po terminie odwołania"}
                    </button>
                  )}
              </section>
            )}
          </div>

          <aside className="dispute-detail-sidebar">
            <section className="dispute-panel dispute-summary-card">
              <span className="dispute-eyebrow">Podsumowanie</span>
              <dl>
                <div>
                  <dt>Cena zlecenia</dt>
                  <dd>{formatDisputeMoney(
                    dispute.price_amount_snapshot,
                    dispute.price_currency_snapshot
                  )}</dd>
                </div>
                <div>
                  <dt>Termin wykonania</dt>
                  <dd>{formatDisputeDate(dispute.deadline_snapshot, false)}</dd>
                </div>
                <div>
                  <dt>Powód</dt>
                  <dd>{getOptionLabel(DISPUTE_REASON_OPTIONS, dispute.reason)}</dd>
                </div>
                <div>
                  <dt>Oczekiwane rozwiązanie</dt>
                  <dd>{getOptionLabel(DISPUTE_OUTCOME_OPTIONS, dispute.requested_outcome)}</dd>
                </div>
                {dispute.requested_amount != null && (
                  <div>
                    <dt>Oczekiwana kwota</dt>
                    <dd>{formatDisputeMoney(
                      dispute.requested_amount,
                      dispute.price_currency_snapshot
                    )}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="dispute-panel dispute-parties-card">
              <span className="dispute-eyebrow">Strony</span>
              {isStaff ? (
                <div className="dispute-party-row">
                  <div className="dispute-party-avatar">
                    {profiles[dispute.client_id]?.avatar_url ? (
                      <img src={profiles[dispute.client_id].avatar_url} alt="" />
                    ) : clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Zleceniodawca</small>
                    <strong>{clientName}</strong>
                  </div>
                </div>
              ) : (
                <Link to={`/profile/${dispute.client_id}`}>
                  <div className="dispute-party-avatar">
                    {profiles[dispute.client_id]?.avatar_url ? (
                      <img src={profiles[dispute.client_id].avatar_url} alt="" />
                    ) : clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Zleceniodawca</small>
                    <strong>{clientName}</strong>
                  </div>
                </Link>
              )}

              {isStaff ? (
                <div className="dispute-party-row">
                  <div className="dispute-party-avatar">
                    {profiles[dispute.contractor_id]?.avatar_url ? (
                      <img src={profiles[dispute.contractor_id].avatar_url} alt="" />
                    ) : contractorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Wykonawca</small>
                    <strong>{contractorName}</strong>
                  </div>
                </div>
              ) : (
                <Link to={`/profile/${dispute.contractor_id}`}>
                  <div className="dispute-party-avatar">
                    {profiles[dispute.contractor_id]?.avatar_url ? (
                      <img src={profiles[dispute.contractor_id].avatar_url} alt="" />
                    ) : contractorName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <small>Wykonawca</small>
                    <strong>{contractorName}</strong>
                  </div>
                </Link>
              )}
            </section>

            {isParticipant && !isStaff && (
              <Link
                className="dispute-secondary-button is-full"
                to={`/chat/${dispute.conversation_id}`}
              >
                Otwórz rozmowę
              </Link>
            )}

            {canCancel && (
              <button
                type="button"
                className="dispute-text-button is-danger"
                onClick={handleCancelDispute}
                disabled={Boolean(busy)}
              >
                {busy === "cancel" ? "Wycofywanie..." : "Wycofaj spór"}
              </button>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function AdminJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Wszystkie");

  async function loadAdminJobs() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("jobs")
      .select("id, user_id, title, description, category, budget, created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = data || [];
    const ownerIds = [...new Set(rows.map((job) => job.user_id).filter(Boolean))];
    let profileMap = {};

    if (ownerIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", ownerIds);

      if (profileError) {
        console.error("ADMIN JOB PROFILES ERROR:", profileError);
      } else {
        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setJobs(rows);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadAdminJobs();
      } catch (error) {
        if (mounted) {
          setMessage(
            cleanSupabaseError(error, "Nie udało się pobrać zleceń do podglądu.")
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-jobs-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => loadAdminJobs().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) => {
    if (category !== "Wszystkie" && job.category !== category) return false;
    if (!normalizedSearch) return true;

    const ownerName = getDisputeProfileName(
      profiles[job.user_id],
      "Użytkownik"
    );

    return [job.title, job.description, job.category, ownerName]
      .some((value) =>
        String(value || "").toLowerCase().includes(normalizedSearch)
      );
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Tryb tylko do odczytu</span>
            <h1>Zlecenia użytkowników</h1>
            <p>
              Administracja może sprawdzać treść i cenę zleceń, ale nie może ich tworzyć, edytować ani usuwać.
            </p>
          </div>
          <span className="admin-readonly-badge">Tylko podgląd</span>
        </header>

        <section className="admin-catalog-toolbar" aria-label="Wyszukiwanie zleceń">
          <label className="admin-search-field">
            <span>Szukaj</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nazwa, opis, kategoria lub użytkownik..."
            />
          </label>

          <label className="admin-filter-field">
            <span>Kategoria</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Wszystkie">Wszystkie</option>
              {JOB_CATEGORIES.map((item) => (
                <option value={item} key={item}>{item}</option>
              ))}
            </select>
          </label>
        </section>

        {loading ? (
          <div className="dispute-state-card">Ładowanie zleceń...</div>
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleJobs.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak pasujących zleceń</h2>
            <p>Zmień wyszukiwanie albo wybierz inną kategorię.</p>
          </div>
        ) : (
          <div className="admin-jobs-grid">
            {visibleJobs.map((job) => {
              const owner = profiles[job.user_id];
              const ownerName = getDisputeProfileName(owner, "Użytkownik");

              return (
                <article className="admin-job-card" key={job.id}>
                  <div className="admin-job-card-topline">
                    <span className="section-label">{job.category || "Bez kategorii"}</span>
                    <span className="admin-readonly-badge is-small">Podgląd</span>
                  </div>

                  <h2>{job.title}</h2>
                  <p>{job.description}</p>

                  <div className="admin-job-details">
                    <div>
                      <span>Budżet</span>
                      <strong>{formatDisputeMoney(job.budget, "PLN")}</strong>
                    </div>
                    <div>
                      <span>Opublikowano</span>
                      <strong>{formatDisputeDate(job.created_at, false)}</strong>
                    </div>
                  </div>

                  <div className="admin-job-owner">
                    <div className="admin-staff-avatar">
                      {owner?.avatar_url ? (
                        <img src={owner.avatar_url} alt="" />
                      ) : ownerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <small>Zleceniodawca</small>
                      <strong>{ownerName}</strong>
                    </div>
                  </div>

                  <Link
                    className="privacy-admin-account-link"
                    to={`/admin/moderation?user=${job.user_id}&job=${job.id}`}
                  >
                    Przejdź do moderacji konta →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminEvidenceMessages() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [disputesById, setDisputesById] = useState({});
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadEvidenceMessages() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("dispute_message_evidence")
      .select(
        "id, dispute_id, message_id, message_sender_id, message_content_snapshot, message_created_at_snapshot, submitted_by, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = data || [];
    const disputeIds = [...new Set(rows.map((item) => item.dispute_id).filter(Boolean))];
    let disputeMap = {};

    if (disputeIds.length > 0) {
      const { data: disputeRows, error: disputeError } = await supabase
        .from("disputes")
        .select("id, case_number, job_title_snapshot, status, client_id, contractor_id")
        .in("id", disputeIds);

      if (disputeError) throw disputeError;

      disputeMap = Object.fromEntries(
        (disputeRows || []).map((dispute) => [dispute.id, dispute])
      );
    }

    const profileIds = [
      ...rows.flatMap((item) => [item.message_sender_id, item.submitted_by]),
      ...Object.values(disputeMap).flatMap((dispute) => [
        dispute.client_id,
        dispute.contractor_id,
      ]),
    ].filter(Boolean);
    const uniqueProfileIds = [...new Set(profileIds)];
    let profileMap = {};

    if (uniqueProfileIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueProfileIds);

      if (profileError) {
        console.error("ADMIN EVIDENCE PROFILES ERROR:", profileError);
      } else {
        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setItems(rows);
    setDisputesById(disputeMap);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadEvidenceMessages();
      } catch (error) {
        if (mounted) {
          setMessage(
            cleanSupabaseError(
              error,
              "Nie udało się pobrać wiadomości dołączonych do sporów."
            )
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-evidence-messages-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dispute_message_evidence",
        },
        () => loadEvidenceMessages().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    if (!normalizedSearch) return true;

    const dispute = disputesById[item.dispute_id];
    const senderName = getDisputeProfileName(
      profiles[item.message_sender_id],
      "Użytkownik"
    );
    const caseNumber = dispute
      ? formatDisputeNumber(dispute.case_number)
      : "";

    return [
      item.message_content_snapshot,
      dispute?.job_title_snapshot,
      senderName,
      caseNumber,
    ].some((value) =>
      String(value || "").toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Prywatność i dowody</span>
            <h1>Wiadomości w sporach</h1>
            <p>
              Widoczne są wyłącznie wiadomości, które uczestnik świadomie dołączył jako dowód. Administracja nie otrzymuje dostępu do całych rozmów.
            </p>
          </div>
          <span className="admin-readonly-badge">Tylko podgląd</span>
        </header>

        <section className="admin-catalog-toolbar is-single" aria-label="Wyszukiwanie wiadomości">
          <label className="admin-search-field">
            <span>Szukaj wiadomości</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Treść, użytkownik, zlecenie lub numer sprawy..."
            />
          </label>
        </section>

        <div className="admin-privacy-note">
          <strong>Kontrolowany dostęp</strong>
          <p>
            Każda wiadomość poniżej jest niezmienną kopią dołączoną do konkretnej sprawy. Wejście administratora w szczegóły sprawy zapisuje się w rejestrze działań.
          </p>
        </div>

        {loading ? (
          <div className="dispute-state-card">Ładowanie wiadomości dowodowych...</div>
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleItems.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak wiadomości dowodowych</h2>
            <p>Użytkownicy nie dołączyli jeszcze wiadomości do spraw albo nic nie pasuje do wyszukiwania.</p>
          </div>
        ) : (
          <div className="admin-evidence-message-list">
            {visibleItems.map((item) => {
              const dispute = disputesById[item.dispute_id];
              const senderName = getDisputeProfileName(
                profiles[item.message_sender_id],
                "Użytkownik"
              );
              const submitterName = getDisputeProfileName(
                profiles[item.submitted_by],
                "Użytkownik"
              );

              return (
                <article className="admin-evidence-message-card" key={item.id}>
                  <div className="admin-evidence-message-heading">
                    <div>
                      <span className="dispute-case-number">
                        {dispute
                          ? formatDisputeNumber(dispute.case_number)
                          : "Sprawa"}
                      </span>
                      <h2>{dispute?.job_title_snapshot || "Zlecenie"}</h2>
                    </div>
                    {dispute && <DisputeStatusPill status={dispute.status} />}
                  </div>

                  <blockquote>{item.message_content_snapshot}</blockquote>

                  <div className="admin-evidence-message-meta">
                    <span>Autor wiadomości: <strong>{senderName}</strong></span>
                    <span>Dołączył: <strong>{submitterName}</strong></span>
                    <span>Wysłano: {formatDisputeDate(item.message_created_at_snapshot)}</span>
                  </div>

                  <Link
                    className="dispute-secondary-button"
                    to={`/disputes/${item.dispute_id}`}
                  >
                    Otwórz powiązaną sprawę
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function AdminModeration() {
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);
  const location = useLocation();
  const moderationParams = new URLSearchParams(location.search);
  const requestedUserId = moderationParams.get("user");
  const requestedJobId = moderationParams.get("job");

  const [cases, setCases] = useState([]);
  const [notices, setNotices] = useState({});
  const [appeals, setAppeals] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [sourceJob, setSourceJob] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(requestedUserId || "");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [appealNotes, setAppealNotes] = useState({});
  const [restrictionEditor, setRestrictionEditor] = useState({
    caseId: "",
    totalDurationDays: "",
    reason: "",
  });
  const [form, setForm] = useState({
    decisionType: "temporary_suspension",
    durationDays: "7",
    reasonCode: "fraud_or_scam",
    publicReason: "",
    termsReference: "",
    legalBasis: "",
    internalNote: "",
    noticeMode: "immediate",
    immediateExceptionCode: "",
    ownerConfirmation: "",
  });

  async function loadModeration(showLoading = true) {
    if (!user?.id) return;
    if (showLoading) setLoading(true);

    try {
      const { error: refreshError } = await supabase.rpc(
        "get_my_ideahire_moderation_status"
      );
      if (refreshError) throw refreshError;

      const [casesResult, noticesResult, appealsResult] = await Promise.all([
        supabase
          .from("ideahire_moderation_cases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("ideahire_moderation_notices")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("ideahire_moderation_appeals")
          .select("*")
          .order("submitted_at", { ascending: false })
          .limit(300),
      ]);

      if (casesResult.error) throw casesResult.error;
      if (noticesResult.error) throw noticesResult.error;
      if (appealsResult.error) throw appealsResult.error;

      const caseRows = casesResult.data || [];
      const noticeRows = noticesResult.data || [];
      const appealRows = appealsResult.data || [];
      const profileIds = [...new Set([
        ...caseRows.map((item) => item.target_user_id),
        ...(selectedUserId ? [selectedUserId] : []),
      ].filter(Boolean))];

      let profileMap = {};
      if (profileIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, created_at")
          .in("id", profileIds);

        if (profileError) throw profileError;
        profileMap = Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        );
      }

      setCases(caseRows);
      setNotices(Object.fromEntries(
        noticeRows.map((notice) => [notice.case_id, notice])
      ));
      setAppeals(appealRows);
      setProfiles((current) => ({ ...current, ...profileMap }));
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się pobrać spraw moderacyjnych."
      ));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadModeration(true);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const refresh = () => loadModeration(false);
    const channel = supabase
      .channel(`admin-moderation-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideahire_moderation_cases" },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideahire_moderation_appeals" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!requestedUserId) return;

    setSelectedUserId(requestedUserId);
    supabase
      .from("profiles")
      .select("id, name, avatar_url, created_at")
      .eq("id", requestedUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfiles((current) => ({ ...current, [data.id]: data }));
        }
      });
  }, [requestedUserId]);

  useEffect(() => {
    if (!requestedJobId || !requestedUserId) {
      setSourceJob(null);
      return;
    }

    supabase
      .from("jobs")
      .select("id, user_id, title, description, category, budget, created_at")
      .eq("id", requestedJobId)
      .eq("user_id", requestedUserId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setMessage(cleanSupabaseError(
            error,
            "Nie udało się dołączyć zlecenia jako źródła sprawy."
          ));
          return;
        }
        setSourceJob(data || null);
      });
  }, [requestedJobId, requestedUserId]);

  async function handleUserSearch(event) {
    event.preventDefault();
    const query = search.trim();

    if (query.length < 2) {
      setMessage("Wpisz co najmniej 2 znaki nazwy albo pełny UUID użytkownika.");
      return;
    }

    setSearching(true);
    setMessage("");

    try {
      const isUuid = /^[0-9a-f-]{36}$/i.test(query);
      let request = supabase
        .from("profiles")
        .select("id, name, avatar_url, created_at")
        .limit(20);

      request = isUuid
        ? request.eq("id", query)
        : request.ilike("name", `%${query}%`);

      const { data, error } = await request;
      if (error) throw error;

      const rows = data || [];
      setSearchResults(rows);
      setProfiles((current) => ({
        ...current,
        ...Object.fromEntries(rows.map((profile) => [profile.id, profile])),
      }));

      if (rows.length === 0) setMessage("Nie znaleziono użytkownika.");
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się wyszukać użytkownika."));
    } finally {
      setSearching(false);
    }
  }

  function selectModerationUser(profile) {
    setSelectedUserId(profile.id);
    setProfiles((current) => ({ ...current, [profile.id]: profile }));
    setSearchResults([]);
    setSearch("");
    setMessage("");
  }

  function updateModerationForm(values) {
    setForm((current) => ({ ...current, ...values }));
  }

  async function handleImposeRestriction(event) {
    event.preventDefault();
    if (!selectedUserId || busy) return;

    if (form.decisionType === "temporary_suspension") {
      const duration = Number(form.durationDays);
      const maximum = staffRole === "owner" ? 365 : 30;

      if (!Number.isInteger(duration) || duration < 1 || duration > maximum) {
        setMessage(`Wybierz pełną liczbę dni od 1 do ${maximum}.`);
        return;
      }
    }

    if (form.publicReason.trim().length < 50) {
      setMessage("Uzasadnienie dla użytkownika musi mieć co najmniej 50 znaków.");
      return;
    }

    if (form.termsReference.trim().length < 10) {
      setMessage("Wskaż konkretny punkt regulaminu.");
      return;
    }

    if (form.internalNote.trim().length < 20) {
      setMessage("Notatka wewnętrzna musi mieć co najmniej 20 znaków.");
      return;
    }

    if (
      form.decisionType === "indefinite_suspension"
      && form.ownerConfirmation.trim() !== "ZAWIESZAM KONTO"
    ) {
      setMessage("Owner musi wpisać dokładnie: ZAWIESZAM KONTO");
      return;
    }

    if (
      form.decisionType === "indefinite_suspension"
      && form.noticeMode === "immediate"
      && !form.immediateExceptionCode
    ) {
      setMessage("Natychmiastowa decyzja bezterminowa wymaga wskazania udokumentowanego wyjątku.");
      return;
    }

    if (!window.confirm(
      "Czy potwierdzasz, że przeanalizowano fakty, proporcjonalność decyzji i możliwość zastosowania łagodniejszego środka?"
    )) return;

    setBusy("impose");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_impose_ideahire_account_restriction",
        {
          p_target_user_id: selectedUserId,
          p_decision_type: form.decisionType,
          p_duration_days: form.decisionType === "temporary_suspension"
            ? Number(form.durationDays)
            : null,
          p_reason_code: form.reasonCode,
          p_public_reason: form.publicReason.trim(),
          p_terms_reference: form.termsReference.trim(),
          p_legal_basis: form.legalBasis.trim() || null,
          p_internal_note: form.internalNote.trim(),
          p_notice_mode: form.decisionType === "temporary_suspension"
            ? "immediate"
            : form.noticeMode,
          p_immediate_exception_code:
            form.decisionType === "indefinite_suspension"
              && form.noticeMode === "immediate"
              ? form.immediateExceptionCode || null
              : null,
          p_owner_confirmation:
            form.decisionType === "indefinite_suspension"
              ? form.ownerConfirmation.trim()
              : null,
          p_source_job_id: sourceJob?.id || null,
        }
      );

      if (error) throw error;

      setForm({
        decisionType: "temporary_suspension",
        durationDays: "7",
        reasonCode: "fraud_or_scam",
        publicReason: "",
        termsReference: "",
        legalBasis: "",
        internalNote: "",
        noticeMode: "immediate",
        immediateExceptionCode: "",
        ownerConfirmation: "",
      });
      setMessage("Decyzja została zapisana, a użytkownik otrzymał zawiadomienie i dostęp do odwołania.");
      await loadModeration(false);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się nałożyć ograniczenia."));
    } finally {
      setBusy("");
    }
  }

  async function handleLiftRestriction(caseId) {
    const reason = window.prompt(
      "Podaj uzasadnienie zdjęcia ograniczenia — minimum 30 znaków:"
    );

    if (!reason) return;
    if (reason.trim().length < 30) {
      setMessage("Uzasadnienie musi mieć co najmniej 30 znaków.");
      return;
    }

    setBusy(`lift:${caseId}`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_lift_ideahire_account_restriction",
        { p_case_id: caseId, p_reason: reason.trim() }
      );

      if (error) throw error;
      setMessage("Ograniczenie zostało zdjęte i użytkownik zobaczy uzasadnienie.");
      await loadModeration(false);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zdjąć ograniczenia."));
    } finally {
      setBusy("");
    }
  }

  function openRestrictionEditor(moderationCase) {
    if (
      moderationCase.decision_type !== "temporary_suspension"
      || !moderationCase.ends_at
    ) return;

    const effectiveAt = new Date(moderationCase.effective_at).getTime();
    const endsAt = new Date(moderationCase.ends_at).getTime();
    const totalDurationDays = Math.max(
      1,
      Math.round((endsAt - effectiveAt) / 86400000)
    );

    setRestrictionEditor({
      caseId: moderationCase.id,
      totalDurationDays: String(totalDurationDays),
      reason: "",
    });
    setMessage("");
  }

  async function handleUpdateRestriction(event) {
    event.preventDefault();
    if (!restrictionEditor.caseId || busy) return;

    const totalDurationDays = Number(restrictionEditor.totalDurationDays);
    const maximumDuration = staffRole === "owner" ? 365 : 30;
    const reason = restrictionEditor.reason.trim();

    if (
      !Number.isInteger(totalDurationDays)
      || totalDurationDays < 1
      || totalDurationDays > maximumDuration
    ) {
      setMessage(
        "Łączny okres zawieszenia musi wynosić od 1 do "
          + maximumDuration
          + " dni."
      );
      return;
    }

    if (reason.length < 30) {
      setMessage("Uzasadnienie zmiany musi mieć co najmniej 30 znaków.");
      return;
    }

    setBusy("update:" + restrictionEditor.caseId);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_update_ideahire_temporary_restriction",
        {
          p_case_id: restrictionEditor.caseId,
          p_total_duration_days: totalDurationDays,
          p_change_reason: reason,
        }
      );

      if (error) throw error;

      setRestrictionEditor({
        caseId: "",
        totalDurationDays: "",
        reason: "",
      });
      setMessage(
        "Czas zawieszenia został zmieniony, zapisany w historii i przekazany użytkownikowi."
      );
      await loadModeration(false);
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się zmienić czasu zawieszenia."
      ));
    } finally {
      setBusy("");
    }
  }

  function updateAppealNote(appealId, value) {
    setAppealNotes((current) => ({ ...current, [appealId]: value }));
  }

  async function handleResolveAppeal(appeal, resolution) {
    const reason = String(appealNotes[appeal.id] || "").trim();

    if (reason.length < 30) {
      setMessage("Uzasadnienie wyniku odwołania musi mieć co najmniej 30 znaków.");
      return;
    }

    setBusy(`appeal:${appeal.id}`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_resolve_ideahire_moderation_appeal",
        {
          p_appeal_id: appeal.id,
          p_resolution: resolution,
          p_reason: reason,
        }
      );

      if (error) throw error;
      setAppealNotes((current) => ({ ...current, [appeal.id]: "" }));
      setMessage(
        resolution === "lift"
          ? "Odwołanie uwzględniono, a ograniczenie zdjęto."
          : "Odwołanie rozpoznano i utrzymano decyzję."
      );
      await loadModeration(false);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się rozpoznać odwołania."));
    } finally {
      setBusy("");
    }
  }

  const selectedProfile = profiles[selectedUserId] || null;
  const selectedOpenCase = cases.find(
    (item) => item.target_user_id === selectedUserId
      && ["scheduled", "active"].includes(item.status)
      && (!item.ends_at || new Date(item.ends_at).getTime() > Date.now())
  );
  const canManageSelectedOpenCase = Boolean(
    selectedOpenCase
      && (
        staffRole === "owner"
        || selectedOpenCase.decided_by === user.id
      )
  );
  const openAppeals = appeals.filter((item) =>
    ["submitted", "in_review"].includes(item.status)
  );

  return (
    <div className="account-page admin-page admin-moderation-page">
      <AdminNavbar />

      <main className="admin-shell moderation-admin-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Moderacja i bezpieczeństwo</span>
            <h1>Ograniczenia kont i odwołania</h1>
            <p>
              Każda decyzja wymaga faktów, podstawy regulaminowej, określonego
              czasu oraz ręcznej oceny proporcjonalności.
            </p>
          </div>
          <span className="admin-role-badge">
            {staffRole === "owner" ? "Owner — pełna kontrola" : "Administrator — do 30 dni"}
          </span>
        </header>

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        <section className="moderation-search-card">
          <div>
            <span className="section-label">Wybór konta</span>
            <h2>Znajdź użytkownika</h2>
            <p>Szukaj po nazwie profilu albo pełnym UUID widocznym w sprawie.</p>
          </div>
          <form onSubmit={handleUserSearch}>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nazwa użytkownika lub UUID..."
            />
            <button type="submit" className="privacy-primary-button" disabled={searching}>
              {searching ? "Szukanie..." : "Szukaj"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="moderation-search-results">
              {searchResults.map((profile) => (
                <button
                  type="button"
                  key={profile.id}
                  onClick={() => selectModerationUser(profile)}
                >
                  <span className="admin-staff-avatar">
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" />
                      : (profile.name || "U").charAt(0).toUpperCase()}
                  </span>
                  <span><strong>{profile.name || "Użytkownik"}</strong><small>{profile.id}</small></span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selectedUserId && (
          <section className="moderation-workbench">
            <div className="moderation-selected-user">
              <div className="admin-staff-avatar">
                {selectedProfile?.avatar_url
                  ? <img src={selectedProfile.avatar_url} alt="" />
                  : (selectedProfile?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="section-label">Wybrane konto</span>
                <h2>{selectedProfile?.name || "Użytkownik IdeaHire"}</h2>
                <code>{selectedUserId}</code>
              </div>
              {selectedOpenCase && (
                <span className={`moderation-status-pill is-${selectedOpenCase.status}`}>
                  {MODERATION_STATUS_LABELS[selectedOpenCase.status]}
                </span>
              )}
            </div>

            {sourceJob && (
              <article className="moderation-source-job">
                <div>
                  <span className="section-label">Materiał źródłowy do ręcznej oceny</span>
                  <h3>{sourceJob.title}</h3>
                </div>
                <p>{sourceJob.description}</p>
                <small>
                  ID: {sourceJob.id} · {sourceJob.category || "Bez kategorii"} · {formatDisputeMoney(sourceJob.budget, "PLN")}
                </small>
              </article>
            )}

            {selectedOpenCase ? (
              <div className="moderation-active-case">
                <strong>To konto ma już aktywną lub zaplanowaną decyzję</strong>
                <p>{notices[selectedOpenCase.id]?.public_reason || selectedOpenCase.public_reason}</p>
                {selectedOpenCase.decision_type === "temporary_suspension"
                  && canManageSelectedOpenCase && (
                  <button
                    type="button"
                    className="privacy-secondary-button"
                    onClick={() => openRestrictionEditor(selectedOpenCase)}
                    disabled={Boolean(busy)}
                  >
                    Zmień czas zawieszenia
                  </button>
                )}

                {canManageSelectedOpenCase
                  && restrictionEditor.caseId === selectedOpenCase.id && (
                  <form
                    className="moderation-adjustment-form"
                    onSubmit={handleUpdateRestriction}
                  >
                    <div>
                      <span className="section-label">
                        Zmiana istniejącej decyzji
                      </span>
                      <strong>Ustaw nowy łączny czas zawieszenia</strong>
                      <p>
                        Okres jest liczony od pierwotnego rozpoczęcia decyzji.
                        Zmiana zostanie pokazana użytkownikowi i zapisana
                        w historii administracyjnej.
                      </p>
                    </div>
                    <label>
                      Łączna liczba dni
                      <input
                        type="number"
                        min="1"
                        max={staffRole === "owner" ? "365" : "30"}
                        value={restrictionEditor.totalDurationDays}
                        onChange={(event) =>
                          setRestrictionEditor((current) => ({
                            ...current,
                            totalDurationDays: event.target.value,
                          }))
                        }
                        disabled={Boolean(busy)}
                      />
                    </label>
                    <label>
                      Uzasadnienie zmiany
                      <textarea
                        value={restrictionEditor.reason}
                        onChange={(event) =>
                          setRestrictionEditor((current) => ({
                            ...current,
                            reason: event.target.value,
                          }))
                        }
                        minLength={30}
                        maxLength={2000}
                        rows={4}
                        placeholder="Wyjaśnij konkretnie, dlaczego okres został skrócony albo wydłużony."
                        disabled={Boolean(busy)}
                      />
                    </label>
                    <div className="moderation-adjustment-actions">
                      <button
                        type="button"
                        className="privacy-secondary-button"
                        onClick={() => setRestrictionEditor({
                          caseId: "",
                          totalDurationDays: "",
                          reason: "",
                        })}
                        disabled={Boolean(busy)}
                      >
                        Anuluj
                      </button>
                      <button
                        type="submit"
                        className="privacy-primary-button"
                        disabled={Boolean(busy)}
                      >
                        {busy === "update:" + selectedOpenCase.id
                          ? "Zapisywanie zmiany..."
                          : "Zapisz nowy czas"}
                      </button>
                    </div>
                  </form>
                )}
                {canManageSelectedOpenCase ? (
                  <button
                    type="button"
                    className="privacy-secondary-button"
                    onClick={() => handleLiftRestriction(selectedOpenCase.id)}
                    disabled={Boolean(busy)}
                  >
                    {busy === `lift:${selectedOpenCase.id}` ? "Zapisywanie..." : "Zdejmij ograniczenie"}
                  </button>
                ) : (
                  <small>
                    Tę decyzję może zmienić administrator, który ją wydał,
                    albo owner.
                  </small>
                )}
              </div>
            ) : (
              <form className="moderation-decision-form" onSubmit={handleImposeRestriction}>
                <div className="moderation-form-grid">
                  <label>
                    Rodzaj decyzji
                    <select
                      value={form.decisionType}
                      onChange={(event) => updateModerationForm({
                        decisionType: event.target.value,
                        noticeMode: event.target.value === "temporary_suspension"
                          ? "immediate"
                          : "thirty_day_notice",
                        immediateExceptionCode: "",
                        ownerConfirmation: "",
                      })}
                    >
                      <option value="temporary_suspension">Czasowe zawieszenie</option>
                      {staffRole === "owner" && (
                        <option value="indefinite_suspension">Bezterminowe zawieszenie</option>
                      )}
                    </select>
                  </label>

                  {form.decisionType === "temporary_suspension" ? (
                    <div className="moderation-duration-control">
                      <label>
                        Liczba dni
                        <input
                          type="number"
                          min="1"
                          max={staffRole === "owner" ? "365" : "30"}
                          value={form.durationDays}
                          onChange={(event) => updateModerationForm({ durationDays: event.target.value })}
                        />
                      </label>
                      <div className="moderation-duration-presets" aria-label="Szybki wybór okresu">
                        {[
                          ...MODERATION_DURATION_PRESETS,
                          ...(staffRole === "owner" ? [90, 180, 365] : []),
                        ].map((days) => (
                          <button
                            type="button"
                            className={Number(form.durationDays) === days ? "is-selected" : ""}
                            onClick={() => updateModerationForm({ durationDays: String(days) })}
                            key={days}
                          >
                            {days} {days === 1 ? "dzień" : "dni"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <label>
                      Tryb rozpoczęcia
                      <select
                        value={form.noticeMode}
                        onChange={(event) => updateModerationForm({
                          noticeMode: event.target.value,
                          immediateExceptionCode: "",
                        })}
                      >
                        <option value="thirty_day_notice">Po 30-dniowym uprzedzeniu</option>
                        <option value="immediate">Natychmiast — tylko udokumentowany wyjątek</option>
                      </select>
                    </label>
                  )}

                  <label>
                    Kategoria powodu
                    <select
                      value={form.reasonCode}
                      onChange={(event) => {
                        const reasonCode = event.target.value;
                        const previousSuggestedReference =
                          MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode];
                        const suggestedReference =
                          MODERATION_CONFIRMED_TERMS_REFERENCES[reasonCode];
                        const canReplaceReference = !form.termsReference.trim()
                          || form.termsReference === previousSuggestedReference;

                        updateModerationForm({
                          reasonCode,
                          termsReference: canReplaceReference
                            ? suggestedReference || ""
                            : form.termsReference,
                        });
                      }}
                    >
                      {Object.entries(MODERATION_REASON_LABELS).map(([value, label]) => (
                        <option value={value} key={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  {form.decisionType === "indefinite_suspension"
                    && form.noticeMode === "immediate" && (
                    <label>
                      Wyjątek pozwalający na natychmiastową decyzję
                      <select
                        value={form.immediateExceptionCode}
                        onChange={(event) => updateModerationForm({
                          immediateExceptionCode: event.target.value,
                        })}
                        required
                      >
                        <option value="">Wybierz udokumentowany wyjątek</option>
                        {MODERATION_EXCEPTION_OPTIONS.map(([value, label]) => (
                          <option value={value} key={value}>{label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <div className="moderation-reason-guidance">
                  <strong>Co administrator musi ustalić dla wybranej kategorii</strong>
                  <p>{MODERATION_REASON_GUIDANCE[form.reasonCode]}</p>
                  {MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode] && (
                    <div className="moderation-terms-shortcut">
                      <span>
                        Potwierdzona podstawa w aktualnym Regulaminie v0.9:
                        {" "}
                        <strong>
                          {MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode]}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => updateModerationForm({
                          termsReference:
                            MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode],
                        })}
                        disabled={
                          form.termsReference
                            === MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode]
                        }
                      >
                        {form.termsReference
                          === MODERATION_CONFIRMED_TERMS_REFERENCES[form.reasonCode]
                          ? "Podstawa ustawiona"
                          : "Wstaw § 27 pkt 107"}
                      </button>
                    </div>
                  )}
                </div>

                <label>
                  Jasne uzasadnienie widoczne dla użytkownika
                  <textarea
                    value={form.publicReason}
                    onChange={(event) => updateModerationForm({ publicReason: event.target.value })}
                    minLength={50}
                    maxLength={4000}
                    rows={6}
                    placeholder="Opisz konkretne fakty, zakres decyzji i dlaczego łagodniejszy środek nie jest wystarczający. Nie ujawniaj danych zgłaszającego."
                  />
                </label>

                <div className="moderation-form-grid">
                  <label>
                    Konkretny punkt regulaminu
                    <input
                      value={form.termsReference}
                      onChange={(event) => updateModerationForm({ termsReference: event.target.value })}
                      minLength={10}
                      maxLength={1000}
                      placeholder="Np. Regulamin IdeaHire § 27 pkt 107"
                    />
                  </label>
                  <label>
                    Podstawa prawna — gdy dotyczy
                    <input
                      value={form.legalBasis}
                      onChange={(event) => updateModerationForm({ legalBasis: event.target.value })}
                      maxLength={1000}
                      placeholder="Przepis dotyczący zakazanej treści albo pozostaw puste"
                    />
                  </label>
                </div>

                <label>
                  Wewnętrzna notatka dowodowa
                  <textarea
                    value={form.internalNote}
                    onChange={(event) => updateModerationForm({ internalNote: event.target.value })}
                    minLength={20}
                    maxLength={5000}
                    rows={5}
                    placeholder="Wskaż przeanalizowane zgłoszenia, dowody i wynik ręcznej kontroli. Ta część nie będzie widoczna dla użytkownika."
                  />
                </label>

                {form.decisionType === "indefinite_suspension" && (
                  <label className="moderation-owner-confirmation">
                    Potwierdzenie ownera
                    <input
                      value={form.ownerConfirmation}
                      onChange={(event) => updateModerationForm({ ownerConfirmation: event.target.value })}
                      placeholder="ZAWIESZAM KONTO"
                      autoComplete="off"
                    />
                    <small>Wpisz dokładnie: ZAWIESZAM KONTO</small>
                  </label>
                )}

                <div className="moderation-legal-warning">
                  <strong>Kontrola proporcjonalności</strong>
                  <p>
                    Zawieszenie nie usuwa konta ani historii. Użytkownik zachowuje
                    dostęp do decyzji, odwołania i centrum prywatności.
                  </p>
                </div>

                <button
                  type="submit"
                  className="erasure-danger-button"
                  disabled={Boolean(busy)}
                >
                  {busy === "impose" ? "Zapisywanie decyzji..." : "Nałóż ograniczenie i zawiadom użytkownika"}
                </button>
              </form>
            )}
          </section>
        )}

        <section className="moderation-appeals-admin">
          <div>
            <span className="section-label">Ponowna analiza</span>
            <h2>Odwołania oczekujące</h2>
          </div>

          {openAppeals.length === 0 ? (
            <div className="privacy-empty-state">Brak odwołań oczekujących na analizę.</div>
          ) : (
            <div className="moderation-appeal-admin-list">
              {openAppeals.map((appeal) => {
                const moderationCase = cases.find((item) => item.id === appeal.case_id);
                const profile = profiles[appeal.target_user_id];

                return (
                  <article key={appeal.id}>
                    <div className="moderation-decision-topline">
                      <div>
                        <span className="section-label">Odwołanie użytkownika</span>
                        <h3>{profile?.name || "Użytkownik IdeaHire"}</h3>
                      </div>
                      <span className="moderation-status-pill is-submitted">Oczekuje</span>
                    </div>
                    <p>{appeal.user_statement}</p>
                    <small>
                      Decyzja: {MODERATION_DECISION_LABELS[moderationCase?.decision_type] || "—"}
                    </small>
                    <textarea
                      value={appealNotes[appeal.id] || ""}
                      onChange={(event) => updateAppealNote(appeal.id, event.target.value)}
                      minLength={30}
                      maxLength={3000}
                      rows={4}
                      placeholder="Uzasadnij wynik ponownej, ręcznej analizy..."
                    />
                    <div className="moderation-appeal-review-actions">
                      <button
                        type="button"
                        className="privacy-secondary-button"
                        onClick={() => handleResolveAppeal(appeal, "uphold")}
                        disabled={Boolean(busy)}
                      >
                        Utrzymaj decyzję
                      </button>
                      <button
                        type="button"
                        className="privacy-primary-button"
                        onClick={() => handleResolveAppeal(appeal, "lift")}
                        disabled={Boolean(busy)}
                      >
                        Uwzględnij i zdejmij ograniczenie
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="moderation-case-register">
          <div>
            <span className="section-label">Rejestr decyzji</span>
            <h2>Historia ograniczeń</h2>
          </div>
          {loading ? (
            <div className="privacy-empty-state">Ładowanie decyzji...</div>
          ) : cases.length === 0 ? (
            <div className="privacy-empty-state">Nie wydano jeszcze żadnej decyzji.</div>
          ) : (
            <div className="moderation-case-list">
              {cases.map((item) => {
                const profile = profiles[item.target_user_id];
                const notice = notices[item.id];
                return (
                  <article key={item.id}>
                    <div>
                      <strong>{profile?.name || "Użytkownik IdeaHire"}</strong>
                      <small>{notice?.notice_number || item.id}</small>
                    </div>
                    <span>{MODERATION_REASON_LABELS[item.reason_code] || item.reason_code}</span>
                    <span>{MODERATION_DECISION_LABELS[item.decision_type]}</span>
                    <span className={`moderation-status-pill is-${item.status}`}>
                      {MODERATION_STATUS_LABELS[item.status] || item.status}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminUserPrivacyAccount() {
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedRequestId = new URLSearchParams(location.search).get("request");

  const [profile, setProfile] = useState(null);
  const [lifecycle, setLifecycle] = useState(null);
  const [requests, setRequests] = useState([]);
  const [cases, setCases] = useState([]);
  const [caseEvents, setCaseEvents] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [dialogAction, setDialogAction] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [identityMethod, setIdentityMethod] = useState("authenticated_session");
  const [identityNote, setIdentityNote] = useState("");
  const [legalAssessment, setLegalAssessment] = useState("");
  const [retentionReason, setRetentionReason] = useState("");
  const [ownerConfirmation, setOwnerConfirmation] = useState("");

  async function loadAccountData(showLoading = true) {
    if (!user?.id || !userId) return;

    if (showLoading) setLoading(true);

    try {
      const [profileResult, lifecycleResult, requestsResult, casesResult] =
        await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about, specialty_categories, specialization, skills, created_at"
            )
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("ideahire_account_lifecycle")
            .select(
              "user_id, status, erasure_case_id, data_minimized_at, closed_at, created_at, updated_at"
            )
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("ideahire_privacy_requests")
            .select(
              "id, request_number, requester_user_id, request_type, requested_erasure_action, description, status, identity_status, assigned_admin_id, submitted_at, due_at, extended_due_at, decision_summary, completed_at"
            )
            .eq("requester_user_id", userId)
            .eq("request_type", "erasure")
            .order("submitted_at", { ascending: false }),
          supabase
            .from("ideahire_erasure_cases")
            .select("*")
            .eq("target_user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

      if (profileResult.error) throw profileResult.error;
      if (lifecycleResult.error) throw lifecycleResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (casesResult.error) throw casesResult.error;

      const requestRows = requestsResult.data || [];
      const caseRows = casesResult.data || [];
      const selectedRequest = requestRows.find(
        (item) => item.id === requestedRequestId
      ) || requestRows[0] || null;

      setProfile(profileResult.data || null);
      setLifecycle(lifecycleResult.data || null);
      setRequests(requestRows);
      setCases(caseRows);

      if (caseRows.length > 0) {
        const eventResult = await supabase
          .from("ideahire_erasure_case_events")
          .select(
            "id, case_id, actor_role, event_type, visibility, message, details, created_at"
          )
          .in("case_id", caseRows.map((item) => item.id))
          .order("created_at", { ascending: true });

        if (eventResult.error) throw eventResult.error;
        setCaseEvents(eventResult.data || []);
      } else {
        setCaseEvents([]);
      }

      if (selectedRequest) {
        const inventoryResult = await supabase.rpc(
          "admin_get_ideahire_erasure_inventory",
          { p_request_id: selectedRequest.id }
        );

        if (inventoryResult.error) {
          console.error("ADMIN ERASURE INVENTORY ERROR:", inventoryResult.error);
          setInventory(null);
          setInventoryError(
            "Nie udało się odświeżyć warunków tej operacji. Spróbuj ponownie."
          );
        } else {
          setInventory(inventoryResult.data || null);
          setInventoryError("");
        }
      } else {
        setInventory(null);
        setInventoryError("");
      }
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się otworzyć administracyjnego widoku konta."
      ));
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadAccountData(true);
  }, [user?.id, userId, requestedRequestId]);

  useEffect(() => {
    if (!user?.id || !userId) return;

    const refresh = () => {
      loadAccountData(false);
    };

    const channel = supabase
      .channel(`admin-erasure-account-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_erasure_cases",
          filter: `target_user_id=eq.${userId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ideahire_privacy_requests",
          filter: `requester_user_id=eq.${userId}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userId, requestedRequestId]);

  const currentRequest = requests.find(
    (item) => item.id === requestedRequestId
  ) || requests[0] || null;

  const currentCase = currentRequest
    ? cases.find((item) => item.privacy_request_id === currentRequest.id) || null
    : cases[0] || null;

  const currentCaseEvents = currentCase
    ? caseEvents.filter((item) => item.case_id === currentCase.id)
    : [];

  const canManage = Boolean(
    currentRequest
    && (
      staffRole === "owner"
      || currentRequest.assigned_admin_id === user?.id
    )
  );

  const activeBlockers = Object.entries(inventory?.blockers || {})
    .filter(([, value]) => value === true || Number(value) > 0);

  function openErasureDialog(action) {
    setMessage("");
    setDialogMessage("");
    setDialogAction(action);
  }

  function closeErasureDialog() {
    if (busy) return;
    setDialogAction("");
    setDialogMessage("");
  }

  async function handleVerifyIdentity(event) {
    event.preventDefault();
    if (!currentRequest) return;

    if (identityNote.trim().length < 20) {
      setMessage("Notatka weryfikacyjna musi mieć co najmniej 20 znaków.");
      return;
    }

    setBusy("identity");
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_verify_ideahire_erasure_identity",
        {
          p_request_id: currentRequest.id,
          p_method: identityMethod,
          p_note: identityNote.trim(),
        }
      );

      if (error) throw error;

      setIdentityNote("");
      setMessage("Tożsamość użytkownika została potwierdzona i zapisana w historii sprawy.");
      await loadAccountData(false);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się potwierdzić tożsamości."));
    } finally {
      setBusy("");
    }
  }

  async function handlePrepareErasure(event) {
    event.preventDefault();
    if (!currentRequest || !dialogAction) return;

    if (
      currentRequest.requested_erasure_action
      && currentRequest.requested_erasure_action !== dialogAction
    ) {
      setDialogMessage("Operacja musi być zgodna z zakresem wybranym przez użytkownika.");
      return;
    }

    if (legalAssessment.trim().length < 50) {
      setDialogMessage("Uzupełnij ocenę zakresu — wpisz co najmniej 50 znaków.");
      return;
    }

    if (retentionReason.trim().length < 30) {
      setDialogMessage("Uzupełnij uzasadnienie retencji — wpisz co najmniej 30 znaków.");
      return;
    }

    if (!inventory || inventoryError) {
      setDialogMessage(
        "Nie możemy teraz bezpiecznie potwierdzić zakresu operacji. Zamknij okno, odśwież dane i spróbuj ponownie."
      );
      return;
    }

    if (dialogAction === "close_account" && inventory?.execution_blocked) {
      setDialogMessage(
        "Nie przekazano operacji ownerowi, ponieważ konto ma aktywne sprawy. Rozwiąż pozycje pokazane poniżej i sprawdź warunki ponownie."
      );
      return;
    }

    setBusy("prepare");
    setMessage("");
    setDialogMessage("");

    try {
      const { data: preparedCaseId, error } = await supabase.rpc(
        "admin_prepare_ideahire_erasure_case",
        {
          p_request_id: currentRequest.id,
          p_action_type: dialogAction,
          p_legal_assessment: legalAssessment.trim(),
          p_retention_reason: retentionReason.trim(),
        }
      );

      if (error) throw error;
      if (!preparedCaseId) {
        throw new Error("Nie otrzymano potwierdzenia utworzenia sprawy.");
      }

      setDialogAction("");
      setDialogMessage("");
      setLegalAssessment("");
      setRetentionReason("");
      setMessage("Zakres operacji zapisano i przekazano do zatwierdzenia przez ownera.");
      await loadAccountData(false);
    } catch (error) {
      console.error("ADMIN PREPARE ERASURE ERROR:", error);

      const { data: existingCase, error: existingCaseError } = await supabase
        .from("ideahire_erasure_cases")
        .select("id, status")
        .eq("privacy_request_id", currentRequest.id)
        .maybeSingle();

      if (!existingCaseError && existingCase?.id) {
        setDialogAction("");
        setDialogMessage("");
        setLegalAssessment("");
        setRetentionReason("");
        setMessage(
          "Operacja została zapisana i oczekuje na zatwierdzenie ownera. Widok został odświeżony."
        );
        await loadAccountData(false);
        return;
      }

      const errorText = String(error?.message || "").toLowerCase();
      if (errorText.includes("przypisana") || errorText.includes("uprawnie")) {
        setDialogMessage(
          "Nie przekazano operacji. Ten wniosek musi najpierw przejąć zalogowany administrator albo owner."
        );
      } else if (errorText.includes("tożsamo")) {
        setDialogMessage(
          "Nie przekazano operacji. Najpierw potwierdź tożsamość wnioskodawcy w kroku 1."
        );
      } else if (errorText.includes("istnieje już")) {
        setDialogMessage(
          "Dla tego wniosku istnieje już przygotowana operacja. Zamknij okno i odśwież widok."
        );
      } else {
        setDialogMessage(
          "Nie udało się przekazać operacji ownerowi. Niczego nie usunięto. Odśwież widok i spróbuj ponownie."
        );
      }
    } finally {
      setBusy("");
    }
  }

  async function handleAuthorizeErasure() {
    if (!currentCase) return;

    if (
      currentCase.action_type === "close_account"
      && inventory?.execution_blocked
    ) {
      setMessage("Konta nie można teraz zamknąć. Najpierw zakończ wszystkie przeszkody pokazane w panelu.");
      return;
    }

    if (ownerConfirmation.trim() !== "ZATWIERDZAM USUNIECIE") {
      setMessage("Wpisz dokładnie: ZATWIERDZAM USUNIECIE");
      return;
    }

    setBusy("authorize");
    setMessage("");

    try {
      const actionType = currentCase.action_type;
      const { data, error } = await supabase.functions.invoke(
        "ideahire-admin-erasure",
        { body: {
          caseId: currentCase.id,
          authorizeAndExecute: true,
          ownerConfirmation: ownerConfirmation.trim(),
        } }
      );

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Operacja nie została zakończona.");

      setOwnerConfirmation("");
      setMessage(
        actionType === "close_account"
          ? "Owner zatwierdził operację. Możliwe dane usunięto lub zanonimizowano, konto zamknięto, a sprawę zakończono."
          : "Owner zatwierdził operację. Pełny możliwy zakres danych usunięto lub zanonimizowano, konto pozostało aktywne, a sprawę zakończono."
      );
      await loadAccountData(false);
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się dokończyć operacji. Jeśli zatwierdzenie zostało zapisane, pojawi się bezpieczny przycisk ponowienia."
      ));
      await loadAccountData(false);
    } finally {
      setBusy("");
    }
  }

  async function handleExecuteErasure() {
    if (!currentCase) return;

    const operationName = ERASURE_ACTION_LABELS[currentCase.action_type]
      || "wykonanie operacji";

    if (!window.confirm(
      `Czy na pewno uruchomić: ${operationName}? Operacja zostanie zapisana w historii i nie można jej cofnąć.`
    )) return;

    setBusy("execute");
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "ideahire-admin-erasure",
        { body: { caseId: currentCase.id } }
      );

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Operacja nie została zakończona.");

      setMessage(
        currentCase.action_type === "close_account"
          ? "Konto zostało zamknięte, a status sprawy zaktualizowany."
          : "Pełny możliwy zakres danych został usunięty lub zanonimizowany. Konto logowania pozostało aktywne."
      );
      await loadAccountData(false);
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się dokończyć operacji. Możesz bezpiecznie użyć przycisku ponownie."
      ));
      await loadAccountData(false);
    } finally {
      setBusy("");
    }
  }

  function chooseRequest(requestId) {
    navigate(`/admin/privacy/users/${userId}?request=${requestId}`, {
      replace: true,
    });
  }

  const lifecycleStatus = lifecycle?.status || "active";
  const completedDataMinimization = Boolean(
    currentCase?.status === "completed"
    && currentCase?.action_type === "minimize_data"
  );
  const completedAccountClosure = Boolean(
    currentCase?.status === "completed"
    && currentCase?.action_type === "close_account"
  );
  const accountName = completedDataMinimization
    ? "Konto aktywne — dane możliwe do usunięcia zostały usunięte"
    : completedAccountClosure
      ? "Konto zamknięte"
      : profile?.name?.trim() || "Użytkownik IdeaHire";
  const executionRows = buildErasureExecutionRows(
    currentCase?.execution_result
  );
  const retainedAfterExecution =
    currentCase?.execution_result
      ?.data_minimization
      ?.retained_after || {};
  const retainedAfterRows = Object.entries(
    retainedAfterExecution
  ).filter(([, value]) => (
    Number.isFinite(Number(value))
    && Number(value) > 0
  ));
  const requestedErasureAction = currentRequest?.requested_erasure_action || "";
  const isLegacyErasureRequest = Boolean(
    currentRequest && !requestedErasureAction
  );
  const actionDisabled = !canManage
    || !currentRequest
    || !isPrivacyRequestOpen(currentRequest.status)
    || currentRequest.identity_status !== "verified"
    || Boolean(currentCase);

  return (
    <div className="account-page admin-page admin-erasure-account-page">
      <AdminNavbar />

      <main className="admin-shell erasure-account-shell">
        <Link className="privacy-back-link" to="/admin/privacy">
          ← Wróć do wniosków RODO
        </Link>

        {loading ? (
          <div className="privacy-empty-state">Ładowanie konta użytkownika...</div>
        ) : (
          <>
            <header className="erasure-account-header">
              <div className="erasure-account-person">
                <div className="erasure-account-avatar">
                  {!completedDataMinimization
                    && !completedAccountClosure
                    && profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" />
                  ) : accountName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="section-label">Administracyjny widok konta</span>
                  <h1>{accountName}</h1>
                  <p>ID użytkownika: <code>{userId}</code></p>
                  {completedDataMinimization && (
                    <p className="erasure-account-auth-state">
                      Login pozostaje aktywny. Użytkownik może ponownie
                      uzupełnić dane wymagane do dalszego korzystania z usługi.
                    </p>
                  )}
                </div>
              </div>

              <div className="erasure-account-header-actions">
                <span className={`erasure-lifecycle-pill is-${lifecycleStatus}`}>
                  {ERASURE_LIFECYCLE_LABELS[lifecycleStatus] || lifecycleStatus}
                </span>

                <details className="erasure-actions-menu">
                  <summary aria-label="Otwórz działania dotyczące konta">•••</summary>
                  <div>
                    <Link
                      to={`/admin/moderation?user=${userId}`}
                    >
                      <span>Moderacja konta</span>
                      <small>Zawieś konto na czas lub przejrzyj decyzje</small>
                    </Link>
                    <button
                      type="button"
                      onClick={() => openErasureDialog("minimize_data")}
                      disabled={
                        actionDisabled
                        || requestedErasureAction === "close_account"
                      }
                    >
                      <span>Usuń dane możliwe do usunięcia</span>
                      <small>Konto nie zostanie usunięte z Auth</small>
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => openErasureDialog("close_account")}
                      disabled={
                        actionDisabled
                        || requestedErasureAction === "minimize_data"
                      }
                    >
                      <span>Usuń dane i zamknij konto</span>
                      <small>Minimalizacja danych i wyłączenie logowania</small>
                    </button>
                  </div>
                </details>
              </div>
            </header>

            {message && (
              <p className="privacy-page-message" role="status">{message}</p>
            )}

            {requests.length === 0 ? (
              <section className="erasure-account-notice is-warning">
                <strong>Brak wniosku o usunięcie danych</strong>
                <p>
                  Operację można przygotować dopiero po złożeniu przez użytkownika
                  wniosku RODO dotyczącego usunięcia danych.
                </p>
              </section>
            ) : (
              <section className="erasure-request-selector">
                <div>
                  <span className="section-label">Podstawa operacji</span>
                  <h2>{formatPrivacyRequestNumber(currentRequest?.request_number)}</h2>
                  <div className={`privacy-erasure-requested-action is-${
                    requestedErasureAction || "legacy"
                  }`}>
                    <span>Użytkownik wybrał</span>
                    <strong>
                      {requestedErasureAction
                        ? ERASURE_ACTION_LABELS[requestedErasureAction]
                        : "Starszy wniosek — brak zapisanego wyboru"}
                    </strong>
                    <p>
                      {requestedErasureAction
                        ? "Przygotowana operacja musi być dokładnie zgodna z tym wyborem."
                        : "Potwierdź zakres na podstawie treści i historii wniosku. Dotyczy to wyłącznie starszych spraw."}
                    </p>
                  </div>
                </div>
                {requests.length > 1 && (
                  <label>
                    Wybierz wniosek
                    <select
                      value={currentRequest?.id || ""}
                      onChange={(event) => chooseRequest(event.target.value)}
                    >
                      {requests.map((item) => (
                        <option value={item.id} key={item.id}>
                          {formatPrivacyRequestNumber(item.request_number)} — {PRIVACY_REQUEST_STATUSES[item.status] || item.status}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </section>
            )}

            {currentRequest && !canManage && (
              <section className="erasure-account-notice is-warning">
                <strong>Brak uprawnienia do wykonania operacji</strong>
                <p>
                  Najpierw przejmij wniosek w kolejce. Wgląd i wykonanie ma
                  prowadzący administrator oraz owner.
                </p>
              </section>
            )}

            {isLegacyErasureRequest && canManage && (
              <section className="erasure-account-notice is-warning">
                <strong>Starszy wniosek bez technicznie zapisanego zakresu</strong>
                <p>
                  Przed przygotowaniem operacji porównaj treść i historię wniosku.
                  Wszystkie nowe wnioski zapisują już wybór użytkownika i blokują
                  wykonanie innej operacji.
                </p>
              </section>
            )}

            {currentRequest
              && canManage
              && isPrivacyRequestOpen(currentRequest.status)
              && currentRequest.identity_status !== "verified" && (
              <form className="erasure-identity-card" onSubmit={handleVerifyIdentity}>
                <div>
                  <span className="section-label">Krok 1</span>
                  <h2>Potwierdź tożsamość wnioskodawcy</h2>
                  <p>
                    Nie zapisuj kopii dokumentu w tym formularzu. Zapisz wyłącznie
                    metodę oraz krótkie uzasadnienie wyniku weryfikacji.
                  </p>
                </div>
                <label>
                  Metoda weryfikacji
                  <select
                    value={identityMethod}
                    onChange={(event) => setIdentityMethod(event.target.value)}
                    disabled={Boolean(busy)}
                  >
                    <option value="authenticated_session">Aktywna, uwierzytelniona sesja</option>
                    <option value="additional_document">Dodatkowy dokument — bez zapisywania kopii</option>
                    <option value="video_call">Rozmowa weryfikacyjna</option>
                    <option value="manual_comparison">Ręczne porównanie danych</option>
                  </select>
                </label>
                <label>
                  Notatka weryfikacyjna
                  <textarea
                    value={identityNote}
                    onChange={(event) => setIdentityNote(event.target.value)}
                    minLength={20}
                    maxLength={2000}
                    rows={4}
                    placeholder="Opisz, dlaczego potwierdzono, że wniosek złożył właściciel konta..."
                    disabled={Boolean(busy)}
                  />
                </label>
                <button
                  className="privacy-primary-button"
                  type="submit"
                  disabled={Boolean(busy) || identityNote.trim().length < 20}
                >
                  {busy === "identity" ? "Zapisywanie..." : "Potwierdź tożsamość"}
                </button>
              </form>
            )}

            {inventoryError ? (
              <section className="erasure-account-notice is-danger" role="alert">
                <strong>Nie udało się pobrać zakresu danych</strong>
                <p>
                  Operacja nie może zostać przygotowana bez aktualnego inwentarza.
                  Nic nie zostało usunięte ani przekazane ownerowi.
                </p>
                <button
                  type="button"
                  className="privacy-eligibility-refresh"
                  onClick={() => loadAccountData(false)}
                  disabled={Boolean(busy)}
                >
                  Pobierz zakres ponownie
                </button>
              </section>
            ) : inventory ? (
              <section className="erasure-account-grid">
                <article className="erasure-inventory-card">
                  <div className="erasure-card-heading">
                    <div>
                      <span className="section-label">Możliwe do usunięcia</span>
                      <h2>Dane profilu i ustawienia</h2>
                    </div>
                    <span className="erasure-card-mark is-removable">Usuń</span>
                  </div>
                  <ul>
                    {Object.entries(inventory.erasable_now || {}).map(([key, value]) => (
                      <li key={key}>
                        <span>{ERASURE_INVENTORY_LABELS[key] || key}</span>
                        <strong>{Number(value) || 0}</strong>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="erasure-inventory-card is-retained">
                  <div className="erasure-card-heading">
                    <div>
                      <span className="section-label">Kontrolowana retencja</span>
                      <h2>Historia prawna i transakcyjna</h2>
                    </div>
                    <span className="erasure-card-mark is-retained">Zachowaj</span>
                  </div>
                  <ul>
                    {Object.entries(
                      inventory.retained_for_legal_or_transactional_purposes || {}
                    ).map(([key, value]) => (
                      <li key={key}>
                        <span>{ERASURE_INVENTORY_LABELS[key] || key}</span>
                        <strong>{Number(value) || 0}</strong>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Te rekordy nie są automatycznie kasowane. Administrator musi
                    podać podstawę i okres retencji do późniejszej kontroli prawnej.
                  </p>
                </article>
              </section>
            ) : currentRequest ? (
              <section className="erasure-account-notice">
                <strong>Pobieramy aktualny zakres danych</strong>
                <p>Za chwilę zobaczysz dane możliwe do usunięcia oraz dane objęte retencją.</p>
              </section>
            ) : null}

            {activeBlockers.length > 0 && (
              <section className="erasure-blockers-card" role="alert">
                <div>
                  <span aria-hidden="true">!</span>
                  <div>
                    <strong>Zamknięcie konta jest obecnie zablokowane</strong>
                    <p>Najpierw zakończ lub rozlicz poniższe elementy:</p>
                  </div>
                </div>
                <ErasureBlockerList blockers={activeBlockers} />
                <button
                  type="button"
                  className="privacy-eligibility-refresh"
                  onClick={() => loadAccountData(false)}
                  disabled={Boolean(busy)}
                >
                  Sprawdź ponownie po rozwiązaniu spraw
                </button>
              </section>
            )}

            {currentCase && (
              <section className="erasure-case-card">
                <div className="erasure-card-heading">
                  <div>
                    <span className="section-label">Kontrola operacji</span>
                    <h2>{ERASURE_ACTION_LABELS[currentCase.action_type]}</h2>
                  </div>
                  <span className={`erasure-case-status is-${currentCase.status}`}>
                    {ERASURE_CASE_STATUS_LABELS[currentCase.status] || currentCase.status}
                  </span>
                </div>

                <div className="erasure-assessment-grid">
                  <article>
                    <strong>Ocena zakresu i podstawy</strong>
                    <p>{currentCase.legal_assessment}</p>
                  </article>
                  <article>
                    <strong>Uzasadnienie pozostawienia historii</strong>
                    <p>{currentCase.retention_reason}</p>
                  </article>
                </div>

                {currentCase.status === "awaiting_owner" && (
                  staffRole === "owner" ? (
                    <div className="erasure-owner-approval">
                      <div>
                        <strong>Ostateczne zatwierdzenie ownera</strong>
                        <p>
                          Sprawdź zakres, retencję i aktywne zobowiązania. Następnie
                          wpisz dokładną frazę. Zatwierdzenie od razu uruchomi
                          minimalizację danych i zamknie tę sprawę.
                        </p>
                      </div>
                      <label>
                        Fraza potwierdzająca
                        <input
                          value={ownerConfirmation}
                          onChange={(event) => setOwnerConfirmation(event.target.value)}
                          placeholder="ZATWIERDZAM USUNIECIE"
                          autoComplete="off"
                          disabled={Boolean(busy)}
                        />
                      </label>
                      <button
                        type="button"
                        className="erasure-danger-button"
                        onClick={handleAuthorizeErasure}
                        disabled={
                          Boolean(busy)
                          || ownerConfirmation.trim() !== "ZATWIERDZAM USUNIECIE"
                          || (
                            currentCase.action_type === "close_account"
                            && Boolean(inventory?.execution_blocked)
                          )
                        }
                      >
                        {busy === "authorize"
                          ? "Zatwierdzanie i wykonywanie..."
                          : "Zatwierdź i wykonaj operację"}
                      </button>
                    </div>
                  ) : (
                    <div className="erasure-account-notice">
                      <strong>Operacja oczekuje na ownera</strong>
                      <p>Administrator nie może samodzielnie zatwierdzić nieodwracalnej operacji.</p>
                    </div>
                  )
                )}

                {["authorized", "processing"].includes(currentCase.status) && (
                  <div className="erasure-execute-panel">
                    <div>
                      <strong>
                        {currentCase.status === "processing"
                          ? "Dokończ przerwaną operację"
                          : "Operacja gotowa do wykonania"}
                      </strong>
                      <p>
                        Pliki profilu zostaną usunięte przez Storage API. Przy
                        zamknięciu konta dostęp Auth zostanie wyłączony po stronie serwera.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="erasure-danger-button"
                      onClick={handleExecuteErasure}
                      disabled={Boolean(busy)}
                    >
                      {busy === "execute"
                        ? "Wykonywanie..."
                        : currentCase.status === "processing"
                          ? "Ponów i dokończ operację"
                          : "Wykonaj zatwierdzoną operację"}
                    </button>
                  </div>
                )}

                {currentCase.status === "completed" && (
                  <div className="erasure-completed-banner" role="status">
                    <span aria-hidden="true">✓</span>
                    <div className="erasure-completed-content">
                      <strong>Operacja została zakończona</strong>
                      <p>
                        {currentCase.action_type === "minimize_data"
                          ? "Usunięto lub zanonimizowano pełny możliwy zakres danych. Konto logowania pozostaje aktywne."
                          : "Usunięto lub zanonimizowano możliwe dane i zamknięto konto logowania."}
                      </p>

                      {executionRows.length > 0 && (
                        <section className="erasure-execution-report">
                          <div>
                            <span className="section-label">Raport wykonania</span>
                            <h3>Co zostało usunięte lub zanonimizowane</h3>
                          </div>
                          <dl>
                            {executionRows.map((item) => (
                              <div key={item.key}>
                                <dt>{item.label}</dt>
                                <dd>{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </section>
                      )}

                      <section className="erasure-retention-report">
                        <div>
                          <span className="section-label">Kontrolowana retencja</span>
                          <h3>Dane pozostawione po operacji</h3>
                        </div>

                        {retainedAfterRows.length > 0 ? (
                          <ul>
                            {retainedAfterRows.map(([key, value]) => (
                              <li key={key}>
                                <span>{ERASURE_INVENTORY_LABELS[key] || key}</span>
                                <strong>{Number(value)}</strong>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>
                            Zachowano konto i identyfikator logowania, dokumentację
                            realizacji wniosku oraz niezbędną historię audytową.
                          </p>
                        )}

                        <small>
                          Dane prawne, transakcyjne, sporne lub bezpieczeństwa nie
                          są publikowane w profilu i podlegają uzasadnieniu oraz
                          okresowi retencji zapisanym w tej sprawie.
                        </small>
                      </section>
                    </div>
                  </div>
                )}

                {currentCase.status === "failed" && (
                  <div className="erasure-account-notice is-danger">
                    <strong>Operacja wymaga kontroli</strong>
                    <p>{currentCase.failure_reason || "Sprawdź historię techniczną operacji."}</p>
                  </div>
                )}

                {currentCaseEvents.length > 0 && (
                  <ol className="erasure-case-timeline">
                    {currentCaseEvents.map((item) => (
                      <li key={item.id}>
                        <span aria-hidden="true" />
                        <div>
                          <strong>{item.message}</strong>
                          <time>{formatDisputeDate(item.created_at)}</time>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {dialogAction && (
        <div
          className="erasure-dialog-backdrop"
          role="presentation"
          onMouseDown={closeErasureDialog}
        >
          <section
            className="erasure-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="erasure-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="erasure-dialog-heading">
              <div>
                <span className="section-label">Operacja kontrolowana</span>
                <h2 id="erasure-dialog-title">
                  {ERASURE_ACTION_LABELS[dialogAction]}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeErasureDialog}
                aria-label="Zamknij okno"
                disabled={Boolean(busy)}
              >×</button>
            </div>

            <p className="erasure-dialog-intro">
              Ta decyzja nie usuwa historii automatycznie. Opisz zakres danych,
              podstawę realizacji wniosku oraz dlaczego konkretne rekordy muszą
              pozostać ograniczone przez określony czas.
            </p>

            {requestedErasureAction && (
              <div className="privacy-erasure-requested-action is-confirmation">
                <span>Kontrola zgodności z żądaniem użytkownika</span>
                <strong>{ERASURE_ACTION_LABELS[requestedErasureAction]}</strong>
                <p>Ten formularz przygotuje dokładnie operację wybraną we wniosku.</p>
              </div>
            )}

            {dialogAction === "close_account" && inventory?.execution_blocked && (
              <div className="erasure-dialog-blockers erasure-account-notice is-danger">
                <strong>Nie można jeszcze przekazać zamknięcia konta</strong>
                <p>
                  Owner nie powinien zatwierdzać zamknięcia, dopóki poniższe sprawy
                  nie zostaną zakończone. Możesz kliknąć przycisk na dole, aby
                  zobaczyć jednoznaczne potwierdzenie blokady.
                </p>
                <ErasureBlockerList blockers={activeBlockers} />
              </div>
            )}

            {inventoryError && (
              <p className="erasure-dialog-message is-error" role="alert">
                {inventoryError}
              </p>
            )}

            <form onSubmit={handlePrepareErasure} noValidate>
              <label>
                Ocena zakresu i podstawy realizacji wniosku
                <textarea
                  value={legalAssessment}
                  onChange={(event) => setLegalAssessment(event.target.value)}
                  minLength={50}
                  maxLength={5000}
                  rows={5}
                  placeholder="Opisz żądanie użytkownika, wynik weryfikacji oraz zakres danych, które można usunąć..."
                  disabled={Boolean(busy)}
                />
                <small className={legalAssessment.trim().length < 50 ? "is-short" : "is-ready"}>
                  {legalAssessment.trim().length}/5000 · minimum 50 znaków
                </small>
              </label>

              <label>
                Uzasadnienie pozostawienia historii prawnej i transakcyjnej
                <textarea
                  value={retentionReason}
                  onChange={(event) => setRetentionReason(event.target.value)}
                  minLength={30}
                  maxLength={5000}
                  rows={5}
                  placeholder="Wskaż kategorie zachowywanych rekordów, cel retencji i konieczność późniejszej kontroli okresu przechowywania..."
                  disabled={Boolean(busy)}
                />
                <small className={retentionReason.trim().length < 30 ? "is-short" : "is-ready"}>
                  {retentionReason.trim().length}/5000 · minimum 30 znaków
                </small>
              </label>

              {dialogMessage && (
                <p className="erasure-dialog-message is-error" role="alert" aria-live="assertive">
                  {dialogMessage}
                </p>
              )}

              <div className="erasure-dialog-actions">
                <button
                  type="button"
                  className="privacy-secondary-button"
                  onClick={closeErasureDialog}
                  disabled={Boolean(busy)}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="erasure-danger-button"
                  disabled={Boolean(busy)}
                >
                  {busy === "prepare"
                    ? "Przekazywanie..."
                    : dialogAction === "close_account" && inventory?.execution_blocked
                      ? "Sprawdź, co blokuje przekazanie"
                      : "Przekaż ownerowi do zatwierdzenia"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function AdminPrivacyRequests() {
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);
  const [requests, setRequests] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [eventsByRequest, setEventsByRequest] = useState({});
  const [auditsByRequest, setAuditsByRequest] = useState({});
  const [auditChecksByAudit, setAuditChecksByAudit] = useState({});
  const [auditEventsByAudit, setAuditEventsByAudit] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [drafts, setDrafts] = useState({});
  const [auditDrafts, setAuditDrafts] = useState({});

  async function loadAdminPrivacyRequests() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("ideahire_privacy_requests")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(300);

    if (error) throw error;

    const rows = data || [];
    setRequests(rows);

    const profileIds = [...new Set(
      rows.flatMap((item) => [
        item.requester_user_id,
        item.assigned_admin_id,
      ]).filter(Boolean)
    )];

    if (profileIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", profileIds);

      if (!profileError) {
        setProfiles(Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        ));
      }
    } else {
      setProfiles({});
    }

    if (rows.length > 0) {
      const { data: eventRows, error: eventError } = await supabase
        .from("ideahire_privacy_request_events")
        .select("id, request_id, actor_role, event_type, visibility, message, created_at")
        .in("request_id", rows.map((item) => item.id))
        .order("created_at", { ascending: true });

      if (eventError) throw eventError;

      setEventsByRequest(
        (eventRows || []).reduce((result, item) => {
          if (!result[item.request_id]) result[item.request_id] = [];
          result[item.request_id].push(item);
          return result;
        }, {})
      );
    } else {
      setEventsByRequest({});
    }

    const securityReviewIds = rows
      .filter((item) => item.request_type === "security_review")
      .map((item) => item.id);

    if (securityReviewIds.length === 0) {
      setAuditsByRequest({});
      setAuditChecksByAudit({});
      setAuditEventsByAudit({});
      return;
    }

    const { data: auditRows, error: auditError } = await supabase
      .from("ideahire_privacy_audits")
      .select("id, request_id, status, risk_level, scope, findings_summary, remediation_summary, public_scope, public_findings_summary, public_remediation_summary, public_summary, last_updated_by, submitted_for_approval_by, approved_by, created_at, updated_at, submitted_for_approval_at, approved_at")
      .in("request_id", securityReviewIds);

    if (auditError) throw auditError;

    const accessibleAudits = auditRows || [];
    setAuditsByRequest(Object.fromEntries(
      accessibleAudits.map((audit) => [audit.request_id, audit])
    ));

    const auditIds = accessibleAudits.map((audit) => audit.id);

    if (auditIds.length === 0) {
      setAuditChecksByAudit({});
      setAuditEventsByAudit({});
      return;
    }

    const [checksResult, auditEventsResult] = await Promise.all([
      supabase
        .from("ideahire_privacy_audit_checks")
        .select("id, audit_id, check_key, status, evidence_note, public_note, checked_by, checked_at, created_at, updated_at")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("ideahire_privacy_audit_events")
        .select("id, audit_id, actor_role, event_type, note, details, created_at")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true }),
    ]);

    if (checksResult.error) throw checksResult.error;
    if (auditEventsResult.error) throw auditEventsResult.error;

    setAuditChecksByAudit(
      (checksResult.data || []).reduce((result, item) => {
        if (!result[item.audit_id]) result[item.audit_id] = [];
        result[item.audit_id].push(item);
        return result;
      }, {})
    );

    setAuditEventsByAudit(
      (auditEventsResult.data || []).reduce((result, item) => {
        if (!result[item.audit_id]) result[item.audit_id] = [];
        result[item.audit_id].push(item);
        return result;
      }, {})
    );
  }

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadAdminPrivacyRequests();
      } catch (error) {
        if (mounted) {
          setMessage(cleanSupabaseError(
            error,
            "Nie udało się pobrać wniosków dotyczących prywatności."
          ));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshAdminPrivacyQueue = () => {
      loadAdminPrivacyRequests().catch((error) => {
        setMessage(cleanSupabaseError(
          error,
          "Nie udało się odświeżyć kolejki wniosków."
        ));
      });
    };

    const channel = supabase
      .channel(`admin-privacy-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "ideahire_privacy_requests",
        },
        (payload) => {
          if (payload.new?.requester_closed_at) {
            setFilter("requester_closed");
            setMessage(
              `Użytkownik zamknął ${formatPrivacyRequestNumber(
                payload.new.request_number
              )}. Status kolejki został odświeżony.`
            );
          }
          refreshAdminPrivacyQueue();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ideahire_privacy_request_events",
        },
        refreshAdminPrivacyQueue
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  function updateDraft(requestId, values) {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        status: "in_progress",
        publicMessage: "",
        internalNote: "",
        extensionReason: "",
        replyMessage: "",
        ...(current[requestId] || {}),
        ...values,
      },
    }));
  }

  function getDraft(requestId) {
    return drafts[requestId] || {
      status: "in_progress",
      publicMessage: "",
      internalNote: "",
      extensionReason: "",
      replyMessage: "",
    };
  }

  function createAuditDraft(requestId) {
    const audit = auditsByRequest[requestId];
    const storedChecks = audit
      ? auditChecksByAudit[audit.id] || []
      : [];
    const storedChecksByKey = Object.fromEntries(
      storedChecks.map((item) => [item.check_key, item])
    );

    return {
      riskLevel: audit?.risk_level || "not_assessed",
      scope: audit?.scope || "",
      findingsSummary: audit?.findings_summary || "",
      remediationSummary: audit?.remediation_summary || "",
      publicScope: audit?.public_scope || "",
      publicFindingsSummary: audit?.public_findings_summary || "",
      publicRemediationSummary: audit?.public_remediation_summary || "",
      publicSummary: audit?.public_summary || "",
      returnNote: "",
      checks: Object.fromEntries(
        PRIVACY_AUDIT_CHECKS.map((definition) => {
          const stored = storedChecksByKey[definition.key];
          return [
            definition.key,
            {
              status: stored?.status || "pending",
              note: stored?.evidence_note || "",
              publicNote: stored?.public_note || "",
            },
          ];
        })
      ),
    };
  }

  function getAuditDraft(requestId) {
    return auditDrafts[requestId] || createAuditDraft(requestId);
  }

  function updateAuditDraft(requestId, values) {
    setAuditDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || createAuditDraft(requestId)),
        ...values,
      },
    }));
  }

  function updateAuditCheckDraft(requestId, checkKey, values) {
    setAuditDrafts((current) => {
      const currentDraft = current[requestId] || createAuditDraft(requestId);

      return {
        ...current,
        [requestId]: {
          ...currentDraft,
          checks: {
            ...currentDraft.checks,
            [checkKey]: {
              ...currentDraft.checks[checkKey],
              ...values,
            },
          },
        },
      };
    });
  }

  function clearAuditDraft(requestId) {
    setAuditDrafts((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });
  }

  function getAuditSaveError(draft) {
    const optionalSections = [
      [draft.scope, "Zakres analizy"],
      [draft.findingsSummary, "Podsumowanie ustaleń"],
      [draft.remediationSummary, "Plan działań naprawczych"],
      [draft.publicScope, "Zakres dla użytkownika"],
      [draft.publicFindingsSummary, "Ustalenia dla użytkownika"],
      [draft.publicRemediationSummary, "Działania dla użytkownika"],
    ];

    const invalidSection = optionalSections.find(
      ([value]) => value.trim().length > 0 && value.trim().length < 20
    );

    if (invalidSection) {
      return `${invalidSection[1]} musi mieć co najmniej 20 znaków albo pozostać pusty.`;
    }

    const issueWithoutNote = PRIVACY_AUDIT_CHECKS.find((definition) => {
      const check = draft.checks[definition.key];
      return check?.status === "issue_found" && check.note.trim().length < 10;
    });

    if (issueWithoutNote) {
      return `Opisz wykryty problem w punkcie „${issueWithoutNote.label}” w co najmniej 10 znakach.`;
    }

    const invalidPublicNote = PRIVACY_AUDIT_CHECKS.find((definition) => {
      const publicNote = draft.checks[definition.key]?.publicNote.trim() || "";
      return publicNote.length > 0 && publicNote.length < 10;
    });

    if (invalidPublicNote) {
      return `Wyjaśnienie dla użytkownika w punkcie „${invalidPublicNote.label}” musi mieć co najmniej 10 znaków albo pozostać puste.`;
    }

    return "";
  }

  function buildAuditChecksPayload(draft) {
    return PRIVACY_AUDIT_CHECKS.map((definition) => ({
      key: definition.key,
      status: draft.checks[definition.key]?.status || "pending",
      note: draft.checks[definition.key]?.note.trim() || null,
      public_note: draft.checks[definition.key]?.publicNote.trim() || null,
    }));
  }

  async function handleSaveAudit(event, requestId) {
    event.preventDefault();
    const draft = getAuditDraft(requestId);
    const validationError = getAuditSaveError(draft);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setBusy(`${requestId}:audit-save`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_save_ideahire_privacy_audit_report",
        {
          p_request_id: requestId,
          p_risk_level: draft.riskLevel,
          p_scope: draft.scope.trim() || null,
          p_findings_summary: draft.findingsSummary.trim() || null,
          p_remediation_summary: draft.remediationSummary.trim() || null,
          p_public_scope: draft.publicScope.trim() || null,
          p_public_findings_summary: draft.publicFindingsSummary.trim() || null,
          p_public_remediation_summary: draft.publicRemediationSummary.trim() || null,
          p_public_summary: draft.publicSummary.trim() || null,
          p_checks: buildAuditChecksPayload(draft),
        }
      );

      if (error) throw error;

      setMessage("Robocza analiza i checklista zostały zapisane.");
      clearAuditDraft(requestId);
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zapisać analizy."));
    } finally {
      setBusy("");
    }
  }

  async function handleSubmitAudit(requestId) {
    const draft = getAuditDraft(requestId);
    const validationError = getAuditSaveError(draft);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const pendingCheck = PRIVACY_AUDIT_CHECKS.find(
      (definition) => draft.checks[definition.key]?.status === "pending"
    );

    if (pendingCheck) {
      setMessage(`Zakończ punkt „${pendingCheck.label}” przed przekazaniem analizy.`);
      return;
    }

    if (draft.riskLevel === "not_assessed") {
      setMessage("Wybierz poziom ryzyka przed przekazaniem analizy.");
      return;
    }

    if (draft.scope.trim().length < 20 || draft.findingsSummary.trim().length < 20) {
      setMessage("Przed przekazaniem uzupełnij zakres i podsumowanie ustaleń — każde w co najmniej 20 znakach.");
      return;
    }

    const hasIssue = PRIVACY_AUDIT_CHECKS.some(
      (definition) => draft.checks[definition.key]?.status === "issue_found"
    );

    if (hasIssue && draft.remediationSummary.trim().length < 20) {
      setMessage("Wykryte problemy wymagają planu działań naprawczych zawierającego co najmniej 20 znaków.");
      return;
    }

    if (draft.publicSummary.trim().length < 20) {
      setMessage("Wniosek końcowy dla użytkownika musi mieć co najmniej 20 znaków.");
      return;
    }

    if (
      draft.publicScope.trim().length < 20
      || draft.publicFindingsSummary.trim().length < 20
      || draft.publicRemediationSummary.trim().length < 20
    ) {
      setMessage("Przed publikacją uzupełnij zakres, ustalenia i działania dla użytkownika — każde pole w co najmniej 20 znakach.");
      return;
    }

    const missingPublicCheck = PRIVACY_AUDIT_CHECKS.find(
      (definition) => draft.checks[definition.key]?.publicNote.trim().length < 10
    );

    if (missingPublicCheck) {
      setMessage(`Dodaj wyjaśnienie dla użytkownika w punkcie „${missingPublicCheck.label}” — minimum 10 znaków.`);
      return;
    }

    setBusy(`${requestId}:audit-submit`);
    setMessage("");

    try {
      const saveResult = await supabase.rpc(
        "admin_save_ideahire_privacy_audit_report",
        {
          p_request_id: requestId,
          p_risk_level: draft.riskLevel,
          p_scope: draft.scope.trim(),
          p_findings_summary: draft.findingsSummary.trim(),
          p_remediation_summary: draft.remediationSummary.trim() || null,
          p_public_scope: draft.publicScope.trim(),
          p_public_findings_summary: draft.publicFindingsSummary.trim(),
          p_public_remediation_summary: draft.publicRemediationSummary.trim(),
          p_public_summary: draft.publicSummary.trim(),
          p_checks: buildAuditChecksPayload(draft),
        }
      );

      if (saveResult.error) throw saveResult.error;

      const submitResult = await supabase.rpc(
        "admin_submit_ideahire_privacy_audit",
        {
          p_request_id: requestId,
          p_public_summary: draft.publicSummary.trim(),
        }
      );

      if (submitResult.error) throw submitResult.error;

      setMessage("Analiza została przekazana właścicielowi technicznemu do zatwierdzenia.");
      clearAuditDraft(requestId);
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przekazać analizy do zatwierdzenia."));
    } finally {
      setBusy("");
    }
  }

  async function handleApproveAudit(requestId) {
    if (!window.confirm(
      "Czy zatwierdzić i opublikować pełny raport użytkownikowi? Sprawa pozostanie otwarta do jego odpowiedzi lub potwierdzenia odbioru."
    )) return;

    setBusy(`${requestId}:audit-approve`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "owner_approve_ideahire_privacy_audit",
        { p_request_id: requestId }
      );

      if (error) throw error;

      setMessage("Raport został zatwierdzony i czeka na odpowiedź lub potwierdzenie użytkownika.");
      clearAuditDraft(requestId);
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zatwierdzić analizy."));
    } finally {
      setBusy("");
    }
  }

  async function handleReturnAudit(requestId) {
    const draft = getAuditDraft(requestId);

    if (draft.returnNote.trim().length < 20) {
      setMessage("Uzasadnienie odesłania analizy musi mieć co najmniej 20 znaków.");
      return;
    }

    setBusy(`${requestId}:audit-return`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "owner_return_ideahire_privacy_audit",
        {
          p_request_id: requestId,
          p_note: draft.returnNote.trim(),
        }
      );

      if (error) throw error;

      setMessage("Analiza została odesłana administratorowi do poprawy.");
      clearAuditDraft(requestId);
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się odesłać analizy do poprawy."));
    } finally {
      setBusy("");
    }
  }

  async function handleTake(requestId) {
    setBusy(`${requestId}:take`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_take_ideahire_privacy_request",
        { p_request_id: requestId }
      );

      if (error) throw error;
      setMessage("Wniosek został przypisany do Ciebie.");
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przejąć wniosku."));
    } finally {
      setBusy("");
    }
  }

  async function handleUpdate(event, requestId) {
    event.preventDefault();
    const draft = getDraft(requestId);

    setBusy(`${requestId}:update`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_update_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_status: draft.status,
          p_public_message: draft.publicMessage.trim() || null,
          p_internal_note: draft.internalNote.trim() || null,
        }
      );

      if (error) throw error;
      setMessage("Status wniosku został zapisany.");
      setDrafts((current) => ({ ...current, [requestId]: undefined }));
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zaktualizować wniosku."));
    } finally {
      setBusy("");
    }
  }

  async function handleAdminPrivacyReply(event, requestId) {
    event.preventDefault();
    const reply = getDraft(requestId).replyMessage.trim();

    if (reply.length < 3) {
      setMessage("Wiadomość musi mieć co najmniej 3 znaki.");
      return;
    }

    setBusy(`${requestId}:admin-reply`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_reply_to_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_message: reply,
        }
      );

      if (error) throw error;

      updateDraft(requestId, { replyMessage: "" });
      setMessage("Wiadomość została wysłana do użytkownika.");
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się wysłać wiadomości."));
    } finally {
      setBusy("");
    }
  }

  async function handleExtend(requestId) {
    const draft = getDraft(requestId);

    if (draft.extensionReason.trim().length < 20) {
      setMessage("Uzasadnienie przedłużenia musi mieć co najmniej 20 znaków.");
      return;
    }

    setBusy(`${requestId}:extend`);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "admin_extend_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_reason: draft.extensionReason.trim(),
        }
      );

      if (error) throw error;
      setMessage("Termin został przedłużony i użytkownik zobaczy uzasadnienie.");
      await loadAdminPrivacyRequests();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przedłużyć terminu."));
    } finally {
      setBusy("");
    }
  }

  const activeRequests = requests.filter((item) => isPrivacyRequestOpen(item.status));
  const overdueRequests = activeRequests.filter((item) =>
    new Date(item.extended_due_at || item.due_at).getTime() < Date.now()
  );
  const unassignedRequests = activeRequests.filter((item) => !item.assigned_admin_id);

  const visibleRequests = requests.filter((item) => {
    if (filter === "all") return true;
    if (filter === "mine") return item.assigned_admin_id === user.id;
    if (filter === "unassigned") return isPrivacyRequestOpen(item.status) && !item.assigned_admin_id;
    if (filter === "requester_closed") return Boolean(item.requester_closed_at);
    if (filter === "completed") return !isPrivacyRequestOpen(item.status);
    return isPrivacyRequestOpen(item.status);
  });

  return (
    <div className="account-page admin-page admin-privacy-page">
      <AdminNavbar />

      <main className="admin-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">Ochrona danych</span>
            <h1>Wnioski użytkowników</h1>
            <p>
              Kontrolowana kolejka wniosków dotyczących praw użytkownika
              oraz technicznej i organizacyjnej analizy ochrony danych.
            </p>
          </div>
          <span className="admin-role-badge">
            {staffRole === "owner" ? "Właściciel techniczny" : "Administrator"}
          </span>
        </header>

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        <section className="admin-stats-grid" aria-label="Statystyki wniosków">
          <article><strong>{activeRequests.length}</strong><span>Aktywne wnioski</span></article>
          <article><strong>{unassignedRequests.length}</strong><span>Nieprzypisane</span></article>
          <article><strong>{overdueRequests.length}</strong><span>Po terminie</span></article>
          <article><strong>{requests.length}</strong><span>Wszystkie</span></article>
        </section>

        <section className="privacy-admin-queue">
          <div className="privacy-admin-toolbar">
            <div>
              <span className="section-label">Kolejka RODO</span>
              <h2>Sprawy do obsługi</h2>
            </div>
            <div className="disputes-filter-bar is-compact" role="group" aria-label="Filtr wniosków">
              {[
                ["active", "Aktywne"],
                ["unassigned", "Nieprzypisane"],
                ["mine", "Moje"],
                ["completed", "Zakończone"],
                ["requester_closed", "Zamknięte przez użytkownika"],
                ["all", "Wszystkie"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "is-active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="privacy-empty-state">Ładowanie kolejki...</div>
          ) : visibleRequests.length === 0 ? (
            <div className="privacy-empty-state">
              <strong>Brak wniosków w tym widoku</strong>
            </div>
          ) : (
            <div className="privacy-admin-list">
              {visibleRequests.map((request) => {
                const requesterName = getDisputeProfileName(
                  profiles[request.requester_user_id],
                  "Użytkownik"
                );
                const assignedName = request.assigned_admin_id
                  ? getDisputeProfileName(profiles[request.assigned_admin_id], "Administrator")
                  : "Nieprzypisany";
                const deadline = request.extended_due_at || request.due_at;
                const isOverdue = isPrivacyRequestOpen(request.status)
                  && new Date(deadline).getTime() < Date.now();
                const draft = getDraft(request.id);
                const events = eventsByRequest[request.id] || [];
                const requesterMessages = events.filter(
                  (item) => item.actor_role === "requester" && item.event_type === "message"
                );
                const latestRequesterMessage = requesterMessages[
                  requesterMessages.length - 1
                ] || null;
                const latestAdminPublicEvent = [...events].reverse().find(
                  (item) => ["owner", "admin"].includes(item.actor_role)
                    && item.visibility !== "internal"
                ) || null;
                const requesterReplyNeedsAttention = Boolean(
                  latestRequesterMessage
                  && isPrivacyRequestOpen(request.status)
                  && (
                    !latestAdminPublicEvent
                    || new Date(latestRequesterMessage.created_at).getTime()
                      > new Date(latestAdminPublicEvent.created_at).getTime()
                  )
                );
                const canWork = !request.assigned_admin_id
                  || request.assigned_admin_id === user.id
                  || staffRole === "owner";
                const isSecurityReview = request.request_type === "security_review";
                const audit = isSecurityReview
                  ? auditsByRequest[request.id]
                  : null;
                const auditDraft = audit
                  ? getAuditDraft(request.id)
                  : null;
                const auditEvents = audit
                  ? auditEventsByAudit[audit.id] || []
                  : [];
                const auditLocked = audit?.status === "ready_for_approval"
                  || audit?.status === "approved";

                return (
                  <article className={`privacy-admin-card${isOverdue ? " is-overdue" : ""}`} key={request.id}>
                    <div className="privacy-request-topline">
                      <div>
                        <span>{formatPrivacyRequestNumber(request.request_number)}</span>
                        <h3>{getOptionLabel(PRIVACY_REQUEST_TYPES, request.request_type)}</h3>
                      </div>
                      <span className={`privacy-status-pill is-${
                        request.requester_closed_at ? "requester_closed" : request.status
                      }`}>
                        {request.requester_closed_at
                          ? "Zamknięta przez użytkownika"
                          : PRIVACY_REQUEST_STATUSES[request.status] || request.status}
                      </span>
                    </div>

                    <div className="privacy-admin-owner-row">
                      <div className="admin-staff-avatar">
                        {profiles[request.requester_user_id]?.avatar_url ? (
                          <img src={profiles[request.requester_user_id].avatar_url} alt="" />
                        ) : requesterName.charAt(0).toUpperCase()}
                      </div>
                      <div><small>Użytkownik</small><strong>{requesterName}</strong></div>
                    </div>

                    {request.request_type === "erasure" && (
                      <>
                        <div className={`privacy-erasure-requested-action is-${
                          request.requested_erasure_action || "legacy"
                        }`}>
                          <span>Żądanie użytkownika</span>
                          <strong>
                            {request.requested_erasure_action
                              ? ERASURE_ACTION_LABELS[request.requested_erasure_action]
                              : "Starszy wniosek — wybór nie został zapisany"}
                          </strong>
                          <p>
                            {request.requested_erasure_action
                              ? ERASURE_ACTION_DESCRIPTIONS[request.requested_erasure_action]
                              : "Przed operacją ustal zakres z treści i historii wniosku."}
                          </p>
                        </div>
                        <Link
                          className="privacy-admin-account-link"
                          to={`/admin/privacy/users/${request.requester_user_id}?request=${request.id}`}
                        >
                          Otwórz konto i kontrolę usunięcia danych →
                        </Link>
                      </>
                    )}

                    <p className="privacy-request-description">{request.description}</p>

                    <dl className="privacy-request-meta">
                      <div><dt>Złożono</dt><dd>{formatDisputeDate(request.submitted_at)}</dd></div>
                      <div><dt>Termin</dt><dd className={isOverdue ? "is-overdue" : ""}>{formatDisputeDate(deadline, false)}</dd></div>
                      <div><dt>Opiekun</dt><dd>{assignedName}</dd></div>
                    </dl>

                    {request.requester_closed_at && (
                      <div className="privacy-admin-closed-banner" role="status">
                        <span aria-hidden="true">✓</span>
                        <div>
                          <strong>Sprawa zamknięta przez użytkownika</strong>
                          <p>
                            {request.status === "withdrawn"
                              ? `Użytkownik zakończył analizę przed publikacją raportu ${formatDisputeDate(request.requester_closed_at)}.`
                              : `Użytkownik potwierdził odbiór i zamknął analizę ${formatDisputeDate(request.requester_closed_at)}.`}
                            {" "}Pełna historia sprawy pozostała zachowana.
                          </p>
                        </div>
                      </div>
                    )}

                    {latestRequesterMessage && (
                      <section className={`privacy-admin-latest-reply${
                        requesterReplyNeedsAttention ? " needs-attention" : ""
                      }`}>
                        <div className="privacy-admin-latest-reply-heading">
                          <div>
                            <span className="section-label">Najnowsza odpowiedź użytkownika</span>
                            <strong>{requesterName}</strong>
                          </div>
                          <span>
                            {requesterReplyNeedsAttention
                              ? "Wymaga odpowiedzi"
                              : "Odpowiedź zapisana"}
                          </span>
                        </div>
                        <p>{latestRequesterMessage.message}</p>
                        <time>{formatDisputeDate(latestRequesterMessage.created_at)}</time>
                      </section>
                    )}

                    {!request.assigned_admin_id && isPrivacyRequestOpen(request.status) && (
                      <button
                        type="button"
                        className="privacy-primary-button"
                        onClick={() => handleTake(request.id)}
                        disabled={Boolean(busy)}
                      >
                        {busy === `${request.id}:take` ? "Przypisywanie..." : "Przejmij wniosek"}
                      </button>
                    )}

                    <details className="privacy-admin-details">
                      <summary>Otwórz historię i narzędzia obsługi</summary>

                      {events.length > 0 && (
                        <ol className="privacy-admin-timeline">
                          {events.map((item) => (
                            <li
                              className={[
                                item.visibility === "internal" ? "is-internal" : "",
                                item.actor_role === "requester" ? "is-requester" : "",
                                item.id === latestRequesterMessage?.id ? "is-latest" : "",
                              ].filter(Boolean).join(" ")}
                              key={item.id}
                            >
                              <span>{item.message || item.event_type}</span>
                              <small>
                                {item.actor_role === "requester"
                                  ? "Autor: użytkownik"
                                  : ["owner", "admin"].includes(item.actor_role)
                                    ? "Autor: administracja"
                                    : "Autor: system"}
                                {item.visibility === "internal"
                                  ? " · tylko administracja"
                                  : " · widoczne dla użytkownika"}
                              </small>
                              <time>{formatDisputeDate(item.created_at)}</time>
                            </li>
                          ))}
                        </ol>
                      )}

                      {isSecurityReview && (
                        <section className="privacy-audit-workspace">
                          <div className="privacy-audit-heading">
                            <div>
                              <span className="section-label">Analiza wewnętrzna</span>
                              <h4>Kontrola ochrony danych</h4>
                            </div>
                            {audit && (
                              <span className={`privacy-audit-status is-${audit.status}`}>
                                {PRIVACY_AUDIT_STATUSES[audit.status] || audit.status}
                              </span>
                            )}
                          </div>

                          <p className="privacy-audit-legal-note">
                            Narzędzie wspiera kontrolę techniczną i organizacyjną.
                            Nie stanowi opinii prawnej ani potwierdzenia zgodności
                            wydanego przez przyszłego Operatora IdeaHire.
                          </p>

                          {!audit ? (
                            <div className="privacy-audit-access-note">
                              <strong>
                                {request.assigned_admin_id
                                  ? "Analiza jest przypisana do innego administratora"
                                  : "Przejmij wniosek, aby rozpocząć analizę"}
                              </strong>
                              <p>
                                {request.assigned_admin_id
                                  ? "Jej szczegóły widzi wyłącznie prowadzący administrator oraz właściciel techniczny panelu."
                                  : "Po przypisaniu otrzymasz dostęp do checklisty. Jej szczegóły będą widoczne wyłącznie dla Ciebie i właściciela technicznego panelu."}
                              </p>
                            </div>
                          ) : (
                            <>
                              <form
                                className="privacy-audit-form"
                                onSubmit={(event) => handleSaveAudit(event, request.id)}
                              >
                                <div className="privacy-audit-overview">
                                  <label>
                                    Poziom ryzyka
                                    <select
                                      value={auditDraft.riskLevel}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        riskLevel: event.target.value,
                                      })}
                                      disabled={Boolean(busy) || auditLocked}
                                    >
                                      {PRIVACY_AUDIT_RISK_LEVELS.map(([value, label]) => (
                                        <option value={value} key={value}>{label}</option>
                                      ))}
                                    </select>
                                  </label>

                                  <div className="privacy-audit-updated">
                                    <span>Ostatnia aktualizacja</span>
                                    <strong>{formatDisputeDate(audit.updated_at)}</strong>
                                  </div>
                                </div>

                                <label>
                                  Zakres analizy
                                  <textarea
                                    value={auditDraft.scope}
                                    onChange={(event) => updateAuditDraft(request.id, {
                                      scope: event.target.value,
                                    })}
                                    placeholder="Wskaż dane, funkcje, systemy i okres objęte analizą..."
                                    minLength={auditDraft.scope ? 20 : undefined}
                                    maxLength={5000}
                                    rows={4}
                                    disabled={Boolean(busy) || auditLocked}
                                  />
                                </label>

                                <div className="privacy-audit-section-heading">
                                  <div>
                                    <span>12 punktów kontrolnych</span>
                                    <small>
                                      Każdy punkt wymaga osobnego wyjaśnienia dla użytkownika;
                                      wykryty problem wymaga również notatki wewnętrznej.
                                    </small>
                                  </div>
                                  <strong>
                                    {PRIVACY_AUDIT_CHECKS.filter((definition) =>
                                      auditDraft.checks[definition.key]?.status !== "pending"
                                    ).length}/12
                                  </strong>
                                </div>

                                <div className="privacy-audit-checklist">
                                  {PRIVACY_AUDIT_CHECKS.map((definition, index) => {
                                    const check = auditDraft.checks[definition.key];

                                    return (
                                      <article
                                        className={`privacy-audit-check is-${check.status}`}
                                        key={definition.key}
                                      >
                                        <div className="privacy-audit-check-title">
                                          <span>{String(index + 1).padStart(2, "0")}</span>
                                          <div>
                                            <strong>{definition.label}</strong>
                                            <p>{definition.description}</p>
                                          </div>
                                        </div>

                                        <label>
                                          Wynik kontroli
                                          <select
                                            value={check.status}
                                            onChange={(event) => updateAuditCheckDraft(
                                              request.id,
                                              definition.key,
                                              { status: event.target.value }
                                            )}
                                            disabled={Boolean(busy) || auditLocked}
                                          >
                                            {PRIVACY_AUDIT_CHECK_STATUSES.map(([value, label]) => (
                                              <option value={value} key={value}>{label}</option>
                                            ))}
                                          </select>
                                        </label>

                                        <label>
                                          Dowód lub notatka wewnętrzna
                                          <textarea
                                            value={check.note}
                                            onChange={(event) => updateAuditCheckDraft(
                                              request.id,
                                              definition.key,
                                              { note: event.target.value }
                                            )}
                                            placeholder={check.status === "issue_found"
                                              ? "Opisz wykryty problem i jego znaczenie..."
                                              : "Dodaj krótką podstawę oceny, jeśli jest potrzebna..."}
                                            maxLength={5000}
                                            rows={3}
                                            disabled={Boolean(busy) || auditLocked}
                                          />
                                        </label>

                                        <label className="privacy-audit-public-note">
                                          Wyjaśnienie dla użytkownika
                                          <textarea
                                            value={check.publicNote}
                                            onChange={(event) => updateAuditCheckDraft(
                                              request.id,
                                              definition.key,
                                              { publicNote: event.target.value }
                                            )}
                                            placeholder="Wyjaśnij prostym językiem, co sprawdzono i jaki jest wynik tego punktu..."
                                            minLength={check.publicNote ? 10 : undefined}
                                            maxLength={5000}
                                            rows={3}
                                            disabled={Boolean(busy) || auditLocked}
                                          />
                                          <small>
                                            Po zatwierdzeniu tę treść zobaczy użytkownik.
                                          </small>
                                        </label>
                                      </article>
                                    );
                                  })}
                                </div>

                                <label>
                                  Podsumowanie ustaleń
                                  <textarea
                                    value={auditDraft.findingsSummary}
                                    onChange={(event) => updateAuditDraft(request.id, {
                                      findingsSummary: event.target.value,
                                    })}
                                    placeholder="Podsumuj ustalenia bez publikowania zbędnych danych osobowych..."
                                    maxLength={10000}
                                    rows={5}
                                    disabled={Boolean(busy) || auditLocked}
                                  />
                                </label>

                                <label>
                                  Plan działań naprawczych
                                  <textarea
                                    value={auditDraft.remediationSummary}
                                    onChange={(event) => updateAuditDraft(request.id, {
                                      remediationSummary: event.target.value,
                                    })}
                                    placeholder="Jeżeli wykryto problem, opisz działania, priorytet i sposób ponownej kontroli..."
                                    maxLength={10000}
                                    rows={5}
                                    disabled={Boolean(busy) || auditLocked}
                                  />
                                </label>

                                <section className="privacy-audit-public-editor">
                                  <div className="privacy-audit-public-editor-heading">
                                    <div>
                                      <span className="section-label">Raport dla użytkownika</span>
                                      <h5>Pełne wyjaśnienie wyniku</h5>
                                    </div>
                                    <strong>Publikacja po zatwierdzeniu</strong>
                                  </div>
                                  <p>
                                    Opisz wynik prostym językiem. Nie kopiuj surowych danych
                                    innych osób, sekretów technicznych ani informacji, których
                                    ujawnienie mogłoby obniżyć bezpieczeństwo.
                                  </p>

                                  <label>
                                    Zakres widoczny dla użytkownika
                                    <textarea
                                      value={auditDraft.publicScope}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        publicScope: event.target.value,
                                      })}
                                      placeholder="Wyjaśnij, jakie dane, funkcje, systemy i okres objęto analizą..."
                                      minLength={auditDraft.publicScope ? 20 : undefined}
                                      maxLength={5000}
                                      rows={4}
                                      disabled={Boolean(busy) || auditLocked}
                                    />
                                  </label>

                                  <label>
                                    Ustalenia widoczne dla użytkownika
                                    <textarea
                                      value={auditDraft.publicFindingsSummary}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        publicFindingsSummary: event.target.value,
                                      })}
                                      placeholder="Opisz najważniejsze ustalenia oraz ich znaczenie dla danych użytkownika..."
                                      minLength={auditDraft.publicFindingsSummary ? 20 : undefined}
                                      maxLength={10000}
                                      rows={5}
                                      disabled={Boolean(busy) || auditLocked}
                                    />
                                  </label>

                                  <label>
                                    Działania i zalecenia widoczne dla użytkownika
                                    <textarea
                                      value={auditDraft.publicRemediationSummary}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        publicRemediationSummary: event.target.value,
                                      })}
                                      placeholder="Opisz wykonane lub planowane działania. Jeżeli nie są potrzebne, wyjaśnij dlaczego..."
                                      minLength={auditDraft.publicRemediationSummary ? 20 : undefined}
                                      maxLength={10000}
                                      rows={5}
                                      disabled={Boolean(busy) || auditLocked}
                                    />
                                  </label>

                                  <label className="privacy-audit-public-summary">
                                    Wniosek końcowy dla użytkownika
                                    <textarea
                                      value={auditDraft.publicSummary}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        publicSummary: event.target.value,
                                      })}
                                      placeholder="Napisz jasny wniosek końcowy, który po zatwierdzeniu zobaczy wyłącznie użytkownik..."
                                      minLength={auditDraft.publicSummary ? 20 : undefined}
                                      maxLength={5000}
                                      rows={5}
                                      disabled={Boolean(busy) || auditLocked}
                                    />
                                    <small>
                                      Raport stanie się widoczny dopiero po zatwierdzeniu przez właściciela technicznego.
                                    </small>
                                  </label>
                                </section>

                                {!auditLocked && isPrivacyRequestOpen(request.status) && canWork && (
                                  <div className="privacy-audit-actions">
                                    <button
                                      className="privacy-secondary-button"
                                      type="submit"
                                      disabled={Boolean(busy)}
                                    >
                                      {busy === `${request.id}:audit-save`
                                        ? "Zapisywanie..."
                                        : "Zapisz wersję roboczą"}
                                    </button>
                                    <button
                                      className="privacy-primary-button"
                                      type="button"
                                      onClick={() => handleSubmitAudit(request.id)}
                                      disabled={Boolean(busy)}
                                    >
                                      {busy === `${request.id}:audit-submit`
                                        ? "Przekazywanie..."
                                        : "Przekaż do zatwierdzenia"}
                                    </button>
                                  </div>
                                )}
                              </form>

                              {audit.status === "ready_for_approval" && (
                                <div className="privacy-audit-approval-panel">
                                  {staffRole === "owner" ? (
                                    <>
                                      <div>
                                        <strong>Weryfikacja właściciela technicznego</strong>
                                        <p>
                                          Przed zatwierdzeniem sprawdź checklistę, ustalenia,
                                          plan naprawczy i treść przeznaczoną dla użytkownika.
                                        </p>
                                      </div>

                                      <button
                                        className="privacy-primary-button"
                                        type="button"
                                        onClick={() => handleApproveAudit(request.id)}
                                        disabled={Boolean(busy)}
                                      >
                                        {busy === `${request.id}:audit-approve`
                                          ? "Zatwierdzanie..."
                                          : "Zatwierdź i opublikuj pełny raport"}
                                      </button>

                                      <label>
                                        Powód odesłania do poprawy
                                        <textarea
                                          value={auditDraft.returnNote}
                                          onChange={(event) => updateAuditDraft(request.id, {
                                            returnNote: event.target.value,
                                          })}
                                          placeholder="Opisz, co administrator powinien uzupełnić lub ponownie sprawdzić..."
                                          minLength={20}
                                          maxLength={5000}
                                          rows={3}
                                          disabled={Boolean(busy)}
                                        />
                                      </label>
                                      <button
                                        className="privacy-secondary-button"
                                        type="button"
                                        onClick={() => handleReturnAudit(request.id)}
                                        disabled={Boolean(busy) || auditDraft.returnNote.trim().length < 20}
                                      >
                                        {busy === `${request.id}:audit-return`
                                          ? "Odsyłanie..."
                                          : "Odeślij do poprawy"}
                                      </button>
                                    </>
                                  ) : (
                                    <p>
                                      Analiza czeka na wewnętrzne sprawdzenie właściciela technicznego.
                                      Do tego czasu nie można jej edytować ani zakończyć wniosku.
                                    </p>
                                  )}
                                </div>
                              )}

                              {audit.status === "approved" && (
                                <div className="privacy-audit-approved-summary">
                                  <strong>Pełny raport przekazany użytkownikowi</strong>
                                  <p>{audit.public_summary}</p>
                                  <small>
                                    Zatwierdzono: {formatDisputeDate(audit.approved_at)} ·
                                    sprawę zamyka użytkownik po przeczytaniu raportu.
                                  </small>
                                </div>
                              )}

                              {auditEvents.length > 0 && (
                                <details className="privacy-audit-history">
                                  <summary>Historia wewnętrzna analizy</summary>
                                  <ol>
                                    {auditEvents.map((item) => (
                                      <li key={item.id}>
                                        <div>
                                          <strong>
                                            {PRIVACY_AUDIT_EVENT_LABELS[item.event_type] || item.event_type}
                                          </strong>
                                          {item.note && <p>{item.note}</p>}
                                        </div>
                                        <time>{formatDisputeDate(item.created_at)}</time>
                                      </li>
                                    ))}
                                  </ol>
                                </details>
                              )}
                            </>
                          )}
                        </section>
                      )}

                      {isSecurityReview
                        && audit
                        && canWork
                        && isPrivacyRequestOpen(request.status) && (
                        <form
                          className="privacy-admin-reply-form"
                          onSubmit={(event) => handleAdminPrivacyReply(event, request.id)}
                        >
                          <div>
                            <strong>Odpowiedz użytkownikowi</strong>
                            <p>
                              Wiadomość będzie widoczna na koncie użytkownika i ustawi
                              sprawę jako oczekującą na jego odpowiedź lub potwierdzenie.
                            </p>
                          </div>
                          <label htmlFor={`admin-privacy-reply-${request.id}`}>
                            Treść wiadomości
                            <textarea
                              id={`admin-privacy-reply-${request.id}`}
                              value={draft.replyMessage}
                              onChange={(event) => updateDraft(request.id, {
                                replyMessage: event.target.value,
                              })}
                              placeholder="Odpowiedz na pytanie albo wyjaśnij wskazany punkt raportu..."
                              minLength={3}
                              maxLength={5000}
                              rows={4}
                              disabled={Boolean(busy)}
                            />
                          </label>
                          <button
                            type="submit"
                            className="privacy-secondary-button"
                            disabled={Boolean(busy) || draft.replyMessage.trim().length < 3}
                          >
                            {busy === `${request.id}:admin-reply`
                              ? "Wysyłanie..."
                              : "Wyślij odpowiedź użytkownikowi"}
                          </button>
                        </form>
                      )}

                      {isPrivacyRequestOpen(request.status)
                        && canWork
                        && (!isSecurityReview || (audit && !auditLocked)) && (
                        <form className="privacy-admin-form" onSubmit={(event) => handleUpdate(event, request.id)}>
                          {isSecurityReview && (
                            <div className="privacy-audit-contact-note">
                              Ten formularz służy do zmiany etapu lub poproszenia
                              użytkownika o informacje. Zakończenie analizy następuje
                              wyłącznie przez proces zatwierdzania powyżej.
                            </div>
                          )}
                          <label>
                            Nowy status
                            <select
                              value={draft.status}
                              onChange={(event) => updateDraft(request.id, { status: event.target.value })}
                              disabled={Boolean(busy)}
                            >
                              {Object.entries(PRIVACY_REQUEST_STATUSES)
                                .filter(([value]) => !["submitted", "withdrawn"].includes(value))
                                .filter(([value]) => !isSecurityReview
                                  || !["completed", "partially_completed"].includes(value))
                                .map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </select>
                          </label>

                          <label>
                            Wiadomość dla użytkownika
                            <textarea
                              value={draft.publicMessage}
                              onChange={(event) => updateDraft(request.id, { publicMessage: event.target.value })}
                              placeholder="Opisz wykonane działanie, potrzebne informacje albo przyczynę decyzji..."
                              maxLength={5000}
                              rows={4}
                            />
                          </label>

                          <label>
                            Notatka wewnętrzna
                            <textarea
                              value={draft.internalNote}
                              onChange={(event) => updateDraft(request.id, { internalNote: event.target.value })}
                              placeholder="Informacja widoczna wyłącznie dla administracji..."
                              maxLength={5000}
                              rows={3}
                            />
                          </label>

                          <button className="privacy-primary-button" type="submit" disabled={Boolean(busy)}>
                            {busy === `${request.id}:update` ? "Zapisywanie..." : "Zapisz status i wiadomość"}
                          </button>

                          {!request.extended_due_at && (
                            <div className="privacy-extension-form">
                              <label>
                                Uzasadnienie przedłużenia terminu
                                <textarea
                                  value={draft.extensionReason}
                                  onChange={(event) => updateDraft(request.id, { extensionReason: event.target.value })}
                                  placeholder="Wyjaśnij złożoność sprawy lub liczbę obsługiwanych wniosków..."
                                  maxLength={5000}
                                  rows={3}
                                />
                              </label>
                              <button
                                type="button"
                                className="privacy-secondary-button"
                                onClick={() => handleExtend(request.id)}
                                disabled={Boolean(busy) || draft.extensionReason.trim().length < 20}
                              >
                                {busy === `${request.id}:extend` ? "Przedłużanie..." : "Przedłuż termin maksymalnie o 2 miesiące"}
                              </button>
                            </div>
                          )}
                        </form>
                      )}
                    </details>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPanel() {
  const { user } = useAuth();
  const { staffRole, staffLoading, isStaff, isOwner } = useStaffRole(user?.id);
  const [disputes, setDisputes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function loadAdminData() {
    if (!user?.id || !isStaff) return;

    const [disputeResult, staffResult, auditResult] = await Promise.all([
      supabase
        .from("disputes")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(300),
      supabase
        .from("ideahire_staff")
        .select("user_id, role, is_active, granted_at, revoked_at")
        .order("granted_at", { ascending: true }),
      supabase
        .from("ideahire_admin_audit_log")
        .select("id, actor_user_id, actor_role, action, dispute_id, target_user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    if (disputeResult.error) throw disputeResult.error;
    if (staffResult.error) throw staffResult.error;
    if (auditResult.error) throw auditResult.error;

    const profileIds = [
      ...(staffResult.data || []).map((item) => item.user_id),
      ...(auditResult.data || []).flatMap((item) => [
        item.actor_user_id,
        item.target_user_id,
      ]),
    ].filter(Boolean);
    const uniqueIds = [...new Set(profileIds)];
    let profileMap = {};

    if (uniqueIds.length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueIds);

      if (!error) {
        profileMap = Object.fromEntries(
          (data || []).map((profile) => [profile.id, profile])
        );
      }
    }

    setDisputes(disputeResult.data || []);
    setStaff(staffResult.data || []);
    setAuditLog(auditResult.data || []);
    setProfiles(profileMap);
  }

  useEffect(() => {
    if (staffLoading) return;

    if (!isStaff) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function prepare() {
      setLoading(true);
      setMessage("");

      try {
        await loadAdminData();
      } catch (error) {
        if (mounted) {
          setMessage(cleanSupabaseError(error, "Nie udało się pobrać panelu administratora."));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prepare();

    const channel = supabase
      .channel(`admin-panel-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes" },
        () => loadAdminData().catch(console.error)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id, isStaff, staffLoading]);

  async function handleStaffChange(enabled) {
    const email = adminEmail.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      setMessage("Wpisz prawidłowy adres e-mail konta IdeaHire.");
      return;
    }

    setBusy(enabled ? "grant" : "revoke");
    setMessage("");

    try {
      const { error } = await supabase.rpc("owner_set_admin_by_email", {
        p_email: email,
        p_enabled: enabled,
      });

      if (error) throw error;

      setMessage(
        enabled
          ? "Rola administratora została nadana."
          : "Rola administratora została odebrana."
      );
      setAdminEmail("");
      await loadAdminData();
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zmienić roli administratora."));
    } finally {
      setBusy("");
    }
  }

  if (staffLoading || loading) {
    return (
      <div className="account-page admin-page">
        <AdminNavbar />
        <main className="admin-shell">
          <div className="dispute-state-card">Ładowanie panelu administratora...</div>
        </main>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="account-page admin-page">
        <AccountNavbar />
        <main className="admin-shell">
          <div className="dispute-state-card is-error">
            <h1>Brak uprawnień</h1>
            <p>Ten panel jest dostępny wyłącznie dla aktywnego właściciela i administratorów IdeaHire.</p>
            <Link className="dispute-secondary-button" to="/account">
              Wróć do konta
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const activeDisputes = disputes.filter(
    (item) => !["closed", "cancelled"].includes(item.status)
  );
  const unassignedCount = activeDisputes.filter(
    (item) => !item.assigned_admin_id
  ).length;
  const awaitingCount = activeDisputes.filter(
    (item) => item.status === "awaiting_response"
  ).length;
  const appealedCount = activeDisputes.filter(
    (item) => item.status === "appealed"
  ).length;
  const visibleDisputes = disputes.filter((item) => {
    if (filter === "all") return true;
    if (filter === "mine") return item.assigned_admin_id === user.id;
    if (filter === "unassigned") {
      return !item.assigned_admin_id && !["closed", "cancelled"].includes(item.status);
    }
    if (filter === "closed") return ["closed", "cancelled"].includes(item.status);
    return !["closed", "cancelled"].includes(item.status);
  });

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell">
        <header className="admin-page-header">
          <div>
            <span className="section-label">IdeaHire · administracja</span>
            <h1>Panel administratora</h1>
            <p>
              Kolejka sporów, udokumentowane decyzje i kontrola dostępu administratorów.
            </p>
          </div>
          <span className="admin-role-badge">
            {staffRole === "owner" ? "Właściciel" : "Administrator"}
          </span>
        </header>

        {message && <p className="dispute-page-message" role="status">{message}</p>}

        <section className="admin-stats-grid" aria-label="Statystyki spraw">
          <article><strong>{activeDisputes.length}</strong><span>Aktywne sprawy</span></article>
          <article><strong>{unassignedCount}</strong><span>Nieprzypisane</span></article>
          <article><strong>{awaitingCount}</strong><span>Czekają na odpowiedź</span></article>
          <article><strong>{appealedCount}</strong><span>Odwołania</span></article>
        </section>

        <div className="admin-content-grid">
          <section className="dispute-panel admin-queue-panel">
            <div className="dispute-panel-heading">
              <div>
                <span className="dispute-eyebrow">Kolejka</span>
                <h2>Sprawy użytkowników</h2>
              </div>
              <span className="dispute-count-badge">{visibleDisputes.length}</span>
            </div>

            <div className="disputes-filter-bar is-compact" role="group" aria-label="Filtr kolejki">
              {[
                ["active", "Aktywne"],
                ["unassigned", "Nieprzypisane"],
                ["mine", "Moje"],
                ["closed", "Zakończone"],
                ["all", "Wszystkie"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={filter === value ? "is-active" : ""}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {visibleDisputes.length === 0 ? (
              <p className="dispute-empty-copy">Brak spraw spełniających wybrany filtr.</p>
            ) : (
              <div className="dispute-list is-admin">
                {visibleDisputes.map((item) => (
                  <DisputeListCard
                    key={item.id}
                    dispute={item}
                    userId={user.id}
                    adminView
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="admin-side-column">
            {isOwner && (
              <section className="dispute-panel owner-access-panel">
                <span className="dispute-eyebrow">Tylko właściciel</span>
                <h2>Dostęp administratorów</h2>
                <p>
                  Użytkownik musi wcześniej utworzyć i potwierdzić zwykłe konto IdeaHire.
                </p>
                <label>
                  Adres e-mail konta
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                    placeholder="admin@firma.pl"
                    disabled={Boolean(busy)}
                  />
                </label>
                <div className="dispute-action-row">
                  <button
                    type="button"
                    className="dispute-primary-button"
                    onClick={() => handleStaffChange(true)}
                    disabled={Boolean(busy)}
                  >
                    {busy === "grant" ? "Nadawanie..." : "Nadaj rolę"}
                  </button>
                  <button
                    type="button"
                    className="dispute-danger-button is-outline"
                    onClick={() => handleStaffChange(false)}
                    disabled={Boolean(busy)}
                  >
                    {busy === "revoke" ? "Odbieranie..." : "Odbierz rolę"}
                  </button>
                </div>

                <div className="admin-staff-list">
                  {staff.map((item) => (
                    <article key={item.user_id} className={!item.is_active ? "is-inactive" : ""}>
                      <div className="admin-staff-avatar">
                        {profiles[item.user_id]?.avatar_url ? (
                          <img src={profiles[item.user_id].avatar_url} alt="" />
                        ) : getDisputeProfileName(
                            profiles[item.user_id],
                            item.role === "owner" ? "W" : "A"
                          ).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{getDisputeProfileName(
                          profiles[item.user_id],
                          item.role === "owner" ? "Właściciel" : "Administrator"
                        )}</strong>
                        <small>
                          {item.role === "owner" ? "Właściciel" : "Administrator"} · {item.is_active ? "aktywny" : "nieaktywny"}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="dispute-panel admin-audit-panel">
              <span className="dispute-eyebrow">Rejestr działań</span>
              <h2>Ostatnia aktywność</h2>
              <div className="admin-audit-list">
                {auditLog.length === 0 ? (
                  <p>Brak zapisanych działań.</p>
                ) : (
                  auditLog.map((item) => (
                    <article key={item.id}>
                      <strong>{ADMIN_AUDIT_LABELS[item.action] || item.action}</strong>
                      <span>
                        {getDisputeProfileName(
                          profiles[item.actor_user_id],
                          item.actor_role === "owner" ? "Właściciel" : "Administrator"
                        )}
                      </span>
                      <time>{formatDisputeDate(item.created_at)}</time>
                    </article>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
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
    session,
    user,
  } =
    useAuth();

  const {
    isStaff,
    staffLoading,
  } = useStaffRole(user?.id);

  const {
    isLimited,
    ageRequired,
    loading: ageLoading,
  } = useAgeAccess();

  const {
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();

  if (
    loading ||
    (user?.id && (staffLoading || ageLoading || restrictionLoading))
  ) {
    return <LoadingScreen />;
  }

  if (isStaff) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  if (user?.id && (isRestricted || restrictionError)) {
    return <Navigate to="/account-status" replace />;
  }

  if (user?.id && (isLimited || ageRequired)) {
    return <Navigate to="/account" replace />;
  }

  return (
    <App
      session={session}
      loading={loading}
    />
  );
}

/* =========================================================
   ROUTER
========================================================= */

function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountRestrictionProvider>
          <AgeAccessProvider>
          <Sorts />

        <style>{`
          .ideahire-multiline-field {
            display: block;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            word-break: break-word;
            line-height: 1.55;
            resize: vertical;
            overflow-x: hidden;
          }

          .ideahire-title-field {
            min-height: 62px;
          }

          .ideahire-about-field,
          .ideahire-description-field {
            min-height: 150px;
          }

          .job-card,
          .job-card h1,
          .job-card h2,
          .job-card h3,
          .job-card p,
          .profile-about,
          .profile-about p {
            min-width: 0;
            max-width: 100%;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            word-break: break-word;
          }

          @media (max-width: 600px) {
            .ideahire-multiline-field {
              width: 100%;
              max-width: 100%;
              font-size: 16px;
              line-height: 1.5;
            }

            .ideahire-title-field {
              min-height: 68px;
            }

            .ideahire-about-field,
            .ideahire-description-field {
              min-height: 175px;
            }
          }
        `}</style>

        <Routes>
          <Route
            path="/"
            element={
              passwordRecoveryRequested
                ? <ResetPassword />
                : <Home />
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
            path="/polityka-cookies"
            element={<CookiePolicy />}
          />

          <Route
            path="/polityka-prywatnosci"
            element={<PrivacyPolicy />}
          />

          <Route
            path="/regulamin"
            element={<TermsOfService />}
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <AccountEntry />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/privacy-center"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited allowRestricted>
                  <PrivacyCenter />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/account-status"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited allowRestricted>
                  <AccountStatus />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/find-talent"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <FindTalent />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-job/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <EditJob />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <Jobs />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <Profile />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Notifications />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Messages />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Chat />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/disputes"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <Disputes />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/disputes/:id"
            element={
              <ProtectedRoute>
                <RestrictedAccountRoute>
                  <DisputeDetails />
                </RestrictedAccountRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminPanel />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/jobs"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminJobs />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/messages"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminEvidenceMessages />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/privacy"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminPrivacyRequests />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/privacy/users/:userId"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminUserPrivacyAccount />
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminModeration />
                </StaffOnlyRoute>
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
          </AgeAccessProvider>
        </AccountRestrictionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;
