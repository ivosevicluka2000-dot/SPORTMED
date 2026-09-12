# Osnovni rehabilitacioni modul — postavljanje i provera

Modul je odvojena interna platforma na ruti `/rehab`. Nije deo javnog sajta niti javne navigacije. Glavni administrator joj pristupa iz postojećeg admin panela, dok kolege koriste poseban ulaz `/rehab/prijava`.

## Šta je uključeno

- odvojena klinika i proizvoljan broj klubova
- kartoni pacijenata i igrača
- dnevni unos stanja, bola, terapije i napomene
- novi rehabilitacioni planovi po ciklusima, uz očuvane izvorne dnevne planove
- štampa planova i izveštaja za jednu, više ili sve osobe iz klinike/kluba; PDF iz browsera
- srpski i engleski interfejs platforme i štampe
- termini i pripremljen email podsetnik 24 sata ranije (aktivaciju proveriti posebno)
- mesečni i godišnji brojevi, uključujući završene rehabilitacije, uz ručno unet zaključak
- pristup admina, fizioterapeuta, predstavnika kluba i igrača
- privatne fotografije uz dnevni unos
- potvrđeno, atomsko premeštanje sportskog kartona između klubova

## 1. Baza

Primeniti migracije redom; za ovo pojednostavljenje potrebna je i poslednja:

```text
supabase/migrations/0004_rehab_basic.sql ... 0010_rehab_cycles.sql
```

Osnovna migracija kreira početne prostore i RLS pravila. Admin sa `profiles.role = 'admin'` vidi kliniku i sve klubove, uključujući naknadno dodate. Migracija 0009 dodaje transakciju premeštanja igrača i proverava privatne slike prema trenutnom kartonu, ne prema starom nazivu foldera. Primenjena je kroz Supabase SQL Editor 8. septembra 2026; ovaj projekat nema tabelu istorije CLI migracija, zato ne pokretati slepo sve migracije ponovo.

## 2. Nalozi i pristupi

Glavni administrator otvara `Admin → Otvori Rehab platformu`.

- fizioterapeut može da unosi i menja podatke klinike
- klupski korisnik ima samo pregled podataka kluba
- `Klinika → Fizioterapeuti`: ime, email i početna lozinka; dozvola za sve pacijente klinike je automatska
- `Klubovi → Dodaj klub`: potreban je samo naziv; igrači i nalozi mogu kasnije
- unutar kluba `Osobe sa pristupom`: nalog automatski vidi sve igrače tog kluba, i buduće
- karton igrača → `Omogući igraču prijavu`: nalog vidi samo taj karton
- ako email već ima nalog, postojeća lozinka se NE MENJA; drugačiji aktivni pristup mora prvo izričito da se ukloni
- `Kopiraj poruku za prijavu` ne uključuje lozinku; početna lozinka se dostavlja zasebno
- jedan Rehab nalog može pripadati samo jednom prostoru: klinici ili klubu; samo glavni administrator vidi oba
- terapeuti i saradnici se prijavljuju na `/rehab/prijava`
- rehab korisnici ne dobijaju pristup proizvodima, porudžbinama, blogu i ostalim admin sekcijama

Admin u odredišnom klubu može izabrati `Dodaj postojećeg igrača iz drugog kluba`. Obavezna potvrda jasno navodi prenos celog sportskog kartona, unosa, slika, planova, termina i igračevog naloga. Stari klub gubi pristup, novi ga dobija. Klinički kartoni ne mogu ovim putem u klub. Već preuzete kopije nije moguće opozvati; ranije potpisani linkovi slika važe do isteka (novi linkovi na kartonu traju 5 minuta).

## 3. Email podsetnici

U deploy okruženju podesiti:

Na poslednjoj proveri automatski posao je bio isključen; ovaj deployment ga ne uključuje. Donje stavke su uputstvo za naknadnu aktivaciju, ne potvrda da slanje radi.

```text
RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=
```

Satni posao sada pokreće Supabase Cron (migracija `0008_rehab_reminder_scheduler.sql`), jer Vercel Hobby ne podržava satno zakazivanje. `vercel.json` ne sadrži cron posao.

U Supabase Vault podesiti `rehab_reminder_url` na produkcioni HTTPS URL sa putanjom `/api/cron/rehab-reminders`, a `rehab_cron_secret` na istu jaku nasumičnu vrednost kao Vercel `CRON_SECRET`. Tajne ne upisivati u Git. Posao `rehab-reminders-hourly` radi u 17. minutu svakog sata; podsetnik je okvirno 24 sata pre termina, uz odstupanje do jednog sata.

Proveriti `cron.job_run_details` i HTTP rezultate u `net._http_response`: uspešan cron run znači da je HTTP zahtev zakazan, ne da je email isporučen. Očekivan HTTP rezultat je 200 sa `failed: 0`. Kod 401 znači da tajne nisu usklađene. Supabase baza mora biti aktivna; pauzirana baza neće pokretati posao. Email slanje i dalje koristi postojeći Resend nalog i njegova ograničenja.

## 4. Provera pre objavljivanja

