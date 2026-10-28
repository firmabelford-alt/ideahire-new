# Panel administracyjny IdeaHire

Wydanie z 28 października 2026. Zmiany obejmują interfejs istniejących funkcji. Publikacja odbywa się przez repozytorium GitHub i jego dotychczasowy proces budowania strony.

## Praca w panelu

- Sprawy i spory: osobne widoki kolejki, rejestru działań i dostępu zespołu. Filtry aktywne, bez opiekuna, moje, oczekujące na odpowiedź, odwołania i zakończone pozostają dostępne.
- Wnioski RODO: lista i szczegóły wybranego wniosku. Status, korespondencja, analiza ochrony danych i historia są rozdzielone. Wnioski po terminie mają priorytet; zamknięte przez użytkownika nie trafiają do aktywnych ani zaległych.
- Usuwanie danych: osobna kolejka wniosków oraz etapy tożsamości, zakresu danych, przygotowania, zatwierdzenia i wykonania operacji. Istniejące blokady i zakresy operacji pozostają egzekwowane przez serwer.
- Ogłoszenia i wiadomości dowodowe: wyszukiwanie, wybór wpisu z listy oraz pełny podgląd szczegółów. Dostęp do moderacji i powiązanej sprawy jest zachowany.
- Moderacja: zgłoszenia, decyzja o koncie, odwołania i historia w oddzielnych zakładkach. Nie dodano nowego mechanizmu automatycznego usuwania ogłoszeń ani blokowania kont.
- Dostęp zespołu: widoczny właścicielowi. Nadanie lub odebranie roli wymaga jawnego potwierdzenia.
- Rejestr działań: czytelne nazwy operacji, wykonawca i data; surowy kod można rozwinąć.
- Lucyna: przycisk w nagłówku otwiera istniejące okno asystentki bez opuszczania formularza. Pełny obszar `/admin/lucyna` zawiera również sześć instrukcji zespołu. Instrukcje działają bez połączenia z modelem. Generowanie odpowiedzi korzysta z dotychczasowej konfiguracji, uprawnień i limitów Lucyny. Akta spraw nie są automatycznie przekazywane do AI.

Na laptopie nawigacja jest po lewej stronie. Na telefonie otwiera się jako menu z obsługą klawiatury. Zakładki zachowują zamontowane formularze i ich wpisaną treść. Operacje nie są automatycznie ponawiane po przekroczeniu czasu oczekiwania; komunikat odróżnia brak potwierdzenia od błędu biznesowego. Ponowne odczytanie danych nie przeładowuje całej strony.

## Zakres publikacji i sprawdzenie

Nie uruchamiano banów, usuwania danych, zmian ról ani płatności na rzeczywistych kontach. Wydanie nie wymaga nowej migracji. Integracja CAPTCHA i nieukończona nowa ścieżka moderacji ogłoszeń są odłożone i nie są częścią tego wydania.

Weryfikacja obejmuje kompilację produkcyjną, testy automatyczne interfejsu i logiki kolejek oraz porównanie nazw i liczby istniejących wywołań serwera w siedmiu obszarach administracji. Osobny odbiór zalogowanych widoków i aktywnego połączenia AI wymaga konta z właściwymi uprawnieniami; sam poprawny build ich nie potwierdza.

## Korekta układu po przeglądzie widoków mobilnych

- Nagłówek wniosku ma naturalną wysokość i nie dziedziczy pionowego rozciągnięcia starego układu.
- Pole wyszukiwania ma jedną ramkę; ogólne style pól nie przesłaniają stylu wyszukiwarki.
- Na telefonie i w węższym oknie listę zastępuje wybór wpisu nad jego szczegółami. Na szerokim ekranie lista ma strony po sześć pozycji, bez wewnętrznego obcinania kolejnych wpisów.
- Przycisk przygotowania operacji ma szerokość dopasowaną do tekstu. Identyfikator użytkownika jest dostępny w rozwijanych szczegółach.
- Sprawy mają krótsze wiersze zachowujące status, przypisanie, kwotę i datę. Rejestr działań ma wyszukiwanie, wykonawcę, datę i odsyłacz do powiązanej sprawy. Kody techniczne są opcjonalne.
- Lucyna pozostaje dostępna w nagłówku; zamknięte okno nie dodaje pływającego przycisku nad treścią administracji.

Kompilacja produkcyjna i 90 testów automatycznych przechodzą. Porównanie istniejących operacji serwerowych w siedmiu obszarach nie wykazało usunięcia ani zmiany wywołań.

## Uproszczony widok telefonu

Do 700 px szerokości wybór sekcji zastępuje wielowierszowe zakładki. Wszystkie sekcje, ich liczniki i wpisane formularze pozostają dostępne; zmiana sekcji nie uruchamia operacji na danych. Na szerszym ekranie nadal wyświetlają się dotychczasowe zakładki.

Etapy usuwania danych mają na telefonie zwinięte podsumowanie z liczbą zrealizowanych etapów. Rozwinięcie pokazuje wszystkie pięć etapów, w tym osobno zatwierdzenie i wykonanie. Nie zmieniono warunków ich zaliczania.

Karty mają subtelne cienie, spokojniejsze separatory i jednolite odstępy. Pola zachowują czytelny kolor obramowania, rozmiar tekstu 16 px i widoczny fokus. Formularze, historia, instrukcje Lucyny oraz menu administracji otrzymały układ dopasowany do telefonu. Krótkie przejścia kolorów i obrót strzałki są wyłączone przy ustawieniu ograniczenia ruchu.

Kompilacja produkcyjna i 91 testów automatycznych przechodzą. Ten etap zmienia wyłącznie wspólne komponenty i style administracji, bez zmian w wywołaniach serwera, uprawnieniach i operacjach na kontach. Nie przeprowadzono jeszcze wizualnego odbioru zalogowanych ekranów w przeglądarce.

## Korekta po kolejnych zdjęciach

Nagłówki administracji mają wspólny, zwarty układ. Pełne objaśnienia widoku pozostają pod rozwinięciem, a informacja o uprawnieniach jest widoczna obok tytułu. Opis rejestru dotyczy rejestru, zamiast powtarzać opis kolejki sporów. Tekst w obszarze pracy jest jawnie wyrównany do początku wiersza i nie dziedziczy centrowania starych podstron.

Wybór sekcji i wpisu korzysta z istniejącej listy IdeaHire, zamiast wywoływać systemowe okno wyboru telefonu. Zachowane są opcje, liczniki, obsługa klawiatury i zamontowane formularze.

Rejestr ma strony po dziesięć wpisów; wyszukiwanie obejmuje wszystkie wczytane wpisy. Link do sprawy ma postać dostępnego przycisku w wierszu działania. Wykonawca i pełna data są widoczne poniżej. Przełącznik kodów technicznych pozostał dostępny w krótkim przycisku, bez osobnego dużego pola wyboru.

93 testy i kompilacja produkcyjna przechodzą. Porównanie kodu nie wykazało zmian w 314 operacjach na danych w pliku routera ani we wspólnym wywołaniu administracyjnym. Próba podglądu po bezpiecznym logowaniu zatrzymała się na braku potwierdzonego dostępu administracyjnego sesji. Nie nadawano żadnych uprawnień.
