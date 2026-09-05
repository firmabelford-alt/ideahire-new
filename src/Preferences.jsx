import React, { useEffect, useState } from "react";

const THEME_KEY = "ideahire_theme";
const LANGUAGE_KEY = "ideahire_language";
const COOKIE_NOTICE_KEY = "ideahire_cookie_notice_v1";
const COOKIE_NOTICE_VERSION = "2026-09-04-v1";
const COOKIE_NOTICE_LIFETIME = 365 * 24 * 60 * 60 * 1000;

const originalTextByNode = new WeakMap();
const translatedTextByNode = new WeakMap();
const originalAttributesByElement = new WeakMap();
const translatedAttributesByElement = new WeakMap();

const EXACT_TRANSLATIONS = Object.freeze({
  "Akceptuj wykonawcę": "Accept contractor",
  "Akceptowanie...": "Accepting...",
  "Aktywne": "Active",
  "Aktualne zlecenie": "Current job",
  "bez zbędnych kroków": "without unnecessary steps",
  "Brak wyników": "No results",
  "Brak zleceń": "No jobs",
  "Budżet": "Budget",
  "Budżet (zł)": "Budget (PLN)",
  "Budżet:": "Budget:",
  "Cena jest ustalana przy publikacji zlecenia i nie może być później zmieniana.": "The price is set when the job is published and cannot be changed later.",
  "Cena zlecenia pozostaje bez zmian.": "The job price remains unchanged.",
  "Cena została ustalona przy publikacji i nie może być edytowana.": "The price was set at publication and cannot be edited.",
  "Cena została ustalona przy publikacji.": "The price was set at publication.",
  "Czat negocjacyjny jest otwarty. Możecie omawiać i zmieniać propozycję, ale realizacja zlecenia rozpocznie się dopiero po wspólnej akceptacji warunków.": "The negotiation chat is open. You can discuss and revise the proposal, but the job will start only after both parties accept the terms.",
  "Czat negocjacyjny jest aktywny · realizacja ruszy po wspólnej akceptacji": "Negotiation chat is active · work starts after mutual acceptance",
  "Czego szukasz?": "What are you looking for?",
  "Cześć,": "Hello,",
  "Decyzja dotycząca zgłoszenia": "Application decision",
  "Decyzje dotyczące Twoich zgłoszeń": "Decisions about your applications",
  "Dla Ciebie": "For you",
  "Dla wykonawców": "For contractors",
  "Dla zlecających": "For clients",
  "Dobra wiadomość": "Good news",
  "Dodaj": "Add",
  "Dodaj konkretne narzędzia i umiejętności. Każda pozycja pojawi się na profilu jako osobny kafelek.": "Add specific tools and skills. Each item will appear on your profile as a separate tag.",
  "Dodaj pierwsze zlecenie, aby pojawiło się tutaj.": "Post the first job to make it appear here.",
  "Dodaj zlecenie": "Post a job",
  "Dodaj zlecenie →": "Post a job →",
  "Dołącz do IdeaHire": "Join IdeaHire",
  "Bezpieczeństwo konta": "Account safety",
  "Data urodzenia": "Date of birth",
  "Data pozostaje prywatna i służy wyłącznie do ustalenia uprawnień konta.": "Your date of birth remains private and is used only to determine account permissions.",
  "Wpisz prawidłową datę urodzenia.": "Enter a valid date of birth.",
  "Konto IdeaHire można utworzyć po ukończeniu 16 lat.": "You can create an IdeaHire account after turning 16.",
  "Utworzysz konto ograniczone. Pełne funkcje zostaną udostępnione po ukończeniu 18 lat.": "You will create a limited account. Full features will become available after you turn 18.",
  "Spełniasz wymaganie wieku dla pełnego konta IdeaHire.": "You meet the age requirement for a full IdeaHire account.",
  "Pełne konto 18+": "Full account 18+",
  "Konto ograniczone 16–17": "Limited account 16–17",
  "Konto niedostępne": "Account unavailable",
  "Potwierdź prawidłowość podanej daty urodzenia.": "Confirm that the date of birth you entered is correct.",
  "Potwierdzam prawidłowość daty urodzenia.": "I confirm that my date of birth is correct.",
  "Potwierdź zapoznanie się z Polityką prywatności.": "Confirm that you have read the Privacy Policy.",
  "Zapoznałem się z Polityką prywatności.": "I have read the Privacy Policy.",
  "Dokument wyjaśnia, jak IdeaHire przetwarza i chroni dane.": "This document explains how IdeaHire processes and protects data.",
  "Otwórz Politykę prywatności": "Open the Privacy Policy",
  "Osoby w wieku 16–17 lat otrzymują konto ograniczone. Pełne funkcje płatnych zleceń są dostępne od 18 lat.": "Users aged 16–17 receive a limited account. Full paid-job features are available from age 18.",
  "Uzupełnij datę urodzenia": "Enter your date of birth",
  "Potrzebujemy jej wyłącznie do przyznania właściwych uprawnień konta. Data nie będzie widoczna na Twoim profilu.": "We need it only to assign the correct account permissions. The date will not be visible on your profile.",
  "Po zapisaniu samodzielna zmiana daty nie będzie możliwa.": "After saving, you will not be able to change the date yourself.",
  "Zapisz i kontynuuj →": "Save and continue →",
  "Nie udało się sprawdzić uprawnień wiekowych konta.": "Account age permissions could not be checked.",
  "Nie udało się zapisać daty urodzenia.": "The date of birth could not be saved.",
  "Konto ograniczone": "Limited account",
  "Możesz bezpiecznie poznawać IdeaHire. Funkcje związane z umowami i płatnymi zleceniami zostaną udostępnione po ukończeniu 18 lat.": "You can safely explore IdeaHire. Features involving agreements and paid jobs will become available after you turn 18.",
  "Ta funkcja jest dostępna wyłącznie dla pełnych kont 18+.": "This feature is available only to full 18+ accounts.",
  "Konto młodzieżowe 16–17": "Youth account 16–17",
  "Nie musisz ponownie zakładać konta. Wiek jest obliczany automatycznie na podstawie zapisanej, prywatnej daty urodzenia.": "You do not need to create another account. Your age is calculated automatically from your stored private date of birth.",
  "Dostępne teraz": "Available now",
  "przeglądanie zleceń,": "browsing jobs,",
  "przeglądanie publicznych profili,": "browsing public profiles,",
  "ustawienia języka i wyglądu strony.": "language and appearance settings.",
  "Przeglądaj zlecenia →": "Browse jobs →",
  "Dostępne od 18 lat": "Available from age 18",
  "publikowanie i przyjmowanie zleceń,": "posting and accepting jobs,",
  "wiadomości i formularze współpracy,": "messages and work agreement forms,",
  "płatności oraz otwieranie nowych sporów.": "payments and opening new disputes.",
  "Twoja data urodzenia pozostaje prywatna": "Your date of birth remains private",
  "Nie wyświetlamy jej na profilu ani innym użytkownikom. Jeżeli została podana błędnie, korektę przeprowadzi pomoc IdeaHire.": "We do not display it on your profile or to other users. If it was entered incorrectly, IdeaHire support can correct it.",
  "Pełne konto · 18+": "Full account · 18+",
  "Przeglądanie dostępne": "Browsing available",
  "Na koncie ograniczonym możesz oglądać zlecenia i profile. Zgłaszanie się do płatnych zleceń zostanie odblokowane po ukończeniu 18 lat.": "With a limited account you can view jobs and profiles. Applying for paid jobs will be unlocked after you turn 18.",
  "Zgłaszanie się do płatnych zleceń jest dostępne od 18 lat.": "Applying for paid jobs is available from age 18.",
  "Uzupełnij datę urodzenia, aby korzystać z tej funkcji.": "Enter your date of birth to use this feature.",
  "Konto IdeaHire jest dostępne od ukończenia 16 lat.": "IdeaHire accounts are available from age 16.",
  "Data urodzenia została już zapisana. Korektę może przeprowadzić pomoc IdeaHire.": "Your date of birth has already been saved. IdeaHire support can correct it.",
  "Płatne zlecenie może połączyć wyłącznie dwa pełne konta 18+.": "A paid job can connect only two full 18+ accounts.",
  "Rozmowę dotyczącą zlecenia mogą utworzyć wyłącznie dwa pełne konta 18+.": "A job conversation can be created only between two full 18+ accounts.",
  "Edycja zlecenia": "Edit job",
  "Edytuj": "Edit",
  "Edytuj zlecenie": "Edit job",
  "E-mail": "Email",
  "Fotografia": "Photography",
  "Grafika i design": "Graphics and design",
  "Gdy ktoś zgłosi się do Twojego zlecenia albo pojawi się decyzja dotycząca Twojego zgłoszenia, zobaczysz ją tutaj.": "When someone applies for your job or a decision is made about your application, you will see it here.",
  "Gdy zgłoszenie zostanie zaakceptowane, rozmowa pojawi się właśnie tutaj.": "When an application is accepted, the conversation will appear here.",
  "Hasła nie są takie same.": "The passwords do not match.",
  "Hasło": "Password",
  "Hasło musi mieć co najmniej 6 znaków.": "The password must contain at least 6 characters.",
  "Hasło zostało zmienione. Możesz zalogować się nowym hasłem.": "Your password has been changed. You can sign in with the new password.",
  "IdeaHire łączy osoby szukające wykonawców z ludźmi, którzy potrafią zamienić pomysł w gotowy projekt.": "IdeaHire connects people looking for contractors with people who can turn an idea into a finished project.",
  "Identyfikacja wizualna marki": "Brand visual identity",
  "Imię / nazwa": "Name",
  "Informacje o profilach": "Profile information",
  "Jak to działa": "How it works",
  "JPG, PNG lub WEBP. Zdjęcie zostanie automatycznie przycięte do 400 × 400 px.": "JPG, PNG or WEBP. The image will be automatically cropped to 400 × 400 px.",
  "Kategoria": "Category",
  "Kategorie": "Categories",
  "Kategorie specjalizacji": "Specialization categories",
  "Kliknij, aby otworzyć ukryty profil": "Click to open the hidden profile",
  "Kliknij, aby zobaczyć profil": "Click to view profile",
  "Kolejne zlecenie": "Next job",
  "Konto zostało utworzone. Sprawdź e-mail i potwierdź adres.": "Your account has been created. Check your email and confirm the address.",
  "Link do resetowania hasła został wysłany na podany adres e-mail.": "A password reset link has been sent to the provided email address.",
  "Link jest nieprawidłowy albo wygasł.": "The link is invalid or has expired.",
  "Ładowanie powiadomień...": "Loading notifications...",
  "Ładowanie rozmowy...": "Loading conversation...",
  "Ładowanie rozmów...": "Loading conversations...",
  "Ładowanie zleceń...": "Loading jobs...",
  "Ładowanie...": "Loading...",
  "Masz coś do zaoferowania?": "Have something to offer?",
  "Masz coś do zrobienia?": "Need something done?",
  "Masz już konto?": "Already have an account?",
  "Masz pomysł.": "You have an idea.",
  "Miejsce, gdzie pomysły spotykają ludzi": "Where ideas meet people",
  "Moje konto": "My account",
  "Moje zlecenia": "My jobs",
  "Możesz dodać maksymalnie 12 umiejętności.": "You can add up to 12 skills.",
  "Możesz wybrać maksymalnie 3 kategorie specjalizacji.": "You can select up to 3 specialization categories.",
  "Mój profil": "My profile",
  "Musisz być zalogowany.": "You must be signed in.",
  "Na razie nie ma żadnych zleceń.": "There are no jobs yet.",
  "Napisz kilka słów o sobie...": "Write a few words about yourself...",
  "Napisz pierwszą wiadomość i ustal szczegóły współpracy.": "Send the first message and agree on the details.",
  "Napisz wiadomość...": "Write a message...",
  "Nie masz jeszcze rozmów": "You have no conversations yet",
  "Nie masz jeszcze żadnych zleceń.": "You have not posted any jobs yet.",
  "Nie masz nowych powiadomień.": "You have no new notifications.",
  "Nie możesz zgłosić się do własnego zlecenia.": "You cannot apply for your own job.",
  "Nie pamiętasz hasła?": "Forgot your password?",
  "Nie znaleziono kraju": "Country not found",
  "Nie znaleziono profilu.": "Profile not found.",
  "Nie znaleziono zlecenia.": "Job not found.",
  "Nie znaleźliśmy takiego zlecenia.": "We could not find such a job.",
  "Nieznany błąd": "Unknown error",
  "Najnowsze zlecenia": "Latest jobs",
  "Nowoczesna strona internetowa": "Modern website",
  "Nowe hasło": "New password",
  "Nowe zgłoszenie": "New application",
  "Nowe zlecenie": "New job",
  "Od małych zadań po większe projekty. Wybierz kategorię i zacznij szukać.": "From small tasks to larger projects. Choose a category and start searching.",
  "Odblokuj użytkownika": "Unblock user",
  "Odrzucanie...": "Rejecting...",
  "Odrzuć": "Reject",
  "Opinie": "Reviews",
  "Opis": "Description",
  "Opis będzie widoczny na Twoim profilu.": "The description will be visible on your profile.",
  "Opisz konkretnie swoje najmocniejsze umiejętności, doświadczenie i rodzaj projektów, które realizujesz.": "Describe your strongest skills, experience and the types of projects you deliver.",
  "Opisz krótko swoje zlecenie.": "Briefly describe your job.",
  "Opisz potrzebę": "Describe your need",
  "Opisz projekt, wybierz kategorię i ustaw prosty budżet.": "Describe the project, choose a category and set a clear budget.",
  "Opisz swój projekt": "Describe your project",
  "Opublikowano:": "Published:",
  "Opublikowano": "Published",
  "Opublikuj zlecenie →": "Publish job →",
  "O mnie": "About me",
  "Otwórz profil:": "Open profile:",
  "Pamiętasz hasło?": "Remember your password?",
  "Podaj adres e-mail przypisany do Twojego konta. Wyślemy Ci link do ustawienia nowego hasła.": "Enter the email address assigned to your account. We will send you a link to set a new password.",
  "Pokaż swoje umiejętności, znajdź interesujące projekty i rozwijaj swoje portfolio.": "Show your skills, find interesting projects and grow your portfolio.",
  "Pokaż zlecenia:": "Show jobs:",
  "Potrzebuję nowoczesnej": "I need a modern",
  "Potrzebuję spójnego logo oraz podstawowych materiałów graficznych.": "I need a consistent logo and essential brand materials.",
  "Powiadomienia": "Notifications",
  "Polityka cookies": "Cookies policy",
  "Polityka prywatności": "Privacy Policy",
  "Powiedz nam, czego potrzebujesz i określ podstawowe szczegóły projektu.": "Tell us what you need and provide the basic project details.",
  "Powtórz nowe hasło": "Repeat new password",
  "Pozytywne:": "Positive:",
  "Profil został zapisany.": "Profile saved.",
  "Programowanie": "Programming",
  "Projekt zakończony": "Project completed",
  "Prościej się nie da.": "It could not be simpler.",
  "Przeglądaj zlecenia opublikowane przez użytkowników IdeaHire.": "Browse jobs published by IdeaHire users.",
  "Przejdź do konta →": "Go to account →",
  "Przejdź do rozmowy →": "Go to conversation →",
  "Przejrzyj zgłoszenia i wybierz wykonawcę, który najlepiej pasuje do Twojego projektu.": "Review applications and choose the contractor who best fits your project.",
  "Reset hasła": "Password reset",
  "Rozmowa dotycząca zlecenia": "Job conversation",
  "Rozmowa jest przygotowywana. Odśwież powiadomienia za chwilę.": "The conversation is being prepared. Refresh notifications in a moment.",
  "Rozmowa została otwarta — napisz pierwszą wiadomość.": "The conversation has been opened — send the first message.",
  "Rozmowa została otwarta.": "The conversation has been opened.",
  "Skąd jesteś?": "Where are you from?",
  "Sporne:": "Disputed:",
  "Spróbuj użyć innej frazy albo wybierz inną kategorię.": "Try another phrase or choose a different category.",
  "Szukaj zleceń": "Search jobs",
  "Szukam osoby, która stworzy prostą i szybką stronę dla nowej marki.": "I am looking for someone to create a simple and fast website for a new brand.",
  "Teksty na stronę firmową": "Copy for a company website",
  "Ta umiejętność jest już dodana.": "This skill has already been added.",
  "Ten użytkownik nie ma jeszcze opublikowanych zleceń.": "This user has not published any jobs yet.",
  "To jest Twoje zlecenie.": "This is your job.",
  "Tutaj znajdziesz wszystkie rozmowy rozpoczęte po zaakceptowaniu wykonawcy.": "Here you will find all conversations started after accepting a contractor.",
  "Tutaj znajdziesz zgłoszenia wykonawców oraz decyzje dotyczące Twoich własnych zgłoszeń.": "Here you will find contractor applications and decisions about your own applications.",
  "Twoja sesja wygasła.": "Your session has expired.",
  "Twoje imię": "Your name",
  "Twoje konto": "Your account",
  "Twoje rozmowy": "Your conversations",
  "Twoje zgłoszenie nie zostało zaakceptowane": "Your application was not accepted",
  "Twoje zgłoszenie zostało zaakceptowane": "Your application was accepted",
  "Twój następny projekt": "Your next project",
  "Tytuł": "Title",
  "Ukryj szczegóły ↑": "Hide details ↑",
  "Umiejętności": "Skills",
  "Ustal szczegóły, rozpocznij współpracę i doprowadź projekt do końca.": "Agree on the details, start working together and complete the project.",
  "Ustaw nowe hasło": "Set a new password",
  "Ustaw nowe hasło →": "Set new password →",
  "Usuń": "Delete",
  "Usuń rozmowę": "Delete conversation",
  "Usuń umiejętność:": "Remove skill:",
  "Utwórz hasło": "Create password",
  "Utwórz konto": "Create account",
  "Utwórz konto →": "Create account →",
  "Użytkownik": "User",
  "Użytkownik został odblokowany.": "The user has been unblocked.",
  "Użytkownik został zablokowany. Nie może już wysyłać Ci wiadomości.": "The user has been blocked and can no longer message you.",
  "W czym się specjalizujesz?": "What do you specialize in?",
  "W czym się specjalizuję": "What I specialize in",
  "Wiadomości": "Messages",
  "Więcej opcji": "More options",
  "Więcej opcji profilu": "More profile options",
  "Wpisz hasło ponownie": "Enter the password again",
  "Wpisz nazwę zlecenia.": "Enter the job title.",
  "Wpisz nowe hasło": "Enter a new password",
  "Wpisz nowe hasło do swojego konta.": "Enter a new password for your account.",
  "Wpisz swoje hasło": "Enter your password",
  "Wróć do logowania": "Back to sign in",
  "Wróć na stronę główną": "Back to home",
  "Wybierz kraj": "Choose a country",
  "Wybierz kraj, który będzie widoczny na Twoim profilu.": "Choose the country that will be visible on your profile.",
  "Wybierz maksymalnie 3 obszary, w których najlepiej się odnajdujesz.": "Choose up to 3 areas in which you are strongest.",
  "Wybierz osobę": "Choose a person",
  "Wybierz plik graficzny.": "Choose an image file.",
  "Wyczyść filtry": "Clear filters",
  "Wyczyść przeczytane": "Clear read",
  "Wyczyść wyszukiwanie": "Clear search",
  "Wyczyść wyszukiwanie →": "Clear search →",
  "Wykonane zlecenia": "Completed jobs",
  "Wyloguj się": "Sign out",
  "Wybrano:": "Selected:",
  "Wysyłanie...": "Sending...",
  "Wyszukaj kraj...": "Search country...",
  "Wyszukiwarka zleceń": "Job search",
  "Wyślij": "Send",
  "Wyślij link →": "Send link →",
  "Wyświetlono": "Seen",
  "Zaakceptowane zgłoszenia": "Accepted applications",
  "Zablokowany użytkownik": "Blocked user",
  "Zablokuj użytkownika": "Block user",
  "zaczyna się tutaj.": "starts here.",
  "Zakończone:": "Completed:",
  "Zaloguj się": "Sign in",
  "Zaloguj się →": "Sign in →",
  "Zaloguj się do swojego konta IdeaHire.": "Sign in to your IdeaHire account.",
  "Załóż konto i zacznij korzystać z IdeaHire.": "Create an account and start using IdeaHire.",
  "Zapisz zmiany →": "Save changes →",
  "Zapisywanie...": "Saving...",
  "Zarządzaj swoim profilem IdeaHire.": "Manage your IdeaHire profile.",
  "Zdjęcie profilowe": "Profile picture",
  "Zdjęcie profilowe zostało zapisane.": "Profile picture saved.",
  "Zdjęcie, nazwa, opis i aktywność tego profilu są ukryte.": "This profile's picture, name, description and activity are hidden.",
  "Zgłoszenia do Twoich zleceń": "Applications for your jobs",
  "Zgłoszenie wysłano:": "Application sent:",
  "Zgłoszenie zostało wysłane do zleceniodawcy.": "Your application has been sent to the client.",
  "Zgłoszenie:": "Application:",
  "Zlecę przygotowanie przejrzystych tekstów do sześciu podstron.": "I need clear copy prepared for six subpages.",
  "Zgłoszono ✓": "Applied ✓",
  "Zgłoś się do zlecenia →": "Apply for job →",
  "zlecenia": "jobs",
  "Zlecenia": "Jobs",
  "Zlecenia tego użytkownika": "This user's jobs",
  "Zlecenia, które opublikowałeś": "Jobs you have published",
  "zlecenie": "job",
  "Zlecenie": "Job",
  "Zlecenie zostało opublikowane.": "The job has been published.",
  "Zlecenie:": "Job:",
  "zleceń": "jobs",
  "Zmiana możliwości kontaktu": "Contact permission changed",
  "Znajdź dokładnie to,": "Find exactly",
  "Znajdź kogoś,": "Find someone",
  "znajdź odpowiednią osobę": "find the right person",
  "Znajdź osobę, która ma odpowiednie umiejętności i może zająć się Twoim projektem.": "Find someone with the right skills to handle your project.",
  "Znajdź wykonawcę": "Find a contractor",
  "Znajdź zlecenia →": "Find jobs →",
  "Znajdź zlecenie": "Find a job",
  "Zobacz profil →": "View profile →",
  "Zobacz profil zleceniodawcy →": "View client profile →",
  "Zobacz zlecenie →": "View job →",
  "Negatywne:": "Negative:",
  "Neutralne:": "Neutral:",
  "Wszystkie": "All",
  "zł": "PLN",
  "3 zgłoszenia": "3 applications",
  "Logowanie nie utworzyło aktywnej sesji.": "Sign-in did not create an active session.",
  "Nie udało się aktywować linku resetującego. Poproś o nowy link i otwórz najnowszą wiadomość.": "The reset link could not be activated. Request a new link and open the latest email.",
  "Sesja resetowania hasła nie jest aktywna. Poproś o nowy link resetujący.": "The password reset session is not active. Request a new reset link.",
  "Supabase nie potwierdził zmiany hasła.": "The password change was not confirmed.",
  "Supabase nie zwrócił użytkownika.": "No user was returned.",
  "Zdjęcie ma nieprawidłowe wymiary.": "The image has invalid dimensions.",
  "Przeglądarka nie obsługuje Canvas.": "Your browser does not support Canvas.",
  "Nie udało się skonwertować zdjęcia.": "The image could not be converted.",
  "Nie udało się odczytać zdjęcia.": "The image could not be read.",
  "Zdjęcie może mieć maksymalnie 10 MB.": "The image can be up to 10 MB.",
  "Nie udało się pobrać adresu zdjęcia.": "The image URL could not be retrieved.",
  "Imię / nazwa nie może być puste.": "The name cannot be empty.",
  "Czy na pewno chcesz usunąć to zlecenie?": "Are you sure you want to delete this job?",
  "Np. tworzę nowoczesne strony internetowe, projektuję identyfikację wizualną i dbam o czytelne doświadczenie użytkownika...": "For example: I build modern websites, design visual identities and create clear user experiences...",
  "Budżet musi być większy od 0.": "The budget must be greater than 0.",
  "Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości między Wami jest wyłączone.": "This user blocked your profile. Messaging between you is disabled.",
  "Brak aktywnej sesji użytkownika.": "No active user session.",
  "Nie znaleziono tego zgłoszenia. Odśwież stronę i spróbuj ponownie.": "This application was not found. Refresh the page and try again.",
  "Zgłoszenie nie zawiera kompletnych danych.": "The application does not contain complete data.",
  "Nie udało się utworzyć rozmowy.": "The conversation could not be created.",
  "Rozmowa została przygotowana, ale nie udało się zmienić statusu zgłoszenia na accepted.": "The conversation was prepared, but the application status could not be changed to accepted.",
  "chce wykonać Twoje zlecenie": "wants to complete your job",
  "zablokował Twój profil": "blocked your profile",
  "Nie możecie obecnie wysyłać sobie wiadomości. Informację możesz usunąć przyciskiem „Wyczyść przeczytane”.": "You cannot message each other at the moment. You can remove this notice with the Clear read button.",
  "Zleceniodawca wybrał Cię do realizacji tego zlecenia. Możecie teraz ustalić szczegóły współpracy w prywatnej rozmowie.": "The client selected you for this job. You can now agree on the details in a private conversation.",
  "Zleceniodawca zdecydował się nie kontynuować współpracy w ramach tego zgłoszenia. Możesz nadal przeglądać pozostałe zlecenia i zgłaszać się do kolejnych ofert.": "The client decided not to continue with this application. You can still browse other jobs and apply for more offers.",
  "Nie udało się pobrać rozmów.": "Conversations could not be loaded.",
  "Nie udało się otworzyć rozmowy.": "The conversation could not be opened.",
  "Nie udało się wysłać wiadomości.": "The message could not be sent.",
  "Usunąć tę rozmowę z Twojej listy? Druga osoba nadal zachowa historię wiadomości.": "Remove this conversation from your list? The other person will keep the message history.",
  "← Wróć": "← Back",
  "Rozmowa została otwarta. Napisz pierwszą wiadomość i ustal szczegóły współpracy.": "The conversation is open. Send the first message and agree on the details.",
  "Zablokowałeś tego użytkownika. Otwórz ukryty profil i użyj menu z trzema kropkami, aby go odblokować.": "You blocked this user. Open the hidden profile and use the three-dot menu to unblock them.",
  "Ten użytkownik zablokował Twój profil. Wysyłanie wiadomości w tej rozmowie jest wyłączone.": "This user blocked your profile. Messaging in this conversation is disabled.",
  "Brak identyfikatora użytkownika.": "Missing user identifier.",
  "Nie udało się zaakceptować wykonawcy.": "The contractor could not be accepted.",
  "Odrzucić to zgłoszenie? Wykonawca otrzyma informację, że jego zgłoszenie nie zostało zaakceptowane.": "Reject this application? The contractor will be informed that the application was not accepted.",
  "Nie udało się odrzucić zgłoszenia. Odśwież stronę i spróbuj ponownie.": "The application could not be rejected. Refresh the page and try again.",
  "Nie udało się odrzucić zgłoszenia.": "The application could not be rejected.",
  "Nieprawidłowy adres e-mail lub hasło. Jeśli nie pamiętasz hasła, użyj opcji resetowania poniżej.": "Incorrect email address or password. If you do not remember your password, use the reset option below.",
  "Adres e-mail nie został jeszcze potwierdzony. Otwórz wiadomość rejestracyjną i potwierdź konto.": "The email address has not been confirmed yet. Open the registration email and confirm your account.",
  "Nie udało się połączyć z serwerem logowania. Sprawdź internet i spróbuj ponownie.": "Could not connect to the sign-in server. Check your internet connection and try again.",
  "/12. Naciśnij Enter lub przecinek, aby szybko dodać pozycję.": "/12. Press Enter or a comma to quickly add an item.",
  "1 500–3 000 zł": "PLN 1,500–3,000",
  "Adres e-mail": "Email address",
  "Czego potrzebujesz?": "What do you need?",
  "czego potrzebujesz.": "what you need.",
  "Dodano:": "Added:",
  "kto go zrealizuje.": "who can make it happen.",
  "Nie masz jeszcze konta?": "Don't have an account yet?",
  "Odzyskiwanie konta": "Account recovery",
  "Prosto": "Simple",
  "Prosto. Szybko. Skutecznie.": "Simple. Fast. Effective.",
  "realizuj swoje projekty": "complete your projects",
  "Skrzynka jest pusta": "Your inbox is empty",
  "Skrzynka odbiorcza": "Inbox",
  "Skutecznie": "Effective",
  "strony internetowej": "website",
  "Szybko": "Fast",
  "Trzy kroki. Jeden konkretny cel.": "Three steps. One clear goal.",
  "Witaj ponownie": "Welcome back",
  "Wszystko gotowe": "Everything is ready",
  "Zacznij teraz": "Get started",
  "Zrealizuj projekt": "Complete the project",
  "Np. 3000": "e.g. 3000",
  "Np. Adobe Illustrator": "e.g. Adobe Illustrator",
  "Wpisz adres e-mail.": "Enter your email address.",
  "Ładowanie warunków współpracy...": "Loading collaboration terms...",
  "Warunki współpracy zaakceptowane": "Collaboration terms accepted",
  "Warunki współpracy": "Collaboration terms",
  "Podsumowanie płatności": "Payment summary",
  "Bezpieczne rozliczenie": "Secure payment",
  "Kwoty zostały obliczone i zapisane po zaakceptowaniu warunków przez obie strony.": "The amounts were calculated and recorded after both parties accepted the terms.",
  "Oczekuje na płatność": "Awaiting payment",
  "Płatność rozpoczęta": "Payment started",
  "Płatność jest przetwarzana": "Payment is processing",
  "Środki są zabezpieczone": "Funds are secured",
  "Praca została przekazana": "Work submitted",
  "Wypłata jest przygotowywana": "Payout is being prepared",
  "Środki zostały przekazane": "Funds released",
  "Zwrot jest przygotowywany": "Refund is being prepared",
  "Wykonano częściowy zwrot": "Partially refunded",
  "Zwrot został wykonany": "Refund completed",
  "Płatność objęta sporem": "Payment under dispute",
  "Płatność nie powiodła się": "Payment failed",
  "Płatność została anulowana": "Payment cancelled",
  "Status płatności": "Payment status",
  "Ładowanie podsumowania płatności...": "Loading payment summary...",
  "Spróbuj ponownie": "Try again",
  "Pełna kwota wynagrodzenia wykonawcy": "The contractor's full payment",
  "Opłata IdeaHire": "IdeaHire fee",
  "7,5% · minimum 20 zł · maksimum 300 zł": "7.5% · minimum PLN 20 · maximum PLN 300",
  "Wykonawca otrzyma": "Contractor receives",
  "Bez potrącania opłaty IdeaHire": "No IdeaHire fee deducted",
  "Razem do zapłaty": "Total to pay",
  "Zleceniodawca zapłaci": "Client will pay",
  "Cena zlecenia wraz z opłatą IdeaHire": "Job price including the IdeaHire fee",
  "Płatność nie została jeszcze pobrana": "Payment has not been collected yet",
  "Czekamy na płatność zleceniodawcy": "Awaiting the client's payment",
  "Bezpieczna płatność online zostanie uruchomiona w następnym etapie wdrożenia.": "Secure online payment will be enabled in the next implementation stage.",
  "O rozpoczęciu i zabezpieczeniu płatności poinformujemy Cię w tym miejscu.": "We will notify you here when the payment is started and secured.",
  "Odświeżanie...": "Refreshing...",
  "Odśwież status": "Refresh status",
  "Przygotowujemy podsumowanie płatności dla zaakceptowanych warunków.": "We are preparing the payment summary for the accepted terms.",
  "Nie udało się pobrać podsumowania płatności. Odśwież stronę i spróbuj ponownie.": "The payment summary could not be loaded. Refresh the page and try again.",
  "Wpisz prawidłową kwotę zaliczki. Może wynosić 0 zł.": "Enter a valid deposit amount. It may be PLN 0.",
  "Zaliczka": "Deposit",
  "Zaliczka *": "Deposit *",
  "Zaliczka może być zmieniana w kolejnych propozycjach do wspólnej akceptacji i nie może przekroczyć ceny zlecenia.": "The deposit can be changed in subsequent proposals until mutual acceptance and cannot exceed the job price.",
  "Zaliczka nie może być wyższa niż cena zlecenia.": "The deposit cannot exceed the job price.",
  "Wersja": "Version",
  "· Czat jest aktywny": "· Chat is active",
  "Czat jest aktywny": "Chat is active",
  "Pokaż ustalenia": "View terms",
  "Ta zaakceptowana wersja jest zapisem ustaleń obu stron i pozostaje dostępna w historii rozmowy.": "This accepted version records both parties' terms and remains available in the conversation history.",
  "Ustalenia przed rozpoczęciem": "Terms before you begin",
  "Najpierw ustalcie warunki współpracy": "Agree on the collaboration terms first",
  "Czat odblokuje się, gdy obie strony zaakceptują dokładnie tę samą wersję ustaleń.": "Chat will unlock when both parties accept exactly the same version of the terms.",
  "Postęp akceptacji": "Acceptance progress",
  "Twoja akceptacja": "Your acceptance",
  "Akceptacja drugiej strony": "Other party's acceptance",
  "Pierwsza propozycja": "First proposal",
  "Warunki realizacji zlecenia": "Job delivery terms",
  "Pola oznaczone gwiazdką są wymagane.": "Fields marked with an asterisk are required.",
  "Nazwa zlecenia": "Job name",
  "Nazwa zlecenia *": "Job name *",
  "Np. Projekt strony internetowej": "e.g. Website design",
  "Zakres pracy": "Scope of work",
  "Zakres pracy *": "Scope of work *",
  "Opisz dokładnie, co ma zostać wykonane...": "Describe exactly what needs to be completed...",
  "Rezultat końcowy": "Final deliverables",
  "Rezultat końcowy *": "Final deliverables *",
  "Wymień pliki, materiały lub funkcje, które mają zostać przekazane...": "List the files, materials or features that must be delivered...",
  "Cena": "Price",
  "Cena *": "Price *",
  "Waluta": "Currency",
  "Termin wykonania": "Delivery deadline",
  "Termin wykonania *": "Delivery deadline *",
  "Liczba poprawek": "Number of revisions",
  "Liczba poprawek *": "Number of revisions *",
  "Format przekazania pracy": "Delivery format",
  "Format przekazania pracy *": "Delivery format *",
  "Np. PDF, PNG i pliki źródłowe": "e.g. PDF, PNG and source files",
  "Sposób odbioru pracy": "Acceptance criteria",
  "Sposób odbioru pracy *": "Acceptance criteria *",
  "Po czym obie strony poznają, że zlecenie zostało wykonane prawidłowo?": "How will both parties determine that the job has been completed correctly?",
  "Warunki anulowania": "Cancellation terms",
  "Warunki anulowania *": "Cancellation terms *",
  "Opisz zasady rezygnacji przed ukończeniem pracy...": "Describe the cancellation rules before the work is completed...",
  "Dodatkowe ustalenia": "Additional terms",
  "Opcjonalne informacje, które warto zapisać...": "Optional information worth recording...",
  "Potwierdzam, że zapoznałem się z warunkami współpracy i akceptuję treść wysyłanej propozycji.": "I confirm that I have reviewed the collaboration terms and accept the proposal I am submitting.",
  "Anuluj zmiany": "Cancel changes",
  "Wyślij nową propozycję": "Send new proposal",
  "Wyślij propozycję": "Send proposal",
  "Propozycja warunków": "Terms proposal",
  "Oczekuje na wspólną akceptację": "Waiting for mutual acceptance",
  "Zaproponuj zmiany": "Suggest changes",
  "Akceptuję warunki": "Accept terms",
  "✓ Zaakceptowałeś tę wersję. Czekamy na drugą stronę.": "✓ You accepted this version. Waiting for the other party.",
  "Ustalenia są wstrzymane, ponieważ jeden z użytkowników jest zablokowany.": "The terms are on hold because one of the users is blocked.",
  "Uzupełnij wszystkie wymagane pola i sprawdź cenę, termin oraz liczbę poprawek.": "Complete all required fields and check the price, deadline and number of revisions.",
  "Propozycja została wysłana. Czat odblokuje się po akceptacji drugiej strony.": "The proposal has been sent. Chat will unlock after the other party accepts it.",
  "Nie udało się zapisać warunków współpracy.": "The collaboration terms could not be saved.",
  "Warunki zostały zaakceptowane. Możecie rozpocząć rozmowę.": "The terms have been accepted. You can start the conversation.",
  "Nie udało się zaakceptować warunków współpracy.": "The collaboration terms could not be accepted.",
  "Nie masz dostępu do tej rozmowy.": "You do not have access to this conversation.",
  "Nie można zmienić ustaleń, gdy jeden z użytkowników jest zablokowany.": "The terms cannot be changed while one of the users is blocked.",
  "Zaakceptowane warunki są zablokowane i nie można ich zmienić.": "Accepted terms are locked and cannot be changed.",
  "Uzupełnij wszystkie wymagane pola formularza.": "Complete all required form fields.",
  "Cena musi być większa od zera.": "The price must be greater than zero.",
  "Wybrano nieobsługiwaną walutę.": "The selected currency is not supported.",
  "Termin nie może przypadać w przeszłości.": "The deadline cannot be in the past.",
  "Liczba poprawek musi mieścić się w zakresie od 0 do 100.": "The number of revisions must be between 0 and 100.",
  "Ta wersja ustaleń nie jest już aktywna.": "This version of the terms is no longer active.",
  "Nie masz dostępu do tych ustaleń.": "You do not have access to these terms.",
  "Nie można zaakceptować ustaleń, gdy jeden z użytkowników jest zablokowany.": "The terms cannot be accepted while one of the users is blocked.",
  "Najpierw obie strony muszą zaakceptować warunki współpracy.": "Both parties must accept the collaboration terms first.",
  "Czekamy na propozycję zleceniodawcy": "Waiting for the client's proposal",
  "Zleceniodawca wypełnia pierwszy formularz. Gdy go wyśle, zobaczysz wszystkie warunki i będziesz mógł je zaakceptować albo zaproponować zmiany.": "The client completes the first form. Once it is sent, you will see all terms and can accept them or suggest changes.",
  "Pierwszą propozycję warunków wysyła zleceniodawca.": "The client must send the first terms proposal.",
  "Nazwa zlecenia musi mieć co najmniej 3 znaki.": "The job name must contain at least 3 characters.",
  "Zakres pracy musi mieć co najmniej 10 znaków.": "The scope of work must contain at least 10 characters.",
  "Opisz rezultat końcowy zlecenia.": "Describe the final deliverables.",
  "Wpisz prawidłową cenę, na przykład 1500 lub 1500,50.": "Enter a valid price, for example 1500 or 1500.50.",
  "Wybierz termin wykonania.": "Select a delivery deadline.",
  "Termin wykonania nie może być wcześniejszy niż dzisiaj.": "The delivery deadline cannot be earlier than today.",
  "Wpisz pełną liczbę poprawek od 0 do 100.": "Enter a whole number of revisions from 0 to 100.",
  "Wpisz format przekazania pracy.": "Enter the delivery format.",
  "Opisz sposób odbioru pracy.": "Describe the acceptance criteria.",
  "Opisz warunki anulowania zlecenia.": "Describe the job cancellation terms.",
  "Cena zlecenia": "Job price",
  "Cena ustalona przy publikacji zlecenia": "Price set when the job was published",
  "Cena została ustalona przez zleceniodawcę przy publikacji zlecenia i nie podlega zmianie.": "The price was set by the client when the job was published and cannot be changed.",
  "Nie udało się pobrać ceny ze zlecenia. Odśwież stronę i spróbuj ponownie.": "The job price could not be loaded. Refresh the page and try again.",
  "Zlecenie nie ma prawidłowo zapisanej ceny.": "The job does not have a valid saved price.",
  "Cena formularza musi być identyczna z ceną zlecenia.": "The form price must match the job price.",
  "Spory": "Disputes",
  "Bezpieczna współpraca": "Secure collaboration",
  "Centrum sporu": "Dispute center",
  "Centrum sporów": "Dispute center",
  "Problem z realizacją zlecenia?": "Having a problem with the job?",
  "Otwórz uporządkowaną sprawę i przedstaw swoje wyjaśnienia.": "Open a structured case and provide your explanation.",
  "Zgłoś problem": "Report a problem",
  "Nowa sprawa": "New case",
  "Opisz problem": "Describe the problem",
  "Druga strona otrzyma Twoje zgłoszenie i będzie mogła odpowiedzieć.": "The other party will receive your report and be able to respond.",
  "Zamknij formularz sporu": "Close the dispute form",
  "Powód sporu": "Reason for dispute",
  "Wybierz powód": "Choose a reason",
  "Oczekiwane rozwiązanie": "Requested resolution",
  "Wybierz rozwiązanie": "Choose a resolution",
  "Proponowana kwota zwrotu": "Proposed refund amount",
  "Opis sytuacji": "Description of the situation",
  "Napisz, co się wydarzyło, kiedy wystąpił problem i które ustalenia nie zostały spełnione.": "Describe what happened, when the problem occurred and which terms were not met.",
  "Zgłoszenie zostanie przypisane do zaakceptowanej wersji ustaleń. Cena i termin nie mogą zostać podmienione.": "The report will be linked to the accepted version of the terms. The price and deadline cannot be changed.",
  "Potwierdź zapoznanie się z informacją o dostępie administratora.": "Confirm that you have read the administrator access notice.",
  "Nie udało się potwierdzić utworzonego sporu.": "The newly created dispute could not be confirmed.",
  "Jak administracja analizuje spór": "How the administration reviews a dispute",
  "Po przejęciu sprawy przypisany administrator IdeaHire otrzyma dostęp do materiałów potrzebnych do jej rozpatrzenia.": "After taking the case, the assigned IdeaHire administrator will receive access to the materials needed to review it.",
  "pełna rozmowa dotycząca tego zlecenia,": "the full conversation concerning this job,",
  "wszystkie wersje formularza współpracy,": "all versions of the work agreement form,",
  "wyjaśnienia oraz dowody dołączone do sporu.": "statements and evidence attached to the dispute.",
  "Dostęp ma wyłącznie administrator przypisany do sprawy, tylko do odczytu. Każde otwarcie pełnego kontekstu jest zapisywane w rejestrze działań.": "Access is limited to the administrator assigned to the case and is read-only. Every access to the full case context is recorded in the activity log.",
  "Potwierdzam, że zapoznałem się z informacją o dostępie administratora.": "I confirm that I have read the administrator access notice.",
  "To potwierdzenie dotyczy zasad analizy sporu i zostanie zapisane wraz ze zgłoszeniem.": "This acknowledgement concerns the dispute review rules and will be stored with the report.",
  "Kontrolowany dostęp do kontekstu sprawy": "Controlled access to case context",
  "Pełną rozmowę, formularz współpracy i dowody może wyświetlić wyłącznie administrator przypisany do tego sporu. Dostęp jest tylko do odczytu, a każde otwarcie zostaje zapisane.": "Only the administrator assigned to this dispute can view the full conversation, work agreement form and evidence. Access is read-only and every opening is recorded.",
  "Informację potwierdzono przy otwarciu sporu:": "Notice acknowledged when the dispute was opened:",
  "Potwierdzono informację o dostępie administracji": "Acknowledged the administration access notice",
  "Informacja o dostępie administratora": "Administrator access notice",
  "W razie analizy sporu przypisany administrator otrzyma dostęp tylko do odczytu do rozmowy, formularza współpracy i dowodów. Każde otwarcie zostanie zapisane.": "If the dispute is reviewed, the assigned administrator will receive read-only access to the conversation, work agreement form and evidence. Every access will be recorded.",
  "Otwórz spór": "Open dispute",
  "Otwórz sprawę": "Open case",
  "Sprawdzanie centrum sporu...": "Checking the dispute center...",
  "Praca nie została dostarczona": "Work was not delivered",
  "Praca jest niekompletna": "Work is incomplete",
  "Jakość nie odpowiada ustaleniom": "Quality does not meet the agreed terms",
  "Nie dotrzymano terminu": "Deadline was missed",
  "Spór dotyczący zakresu prac": "Dispute about the scope of work",
  "Problem z komunikacją": "Communication problem",
  "Anulowanie współpracy": "Cancellation of collaboration",
  "Problem dotyczący płatności": "Payment issue",
  "Inny powód": "Other reason",
  "Dokończenie lub poprawienie pracy": "Complete or correct the work",
  "Ustalenie nowego terminu": "Set a new deadline",
  "Pełny zwrot środków": "Full refund",
  "Częściowy zwrot środków": "Partial refund",
  "Przekazanie płatności wykonawcy": "Release payment to the contractor",
  "Inne rozwiązanie": "Other resolution",
  "Oczekiwanie na odpowiedź": "Awaiting response",
  "Zbieranie wyjaśnień": "Collecting information",
  "Analiza administratora": "Administrator review",
  "Decyzja wydana": "Decision issued",
  "Odwołanie w toku": "Appeal in progress",
  "Sprawa zamknięta": "Case closed",
  "Sprawa wycofana": "Case withdrawn",
  "Tutaj znajdziesz zgłoszone problemy, wyjaśnienia, dowody i decyzje administratora.": "Here you can find reported problems, explanations, evidence and administrator decisions.",
  "Otwórz panel administratora": "Open administrator panel",
  "Filtr spraw": "Case filter",
  "Zakończone": "Closed",
  "Ładowanie spraw...": "Loading cases...",
  "Brak spraw w tej sekcji": "No cases in this section",
  "Spór można otworzyć z poziomu rozmowy po wspólnej akceptacji warunków współpracy.": "A dispute can be opened from the chat after both parties accept the collaboration terms.",
  "Przejdź do wiadomości": "Go to messages",
  "Ładowanie szczegółów sprawy...": "Loading case details...",
  "Nie znaleziono sprawy": "Case not found",
  "Nie masz dostępu do tej sprawy albo nie istnieje.": "You do not have access to this case or it does not exist.",
  "Wróć do centrum sporów": "Back to dispute center",
  "Panel administratora": "Administrator panel",
  "Aktualna decyzja": "Current decision",
  "Operacja płatnicza:": "Payment action:",
  "operator płatności nie jest jeszcze podłączony": "payment provider is not connected yet",
  "nie jest wymagana": "not required",
  "Historia sprawy": "Case history",
  "Wyjaśnienia i komunikaty": "Explanations and messages",
  "System IdeaHire": "IdeaHire system",
  "Notatka administracyjna": "Administrative note",
  "Administrator IdeaHire": "IdeaHire administrator",
  "Tylko administracja": "Administration only",
  "Dodaj wyjaśnienie": "Add explanation",
  "Opisz nowe okoliczności lub odpowiedz drugiej stronie...": "Describe new circumstances or respond to the other party...",
  "Dodawanie...": "Adding...",
  "Materiały": "Materials",
  "Dowody w sprawie": "Case evidence",
  "Nie dodano jeszcze żadnych dowodów.": "No evidence has been added yet.",
  "Otwórz": "Open",
  "Wiadomość z rozmowy": "Chat message",
  "Opis pliku (opcjonalnie)": "File description (optional)",
  "Krótko wyjaśnij, co potwierdza plik": "Briefly explain what the file proves",
  "Przesyłanie...": "Uploading...",
  "Dodaj plik": "Add file",
  "Dołącz wiadomość z czatu": "Attach a chat message",
  "JPG, PNG, WEBP, PDF lub TXT · maksymalnie 20 MB": "JPG, PNG, WEBP, PDF or TXT · up to 20 MB",
  "Wybierz wiadomość": "Choose a message",
  "Administrator zobaczy tylko dołączoną wiadomość, nie cały czat.": "The administrator will see only the attached message, not the entire chat.",
  "Zamknij": "Close",
  "W tej rozmowie nie ma jeszcze wiadomości.": "There are no messages in this conversation yet.",
  "Ty": "You",
  "Druga strona": "Other party",
  "Dołączono": "Attached",
  "Dołącz": "Attach",
  "Jedno odwołanie na osobę": "One appeal per person",
  "Odwołaj się od decyzji": "Appeal the decision",
  "Uzasadnij odwołanie...": "Explain your appeal...",
  "Złóż odwołanie": "Submit appeal",
  "Tryb administracyjny": "Administrative mode",
  "Obsługa sprawy": "Case management",
  "Właściciel": "Owner",
  "Administrator": "Administrator",
  "Przejmij sprawę do analizy": "Take case for review",
  "Przypisywanie...": "Assigning...",
  "Wiadomość lub notatka": "Message or note",
  "Napisz prośbę o informacje albo notatkę dla administracji...": "Write an information request or an internal note...",
  "Wiadomość widoczna dla obu stron": "Message visible to both parties",
  "Zapisz wiadomość": "Save message",
  "Wydaj decyzję": "Issue decision",
  "Wynik sprawy": "Case outcome",
  "Wybierz wynik": "Choose an outcome",
  "Kontynuacja lub poprawienie pracy": "Continue or correct the work",
  "Przedłużenie terminu": "Extend the deadline",
  "Anulowanie bez zwrotu": "Cancellation without refund",
  "Pełny zwrot": "Full refund",
  "Częściowy zwrot": "Partial refund",
  "Brak dodatkowych działań": "No additional action",
  "Inna decyzja": "Other decision",
  "Kwota częściowego zwrotu (PLN)": "Partial refund amount (PLN)",
  "Np. 500": "e.g. 500",
  "Pełne uzasadnienie": "Full rationale",
  "Opisz ustalenia, ocenione dowody i podstawę decyzji...": "Describe the findings, assessed evidence and basis for the decision...",
  "Decyzja zostanie zapisana w historii i przekazana obu stronom. Operacje finansowe pozostają wyłączone do czasu podłączenia operatora płatności.": "The decision will be recorded in the case history and sent to both parties. Financial actions remain disabled until the payment provider is connected.",
  "Zapisywanie decyzji...": "Saving decision...",
  "Zamknij sprawę po terminie odwołania": "Close case after the appeal deadline",
  "Zamykanie...": "Closing...",
  "Podsumowanie": "Summary",
  "Powód": "Reason",
  "Oczekiwana kwota": "Requested amount",
  "Strony": "Parties",
  "Zleceniodawca": "Client",
  "Zleceniodawca:": "Client:",
  "Wykonawca": "Contractor",
  "Wykonawca:": "Contractor:",
  "Otwórz rozmowę": "Open chat",
  "Wycofaj spór": "Withdraw dispute",
  "Wycofywanie...": "Withdrawing...",
  "IdeaHire · administracja": "IdeaHire · administration",
  "Kolejka sporów, udokumentowane decyzje i kontrola dostępu administratorów.": "Dispute queue, documented decisions and administrator access control.",
  "Ładowanie panelu administratora...": "Loading administrator panel...",
  "Brak uprawnień": "Access denied",
  "Ten panel jest dostępny wyłącznie dla aktywnego właściciela i administratorów IdeaHire.": "This panel is available only to the active IdeaHire owner and administrators.",
  "Wróć do konta": "Back to account",
  "Statystyki spraw": "Case statistics",
  "Aktywne sprawy": "Active cases",
  "Nieprzypisane": "Unassigned",
  "Czekają na odpowiedź": "Awaiting response",
  "Odwołania": "Appeals",
  "Kolejka": "Queue",
  "Sprawy użytkowników": "User cases",
  "Filtr kolejki": "Queue filter",
  "Moje": "Mine",
  "Brak spraw spełniających wybrany filtr.": "No cases match the selected filter.",
  "Tylko właściciel": "Owner only",
  "Dostęp administratorów": "Administrator access",
  "Użytkownik musi wcześniej utworzyć i potwierdzić zwykłe konto IdeaHire.": "The user must first create and confirm a regular IdeaHire account.",
  "Adres e-mail konta": "Account email address",
  "Nadawanie...": "Granting...",
  "Nadaj rolę": "Grant role",
  "Odbieranie...": "Revoking...",
  "Odbierz rolę": "Revoke role",
  "aktywny": "active",
  "nieaktywny": "inactive",
  "Rejestr działań": "Activity log",
  "Ostatnia aktywność": "Recent activity",
  "Brak zapisanych działań.": "No recorded activity.",
  "Utworzono konto właściciela": "Owner account created",
  "Nadano rolę administratora": "Administrator role granted",
  "Odebrano rolę administratora": "Administrator role revoked",
  "Otwarto spór": "Dispute opened",
  "Dodano pierwszą odpowiedź": "First response added",
  "Wycofano spór": "Dispute withdrawn",
  "Dodano plik dowodowy": "Evidence file added",
  "Dołączono wiadomość jako dowód": "Message attached as evidence",
  "Przejęto sprawę do analizy": "Case taken for review",
  "Wyświetlono sprawę": "Case viewed",
  "Wysłano wiadomość administratora": "Administrator message sent",
  "Dodano notatkę wewnętrzną": "Internal note added",
  "Wydano decyzję": "Decision issued",
  "Złożono odwołanie": "Appeal submitted",
  "Zamknięto sprawę": "Case closed",
  "Wybierz powód sporu.": "Choose a reason for the dispute.",
  "Wybierz oczekiwane rozwiązanie.": "Choose the requested resolution.",
  "Opisz sytuację w co najmniej 20 znakach.": "Describe the situation in at least 20 characters.",
  "Kwota częściowego zwrotu musi być większa od 0 i mniejsza od ceny zlecenia.": "The partial refund amount must be greater than 0 and lower than the job price.",
  "Nie udało się sprawdzić statusu sporu.": "The dispute status could not be checked.",
  "Nie udało się otworzyć sporu.": "The dispute could not be opened.",
  "Nie udało się pobrać spraw.": "Cases could not be loaded.",
  "Nie udało się pobrać szczegółów sprawy.": "Case details could not be loaded.",
  "Wyjaśnienie musi mieć co najmniej 3 znaki.": "The explanation must contain at least 3 characters.",
  "Wyjaśnienie zostało dodane.": "The explanation has been added.",
  "Dozwolone pliki: JPG, PNG, WEBP, PDF lub TXT.": "Allowed files: JPG, PNG, WEBP, PDF or TXT.",
  "Plik dowodowy może mieć maksymalnie 20 MB.": "An evidence file can be up to 20 MB.",
  "Plik dowodowy został bezpiecznie dodany.": "The evidence file has been added securely.",
  "Wiadomość została dołączona jako dowód.": "The message has been attached as evidence.",
  "Nie udało się otworzyć pliku.": "The file could not be opened.",
  "Czy na pewno chcesz wycofać ten spór?": "Are you sure you want to withdraw this dispute?",
  "Spór został wycofany.": "The dispute has been withdrawn.",
  "Uzasadnienie odwołania musi mieć co najmniej 20 znaków.": "The appeal explanation must contain at least 20 characters.",
  "Odwołanie zostało przekazane do ponownej analizy.": "The appeal has been submitted for review.",
  "Sprawa została przypisana do Ciebie.": "The case has been assigned to you.",
  "Sprawa": "Case",
  "Wiadomość administratora musi mieć co najmniej 3 znaki.": "The administrator message must contain at least 3 characters.",
  "Wiadomość została wysłana obu stronom.": "The message has been sent to both parties.",
  "Notatka wewnętrzna została zapisana.": "The internal note has been saved.",
  "Wybierz wynik sprawy.": "Choose the case outcome.",
  "Uzasadnienie decyzji musi mieć co najmniej 20 znaków.": "The decision rationale must contain at least 20 characters.",
  "Częściowy zwrot musi być większy od 0 i mniejszy od ceny zlecenia.": "The partial refund must be greater than 0 and lower than the job price.",
  "Decyzja została zapisana i przekazana obu stronom.": "The decision has been saved and sent to both parties.",
  "Sprawa została zamknięta.": "The case has been closed.",
  "Wpisz prawidłowy adres e-mail konta IdeaHire.": "Enter a valid IdeaHire account email address.",
  "Rola administratora została nadana.": "The administrator role has been granted.",
  "Rola administratora została odebrana.": "The administrator role has been revoked.",
  "Nie udało się zmienić roli administratora.": "The administrator role could not be changed.",
  "Nie udało się wykonać operacji.": "The operation could not be completed.",
  "Twoja rola: Zleceniodawca": "Your role: Client",
  "Twoja rola: Wykonawca": "Your role: Contractor",
  "Przypisana do administratora": "Assigned to an administrator",
  "Nieprzypisana": "Unassigned",
  "Sprawa została przekazana do analizy administratora.": "The case has been submitted for administrator review.",
  "Sprawa została zamknięta po zakończeniu okresu odwoławczego.": "The case was closed after the appeal period ended.",
  "Spór został wycofany przez osobę zgłaszającą.": "The dispute was withdrawn by the reporting party.",
  "rozmiar nieznany": "unknown size",
  "Wiadomość": "Message",
  "Nie udało się pobrać panelu administratora.": "The administrator panel could not be loaded.",
  "Administracja": "Administration",
  "Nawigacja administracji": "Administration navigation",
  "Wiadomości dowodowe": "Evidence messages",
  "Tryb tylko do odczytu": "Read-only mode",
  "Zlecenia użytkowników": "User jobs",
  "Administracja może sprawdzać treść i cenę zleceń, ale nie może ich tworzyć, edytować ani usuwać.": "Administrators can review job content and prices, but cannot create, edit or delete jobs.",
  "Tylko podgląd": "Read only",
  "Wyszukiwanie zleceń": "Job search",
  "Szukaj": "Search",
  "Nazwa, opis, kategoria lub użytkownik...": "Title, description, category or user...",
  "Brak pasujących zleceń": "No matching jobs",
  "Zmień wyszukiwanie albo wybierz inną kategorię.": "Change the search or choose another category.",
  "Bez kategorii": "Uncategorized",
  "Podgląd": "Preview",
  "Nie udało się pobrać zleceń do podglądu.": "Jobs could not be loaded for review.",
  "Prywatność i dowody": "Privacy and evidence",
  "Wiadomości w sporach": "Messages in disputes",
  "Widoczne są wyłącznie wiadomości, które uczestnik świadomie dołączył jako dowód. Administracja nie otrzymuje dostępu do całych rozmów.": "Only messages deliberately attached by a participant as evidence are visible. Administrators do not get access to entire conversations.",
  "Wyszukiwanie wiadomości": "Message search",
  "Szukaj wiadomości": "Search messages",
  "Treść, użytkownik, zlecenie lub numer sprawy...": "Content, user, job or case number...",
  "Kontrolowany dostęp": "Controlled access",
  "Każda wiadomość poniżej jest niezmienną kopią dołączoną do konkretnej sprawy. Wejście administratora w szczegóły sprawy zapisuje się w rejestrze działań.": "Each message below is an immutable copy attached to a specific case. Administrator access to case details is recorded in the activity log.",
  "Ładowanie wiadomości dowodowych...": "Loading evidence messages...",
  "Brak wiadomości dowodowych": "No evidence messages",
  "Użytkownicy nie dołączyli jeszcze wiadomości do spraw albo nic nie pasuje do wyszukiwania.": "Users have not attached any messages to cases yet, or nothing matches the search.",
  "Autor wiadomości:": "Message author:",
  "Dołączył:": "Attached by:",
  "Wysłano:": "Sent:",
  "Otwórz powiązaną sprawę": "Open related case",
  "Nie udało się pobrać wiadomości dołączonych do sporów.": "Messages attached to disputes could not be loaded.",
  "Konto administracyjne działa w trybie tylko do obsługi IdeaHire.": "The administrative account operates only in IdeaHire management mode.",
  "Konto administracyjne nie może występować jako strona nowego sporu.": "An administrative account cannot act as a party to a new dispute.",
  "Konto administracyjne nie może dodawać wyjaśnień jako strona sporu.": "An administrative account cannot add explanations as a party to a dispute.",
  "Konto administracyjne nie może wycofać sporu jako użytkownik.": "An administrative account cannot withdraw a dispute as a user.",
  "Pełny kontekst sprawy": "Full case context",
  "Rozmowa i ustalenia współpracy": "Conversation and work agreement",
  "Materiały są dostępne wyłącznie do analizy sporu. Nie możesz edytować formularza ani pisać na czacie użytkowników.": "These materials are available only for dispute review. You cannot edit the form or write in the users' chat.",
  "Tylko odczyt": "Read only",
  "Najpierw przejmij sprawę": "Take the case first",
  "Pełny czat i formularz zobaczy tylko administrator przypisany do tej sprawy. Otwarcie tych danych zostanie zapisane w rejestrze działań.": "Only the administrator assigned to this case can view the full chat and form. Access to this data will be recorded in the activity log.",
  "Ładowanie pełnego kontekstu...": "Loading full case context...",
  "Nie udało się otworzyć kontekstu": "Could not open case context",
  "Nie udało się pobrać pełnego kontekstu sprawy.": "The full case context could not be loaded.",
  "Dostęp kontrolowany": "Controlled access",
  "Wyświetlono pełny czat i formularz": "Viewed full chat and agreement form",
  "Jesteś administratorem przypisanym do sprawy. To otwarcie zostało odnotowane.": "You are the administrator assigned to this case. This access has been recorded.",
  "Dokument sprawy": "Case document",
  "Formularz współpracy": "Work agreement form",
  "Dla tej rozmowy nie zapisano formularza współpracy.": "No work agreement form was saved for this conversation.",
  "Zaakceptowana przez obie strony": "Accepted by both parties",
  "Poprzednia wersja": "Previous version",
  "Oczekuje na akceptację": "Awaiting acceptance",
  "Najnowsza": "Latest",
  "brak akceptacji": "not accepted",
  "Pełny zapis rozmowy": "Full conversation record",
  "Czat użytkowników": "User chat",
  "Pełna rozmowa użytkowników": "Full user conversation",
  "Pelny kontekst jest dostepny tylko dla administratora przypisanego do sprawy.": "Full context is available only to the administrator assigned to the case.",
  "Anuluj": "Cancel",
});

