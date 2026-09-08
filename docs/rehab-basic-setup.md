# Osnovni rehabilitacioni modul — postavljanje i provera

Modul je odvojena interna platforma na ruti `/rehab`. Nije deo javnog sajta niti javne navigacije. Glavni administrator joj pristupa iz postojećeg admin panela, dok kolege koriste poseban ulaz `/rehab/prijava`.

## Šta je uključeno

- odvojena klinika i proizvoljan broj klubova
- kartoni pacijenata i igrača
- dnevni unos stanja, bola, terapije i napomene
- rehabilitacioni plan po danima
- prikaz plana za štampu ili čuvanje kao PDF iz browsera
- termini i pripremljen email podsetnik 24 sata ranije (aktivaciju proveriti posebno)
- mesečni i godišnji brojevi, uključujući završene rehabilitacije, uz ručno unet zaključak
- pristup admina, fizioterapeuta, predstavnika kluba i igrača
- privatne fotografije uz dnevni unos
- potvrđeno, atomsko premeštanje sportskog kartona između klubova

## 1. Baza

Primeniti migracije redom; za ovo pojednostavljenje potrebna je i poslednja:

```text
supabase/migrations/0004_rehab_basic.sql ... 0009_rehab_simple_management.sql
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
