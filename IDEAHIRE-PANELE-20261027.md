# IdeaHire — ustawienia, usługi i wspólna góra katalogów, 27.10.2026

Repozytorium: `firmabelford-alt/ideahire-new`. Produkcja: https://ideahire-new.pages.dev/.

## Zmiany

1. „Zmień” w ustawieniach korzystania: sama zębatka i tekst, na przezroczystym tle, z zachowanym fokusem i otwieraniem dotychczasowego formularza.
2. Ustawienia i prywatność: czytelny układ kart na laptopie i telefonie. Treść prywatności zajmuje całą szerokość; przycisk znajduje się pod tekstem. Usunięto konkurencję opisu i długiej akcji o jedną wąską kolumnę. Podsumowanie preferencji ma dwie kolumny na laptopie i jedną na telefonie.
3. „Moje usługi”: spójna karta pustego widoku z ikoną, krótkim opisem i właściwym przyciskiem. Istniejące oferty mają uporządkowane obszary treści, statusu i akcji. Na telefonie wszystkie trzy obszary układają się pionowo, bez pozostawiania statusu w niejawnej drugiej kolumnie.
4. Zlecenia, Freelancerzy i Usługi używają tego samego `MarketCatalogHeader`. Licznik i komunikaty ładowania mają wspólne miejsce; usunięto powtórzone liczniki. Zachowano filmy i nawigację między katalogami. Wspólne reguły filtrów wyrównują wysokości i odstępy. Na telefonie filtry dziedziny i sortowania są pełnej szerokości, jeden pod drugim. Na laptopie pozostaje boczna lista dziedzin oraz wyszukiwanie i sortowanie.
5. Usunięto dodatkową górną linię listy ostatnich rozmów w panelu konta, na obu szerokościach. Obramowanie samej karty pozostaje.
6. W menu strony głównej pogrubiono wyłącznie odnośniki „Poznaj IdeaHire”, „Kategorie” i „Dla Ciebie”. Zmiana jest przypisana do ich adresów, działa również po przełączeniu języka i nie obejmuje pozostałych pozycji.

Kolory pochodzą z istniejących ról obu szablonów i ich jasnego/ciemnego wariantu. Nie zmieniono zapytań, operacji zmiany statusu usług ani zasad dostępu. Nie jest potrzebny nowy SQL.

## Pełne pliki i kolejność

W paczce są pełne pliki, nie diff. Zachowaj ścieżki. Wszystkie cztery pliki stanowią jeden zestaw; nowy arkusz musi istnieć przed budowaniem importującego go modułu.

| Kolejność | Plik | Linie |
| ---: | --- | ---: |
| 1 | `src/InterfaceRefinements.css` | 92 |
| 2 | `src/MarketUI.jsx` | 715 |
| 3 | `src/ServiceMarketplace.jsx` | 1868 |
| 4 | `src/router.jsx` | 29993 |

Po podmianie: `npm ci`, `npm test`, `npm run build`. Aktualizacja jest publikowana przez istniejące GitHub/Cloudflare.

## Weryfikacja

- Zaliczone 43 istniejące testy aplikacji i build Vite.
- PostCSS poprawnie parsuje nowy arkusz; `git diff --check` bez błędów.
- Funkcje pobierania własnych usług i zmiany ich statusu są identyczne jak przed aktualizacją.
- Nowe reguły odpowiadają za układ i prezentację. Niewielkie ekrany mają osobne reguły od 850 px w dół; układ komputerowy pozostaje jawnie zdefiniowany.
- Nie oznaczono prywatnych ustawień, własnych usług i fizycznego telefonu jako ręcznie przetestowanych. Sesja kontrolnej przeglądarki wymaga zalogowania; nie powtarzano wcześniejszej prośby o logowanie.
- Wizualizacja imagegen powstała z dokładnie wskazanego zdjęcia i pokazuje usunięcie szarej kreski. Nie jest zrzutem wdrożonego interfejsu ani dowodem testu przeglądarkowego.
- Nie wykonywano SQL ani nie wysyłano wiadomości, zgłoszeń lub materiałów do użytkowników.