const COUNTRY_TRANSLATIONS = Object.freeze({
  "Polska": "Poland",
  "Niemcy": "Germany",
  "Wielka Brytania": "United Kingdom",
  "Stany Zjednoczone": "United States",
  "Francja": "France",
  "Hiszpania": "Spain",
  "Włochy": "Italy",
  "Holandia": "Netherlands",
  "Belgia": "Belgium",
  "Austria": "Austria",
  "Szwajcaria": "Switzerland",
  "Szwecja": "Sweden",
  "Norwegia": "Norway",
  "Dania": "Denmark",
  "Finlandia": "Finland",
  "Irlandia": "Ireland",
  "Portugalia": "Portugal",
  "Czechy": "Czechia",
  "Słowacja": "Slovakia",
  "Węgry": "Hungary",
  "Ukraina": "Ukraine",
  "Rumunia": "Romania",
  "Bułgaria": "Bulgaria",
  "Chorwacja": "Croatia",
  "Słowenia": "Slovenia",
  "Litwa": "Lithuania",
  "Łotwa": "Latvia",
  "Estonia": "Estonia",
  "Grecja": "Greece",
  "Turcja": "Türkiye",
  "Islandia": "Iceland",
  "Kanada": "Canada",
  "Meksyk": "Mexico",
  "Brazylia": "Brazil",
  "Argentyna": "Argentina",
  "Australia": "Australia",
  "Nowa Zelandia": "New Zealand",
  "Japonia": "Japan",
  "Chiny": "China",
  "Korea Południowa": "South Korea",
  "Indie": "India",
  "Izrael": "Israel",
  "Zjednoczone Emiraty Arabskie": "United Arab Emirates",
  "Republika Południowej Afryki": "South Africa",
});

