# IdeaHire — profil, zlecenia i płynne widoki — 27.10.2026

Aktualizacja istniejącego repozytorium `firmabelford-alt/ideahire-new`, na bazie produkcyjnej wersji `5c9a6526a70a8ea7edbde30a4be7b485e1cc6d6b`. Pełne pliki są w paczce pod właściwymi ścieżkami. Wdrożenie jest jedną całością; poniższa kolejność pomaga przy ręcznym kopiowaniu, a `router.jsx` idzie na końcu.

## Pliki interfejsu

| Kolejność | Ścieżka | Linie |
| --- | --- | ---: |
| 1 | `src/InterfaceRefinements.css` | 270 |
| 2 | `src/OwnedListings.jsx` | 21 |
| 3 | `src/JobListingState.js` | 66 |
| 4 | `src/Subpages.jsx` | 303 |
| 5 | `src/Workspace.jsx` | 470 |
| 6 | `src/ServiceMarketplace.jsx` | 1845 |
| 7 | `src/Preferences.jsx` | 2559 |
| 8 | `src/LucynaDock.jsx` | 203 |
| 9 | `src/TermsOfService.jsx` | 193 |
| 10 | `src/router.jsx` | 29978 |

## Co zmieniono

- Jeden komponent kart i pustych widoków dla „Moich zleceń” oraz „Moich usług”. Czytelny status, budżet, opis i działania, zgodne na telefonie i laptopie.
- „Opublikuj ponownie” dla wygasłego publicznego ogłoszenia. Ten sam identyfikator i treść, nowa data publikacji oraz pierwotny okres 7/14/30 dni. Przycisk nie tworzy kopii ani nie uruchamia płatności. Publiczna tablica i profil ukrywają wygasłe wpisy także bez przeładowania strony. Prywatne zapytania nie trafiają do rejestru publicznych ogłoszeń.
- Trzy pozycje „Poznaj IdeaHire”, „Kategorie” i „Dla Ciebie” korzystają z tego samego kroju Inter, grubości 800 i rozmiaru 23 px co główne pozycje rozwijanego menu. Pozostałe pomocnicze pozycje pozostają bez zmiany.
- Wspólna szerokość i odstępy zakładek konta. Dane profilu mają osobne sekcje; specjalizacje czytelny wybór dziedzin, umiejętności i opis; portfolio równe albumy, zdjęcia o stałej proporcji i czytelny edytor. Informacja o prawach publikacji jest zachowana w rozwijanej sekcji.
- Panel pracy korzysta ze wspólnego nagłówka. Filtry i narzędzia mają pozycję sticky podczas przewijania; listę współprac porządkują spójne karty.
- Pełny ekran konfiguracji preferencji, jedna przewijana powierzchnia, nagłówek i przyciski dostępne w oknie. Usunięto dublowanie komunikatu o błędzie w stopce. Zachowano pola własnego opisu i gotowe wybory.
- Krótkie wejście nowego widoku, animowane stany ładowania i wybory. Zmiana filtrów wyszukiwania nie uruchamia ponownie animacji strony. Obsługa ograniczonego ruchu pozostaje aktywna.
- Lucyna ładuje osobny pakiet JS/CSS dopiero po otwarciu okna. Okładki portfolio używają lazy loading i async decoding. Dynamiczne tłumaczenie DOM działa w angielskim trybie; przełączenie na polski nadal przywraca oryginalne teksty. Panel republiki po moderacji pobiera dane wyłącznie w zakładce zleceń.

## Baza danych

Wdrożona migracja `20261027162618_unify_catalogue_preferences_and_renew_expired_jobs`.
Pełny SQL: `supabase/sql/functions/catalogue_preferences_and_expired_jobs.sql` — 307 linii.

Przyczyna błędu: formularz i profil onboardingu obsługiwały 10 kategorii, a stara funkcja zapisu preferencji oraz ograniczenie tabeli dopuszczały tylko 6. Naprawiono obie listy. Nowy RPC zapisuje dwie części preferencji atomowo, dzięki czemu drugi błąd nie zostawia połowy ustawień.

Nowe procedury: `save_my_ideahire_preferences` i `renew_my_ideahire_job`. Obie używają SECURITY INVOKER; zachowano RLS, kontrolę autora oraz dotychczasowe blokady wieku i cyklu konta. Ponowna publikacja sprawdza również ograniczenia i zatrzymania moderacyjne. Powtórne kliknięcie nie przedłuża już aktywnego ogłoszenia. Instalacja SQL nie odnawia automatycznie żadnych istniejących ogłoszeń i nie zmienia preferencji użytkowników.

## Sprawdzenie prawne

Wniosek wdrożeniowy: świadome ponowne opublikowanie własnego ogłoszenia może być funkcją platformy, przy jasno opisanych zasadach. Nie jest to odnowienie umowy wykonania pracy ani nowa płatność. Do § 8 istniejącego opisu regulaminu dodano opis okresu publikacji i przywracania. Nie zmieniono zapisanych akceptacji użytkowników ani identyfikatorów zaakceptowanych wersji.

Podstawy: art. 353¹ KC (swoboda umów z ograniczeniami ustawowymi) i art. 8 ustawy o świadczeniu usług drogą elektroniczną (opis usługi i warunków w regulaminie).

- https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU19640160093/U/D19640093Lj.pdf
- https://eli.gov.pl/api/acts/DU/2024/1513/text.html

To analiza funkcji, nie pełny audyt prawny platformy.

## Walidacja

- 46 testów aplikacji: zaliczone.
- 24 kontrole SQL w lokalnym PostgreSQL/PGlite: zaliczone, w tym 10 kategorii, dwie role, wycofanie częściowego zapisu, odnowienie okresu bez zmiany treści, RLS, idempotencja i blokady.
- Build produkcyjny: zaliczony. W porównaniu z buildem przed podziałem Lucyny pakiet początkowy ma ok. 94 KB mniej JS i 69 KB mniej CSS (przed gzip). To pomiar paczek, nie deklaracja wyniku Lighthouse.
- Kontrole na rzeczywistej bazie potwierdziły komplet kategorii, dostępność atomowego zapisu i brak dostępu anonimowego do odnowienia. Doradca bezpieczeństwa nie wskazał nowych ostrzeżeń dla tych dwóch procedur; nie oznacza to braku wcześniejszych ostrzeżeń w całym projekcie.
- CSS poprawnie sparsowany; kontrola białych znaków Git bez błędów.
- Nie wysłano wiadomości, plików, zgłoszeń ani płatności na rzeczywistych kontach. Test odnowienia wykonano na lokalnych danych testowych.
- Kontrola przeglądarki jest ograniczona do publicznych widoków. Sesja jest wylogowana; prywatne profile i fizyczny telefon nie były ręcznie sprawdzone. Układ zawiera osobne reguły telefonu/laptopa i korzysta z istniejących kolorów obu motywów oraz obu szablonów.

## Pliki kontroli

`test/listings.test.js` sprawdza dokładną granicę wygaśnięcia, strefy czasu i planowanie jednego timera.
`supabase/sql/verify/catalogue-preferences-and-renewal.mjs` uruchamia kontrole SQL (wymaga `@electric-sql/pglite`; można podać lokalny moduł przez `IDEAHIRE_PGLITE_MODULE`).
`supabase/sql/verify/catalogue-existing-functions.json` zawiera istniejące definicje używane przez lokalny test, bez danych użytkowników.
