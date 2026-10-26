# IdeaHire — dopracowanie wiadomości, 26.10.2026

Repozytorium: `firmabelford-alt/ideahire-new`. Produkcja: https://ideahire-new.pages.dev/.
Ta wersja zachowuje zaakceptowany układ komunikatora i zaokrąglone pole pisania.

## Zmiany

- Na laptopie formularz ustaleń, materiały i rozliczenie mają wyśrodkowaną szerokość do 960 px. Wybrana sekcja nadal zajmuje własny panel, z jednym przewijaniem strony. Formularz rezygnacji ma do 640 px. Okno przesyłania materiałów i gotowej pracy ma do 960 × 740 px i dopasowuje się do mniejszego okna. Na telefonie zachowuje pełny ekran.
- „Edytuj ustalenia” otwiera cały aktualny formularz, zachowując zakres, cenę, termin, poprawki, format i pozostałe pola. Wysłanie tworzy nową propozycję do akceptacji. Usunięto osobny przycisk i formularz „Co wymaga zmiany?”. Uwagi strony omawiają w rozmowie. Oczekujący autor nadal nie może nadpisać wysłanej wersji; zaakceptowanych ustaleń nie można edytować tym trybem. Dawne prośby o zmiany pozostają czytelne.
- Na telefonie menu ma widoczną nazwę „Sekcje” oraz trzy bezpośrednie skróty: Ustalenia, Materiały, Płatność. Dodatkowe opcje są w bocznym menu. Przy otwartej klawiaturze skróty chowają się, by zostawić miejsce na rozmowę.
- Naprawiono obliczanie szerokości kart ustaleń, zawijanie pól i dolne krawędzie. Karty i pola liczą obramowanie w swojej szerokości. Usunięto wewnętrzny limit wysokości i osobne przewijanie zaakceptowanych ustaleń. Na małej szerokości formularz i rozliczenie przechodzą do jednej kolumny.
- Usunięto powtarzające się nagłówki na telefonie, instrukcję o gwiazdkach i tekst pod zaakceptowaną wersją, który powtarzał jej status. Informacja o prawach autorskich pozostała w tym samym miejscu, w domyślnie zwiniętej karcie. Dane umowy i potwierdzenia przekazania pracy pozostają dostępne.
- Zapytanie o usługę ma osobną kartę z oznaczeniem, ikoną i wyróżnioną górną krawędzią. W szablonie turkusowym używa stonowanego ciepłego akcentu; w czarno-białym zachowuje kolory szablonu. Jasny i ciemny motyw korzystają z kolorów aplikacji. Zachowano treść celu, terminu i materiałów.
- Zwykłe wiadomości mają delikatne obramowanie. Usunięto trzy kropki pod otrzymanymi wiadomościami. Zgłoszenie jest dostępne przez Sekcje → Opcje rozmowy → Zgłoś wiadomość, gdzie wybiera się wiadomość przed otwarciem istniejącego formularza zgłoszenia.
- Rozliczenie ma krótszy opis statusu i bardziej zwarte karty z odstępami. Usunięto pustą instrukcję ze stopki przesyłania; liczba wybranych materiałów i rozmiar plików pozostają widoczne.

## Pełne pliki, kolejność i liczba linii

Archiwum zawiera komplet poniższych plików, nie fragmenty ani diff. Należy zachować ich ścieżki. To zestaw zmian względem wcześniejszego repozytorium, nie samodzielna aplikacja.

| Kolejność | Plik | Linie |
| ---: | --- | ---: |
| 1 | `src/AgreementWorkflow.js` | 122 |
| 2 | `src/ConversationCards.jsx` | 53 |
| 3 | `src/ConversationRail.jsx` | 96 |
| 4 | `src/ConversationMessenger.css` | 228 |
| 5 | `src/PrivateWork.jsx` | 1670 |
| 6 | `src/WorkspaceMessages.jsx` | 483 |
| 7 | `src/router.jsx` | 30019 |
| 8 | `test/agreement.test.js` | 106 |

Po podmianie całego zestawu: `npm ci`, `npm test`, `npm run build`. Nie jest potrzebny nowy SQL ani zmiana uprawnień bazy. Pliki są również opublikowane przez istniejące wdrożenie GitHub/Cloudflare.

## Weryfikacja

- 38 testów aplikacji zaliczonych. Nowe testy sprawdzają zachowanie każdego pola przy edycji, brak zmiany wysłanego rekordu, zerową liczbę poprawek, jawną cenę zero i niezależne szkice formularza. Dotychczasowe testy blokady autora, kontrpropozycji, rezygnacji i obsługi głosu nadal przechodzą.
- Build Vite zaliczony. Pozostają wcześniejsze ostrzeżenia o wielkości pakietu i statycznym/dynamicznym imporcie Lucyny.
- PostCSS poprawnie parsuje arkusze. `git diff --check` bez błędów.
- Nie wykonano nowej operacji SQL na produkcji. Nie wysłano wiadomości, materiałów ani zgłoszeń do rzeczywistych użytkowników.
- Przeprowadzono przegląd kodu responsywnego i porównanie z dostarczonymi zdjęciami. Ręczna kontrola prywatnej rozmowy i fizycznego telefonu nadal wymaga zalogowanej sesji testowej; wcześniejsze ponowne logowanie anulowano. Nie oznaczamy tej kontroli jako zaliczonej.
- Edycja zdjęcia płatności wykonana narzędziem imagegen jest poglądową wizualizacją kierunku. Nie jest zrzutem wdrożonej strony ani dowodem testów przeglądarkowych.