const PREFIX_TRANSLATIONS = Object.freeze([
  ["Pełny dostęp od ", "Full access from "],
  ["Nie udało się zalogować:", "Sign-in failed:"],
  ["Nie udało się utworzyć konta:", "Account creation failed:"],
  ["Nie udało się zapisać profilu:", "Profile save failed:"],
  ["Nie udało się zapisać zmian:", "Changes could not be saved:"],
  ["Nie udało się zmienić hasła:", "Password change failed:"],
  ["Nie udało się pobrać profilu:", "Profile could not be loaded:"],
  ["Nie udało się pobrać zleceń:", "Jobs could not be loaded:"],
  ["Nie udało się pobrać zlecenia:", "The job could not be loaded:"],
  ["Nie udało się pobrać powiadomień:", "Notifications could not be loaded:"],
  ["Nie udało się wysłać wiadomości:", "The message could not be sent:"],
  ["Nie udało się wysłać zgłoszenia:", "The application could not be sent:"],
  ["Nie udało się usunąć rozmowy:", "The conversation could not be deleted:"],
  ["Nie udało się usunąć zlecenia:", "The job could not be deleted:"],
  ["Nie udało się zmienić blokady:", "The block setting could not be changed:"],
  ["Nie udało się wylogować:", "Sign-out failed:"],
  ["Nie udało się przesłać zdjęcia:", "The image could not be uploaded:"],
  ["Nie udało się ustawić zdjęcia:", "The image could not be set:"],
  ["Profil został zapisany, ale nie udało się zapisać kraju:", "The profile was saved, but the country could not be saved:"],
  ["Zdjęcie przesłane, ale nie udało się zapisać profilu:", "The image was uploaded, but the profile could not be saved:"],
  ["Otwórz profil:", "Open profile:"],
  ["Usuń umiejętność:", "Remove skill:"],
  ["Nowa wersja ", "New version "],
  ["Wersja ", "Version "],
  ["Twoja rola: ", "Your role: "],
  ["Otwarto: ", "Opened: "],
  ["Sprawa otwarta ", "Case opened "],
  ["Termin odwołania: ", "Appeal deadline: "],
  ["Wydano: ", "Issued: "],
  ["Plik · ", "File · "],
  ["Wskaż konkretny błąd w ocenie lub nowy istotny dowód. Termin upływa ", "Identify a specific assessment error or important new evidence. The deadline is "],
  ["Operacja płatnicza: ", "Payment action: "],
  ["Kwota częściowego zwrotu musi być większa od 0 i mniejsza od ceny zlecenia.", "The partial refund amount must be greater than 0 and lower than the job price."],
]);

