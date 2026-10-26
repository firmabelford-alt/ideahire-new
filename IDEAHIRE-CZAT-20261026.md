# IdeaHire — komunikator i wiadomości głosowe

Data: 26.10.2026. Repozytorium: `firmabelford-alt/ideahire-new`. Zmiana aplikacji: commit `ed4e1ed302359ee5fafdde6359a31018bdf393b7`, drzewo `3ec89824f01bdcb9f6525f0921ee9acfc87ce1a7`. Cloudflare Pages potwierdził udane wdrożenie produkcyjne.

## Układ

Rozmowa zajmuje dostępną wysokość okna. Historia ma własne przewijanie i kolumnę do 960 px, miękkie dymki oraz zaokrąglone, automatycznie rosnące pole pisania. Narzędzia dodawania materiałów, zdjęć, nagrywania i wysyłania znajdują się w dolnym wierszu pola. Usunięto pasek „Co dalej” nad historią.

Od 1180 px otwarcie ustaleń, materiałów lub płatności pokazuje dany panel po prawej stronie rozmowy. Kolumny mają równą wysokość i osobne przewijanie. Na węższych ekranach wybrana zakładka zajmuje całe okno. Cztery przyciski nawigacji mieszczą się w jednym rzędzie; na najwęższych ekranach pomijany jest dodatkowy licznik materiałów. Od 1440 px zwykła rozmowa ma podsumowanie współpracy po prawej.

Na telefonie wysokość korzysta z visualViewport, aby dostosować widok do klawiatury. Pole tekstowe ma od 40 do 128 px; w trybie klawiatury górny pasek jest niższy. Tryb powiększenia i obsługa Escape pozostają dostępne.

## Głosówki

Nagrywanie wymaga HTTPS, obsługi MediaRecorder i zgody użytkownika na mikrofon. Uruchamia je dopiero przycisk mikrofonu. Limit wynosi dwie minuty. Po zatrzymaniu pojawia się odsłuch, usunięcie szkicu i osobny przycisk wysłania. Niewysłany plik pozostaje w pamięci karty. Zmiana rozmowy, jej zablokowanie lub opuszczenie widoku zatrzymuje mikrofon i odrzuca szkic. Przejście karty w tło zatrzymuje nagrywanie.

Przeglądarkowy format nagrania jest przetwarzany lokalnie do WAV, mono, 24 kHz, PCM 16 bit. Taki plik obsługuje działająca wersja 23 funkcji `ideahire-secure-work` i istniejący prywatny bucket `ideahire-private-work`. Przygotowanie sesji, podpisany upload i przekazanie materiału używają tego samego sprawdzania uczestników rozmowy co dotychczasowe pliki. Ta wersja nie wymaga nowego SQL ani zmiany uprawnień bucketa.

Utrata odpowiedzi po wysłaniu nie powoduje ponownego wysłania ani usunięcia potencjalnie zapisanego pliku. Aplikacja sprawdza dokładny identyfikator materiału z sesji. Jeśli wyniku nadal nie można potwierdzić, prosi o odświeżenie rozmowy. Odtwarzanie korzysta z czasowych prywatnych adresów; nagrania podlegają istniejącej moderacji materiałów. W polityce prywatności dodano opis nagrywania, odsłuchu i obsługi wysłanych plików.

## Pliki

Poniższe pliki należy zachować razem. Publiczny arkusz ma wersję `/headings.css?v=20261026-messenger-8`.

| Plik | Linie |
| --- | ---: |
| `index.html` | 68 |
| `src/ConversationMessenger.css` | 163 |
| `src/WorkspaceMessages.jsx` | 504 |
| `src/router.jsx` | 30078 |
| `src/public/headings.css` | 2249 |
| `src/PrivateWork.jsx` | 1670 |
| `src/VoiceMessages.jsx` | 113 |
| `src/VoiceRecording.js` | 105 |
| `src/VoiceTransfer.js` | 31 |
| `src/TermsOfService.jsx` | 193 |
| `test/voice.test.js` | 135 |

## Weryfikacja

- `npm run build`: zaliczony. Pozostają istniejące ostrzeżenia o wielkości pakietu i statycznym/dynamicznym imporcie Lucyny.
- `npm test`: 28 zaliczonych testów. Nowe testy obejmują cykl mikrofonu, późne rozstrzygnięcie pozwolenia, odmowę dostępu, limit czasu i danych, WAV i resampling oraz sukces, odrzucenie i niepewny wynik przesyłania.
- PostCSS: oba zmienione arkusze poprawnie parsowane. `git diff --check`: bez błędów.
- Ręcznie na zalogowanym koncie Janek w Chrome, widok 1355 × 936: dwie istniejące rozmowy, pytanie o usługę, zwykłe własne wiadomości, pusty i sześciowierszowy szkic, automatyczna wysokość pola, widoczność ostatniej wiadomości, ustalenia/materiały/płatność obok czatu, okno przesyłania materiałów, jasny i ciemny motyw, powiększenie i wyjście przez Escape.
- Pomiar zwykłego okna: 1315 × 852 px. Kolumny w widoku z panelem miały tę samą wysokość 712 px; brak poziomego przepełnienia. Powiększenie: 1323 × 904 px. Po teście szkic wyczyszczono i przywrócono jasny motyw.
- Podczas kontroli nie wysłano wiadomości ani plików do istniejących rozmówców, nie akceptowano ustaleń i nie uruchamiano płatności.
- Do sprawdzenia na urządzeniu: rzeczywisty mikrofon i odsłuch/wysłanie głosówki oraz mobilna klawiatura w iOS/Android. W tej sesji nie było fizycznego telefonu ani testowej wymiany nagrań między dwoma kontami.
