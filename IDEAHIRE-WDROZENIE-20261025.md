# IdeaHire — nagłówki, konto, wiadomości i ustalenia

Data: 25.10.2026. Baza pakietu: GitHub `firmabelford-alt/ideahire-new`, main `f9d1f2016b97bf576d10d553aa578d4cedf3ca26`.

Pakiet zawiera kompletne pliki, bez diffów. Zmiany przygotowano lokalnie. Do zakończenia pozostaje uruchomienie SQL i publikacja plików strony. Aktualny stan produkcyjnej bazy nie został zmieniony ani potwierdzony.

## Co zmieniono

- Zwykłe nagłówki podstron: tytuł, opis i akcje są wyśrodkowane. Rozmiar tytułu wynosi 32 px na komputerze, 26 px na telefonie i 24 px na najwęższych ekranach. Mniejsze, stałe odstępy zastępują rozciągnięty blok. Nagłówki katalogów z filmem zachowują swój osobny układ.
- Konto: formularz zaczyna się przy bocznej nawigacji, bez drugiego wyśrodkowania. Zdjęcie i nazwa mają równy układ, opis zajmuje pełną szerokość. Ujednolicono szerokość zawartości zakładek profilu, umiejętności, portfolio, zleceń, ustawień, wypłat i wyglądu. Usunięto zbędny napis „Twoje konto” w bocznym menu.
- Skrzynka wiadomości: krótkie przyciski filtrów, bez rozciągniętego tła. Lista nie ma długich separatorów; podgląd ostatniej wiadomości jest krótki. Pusty stan ma normalną skalę.
- Rozmowa na komputerze: maksymalna szerokość 1180 px, pole pisania i kolumna wiadomości maksymalnie 760 px. Od szerokości 1101 px obok znajduje się podsumowanie współpracy, status ustaleń i płatności oraz skróty do materiałów i profilu. Telefon zachowuje osobny układ rozmowy.
- Ustalenia: klient przygotowuje pierwszą propozycję, również przy zapytaniu o usługę. Autor czeka na odpowiedź i nie może nadpisać oczekującej wersji. Wykonawca może zaakceptować, poprosić o zmiany lub wysłać własną propozycję. „Porzuć współpracę” zapisuje odpowiedź, wiadomość i zwolnienie rezerwacji w jednej transakcji. Zaakceptowanej albo opłacanej współpracy nie można porzucić tą drogą.
- Liczba dostępnych miejsc pochodzi z serwera. Katalog i szczegóły usług odświeżają ją w tle, przy powrocie na kartę i co 15 sekund, bez zastępowania widoku ekranem ładowania.

## Kolejność wdrożenia

### 1. Supabase

Projekt: `lvdymbaltnzjrcizlspd`.

W SQL Editor uruchom cały `supabase/sql/functions/conversation_negotiation.sql` — **302 linie**. Na końcu powinno pojawić się pięć wierszy z `ready = true`.

SQL jest wymagany przed publikacją nowej wersji strony. Bez niego przyciski odpowiedzi na propozycję nie mają nowej funkcji serwerowej. Nie uruchamiaj ponownie starej migracji usług, bo przywróciłaby poprzednią regułę pierwszej oferty wykonawcy.

Migracja nie przepisuje istniejących propozycji ani zaakceptowanej historii. W rozmowach o usługach bez żadnej propozycji ustawia klienta jako autora pierwszych ustaleń. Dla już rozpoczętych negocjacji zachowuje istniejącą historię wersji.

### 2. GitHub i Cloudflare Pages

Dodaj lub podmień **wszystkie osiem poniższych plików w jednym commicie**, zachowując dokładne ścieżki. To zapobiega publikacji przejściowej wersji z brakującym importem lub niepełnym układem.

| Kolejność w pakiecie | Plik | Linie | Działanie |
| --- | --- | ---: | --- |
| 1 | `src/AgreementWorkflow.js` | 42 | Dodaj nowy plik |
| 2 | `src/ConversationCards.jsx` | 52 | Podmień cały plik |
| 3 | `src/ServiceMarketplace.jsx` | 1873 | Podmień cały plik |
| 4 | `src/Workspace.jsx` | 468 | Podmień cały plik |
| 5 | `src/WorkspaceMessages.jsx` | 508 | Podmień cały plik |
| 6 | `src/public/headings.css` | 2282 | Podmień cały plik |
| 7 | `src/router.jsx` | 30077 | Podmień cały plik |
| 8 | `index.html` | 68 | Podmień cały plik |

W `index.html` jest nowy adres wersji stylów: `/headings.css?v=20261025-centered-7`.

Poczekaj na udany build i wdrożenie produkcyjne Cloudflare Pages. Następnie odśwież stronę. Pakiet nie wymaga zmiany zmiennych środowiskowych ani konfiguracji Stripe.

### 3. Sprawdzenie na kontach

1. Na laptopie i telefonie otwórz: Moje zlecenia, Dane profilu, Umiejętności, Portfolio, Ustawienia, Wypłaty, Wygląd, Kalendarz, Dodaj usługę i Wiadomości. Sprawdź położenie nagłówka, odstępy, formularz i brak przewijania poziomego w obu szablonach oraz trybach jasnym i ciemnym.
2. Otwórz nową rozmowę o usłudze jako klient. Klient ma przygotować i wysłać pierwszą propozycję. Po wysłaniu formularz edycji ma być niedostępny.
3. Na koncie wykonawcy przeczytaj warunki. Poproś o zmianę, a na koncie klienta sprawdź powrót możliwości wysłania nowej wersji. Oddzielnie sprawdź kontrpropozycję i jej akceptację przez klienta.
4. W odrębnej, niezaakceptowanej rozmowie wybierz „Porzuć współpracę”. Sprawdź wiadomość na drugim koncie, zamknięty stan ustaleń i powrót miejsca w usłudze. Powtórzenie akcji nie może wysyłać drugiej wiadomości ani podwójnie zmieniać dostępności.
5. W zakładce Rozmowa sprawdź krótsze pole pisania i panel po prawej na większym ekranie. Na telefonie panel boczny ma być ukryty, a klawiatura nie może zasłaniać pola wysyłania.

## Weryfikacja wykonana przed przekazaniem

- Kompilacja produkcyjna Vite: zaliczona.
- Testy aplikacji: 11 zaliczonych.
- Testy migracji w odizolowanym PostgreSQL przez PGlite: 13 zaliczonych. Sprawdzono blokadę autora, pierwszą propozycję klienta, kontrpropozycję, akceptację, odrzucenie starej wersji, rezygnację i zwolnienie miejsca, idempotencję, cofnięcie operacji po błędzie wiadomości, dostęp uczestników i odmowę anonimowym użytkownikom.
- Publiczny plik CSS: poprawnie parsuje się przez PostCSS. `git diff --check`: bez błędów.
- Testy nie wykonywały prawdziwych płatności ani operacji w produkcyjnej bazie.
- Nie potwierdzono ręcznie nowego wyglądu na zalogowanych kontach klienta i wykonawcy. Obecna sesja przeglądarki nie udostępnia takich kont. Testy automatyczne nie zastępują tej kontroli po wdrożeniu.

W pakiecie są też pliki testów: `test/agreement.test.js` — 46 linii oraz `supabase/sql/verify/conversation-negotiation.mjs` — 247 linii. Nie są wymagane do publikacji strony. Instrukcja uruchomienia testów SQL znajduje się na początku pliku weryfikacyjnego.
