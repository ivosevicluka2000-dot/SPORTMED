# Brendiranje izveštaja

- Klinika koristi fiksni fajl `public/brand/clinic-logo.png`, dostavljeni logo klinike sa trkačem i srcem. Isti logo se prikazuje na prijavi i u zaglavlju rehab platforme.
- Glavni administrator postavlja ili menja logo na stranici **Klubovi**, u kartici odgovarajućeg kluba. Prihvataju se PNG, JPG i WebP do 2 MB i 16 megapiksela.
- Logo se prikazuje u zbirnom i pojedinačnom izveštaju, kratkom izveštaju i štampanom planu rehabilitacije. Klub bez učitanog logotipa prikazuje samo svoje ime. Nema zamenskog logotipa klinike.
- Server proverava dozvole i dekodira sliku u PNG, uz očuvanje proporcija i providnosti. Slike se čuvaju u javnom bucketu `rehab-club-logos`; medicinske slike ostaju u postojećem privatnom bucketu.
- Migracija `supabase/migrations/0011_rehab_report_branding.sql` primenjena je u produkciji 15. septembra 2026. kroz Supabase SQL Editor, u jednoj transakciji. Potvrđeni su kolona `rehab_workspaces.logo_path` i bucket preko REST API-ja. Ne pokretati je ponovo. Migracija dodaje ograničenje pripadnosti slike klubu i pravila upisa u storage; ne menjaju se postojeća prava pristupa klubovima.
- Svaka zamena dobija novi URL. Stare slike ostaju dostupne već otvorenim izveštajima; nisu automatski obrisane pri zameni.

Provera: `npm run build`, `npm run test:rehab`, `npm run test:rehab:browser`. Testovi koriste izdvojenu bazu i sintetičke naloge, bez produkcionih podataka.