function translateCore(value) {
  if (!value) return value;

  const direct =
    EXACT_TRANSLATIONS[value] ||
    COUNTRY_TRANSLATIONS[value];

  if (direct) return direct;

  for (const [polish, english] of PREFIX_TRANSLATIONS) {
    if (value.startsWith(polish)) {
      return `${english}${value.slice(polish.length)}`;
    }
  }

  return value;
}

export function translateUiText(value) {
  const text = String(value ?? "");
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);

  if (!match) return text;

  return `${match[1]}${translateCore(match[2])}${match[3]}`;
}

function isExcluded(node) {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? node
      : node.parentElement;

  return !!element?.closest(
    "script, style, [data-no-translate='true']"
  );
}

function applyTextTranslation(node, language) {
  if (isExcluded(node)) return;

  const current = node.nodeValue || "";
  const lastTranslated =
    translatedTextByNode.get(node);

  if (
    !originalTextByNode.has(node) ||
    current !== lastTranslated
  ) {
    originalTextByNode.set(
      node,
      current
    );
  }

  const original =
    originalTextByNode.get(node) || "";

  const next =
    language === "en"
      ? translateUiText(original)
      : original;

  translatedTextByNode.set(
    node,
    next
  );

  if (current !== next) {
    node.nodeValue = next;
  }
}

