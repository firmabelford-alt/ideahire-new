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
