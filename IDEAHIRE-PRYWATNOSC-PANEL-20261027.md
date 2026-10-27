# IdeaHire — centrum prywatności i dopracowanie panelu pracy

Wersja: privacy-workspace-20261027. Paczka zawiera pełne pliki, z zachowaniem dokładnych ścieżek projektu.

## Zmiany dla użytkownika

- Centrum prywatności: krótszy formularz, dodatkowy wybór formatu pod rozwijanym przyciskiem, czytelny opis i podpowiedzi. Przycisk wysyłania wyjaśnia brakujące dane zamiast pozostawać szarym bez komunikatu.
- Potwierdzony zapis pokazuje osobne potwierdzenie oraz przyciski do sprawy i kolejnego wniosku. Nie wymaga odświeżania strony.
- Wycofanie, wiadomość i zamknięcie analizy mają komunikaty przypisane do właściwej sprawy. Komunikat o wycofaniu nie pojawia się pod formularzem nowego wniosku.
- Zapis nie czeka na odczyt historii. Odczyty mają limit czasu, anulowanie i ochronę przed spóźnionymi odpowiedziami; podwójne kliknięcie nie tworzy dwóch operacji. Niepewna odpowiedź sieciowa nie powoduje automatycznego ponawiania zapisu.
- Historia zachowuje dostęp do raportu, korespondencji, terminów i przebiegu sprawy. Błąd odświeżenia ma oddzielny komunikat i przycisk ponowienia.
- Wniosek o usunięcie danych pozostaje odrębny od zamknięcia konta; zachowano weryfikację warunków, wybór użytkownika i informacje o wymaganej retencji. Formularz nie wykonuje natychmiastowego kasowania konta.
- Moje zlecenia: oddzielna, przestronna karta braku wyników. Powtórzony wizualny licznik usunięto; liczby są w filtrach, a zmiana wyników pozostaje ogłaszana technologiom asystującym.
- Panel pracy: swobodna wysokość nagłówka, większe etykiety filtrów i metadanych, spokojne cienie w środku ekranu, lekki ruch przy przewijaniu. Tryb ograniczonego ruchu wyłącza animację.
- Pasek nawigacji: spójny układ z menu i logo, 80 px na laptopie i 68 px na telefonie. Na telefonie zachowano dolną nawigację. Dopracowano przycisk Wróć.
- Stripe: oryginalny znak słowny z oficjalnego zestawu Stripe, fioletowy na jasnym tle i biały na ciemnym. Obraz nie dziedziczy zielonych kolorów IdeaHire.

## Pełne pliki i kolejność

Zmiany należy publikować razem. Poniższa kolejność służy ręcznemu kopiowaniu; kompilację uruchom dopiero po skopiowaniu wszystkich plików.

| Kolejność | Dokładna ścieżka | Liczba linii |
| --- | --- | ---: |
| 1 | `src/PrivacyRequests.js` | 106 |
| 2 | `src/PrivacyDesk.css` | 118 |
| 3 | `src/PrivacyDesk.jsx` | 59 |
| 4 | `src/WorkspaceFinish.css` | 84 |
| 5 | `src/WorkAmbience.jsx` | 20 |
| 6 | `src/WorkDesk.jsx` | 57 |
| 7 | `src/Workspace.jsx` | 441 |
| 8 | `src/public/brand/stripe-wordmark.svg` | 9 |
| 9 | `src/public/brand/stripe-wordmark-white.svg` | 9 |
| 10 | `src/router.jsx` | 29098 |
| 11 | `test/privacy-requests.test.js` | 136 |
| 12 | `test/privacy-desk.test.js` | 42 |

## Weryfikacja

- 72 testy przeszły: 56 wcześniejszych i 16 nowych. Nowe sprawdzają m.in. brak blokady po zapisie, nieudane odświeżanie, podwójne kliknięcie, niepewny timeout, wycofanie we właściwej sprawie, spóźnione odpowiedzi, zmianę konta, warunki usuwania oraz działające potwierdzenie.
- Produkcyjna kompilacja Vite przeszła. Oba nowe arkusze przeszły parsowanie CSS. `git diff --check` bez błędów.
- Sprawdzono tylko do odczytu sygnatury i definicje istniejących funkcji prywatności w Supabase. Zachowano ich kontrakty oraz filtrowanie i kontrolę właściciela. Nie wprowadzono migracji, zmian uprawnień ani zasad RLS.
- Nie wysyłano rzeczywistych wniosków, wiadomości, wycofań ani dyspozycji usunięcia na kontach klientów. Nie wykonywano operacji Stripe.
- Przygotowano układ telefonu i laptopa oraz jasny i ciemny motyw. Prywatne ekrany nie zostały ręcznie sprawdzone w zalogowanej sesji ani na fizycznym telefonie: przeglądarka jest wylogowana. Testy komponentów i logiki nie zastępują takiej kontroli.
- Vite nadal zgłasza zastane duże pakiety aplikacji. Ta paczka nie zmienia podziału całej aplikacji na moduły.

## Źródła

- Oficjalne pliki znaku Stripe: https://stripe.com/newsroom/information (zestaw logo dostępny z tej strony). Zachowano oryginalną geometrię i kolory SVG.
- Supabase Abort Signal: https://supabase.com/docs/reference/javascript/using-modifiers-abortsignal
- Termin standardowej odpowiedzi i prosta forma komunikacji: art. 12 RODO. Nie jest to pełny audyt prawny centrum prywatności.

## Wdrożenie ręczne

1. Zastąp lub dodaj pełne pliki według tabeli. Pliki SVG umieść dokładnie w `src/public/brand/`.
2. Uruchom `npm test`, następnie `npm run build`.
3. Opublikuj wynik kompilacji zgodnie z istniejącą konfiguracją Cloudflare Pages.
4. Sprawdź Konto → Moje zlecenia, Konto → Wypłaty, Praca i Prywatność i dane. Test rzeczywistego wniosku wykonuj wyłącznie na przeznaczonym do tego koncie i po uzgodnieniu z obsługą.