1. Glavni admin se prijavljuje na postojeći admin panel i odatle otvara Rehab platformu.
2. Glavni admin može da napravi Rehab nalog i dodeli mu samo izabrani radni prostor.
3. Fizioterapeut se prijavljuje preko `/rehab/prijava`, vidi samo kliniku i može da pravi kartone, unose, planove i termine.
4. Fizioterapeut ne može da otvori glavni admin panel, proizvode, porudžbine, blog ili druge admin sekcije.
5. Klupski korisnik vidi samo klub i ne vidi dugmad za izmene, ali može da otvori i odštampa plan.
6. Direktan URL drugog radnog prostora ne vraća podatke.
7. Tek nakon posebne aktivacije proveriti da termin sa email adresom dobije samo jedan podsetnik.
8. Mesečni i godišnji pregled računa podatke samo iz izabranog prostora i broji rehabilitacije završene u tom periodu.
9. `/rehab` nije prisutan u javnoj navigaciji i ima `noindex` metadata.

## Nije deo osnovne verzije

- portal pacijenta klinike (igrački nalog sa pregledom sopstvenog kartona jeste uključen)
- video biblioteka vežbi (fotografije uz dnevni unos jesu uključene)
- posebno generisan PDF dokument (osnovna verzija koristi štampu / „Save as PDF” iz browsera)
- istorija svih izmena
- SMS, Viber i WhatsApp poruke
- uvoz podataka iz drugih aplikacija


## Ciklusi i grupni izveštaji — 10. septembar 2026.

Za ovu verziju je potrebna **nova migracija `0010_rehab_cycles.sql` pre puštanja aplikacije**. U ovoj izmeni ona je proverena samo u lokalnoj, izolovanoj PostgreSQL bazi; produkciona baza nije menjana. Ako su migracije zaključno sa 0009 već primenjene, primenjuje se samo 0010. Migracija ne šalje emailove i ne pokreće podsetnike.

Novi plan se sastoji od ciklusa sa nazivom, opcionim ciljem, višerednim uputstvima, opcionim datumima i statusom (planiran/u toku/završen). Dodavanje, uklanjanje, promena redosleda i izmena ciklusa čuvaju se zajedno sa planom. Kraj plana je opcion i ne računa se iz broja ciklusa. Kopiranje plana briše datume ciklusa i vraća njihove statuse na „planiran”.

Postojeći dnevni planovi ostaju u izvornom obliku i mogu da se štampaju. Radnja „Napravi plan po ciklusima iz ovog plana” prikazuje izvorna uputstva uz prazan obrazac ciklusa: terapeut ih raspoređuje i čuva novi plan. Original ostaje sačuvan. Evidencija obavljenih terapija i termini i dalje imaju stvarne datume.

„Izaberi osobe i štampaj izveštaj” otvara izbor jedne osobe, više označenih ili svih osoba. Dostupni su filter statusa, svi datumi/mesec/godina/raspon i zbirni, pojedinačni ili oba prikaza. Izabrane osobe ostaju označene kroz pretragu i strane spiska. „Svi” uključuje ceo izabrani radni prostor, a filter statusa jasno sužava obuhvat. Pregled mora biti u celosti učitan pre štampe; greška ne proizvodi nepotpun dokument. Pojedinačni izveštaji počinju na novim stranama i prikazuju sve terapije u izabranom periodu.

SR/EN u zaglavlju čuva radni prostor i URL filtere. Izbori štampe pamte se u sessionStorage za trenutni pregled; sam medicinski sadržaj se tu ne čuva. Slobodan tekst terapeuta se ne prevodi automatski. Igrač može da štampa samo svoj karton.

### Lokalne provere

```sh
npm run test:rehab
npm run build
```

Testovi uključuju PGlite PostgreSQL bazu u memoriji, stvarne migracije 0004–0007, 0009 i 0010, transakcije ciklusa, kopiranje, RLS i prenos igrača. Supabase auth/storage okruženje je minimalna lokalna testna šema; cron migracija 0008 nije deo ove provere. Testovi ne čitaju kredencijale i ne pristupaju produkciji.

`tests/helpers/rehab-api-fixture.mjs` je isključivo lokalni HTTP test adapter na `127.0.0.1:54329`, sa sintetičkim podacima za proveru interfejsa. Ne koristi se u aplikaciji niti se deployuje kao ruta. Browser provere koriste zasebnu privremenu kopiju aplikacije i ovaj adapter; on ne zamenjuje RLS provere nad bazom.


Za automatsku proveru u browseru:

```sh
npm run test:rehab:browser
```

Potrebni su slobodni lokalni portovi 3100 i 54329. Na macOS test koristi instalirani Google Chrome; na drugim sistemima prethodno pokrenuti `npx playwright install chromium`. Test sam pravi privremenu kopiju aplikacije, pokreće sintetički API, proverava UI i gasi svoje procese. Ne učitava `.env.local` iz projekta. Na kraju ispisuje privremeni folder sa snimcima i PDF-ovima. Pokriveni su ceo klub, više osoba, pojedinac, iste tri opcije u klinici, ciklusi, promena jezika, mobilni prikaz i serversko odbijanje grupnog izveštaja za igrača čak i kada je onemogućena kontrola ručno uključena.