const TRANSLATED_ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
];

function applyAttributeTranslation(
  element,
  language
) {
  if (isExcluded(element)) return;

  let originals =
    originalAttributesByElement.get(
      element
    );

  let translated =
    translatedAttributesByElement.get(
      element
    );

  if (!originals) {
    originals = {};
    originalAttributesByElement.set(
      element,
      originals
    );
  }

  if (!translated) {
    translated = {};
    translatedAttributesByElement.set(
      element,
      translated
    );
  }

  TRANSLATED_ATTRIBUTES.forEach(
    (attribute) => {
      if (!element.hasAttribute(attribute)) {
        return;
      }

      const current =
        element.getAttribute(attribute) ||
        "";

      if (
        !(attribute in originals) ||
        current !== translated[attribute]
      ) {
        originals[attribute] = current;
      }

      const next =
        language === "en"
          ? translateUiText(
              originals[attribute]
            )
          : originals[attribute];

      translated[attribute] = next;

      if (current !== next) {
        element.setAttribute(
          attribute,
          next
        );
      }
    }
  );
}

function translateTree(root, language) {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    applyTextTranslation(root, language);
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  applyAttributeTranslation(
    root,
    language
  );

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT
  );

  let textNode = walker.nextNode();

  while (textNode) {
    applyTextTranslation(
      textNode,
      language
    );
    textNode = walker.nextNode();
  }

  root
    .querySelectorAll(
      "[placeholder], [title], [aria-label]"
    )
    .forEach((element) =>
      applyAttributeTranslation(
        element,
        language
      )
    );
}

