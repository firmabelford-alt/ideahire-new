# Konfiguracja Supabase Auth dla IdeaHire

Kod aplikacji obsługuje reset hasła pod adresem głównym z parametrem
`?recovery=1`. Dzięki temu link nie wymaga osobnej reguły routingu serwera.

## URL Configuration

W Supabase Dashboard otwórz **Authentication → URL Configuration** i ustaw:

- **Site URL**: główny adres wdrożonej aplikacji, np. `https://twoja-domena.pl`
- **Redirect URLs**:
  - `https://twoja-domena.pl/**`
  - `http://localhost:5173/**` dla lokalnego uruchamiania

W produkcji najlepiej podać dokładną domenę zamiast szerokiego wildcardu.

## Szablon wiadomości resetującej

W **Authentication → Email Templates → Reset password** przycisk lub link
powinien prowadzić do:

```html
<a href="{{ .ConfirmationURL }}">Zresetuj hasło</a>
```

Nie zastępuj `ConfirmationURL` samym `SiteURL`, ponieważ wtedy Supabase nie
dołączy tokenu potrzebnego do utworzenia sesji odzyskiwania.

Po zmianie kodu należy poprosić o nową wiadomość resetującą. Stare linki mogą
być już wykorzystane, wygasłe albo utworzone dla wcześniejszego przepływu PKCE.
