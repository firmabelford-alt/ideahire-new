import { FormSelect, AutoTextarea } from "./FormControls";
/* P70 — one task per screen and project details opened on demand. */
/* P60 — useful onboarding, email actions and site browsing for limited accounts. */
/* P59 — fullscreen onboarding, visible registration validation, limited account. */
/* P47 — pełny plik src/router.jsx | Zmieniona wyłącznie karta szablonów. */
/* IdeaHire | P40 | 2026-10-15 | Oczko hasła i nowe centrum konta. */
/* IdeaHire | STRIPE 12 | 2026-10-15 | Saldo i wyplaty w profilu. */
/* IdeaHire | PACZKA 30 | 2026-10-11 | Pełny plik: src/router.jsx */
/* IDEA HIRE — NAVY PROFESSIONAL UI V5.6 — RELEASE 2026-10-03 */
/* Full file for direct replacement: src/router.jsx */

/* IDEA HIRE — STRIPE CONNECT PANEL — BUILD 2026-09-05 */
/* IDEA HIRE — PRIVATE CALENDAR + E-MAIL REMINDERS — BUILD 2026-10-03 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useContext,
  createContext,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  useLocation,
  useNavigate as useRouterNavigate,
  useParams,
} from "react-router-dom";

import App from "./App";
import { OwnedListingCard, OwnedListingsEmpty } from "./OwnedListings";
import { StudioNavigation, StudioHeading, ProfileDetailsEditor, ExpertiseEditor, PortfolioStudio } from "./ProfileStudio";
import { usePrivacyRequests, PrivacyFeedback, PrivacyReceipt, PrivacyHistoryNotice, PrivacyGuide } from "./PrivacyDesk";
import { privacyCall, privacyDraftProblem } from "./PrivacyRequests";
import { AdminNavigation, AdminPageHeading, AdminTabs, AdminPane, AdminHistory, AdminModal, AdminDisclosure, AdminFilterBar, AdminMetrics, AdminQueue, AdminCaseTools, AdminCaseRow, AdminActivityLog, AdminErasureSteps, AdminRefreshNotice, useAdminSelection, useAdminDialog, adminRead, adminRpc } from "./AdminDesk";
import { adminQueueSearch, orderAdminRequests, adminPrivacyFilter } from "./AdminDomain";
import { ErasureScope } from "./AdminErasure";
import { executeErasure, erasureFailureMessage, erasureOutcomeKnown, ERASURE_RETAINED_LABELS, ERASURE_CONFIRMATION } from "./ErasureWorkflow";
import AdminLucynaDesk from "./AdminLucyna";
import { getJobExpiryInfo, useListingClock, visibleJobSkills, ownedJobState } from "./JobListingState";
import StripeAccountPayouts from "./StripeAccountPanel";
import DisputePaymentPanel, { DisputeSettlementStatus } from "./DisputePayments";
import { BrandSignature } from "./Brand";
import { WorkspaceNavigation, WorkspaceDashboard, WorkspaceSectionNav, WorkspaceWork, WorkspaceLimitedHome, WorkspaceIcon } from "./Workspace";
import { WorkspaceInbox, WorkspaceConversation, WorkspaceThread, WorkspaceComposer, WorkspaceMessageReports } from "./WorkspaceMessages";
import { agreementPermissions, agreementToForm, EMPTY_AGREEMENT_FORM } from "./AgreementWorkflow";
import { InquiryMessageCard, TermsDecisionMessage, isInquiryMessage, latestTermsDecision, readTermsDecision } from "./ConversationCards";
import { SubpageTheme, SubpageNavigation, SubpageHeading, SubpageMetrics, SubpageLoading } from "./Subpages";
import { RegistrationSentScreen, LimitedAccountOverview, LimitedAccountNavigation, useJourneyMotion } from "./AccountJourney";
import RegistrationInterview, { EMPTY_INTERVIEW, RegistrationInterviewPrivacy } from "./RegistrationInterview";
import { REGISTRATION_INTERVIEW_KEY, normalizeRegistrationInterview, rememberRegistrationInterview, registrationInterviewForUser, saveRegistrationInterview, clearRegistrationInterview, clearRegistrationInterviewMetadata } from "./RegistrationInterviewState";
import { IdeaHireDateField, MarketFilters, MarketHeader, MarketIcon, MarketSelect, IDEA_HIRE_PUBLIC_OFFER, IdeaHireLogo, ProfileHub, PasswordInput, helpCenterHref, getSafeWebUrl } from "./MarketUI";
import { useSitePreferences, translateUiText, IDEA_HIRE_THEME_IDENTITY } from "./Preferences";
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
  getCaptchaErrorMessage,
  getPasswordRecoveryRedirectUrl,
  getNewPasswordValidationMessage,
  NEW_PASSWORD_MIN_LENGTH,
  normalizeEmail,
} from "./auth";
import { useAuthCaptcha } from "./AuthCaptcha";
import {
  containsCredentialLikeText,
  MessageText,
  PrivateMessageMaterials,
  sendConversationVoice,
  PrivateReportDialog,
  PrivateSharePanel,
  ProjectFilesPanel,
  usePrivateWork,
  WorkDeliveryPanel,
} from "./PrivateWork";
import ServiceMarketplace, { FreelancerDirectory, FreelancerVisibility, ProfileContactAction, profileInquiryToJob, localProjectDate } from "./ServiceMarketplace";
import LucynaDock, { canShowLucynaDock, requestLucynaDock } from "./LucynaDock";
import { normalizeLucynaAction } from "./LucynaActions";
import { useGoogleAuth, GooglePendingNotice, RegistrationDraftProvider, useRegistrationDraft, RegistrationDocumentLink, LoginOpening, announceLoginSuccess } from "./AuthFlow";
import { AccountPrivateDetails, RegistrationDetailsFields, EMPTY_REGISTRATION_DETAILS, REGISTRATION_DETAILS_KEY, initialRegistrationDetails, registrationDetailsMetadata, registrationDetailsProblem, rememberRegistrationDetails, clearPendingRegistrationDetails } from "./RegistrationDetails";

// P30: odrębny moduł. VITE_LUCYNA_ENABLED=false ukrywa wejścia i wyłącza trasę.
const LUCYNA_VISIBLE = import.meta.env.VITE_LUCYNA_ENABLED !== "false";
const LucynaModule = React.lazy(() => import("./Lucyna"));

class LucynaBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <><AccountNavbar /><main style={{ maxWidth: 650, margin: "50px auto", padding: 24 }}>
      <h1>Lucyna jest chwilowo niedostępna</h1>
      <p>Możesz dalej korzystać z konta, zleceń, usług i wiadomości.</p>
      <Link to="/account">Wróć do konta</Link>{" · "}<a href={helpCenterHref()}>Centrum pomocy</a>
    </main></>;
  }
}

/* Internal routes render immediately; data status stays within each page. */
function startFluidRouteTransition(updateRoute) {
  return updateRoute();
}

function useNavigate() {
  const navigate = useRouterNavigate();

  return useCallback(
    (destination, options) =>
      startFluidRouteTransition(
        () => navigate(
          destination,
          options
        )
      ),
    [navigate]
  );
}

/* AUTH CONTEXT */

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
          profileResult,
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
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about"
            )
            .eq("id", currentUserId)
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
          const profileData =
            profileResult.error
              ? null
              : profileResult.data;

          if (profileResult.error) {
            console.error(
              "AUTH PROFILE HYDRATION ERROR:",
              profileResult.error
            );
          }

          const hydratedUser = profileData
            ? {
                ...freshUser,
                user_metadata: {
                  ...(freshUser.user_metadata || {}),
                  name:
                    profileData.name ||
                    freshUser.user_metadata?.name ||
                    freshUser.user_metadata?.full_name ||
                    freshUser.email?.split("@")[0] ||
                    "Użytkownik",
                  avatar_url:
                    profileData.avatar_url ||
                    null,
                  about:
                    profileData.about ||
                    null,
                },
              }
            : freshUser;

          setUser(hydratedUser);
          setSession((currentSession) =>
            currentSession?.user?.id === hydratedUser.id
              ? {
                  ...currentSession,
                  user: hydratedUser,
                }
              : currentSession
          );
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

/* ACCOUNT RESTRICTION CONTEXT */

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

/* AGE ACCESS */

const MIN_ACCOUNT_AGE = 16;
const FULL_ACCOUNT_AGE = 18;
const AGE_NOTICE_VERSION = "2026-09-03-v1";
const LEGAL_TERMS_VERSION = "0.9-prelaunch-2026-09-12";
const PRIVACY_NOTICE_VERSION = "0.9-prelaunch-2026-09-12";

const MAX_PORTFOLIO_ITEMS = 8;
const MAX_PORTFOLIO_ALBUM_IMAGES = 12;

const CONTENT_REPORT_REASON_LABELS = {
  copyright: "Naruszenie praw autorskich",
  privacy_or_image_rights: "Naruszenie prywatności lub prawa do wizerunku",
  impersonation: "Podszywanie się pod inną osobę lub firmę",
  harassment_or_threats: "Nękanie, groźby lub treść krzywdząca",
  fraud_or_scam: "Oszustwo lub wprowadzanie w błąd",
  illegal_goods_or_services: "Nielegalne towary lub usługi",
  other_terms_breach: "Inne naruszenie Regulaminu IdeaHire",
  other_illegal_content: "Inna potencjalnie nielegalna treść",
};

const CONTENT_REPORT_STATUS_LABELS = {
  submitted: "Otrzymane",
  in_review: "W analizie",
  resolved_actioned: "Zakończone — podjęto działanie",
  resolved_no_action: "Zakończone — brak podstaw do działania",
};

const PRIVATE_CONTENT_REPORT_TYPES = new Set([
  "private_message",
  "private_file",
  "private_link",
  "work_delivery",
]);

function isPrivateContentReport(report) {
  return PRIVATE_CONTENT_REPORT_TYPES.has(
    report?.content_type
  );
}

function getOAuthErrorFromLocation(location) {
  const searchParams = new URLSearchParams(
    location?.search || ""
  );

  const hashParams = new URLSearchParams(
    String(location?.hash || "").replace(/^#/, "")
  );

  const description =
    searchParams.get("error_description") ||
    hashParams.get("error_description") ||
    "";

  // URLSearchParams already decoded the value, including literal percent signs.
  return description;
}

function GoogleLogo() {
  return (
    <svg
      className="google-auth-logo"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.92A6.01 6.01 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.53l3.35-2.61Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}

function GoogleAuthButton({
  onClick,
  loading,
}) {
  return (
    <button
      type="button"
      className="google-auth-button"
      onClick={onClick}
      disabled={loading}
    >
      <GoogleLogo />

      <span>
        {loading
          ? "Łączenie z Google..."
          : "Kontynuuj przez Google"}
      </span>
    </button>
  );
}

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

/* DISCOVERY PREFERENCES */

const DiscoveryPreferencesContext = createContext(null);

const DISCOVERY_USAGE_OPTIONS = [
  {
    value: "find_work",
    eyebrow: "Realizuję projekty",
    title: "Działam jako freelancer",
    description:
      "Chcę znajdować zlecenia, rozwijać profil i oferować własne usługi.",
    icon: "01",
  },
  {
    value: "hire_talent",
    eyebrow: "Zlecam projekty",
    title: "Działam jako zleceniodawca",
    description:
      "Chcę publikować zlecenia i znajdować odpowiednich wykonawców.",
    icon: "02",
  },
  {
    value: "both",
    eyebrow: "Łączę obie strony",
    title: "Działam w obu rolach",
    description:
      "Chcę zarówno realizować projekty, jak i zlecać pracę innym.",
    icon: "03",
  },
];

const DISCOVERY_CATEGORY_DETAILS = {
  Programowanie: "Strony, sklepy, aplikacje i integracje",
  "Grafika i design": "Marka, UX, materiały wizualne i 3D",
  Marketing: "Kampanie, SEO, sprzedaż i social media",
  Copywriting: "Teksty, redakcja, tłumaczenia i lokalizacja",
  Video: "Montaż, animacja, podcasty i dźwięk",
  Fotografia: "Sesje, e-commerce, retusz i obróbka",
  "AI i automatyzacje": "Agenci, chatboty i automatyzacje",
  "Dane, analizy i research": "Excel, dashboardy, analizy i research",
  "Biznes i e-commerce": "E-commerce, CRM, dokumenty i operacje",
  "Architektura, wnętrza i CAD": "Wnętrza, wizualizacje, CAD i modele 3D",
};

const DISCOVERY_GOAL_OPTIONS = [
  {
    value: "first_project",
    audience: "freelancer",
    title: "Zdobyć pierwsze zlecenie",
    description: "Chcę bezpiecznie rozpocząć pracę jako freelancer.",
    mark: "01",
  },
  {
    value: "more_orders",
    audience: "freelancer",
    title: "Zdobywać więcej zleceń",
    description: "Szukam kolejnych projektów i nowych klientów.",
    mark: "02",
  },
  {
    value: "offer_service",
    audience: "freelancer",
    title: "Wystawić własną usługę",
    description: "Chcę pokazać konkretną ofertę i jej zakres.",
    mark: "03",
  },
  {
    value: "build_portfolio",
    audience: "freelancer",
    title: "Rozwinąć profil i portfolio",
    description: "Chcę lepiej zaprezentować swoje doświadczenie.",
    mark: "04",
  },
  {
    value: "find_specialist",
    audience: "client",
    title: "Znaleźć właściwego specjalistę",
    description: "Potrzebuję osoby dopasowanej do mojego projektu.",
    mark: "05",
  },
  {
    value: "publish_project",
    audience: "client",
    title: "Opublikować konkretne zlecenie",
    description: "Mam zakres prac i chcę otrzymać zgłoszenia.",
    mark: "06",
  },
  {
    value: "compare_options",
    audience: "client",
    title: "Porównać możliwości",
    description: "Najpierw chcę sprawdzić specjalistów i usługi.",
    mark: "07",
  },
  {
    value: "explore_platform",
    audience: "all",
    title: "Poznać IdeaHire",
    description: "Chcę zobaczyć, jak działa bezpieczna współpraca.",
    mark: "08",
  },
];

const DISCOVERY_PROJECT_READINESS_OPTIONS = [
  {
    value: "exploring",
    title: "Dopiero się rozglądam",
    description: "Najpierw chcę poznać możliwości i wykonawców.",
  },
  {
    value: "idea",
    title: "Mam pomysł",
    description: "Potrzebuję pomocy w ułożeniu szczegółów projektu.",
  },
  {
    value: "brief_ready",
    title: "Mam gotowy zakres",
    description: "Wiem, co ma powstać i mogę opublikować zlecenie.",
  },
  {
    value: "urgent",
    title: "Chcę zacząć szybko",
    description: "Projekt jest przygotowany i zależy mi na czasie.",
  },
];

function getDiscoveryGoalLabel(value) {
  return DISCOVERY_GOAL_OPTIONS.find(
    (option) => option.value === value
  )?.title || value;
}

function getDiscoveryReadinessLabel(value) {
  return DISCOVERY_PROJECT_READINESS_OPTIONS.find(
    (option) => option.value === value
  )?.title || "Jeszcze nie określono";
}

function getDiscoveryUsageLabel(value) {
  return DISCOVERY_USAGE_OPTIONS.find(
    (option) => option.value === value
  )?.eyebrow || "Obie możliwości";
}

function DiscoveryPreferencesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { loading: ageLoading, ageRequired } = useAgeAccess();
  const registrationLocation = useLocation();
  const registrationToken = new URLSearchParams(registrationLocation.search).get("registration_interview") || registrationLocation.state?.registrationInterviewToken;
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [interviewSync, setInterviewSync] = useState({ pending: false, error: "" });
  const requestIdRef = useRef(0);

  async function refreshPreferences(requestedUserId = user?.id) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!requestedUserId) {
      setPreferences(null);
      setErrorMessage("");
      setInterviewSync({ pending: false, error: "" });
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const [coreResult, profileResult] = await Promise.all([
        supabase.rpc("get_my_ideahire_discovery_preferences"),
        supabase.rpc("get_my_ideahire_onboarding_profile"),
      ]);

      if (coreResult.error) throw coreResult.error;
      if (profileResult.error) throw profileResult.error;
      if (requestId !== requestIdRef.current) return null;

      let data = coreResult.data || {};
      let onboardingProfile = profileResult.data || {};
      const registrationAnswer = user?.id === requestedUserId
        ? registrationInterviewForUser(user, registrationToken, JOB_CATEGORIES)
        : null;
      let syncError = "";
      if (registrationAnswer && (data.needs_onboarding || onboardingProfile.needs_onboarding) && !ageLoading && !ageRequired) {
        try {
          const saved = await saveRegistrationInterview(supabase, user, registrationAnswer);
          if (requestId !== requestIdRef.current) return null;
          data = saved.preferences;
          onboardingProfile = saved.profile;
          clearRegistrationInterview();
          void clearRegistrationInterviewMetadata(supabase, requestedUserId);
        } catch {
          if (requestId !== requestIdRef.current) return null;
          syncError = "Nie udało się jeszcze zapisać odpowiedzi z wywiadu. Nie musisz odpowiadać ponownie.";
        }
      } else if (registrationAnswer && !data.needs_onboarding && !onboardingProfile.needs_onboarding) {
        clearRegistrationInterview();
        if (user.user_metadata?.[REGISTRATION_INTERVIEW_KEY]) void clearRegistrationInterviewMetadata(supabase, requestedUserId);
      }
      if (requestId !== requestIdRef.current) return null;
      setInterviewSync({ pending: Boolean(registrationAnswer && (data.needs_onboarding || onboardingProfile.needs_onboarding)), error: syncError });
      const storedCategories = Array.isArray(data?.preferred_categories)
        ? data.preferred_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : [];
      let pendingRole = null;
      try {
        if (!registrationAnswer) pendingRole = window.sessionStorage.getItem("ideahire_pending_usage_preference");
      } catch { /* Preferences still work when browser storage is unavailable. */ }
      const rolePreference = ["find_work", "hire_talent", "both"].includes(
        pendingRole
      )
        ? pendingRole
        : onboardingProfile?.role_preference ||
          data?.usage_preference ||
          "both";
      const freelancerCategories = Array.isArray(
        onboardingProfile?.freelancer_categories
      )
        ? onboardingProfile.freelancer_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : rolePreference !== "hire_talent"
        ? storedCategories
        : [];
      const clientCategories = Array.isArray(
        onboardingProfile?.client_categories
      )
        ? onboardingProfile.client_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : rolePreference !== "find_work"
        ? storedCategories
        : [];

      const nextPreferences = {
        authenticated: Boolean(data?.authenticated),
        needsOnboarding: Boolean(
          data?.needs_onboarding || onboardingProfile?.needs_onboarding
        ),
        usagePreference: rolePreference,
        preferredCategories: storedCategories,
        freelancerCategories,
        clientCategories,
        onboardingGoals: Array.isArray(onboardingProfile?.onboarding_goals)
          ? onboardingProfile.onboarding_goals
          : [],
        specialtySummary: onboardingProfile?.specialty_summary || "",
        projectReadiness: onboardingProfile?.project_readiness || "",
        personalizationEnabled:
          data?.personalization_enabled !== false,
        onboardingCompletedAt: data?.onboarding_completed_at || null,
        onboardingSkippedAt: data?.onboarding_skipped_at || null,
        expandedOnboardingCompletedAt:
          onboardingProfile?.completed_at || null,
        expandedOnboardingSkippedAt:
          onboardingProfile?.skipped_at || null,
        updatedAt: onboardingProfile?.updated_at || data?.updated_at || null,
      };

      setPreferences(nextPreferences);
      setErrorMessage("");
      return nextPreferences;
    } catch (error) {
      console.error("DISCOVERY PREFERENCES LOAD ERROR:", error);

      if (requestId === requestIdRef.current) {
        setPreferences(null);
        setErrorMessage(
          "Nie udało się pobrać preferencji. Pozostałe funkcje konta nadal są dostępne."
        );
      }

      return null;
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  async function savePreferences({
    usagePreference,
    freelancerCategories,
    clientCategories,
    onboardingGoals,
    specialtySummary,
    projectReadiness,
    personalizationEnabled,
    action = "complete",
  }) {
    const safeFreelancerCategories = Array.isArray(freelancerCategories)
      ? freelancerCategories.filter((category) =>
          JOB_CATEGORIES.includes(category)
        )
      : [];
    const safeClientCategories = Array.isArray(clientCategories)
      ? clientCategories.filter((category) =>
          JOB_CATEGORIES.includes(category)
        )
      : [];
    const preferredCategories = Array.from(
      new Set(
        usagePreference === "find_work"
          ? safeFreelancerCategories
          : usagePreference === "hire_talent"
          ? safeClientCategories
          : [...safeFreelancerCategories, ...safeClientCategories]
      )
    ).slice(0, 3);

    const { data: saved, error } = await supabase.rpc("save_my_ideahire_preferences", {
      p_role_preference: usagePreference || "both",
      p_preferred_categories: preferredCategories,
      p_freelancer_categories: safeFreelancerCategories,
      p_client_categories: safeClientCategories,
      p_onboarding_goals: onboardingGoals || [],
      p_specialty_summary: specialtySummary?.trim() || null,
      p_project_readiness: projectReadiness || null,
      p_personalization_enabled: personalizationEnabled !== false,
      p_onboarding_action: action,
    });
    if (error) throw error;
    const data = saved?.preferences || {};
    const onboardingProfile = saved?.profile || {};

    const nextPreferences = {
      authenticated: true,
      needsOnboarding: false,
      usagePreference:
        onboardingProfile?.role_preference ||
        data?.usage_preference ||
        "both",
      preferredCategories: Array.isArray(data?.preferred_categories)
        ? data.preferred_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : [],
      freelancerCategories: Array.isArray(
        onboardingProfile?.freelancer_categories
      )
        ? onboardingProfile.freelancer_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : safeFreelancerCategories,
      clientCategories: Array.isArray(onboardingProfile?.client_categories)
        ? onboardingProfile.client_categories.filter((category) =>
            JOB_CATEGORIES.includes(category)
          )
        : safeClientCategories,
      onboardingGoals: Array.isArray(onboardingProfile?.onboarding_goals)
        ? onboardingProfile.onboarding_goals
        : onboardingGoals || [],
      specialtySummary: onboardingProfile?.specialty_summary || "",
      projectReadiness: onboardingProfile?.project_readiness || "",
      personalizationEnabled:
        data?.personalization_enabled !== false,
      onboardingCompletedAt: data?.onboarding_completed_at || null,
      onboardingSkippedAt: data?.onboarding_skipped_at || null,
      expandedOnboardingCompletedAt:
        onboardingProfile?.completed_at || null,
      expandedOnboardingSkippedAt: onboardingProfile?.skipped_at || null,
      updatedAt: onboardingProfile?.updated_at || data?.updated_at || null,
    };

    try { window.sessionStorage.removeItem("ideahire_pending_usage_preference"); } catch { /* The server save already succeeded. */ }
    clearRegistrationInterview();
    if (user?.user_metadata?.[REGISTRATION_INTERVIEW_KEY]) void clearRegistrationInterviewMetadata(supabase, user.id);
    setInterviewSync({ pending: false, error: "" });
    setPreferences(nextPreferences);
    setErrorMessage("");
    return nextPreferences;
  }

  useEffect(() => {
    if (authLoading) return;
    refreshPreferences(user?.id);
  }, [authLoading, user?.id, ageLoading, ageRequired, registrationToken]);

  return (
    <DiscoveryPreferencesContext.Provider
      value={{
        preferences,
        loading,
        errorMessage,
        interviewSync,
        refreshPreferences,
        savePreferences,
      }}
    >
      {children}
    </DiscoveryPreferencesContext.Provider>
  );
}

function useDiscoveryPreferences() {
  return useContext(DiscoveryPreferencesContext) || {
    preferences: null,
    loading: false,
    errorMessage: "",
    refreshPreferences: async () => null,
    savePreferences: async () => null,
  };
}

function DiscoveryOnboarding({
  initialPreferences,
  initialStep = 1,
  canClose = false,
  onClose,
  onComplete,
}) {
  const { savePreferences } = useDiscoveryPreferences();
  const { isLimited } = useAgeAccess();
  const en = useSitePreferences().language === "en";
  const c = (pl, english) => en ? english : pl;
  const stepOrder = isLimited ? [2, 4, 5] : [1, 2, 3, 4, 5];
  const [step, setStep] = useState(isLimited ? 2 : initialStep);
  const stepIndex = Math.max(0, stepOrder.indexOf(step));
  const currentStep = stepIndex + 1;
  const stepLabels = isLimited ? c(["Zainteresowania", "Kolejność", "Gotowe"], ["Interests", "Order", "Ready"]) : c(["Kierunek", "Dziedziny", "Cele", "Wyniki", "Podsumowanie"], ["Direction", "Fields", "Goals", "Results", "Summary"]);
  const [usagePreference, setUsagePreference] = useState(
    initialPreferences?.usagePreference || "both"
  );
  const [freelancerCategories, setFreelancerCategories] = useState(
    (isLimited ? [...new Set([...(initialPreferences?.freelancerCategories || []), ...(initialPreferences?.clientCategories || []), ...(initialPreferences?.preferredCategories || [])])].slice(0, 3) : null) ||
    initialPreferences?.freelancerCategories ||
      (initialPreferences?.usagePreference !== "hire_talent"
        ? initialPreferences?.preferredCategories || []
        : [])
  );
  const [clientCategories, setClientCategories] = useState(
    initialPreferences?.clientCategories ||
      (initialPreferences?.usagePreference !== "find_work"
        ? initialPreferences?.preferredCategories || []
        : [])
  );
  const [activeCategoryAudience, setActiveCategoryAudience] = useState(
    initialPreferences?.usagePreference === "hire_talent"
      ? "client"
      : "freelancer"
  );
  const [onboardingGoals, setOnboardingGoals] = useState(
    initialPreferences?.onboardingGoals || []
  );
  const [specialtySummary, setSpecialtySummary] = useState(
    initialPreferences?.specialtySummary || ""
  );
  const [projectReadiness, setProjectReadiness] = useState(
    initialPreferences?.projectReadiness || ""
  );
  const [personalizationEnabled, setPersonalizationEnabled] = useState(
    initialPreferences?.personalizationEnabled !== false
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const titleRef = useRef(null);
  const backdropRef = useRef(null);
  const contentRef = useRef(null);
  const totalSteps = stepOrder.length;
  const { moving, direction, move } = useJourneyMotion(contentRef);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const appRoot = document.getElementById("root");
    const previouslyInert = appRoot?.inert;
    if (appRoot) appRoot.inert = true;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (appRoot) appRoot.inert = previouslyInert;
      if (previousFocus?.isConnected) previousFocus.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;

    function updateMobileViewportHeight() {
      const height = Math.round(viewport?.height || window.innerHeight);

      backdropRef.current?.style.setProperty(
        "--discovery-mobile-viewport-height",
        `${height}px`
      );
    }

    updateMobileViewportHeight();
    viewport?.addEventListener("resize", updateMobileViewportHeight);
    window.addEventListener("resize", updateMobileViewportHeight);
    window.addEventListener("orientationchange", updateMobileViewportHeight);

    return () => {
      viewport?.removeEventListener("resize", updateMobileViewportHeight);
      window.removeEventListener("resize", updateMobileViewportHeight);
      window.removeEventListener(
        "orientationchange",
        updateMobileViewportHeight
      );
    };
  }, []);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (usagePreference === "find_work") {
      setActiveCategoryAudience("freelancer");
    } else if (usagePreference === "hire_talent") {
      setActiveCategoryAudience("client");
    }
  }, [usagePreference]);

  function toggleCategory(category, audience = activeCategoryAudience) {
    setMessage("");
    const setCategories =
      !isLimited && audience === "client"
        ? setClientCategories
        : setFreelancerCategories;

    setCategories((current) => {
      if (current.includes(category)) {
        return current.filter((item) => item !== category);
      }

      if (current.length >= 3) {
        setMessage("Możesz wybrać maksymalnie 3 kategorie.");
        return current;
      }

      return [...current, category];
    });
  }

  function toggleGoal(goal) {
    setMessage("");
    setOnboardingGoals((current) => {
      if (current.includes(goal)) {
        return current.filter((item) => item !== goal);
      }

      if (current.length >= 3) {
        setMessage("Możesz wybrać maksymalnie 3 cele.");
        return current;
      }

      return [...current, goal];
    });
  }

  function validateCurrentStep() {
    if (step === 1 && !usagePreference) {
      setMessage("Wybierz, jak chcesz korzystać z IdeaHire.");
      return false;
    }

    if (step === 2) {
      if (isLimited) {
        if (freelancerCategories.length) return true;
        setMessage(c("Wybierz co najmniej jedną dziedzinę, którą chcesz przeglądać.", "Choose at least one field to explore."));
        return false;
      }
      if (
        usagePreference !== "hire_talent" &&
        freelancerCategories.length === 0
      ) {
        setActiveCategoryAudience("freelancer");
        setMessage("Wybierz co najmniej jedną kategorię, w której działasz.");
        window.requestAnimationFrame(() => {
          contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
        return false;
      }

      if (
        usagePreference !== "find_work" &&
        clientCategories.length === 0
      ) {
        setActiveCategoryAudience("client");
        setMessage("Wybierz co najmniej jedną kategorię, w której szukasz pomocy.");
        window.requestAnimationFrame(() => {
          contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
        return false;
      }
    }

    if (step === 3) {
      if (onboardingGoals.length === 0) {
        setMessage("Wybierz co najmniej jeden cel na początek.");
        window.requestAnimationFrame(() => {
          contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
        return false;
      }

      if (
        usagePreference !== "find_work" &&
        !projectReadiness
      ) {
        setMessage("Określ, na jakim etapie jest Twój projekt.");
        window.requestAnimationFrame(() => {
          contentRef.current
            ?.querySelector(".discovery-readiness-fieldset")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        return false;
      }
    }

    return true;
  }

  async function finish(action = "complete") {
    if (saving || moving) return;
    setSaving(true);
    setMessage("");

    try {
      const result = await savePreferences({
        usagePreference,
        freelancerCategories,
        clientCategories: isLimited ? freelancerCategories : clientCategories,
        onboardingGoals: isLimited ? ["explore_platform"] : onboardingGoals,
        specialtySummary,
        projectReadiness: isLimited ? "exploring" : projectReadiness,
        personalizationEnabled,
        action,
      });

      onComplete?.(result);
      onClose?.();
    } catch (error) {
      console.error("DISCOVERY PREFERENCES SAVE ERROR:", error);
      setMessage(
        error?.message ||
          "Nie udało się zapisać preferencji. Spróbuj ponownie."
      );
    } finally {
      setSaving(false);
    }
  }

  function goForward(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!validateCurrentStep()) return;
    setMessage("");
    move(() => setStep(stepOrder[Math.min(totalSteps - 1, stepIndex + 1)]));
  }

  function goBack() {
    setMessage("");
    move(() => setStep(stepOrder[Math.max(0, stepIndex - 1)]), "back");
  }

  const selectedUsage = DISCOVERY_USAGE_OPTIONS.find(
    (option) => option.value === usagePreference
  );
  const activeCategories =
    !isLimited && activeCategoryAudience === "client"
      ? clientCategories
      : freelancerCategories;
  const availableGoals = DISCOVERY_GOAL_OPTIONS.filter((option) => {
    if (option.audience === "all" || usagePreference === "both") return true;
    return usagePreference === "find_work"
      ? option.audience === "freelancer"
      : option.audience === "client";
  });

  return createPortal((
    <div
      className="discovery-onboarding-backdrop ih59-discovery"
      ref={backdropRef}
      data-step={step}
      data-moving={moving}
      data-direction={direction}
    >
      <section
        className="discovery-onboarding-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-onboarding-title"
        aria-busy={saving || moving}
        onKeyDown={(event) => {
          if (event.key === "Escape" && canClose && !saving && !moving) onClose?.();
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, a[href]:not([tabindex="-1"])'));
          const first = controls[0];
          const last = controls.at(-1);
          if (!first) return;
          const active = document.activeElement;
          if (event.shiftKey && (active === first || !controls.includes(active))) {
            event.preventDefault(); last.focus();
          } else if (!event.shiftKey && (active === last || !controls.includes(active))) {
            event.preventDefault(); first.focus();
          }
        }}
      >
        <div className="discovery-onboarding-ambient" aria-hidden="true">
          <span />
          <span />
        </div>

        <header className="discovery-onboarding-header">
          <Link className="logo" to="/" tabIndex={-1}>
            <BrandSignature />
          </Link>

          <div className="discovery-step-count" aria-live="polite">
            {c(`Krok ${currentStep} z ${totalSteps}`, `Step ${currentStep} of ${totalSteps}`)}
          </div>

          {canClose && (
            <button
              type="button"
              className="discovery-close-button"
              onClick={onClose}
              disabled={saving || moving}
              aria-label="Zamknij ustawienia preferencji"
            >
              ×
            </button>
          )}
        </header>

        <div
          className="discovery-progress"
          role="progressbar"
          aria-valuemin="1"
          aria-valuemax={totalSteps}
          aria-valuenow={currentStep}
          aria-label={c(`Postęp konfiguracji: krok ${currentStep} z ${totalSteps}`, `Setup progress: step ${currentStep} of ${totalSteps}`)}
        >
          <span style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>

        <div className="ih60-discovery-body" ref={contentRef}>
          <aside className="ih60-discovery-rail" aria-label={c("Twoja konfiguracja", "Your setup")}>
            <span>{c("IDEAHIRE / TWÓJ WIDOK", "IDEAHIRE / YOUR VIEW")}</span><h2>{c(<>Ustaw swój<br />punkt startu.</>, <>Choose your<br />starting point.</>)}</h2>
            <ol>{stepLabels.map((label, index) => <li key={label} aria-current={currentStep === index + 1 ? "step" : undefined}><b>{index < stepIndex ? "✓" : String(index + 1).padStart(2, "0")}</b><span>{label}</span></li>)}</ol>
            <p>{isLimited ? c("Wybierz interesujące Cię dziedziny. Zaczniesz od treści, które chcesz poznawać.", "Choose your interests to start with content you want to explore.") : c("Kilka wyborów pomoże ułożyć pierwsze podpowiedzi. Zmienisz je później na swoim koncie.", "A few choices will shape your first suggestions. You can change them in your account.")}</p>
          </aside>
        <div
          className="discovery-onboarding-content"
          key={step}
        >
          <ol className="ih59-discovery-steps" aria-label="Etapy ustawień">
            {stepLabels.map((label, index) => <li key={label} aria-current={currentStep === index + 1 ? "step" : undefined}><b>{index < stepIndex ? "✓" : String(index + 1).padStart(2, "0")}</b><span>{label}</span></li>)}
          </ol>
          {isLimited && <details className="ih60-minor-note"><summary>{c("Konto 16–17 lat · ustawienia przeglądania", "Account ages 16–17 · browsing settings")}</summary><p>{c("Możesz przeglądać stronę główną, zlecenia, usługi i profile. Umowy oraz płatne projekty wymagają pełnego konta zgodnie z regulaminem IdeaHire.", "You can browse the homepage, projects, services and profiles. Contracts and paid projects require a full account under the IdeaHire terms.")}</p></details>}
          {step === 1 && (
            <>
              <div className="ih9-discovery-welcome">
                <span className="ih9-discovery-emblem" aria-hidden="true"><i /><i /><i /><i /></span>
                <span>Twój pomysł. Twój kierunek.</span>
              </div>
              <div className="discovery-copy">
                <span className="section-label">Zacznij po swojemu</span>
                <h1
                  id="discovery-onboarding-title"
                  ref={titleRef}
                  tabIndex="-1"
                >
                  Jak chcesz rozpocząć korzystanie z IdeaHire?
                </h1>
                <p>
                  Wybierz sposób, w jaki najczęściej chcesz działać. Nie
                  zmienia to uprawnień konta. Później możesz zmienić wybór.
                </p>
              </div>

              <div className="discovery-usage-grid">
                {DISCOVERY_USAGE_OPTIONS.map((option) => (
                  <button
                    type="button"
                    className={`discovery-usage-card${
                      usagePreference === option.value ? " is-selected" : ""
                    }`}
                    onClick={() => setUsagePreference(option.value)}
                    aria-pressed={usagePreference === option.value}
                    key={option.value}
                  >
                    <span className="discovery-card-icon" aria-hidden="true">
                      {option.icon}
                    </span>
                    <small>{option.eyebrow}</small>
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                    <i aria-hidden="true">✓</i>
                  </button>
                ))}
              </div>

              <div className="discovery-legal-note">
                <span aria-hidden="true">i</span>
                <p>
                  Ten wybór służy personalizacji i nie określa Twojego statusu
                  prawnego ani podatkowego. Dane sprzedawcy uzupełnia się
                  oddzielnie przed pierwszą płatną aktywnością.
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="discovery-copy">
                <span className="section-label">Twoje obszary</span>
                <h1
                  id="discovery-onboarding-title"
                  ref={titleRef}
                  tabIndex="-1"
                >
                  {isLimited ? c("Co Cię interesuje?", "What interests you?") : usagePreference === "find_work"
                    ? "Czym się zajmujesz?"
                    : usagePreference === "hire_talent"
                    ? "Jakiej pomocy szukasz?"
                    : "W czym działasz i czego szukasz?"}
                </h1>
                <p>
                  {isLimited ? c("Wybierz do trzech dziedzin. Zobaczysz je wyżej podczas przeglądania zleceń i usług.", "Choose up to three fields. They will appear higher when you browse projects and services.") : "Wybierz maksymalnie trzy kategorie dla każdej aktywnej roli. Posłużą do ułożenia wyników i formularzy."}
                </p>
              </div>

              {!isLimited && usagePreference === "both" && (
                <div
                  className="discovery-category-switch"
                  role="tablist"
                  aria-label="Rodzaj kategorii"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeCategoryAudience === "freelancer"}
                    className={
                      activeCategoryAudience === "freelancer"
                        ? "is-selected"
                        : ""
                    }
                    onClick={() => setActiveCategoryAudience("freelancer")}
                  >
                    <span>{isLimited ? c("Moje dziedziny", "My interests") : "Realizuję"}</span>
                    <strong>{freelancerCategories.length}/3</strong>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeCategoryAudience === "client"}
                    className={
                      activeCategoryAudience === "client" ? "is-selected" : ""
                    }
                    onClick={() => setActiveCategoryAudience("client")}
                  >
                    <span>Szukam</span>
                    <strong>{clientCategories.length}/3</strong>
                  </button>
                </div>
              )}

              <div className="discovery-category-context">
                <strong>
                  {isLimited ? c("Dziedziny, które chcesz poznawać", "Fields you want to explore") : activeCategoryAudience === "freelancer"
                    ? "Obszary, w których chcesz realizować projekty"
                    : "Obszary, w których najczęściej szukasz wykonawców"}
                </strong>
                <span>Możesz je później zmienić na swoim koncie.</span>
              </div>

              <div className="discovery-category-grid">
                {JOB_CATEGORIES.map((category, index) => {
                  const selected = activeCategories.includes(category);

                  return (
                    <button
                      type="button"
                      className={`discovery-category-card${
                        selected ? " is-selected" : ""
                      }`}
                      onClick={() =>
                        toggleCategory(category, activeCategoryAudience)
                      }
                      aria-pressed={selected}
                      key={category}
                    >
                      <span className="discovery-category-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <strong>{getJobCategoryLabel(category)}</strong>
                      <small>{DISCOVERY_CATEGORY_DETAILS[category]}</small>
                      <i aria-hidden="true">{selected ? "✓" : "+"}</i>
                    </button>
                  );
                })}
              </div>

              <div className="discovery-selection-counter" aria-live="polite">
                Wybrano {activeCategories.length} z 3
              </div>

              {!isLimited && usagePreference !== "hire_talent" &&
                activeCategoryAudience === "freelancer" && (
                  <label className="discovery-specialization-field">
                    <span>Jednym zdaniem: czym się zajmujesz?</span>
                    <input
                      type="text"
                      value={specialtySummary}
                      maxLength={160}
                      onChange={(event) => {
                        setSpecialtySummary(event.target.value);
                        setMessage("");
                      }}
                      placeholder="Np. projektuję sklepy internetowe i automatyzuję sprzedaż"
                    />
                    <small>
                      Pole opcjonalne · {specialtySummary.length}/160 znaków
                    </small>
                  </label>
                )}
            </>
          )}

          {step === 3 && (
            <>
              <div className="discovery-copy">
                <span className="section-label">Twój cel</span>
                <h1
                  id="discovery-onboarding-title"
                  ref={titleRef}
                  tabIndex="-1"
                >
                  Co sprowadziło Cię do IdeaHire?
                </h1>
                <p>
                  Wybierz maksymalnie trzy odpowiedzi. Na ich podstawie
                  pokażemy Ci właściwe miejsce na start, bez ukrywania innych
                  możliwości.
                </p>
              </div>

              <div className="discovery-goal-grid">
                {availableGoals.map((option) => {
                  const selected = onboardingGoals.includes(option.value);

                  return (
                    <button
                      type="button"
                      className={`discovery-goal-card${
                        selected ? " is-selected" : ""
                      }`}
                      onClick={() => toggleGoal(option.value)}
                      aria-pressed={selected}
                      key={option.value}
                    >
                      <span aria-hidden="true">{option.mark}</span>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                      <i aria-hidden="true">{selected ? "✓" : "+"}</i>
                    </button>
                  );
                })}
              </div>

              <div className="discovery-selection-counter" aria-live="polite">
                Wybrano {onboardingGoals.length} z 3
              </div>

              {usagePreference !== "find_work" && (
                <fieldset className="discovery-readiness-fieldset">
                  <legend>Na jakim etapie jest Twój najbliższy projekt?</legend>
                  <div className="discovery-readiness-grid">
                    {DISCOVERY_PROJECT_READINESS_OPTIONS.map((option) => (
                      <label
                        className={
                          projectReadiness === option.value
                            ? "is-selected"
                            : ""
                        }
                        key={option.value}
                      >
                        <input
                          type="radio"
                          name="discovery-project-readiness"
                          value={option.value}
                          checked={projectReadiness === option.value}
                          onChange={() => {
                            setProjectReadiness(option.value);
                            setMessage("");
                          }}
                        />
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <div className="discovery-copy">
                <span className="section-label">Ty decydujesz</span>
                <h1
                  id="discovery-onboarding-title"
                  ref={titleRef}
                  tabIndex="-1"
                >
                  Jak ułożyć wyniki na początku?
                </h1>
                <p>
                  Dopasowanie zmienia wyłącznie kolejność. Nie ukrywamy innych
                  kategorii i zawsze możesz przełączyć widok na najnowsze.
                </p>
              </div>

              <div className="discovery-order-grid">
                <button
                  type="button"
                  className={`discovery-order-card${
                    personalizationEnabled ? " is-selected" : ""
                  }`}
                  onClick={() => setPersonalizationEnabled(true)}
                  aria-pressed={personalizationEnabled}
                >
                  <span aria-hidden="true">✦</span>
                  <strong>Dopasowane dla Ciebie</strong>
                  <small>
                    Wybrane kategorie pojawią się wyżej, a w każdej z nich
                    zachowamy kolejność od najnowszych.
                  </small>
                </button>

                <button
                  type="button"
                  className={`discovery-order-card${
                    !personalizationEnabled ? " is-selected" : ""
                  }`}
                  onClick={() => setPersonalizationEnabled(false)}
                  aria-pressed={!personalizationEnabled}
                >
                  <span aria-hidden="true">02</span>
                  <strong>Tylko najnowsze</strong>
                  <small>
                    Wyniki będą domyślnie uporządkowane wyłącznie według daty
                    publikacji.
                  </small>
                </button>
              </div>

              <div className="discovery-privacy-note">
                <span aria-hidden="true">i</span>
                <p>
                  Preferencje możesz zmienić albo usunąć w każdej chwili na
                  swoim koncie. Nie wpływają na uprawnienia ani moderację.
                </p>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <div className="discovery-copy discovery-summary-copy">
                <span className="section-label">Wszystko gotowe</span>
                <h1
                  id="discovery-onboarding-title"
                  ref={titleRef}
                  tabIndex="-1"
                >
                  Twój start w IdeaHire
                </h1>
                <p>
                  Sprawdź podsumowanie. Wszystkie ustawienia zmienisz później,
                  bez zakładania nowego konta.
                </p>
              </div>

              <div className="discovery-summary-card">
                <div className="discovery-summary-mark" aria-hidden="true">
                  ✓
                </div>

                <div className="discovery-summary-row">
                  <span>Na początek</span>
                  <strong>{isLimited ? c("Przeglądanie IdeaHire", "Exploring IdeaHire") : selectedUsage?.title}</strong>
                </div>

                {(isLimited || usagePreference !== "hire_talent") && (
                  <div className="discovery-summary-row">
                    <span>{isLimited ? c("Moje dziedziny", "My interests") : "Realizuję"}</span>
                    <div className="discovery-summary-tags">
                      {freelancerCategories.map((category) => (
                        <strong key={category}>
                          {getJobCategoryLabel(category)}
                        </strong>
                      ))}
                    </div>
                  </div>
                )}

                {!isLimited && usagePreference !== "find_work" && (
                  <div className="discovery-summary-row">
                    <span>Szukam pomocy</span>
                    <div className="discovery-summary-tags">
                      {clientCategories.map((category) => (
                        <strong key={category}>
                          {getJobCategoryLabel(category)}
                        </strong>
                      ))}
                    </div>
                  </div>
                )}

                {!isLimited && <div className="discovery-summary-row">
                  <span>Najważniejsze cele</span>
                  <div className="discovery-summary-tags">
                    {onboardingGoals.map((goal) => (
                      <strong key={goal}>{getDiscoveryGoalLabel(goal)}</strong>
                    ))}
                  </div>
                </div>}

                {!isLimited && usagePreference !== "find_work" && (
                  <div className="discovery-summary-row">
                    <span>Etap projektu</span>
                    <strong>
                      {getDiscoveryReadinessLabel(projectReadiness)}
                    </strong>
                  </div>
                )}

                <div className="discovery-summary-row">
                  <span>Domyślna kolejność</span>
                  <strong>
                    {personalizationEnabled
                      ? "Dopasowane dla Ciebie"
                      : "Najnowsze"}
                  </strong>
                </div>
              </div>
            </>
          )}

          {message && (
            <p className="discovery-message" role="alert">
              {message}
            </p>
          )}
        </div>

        </div>
        <footer className="discovery-onboarding-footer">
          <div>
            {stepIndex > 0 ? (
              <button
                type="button"
                className="discovery-text-button"
                onClick={goBack}
                disabled={saving || moving}
              >
                 Wstecz
              </button>
            ) : canClose ? (
              <button
                type="button"
                className="discovery-text-button"
                onClick={onClose}
                disabled={saving || moving}
              >
                Anuluj
              </button>
            ) : (
              <button
                type="button"
                className="discovery-text-button"
                onClick={() => finish("skip")}
                disabled={saving || moving}
              >
                Pomiń na razie
              </button>
            )}
          </div>

          <span
            className={`discovery-footer-message${message ? " is-visible" : ""}`}
            role="status"
            aria-live="polite"
          >
            {!message && saving ? c("Zapisywanie…", "Saving…") : ""}
          </span>

          {stepIndex < totalSteps - 1 ? (
            <button
              type="button"
              className="btn btn-dark discovery-primary-button"
              onClick={goForward}
              disabled={saving || moving}
              data-action="discovery-next"
            >
              Dalej 
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-dark discovery-primary-button"
              onClick={() => finish("complete")}
              disabled={saving || moving}
            >
              {saving ? "Zapisywanie..." : isLimited ? c("Przejdź do strony głównej", "Go to the homepage") : "Przejdź do IdeaHire "}
            </button>
          )}
        </footer>
      </section>
    </div>
  ), document.body);
}

function DiscoveryOnboardingLayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isStaff, staffLoading } = useStaffRole(user?.id);
  const { ageRequired, isLimited, loading: ageLoading } = useAgeAccess();
  const {
    isRestricted,
    loading: restrictionLoading,
    errorMessage: restrictionError,
  } = useAccountRestriction();
  const { preferences, loading, errorMessage, interviewSync, refreshPreferences } =
    useDiscoveryPreferences();
  const [syncDeferred, setSyncDeferred] = useState(false);
  const syncEnglish = useSitePreferences().language === "en";
  useEffect(() => setSyncDeferred(false), [user?.id]);

  const excludedPath = [
    "/login",
    "/register",
    "/reset-password",
    "/account-status",
    "/privacy-center",
    "/regulamin",
    "/polityka-prywatnosci",
    "/polityka-cookies",
  ].includes(location.pathname);

  if (
    !user?.id ||
    loading ||
    errorMessage ||
    staffLoading ||
    ageLoading ||
    ageRequired ||
    restrictionLoading ||
    isRestricted ||
    restrictionError ||
    isStaff ||
    excludedPath ||
    !preferences?.needsOnboarding
  ) {
    return null;
  }

  if (interviewSync?.pending) {
    if (!interviewSync.error || syncDeferred) return null;
    return <section className="ri-sync-notice" role="status"><strong>{syncEnglish ? "Your interview answers are ready" : "Odpowiedzi z wywiadu są gotowe"}</strong><p>{syncEnglish ? "We could not save them yet. You do not need to answer again. You can retry or continue using your account." : interviewSync.error}</p><button type="button" onClick={() => { void refreshPreferences(); }}>{syncEnglish ? "Try saving again" : "Spróbuj zapisać ponownie"}</button><button type="button" onClick={() => setSyncDeferred(true)}>{syncEnglish ? "Continue for now" : "Kontynuuj na razie"}</button></section>;
  }

  return (
    <DiscoveryOnboarding
      initialPreferences={preferences}
      initialStep={user?.user_metadata?.onboarding_source === "registration" ? 2 : 1}
      onComplete={(result) => {
        if (!result?.onboardingCompletedAt) return;

        navigate(
          isLimited ? "/" : result?.usagePreference === "hire_talent"
            ? "/talent"
            : "/jobs",
          { replace: true }
        );
      }}
    />
  );
}

function DiscoveryPreferencesCard() {
  const { preferences, loading, errorMessage } = useDiscoveryPreferences();
  const [editing, setEditing] = useState(false);
  const english = useSitePreferences().language === "en";
  const t = (pl, en) => english ? en : pl;
  const label = value => english ? translateUiText(value) : value;

  if (loading) return <section className="ih-studio-panel"><InlineRouteLoader /></section>;
  const groups = [
    ...(preferences?.usagePreference !== "hire_talent" ? [{ title:t("Realizuję", "My fields"), values:(preferences?.freelancerCategories || []).map(getJobCategoryLabel) }] : []),
    ...(preferences?.usagePreference !== "find_work" ? [{ title:t("Szukam pomocy", "I need help with"), values:(preferences?.clientCategories || []).map(getJobCategoryLabel) }] : []),
    ...((preferences?.onboardingGoals || []).length ? [{ title:t("Moje cele", "My goals"), values:preferences.onboardingGoals.map(getDiscoveryGoalLabel) }] : []),
  ];
  return <>
    <section className="ih-studio-panel" aria-labelledby="studio-preferences-title">
      <header className="ih-studio-panel-heading"><div><h2 id="studio-preferences-title">{t("Treści dopasowane do Ciebie", "Content matched to you")}</h2><p>{t("Wybierz, co chcesz odkrywać w IdeaHire.", "Choose what you want to discover on IdeaHire.")}</p></div>{!errorMessage && <button type="button" className="ih-studio-text-button" onClick={() => setEditing(true)}><WorkspaceIcon kind="settings" />{t("Zmień", "Edit")}</button>}</header>
      {errorMessage ? <p className="ih-studio-notice" role="alert">{errorMessage}</p> : <>
        <dl className="ih-studio-summary"><div><dt>{t("Korzystam jako", "I use IdeaHire as")}</dt><dd>{label(getDiscoveryUsageLabel(preferences?.usagePreference || "both"))}</dd></div><div><dt>{t("Kolejność wyników", "Result order")}</dt><dd>{preferences?.personalizationEnabled !== false ? t("Dopasowane dla Ciebie", "Matched to you") : t("Najnowsze", "Newest first")}</dd></div></dl>
        <div className="ih-studio-preference-groups">{groups.map(group => <div key={group.title}><h3>{group.title}</h3><div>{group.values.length ? group.values.map(value => <span key={value}>{label(value)}</span>) : <p>{t("Nie wybrano dziedzin.", "No fields selected.")}</p>}</div></div>)}</div>
        {preferences?.usagePreference !== "find_work" && preferences?.projectReadiness && <div className="ih-studio-preference-stage"><span>{t("Etap projektu", "Project stage")}</span><strong>{label(getDiscoveryReadinessLabel(preferences.projectReadiness))}</strong></div>}
        <p className="ih-studio-muted">{t("Dopasowanie porządkuje wyniki. Nadal możesz zlecać i realizować projekty.", "Matching organises your results. You can still hire and work on projects.")}</p>
        <nav className="ih-studio-preference-links" aria-label={t("Odkrywaj według preferencji", "Explore with your preferences")}><Link to="/services">{t("Przeglądaj usługi", "Browse services")}<WorkspaceIcon kind="arrow" /></Link><Link to="/jobs">{t("Znajdź zlecenie", "Find a job")}<WorkspaceIcon kind="arrow" /></Link></nav>
      </>}
    </section>
    {editing && <DiscoveryOnboarding initialPreferences={preferences} canClose onClose={() => setEditing(false)} />}
  </>;
}

function JobRepublicationPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState(null);
  const [message, setMessage] = useState("");

  async function loadItems() {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc(
        "get_my_ideahire_job_republication_holds"
      );

      if (error) throw error;
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (error) {
      console.error("JOB REPUBLICATION LOAD ERROR:", error);
      setMessage(
        "Nie udało się sprawdzić zleceń oczekujących na ponowną publikację."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [user?.id]);

  async function republish(jobId) {
    if (!jobId || busyJobId) return;
    setBusyJobId(jobId);
    setMessage("");

    try {
      const { error } = await supabase.rpc(
        "republish_my_ideahire_job_after_restriction",
        { p_job_id: jobId }
      );

      if (error) throw error;

      setItems((current) =>
        current.filter((item) => item.job_id !== jobId)
      );
      setMessage("Zlecenie zostało ponownie opublikowane.");
    } catch (error) {
      console.error("JOB REPUBLICATION ERROR:", error);
      setMessage(
        error?.message || "Nie udało się ponownie opublikować zlecenia."
      );
    } finally {
      setBusyJobId(null);
    }
  }

  if (loading || (items.length === 0 && !message)) {
    return null;
  }

  return (
    <section className="account-card job-republication-panel">
      <div className="job-republication-heading">
        <div>
          <span className="section-label">Po zakończeniu zawieszenia</span>
          <h2>Sprawdź zlecenia przed ponowną publikacją</h2>
          <p>
            Po dłuższej przerwie termin, budżet lub opis mogą być nieaktualne.
            Otwórz zlecenie, popraw je w razie potrzeby i potwierdź publikację.
          </p>
        </div>
        <span aria-hidden="true">{items.length}</span>
      </div>

      {message && (
        <p className="job-republication-message" role="status">
          {message}
        </p>
      )}

      <div className="job-republication-list">
        {items.map((item) => (
          <article key={item.hold_id}>
            <div>
              <span>{getJobCategoryLabel(item.category)}</span>
              <h3>{item.title}</h3>
              <small>
                Budżet: {Number(item.budget || 0).toLocaleString("pl-PL")} zł
              </small>
            </div>

            <div className="job-republication-actions">
              <Link className="btn btn-outline" to={`/edit-job/${item.job_id}`}>
                Sprawdź i edytuj
              </Link>
              <button
                type="button"
                className="btn btn-dark"
                disabled={!item.can_republish || busyJobId === item.job_id}
                onClick={() => republish(item.job_id)}
              >
                {!item.can_republish
                  ? "Dostępne po zakończeniu"
                  : busyJobId === item.job_id
                  ? "Publikowanie..."
                  : "Potwierdź i opublikuj "}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* LOADING */

function LoadingScreen() {
  return <SubpageLoading screen />;
}

function InlineRouteLoader({
  className = "",
  label,
}) {
  return <SubpageLoading className={className} label={label} />;
}

/* PROTECTED ROUTE */

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

/* PUBLIC ONLY */

function PublicOnlyRoute({
  children,
}) {
  const registrationReturnLocation = useLocation();
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

  if (loading) {
    return <LoadingScreen />;
  }

  if (
    isLoggedIn &&
    (staffLoading || restrictionLoading)
  ) {
    return children;
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
        state={{ registrationDetailsToken: new URLSearchParams(registrationReturnLocation.search).get("registration_details"), registrationInterviewToken: new URLSearchParams(registrationReturnLocation.search).get("registration_interview") }}
        replace
      />
    );
  }

  return children;
}

/* ACCOUNT MODE ROUTES */

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
  const { user } = useAuth();
  const { refreshAgeAccess, errorMessage } = useAgeAccess();
  const registrationReturnLocation = useLocation();
  const [registrationDetails, setRegistrationDetails] = useState(() => initialRegistrationDetails(user, registrationReturnLocation.state?.registrationDetailsToken));
  const [birthDate, setBirthDate] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const validation = birthDate
    ? getBirthDateValidation(birthDate)
    : null;

  async function handleCompleteAge(event) {
    event.preventDefault();

    if (saving) return;

    const detailsProblem = registrationDetailsProblem(registrationDetails);
    if (detailsProblem) { setMessage(detailsProblem); return; }

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

    if (!privacyAcknowledged) {
      setMessage("Potwierdź zapoznanie się z Polityką prywatności.");
      return;
    }

    if (!termsAccepted) {
      setMessage("Zaakceptuj Regulamin IdeaHire, aby kontynuować.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const acceptedAtClient = new Date().toISOString();

      const privateDetails = registrationDetailsMetadata(registrationDetails, "account_completion");

      const { error } = await supabase.rpc(
        "complete_my_ideahire_onboarding",
        {
          p_date_of_birth: birthDate,
          p_age_notice_acknowledged: acknowledged,
          p_age_notice_version: AGE_NOTICE_VERSION,
          p_privacy_notice_acknowledged: privacyAcknowledged,
          p_privacy_notice_version: PRIVACY_NOTICE_VERSION,
          p_terms_accepted: termsAccepted,
          p_terms_version: LEGAL_TERMS_VERSION,
        }
      );

      if (error) throw error;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(privateDetails ? { [REGISTRATION_DETAILS_KEY]: privateDetails } : {}),
          name:
            user?.user_metadata?.name ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "Użytkownik",
          avatar_url:
            user?.user_metadata?.avatar_url ||
            user?.user_metadata?.picture ||
            null,
          date_of_birth: birthDate,
          age_notice_acknowledged: true,
          age_notice_version: AGE_NOTICE_VERSION,
          privacy_notice_acknowledged: true,
          privacy_notice_version: PRIVACY_NOTICE_VERSION,
          privacy_notice_acknowledged_at: acceptedAtClient,
          terms_accepted: true,
          terms_version: LEGAL_TERMS_VERSION,
          terms_accepted_at_client: acceptedAtClient,
          onboarding_source:
            user?.app_metadata?.provider === "google"
              ? "google_oauth"
              : "account_completion",
        },
      });

      if (metadataError) {
        console.error("ONBOARDING METADATA ERROR:", metadataError);
        if (privateDetails) throw new Error("Data urodzenia została zapisana, ale zapis opcjonalnych danych nie powiódł się. Spróbuj ponownie lub pozostaw opcjonalne pola puste.");
      }

      clearPendingRegistrationDetails();
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
            <RegistrationDetailsFields value={registrationDetails} onChange={setRegistrationDetails} disabled={saving} idPrefix="account-completion" />
            <label>
              Data urodzenia
              <IdeaHireDateField
                aria-label="Data urodzenia"
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

            <div className="registration-privacy-confirmation">
              <input
                id="oauth-privacy-notice-acknowledgement"
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(event) => {
                  setPrivacyAcknowledged(event.target.checked);
                  setMessage("");
                }}
                required
              />
              <div>
                <label htmlFor="oauth-privacy-notice-acknowledgement">
                  Zapoznałem się z Polityką prywatności.
                </label>
                <small>
                  Dokument wyjaśnia, jak IdeaHire przetwarza i chroni dane. {" "}
                  <Link to="/polityka-prywatnosci" target="_blank" rel="noreferrer">
                    Otwórz Politykę prywatności
                  </Link>
                </small>
              </div>
            </div>

            <div className="registration-privacy-confirmation registration-terms-confirmation">
              <input
                id="oauth-terms-acceptance"
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  setMessage("");
                }}
                required
              />
              <div>
                <label htmlFor="oauth-terms-acceptance">
                  Akceptuję Regulamin IdeaHire.
                </label>
                <small>
                  Akceptacja Regulaminu jest wymagana do aktywowania konta. {" "}
                  <Link to="/regulamin" target="_blank" rel="noreferrer">
                    Otwórz Regulamin — wersja 0.9
                  </Link>
                </small>
              </div>
            </div>

            {(message || errorMessage) && (
              <p className="auth-error" role="alert">
                {message || errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-dark btn-large"
              disabled={
                saving ||
                !validation?.valid ||
                !acknowledged ||
                !privacyAcknowledged ||
                !termsAccepted
              }
            >
              {saving ? "Zapisywanie..." : "Zapisz i kontynuuj "}
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

class AdminModerationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "ADMIN MODERATION RENDER ERROR:",
      error,
      errorInfo
    );
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="account-page admin-page admin-moderation-page">
        <main className="admin-shell moderation-admin-shell">
          <div className="moderation-job-opening is-error" role="alert">
            <span className="section-label">Błąd panelu moderacji</span>
            <h2>Panel nie mógł zostać wyświetlony</h2>
            <p>
              Wystąpił błąd interfejsu. Dane i decyzje moderacyjne nie zostały
              przez ten błąd zmienione.
            </p>
            <p>
              Szczegóły techniczne: {this.state.error?.message || "Nieznany błąd"}
            </p>
            <a className="privacy-secondary-button" href="/admin/jobs">
              Wróć do listy zleceń
            </a>
          </div>
        </main>
      </div>
    );
  }
}

/* JOB CATEGORIES */

const JOB_CATEGORIES = [
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

const JOB_CATEGORY_LABELS = {
  Programowanie: "Strony, aplikacje i IT",
  "Grafika i design": "Grafika, UX i 3D",
  Marketing: "Marketing i sprzedaż",
  Copywriting: "Teksty i tłumaczenia",
  Video: "Wideo, animacja i audio",
  Fotografia: "Fotografia i obróbka zdjęć",
  "AI i automatyzacje": "AI i automatyzacje",
  "Dane, analizy i research": "Dane, analizy i research",
  "Biznes i e-commerce": "Biznes i e-commerce",
  "Architektura, wnętrza i CAD": "Architektura, wnętrza i CAD",
};

function getJobCategoryLabel(category) {
  return JOB_CATEGORY_LABELS[category] || category || "Inna kategoria";
}

const JOB_SUBCATEGORIES = {
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

const JOB_CATEGORY_FIELDS = {
  Programowanie: [
    {
      key: "project_type",
      label: "Rodzaj rozwiązania",
      placeholder: "Np. nowa strona, rozbudowa aplikacji lub naprawa błędu",
    },
    {
      key: "key_features",
      label: "Najważniejsze funkcje",
      placeholder: "Np. logowanie, płatności, panel administratora",
    },
    {
      key: "technology",
      label: "Technologia — jeśli ma znaczenie",
      placeholder: "Np. React, WordPress lub bez preferencji",
    },
    {
      key: "existing_code",
      label: "Co już istnieje?",
      placeholder: "Np. projekt graficzny, repozytorium, domena lub nic",
    },
  ],
  "Grafika i design": [
    {
      key: "asset_type",
      label: "Rodzaj materiału",
      placeholder: "Np. logo, widoki aplikacji, banery",
    },
    {
      key: "format_size",
      label: "Format lub wymiary",
      placeholder: "Np. A4, 1080 × 1080 px, SVG i PNG",
    },
    {
      key: "visual_style",
      label: "Styl i kierunek wizualny",
      placeholder: "Np. minimalistyczny, premium, dynamiczny",
    },
    {
      key: "variants",
      label: "Liczba wersji lub materiałów",
      placeholder: "Np. 3 propozycje logo i 2 rundy poprawek",
    },
  ],
  Marketing: [
    {
      key: "campaign_goal",
      label: "Cel działań",
      placeholder: "Np. sprzedaż, pozyskanie kontaktów, rozpoznawalność",
    },
    {
      key: "channels",
      label: "Kanały marketingowe",
      placeholder: "Np. Google Ads, Meta, TikTok, SEO",
    },
    {
      key: "target_group",
      label: "Grupa odbiorców",
      placeholder: "Kto ma zobaczyć kampanię?",
    },
    {
      key: "advertising_budget",
      label: "Osobny budżet reklamowy",
      placeholder: "Np. 2000 zł miesięcznie lub do ustalenia",
    },
  ],
  Copywriting: [
    {
      key: "text_type",
      label: "Rodzaj tekstu",
      placeholder: "Np. artykuł, opis produktu, treść strony",
    },
    {
      key: "text_volume",
      label: "Liczba tekstów lub objętość",
      placeholder: "Np. 5 artykułów po około 5000 znaków",
    },
    {
      key: "language_tone",
      label: "Język i styl komunikacji",
      placeholder: "Np. polski, profesjonalny i prosty",
    },
    {
      key: "seo_requirements",
      label: "Wymagania SEO",
      placeholder: "Np. lista słów kluczowych lub brak wymagań",
    },
  ],
  Video: [
    {
      key: "video_type",
      label: "Rodzaj materiału",
      placeholder: "Np. reklama, rolka, film na YouTube",
    },
    {
      key: "duration",
      label: "Docelowa długość",
      placeholder: "Np. 30 sekund lub 8–10 minut",
    },
    {
      key: "video_format",
      label: "Format publikacji",
      placeholder: "Np. pion 9:16, poziom 16:9, 4K",
    },
    {
      key: "source_materials",
      label: "Dostępne nagrania",
      placeholder: "Np. 40 GB nagrań, muzyka i logo",
    },
  ],
  Fotografia: [
    {
      key: "session_type",
      label: "Rodzaj sesji",
      placeholder: "Np. produkty, wydarzenie, portret",
    },
    {
      key: "session_location",
      label: "Miejsce wykonania",
      placeholder: "Np. Szczecin, studio wykonawcy lub zdalny retusz",
    },
    {
      key: "photo_count",
      label: "Liczba gotowych zdjęć",
      placeholder: "Np. 30 zdjęć po retuszu",
    },
    {
      key: "retouch_scope",
      label: "Zakres obróbki",
      placeholder: "Np. korekcja kolorów i dokładny retusz produktu",
    },
  ],
  "AI i automatyzacje": [
    {
      key: "solution_goal",
      label: "Cel rozwiązania",
      placeholder: "Np. szybsza obsługa zapytań lub automatyczne przygotowanie ofert",
    },
    {
      key: "business_process",
      label: "Proces do usprawnienia",
      placeholder: "Opisz krótko, jak praca wygląda dzisiaj",
    },
    {
      key: "current_tools",
      label: "Obecne narzędzia",
      placeholder: "Np. Gmail, Notion, CRM, sklep lub brak narzędzi",
    },
    {
      key: "integration_requirements",
      label: "Wymagane integracje",
      placeholder: "Np. API sklepu, kalendarz, formularz lub do ustalenia",
    },
  ],
  "Dane, analizy i research": [
    {
      key: "data_source",
      label: "Źródło danych",
      placeholder: "Np. Excel, CSV, ankieta, baza SQL lub strony internetowe",
    },
    {
      key: "data_volume",
      label: "Wielkość materiału",
      placeholder: "Np. 8 plików i około 40 000 rekordów",
    },
    {
      key: "expected_analysis",
      label: "Oczekiwany wynik analizy",
      placeholder: "Np. wnioski, porównanie, prognoza albo uporządkowana baza",
    },
    {
      key: "output_format",
      label: "Format rezultatu",
      placeholder: "Np. Excel, prezentacja, dashboard lub raport PDF",
    },
  ],
  "Biznes i e-commerce": [
    {
      key: "business_task",
      label: "Zadanie biznesowe",
      placeholder: "Np. uporządkowanie CRM lub przygotowanie katalogu produktów",
    },
    {
      key: "item_volume",
      label: "Liczba pozycji lub dokumentów",
      placeholder: "Np. 250 produktów, 3 procedury lub 120 kontaktów",
    },
    {
      key: "platforms",
      label: "Platformy i narzędzia",
      placeholder: "Np. Shopify, WooCommerce, Allegro, HubSpot lub Excel",
    },
    {
      key: "access_materials",
      label: "Dostępne materiały i dostępy",
      placeholder: "Wymień pliki, konta testowe i instrukcje, które przekażesz",
    },
  ],
  "Architektura, wnętrza i CAD": [
    {
      key: "space_or_object",
      label: "Przestrzeń lub obiekt",
      placeholder: "Np. salon, lokal usługowy, mebel lub część techniczna",
    },
    {
      key: "dimensions",
      label: "Wymiary i skala",
      placeholder: "Np. 42 m², model 1:10 lub wymiary kluczowych elementów",
    },
    {
      key: "source_materials",
      label: "Materiały wejściowe",
      placeholder: "Np. rzut, pomiary, zdjęcia, DWG lub szkic",
    },
    {
      key: "deliverable_format",
      label: "Format opracowania",
      placeholder: "Np. PDF, DWG, STEP, STL albo render 4K",
    },
  ],
};

const JOB_PROJECT_STAGES = [
  { value: "idea", label: "Mam pomysł" },
  { value: "started", label: "Projekt rozpoczęty" },
  { value: "improvement", label: "Potrzebuję poprawek" },
  { value: "continuation", label: "Szukam kontynuacji" },
];

const JOB_WORK_MODES = [
  { value: "remote", label: "Zdalnie" },
  { value: "onsite", label: "Stacjonarnie" },
  { value: "hybrid", label: "Hybrydowo" },
];

const JOB_EXPERIENCE_LEVELS = [
  { value: "any", label: "Bez znaczenia" },
  { value: "beginner", label: "Początkujący" },
  { value: "intermediate", label: "Średniozaawansowany" },
  { value: "expert", label: "Ekspert" },
];

const JOB_FORM_STEPS = [
  { number: "01", label: "Podstawy" },
  { number: "02", label: "Zakres" },
  { number: "03", label: "Budżet i termin" },
  { number: "04", label: "Podsumowanie" },
];

const COLLABORATION_REVISION_OPTIONS = [
  { value: "1", label: "1 runda" },
  { value: "2", label: "2 rundy" },
  { value: "3", label: "3 rundy" },
  { value: "flexible", label: "Do ustalenia" },
];

const COLLABORATION_APPROVAL_OPTIONS = [
  { value: "each_stage", label: "Po każdym etapie" },
  { value: "final", label: "Po zakończeniu całości" },
  { value: "individual", label: "Ustalimy przed startem" },
];

const COLLABORATION_CONTACT_OPTIONS = [
  { value: "ongoing", label: "Na bieżąco" },
  { value: "weekly", label: "Raz w tygodniu" },
  { value: "after_stage", label: "Po każdym etapie" },
  { value: "as_needed", label: "W razie potrzeby" },
];

const COLLABORATION_FEEDBACK_OPTIONS = [
  { value: "24h", label: "Do 24 godzin" },
  { value: "48h", label: "Do 48 godzin" },
  { value: "3d", label: "Do 3 dni" },
  { value: "individual", label: "Do ustalenia" },
];

const COLLABORATION_CHANGE_OPTIONS = [
  {
    value: "new_quote",
    label: "Nowa wycena i termin",
    description: "Dodatkowe zadania wymagają wcześniejszej akceptacji ceny i terminu.",
  },
  {
    value: "minor_included",
    label: "Drobne zmiany w poprawkach",
    description: "Niewielkie zmiany obejmują ustalone rundy poprawek.",
  },
  {
    value: "individual",
    label: "Ustalenie indywidualne",
    description: "Strony wspólnie określą wpływ zmiany na projekt.",
  },
];

const COLLABORATION_APPLICATION_REQUIREMENTS = [
  { value: "price", label: "Proponowana cena" },
  { value: "timeline", label: "Przewidywany termin" },
  { value: "approach", label: "Krótki plan realizacji" },
  { value: "similar_work", label: "Podobna realizacja" },
];

const DEFAULT_COLLABORATION_PLAN = {
  enabled: false,
  milestones: ["", "", ""],
  revisionRounds: "2",
  approvalMode: "each_stage",
  contactFrequency: "after_stage",
  feedbackTime: "48h",
  changePolicy: "new_quote",
  completionCriteria: ["", "", ""],
  clientResponsibilities: "",
  contractorResponsibilities: "",
  applicationRequirements: ["price", "timeline", "approach"],
  screeningQuestions: ["", "", ""],
};

function createDefaultCollaborationPlan() {
  return {
    ...DEFAULT_COLLABORATION_PLAN,
    milestones: [...DEFAULT_COLLABORATION_PLAN.milestones],
    completionCriteria: [...DEFAULT_COLLABORATION_PLAN.completionCriteria],
    applicationRequirements: [
      ...DEFAULT_COLLABORATION_PLAN.applicationRequirements,
    ],
    screeningQuestions: [...DEFAULT_COLLABORATION_PLAN.screeningQuestions],
  };
}

function cleanCollaborationList(values, limit = 3, itemLimit = 240) {
  return (Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim().slice(0, itemLimit))
    .filter(Boolean)
    .slice(0, limit);
}

function prepareCollaborationPlan(plan) {
  if (!plan?.enabled) return {};

  return {
    version: 1,
    milestones: cleanCollaborationList(plan.milestones, 3, 160),
    revision_rounds: plan.revisionRounds,
    approval_mode: plan.approvalMode,
    contact_frequency: plan.contactFrequency,
    feedback_time: plan.feedbackTime,
    change_policy: plan.changePolicy,
    completion_criteria: cleanCollaborationList(
      plan.completionCriteria,
      3,
      240
    ),
    client_responsibilities: String(
      plan.clientResponsibilities || ""
    ).trim().slice(0, 600),
    contractor_responsibilities: String(
      plan.contractorResponsibilities || ""
    ).trim().slice(0, 600),
    application_requirements: COLLABORATION_APPLICATION_REQUIREMENTS
      .map((option) => option.value)
      .filter((value) => plan.applicationRequirements?.includes(value)),
    screening_questions: cleanCollaborationList(
      plan.screeningQuestions,
      3,
      240
    ),
  };
}

function hasCollaborationPlan(plan) {
  return Boolean(
    plan &&
      typeof plan === "object" &&
      !Array.isArray(plan) &&
      Object.keys(plan).length > 0
  );
}

function getJobOptionLabel(options, value, fallback = "Do ustalenia") {
  return options.find((option) => option.value === value)?.label || fallback;
}

function getJobCategoryFieldLabel(category, key) {
  return JOB_CATEGORY_FIELDS[category]?.find((field) => field.key === key)?.label || key;
}

function getSafeJobReferenceUrl(value) {
  return getSafeWebUrl(value);
}

const MIN_JOB_BUDGET = IDEA_HIRE_PUBLIC_OFFER.orderMinimum;
const MAX_JOB_BUDGET = IDEA_HIRE_PUBLIC_OFFER.orderLimit;

const MAX_JOB_BUDGET_MESSAGE =
  "Nie możesz wpisać wyższej ceny. Maksymalny budżet jednego zlecenia to 10 000 zł.";

const JOB_LISTING_DURATION_OPTIONS = [
  {
    days: 7,
    label: "7 dni",
    description: "Krótka, pilna rekrutacja",
  },
  {
    days: 14,
    label: "14 dni",
    description: "Najlepszy wybór dla większości zleceń",
  },
  {
    days: 30,
    label: "30 dni",
    description: "Więcej czasu na znalezienie wykonawcy",
  },
];

function JobListingMeta({ job, compact = false }) {
  const expiry = getJobExpiryInfo(job?.expires_at);
  const negotiable = job?.budget_negotiable === true;

  return (
    <div
      className={`job-listing-meta${compact ? " is-compact" : ""}`}
      aria-label="Warunki publikacji zlecenia"
    >
      <span
        className={`job-listing-pill job-listing-expiry${
          expiry.expired ? " is-expired" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
        {expiry.label}
      </span>

      <span
        className={`job-listing-pill job-listing-price${
          negotiable ? " is-negotiable" : " is-fixed"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {negotiable ? (
            <path d="M7 8h10M7 8l3-3M7 8l3 3M17 16H7m10 0-3-3m3 3-3 3" />
          ) : (
            <path d="M8 10V8a4 4 0 0 1 8 0v2m-9 0h10a2 2 0 0 1 2 2v7H5v-7a2 2 0 0 1 2-2Z" />
          )}
        </svg>
        {negotiable ? "Do negocjacji" : "Cena ustalona"}
      </span>
    </div>
  );
}

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

function formatPolishJobsCount(value) {
  const count = Math.max(0, Math.trunc(Number(value) || 0));
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (count === 1) return "1 zlecenie";

  if (
    lastDigit >= 2
    && lastDigit <= 4
    && (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${count} zlecenia`;
  }

  return `${count} zleceń`;
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

const StaffRoleContext = createContext(null);

function StaffRoleProvider({ children }) {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [staffRole, setStaffRole] = useState(null);
  const [staffLoading, setStaffLoading] = useState(true);
  const [resolvedUserId, setResolvedUserId] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id || null;

    if (!userId) {
      setStaffRole(null);
      setResolvedUserId(null);
      setStaffLoading(false);
      return;
    }

    let mounted = true;

    async function loadStaffRole(
      showLoading = false
    ) {
      if (showLoading) {
        setStaffLoading(true);
      }

      const { data, error } = await supabase
        .from("ideahire_staff")
        .select("role, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.error("STAFF ROLE ERROR:", error);

        if (showLoading) {
          setStaffRole(null);
        }
      } else {
        setStaffRole(data?.role || null);
      }

      if (showLoading) {
        setResolvedUserId(userId);
        setStaffLoading(false);
      }
    }

    loadStaffRole(true);

    const channel = supabase
      .channel(`staff-role-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_staff",
          filter: `user_id=eq.${userId}`,
        },
        () => loadStaffRole(false)
      )
      .subscribe();

    const interval = window.setInterval(
      () => loadStaffRole(false),
      30000
    );

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        loadStaffRole(false);
      }
    }

    document.addEventListener(
      "visibilitychange",
      refreshWhenVisible
    );

    return () => {
      mounted = false;
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        refreshWhenVisible
      );
      supabase.removeChannel(channel);
    };
  }, [authLoading, user?.id]);

  const roleReady =
    !user?.id ||
    resolvedUserId === user.id;

  const value = {
    userId: user?.id || null,
    staffRole:
      roleReady ? staffRole : null,
    staffLoading:
      authLoading ||
      staffLoading ||
      !roleReady,
    isStaff:
      roleReady &&
      (staffRole === "owner" ||
        staffRole === "admin"),
    isOwner:
      roleReady &&
      staffRole === "owner",
  };

  return (
    <StaffRoleContext.Provider value={value}>
      {children}
    </StaffRoleContext.Provider>
  );
}

function useStaffRole(userId) {
  const value =
    useContext(StaffRoleContext);

  if (!value) {
    return {
      staffRole: null,
      staffLoading: true,
      isStaff: false,
      isOwner: false,
    };
  }

  if (
    userId &&
    value.userId !== userId
  ) {
    return {
      staffRole: null,
      staffLoading: true,
      isStaff: false,
      isOwner: false,
    };
  }

  return value;
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

function markConversationSeen(
  userId,
  conversationId
) {
  if (!userId || !conversationId) return;

  const key =
    `ideahire_seen_conversations_${userId}`;

  saveNotificationIds(
    key,
    [
      ...getStoredNotificationIds(key),
      String(conversationId),
    ]
  );

  window.dispatchEvent(
    new CustomEvent(
      "ideahire:messages-read",
      {
        detail: {
          userId,
          conversationId,
        },
      }
    )
  );
}

/* NAVBAR */

function AccountNavbar() {
  const accountLocation = useLocation();
  const marketplaceActive = accountLocation.pathname.startsWith("/services") || accountLocation.pathname.startsWith("/freelancers");
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

  const [
    hasMessageNotifications,
    setHasMessageNotifications,
  ] = useState(false);

  const accountMenuRef =
    useRef(null);
  const accountDropdownRef = useRef(null);
  const accountNavigationRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useLayoutEffect(() => {
    if (!accountMenuOpen) return undefined;
    let frame = 0;
    const viewport = window.visualViewport;
    function placeMenu() {
      frame = 0;
      const menu = accountDropdownRef.current;
      const trigger = accountMenuRef.current?.querySelector("summary");
      if (!menu || !trigger) return;
      const rect = trigger.getBoundingClientRect();
      const height = viewport?.height || window.innerHeight;
      const width = viewport?.width || window.innerWidth;
      const offsetTop = viewport?.offsetTop || 0;
      const offsetLeft = viewport?.offsetLeft || 0;
      const menuWidth = Math.min(340, width - 24);
      const top = Math.max(offsetTop + 12, Math.min(rect.bottom + 8, offsetTop + height - 160));
      const left = Math.max(offsetLeft + 12, Math.min(rect.right - menuWidth, offsetLeft + width - menuWidth - 12));
      menu.style.setProperty("top", `${top}px`);
      menu.style.setProperty("left", `${left}px`);
      menu.style.setProperty("width", `${menuWidth}px`);
      menu.style.setProperty("max-height", `${Math.max(80, offsetTop + height - top - 12)}px`);
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(placeMenu); }
    placeMenu();
    const focusFrame = window.requestAnimationFrame(() => accountDropdownRef.current?.querySelector("a")?.focus({ preventScroll: true }));
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [accountLocation.pathname]);

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
      setHasMessageNotifications(false);
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

      const {
        data: conversationRows,
        error: conversationsError,
      } = await supabase
        .from("conversations")
        .select("id, created_at")
        .or(
          `client_id.eq.${user.id},contractor_id.eq.${user.id}`
        )
        .order("created_at", {
          ascending: false,
        });

      if (conversationsError) {
        console.error(
          "NAVBAR CONVERSATIONS NOTIFICATION ERROR:",
          conversationsError
        );
      }

      const conversations =
        conversationsError
          ? []
          : conversationRows || [];

      const conversationIds =
        conversations.map(
          (conversation) =>
            conversation.id
        );

      let unreadMessages = [];

      if (conversationIds.length > 0) {
        const {
          data: messageRows,
          error: messagesError,
        } = await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, read_at, created_at"
          )
          .in(
            "conversation_id",
            conversationIds
          )
          .neq("sender_id", user.id)
          .is("read_at", null)
          .order("created_at", {
            ascending: false,
          })
          .limit(100);

        if (messagesError) {
          console.error(
            "NAVBAR MESSAGES NOTIFICATION ERROR:",
            messagesError
          );
        } else {
          const latestUnreadByConversation =
            new Map();

          for (
            const messageItem of
            messageRows || []
          ) {
            if (
              !latestUnreadByConversation.has(
                messageItem.conversation_id
              )
            ) {
              latestUnreadByConversation.set(
                messageItem.conversation_id,
                messageItem
              );
            }
          }

          unreadMessages = [
            ...latestUnreadByConversation.values(),
          ];
        }
      }

      const seenConversationIds =
        getStoredNotificationIds(
          `ideahire_seen_conversations_${user.id}`
        );

      const recentConversationThreshold =
        Date.now() -
        7 * 24 * 60 * 60 * 1000;

      const newConversations =
        conversations.filter(
          (conversation) =>
            new Date(
              conversation.created_at || 0
            ).getTime() >=
              recentConversationThreshold &&
            !seenConversationIds.includes(
              String(conversation.id)
            )
        );

      setHasMessageNotifications(
        unreadMessages.length > 0 ||
        newConversations.length > 0
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

      const unreadMessageNotification =
        unreadMessages.some(
          (message) =>
            !readIds.includes(
              `message:${message.id}`
            )
        );

      const unreadConversationNotification =
        newConversations.some(
          (conversation) =>
            !readIds.includes(
              `conversation:${conversation.id}`
            )
        );

      const unreadDispute =
        !disputeNotificationsError &&
        (disputeNotifications || []).length > 0;

      setHasNotifications(
        unreadIncoming ||
        unreadRejected ||
        unreadAccepted ||
        unreadBlock ||
        unreadMessageNotification ||
        unreadConversationNotification ||
        unreadDispute
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
      setHasMessageNotifications(false);
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

    function handleMessagesRead(event) {
      if (
        !event?.detail?.userId ||
        event.detail.userId === user?.id
      ) {
        setHasMessageNotifications(false);
        checkNotifications();
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

    window.addEventListener(
      "ideahire:messages-read",
      handleMessagesRead
    );

    const liveNotifications =
      supabase
        .channel(
          `navbar-notifications:${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "job_applications",
          },
          checkNotifications
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "conversations",
          },
          checkNotifications
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          checkNotifications
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "dispute_notifications",
            filter: `user_id=eq.${user.id}`,
          },
          checkNotifications
        )
        .subscribe();

    const interval =
      setInterval(
        checkNotifications,
        10000
      );

    return () => {
      clearInterval(
        interval
      );

      supabase.removeChannel(
        liveNotifications
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

      window.removeEventListener(
        "ideahire:messages-read",
        handleMessagesRead
      );
    };
  }, [
    user?.id,
    hasRestrictedAgeAccess,
    isRestricted,
    restrictionError,
    restrictionLoading,
  ]);

  useEffect(() => {
    function closeMenuFromOutside(event) {
      const menu = accountMenuRef.current;

      if (
        menu?.open &&
        !menu.contains(event.target) &&
        !accountDropdownRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function closeMenuWithKeyboard(event) {
      const menu = accountMenuRef.current;

      if (
        event.key === "Escape" &&
        menu?.open
      ) {
        setAccountMenuOpen(false);
        menu
          .querySelector("summary")
          ?.focus();
      }
    }

    document.addEventListener(
      "pointerdown",
      closeMenuFromOutside
    );
    document.addEventListener(
      "keydown",
      closeMenuWithKeyboard
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        closeMenuFromOutside
      );
      document.removeEventListener(
        "keydown",
        closeMenuWithKeyboard
      );
    };
  }, []);

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
      <header
        className="navbar account-navbar restricted-account-navbar"
        data-ui-release="ideahire-v5-5-20260919"
      >
        <Link
          className="restricted-navbar-brand"
          to="/account-status"
          aria-label="Przejdź do statusu konta"
        >
          <span className="logo">
            <BrandSignature />
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

  function closeAccountMenu(event) {
    setAccountMenuOpen(false);
    event.currentTarget
      .closest("details")
      ?.removeAttribute("open");
  }

  // P67: shared workspace navigation. The full Lucyna view retains its own shell.
  if (accountLocation.pathname !== "/lucyna") {
    return <WorkspaceNavigation
      name={userName} avatarUrl={avatarUrl} onLogout={handleLogout}
      limited={hasRestrictedAgeAccess || ageAccessLoading}
      hasMessages={hasMessageNotifications} hasNotifications={hasNotifications}
      hasDisputes={hasDisputeNotifications} moderationNotice={moderationNotice}
      helpUrl={helpCenterHref()} assistantEnabled={LUCYNA_VISIBLE}
      onAssistantOpen={requestLucynaDock}
    />;
  }

  if (isLimited && !ageAccessLoading) {
    return <LimitedAccountNavigation name={userName} initial={initial} onLogout={handleLogout} helpUrl={helpCenterHref()} showAssistant={LUCYNA_VISIBLE} />;
  }

  return (
    <header
      id="ih63-account-header" className="navbar account-navbar ih11-account-navbar"
      data-ui-release="ideahire-p11-20261005"
    >
      <div className="account-navbar-brand">
        <Link
          className="navbar-home-back"
          to="/"
          aria-label="Wróć na stronę główną"
          title="Wróć na stronę główną"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 5-7 7 7 7M5 12h14" /></svg>
        </Link>

        <IdeaHireLogo className="logo" />
      </div>

      <nav ref={accountNavigationRef} className="home-nav-links ih11-account-nav" aria-label="Główna nawigacja konta">
        {[
          { to: "/account", label: "Konto", end: true },
          { to: "/jobs", label: "Zlecenia" },
          { to: accountLocation.pathname.startsWith("/freelancers") ? "/freelancers" : "/services", label: "Usługi / Freelancerzy", market: true },
          ...(!hasRestrictedAgeAccess ? [{ to: "/messages", label: "Wiadomości", notice: hasMessageNotifications }] : []),
          ...(LUCYNA_VISIBLE ? [{ to: "/lucyna", label: "Lucyna AI", lucyna: true }] : []),
        ].map((item, index) => (
          <NavLink key={item.to} to={item.to} end={item.end} style={{ "--ih-nav-order": index }}
            className={({ isActive }) => `ih-nav-item${(item.market ? marketplaceActive : isActive) ? " is-active" : ""}`}
            data-lucyna={item.lucyna ? "" : undefined}
            onClick={item.lucyna ? requestLucynaDock : undefined}
            aria-current={item.market && marketplaceActive ? "page" : undefined}>
            <span className="ih-nav-label">{item.label}</span>
            {item.notice && <span className="notification-dot messages-nav-dot" aria-label="Nowa rozmowa lub wiadomość" />}
          </NavLink>
        ))}
      </nav>

      <div className="nav-actions account-navbar-actions">
        {!hasRestrictedAgeAccess && (
          <NavLink
            to="/find-talent"
            aria-label="Dodaj zlecenie"
            className={({ isActive }) =>
              `account-create-job-button${isActive ? " is-active" : ""}`
            }
          >
            <MarketIcon kind="plus" />
            <span className="account-create-job-label">Dodaj zlecenie</span>
          </NavLink>
        )}

        {!hasRestrictedAgeAccess && (
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `account-notification-button${isActive ? " is-active" : ""}`
            }
            aria-label="Powiadomienia"
            title="Powiadomienia"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            {hasNotifications && (
              <span className="notification-dot" />
            )}
          </NavLink>
        )}

        <details
          className="account-menu"
          ref={accountMenuRef}
          open={accountMenuOpen}
        >
          <summary
            className="account-mini"
            aria-label={accountMenuOpen ? "Zamknij menu konta" : "Otwórz menu konta"}
            aria-expanded={accountMenuOpen}
            aria-controls="ih18-account-menu"
            onClick={(event) => { event.preventDefault(); setAccountMenuOpen(value => !value); }}
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

            <svg className="ih63-account-hamburger" viewBox="0 0 24 24" aria-hidden="true"><path d={accountMenuOpen?"M6 6l12 12M18 6 6 18":"M4 6h16M4 12h16M4 18h16"}/></svg>

            <span
              className="account-menu-caret"
              aria-hidden="true"
            >
              
            </span>

            {(hasDisputeNotifications ||
              (moderationNotice &&
                ["scheduled", "active"].includes(
                  moderationNotice.status
                ))) && (
              <span className="account-menu-alert-dot" />
            )}
          </summary>

          {accountMenuOpen && createPortal(<div className="account-menu-dropdown ih18-account-dropdown" ref={accountDropdownRef} id="ih18-account-menu" aria-label="Funkcje konta">
            <div className="account-menu-identity">
              <strong>{userName}</strong>
              <span>{user?.email || "Konto IdeaHire"}</span>
            </div>

            <nav
              className="account-menu-mobile-nav"
              aria-label="Nawigacja mobilna"
            >
              <NavLink to="/" onClick={closeAccountMenu}>Strona główna</NavLink>
              <NavLink to="/jobs" onClick={closeAccountMenu}>
                Zlecenia
              </NavLink>
              <NavLink to="/services" onClick={closeAccountMenu}>
                Usługi / Freelancerzy
              </NavLink>
              {!hasRestrictedAgeAccess && (
                <NavLink
                  to="/messages"
                  onClick={closeAccountMenu}
                  className="account-menu-notice-link"
                >
                  <span>Wiadomości</span>
                  {hasMessageNotifications && (
                    <span className="notification-dot" />
                  )}
                </NavLink>
              )}
              {!hasRestrictedAgeAccess && (
                <NavLink to="/notifications" onClick={closeAccountMenu}>Powiadomienia{hasNotifications && <span className="notification-dot" />}</NavLink>
              )}
              {!hasRestrictedAgeAccess && (
                <NavLink to="/find-talent" onClick={closeAccountMenu}>
                  Dodaj zlecenie
                </NavLink>
              )}
            </nav>

            <NavLink
              to="/account"
              onClick={closeAccountMenu}
              className={({ isActive }) =>
                isActive ? "is-active" : ""
              }
            >
              Moje konto
            </NavLink>

            <NavLink
              to="/calendar"
              onClick={closeAccountMenu}
              className={({ isActive }) =>
                isActive ? "is-active" : ""
              }
            >
              <span className="account-menu-calendar-link">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
                  <path d="m9 14 2 2 4-5" />
                </svg>
                Kalendarz
              </span>
            </NavLink>

            {!hasRestrictedAgeAccess && (
              <NavLink
                to="/disputes"
                onClick={closeAccountMenu}
                className={({ isActive }) =>
                  `account-menu-notice-link${isActive ? " is-active" : ""}`
                }
              >
                <span>Spory</span>
                {hasDisputeNotifications && (
                  <span className="notification-dot" />
                )}
              </NavLink>
            )}

            {moderationNotice && (
              <NavLink
                to="/account-status"
                onClick={closeAccountMenu}
                className={({ isActive }) =>
                  `account-menu-notice-link${isActive ? " is-active" : ""}`
                }
              >
                <span>Decyzja administracji</span>
                {["scheduled", "active"].includes(
                  moderationNotice.status
                ) && (
                  <span className="notification-dot" />
                )}
              </NavLink>
            )}

            <NavLink
              to="/privacy-center"
              onClick={closeAccountMenu}
              className={({ isActive }) =>
                isActive ? "is-active" : ""
              }
            >
              Prywatność i dane
            </NavLink>

            {LUCYNA_VISIBLE && (
              <NavLink to="/lucyna" onClick={event => { closeAccountMenu(event); requestLucynaDock(event); }}
                className={({ isActive }) => isActive ? "is-active" : ""}>
                <MarketIcon kind="message" /><span>Lucyna AI</span>
              </NavLink>
            )}

            <a href={helpCenterHref()} onClick={closeAccountMenu} referrerPolicy="no-referrer" aria-label="Pomoc — Centrum pomocy">
              <MarketIcon kind="help" /><span>Pomoc</span>
            </a>

            <div className="account-menu-divider" />

            <button
              className="account-menu-logout"
              type="button"
              onClick={handleLogout}
            >
              Wyloguj się
            </button>
          </div>, document.body)}
        </details>
      </div>
    </header>
  );
}

function AdminNavbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);
  const [logoutError,setLogoutError] = useState("");
  async function handleAdminLogout() {
    try { const { error } = await supabase.auth.signOut(); if(error) throw error; navigate("/login",{replace:true}); }
    catch(error) { setLogoutError(cleanSupabaseError(error,"Nie udało się wylogować.")); }
  }
  return <><AdminNavigation name={user?.user_metadata?.name || user?.email?.split("@")[0] || "Administracja"} role={staffRole} onLogout={handleAdminLogout} assistantEnabled={LUCYNA_VISIBLE} />{logoutError && <p className="ih-admin-logout-error" role="alert">{logoutError}</p>}</>;
}

/* LOGIN */

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
  const authPreferences = useSitePreferences();
  const captcha = useAuthCaptcha(mode === "reset" ? "password_reset" : "login", authPreferences);

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

  const { pending: googleLoading, start: startGoogleAuth, cancel: cancelGoogleAuth } = useGoogleAuth(supabase, error => {
    setMessage(`Nie udało się zalogować przez Google: ${error?.message || "Spróbuj ponownie."}`);
  });

  useEffect(() => {
    const oauthError = getOAuthErrorFromLocation(location);

    if (oauthError) {
      setMessage(
        `Nie udało się zalogować przez Google: ${oauthError}`
      );
    }
  }, [location.search, location.hash]);

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
    captcha.reset();
    cancelGoogleAuth();
    setMode("reset");
    setMessage("");
    setSuccess(false);
    setPassword("");
  }

  function switchToLogin() {
    captcha.reset();
    setMode("login");
    setMessage("");
    setSuccess(false);
  }

  async function handleLogin(
    event
  ) {
    event.preventDefault();

    if (loading) return;
    cancelGoogleAuth();

    setMessage("");
    setSuccess(false);

    const captchaToken = captcha.consume();
    if (captchaToken === null) { setMessage(captcha.message); captcha.reset(); return; }

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
            ...(captchaToken ? { options: { captchaToken } } : {}),
          }
        );

      if (error) {
        setMessage(
          getLoginErrorMessage(error, captcha.english)
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
      announceLoginSuccess();
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
        getLoginErrorMessage(error, captcha.english)
      );
    } finally {
      captcha.reset();
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (loading || googleLoading) return;
    setMessage("");
    setSuccess(false);
    const redirectUrl = new URL("/login", window.location.origin);
    redirectUrl.searchParams.set("oauth", "google");
    await startGoogleAuth(redirectUrl.toString());
  }

  async function handlePasswordReset(
    event
  ) {
    event.preventDefault();
    if (loading) return;

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

    const captchaToken = captcha.consume();
    if (captchaToken === null) { setMessage(captcha.message); captcha.reset(); return; }

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
            ...(captchaToken ? { captchaToken } : {}),
          }
        );

      if (error) {
        setMessage(
          getCaptchaErrorMessage(error, captcha.english) || `Nie udało się wysłać wiadomości: ${error.message}`
        );

        return;
      }

      setSuccess(true);

      setMessage(
        "Link do resetowania hasła został wysłany na podany adres e-mail."
      );
    } catch (error) {
      setMessage(
        getCaptchaErrorMessage(error, captcha.english) || `Nie udało się wysłać wiadomości: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      captcha.reset();
      setLoading(false);
    }
  }

  if (authLoading) {
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
            <BrandSignature />
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

            {captcha.field}

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
              disabled={loading || !captcha.ready}
            >
              {loading
                ? "Wysyłanie..."
                : "Wyślij link "}
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
          <BrandSignature />
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

        <div className="auth-provider-section">
          <GoogleAuthButton
            onClick={handleGoogleLogin}
            loading={googleLoading}
          />
          <GooglePendingNotice pending={googleLoading} onCancel={() => { cancelGoogleAuth(); document.getElementById("ih65-login-email")?.focus(); }} />

          <p className="google-auth-notice">
            Google przekaże IdeaHire adres e-mail, nazwę i zdjęcie konta.
            Nazwa uzupełni profil; zdjęcie pojawi się publicznie dopiero po
            zapisaniu profilu.
          </p>

          <div className="auth-divider" aria-hidden="true">
            <span>lub przez e-mail</span>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <label>
            Adres e-mail

            <input
              id="ih65-login-email"
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

            <PasswordInput
              
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

          {captcha.field}

          {message && (
            <p className="auth-error">
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading || !captcha.ready}
          >
            {loading
              ? "Logowanie..."
              : "Zaloguj się "}
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

/* RESET PASSWORD */

function ResetPassword() {
  const passwordEnglish = useSitePreferences().language === "en";
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

    const passwordProblem = getNewPasswordValidationMessage(password, passwordEnglish);
    if (passwordProblem) {
      setMessage(passwordProblem);
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

  if (
    loading &&
    !recoveryReady &&
    !message
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
          <BrandSignature />
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

                <PasswordInput
                  
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Wpisz nowe hasło"
                  autoComplete="new-password"
                  aria-describedby="reset-password-requirements"
                  minLength={NEW_PASSWORD_MIN_LENGTH}
                  required
                />
                <small id="reset-password-requirements">{passwordEnglish ? "At least 12 characters. You can use a long phrase and spaces." : "Co najmniej 12 znaków. Możesz użyć długiej frazy i spacji."}</small>
              </label>

              <label>
                Powtórz nowe hasło

                <PasswordInput
                  
                  value={passwordAgain}
                  onChange={(event) =>
                    setPasswordAgain(
                      event.target.value
                    )
                  }
                  placeholder="Wpisz hasło ponownie"
                  autoComplete="new-password"
                  aria-describedby="reset-password-requirements"
                  minLength={NEW_PASSWORD_MIN_LENGTH}
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
                  : "Ustaw nowe hasło "}
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


/* REGISTER */

function Register() {
  const registrationPreferences = useSitePreferences();
  const registrationEnglish = registrationPreferences.language === "en";
  const captcha = useAuthCaptcha("signup", registrationPreferences);
  const {
    isLoggedIn,
    loading: authLoading,
  } = useAuth();

  const { draft, saveDraft } = useRegistrationDraft();
  const initialDraft = useRef(draft).current;

  const [name, setName] =
    useState(initialDraft?.name || "");

  const [registrationDetails, setRegistrationDetails] =
    useState(initialDraft?.registrationDetails || { ...EMPTY_REGISTRATION_DETAILS });

  const [email, setEmail] =
    useState(initialDraft?.email || "");

  const [password, setPassword] =
    useState(initialDraft?.password || "");

  const [birthDate, setBirthDate] =
    useState(initialDraft?.birthDate || "");

  const [usagePreference, setUsagePreference] =
    useState(initialDraft?.usagePreference || "");

  const [interview, setInterview] = useState(() => ({ ...EMPTY_INTERVIEW, ...initialDraft?.interview,
    usagePreference: initialDraft?.interview?.usagePreference || initialDraft?.usagePreference || "" }));

  const [ageNoticeAcknowledged, setAgeNoticeAcknowledged] =
    useState(initialDraft?.ageNoticeAcknowledged === true);

  const [privacyNoticeAcknowledged, setPrivacyNoticeAcknowledged] =
    useState(initialDraft?.privacyNoticeAcknowledged === true);

  const [termsAccepted, setTermsAccepted] =
    useState(initialDraft?.termsAccepted === true);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const { pending: googleLoading, start: startGoogleAuth, cancel: cancelGoogleAuth } = useGoogleAuth(supabase, error => {
    setMessage(`Nie udało się kontynuować przez Google: ${error?.message || "Spróbuj ponownie."}`);
  });
  const location = useLocation();
  const [registrationStage, setRegistrationStage] = useState(initialDraft?.stage === "account" ? "account" : "interview");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const registrationRequest = useRef(false);
  const formTitleRef = useRef(null);
  const errorRef = useRef(null);
  const returnPoint = useRef(initialDraft?.returnPosition || null);
  const registrationSnapshot = { name, registrationDetails, email, password, birthDate, usagePreference, interview,
    ageNoticeAcknowledged, privacyNoticeAcknowledged, termsAccepted, stage: registrationStage };
  useEffect(() => {
    saveDraft(previous => confirmationEmail ? null : { ...previous, ...registrationSnapshot });
  }, [name, registrationDetails, email, password, birthDate, usagePreference, interview, ageNoticeAcknowledged, privacyNoticeAcknowledged, termsAccepted, registrationStage, confirmationEmail, saveDraft]);

  useLayoutEffect(() => {
    if (registrationStage !== "account" && !returnPoint.current) return;
    const frame = requestAnimationFrame(() => {
      const point = returnPoint.current;
      if (point) {
        window.scrollTo({ top: point.scrollY, behavior: "instant" });
        document.getElementById(point.focusId)?.focus({ preventScroll: true });
        returnPoint.current = null;
        saveDraft(previous => previous ? { ...previous, returnPosition: null } : previous);
      } else {
        window.scrollTo({ top: 0, behavior: "instant" });
        formTitleRef.current?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [registrationStage, saveDraft]);

  useEffect(() => {
    if (message && registrationStage === "account") {
      errorRef.current?.focus({ preventScroll: true });
      errorRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
    }
  }, [message, registrationStage]);

  function registrationInterviewAnswer() {
    return normalizeRegistrationInterview(interview, JOB_CATEGORIES) || normalizeRegistrationInterview({
      ...EMPTY_INTERVIEW, usagePreference: usagePreference || "both", action: "skip", personalizationEnabled: false,
    }, JOB_CATEGORIES);
  }

  useEffect(() => {
    const oauthError = getOAuthErrorFromLocation(location);

    if (oauthError) {
      setMessage(
        `Nie udało się kontynuować przez Google: ${oauthError}`
      );
    }
  }, [location.search, location.hash]);

  async function handleGoogleRegister() {
    if (loading || googleLoading) return;
    setMessage("");
    if (!usagePreference) { setMessage("Wybierz, jak chcesz korzystać z IdeaHire."); return; }
    const detailsProblem = registrationDetailsProblem(registrationDetails);
    if (detailsProblem) { setMessage(detailsProblem); return; }
    const interviewToken = rememberRegistrationInterview(registrationInterviewAnswer());
    if (!interviewToken) {
      setMessage(registrationEnglish ? "To keep your interview answers during Google sign-in, allow this site's session storage or create your account by email." : "Aby zachować odpowiedzi podczas logowania Google, zezwól na pamięć sesji tej witryny albo utwórz konto przez e-mail.");
      return;
    }
    const detailsToken = rememberRegistrationDetails(registrationDetails);
    const redirectUrl = new URL("/register", window.location.origin);
    redirectUrl.searchParams.set("oauth", "google");
    redirectUrl.searchParams.set("registration_interview", interviewToken);
    if (detailsToken) redirectUrl.searchParams.set("registration_details", detailsToken);
    await startGoogleAuth(redirectUrl.toString());
  }

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    if (loading || registrationRequest.current) return;
    cancelGoogleAuth();

    setMessage("");

    if (!usagePreference) {
      setMessage("Wybierz, jak chcesz korzystać z IdeaHire.");
      return;
    }

    if (!name.trim()) {
      setMessage("Podaj imię lub nazwę konta.");
      return;
    }

    const detailsProblem = registrationDetailsProblem(registrationDetails);
    if (detailsProblem) { setMessage(detailsProblem); return; }

    const passwordProblem = getNewPasswordValidationMessage(password, registrationEnglish);
    if (passwordProblem) { setMessage(passwordProblem); return; }

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

    const captchaToken = captcha.consume();
    if (captchaToken === null) { setMessage(captcha.message); captcha.reset(); return; }

    registrationRequest.current = true;
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
            ...(captchaToken ? { captchaToken } : {}),
            data: {
              name:
                name.trim(),
              [REGISTRATION_DETAILS_KEY]:
                registrationDetailsMetadata(registrationDetails, "email_signup"),
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
              usage_preference:
                usagePreference,
              onboarding_source:
                "registration",
              [REGISTRATION_INTERVIEW_KEY]:
                registrationInterviewAnswer(),
            },
          },
        });

      if (error) {
        setMessage(
          getCaptchaErrorMessage(error, captcha.english) || `Nie udało się utworzyć konta: ${error.message}`
        );

        return;
      }

      if (!data?.user) {
        setMessage(
          "Supabase nie zwrócił użytkownika."
        );

        return;
      }

      clearPendingRegistrationDetails();
      if (!data.session) {
        setPassword("");
        setConfirmationEmail(normalizeEmail(email));
      }
    } catch (error) {
      setMessage(
        getCaptchaErrorMessage(error, captcha.english) || `Nie udało się utworzyć konta: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      captcha.reset();
      registrationRequest.current = false;
      setLoading(false);
    }
  }

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (confirmationEmail) return <RegistrationSentScreen email={confirmationEmail} helpUrl={helpCenterHref()} onResend={async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email: confirmationEmail });
    if (error) throw error;
  }} />;

  if (registrationStage === "interview") {
    return <RegistrationInterview
      value={interview}
      onChange={(value) => { setInterview(value); setUsagePreference(value.usagePreference); setMessage(""); }}
      onComplete={(answer) => { setInterview(previous => ({ ...previous, ...answer, step: answer.action === "skip" ? 0 : 5 })); setUsagePreference(answer.usagePreference); setRegistrationStage("account"); }}
      usageOptions={DISCOVERY_USAGE_OPTIONS}
      categories={JOB_CATEGORIES}
      categoryDetails={DISCOVERY_CATEGORY_DETAILS}
      categoryLabel={getJobCategoryLabel}
      goalOptions={DISCOVERY_GOAL_OPTIONS}
      readinessOptions={DISCOVERY_PROJECT_READINESS_OPTIONS}
      snapshot={registrationSnapshot}
    />;
  }

  return (
    <div className="page ih10-register">
      <div className="auth-card ih10-registration-card">
        <Link
          className="logo"
          to="/"
        >
          <BrandSignature />
        </Link>

        <div className="ih10-registration-intro" aria-hidden="true"><i /><i /><i /><i /></div>

        <div className="auth-header">
          <span className="section-label">
            Dołącz do IdeaHire
          </span>

          <h1 tabIndex={-1} ref={formTitleRef}>
            Utwórz konto
          </h1>

          <p>
            Załóż konto i zacznij
            korzystać z IdeaHire.
          </p>
        </div>

        <div className="ih59-registration-selection">
          <div><small>{interview.action === "skip" ? "Wywiad pominięty · teraz Twoje konto" : "Wywiad gotowy · teraz Twoje konto"}</small><strong>{getDiscoveryUsageLabel(usagePreference)}</strong></div>
          <button type="button" disabled={loading} onClick={() => { cancelGoogleAuth(); setRegistrationStage("interview"); setMessage(""); }}>Edytuj wywiad</button>
        </div>

        <div className="auth-provider-section">
          <GoogleAuthButton
            onClick={handleGoogleRegister}
            loading={googleLoading}
          />
          <GooglePendingNotice pending={googleLoading} onCancel={() => { cancelGoogleAuth(); document.getElementById("ih65-register-email")?.focus(); }} />

          <p className="google-auth-notice">
            Google przekaże IdeaHire adres e-mail, nazwę i zdjęcie konta.
            Nazwa uzupełni profil; zdjęcie pojawi się publicznie dopiero po
            zapisaniu profilu. Po pierwszym logowaniu uzupełnisz datę urodzenia
            i potwierdzisz dokumenty wymagane do aktywowania konta IdeaHire.
          </p>

          <div className="auth-divider" aria-hidden="true">
            <span>lub utwórz konto przez e-mail</span>
          </div>
        </div>

        <form
          className="auth-form"
          onSubmit={handleRegister}
          aria-busy={loading}
        >
          <label>
            Nazwa profilu

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value
                )
              }
              placeholder="Nazwa widoczna na profilu"
              autoComplete="nickname"
              maxLength={160}
              required
            />
            <small>Ta nazwa może być widoczna dla innych użytkowników.</small>
          </label>

          <RegistrationDetailsFields value={registrationDetails} onChange={setRegistrationDetails} disabled={loading || googleLoading} idPrefix="email-registration" />

          <label>
            Adres e-mail

            <input
              id="ih65-register-email"
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

            <IdeaHireDateField
                aria-label="Data urodzenia"
              type="date"
              value={birthDate}
              min={getDateInputBoundary(120)}
              max={getDateInputBoundary()}
              onChange={(event) => {
                setBirthDate(event.target.value);
                setAgeNoticeAcknowledged(false);
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

            <PasswordInput
              
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Utwórz hasło"
              autoComplete="new-password"
              aria-describedby="registration-password-requirements"
              minLength={NEW_PASSWORD_MIN_LENGTH}
              required
            />
            <small id="registration-password-requirements">{registrationEnglish ? "At least 12 characters. You can use a long phrase and spaces." : "Co najmniej 12 znaków. Możesz użyć długiej frazy i spacji."}</small>
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
                <RegistrationDocumentLink to="/polityka-prywatnosci" id="ih65-register-privacy" snapshot={registrationSnapshot}>
                  Otwórz Politykę prywatności
                </RegistrationDocumentLink>
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
                <RegistrationDocumentLink to="/regulamin" id="ih65-register-terms" snapshot={registrationSnapshot}>
                  Otwórz Regulamin — wersja 0.9
                </RegistrationDocumentLink>
              </small>
            </div>
          </div>

          <p className="ri-account-storage-note">{registrationEnglish ? "Cookies and site storage: necessary technologies are described in the information shown on your first visit. Creating an account does not mean agreeing to advertising or analytics. " : "Cookies i pamięć witryny: niezbędne technologie opisujemy w informacji przy pierwszej wizycie. Utworzenie konta nie oznacza zgody na reklamy ani analitykę. "}<RegistrationDocumentLink to="/polityka-cookies" id="ri-account-cookies" snapshot={registrationSnapshot}>{registrationEnglish ? "Read the cookie policy" : "Przeczytaj politykę cookies"}</RegistrationDocumentLink></p>

          {captcha.field}

          {message && (
            <p className="auth-error ih59-registration-error" role="alert" tabIndex={-1} ref={errorRef}>
              {message}
            </p>
          )}

          <button
            className="btn btn-dark btn-large"
            type="submit"
            disabled={loading || !captcha.ready}
          >
            {loading
              ? "Tworzenie konta..."
              : "Utwórz konto "}
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

/* AVATAR */

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

async function resizePortfolioImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;

      if (!sourceWidth || !sourceHeight) {
        reject(new Error("Zdjęcie portfolio ma nieprawidłowe wymiary."));
        return;
      }

      const MAX_WIDTH = 2400;
      const MAX_HEIGHT = 1800;
      const scale = Math.min(
        MAX_WIDTH / sourceWidth,
        MAX_HEIGHT / sourceHeight,
        1
      );

      const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
      const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
      const canvas = document.createElement("canvas");

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Przeglądarka nie obsługuje Canvas."));
        return;
      }

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        0,
        0,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Nie udało się przygotować zdjęcia portfolio."));
            return;
          }

          resolve(
            new File([blob], "portfolio.jpg", {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Nie udało się odczytać zdjęcia portfolio."));
    };

    image.src = objectUrl;
  });
}

function normalizePortfolioUrl(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return null;

  const candidate = /^https?:\/\//i.test(cleanValue)
    ? cleanValue
    : `https://${cleanValue}`;

  let parsedUrl;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error("Wpisz prawidłowy link do projektu.");
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw new Error("Link do projektu musi używać HTTPS i nie może zawierać loginu ani hasła.");
  }

  return parsedUrl.toString();
}

function getPortfolioLinkLabel(value) {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname === "/"
      ? ""
      : parsed.pathname.replace(/\/$/, "");

    return `${hostname}${pathname}`;
  } catch {
    return "Otwórz projekt";
  }
}

function getPortfolioMedia(item) {
  if (Array.isArray(item?.media) && item.media.length > 0) {
    return item.media;
  }

  if (item?.image_url) {
    return [{
      id: `legacy-${item.id}`,
      portfolio_item_id: item.id,
      user_id: item.user_id,
      image_url: item.image_url,
      image_path: item.image_path || null,
      alt_text: item.title || "Zdjęcie realizacji",
      display_order: 0,
      isLegacyFallback: true,
    }];
  }

  return [];
}

async function fetchPortfolioAlbums(userId) {
  const { data: items, error: itemsError } = await supabase
    .from("ideahire_portfolio_items")
    .select(
      "id, user_id, title, description, project_url, image_url, image_path, display_order, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemsError) throw itemsError;
  if (!items?.length) return [];

  const { data: media, error: mediaError } = await supabase
    .from("ideahire_portfolio_media")
    .select(
      "id, portfolio_item_id, user_id, image_url, image_path, alt_text, display_order, created_at"
    )
    .in("portfolio_item_id", items.map((item) => item.id))
    .order("display_order", { ascending: true });

  if (mediaError) throw mediaError;

  const mediaByItem = (media || []).reduce((groups, mediaItem) => {
    if (!groups[mediaItem.portfolio_item_id]) {
      groups[mediaItem.portfolio_item_id] = [];
    }
    groups[mediaItem.portfolio_item_id].push(mediaItem);
    return groups;
  }, {});

  return items.map((item) => ({
    ...item,
    media: mediaByItem[item.id] || getPortfolioMedia(item),
  }));
}

function PortfolioLightbox({ album, initialIndex, canReport, onClose, onReport }) {
  const media = getPortfolioMedia(album);
  const [activeIndex, setActiveIndex] = useState(
    Math.min(Math.max(Number(initialIndex) || 0, 0), Math.max(media.length - 1, 0))
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const downloadRef = useRef({ controller: null, url: null, timer: null });
  const closeRef = useRef(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && media.length > 1) {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + media.length) % media.length);
      }
      if (event.key === "ArrowRight" && media.length > 1) {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % media.length);
      }
      if (event.key === "Tab") {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        const controls = dialog?.querySelectorAll('button:not(:disabled):not([tabindex="-1"]), a[href]:not([tabindex="-1"])');
        if (!controls?.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [media.length, onClose]);

  useEffect(() => () => {
    const transfer = downloadRef.current;
    transfer.controller?.abort();
    window.clearTimeout(transfer.timer);
    if (transfer.url) URL.revokeObjectURL(transfer.url);
  }, []);

  if (!album || media.length === 0) return null;
  const activeMedia = media[activeIndex];

  async function downloadPhoto() {
    if (downloading) return;
    const controller = new AbortController();
    downloadRef.current.controller = controller;
    setDownloading(true);
    setDownloadError("");
    try {
      const address = new URL(activeMedia.image_url, window.location.href);
      if (!["https:", "http:"].includes(address.protocol)) throw new Error("Nieprawidłowy adres zdjęcia.");
      const response = await fetch(address.href, { signal: controller.signal, credentials: "omit" });
      if (!response.ok) throw new Error("Nie udało się pobrać zdjęcia.");
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" }[blob.type] || address.pathname.match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1] || "jpg";
      const filename = `${String(album.title || "IdeaHire-portfolio").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").trim().slice(0, 80) || "IdeaHire-portfolio"}-${activeIndex + 1}.${extension}`;
      const transfer = downloadRef.current;
      window.clearTimeout(transfer.timer);
      if (transfer.url) URL.revokeObjectURL(transfer.url);
      const url = URL.createObjectURL(blob);
      transfer.url = url;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      transfer.timer = window.setTimeout(() => { URL.revokeObjectURL(url); if (transfer.url === url) transfer.url = null; }, 1500);
    } catch (error) {
      if (!controller.signal.aborted) setDownloadError("Nie udało się pobrać automatycznie. Otwórz oryginał i zapisz zdjęcie.");
    } finally {
      if (!controller.signal.aborted) setDownloading(false);
    }
  }

  return (
    <div className="portfolio-lightbox ih8-portfolio-viewer" role="dialog" aria-modal="true" aria-label={`Album: ${album.title}`}>
      <button type="button" className="portfolio-lightbox-backdrop" onClick={onClose} aria-label="Zamknij album" tabIndex={-1} />
      <div className="portfolio-lightbox-panel">
        <header>
          <div><span>Portfolio</span><strong>{album.title}</strong></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Zamknij album">×</button>
        </header>
        <div className="portfolio-lightbox-stage">
          <img key={activeMedia.id || activeIndex} src={activeMedia.image_url} alt={activeMedia.alt_text || `${album.title} — zdjęcie ${activeIndex + 1}`} />
        </div>
        <div className="ih8-portfolio-controls" aria-label="Sterowanie galerią">
          <div className="ih8-portfolio-navigation">
            <button type="button" className="portfolio-lightbox-arrow is-left" onClick={() => { setDownloadError(""); setActiveIndex((activeIndex - 1 + media.length) % media.length); }} disabled={media.length < 2} aria-label="Poprzednie zdjęcie"><MarketIcon kind="arrow" /></button>
            <span className="ih8-portfolio-count" aria-live="polite">{activeIndex + 1} / {media.length}</span>
            <button type="button" className="portfolio-lightbox-arrow is-right" onClick={() => { setDownloadError(""); setActiveIndex((activeIndex + 1) % media.length); }} disabled={media.length < 2} aria-label="Następne zdjęcie"><MarketIcon kind="arrow" /></button>
          </div>
          <button type="button" className="ih8-portfolio-download" onClick={downloadPhoto} disabled={downloading}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" /></svg>
            <span>{downloading ? "Pobieranie…" : "Pobierz zdjęcie"}</span>
          </button>
          {downloadError && <p className="ih8-portfolio-error" role="status">{downloadError} <a href={getSafeWebUrl(activeMedia.image_url) || undefined} target="_blank" rel="noopener noreferrer">Otwórz oryginał</a></p>}
        </div>
        <footer>
          <div className="portfolio-lightbox-thumbnails" aria-label="Zdjęcia w albumie">
            {media.map((mediaItem, index) => <button type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => { setDownloadError(""); setActiveIndex(index); }} aria-label={`Pokaż zdjęcie ${index + 1}`} aria-pressed={index === activeIndex} key={mediaItem.id || index}><img src={mediaItem.image_url} alt="" loading="lazy" /></button>)}
          </div>
          {canReport && <button type="button" className="portfolio-lightbox-report" onClick={() => onReport(album, activeMedia)}>Zgłoś zdjęcie</button>}
        </footer>
      </div>
    </div>
  );
}

function PortfolioReportDialog({ target, onClose, onSubmitted }) {
  const [reasonCode, setReasonCode] = useState("copyright");
  const [explanation, setExplanation] = useState("");
  const [legalReference, setLegalReference] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [busy, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    if (explanation.trim().length < 50) {
      setMessage("Opisz konkretnie naruszenie — minimum 50 znaków.");
      return;
    }
    if (!goodFaith) {
      setMessage("Potwierdź oświadczenie o dobrej wierze.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await supabase.rpc(
        "submit_ideahire_portfolio_content_report",
        {
          p_portfolio_item_id: target.album.id,
          p_portfolio_media_id: target.media?.isLegacyFallback
            ? null
            : target.media?.id || null,
          p_reason_code: reasonCode,
          p_explanation: explanation.trim(),
          p_legal_reference: legalReference.trim() || null,
          p_good_faith_confirmed: true,
        }
      );
      if (error) throw error;
      onSubmitted(data);
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się wysłać zgłoszenia."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="portfolio-report-dialog" role="dialog" aria-modal="true" aria-labelledby="portfolio-report-title">
      <button type="button" className="portfolio-report-backdrop" onClick={onClose} aria-label="Zamknij formularz" />
      <form className="portfolio-report-panel" onSubmit={handleSubmit}>
        <header>
          <div>
            <span className="section-label">Zgłoszenie treści</span>
            <h2 id="portfolio-report-title">
              {target.media
                ? "Zgłoś zdjęcie"
                : target.kind === "link"
                ? "Zgłoś link"
                : "Zgłoś album"}
            </h2>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Zamknij formularz">×</button>
        </header>

        <p className="portfolio-report-context">
          {target.kind === "link" ? "Link w projekcie" : "Projekt"}: <strong>{target.album.title}</strong>.
          {target.kind === "link" && target.album.project_url && (
            <> Adres: <span>{getPortfolioLinkLabel(target.album.project_url)}</span>.</>
          )}{" "}
          Zgłoszenie trafi do ręcznej analizy administracji — samo wysłanie nie powoduje automatycznej blokady.
        </p>

        <label>
          Powód zgłoszenia
          <FormSelect value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} disabled={busy}>
            {Object.entries(CONTENT_REPORT_REASON_LABELS).map(([value, label]) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </FormSelect>
        </label>

        <label>
          Dlaczego treść może być nielegalna?
          <AutoTextarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
            minLength={50}
            maxLength={5000}
            rows={6}
            placeholder={target.kind === "link"
              ? "Wskaż, co znajduje się pod linkiem, na czym polega możliwe naruszenie oraz jakiego prawa lub osoby dotyczy."
              : "Wskaż konkretny element zdjęcia lub albumu, okoliczności i osobę albo prawo, którego dotyczy zgłoszenie."}
            disabled={busy}
            required
          />
        </label>

        <label>
          Podstawa prawna — jeśli ją znasz
          <input
            type="text"
            value={legalReference}
            onChange={(event) => setLegalReference(event.target.value)}
            maxLength={1500}
            placeholder="Np. rodzaj prawa autorskiego lub prawa do wizerunku"
            disabled={busy}
          />
        </label>

        <label className="portfolio-report-good-faith">
          <input
            type="checkbox"
            checked={goodFaith}
            onChange={(event) => setGoodFaith(event.target.checked)}
            disabled={busy}
          />
          <span>Działam w dobrej wierze i uważam podane informacje za dokładne i kompletne.</span>
        </label>

        {message && <p className="profile-portfolio-message" role="alert">{message}</p>}

        <div className="portfolio-report-actions">
          <button type="button" className="privacy-secondary-button" onClick={onClose} disabled={busy}>Anuluj</button>
          <button type="submit" className="privacy-primary-button" disabled={busy}>
            {busy ? "Wysyłanie..." : "Wyślij zgłoszenie "}
          </button>
        </div>
      </form>
    </div>
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
        <SubpageHeading eyebrow="Bezpieczeństwo i moderacja" title="Status Twojego konta"
          description="Decyzje administracji, ich uzasadnienia oraz możliwość odwołania."
          variant="status" />

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        {restrictionError && notice && (
          <p className="moderation-status-read-error" role="alert">
            {restrictionError} Wyświetlamy ostatni poprawnie pobrany stan i nie
            odblokowujemy pozostałych funkcji konta.
          </p>
        )}

        {loading ? (
          <InlineRouteLoader
            className="status-route-loader"
            rows={3}
          />
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
                <AutoTextarea
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
  const { user } = useAuth();
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

  return <div className="page limited-account-page ih60-limited-page">
    <AccountNavbar />
    <WorkspaceLimitedHome
      fullAccessLabel={fullAccessLabel}
      ageRestricted={Boolean(location.state?.ageRestricted)}
      settings={<><AccountTemplatesCard /><AccountPrivateDetails key={user?.id} user={user} client={supabase} /></>}
      helpUrl={helpCenterHref()}
      showAssistant={LUCYNA_VISIBLE}
    />
  </div>;
}

/* ACCOUNT */

function AccountTemplatesCard() {
  const { template, setTemplate, theme, setTheme, language } = useSitePreferences();
  const en = language === "en", t = (pl, english) => en ? english : pl;
  const options = [{ value:"current", title:IDEA_HIRE_THEME_IDENTITY[en ? "en" : "pl"].title, description:t("Charakterystyczne kolory IdeaHire.", "IdeaHire’s signature colours.") }, { value:"classic", title:t("Czerń i biel", "Black and white"), description:t("Spokojna, monochromatyczna paleta.", "A quiet, monochrome palette.") }];
  return <div className="ih-studio-stack" data-no-translate="true">
    <section className="ih-studio-panel"><header className="ih-studio-panel-heading"><div><h2>{t("Wybierz paletę", "Choose a palette")}</h2><p>{t("Ten sam interfejs, w Twoich kolorach.", "The same interface in your colours.")}</p></div></header>
      <div className="ih-studio-palettes" role="radiogroup" aria-label={t("Paleta kolorów", "Colour palette")}>{options.map((option,index) => <button type="button" key={option.value} role="radio" aria-checked={template === option.value} tabIndex={template === option.value ? 0 : -1} className={"ih-studio-palette is-" + option.value} onClick={() => setTemplate(option.value)} onKeyDown={event => { if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? options.length-1 : (index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + options.length) % options.length; setTemplate(options[next].value); event.currentTarget.parentElement.children[next]?.focus(); }}><span className="ih-studio-palette-sample" aria-hidden="true"><i/><i/><i/><i/></span><span><strong>{option.title}</strong><small>{option.description}</small></span><span className="ih-studio-radio-mark" aria-hidden="true">{template === option.value && <WorkspaceIcon kind="check" />}</span></button>)}</div>
    </section>
    <section className="ih-studio-panel"><header className="ih-studio-panel-heading"><div><h2>{t("Jasno czy ciemno?", "Light or dark?")}</h2><p>{t("Wybierz wygodne tło do pracy.", "Choose a comfortable background for your work.")}</p></div></header><div className="ih-studio-mode" role="group" aria-label={t("Tryb wyświetlania", "Display mode")}>{[["light",t("Jasny", "Light")],["dark",t("Ciemny", "Dark")]].map(([value,label]) => <button type="button" key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}><span aria-hidden="true" className={"is-"+value}/>{label}{theme === value && <WorkspaceIcon kind="check" />}</button>)}</div><p className="ih-studio-muted">{t("Wybór zapisuje się automatycznie na tym urządzeniu.", "Your choice is saved automatically on this device.")}</p></section>
  </div>;
}

const ACCOUNT_WORKSPACE_SECTIONS = [
  {
    key: "profile",
    english: {"label": "Profile details", "eyebrow": "Public profile", "title": "Edit profile", "description": "Set the photo, name, bio and country shown on your public profile."},
    number: "01",
    label: "Dane profilu",
    hash: "account-profile-data",
    eyebrow: "Profil publiczny",
    title: "Edytuj profil",
    description:
      "Ustaw zdjęcie, nazwę, opis i kraj widoczny dla innych użytkowników.",
  },
  {
    key: "expertise",
    english: {"label": "Expertise", "eyebrow": "Freelancer profile", "title": "Skills", "description": "Choose your fields and describe the experience you bring to projects."},
    number: "02",
    label: "Specjalizacja",
    hash: "account-expertise",
    eyebrow: "Oferta wykonawcy",
    title: "Umiejętności",
    description:
      "Wybierz dziedziny i opisz doświadczenie, z którym chcesz być kojarzony.",
  },
  {
    key: "portfolio",
    english: {"label": "Portfolio", "eyebrow": "Past work", "title": "Portfolio", "description": "Add and organise the work you want clients to see."},
    number: "03",
    label: "Portfolio",
    hash: "account-portfolio",
    eyebrow: "Twoje realizacje",
    title: "Portfolio",
    description:
      "Dodawaj i porządkuj realizacje, które najlepiej pokazują jakość Twojej pracy.",
  },
  {
    key: "jobs",
    english: {"label": "My listings", "eyebrow": "Your listings", "title": "My listings", "description": "Edit your listings, check their visibility and republish expired jobs."},
    number: "04",
    label: "Zlecenia",
    hash: "account-jobs",
    eyebrow: "Twoja aktywność",
    title: "Moje zlecenia",
    description:
      "Edytuj ogłoszenia, sprawdzaj ich widoczność i przywracaj wygasłe zlecenia.",
  },
  {
    key: "preferences",
    english: {"label": "Settings", "eyebrow": "Account and privacy", "title": "Account settings", "description": "Adjust recommendations and open your privacy settings and reports."},
    number: "05",
    label: "Ustawienia",
    hash: "account-preferences",
    eyebrow: "Konto i prywatność",
    title: "Ustawienia konta",
    description:
      "Dopasuj rekomendacje oraz przejdź do ustawień prywatności i swoich zgłoszeń.",
  },
  {
    key: "payouts",
    english: {"label": "Payouts", "eyebrow": "Payments", "title": "Balance and payouts", "description": "Check your Stripe connection, balance and payout history."},
    number: "07",
    label: "Wypłaty",
    hash: "account-payouts",
    eyebrow: "Rozliczenia",
    title: "Saldo i wypłaty",
    description: "Sprawdź połączenie ze Stripe, saldo oraz historię wypłat.",
  },
  {
    key: "templates",
    english: {"label": "Appearance", "eyebrow": "Interface appearance", "title": "Site appearance", "description": "Choose a colour palette for the site. Your content and features stay the same."},
    number: "06",
    label: "Szablony",
    hash: "account-templates",
    eyebrow: "Wygląd interfejsu",
    title: "Wygląd strony",
    description:
      "Przełącz wygląd całej strony bez zmiany obecnego układu, danych i funkcji.",
  },
];

function getAccountWorkspaceSection(hash = "") {
  const normalizedHash = hash.replace(/^#/, "");

  if (normalizedHash === "account-expertise") return "expertise";
  if (normalizedHash === "account-portfolio") return "portfolio";
  if (normalizedHash === "account-jobs") return "jobs";
  if (
    normalizedHash === "account-preferences" ||
    normalizedHash === "account-privacy"
  ) {
    return "preferences";
  }
  if (normalizedHash === "account-templates") return "templates";
  if (normalizedHash === "account-payouts") return "payouts";

  if (normalizedHash === "account-profile-data") return "profile";
  return null;
}



function AccountWorkspaceLanding(props) {
  const inbox = useConversationInbox();
  return <WorkspaceDashboard {...props} inbox={inbox} />;
}

function WorkOverview() {
  const inbox = useConversationInbox();
  return <div className="page ih68-work-root"><AccountNavbar /><WorkspaceWork inbox={inbox} /></div>;
}

function Account() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const { isAdult } = useAgeAccess();
  const accountEnglish = useSitePreferences().language === "en";

  const location = useLocation();
  const navigate = useNavigate();
  const navigateAccountWorkspace = useRouterNavigate();

  const [activeAccountSection, setActiveAccountSection] = useState(() =>
    getAccountWorkspaceSection(location.hash)
  );

  const [accountHubOpen, setAccountHubOpen] = useState(false);
  const [ownedJobSearch, setOwnedJobSearch] = useState("");
  const [ownedJobFilter, setOwnedJobFilter] = useState("all");
  const [renewingJobId, setRenewingJobId] = useState("");
  const [ownedJobMessage, setOwnedJobMessage] = useState("");
  const renewingJobRef = useRef(false);
  const accountContentRef = useRef(null);

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

  const [portfolioItems, setPortfolioItems] =
    useState([]);

  const [portfolioLoading, setPortfolioLoading] =
    useState(true);

  const [portfolioBusy, setPortfolioBusy] =
    useState(false);

  const [portfolioEditingId, setPortfolioEditingId] =
    useState(null);

  const [portfolioFiles, setPortfolioFiles] =
    useState([]);

  const [portfolioRemovedMediaIds, setPortfolioRemovedMediaIds] =
    useState([]);

  const [portfolioMessage, setPortfolioMessage] =
    useState("");

  const [portfolioDraft, setPortfolioDraft] =
    useState({
      title: "",
      description: "",
      projectUrl: "",
    });

  const portfolioFileInputRef = useRef(null);

  const [myContentReports, setMyContentReports] =
    useState([]);

  const [myContentReportAppeals, setMyContentReportAppeals] =
    useState([]);

  const [contentReportBusy, setContentReportBusy] =
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

  const [myJobsSnapshot, setMyJobsSnapshot] = useState({userId:null,jobs:[]});
  const myJobs = myJobsSnapshot.userId === user?.id ? myJobsSnapshot.jobs : [];
  const setMyJobs = useCallback(update => {
    setMyJobsSnapshot(current => ({userId:user?.id,jobs:typeof update === 'function' ? update(current.userId === user?.id ? current.jobs : []) : update}));
  }, [user?.id]);

  const ownedJobsTime = useListingClock(myJobs);

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
    const requestedSection = getAccountWorkspaceSection(location.hash);
    setActiveAccountSection(requestedSection);
    if (requestedSection) setAccountHubOpen(false);
  }, [location.hash]);

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
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        ""
    );

    setAvatarUrl(
      user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
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
              "name, avatar_url, about, specialty_categories, specialization, skills"
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

        if (data) {
          setName(
            data.name ||
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              ""
          );
          setAvatarUrl(
            data.avatar_url || ""
          );
          setAbout(
            data.about || ""
          );
        }

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
    if (!user?.id) {
      setPortfolioItems([]);
      setPortfolioLoading(false);
      return;
    }

    let mounted = true;

    async function loadPortfolio() {
      setPortfolioLoading(true);

      try {
        const data = await fetchPortfolioAlbums(user.id);
        if (!mounted) return;

        setPortfolioItems(data);
        setPortfolioMessage("");
      } catch (error) {
        console.error("PORTFOLIO LOAD ERROR:", error);

        if (mounted) {
          setPortfolioItems([]);
          setPortfolioMessage(
            "Nie udało się pobrać portfolio. Odśwież stronę i spróbuj ponownie."
          );
        }
      } finally {
        if (mounted) {
          setPortfolioLoading(false);
        }
      }
    }

    loadPortfolio();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setMyContentReports([]);
      setMyContentReportAppeals([]);
      return;
    }

    let mounted = true;

    async function loadMyContentReports() {
      const [reportsResult, appealsResult] = await Promise.all([
        supabase
          .from("ideahire_content_reports")
          .select("id, report_number, content_type, reason_code, status, content_snapshot, decision_summary, submitted_at, reviewed_at")
          .eq("reporter_user_id", user.id)
          .order("submitted_at", { ascending: false })
          .limit(30),
        supabase
          .from("ideahire_content_report_appeals")
          .select("id, report_id, status, statement, resolution_reason, submitted_at, resolved_at")
          .eq("appellant_user_id", user.id)
          .order("submitted_at", { ascending: false }),
      ]);

      if (!mounted) return;
      if (reportsResult.error || appealsResult.error) {
        console.error(
          "CONTENT REPORT HISTORY ERROR:",
          reportsResult.error || appealsResult.error
        );
        return;
      }

      setMyContentReports(reportsResult.data || []);
      setMyContentReportAppeals(appealsResult.data || []);
    }

    loadMyContentReports();

    const channel = supabase
      .channel(`my-content-reports-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_content_reports",
          filter: `reporter_user_id=eq.${user.id}`,
        },
        loadMyContentReports
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ideahire_content_report_appeals",
          filter: `appellant_user_id=eq.${user.id}`,
        },
        loadMyContentReports
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) { setMyJobs([]); return; }
    let live = true, sequence = 0;
    async function loadMyJobs() {
      const request = ++sequence;
      setJobsLoading(true);
      try {
        const [listings, states] = await Promise.all([
          supabase.from("jobs").select("id,user_id,title,description,category,subcategory,budget,budget_negotiable,listing_duration_days,expires_at,created_at,visibility,source_type,listing_stage,assigned_at").eq("user_id",user.id).eq("source_type","client_posted").order("created_at",{ascending:false}),
          supabase.rpc("ideahire_my_job_listing_states"),
        ]);
        if (!live || request !== sequence) return;
        if (listings.error) throw listings.error;
        const stages = new Map((!states.error && Array.isArray(states.data) ? states.data : []).map(item=>[item.job_id,item.workspace_stage]));
        setMyJobs((listings.data || []).map(job=>({...job,workspace_stage:stages.get(job.id)})));
        if (states.error) setOwnedJobMessage(accountEnglish ? "The archive status could not be refreshed. Check settlement details in your collaboration." : "Nie udało się odświeżyć stanu archiwum. Rozliczenie sprawdzisz we współpracy.");
      } catch {
        if (live && request === sequence) setOwnedJobMessage(accountEnglish ? "Your listings could not be loaded. Refresh the page." : "Nie udało się pobrać ogłoszeń. Odśwież widok.");
      } finally { if (live && request === sequence) setJobsLoading(false); }
    }
    void loadMyJobs();
    const refresh = () => { if (document.visibilityState !== 'hidden') void loadMyJobs(); };
    window.addEventListener('focus',refresh);
    window.addEventListener('ideahire:payment-updated',refresh);
    const channel = supabase.channel(`owned-listing-state-${user.id}`).on('postgres_changes',{event:'*',schema:'public',table:'jobs',filter:`user_id=eq.${user.id}`},refresh).subscribe();
    return () => { live=false;sequence++;window.removeEventListener('focus',refresh);window.removeEventListener('ideahire:payment-updated',refresh);supabase.removeChannel(channel); };
  }, [user?.id, activeAccountSection, accountEnglish]);

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
    setActiveAccountSection("payouts");

    handleConnectOnboarding({
      redirectToStripe: returnMode === "refresh",
      returningFromStripe: true,
    }).finally(() => {
      if (returnMode === "return") {
        navigate("/account#account-payouts", {
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
        error: profileError,
      } = await supabase.rpc(
        "save_my_ideahire_profile_avatar",
        {
          p_avatar_url: publicUrl,
        }
      );

      if (profileError) {
        console.error(
          "PROFILE AVATAR UPDATE ERROR:",
          profileError
        );

        const { error: cleanupError } =
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

        if (cleanupError) {
          console.error(
            "PROFILE AVATAR CLEANUP ERROR:",
            cleanupError
          );
        }

        setMessage(
          `Nie udało się trwale zapisać zdjęcia profilowego: ${profileError.message}`
        );

        return;
      }

      const {
        data: updatedUser,
        error: metadataError,
      } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (metadataError) {
        console.error(
          "PROFILE AVATAR AUTH METADATA ERROR:",
          metadataError
        );
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

  async function handleRenewJob(job) {
    if (renewingJobRef.current || ownedJobState(job) !== "expired") return;
    renewingJobRef.current = true;
    setRenewingJobId(job.id);
    setOwnedJobMessage("");
    try {
      const { data, error } = await supabase.rpc("renew_my_ideahire_job", { p_job_id: job.id });
      if (error) throw error;
      if (!data?.job?.id) throw new Error(accountEnglish ? "Publication was not confirmed. Refresh the page." : "Nie potwierdzono publikacji. Odśwież widok.");
      setMyJobs(current => current.map(item => item.id === job.id ? { ...item, ...data.job } : item));
      setOwnedJobFilter("active");
      setOwnedJobMessage(accountEnglish ? "Published again. The listing is visible on the board and your profile." : "Opublikowano ponownie. Ogłoszenie jest widoczne na tablicy i Twoim profilu.");
    } catch (error) {
      setOwnedJobMessage(error?.message || (accountEnglish ? "The listing could not be published again." : "Nie udało się ponownie opublikować ogłoszenia."));
    } finally {
      renewingJobRef.current = false;
      setRenewingJobId("");
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

  function resetPortfolioEditor() {
    setPortfolioEditingId(null);
    setPortfolioFiles([]);
    setPortfolioRemovedMediaIds([]);
    setPortfolioDraft({
      title: "",
      description: "",
      projectUrl: "",
    });

    if (portfolioFileInputRef.current) {
      portfolioFileInputRef.current.value = "";
    }
  }

  function handlePortfolioFileChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    setPortfolioMessage("");

    if (selectedFiles.some((file) => !file.type.startsWith("image/"))) {
      setPortfolioMessage("Wybierz zdjęcia w formacie JPG, PNG lub WEBP.");
      event.target.value = "";
      return;
    }

    if (selectedFiles.some((file) => file.size > 12 * 1024 * 1024)) {
      setPortfolioMessage("Każde zdjęcie portfolio może mieć maksymalnie 12 MB.");
      event.target.value = "";
      return;
    }

    const existingItem = portfolioEditingId
      ? portfolioItems.find((item) => item.id === portfolioEditingId)
      : null;
    const keptExistingCount = getPortfolioMedia(existingItem).filter(
      (mediaItem) => !portfolioRemovedMediaIds.includes(mediaItem.id)
    ).length;

    if (
      keptExistingCount + portfolioFiles.length + selectedFiles.length
      > MAX_PORTFOLIO_ALBUM_IMAGES
    ) {
      setPortfolioMessage(
        `Jeden album może zawierać maksymalnie ${MAX_PORTFOLIO_ALBUM_IMAGES} zdjęć.`
      );
      event.target.value = "";
      return;
    }

    setPortfolioFiles((current) => [...current, ...selectedFiles]);
    event.target.value = "";
  }

  function startPortfolioEdit(item) {
    setPortfolioEditingId(item.id);
    setPortfolioFiles([]);
    setPortfolioRemovedMediaIds([]);
    setPortfolioMessage("");
    setPortfolioDraft({
      title: item.title || "",
      description: item.description || "",
      projectUrl: item.project_url || "",
    });

    if (portfolioFileInputRef.current) {
      portfolioFileInputRef.current.value = "";
    }
  }

  async function handlePortfolioSubmit(event) {
    event.preventDefault();

    if (!user?.id || portfolioBusy) return;

    const cleanTitle = portfolioDraft.title.trim().replace(/\s+/g, " ");
    const cleanDescription = portfolioDraft.description.trim();
    const existingItem = portfolioEditingId
      ? portfolioItems.find((item) => item.id === portfolioEditingId)
      : null;

    if (cleanTitle.length < 3) {
      setPortfolioMessage("Tytuł projektu musi mieć co najmniej 3 znaki.");
      return;
    }

    if (cleanTitle.length > 120) {
      setPortfolioMessage("Tytuł projektu może mieć maksymalnie 120 znaków.");
      return;
    }

    if (cleanDescription.length > 800) {
      setPortfolioMessage("Opis projektu może mieć maksymalnie 800 znaków.");
      return;
    }

    let cleanProjectUrl = null;

    try {
      cleanProjectUrl = normalizePortfolioUrl(portfolioDraft.projectUrl);
    } catch (error) {
      setPortfolioMessage(error.message);
      return;
    }

    const existingMedia = getPortfolioMedia(existingItem);
    const keptMedia = existingMedia.filter(
      (mediaItem) => !portfolioRemovedMediaIds.includes(mediaItem.id)
    );

    if (!cleanProjectUrl && keptMedia.length === 0 && portfolioFiles.length === 0) {
      setPortfolioMessage("Dodaj link do projektu albo co najmniej jedno zdjęcie realizacji.");
      return;
    }

    if (!existingItem && portfolioItems.length >= MAX_PORTFOLIO_ITEMS) {
      setPortfolioMessage(
        `Portfolio może zawierać maksymalnie ${MAX_PORTFOLIO_ITEMS} projektów.`
      );
      return;
    }

    setPortfolioBusy(true);
    setPortfolioMessage("");

    const uploadedMedia = [];

    try {
      for (const file of portfolioFiles) {
        const convertedFile = await resizePortfolioImage(file);
        const uniquePart = typeof crypto?.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const uploadedImagePath = `${user.id}/portfolio/project-${uniquePart}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(uploadedImagePath, convertedFile, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(uploadedImagePath);

        if (!publicUrlData?.publicUrl) {
          throw new Error("Nie udało się pobrać adresu zdjęcia portfolio.");
        }

        uploadedMedia.push({
          image_path: uploadedImagePath,
          image_url: publicUrlData.publicUrl,
          alt_text: cleanTitle,
        });
      }

      const mediaPayload = [
        ...keptMedia.map((mediaItem) => ({
          image_path: mediaItem.image_path,
          image_url: mediaItem.image_url,
          alt_text: cleanTitle,
        })),
        ...uploadedMedia,
      ];

      const { error } = await supabase.rpc(
        "save_my_ideahire_portfolio_album",
        {
          p_item_id: existingItem?.id || null,
          p_title: cleanTitle,
          p_description: cleanDescription || null,
          p_project_url: cleanProjectUrl,
          p_media: mediaPayload,
        }
      );

      if (error) throw error;

      const pathsToRemove = existingMedia
        .filter((mediaItem) => portfolioRemovedMediaIds.includes(mediaItem.id))
        .map((mediaItem) => mediaItem.image_path)
        .filter(Boolean);

      if (pathsToRemove.length > 0) {
        const { error: oldImageError } = await supabase.storage
          .from("avatars")
          .remove([...new Set(pathsToRemove)]);

        if (oldImageError) {
          console.error("PORTFOLIO OLD IMAGES DELETE ERROR:", oldImageError);
        }
      }

      setPortfolioItems(await fetchPortfolioAlbums(user.id));

      resetPortfolioEditor();
      setPortfolioMessage(
        existingItem
          ? "Projekt w portfolio został zaktualizowany."
          : "Projekt został dodany do portfolio."
      );
    } catch (error) {
      console.error("PORTFOLIO SAVE ERROR:", error);

      if (uploadedMedia.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("avatars")
          .remove(uploadedMedia.map((mediaItem) => mediaItem.image_path));

        if (cleanupError) {
          console.error("PORTFOLIO UPLOAD CLEANUP ERROR:", cleanupError);
        }
      }

      setPortfolioMessage(
        `Nie udało się zapisać projektu w portfolio: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setPortfolioBusy(false);
    }
  }

  function toggleExistingPortfolioMedia(mediaId) {
    setPortfolioRemovedMediaIds((current) =>
      current.includes(mediaId)
        ? current.filter((id) => id !== mediaId)
        : [...current, mediaId]
    );
  }

  function removePendingPortfolioFile(indexToRemove) {
    setPortfolioFiles((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

  async function handlePortfolioDelete(item) {
    if (!user?.id || portfolioBusy) return;

    const confirmed = window.confirm(
      `Usunąć projekt „${item.title}” z portfolio?`
    );

    if (!confirmed) return;

    setPortfolioBusy(true);
    setPortfolioMessage("");

    try {
      const imagePaths = getPortfolioMedia(item)
        .map((mediaItem) => mediaItem.image_path)
        .filter(Boolean);

      const { error } = await supabase
        .from("ideahire_portfolio_items")
        .delete()
        .eq("id", item.id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPortfolioItems((current) =>
        current.filter((portfolioItem) => portfolioItem.id !== item.id)
      );

      if (imagePaths.length > 0) {
        const { error: imageError } = await supabase.storage
          .from("avatars")
          .remove([...new Set(imagePaths)]);

        if (imageError) {
          console.error("PORTFOLIO IMAGE DELETE ERROR:", imageError);
        }
      }

      if (portfolioEditingId === item.id) {
        resetPortfolioEditor();
      }

      setPortfolioMessage("Projekt został usunięty z portfolio.");
    } catch (error) {
      setPortfolioMessage(
        `Nie udało się usunąć projektu z portfolio: ${
          error?.message || "Nieznany błąd"
        }`
      );
    } finally {
      setPortfolioBusy(false);
    }
  }

  async function handleContentReportAppeal(report) {
    if (contentReportBusy) return;

    const statement = window.prompt(
      "Wyjaśnij, dlaczego zgłoszenie powinno zostać przeanalizowane ponownie (minimum 30 znaków):"
    );

    if (!statement) return;
    if (statement.trim().length < 30) {
      setPortfolioMessage("Uzasadnienie odwołania musi mieć co najmniej 30 znaków.");
      return;
    }

    setContentReportBusy(report.id);
    setPortfolioMessage("");

    try {
      const { error } = await supabase.rpc(
        "submit_my_ideahire_content_report_appeal",
        {
          p_report_id: report.id,
          p_statement: statement.trim(),
        }
      );
      if (error) throw error;

      const { data: appeals, error: appealsError } = await supabase
        .from("ideahire_content_report_appeals")
        .select("id, report_id, status, statement, resolution_reason, submitted_at, resolved_at")
        .eq("appellant_user_id", user.id)
        .order("submitted_at", { ascending: false });
      if (appealsError) throw appealsError;

      setMyContentReportAppeals(appeals || []);
      setPortfolioMessage("Odwołanie zostało zapisane i przekazane do ponownej analizy.");
    } catch (error) {
      setPortfolioMessage(cleanSupabaseError(
        error,
        "Nie udało się złożyć odwołania."
      ));
    } finally {
      setContentReportBusy("");
    }
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

  const selectedAccountSectionCopy =
    ACCOUNT_WORKSPACE_SECTIONS.find(
      (section) => section.key === activeAccountSection
    ) || ACCOUNT_WORKSPACE_SECTIONS[0];
  const activeAccountSectionCopy = accountEnglish
    ? { ...selectedAccountSectionCopy, ...selectedAccountSectionCopy.english }
    : selectedAccountSectionCopy;

  const ownedJobLabels = accountEnglish
    ? {all:"All listings",active:"Open",expired:"Expired",assigned:"Private collaborations",archived:"Archived",hidden:"Hidden"}
    : {all:"Wszystkie ogłoszenia",active:"Otwarte",expired:"Wygasłe",assigned:"Prywatne współprace",archived:"Archiwum",hidden:"Ukryte"};
  const ownedJobCounts = myJobs.reduce((counts, job) => {
    counts[ownedJobState(job,ownedJobsTime)] += 1; return counts;
  }, {all:myJobs.length,active:0,expired:0,assigned:0,archived:0,hidden:0});
  const ownedJobQuery = ownedJobSearch.trim().toLocaleLowerCase(accountEnglish ? "en-GB" : "pl-PL");
  const visibleOwnedJobs = myJobs.filter(job => {
    const state = ownedJobState(job,ownedJobsTime);
    const text = [job.title,job.description,getJobCategoryLabel(job.category)].filter(Boolean).join(" ").toLocaleLowerCase(accountEnglish ? "en-GB" : "pl-PL");
    return (ownedJobFilter === "all" || state === ownedJobFilter) && (!ownedJobQuery || text.includes(ownedJobQuery));
  });

  function openAccountSection(section) {
    if (!section) return;
    setAccountHubOpen(false);
    setActiveAccountSection(section.key);
    navigateAccountWorkspace(
      {
        pathname: location.pathname,
        search: location.search,
        hash: `#${section.hash}`,
      },
      { replace: false }
    );
    window.requestAnimationFrame(() => {
      document.getElementById("account-section-title")?.focus({ preventScroll: true });
      accountContentRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }

  function returnToAccountHub() {
    setAccountHubOpen(true);
    navigateAccountWorkspace({ pathname: location.pathname, search: location.search, hash: "" }, { replace: true });
    window.requestAnimationFrame(() => {
      const trigger = document.getElementById("ih68-home-title");
      trigger?.focus({ preventScroll: true });
      trigger?.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    });
  }

  return (
    <div className="page ih6-account-page ih25-account-page">
      <AccountNavbar />

      <main
        className={activeAccountSection && !accountHubOpen ? "ih-studio-page" : "app-page account-workspace-page ih6-account-workspace"}
        id="ih68-content"
        data-interface-release="studio-20261027"
        data-account-section={activeAccountSection || "home"}
      >
        {!activeAccountSection || accountHubOpen ? (
          <AccountWorkspaceLanding name={displayName} avatarUrl={avatarUrl} about={about}
            specialtyCount={specialtyCategories.length} portfolioCount={portfolioItems.length}
            jobCount={myJobs.length} jobsLoading={jobsLoading}
            sections={ACCOUNT_WORKSPACE_SECTIONS} onSelect={openAccountSection} />
        ) : (
          null
        )}

        <div className="ih-studio-shell" id="profile-studio" ref={accountContentRef} tabIndex={-1} hidden={!activeAccountSection || accountHubOpen} inert={!activeAccountSection || accountHubOpen ? "" : undefined}>
          <StudioNavigation sections={ACCOUNT_WORKSPACE_SECTIONS} active={activeAccountSection} onSelect={openAccountSection} name={displayName} avatarUrl={avatarUrl} en={accountEnglish} />
          <div className="ih-studio-main">
        <StudioHeading en={accountEnglish}
          title={activeAccountSectionCopy.title} description={activeAccountSectionCopy.description}
          actions={activeAccountSection === "jobs" ? <Link to="/find-talent" className="ih-studio-button is-primary"><MarketIcon kind="plus" />{accountEnglish ? "Post a job" : "Dodaj zlecenie"}</Link> : undefined} />

        <div
          className="ih-studio-stage"
          id="account-tab-panel"
          role="region"
          aria-labelledby="account-section-title"
          tabIndex="0"
          key={activeAccountSection}
        >

        <section
          className="ih-studio-profile-content"
          hidden={
            activeAccountSection === "jobs" ||
            activeAccountSection === "preferences" ||
            activeAccountSection === "templates"
          }
        >
          {activeAccountSection === "profile" && <ProfileDetailsEditor
            name={name} onName={setName} avatarUrl={avatarUrl} onAvatar={handleAvatarChange}
            about={about} onAbout={setAbout} email={user.email || ""}
            countryLabel={getCountryByCode(countryCode)?.name}
            countryField={<CountryPicker value={countryCode} onChange={country => setCountryCode(country?.code || "")} disabled={saving || uploading || countryLoading || profileDetailsLoading} />}
            onSubmit={handleSave} saving={saving} uploading={uploading} loading={profileDetailsLoading || countryLoading}
            message={message} en={accountEnglish} />}
          {activeAccountSection === "expertise" && <ExpertiseEditor
            categories={JOB_CATEGORIES} selected={specialtyCategories} onCategory={toggleSpecialtyCategory}
            categoryLabel={category => accountEnglish ? translateUiText(getJobCategoryLabel(category)) : getJobCategoryLabel(category)}
            skills={skills} draft={skillDraft} onDraft={setSkillDraft} onKeyDown={handleSkillKeyDown} onAdd={addSkill} onRemove={removeSkill}
            specialization={specialization} onSpecialization={setSpecialization} onSubmit={handleSave}
            saving={saving} uploading={uploading} loading={profileDetailsLoading || countryLoading} message={message}
            name={name} avatarUrl={avatarUrl} en={accountEnglish} />}

          {isAdult && activeAccountSection === "payouts" && (
            <StripeAccountPayouts
              client={supabase}
              userId={user.id}
              onConfigure={() => handleConnectOnboarding()}
              onStatusChange={setConnectStatus}
            >
            <section
              className={`stripe-connect-panel is-${connectStatus}`}
              aria-labelledby="stripe-connect-title"
            >
              <a className="stripe-connect-icon ih5-stripe-brand" href="https://stripe.com" target="_blank" rel="noopener noreferrer" aria-label="Stripe — operator wypłat">
                <img className="ih-stripe-wordmark-light" src="/brand/stripe-wordmark.svg" alt="Stripe" width="80" height="34" /><img className="ih-stripe-wordmark-dark" src="/brand/stripe-wordmark-white.svg" alt="Stripe" width="80" height="34" />
              </a>

              <div className="stripe-connect-content">
                <div className="stripe-connect-heading">
                  <div>
                    <span className="stripe-connect-eyebrow">
                      Wypłaty dla wykonawcy
                    </span>

                    <h2 id="stripe-connect-title">
                      Połączenie ze Stripe
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
                  {connectStatus !== "ready" && <button
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
                        <span aria-hidden="true"></span>
                      )}
                  </button>}

                  <small>
                    {connectStatus === "ready"
                      ? "Wypłaty są skonfigurowane. Dane rachunku są obsługiwane przez Stripe."
                      : "Formularz otworzy się na stronie Stripe. IdeaHire nie przechowuje danych Twojego rachunku bankowego."}
                  </small>
                </div>
              </div>
            </section>
            </StripeAccountPayouts>
          )}

          {activeAccountSection === "profile" && (
            <FreelancerVisibility supabase={supabase} user={user} canContact={isAdult} />
          )}



          {activeAccountSection === "portfolio" && <PortfolioStudio
            items={portfolioItems} loading={portfolioLoading} busy={portfolioBusy} editingId={portfolioEditingId}
            draft={portfolioDraft} onDraft={setPortfolioDraft} files={portfolioFiles} removedIds={portfolioRemovedMediaIds}
            maxItems={MAX_PORTFOLIO_ITEMS} maxImages={MAX_PORTFOLIO_ALBUM_IMAGES} mediaFor={getPortfolioMedia}
            onEdit={startPortfolioEdit} onDelete={handlePortfolioDelete} onReset={() => { resetPortfolioEditor(); setPortfolioMessage(""); }}
            onSubmit={handlePortfolioSubmit} onFiles={handlePortfolioFileChange} onRemoveFile={removePendingPortfolioFile}
            onToggleMedia={toggleExistingPortfolioMedia} fileInputRef={portfolioFileInputRef} message={portfolioMessage} en={accountEnglish} />}

        </section>

        <div
          className="account-dashboard-block"
          id="account-preferences"
          hidden={activeAccountSection !== "preferences"}
        >
          <DiscoveryPreferencesCard />
          {activeAccountSection === "preferences" && <AccountPrivateDetails key={user.id} user={user} client={supabase} />}
        </div>

        <div
          className="account-dashboard-block account-templates-block"
          id="account-templates"
          hidden={activeAccountSection !== "templates"}
        >
          <AccountTemplatesCard />
        </div>

        <section
          className="privacy-entry-card"
          id="account-privacy"
          aria-labelledby="privacy-entry-title"
          hidden={activeAccountSection !== "preferences"}
        >
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
            Otwórz centrum prywatności 
          </Link>
        </section>

        {myContentReports.length > 0 && (
          <section
            className="account-card profile-content-report-history"
            aria-labelledby="my-content-reports-title"
            hidden={activeAccountSection !== "preferences"}
          >
            <div className="profile-content-report-history-heading">
              <div>
                <span className="section-label">Bezpieczeństwo treści</span>
                <h2 id="my-content-reports-title">Moje zgłoszenia portfolio</h2>
              </div>
              <span>{myContentReports.length}</span>
            </div>

            <div className="profile-content-report-list">
              {myContentReports.map((report) => {
                const reportAppeal = myContentReportAppeals.find(
                  (appeal) => appeal.report_id === report.id
                );
                const canAppeal = report.status === "resolved_no_action"
                  && !reportAppeal;

                return (
                  <article key={report.id}>
                    <div>
                      <strong>{report.content_snapshot?.title || "Zgłoszona treść portfolio"}</strong>
                      <small>{report.report_number} · {formatDisputeDate(report.submitted_at)}</small>
                    </div>
                    <span className={`content-report-status is-${report.status}`}>
                      {CONTENT_REPORT_STATUS_LABELS[report.status] || report.status}
                    </span>
                    <p>{CONTENT_REPORT_REASON_LABELS[report.reason_code] || report.reason_code}</p>
                    {report.decision_summary && (
                      <div className="profile-content-report-decision">
                        <strong>Wynik analizy</strong>
                        <p>{report.decision_summary}</p>
                      </div>
                    )}
                    {reportAppeal ? (
                      <small className="profile-content-report-appeal-status">
                        Odwołanie: {reportAppeal.status === "submitted"
                          ? "oczekuje na ponowną analizę"
                          : reportAppeal.status === "accepted"
                          ? "uwzględnione"
                          : "oddalone"}
                        {reportAppeal.resolution_reason
                          ? ` — ${reportAppeal.resolution_reason}`
                          : ""}
                      </small>
                    ) : canAppeal ? (
                      <button
                        type="button"
                        className="privacy-secondary-button"
                        onClick={() => handleContentReportAppeal(report)}
                        disabled={Boolean(contentReportBusy)}
                      >
                        {contentReportBusy === report.id
                          ? "Wysyłanie..."
                          : "Poproś o ponowną analizę"}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="ih75-owned-register" id="account-jobs" hidden={activeAccountSection !== "jobs"} aria-label={accountEnglish ? "Your job listings" : "Twoje ogłoszenia"}>
          <div className="ih75-register-toolbar">
            <div className="ih-owned-stage-filter"><FormSelect aria-label={accountEnglish ? "Listing status" : "Status ogłoszenia"} value={ownedJobFilter} onChange={event=>setOwnedJobFilter(event.target.value)}>{Object.entries(ownedJobLabels).filter(([key])=>key!=='hidden'||ownedJobCounts.hidden>0).map(([value,label])=><option key={value} value={value}>{label} · {ownedJobCounts[value]}</option>)}</FormSelect></div>
            <label className="ih75-register-search"><MarketIcon kind="search" /><span className="ih5-sr-only">{accountEnglish ? "Search your listings" : "Szukaj w swoich ogłoszeniach"}</span><input type="search" value={ownedJobSearch} onChange={event => setOwnedJobSearch(event.target.value)} maxLength={160} placeholder={accountEnglish ? "Search listings" : "Szukaj ogłoszenia"} />{ownedJobSearch && <button type="button" aria-label={accountEnglish ? "Clear search" : "Wyczyść wyszukiwanie"} onClick={() => setOwnedJobSearch("")}><MarketIcon kind="close" /></button>}</label>
          </div>
          {ownedJobMessage && <p className="ih-owned-feedback" role="status">{ownedJobMessage}</p>}
          {jobsLoading ? <InlineRouteLoader className="embedded-route-loader" rows={3} /> : myJobs.length === 0 ? (
            <OwnedListingsEmpty title={accountEnglish ? "Your first listing starts here" : "Miejsce na Twoje pierwsze zlecenie"}
              description={accountEnglish ? "Describe the work, set the scope and invite freelancers to reply." : "Opisz pracę, określ zakres i zaproś wykonawców do rozmowy."}
              to="/find-talent" action={accountEnglish ? "Post a job" : "Dodaj zlecenie"} />
          ) : <>
            <p className="ih-studio-sr" role="status" aria-live="polite">{accountEnglish ? "Showing " : "Wyświetlasz "}<strong>{visibleOwnedJobs.length}</strong>{accountEnglish ? " of " : " z "}{myJobs.length}{accountEnglish ? " listings" : " ogłoszeń"}</p>
            <div className="ih75-owned-list">
              {visibleOwnedJobs.map(job => {
                const expiry = getJobExpiryInfo(job.expires_at,ownedJobsTime);
                const state = ownedJobState(job,ownedJobsTime);
                const bound = state === 'assigned' || state === 'archived';
                const note = bound ? (state === 'archived'
                  ? (accountEnglish ? "Settlement is complete. The listing stays outside the catalogue; terms and records remain in your private collaboration." : "Rozliczenie zakończone. Ogłoszenie pozostaje poza katalogiem, a ustalenia i dokumentacja w prywatnej współpracy.")
                  : (accountEnglish ? "A freelancer has been selected. This listing is private; continue with the terms, work and payment in your collaboration." : "Wybrano wykonawcę. Ogłoszenie jest prywatne. Ustalenia, pracę i płatność znajdziesz we współpracy."))
                  : state === 'hidden' ? (accountEnglish ? "This listing is not public." : "To ogłoszenie nie jest publiczne.")
                  : expiry.expired ? (accountEnglish ? "This listing has expired. Publish it again to restore it to the catalogue." : "Ogłoszenie wygasło. Opublikuj je ponownie, aby przywrócić je do katalogu.")
                  : (accountEnglish ? translateUiText(expiry.label) : expiry.label);
                return <OwnedListingCard key={job.id} title={job.title}
                  category={accountEnglish ? translateUiText(getJobCategoryLabel(job.category)) : getJobCategoryLabel(job.category)}
                  description={job.description} status={ownedJobLabels[state]} inactive={state !== 'active'}
                  price={Number(job.budget || 0).toLocaleString(accountEnglish ? "en-GB" : "pl-PL") + " zł"}
                  detail={job.budget_negotiable ? (accountEnglish ? "Negotiable" : "Do negocjacji") : (accountEnglish ? "Fixed price" : "Cena ustalona")}
                  note={note} busy={renewingJobId === job.id}
                  actions={bound ? <><Link to={`/work?q=${encodeURIComponent(job.title || '')}`}>{accountEnglish ? "Open collaboration" : "Współpraca"}<MarketIcon kind="arrow"/></Link><Link to={`/edit-job/${job.id}`}>{accountEnglish ? "Original brief" : "Opis zlecenia"}<MarketIcon kind="arrow"/></Link></> : <>
                    {state === 'expired' && <button type="button" className="is-primary" disabled={Boolean(renewingJobId)} onClick={()=>handleRenewJob(job)}>{renewingJobId === job.id ? (accountEnglish ? "Publishing…" : "Publikowanie…") : (accountEnglish ? "Publish again" : "Opublikuj ponownie")}</button>}
                    <Link to={`/edit-job/${job.id}`}>{accountEnglish ? "Edit" : "Edytuj"}<MarketIcon kind="arrow"/></Link>
                    <button type="button" disabled={Boolean(renewingJobId)} onClick={()=>handleDeleteJob(job.id)}>{accountEnglish ? "Delete" : "Usuń"}</button>
                  </>}/>;
              })}
              {visibleOwnedJobs.length === 0 && <div className="ih75-owned-empty"><span className="ih-owned-empty-mark" aria-hidden="true"><MarketIcon kind="search" /></span><h2>{accountEnglish ? "No listings in this view" : "Brak ogłoszeń w tym widoku"}</h2><p>{accountEnglish ? "Change the search or select another status." : "Zmień wyszukiwanie lub wybierz inny status."}</p><button type="button" className="ih5-button is-quiet" onClick={() => { setOwnedJobSearch(""); setOwnedJobFilter("all"); }}>{accountEnglish ? "Show all listings" : "Pokaż wszystkie ogłoszenia"}</button></div>}
            </div>
          </>}
        </section>

        <div
          className="account-jobs-republication"
          hidden={activeAccountSection !== "jobs"}
        >
          {activeAccountSection === "jobs" && <JobRepublicationPanel />}
        </div>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* PRIVACY CENTER — USER */

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
  minimize_data: "Wyczyść dane, zachowaj konto",
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
  ...ERASURE_RETAINED_LABELS,
  private_profile_rows: "Prywatny profil",
  public_profile_rows: "Profil publiczny",
  avatar_objects: "Zdjęcia profilu i portfolio",
  portfolio_items: "Projekty w portfolio",
  portfolio_images: "Zdjęcia projektów w portfolio",
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
  auth_optional_metadata_removed: "Wyczyszczone opcjonalne dane konta",
  private_work_objects_removed: "Usunięte niepowiązane pliki",
  portfolio_items_deleted: "Usunięte projekty portfolio",
  portfolio_images_deleted: "Usunięte wpisy zdjęć portfolio",
  discovery_preferences_deleted: "Usunięte preferencje dopasowań",
  onboarding_profiles_deleted: "Usunięte odpowiedzi na start",
  lucyna_preferences_deleted: "Usunięte ustawienia Lucyny",
  lucyna_threads_deleted: "Usunięte rozmowy z Lucyną",
  profile_discovery_deleted: "Usunięte ustawienia widoczności",
  services_deleted: "Usunięte niepowiązane oferty usług",
  services_paused: "Wstrzymane aktywne oferty usług",
  avatar_objects_removed: "Usunięte pliki zdjęć profilu i portfolio",
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
    ...Object.fromEntries(Object.keys(ERASURE_EXECUTION_RESULT_LABELS).map(key=>[key,dataResult[key] ?? executionResult[key]])),
    auth_optional_metadata_removed:
      executionResult.auth_optional_metadata_removed ?? (executionResult.auth_user_metadata_cleared ? 1 : undefined),
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
  const { requests, eventsByRequest, reportsByRequest, loading, busy, historyError, historyRefreshing, notices, refresh, mutate, clearNotice } = usePrivacyRequests(supabase, user?.id);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [formProblem, setFormProblem] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [erasureEligibility, setErasureEligibility] = useState(null);
  const [erasureEligibilityLoading, setErasureEligibilityLoading] = useState(false);
  const [erasureEligibilityError, setErasureEligibilityError] = useState("");
  const [erasureEligibilityRefresh, setErasureEligibilityRefresh] = useState(0);
  const [form, setForm] = useState({ requestType: "access", preferredFormat: "electronic", description: "", requestedErasureAction: "" });
  const ownerRef = useRef(user?.id);
  ownerRef.current = user?.id;

  useEffect(() => {
    setReceipt(null);
    setReplyDrafts({});
    setFormProblem(null);
    setForm({ requestType: "access", preferredFormat: "electronic", description: "", requestedErasureAction: "" });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || form.requestType !== "erasure") {
      setErasureEligibility(null);
      setErasureEligibilityError("");
      setErasureEligibilityLoading(false);
      return;
    }
    let mounted = true;
    const controller = new AbortController();
    setErasureEligibility(null);
    setErasureEligibilityLoading(true);
    setErasureEligibilityError("");
    privacyCall(signal => supabase.rpc("get_my_ideahire_erasure_eligibility").abortSignal(signal), { signal: controller.signal })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) throw error;
        setErasureEligibility(data || null);
        if (!data?.can_close_account) setForm(current => current.requestedErasureAction === "close_account" ? { ...current, requestedErasureAction: "" } : current);
      })
      .catch(() => { if (mounted) setErasureEligibilityError("Nie udało się teraz sprawdzić warunków zamknięcia konta."); })
      .finally(() => { if (mounted) setErasureEligibilityLoading(false); });
    return () => { mounted = false; controller.abort(); };
  }, [user?.id, form.requestType, erasureEligibilityRefresh]);

  function changeForm(patch) {
    setForm(current => ({ ...current, ...patch }));
    setFormProblem(null);
    clearNotice("form");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    const problem = privacyDraftProblem(form, canSelectAccountClosure);
    setFormProblem(problem);
    if (problem) {
      document.getElementById(problem.field)?.focus();
      return;
    }
    const owner = user?.id;
    const submitted = { ...form };
    const result = await mutate({ key: "submit", rpc: "submit_ideahire_privacy_request", args: {
      p_request_type: submitted.requestType,
      p_description: submitted.description.trim(),
      p_preferred_format: submitted.preferredFormat,
      p_requested_erasure_action: submitted.requestType === "erasure" ? submitted.requestedErasureAction : null,
    }, success: "Wniosek został wysłany.", failure: "Nie udało się wysłać wniosku." });
    if (result.ok && ownerRef.current === owner) setReceipt({ id: result.data, requestType: submitted.requestType, ownerId: owner });
  }

  async function handleWithdraw(requestId) {
    if (busy || !window.confirm("Czy na pewno chcesz wycofać ten wniosek? Historia jego obsługi pozostanie zapisana.")) return;
    await mutate({ key: requestId, scope: requestId, rpc: "withdraw_my_ideahire_privacy_request", args: { p_request_id: requestId },
      success: "Ten wniosek został wycofany. Historia pozostaje dostępna.", failure: "Nie udało się wycofać wniosku.",
      updateRequest: request => request.id === requestId ? { ...request, status: "withdrawn", withdrawn_at: new Date().toISOString() } : request });
  }

  async function handlePrivacyReply(event, requestId) {
    event.preventDefault();
    if (busy) return;
    const reply = (replyDrafts[requestId] || "").trim();
    if (reply.length < 3 || reply.length > 5000) return;
    const owner = user?.id;
    const result = await mutate({ key: `${requestId}:reply`, scope: requestId, rpc: "reply_to_my_ideahire_privacy_request", args: { p_request_id: requestId, p_message: reply },
      success: "Wiadomość została wysłana. Zapisaliśmy ją w historii tego wniosku.", failure: "Nie udało się wysłać wiadomości.",
      updateRequest: request => request.id === requestId && request.status === "awaiting_user" ? { ...request, status: "in_progress" } : request });
    if (result.ok && ownerRef.current === owner) setReplyDrafts(current => ({ ...current, [requestId]: "" }));
  }

  async function handleClosePrivacyReview(requestId, hasApprovedReport) {
    const confirmed = !busy && window.confirm(hasApprovedReport
      ? "Czy na pewno chcesz zamknąć analizę? Raport i historia pozostaną dostępne. Zamknięcie nie oznacza zrzeczenia się praw dotyczących Twoich danych ani potwierdzenia zgodności IdeaHire z prawem."
      : "Czy na pewno chcesz zakończyć analizę przed opublikowaniem raportu? Historia pozostanie zapisana, ale raport nie zostanie dostarczony w ramach tej sprawy. Nie ogranicza to Twoich praw dotyczących danych.");
    if (!confirmed) return;
    await mutate({ key: `${requestId}:close-review`, scope: requestId, rpc: "close_my_ideahire_privacy_review", args: { p_request_id: requestId },
      success: hasApprovedReport ? "Analiza została zamknięta. Raport i historia pozostają dostępne." : "Analiza została zakończona przed publikacją raportu. Historia pozostaje dostępna.", failure: "Nie udało się zamknąć analizy.",
      updateRequest: request => request.id === requestId ? { ...request, requester_closed_at: new Date().toISOString() } : request });
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

      <main className="privacy-center-shell ih-privacy-desk" data-interface-release="privacy-clarity-20261029">
        <SubpageHeading eyebrow="Prywatność i moje dane" title="Centrum prywatności"
          description="Wyślij wniosek dotyczący swoich danych i śledź jego realizację bezpośrednio na koncie IdeaHire."
          variant="privacy" />

        <nav className="ih-privacy-page-nav" aria-label="Centrum prywatności"><a href="#privacy-form-title">Nowy wniosek</a><a href="#privacy-history">Twoje wnioski</a></nav>
        <section className="privacy-trust-panel">
          <div className="privacy-trust-mark" aria-hidden="true">✓</div>
          <div>
            <strong>Wniosek przypisany do Twojego konta</strong>
            <p>
              Wniosek jest przypisany do zalogowanego konta. Możemy poprosić
              o dodatkową weryfikację wyłącznie wtedy, gdy pojawią się
              uzasadnione wątpliwości dotyczące tożsamości.
            </p>
          </div>
        </section>

        <div className="privacy-center-grid">
          {receipt && receipt.ownerId === user?.id ? <PrivacyReceipt request={requests.find(request => request.id === receipt.id) || receipt}
            number={requests.find(request => request.id === receipt.id)?.request_number ? formatPrivacyRequestNumber(requests.find(request => request.id === receipt.id).request_number) : null}
            type={getOptionLabel(PRIVACY_REQUEST_TYPES, receipt.requestType)}
            onNew={() => {
              setReceipt(null);
              setForm({ requestType: "access", preferredFormat: "electronic", description: "", requestedErasureAction: "" });
              clearNotice("form");
              requestAnimationFrame(() => document.getElementById("privacy-request-type")?.focus());
            }} /> : <section className="privacy-request-form-card" aria-labelledby="privacy-form-title">
            <p className="ih-privacy-eyebrow">Nowa sprawa</p>
            <h2 id="privacy-form-title">W czym możemy pomóc?</h2>
            <p>
              {form.requestType === "security_review"
                ? "Poproś o techniczną i organizacyjną analizę ochrony danych powiązanych z Twoim kontem."
                : "Wybierz temat i opisz swoją sprawę. Odpowiedź otrzymasz tutaj. Standardowy termin wynosi jeden miesiąc od otrzymania wniosku."}
            </p>

            <form className="privacy-request-form" onSubmit={handleSubmit} noValidate aria-busy={busy === "submit"}>
              <MarketSelect id="privacy-request-type" label="Rodzaj wniosku" value={form.requestType}
                options={PRIVACY_REQUEST_TYPES.map(([value, label]) => ({ value, label }))}
                onChange={value => changeForm({ requestType: value, requestedErasureAction: "" })}
                disabled={Boolean(busy)} />
              <details className="ih-privacy-format"><summary>{getOptionLabel(PRIVACY_RESPONSE_FORMATS, form.preferredFormat)} <span>Zmień format</span></summary>
              <MarketSelect id="privacy-response-format" label="Preferowany format odpowiedzi" value={form.preferredFormat}
                options={PRIVACY_RESPONSE_FORMATS.map(([value, label]) => ({ value, label }))}
                onChange={value => changeForm({ preferredFormat: value })}
                disabled={Boolean(busy)} />
              </details>

              <label htmlFor="privacy-description">
                Opis wniosku
                <AutoTextarea
                  id="privacy-description"
                  aria-describedby="privacy-description-help"
                  aria-invalid={formProblem?.field === "privacy-description" || undefined}
                  value={form.description}
                  onChange={event => changeForm({ description: event.target.value })}
                  placeholder={form.requestType === "security_review"
                    ? "Napisz, które dane, funkcje konta albo zdarzenia związane z bezpieczeństwem mamy objąć analizą..."
                    : "Napisz, jakich danych lub działań dotyczy Twój wniosek..."}
                  minLength={20}
                  maxLength={5000}
                  rows={4}
                  disabled={Boolean(busy)}
                  required
                />
                <span className="ih-privacy-description-help" id="privacy-description-help">Napisz, jakiej pomocy potrzebujesz. Wystarczy co najmniej 20 znaków; maksymalnie 5000.</span>
              </label>

              {form.requestType === "erasure" && (
                <fieldset className="privacy-erasure-choice-fieldset" id="privacy-erasure-options" tabIndex={-1}>
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
                        onChange={event => changeForm({ requestedErasureAction: event.target.value })}
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
                        onChange={event => changeForm({ requestedErasureAction: event.target.value })}
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

              <PrivacyFeedback notice={formProblem ? { tone: "error", text: formProblem.text } : notices.form} />
              <button type="submit" className="privacy-primary-button" disabled={Boolean(busy)}>
                {busy === "submit" ? "Wysyłanie wniosku…" : "Wyślij wniosek"}
              </button>
            </form>
          </section>}

          <PrivacyGuide />
        </div>

        <section className="privacy-history-section" id="privacy-history">
          <div className="privacy-section-heading">
            <div>
              <span className="section-label">Historia</span>
              <h2>Twoje wnioski</h2>
            </div>
            <PrivacyHistoryNotice error={historyError} refreshing={historyRefreshing} onRefresh={refresh} />
          </div>

          {loading ? (
            <InlineRouteLoader
              className="privacy-route-loader"
              rows={4}
            />
          ) : requests.length === 0 ? (
            <div className="privacy-empty-state">
              <strong>{historyError ? "Historia jest chwilowo niedostępna" : "Nie masz jeszcze żadnych wniosków"}</strong>
              <p>{historyError ? "Użyj przycisku „Odśwież statusy”, aby spróbować ponownie." : "Po wysłaniu pierwszego wniosku jego status pojawi się tutaj."}</p>
            </div>
          ) : (
            <div className="privacy-request-list">
              {requests.map((request) => {
                const deadline = request.extended_due_at || request.due_at;
                const requestClosed = !isPrivacyRequestOpen(request.status) || Boolean(request.requester_closed_at);
                const finishedAt = request.withdrawn_at || request.requester_closed_at || request.completed_at;
                const events = eventsByRequest[request.id] || [];
                const report = reportsByRequest[request.id] || null;
                const reportChecksByKey = Object.fromEntries(
                  (report?.checks || []).map((check) => [check.check_key, check])
                );
                const securityReviewProgress = request.requester_closed_at || request.request_type !== "security_review"
                  ? null
                  : report && request.status === "awaiting_user"
                    ? {
                      title: "Raport czeka na Twoją decyzję",
                      description: "Przeczytaj pełny wynik, odpowiedz administratorowi albo potwierdź odbiór i zamknij analizę.",
                    }
                    : getSecurityReviewProgress(request.status);

                return (
                  <article className="privacy-request-card" key={request.id} id={`privacy-request-${request.id}`}>
                    <PrivacyFeedback notice={notices[request.id]} />
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

                    <p className="privacy-request-overview"><span>Wysłano {formatDisputeDate(request.submitted_at,false)}</span><span>{requestClosed ? "Zakończono" : "Termin odpowiedzi"}: {requestClosed ? finishedAt ? formatDisputeDate(finishedAt,false) : "data niedostępna" : formatDisputeDate(deadline,false)}</span></p>
                    <details className="privacy-request-details" open={request.status === "awaiting_user"}>
                      <summary>{request.decision_summary || report ? "Treść wniosku i odpowiedź" : "Treść wniosku i historia"}</summary>
                      <div className="privacy-request-body">
                    <p className="privacy-request-description">{request.description}</p>

                    {request.request_type === "erasure" && (
                      <div className={`privacy-erasure-requested-action is-${
                        request.requested_erasure_action || "legacy"
                      }`}>
                        <span>Wybrana operacja</span>
                        <strong>
                          {request.requested_erasure_action
                            ? ERASURE_ACTION_LABELS[request.requested_erasure_action]
                            : "Zakres wymaga potwierdzenia"}
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
                      <div><dt>{requestClosed ? "Zakończono" : "Termin odpowiedzi"}</dt><dd>{requestClosed ? finishedAt ? formatDisputeDate(finishedAt) : "Data niedostępna" : formatDisputeDate(deadline, false)}</dd></div>
                      <div><dt>Format</dt><dd>{getOptionLabel(PRIVACY_RESPONSE_FORMATS, request.preferred_format)}</dd></div>
                    </dl>

                    {request.extension_reason && (
                      <p className="privacy-extension-note">
                        <strong>Przedłużenie terminu:</strong> {request.extension_reason}
                      </p>
                    )}

                    {request.request_type === "security_review"
                      && (isPrivacyRequestOpen(request.status) && !request.requester_closed_at) && (
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
                            {report ? " Raport i historia pozostają dostępne na koncie." : " Historia sprawy pozostaje dostępna na koncie."}
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

                    {(isPrivacyRequestOpen(request.status) && !request.requester_closed_at) && (
                      <details className="ih-privacy-reply"><summary>Napisz wiadomość w tej sprawie</summary>
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
                        <AutoTextarea
                          id={`privacy-reply-${request.id}`}
                          value={replyDrafts[request.id] || ""}
                          onChange={(event) => setReplyDrafts((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))}
                          placeholder="Napisz wiadomość..."
                          minLength={3}
                          maxLength={5000}
                          rows={3}
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
                      </details>
                    )}

                    {(isPrivacyRequestOpen(request.status) && !request.requester_closed_at)
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
                      </div>
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

/* FIND TALENT */

function FindTalent() {
  const formEnglish = useSitePreferences().language === "en";
  const formLocation = useLocation();
  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const { preferences } =
    useDiscoveryPreferences();

  const lucynaDraft = useRef(formLocation.state?.lucynaJobDraft?.userId === user?.id
    ? normalizeLucynaAction(formLocation.state.lucynaJobDraft.action)?.draft || null : null).current;
  const [title, setTitle] =
    useState(lucynaDraft?.title || "");

  const [
    description,
    setDescription,
  ] = useState(lucynaDraft?.description || "");

  const [category, setCategory] =
    useState(
      lucynaDraft?.category || JOB_CATEGORIES[0]
    );

  const [subcategory, setSubcategory] =
    useState(JOB_SUBCATEGORIES[lucynaDraft?.category || JOB_CATEGORIES[0]][0]);

  const [projectStage, setProjectStage] =
    useState("idea");

  const [expectedOutcome, setExpectedOutcome] =
    useState(lucynaDraft?.expected_outcome || "");

  const [clientMaterials, setClientMaterials] =
    useState("");

  const [categoryDetails, setCategoryDetails] =
    useState({});

  const [workMode, setWorkMode] =
    useState("remote");

  const [locationValue, setLocationValue] =
    useState("");

  const [experienceLevel, setExperienceLevel] =
    useState("any");

  const [requiredSkills, setRequiredSkills] =
    useState("");

  const [requiresPortfolio, setRequiresPortfolio] =
    useState(false);

  const [referenceUrl, setReferenceUrl] =
    useState("");

  const [projectDeadline, setProjectDeadline] =
    useState(lucynaDraft?.project_deadline || "");

  const [plannedStartDate, setPlannedStartDate] =
    useState("");

  const [collaborationPlanOpen, setCollaborationPlanOpen] =
    useState(false);

  const [collaborationPlan, setCollaborationPlan] =
    useState(createDefaultCollaborationPlan);

  const [formStep, setFormStep] =
    useState(1);

  const [maxStepReached, setMaxStepReached] =
    useState(1);

  const [budget, setBudget] =
    useState(lucynaDraft?.budget == null ? "" : String(lucynaDraft.budget));

  const [budgetNegotiable, setBudgetNegotiable] =
    useState(lucynaDraft?.budget_negotiable ?? true);

  const [listingDurationDays, setListingDurationDays] =
    useState(14);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const stepPanelRef = useRef(null);
  const lastFocusedStep = useRef(formStep);
  useEffect(() => {
    if (lastFocusedStep.current !== formStep) stepPanelRef.current?.querySelector("h2")?.focus({ preventScroll: true });
    lastFocusedStep.current = formStep;
  }, [formStep]);

  const categoryFields =
    JOB_CATEGORY_FIELDS[category] || [];

  const subcategories =
    JOB_SUBCATEGORIES[category] || [];

  const todayDate =
    new Date().toISOString().slice(0, 10);

  const collaborationPlanPreview =
    prepareCollaborationPlan(collaborationPlan);

  useEffect(() => {
    const preferredCategory =
      preferences?.clientCategories?.[0] ||
      preferences?.preferredCategories?.[0];

    if (
      preferredCategory &&
      JOB_CATEGORIES.includes(preferredCategory) &&
      !title &&
      !description &&
      !budget
    ) {
      setCategory(preferredCategory);
      setSubcategory(
        JOB_SUBCATEGORIES[preferredCategory]?.[0] || ""
      );
    }
  }, [
    preferences?.updatedAt,
    preferences?.clientCategories?.[0],
    preferences?.preferredCategories?.[0],
  ]);

  function handleCategoryChange(nextCategory) {
    setCategory(nextCategory);
    setSubcategory(JOB_SUBCATEGORIES[nextCategory]?.[0] || "");
    setCategoryDetails({});
  }

  function updateCategoryDetail(key, value) {
    setCategoryDetails((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateCollaborationPlan(key, value) {
    setCollaborationPlan((current) => ({
      ...current,
      enabled: true,
      [key]: value,
    }));
  }

  function updateCollaborationListItem(key, index, value) {
    setCollaborationPlan((current) => {
      const nextItems = [...(current[key] || [])];
      nextItems[index] = value;

      return {
        ...current,
        enabled: true,
        [key]: nextItems,
      };
    });
  }

  function toggleApplicationRequirement(value) {
    setCollaborationPlan((current) => {
      const selected = current.applicationRequirements || [];
      const nextSelected = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return {
        ...current,
        enabled: true,
        applicationRequirements: nextSelected,
      };
    });
  }

  function openCollaborationPlan() {
    setCollaborationPlan((current) => ({
      ...current,
      enabled: true,
    }));
    setCollaborationPlanOpen(true);
  }

  function removeCollaborationPlan() {
    setCollaborationPlan(createDefaultCollaborationPlan());
    setCollaborationPlanOpen(false);
  }

  function validateStep(step) {
    setMessage("");
    setSuccess(false);

    if (step === 1) {
      if (!title.trim()) {
        setMessage("Wpisz nazwę zlecenia.");
        return false;
      }

      if (!subcategory) {
        setMessage("Wybierz podkategorię zlecenia.");
        return false;
      }

      if (!description.trim()) {
        setMessage("Opisz krótko swoje zlecenie.");
        return false;
      }
    }

    if (step === 2) {
      if (!expectedOutcome.trim()) {
        setMessage("Napisz, jaki rezultat ma przekazać wykonawca.");
        return false;
      }

      if (workMode !== "remote" && !locationValue.trim()) {
        setMessage("Podaj lokalizację współpracy.");
        return false;
      }

      if (referenceUrl.trim() && !getSafeJobReferenceUrl(referenceUrl)) {
        setMessage("Link do materiałów musi zaczynać się od http:// lub https://.");
        return false;
      }
    }

    if (step === 3) {
      const numericBudget = Number(budget);

      if (!budget || !Number.isInteger(numericBudget) || numericBudget < MIN_JOB_BUDGET) {
        setMessage(`Podaj budżet w pełnych złotych, od ${MIN_JOB_BUDGET} do ${MAX_JOB_BUDGET.toLocaleString("pl-PL")} zł.`);
        return false;
      }

      if (numericBudget > MAX_JOB_BUDGET) {
        setMessage(MAX_JOB_BUDGET_MESSAGE);
        return false;
      }

      if (!projectDeadline) {
        setMessage("Wybierz termin wykonania projektu.");
        return false;
      }

      if (projectDeadline < todayDate) {
        setMessage("Termin wykonania nie może być datą z przeszłości.");
        return false;
      }

      if (plannedStartDate && plannedStartDate > projectDeadline) {
        setMessage("Data rozpoczęcia nie może być późniejsza niż termin wykonania.");
        return false;
      }
    }

    return true;
  }

  function goToNextStep() {
    if (!validateStep(formStep)) return;

    const nextStep = Math.min(formStep + 1, JOB_FORM_STEPS.length);
    setFormStep(nextStep);
    setMaxStepReached((current) => Math.max(current, nextStep));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function goToPreviousStep() {
    setMessage("");
    setFormStep((current) => Math.max(1, current - 1));
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

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

    if (saving) return;
    if (formStep < JOB_FORM_STEPS.length) {
      goToNextStep();
      return;
    }

    setMessage("");
    setSuccess(false);

    if (![1, 2, 3].every((step) => validateStep(step))) {
      return;
    }

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    const numericBudget =
      Number(budget);

    const skills = requiredSkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 6);

    const cleanCategoryDetails = Object.fromEntries(
      Object.entries(categoryDetails)
        .map(([key, value]) => [key, String(value || "").trim()])
        .filter(([, value]) => Boolean(value))
    );

    const cleanCollaborationPlan =
      prepareCollaborationPlan(collaborationPlan);

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
            subcategory,
            project_stage:
              projectStage,
            expected_outcome:
              expectedOutcome.trim(),
            client_materials:
              clientMaterials.trim() || null,
            category_details:
              cleanCategoryDetails,
            work_mode:
              workMode,
            location:
              workMode === "remote"
                ? null
                : locationValue.trim(),
            experience_level:
              experienceLevel,
            required_skills:
              skills,
            requires_portfolio:
              requiresPortfolio,
            reference_url:
              getSafeJobReferenceUrl(referenceUrl) || null,
            project_deadline:
              projectDeadline,
            planned_start_date:
              plannedStartDate || null,
            collaboration_plan:
              cleanCollaborationPlan,
            budget:
              numericBudget,
            budget_negotiable:
              budgetNegotiable,
            listing_duration_days:
              listingDurationDays,
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
        preferences?.clientCategories?.[0] ||
          preferences?.preferredCategories?.[0] ||
          JOB_CATEGORIES[0]
      );
      setSubcategory(
        JOB_SUBCATEGORIES[
          preferences?.clientCategories?.[0] ||
            preferences?.preferredCategories?.[0] ||
            JOB_CATEGORIES[0]
        ]?.[0] || ""
      );
      setProjectStage("idea");
      setExpectedOutcome("");
      setClientMaterials("");
      setCategoryDetails({});
      setWorkMode("remote");
      setLocationValue("");
      setExperienceLevel("any");
      setRequiredSkills("");
      setRequiresPortfolio(false);
      setReferenceUrl("");
      setProjectDeadline("");
      setPlannedStartDate("");
      setCollaborationPlan(createDefaultCollaborationPlan());
      setCollaborationPlanOpen(false);
      setBudget("");
      setBudgetNegotiable(true);
      setListingDurationDays(14);
      setFormStep(1);
      setMaxStepReached(1);

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
    <div className="page ih-market-v5 ih5-create-page">
      <AccountNavbar />


      <main className="ih-market-shell ih5-editor-shell">
        <MarketHeader eyebrow="Dla zlecających" title="Dodaj zlecenie" description="Cztery krótkie kroki. Opisz projekt, ustal zakres i pokaż wykonawcom jasne warunki." />
        {lucynaDraft && <p className="ih68-feedback" role="status">{formEnglish ? "Lucyna’s draft has been loaded. Review it, complete the remaining fields and confirm publication in the last step." : "Wczytano szkic od Lucyny. Sprawdź treść, uzupełnij pozostałe pola i zatwierdź publikację w ostatnim kroku."}</p>}

        <div className="ih75-editor-workspace">
        <aside className="ih75-editor-guide" aria-label={formEnglish ? "Project steps" : "Etapy projektu"}>
        <p className="ih75-guide-label">{formEnglish ? "Your project" : "Twój projekt"}</p>
        <div className="ih73-mobile-step-picker"><span>{formEnglish ? "Step" : "Krok"} {formStep} / {JOB_FORM_STEPS.length}</span><MarketSelect label={formEnglish ? "Project step" : "Etap dodawania zlecenia"} value={formStep} onChange={value => { setMessage(""); setFormStep(value); }} options={JOB_FORM_STEPS.map((step, index) => ({ value: index + 1, disabled: index + 1 > maxStepReached, label: formEnglish ? ["Project", "Scope", "Terms", "Publish"][index] : step.label }))} /></div>
        <div className="ih86-form-progress" aria-hidden="true">{JOB_FORM_STEPS.map((step, index) => <i key={step.number} data-reached={index + 1 <= formStep} />)}</div>
        <ol className="ih5-job-create-progress" aria-label="Postęp dodawania zlecenia">
          {JOB_FORM_STEPS.map((item, index) => {
            const stepNumber = index + 1;
            const isActive = formStep === stepNumber;
            const isDone = formStep > stepNumber;

            return (
              <li
                className={`${isActive ? "is-active" : ""}${isDone ? " is-done" : ""}`}
                key={item.number}
              >
                <button
                  type="button"
                  disabled={stepNumber > maxStepReached}
                  onClick={() => {
                    setMessage("");
                    setFormStep(stepNumber);
                  }}
                  aria-current={isActive ? "step" : undefined}
                >
                  <span>{isDone ? "✓" : item.number}</span>
                  <strong>{item.label}</strong>
                </button>
              </li>
            );
          })}
        </ol>
        </aside>
        <div className="ih75-editor-content">
        <form
          className="ih5-editor ih5-job-create-form"
          onSubmit={handleSubmit}
          noValidate
        >
          {formStep === 1 && (
            <section ref={stepPanelRef} key={formStep} className="ih5-job-create-step-panel" aria-labelledby="job-step-1-title">
              <div className="ih5-job-create-step-heading">
                <span>01</span>
                <div>
                  <h2 tabIndex={-1} id="job-step-1-title">Podstawowe informacje</h2>
                  <p>{formEnglish ? "A title, field and brief description of your project." : "Tytuł, dziedzina i krótki opis projektu."}</p>
                </div>
              </div>

              <div className="ih5-job-form-grid">
                <label className="is-wide ih86-title-field">
                  {formEnglish ? "Job title" : "Tytuł zlecenia"}
                  <input
                    type="text"
                    enterKeyHint="next"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={formEnglish ? "E.g. a website for a restaurant" : "Np. strona internetowa dla restauracji"}
                    maxLength={120}
                  />
                  <small className="ih86-field-note"><span>{formEnglish ? "Name the result you need." : "Krótko nazwij oczekiwany efekt."}</span></small>
                </label>

                <MarketSelect label={formEnglish ? "Category" : "Kategoria"} value={category}
                  onChange={handleCategoryChange} options={JOB_CATEGORIES.map(item => ({ value: item, label: getJobCategoryLabel(item) }))} />

                <MarketSelect label={formEnglish ? "Subcategory" : "Podkategoria"} value={subcategory}
                  onChange={setSubcategory} options={subcategories.map(item => ({ value: item, label: item }))} />

                <fieldset className="ih5-job-compact-fieldset is-wide">
                  <legend>Na jakim etapie jest projekt?</legend>
                  <div className="ih5-job-choice-grid is-four">
                    {JOB_PROJECT_STAGES.map((option) => (
                      <label
                        className={`ih5-job-choice-card${projectStage === option.value ? " is-selected" : ""}`}
                        key={option.value}
                      >
                        <input
                          type="radio"
                          name="project-stage"
                          checked={projectStage === option.value}
                          onChange={() => setProjectStage(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="is-wide">
                  Opisz swój projekt
                  <AutoTextarea
                    className="ideahire-multiline-field ideahire-description-field"
                    rows="5"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Opisz cel, najważniejsze założenia i czego oczekujesz od wykonawcy."
                    maxLength={2000}
                  />
                  <small>{description.length}/2000</small>
                </label>
              </div>
            </section>
          )}

          {formStep === 2 && (
            <section ref={stepPanelRef} key={formStep} className="ih5-job-create-step-panel" aria-labelledby="job-step-2-title">
              <div className="ih5-job-create-step-heading">
                <span>02</span>
                <div>
                  <h2 tabIndex={-1} id="job-step-2-title">Zakres i wymagania</h2>
                  <p>{formEnglish ? "Set out the result, materials and requirements." : "Określ rezultat, materiały i wymagania dla wykonawcy."}</p>
                </div>
              </div>

              <div className="ih5-job-form-grid">
                <label className="is-wide">
                  Jaki rezultat ma przekazać wykonawca?
                  <AutoTextarea
                    rows="4"
                    value={expectedOutcome}
                    onChange={(event) => setExpectedOutcome(event.target.value)}
                    placeholder="Np. gotowa responsywna strona, kod źródłowy i wdrożenie na serwerze."
                    maxLength={1000}
                  />
                  <small>{expectedOutcome.length}/1000</small>
                </label>

                <label className="is-wide">
                  Co zapewniasz wykonawcy? <em>Opcjonalnie</em>
                  <AutoTextarea
                    rows="3"
                    value={clientMaterials}
                    onChange={(event) => setClientMaterials(event.target.value)}
                    placeholder="Np. logo, teksty, zdjęcia, dostęp do obecnej strony lub nagrania."
                    maxLength={800}
                  />
                </label>

                <div className="ih5-job-category-questions is-wide">
                  <div className="ih5-job-category-questions-heading">
                    <span className="ih5-eyebrow">{getJobCategoryLabel(category)}</span>
                    <h3>Szczegóły potrzebne do dobrej wyceny</h3>
                  </div>
                  <div className="ih5-job-form-grid">
                    {categoryFields.map((field) => (
                      <label key={field.key}>
                        {field.label}
                        <input
                          type="text"
                          value={categoryDetails[field.key] || ""}
                          onChange={(event) => updateCategoryDetail(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          maxLength={300}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <fieldset className="ih5-job-compact-fieldset is-wide">
                  <legend>Tryb współpracy</legend>
                  <div className="ih5-job-choice-grid is-three">
                    {JOB_WORK_MODES.map((option) => (
                      <label
                        className={`ih5-job-choice-card${workMode === option.value ? " is-selected" : ""}`}
                        key={option.value}
                      >
                        <input
                          type="radio"
                          name="work-mode"
                          checked={workMode === option.value}
                          onChange={() => setWorkMode(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {workMode !== "remote" && (
                  <label>
                    Lokalizacja
                    <input
                      type="text"
                      value={locationValue}
                      onChange={(event) => setLocationValue(event.target.value)}
                      placeholder="Np. Szczecin"
                      maxLength={160}
                    />
                  </label>
                )}

                <MarketSelect label="Poziom doświadczenia" value={experienceLevel} options={JOB_EXPERIENCE_LEVELS} onChange={value => setExperienceLevel(value)} />

                <label>
                  Najważniejsze umiejętności <em>Opcjonalnie</em>
                  <input
                    type="text"
                    value={requiredSkills}
                    onChange={(event) => setRequiredSkills(event.target.value)}
                    placeholder="Np. React, Figma, SEO — oddziel przecinkami"
                    maxLength={260}
                  />
                </label>

                <label>
                  Link do materiałów lub inspiracji <em>Opcjonalnie</em>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(event) => setReferenceUrl(event.target.value)}
                    placeholder="https://..."
                    maxLength={600}
                  />
                </label>

                <label className="ih5-job-portfolio-toggle is-wide">
                  <input
                    type="checkbox"
                    checked={requiresPortfolio}
                    onChange={(event) => setRequiresPortfolio(event.target.checked)}
                  />
                  <span>
                    <strong>Wymagaj portfolio</strong>
                    <small>Wykonawca powinien pokazać wcześniejsze realizacje.</small>
                  </span>
                </label>

                <div className="ih5-collaboration-plan-builder is-wide">
                  {!collaborationPlanOpen ? (
                    <button
                      type="button"
                      className={`ih5-collaboration-plan-launch${
                        collaborationPlan.enabled ? " has-plan" : ""
                      }`}
                      onClick={openCollaborationPlan}
                      aria-expanded="false"
                    >
                      <span className="ih5-collaboration-plan-launch-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                          <path d="M8 12.5 10.5 15 16 9.5M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                        </svg>
                      </span>

                      <span className="ih5-collaboration-plan-launch-copy">
                        <strong>
                          {collaborationPlan.enabled
                            ? "Edytuj plan współpracy"
                            : "Ustal plan współpracy"}
                        </strong>
                        <small>
                          Uporządkuj etapy, poprawki, odbiór i sposób kontaktu bez wydłużania głównego opisu.
                        </small>
                      </span>

                      <span className="ih5-collaboration-plan-launch-action" aria-hidden="true">
                        {collaborationPlan.enabled ? "Edytuj" : "Dodaj"}
                        <svg viewBox="0 0 24 24">
                          <path d="m9 5 7 7-7 7" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <section
                      className="ih5-collaboration-plan-editor"
                      aria-labelledby="ih5-collaboration-plan-editor-title"
                    >
                      <header className="ih5-collaboration-plan-editor-header">
                        <div>
                          <span className="ih5-eyebrow">Opcjonalne ustalenia</span>
                          <h3 id="ih5-collaboration-plan-editor-title">Plan współpracy</h3>
                          <p>
                            Dodaj tylko informacje, które naprawdę pomogą obu stronom rozpocząć projekt bez niedomówień.
                          </p>
                        </div>

                        <div className="ih5-collaboration-plan-editor-actions">
                          <button
                            type="button"
                            className="ih5-collaboration-plan-text-button"
                            onClick={() => setCollaborationPlanOpen(false)}
                          >
                            Zwiń
                          </button>
                          <button
                            type="button"
                            className="ih5-collaboration-plan-text-button is-danger"
                            onClick={removeCollaborationPlan}
                          >
                            Usuń plan
                          </button>
                        </div>
                      </header>

                      <div className="ih5-collaboration-plan-editor-grid">
                        <section className="ih5-collaboration-plan-group">
                          <div className="ih5-collaboration-plan-group-heading">
                            <span>01</span>
                            <div>
                              <h4>Przebieg projektu</h4>
                              <p>Najważniejsze punkty kontrolne i sposób komunikacji.</p>
                            </div>
                          </div>

                          <div className="ih5-collaboration-plan-fields">
                            <fieldset className="ih5-collaboration-plan-fieldset">
                              <legend>Etapy projektu <em>maks. 3</em></legend>
                              {collaborationPlan.milestones.map((milestone, index) => (
                                <label key={`milestone-${index}`}>
                                  <span>Etap {index + 1}</span>
                                  <input
                                    type="text"
                                    value={milestone}
                                    onChange={(event) =>
                                      updateCollaborationListItem(
                                        "milestones",
                                        index,
                                        event.target.value
                                      )
                                    }
                                    placeholder={
                                      index === 0
                                        ? "Np. pierwsza wersja projektu"
                                        : index === 1
                                        ? "Np. poprawki po konsultacji"
                                        : "Np. przekazanie gotowych plików"
                                    }
                                    maxLength={160}
                                  />
                                </label>
                              ))}
                            </fieldset>

                            <MarketSelect label="Sposób zatwierdzania" value={collaborationPlan.approvalMode} options={COLLABORATION_APPROVAL_OPTIONS} onChange={value => updateCollaborationPlan("approvalMode", value)} />

                            <MarketSelect label="Częstotliwość kontaktu" value={collaborationPlan.contactFrequency} options={COLLABORATION_CONTACT_OPTIONS} onChange={value => updateCollaborationPlan("contactFrequency", value)} />

                            <MarketSelect label="Czas na przekazanie uwag" value={collaborationPlan.feedbackTime} options={COLLABORATION_FEEDBACK_OPTIONS} onChange={value => updateCollaborationPlan("feedbackTime", value)} />
                          </div>
                        </section>

                        <section className="ih5-collaboration-plan-group">
                          <div className="ih5-collaboration-plan-group-heading">
                            <span>02</span>
                            <div>
                              <h4>Odbiór i poprawki</h4>
                              <p>Jasne zasady pomagają uniknąć różnych interpretacji.</p>
                            </div>
                          </div>

                          <div className="ih5-collaboration-plan-fields">
                            <MarketSelect label="Liczba rund poprawek" value={collaborationPlan.revisionRounds} options={COLLABORATION_REVISION_OPTIONS} onChange={value => updateCollaborationPlan("revisionRounds", value)} />

                            <fieldset className="ih5-collaboration-plan-fieldset">
                              <legend>Kiedy zlecenie jest ukończone? <em>maks. 3</em></legend>
                              {collaborationPlan.completionCriteria.map((criterion, index) => (
                                <label key={`criterion-${index}`}>
                                  <span>Warunek {index + 1}</span>
                                  <input
                                    type="text"
                                    value={criterion}
                                    onChange={(event) =>
                                      updateCollaborationListItem(
                                        "completionCriteria",
                                        index,
                                        event.target.value
                                      )
                                    }
                                    placeholder={
                                      index === 0
                                        ? "Np. działa prawidłowo na telefonie i komputerze"
                                        : index === 1
                                        ? "Np. przekazane są pliki źródłowe"
                                        : "Np. wykonane są wszystkie opisane elementy"
                                    }
                                    maxLength={240}
                                  />
                                </label>
                              ))}
                            </fieldset>

                            <fieldset className="ih5-collaboration-plan-fieldset">
                              <legend>Zmiany poza ustalonym zakresem</legend>
                              <div className="ih5-collaboration-plan-radio-list">
                                {COLLABORATION_CHANGE_OPTIONS.map((option) => (
                                  <label
                                    className={
                                      collaborationPlan.changePolicy === option.value
                                        ? "is-selected"
                                        : ""
                                    }
                                    key={option.value}
                                  >
                                    <input
                                      type="radio"
                                      name="collaboration-change-policy"
                                      checked={collaborationPlan.changePolicy === option.value}
                                      onChange={() =>
                                        updateCollaborationPlan("changePolicy", option.value)
                                      }
                                    />
                                    <span>
                                      <strong>{option.label}</strong>
                                      <small>{option.description}</small>
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          </div>
                        </section>

                        <section className="ih5-collaboration-plan-group">
                          <div className="ih5-collaboration-plan-group-heading">
                            <span>03</span>
                            <div>
                              <h4>Obowiązki obu stron</h4>
                              <p>Krótko określ, za co odpowiada każda osoba.</p>
                            </div>
                          </div>

                          <div className="ih5-collaboration-plan-fields">
                            <label>
                              Zleceniodawca dostarczy
                              <AutoTextarea
                                rows="4"
                                value={collaborationPlan.clientResponsibilities}
                                onChange={(event) =>
                                  updateCollaborationPlan(
                                    "clientResponsibilities",
                                    event.target.value
                                  )
                                }
                                placeholder="Np. materiały, dostęp do kont i uwagi do 48 godzin."
                                maxLength={600}
                              />
                              <small>{collaborationPlan.clientResponsibilities.length}/600</small>
                            </label>

                            <label>
                              Wykonawca dostarczy
                              <AutoTextarea
                                rows="4"
                                value={collaborationPlan.contractorResponsibilities}
                                onChange={(event) =>
                                  updateCollaborationPlan(
                                    "contractorResponsibilities",
                                    event.target.value
                                  )
                                }
                                placeholder="Np. gotowy rezultat, pliki źródłowe i krótką instrukcję."
                                maxLength={600}
                              />
                              <small>{collaborationPlan.contractorResponsibilities.length}/600</small>
                            </label>
                          </div>
                        </section>

                        <section className="ih5-collaboration-plan-group">
                          <div className="ih5-collaboration-plan-group-heading">
                            <span>04</span>
                            <div>
                              <h4>Odpowiedź wykonawcy</h4>
                              <p>Wybierz informacje potrzebne do porównania zgłoszeń.</p>
                            </div>
                          </div>

                          <div className="ih5-collaboration-plan-fields">
                            <fieldset className="ih5-collaboration-plan-fieldset">
                              <legend>W zgłoszeniu poproś o</legend>
                              <div className="ih5-collaboration-plan-check-grid">
                                {COLLABORATION_APPLICATION_REQUIREMENTS.map((option) => (
                                  <label
                                    className={
                                      collaborationPlan.applicationRequirements.includes(
                                        option.value
                                      )
                                        ? "is-selected"
                                        : ""
                                    }
                                    key={option.value}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={collaborationPlan.applicationRequirements.includes(
                                        option.value
                                      )}
                                      onChange={() =>
                                        toggleApplicationRequirement(option.value)
                                      }
                                    />
                                    <span>{option.label}</span>
                                  </label>
                                ))}
                              </div>
                            </fieldset>

                            <fieldset className="ih5-collaboration-plan-fieldset">
                              <legend>Pytania do wykonawcy <em>maks. 3</em></legend>
                              {collaborationPlan.screeningQuestions.map((question, index) => (
                                <label key={`question-${index}`}>
                                  <span>Pytanie {index + 1}</span>
                                  <input
                                    type="text"
                                    value={question}
                                    onChange={(event) =>
                                      updateCollaborationListItem(
                                        "screeningQuestions",
                                        index,
                                        event.target.value
                                      )
                                    }
                                    placeholder={
                                      index === 0
                                        ? "Np. kiedy możesz rozpocząć?"
                                        : index === 1
                                        ? "Np. czy realizowałeś podobny projekt?"
                                        : "Np. jak zaplanowałbyś pracę?"
                                    }
                                    maxLength={240}
                                  />
                                </label>
                              ))}
                            </fieldset>
                          </div>
                        </section>
                      </div>

                      <footer className="ih5-collaboration-plan-editor-footer">
                        <span>
                          Plan jest opcjonalny. Zapiszemy go razem ze zleceniem i pokażemy wykonawcom w czytelnym podsumowaniu.
                        </span>
                        <button
                          type="button"
                          className="ih5-button is-primary"
                          onClick={() => setCollaborationPlanOpen(false)}
                        >
                          Zapisz plan
                        </button>
                      </footer>
                    </section>
                  )}
                </div>
              </div>
            </section>
          )}

          {formStep === 3 && (
            <section ref={stepPanelRef} key={formStep} className="ih5-job-create-step-panel" aria-labelledby="job-step-3-title">
              <div className="ih5-job-create-step-heading">
                <span>03</span>
                <div>
                  <h2 tabIndex={-1} id="job-step-3-title">Budżet i terminy</h2>
                  <p>Termin realizacji jest niezależny od czasu wyświetlania ogłoszenia.</p>
                </div>
              </div>

              <div className="ih5-job-form-grid">
                <label className="is-wide">
                  Budżet (zł)
                  <input
                    type="text"
                    value={budget}
                    onChange={handleBudgetChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Np. 3000"
                    maxLength={5}
                    aria-describedby="job-budget-help"
                    aria-label="Budżet zlecenia, maksymalnie 10 000 zł"
                  />

                  <div className="ih5-job-budget-limit-note" id="job-budget-help" role="note">
                    <i className="ih5-job-budget-limit-icon" aria-hidden="true">i</i>
                    <span className="ih5-job-budget-limit-copy">
                      <strong>Maksymalnie 10 000 zł</strong>
                      <small>Podaj wynagrodzenie wykonawcy. Dodatkowe koszty, np. reklamy, opisz w zakresie projektu.</small>
                    </span>
                  </div>
                </label>

                <fieldset className="ih5-job-option-fieldset is-wide">
                  <legend>Charakter budżetu</legend>
                  <p className="ih5-job-option-intro">Czy kwota jest ostateczna, czy będzie ustalana przed współpracą?</p>
                  <div className="ih5-job-option-grid ih5-job-budget-options">
                    <label className={`ih5-job-option-card${budgetNegotiable ? " is-selected" : ""}`}>
                      <input
                        type="radio"
                        name="budget-negotiable"
                        checked={budgetNegotiable}
                        onChange={() => setBudgetNegotiable(true)}
                      />
                      <span className="ih5-job-option-mark" aria-hidden="true">01</span>
                      <span>
                        <strong>Do negocjacji</strong>
                        <small>Ostateczną cenę ustalicie w warunkach współpracy.</small>
                      </span>
                    </label>

                    <label className={`ih5-job-option-card${!budgetNegotiable ? " is-selected" : ""}`}>
                      <input
                        type="radio"
                        name="budget-negotiable"
                        checked={!budgetNegotiable}
                        onChange={() => setBudgetNegotiable(false)}
                      />
                      <span className="ih5-job-option-mark" aria-hidden="true">●</span>
                      <span>
                        <strong>Cena ustalona</strong>
                        <small>Podana kwota pozostanie stała w ustaleniach.</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <label>
                  Planowany start <em>Opcjonalnie</em>
                  <IdeaHireDateField
                aria-label="Planowany start projektu"
                    type="date"
                    min={todayDate}
                    value={plannedStartDate}
                    onChange={(event) => setPlannedStartDate(event.target.value)}
                  />
                </label>

                <label>
                  Termin wykonania
                  <IdeaHireDateField
                aria-label="Termin wykonania projektu"
                    type="date"
                    min={todayDate}
                    value={projectDeadline}
                    onChange={(event) => setProjectDeadline(event.target.value)}
                  />
                </label>

                <fieldset className="ih5-job-option-fieldset is-wide">
                  <legend>Czas publikacji ogłoszenia</legend>
                  <p className="ih5-job-option-intro">Po tym czasie zlecenie zniknie z publicznej wyszukiwarki.</p>
                  <div className="ih5-job-option-grid ih5-job-duration-options">
                    {JOB_LISTING_DURATION_OPTIONS.map((option) => (
                      <label
                        className={`ih5-job-option-card${listingDurationDays === option.days ? " is-selected" : ""}`}
                        key={option.days}
                      >
                        <input
                          type="radio"
                          name="listing-duration"
                          value={option.days}
                          checked={listingDurationDays === option.days}
                          onChange={() => setListingDurationDays(option.days)}
                        />
                        <span className="ih5-job-option-duration" aria-hidden="true">{option.days}</span>
                        <span>
                          <strong>{option.label}</strong>
                          <small>{option.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>
          )}

          {formStep === 4 && (
            <section ref={stepPanelRef} key={formStep} className="ih5-job-create-step-panel" aria-labelledby="job-step-4-title">
              <div className="ih5-job-create-step-heading">
                <span>04</span>
                <div>
                  <h2 tabIndex={-1} id="job-step-4-title">Sprawdź przed publikacją</h2>
                  <p>Tak najważniejsze informacje zobaczy potencjalny wykonawca.</p>
                </div>
              </div>

              <div className="ih5-job-create-summary">
                <article className="is-wide">
                  <span className="ih5-eyebrow">{getJobCategoryLabel(category)} · {subcategory}</span>
                  <h3>{title || "Bez tytułu"}</h3>
                  <p>{description || "Brak opisu."}</p>
                </article>

                <article>
                  <span>Oczekiwany rezultat</span>
                  <strong>{expectedOutcome || "Do uzupełnienia"}</strong>
                </article>

                <article>
                  <span>Budżet</span>
                  <strong>
                    {budget ? `${Number(budget).toLocaleString("pl-PL")} zł` : "Do uzupełnienia"}
                    {budget && (budgetNegotiable ? " · do negocjacji" : " · cena ustalona")}
                  </strong>
                </article>

                <article>
                  <span>Realizacja</span>
                  <strong>{getJobOptionLabel(JOB_WORK_MODES, workMode)}{locationValue ? ` · ${locationValue}` : ""}</strong>
                  <small>Termin: {projectDeadline || "do uzupełnienia"}</small>
                </article>

                <article>
                  <span>Wymagania</span>
                  <strong>{getJobOptionLabel(JOB_EXPERIENCE_LEVELS, experienceLevel)}</strong>
                  <small>{requiresPortfolio ? "Portfolio wymagane" : "Portfolio niewymagane"}</small>
                </article>

                {Object.keys(categoryDetails).length > 0 && (
                  <article className="is-wide ih5-job-create-summary-details">
                    <span>Szczegóły kategorii</span>
                    <dl>
                      {Object.entries(categoryDetails)
                        .filter(([, value]) => String(value || "").trim())
                        .map(([key, value]) => (
                          <div key={key}>
                            <dt>{getJobCategoryFieldLabel(category, key)}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                    </dl>
                  </article>
                )}

                {collaborationPlan.enabled && (
                  <article className="is-wide ih5-job-create-summary-details collaboration-summary-card">
                    <span>Plan współpracy</span>
                    <dl>
                      <div>
                        <dt>Etapy</dt>
                        <dd>
                          {collaborationPlanPreview.milestones.length > 0
                            ? (
                                <>
                                  {collaborationPlanPreview.milestones.length}{" "}
                                  <span>
                                    {collaborationPlanPreview.milestones.length === 1
                                      ? "etap"
                                      : "etapy"}
                                  </span>
                                </>
                              )
                            : "Do ustalenia przed startem"}
                        </dd>
                      </div>
                      <div>
                        <dt>Poprawki</dt>
                        <dd>
                          {getJobOptionLabel(
                            COLLABORATION_REVISION_OPTIONS,
                            collaborationPlan.revisionRounds
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Akceptacja</dt>
                        <dd>
                          {getJobOptionLabel(
                            COLLABORATION_APPROVAL_OPTIONS,
                            collaborationPlan.approvalMode
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Kontakt</dt>
                        <dd>
                          {getJobOptionLabel(
                            COLLABORATION_CONTACT_OPTIONS,
                            collaborationPlan.contactFrequency
                          )}
                        </dd>
                      </div>
                    </dl>
                  </article>
                )}
              </div>

              <p className="ih5-job-create-publish-note">
                Po publikacji zlecenie będzie widoczne przez {listingDurationDays} dni. Termin wykonania projektu pozostaje osobną informacją.
              </p>
            </section>
          )}

          {message && (
            <p
              className={success ? "ih5-notice is-success" : "ih5-notice is-error"}
              role={success ? "status" : "alert"}
            >
              {message}
            </p>
          )}

          <div className="ih5-job-create-navigation">
            {formStep > 1 && (
              <button className="ih5-button is-quiet" type="button" onClick={goToPreviousStep} disabled={saving}>
                Wstecz
              </button>
            )}

            {formStep < JOB_FORM_STEPS.length ? (
              <button className="ih5-button is-primary" type="button" onClick={goToNextStep}>
                Dalej
              </button>
            ) : (
              <button className="ih5-button is-primary" type="submit" disabled={saving}>
                {saving ? "Publikowanie..." : "Opublikuj zlecenie"}
              </button>
            )}
          </div>
        </form>
        </div>
        </div>
      </main>
    </div>
  );
}

/* EDIT JOB */

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
            "id, user_id, title, description, category, subcategory, project_stage, expected_outcome, client_materials, category_details, collaboration_plan, work_mode, location, experience_level, required_skills, requires_portfolio, reference_url, project_deadline, planned_start_date, budget, budget_negotiable, listing_duration_days, expires_at, created_at, visibility, source_type, listing_stage, assigned_at"
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
      <div className="page ih-market-v5 ih5-create-page">
        <AccountNavbar />

        <main className="ih-market-shell ih5-editor-shell">
          <p className="ih5-notice is-error">
            {message ||
              "Nie znaleziono zlecenia."}
          </p>
        </main>
      </div>
    );
  }

  if (job.listing_stage === 'assigned' || job.assigned_at) return <div className="page ih-market-v5 ih5-create-page"><AccountNavbar/><main className="ih-market-shell ih5-editor-shell"><MarketHeader eyebrow="Prywatna współpraca" title={job.title} description="To zlecenie ma zaakceptowane ustalenia i pozostaje poza publicznym katalogiem. Zmiany zakresu ustal z wykonawcą w rozmowie."/><p className="ih-owned-private-description">{job.description}</p><Link className="ih5-button is-primary" to={`/work?q=${encodeURIComponent(job.title || '')}`}>Przejdź do współpracy<MarketIcon kind="arrow"/></Link></main></div>;

  return (
    <div className="page ih-market-v5 ih5-create-page">
      <AccountNavbar />

      <main className="ih-market-shell ih5-editor-shell">
        <MarketHeader eyebrow="Twoje zlecenie" title="Edytuj zlecenie" description="Dopracuj opis i wymagania. Zapisane ustalenia pozostają czytelne dla wykonawców." />

        <form
          className="ih5-editor"
          onSubmit={handleSave}
        >
          <label>
            Tytuł

            <AutoTextarea
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

            <FormSelect
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
                    {getJobCategoryLabel(item)}
                  </option>
                )
              )}
            </FormSelect>
          </label>

          <label>
            Opis

            <AutoTextarea
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
              {job.budget_negotiable
                ? "To budżet orientacyjny. Ostateczną cenę ustalicie przed rozpoczęciem współpracy."
                : "Cena została ustalona przy publikacji i nie może być edytowana."}
            </small>
          </div>

          <div className="ih5-job-edit-publication-summary">
            <span className="ih5-eyebrow">Warunki publikacji</span>
            <JobListingMeta job={job} />
            <small>
              Wybrany czas publikacji i charakter budżetu są zapisywane w
              chwili dodania zlecenia.
            </small>
          </div>

          {message && (
            <p className="ih5-notice is-error">
              {message}
            </p>
          )}

          <button
            className="ih5-button is-primary btn-large"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Zapisywanie..."
              : "Zapisz zmiany "}
          </button>
        </form>
      </main>
    </div>
  );
}

/* PROFILE */

function Profile() {
  const profileNavigate = useNavigate();
  const { canTransact: canContactProfile, loading: profileAgeLoading } = useAgeAccess();
  const { id } =
    useParams();

  const { user } =
    useAuth();

  const [profile, setProfile] =
    useState(null);
  const [loadedProfileId, setLoadedProfileId] = useState(null);

  const [countryCode, setCountryCode] =
    useState("");

  const [jobs, setJobs] =
    useState([]);

  const profileJobsTime = useListingClock(jobs);
  const visibleProfileJobs = jobs.filter(job => !getJobExpiryInfo(job.expires_at, profileJobsTime).expired);

  const [reviews, setReviews] =
    useState([]);

  const [portfolioItems, setPortfolioItems] =
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

  const [portfolioError, setPortfolioError] = useState("");

  const [portfolioViewer, setPortfolioViewer] =
    useState(null);

  const [portfolioReportTarget, setPortfolioReportTarget] =
    useState(null);

  const [portfolioReportMessage, setPortfolioReportMessage] =
    useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function loadProfile() {
      setLoading(true);
      setProfile(null);
      setCountryCode("");
      setJobs([]);
      setReviews([]);
      setPortfolioItems([]);
      setPortfolioError("");
      setBlockedByMe(false);
      setBlockedMe(false);
      setBlockMessage("");
      setPortfolioViewer(null);
      setPortfolioReportTarget(null);
      setMessage("");
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url, about, specialty_categories, specialization, skills, completed_jobs, disputed_jobs, positive_reviews, neutral_reviews, negative_reviews, posted_jobs")
          .eq("id", id).single();
        if (cancelled) return;
        if (profileError) throw profileError;
        if (!profileData) { setMessage("Nie znaleziono profilu."); return; }
        const checkBlocks = !!user?.id && user.id !== id;
        const results = await Promise.allSettled([
          supabase.from("ideahire_job_reviews")
            .select("id, contractor_id, rating, review_text, job_title_snapshot, created_at")
            .eq("contractor_id", id).order("created_at", { ascending: false }),
          checkBlocks ? supabase.from("user_blocks").select("id").eq("blocker_id", user.id).eq("blocked_id", id).maybeSingle() : Promise.resolve({ data: null }),
          checkBlocks ? supabase.from("user_blocks").select("id").eq("blocker_id", id).eq("blocked_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from("public_profiles").select("country_code").eq("user_id", id).maybeSingle(),
          supabase.from("jobs")
            .select("id, user_id, title, description, category, subcategory, budget, budget_negotiable, listing_duration_days, expires_at, created_at")
            .eq("user_id", id).eq("visibility", "public").eq("source_type", "client_posted").gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
          fetchPortfolioAlbums(id),
        ]);
        if (cancelled) return;
        const response = (index, label) => {
          const result = results[index];
          const error = result.status === "rejected" ? result.reason : result.value?.error;
          if (error) { console.error(`PROFILE ${label} ERROR:`, error); return null; }
          return result.value?.data;
        };
        setProfile(profileData);
        const loadedReviews = response(0, "REVIEWS");
        setReviews(Array.isArray(loadedReviews) ? loadedReviews : []);
        setBlockedByMe(!!response(1, "BLOCK STATUS")?.id);
        setBlockedMe(!!response(2, "BLOCKED STATUS")?.id);
        setCountryCode(response(3, "COUNTRY")?.country_code || "");
        setJobs(response(4, "JOBS") || []);
        if (results[5].status === "fulfilled") setPortfolioItems(results[5].value);
        else {
          console.error("PROFILE PORTFOLIO ERROR:", results[5].reason);
          setPortfolioError("Nie udało się wczytać portfolio. Odśwież profil i spróbuj ponownie.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("PROFILE LOAD ERROR:", error);
          setMessage("Nie udało się pobrać profilu. Odśwież stronę i spróbuj ponownie.");
        }
      } finally {
        if (!cancelled) { setLoadedProfileId(id); setLoading(false); }
      }
    }
    loadProfile();
    return () => { cancelled = true; };
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

  if (loading || loadedProfileId !== id) {
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

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
          (sum, review) =>
            sum + Math.max(
              1,
              Math.min(
                5,
                Number(review.rating) || 0
              )
            ),
          0
        ) / reviews.length
      : 0;

  const hasExpertiseDetails =
    visibleSpecialtyCategories.length > 0 ||
    visibleSkills.length > 0;

  const portfolioAlbums =
    portfolioItems.filter(
      (item) => getPortfolioMedia(item).length > 0
    );

  const portfolioLinks =
    portfolioItems.filter(
      (item) => !!item.project_url
    );

  return (
    <div className="page">
      <AccountNavbar />

      <main className="app-page">
        

        <section className="account-card profile-card-with-menu">
          <header className="ih85-profile-intro">
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

          <div className="profile-preview public-profile-preview">
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

            <div className={`profile-info public-profile-info ${
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

          {!profileHidden && isOtherProfile && (
            <ProfileContactAction profile={profile} user={user} supabase={supabase} navigate={profileNavigate}
              disabled={blockedByMe || blockedMe} canContact={!profileAgeLoading && canContactProfile} />
          )}
          </header>

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
            <section className="profile-stats" aria-label="Doświadczenie i opinie">
              <div className="profile-stat-card">
                <div className="profile-stat-top"><strong>Wykonane zlecenia</strong><span className="profile-stat-value">{completedJobs}</span></div>
                <div className="profile-stat-breakdown"><span>Zakończone: <strong>{completedJobs}</strong></span><span>Sporne: <strong>{disputedJobs}</strong></span></div>
              </div>
              <div className="profile-stat-card">
                <div className="profile-stat-top"><strong>Opinie</strong><span className="profile-stat-value">{totalReviews}</span></div>
                <div className="profile-stat-breakdown"><span>Pozytywne: <strong>{positiveReviews}</strong></span><span>Neutralne: <strong>{neutralReviews}</strong></span><span>Negatywne: <strong>{negativeReviews}</strong></span></div>
              </div>
            </section>
          )}

          {!profileHidden && <div className="ih85-profile-details">
          {!hasExpertiseDetails && !profile.specialization?.trim() && <section className="profile-expertise-card"><h2>Specjalizacja</h2><p className="ih20-profile-empty">Ten freelancer nie uzupełnił jeszcze specjalizacji i umiejętności.</p></section>}

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
                            {getJobCategoryLabel(category)}
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

          </div>}

          {!profileHidden && (
            <section
              className="profile-public-portfolio"
              aria-labelledby="profile-public-portfolio-title"
            >
              <div className="profile-public-portfolio-heading">
                <div>
                  <span className="profile-expertise-label">Wybrane realizacje</span>
                  <h2 id="profile-public-portfolio-title">Portfolio</h2>
                </div>
                <span className="profile-public-portfolio-count">
                  {portfolioItems.length} {portfolioItems.length === 1 ? "realizacja" : "realizacji"}
                </span>
              </div>

              {portfolioError ? <p className="ih20-profile-empty is-error" role="status">{portfolioError}</p> : portfolioItems.length === 0 && <div className="ih20-profile-empty"><MarketIcon kind="files" /><div><h3>Brak dodanych realizacji</h3><p>Ten freelancer nie dodał jeszcze realizacji do portfolio. Możesz zapytać o przykłady jego pracy w wiadomości.</p></div></div>}

              {portfolioReportMessage && (
                <p className="profile-public-report-message" role="status">
                  {portfolioReportMessage}
                </p>
              )}

              {portfolioAlbums.length > 0 && (
                <div className="profile-public-portfolio-group">
                  <div className="profile-public-portfolio-subheading">
                    <div>
                      <h3>Albumy ze zdjęciami</h3>
                      <p>Otwórz album, aby zobaczyć każde zdjęcie w pełnych proporcjach.</p>
                    </div>
                    <span>{portfolioAlbums.length}</span>
                  </div>

                  <div className="profile-public-portfolio-grid">
                    {portfolioAlbums.map((item) => {
                      const media = getPortfolioMedia(item);
                      const cover = media[0];

                      return (
                        <article
                          className="profile-public-portfolio-card"
                          id={`portfolio-${item.id}`}
                          key={item.id}
                        >
                          <button
                            type="button"
                            className="profile-public-album-cover"
                            onClick={() => setPortfolioViewer({ album: item, index: 0 })}
                            aria-label={`Otwórz album ${item.title}, ${media.length} zdjęć`}
                          >
                            <img
                              className="profile-public-album-cover-backdrop"
                              src={cover.image_url}
                              alt=""
                              aria-hidden="true"
                            />
                            <img
                              className="profile-public-album-cover-image"
                              src={cover.image_url}
                              alt={`Projekt: ${item.title}`}
                            />
                            <span className="profile-public-album-count">
                              <strong>{media.length}</strong>
                              {media.length === 1 ? "zdjęcie" : "zdjęć"}
                            </span>
                            <span className="profile-public-album-open">Otwórz album</span>
                          </button>

                          <div className="profile-public-portfolio-copy">
                            <span className="profile-public-album-label">Album</span>
                            <h3>{item.title}</h3>
                            {item.description && <p>{item.description}</p>}

                            {user?.id !== id && (
                              <button
                                type="button"
                                className="profile-public-item-report"
                                onClick={() => setPortfolioReportTarget({ album: item, media: null, kind: "album" })}
                              >
                                Zgłoś album
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {portfolioLinks.length > 0 && (
                <div className="profile-public-portfolio-group profile-public-links-group">
                  <div className="profile-public-portfolio-subheading">
                    <div>
                      <h3>Linki do projektów</h3>
                      <p>Zewnętrzne realizacje i materiały powiązane z portfolio.</p>
                    </div>
                    <span>{portfolioLinks.length}</span>
                  </div>

                  <div className="profile-public-project-links">
                    {portfolioLinks.map((item, index) => (
                      <article className="profile-public-project-link-row" key={item.id}>
                        <span className="profile-public-project-link-index" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="profile-public-project-link-copy">
                          <strong>{item.title}</strong>
                          {item.description && <p>{item.description}</p>}
                          <a
                            className="profile-public-project-link"
                            href={getSafeWebUrl(item.project_url) || undefined}
                            aria-disabled={!getSafeWebUrl(item.project_url)}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            title={item.project_url}
                          >
                            <span>{getPortfolioLinkLabel(item.project_url)}</span>
                            <span aria-hidden="true"></span>
                          </a>
                        </div>

                        {user?.id !== id && (
                          <button
                            type="button"
                            className="profile-public-item-report"
                            onClick={() => setPortfolioReportTarget({ album: item, media: null, kind: "link" })}
                          >
                            Zgłoś link
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {!profileHidden && (
            <section className="profile-reviews-section">
              <div className="profile-reviews-heading">
                <div>
                  <span className="profile-expertise-label">
                    Zweryfikowane współprace
                  </span>
                  <h2>Opinie zleceniodawców</h2>
                </div>

                {reviews.length > 0 && (
                  <div className="profile-rating-summary">
                    <strong>
                      {averageRating.toLocaleString(
                        "pl-PL",
                        {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        }
                      )}
                    </strong>
                    <span aria-label={`${averageRating.toFixed(1)} z 5 gwiazdek`}>
                      {Array.from(
                        { length: 5 },
                        (_, index) => (
                          <b
                            className={
                              index < Math.round(averageRating)
                                ? "is-active"
                                : ""
                            }
                            key={index}
                          >
                            ★
                          </b>
                        )
                      )}
                    </span>
                    <small>
                      {reviews.length} {reviews.length === 1
                        ? "opinia"
                        : reviews.length < 5
                        ? "opinie"
                        : "opinii"}
                    </small>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <p className="profile-reviews-empty">
                  Ten wykonawca nie otrzymał jeszcze opinii po zakończonym zleceniu.
                </p>
              ) : (
                <div className="profile-reviews-list">
                  {reviews.map((review) => {
                    const rating = Math.max(
                      1,
                      Math.min(
                        5,
                        Number(review.rating) || 0
                      )
                    );

                    return (
                      <article
                        className="profile-review-card"
                        key={review.id}
                      >
                        <div className="profile-review-card-top">
                          <div>
                            <strong>
                              {review.job_title_snapshot ||
                                "Zakończone zlecenie"}
                            </strong>
                            <small>
                              Zweryfikowana opinia po zakończeniu współpracy
                            </small>
                          </div>

                          <span aria-label={`${rating} z 5 gwiazdek`}>
                            {Array.from(
                              { length: 5 },
                              (_, index) => (
                                <b
                                  className={
                                    index < rating
                                      ? "is-active"
                                      : ""
                                  }
                                  key={index}
                                >
                                  ★
                                </b>
                              )
                            )}
                          </span>
                        </div>

                        <p>{review.review_text}</p>

                        <time dateTime={review.created_at}>
                          {new Date(
                            review.created_at
                          ).toLocaleDateString(
                            "pl-PL",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </time>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
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

          {visibleProfileJobs.length ===
          0 ? (
            <p>
              Ten użytkownik
              nie ma jeszcze
              opublikowanych
              zleceń.
            </p>
          ) : (
            <div className="jobs-list">
              {visibleProfileJobs.map(
                (job) => (
                  <article
                    className="job-card"
                    key={job.id}
                  >
                    <span className="section-label">
                      {getJobCategoryLabel(job.category)}
                      {job.subcategory ? ` · ${job.subcategory}` : ""}
                    </span>

                    <h2>
                      {job.title}
                    </h2>

                    <JobListingMeta job={job} compact />

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
                        {job.budget_negotiable
                          ? "Budżet orientacyjny — szczegóły ustalicie przed rozpoczęciem."
                          : "Cena została ustalona przy publikacji."}
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

      {portfolioViewer && (
        <PortfolioLightbox
          album={portfolioViewer.album}
          initialIndex={portfolioViewer.index}
          canReport={user?.id !== id}
          onClose={() => setPortfolioViewer(null)}
          onReport={(album, media) => {
            setPortfolioViewer(null);
            setPortfolioReportTarget({ album, media });
          }}
        />
      )}

      {portfolioReportTarget && (
        <PortfolioReportDialog
          target={portfolioReportTarget}
          onClose={() => setPortfolioReportTarget(null)}
          onSubmitted={(result) => {
            setPortfolioReportTarget(null);
            setPortfolioReportMessage(
              `Zgłoszenie ${result?.report_number || ""} zostało zapisane. Status i wynik analizy znajdziesz na swoim koncie.`
            );
          }}
        />
      )}
    </div>
  );
}

/* JOBS */

function JobsSpotlight({ jobs, formatBudget }) {
  const [activeId, setActiveId] = useState(jobs[0]?.id || "");
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  const sequence = jobs.map((job) => job.id).join("|");
  const activeIndex = Math.max(0, jobs.findIndex((job) => job.id === activeId));
  const job = jobs[activeIndex];
  const stopped = hidden || reducedMotion;

  useEffect(() => {
    setActiveId(jobs[0]?.id || "");
  }, [sequence]);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(!!query?.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updateMotion();
    updateVisibility();
    query?.addEventListener?.("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      query?.removeEventListener?.("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (jobs.length < 2 || stopped) return;
    const timer = window.setTimeout(() => {
      setActiveId(jobs[(activeIndex + 1) % jobs.length].id);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [sequence, activeId, stopped]);

  if (!job) return null;

  function changeJob(direction) {
    setActiveId(jobs[(activeIndex + direction + jobs.length) % jobs.length].id);
  }

  return (
    <section
      className={`ih10-jobs-spotlight${stopped ? " is-paused" : ""}`}
      aria-label="Podgląd zleceń"
    >
      <header className="ih10-spotlight-header">
        <span><i aria-hidden="true" />Odkryj zlecenie</span>
        {jobs.length > 1 && (
          <div className="ih10-spotlight-controls" aria-label="Sterowanie podglądem">
            <button type="button" onClick={() => changeJob(-1)} aria-label="Poprzednie zlecenie">Wstecz</button>
            <span aria-label={`Zlecenie ${activeIndex + 1} z ${jobs.length}`}>{activeIndex + 1} / {jobs.length}</span>
            <button type="button" onClick={() => changeJob(1)} aria-label="Następne zlecenie">Dalej</button>
          </div>
        )}
      </header>
      <div className="ih10-spotlight-body" key={job.id}>
        <div className="ih10-spotlight-copy">
          <span className="ih10-spotlight-category">{getJobCategoryLabel(job.category)}</span>
          <h2 title={job.title}>{job.title || "Zlecenie"}</h2>
          <p>{job.description || "Szczegóły znajdziesz w ogłoszeniu."}</p>
        </div>
        <div className="ih10-spotlight-price"><small>Budżet projektu</small><strong>{formatBudget(job.budget)}</strong></div>
      </div>
      <footer className="ih10-spotlight-footer">
        <a
          href={`#ih10-job-${job.id}`}
          onClick={(event) => {
            const target = document.getElementById(`ih10-job-${job.id}`);
            if (!target) return;
            event.preventDefault();
            target.focus({ preventScroll: true });
            target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
          }}
        >Pokaż w liście <MarketIcon kind="bookmark" /></a>
      </footer>
      {jobs.length > 1 && <div className="ih16-spotlight-progress" aria-hidden="true"><i key={`${job.id}:${stopped}`} /></div>}
    </section>
  );
}


function Jobs() {
  const { user } =
    useAuth();

  const {
    preferences: discoveryPreferences,
    loading: discoveryPreferencesLoading,
  } = useDiscoveryPreferences();

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

  const jobsTime = useListingClock(jobs);

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

  /* NOWE:
     WYSZUKIWANIE */

  const [search, setSearch] =
    useState("");

  const [sortMode, setSortMode] =
    useState("matched");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(
    "Wszystkie"
  );

  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [applicationNotice, setApplicationNotice] = useState("");

  useEffect(() => {
    if (discoveryPreferencesLoading) return;

    setSortMode(
      discoveryPreferences?.personalizationEnabled !== false &&
        (
          discoveryPreferences?.freelancerCategories ||
          discoveryPreferences?.preferredCategories ||
          []
        ).length > 0
        ? "matched"
        : "latest"
    );
  }, [
    discoveryPreferencesLoading,
    discoveryPreferences?.updatedAt,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const validCategory = JOB_CATEGORIES.includes(category) ? category : "Wszystkie";
    const subcategory = params.get("subcategory");
    setSelectedCategory(validCategory);
    setSelectedSubcategory(
      (JOB_SUBCATEGORIES[validCategory] || []).includes(subcategory) ? subcategory : ""
    );
  }, [location.search]);

  // P30: karta wyniku Lucyny otwiera istniejące ogłoszenie w zwykłym katalogu.
  useEffect(() => {
    const id = location.state?.lucynaJobId;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return;
    setSearch(String(location.state?.lucynaTitle || "").slice(0, 120));
    setSelectedCategory("Wszystkie"); setSelectedSubcategory(""); setOpenJobId(id);
  }, [location.key]);

  function chooseCategory(
    category
  ) {
    setSelectedCategory(
      category
    );
    setSelectedSubcategory("");

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
            "id, user_id, title, description, category, subcategory, project_stage, expected_outcome, client_materials, category_details, collaboration_plan, work_mode, location, experience_level, required_skills, requires_portfolio, reference_url, project_deadline, planned_start_date, budget, budget_negotiable, listing_duration_days, expires_at, created_at"
          )
          .eq("visibility", "public")
          .eq("source_type", "client_posted")
          .gt(
            "expires_at",
            new Date().toISOString()
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
    const refresh = () => { if (document.visibilityState !== 'hidden') loadJobs(); };
    window.addEventListener('focus',refresh);
    const channel = supabase.channel('public-job-listing-state').on('postgres_changes',{event:'*',schema:'public',table:'jobs'},refresh).subscribe();
    return ()=>{window.removeEventListener('focus',refresh);supabase.removeChannel(channel);};
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

  /* ZGŁOSZENIE DO ZLECENIA */

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

      setApplicationNotice("Zgłoszenie zostało wysłane. Zleceniodawca może teraz odpowiedzieć na Twoją ofertę.");
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

  /* WYSZUKIWANIE */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const filteredJobs =
    jobs.filter(
      (job) => {
        if (getJobExpiryInfo(job.expires_at, jobsTime).expired) return false;
        const categoryMatches =
          selectedCategory ===
            "Wszystkie" ||
          job.category ===
            selectedCategory;

        if (
          !categoryMatches ||
          (selectedSubcategory && job.subcategory !== selectedSubcategory)
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

        const subcategory =
          String(job.subcategory || "").toLowerCase();

        const expectedOutcome =
          String(job.expected_outcome || "").toLowerCase();

        const skills = Array.isArray(job.required_skills)
          ? job.required_skills.join(" ").toLowerCase()
          : "";

        return (
          title.includes(
            normalizedSearch
          ) ||
          description.includes(
            normalizedSearch
          ) ||
          category.includes(
            normalizedSearch
          ) ||
          subcategory.includes(normalizedSearch) ||
          expectedOutcome.includes(normalizedSearch) ||
          skills.includes(normalizedSearch)
        );
      }
    );

  const preferredJobCategories =
    discoveryPreferences?.freelancerCategories ||
    discoveryPreferences?.preferredCategories ||
    [];

  const canUseMatchedOrder =
    discoveryPreferences?.personalizationEnabled !== false &&
    preferredJobCategories.length > 0;

  const displayedJobs =
    [...filteredJobs].sort((firstJob, secondJob) => {
      if (sortMode === "matched" && canUseMatchedOrder) {
        const firstScore = preferredJobCategories.includes(
          firstJob.category
        )
          ? 0
          : 1;
        const secondScore = preferredJobCategories.includes(
          secondJob.category
        )
          ? 0
          : 1;

        if (firstScore !== secondScore) {
          return firstScore - secondScore;
        }
      }

      return (
        new Date(secondJob.created_at).getTime() -
        new Date(firstJob.created_at).getTime()
      );
    });

  function clearFilters() {
    setSearch("");
    setSelectedSubcategory("");
    setSelectedCategory(
      "Wszystkie"
    );
    navigate("/jobs", {
      replace: true,
    });
  }

  return (
    <div className="page ih-market-v5 ih5-jobs-page ih10-jobs-page ih25-jobs-page ih75-jobs-page">
      <AccountNavbar />

      <main className="ih-market-shell">
        <MarketHeader eyebrow="Dla wykonawców" title="Znajdź zlecenie" description="Dobry projekt zaczyna się od jasnych ustaleń. Znajdź coś dla siebie." count={filteredJobs.length} status={loading ? "Szukamy zleceń…" : message ? "Wyniki niedostępne" : undefined} />

        {isLimited && (
          <section className="ih5-jobs-age-notice">
            <span className="ih5-jobs-age-notice-icon" aria-hidden="true">16+</span>
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


        {/* WYSZUKIWARKA */}


        <MarketFilters search={search} onSearch={setSearch} categories={JOB_CATEGORIES} category={selectedCategory} onCategory={chooseCategory} categoryLabel={getJobCategoryLabel} sort={sortMode} onSort={setSortMode} matchedAvailable={canUseMatchedOrder}>
        {selectedSubcategory && <div className="ih5-active-filter"><span>{selectedSubcategory}</span><button type="button" onClick={() => chooseCategory(selectedCategory)} aria-label="Usuń filtr specjalizacji"><MarketIcon kind="close" /></button></div>}

        {applicationNotice && <p className="ih5-notice is-success ih5-application-notice" role="status" aria-live="polite">{applicationNotice}</p>}

        {/* WYNIKI */}



        {loading && (
          <InlineRouteLoader
            className="ih5-jobs-route-loader"
            rows={4}
          />
        )}

        {!loading &&
          message && (
            <p className="ih5-notice is-error">
              {message}
            </p>
          )}

        {!loading &&
          !message &&
          jobs.length === 0 && (
            <section className="ih5-empty">
              <span className="ih5-eyebrow">
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
            <section className="ih5-empty ih5-jobs-empty-search">
              <span className="ih5-eyebrow">
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
                className="ih5-button is-primary"
                onClick={
                  clearFilters
                }
              >
                Wyczyść wyszukiwanie 
              </button>
            </section>
          )}

        {/* LISTA ZLECEŃ */}


        <div className="ih5-jobs-list">
          {displayedJobs.map(
            (job, jobIndex) => {
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

              const isMatched =
                sortMode === "matched" &&
                canUseMatchedOrder &&
                preferredJobCategories.includes(job.category);

              const safeReferenceUrl =
                getSafeJobReferenceUrl(job.reference_url);

              const collaborationPlanData = hasCollaborationPlan(
                job.collaboration_plan
              )
                ? job.collaboration_plan
                : null;

              const collaborationMilestones = cleanCollaborationList(
                collaborationPlanData?.milestones,
                3,
                160
              );

              const collaborationCriteria = cleanCollaborationList(
                collaborationPlanData?.completion_criteria,
                3,
                240
              );

              const collaborationQuestions = cleanCollaborationList(
                collaborationPlanData?.screening_questions,
                3,
                240
              );

              const collaborationRequirements = Array.isArray(
                collaborationPlanData?.application_requirements
              )
                ? collaborationPlanData.application_requirements.filter((value) =>
                    COLLABORATION_APPLICATION_REQUIREMENTS.some(
                      (option) => option.value === value
                    )
                  )
                : [];

              const displaySkills = visibleJobSkills(job.required_skills);
              return (
                <article
                  className={`ih5-job-card ih73-job-row ih79-job${isOpen ? " is-open" : ""}`}
                  style={{ "--ih-job-order": Math.min(jobIndex, 5) }}
                  id={`ih10-job-${job.id}`}
                  tabIndex={-1}
                  aria-labelledby={`ih-job-title-${job.id}`}
                  key={job.id}
                >
                  <div className="ih5-job-card-top">
                    <span className="ih5-eyebrow">
                      {getJobCategoryLabel(job.category)}
                      {job.subcategory ? ` · ${job.subcategory}` : ""}
                    </span>

                    <span
                      className={`ih5-job-active-badge ${
                        isMatched ? "is-matched" : "is-active"
                      }`}
                    >
                      {isMatched
                        ? "Pasuje do Twoich kategorii"
                        : "Otwarte na zgłoszenia"}
                    </span>
                  </div>

                  <div className="ih5-job-overview">
                    <div className="ih5-job-copy">
                      <h2 className="ih5-job-title" id={`ih-job-title-${job.id}`} title={job.title}>{job.title}</h2>
                      <p className="ih5-job-summary">{job.description || "Brak opisu zlecenia."}</p>
                    </div>
                    <div className="ih5-job-price"><span>Budżet</span><strong>{formatBudget(job.budget)}</strong><small>{job.budget_negotiable ? "Do negocjacji" : "Cena ustalona"}</small></div>
                  </div>
                  <div className="ih5-job-facts">
                    <div><span>Współpraca</span><strong>{getJobOptionLabel(JOB_WORK_MODES, job.work_mode)}</strong></div>
                    <div><span>Termin</span><strong>{job.project_deadline ? formatDate(job.project_deadline) : "Do ustalenia"}</strong></div>
                    <div><span>Opublikowano</span><strong>{formatDate(job.created_at)}</strong><small className="ih5-job-expiry">{getJobExpiryInfo(job.expires_at).label}</small></div>
                  </div>
                  {displaySkills.length > 0 && <div className="ih5-job-skills" aria-label="Wymagane umiejętności">{(isOpen ? displaySkills : displaySkills.slice(0, 3)).map((skill) => <span key={skill}>{skill}</span>)}{!isOpen && displaySkills.length > 3 && <span>+{displaySkills.length - 3}</span>}</div>}

                  {isOpen && (
                    <div className="ih5-job-details ih5-job-collaboration-details" id={`ih-job-plan-${job.id}`} aria-labelledby={`ih-job-plan-title-${job.id}`}>
                      <header className="ih5-job-collaboration-header">
                        <span className="ih5-job-collaboration-header-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M8 12.5 10.5 15 16 9.5M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                          </svg>
                        </span>
                        <div>
                          
                          <h3 id={`ih-job-plan-title-${job.id}`}>Plan współpracy</h3>
                          <p>
                            Szczegóły zlecenia i wymagania.
                          </p>
                        </div>
                      </header>

                      <section className="ih5-job-collaboration-section">
                        <div className="ih5-job-collaboration-section-heading">
                          <span>01</span>
                          <div>
                            <h4>Zakres realizacji</h4>
                            <p>Najważniejsze informacje przekazane przez zleceniodawcę.</p>
                          </div>
                        </div>

                      {job.expected_outcome && (
                        <div className="ih5-job-detail-section">
                          <span>Oczekiwany rezultat</span>
                          <p>{job.expected_outcome}</p>
                        </div>
                      )}

                      {job.client_materials && (
                        <div className="ih5-job-detail-section">
                          <span>Materiały od zleceniodawcy</span>
                          <p>{job.client_materials}</p>
                        </div>
                      )}

                      {job.category_details && Object.keys(job.category_details).length > 0 && (
                        <dl className="ih5-job-category-detail-list">
                          {Object.entries(job.category_details).map(([key, value]) => (
                            <div key={key}>
                              <dt>{getJobCategoryFieldLabel(job.category, key)}</dt>
                              <dd>{String(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {safeReferenceUrl && (
                        <a
                          className="ih5-job-reference-link"
                          href={safeReferenceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Otwórz materiały i inspiracje
                        </a>
                      )}

                      </section>

                      {collaborationPlanData ? (
                        <>
                          <section className="ih5-job-collaboration-section">
                            <div className="ih5-job-collaboration-section-heading">
                              <span>02</span>
                              <div>
                                <h4>Przebieg i komunikacja</h4>
                                <p>Jak będzie wyglądała praca od rozpoczęcia do odbioru.</p>
                              </div>
                            </div>

                            {collaborationMilestones.length > 0 && (
                              <ol className="ih5-job-collaboration-timeline">
                                {collaborationMilestones.map((milestone, index) => (
                                  <li key={`${job.id}-milestone-${index}`}>
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <strong>{milestone}</strong>
                                  </li>
                                ))}
                              </ol>
                            )}

                            <dl className="ih5-job-collaboration-facts">
                              <div>
                                <dt>Poprawki</dt>
                                <dd>
                                  {getJobOptionLabel(
                                    COLLABORATION_REVISION_OPTIONS,
                                    collaborationPlanData.revision_rounds
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Zatwierdzanie</dt>
                                <dd>
                                  {getJobOptionLabel(
                                    COLLABORATION_APPROVAL_OPTIONS,
                                    collaborationPlanData.approval_mode
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Kontakt</dt>
                                <dd>
                                  {getJobOptionLabel(
                                    COLLABORATION_CONTACT_OPTIONS,
                                    collaborationPlanData.contact_frequency
                                  )}
                                </dd>
                              </div>
                              <div>
                                <dt>Uwagi zleceniodawcy</dt>
                                <dd>
                                  {getJobOptionLabel(
                                    COLLABORATION_FEEDBACK_OPTIONS,
                                    collaborationPlanData.feedback_time
                                  )}
                                </dd>
                              </div>
                            </dl>
                          </section>

                          <section className="ih5-job-collaboration-section">
                            <div className="ih5-job-collaboration-section-heading">
                              <span>03</span>
                              <div>
                                <h4>Odbiór i odpowiedzialność</h4>
                                <p>Warunki ukończenia oraz obowiązki każdej strony.</p>
                              </div>
                            </div>

                            <div className="ih5-job-collaboration-responsibility-grid">
                              {collaborationCriteria.length > 0 && (
                                <article>
                                  <span>Kryteria ukończenia</span>
                                  <ul>
                                    {collaborationCriteria.map((criterion, index) => (
                                      <li key={`${job.id}-criterion-${index}`}>
                                        {criterion}
                                      </li>
                                    ))}
                                  </ul>
                                </article>
                              )}

                              {collaborationPlanData.client_responsibilities && (
                                <article>
                                  <span>Zleceniodawca dostarczy</span>
                                  <p>{collaborationPlanData.client_responsibilities}</p>
                                </article>
                              )}

                              {collaborationPlanData.contractor_responsibilities && (
                                <article>
                                  <span>Wykonawca dostarczy</span>
                                  <p>{collaborationPlanData.contractor_responsibilities}</p>
                                </article>
                              )}

                              <article>
                                <span>Zmiany poza zakresem</span>
                                <strong>
                                  {getJobOptionLabel(
                                    COLLABORATION_CHANGE_OPTIONS,
                                    collaborationPlanData.change_policy
                                  )}
                                </strong>
                                <p>
                                  {COLLABORATION_CHANGE_OPTIONS.find(
                                    (option) =>
                                      option.value === collaborationPlanData.change_policy
                                  )?.description ||
                                    "Szczegóły zostaną ustalone przed rozpoczęciem współpracy."}
                                </p>
                              </article>
                            </div>
                          </section>

                          {(collaborationRequirements.length > 0 ||
                            collaborationQuestions.length > 0) && (
                            <section className="ih5-job-collaboration-section">
                              <div className="ih5-job-collaboration-section-heading">
                                <span>04</span>
                                <div>
                                  <h4>Przygotuj kompletne zgłoszenie</h4>
                                  <p>Uwzględnij poniższe informacje w swojej odpowiedzi.</p>
                                </div>
                              </div>

                              {collaborationRequirements.length > 0 && (
                                <div className="ih5-job-collaboration-requirements">
                                  {collaborationRequirements.map((value) => (
                                    <span key={`${job.id}-${value}`}>
                                      {
                                        COLLABORATION_APPLICATION_REQUIREMENTS.find(
                                          (option) => option.value === value
                                        )?.label
                                      }
                                    </span>
                                  ))}
                                </div>
                              )}

                              {collaborationQuestions.length > 0 && (
                                <ol className="ih5-job-collaboration-questions">
                                  {collaborationQuestions.map((question, index) => (
                                    <li key={`${job.id}-question-${index}`}>
                                      <span>{String(index + 1).padStart(2, "0")}</span>
                                      <p>{question}</p>
                                    </li>
                                  ))}
                                </ol>
                              )}
                            </section>
                          )}
                        </>
                      ) : (
                        <div className="ih5-job-collaboration-empty">
                          <strong>Podstawowe ustalenia</strong>
                          <p>
                            Zleceniodawca nie dodał rozszerzonego planu. Szczegóły współpracy możecie ustalić przed rozpoczęciem projektu.
                          </p>
                        </div>
                      )}

                      <div className="ih5-job-details-actions">
                        <Link
                          to={`/profile/${job.user_id}`}
                          className="ih5-button is-quiet"
                        >
                          Zobacz profil zleceniodawcy 
                        </Link>

                        {!isOwner && (
                          <button
                            className="ih5-button is-primary"
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
                              : "Zgłoś się"}
                          </button>
                        )}

                        <button
                          className="ih5-button is-quiet"
                          type="button"
                          onClick={() =>
                            setOpenJobId(
                              null
                            )
                          }
                        >
                          Ukryj plan
                        </button>
                      </div>

                      {isOwner && (
                        <p className="ih5-job-owner-note">
                          <small>
                            To jest Twoje
                            zlecenie.
                          </small>
                        </p>
                      )}
                    </div>
                  )}

                  {!isOpen && (
                    <div className="ih5-job-actions">
                      <button
                        className="ih5-button is-quiet"
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`ih-job-plan-${job.id}`}
                        onClick={() => setOpenJobId(job.id)}
                      >
                        Szczegóły <MarketIcon kind="arrow" />
                      </button>

                      {!isOwner && (
                        <button
                          className="ih5-button is-primary"
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
                            : "Zgłoś się"}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            }
          )}
        </div>
        </MarketFilters>
      </main>
    </div>
  );
}

/* TALENT DIRECTORY — POMOCNE DOPASOWANIE, BEZ BLOKAD RÓL */

function calendarPad(value) {
  return String(value).padStart(2, "0");
}

const CALENDAR_WEEKDAYS = Object.freeze(["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"]);
const CALENDAR_EVENT_TYPES = Object.freeze([
  { value: "deadline", label: "Termin projektu", shortLabel: "Termin" },
  { value: "meeting", label: "Spotkanie", shortLabel: "Spotkanie" },
  { value: "payment", label: "Płatność", shortLabel: "Płatność" },
  { value: "personal", label: "Własne zadanie", shortLabel: "Zadanie" },
]);
const CALENDAR_REMINDER_OPTIONS = Object.freeze([
  { value: 15, label: "15 minut wcześniej" },
  { value: 60, label: "Godzinę wcześniej" },
  { value: 180, label: "3 godziny wcześniej" },
  { value: 1440, label: "Dzień wcześniej" },
  { value: 10080, label: "Tydzień wcześniej" },
]);

function getCalendarDateKey(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    calendarPad(date.getMonth() + 1),
    calendarPad(date.getDate()),
  ].join("-");
}

function getCalendarDateTimeInput(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${getCalendarDateKey(date)}T${calendarPad(
    date.getHours()
  )}:${calendarPad(date.getMinutes())}`;
}

function getCalendarMonthStart(value) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    12,
    0,
    0,
    0
  );
}

function getCalendarGridDays(monthDate) {
  const firstDay =
    getCalendarMonthStart(monthDate);

  const mondayOffset =
    (firstDay.getDay() + 6) % 7;

  const gridStart =
    new Date(firstDay);

  gridStart.setDate(
    firstDay.getDate() - mondayOffset
  );

  return Array.from(
    { length: 42 },
    (_, index) => {
      const day =
        new Date(gridStart);

      day.setDate(
        gridStart.getDate() + index
      );

      return day;
    }
  );
}

function getCalendarType(type) {
  return (
    CALENDAR_EVENT_TYPES.find(
      (item) => item.value === type
    ) || CALENDAR_EVENT_TYPES[3]
  );
}

function getCalendarMonthLabel(value, locale = "pl-PL") {
  return new Intl.DateTimeFormat(
    locale,
    {
      month: "long",
      year: "numeric",
    }
  ).format(value);
}

function getCalendarDayLabel(value, locale = "pl-PL") {
  return new Intl.DateTimeFormat(
    locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(value);
}

function getCalendarEventDateLabel(value, allDay = false, locale = "pl-PL") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return locale.startsWith("en") ? "Invalid date" : "Nieprawidłowy termin";
  }

  const datePart =
    new Intl.DateTimeFormat(
      locale,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    ).format(date);

  if (allDay) {
    return datePart;
  }

  const timePart =
    new Intl.DateTimeFormat(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    ).format(date);

  return `${datePart}, ${timePart}`;
}

function getCalendarTimeLabel(value, allDay = false, locale = "pl-PL") {
  if (allDay) {
    return locale.startsWith("en") ? "Job deadline" : "Termin zlecenia";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function getCalendarDateOnlyValue(value, hour = 12) {
  if (!value) return null;

  const parts =
    String(value)
      .slice(0, 10)
      .split("-")
      .map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return null;
  }

  return new Date(
    parts[0],
    parts[1] - 1,
    parts[2],
    hour,
    0,
    0,
    0
  );
}

function createCalendarDraft(dateValue = new Date()) {
  const now = new Date();
  const selectedDate =
    dateValue instanceof Date
      ? new Date(dateValue)
      : new Date(dateValue);

  const isToday =
    getCalendarDateKey(selectedDate) ===
    getCalendarDateKey(now);

  if (isToday) {
    selectedDate.setHours(
      now.getHours() + 1,
      0,
      0,
      0
    );
  } else {
    selectedDate.setHours(
      9,
      0,
      0,
      0
    );
  }

  return {
    title: "",
    description: "",
    event_type: "deadline",
    starts_at:
      getCalendarDateTimeInput(
        selectedDate
      ),
    reminder_enabled: true,
    reminder_minutes_before: 1440,
    email_enabled: true,
    linked_job_id: null,
  };
}

function Calendar() {
  const calendarEnglish = useSitePreferences().language === "en";
  const calendarLocale = calendarEnglish ? "en-GB" : "pl-PL";
  const [calendarView, setCalendarView] = useState("agenda");
  const { user } =
    useAuth();

  const today =
    new Date();

  const [currentMonth, setCurrentMonth] =
    useState(
      getCalendarMonthStart(today)
    );

  const [selectedDate, setSelectedDate] =
    useState(today);

  const [customEvents, setCustomEvents] =
    useState([]);

  const [jobEvents, setJobEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [dialogOpen, setDialogOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [draft, setDraft] =
    useState(() =>
      createCalendarDraft(today)
    );

  const [saving, setSaving] =
    useState(false);

  const [monthDirection, setMonthDirection] =
    useState("next");
  const calendarLoadRef = useRef(0);
  useEffect(() => () => { calendarLoadRef.current += 1; }, []);

  const loadCalendarContent =
    useCallback(async () => {
      if (!user?.id) return;
      const requestId = ++calendarLoadRef.current;

      setLoading(true);
      setMessage("");

      const gridDays =
        getCalendarGridDays(
          currentMonth
        );

      const rangeStart =
        new Date(gridDays[0]);

      rangeStart.setHours(
        0,
        0,
        0,
        0
      );

      const rangeEnd =
        new Date(
          gridDays[
            gridDays.length - 1
          ]
        );

      rangeEnd.setHours(
        23,
        59,
        59,
        999
      );

      try {
        const {
          data: eventRows,
          error: eventsError,
        } = await supabase
          .from(
            "ideahire_calendar_events"
          )
          .select(
            "id, user_id, title, description, event_type, starts_at, linked_job_id, reminder_enabled, reminder_minutes_before, email_enabled, reminder_sent_at, completed_at, created_at, updated_at"
          )
          .eq("user_id", user.id)
          .gte(
            "starts_at",
            rangeStart.toISOString()
          )
          .lte(
            "starts_at",
            rangeEnd.toISOString()
          )
          .order("starts_at", {
            ascending: true,
          });

        if (requestId !== calendarLoadRef.current) return;
        if (eventsError) {
          console.error("CALENDAR EVENTS ERROR:", eventsError);
          setMessage("Nie udało się pobrać własnych terminów. Możesz ponowić próbę; kalendarz i terminy zleceń pozostają dostępne.");
        }

        setCustomEvents(
          (eventsError ? [] : eventRows || []).map(
            (item) => ({
              ...item,
              source: "custom",
              all_day: false,
              read_only: false,
            })
          )
        );

        const {
          data: ownedJobs,
          error: ownedJobsError,
        } = await supabase
          .from("jobs")
          .select(
            "id, user_id, title, project_deadline, planned_start_date"
          )
          .eq("user_id", user.id);

        if (ownedJobsError) {
          console.error(
            "CALENDAR OWNED JOBS ERROR:",
            ownedJobsError
          );
        }

        const {
          data: acceptedApplications,
          error: applicationsError,
        } = await supabase
          .from("job_applications")
          .select("job_id")
          .eq("applicant_id", user.id)
          .eq("status", "accepted");

        if (applicationsError) {
          console.error(
            "CALENDAR APPLICATIONS ERROR:",
            applicationsError
          );
        }

        const acceptedJobIds = [
          ...new Set(
            (acceptedApplications || [])
              .map((item) => item.job_id)
              .filter(Boolean)
          ),
        ];

        let acceptedJobs = [];

        if (acceptedJobIds.length > 0) {
          const {
            data,
            error,
          } = await supabase
            .from("jobs")
            .select(
              "id, user_id, title, project_deadline, planned_start_date"
            )
            .in("id", acceptedJobIds);

          if (error) {
            console.error(
              "CALENDAR ACCEPTED JOBS ERROR:",
              error
            );
          } else {
            acceptedJobs = data || [];
          }
        }

        const jobsById =
          new Map();

        for (
          const job of [
            ...(ownedJobs || []),
            ...acceptedJobs,
          ]
        ) {
          jobsById.set(job.id, job);
        }

        const nextJobEvents = [];

        for (
          const job of
          jobsById.values()
        ) {
          const startDate =
            getCalendarDateOnlyValue(
              job.planned_start_date,
              9
            );

          const deadlineDate =
            getCalendarDateOnlyValue(
              job.project_deadline,
              18
            );

          if (startDate) {
            nextJobEvents.push({
              id: `job-start:${job.id}`,
              title: `Start: ${job.title}`,
              description:
                "Planowany początek realizacji zlecenia.",
              event_type: "meeting",
              starts_at:
                startDate.toISOString(),
              linked_job_id: job.id,
              reminder_enabled: false,
              email_enabled: false,
              completed_at: null,
              source: "job",
              all_day: true,
              read_only: true,
            });
          }

          if (deadlineDate) {
            nextJobEvents.push({
              id: `job-deadline:${job.id}`,
              title: `Termin: ${job.title}`,
              description:
                "Termin wykonania wskazany w zleceniu.",
              event_type: "deadline",
              starts_at:
                deadlineDate.toISOString(),
              linked_job_id: job.id,
              reminder_enabled: false,
              email_enabled: false,
              completed_at: null,
              source: "job",
              all_day: true,
              read_only: true,
            });
          }
        }

        if (requestId !== calendarLoadRef.current) return;
        setJobEvents(
          nextJobEvents
        );
      } catch (error) {
        if (requestId !== calendarLoadRef.current) return;
        console.error(
          "CALENDAR LOAD ERROR:",
          error
        );

        setCustomEvents([]);

        setMessage("Nie udało się pobrać zapisanych terminów. Spróbuj ponownie za chwilę.");
      } finally {
        if (requestId === calendarLoadRef.current) setLoading(false);
      }
    }, [
      currentMonth,
      user?.id,
    ]);

  useEffect(() => {
    loadCalendarContent();
  }, [loadCalendarContent]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const channel =
      supabase
        .channel(
          `calendar-events:${user.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "ideahire_calendar_events",
            filter:
              `user_id=eq.${user.id}`,
          },
          loadCalendarContent
        )
        .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    loadCalendarContent,
    user?.id,
  ]);

  useEffect(() => {
    if (!dialogOpen) return undefined;

    function closeWithEscape(event) {
      if (
        event.key === "Escape" &&
        !saving
      ) {
        setDialogOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    document.body.classList.add(
      "calendar-dialog-open"
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );

      document.body.classList.remove(
        "calendar-dialog-open"
      );
    };
  }, [dialogOpen, saving]);

  const gridDays =
    getCalendarGridDays(
      currentMonth
    );

  const allEvents = [
    ...customEvents,
    ...jobEvents,
  ].sort(
    (first, second) =>
      new Date(first.starts_at) -
      new Date(second.starts_at)
  );

  const selectedKey =
    getCalendarDateKey(
      selectedDate
    );

  const selectedDayEvents =
    allEvents.filter(
      (item) =>
        getCalendarDateKey(
          item.starts_at
        ) === selectedKey
    );

  const upcomingStart = new Date(selectedDate);
  upcomingStart.setHours(0, 0, 0, 0);
  upcomingStart.setDate(upcomingStart.getDate() + 1);
  const upcomingEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const upcomingEvents = allEvents.filter(item => {
    const timestamp = new Date(item.starts_at).getTime();
    return !item.completed_at && timestamp >= upcomingStart.getTime() && timestamp < upcomingEnd.getTime();
  }).slice(0, 6);

  const selectedWeekStart = new Date(selectedDate);
  selectedWeekStart.setDate(selectedWeekStart.getDate() - (selectedWeekStart.getDay() + 6) % 7);
  selectedWeekStart.setHours(0, 0, 0, 0);
  const selectedWeekEnd = new Date(selectedWeekStart);
  selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 7);
  const selectedWeekCount = allEvents.filter(item => {
    const timestamp = new Date(item.starts_at).getTime();
    return !item.completed_at && timestamp >= selectedWeekStart.getTime() && timestamp < selectedWeekEnd.getTime();
  }).length;

  const activeEmailReminders =
    customEvents.filter(
      (item) =>
        item.reminder_enabled &&
        item.email_enabled &&
        !item.completed_at
    ).length;

  const completedThisMonth =
    customEvents.filter(
      (item) =>
        item.completed_at &&
        new Date(
          item.completed_at
        ).getMonth() ===
          currentMonth.getMonth() &&
        new Date(
          item.completed_at
        ).getFullYear() ===
          currentMonth.getFullYear()
    ).length;

  function openCreateDialog(
    date = selectedDate,
    seed = {}
  ) {
    const baseDraft =
      createCalendarDraft(date);

    setEditingId(null);
    setDraft({
      ...baseDraft,
      ...seed,
    });
    setMessage("");
    setDialogOpen(true);
  }

  function openEditDialog(eventItem) {
    if (
      !eventItem ||
      eventItem.read_only
    ) {
      return;
    }

    setEditingId(eventItem.id);
    setDraft({
      title:
        eventItem.title || "",
      description:
        eventItem.description || "",
      event_type:
        eventItem.event_type ||
        "personal",
      starts_at:
        getCalendarDateTimeInput(
          eventItem.starts_at
        ),
      reminder_enabled:
        Boolean(
          eventItem.reminder_enabled
        ),
      reminder_minutes_before:
        Number(
          eventItem.reminder_minutes_before ??
            1440
        ),
      email_enabled:
        Boolean(
          eventItem.email_enabled
        ),
      linked_job_id:
        eventItem.linked_job_id ||
        null,
    });
    setMessage("");
    setDialogOpen(true);
  }

  function openJobReminder(eventItem) {
    openCreateDialog(
      new Date(
        eventItem.starts_at
      ),
      {
        title:
          eventItem.title,
        description:
          eventItem.description,
        event_type:
          eventItem.event_type,
        starts_at:
          getCalendarDateTimeInput(
            eventItem.starts_at
          ),
        linked_job_id:
          eventItem.linked_job_id,
      }
    );
  }

  function selectCalendarDate(value) {
    const next = new Date(value);
    if (!Number.isFinite(next.getTime())) return;
    next.setHours(12, 0, 0, 0);
    if (next.getMonth() !== currentMonth.getMonth() || next.getFullYear() !== currentMonth.getFullYear()) setMonthDirection(next < currentMonth ? "previous" : "next");
    setSelectedDate(next);
    setCurrentMonth(current => current.getMonth() === next.getMonth() && current.getFullYear() === next.getFullYear() ? current : getCalendarMonthStart(next));
  }

  function moveCalendarDay(offset) {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    selectCalendarDate(next);
  }

  function changeMonth(offset) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1, 12);
    setMonthDirection(offset > 0 ? "next" : "previous");
    setCurrentMonth(getCalendarMonthStart(next));
    setSelectedDate(next);
  }

  function goToToday() {
    const now = new Date();

    setMonthDirection("today");
    setCurrentMonth(
      getCalendarMonthStart(now)
    );
    setSelectedDate(now);
  }

  async function handleCalendarSave(
    event
  ) {
    event.preventDefault();

    if (!user?.id || saving) return;

    const cleanTitle =
      draft.title.trim();

    const cleanDescription =
      draft.description.trim();

    const startsAt =
      new Date(
        draft.starts_at
      );

    if (!cleanTitle) {
      setMessage(
        "Wpisz nazwę przypomnienia."
      );
      return;
    }

    if (cleanTitle.length > 120) {
      setMessage(
        "Nazwa może mieć maksymalnie 120 znaków."
      );
      return;
    }

    if (cleanDescription.length > 1000) {
      setMessage(
        "Notatka może mieć maksymalnie 1000 znaków."
      );
      return;
    }

    if (
      Number.isNaN(
        startsAt.getTime()
      )
    ) {
      setMessage(
        "Wybierz prawidłową datę i godzinę."
      );
      return;
    }

    if (
      !editingId &&
      startsAt.getTime() <
        Date.now() - 60 * 1000
    ) {
      setMessage(
        "Nowy termin nie może znajdować się w przeszłości."
      );
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      user_id: user.id,
      title: cleanTitle,
      description:
        cleanDescription || null,
      event_type:
        draft.event_type,
      starts_at:
        startsAt.toISOString(),
      linked_job_id:
        draft.linked_job_id ||
        null,
      reminder_enabled:
        Boolean(
          draft.reminder_enabled
        ),
      reminder_minutes_before:
        Number(
          draft.reminder_minutes_before
        ),
      email_enabled:
        Boolean(
          draft.reminder_enabled &&
          draft.email_enabled
        ),
      timezone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "Europe/Warsaw",
    };

    try {
      let request;

      if (editingId) {
        request =
          supabase
            .from(
              "ideahire_calendar_events"
            )
            .update(payload)
            .eq("id", editingId)
            .eq("user_id", user.id);
      } else {
        request =
          supabase
            .from(
              "ideahire_calendar_events"
            )
            .insert(payload);
      }

      const { error } =
        await request;

      if (error) throw error;

      setDialogOpen(false);
      setEditingId(null);
      setSelectedDate(startsAt);
      setCurrentMonth(
        getCalendarMonthStart(
          startsAt
        )
      );
      setSuccessMessage(
        editingId
          ? "Przypomnienie zostało zapisane."
          : "Termin został dodany do kalendarza."
      );

      await loadCalendarContent();

      window.setTimeout(
        () =>
          setSuccessMessage(""),
        3600
      );
    } catch (error) {
      console.error(
        "CALENDAR SAVE ERROR:",
        error
      );

      setMessage(
        `Nie udało się zapisać terminu: ${
          error?.message ||
          "nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCalendarDelete() {
    if (
      !editingId ||
      !user?.id ||
      saving
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Usunąć to przypomnienie?"
      );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } =
        await supabase
          .from(
            "ideahire_calendar_events"
          )
          .delete()
          .eq("id", editingId)
          .eq("user_id", user.id);

      if (error) throw error;

      setDialogOpen(false);
      setEditingId(null);
      setSuccessMessage(
        "Przypomnienie zostało usunięte."
      );

      await loadCalendarContent();
    } catch (error) {
      setMessage(
        `Nie udało się usunąć terminu: ${
          error?.message ||
          "nieznany błąd"
        }`
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCalendarCompleted(
    eventItem
  ) {
    if (
      !eventItem?.id ||
      eventItem.read_only ||
      !user?.id
    ) {
      return;
    }

    const nextCompletedAt =
      eventItem.completed_at
        ? null
        : new Date().toISOString();

    const { error } =
      await supabase
        .from(
          "ideahire_calendar_events"
        )
        .update({
          completed_at:
            nextCompletedAt,
        })
        .eq("id", eventItem.id)
        .eq("user_id", user.id);

    if (error) {
      setMessage(
        `Nie udało się zmienić statusu: ${error.message}`
      );
      return;
    }

    await loadCalendarContent();
  }

  function renderAgendaItem(
    eventItem,
    compact = false
  ) {
    const type =
      getCalendarType(
        eventItem.event_type
      );

    if (compact) {
      const eventDate = new Date(eventItem.starts_at);
      return <button type="button" key={eventItem.id} className="ih76-upcoming-event" onClick={() => { selectCalendarDate(eventDate); setCalendarView("agenda"); }}
        aria-label={`${eventItem.title}, ${getCalendarEventDateLabel(eventItem.starts_at, eventItem.all_day, calendarLocale)}`}>
        <time className="ih76-date-stamp" dateTime={eventItem.starts_at}><strong>{eventDate.getDate()}</strong><span>{new Intl.DateTimeFormat(calendarLocale, { month: "short" }).format(eventDate)}</span></time>
        <span className="ih76-upcoming-copy"><small>{calendarEnglish ? translateUiText(type.shortLabel) : type.shortLabel}{eventItem.source === "job" ? (calendarEnglish ? " · Job" : " · Zlecenie") : ""}</small><strong>{eventItem.title}</strong><span>{getCalendarTimeLabel(eventItem.starts_at, eventItem.all_day, calendarLocale)}</span></span>
        <WorkspaceIcon kind="next" />
      </button>;
    }

    return (
      <article
        key={eventItem.id}
        className={`calendar-agenda-item is-${eventItem.event_type}${
          eventItem.completed_at
            ? " is-completed"
            : ""
        }${
          compact
            ? " is-compact"
            : ""
        }`}
      >
        <span
          className="calendar-agenda-marker"
          aria-hidden="true"
        />

        <div className="calendar-agenda-copy">
          <span className="calendar-agenda-meta">
            {calendarEnglish ? translateUiText(type.shortLabel) : type.shortLabel}
            {eventItem.source === "job" && (
              <em>Zlecenie</em>
            )}
          </span>

          <strong>
            {eventItem.title}
          </strong>

          <time
            dateTime={
              eventItem.starts_at
            }
          >
            {compact
              ? getCalendarEventDateLabel(eventItem.starts_at, eventItem.all_day, calendarLocale)
              : getCalendarTimeLabel(eventItem.starts_at, eventItem.all_day, calendarLocale)}
          </time>

          {!compact &&
            eventItem.description && (
              <p>
                {eventItem.description}
              </p>
            )}

          {!compact &&
            eventItem.reminder_enabled &&
            eventItem.email_enabled && (
              <span className="calendar-email-state">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M3 6h18v12H3z" />
                  <path d="m3 7 9 7 9-7" />
                </svg>
                {eventItem.reminder_sent_at
                  ? "E-mail wysłany"
                  : "E-mail zaplanowany"}
              </span>
            )}
        </div>

        {!compact && (
          <div className="calendar-agenda-actions">
            {eventItem.read_only ? (
              <button
                type="button"
                onClick={() =>
                  openJobReminder(
                    eventItem
                  )
                }
              >
                Ustaw przypomnienie
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    toggleCalendarCompleted(
                      eventItem
                    )
                  }
                >
                  {eventItem.completed_at
                    ? "Przywróć"
                    : "Wykonane"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openEditDialog(
                      eventItem
                    )
                  }
                >
                  Edytuj
                </button>
              </>
            )}
          </div>
        )}
      </article>
    );
  }

  return (
    <div className="page calendar-page">
      <AccountNavbar />

      <main className="app-page calendar-shell">
        <SubpageHeading className="ih76-planner-heading" variant="calendar"
          eyebrow={calendarEnglish ? "Your schedule" : "Twój terminarz"}
          title={calendarEnglish ? "Calendar" : "Kalendarz"}
          description={calendarEnglish ? "Keep project deadlines and your own plans in order." : "Uporządkuj terminy projektów i własne plany."}
          actions={<button className="calendar-primary-action" type="button" onClick={() => openCreateDialog()}><MarketIcon kind="plus" /><span>{calendarEnglish ? "Add event" : "Dodaj termin"}</span></button>} />

        {(message || successMessage) && (
          <div
            className={`calendar-feedback${
              successMessage
                ? " is-success"
                : " is-error"
            }`}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">
              {successMessage
                ? "✓"
                : "!"}
            </span>
            <p>
              {successMessage || message}
            </p>
            {message && !successMessage && <button type="button" onClick={loadCalendarContent} disabled={loading}>Spróbuj ponownie</button>}
          </div>
        )}

        <div className="ih76-planner-datebar"><p>{new Intl.DateTimeFormat(calendarLocale, { month: "long", year: "numeric" }).format(selectedDate)}</p><button type="button" onClick={goToToday}>{calendarEnglish ? "Today" : "Dzisiaj"}</button></div>
        <div className="ih75-calendar-controls">
          <div className="ih75-view-switch" role="group" aria-label={calendarEnglish ? "Calendar view" : "Widok kalendarza"}>
            <button type="button" aria-pressed={calendarView === "agenda"} onClick={() => setCalendarView("agenda")}><WorkspaceIcon kind="jobs" />{calendarEnglish ? "Day plan" : "Plan dnia"}</button>
            <button type="button" aria-pressed={calendarView === "month"} onClick={() => setCalendarView("month")}><WorkspaceIcon kind="calendar" />{calendarEnglish ? "Month" : "Miesiąc"}</button>
          </div>
          {calendarView === "agenda" && <div className="ih75-day-navigation">
            <button type="button" onClick={() => moveCalendarDay(-1)} aria-label={calendarEnglish ? "Previous day" : "Poprzedni dzień"}>{calendarEnglish ? "Prev." : "Poprz."}</button>
            <label><span className="ih5-sr-only">{calendarEnglish ? "Choose a date" : "Wybierz datę"}</span><input type="date" value={getCalendarDateKey(selectedDate)} onChange={event => { if (event.target.value) selectCalendarDate(getCalendarDateOnlyValue(event.target.value)); }} /></label>
            <button type="button" onClick={() => moveCalendarDay(1)} aria-label={calendarEnglish ? "Next day" : "Następny dzień"}>{calendarEnglish ? "Next" : "Nast."}</button>
          </div>}
        </div>
        {calendarView === "agenda" && <nav className="ih75-week-strip" aria-label={calendarEnglish ? "Days of the week" : "Dni tygodnia"}>
          {Array.from({ length: 7 }, (_, index) => {
            const day = new Date(selectedDate);
            day.setDate(day.getDate() - (day.getDay() + 6) % 7 + index);
            const key = getCalendarDateKey(day);
            const count = allEvents.filter(item => getCalendarDateKey(item.starts_at) === key).length;
            return <button key={key} type="button" aria-pressed={key === selectedKey} aria-current={key === getCalendarDateKey(new Date()) ? "date" : undefined} aria-label={`${getCalendarDayLabel(day, calendarLocale)}, ${count} ${calendarEnglish ? "events" : "wydarzeń"}`} onClick={() => selectCalendarDate(day)}><span>{new Intl.DateTimeFormat(calendarLocale, { weekday: "short" }).format(day)}</span><strong>{day.getDate()}</strong><i aria-hidden="true">{loading ? "" : count > 0 ? count : ""}</i></button>;
          })}
        </nav>}
        <div className="ih75-calendar-workspace" data-view={calendarView}>
          {calendarView === "month" && <>
          <section
            className="calendar-board ih75-month-board"
            aria-label={calendarEnglish ? "Monthly calendar" : "Kalendarz miesięczny"}
          >
            <section className="calendar-toolbar">
              <div className="calendar-month-navigation">
                <button
                  type="button"
                  onClick={() =>
                    changeMonth(-1)
                  }
                  aria-label={calendarEnglish ? "Previous month" : "Poprzedni miesiąc"}
                >
                  {calendarEnglish ? "Prev." : "Poprz."}
                </button>

                <div>
                  <span>{calendarEnglish ? "Month view" : "Widok miesiąca"}</span>
                  <h2>
                    {getCalendarMonthLabel(currentMonth, calendarLocale)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    changeMonth(1)
                  }
                  aria-label={calendarEnglish ? "Next month" : "Następny miesiąc"}
                >
                  {calendarEnglish ? "Next" : "Nast."}
                </button>
              </div>

              <div className="calendar-legend" aria-label={calendarEnglish ? "Calendar legend" : "Legenda kalendarza"}>
                {CALENDAR_EVENT_TYPES.map(
                  (type) => (
                    <span
                      key={type.value}
                      className={`is-${type.value}`}
                    >
                      <i aria-hidden="true" />
                      {calendarEnglish ? translateUiText(type.shortLabel) : type.shortLabel}
                    </span>
                  )
                )}
              </div>
            </section>
            <div className="calendar-weekdays" role="row">
              {(calendarEnglish ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : CALENDAR_WEEKDAYS).map(
                (weekday) => (
                  <span
                    key={weekday}
                    role="columnheader"
                  >
                    {weekday}
                  </span>
                )
              )}
            </div>

            {loading ? (
              <InlineRouteLoader
                label="Pobieramy Twój kalendarz..."
              />
            ) : (
              <div
                className={`calendar-grid is-${monthDirection}`}
                key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}`}
                role="grid"
              >
                {gridDays.map((day) => {
                  const dayKey =
                    getCalendarDateKey(day);

                  const dayEvents =
                    allEvents.filter(
                      (item) =>
                        getCalendarDateKey(
                          item.starts_at
                        ) === dayKey
                    );

                  const isOutside =
                    day.getMonth() !==
                    currentMonth.getMonth();

                  const isToday =
                    dayKey ===
                    getCalendarDateKey(
                      new Date()
                    );

                  const isSelected =
                    dayKey ===
                    selectedKey;

                  return (
                    <div
                      className={`calendar-day${
                        isOutside
                          ? " is-outside"
                          : ""
                      }${
                        isToday
                          ? " is-today"
                          : ""
                      }${
                        isSelected
                          ? " is-selected"
                          : ""
                      }`}
                      key={dayKey}
                      role="gridcell"
                    >
                      <button
                        className="calendar-day-number"
                        type="button"
                        onClick={() => {
                          selectCalendarDate(day);

                          if (isOutside) {
                            setMonthDirection(
                              day < currentMonth
                                ? "previous"
                                : "next"
                            );
                            setCurrentMonth(
                              getCalendarMonthStart(
                                day
                              )
                            );
                          }
                        }}
                        onDoubleClick={() =>
                          openCreateDialog(day)
                        }
                        aria-pressed={isSelected}
                        aria-current={isToday ? "date" : undefined}
                        aria-label={`${
                          getCalendarDayLabel(day, calendarLocale)
                        }. ${
                          dayEvents.length
                        } ${calendarEnglish ? "events" : "wydarzeń"}`}
                      >
                        <span>
                          {day.getDate()}
                        </span>
                        <small className="ih73-calendar-event-count" aria-hidden="true">{dayEvents.length > 0 ? dayEvents.length : ""}</small>
                        {isToday && (
                          <em>{calendarEnglish ? "Today" : "Dziś"}</em>
                        )}
                      </button>

                      <div className="calendar-day-events">
                        {dayEvents
                          .slice(0, 3)
                          .map((item) => (
                            <button
                              key={item.id}
                              className={`calendar-event-chip is-${item.event_type}${
                                item.completed_at
                                  ? " is-completed"
                                  : ""
                              }`}
                              type="button"
                              onClick={() => {
                                selectCalendarDate(day);

                                if (!item.read_only) {
                                  openEditDialog(item);
                                }
                              }}
                              title={item.title}
                            >
                              <i aria-hidden="true" />
                              <span>
                                {item.title}
                              </span>
                            </button>
                          ))}

                        {dayEvents.length > 3 && (
                          <button
                            className="calendar-more-events"
                            type="button"
                            onClick={() =>
                              setSelectedDate(day)
                            }
                          >
                            +{dayEvents.length - 3}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          </>}
          <section className="ih75-day-plan" aria-labelledby="ih75-day-plan-title" aria-busy={loading}>
            <header className="ih75-day-plan-heading"><time className="ih76-day-number" dateTime={selectedKey} aria-label={getCalendarDayLabel(selectedDate, calendarLocale)}>{selectedDate.getDate()}</time><div><p>{new Intl.DateTimeFormat(calendarLocale, { month: "long", year: "numeric" }).format(selectedDate)}</p><h2 id="ih75-day-plan-title">{new Intl.DateTimeFormat(calendarLocale, { weekday: "long" }).format(selectedDate)}</h2><small>{loading ? (calendarEnglish ? "Loading…" : "Ładowanie…") : `${calendarEnglish ? "Planned" : "W planie"}: ${selectedDayEvents.length}`}</small></div></header>
            {loading ? <InlineRouteLoader label={calendarEnglish ? "Loading your schedule…" : "Pobieramy Twój plan…"} rows={3} /> : selectedDayEvents.length ? <div className="calendar-agenda-list">{selectedDayEvents.map(item => renderAgendaItem(item))}</div> : <div className="ih75-day-empty"><WorkspaceIcon kind="calendar" /><h3>{calendarEnglish ? "No events planned" : "Brak zaplanowanych terminów"}</h3><p>{calendarEnglish ? "Add a task, meeting or project deadline." : "Dodaj zadanie, spotkanie albo termin projektu."}</p><button type="button" className="ih5-button is-quiet" onClick={() => openCreateDialog(selectedDate)}><MarketIcon kind="plus" />{calendarEnglish ? "Add an event" : "Dodaj termin"}</button></div>}
          </section>
          <aside className="ih75-calendar-upcoming" aria-label={calendarEnglish ? "Upcoming events" : "Nadchodzące terminy"}>
            <header><p>{new Intl.DateTimeFormat(calendarLocale, { month: "long" }).format(selectedDate)}</p><h2>{calendarEnglish ? "Later this month" : "Dalej w miesiącu"}</h2></header>
            {loading ? <InlineRouteLoader rows={2} /> : upcomingEvents.length ? <div className="calendar-upcoming-list">{upcomingEvents.map(item => renderAgendaItem(item, true))}</div> : <p className="calendar-upcoming-empty">{calendarEnglish ? "No more events in this month." : "Nie masz kolejnych terminów w tym miesiącu."}</p>}
          </aside>
        </div>
        <div className="ih76-planner-notes">
          <SubpageMetrics items={[
            { label: calendarEnglish ? "Selected week" : "Wybrany tydzień", value: selectedWeekCount },
            { label: calendarEnglish ? "Email reminders" : "Przypomnienia e-mail", value: activeEmailReminders },
            { label: calendarEnglish ? "Completed" : "Wykonane w miesiącu", value: completedThisMonth },
          ]} />
        </div>
      </main>

      {dialogOpen && (
        <div
          className="calendar-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !saving
            ) {
              setDialogOpen(false);
            }
          }}
        >
          <section
            className="calendar-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calendar-dialog-title"
          >
            <header className="calendar-dialog-heading">
              <div>
                <span>
                  {editingId
                    ? "EDYCJA TERMINU"
                    : "NOWE PRZYPOMNIENIE"}
                </span>
                <h2 id="calendar-dialog-title">
                  {editingId
                    ? "Zmień szczegóły"
                    : "Zaplanuj swój czas"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  !saving &&
                  setDialogOpen(false)
                }
                aria-label="Zamknij okno"
              >
                ×
              </button>
            </header>

            <form
              className="calendar-form"
              onSubmit={
                handleCalendarSave
              }
            >
              <fieldset className="calendar-type-picker">
                <legend>Rodzaj terminu</legend>

                <div>
                  {CALENDAR_EVENT_TYPES.map(
                    (type) => (
                      <label
                        key={type.value}
                        className={`is-${type.value}${
                          draft.event_type ===
                          type.value
                            ? " is-selected"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="calendar-event-type"
                          value={type.value}
                          checked={
                            draft.event_type ===
                            type.value
                          }
                          onChange={(event) =>
                            setDraft(
                              (current) => ({
                                ...current,
                                event_type:
                                  event.target.value,
                              })
                            )
                          }
                        />
                        <i aria-hidden="true" />
                        <span>{type.label}</span>
                      </label>
                    )
                  )}
                </div>
              </fieldset>

              <label className="calendar-field is-wide">
                <span>Nazwa terminu</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        title:
                          event.target.value,
                      })
                    )
                  }
                  maxLength={120}
                  placeholder="Np. oddanie projektu strony"
                  autoFocus
                  required
                />

              </label>

              <div className="calendar-form-row">
                <label className="calendar-field">
                  <span>Data i godzina</span>
                  <IdeaHireDateField
                aria-label="Data i godzina wydarzenia"
                    type="datetime-local"
                    value={
                      draft.starts_at
                    }
                    min={
                      editingId
                        ? undefined
                        : getCalendarDateTimeInput(
                            new Date()
                          )
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          starts_at:
                            event.target.value,
                        })
                      )
                    }
                    required
                  />
                </label>

                <label className="calendar-field">
                  <span>Wyślij przypomnienie</span>
                  <FormSelect
                    value={
                      draft.reminder_minutes_before
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          reminder_minutes_before:
                            Number(
                              event.target.value
                            ),
                        })
                      )
                    }
                    disabled={
                      !draft.reminder_enabled
                    }
                  >
                    {CALENDAR_REMINDER_OPTIONS.map(
                      (option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </FormSelect>
                </label>
              </div>

              <label className="calendar-field is-wide">
                <span>Notatka opcjonalna</span>
                <AutoTextarea
                  value={
                    draft.description
                  }
                  onChange={(event) =>
                    setDraft(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      })
                    )
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Najważniejsze ustalenia, materiały lub zakres do wykonania..."
                />
                <small>
                  {draft.description.length}/1000
                </small>
              </label>

              <div className="calendar-reminder-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      draft.reminder_enabled
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          reminder_enabled:
                            event.target.checked,
                        })
                      )
                    }
                  />
                  <span>
                    <strong>Aktywne przypomnienie</strong>
                    <small>
                      Termin będzie widoczny w planie działania.
                    </small>
                  </span>
                </label>

                <label
                  className={
                    !draft.reminder_enabled
                      ? "is-disabled"
                      : ""
                  }
                >
                  <input
                    type="checkbox"
                    checked={
                      draft.email_enabled
                    }
                    onChange={(event) =>
                      setDraft(
                        (current) => ({
                          ...current,
                          email_enabled:
                            event.target.checked,
                        })
                      )
                    }
                    disabled={
                      !draft.reminder_enabled
                    }
                  />
                  <span>
                    <strong>Wyślij także e-mail</strong>
                    <small>
                      Wiadomość trafi na adres przypisany do konta IdeaHire.
                    </small>
                  </span>
                </label>
              </div>

              {message && (
                <p className="calendar-form-error" role="alert">
                  {message}
                </p>
              )}

              <footer className="calendar-form-actions">
                {editingId && (
                  <button
                    className="calendar-delete-button"
                    type="button"
                    onClick={
                      handleCalendarDelete
                    }
                    disabled={saving}
                  >
                    Usuń
                  </button>
                )}

                <button
                  className="calendar-cancel-button"
                  type="button"
                  onClick={() =>
                    setDialogOpen(false)
                  }
                  disabled={saving}
                >
                  Anuluj
                </button>

                <button
                  className="calendar-save-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Zapisywanie..."
                    : editingId
                    ? "Zapisz zmiany"
                    : "Dodaj do kalendarza"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

/* NOTIFICATIONS */

function Notifications() {
  const notificationEnglish = useSitePreferences().language === 'en';
  const nt = (pl, en) => notificationEnglish ? en : pl;
  const [notificationView, setNotificationView] = useState('all');
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

  const [
    messageNotifications,
    setMessageNotifications,
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
       * 5. Nowe wiadomości. Pokazujemy najwyżej jedną, najnowszą
       * wiadomość z każdej rozmowy, żeby skrzynka nie zamieniała się
       * w kopię całego czatu.
       */
      const {
        data: notificationConversations,
        error: notificationConversationsError,
      } = await supabase
        .from("conversations")
        .select(
          "id, job_id, client_id, contractor_id, created_at"
        )
        .or(
          `client_id.eq.${user.id},contractor_id.eq.${user.id}`
        )
        .order("created_at", {
          ascending: false,
        });

      if (notificationConversationsError) {
        console.error(
          "NOTIFICATION CONVERSATIONS ERROR:",
          notificationConversationsError
        );
      }

      const visibleConversations =
        notificationConversationsError
          ? []
          : notificationConversations || [];

      let messageResult = [];

      if (visibleConversations.length > 0) {
        const conversationIds =
          visibleConversations.map(
            (conversation) =>
              conversation.id
          );

        const {
          data: unreadMessageRows,
          error: unreadMessagesError,
        } = await supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, content, created_at, read_at"
          )
          .in(
            "conversation_id",
            conversationIds
          )
          .neq("sender_id", user.id)
          .is("read_at", null)
          .order("created_at", {
            ascending: false,
          })
          .limit(200);

        if (unreadMessagesError) {
          console.error(
            "NOTIFICATION MESSAGES ERROR:",
            unreadMessagesError
          );
        } else {
          const latestMessageByConversation =
            new Map();

          const handledConversationIds =
            new Set();

          for (
            const messageItem of
            unreadMessageRows || []
          ) {
            if (
              handledConversationIds.has(
                messageItem.conversation_id
              )
            ) {
              continue;
            }

            handledConversationIds.add(
              messageItem.conversation_id
            );

            if (
              !dismissedIds.includes(
                `message:${messageItem.id}`
              )
            ) {
              latestMessageByConversation.set(
                messageItem.conversation_id,
                messageItem
              );
            }
          }

          const conversationMap =
            new Map(
              visibleConversations.map(
                (conversation) => [
                  conversation.id,
                  conversation,
                ]
              )
            );

          const messageRows = [
            ...latestMessageByConversation.values(),
          ];

          const otherUserIds = [
            ...new Set(
              messageRows.map((messageItem) => {
                const conversation =
                  conversationMap.get(
                    messageItem.conversation_id
                  );

                return conversation?.client_id === user.id
                  ? conversation?.contractor_id
                  : conversation?.client_id;
              }).filter(Boolean)
            ),
          ];

          const messageJobIds = [
            ...new Set(
              messageRows.map(
                (messageItem) =>
                  conversationMap.get(
                    messageItem.conversation_id
                  )?.job_id
              ).filter(Boolean)
            ),
          ];

          const [
            messageProfilesResult,
            messageJobsResult,
          ] = await Promise.all([
            otherUserIds.length > 0
              ? supabase
                  .from("profiles")
                  .select("id, name, avatar_url")
                  .in("id", otherUserIds)
              : Promise.resolve({ data: [], error: null }),
            messageJobIds.length > 0
              ? supabase
                  .from("jobs")
                  .select("id, title")
                  .in("id", messageJobIds)
              : Promise.resolve({ data: [], error: null }),
          ]);

          if (messageProfilesResult.error) {
            console.error(
              "NOTIFICATION MESSAGE PROFILES ERROR:",
              messageProfilesResult.error
            );
          }

          if (messageJobsResult.error) {
            console.error(
              "NOTIFICATION MESSAGE JOBS ERROR:",
              messageJobsResult.error
            );
          }

          const profileMap = new Map(
            (messageProfilesResult.data || []).map(
              (profile) => [profile.id, profile]
            )
          );

          const messageJobMap = new Map(
            (messageJobsResult.data || []).map(
              (job) => [job.id, job]
            )
          );

          messageResult = messageRows.map(
            (messageItem) => {
              const conversation =
                conversationMap.get(
                  messageItem.conversation_id
                );

              const otherUserId =
                conversation?.client_id === user.id
                  ? conversation?.contractor_id
                  : conversation?.client_id;

              return {
                ...messageItem,
                conversation,
                otherProfile:
                  profileMap.get(otherUserId),
                job:
                  messageJobMap.get(
                    conversation?.job_id
                  ),
              };
            }
          );
        }
      }

      setMessageNotifications(
        messageResult
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
        ...messageResult.map(
          (item) =>
            `message:${item.id}`
        ),
        ...visibleConversations.map(
          (item) =>
            `conversation:${item.id}`
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
    if (!user?.id) return;

    loadNotifications();

    const liveInbox = supabase
      .channel(
        `notifications-inbox:${user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_applications",
        },
        loadNotifications
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
        },
        loadNotifications
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        loadNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        liveInbox
      );
    };
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
      ...messageNotifications.map(
        (item) =>
          `message:${item.id}`
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
    setMessageNotifications([]);

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
    blockNotifications.length === 0 &&
    messageNotifications.length === 0;

  const decisionCount = acceptedDecisions.length + rejectedDecisions.length + blockNotifications.length;
  const notificationCount = notifications.length + messageNotifications.length + decisionCount;
  const clearable = decisionCount + messageNotifications.length > 0;
  const showGroup = kind => notificationView === 'all' || notificationView === kind;
  const filterCount = notificationView === 'applications' ? notifications.length : notificationView === 'messages' ? messageNotifications.length : notificationView === 'decisions' ? decisionCount : notificationCount;
  return <div className="page">
    <AccountNavbar />
    <main className="app-page notifications-page">
      <SubpageHeading title={nt('Powiadomienia', 'Notifications')} variant="notifications" actions={!loading && !message && clearable ? <button type="button" className="ih79-button" onClick={handleClearNotifications}>{nt('Wyczyść przeczytane', 'Clear read notifications')}</button> : undefined} />
      <div className="ih79-notifications-layout">
        <nav className="ih79-notification-filters" aria-label={nt('Rodzaj powiadomień', 'Notification type')}>
          {[['all', nt('Wszystkie', 'All'), notificationCount], ['applications', nt('Do decyzji', 'To review'), notifications.length], ['messages', nt('Wiadomości', 'Messages'), messageNotifications.length], ['decisions', nt('Decyzje', 'Decisions'), decisionCount]].map(([value, label, count]) => <button key={value} type="button" aria-pressed={notificationView === value} onClick={() => setNotificationView(value)}>{label}<span>{loading ? '—' : count}</span></button>)}
        </nav>
        <div className="ih79-notification-stream" aria-live="polite" aria-busy={loading}>
          {loading ? <InlineRouteLoader rows={3} /> : message ? <p className="ih79-feedback is-error" role="alert">{message}</p> : <>
            {(isInboxEmpty || filterCount === 0) && <div className="ih79-empty"><h2>{nt('Brak powiadomień', 'No notifications')}</h2><p>{nt('Nowe zgłoszenia, wiadomości i decyzje pojawią się tutaj.', 'New applications, messages and decisions will appear here.')}</p></div>}
            {showGroup('applications') && notifications.length > 0 && <section className="ih79-notice-group" aria-labelledby="ih79-applications-title">
              <h2 id="ih79-applications-title">{nt('Zgłoszenia do Twoich zleceń', 'Applications to your jobs')}<span>{notifications.length}</span></h2>
              {notifications.map(notification => <article className="ih79-notice is-application" key={notification.id}>
                <Link className="ih79-notice-person" to={'/profile/' + notification.applicant_id}><span className="ih79-person-avatar" aria-hidden="true">{notification.applicant?.avatar_url ? <img src={notification.applicant.avatar_url} alt="" loading="lazy" /> : Array.from(notification.applicant?.name || 'U')[0]}</span><span><strong>{notification.applicant?.name || nt('Użytkownik', 'User')}</strong><small>{nt('chce wykonać Twoje zlecenie', 'applied to your job')}</small></span></Link>
                <h3>{notification.job?.title || nt('Zlecenie', 'Job')}</h3><time dateTime={notification.created_at}>{formatDate(notification.created_at)}</time>
                <div className="ih79-notice-actions"><Link className="ih79-button" to={'/profile/' + notification.applicant_id}>{nt('Zobacz profil', 'View profile')}</Link><ApplicationActions applicationId={notification.id} onAccepted={handleAccepted} onRejected={handleRejected} /></div>
              </article>)}
            </section>}
            {showGroup('messages') && messageNotifications.length > 0 && <section className="ih79-notice-group" aria-labelledby="ih79-messages-title">
              <h2 id="ih79-messages-title">{nt('Nowe wiadomości', 'New messages')}<span>{messageNotifications.length}</span></h2>
              {messageNotifications.map(item => <article className="ih79-notice is-message" key={'message-' + item.id}>
                <p className="ih79-notice-state"><WorkspaceIcon kind="message" />{item.otherProfile?.name || nt('Użytkownik', 'User')}</p><h3>{item.job?.title || nt('Rozmowa dotycząca współpracy', 'Project conversation')}</h3>
                <p className="ih79-notice-preview">{item.content}</p><Link className="ih79-button is-primary" to={'/chat/' + item.conversation_id}>{nt('Otwórz rozmowę', 'Open conversation')}<WorkspaceIcon kind="arrow" /></Link>
              </article>)}
            </section>}
            {showGroup('decisions') && decisionCount > 0 && <section className="ih79-notice-group" aria-labelledby="ih79-decisions-title">
              <h2 id="ih79-decisions-title">{nt('Decyzje i informacje', 'Decisions and updates')}<span>{decisionCount}</span></h2>
              {acceptedDecisions.map(item => <article className="ih79-notice is-accepted" key={'accepted-' + item.id}>
                <p className="ih79-notice-state"><WorkspaceIcon kind="check" />{nt('Zgłoszenie zaakceptowane', 'Application accepted')}</p><h3>{item.job?.title || nt('Zlecenie', 'Job')}</h3><p>{nt('Zleceniodawca wybrał Cię do realizacji. Ustal szczegóły w rozmowie.', 'The client selected you. Discuss the details in the conversation.')}</p>
                {item.conversation?.id ? <Link className="ih79-button is-primary" to={'/chat/' + item.conversation.id}>{nt('Przejdź do rozmowy', 'Open conversation')}<WorkspaceIcon kind="arrow" /></Link> : <p className="ih79-feedback">{nt('Rozmowa jest przygotowywana. Odśwież powiadomienia za chwilę.', 'Your conversation is being prepared. Refresh shortly.')}</p>}
              </article>)}
              {rejectedDecisions.map(item => <article className="ih79-notice is-decision" key={'rejected-' + item.id}>
                <p className="ih79-notice-state">{nt('Zgłoszenie niezaakceptowane', 'Application not accepted')}</p><h3>{item.job?.title || nt('Zlecenie', 'Job')}</h3><p>{nt('Zleceniodawca nie zdecydował się na współpracę przy tym projekcie.', 'The client did not select you for this project.')}</p><time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
              </article>)}
              {blockNotifications.map(item => <article className="ih79-notice is-contact" key={'blocked-' + item.id}>
                <p className="ih79-notice-state">{nt('Zmiana możliwości kontaktu', 'Contact update')}</p><h3>{item.blocker?.name || nt('Użytkownik', 'User')}</h3><p>{nt('Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości między Wami jest niedostępne.', 'This user has blocked your profile. Messaging between you is unavailable.')}</p><Link className="ih79-button" to={'/profile/' + item.blocker_id}>{nt('Zobacz profil', 'View profile')}</Link>
              </article>)}
            </section>}
          </>}
        </div>
      </div>
    </main>
  </div>;
}


/* MESSAGES / CONVERSATION LIST */

function useConversationInbox() {
  const { user } =
    useAuth();

  const [conversations, setConversations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [inboxFilter, setInboxFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;
    let generation = 0;
    let firstLoad = true;
    let reloadTimer = 0;

    async function loadConversations() {
      const request = ++generation;
      if (firstLoad) setLoading(true);
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
          if (mounted && request === generation) {
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
            ).filter(Boolean)
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
          profileInquiriesResult,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select(
              "id, name, avatar_url"
            )
            .in("id", otherUserIds),

          jobIds.length ? supabase.from("jobs").select("id, title").in("id", jobIds) : Promise.resolve({ data: [], error: null }),

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
          supabase.from("ideahire_profile_inquiries").select("conversation_id, title").in("conversation_id", conversationIds),
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
        const profileInquiryTitles = new Map((profileInquiriesResult.data || []).map((item) => [item.conversation_id, item.title]));


        const unreadConversationIds = new Set((messagesResult.data || []).filter((message) => message.sender_id !== user.id && !message.read_at).map((message) => message.conversation_id));
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

        const seenConversationIds =
          getStoredNotificationIds(
            `ideahire_seen_conversations_${user.id}`
          );

        const recentConversationThreshold =
          Date.now() -
          7 * 24 * 60 * 60 * 1000;

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
                  ) || (profileInquiryTitles.has(conversation.id) ? { title: profileInquiryTitles.get(conversation.id) } : null),
                lastMessage,
                sortDate:
                  lastMessage?.created_at ||
                  conversation.created_at,
                isUnread:
                  unreadConversationIds.has(conversation.id) ||
                  (
                    !lastMessage &&
                    new Date(
                      conversation.created_at || 0
                    ).getTime() >=
                      recentConversationThreshold &&
                    !seenConversationIds.includes(
                      String(conversation.id)
                    )
                  ),
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

        if (mounted && request === generation) {
          setConversations(
            result
          );
        }
      } catch (error) {
        if (mounted && request === generation) {
          setErrorMessage(
            error?.message ||
              "Nie udało się pobrać rozmów."
          );
        }
      } finally {
        firstLoad = false;
        if (mounted && request === generation) {
          setLoading(false);
        }
      }
    }

    function scheduleReload() {
      window.clearTimeout(reloadTimer);
      reloadTimer = window.setTimeout(loadConversations, 100);
    }
    loadConversations();

    const channel =
      supabase
        .channel(
          `messages-list:${user.id}:${window.crypto.randomUUID()}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          scheduleReload
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversations",
          },
          scheduleReload
        )
        .on("postgres_changes", { event: "*", schema: "public", table: "conversation_user_state", filter: `user_id=eq.${user.id}` }, scheduleReload)
        .subscribe();

    return () => {
      mounted = false;
      window.clearTimeout(reloadTimer);
      supabase.removeChannel(
        channel
      );
    };
  }, [user?.id]);


  const unreadCount = conversations.filter((conversation) => conversation.isUnread).length;
  const query = search.trim().toLocaleLowerCase("pl-PL");
  const visibleConversations = conversations.filter((conversation) =>
    (inboxFilter !== "unread" || conversation.isUnread) &&
    (!query || [conversation.otherProfile?.name, conversation.job?.title, conversation.lastMessage?.content]
      .some((value) => String(value || "").toLocaleLowerCase("pl-PL").includes(query)))
  );
  return { user, conversations, visibleConversations, loading, errorMessage, search, setSearch, inboxFilter, setInboxFilter, unreadCount };
}

function formatInboxDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
}

/* P13A: presentation components remain inside the existing router file. */
// Transparent light clouds move inside a fixed canvas; their edges never cover the page.
/* P63: a stationary tonal wash. No pointer or scroll animation. */
function AmbientBackground() {
  return createPortal(<div className="ih63-page-wash" aria-hidden="true" />, document.body);
}

/* P68 — one mailbox; choosing a conversation opens a separate room. */
function Messages() {
  const inbox = useConversationInbox();
  return <div className="account-page ih68-messages-root"><AccountNavbar/><WorkspaceInbox {...inbox}/></div>;
}


/* CHAT */

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
  openRequest = 0,
  launcherHidden = false,
}) {
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);
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
      setPanelExpanded(false);
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

  useEffect(() => {
    if (
      !openRequest ||
      !agreement?.id ||
      agreement.status !== "accepted"
    ) {
      return;
    }

    if (dispute?.id) {
      navigate(`/disputes/${dispute.id}`);
      return;
    }

    setFormOpen(true);
    setPanelExpanded(true);
    setMessage("");
    window.requestAnimationFrame(() => {
      document
        .getElementById("chat-dispute-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [agreement?.id, agreement?.status, dispute?.id, navigate, openRequest]);

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
    if (launcherHidden && !openRequest) {
      return null;
    }
    return (
      <InlineRouteLoader
        className="chat-compact-route-loader"
        rows={1}
      />
    );
  }

  if (dispute) {
    return (
      <details
        className="chat-collapsible-panel chat-dispute-disclosure has-dispute"
        open={panelExpanded}
        onToggle={(event) =>
          setPanelExpanded(event.currentTarget.open)
        }
      >
        <summary className="chat-collapsible-summary">
          <span className="chat-collapsible-icon is-dispute" aria-hidden="true">
            !
          </span>
          <span className="chat-collapsible-copy">
            <strong>
              Spór {formatDisputeNumber(dispute.case_number)}
            </strong>
            <small>
              {getDisputeStatusLabel(dispute.status)} · rozwiń szczegóły
            </small>
          </span>
          <span className="chat-collapsible-chevron" aria-hidden="true" />
        </summary>

        <div className="chat-collapsible-body">
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
        </div>
      </details>
    );
  }

  if (launcherHidden && !formOpen) {
    return null;
  }

  return (
    <details
      className="chat-collapsible-panel chat-dispute-disclosure"
      id="chat-dispute-panel"
      open={panelExpanded}
      onToggle={(event) =>
        setPanelExpanded(event.currentTarget.open)
      }
    >
      <summary className="chat-collapsible-summary">
        <span className="chat-collapsible-icon is-dispute" aria-hidden="true">
          !
        </span>
        <span className="chat-collapsible-copy">
          <strong>Centrum sporu</strong>
          <small>
            {formOpen
              ? "Formularz zgłoszenia · możesz go zwinąć"
              : "Problem ze współpracą? Rozwiń panel"}
          </small>
        </span>
        <span className="chat-collapsible-chevron" aria-hidden="true" />
      </summary>

      <div className="chat-collapsible-body">
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
              <FormSelect
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
              </FormSelect>
            </label>

            <label className="dispute-field">
              <span>Oczekiwane rozwiązanie</span>
              <FormSelect
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
              </FormSelect>
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
              <AutoTextarea
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
              Dostęp ma wyłącznie administrator przypisany do sprawy. Materiały
              i ustalenia pozostają do odczytu. Administrator może dopisać na
              czacie oznaczoną wiadomość. Odczyt i wysłanie są rejestrowane.
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
      </div>
    </details>
  );
}


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


function profileBriefToAgreementForm(job, title = "", price = "") {
  const form = agreementToForm(null, title, price);
  if (!job?.project_details) return form;
  const details = job.project_details;
  return { ...form, scope: job.description || "", deliverables: details.deliverables || "", deadline: details.deadline || "", deliveryFormat: details.delivery_format || "", additionalTerms: details.materials ? `Materiały dostarczane przez klienta: ${details.materials}` : "" };
}

function getAgreementSaveMismatches(
  agreement,
  expected
) {
  if (!agreement) {
    return ["cała propozycja"];
  }

  const mismatches = [];
  const compareText = (
    key,
    label,
    expectedValue
  ) => {
    if (
      String(agreement[key] || "").trim() !==
      String(expectedValue || "").trim()
    ) {
      mismatches.push(label);
    }
  };

  compareText("title", "nazwa", expected.title);
  compareText("scope", "zakres", expected.scope);
  compareText(
    "deliverables",
    "rezultat końcowy",
    expected.deliverables
  );
  compareText("deadline", "termin", expected.deadline);
  compareText(
    "delivery_format",
    "format przekazania",
    expected.deliveryFormat
  );
  compareText(
    "acceptance_method",
    "sposób odbioru",
    expected.acceptanceMethod
  );
  compareText(
    "cancellation_terms",
    "warunki anulowania",
    expected.cancellationTerms
  );
  compareText(
    "additional_terms",
    "dodatkowe ustalenia",
    expected.additionalTerms
  );

  if (
    Number(agreement.revisions) !==
    Number(expected.revisions)
  ) {
    mismatches.push("liczba poprawek");
  }

  if (
    !Number.isFinite(
      Number(agreement.price_amount)
    ) ||
    Math.abs(
        Number(agreement.price_amount) -
          Number(expected.priceAmount)
      ) > 0.009
  ) {
    mismatches.push("cena");
  }

  return mismatches;
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
        <span>Kryteria odbioru pracy</span>
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
  priceNegotiable,
  firstProposalAuthor = "zleceniodawcy",
  messageTone = "info",
  currentUserAccepted,
  otherUserAccepted,
  blocked,
  canStart,
  canEdit,
  proposalByMe,
  canAccept,
  canDecline,
  currentUserId,
  isClient,
  isServiceInquiry,
  decision,
  error,
  onRefresh,
  onDecision,
  onFieldChange,
  onOpenForm,
  onCancelForm,
  onSubmit,
  onAccept,
}) {
  const [confirmed, setConfirmed] =
    useState(false);
  const [decisionMode, setDecisionMode] = useState("");
  const [decisionReason, setDecisionReason] = useState("");

  useEffect(() => {
    setConfirmed(false);
    setDecisionMode("");
    setDecisionReason("");
  }, [mode, agreement?.id]);

  if (!required) return null;

  if (loading) {
    return (
      <section className="agreement-gate agreement-loading ih-original-terms">
        <span className="agreement-lock-icon">
          ◌
        </span>
        <p>Ładowanie warunków współpracy...</p>
      </section>
    );
  }

  if (agreement?.status === "accepted") {
    return (
      <details className="agreement-summary ih-original-terms" open>
        <summary>
          <span className="agreement-status-icon">
            ✓
          </span>

          <span className="agreement-summary-copy">
            <strong>
              Warunki współpracy zaakceptowane
            </strong>
            <small>
              Wersja {agreement.version} · Akceptacja obu stron
            </small>
          </span>

          <span className="agreement-summary-action">
            <span className="ih-original-show">Pokaż ustalenia</span><span className="ih-original-hide">Ukryj ustalenia</span><WorkspaceIcon kind="down" />
          </span>
        </summary>

        <div className="agreement-summary-body">
          <AgreementDetails
            agreement={agreement}
          />

        </div>
      </details>
    );
  }

  if (decision?.action === "closed") {
    return <section className="agreement-gate ih-original-terms ih-negotiation-closed">
      <span className="agreement-eyebrow">Ustalenia · wersja {agreement?.version}</span>
      <h2>{!decision.senderId ? "Negocjacje zostały zakończone" : decision.senderId === currentUserId ? "Zrezygnowałeś ze współpracy" : "Druga strona zrezygnowała ze współpracy"}</h2><p>{decision.reason}</p>
      <p>Nie uzgodniono wspólnej wersji warunków. Wiadomości i przesłane materiały pozostają w rozmowie.</p>
      <details><summary>Zobacz ostatnią propozycję</summary><AgreementDetails agreement={agreement} /></details>
    </section>;
  }

  return (
    <section className="agreement-gate ih-original-terms">
      <div className="agreement-gate-heading">
        <h2>Warunki współpracy</h2>

        <p>
          Obie strony akceptują tę samą wersję. Płatność i rozpoczęcie pracy to kolejne kroki.
        </p>

        <div className="agreement-progress" aria-label="Postęp akceptacji">
          <span className={!decision && currentUserAccepted ? "is-complete" : ""}>
            <i>{!decision && currentUserAccepted ? "✓" : "1"}</i>
            Twoja akceptacja
          </span>

          <b aria-hidden="true" />

          <span className={!decision && otherUserAccepted ? "is-complete" : ""}>
            <i>{!decision && otherUserAccepted ? "✓" : "2"}</i>
            Akceptacja drugiej strony
          </span>
        </div>
      </div>

      {error && <div className="agreement-load-error" role="alert"><p>{error}</p><button type="button" onClick={onRefresh} disabled={saving}>Pobierz ponownie</button></div>}
      {decision?.action === "changes" && <aside className="agreement-decision-notice"><strong>{proposalByMe ? "Druga strona prosi o zmianę ustaleń" : "Poprosiłeś o zmianę ustaleń"}</strong><p>{decision.reason}</p><p>{proposalByMe ? "Popraw propozycję i wyślij nową wersję albo zrezygnuj ze współpracy. Jeśli druga strona prześle własne warunki, zobaczysz je tutaj do przeczytania i akceptacji." : "Czekasz na poprawioną wersję. Możesz też zaproponować własne warunki albo zrezygnować ze współpracy."}</p></aside>}
      {mode === "form" && canEdit && !error ? (
        <form
          className="agreement-form"
          onSubmit={onSubmit}
          aria-busy={saving}
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


          </div>

          <fieldset className="agreement-form-grid" disabled={saving || blocked}><legend className="ih-send-sr">Treść propozycji</legend>
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
              <AutoTextarea
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
              <AutoTextarea
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
              <span>Cena *</span>
              <div className="agreement-price-input">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceAmount}
                  readOnly={!priceNegotiable}
                  disabled={!priceNegotiable || saving || blocked}
                  onChange={(event) =>
                    onFieldChange(
                      "priceAmount",
                      event.target.value
                    )
                  }
                  placeholder="1500"
                  required
                />
                <span className="agreement-currency">PLN</span>
              </div>
            </label>

            <label className="agreement-field">
              <span>Termin wykonania *</span>
              <IdeaHireDateField aria-label="Termin wykonania zlecenia" min={localProjectDate()} value={form.deadline} onChange={event => onFieldChange("deadline", event.target.value)} disabled={saving || blocked} required />
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
              <span>Kryteria odbioru pracy *</span>
              <AutoTextarea
                value={form.acceptanceMethod}
                onChange={(event) =>
                  onFieldChange(
                    "acceptanceMethod",
                    event.target.value
                  )
                }
                placeholder="Opisz, jak klient sprawdzi gotową pracę i co musi być spełnione, aby ją zaakceptować."
                maxLength={2000}
                required
              />
            </label>

            <label className="agreement-field agreement-field-wide">
              <span>Warunki anulowania *</span>
              <AutoTextarea
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
              <AutoTextarea
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
          </fieldset>

          <label className="agreement-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={saving || blocked}
              onChange={(event) =>
                setConfirmed(
                  event.target.checked
                )
              }
            />
            <span>
              Akceptuję treść tej propozycji. Może ona zostać przyjęta wyłącznie w całości, bez zmian; zmiana warunków wymaga nowej wersji i jej akceptacji.
            </span>
          </label>

          {message && (
            <p className="agreement-message">
              {message}
            </p>
          )}

          <div className="agreement-form-actions">
            {(agreement || !canStart) && (
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
              <h3>{proposalByMe ? "Twoja propozycja warunków" : isClient ? "Propozycja freelancera" : "Propozycja klienta"}</h3>
            </div>

            <span className="agreement-pending-pill">
              {decision?.action === "changes" ? "Do zmiany" : proposalByMe ? "Czekasz na odpowiedź" : "Do Twojej decyzji"}
            </span>
          </div>

          {!proposalByMe && !decision && <p className="agreement-recipient-note">Zaakceptuj warunki lub edytuj formularz i wyślij nową wersję. Szczegóły omówcie w rozmowie.</p>}
          <AgreementDetails
            agreement={agreement}
          />

          {message && (
            <p className={`agreement-message is-${messageTone}`}>
              {message}
            </p>
          )}

          {blocked ? (
            <p className="agreement-blocked-note">
              Ustalenia są wstrzymane, ponieważ jeden z użytkowników jest zablokowany.
            </p>
          ) : error ? null : (
            <div className="agreement-proposal-actions">
              {canEdit && <button
                type="button"
                className="agreement-secondary-button"
                onClick={onOpenForm}
                disabled={saving}
              >
                Edytuj ustalenia
              </button>}

              {canAccept ? (
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
              ) : proposalByMe && !decision ? (
                <span className="agreement-waiting-note">
                  Propozycja została wysłana. Czekasz na akceptację lub nową wersję drugiej strony.
                </span>
              ) : currentUserAccepted && !decision ? <span className="agreement-waiting-note">Twoja akceptacja tej wersji jest zapisana.</span> : null}
              <button type="button" className="agreement-secondary-button" disabled={saving} onClick={onRefresh}>Odśwież ustalenia</button>
              {canDecline && <button type="button" className="agreement-text-button" disabled={saving} onClick={() => setDecisionMode("closed")}>Zrezygnuj ze współpracy</button>}
            </div>
          )}
          {decisionMode === "closed" && canDecline && !blocked && !error && <form className="agreement-response-form" onSubmit={async event => {
            event.preventDefault();
            const saved = await onDecision("closed", decisionReason.trim() || "Nie decyduję się na współpracę na zaproponowanych warunkach.");
            if (saved) { setDecisionMode(""); setDecisionReason(""); }
          }}>
            <h3>Zrezygnuj ze współpracy</h3>
            <p>{"Druga strona otrzyma wiadomość o rezygnacji." + (isServiceInquiry ? " Rezerwacja miejsca w usłudze zostanie zwolniona." : "") + " Historia rozmowy zostanie zachowana."}</p>
            <label><span>Powód (opcjonalnie)</span><AutoTextarea value={decisionReason} onChange={event => setDecisionReason(event.target.value)} maxLength={1200} rows={3} disabled={saving} /></label>
            <div><button type="button" className="agreement-secondary-button" onClick={() => setDecisionMode("")} disabled={saving}>Wróć</button><button type="submit" className="agreement-primary-button" disabled={saving}>{saving ? "Wysyłanie…" : "Potwierdź rezygnację"}</button></div>
          </form>}
        </div>
      ) : <div className="agreement-waiting-note"><p>{canStart ? "Przygotuj zakres, cenę i termin. Po wysłaniu druga strona może zaakceptować propozycję lub edytować formularz i odesłać nową wersję." : `Czekasz na propozycję ${firstProposalAuthor}. Tutaj pojawią się zakres, cena i termin.`}</p><div>{canStart && !error && <button type="button" className="agreement-primary-button" disabled={saving || blocked} onClick={onOpenForm}>Przygotuj propozycję</button>}<button type="button" className="agreement-secondary-button" onClick={onRefresh} disabled={saving}>Odśwież ustalenia</button></div></div>}
    </section>
  );
}


const PAYMENT_STATUS_COPY = {
  awaiting_payment: {
    label: "Oczekuje na płatność",
    tone: "pending",
  },
  checkout_open: {
    label: "Płatność rozpoczęta",
    tone: "pending",
  },
  processing: {
    label: "Stripe potwierdza płatność",
    tone: "pending",
  },
  funds_secured: {
    label: "Płatność potwierdzona",
    tone: "success",
  },
  work_submitted: {
    label: "Praca przekazana",
    tone: "success",
  },
  release_pending: {
    label: "Przekazywanie wynagrodzenia do wykonawcy",
    tone: "pending",
  },
  release_failed: {
    label: "Przekazanie wynagrodzenia wymaga sprawdzenia",
    tone: "error",
  },
  released: {
    label: "Przekazano na saldo Stripe wykonawcy",
    tone: "success",
  },
  refund_pending: {
    label: "Zwrot przygotowywany",
    tone: "warning",
  },
  partially_refunded: {
    label: "Częściowy zwrot",
    tone: "warning",
  },
  refunded: {
    label: "Płatność zwrócona",
    tone: "warning",
  },
  disputed: {
    label: "Płatność wstrzymana",
    tone: "warning",
  },
  failed: {
    label: "Płatność nieudana",
    tone: "error",
  },
  cancelled: {
    label: "Płatność anulowana",
    tone: "error",
  },
};

const PAYMENT_WORK_ENABLED_STATUSES = new Set([
  "funds_secured",
  "work_submitted",
  "release_pending",
  "release_failed",
  "released",
]);

const PAYMENT_CHECKOUT_STATUSES = new Set([
  "awaiting_payment", "checkout_open", "failed", "cancelled",
]);
const PAYMENT_POLLING_STATUSES = new Set([
  "checkout_open", "processing", "release_pending", "refund_pending",
]);

const PAYMENT_OVERVIEW_EN = {
  awaiting_payment: "Awaiting payment",
  checkout_open: "Payment started",
  processing: "Stripe is confirming payment",
  funds_secured: "Payment confirmed",
  work_submitted: "Work submitted",
  release_pending: "Transferring earnings to the freelancer",
  release_failed: "Earnings transfer needs review",
  released: "Transferred to the freelancer’s Stripe balance",
  refund_pending: "Refund being prepared",
  partially_refunded: "Partially refunded",
  refunded: "Payment refunded",
  disputed: "Payment on hold",
  failed: "Payment failed",
  cancelled: "Payment cancelled",
};

// The conversation header only reads payment state. Checkout remains in its own panel.
function useConversationPaymentOverview({ conversation, conversationId, agreement, agreementLoading, userId, english }) {
  const [record, setRecord] = useState(null);
  const clientId = conversation?.client_id;
  const contractorId = conversation?.contractor_id;
  const agreementId = agreement?.id;
  const scope = [userId, conversationId, conversation?.id, clientId, contractorId,
    agreementId, agreement?.conversation_id, agreement?.status, agreementLoading].join(":");
  const activeScope = useRef(scope);
  activeScope.current = scope;
  const generation = useRef(0);
  const accepted = !agreementLoading && conversation?.id === conversationId
    && agreement?.conversation_id === conversationId && agreement?.status === "accepted"
    && (userId === clientId || userId === contractorId);

  const refresh = useCallback(async () => {
    const request = ++generation.current;
    if (!accepted) return;
    try {
      const { data, error } = await supabase.rpc("get_ideahire_payment_summary", {
        p_conversation_id: conversationId,
      });
      if (activeScope.current !== scope || request !== generation.current) return;
      if (error || !Array.isArray(data)) throw new Error("payment_overview_unavailable");
      const row = data[0] || null;
      if (row && (row.agreement_id !== agreementId || row.client_id !== clientId
        || row.contractor_id !== contractorId || !Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_COPY, row.payment_status))) {
        throw new Error("payment_overview_mismatch");
      }
      // Keep the same amount checks as the payment panel before enabling work delivery.
      if (row) {
        const amounts = [row.work_amount, row.platform_fee, row.total_amount, row.contractor_amount];
        if (row.currency !== "PLN" || amounts.some(value => value == null || value === ""
          || !Number.isFinite(Number(value)) || Number(value) < 0
          || !Number.isSafeInteger(Math.round(Number(value) * 100))
          || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) > 0.000001)
          || Math.round(Number(row.work_amount) * 100) + Math.round(Number(row.platform_fee) * 100)
            !== Math.round(Number(row.total_amount) * 100)
          || (Math.round(Number(row.contractor_amount) * 100) > Math.round(Number(row.work_amount) * 100)
            || (!["refunded", "partially_refunded"].includes(row.payment_status)
              && Math.round(Number(row.contractor_amount) * 100) !== Math.round(Number(row.work_amount) * 100)))
          || Number(row.work_amount) <= 0) throw new Error("payment_overview_amount_mismatch");
      }
      setRecord({ scope, status: row?.payment_status || "", error: false });
    } catch {
      if (activeScope.current === scope && request === generation.current) {
        setRecord({ scope, status: "", error: true });
      }
    }
  }, [accepted, conversationId, agreementId, clientId, contractorId, scope]);

  useEffect(() => {
    refresh();
    if (!accepted) return () => { generation.current += 1; };
    let lastRefresh = 0;
    const visibleRefresh = () => {
      if (document.visibilityState === "hidden" || Date.now() - lastRefresh < 1000) return;
      lastRefresh = Date.now();
      refresh();
    };
    const paymentUpdated = event => {
      if (!event?.detail?.conversationId || event.detail.conversationId === conversationId) refresh();
    };
    const timer = window.setInterval(visibleRefresh, 30000);
    window.addEventListener("focus", visibleRefresh);
    window.addEventListener("pageshow", visibleRefresh);
    document.addEventListener("visibilitychange", visibleRefresh);
    window.addEventListener("ideahire:payment-updated", paymentUpdated);
    return () => {
      generation.current += 1;
      window.clearInterval(timer);
      window.removeEventListener("focus", visibleRefresh);
      window.removeEventListener("pageshow", visibleRefresh);
      document.removeEventListener("visibilitychange", visibleRefresh);
      window.removeEventListener("ideahire:payment-updated", paymentUpdated);
    };
  }, [accepted, conversationId, refresh]);

  const current = record?.scope === scope ? record : null;
  const status = accepted && current && !current.error ? current.status : "";
  const copy = status ? PAYMENT_STATUS_COPY[status] : null;
  let label;
  if (agreementLoading || conversation?.id !== conversationId || accepted && !current) {
    label = english ? "Checking…" : "Sprawdzanie…";
  } else if (!conversation?.agreements_required) {
    label = english ? "Payment unavailable in this conversation" : "Płatność niedostępna w tej rozmowie";
  } else if (!accepted) {
    label = english ? "Terms need to be agreed" : "Warunki do uzgodnienia";
  } else if (current.error) {
    label = english ? "Status unavailable — open payment" : "Status niedostępny — otwórz płatność";
  } else if (copy) {
    label = english ? PAYMENT_OVERVIEW_EN[status] : copy.label;
  } else {
    label = english ? "Payment not started" : "Płatność nierozpoczęta";
  }
  return { status, label, tone: copy?.tone || "neutral", refresh };
}

function formatPaymentMoney(value, currency = "PLN") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatChatProjectDate(value) {
  if (!value) return "Do ustalenia";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Do ustalenia"
    : date.toLocaleDateString("pl-PL");
}

function formatChatProjectBudget(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `${amount.toLocaleString("pl-PL")} zł`
    : "Do ustalenia";
}

function ChatPaymentPanel({
  agreement,
  conversation,
  userId,
  blocked,
  serviceOrder = false,
  onStatusChange,
}) {
  const { language: paymentLanguage } = useSitePreferences();
  const location = useLocation();
  const [summaryRecord, setSummaryRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState("");
  const requestGeneration = useRef(0);
  const checkoutInFlight = useRef(false);
  const refreshInFlight = useRef(false);
  const [checkedRecord, setCheckedRecord] = useState(null);
  const paymentScope = `${userId || ""}:${conversation?.id || ""}:${agreement?.id || ""}:${agreement?.status || ""}`;
  const currentPaymentScope = useRef(paymentScope);
  currentPaymentScope.current = paymentScope;
  const summary = summaryRecord?.scope === paymentScope ? summaryRecord.data : null;

  const isClient = conversation?.client_id === userId;
  const paymentReturn = new URLSearchParams(location.search).get("payment");

  const loadSummary = useCallback(async ({ readOnly = false } = {}) => {
    const requestId = ++requestGeneration.current;
    const isCurrent = () => requestId === requestGeneration.current
      && currentPaymentScope.current === paymentScope;
    if (!conversation?.id || agreement?.status !== "accepted") {
      setSummaryRecord(null);
      setLoading(false);
      onStatusChange?.("");
      return null;
    }

    setLoading(true);
    const readController = readOnly ? new AbortController() : null;
    const readTimeout = readController ? window.setTimeout(() => readController.abort(), 20000) : null;

    try {
      const query = supabase.rpc(
        "get_ideahire_payment_summary",
        { p_conversation_id: conversation.id }
      );
      if (readController) query.abortSignal(readController.signal);
      const { data, error } = await query;

      if (error) throw error;
      if (!isCurrent()) return null;
      if (!Array.isArray(data) || data.length > 1) throw new Error("Nie potwierdzono aktualnego podsumowania płatności.");

      let nextSummary = data?.[0] || null;
      if (!readOnly && isClient && nextSummary
        && nextSummary.agreement_id === agreement.id
        && PAYMENT_CHECKOUT_STATUSES.has(nextSummary.payment_status)
        && nextSummary.pricing_rule_code !== "PLN_5_5_MIN20_MAX229_V3") {
        // Kwoty wyswietlamy dopiero po ich rzeczywistym przeliczeniu w bazie.
        const { data: refreshed, error: refreshError } = await supabase.functions.invoke(
          "create-checkout-session",
          { body: { agreement_id: agreement.id, action: "refresh_pricing" } }
        );
        if (refreshError || !refreshed?.ok) {
          let reason = refreshed?.error || "";
          if (refreshError?.context instanceof Response) {
            try { reason = (await refreshError.context.json())?.error || reason; } catch { /* Wyswietlamy blad dostepny ponizej. */ }
          }
          throw new Error(reason || refreshError?.message || "Nie udało się zaktualizować prowizji. Odśwież status za chwilę.");
        }
        const { data: updated, error: updatedError } = await supabase.rpc(
          "get_ideahire_payment_summary", { p_conversation_id: conversation.id }
        );
        if (updatedError) throw updatedError;
        nextSummary = updated?.[0] || null;
      }
      if (!isCurrent()) return null;
      if (nextSummary && (nextSummary.agreement_id !== agreement.id
        || nextSummary.client_id !== conversation.client_id
        || nextSummary.contractor_id !== conversation.contractor_id
        || !Object.prototype.hasOwnProperty.call(PAYMENT_STATUS_COPY, nextSummary.payment_status))) {
        throw new Error("Podsumowanie nie odpowiada aktualnym ustaleniom. Odśwież rozmowę.");
      }
      if (nextSummary) {
        const amounts = [nextSummary.work_amount, nextSummary.platform_fee, nextSummary.total_amount, nextSummary.contractor_amount];
        if (nextSummary.currency !== "PLN" || amounts.some(value => value == null || value === ""
          || !Number.isFinite(Number(value)) || Number(value) < 0
          || !Number.isSafeInteger(Math.round(Number(value) * 100))
          || Math.abs(Number(value) * 100 - Math.round(Number(value) * 100)) > 0.000001)
          || Math.round(Number(nextSummary.work_amount) * 100) + Math.round(Number(nextSummary.platform_fee) * 100)
            !== Math.round(Number(nextSummary.total_amount) * 100)
          || (Math.round(Number(nextSummary.contractor_amount) * 100) > Math.round(Number(nextSummary.work_amount) * 100)
            || (!["refunded", "partially_refunded"].includes(nextSummary.payment_status)
              && Math.round(Number(nextSummary.contractor_amount) * 100) !== Math.round(Number(nextSummary.work_amount) * 100)))
          || Number(nextSummary.work_amount) <= 0) {
          throw new Error("Kwoty płatności wymagają sprawdzenia. Nie rozpoczynaj ponownej płatności.");
        }
        if (isClient && PAYMENT_CHECKOUT_STATUSES.has(nextSummary.payment_status)
          && nextSummary.pricing_rule_code !== "PLN_5_5_MIN20_MAX229_V3") {
          throw new Error("Serwer nie potwierdził aktualnego cennika. Odśwież status płatności.");
        }
      }
      setSummaryRecord({ scope: paymentScope, data: nextSummary });
      setCheckedRecord({ scope: paymentScope, at: new Date() });
      setMessage("");
      onStatusChange?.(nextSummary?.payment_status || "");
      return nextSummary;
    } catch (error) {
      if (!isCurrent()) return null;
      setSummaryRecord(null);
      setCheckedRecord(null);
      setMessage(
        readController?.signal.aborted ? "Odczyt statusu trwał zbyt długo. Spróbuj odświeżyć ponownie." : cleanSupabaseError(
          error,
          "Nie udało się pobrać statusu płatności."
        )
      );
      onStatusChange?.("");
      return null;
    } finally {
      if (readTimeout !== null) window.clearTimeout(readTimeout);
      if (isCurrent()) setLoading(false);
    }
  }, [agreement?.id, agreement?.status, conversation?.id, conversation?.client_id, conversation?.contractor_id,
    isClient, onStatusChange, paymentScope]);

  useEffect(() => {
    currentPaymentScope.current = paymentScope;
    checkoutInFlight.current = false;
    refreshInFlight.current = false;
    setPaying(false);
    setMessage("");
    loadSummary();
    return () => {
      requestGeneration.current += 1;
      currentPaymentScope.current = null;
    };
  }, [loadSummary]);

  async function handleRefreshStatus() {
    if (refreshInFlight.current || loading || paying) return;
    const requestedScope = paymentScope;
    refreshInFlight.current = true;
    try {
      // Refresh reads this conversation's summary; it never opens Checkout or moves funds.
      await loadSummary({ readOnly: true });
    } finally {
      if (currentPaymentScope.current === requestedScope) refreshInFlight.current = false;
    }
  }

  useEffect(() => {
    if (!conversation?.id || agreement?.status !== "accepted") return;
    let lastRefresh = 0;
    function refreshVisiblePayment() {
      if (document.visibilityState === "hidden" || Date.now() - lastRefresh < 1000) return;
      lastRefresh = Date.now();
      loadSummary();
    }
    window.addEventListener("focus", refreshVisiblePayment);
    window.addEventListener("pageshow", refreshVisiblePayment);
    document.addEventListener("visibilitychange", refreshVisiblePayment);
    return () => {
      window.removeEventListener("focus", refreshVisiblePayment);
      window.removeEventListener("pageshow", refreshVisiblePayment);
      document.removeEventListener("visibilitychange", refreshVisiblePayment);
    };
  }, [agreement?.status, conversation?.id, loadSummary]);

  useEffect(() => {
    function handlePaymentUpdate(event) {
      if (!event?.detail?.conversationId || event.detail.conversationId === conversation?.id) {
        loadSummary();
      }
    }
    window.addEventListener("ideahire:payment-updated", handlePaymentUpdate);
    return () => window.removeEventListener("ideahire:payment-updated", handlePaymentUpdate);
  }, [conversation?.id, loadSummary]);

  useEffect(() => {
    if (paymentReturn === "success") {
      setMessage(
        "Płatność została wysłana do potwierdzenia. Czekamy na bezpieczny komunikat ze Stripe."
      );
    } else if (paymentReturn === "cancelled") {
      setMessage(
        "Sprawdzamy aktualny status rozliczenia po powrocie z okna Stripe."
      );
    }
  }, [paymentReturn]);

  useEffect(() => {
    const shouldPoll =
      agreement?.status === "accepted" && (PAYMENT_POLLING_STATUSES.has(summary?.payment_status)
        || paymentReturn === "success" && (!summary || summary.payment_status === "awaiting_payment"));

    if (!shouldPoll) return undefined;

    let attempts = 0;
    let stopped = false;
    let timer;
    async function poll() {
      if (stopped) return;
      if (document.visibilityState !== "hidden") {
        attempts += 1;
        const nextSummary = await loadSummary();
        if (stopped) return;
        if (nextSummary && !PAYMENT_POLLING_STATUSES.has(nextSummary.payment_status)
          && !(paymentReturn === "success" && nextSummary.payment_status === "awaiting_payment")) return;
      }
      timer = window.setTimeout(poll, attempts < 15 ? 2000 : 15000);
    }
    timer = window.setTimeout(poll, 2000);

    return () => { stopped = true; window.clearTimeout(timer); };
  }, [agreement?.status, paymentReturn, summary?.payment_status, loadSummary]);

  async function handleCheckout() {
    if (!agreement?.id || !isClient || loading || paying || blocked || checkoutInFlight.current
      || !summary || summary.agreement_id !== agreement.id
      || !PAYMENT_CHECKOUT_STATUSES.has(summary.payment_status)) return;

    const checkoutScope = paymentScope;
    checkoutInFlight.current = true;
    setPaying(true);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        { body: { agreement_id: agreement.id } }
      );

      if (error) {
        let functionMessage = "";
        try {
          const payload = await error.context?.json?.();
          functionMessage = payload?.error || "";
        } catch {
          functionMessage = "";
        }
        throw new Error(functionMessage || error.message);
      }

      if (currentPaymentScope.current !== checkoutScope) return;

      const checkoutUrl = String(data?.url || "");
      const parsedUrl = new URL(checkoutUrl);

      if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "checkout.stripe.com"
        || parsedUrl.username || parsedUrl.password || parsedUrl.port) {
        throw new Error("Serwer zwrócił nieprawidłowy adres płatności.");
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      if (currentPaymentScope.current !== checkoutScope) return;
      setMessage(
        cleanSupabaseError(
          error,
          "Nie udało się otworzyć bezpiecznej płatności Stripe."
        )
      );
      setPaying(false);
      await loadSummary();
    } finally {
      if (currentPaymentScope.current === checkoutScope) {
        checkoutInFlight.current = false;
        setPaying(false);
      }
    }
  }

  if (agreement?.status !== "accepted") return null;

  const status = PAYMENT_STATUS_COPY[summary?.payment_status] || {
    label: summary?.payment_status || "Przygotowywanie płatności",
    tone: "pending",
  };
  const workEnabled = PAYMENT_WORK_ENABLED_STATUSES.has(
    summary?.payment_status
  );

  return (
    <section className={`chat-payment-panel ih-settlement-card is-${status.tone}`} aria-busy={loading}>
      <header className="ih-settlement-amount-heading">
        <h4>{paymentLanguage === "en" ? "Project amounts" : "Kwoty zlecenia"}</h4>
        <button type="button" className="ih-settlement-refresh" onClick={handleRefreshStatus} disabled={loading || paying}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M16 7a6.5 6.5 0 1 0 .1 5M16 3v4h-4" /></svg>
          <span>{loading ? (paymentLanguage === "en" ? "Refreshing…" : "Odświeżanie…") : (paymentLanguage === "en" ? "Refresh status" : "Odśwież status")}</span>
        </button>
      </header>

      {loading && !summary ? (
        <InlineRouteLoader className="chat-compact-route-loader" rows={1} />
      ) : summary ? (
        <>
          <dl className="ih-settlement-ledger">
            <div>
              <dt>Wynagrodzenie wykonawcy</dt>
              <dd>
                {formatPaymentMoney(summary.work_amount, summary.currency)}
              </dd>
            </div>
            <div>
              <dt>Opłata IdeaHire</dt>
              <dd>
                {formatPaymentMoney(summary.platform_fee, summary.currency)}
              </dd>
            </div>
            <div className="is-total">
              <dt>{summary.paid_at ? "Zapłacono łącznie" : isClient ? "Razem do zapłaty" : "Klient płaci łącznie"}</dt>
              <dd>
                {formatPaymentMoney(summary.total_amount, summary.currency)}
              </dd>
            </div>
          </dl>
          {Number(summary.refunded_amount) > 0 && (
            <p className="chat-payment-message">
              Kwota zwrotu odnotowana w rozliczeniu: <strong>{formatPaymentMoney(summary.refunded_amount, summary.currency)}</strong>.
              {" "}Zwrot trafia do metody płatności klienta. Aktualne potwierdzenie sprawdzisz w szczegółach sprawy.
            </p>
          )}

          <div className="chat-payment-explainer">
            <span aria-hidden="true">✓</span>
            <p>
              {summary.payment_status === "released"
                ? paymentLanguage === "en"
                  ? "The earnings have been transferred to the freelancer's Stripe balance. The freelancer can check bank payouts in their profile."
                  : "Wynagrodzenie przekazano na saldo Stripe wykonawcy. Informacje o wypłatach bankowych wykonawca znajdzie w swoim profilu."
                : summary.payment_status === "release_pending"
                ? "Trwa przekazywanie wynagrodzenia na saldo Stripe wykonawcy. Czekamy na potwierdzenie."
                : summary.payment_status === "release_failed"
                ? "Nie potwierdzono przekazania wynagrodzenia. Sprawdź status odbioru pracy przed ponowieniem tej samej operacji."
                : summary.payment_status === "refund_pending"
                ? "Rozliczenie zwrotu jest w toku. Czekamy na potwierdzenie Stripe. Kwota i etap zwrotu są w szczegółach sprawy."
                : ["refunded", "partially_refunded", "disputed"].includes(summary.payment_status)
                ? "Rozliczenie obejmuje zwrot lub spór. Zwrot zapłaty wraca do metody płatności klienta. Szczegóły i potwierdzenie Stripe sprawdź w aktualnym statusie sprawy."
                : workEnabled
                ? "Stripe potwierdził środki. Realizacja zlecenia może się rozpocząć."
                : isClient
                ? "Wykonawca otrzyma pełne wynagrodzenie wskazane w ustaleniach. Koszt Stripe pokrywa IdeaHire ze swojej opłaty."
                : "Realizacja rozpocznie się dopiero po potwierdzeniu płatności przez Stripe. Otrzymasz pełną kwotę ustaloną za pracę."}
            </p>
          </div>

          {isClient && PAYMENT_CHECKOUT_STATUSES.has(summary.payment_status) && (
            <button
              type="button"
              className="chat-payment-button"
              onClick={handleCheckout}
              disabled={loading || paying || blocked}
            >
              {paying
                ? "Otwieranie Stripe…"
                : serviceOrder
                ? `Zamawiam i płacę ${formatPaymentMoney(summary.total_amount, summary.currency)}`
                : `Zapłać ${formatPaymentMoney(summary.total_amount, summary.currency)} — zamówienie z obowiązkiem zapłaty`}
            </button>
          )}
        </>
      ) : (
        <p className="chat-payment-empty">
          Płatność jest przygotowywana. Odśwież status za chwilę.
        </p>
      )}

      {message && (
        <p className="chat-payment-message" role="status">
          {message}
        </p>
      )}
      <p className="ih-settlement-checked" role="status" aria-live="polite">
        {loading ? (paymentLanguage === "en" ? "Reading the current payment status…" : "Pobieramy aktualny status płatności…")
          : checkedRecord?.scope === paymentScope ? <>{paymentLanguage === "en" ? "Status checked at " : "Status sprawdzony o "}<time dateTime={checkedRecord.at.toISOString()}>{checkedRecord.at.toLocaleTimeString(paymentLanguage === "en" ? "en-GB" : "pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</time></>
          : (paymentLanguage === "en" ? "Current status could not be confirmed. Try refreshing again." : "Nie potwierdzono aktualnego statusu. Spróbuj odświeżyć ponownie.")}
      </p>
    </section>
  );
}



function Chat() {
  const roomLocation = useLocation();
  const roomEnglish = useSitePreferences().language === 'en';
  const roomCopy = (pl,en) => roomEnglish ? en : pl;
  const { user } =
    useAuth();
  const { canTransact } = useAgeAccess();

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

  const chatIdRef = useRef(id);
  chatIdRef.current = id;
  const chatScope = `${user?.id || ""}:${id}`;
  const chatScopeRef = useRef(chatScope);
  chatScopeRef.current = chatScope;
  const [conversationDrafts, setConversationDrafts] = useState({});
  const draft = conversationDrafts[id] || "";
  function setDraft(value) {
    setConversationDrafts((current) => {
      const next = { ...current };
      if (value) next[id] = value; else delete next[id];
      return next;
    });
  }

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [hidingConversation, setHidingConversation] =
    useState(false);

  const [disputeOpenRequest, setDisputeOpenRequest] =
    useState(0);

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

  const [jobBudgetNegotiable, setJobBudgetNegotiable] =
    useState(false);

  const [jobDetails, setJobDetails] =
    useState(null);

  const [workspaceTab, setWorkspaceTab] =
    useState("conversation");
  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const materialPhotoInputRef = useRef(null);
  const [focusMode, setFocusMode] = useState(false);
  const workspaceFocusRef = useRef(null);
  useEffect(() => { setWorkspaceTab("conversation"); setOpenMaterialDialog(false); workspaceFocusRef.current = null; setSending(false); }, [id]);
  useEffect(() => {
    const paymentReturn = new URLSearchParams(roomLocation.search).get("payment");
    if (paymentReturn === "success" || paymentReturn === "cancelled") setWorkspaceTab("payment");
  }, [id, roomLocation.search]);
  function openWorkspace(value) {
    setWorkspaceTab(value);
    if (value !== "files") setOpenMaterialDialog(false);
    if (value === "plan") void refreshAgreementState();
    window.requestAnimationFrame(() => {
      if (value === "conversation") {
        if (!window.matchMedia?.("(pointer: coarse)").matches) composerRef.current?.focus({ preventScroll: true });
        else document.querySelector(".ih-room-menu-toggle")?.focus({ preventScroll: true });
      } else {
        const panel = document.getElementById(`ih68-room-${value}`);
        panel?.focus({ preventScroll: true });
      }
    });
  }

  const messageViewportRef = useRef(null);
  const composerRef = useRef(null);
  const followMessagesRef = useRef(true);
  const [showLatest, setShowLatest] = useState(false);
  useEffect(() => {
    if (!draft && composerRef.current) {
      composerRef.current.style.height = "auto";
      composerRef.current.style.overflowY = "hidden";
    }
  }, [draft]);
  useEffect(() => { followMessagesRef.current = true; setShowLatest(false); }, [id]);
  function scrollToLatestMessage() {
    const element = messageViewportRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }
  useEffect(() => {
    if (loading || workspaceTab !== "conversation" || !followMessagesRef.current) return;
    const frame = window.requestAnimationFrame(() => scrollToLatestMessage());
    return () => window.cancelAnimationFrame(frame);
  }, [messages, workspaceTab, loading, focusMode]);

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
  const [agreementMessageTone, setAgreementMessageTone] = useState("info");

  const paymentOverview = useConversationPaymentOverview({
    conversation, conversationId: id, agreement, agreementLoading, userId: user?.id, english: roomEnglish,
  });
  const paymentStatus = paymentOverview.status;

  const [agreementForm, setAgreementForm] =
    useState(EMPTY_AGREEMENT_FORM);

  const privateWork = usePrivateWork(
    id,
    user?.id,
    Boolean(conversation)
  );

  const [agreementError, setAgreementError] = useState("");
  const agreementRef = useRef(agreement);
  agreementRef.current = agreement;
  const agreementRequestRef = useRef(0);
  const agreementOperationRef = useRef(false);
  const agreementContextRef = useRef(null);
  agreementContextRef.current = { conversation, jobTitle, jobBudget, jobDetails };

  useEffect(() => {
    setAgreement(null);
    setAgreementSaving(false);
    setAgreementLoading(true);
    setAgreementMode("view");
    setAgreementForm(EMPTY_AGREEMENT_FORM);
    setAgreementMessage("");
    setAgreementError("");
    setMessages([]);
    agreementOperationRef.current = false;
    return () => { agreementRequestRef.current += 1; };
  }, [chatScope]);

  async function loadAgreement(conversationData, fallbackTitle = "", fallbackPrice = "", projectBrief = null, options = {}) {
    const scope = chatScope;
    if (scope !== chatScopeRef.current || conversationData?.id !== chatIdRef.current) return null;
    const request = ++agreementRequestRef.current;
    if (!conversationData?.agreements_required) {
      setAgreement(null);
      setAgreementLoading(false);
      setAgreementError("");
      return null;
    }
    if (!options.quiet) setAgreementLoading(true);
    try {
      const { data, error } = await supabase.from("conversation_agreements").select("*")
        .eq("conversation_id", conversationData.id).order("version", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (scope !== chatScopeRef.current || request !== agreementRequestRef.current) return null;
      const current = agreementRef.current;
      if (current && data && (Number(data.version) < Number(current.version)
        || data.id === current.id && current.status === "accepted" && data.status !== "accepted"
        || data.id === current.id && current.responded_at && (!data.responded_at || new Date(data.responded_at) < new Date(current.responded_at)))) return current;
      const changed = current?.id !== data?.id;
      setAgreement(data || null);
      agreementRef.current = data || null;
      setAgreementError("");
      if (!data) {
        const firstId = conversationData.first_proposer_role === "contractor" ? conversationData.contractor_id : conversationData.client_id;
        if (!options.preserveForm || changed) {
          if (firstId === user?.id) {
            setAgreementForm(profileBriefToAgreementForm(projectBrief, fallbackTitle, fallbackPrice));
            setAgreementMode("form");
          } else setAgreementMode("view");
        }
      } else if (!options.preserveForm || changed || data.status === "accepted") {
        setAgreementMode("view");
        if (changed && current) { setAgreementMessageTone("info"); setAgreementMessage("Pojawiła się nowsza wersja ustaleń. Sprawdź jej treść przed podjęciem decyzji."); }
      }
      return data || null;
    } catch (error) {
      if (scope === chatScopeRef.current && request === agreementRequestRef.current) {
        setAgreementError("Nie udało się pobrać aktualnych ustaleń. Odśwież je przed podjęciem decyzji.");
      }
      throw error;
    } finally {
      if (scope === chatScopeRef.current && request === agreementRequestRef.current) setAgreementLoading(false);
    }
  }

  async function refreshAgreementState({ preflight = false } = {}) {
    const context = agreementContextRef.current;
    const scope = chatScope;
    if (!context?.conversation || context.conversation.id !== id || scope !== chatScopeRef.current
      || !preflight && agreementOperationRef.current) return null;
    try {
      const [current, result] = await Promise.all([
        loadAgreement(context.conversation, context.jobTitle, context.jobBudget, context.jobDetails, { quiet: true, preserveForm: true }),
        supabase.from("messages").select("*").eq("conversation_id", id)
          .like("content", "%[IdeaHire:terms:v1]%").order("created_at", { ascending: false }).limit(100),
      ]);
      if (result.error) throw result.error;
      if (scope !== chatScopeRef.current) return null;
      const events = result.data || [];
      setMessages(previous => {
        const fetched = new Map(events.map(event => [event.id, event]));
        let changed = false;
        const merged = previous.map(message => {
          const update = fetched.get(message.id);
          fetched.delete(message.id);
          if (!update || update.content === message.content && update.moderation_status === message.moderation_status && update.read_at === message.read_at) return message;
          changed = true;
          return { ...message, ...update };
        });
        if (!changed && !fetched.size) return previous;
        return [...merged, ...fetched.values()].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });
      return { agreement: current, decision: latestTermsDecision(events, current, context.conversation) };
    } catch (error) {
      if (scope === chatScopeRef.current) setAgreementError("Nie udało się potwierdzić aktualnego stanu ustaleń. Spróbuj ponownie.");
      if (preflight) throw error;
      return null;
    }
  }

  useEffect(() => {
    if (!conversation?.id || conversation.id !== id) return;
    const update = () => { if (!document.hidden) void refreshAgreementState(); };
    const interval = window.setInterval(update, 15000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [conversation?.id, chatScope]);

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
        "id, conversation_id, sender_id, content, created_at, read_at, moderation_status, hidden_at, sender_role"
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

    if (id === chatIdRef.current) setMessages(preparedMessages);
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
            "id, job_id, client_id, contractor_id, agreements_required, origin_type, origin_id, first_proposer_role, created_at"
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

          conversationData.job_id
            ? supabase.from("jobs").select("title, budget, budget_negotiable, category, subcategory, collaboration_plan, project_deadline, planned_start_date, description")
                .eq("id", conversationData.job_id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (conversationData.origin_type === "profile") {
          const inquiry = await supabase.from("ideahire_profile_inquiries")
            .select("title, brief, contact_kind, project_details").eq("conversation_id", id).maybeSingle();
          if (inquiry.error) throw inquiry.error;
          jobResult.data = profileInquiryToJob(inquiry.data);
        }
        if (!mounted) return;
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

        const loadedJobBudgetNegotiable =
          conversationData.origin_type === "profile" || jobResult.data?.budget_negotiable === true
            || conversationData.origin_type === "service_inquiry" && !(Number(loadedJobBudget) > 0);

        setJobTitle(
          loadedJobTitle
        );

        setJobBudget(
          loadedJobBudget
        );

        setJobBudgetNegotiable(
          loadedJobBudgetNegotiable
        );

        setJobDetails(jobResult.data || null);

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
          loadedJobBudget,
          jobResult.data
        );

        if (!mounted) return;
        await loadMessages();
        if (!mounted) return;
        markConversationSeen(
          user.id,
          id
        );
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
            if (!mounted || id !== chatIdRef.current) return;
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
            if (!mounted || id !== chatIdRef.current) return;
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
        .on("postgres_changes", { event: "*", schema: "public", table: "conversation_agreements", filter: `conversation_id=eq.${id}` }, () => {
          if (mounted && chatScope === chatScopeRef.current) void refreshAgreementState();
        })
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
    if (!canEditAgreement || agreementError || agreementOperationRef.current) return;
    setAgreementMessage("");
    const nextForm = agreement ? agreementToForm(agreement, jobTitle, jobBudget) : profileBriefToAgreementForm(jobDetails, jobTitle, jobBudget);

    setAgreementForm({
      ...nextForm,
      priceAmount: jobBudgetNegotiable
        ? nextForm.priceAmount
        : jobBudget === null ||
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
    setAgreementMessageTone("error");

    if (
      !user?.id ||
      !id ||
      agreementSaving || agreementOperationRef.current || !canEditAgreement || agreementError || !canTransact ||
      messagingBlocked
    ) {
      return;
    }

    if (
      !agreement &&
      (conversation?.first_proposer_role === "contractor"
        ? conversation?.contractor_id
        : conversation?.client_id) !== user.id
    ) {
      setAgreementMessage(
        conversation?.first_proposer_role === "contractor"
          ? "Pierwszą ofertę przygotowuje wykonawca."
          : "Pierwszą propozycję warunków wysyła zleceniodawca."
      );
      return;
    }

    if (waitingForProfileReply) {
      setAgreementMessage("Najpierw poczekaj na odpowiedź wykonawcy w rozmowie.");
      return;
    }

    const price =
      parseAgreementPrice(
        jobBudgetNegotiable
          ? agreementForm.priceAmount
          : jobBudget
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
      price < 1 ||
      price > MAX_JOB_BUDGET ||
      Math.abs(price * 100 - Math.round(price * 100)) > 0.000001
    ) {
      setAgreementMessage(
        jobBudgetNegotiable ? "Wpisz cenę zlecenia od 1 do 10 000 zł, z dokładnością do grosza." : "Nie udało się pobrać ceny ze zlecenia. Odśwież stronę i spróbuj ponownie."
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
        "Opisz kryteria akceptacji gotowej pracy."
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

    const operationToken = { scope: chatScope };
    agreementOperationRef.current = operationToken;
    setAgreementSaving(true);
    setAgreementMessageTone("info");
    setAgreementMessage("");

    try {
      const fresh = await refreshAgreementState({ preflight: true });
      if (operationToken.scope !== chatScopeRef.current) return false;
      if (!fresh || (fresh.agreement?.id || null) !== (agreement?.id || null)) throw new Error("Pojawiła się nowsza propozycja. Przeczytaj ją przed wysłaniem zmian.");
      if (fresh.agreement?.status === "accepted" || fresh.decision?.action === "closed") throw new Error("Ta propozycja nie może być już zmieniana.");
      const acceptedByMe = fresh.agreement && (conversation.client_id === user.id ? fresh.agreement.client_accepted_at : fresh.agreement.contractor_accepted_at);
      if (fresh.agreement && fresh.agreement.created_by !== user.id && acceptedByMe && fresh.decision?.action !== "changes") throw new Error("Twoja akceptacja jest już zapisana. Poczekaj na odpowiedź drugiej strony.");
      if (fresh.agreement?.created_by === user.id && fresh.decision?.action !== "changes") throw new Error("Propozycja czeka na odpowiedź drugiej strony. Poczekaj na akceptację albo prośbę o zmiany.");
      if (conversation?.origin_type === "profile" && !conversation.job_id) {
        const { data, error: projectError } = await supabase.rpc("ensure_ideahire_profile_project", { p_conversation_id: id, p_price_amount: price });
        if (projectError) throw projectError;
        if (!data?.job_id) throw new Error("Nie udało się przygotować prywatnego zlecenia.");
        setConversation((current) => ({ ...current, job_id: data.job_id }));
      }
      const { error } =
        await supabase.rpc(
          "propose_conversation_agreement_v2",
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
      if (operationToken.scope !== chatScopeRef.current) return false;

      const savedAgreement = await loadAgreement(
        conversation,
        jobTitle,
        jobBudget
      );

      const mismatches = getAgreementSaveMismatches(
        savedAgreement,
        {
          title: agreementForm.title,
          scope: agreementForm.scope,
          deliverables: agreementForm.deliverables,
          priceAmount: price,
          deadline: agreementForm.deadline,
          revisions,
          deliveryFormat: agreementForm.deliveryFormat,
          acceptanceMethod: agreementForm.acceptanceMethod,
          cancellationTerms: agreementForm.cancellationTerms,
          additionalTerms: agreementForm.additionalTerms,
        }
      );

      if (mismatches.length > 0) {
        throw new Error(
          `Baza nie potwierdziła poprawnego zapisu: ${mismatches.join(
            ", "
          )}. Odśwież rozmowę i spróbuj ponownie.`
        );
      }

      setAgreementMessageTone("success");
      setAgreementMessage(
        "Propozycja została wysłana. Możecie dalej omawiać ją na czacie."
      );
    } catch (error) {
      if (operationToken.scope !== chatScopeRef.current) return false;
      setAgreementMessageTone("error");
      setAgreementMessage(
        error?.message ||
          "Nie udało się zapisać warunków współpracy."
      );
    } finally {
      if (agreementOperationRef.current === operationToken) {
        agreementOperationRef.current = false;
        setAgreementSaving(false);
      }
    }
  }

  async function handleAgreementAccept() {
    if (!agreement?.id || agreementSaving || agreementOperationRef.current || messagingBlocked || agreementError || !canTransact) return;
    const operationToken = { scope: chatScope };
    agreementOperationRef.current = operationToken;
    setAgreementSaving(true);
    setAgreementMessageTone("info");
    setAgreementMessage("");
    const expected = agreement.id;
    try {
      const fresh = await refreshAgreementState({ preflight: true });
      if (operationToken.scope !== chatScopeRef.current) return false;
      if (!fresh || fresh.agreement?.id !== expected) throw new Error("Pojawiła się nowsza wersja ustaleń. Sprawdź ją przed akceptacją.");
      if (fresh.decision) throw new Error("Ta wersja wymaga zmiany lub negocjacje zostały zakończone. Nie można jej zaakceptować.");
      if (fresh.agreement.status === "accepted") { setAgreementMessage("Obie strony zaakceptowały tę wersję."); return; }
      const { error } = await supabase.rpc("accept_conversation_agreement_v2", { p_agreement_id: expected });
      if (error) throw error;
      if (operationToken.scope !== chatScopeRef.current) return false;
      const saved = await loadAgreement(conversation, jobTitle, jobBudget);
      setAgreementMessageTone("success");
      setAgreementMessage(saved?.status === "accepted"
        ? "Obie strony zaakceptowały tę samą wersję. Zleceniodawca może teraz opłacić zlecenie."
        : "Twoja akceptacja została zapisana. Czekamy na akceptację tej samej wersji przez drugą stronę.");
    } catch (error) {
      if (operationToken.scope !== chatScopeRef.current) return false;
      setAgreementMessageTone("error");
      setAgreementMessage(error?.message || "Nie udało się zaakceptować warunków współpracy.");
    } finally {
      if (agreementOperationRef.current === operationToken) {
        agreementOperationRef.current = false;
        setAgreementSaving(false);
      }
    }
  }

  async function handleAgreementDecision(action, reason) {
    if (!agreement?.id || !["changes", "closed"].includes(action) || agreementSaving || agreementOperationRef.current
      || messagingBlocked || !canTransact || agreement.status === "accepted") return false;
    if (action === "changes" ? !negotiation.canRequestChanges : !negotiation.canDecline) return false;
    if (reason.trim().length < 3 || reason.trim().length > 1200) return false;
    const operationToken = { scope: chatScope };
    agreementOperationRef.current = operationToken;
    setAgreementSaving(true);
    setAgreementMessageTone("info");
    setAgreementMessage("");
    try {
      const fresh = await refreshAgreementState({ preflight: true });
      if (operationToken.scope !== chatScopeRef.current) return false;
      if (!fresh || fresh.agreement?.id !== agreement.id || fresh.agreement.status === "accepted") throw new Error("Stan ustaleń zmienił się. Sprawdź aktualną wersję.");
      if (fresh.decision?.action === "closed") throw new Error("Negocjacje zostały już zakończone.");
      const currentPermissions = agreementPermissions({ conversation, agreement:fresh.agreement, userId:user.id, decision:fresh.decision, blocked:messagingBlocked, canTransact });
      if (action === "changes" ? !currentPermissions.canRequestChanges : !currentPermissions.canDecline) throw new Error("Ta propozycja czeka na odpowiedź drugiej strony albo została już rozstrzygnięta. Odśwież ustalenia.");
      const { data, error } = await supabase.rpc("respond_to_conversation_agreement", {
        p_agreement_id: fresh.agreement.id, p_action: action, p_reason: reason.trim(),
      });
      if (error) throw new Error(["PGRST202", "42883"].includes(error.code)
        ? "Nie udało się zapisać decyzji. Nic nie zostało zmienione. Spróbuj ponownie później."
        : error.message);
      if (operationToken.scope !== chatScopeRef.current) return false;
      if (!data?.agreement || !data?.message) throw new Error("Nie udało się potwierdzić zapisu decyzji. Odśwież ustalenia.");
      setAgreement(data.agreement);
      agreementRef.current = data.agreement;
      setMessages(current => current.some(message => message.id === data.message.id) ? current : [...current, data.message]);
      if (action === "closed") window.dispatchEvent(new CustomEvent("ideahire:service-capacity-updated", { detail: { serviceId: data.service_id } }));
      setAgreementMode("view");
      setAgreementMessageTone("success");
      setAgreementMessage(action === "changes" ? "Prośba o zmianę została wysłana. Autor propozycji może przygotować nową wersję." : "Negocjacje zakończono. Druga strona otrzymała wiadomość." + (data.released_slots > 0 ? " Rezerwacja miejsca w usłudze została zwolniona." : ""));
      return true;
    } catch (error) {
      if (operationToken.scope !== chatScopeRef.current) return false;
      setAgreementMessageTone("error");
      setAgreementMessage(error?.message || "Nie udało się zapisać odpowiedzi na propozycję.");
      return false;
    } finally {
      if (agreementOperationRef.current === operationToken) {
        agreementOperationRef.current = false;
        setAgreementSaving(false);
      }
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

    if (
      containsCredentialLikeText(content) &&
      !window.confirm(
        "Ta wiadomość może zawierać hasło, token, klucz API albo kod dostępu. IdeaHire nie jest menedżerem haseł. Dla bezpieczeństwa usuń sekret i udostępnij go narzędziem z dostępem czasowym. Jeśli wykrycie jest błędne, możesz świadomie kontynuować."
      )
    ) {
      return;
    }

    const sendScope = chatScope;
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
          "id, conversation_id, sender_id, content, created_at, read_at, moderation_status, hidden_at, sender_role"
        )
        .single();

      if (error) {
        throw error;
      }

      if (sendScope !== chatScopeRef.current) return;
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
      if (sendScope !== chatScopeRef.current) return;
      setErrorMessage(
        error?.message ||
          "Nie udało się wysłać wiadomości."
      );
    } finally {
      if (sendScope === chatScopeRef.current) setSending(false);
    }
  }

  async function handleSendVoice(file) {
    if (!user?.id || !id || messagingBlocked) throw new Error("VOICE_UNAVAILABLE");
    const room = id, voiceScope = chatScope;
    await sendConversationVoice(room, file);
    if (voiceScope !== chatScopeRef.current) return;
    followMessagesRef.current = true;
    setShowLatest(false);
    try { await Promise.all([privateWork.reload(), loadMessages()]); }
    catch { if (voiceScope === chatScopeRef.current) setErrorMessage(roomCopy("Nagranie zapisano. Odśwież rozmowę, aby je zobaczyć.", "Recording saved. Refresh the conversation to see it.")); }
  }

  async function handleHideConversation() {
    if (
      !user?.id ||
      !id ||
      hidingConversation
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Ukryć tę rozmowę tylko na Twojej liście? Nie usunie to wiadomości ani materiałów, a nowa wiadomość może ponownie pokazać wątek."
      );

    if (!confirmed) return;

    setHidingConversation(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc(
        "hide_my_ideahire_conversation",
        { p_conversation_id: id }
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
        `Nie udało się ukryć rozmowy: ${
          error?.message ||
          "Nieznany błąd"
        }`
      );
    } finally {
      setHidingConversation(false);
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

  const paymentConfirmed =
    !agreementsRequired ||
    PAYMENT_WORK_ENABLED_STATUSES.has(paymentStatus);

  const isClient =
    conversation?.client_id ===
    user?.id;

  const isProfileMessage = conversation?.origin_type === "profile" && jobDetails?.contact_kind === "message";
  const profileReplyReceived = messages.some(message => message.conversation_id === id && message.sender_id === conversation?.contractor_id
    && (!message.moderation_status || message.moderation_status === "active") && !message.hidden_at
    && String(message.content || "").trim());
  const waitingForProfileReply = isProfileMessage && !conversation?.job_id && !agreement && !profileReplyReceived;

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

  const agreementDecision = latestTermsDecision(messages, agreement, conversation);
  const negotiation = agreementPermissions({ conversation, agreement, userId:user?.id, decision:agreementDecision,
    loading:agreementLoading, error:agreementError, blocked:messagingBlocked, canTransact, waitingForReply:waitingForProfileReply });
  const { proposalByMe, canStart:canStartAgreement, canEdit:canEditAgreement } = negotiation;
  const firstProposalByMe = (conversation?.first_proposer_role === 'contractor'
    ? conversation?.contractor_id : conversation?.client_id) === user?.id;
  const replyInConversation = () => {
    openWorkspace('conversation');
    requestAnimationFrame(() => composerRef.current?.focus());
  };
  const conversationNextStep = !messagingBlocked && agreementsRequired && !agreementLoading && !agreementAccepted ? (
    agreementError ? {
      title: roomCopy('Aktualne ustalenia wymagają odświeżenia', 'Refresh the current terms'),
      description: roomCopy('Przed podjęciem decyzji pobierz aktualną propozycję.', 'Load the current proposal before making a decision.'),
      actionLabel: roomCopy('Odśwież ustalenia', 'Refresh terms'), onAction: () => openWorkspace('plan'),
    } : agreementDecision?.action === 'closed' ? {
      title: roomCopy('Negocjacje zostały zakończone', 'Negotiations ended'),
      description: roomCopy('Informacja i ostatnia propozycja pozostają w historii ustaleń.', 'The decision and last proposal remain in the terms history.'),
      actionLabel: roomCopy('Zobacz ustalenia', 'View terms'), onAction: () => openWorkspace('plan'),
    } : agreementDecision?.action === 'changes' ? {
      title: proposalByMe ? roomCopy('Druga strona poprosiła o zmiany', 'The other person requested changes') : roomCopy('Prośba o zmiany została wysłana', 'Your change request was sent'),
      description: roomCopy('Możecie przygotować nową wersję warunków. Obie strony muszą zaakceptować tę samą wersję.', 'You can prepare a new proposal. Both people must accept the same version.'),
      actionLabel: roomCopy('Przejdź do ustaleń', 'Open terms'), onAction: () => openWorkspace('plan'),
    } : waitingForProfileReply ? {
      title: isClient ? roomCopy('Czekasz na odpowiedź wykonawcy', 'Waiting for the freelancer’s reply') : roomCopy('Klient czeka na Twoją odpowiedź', 'The client is waiting for your reply'),
      description: roomCopy('Po odpowiedzi wykonawcy zleceniodawca może przygotować propozycję warunków.', 'After the freelancer replies, the client can prepare proposed terms.'),
      actionLabel: isClient ? roomCopy('Zobacz ustalenia', 'View terms') : roomCopy('Odpowiedz', 'Reply'),
      onAction: isClient ? () => openWorkspace('plan') : replyInConversation,
    } : !agreement ? {
      title: firstProposalByMe ? roomCopy('Możesz przygotować propozycję warunków', 'You can prepare proposed terms') : conversation?.first_proposer_role === 'contractor' ? roomCopy('Czekasz na ofertę wykonawcy', 'Waiting for the freelancer’s offer') : roomCopy('Czekasz na propozycję zleceniodawcy', 'Waiting for the client’s proposal'),
      description: roomCopy('Zakres, cena, termin i poprawki będą zapisane w jednym formularzu.', 'Scope, price, deadline and revisions will be recorded in one form.'),
      actionLabel: firstProposalByMe && canTransact ? roomCopy('Przygotuj warunki', 'Prepare terms') : roomCopy('Zobacz ustalenia', 'View terms'),
      onAction: () => { if (firstProposalByMe && canTransact) openAgreementForm(); openWorkspace('plan'); },
    } : {
      title: currentUserAccepted ? roomCopy('Twoja akceptacja jest zapisana', 'Your acceptance has been recorded') : roomCopy('Propozycja warunków czeka na Ciebie', 'Proposed terms are ready to review'),
      description: currentUserAccepted ? roomCopy('Płatność będzie dostępna po akceptacji tej samej wersji przez drugą stronę.', 'Payment becomes available after the other party accepts the same version.') : roomCopy('Sprawdź zakres, cenę i termin. Możesz zaakceptować propozycję lub zaproponować zmiany.', 'Check the scope, price and deadline. You can accept the proposal or suggest changes.'),
      actionLabel: roomCopy('Sprawdź warunki', 'Review terms'),
      onAction: () => openWorkspace('plan'),
    }
  ) : null;

  const activeMaterialCount = privateWork.items.filter(item => item.moderation_status === 'active').length;
  const roomReturn = typeof roomLocation.state?.workspaceReturn === 'string' && /^\/(messages|work)(\?|$)/.test(roomLocation.state.workspaceReturn) ? roomLocation.state.workspaceReturn : '/messages';
  return <div className="account-page ih68-chat-root"><AccountNavbar/>
    <WorkspaceConversation loading={loading} errorMessage={errorMessage} hasConversation={Boolean(conversation)}
      otherName={otherName} avatarUrl={otherProfile?.avatar_url} profileId={otherProfileId} blocked={messagingBlocked}
      jobTitle={jobTitle} category={getJobCategoryLabel(jobDetails?.category)}
      nextStep={conversationNextStep}
      termsPending={Boolean(agreement && !agreementAccepted && agreementDecision?.action !== 'closed' && (!proposalByMe && !currentUserAccepted || proposalByMe && agreementDecision?.action === 'changes'))}
      materialCount={activeMaterialCount} accepted={agreement?.status==='accepted'} paymentOverview={paymentOverview}
      view={workspaceTab} onView={openWorkspace} focusMode={focusMode} onFocusMode={setFocusMode}
      backLabel={roomReturn.startsWith('/work')?roomCopy('Praca','Work'):roomCopy('Wiadomości','Messages')}
      onBack={()=>navigate(roomReturn,{state:{workspaceRestoreScrollY:roomLocation.state?.workspaceScrollY}})}
      onHide={handleHideConversation} hiding={hidingConversation} canDispute={agreement?.status==='accepted'} onDispute={()=>setDisputeOpenRequest(value=>value+1)}
      disputePanel={<ChatDisputePanel
                agreement={agreement}
                conversation={conversation}
                openRequest={disputeOpenRequest}
                launcherHidden
              />}
      messageReports={<WorkspaceMessageReports messages={messages} userId={user?.id} onReport={messageId => privateWork.setReportTarget({type:'message',id:messageId})}/>}
      thread={<WorkspaceThread messages={messages} user={user} otherName={otherName} lastReadOwnMessageId={lastReadOwnMessageId} viewportRef={messageViewportRef} followEndRef={followMessagesRef}
        renderContent={message=><>{String(message.content||'').trim() && !(message.content === 'Wiadomość głosowa' && (privateWork.itemsByMessage[message.id] || []).some(item => /^Wiadomość głosowa /.test(item.display_name || ''))) && (readTermsDecision(message, null, conversation)
          ? <TermsDecisionMessage decision={readTermsDecision(message, null, conversation)} own={message.sender_id === user.id} onTerms={() => openWorkspace('plan')} english={roomEnglish} />
          : isInquiryMessage(message.content) ? <InquiryMessageCard text={message.content} renderText={text => <MessageText text={text}/>} onTerms={() => openWorkspace('plan')} english={roomEnglish} firstProposalRole={conversation?.first_proposer_role} />
          : <MessageText text={message.content}/>)} <PrivateMessageMaterials
                                items={privateWork.itemsByMessage[message.id] || []}
                                signedUrls={privateWork.signedUrls}
                                ownMessage={message.sender_id === user.id}
                                onReport={(type, targetId) =>
                                  privateWork.setReportTarget({ type, id: targetId })
                                }
                              /></>}
        onScroll={event=>{const element=event.currentTarget;followMessagesRef.current=element.scrollHeight-element.scrollTop-element.clientHeight<100;setShowLatest(!followMessagesRef.current);}}
        showLatest={showLatest} onLatest={()=>{followMessagesRef.current=true;setShowLatest(false);scrollToLatestMessage(true);}}/>}
      composer={<WorkspaceComposer conversationId={`${user?.id}:${id}`} onSendVoice={handleSendVoice} onRefresh={() => Promise.all([privateWork.reload(), loadMessages()])} draft={draft} setDraft={setDraft} sending={sending} blocked={messagingBlocked} composerRef={composerRef}
        onSubmit={event=>{followMessagesRef.current=true;handleSend(event);}} onMaterials={()=>setOpenMaterialDialog(true)} onPhotos={()=>{ const input=materialPhotoInputRef.current; if(input && !input.disabled) input.click(); else setOpenMaterialDialog(true); }} materialsDisabled={privateWork.loading} errorMessage={errorMessage} blockedByMe={blockedByMe} profileId={otherProfileId} recipientName={otherName}/>}
      materials={<><div className="ih69-material-toolbar"><div><p>{roomCopy('Materiały w rozmowie:','Materials in this conversation:')} <strong>{activeMaterialCount}</strong></p></div><PrivateSharePanel
                      key={id} compact openRequest={openMaterialDialog} onOpenRequest={setOpenMaterialDialog} photoInputRef={materialPhotoInputRef}
                      conversationId={id} recipientName={otherName}
                      userId={user?.id}
                      disabled={messagingBlocked || privateWork.loading}
                      agreementAccepted={agreement?.status === "accepted"}
                      paymentConfirmed={paymentConfirmed}
                      isContractor={!isClient}
                      onComplete={async () => {
                        await Promise.all([privateWork.reload(), loadMessages()]);
                      }}
                    /></div>{paymentConfirmed&&<WorkDeliveryPanel
                        deliveries={privateWork.deliveries}
                        events={privateWork.events}
                        conversation={conversation}
                        userId={user?.id}
                        paymentStatus={paymentStatus}
                        disabled={messagingBlocked}
                        onComplete={async () => {
                          await Promise.all([privateWork.reload(), loadMessages()]);
                        }}
                        onReport={(type, targetId) =>
                          privateWork.setReportTarget({ type, id: targetId })
                        }
                      />}<ProjectFilesPanel
                      workspace english={roomEnglish}
                      items={privateWork.items}
                      signedUrls={privateWork.signedUrls}
                      userId={user?.id}
                      loading={privateWork.loading}
                      error={privateWork.error}
                      onReport={(type, targetId) =>
                        privateWork.setReportTarget({ type, id: targetId })
                      }
                    /><p className="ih69-material-privacy"><WorkspaceIcon kind="lock" />{roomCopy("Materiały są widoczne wyłącznie dla stron tej współpracy.","Materials are visible only to the people in this project.")}</p></>}
      projectAction={isProfileMessage && profileReplyReceived && !conversation?.job_id && !agreement ? <div className="ih-profile-project-step"><div><strong>{roomCopy('Najpierw rozmowa, potem zlecenie', 'Chat first, then prepare the project')}</strong><p>{profileReplyReceived ? roomCopy('Możecie teraz przygotować zakres, cenę i termin w panelu zlecenia.', 'You can now prepare scope, price and deadline in the project panel.') : roomCopy('Panel zlecenia będzie dostępny po odpowiedzi wykonawcy.', 'The project panel becomes available after the freelancer replies.')}</p></div>{isClient && <button type="button" disabled={waitingForProfileReply || messagingBlocked || !canTransact} onClick={() => { openAgreementForm(); openWorkspace('plan'); }}><WorkspaceIcon kind="plus" />{roomCopy('Przygotuj zlecenie', 'Prepare project')}</button>}</div> : null}
      plan={waitingForProfileReply ? <section className="ih-profile-project-wait">
        <h3>{isClient ? roomCopy('Formularz będzie dostępny po odpowiedzi wykonawcy', 'The form becomes available after the freelancer replies') : roomCopy('Najpierw odpowiedz klientowi', 'Reply to the client first')}</h3>
        <p>{isClient ? roomCopy('To na razie prywatne zapytanie. Wykonawca jeszcze nie odpowiedział. Nie ma zaakceptowanych warunków ani płatności.', 'This is currently a private inquiry. The freelancer has not replied yet. No terms have been accepted and no payment has been made.') : roomCopy('Po Twojej odpowiedzi zleceniodawca będzie mógł przygotować propozycję. Wysłanie wiadomości nie oznacza akceptacji warunków.', 'After your reply, the client can prepare proposed terms. Sending a message does not mean accepting the terms.')}</p>
        <ol className="ih-chat-start-steps">
          <li><strong>{roomCopy('Rozmowa', 'Conversation')}</strong><span>{roomCopy('Ustalcie, czego dotyczy usługa i czy wykonawca jest dostępny.', 'Discuss the service and the freelancer’s availability.')}</span></li>
          <li><strong>{roomCopy('Propozycja i akceptacja', 'Proposal and acceptance')}</strong><span>{roomCopy('Zleceniodawca wpisuje zakres, cenę, termin i poprawki. Obie strony akceptują tę samą wersję.', 'The client enters scope, price, deadline and revisions. Both parties accept the same version.')}</span></li>
          <li><strong>{roomCopy('Płatność i realizacja', 'Payment and delivery')}</strong><span>{roomCopy('Po akceptacji zleceniodawca może zapłacić. Rozpocznijcie realizację po potwierdzeniu płatności.', 'Once terms are accepted, the client can pay. Start delivery after payment is confirmed.')}</span></li>
        </ol>
        <button type="button" className="ih68-secondary" onClick={replyInConversation}>{isClient ? roomCopy('Przejdź do rozmowy', 'Open conversation') : roomCopy('Odpowiedz klientowi', 'Reply to the client')}<WorkspaceIcon kind="next" /></button>
      </section> : <><AgreementPanel
                      required={agreementsRequired}
                      agreement={agreement}
                      loading={agreementLoading}
                      saving={agreementSaving}
                      mode={agreementMode}
                      form={agreementForm}
                      message={agreementMessage}
                      messageTone={agreementMessageTone}
                      priceNegotiable={jobBudgetNegotiable}
                      canStart={canStartAgreement}
                      canEdit={canEditAgreement}
                      proposalByMe={proposalByMe}
                      canAccept={negotiation.canAccept} canDecline={negotiation.canDecline}
                      currentUserId={user?.id} isClient={isClient} isServiceInquiry={conversation?.origin_type === "service_inquiry"}
                      decision={agreementDecision}
                      error={agreementError}
                      onRefresh={() => refreshAgreementState()}
                      onDecision={handleAgreementDecision}
                      currentUserAccepted={currentUserAccepted}
                      otherUserAccepted={otherUserAccepted}
                      firstProposalAuthor={
                        conversation?.first_proposer_role === "contractor"
                          ? "wykonawcy"
                          : "zleceniodawcy"
                      }
                      blocked={messagingBlocked}
                      onFieldChange={updateAgreementField}
                      onOpenForm={openAgreementForm}
                      onCancelForm={() => {
                        setAgreementMode("view");
                        setAgreementMessage("");
                      }}
                      onSubmit={handleAgreementSubmit}
                      onAccept={handleAgreementAccept}
                    />{!agreementsRequired && <section className="ih18-legacy-plan ih69-legacy-note" aria-labelledby="ih18-legacy-plan-title">
                      <h3 id="ih18-legacy-plan-title">Ustalenia w starszej rozmowie</h3>
                      <p>W tej rozmowie nie można zaakceptować formalnych warunków. Aby uzgodnić zakres, cenę i termin, rozpocznij projekt z tym wykonawcą. Dotychczasowe wiadomości pozostaną dostępne.</p>
                      {isClient && otherProfile ? <ProfileContactAction profile={otherProfile} user={user} supabase={supabase} navigate={navigate} disabled={messagingBlocked} canContact={canTransact && !messagingBlocked} /> : <p>Zleceniodawca może rozpocząć projekt z profilu wykonawcy przyciskiem „Zleć pracę”.</p>}
                    </section>}</>}
      payment={agreement?.status === "accepted" ? <ChatPaymentPanel
                      agreement={agreement}
                      conversation={conversation}
                      userId={user?.id}
                      blocked={messagingBlocked}
                      serviceOrder={conversation?.origin_type === "service_inquiry"}
                      onStatusChange={paymentOverview.refresh}
                    /> : <section className="ih-payment-prerequisite"><h3>{agreementsRequired ? roomCopy('Najpierw ustalcie warunki', 'Agree on terms first') : roomCopy('Rozliczenie wymaga nowego zlecenia', 'Start a new project to arrange payment')}</h3><p>{agreementsRequired ? roomCopy('Płatność będzie dostępna po zaakceptowaniu zakresu, ceny i terminu przez obie strony.', 'Payment becomes available after both parties accept the scope, price and deadline.') : roomCopy('Ta starsza rozmowa nie obsługuje formalnych warunków ani płatności. W ustaleniach znajdziesz możliwość rozpoczęcia nowego projektu.', 'This older conversation does not support formal terms or payments. Open terms to start a new project.')}</p><button type="button" className="ih68-secondary" onClick={() => openWorkspace('plan')}>{roomCopy('Przejdź do ustaleń', 'Open terms')}</button></section>}
      reportDialog={<PrivateReportDialog
                target={privateWork.reportTarget}
                onClose={() =>
                  privateWork.setReportTarget(null)
                }
                onSubmitted={privateWork.reload}
              />}/>
  </div>;
}


/* DISPUTES AND ADMINISTRATION */

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
  private_report_evidence_opened: "Otwarto prywatny dowód zgłoszenia",
  private_content_removed_without_account_restriction:
    "Usunięto prywatną treść bez ograniczenia konta",
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

  if (adminView) return <AdminCaseRow to={`/disputes/${dispute.id}`} title={dispute.job_title_snapshot} number={formatDisputeNumber(dispute.case_number)} status={<DisputeStatusPill status={dispute.status}/>} assignment={dispute.assigned_admin_id?"Przypisana do administratora":"Bez opiekuna"} budget={formatDisputeMoney(dispute.price_amount_snapshot,dispute.price_currency_snapshot)} opened={formatDisputeDate(dispute.opened_at)} />;

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
        <SubpageHeading eyebrow="Bezpieczna współpraca" title="Sprawy i zgłoszenia"
          description="Zgłoszone problemy, wyjaśnienia, dowody i decyzje administratora."
          variant="disputes"
          actions={isStaff ? <Link className="dispute-primary-button" to="/admin">Otwórz panel administratora</Link> : null} />

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
          <InlineRouteLoader
            className="disputes-route-loader"
            rows={4}
          />
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
  const [appealReplies, setAppealReplies] = useState({});
  const [adminChatDrafts, setAdminChatDrafts] = useState({});
  const adminChatRequest = useRef(null);
  const adminChatInFlight = useRef(false);
  const [caseNow, setCaseNow] = useState(Date.now);
  const [adminNote, setAdminNote] = useState("");
  const [adminNotePublic, setAdminNotePublic] = useState(true);
  const [decisionForm, setDecisionForm] = useState(
    createEmptyDisputeDecisionForm
  );
  const [decisionMessage, setDecisionMessage] = useState("");

  useEffect(() => {
    const update = () => { if (document.visibilityState !== "hidden") setCaseNow(Date.now()); };
    const timer = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", update); };
  }, []);

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
          .select("id, sender_id, content, created_at, sender_role")
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
              .select("id, conversation_id, sender_id, content, created_at, read_at, sender_role")
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
        { event: "*", schema: "public", table: "dispute_decisions", filter: `dispute_id=eq.${id}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dispute_appeals", filter: `dispute_id=eq.${id}` },
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

  async function handleAppealReply(event, appealId) {
    event.preventDefault();
    const body = String(appealReplies[appealId] || "").trim();
    if (body.length < 3 || busy) return;
    const completed = await runAction("appeal-reply-" + appealId, async () => {
      const { error } = await supabase.rpc("respond_to_dispute_appeal", {
        p_appeal_id: appealId, p_body: body,
      });
      if (error) throw error;
    }, "Odpowiedź na odwołanie została zapisana i udostępniona obu stronom.");
    if (completed) setAppealReplies(current => ({ ...current, [appealId]: "" }));
  }

  async function handleAdminChatMessage(event) {
    event.preventDefault();
    const caseId = id;
    const content = String(adminChatDrafts[caseId] || "").trim();
    if (!content || busy || adminChatInFlight.current) return;
    if (containsCredentialLikeText(content)) {
      setPageMessage("Nie wysyłaj haseł, kodów uwierzytelnienia ani kluczy API na czacie.");
      return;
    }
    const scope = [user.id, caseId, content].join(":");
    if (adminChatRequest.current?.scope !== scope) {
      adminChatRequest.current = { scope, id: window.crypto.randomUUID() };
    }
    const messageId = adminChatRequest.current.id;
    adminChatInFlight.current = true;
    try {
      const completed = await runAction("admin-chat", async () => {
        const { data, error } = await supabase.rpc("admin_send_dispute_chat_message", {
          p_dispute_id: caseId, p_content: content, p_message_id: messageId,
        });
        if (error) throw error;
        if (data !== messageId) throw new Error("Nie potwierdzono wysłania tej wiadomości. Ponów sprawdzenie.");
      }, "Wiadomość administratora została wysłana na czat zlecenia.");
      if (completed) {
        setAdminChatDrafts(current => ({ ...current, [caseId]: current[caseId]?.trim() === content ? "" : current[caseId] }));
        if (adminChatRequest.current?.id === messageId) adminChatRequest.current = null;
      }
    } finally { adminChatInFlight.current = false; }
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
    if (currentAppeals.length && (!appealsAnswered || appealDeadlineOpen)) {
      setDecisionMessage("Odpowiedz na każde odwołanie i zachowaj pierwotny termin odwołań obu stron przed decyzją ostateczną.");
      return;
    }
    if (currentAppeals.length && !window.confirm("Wydajesz ostateczną decyzję po rozpatrzeniu odwołań. Nie będzie kolejnego wewnętrznego terminu 7 dni. Rozliczenie finansowe trafi do wykonania w Stripe. Czy potwierdzasz analizę odpowiedzi i wybrany wynik?")) return;

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
          : currentAppeals.length
          ? "Decyzja została zapisana jako ostateczna w procedurze IdeaHire i przekazana obu stronom."
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
          <InlineRouteLoader
            className="disputes-route-loader"
            rows={5}
          />
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
  const currentAppeals = appeals.filter(item => item.decision_id === currentDecision?.id && !item.resolved_at);
  const appealsAnswered = currentAppeals.every(item => statements.some(statement => statement.appeal_id === item.id
    && ["owner", "admin"].includes(statement.author_role) && statement.visibility === "parties"));
  const appealDeadlineOpen = Boolean(dispute.appeal_deadline_at && new Date(dispute.appeal_deadline_at).getTime() >= caseNow);
  const assignedAdmin = isStaff && ["owner", "admin"].includes(staffRole) && dispute.assigned_admin_id === user.id;
  const alreadyAppealed = appeals.some((item) => item.appealed_by === user.id);
  const appealIsOpen = Boolean(
    !isStaff &&
      isParticipant &&
      ["decision_issued", "appealed", "under_review"].includes(dispute.status) &&
      currentDecision && !currentDecision.is_final &&
      dispute.appeal_deadline_at &&
      appealDeadlineOpen &&
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
             {isStaff ? "Panel administratora" : "Centrum sporów"}
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
          {assignedAdmin && <a className="dispute-secondary-button" href="#admin-dispute-chat" onClick={() => {
            const chat = document.getElementById("admin-dispute-chat");
            if (chat) chat.open = true;
          }}>Otwórz czat zlecenia jako administrator</a>}
        </header>

        {pageMessage && (
          <p className="dispute-page-message" role="status">{pageMessage}</p>
        )}

        <AdminDisclosure disabled={!isStaff} summary="Zasady dostępu do rozmowy"><section
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
              wyłącznie administrator przypisany do tego sporu. Każde otwarcie
              jest rejestrowane. Administrator może dopisać na czacie wiadomość
              oznaczoną jako administracyjna; nie zmienia wcześniejszych wiadomości ani ustaleń.
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
        </section></AdminDisclosure>

        <div className="dispute-detail-grid">
          <div className="dispute-detail-main"><AdminCaseTools disabled={!isStaff}>
            {currentDecision && (
              <section className="dispute-panel dispute-decision-panel ih-admin-case-summary">
                <span className="dispute-eyebrow">{currentDecision.is_final ? "Decyzja ostateczna po odwołaniu" : "Aktualna decyzja"}</span>
                <h2>{getOptionLabel(ADMIN_DECISION_OPTIONS, currentDecision.outcome)}</h2>
                {currentDecision.amount != null && (
                  <strong className="dispute-decision-amount">
                    {isStaff && <span className="ih-admin-decision-amount-label">Kwota decyzji za pracę</span>}
                    {formatDisputeMoney(
                      currentDecision.amount,
                      dispute.price_currency_snapshot
                    )}
                  </strong>
                )}
                <AdminDisclosure disabled={!isStaff} summary="Uzasadnienie i zasady rozliczenia">
                {["full_refund", "partial_refund"].includes(currentDecision.outcome) && <p>Kwota decyzji dotyczy wynagrodzenia. Zwrot klientowi obejmuje również całą prowizję IdeaHire przy pełnym zwrocie lub jej proporcjonalną część przy zwrocie częściowym.</p>}
                <p>{currentDecision.rationale}</p>
                </AdminDisclosure>
                <div className="dispute-decision-meta">
                  <span>Wersja {currentDecision.version}</span>
                  <span>Wydano: {formatDisputeDate(currentDecision.issued_at)}</span>
                  {!["full_refund", "partial_refund", "release_payment"].includes(currentDecision.outcome) && (
                    <span>Operacja płatnicza: nie jest wymagana</span>
                  )}
                </div>
                {isStaff && ["owner", "admin"].includes(staffRole) ? (
                  <DisputePaymentPanel client={supabase} decision={currentDecision} userId={user.id}
                    conversationId={dispute.conversation_id} onSettled={() => loadCase(false)} />
                ) : (
                  <DisputeSettlementStatus client={supabase} decision={currentDecision} dispute={dispute}
                    appeals={appeals} userId={user.id} />
                )}
                {currentDecision.is_final && <AdminDisclosure disabled={!isStaff} summary="Co oznacza decyzja ostateczna"><p>Decyzja jest ostateczna w wewnętrznej procedurze IdeaHire. Nie ogranicza praw ustawowych, możliwości dochodzenia roszczeń ani dostępu do sądu.</p></AdminDisclosure>}
                {dispute.appeal_deadline_at && dispute.status === "decision_issued" && !currentDecision.is_final && (
                  <p className="dispute-deadline-note">
                    Termin odwołania: {formatDisputeDate(dispute.appeal_deadline_at)}
                  </p>
                )}
              </section>
            )}

            {appeals.length > 0 && <section className="dispute-panel ih-admin-dispute-appeals">
              <div className="dispute-panel-heading"><h2>Odwołania i odpowiedzi</h2><span className="dispute-count-badge">{appeals.length}</span></div>
              <p>Odwołanie wstrzymuje rozliczenie. Administrator odpowiada na zgłoszone argumenty, a następnie wydaje decyzję ostateczną po zakończeniu pierwotnego terminu odwołań.</p>
              {appeals.map(appeal => {
                const open = currentAppeals.some(item => item.id === appeal.id)
                  && ["appealed", "under_review"].includes(dispute.status) && !currentDecision?.is_final;
                const replies = statements.filter(item => item.appeal_id === appeal.id && item.visibility === "parties");
                const canReply = open && (assignedAdmin || isParticipant && !isStaff);
                return <article className="dispute-panel" key={appeal.id}>
                  <span className="dispute-eyebrow">{open ? "Odwołanie w analizie" : "Odwołanie rozpatrzone we wcześniejszej decyzji"}</span>
                  <h3>{getDisputeProfileName(profiles[appeal.appealed_by], "Strona sporu")}</h3>
                  <small>{formatDisputeDate(appeal.created_at)}</small>
                  <p>{appeal.reason}</p>
                  {replies.map(reply => <div className="dispute-timeline-item" key={reply.id}>
                    <strong>{["admin", "owner"].includes(reply.author_role) ? "Administrator IdeaHire" : getDisputeProfileName(profiles[reply.author_user_id], "Strona sporu")}</strong>
                    <small> · {formatDisputeDate(reply.created_at)}</small><p>{reply.body}</p>
                  </div>)}
                  {canReply && <form className="dispute-inline-form" onSubmit={event => handleAppealReply(event, appeal.id)}>
                    <label className="dispute-field"><span>Odpowiedź na odwołanie — widoczna dla obu stron</span>
                      <AutoTextarea value={appealReplies[appeal.id] || ""} onChange={event => setAppealReplies(current => ({ ...current, [appeal.id]: event.target.value }))}
                        minLength={3} maxLength={10000} rows={4} disabled={Boolean(busy)} required />
                    </label>
                    <button className="dispute-secondary-button" type="submit" disabled={Boolean(busy) || String(appealReplies[appeal.id] || "").trim().length < 3}>
                      {busy === "appeal-reply-" + appeal.id ? "Zapisywanie…" : "Dodaj odpowiedź na odwołanie"}
                    </button>
                  </form>}
                  {appeal.final_decision_id && <p>Odwołanie zostało rozstrzygnięte decyzją ostateczną w procedurze IdeaHire.</p>}
                </article>;
              })}
            </section>}

            <section className="dispute-panel ih-admin-correspondence">
              <div className="dispute-panel-heading">
                <div>
                  <span className="dispute-eyebrow">Historia sprawy</span>
                  <h2>Wyjaśnienia i komunikaty</h2>
                </div>
                <span className="dispute-count-badge">{statements.length}</span>
              </div>

              <AdminHistory disabled={!isStaff} resetKey={id} label="Strony korespondencji"><div className="dispute-timeline">
                {(isStaff?[...statements].reverse():statements).map((item) => {
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
              </div></AdminHistory>

              {canAddEvidence && (
                <form className="dispute-inline-form" onSubmit={handleAddStatement}>
                  <label htmlFor="dispute-statement">Dodaj wyjaśnienie</label>
                  <AutoTextarea
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
                      Materiały służą analizie tej sprawy. Przypisany administrator może wysłać na czat oznaczoną wiadomość administracyjną. Ustalenia i wcześniejsze wiadomości pozostają do odczytu.
                    </p>
                  </div>
                  <span className="admin-readonly-badge">{assignedAdmin ? "Obsługa przypisanej sprawy" : "Wymaga przypisania"}</span>
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

                      <details className="admin-context-section" id="admin-dispute-chat" open>
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
                                const isAdminMessage = message.sender_role === "admin";
                                const authorName = isAdminMessage ? "Administrator IdeaHire" : isClientMessage ? clientName : contractorName;

                                return (
                                  <article
                                    className={`admin-chat-message ${
                                      isClientMessage ? "is-client" : "is-contractor"
                                    }`}
                                    key={message.id}
                                  >
                                    <div className="admin-chat-message-meta">
                                      <strong>{authorName}</strong>
                                      <span>{isAdminMessage ? "Administracja" : isClientMessage ? "Zleceniodawca" : "Wykonawca"}</span>
                                      <time>{formatDisputeDate(message.created_at)}</time>
                                    </div>
                                    <p>{message.content}</p>
                                  </article>
                                );
                              })}
                            </div>
                          )}
                          {assignedAdmin && !["closed", "cancelled"].includes(dispute.status) && <form className="dispute-inline-form" onSubmit={handleAdminChatMessage}>
                            <label className="dispute-field"><span>Napisz na czacie jako Administrator IdeaHire</span>
                              <AutoTextarea value={adminChatDrafts[id] || ""} onChange={event => setAdminChatDrafts(current => ({ ...current, [id]: event.target.value }))}
                                placeholder="Wiadomość trafi bezpośrednio do rozmowy zleceniodawcy i wykonawcy…" rows={4} maxLength={10000} disabled={Boolean(busy)} required />
                            </label>
                            <p>Obie strony zobaczą tę wiadomość na czacie z oznaczeniem administratora. Wysłanie jest rejestrowane.</p>
                            <button className="dispute-primary-button" type="submit" disabled={Boolean(busy) || !String(adminChatDrafts[id] || "").trim()}>
                              {busy === "admin-chat" ? "Wysyłanie…" : "Wyślij na czat zlecenia"}
                            </button>
                          </form>}
                        </div>
                      </details>
                    </div>
                  </>
                )}
              </section>
            )}

            <section className="dispute-panel ih-admin-evidence">
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
                      <span className="dispute-evidence-icon" aria-hidden="true"><MarketIcon kind="files" /></span>
                      <div className="ih18-evidence-copy">
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
                      <div className="ih18-evidence-copy">
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
                  <AutoTextarea
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
                  <AutoTextarea
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

                {assignedAdmin && !currentDecision?.is_final && <form className="admin-dispute-form is-decision" onSubmit={handleDecision}>
                  <h3>{currentAppeals.length ? "Wydaj decyzję ostateczną po odwołaniu" : "Wydaj decyzję"}</h3>
                  {currentAppeals.length > 0 && <p>Rozstrzygnij wszystkie odwołania w jednej decyzji. {appealDeadlineOpen ? "Pierwotny termin odwołań nadal trwa do " + formatDisputeDate(dispute.appeal_deadline_at) + "." : "Pierwotny termin odwołań upłynął."} {!appealsAnswered && "Dodaj jawną odpowiedź administratora na każde odwołanie w sekcji powyżej."} Decyzja ostateczna nie rozpoczyna kolejnych 7 dni.</p>}
                  <label>
                    Wynik sprawy
                    <FormSelect
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
                    </FormSelect>
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
                    <AutoTextarea
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
                            <FormSelect
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
                            </FormSelect>
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
                            <FormSelect
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
                            </FormSelect>
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
                          <AutoTextarea
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
                            <AutoTextarea
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
                    zaznaczeniu odpowiedniej opcji. Rozliczenie finansowe następuje
                    przez Stripe po zakończeniu procedury odwoławczej. Zapis decyzji
                    nie oznacza jeszcze wykonania zwrotu ani transferu.
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
                    disabled={Boolean(busy) || currentAppeals.length > 0 && (!appealsAnswered || appealDeadlineOpen)}
                  >
                    {busy === "decision"
                      ? "Zapisywanie decyzji..."
                      : decisionForm.applyRestriction
                        ? "Wydaj decyzję i zawieś konto"
                        : currentAppeals.length ? "Wydaj decyzję ostateczną" : "Wydaj decyzję"}
                  </button>
                </form>}

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
          </AdminCaseTools></div>

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

    const { data, error } = await adminRead(supabase
      .from("jobs")
      .select("id, user_id, title, description, category, budget, created_at")
      .order("created_at", { ascending: false })
      .limit(300));

    if (error) throw error;

    const rows = data || [];
    const ownerIds = [...new Set(rows.map((job) => job.user_id).filter(Boolean))];
    let profileMap = {};

    if (ownerIds.length > 0) {
      const { data: profileRows, error: profileError } = await adminRead(supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", ownerIds));

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

  const [selectedRecordId,selectRecord] = useAdminSelection(visibleJobs,"job");
  const recordItems = visibleJobs.map(job=>({id:job.id,number:getJobCategoryLabel(job.category),title:job.title,subtitle:getDisputeProfileName(profiles[job.user_id],"Użytkownik"),meta:formatDisputeMoney(job.budget,"PLN")}));

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027">
        <AdminPageHeading title="Ogłoszenia" meta="Tylko podgląd" description="Administracja może sprawdzać treść i cenę zleceń, ale nie może ich tworzyć, edytować ani usuwać."/>

        <section className="admin-catalog-toolbar" aria-label="Wyszukiwanie zleceń">
          <label className="admin-search-field">
            <span>Szukaj</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj ogłoszenia"
            />
          </label>

          <label className="admin-filter-field">
            <span>Kategoria</span>
            <FormSelect
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Wszystkie">Wszystkie</option>
              {JOB_CATEGORIES.map((item) => (
                <option value={item} key={item}>{getJobCategoryLabel(item)}</option>
              ))}
            </FormSelect>
          </label>
        </section>

        {loading ? (
          <InlineRouteLoader
            className="admin-route-loader"
            rows={5}
          />
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleJobs.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak pasujących zleceń</h2>
            <p>Zmień wyszukiwanie albo wybierz inną kategorię.</p>
          </div>
        ) : (
          <AdminQueue items={recordItems} selectedId={selectedRecordId} onSelect={selectRecord} label="Ogłoszenia">
            {visibleJobs.filter(item=>item.id===selectedRecordId).map((job) => {
              const owner = profiles[job.user_id];
              const ownerName = getDisputeProfileName(owner, "Użytkownik");

              return (
                <article className="admin-job-card" key={job.id}>
                  <div className="admin-job-card-topline">
                    <span className="section-label">
                      {job.category ? getJobCategoryLabel(job.category) : "Bez kategorii"}
                    </span>
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
                    to={`/admin/moderation/job/${encodeURIComponent(job.id)}`}
                  >
                    Przejdź do moderacji konta
                  </Link>
                </article>
              );
            })}
          </AdminQueue>
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

    const { data, error } = await adminRead(supabase
      .from("dispute_message_evidence")
      .select(
        "id, dispute_id, message_id, message_sender_id, message_content_snapshot, message_created_at_snapshot, submitted_by, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(300));

    if (error) throw error;

    const rows = data || [];
    const disputeIds = [...new Set(rows.map((item) => item.dispute_id).filter(Boolean))];
    let disputeMap = {};

    if (disputeIds.length > 0) {
      const { data: disputeRows, error: disputeError } = await adminRead(supabase
        .from("disputes")
        .select("id, case_number, job_title_snapshot, status, client_id, contractor_id")
        .in("id", disputeIds));

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
      const { data: profileRows, error: profileError } = await adminRead(supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueProfileIds));

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

  const [selectedRecordId,selectRecord] = useAdminSelection(visibleItems,"evidence");
  const recordItems = visibleItems.map(item=>({id:item.id,number:disputesById[item.dispute_id]?formatDisputeNumber(disputesById[item.dispute_id].case_number):"Sprawa",title:disputesById[item.dispute_id]?.job_title_snapshot||"Wiadomość dowodowa",subtitle:getDisputeProfileName(profiles[item.message_sender_id],"Użytkownik"),meta:formatDisputeDate(item.message_created_at_snapshot)}));

  return (
    <div className="account-page admin-page">
      <AdminNavbar />

      <main className="admin-shell admin-readonly-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027">
        <AdminPageHeading title="Wiadomości dowodowe" meta="Tylko podgląd" description="Widoczne są wyłącznie wiadomości, które uczestnik świadomie dołączył jako dowód. Administracja nie otrzymuje dostępu do całych rozmów."/>

        <section className="admin-catalog-toolbar is-single" aria-label="Wyszukiwanie wiadomości">
          <label className="admin-search-field">
            <span>Szukaj wiadomości</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Szukaj wiadomości"
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
          <InlineRouteLoader
            className="admin-route-loader"
            rows={5}
          />
        ) : message ? (
          <div className="dispute-state-card is-error">{message}</div>
        ) : visibleItems.length === 0 ? (
          <div className="dispute-state-card">
            <h2>Brak wiadomości dowodowych</h2>
            <p>Użytkownicy nie dołączyli jeszcze wiadomości do spraw albo nic nie pasuje do wyszukiwania.</p>
          </div>
        ) : (
          <AdminQueue items={recordItems} selectedId={selectedRecordId} onSelect={selectRecord} label="Dowody wiadomości">
            {visibleItems.filter(item=>item.id===selectedRecordId).map((item) => {
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
          </AdminQueue>
        )}
      </main>
    </div>
  );
}

function AdminModeration() {
  const adminDialog = useAdminDialog();
  const adminBusy = useRef(false);
  const [refreshWarning,setRefreshWarning] = useState("");


  const { user } = useAuth();
  const { staffRole } = useStaffRole(user?.id);
  const location = useLocation();
  const { moderationJobId } = useParams();
  const moderationParams = new URLSearchParams(location.search);
  const [adminTab,setAdminTab] = useState(() => location.pathname.includes("/job/") || moderationParams.get("user") ? "decision" : "reports");
  const requestedUserId = moderationParams.get("user");
  const requestedJobId = moderationJobId || moderationParams.get("job");
  useEffect(() => { if (moderationJobId || new URLSearchParams(location.search).get("user")) setAdminTab("decision"); }, [location.pathname, location.search, moderationJobId]);
  const routedModerationSubject =
    location.state?.moderationSubject?.id === requestedUserId
      ? location.state.moderationSubject
      : null;
  const routedSourceJob =
    location.state?.sourceJob?.id === requestedJobId
      ? location.state.sourceJob
      : null;
  const moderationWorkbenchRef = useRef(null);

  const [cases, setCases] = useState([]);
  const [notices, setNotices] = useState({});
  const [appeals, setAppeals] = useState([]);
  const [contentReports, setContentReports] = useState([]);
  const [contentReportAppeals, setContentReportAppeals] = useState([]);
  const [activeContentReport, setActiveContentReport] = useState(null);
  const [privateReportEvidence, setPrivateReportEvidence] = useState({});
  const [contentAppealNotes, setContentAppealNotes] = useState({});
  const [profiles, setProfiles] = useState(() =>
    routedModerationSubject
      ? { [routedModerationSubject.id]: routedModerationSubject }
      : {}
  );
  const [sourceJob, setSourceJob] = useState(routedSourceJob);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(requestedUserId || "");
  const [selectedSubjectLoading, setSelectedSubjectLoading] = useState(false);
  const [selectedSubjectError, setSelectedSubjectError] = useState("");
  const [jobModerationLoading, setJobModerationLoading] = useState(
    Boolean(moderationJobId)
  );
  const [jobModerationError, setJobModerationError] = useState("");
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
    reasonCode: "other_terms_breach",
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
      const { error: refreshError } = await adminRpc(supabase,
        "get_my_ideahire_moderation_status"
      );
      if (refreshError) throw refreshError;

      const [
        casesResult,
        noticesResult,
        appealsResult,
        contentReportsResult,
        contentReportAppealsResult,
      ] = await Promise.all([
        adminRead(supabase
          .from("ideahire_moderation_cases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300)),
        adminRead(supabase
          .from("ideahire_moderation_notices")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300)),
        adminRead(supabase
          .from("ideahire_moderation_appeals")
          .select("*")
          .order("submitted_at", { ascending: false })
          .limit(300)),
        adminRead(supabase
          .from("ideahire_content_reports")
          .select("*")
          .order("submitted_at", { ascending: true })
          .limit(300)),
        adminRead(supabase
          .from("ideahire_content_report_appeals")
          .select("*")
          .order("submitted_at", { ascending: true })
          .limit(300)),
      ]);

      if (casesResult.error) throw casesResult.error;
      if (noticesResult.error) throw noticesResult.error;
      if (appealsResult.error) throw appealsResult.error;
      if (contentReportsResult.error) throw contentReportsResult.error;
      if (contentReportAppealsResult.error) throw contentReportAppealsResult.error;

      const caseRows = casesResult.data || [];
      const noticeRows = noticesResult.data || [];
      const appealRows = appealsResult.data || [];
      const contentReportRows = contentReportsResult.data || [];
      const contentReportAppealRows = contentReportAppealsResult.data || [];
      const profileIds = [...new Set([
        ...caseRows.map((item) => item.target_user_id),
        ...contentReportRows.map((item) => item.reported_user_id),
        ...(selectedUserId ? [selectedUserId] : []),
      ].filter(Boolean))];

      let profileMap = {};
      if (profileIds.length > 0) {
        const { data: profileRows, error: profileError } = await adminRead(supabase
          .from("profiles")
          .select("id, name, avatar_url, created_at")
          .in("id", profileIds));

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
      setContentReports(contentReportRows);
      setContentReportAppeals(contentReportAppealRows);
      setProfiles((current) => ({ ...current, ...profileMap }));
    } catch (error) {
      (showLoading ? setMessage : setRefreshWarning)(cleanSupabaseError(
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideahire_content_reports" },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideahire_content_report_appeals" },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!moderationJobId) return;

    let mounted = true;

    async function openModerationFromJob() {
      setJobModerationLoading(true);
      setJobModerationError("");
      setSelectedSubjectError("");

      try {
        const { data, error } = await adminRpc(supabase,
          "admin_open_ideahire_job_moderation",
          {
            p_job_id: moderationJobId,
          }
        );

        if (error) throw error;
        if (!mounted) return;

        const payload = typeof data === "string"
          ? JSON.parse(data)
          : data;

        if (!payload?.job?.id || !payload?.subject?.id) {
          throw new Error(
            "Supabase nie zwrócił kompletnego zlecenia i konta autora."
          );
        }

        const subject = {
          id: payload.subject.id,
          name: payload.subject.name || "Użytkownik IdeaHire",
          avatar_url: payload.subject.avatar_url || null,
          created_at: payload.subject.created_at || null,
          profile_exists: payload.subject.profile_exists !== false,
          lifecycle_status: payload.subject.lifecycle_status || "active",
          age_access_status: payload.subject.age_access_status || "unknown",
          active_moderation_restriction:
            payload.subject.active_moderation_restriction === true,
        };

        setSelectedUserId(subject.id);
        setProfiles((current) => ({
          ...current,
          [subject.id]: subject,
        }));
        setSourceJob(payload.job);
      } catch (error) {
        if (!mounted) return;

        setJobModerationError(
          cleanSupabaseError(
            error,
            "Nie udało się otworzyć konta autora tego zlecenia."
          )
        );
      } finally {
        if (mounted) {
          setJobModerationLoading(false);
        }
      }
    }

    openModerationFromJob();

    return () => {
      mounted = false;
    };
  }, [moderationJobId]);

  useEffect(() => {
    if (!requestedUserId || moderationJobId) return;

    setSelectedUserId(requestedUserId);
    setSelectedSubjectError("");

    const navigationSubject =
      location.state?.moderationSubject?.id === requestedUserId
        ? location.state.moderationSubject
        : null;

    if (navigationSubject) {
      setProfiles((current) => ({
        ...current,
        [requestedUserId]: navigationSubject,
      }));
      setSelectedSubjectLoading(false);
      return;
    }

    setSelectedSubjectLoading(true);

    let mounted = true;

    async function loadRequestedModerationSubject() {
      try {
        const { data, error } = await adminRpc(supabase,
          "admin_get_ideahire_moderation_subject",
          {
            p_user_id: requestedUserId,
          }
        );

        if (error) throw error;
        if (!mounted) return;

        if (!data?.account_exists) {
          setSelectedSubjectError(
            "Konto powiązane ze zleceniem nie istnieje już w systemie Auth."
          );
          return;
        }

        setProfiles((current) => ({
          ...current,
          [requestedUserId]: {
            id: requestedUserId,
            name: data.name || "Użytkownik IdeaHire",
            avatar_url: data.avatar_url || null,
            created_at: data.created_at || null,
            profile_exists: data.profile_exists !== false,
            lifecycle_status: data.lifecycle_status || "active",
            age_access_status: data.age_access_status || "unknown",
            active_moderation_restriction:
              data.active_moderation_restriction === true,
          },
        }));
      } catch (error) {
        if (!mounted) return;

        setSelectedSubjectError(
          cleanSupabaseError(
            error,
            "Nie udało się otworzyć konta wskazanego w zleceniu."
          )
        );
      } finally {
        if (mounted) {
          setSelectedSubjectLoading(false);
        }
      }
    }

    loadRequestedModerationSubject();

    return () => {
      mounted = false;
    };
  }, [requestedUserId, moderationJobId, location.key]);

  useEffect(() => {
    if (moderationJobId) return;

    if (!requestedJobId || !requestedUserId) {
      setSourceJob(null);
      return;
    }

    adminRead(supabase
      .from("jobs")
      .select("id, user_id, title, description, category, budget, created_at")
      .eq("id", requestedJobId)
      .eq("user_id", requestedUserId)
      .maybeSingle())
      .then(({ data, error }) => {
        if (error) {
          setMessage(cleanSupabaseError(
            error,
            "Nie udało się dołączyć zlecenia jako źródła sprawy."
          ));
          return;
        }
        setSourceJob(data || null);
      }).catch(error => setMessage(cleanSupabaseError(error, "Nie udało się pobrać źródłowego ogłoszenia.")));
  }, [moderationJobId, requestedJobId, requestedUserId]);

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

      const { data, error } = await adminRead(request);
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

  async function handleOpenContentReport(report) {
    if (busy) return;
    if (adminBusy.current) return; adminBusy.current = true; setBusy(`report:${report.id}`);
    setMessage("");

    try {
      if (report.status === "submitted") {
        const { error } = await adminRpc(supabase,
          "admin_review_ideahire_content_report",
          {
            p_report_id: report.id,
            p_action: "start_review",
            p_decision_summary: null,
            p_legal_assessment: null,
          }
        );
        if (error) throw error;
      }

      if (isPrivateContentReport(report)) {
        const { error: accessError } =
          await adminRpc(supabase,
            "admin_record_ideahire_private_report_access",
            { p_report_id: report.id }
          );
        if (accessError) throw accessError;
      }

      const reasonMap = {
        copyright: "illegal_content",
        privacy_or_image_rights: "illegal_content",
        impersonation: "impersonation",
        harassment_or_threats: "harassment_or_threats",
        fraud_or_scam: "fraud_or_scam",
        illegal_goods_or_services: "illegal_content",
        other_terms_breach: "other_terms_breach",
        other_illegal_content: "illegal_content",
      };

      setAdminTab("decision");
      setActiveContentReport({ ...report, status: "in_review" });
      setSelectedUserId(report.reported_user_id || "");
      setForm((current) => ({
        ...current,
        reasonCode: reasonMap[report.reason_code] || "illegal_content",
        termsReference: "Regulamin IdeaHire § 21 — nielegalne treści i moderacja",
        internalNote: `Zgłoszenie ${report.report_number}: ${report.explanation}`.slice(0, 5000),
      }));
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się rozpocząć analizy zgłoszenia."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleOpenPrivateReportEvidence(report) {
    if (busy || !isPrivateContentReport(report)) return;

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`report-evidence:${report.id}`);
    setMessage("");

    try {
      if (report.status === "submitted") {
        const { error: reviewError } = await adminRpc(supabase,
          "admin_review_ideahire_content_report",
          {
            p_report_id: report.id,
            p_action: "start_review",
            p_decision_summary: null,
            p_legal_assessment: null,
          }
        );
        if (reviewError) throw reviewError;
      }

      const { data: accessData, error: accessError } =
        await adminRpc(supabase,
          "admin_record_ideahire_private_report_access",
          { p_report_id: report.id }
        );
      if (accessError) throw accessError;

      const snapshot =
        accessData?.content_snapshot ||
        report.content_snapshot ||
        {};
      const evidenceItems = Array.isArray(snapshot.items)
        ? snapshot.items
        : snapshot.storage_path || snapshot.external_url
        ? [snapshot]
        : [];
      const storedItems = evidenceItems.filter(
        (item) => item?.storage_path
      );
      let signedUrlMap = {};

      if (storedItems.length) {
        const { data: signedRows, error: signedError } =
          await supabase.storage
            .from("ideahire-private-work")
            .createSignedUrls(
              storedItems.map(
                (item) => item.storage_path
              ),
              300
            );
        if (signedError) {
          throw signedError ||
            new Error(
              "Nie udało się utworzyć czasowego podglądu."
            );
        }
        signedUrlMap = Object.fromEntries(
          storedItems.map((item, index) => [
            item.storage_path,
            signedRows?.[index]?.signedUrl || "",
          ])
        );
      }

      setPrivateReportEvidence((current) => ({
        ...current,
        [report.id]: {
          snapshot,
          items: evidenceItems,
          signedUrls: signedUrlMap,
        },
      }));
      setMessage(
        "Prywatny dowód otwarto na 5 minut. Dostęp został zapisany w audycie."
      );

      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(
        cleanSupabaseError(
          error,
          "Nie udało się otworzyć prywatnego dowodu."
        )
      );
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleRemovePrivateContent(report) {
    if (busy || !isPrivateContentReport(report)) return;

    const decisionSummary = await adminDialog.prompt(
      "Podaj uzasadnienie usunięcia treści dla użytkownika (minimum 50 znaków). Konto nie zostanie zawieszone:"
    );
    if (!decisionSummary) return;
    if (decisionSummary.trim().length < 50) {
      setMessage(
        "Uzasadnienie decyzji musi mieć co najmniej 50 znaków."
      );
      return;
    }

    const legalAssessment = await adminDialog.prompt(
      "Opcjonalnie wpisz podstawę prawną lub ocenę zgodności."
    );
    if (!await adminDialog.confirm(
      "Treść zostanie ukryta po ręcznej analizie, ale konto nie zostanie zawieszone. Potwierdzasz proporcjonalność tej decyzji?"
    )) return;

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`report-remove:${report.id}`);
    setMessage("");
    try {
      if (report.status === "submitted") {
        const { error: reviewError } = await adminRpc(supabase,
          "admin_review_ideahire_content_report",
          {
            p_report_id: report.id,
            p_action: "start_review",
            p_decision_summary: null,
            p_legal_assessment: null,
          }
        );
        if (reviewError) throw reviewError;
      }

      const { error } = await adminRpc(supabase,
        "admin_remove_ideahire_reported_private_content",
        {
          p_report_id: report.id,
          p_decision_summary:
            decisionSummary.trim(),
          p_legal_assessment:
            legalAssessment?.trim() || null,
        }
      );
      if (error) throw error;

      setActiveContentReport(null);
      setMessage(
        "Treść ukryto bez zawieszania konta. Decyzja, uzasadnienie i prawo do odwołania zostały zachowane."
      );
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(
        cleanSupabaseError(
          error,
          "Nie udało się ukryć treści."
        )
      );
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleResolveContentReportNoAction(report) {
    if (busy) return;
    const decisionSummary = await adminDialog.prompt(
      "Podaj jasne uzasadnienie decyzji dla zgłaszającego (minimum 50 znaków):"
    );
    if (!decisionSummary) return;
    if (decisionSummary.trim().length < 50) {
      setMessage("Uzasadnienie decyzji musi mieć co najmniej 50 znaków.");
      return;
    }

    const legalAssessment = await adminDialog.prompt(
      "Opcjonalnie wpisz podstawę prawną lub wynik oceny prawnej. Możesz pozostawić puste."
    );

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`report-resolve:${report.id}`);
    setMessage("");
    try {
      const { error } = await adminRpc(supabase,
        "admin_review_ideahire_content_report",
        {
          p_report_id: report.id,
          p_action: "resolve_no_action",
          p_decision_summary: decisionSummary.trim(),
          p_legal_assessment: legalAssessment?.trim() || null,
        }
      );
      if (error) throw error;
      setActiveContentReport(null);
      setMessage("Zgłoszenie zakończono. Zgłaszający zobaczy uzasadnienie i możliwość ponownej analizy.");
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zakończyć zgłoszenia."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleResolveContentReportAppeal(appeal, resolution) {
    if (busy) return;
    const note = String(contentAppealNotes[appeal.id] || "").trim();
    if (note.length < 30) {
      setMessage("Uzasadnienie wyniku odwołania musi mieć co najmniej 30 znaków.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`content-appeal:${appeal.id}`);
    setMessage("");
    try {
      const { error } = await adminRpc(supabase,
        "admin_resolve_ideahire_content_report_appeal",
        {
          p_appeal_id: appeal.id,
          p_resolution: resolution,
          p_reason: note,
        }
      );
      if (error) throw error;
      setContentAppealNotes((current) => ({ ...current, [appeal.id]: "" }));
      setMessage(
        resolution === "accepted"
          ? "Odwołanie uwzględniono, a zgłoszenie wróciło do ponownej analizy."
          : "Odwołanie oddalono wraz z uzasadnieniem."
      );
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się rozpoznać odwołania do zgłoszenia."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
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

    if (!await adminDialog.confirm(
      "Czy potwierdzasz, że przeanalizowano fakty, proporcjonalność decyzji i możliwość zastosowania łagodniejszego środka?"
    )) return;

    if (adminBusy.current) return; adminBusy.current = true; setBusy("impose");
    setMessage("");

    try {
      const rpcName = activeContentReport
        ? "admin_impose_ideahire_report_restriction"
        : "admin_impose_ideahire_account_restriction";
      const rpcPayload = {
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
      };

      if (activeContentReport) {
        delete rpcPayload.p_target_user_id;
        delete rpcPayload.p_source_job_id;
        rpcPayload.p_report_id = activeContentReport.id;
      }

      const { error } = await adminRpc(supabase, rpcName, rpcPayload);

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
      setActiveContentReport(null);
      setMessage("Decyzja została zapisana, a użytkownik otrzymał zawiadomienie i dostęp do odwołania.");
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się nałożyć ograniczenia."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleLiftRestriction(caseId) {
    const reason = await adminDialog.prompt(
      "Podaj uzasadnienie zdjęcia ograniczenia — minimum 30 znaków:"
    );

    if (!reason) return;
    if (reason.trim().length < 30) {
      setMessage("Uzasadnienie musi mieć co najmniej 30 znaków.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`lift:${caseId}`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "admin_lift_ideahire_account_restriction",
        { p_case_id: caseId, p_reason: reason.trim() }
      );

      if (error) throw error;
      setMessage("Ograniczenie zostało zdjęte i użytkownik zobaczy uzasadnienie.");
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zdjąć ograniczenia."));
    } finally {
      adminBusy.current = false; setBusy("");
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

    if (adminBusy.current) return; adminBusy.current = true; setBusy("update:" + restrictionEditor.caseId);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
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
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(
        error,
        "Nie udało się zmienić czasu zawieszenia."
      ));
    } finally {
      adminBusy.current = false; setBusy("");
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

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`appeal:${appeal.id}`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
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
      void loadModeration(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się rozpoznać odwołania."));
    } finally {
      adminBusy.current = false; setBusy("");
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
  const openContentReports = contentReports.filter((item) =>
    ["submitted", "in_review"].includes(item.status)
  );
  const openContentReportAppeals = contentReportAppeals.filter(
    (item) => item.status === "submitted"
  );

  useEffect(() => {
    if (
      (!requestedUserId && !moderationJobId)
      || selectedSubjectLoading
      || jobModerationLoading
      || (!selectedProfile && !selectedSubjectError)
    ) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      moderationWorkbenchRef.current?.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [
    requestedUserId,
    moderationJobId,
    selectedSubjectLoading,
    jobModerationLoading,
    selectedSubjectError,
    selectedProfile?.id,
  ]);

  return (
    <div className="account-page admin-page admin-moderation-page">
      <AdminNavbar />{adminDialog.element}

      <main className="admin-shell moderation-admin-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027"><AdminRefreshNotice warning={refreshWarning} onRefresh={() => { setRefreshWarning(""); loadModeration(false).catch(() => setRefreshWarning("Nie udało się odświeżyć danych. Spróbuj ponownie.")); }} />
        <AdminPageHeading title="Moderacja" meta={staffRole === "owner" ? "Pełne uprawnienia" : "Ograniczenia do 30 dni"} description="Każda decyzja wymaga faktów, podstawy regulaminowej, określonego czasu oraz ręcznej oceny proporcjonalności."/>
        <AdminTabs value={adminTab} onChange={setAdminTab} items={[["reports","Zgłoszenia",openContentReports.length],["decision","Konto i decyzja"],["appeals","Odwołania",appeals.filter(item=>item.status==="submitted").length+contentReportAppeals.filter(item=>item.status==="submitted").length],["history","Historia"]]} />

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        {jobModerationLoading && (
          <div className="moderation-job-opening" role="status">
            <span className="section-label">Otwieranie sprawy</span>
            <h2>Ładowanie konta autora zlecenia…</h2>
            <p>Sprawdzamy zlecenie i przypisujemy właściwe konto do moderacji.</p>
          </div>
        )}

        {jobModerationError && (
          <div className="moderation-job-opening is-error" role="alert">
            <span className="section-label">Nie udało się otworzyć konta</span>
            <h2>Moderacja zlecenia nie została uruchomiona</h2>
            <p>{jobModerationError}</p>
            <Link className="privacy-secondary-button" to="/admin/jobs">
              Wróć do listy zleceń
            </Link>
          </div>
        )}
        <AdminPane active={adminTab==="reports"}><section className="moderation-content-reports">
          <div className="moderation-content-reports-heading">
            <div>
              <span className="section-label">Zgłoszenia treści i materiałów</span>
              <h2>Kolejka do ręcznej analizy</h2>
              <p>
                Zgłoszenie nie nakłada sankcji automatycznie. Dostęp do
                prywatnego dowodu jest czasowy i zapisywany w audycie. Oceń
                kontekst, a następnie wybierz brak naruszenia, usunięcie samej
                treści albo proporcjonalne ograniczenie konta.
              </p>
            </div>
            <span>{openContentReports.length}</span>
          </div>

          {openContentReports.length === 0 ? (
            <div className="privacy-empty-state">Brak nowych zgłoszeń treści.</div>
          ) : (
            <div className="moderation-content-report-list">
              {openContentReports.map((report) => (
                <article
                  className={activeContentReport?.id === report.id ? "is-active" : ""}
                  key={report.id}
                >
                  {report.content_snapshot?.reported_image_url
                    || report.content_snapshot?.legacy_cover_url ? (
                    <img
                      src={report.content_snapshot.reported_image_url
                        || report.content_snapshot.legacy_cover_url}
                      alt="Zgłoszony materiał portfolio"
                    />
                  ) : (
                    <div className="moderation-content-report-placeholder">
                      {isPrivateContentReport(report)
                        ? "PRYWATNY DOWÓD"
                        : "TREŚĆ"}
                    </div>
                  )}
                  <div>
                    <span className={`content-report-status is-${report.status}`}>
                      {CONTENT_REPORT_STATUS_LABELS[report.status] || report.status}
                    </span>
                    <h3>
                      {report.content_snapshot?.title ||
                        report.content_snapshot?.display_name ||
                        (report.content_type === "private_message"
                          ? "Prywatna wiadomość"
                          : report.content_type === "work_delivery"
                          ? `Przekazanie pracy — wersja ${report.content_snapshot?.version || "—"}`
                          : isPrivateContentReport(report)
                          ? "Prywatny materiał"
                          : "Projekt portfolio")}
                    </h3>
                    <small>{report.report_number} · {formatDisputeDate(report.submitted_at)}</small>
                    <strong>{CONTENT_REPORT_REASON_LABELS[report.reason_code] || report.reason_code}</strong>
                    <p>{report.explanation}</p>
                    {report.legal_reference && (
                      <p><b>Wskazana podstawa:</b> {report.legal_reference}</p>
                    )}
                    {privateReportEvidence[report.id] && (
                      <div className="moderation-private-evidence">
                        <div>
                          <strong>
                            Dowód prywatny · dostęp czasowy
                          </strong>
                          <small>
                            Każde otwarcie jest zapisywane w audycie
                          </small>
                        </div>
                        {privateReportEvidence[report.id]
                          .snapshot?.message_content && (
                          <blockquote>
                            {
                              privateReportEvidence[
                                report.id
                              ].snapshot.message_content
                            }
                          </blockquote>
                        )}
                        {privateReportEvidence[report.id]
                          .snapshot?.summary && (
                          <blockquote>
                            {
                              privateReportEvidence[
                                report.id
                              ].snapshot.summary
                            }
                          </blockquote>
                        )}
                        {privateReportEvidence[report.id]
                          .items?.length > 0 && (
                          <div className="moderation-private-evidence-items">
                            {privateReportEvidence[
                              report.id
                            ].items.map((item, index) => {
                              const evidenceUrl = getSafeWebUrl(
                                item.external_url ||
                                privateReportEvidence[
                                  report.id
                                ].signedUrls[
                                  item.storage_path
                                ]
                              );
                              return (
                                <a
                                  key={
                                    item.id ||
                                    item.storage_path ||
                                    `${report.id}-${index}`
                                  }
                                  href={evidenceUrl || undefined}
                                  target="_blank"
                                  rel="noopener noreferrer nofollow"
                                >
                                  {item.mime_type?.startsWith(
                                    "image/"
                                  ) && evidenceUrl ? (
                                    <img
                                      src={evidenceUrl}
                                      alt=""
                                    />
                                  ) : (
                                    <span aria-hidden="true">
                                      {item.external_url
                                        ? ""
                                        : item.mime_type ===
                                          "application/pdf"
                                        ? "PDF"
                                        : "PLIK"}
                                    </span>
                                  )}
                                  <b>
                                    {item.display_name ||
                                      "Materiał dowodowy"}
                                  </b>
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="moderation-content-report-actions">
                      {isPrivateContentReport(report) ? (
                        <button
                          type="button"
                          className="privacy-secondary-button"
                          onClick={() =>
                            handleOpenPrivateReportEvidence(
                              report
                            )
                          }
                          disabled={Boolean(busy)}
                        >
                          {busy ===
                          `report-evidence:${report.id}`
                            ? "Otwieranie…"
                            : "Otwórz dowód i zapisz dostęp"}
                        </button>
                      ) : (
                        <a
                          href={getSafeWebUrl(report.content_location, { allowRelative: true }) || undefined}
                          aria-disabled={!getSafeWebUrl(report.content_location, { allowRelative: true })}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Otwórz lokalizację 
                        </a>
                      )}
                      <button
                        type="button"
                        className="privacy-primary-button"
                        onClick={() => handleOpenContentReport(report)}
                        disabled={Boolean(busy)}
                      >
                        {busy === `report:${report.id}`
                          ? "Otwieranie..."
                          : report.status === "submitted"
                          ? "Rozpocznij analizę"
                          : "Kontynuuj analizę"}
                      </button>
                      <button
                        type="button"
                        className="privacy-secondary-button"
                        onClick={() => handleResolveContentReportNoAction(report)}
                        disabled={Boolean(busy)}
                      >
                        Brak podstaw do działania
                      </button>
                      {isPrivateContentReport(report) && (
                        <button
                          type="button"
                          className="privacy-secondary-button"
                          onClick={() =>
                            handleRemovePrivateContent(
                              report
                            )
                          }
                          disabled={Boolean(busy)}
                        >
                          Usuń treść bez zawieszenia
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section></AdminPane>

        {openContentReportAppeals.length > 0 && (
          <AdminPane active={adminTab==="appeals"}><section className="moderation-content-report-appeals">
            <div>
              <span className="section-label">Ponowna analiza zgłoszeń</span>
              <h2>Odwołania zgłaszających</h2>
            </div>
            <div className="moderation-content-report-appeal-list">
              {openContentReportAppeals.map((appeal) => {
                const report = contentReports.find((item) => item.id === appeal.report_id);
                return (
                  <article key={appeal.id}>
                    <strong>{report?.report_number || "Zgłoszenie treści"}</strong>
                    <p>{appeal.statement}</p>
                    <AutoTextarea
                      value={contentAppealNotes[appeal.id] || ""}
                      onChange={(event) => setContentAppealNotes((current) => ({
                        ...current,
                        [appeal.id]: event.target.value,
                      }))}
                      minLength={30}
                      maxLength={3000}
                      rows={4}
                      placeholder="Uzasadnij wynik ponownej, ręcznej analizy..."
                    />
                    <div>
                      <button
                        type="button"
                        className="privacy-secondary-button"
                        onClick={() => handleResolveContentReportAppeal(appeal, "rejected")}
                        disabled={Boolean(busy)}
                      >
                        Oddal odwołanie
                      </button>
                      <button
                        type="button"
                        className="privacy-primary-button"
                        onClick={() => handleResolveContentReportAppeal(appeal, "accepted")}
                        disabled={Boolean(busy)}
                      >
                        Uwzględnij i otwórz ponownie
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section></AdminPane>
        )}

        <AdminPane active={adminTab==="decision"}><section className="moderation-search-card">
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
        </section></AdminPane>

        {selectedUserId && (
          <AdminPane active={adminTab==="decision"}><section
            className="moderation-workbench"
            ref={moderationWorkbenchRef}
          >
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

            {selectedSubjectLoading && (
              <p className="moderation-subject-state" role="status">
                Ładowanie danych konta powiązanego ze zleceniem...
              </p>
            )}

            {selectedSubjectError && (
              <p className="moderation-subject-state is-error" role="alert">
                {selectedSubjectError}
              </p>
            )}

            {selectedProfile && !selectedSubjectLoading && !selectedSubjectError && (
              <div className="moderation-subject-summary">
                <div>
                  <span>
                    Profil: {selectedProfile.profile_exists === false
                      ? "brak profilu publicznego"
                      : "dostępny"}
                  </span>
                  <span>
                    Cykl konta: {selectedProfile.lifecycle_status || "active"}
                  </span>
                  <span>
                    Dostęp wieku: {selectedProfile.age_access_status || "—"}
                  </span>
                </div>
                <Link
                  className="privacy-secondary-button"
                  to={`/admin/privacy/users/${selectedUserId}`}
                >
                  Otwórz administracyjny widok konta 
                </Link>
              </div>
            )}

            {activeContentReport && (
              <article className="moderation-active-content-report">
                <div>
                  <span className="section-label">Źródło przygotowywanej decyzji</span>
                  <h3>{activeContentReport.report_number}</h3>
                </div>
                <p>{activeContentReport.explanation}</p>
                <small>
                  Decyzja musi wynikać z samodzielnej analizy administratora.
                  Dane zgłaszającego nie będą pokazane właścicielowi treści.
                </small>
                <button
                  type="button"
                  className="privacy-secondary-button"
                  onClick={() => setActiveContentReport(null)}
                  disabled={Boolean(busy)}
                >
                  Odłącz zgłoszenie od decyzji
                </button>
              </article>
            )}

            {sourceJob && (
              <><article className="moderation-source-job">
                <div>
                  <span className="section-label">Materiał źródłowy do ręcznej oceny</span>
                  <h3>{sourceJob.title}</h3>
                </div>
                <p>{sourceJob.description}</p>
                <small>
                  ID: {sourceJob.id} · {sourceJob.category || "Bez kategorii"} · {formatDisputeMoney(sourceJob.budget, "PLN")}
                </small>
              </article></>
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
                      <AutoTextarea
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
                    <FormSelect
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
                    </FormSelect>
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
                      <FormSelect
                        value={form.noticeMode}
                        onChange={(event) => updateModerationForm({
                          noticeMode: event.target.value,
                          immediateExceptionCode: "",
                        })}
                      >
                        <option value="thirty_day_notice">Po 30-dniowym uprzedzeniu</option>
                        <option value="immediate">Natychmiast — tylko udokumentowany wyjątek</option>
                      </FormSelect>
                    </label>
                  )}

                  <label>
                    Kategoria powodu
                    <FormSelect
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
                    </FormSelect>
                  </label>

                  {form.decisionType === "indefinite_suspension"
                    && form.noticeMode === "immediate" && (
                    <label>
                      Wyjątek pozwalający na natychmiastową decyzję
                      <FormSelect
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
                      </FormSelect>
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
                  <AutoTextarea
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
                  <AutoTextarea
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
                    Potwierdzenie właściciela
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
          </section></AdminPane>
        )}

        <AdminPane active={adminTab==="appeals"}><section className="moderation-appeals-admin">
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
                    <AutoTextarea
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
        </section></AdminPane>

        <AdminPane active={adminTab==="history"}><section className="moderation-case-register">
          <div>
            <span className="section-label">Rejestr decyzji</span>
            <h2>Historia ograniczeń</h2>
          </div>
          {loading ? (
            <InlineRouteLoader
              className="admin-route-loader"
              rows={4}
            />
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
        </section></AdminPane>
      </main>
    </div>
  );
}

function AdminUserPrivacyAccount() {
  const adminDialog = useAdminDialog();
  const adminBusy = useRef(false);
  const [refreshWarning,setRefreshWarning] = useState("");

  const [erasureTab,setErasureTab] = useState("operation");
  const [executionUnconfirmed,setExecutionUnconfirmed] = useState(false);

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
  const [messageKind,setMessageKind] = useState("info");
  function showMessage(value,kind="info") { setMessage(value);setMessageKind(kind); }
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
          adminRead(supabase
            .from("profiles")
            .select(
              "id, name, avatar_url, about, specialty_categories, specialization, skills, created_at"
            )
            .eq("id", userId)
            .maybeSingle()),
          adminRead(supabase
            .from("ideahire_account_lifecycle")
            .select(
              "user_id, status, erasure_case_id, data_minimized_at, closed_at, created_at, updated_at"
            )
            .eq("user_id", userId)
            .maybeSingle()),
          adminRead(supabase
            .from("ideahire_privacy_requests")
            .select(
              "id, request_number, requester_user_id, request_type, requested_erasure_action, description, status, identity_status, assigned_admin_id, submitted_at, due_at, extended_due_at, decision_summary, completed_at"
            )
            .eq("requester_user_id", userId)
            .eq("request_type", "erasure")
            .order("submitted_at", { ascending: false })),
          adminRead(supabase
            .from("ideahire_erasure_cases")
            .select("*")
            .eq("target_user_id", userId)
            .order("created_at", { ascending: false })),
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

      const selectedCase=caseRows.find(item=>item.privacy_request_id===selectedRequest?.id);
      if (erasureOutcomeKnown(selectedCase)) setExecutionUnconfirmed(false);
      setProfile(profileResult.data || null);
      setLifecycle(lifecycleResult.data || null);
      setRequests(requestRows);
      setCases(caseRows);

      if (caseRows.length > 0) {
        const eventResult = await adminRead(supabase
          .from("ideahire_erasure_case_events")
          .select(
            "id, case_id, actor_role, event_type, visibility, message, details, created_at"
          )
          .in("case_id", caseRows.map((item) => item.id))
          .order("created_at", { ascending: true }));

        if (eventResult.error) throw eventResult.error;
        setCaseEvents(eventResult.data || []);
      } else {
        setCaseEvents([]);
      }

      if (selectedRequest) {
        const inventoryResult = await adminRpc(supabase,
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
      (showLoading ? showMessage : setRefreshWarning)(cleanSupabaseError(
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

  const initialTabRequest = useRef(null);
  useEffect(()=>{
    if(loading || !currentRequest || initialTabRequest.current===currentRequest.id) return;
    initialTabRequest.current=currentRequest.id;
    setErasureTab(currentRequest.identity_status!=='verified' ? 'request' : currentCase ? 'operation' : 'scope');
  },[loading,currentRequest?.id,currentRequest?.identity_status,currentCase?.id]);

  useEffect(()=>{ if(!loading && currentRequest && !currentCase)setErasureTab("request"); },[loading,currentRequest?.id,currentCase?.id]);

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
    showMessage("");
    setDialogMessage("");
    document.querySelector(".erasure-actions-menu")?.removeAttribute("open");
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
      showMessage("Notatka weryfikacyjna musi mieć co najmniej 20 znaków.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy("identity");
    showMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "admin_verify_ideahire_erasure_identity",
        {
          p_request_id: currentRequest.id,
          p_method: identityMethod,
          p_note: identityNote.trim(),
        }
      );

      if (error) throw error;

      setIdentityNote("");
      setErasureTab("scope");
      showMessage("Tożsamość użytkownika została potwierdzona i zapisana w historii sprawy.");
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      showMessage(cleanSupabaseError(error, "Nie udało się potwierdzić tożsamości."));
    } finally {
      adminBusy.current = false; setBusy("");
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
        "Nie przekazano operacji właścicielowi, ponieważ konto ma aktywne sprawy. Rozwiąż pozycje pokazane poniżej i sprawdź warunki ponownie."
      );
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy("prepare");
    showMessage("");
    setDialogMessage("");

    try {
      const { data: preparedCaseId, error } = await adminRpc(supabase,
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
      setErasureTab("operation");
      setLegalAssessment("");
      setRetentionReason("");
      showMessage("Zakres operacji zapisano i przekazano do zatwierdzenia przez właściciela.");
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      console.error("ADMIN PREPARE ERASURE ERROR:", error);

      const { data: existingCase, error: existingCaseError } = await adminRead(supabase
        .from("ideahire_erasure_cases")
        .select("id, status")
        .eq("privacy_request_id", currentRequest.id)
        .maybeSingle());

      if (!existingCaseError && existingCase?.id) {
        setDialogAction("");
        setDialogMessage("");
        setLegalAssessment("");
        setRetentionReason("");
        showMessage(
          "Operacja została zapisana i oczekuje na zatwierdzenie właściciela. Widok został odświeżony."
        );
        void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
        return;
      }

      const errorText = String(error?.message || "").toLowerCase();
      if (errorText.includes("przypisana") || errorText.includes("uprawnie")) {
        setDialogMessage(
          "Nie przekazano operacji. Ten wniosek musi najpierw przejąć zalogowany administrator albo właściciel."
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
          "Nie udało się przekazać operacji właścicielowi. Niczego nie usunięto. Odśwież widok i spróbuj ponownie."
        );
      }
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleAuthorizeErasure() {
    if (!currentCase || executionUnconfirmed || !inventory || inventoryError) return;

    if (
      currentCase.action_type === "close_account"
      && inventory?.execution_blocked
    ) {
      showMessage("Konta nie można teraz zamknąć. Najpierw zakończ wszystkie przeszkody pokazane w panelu.");
      return;
    }

    if (ownerConfirmation.trim() !== "ZATWIERDZAM USUNIECIE") {
      showMessage("Wpisz dokładnie: ZATWIERDZAM USUNIECIE");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy("authorize");
    showMessage("");

    try {
      const actionType = currentCase.action_type;
      await executeErasure(supabase, {
          caseId: currentCase.id,
          authorizeAndExecute: true,
          ownerConfirmation: ownerConfirmation.trim(),
          expectedActionType: actionType,
        });

      setOwnerConfirmation("");
      showMessage(
        actionType === "close_account"
          ? "Właściciel zatwierdził operację. Możliwe dane usunięto lub zanonimizowano, konto zamknięto, a sprawę zakończono."
          : "Właściciel zatwierdził operację. Pełny możliwy zakres danych usunięto lub zanonimizowano, konto pozostało aktywne, a sprawę zakończono."
      , "success");
      setErasureTab("operation");
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      showMessage(erasureFailureMessage(error));
      setExecutionUnconfirmed(Boolean(error.uncertain));
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleExecuteErasure() {
    if (!currentCase) return;

    const operationName = ERASURE_ACTION_LABELS[currentCase.action_type]
      || "wykonanie operacji";

    if (executionUnconfirmed || !inventory || inventoryError) {
      showMessage("Najpierw odśwież status i zakres danych."); return;
    }
    const confirmation = await adminDialog.confirm(
      currentCase.action_type === "minimize_data"
        ? "Wyczyścimy wskazane poniżej dane. Adres e-mail, hasło i możliwość logowania pozostaną. Tej operacji nie można cofnąć."
        : "Usuniemy wskazane dane i wyłączymy logowanie. Tej operacji nie można cofnąć.",
      { title:operationName, requiredPhrase:ERASURE_CONFIRMATION, confirmLabel:currentCase.action_type === "minimize_data" ? "Wyczyść dane, zachowaj konto" : "Usuń dane i zamknij konto", details:<details className="ih-admin-confirmation-scope"><summary>Sprawdź zakres przed potwierdzeniem</summary><ErasureScope inventory={inventory} action={currentCase.action_type} compact /></details> }
    );
    if (confirmation !== ERASURE_CONFIRMATION) return;

    if (adminBusy.current) return; adminBusy.current = true; setBusy("execute");
    showMessage("");

    try {
      await executeErasure(supabase, { caseId:currentCase.id, expectedActionType:currentCase.action_type, executionConfirmation:confirmation });

      showMessage(
        currentCase.action_type === "close_account"
          ? "Konto zostało zamknięte, a status sprawy zaktualizowany."
          : "Pełny możliwy zakres danych został usunięty lub zanonimizowany. Konto logowania pozostało aktywne."
      , "success");
      setErasureTab("operation");
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      showMessage(erasureFailureMessage(error));
      setExecutionUnconfirmed(Boolean(error.uncertain));
      void loadAccountData(false).catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  function chooseRequest(requestId) {
    showMessage(""); setErasureTab("request");
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
    ? "Profil wyczyszczony"
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
      <AdminNavbar />{adminDialog.element}

      <main className="admin-shell erasure-account-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027"><AdminRefreshNotice warning={refreshWarning} onRefresh={() => { setRefreshWarning(""); loadAccountData(false).catch(() => setRefreshWarning("Nie udało się odświeżyć danych. Spróbuj ponownie.")); }} />
        <Link className="privacy-back-link" to="/admin/privacy?type=erasure">
           Wnioski o usunięcie danych
        </Link>

        {loading ? (
          <InlineRouteLoader
            className="admin-route-loader"
            rows={5}
          />
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
                  <span className="section-label">Usuwanie danych użytkownika</span>
                  <h1>{accountName}</h1>
                  <details className="ih-admin-account-id"><summary>Identyfikator użytkownika</summary><code>{userId}</code></details>
                  {completedDataMinimization && (
                    <p className="erasure-account-auth-state">
                      Logowanie pozostaje aktywne. Użytkownik może ponownie uzupełnić profil.
                    </p>
                  )}
                </div>
              </div>

              <div className="erasure-account-header-actions">
                <span className={`erasure-lifecycle-pill is-${lifecycleStatus}`}>
                  {ERASURE_LIFECYCLE_LABELS[lifecycleStatus] || lifecycleStatus}
                </span>

                {!currentCase && <details className="erasure-actions-menu">
                  <summary>Działania na koncie</summary>
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
                      <span>Wyczyść dane, zachowaj konto</span>
                      <small>Usunięcie profilu i danych opcjonalnych. Logowanie pozostaje.</small>
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
                      <small>Usunięcie danych oraz wyłączenie logowania</small>
                    </button>
                  </div>
                </details>}
                {currentCase && <><button type="button" className="ih-admin-account-action" onClick={()=>setErasureTab("operation")}>{currentCase.status==="completed"?"Wynik operacji":"Przejdź do operacji"}</button><Link className="ih-admin-account-action" to={`/admin/moderation?user=${userId}`}>Moderacja konta</Link></>}
              </div>
            </header>

            {message && !(messageKind === "success" && currentCase?.status === "completed") && (
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
              <><section className="erasure-request-selector"><div className="ih-erasure-request-caption"><strong>{formatPrivacyRequestNumber(currentRequest?.request_number)}</strong><span>{PRIVACY_REQUEST_STATUSES[currentRequest?.status] || currentRequest?.status}</span></div>
                {requests.length > 1 && (
                  <label>
                    Wybierz wniosek
                    <FormSelect
                      value={currentRequest?.id || ""}
                      onChange={(event) => chooseRequest(event.target.value)}
                    >
                      {requests.map((item) => (
                        <option value={item.id} key={item.id}>
                          {formatPrivacyRequestNumber(item.request_number)} — {PRIVACY_REQUEST_STATUSES[item.status] || item.status}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                )}
              </section><AdminTabs value={erasureTab} onChange={setErasureTab} items={[["request","Wniosek"],["scope","Zakres danych"],["operation",currentCase?.status === "completed" ? "Wynik" : "Wykonanie"],["history","Historia",currentCaseEvents.length]]} /><AdminPane active={erasureTab==="request"}><section className="ih-erasure-request-details"><h2>Żądanie użytkownika</h2><blockquote>{currentRequest?.description}</blockquote><div className="privacy-erasure-requested-action"><span>{requestedErasureAction?"Użytkownik wybrał":"Zakres przygotowanej operacji"}</span><strong>{ERASURE_ACTION_LABELS[requestedErasureAction || currentCase?.action_type] || "Zakres wymaga ustalenia"}</strong></div><strong>{currentRequest?.identity_status === "verified" ? "Tożsamość potwierdzona" : "Tożsamość wymaga potwierdzenia"}</strong><Link to={`/admin/privacy?request=${currentRequest?.id}`}>Korespondencja i status wniosku</Link></section><AdminErasureSteps request={currentRequest} currentCase={currentCase} /></AdminPane></>
            )}

            {currentRequest && !canManage && (
              <section className="erasure-account-notice is-warning">
                <strong>Brak uprawnienia do wykonania operacji</strong>
                <p>
                  Najpierw przejmij wniosek w kolejce. Wgląd i wykonanie ma
                  prowadzący administrator oraz właściciel.
                </p>
              </section>
            )}

            {isLegacyErasureRequest && !currentCase && canManage && erasureTab === "request" && (
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
              <AdminPane active={erasureTab==="request"}><form className="erasure-identity-card" onSubmit={handleVerifyIdentity}>
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
                  <FormSelect
                    value={identityMethod}
                    onChange={(event) => setIdentityMethod(event.target.value)}
                    disabled={Boolean(busy)}
                  >
                    <option value="authenticated_session">Aktywna, uwierzytelniona sesja</option>
                    <option value="additional_document">Dodatkowy dokument — bez zapisywania kopii</option>
                    <option value="video_call">Rozmowa weryfikacyjna</option>
                    <option value="manual_comparison">Ręczne porównanie danych</option>
                  </FormSelect>
                </label>
                <label>
                  Notatka weryfikacyjna
                  <AutoTextarea
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
              </form></AdminPane>
            )}

            {inventoryError ? (
              <section className="erasure-account-notice is-danger" role="alert">
                <strong>Nie udało się pobrać zakresu danych</strong>
                <p>
                  Operacja nie może zostać przygotowana bez aktualnego inwentarza.
                  Odśwież zakres i status. Poprzednia próba mogła już wykonać część zmian.
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
              <AdminPane active={erasureTab==="scope"}>{completedDataMinimization || completedAccountClosure ? <div className="erasure-account-notice"><strong>Operacja została wykonana</strong><p>Raport zawiera rzeczywiste liczby usuniętych i pozostawionych danych. Nowe dane uzupełnione przez użytkownika po operacji nie należą do tego raportu.</p><button type="button" className="privacy-secondary-button" onClick={()=>setErasureTab("operation")}>Zobacz raport wykonania</button></div> : <ErasureScope inventory={inventory} action={currentCase?.action_type || requestedErasureAction || "minimize_data"}/>}</AdminPane>
            ) : currentRequest ? (
              <section className="erasure-account-notice">
                <strong>Pobieramy aktualny zakres danych</strong>
                <p>Za chwilę zobaczysz dane możliwe do usunięcia oraz dane objęte retencją.</p>
              </section>
            ) : null}

            {activeBlockers.length > 0 && (currentCase?.action_type === "close_account" || requestedErasureAction === "close_account") && (
              <AdminPane active={erasureTab==="operation"}><section className="erasure-blockers-card" role="alert">
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
              </section></AdminPane>
            )}

            {currentCase && (
              <AdminPane active={erasureTab==="operation"}><section className="erasure-case-card">
                <div className="erasure-card-heading">
                  <div>
                    <span className="section-label">Kontrola operacji</span>
                    <h2>{ERASURE_ACTION_LABELS[currentCase.action_type]}</h2>
                  </div>
                  <span className={`erasure-case-status is-${currentCase.status}`}>
                    {ERASURE_CASE_STATUS_LABELS[currentCase.status] || currentCase.status}
                  </span>
                </div>

                <details className="ih-erasure-assessment"><summary>Uzasadnienie zakresu i zachowania historii</summary><div className="erasure-assessment-grid">
                  <article>
                    <strong>Ocena zakresu i podstawy</strong>
                    <p>{currentCase.legal_assessment}</p>
                  </article>
                  <article>
                    <strong>Uzasadnienie pozostawienia historii</strong>
                    <p>{currentCase.retention_reason}</p>
                  </article>
                </div></details>

                {currentCase.status === "awaiting_owner" && (
                  staffRole === "owner" ? (
                    <div className="erasure-owner-approval">
                      <div>
                        <strong>Zatwierdzenie właściciela</strong>
                        <p>
                          Sprawdź zakres, retencję i aktywne zobowiązania. Następnie
                          wpisz dokładną frazę. Zatwierdzenie od razu uruchomi
                          usuwanie danych. Sprawa zakończy się po potwierdzeniu wszystkich etapów.
                        </p>
                      </div>
                      {inventory && <details className="ih-erasure-review"><summary>Sprawdź dokładny zakres przed zatwierdzeniem</summary><ErasureScope inventory={inventory} action={currentCase.action_type} compact /></details>}
                      <label className="ih-admin-confirmation-field">
                        <span>Wpisz dokładnie: <code>{ERASURE_CONFIRMATION}</code></span>
                        <input
                          value={ownerConfirmation}
                          onChange={(event) => setOwnerConfirmation(event.target.value)}
                          placeholder={ERASURE_CONFIRMATION}
                          autoComplete="off"
                          autoCapitalize="characters"
                          spellCheck={false}
                          maxLength={80}
                          disabled={Boolean(busy)}
                        />
                      </label>
                      <button
                        type="button"
                        className="erasure-danger-button"
                        onClick={handleAuthorizeErasure}
                        disabled={
                          Boolean(busy) || executionUnconfirmed || !inventory || Boolean(inventoryError)
                          || ownerConfirmation.trim() !== "ZATWIERDZAM USUNIECIE"
                          || (
                            currentCase.action_type === "close_account"
                            && Boolean(inventory?.execution_blocked)
                          )
                        }
                      >
                        {busy === "authorize"
                          ? "Zatwierdzanie i wykonywanie..."
                          : currentCase.action_type === "minimize_data" ? "Zatwierdź i usuń dane" : "Zatwierdź i zamknij konto"}
                      </button>
                    </div>
                  ) : (
                    <div className="erasure-account-notice">
                      <strong>Operacja oczekuje na właściciela</strong>
                      <p>Administrator nie może samodzielnie zatwierdzić nieodwracalnej operacji.</p>
                    </div>
                  )
                )}

                {currentCase.failure_reason && <div className="erasure-account-notice is-danger" role="alert"><strong>Poprzednia próba została przerwana</strong><p>{currentCase.failure_reason}</p></div>}
                {executionUnconfirmed && <button type="button" className="privacy-secondary-button" onClick={()=>loadAccountData(false)}>Odśwież status przed kontynuacją</button>}
                {["authorized", "processing"].includes(currentCase.status) && (
                  <div className="erasure-execute-panel">
                    <div>
                      <strong>
                        {currentCase.status === "processing"
                          ? "Dokończ przerwaną operację"
                          : "Operacja gotowa do wykonania"}
                      </strong>
                      <p>
                        {currentCase.action_type === "minimize_data" ? "Wyczyścimy dane wskazane w zakresie operacji. Konto i logowanie pozostaną aktywne." : "Usuniemy dane wskazane w zakresie i wyłączymy logowanie po ponownej kontroli zobowiązań."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="erasure-danger-button"
                      onClick={handleExecuteErasure}
                      disabled={Boolean(busy) || executionUnconfirmed || !inventory || Boolean(inventoryError)}
                    >
                      {busy === "execute"
                        ? "Wykonywanie..."
                        : currentCase.status === "processing"
                          ? "Sprawdź zakres i dokończ"
                          : "Sprawdź zakres i usuń dane"}
                    </button>
                  </div>
                )}

                {currentCase.status === "completed" && (
                  <div className="erasure-completed-banner">
                    <span aria-hidden="true">✓</span>
                    <div className="erasure-completed-content">
                      <strong role="status">Operacja została zakończona</strong>
                      <p>
                        {currentCase.action_type === "minimize_data"
                          ? "Dane wskazane w raporcie zostały wyczyszczone. Konto i logowanie pozostają aktywne."
                          : "Usunięto lub zanonimizowano możliwe dane i zamknięto konto logowania."}
                      </p>

                      {executionRows.length > 0 && (
                        <details className="erasure-execution-report" open><summary>Wykonane czynności ({executionRows.length})</summary>
                          <div>
                            <span className="section-label">Raport wykonania</span>
                            <h3>Co zostało usunięte lub zanonimizowane</h3>
                          </div>
                          <AdminHistory resetKey={currentCase.id} label="Strony raportu" previousLabel="Poprzednie" nextLabel="Następne"><dl>
                            {executionRows.map((item) => (
                              <div key={item.key}>
                                <dt>{item.label}</dt>
                                <dd>{item.value}</dd>
                              </div>
                            ))}
                          </dl></AdminHistory>
                        </details>
                      )}

                      <details className="erasure-retention-report"><summary>Co pozostało po operacji</summary>
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
                            {currentCase.action_type === "minimize_data"
                              ? "Zachowano konto logowania, dokumentację realizacji wniosku oraz niezbędną historię audytową."
                              : "Zachowano dokumentację realizacji wniosku oraz niezbędną historię audytową. Logowanie zostało wyłączone."}
                          </p>
                        )}

                        <small>
                          Dane prawne, transakcyjne, sporne lub bezpieczeństwa nie
                          są publikowane w profilu i podlegają uzasadnieniu oraz
                          okresowi retencji zapisanym w tej sprawie.
                        </small>
                      </details>
                    </div>
                  </div>
                )}

                {currentCase.status === "failed" && (
                  <div className="erasure-account-notice is-danger">
                    <strong>Operacja wymaga kontroli</strong>
                    <p>{currentCase.failure_reason || "Sprawdź historię techniczną operacji."}</p>
                  </div>
                )}

              </section></AdminPane>
            )}
            {currentCase && <AdminPane active={erasureTab==="history"}><section className="erasure-case-card"><h2>Historia operacji</h2>
                {currentCaseEvents.length > 0 ? (
                  <AdminHistory resetKey={currentCase.id}><ol className="erasure-case-timeline">
                    {[...currentCaseEvents].reverse().map((item) => (
                      <li key={item.id}>
                        <span aria-hidden="true" />
                        <div>
                          <strong>{item.message}</strong>
                          <time>{formatDisputeDate(item.created_at)}</time>
                        </div>
                      </li>
                    ))}
                  </ol></AdminHistory>
                ) : <p>Nie zapisano jeszcze zdarzeń tej operacji.</p>}
              </section></AdminPane>}

          </>
        )}
      </main>

      {dialogAction && (
        <AdminModal className="erasure-dialog" labelledBy="erasure-dialog-title" onClose={closeErasureDialog} closeDisabled={Boolean(busy)}>
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
                  Właściciel nie powinien zatwierdzać zamknięcia, dopóki poniższe sprawy
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

            {inventory && <details className="ih-erasure-review"><summary>Dokładny zakres tej operacji</summary><ErasureScope inventory={inventory} action={dialogAction} compact /></details>}
            <form onSubmit={handlePrepareErasure} noValidate>
              <label>
                Ocena zakresu i podstawy realizacji wniosku
                <AutoTextarea
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
                <AutoTextarea
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
                      : "Przekaż właścicielowi do zatwierdzenia"}
                </button>
              </div>
            </form>
        </AdminModal>
      )}
    </div>
  );
}

function AdminPrivacyRequests() {
  const adminDialog = useAdminDialog();
  const adminBusy = useRef(false);
  const [refreshWarning,setRefreshWarning] = useState("");

  const adminLocation = useLocation();
  const erasureOnly = new URLSearchParams(adminLocation.search).get("type") === "erasure";
  const [queueSearch,setQueueSearch] = useState("");

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

    const { data, error } = await adminRead(supabase
      .from("ideahire_privacy_requests")
      .select("*")
      .order("submitted_at", { ascending: false })
      .limit(300));

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
      const { data: profileRows, error: profileError } = await adminRead(supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", profileIds));

      if (!profileError) {
        setProfiles(Object.fromEntries(
          (profileRows || []).map((profile) => [profile.id, profile])
        ));
      }
    } else {
      setProfiles({});
    }

    if (rows.length > 0) {
      const { data: eventRows, error: eventError } = await adminRead(supabase
        .from("ideahire_privacy_request_events")
        .select("id, request_id, actor_role, event_type, visibility, message, created_at")
        .in("request_id", rows.map((item) => item.id))
        .order("created_at", { ascending: true }));

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

    const { data: auditRows, error: auditError } = await adminRead(supabase
      .from("ideahire_privacy_audits")
      .select("id, request_id, status, risk_level, scope, findings_summary, remediation_summary, public_scope, public_findings_summary, public_remediation_summary, public_summary, last_updated_by, submitted_for_approval_by, approved_by, created_at, updated_at, submitted_for_approval_at, approved_at")
      .in("request_id", securityReviewIds));

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
      adminRead(supabase
        .from("ideahire_privacy_audit_checks")
        .select("id, audit_id, check_key, status, evidence_note, public_note, checked_by, checked_at, created_at, updated_at")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true })),
      adminRead(supabase
        .from("ideahire_privacy_audit_events")
        .select("id, audit_id, actor_role, event_type, note, details, created_at")
        .in("audit_id", auditIds)
        .order("created_at", { ascending: true })),
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

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:audit-save`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
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
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zapisać analizy."));
    } finally {
      adminBusy.current = false; setBusy("");
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

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:audit-submit`);
    setMessage("");

    try {
      const saveResult = await adminRpc(supabase,
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

      const submitResult = await adminRpc(supabase,
        "admin_submit_ideahire_privacy_audit",
        {
          p_request_id: requestId,
          p_public_summary: draft.publicSummary.trim(),
        }
      );

      if (submitResult.error) throw submitResult.error;

      setMessage("Analiza została przekazana właścicielowi technicznemu do zatwierdzenia.");
      clearAuditDraft(requestId);
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przekazać analizy do zatwierdzenia."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleApproveAudit(requestId) {
    if (!await adminDialog.confirm(
      "Czy zatwierdzić i opublikować pełny raport użytkownikowi? Sprawa pozostanie otwarta do jego odpowiedzi lub potwierdzenia odbioru."
    )) return;

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:audit-approve`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "owner_approve_ideahire_privacy_audit",
        { p_request_id: requestId }
      );

      if (error) throw error;

      setMessage("Raport został zatwierdzony i czeka na odpowiedź lub potwierdzenie użytkownika.");
      clearAuditDraft(requestId);
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zatwierdzić analizy."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleReturnAudit(requestId) {
    const draft = getAuditDraft(requestId);

    if (draft.returnNote.trim().length < 20) {
      setMessage("Uzasadnienie odesłania analizy musi mieć co najmniej 20 znaków.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:audit-return`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "owner_return_ideahire_privacy_audit",
        {
          p_request_id: requestId,
          p_note: draft.returnNote.trim(),
        }
      );

      if (error) throw error;

      setMessage("Analiza została odesłana administratorowi do poprawy.");
      clearAuditDraft(requestId);
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się odesłać analizy do poprawy."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleTake(requestId) {
    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:take`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "admin_take_ideahire_privacy_request",
        { p_request_id: requestId }
      );

      if (error) throw error;
      setMessage("Wniosek został przypisany do Ciebie.");
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przejąć wniosku."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleUpdate(event, requestId) {
    event.preventDefault();
    const draft = getDraft(requestId);

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:update`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
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
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zaktualizować wniosku."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleAdminPrivacyReply(event, requestId) {
    event.preventDefault();
    const reply = getDraft(requestId).replyMessage.trim();

    if (reply.length < 3) {
      setMessage("Wiadomość musi mieć co najmniej 3 znaki.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:admin-reply`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "admin_reply_to_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_message: reply,
        }
      );

      if (error) throw error;

      updateDraft(requestId, { replyMessage: "" });
      setMessage("Wiadomość została wysłana do użytkownika.");
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się wysłać wiadomości."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  async function handleExtend(requestId) {
    const draft = getDraft(requestId);

    if (draft.extensionReason.trim().length < 20) {
      setMessage("Uzasadnienie przedłużenia musi mieć co najmniej 20 znaków.");
      return;
    }

    if (adminBusy.current) return; adminBusy.current = true; setBusy(`${requestId}:extend`);
    setMessage("");

    try {
      const { error } = await adminRpc(supabase,
        "admin_extend_ideahire_privacy_request",
        {
          p_request_id: requestId,
          p_reason: draft.extensionReason.trim(),
        }
      );

      if (error) throw error;
      setMessage("Termin został przedłużony i użytkownik zobaczy uzasadnienie.");
      void loadAdminPrivacyRequests().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się przedłużyć terminu."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  const scopedRequests = requests.filter(item => !erasureOnly || item.request_type === "erasure");
  const activeRequests = scopedRequests.filter(item => adminPrivacyFilter(item,"active",user.id));
  const overdueRequests = scopedRequests.filter(item => adminPrivacyFilter(item,"overdue",user.id));
  const unassignedRequests = scopedRequests.filter(item => adminPrivacyFilter(item,"unassigned",user.id));
  const visibleRequests = orderAdminRequests(scopedRequests.filter(item => adminPrivacyFilter(item,filter,user.id) && adminQueueSearch({title:getOptionLabel(PRIVACY_REQUEST_TYPES,item.request_type),subtitle:profiles[item.requester_user_id]?.name,number:formatPrivacyRequestNumber(item.request_number),search:item.description},queueSearch)));
  const [selectedRequestId,selectRequest] = useAdminSelection(visibleRequests);
  const queueItems = visibleRequests.map(item => ({id:item.id,number:formatPrivacyRequestNumber(item.request_number),title:getOptionLabel(PRIVACY_REQUEST_TYPES,item.request_type),subtitle:profiles[item.requester_user_id]?.name || "Użytkownik",meta:PRIVACY_REQUEST_STATUSES[item.status]+" · "+formatDisputeDate(item.extended_due_at || item.due_at,false),urgent:isPrivacyRequestOpen(item.status) && new Date(item.extended_due_at || item.due_at).getTime()<Date.now()}));
  return (
    <div className="account-page admin-page admin-privacy-page">
      <AdminNavbar />{adminDialog.element}

      <main className="admin-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027"><AdminRefreshNotice warning={refreshWarning} onRefresh={() => { setRefreshWarning(""); loadAdminPrivacyRequests().catch(() => setRefreshWarning("Nie udało się odświeżyć danych. Spróbuj ponownie.")); }} />
        <AdminPageHeading title={erasureOnly ? "Usuwanie danych" : "Wnioski RODO"} meta={staffRole === "owner" ? "Właściciel" : "Administrator"} description="Kontrolowana kolejka wniosków dotyczących praw użytkownika oraz technicznej i organizacyjnej analizy ochrony danych."/>

        {message && <p className="privacy-page-message" role="status">{message}</p>}

        <AdminMetrics items={[{label:"Aktywne",value:activeRequests.length,onClick:()=>setFilter("active"),active:filter==="active"},{label:"Bez opiekuna",value:unassignedRequests.length,onClick:()=>setFilter("unassigned"),active:filter==="unassigned"},{label:"Po terminie",value:overdueRequests.length,onClick:()=>setFilter("overdue"),active:filter==="overdue"},{label:"Wszystkie",value:scopedRequests.length,onClick:()=>setFilter("all"),active:filter==="all"}]} />

        <section className="privacy-admin-queue">
          <div className="privacy-admin-toolbar">
            <div>
              <span className="section-label">Kolejka RODO</span>
              <h2>Sprawy do obsługi</h2>
            </div>
            <AdminFilterBar search={queueSearch} onSearch={setQueueSearch} placeholder="Numer, temat lub użytkownik" filter={filter} onFilter={setFilter} options={[["active","Aktywne"],["unassigned","Bez opiekuna"],["mine","Moje"],["overdue","Po terminie"],["completed","Zakończone"],["requester_closed","Zamknięte przez użytkownika"],["all","Wszystkie"]]} />
          </div>

          {loading ? (
            <InlineRouteLoader
              className="admin-route-loader"
              rows={5}
            />
          ) : visibleRequests.length === 0 ? (
            <div className="privacy-empty-state">
              <strong>Brak wniosków w tym widoku</strong>
            </div>
          ) : (
            <AdminQueue items={queueItems} selectedId={selectedRequestId} onSelect={selectRequest} label="Wnioski">
              {visibleRequests.filter(item=>item.id===selectedRequestId).map((request) => {
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
                    <div className="ih-admin-case-header">
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
                              : "Zakres wymaga potwierdzenia"}
                          </strong>
                          <p>
                            {request.requested_erasure_action
                              ? ERASURE_ACTION_DESCRIPTIONS[request.requested_erasure_action]
                              : "W starszym wniosku nie zapisano wyboru. Sprawdź jego treść i historię przed operacją."}
                          </p>
                        </div>
                        <Link
                          className="privacy-admin-account-link"
                          to={`/admin/privacy/users/${request.requester_user_id}?request=${request.id}`}
                        >
                          Obsłuż usunięcie danych
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

                    <AdminCaseTools key={request.id}>


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
                            <AutoTextarea
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
                            <FormSelect
                              value={draft.status}
                              onChange={(event) => updateDraft(request.id, { status: event.target.value })}
                              disabled={Boolean(busy)}
                            >
                              {Object.entries(PRIVACY_REQUEST_STATUSES)
                                .filter(([value]) => !["submitted", "withdrawn"].includes(value))
                                .filter(([value]) => !isSecurityReview
                                  || !["completed", "partially_completed"].includes(value))
                                .map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                            </FormSelect>
                          </label>

                          <label>
                            Wiadomość dla użytkownika
                            <AutoTextarea
                              value={draft.publicMessage}
                              onChange={(event) => updateDraft(request.id, { publicMessage: event.target.value })}
                              placeholder="Opisz wykonane działanie, potrzebne informacje albo przyczynę decyzji..."
                              maxLength={5000}
                              rows={4}
                            />
                          </label>

                          <label>
                            Notatka wewnętrzna
                            <AutoTextarea
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
                                <AutoTextarea
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
                                    <FormSelect
                                      value={auditDraft.riskLevel}
                                      onChange={(event) => updateAuditDraft(request.id, {
                                        riskLevel: event.target.value,
                                      })}
                                      disabled={Boolean(busy) || auditLocked}
                                    >
                                      {PRIVACY_AUDIT_RISK_LEVELS.map(([value, label]) => (
                                        <option value={value} key={value}>{label}</option>
                                      ))}
                                    </FormSelect>
                                  </label>

                                  <div className="privacy-audit-updated">
                                    <span>Ostatnia aktualizacja</span>
                                    <strong>{formatDisputeDate(audit.updated_at)}</strong>
                                  </div>
                                </div>

                                <label>
                                  Zakres analizy
                                  <AutoTextarea
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
                                          <FormSelect
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
                                          </FormSelect>
                                        </label>

                                        <label>
                                          Dowód lub notatka wewnętrzna
                                          <AutoTextarea
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
                                          <AutoTextarea
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
                                  <AutoTextarea
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
                                  <AutoTextarea
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
                                    <AutoTextarea
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
                                    <AutoTextarea
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
                                    <AutoTextarea
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
                                    <AutoTextarea
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
                                        <AutoTextarea
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
</AdminCaseTools>
                  </article>
                );
              })}
            </AdminQueue>
          )}
        </section>
      </main>
    </div>
  );
}

function AdminPanel() {
  const adminDialog = useAdminDialog();
  const adminBusy = useRef(false);
  const [refreshWarning,setRefreshWarning] = useState("");

  const adminLocation = useLocation();
  const requestedAdminView = new URLSearchParams(adminLocation.search).get("view") || "queue";
  const [queueSearch,setQueueSearch] = useState("");

  const { user } = useAuth();
  const { staffRole, staffLoading, isStaff, isOwner } = useStaffRole(user?.id);
  const adminView = ["queue", "activity"].includes(requestedAdminView) || (isOwner && ["access"].includes(requestedAdminView)) ? requestedAdminView : "queue";
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
      adminRead(supabase
        .from("disputes")
        .select("*")
        .order("opened_at", { ascending: false })
        .limit(300)),
      adminRead(supabase
        .from("ideahire_staff")
        .select("user_id, role, is_active, granted_at, revoked_at")
        .order("granted_at", { ascending: true })),
      adminRead(supabase
        .from("ideahire_admin_audit_log")
        .select("id, actor_user_id, actor_role, action, dispute_id, target_user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(30)),
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
      const { data, error } = await adminRead(supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", uniqueIds));

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

    if (!(await adminDialog.confirm((enabled ? "Nadać uprawnienia administratora kontu " : "Odebrać uprawnienia administratora kontu ") + email + "? Ta zmiana wpłynie na dostęp do spraw i danych użytkowników."))) return;
    if (adminBusy.current) return; adminBusy.current = true; setBusy(enabled ? "grant" : "revoke");
    setMessage("");

    try {
      const { error } = await adminRpc(supabase, "owner_set_admin_by_email", {
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
      void loadAdminData().catch(() => setRefreshWarning("Zapis został zakończony, ale nie udało się odświeżyć danych. Odśwież widok przed kolejną operacją."));
    } catch (error) {
      setMessage(cleanSupabaseError(error, "Nie udało się zmienić roli administratora."));
    } finally {
      adminBusy.current = false; setBusy("");
    }
  }

  if (staffLoading || loading) {
    return (
      <div className="account-page admin-page">
        <AdminNavbar />{adminDialog.element}
        <main className="admin-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027">
          <InlineRouteLoader
            className="admin-route-loader"
            rows={5}
          />
        </main>
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="account-page admin-page">
        <AccountNavbar />
        <main className="admin-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027">
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
    if (!adminQueueSearch({title:item.job_title_snapshot,number:formatDisputeNumber(item.case_number)},queueSearch)) return false;
    if(filter === "awaiting") return item.status === "awaiting_response";
    if(filter === "appealed") return item.status === "appealed";
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
      <AdminNavbar />{adminDialog.element}

      <main className="admin-shell" id="ih-admin-content" tabIndex={-1} data-admin-release="admin-20261027"><AdminRefreshNotice warning={refreshWarning} onRefresh={() => { setRefreshWarning(""); loadAdminData().catch(() => setRefreshWarning("Nie udało się odświeżyć danych. Spróbuj ponownie.")); }} />
        <AdminPageHeading
          title={({queue:"Sprawy i spory",access:"Dostęp zespołu",activity:"Rejestr działań",security:"Zabezpieczenia"})[adminView] || "Sprawy i spory"}
          meta={staffRole === "owner" ? "Właściciel" : "Administrator"}
          description={({queue:"Sprawdź status sporu, opiekuna i ustalenia. Otwórz sprawę, aby przejrzeć dowody, zapisać decyzję lub obsłużyć odwołanie.",access:"Nadawaj i odbieraj uprawnienia administratorów. Każda zmiana wymaga potwierdzenia i jest zapisywana w rejestrze działań.",activity:"Sprawdź, kto i kiedy wykonał działanie. Wyszukuj w całym rejestrze, otwieraj powiązane sprawy i w razie potrzeby włącz kody techniczne."})[adminView] || "Narzędzia administracji IdeaHire."}
        />

        {message && <p className="dispute-page-message" role="status">{message}</p>}

        <AdminPane active={adminView==="queue"}><AdminMetrics items={[{label:"Aktywne sprawy",value:activeDisputes.length,onClick:()=>setFilter("active"),active:filter==="active"},{label:"Bez opiekuna",value:unassignedCount,onClick:()=>setFilter("unassigned"),active:filter==="unassigned"},{label:"Czekają na odpowiedź",value:awaitingCount,onClick:()=>setFilter("awaiting"),active:filter==="awaiting"},{label:"Odwołania",value:appealedCount,onClick:()=>setFilter("appealed"),active:filter==="appealed"}]} /></AdminPane>

        <div className="admin-content-grid">
          <AdminPane active={adminView==="queue"}><section className="dispute-panel admin-queue-panel">
            <div className="dispute-panel-heading">
              <div>
                <span className="dispute-eyebrow">Kolejka</span>
                <h2>Sprawy użytkowników</h2>
              </div>
              <span className="dispute-count-badge">{visibleDisputes.length}</span>
            </div>

            <AdminFilterBar search={queueSearch} onSearch={setQueueSearch} placeholder="Numer lub tytuł sprawy" filter={filter} onFilter={setFilter} options={[["active","Aktywne"],["unassigned","Bez opiekuna"],["mine","Moje"],["awaiting","Czekają na odpowiedź"],["appealed","Odwołania"],["closed","Zakończone"],["all","Wszystkie"]]} />

            {visibleDisputes.length === 0 ? (
              <p className="dispute-empty-copy">Brak spraw spełniających wybrany filtr.</p>
            ) : (
              <AdminHistory resetKey={`${filter}:${queueSearch}`} label="Strony spraw" previousLabel="Poprzednie" nextLabel="Następne"><div className="dispute-list is-admin">
                {visibleDisputes.map((item) => (
                  <DisputeListCard
                    key={item.id}
                    dispute={item}
                    userId={user.id}
                    adminView
                  />
                ))}
              </div></AdminHistory>
            )}
          </section></AdminPane>

          <aside className="admin-side-column">
            {isOwner && (
              <AdminPane active={adminView==="access"}><section className="dispute-panel owner-access-panel">
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
              </section></AdminPane>
            )}

            <AdminPane active={adminView==="activity"}><AdminActivityLog rows={auditLog} actorName={item=>getDisputeProfileName(profiles[item.actor_user_id],item.actor_role==="owner"?"Właściciel":"Administrator")} formatDate={formatDisputeDate}/></AdminPane>
          </aside></div>
      </main>
    </div>
  );
}

/* HOME */

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

  if (user?.id && ageRequired) {
    return <Navigate to="/account" replace />;
  }

  return (
    <App
      session={session}
      loading={loading}
      limitedAccess={isLimited}
      categoryGroups={JOB_CATEGORIES.map((value) => ({
        value,
        label: getJobCategoryLabel(value),
        subcategories: JOB_SUBCATEGORIES[value] || [],
      }))}
    />
  );
}

/* SMOOTH ROUTE TRANSITIONS */

function getRouteScrollTarget(pathname, hash) {
  // Account hashes select tabs. Scroll to their heading rather than the
  // matching form section further down the page, which hides the title.
  if (pathname === "/account" && getAccountWorkspaceSection(hash)) {
    return document.querySelector("#profile-studio:not([hidden])");
  }
  return document.getElementById(decodeURIComponent(hash.slice(1)));
}

function SmoothRouteTransitions() {
  const navigate = useRouterNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleInternalLink(event) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor =
        event.target?.closest?.("a[href]");

      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        anchor.closest("[data-preserve-router-state]") ||
        anchor.hasAttribute("data-no-route-transition")
      ) {
        return;
      }

      const target =
        anchor.getAttribute("target");

      if (target && target !== "_self") {
        return;
      }

      const nextUrl = new URL(
        anchor.href,
        window.location.href
      );

      if (
        nextUrl.origin !== window.location.origin ||
        nextUrl.protocol !== window.location.protocol
      ) {
        return;
      }

      // The help center is a separate HTML document, not a React route.
      // Native navigation loads it instead of the app's wildcard redirect.
      if (
        nextUrl.pathname === "/help" ||
        nextUrl.pathname.startsWith("/help/") ||
        /\.html?$/i.test(nextUrl.pathname)
      ) {
        return;
      }

      const currentAddress =
        `${location.pathname}${location.search}${location.hash}`;

      const nextAddress =
        `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

      const isSameDocument =
        nextUrl.pathname === location.pathname &&
        nextUrl.search === location.search;

      if (isSameDocument && nextUrl.hash) {
        event.preventDefault();

        if (nextAddress !== currentAddress) {
          navigate(nextAddress);
        }

        window.requestAnimationFrame(() => {
          getRouteScrollTarget(nextUrl.pathname, nextUrl.hash)
            ?.scrollIntoView({
              block: "start",
              behavior: "smooth",
            });
        });

        return;
      }

      if (
        nextAddress === currentAddress ||
        isSameDocument
      ) {
        return;
      }

      event.preventDefault();

      startFluidRouteTransition(
        () => navigate(nextAddress)
      );
    }

    document.addEventListener(
      "click",
      handleInternalLink,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleInternalLink,
        true
      );
    };
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
  ]);

  return null;
}

function RouteScrollManager() {
  const location = useLocation();
  const previousPath = useRef(null);

  useLayoutEffect(() => {
    const sameWorkspaceList = previousPath.current === location.pathname && ["/messages", "/work"].includes(location.pathname);
    previousPath.current = location.pathname;
    if (sameWorkspaceList) return;
    if (location.hash) {
      window.requestAnimationFrame(() => {
        getRouteScrollTarget(location.pathname, location.hash)
          ?.scrollIntoView({
            block: "start",
            behavior: "auto",
          });
      });
      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    location.hash,
    location.pathname,
    location.search,
  ]);

  return null;
}

/* ROUTER */

function LucynaDockHost() {
  const { user, loading: authLoading } = useAuth();
  const { isAdult, canTransact, loading: ageLoading, errorMessage: ageError } = useAgeAccess();
  const { isRestricted, loading: restrictionLoading, errorMessage: restrictionError } = useAccountRestriction();
  const { pathname } = useLocation();
  const { isStaff, staffLoading } = useStaffRole(user?.id);
  if (!canShowLucynaDock({ enabled: LUCYNA_VISIBLE, userId: user?.id, authLoading, ageLoading, ageError,
    isAdult, canTransact, restrictionLoading, restricted: isRestricted, restrictionError, pathname, isStaff, staffLoading })) return null;
  // A new owner receives a fresh window; drafts never survive a switch of account.
  return <LucynaDock key={user.id} supabase={supabase} user={user} administration={isStaff} />;
}

function AdminLucynaRoute() {
  const { user } = useAuth();
  return <div className="account-page admin-page"><AdminNavbar /><AdminLucynaDesk enabled={LUCYNA_VISIBLE}>
    <LucynaBoundary><React.Suspense fallback={<SubpageLoading label="Otwieram Lucynę…" />}><LucynaModule supabase={supabase} user={user} embedded administration /></React.Suspense></LucynaBoundary>
  </AdminLucynaDesk></div>;
}

function LucynaRoute() {
  const { user } = useAuth();
  if (!LUCYNA_VISIBLE) return <Navigate to="/account" replace />;
  return <LucynaBoundary><React.Suspense fallback={<><AccountNavbar />
    <p role="status" style={{ textAlign: "center", padding: 40 }}>Otwieram Lucynę AI…</p></>}>
    <LucynaModule supabase={supabase} user={user} Navbar={AccountNavbar} />
  </React.Suspense></LucynaBoundary>;
}

function ServiceRoute({ mode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canTransact, loading: ageLoading } = useAgeAccess();

  if (mode === "freelancers") return <FreelancerDirectory supabase={supabase} user={user}
    navigate={navigate} Navbar={AccountNavbar} canContact={!ageLoading && canTransact} />;

  return (
    <ServiceMarketplace
      mode={mode}
      supabase={supabase}
      user={user}
      navigate={navigate}
      Navbar={AccountNavbar}
    />
  );
}

/* Decorative cursor trail shared by every route. No pointer interception. */
function Router() {
  return (
    <BrowserRouter>
      <AmbientBackground />
      <SmoothRouteTransitions />
      <RouteScrollManager />
      <SubpageTheme />
      <AuthProvider>
        <StaffRoleProvider>
          <AccountRestrictionProvider>
            <AgeAccessProvider>
            <DiscoveryPreferencesProvider>
            <RegistrationDraftProvider>
            <LoginOpening />
            <LucynaDockHost />
            <Sorts />

        <DiscoveryOnboardingLayer />

        

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
            element={<><CookiePolicy /><RegistrationInterviewPrivacy cookies /></>}
          />

          <Route
            path="/polityka-prywatnosci"
            element={<><PrivacyPolicy /><RegistrationInterviewPrivacy /></>}
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

          <Route path="/lucyna" element={
            <ProtectedRoute><UserOnlyRoute allowLimited><LucynaRoute /></UserOnlyRoute></ProtectedRoute>
          } />

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

          <Route path="/talent" element={<Navigate to="/freelancers" replace />} />

          <Route path="/freelancers" element={
            <ProtectedRoute><UserOnlyRoute allowLimited><ServiceRoute mode="freelancers" /></UserOnlyRoute></ProtectedRoute>
          } />

          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <ServiceRoute mode="list" />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services/new"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <ServiceRoute mode="new" />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services/mine"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <ServiceRoute mode="mine" />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services/:id/edit"
            element={
              <ProtectedRoute>
                <UserOnlyRoute>
                  <ServiceRoute mode="edit" />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/services/:id"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <ServiceRoute mode="detail" />
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
            path="/calendar"
            element={
              <ProtectedRoute>
                <UserOnlyRoute allowLimited>
                  <Calendar />
                </UserOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route path="/work" element={
            <ProtectedRoute><UserOnlyRoute><WorkOverview /></UserOnlyRoute></ProtectedRoute>
          } />

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

          <Route path="/admin/lucyna" element={<ProtectedRoute><StaffOnlyRoute><AdminLucynaRoute /></StaffOnlyRoute></ProtectedRoute>} />

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
            path="/admin/moderation/job/:moderationJobId"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminModerationErrorBoundary>
                    <AdminModeration />
                  </AdminModerationErrorBoundary>
                </StaffOnlyRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute>
                <StaffOnlyRoute>
                  <AdminModerationErrorBoundary>
                    <AdminModeration />
                  </AdminModerationErrorBoundary>
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
            </RegistrationDraftProvider>
            </DiscoveryPreferencesProvider>
            </AgeAccessProvider>
          </AccountRestrictionProvider>
        </StaffRoleProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default Router;

