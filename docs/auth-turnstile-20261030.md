# IdeaHire — Turnstile formularzy konta

Data: 30 października 2026. Baza: main 3e7009a49f9a366a464c65d865f7ba2351eea144.

## Stan wydania

Kod obsługuje logowanie przez e-mail, rejestrację i wysłanie linku resetującego hasło. Aktywację kontroluje nowa zmienna budowania VITE_AUTH_TURNSTILE_ENABLED. Bez wartości true aplikacja nie ładuje widgetu i korzysta z dotychczasowej ścieżki Auth. Sam istniejący Site key nie włącza nowej funkcji.

Konfiguracja widgetu w Cloudflare, klucze i włączenie kontroli CAPTCHA w Supabase nie zostały wykonane w tym wydaniu. Logowanie do konta Cloudflare nie zostało ukończone. Ochrona nie jest potwierdzona jako aktywna na działającej stronie.

Serwerowe minimum hasła 12 znaków zapisano i ponownie odczytano w panelu Supabase we wcześniejszym etapie. Ta paczka nie zmienia tej konfiguracji.

## Pełne pliki aplikacji

Zalecana jest jedna publikacja obejmująca wszystkie pięć plików. Przy ręcznej podmianie router należy wgrać ostatni.

| Kolejność | Plik | Linie |
| --- | --- | ---: |
| 1 | src/AuthCaptchaSession.js | 39 |
| 2 | src/AuthCaptcha.css | 42 |
| 3 | src/AuthCaptcha.jsx | 150 |
| 4 | src/auth.js | 98 |
| 5 | src/router.jsx | 28755 |

Zachowano pozostałe funkcje kont, zleceń, usług, wiadomości, płatności, prywatności i administracji. Integracja Google OAuth nadal ma osobną ścieżkę. Zmiana nie wymaga SQL ani wdrożenia Edge Function.

## Kolejność aktywacji

1. W Cloudflare Turnstile utwórz lub zweryfikuj widget dla ideahire-new.pages.dev, tryb Managed. Pre-clearance pozostaw wyłączone. Nie dodawaj ogólnego hosta pages.dev.
2. W konfiguracji budowania projektu Pages ustaw publiczny VITE_TURNSTILE_SITE_KEY oraz VITE_AUTH_TURNSTILE_ENABLED=true. Secret key nie może trafić do zmiennych VITE_, repozytorium ani kodu przeglądarki.
3. Ustaw właściwe zmienne także dla używanych podglądów korzystających z tej samej bazy, a następnie wykonaj nowy build. Sam zapis zmiennej nie zmienia opublikowanego JavaScriptu.
4. Przy nadal wyłączonej kontroli CAPTCHA w Supabase sprawdź weryfikację w trzech formularzach. Sprawdź wygasanie, ponowienie po błędzie, telefon, laptop, oba motywy i warianty wyglądu.
5. Dopiero wtedy w Supabase Authentication → Attack Protection wybierz Cloudflare Turnstile, wpisz Secret key i zapisz kontrolę serwerową.
6. Potwierdź rzeczywiste operacje Auth i walidacje w Turnstile Analytics. Testy tego wydania używały atrap dostawcy; nie zastępują tej kontroli.

Jawne włączenie funkcji bez Site key blokuje wysyłanie formularza i pokazuje błąd weryfikacji. Token jest jednorazowy, przechowywany tylko w pamięci formularza i unieważniany przy zmianie formularza, motywu lub języka. Każda zakończona próba wymaga nowego tokena. Późne odpowiedzi usuniętego widgetu nie odblokowują formularza.

Wymóg serwerowy obejmie także stare, nadal otwarte karty aplikacji i starsze podglądy. Trzeba odświeżyć je do właściwego wydania. Aktualne komunikaty CAPTCHA wskazują odświeżenie strony, jeśli weryfikacja nie jest widoczna.

## Weryfikacja

- 114 testów projektu: zaliczone.
- 14 izolowanych scenariuszy React formularzy z atrapą Turnstile: zaliczone.
- Porównanie routera: 224 pozostałe instrukcje najwyższego poziomu, poza importami, Login i Register, są identyczne z bazą.
- Kompilacja z włączoną funkcją i publicznym kluczem testowym Cloudflare: zaliczona.
- Kompilacja przy domyślnie wyłączonej funkcji: zaliczona.
- Dane dwóch istniejących plików testów usuwania uzupełniono o już wymagane wpisywane potwierdzenie. Nie zmieniono walidacji ani kodu wykonującego usuwanie.
- Nie wykonywano rzeczywistych płatności, usuwania danych, rejestracji kont ani wysyłki wiadomości resetujących.

WAF własnej domeny i Access dla podglądów pozostają osobnymi ustawieniami, nie są częścią aktywacji tego widgetu.
