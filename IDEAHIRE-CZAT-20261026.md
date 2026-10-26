# IdeaHire — ciemny turkus i wiadomości, 26.10.2026

Repozytorium: `firmabelford-alt/ideahire-new`. Produkcja: https://ideahire-new.pages.dev/.
Zachowano zaakceptowany układ komunikatora i zaokrąglone pole pisania.

## Paleta ciemnego turkusu

Jaskrawy cyjan zastąpiono grafitową bazą i przygaszonym morskim akcentem. Nowe kolory dotyczą wyłącznie ciemnego wariantu obecnego szablonu. Jasny wariant oraz szablon klasyczny pozostają poza zakresem nowej warstwy kolorów.

| Rola | Kolor |
| --- | --- |
| Tło strony | `#161c1d` |
| Karty i panele | `#20292a` |
| Podniesiona powierzchnia | `#2c3839` |
| Główny tekst | `#f1eee7` |
| Tekst pomocniczy | `#bdc7c1` |
| Krawędzie | `#718984` |
| Morski akcent | `#8fb7ad` |
| Tekst na akcencie | `#142923` |

Rejestr w `Preferences.jsx` i arkusz pierwszego renderowania korzystają z tej samej palety. Arkusz `dark-turquoise.css` jest ładowany przed warstwami starszych stylów. Skrypt w `index.html` ustawia zapisany motyw przed wczytaniem arkusza. Nowa warstwa ustala kolory bez zmiany fontów i wymiarów.

Zsynchronizowano kolory nawigacji, nagłówków, panelu konta, rozmów, ustaleń, materiałów, płatności oraz asystenta. Poprawiono pary tła i tekstu przycisków, menu i podpowiedzi. Warstwa z priorytetem dla kolorów rozwiązuje konflikt ze starszymi selektorami o bardzo wysokiej specyficzności.

## Wiadomości i materiały

- Na telefonie usunięto duży poziomy rząd Ustalenia/Materiały/Płatność. Przycisk „Projekt” otwiera panel od dołu z pełnymi nazwami sekcji i opcjami rozmowy. Zachowano zamykanie klawiszem Escape, obsługę fokusu i blokowanie tła.
- Na komputerze zachowano boczną nawigację. Treść rozmowy i pole pisania mają wspólną szerokość do 1120 px oraz wyrównane marginesy. Lista rozmów ma spójne karty i odstępy.
- Przesłane materiały mają tło, obramowanie, uporządkowany nagłówek oraz osobne karty plików, linków, tekstu i danych dostępowych. Długie nazwy i wartości mogą się zawijać. Zestawy materiałów mają wyraźną datę i autora przekazania.
- Przyciski „Zgłoś” mają zwarty, obramowany styl aplikacji. Dotyczy to materiałów, podglądu zdjęcia, przekazanej pracy i zwykłego pliku audio. Zgłaszanie nadal otwiera istniejący formularz.
- Przycisk otwarcia bezpiecznego linku ma jawnie dobrane tło i kontrastowy tekst. Usunięto konflikt, który powodował ciemny napis na ciemnym tle.
- Natywny element audio w komponencie głosówki jest ukryty; sterowanie realizuje istniejący odtwarzacz. Nie powinien tworzyć pustej ramki nad wiadomością.
- Formularz wysyłania materiałów zachowuje dotychczasową postać. Nie zmieniono zapytań, zasad dostępu ani operacji płatniczych.

## Zachowany przebieg ustaleń

„Edytuj ustalenia” otwiera cały aktualny formularz z zachowaniem pól. Wysłanie tworzy nową propozycję do akceptacji. Uwagi strony omawiają w rozmowie; osobny formularz „Co wymaga zmiany?” pozostaje usunięty. Autor oczekującej propozycji nie może nadpisać wysłanej wersji. Zaakceptowanych ustaleń nie można edytować tym trybem.

Formularz ustaleń, materiały i rozliczenie zachowują wyśrodkowaną szerokość do 960 px oraz jedno przewijanie panelu. Na telefonie pola przechodzą do jednej kolumny. Zwykłe wiadomości mają obramowanie, a opcje zgłoszenia wiadomości są w menu rozmowy.

## Pełne pliki, kolejność i liczba linii

Archiwum zawiera pełne pliki, nie fragmenty ani diff. Należy zachować ścieżki. Jest to zestaw aktualizacji istniejącego repozytorium, nie samodzielna aplikacja.

| Kolejność | Plik | Linie |
| ---: | --- | ---: |
| 1 | `src/public/dark-turquoise.css` | 119 |
| 2 | `src/Preferences.jsx` | 2557 |
| 3 | `src/ConversationRail.jsx` | 91 |
| 4 | `src/ConversationMessenger.css` | 263 |
| 5 | `src/PrivateWork.jsx` | 1670 |
| 6 | `src/VoicePlayer.jsx` | 82 |
| 7 | `src/VoiceMessages.jsx` | 119 |
| 8 | `index.html` | 69 |
| 9 | `test/theme.test.js` | 50 |

Po podmianie zestawu: `npm ci`, `npm test`, `npm run build`. Zmiany są publikowane przez istniejący GitHub/Cloudflare. Nie jest potrzebny nowy SQL ani zmiana uprawnień bazy.

## Weryfikacja i jej granice

- 43 testy aplikacji zaliczone. Pięć testów palety sprawdza kontrast wszystkich powierzchni, kolorów tekstu, przycisków, granic i fokusu, zgodność arkusza z rejestrem oraz zakres i brak zmian metryk w warstwie kolorów.
- Najniższy kontrast na podniesionej powierzchni: główny tekst 10,47:1; tekst pomocniczy 6,99:1; akcent 5,51:1; krawędzie 3,24:1. Tekst na przycisku akcentowym: 6,96:1.
- Build Vite zaliczony. PostCSS parsuje arkusze, `git diff --check` bez błędów. Pozostają wcześniejsze ostrzeżenia o wielkości pakietu oraz statycznym/dynamicznym imporcie Lucyny.
- Cloudflare potwierdził wdrożenie kodu. Na działającej publicznej stronie ręcznie otwarto menu i sprawdzono nowe tła oraz kontrast przycisków. Zachowano Inter i wysokość nagłówka 80 px; kontrolny nagłówek „Specjalizacje” nadal ma 48 px. Szerokość dokumentu 1355 px mieści się w oknie 1363 px.
- Ręczna kontrola publicznej strony nie zastępuje testu prywatnej rozmowy. Sesja przeglądarki jest wylogowana; nie powtarzano anulowanego logowania. Prywatnych materiałów, faktycznej rozmowy dwóch kont i fizycznego telefonu nie oznaczono jako ręcznie przetestowanych. Responsywność sprawdzono w kodzie i względem zdjęć użytkownika.
- Nie wykonano nowej operacji SQL ani nie wysłano wiadomości, materiałów, zgłoszeń lub płatności do rzeczywistych użytkowników.

Zrzut dołączony do wydania przedstawia rzeczywistą publiczną stronę po wdrożeniu. Nie jest makietą.
