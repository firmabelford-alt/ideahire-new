import React, { useEffect, useState } from "react";

const THEME_KEY = "ideahire_theme";
const LANGUAGE_KEY = "ideahire_language";

const originalTextByNode = new WeakMap();
const translatedTextByNode = new WeakMap();
const originalAttributesByElement = new WeakMap();
const translatedAttributesByElement = new WeakMap();

const EXACT_TRANSLATIONS = Object.freeze({
  "Akceptuj wykonawcę": "Accept contractor",
  "Akceptowanie...": "Accepting...",
  "Aktywne": "Active",
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
  "Imię / nazwa": "Name",
  "Informacje o profilach": "Profile information",
  "Jak to działa": "How it works",
  "JPG, PNG lub WEBP. Zdjęcie zostanie automatycznie przycięte do 400 × 400 px.": "JPG, PNG or WEBP. The image will be automatically cropped to 400 × 400 px.",
  "Kategoria": "Category",
  "Kategorie": "Categories",
  "Kategorie specjalizacji": "Specialization categories",
  "Kliknij, aby otworzyć ukryty profil": "Click to open the hidden profile",
  "Kliknij, aby zobaczyć profil": "Click to view profile",
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
  "Opublikuj zlecenie →": "Publish job →",
  "O mnie": "About me",
  "Otwórz profil:": "Open profile:",
  "Pamiętasz hasło?": "Remember your password?",
  "Podaj adres e-mail przypisany do Twojego konta. Wyślemy Ci link do ustawienia nowego hasła.": "Enter the email address assigned to your account. We will send you a link to set a new password.",
  "Pokaż swoje umiejętności, znajdź interesujące projekty i rozwijaj swoje portfolio.": "Show your skills, find interesting projects and grow your portfolio.",
  "Potrzebuję nowoczesnej": "I need a modern",
  "Powiadomienia": "Notifications",
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

export default function Preferences({
  children,
}) {
  const [theme, setTheme] =
    useState(getStoredTheme);

  const [language, setLanguage] =
    useState(getStoredLanguage);

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
        className="site-preferences"
        data-no-translate="true"
        aria-label={
          language === "en"
            ? "Appearance and language"
            : "Wygląd i język"
        }
      >
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
      </aside>
    </>
  );
}
