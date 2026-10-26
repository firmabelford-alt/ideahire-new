# IdeaHire — wiadomości wyłącznie na telefonie, 26.10.2026

Aktualizacja istniejącego repozytorium `firmabelford-alt/ideahire-new` i produkcji https://ideahire-new.pages.dev/.

## Zakres

Wszystkie nowe reguły są wewnątrz `@media (max-width:850px)`. Porównanie drzewa CSS przed i po zmianie potwierdza identyczność deklaracji poza tym zakresem. Desktop od 851 px zachowuje dotychczasowe style.

1. Lista rozmów ma zwarty nagłówek i okrągły przycisk z plusem. Pełna nazwa „Nowa rozmowa” pozostaje dostępna dla czytników ekranu. Wyszukiwanie znajduje się nad filtrami. Duże obramowane kafle zastąpiono prostymi wierszami z awatarem, nazwą, datą, tematem i podglądem ostatniej wiadomości. Długie wartości mają wielokropek; nieprzeczytane rozmowy zachowują kropkę i wyróżnienie nazwy.
2. Rozmowa, jej kontenery i obszar za polem pisania używają jednego tła `--a-soft`. Usunięto biały prostokąt za zaokrąglonym polem pisania. Zachowano jego kształt, przyciski, obsługę głosu oraz odstęp bezpiecznej strefy telefonu.
3. Materiały mają tło całej sekcji, również poniżej ostatniej przesyłki. Karty przesyłek, odbioru pracy i pustego stanu używają osobnej powierzchni `--a-paper`, obramowania i zaokrągleń. Pozostały czytelne zagnieżdżone karty tekstów, linków, plików i dostępów. Formularz wysyłania nie jest zmieniany.

Wykorzystano istniejące role kolorów, aby poprawka działała w obu szablonach oraz ich jasnym i ciemnym wariancie. Nie zmieniono bazy, zasad dostępu, płatności ani logiki wiadomości.

## Pełny plik do podmiany

| Kolejność | Plik | Aktualna liczba linii |
| ---: | --- | ---: |
| 1 | `src/ConversationMessenger.css` | 300 |

Paczka zawiera pełny plik. Zachowaj ścieżkę, zastąp całą poprzednią zawartość. Następnie `npm ci`, `npm test`, `npm run build`. Nowy SQL nie jest potrzebny.

## Sprawdzenie

- 43 testy aplikacji zaliczone.
- Build Vite zaliczony. Pozostają dotychczasowe ostrzeżenia o wielkości pakietu i imporcie Lucyny.
- PostCSS poprawnie parsuje arkusz. `git diff --check` bez błędów.
- Porównanie struktury CSS potwierdza brak zmian deklaracji dla desktopu. Nowy wygląd jest ograniczony do szerokości 850 px.
- Sesja przeglądarki pozostaje wylogowana. Nie oznaczamy prywatnej rozmowy, prawdziwego telefonu ani wszystkich wariantów jako ręcznie przetestowanych. Próba lokalnego podglądu była zablokowana przez zasady przeglądarki i nie stanowi testu wizualnego.
- Nie wysłano testowych wiadomości, plików ani zgłoszeń do rzeczywistych użytkowników.
