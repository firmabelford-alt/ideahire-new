# IdeaHire — komunikator, pełne panele i ustalenia

Data: 26.10.2026. Repozytorium: `firmabelford-alt/ideahire-new`. Produkcja: https://ideahire-new.pages.dev/.

## Zakres tej wersji

Zachowano zaakceptowane, zaokrąglone i automatycznie rosnące pole pisania. Nad historią nie ma już osobnych rzędów z nazwą rozmówcy i zakładkami. Na komputerze znajduje się wąski pasek boczny z ikonami; można go rozwinąć do menu z nazwą rozmówcy, projektem i stanem współpracy. Historia wykorzystuje wysokość panelu i szerszą kolumnę. Rozwinięcie menu nie tworzy dodatkowej kolumny po prawej.

Ustalenia, materiały i płatność zastępują historię w całej dostępnej przestrzeni roboczej. Nie otwierają się jako ciasny panel obok czatu. Każdy widok ma własne przewijanie. Formularz wysyłania materiałów również korzysta z całego dostępnego okna. Akceptacja warunków, wysyłanie plików i płatność pozostają osobnymi, świadomymi działaniami użytkownika.

Do 850 px boczne menu wysuwa się nad widokiem zamiast zwężać treść. Nad rozmową pozostaje krótki pasek; długie nazwy nie zwiększają jego wysokości. Menu obsługuje Escape, ogranicza fokus do swoich elementów i oddaje go widocznemu przyciskowi po zamknięciu. Wysokość czatu reaguje na visualViewport i klawiaturę. Formularz ustaleń przechodzi do jednej kolumny przy małej szerokości panelu. W trybie powiększenia fokus trafia do widocznego elementu także na telefonie.

## Głosówki

Wiadomość głosowa ma kompaktowy odtwarzacz: odtwarzanie/pauza, czas, przewijanie, zmianę prędkości i menu pobierania lub zgłoszenia. Paski ilustrują postęp; nie przedstawiają pomiaru amplitudy nagrania. Uruchomienie kolejnej głosówki zatrzymuje poprzednią. Odsłuch niewysłanego szkicu używa tego samego odtwarzacza. Pozostałe pliki audio zachowują zwykłe kontrolki. Zawężono starszy selektor audio, aby nie tworzył pustego miejsca pod nowym odtwarzaczem.

Nagrywanie wymaga HTTPS, obsługi MediaRecorder i zgody na mikrofon. Uruchamia je dopiero przycisk mikrofonu. Limit wynosi dwie minuty; przed wysłaniem można odsłuchać i usunąć szkic. Wyjście z rozmowy lub zablokowanie użytkownika zwalnia mikrofon i odrzuca niewysłany szkic. Przesłanie korzysta z istniejących prywatnych materiałów i czasowych adresów dostępu. Zmiana nie rozszerza uprawnień do plików i nie wymaga nowego SQL.

## Ustalenia i zakończenie negocjacji

1. Klient wysyła pierwszą propozycję dla zapytania o usługę. Autor czekającej propozycji nie może jej nadpisać.
2. Freelancer może przyjąć tę wersję, poprosić o zmiany, przedstawić własną propozycję albo zrezygnować.
3. Przy kontrpropozycji autor ponownie czeka. Klient może ją zaakceptować, zaproponować własną wersję albo wybrać „Zrezygnuj ze współpracy”.
4. Rezygnacja przed wspólną akceptacją zapisuje wiadomość dla drugiej strony i atomowo zwalnia istniejącą rezerwację miejsca w usłudze. Powtórzenie żądania nie tworzy drugiej wiadomości ani kolejnego zwolnienia.
5. Po akceptacji obu stron zakończenie negocjacji nie jest dostępne. Obowiązują osobne zasady obsługi realizacji, płatności i sporów.

Blokada edycji i operacja rezygnacji są egzekwowane także przez już wdrożoną bazę. Nowy interfejs sprawdza aktualną wersję przed zapisem. Nie opiera decyzji na tekście dowolnej wiadomości. Ta wersja nie zmienia produkcyjnego schematu bazy.

Rozróżnienie zakończenia negocjacji od anulowania zawartej umowy uwzględnia art. 68, 68¹, 70 i 72 Kodeksu cywilnego. Formularz wymaga przyjęcia całej wersji bez zmian; zmiana jest nową propozycją. Brak wpłaty sam w sobie nie oznacza braku umowy. Źródło: https://isap.sejm.gov.pl/isap.nsf/download.xsp/WDU19640160093/U/D19640093Lj.pdf (tekst z 16.10.2026). To opis działania aplikacji i zakresu weryfikacji, nie pełny audyt prawny platformy.

## Pełne pliki i kolejność

Pliki stanowią zestaw względem wcześniejszej wersji repozytorium. Publiczny arkusz jest oznaczony `/headings.css?v=20261026-messenger-9`. Archiwum zawiera pełną treść plików, bez fragmentów i diffów.

| Kolejność | Plik | Linie |
| ---: | --- | ---: |
| 1 | `src/AgreementWorkflow.js` | 63 |
| 2 | `src/ConversationRail.jsx` | 90 |
| 3 | `src/ConversationMessenger.css` | 168 |
| 4 | `src/VoicePlayback.js` | 15 |
| 5 | `src/VoicePlayer.jsx` | 82 |
| 6 | `src/VoicePlayer.css` | 31 |
| 7 | `src/VoiceMessages.jsx` | 119 |
| 8 | `src/WorkspaceMessages.jsx` | 494 |
| 9 | `src/router.jsx` | 30086 |
| 10 | `index.html` | 68 |
| 11 | `test/agreement.test.js` | 81 |
| 12 | `test/voice.test.js` | 149 |
| 13 | `supabase/sql/verify/conversation-negotiation.mjs` | 278 |

## Sprawdzenia i ograniczenia

- `npm test`: 36 testów zaliczonych, w tym blokada autora, kontrpropozycja, dopuszczalne decyzje klienta, odmowa niedozwolonych działań i obsługa głosu.
- Izolowana baza PostgreSQL/PGlite: 15 testów zaliczonych. Obejmują scenariusz klient → blokada edycji → kontrpropozycja freelancera → rezygnacja klienta → wiadomość i zwolnienie miejsca. Testy nie zapisywały danych do produkcji.
- `npm run build`: zaliczony po końcowych poprawkach. Pozostają wcześniejsze ostrzeżenia o wielkości pakietu i statycznym/dynamicznym imporcie Lucyny.
- Oba arkusze CSS poprawnie parsowane przez PostCSS. `git diff --check`: bez błędów.
- Cloudflare Pages potwierdził wdrożenie nowego układu z commitu `b9e1e0f0d51e1fb016a7567c041cafd66cb3ce70`. Użytkownik potwierdził, że widzi nową wersję i akceptuje jej kierunek. Drobne końcowe poprawki fokusu i selektora audio nie zmieniają tego układu.
- Ręcznej kontroli tej wersji w prywatnej rozmowie nie udało się dokończyć: przeglądarka utraciła sesję, a ponowne logowanie anulowano. Nie wysłano wiadomości ani plików do rzeczywistych rozmówców, nie akceptowano ustaleń i nie uruchamiano płatności.
- Do ręcznej kontroli pozostają rzeczywiste nagrywanie/odsłuch, przełączanie widoków na zalogowanym koncie oraz zachowanie mobilnej klawiatury w iOS/Android. Przejrzano kod responsywny; nie jest to równoznaczne z testem na fizycznym telefonie.
