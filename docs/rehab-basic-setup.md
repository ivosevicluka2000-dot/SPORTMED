# Osnovni rehabilitacioni modul — postavljanje i provera

Modul je odvojena interna platforma na ruti `/rehab`. Nije deo javnog sajta niti javne navigacije. Glavni administrator joj pristupa iz postojećeg admin panela, dok kolege koriste poseban ulaz `/rehab/prijava`.

## Šta je uključeno

- odvojeni radni prostori `Sport Care & Med` i `Klub`
- kartoni pacijenata i igrača
- dnevni unos stanja, bola, terapije i napomene
- rehabilitacioni plan po danima
- prikaz plana za štampu ili čuvanje kao PDF iz browsera
- termini i email podsetnik 24 sata ranije
- mesečni i godišnji brojevi, uključujući završene rehabilitacije, uz ručno unet zaključak
- pristup vlasnika, fizioterapeuta i korisnika kluba

## 1. Baza

Primeniti migraciju:

```text
supabase/migrations/0004_rehab_basic.sql
```

Migracija kreira dva fiksna radna prostora i RLS pravila. Postojeći korisnik sa `profiles.role = 'admin'` automatski vidi oba prostora.

## 2. Nalozi i pristupi

Glavni administrator otvara `Admin → Otvori Rehab platformu → Nalozi i pristupi`.

- fizioterapeut može da unosi i menja podatke klinike
- klupski korisnik ima samo pregled podataka kluba
- glavni administrator unosi ime, email, privremenu lozinku i dozvolu; sistem pravi nalog i odmah dodeljuje pristup
- ako email već ima nalog, uneta lozinka postaje njegova nova privremena lozinka
- jedan Rehab nalog može pripadati samo jednom prostoru: klinici ili klubu; samo glavni administrator vidi oba
- terapeuti i saradnici se prijavljuju na `/rehab/prijava`
- rehab korisnici ne dobijaju pristup proizvodima, porudžbinama, blogu i ostalim admin sekcijama

## 3. Email podsetnici

U deploy okruženju podesiti:

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
7. Termin sa email adresom dobija samo jedan podsetnik.
8. Mesečni i godišnji pregled računa podatke samo iz izabranog prostora i broji rehabilitacije završene u tom periodu.
9. `/rehab` nije prisutan u javnoj navigaciji i ima `noindex` metadata.

## Nije deo osnovne verzije

- portal pacijenta ili igrača
- slike i video biblioteka vežbi
- posebno generisan PDF dokument (osnovna verzija koristi štampu / „Save as PDF” iz browsera)
- istorija svih izmena
- SMS, Viber i WhatsApp poruke
- uvoz podataka iz drugih aplikacija
