# IdeaHire — przebudowa edytora i panelu pracy

Wersja: studio-20261027. Pełne pliki do zastąpienia; nie fragmenty i nie różnice.

## Co zostało przebudowane

- Nowy edytor konta z lewą nawigacją na laptopie i przewijaną listą sekcji na telefonie. Usunięto wielki wybór zakładki i powtórzone nagłówki.
- Dane profilu: nowe sekcje zdjęcia, nazwy, kraju i opisu; prywatny e-mail oddzielony od publicznego podglądu.
- Umiejętności: nowy wybór dziedzin, konkretne narzędzia i doświadczenie. Po trzeciej kategorii można odznaczyć wybraną, a czwarta pozostaje zablokowana.
- Zapis profilu dostępny w kompaktowym pasku. Na telefonie pasek uwzględnia dolną nawigację.
- Portfolio jako galeria. Formularz otwiera się przy dodawaniu lub edycji; zachowuje szkic i wybrane pliki po powrocie do sekcji.
- Ustawienia dopasowania i wyglądu mają nową kompozycję. Widoczność i kontakt, wypłaty, prywatność i własne ogłoszenia otrzymały wspólne powierzchnie edytora.
- Panel pracy: narzędzia po lewej, jeden zestaw filtrów z podkreśleniem, wyszukiwanie i nowy układ kart współprac. Na telefonie narzędzia są zwijane.
- Krótkie animacje treści i interakcji, bez opóźniania zmiany trasy. Logo otwarcia przechodzi w treść w 200 ms, gdy treść istnieje; usunięto wymuszony czas i rozsuwane zasłony.
- Wskaźnik rzeczywistego ładowania używa znaku IdeaHire. Tryb ograniczonego ruchu pozostaje obsługiwany.

## Kolejność plików

| Kolejność | Dokładna ścieżka | Linie |
| --- | --- | ---: |
| 1 | `src/Studio.css` | 374 |
| 2 | `src/PageMotion.css` | 10 |
| 3 | `src/ProfileStudio.jsx` | 136 |
| 4 | `src/WorkDesk.jsx` | 55 |
| 5 | `src/Subpages.jsx` | 307 |
| 6 | `src/Workspace.jsx` | 440 |
| 7 | `src/Brand.css` | 52 |
| 8 | `src/BrandOpening.jsx` | 151 |
| 9 | `src/router.jsx` | 29367 |
| 10 | `test/studio.test.js` | 107 |

Publikacja powinna obejmować wszystkie pliki źródłowe jednocześnie. Plik testowy służy do kontroli lokalnej. W tej paczce nie ma nowej migracji SQL.

## Sprawdzenie

- 56 testów aplikacji przeszło: 46 dotychczasowych i 10 nowych dla formularzy, ograniczeń, szkiców, stanów zapisu, podglądów współprac i otwarcia z logo.
- Produkcyjna kompilacja Vite przeszła. Arkusze CSS zostały sprawdzone parserem; kontrola różnic nie wykazała błędów białych znaków.
- Aktualizacja zachowuje istniejące operacje profilu, portfolio, widoczności, wypłat i współprac. Nie wykonano próbnych zapisów ani płatności na kontach użytkowników.
- Przygotowano reguły dla telefonu, laptopa oraz istniejących palet i trybów jasnego/ciemnego.
- Ograniczenie kontroli wizualnej: przeglądarka ma wylogowaną sesję. Prywatny edytor i panel pracy nie zostały ręcznie sprawdzone w zalogowanej sesji ani na fizycznym telefonie. Testy renderowania komponentów nie zastępują takiego przeglądu.

## Gdzie wejść

Po odświeżeniu IdeaHire otwórz Konto → Edytuj profil, Umiejętności lub Portfolio; panel pracy jest pod zakładką Praca. W nowym edytorze nie ma dużej listy wyboru ponad nagłówkiem. W panelu pracy narzędzia są po lewej stronie na laptopie.