function getStoredTheme() {
  const stored =
    localStorage.getItem(THEME_KEY);

  return stored === "dark"
    ? "dark"
    : "light";
}

function getStoredLanguage() {
  return localStorage.getItem(
    LANGUAGE_KEY
  ) === "en"
    ? "en"
    : "pl";
}

function shouldShowCookieNotice() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(COOKIE_NOTICE_KEY) || "null"
    );

    const acknowledgedAt = Number(stored?.acknowledgedAt || 0);
    const isCurrentVersion =
      stored?.version === COOKIE_NOTICE_VERSION;
    const isStillValid =
      acknowledgedAt > 0 &&
      Date.now() - acknowledgedAt < COOKIE_NOTICE_LIFETIME;

    return !(isCurrentVersion && isStillValid);
  } catch {
    return true;
  }
}

export default function Preferences({
  children,
}) {
  const [theme, setTheme] =
    useState(getStoredTheme);

  const [language, setLanguage] =
    useState(getStoredLanguage);

  const [mobilePanelOpen, setMobilePanelOpen] =
    useState(false);

  const [cookieNoticeVisible, setCookieNoticeVisible] =
    useState(shouldShowCookieNotice);

  function acknowledgeCookieNotice() {
    setCookieNoticeVisible(false);

    try {
      localStorage.setItem(
        COOKIE_NOTICE_KEY,
        JSON.stringify({
          version: COOKIE_NOTICE_VERSION,
          acknowledgedAt: Date.now(),
        })
      );
    } catch {
      /* Informacja pozostanie zamknięta do końca bieżącej wizyty. */
    }
  }

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme;
    document.documentElement.style.colorScheme =
      theme;
    localStorage.setItem(
      THEME_KEY,
      theme
    );
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang =
      language;
    document.documentElement.dataset.language =
      language;
    localStorage.setItem(
      LANGUAGE_KEY,
      language
    );

    translateTree(
      document.body,
      language
    );

    const observer =
      new MutationObserver(
        (mutations) => {
          mutations.forEach(
            (mutation) => {
              if (
                mutation.type ===
                "characterData"
              ) {
                applyTextTranslation(
                  mutation.target,
                  language
                );
                return;
              }

              if (
                mutation.type ===
                "attributes"
              ) {
                applyAttributeTranslation(
                  mutation.target,
                  language
                );
                return;
              }

              mutation.addedNodes.forEach(
                (node) =>
                  translateTree(
                    node,
                    language
                  )
              );
            }
          );
        }
      );

    observer.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter:
          TRANSLATED_ATTRIBUTES,
      }
    );

    const originalAlert =
      window.alert;
    const originalConfirm =
      window.confirm;

    window.alert = (message) =>
      originalAlert(
        language === "en"
          ? translateUiText(message)
          : message
      );

    window.confirm = (message) =>
      originalConfirm(
        language === "en"
          ? translateUiText(message)
          : message
      );

    return () => {
      observer.disconnect();
      window.alert = originalAlert;
      window.confirm = originalConfirm;
    };
  }, [language]);

  return (
    <>
      {children}

      <aside
        className={`site-preferences ${
          mobilePanelOpen ? "is-open" : ""
        }`}
        data-no-translate="true"
        aria-label={
          language === "en"
            ? "Appearance and language"
            : "Wygląd i język"
        }
      >
        <button
          type="button"
          className="site-preferences-handle"
          onClick={() =>
            setMobilePanelOpen(
              (current) => !current
            )
          }
          aria-expanded={mobilePanelOpen}
          aria-label={
            language === "en"
              ? mobilePanelOpen
                ? "Hide appearance and language settings"
                : "Show appearance and language settings"
              : mobilePanelOpen
              ? "Schowaj ustawienia wyglądu i języka"
              : "Pokaż ustawienia wyglądu i języka"
          }
        >
          <span aria-hidden="true">
            {mobilePanelOpen ? "›" : "‹"}
          </span>
        </button>

        <div className="site-preferences-panel">
        <button
          type="button"
          className="site-theme-toggle"
          onClick={() =>
            setTheme((current) =>
              current === "dark"
                ? "light"
                : "dark"
            )
          }
          aria-label={
            language === "en"
              ? theme === "dark"
                ? "Enable light mode"
                : "Enable dark mode"
              : theme === "dark"
              ? "Włącz tryb jasny"
              : "Włącz tryb ciemny"
          }
          title={
            language === "en"
              ? theme === "dark"
                ? "Light mode"
                : "Dark mode"
              : theme === "dark"
              ? "Tryb jasny"
              : "Tryb ciemny"
          }
        >
          <span aria-hidden="true">
            {theme === "dark"
              ? "☀"
              : "◐"}
          </span>
        </button>

        <div
          className="site-language-toggle"
          role="group"
          aria-label={
            language === "en"
              ? "Language"
              : "Język"
          }
        >
          <button
            type="button"
            className={
              language === "pl"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setLanguage("pl")
            }
            aria-pressed={
              language === "pl"
            }
          >
            PL
          </button>

          <button
            type="button"
            className={
              language === "en"
                ? "is-active"
                : ""
            }
            onClick={() =>
              setLanguage("en")
            }
            aria-pressed={
              language === "en"
            }
          >
            EN
          </button>
        </div>
        </div>
      </aside>

      {cookieNoticeVisible && (
        <section
          className="cookie-notice"
          data-no-translate="true"
          aria-label={
            language === "en"
              ? "Information about browser storage"
              : "Informacja o pamięci przeglądarki"
          }
        >
          <div className="cookie-notice-mark" aria-hidden="true">
            <span>i</span>
          </div>

          <div className="cookie-notice-copy">
            <strong>
              {language === "en"
                ? "Your privacy at IdeaHire"
                : "Twoja prywatność w IdeaHire"}
            </strong>
            <p>
              {language === "en"
                ? "IdeaHire uses technologies necessary for sign-in, security and remembering settings selected by you. We currently do not use advertising or analytics cookies."
                : "IdeaHire korzysta z technologii niezbędnych do logowania, bezpieczeństwa oraz zapamiętywania wybranych przez Ciebie ustawień. Obecnie nie używamy cookies reklamowych ani analitycznych."}
            </p>
          </div>

          <div className="cookie-notice-actions">
            <a href="/polityka-cookies">
              {language === "en"
                ? "Read the policy"
                : "Przeczytaj politykę"}
            </a>
            <button type="button" onClick={acknowledgeCookieNotice}>
              {language === "en" ? "Got it" : "Rozumiem"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
