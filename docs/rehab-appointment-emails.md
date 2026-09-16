# Email obaveštenja za termine

Resend šalje potvrdu zakazivanja, izmenu vremena/trajanja/terapije (bez sadržaja terapije), otkazivanje, ponovno aktiviranje, završetak i pojedinačno brisanje termina. Brisanje već otkazanog termina ne šalje još jednu poruku ako je obaveštenje o otkazivanju već poslato. Brisanje celog kartona ne šalje poruke.

Primalac je **isključivo aktuelni email u kartonu pacijenta/igrača**, ne prethodni `reminder_email` niti email prijavljenog korisnika. Bez emaila se termin normalno čuva bez slanja. Izmene samo internih beleški i čuvanje nepromenjene forme ne šalju poruke. Klinički podaci i beleške ne ulaze u email. Klinike dobijaju srpske, klubovi engleske poruke; vreme je Europe/Belgrade.

## Produkciono puštanje

1. Proveriti da migracije 0004–0011 već postoje. Pauzirati postojeći cron pre migracije i sačekati da se prethodni poziv završi, da stari i novi worker ne šalju istovremeno.
2. Primeniti `supabase/migrations/0012_rehab_appointment_emails.sql`. Migracija čuva termine i stare potvrde slanja podsetnika, ne šalje istorijske potvrde. Postojeći cron prelazi na minutni raspored i ostaje pauziran do završetka aktivacije.
3. Objaviti aplikaciju sa novim workerom i proveriti `RESEND_API_KEY`, `EMAIL_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` i `CRON_SECRET` na deploymentu. `EMAIL_FROM` mora biti verifikovan kod Resend-a. Nije potreban novi email SDK ni novi Resend nalog.
4. U Supabase Vault proveriti `rehab_reminder_url` (produkcioni HTTPS URL koji se završava sa `/api/cron/rehab-reminders`) i `rehab_cron_secret` (ista vrednost kao `CRON_SECRET`, najmanje 32 znaka). Ne upisivati tajne u Git.
5. Na namenskom test kartonu sa svojom test adresom proveriti zakazivanje, pomeranje, otkazivanje i završetak. Ne koristiti stvarne pacijente za testiranje. Bez emaila potvrditi da nema reda u evidenciji slanja.
6. Pokrenuti zaštićeni endpoint jednom sa Bearer tokenom i proveriti rezultate. Zatim aktivirati postojeći posao:

```sql
select cron.alter_job(
  (select jobid from cron.job where jobname = 'rehab-reminders-hourly'),
  active := true
);
```

Ako posao ne postoji, prvo podesiti scheduler iz migracije 0008 i zatim mu postaviti minutni raspored. Naziv `rehab-reminders-hourly` je zadržan zbog kompatibilnosti, ali sada radi svake minute. `vercel.json` ne treba cron konfiguraciju.

## Slanje i nadzor

- Trigger u istoj transakciji sa terminom pravi zapis u `rehab_appointment_emails`. Ako čuvanje ne uspe, nema ni poruke.
- Server action odmah pokušava slanje posle uspešnog čuvanja. Cron preuzima preostale poruke i zakazuje dospele podsetnike. U jednom pozivu obrađuje do dve poruke, da pozivi sa timeoutom stanu u 30 sekundi. Za veći obim pratiti najstariji pending zapis pre povećavanja kapaciteta.
- Ponovni pokušaji posle 1, 5 i 15 minuta, najviše četiri ukupno. Isti Resend idempotency ključ koristi se u svim pokušajima; nikad se automatski ne ponavlja posle 23 sata od prvog pokušaja. Privremene brave ističu posle dva minuta.
- Nova izmena poništava zastarele poruke koje čekaju. Worker preskače poruke ako je email uklonjen/promenjen, karton prenet ili termin zastareo. Poruka već predata Resend-u ne može se povući.
- Podsetnici idu približno 24 sata ranije, uz minutni interval i vreme obrade reda. Potvrda/izmena napravljena unutar tog roka zamenjuje zaseban podsetnik. Stari `reminder_sent_at` sprečava ponovno slanje već obrađenih podsetnika.
- `sent` znači da je Resend prihvatio poruku, ne dokaz prijema u inbox. Isporuku i odbijanje adrese proveriti u Resend kontrolnoj tabli.
- Na stranici termina urednici vide stanje poslednje poruke. `failed` zapise proveriti u bazi i Resend-u; nema automatskog slanja bez ograničenja niti ručnog resetovanja neizvesnog pokušaja nakon isteka idempotency roka.
- Proveriti `cron.job_run_details` i `net._http_response`: 401 označava neusklađen secret, 503 nedostajući Resend config, 500 grešku baze/reda. Uspešan cron run sam po sebi nije potvrda slanja. Pratiti `failed` u HTTP rezultatu i terminalne `failed` zapise u tabeli.

## Provere

`npm run test:rehab` proverava trigger-e u izolovanoj PGlite bazi, prava pristupa, preskakanje bez emaila, otkazivanje zastarelih poruka, oporavak posle prekida, ponovne pokušaje i email šablone. Resend HTTP se simulira — testovi ne šalju stvarne poruke. `npm run build` proverava produkcioni build.

## HTML dizajn (17. septembar 2026.)

- Kratki naslovi s datumom i vremenom, skriveni pregled poruke, bela kartica i inline stilovi u prezentacionim tabelama. Zelena označava potvrdu/podsetnik, oker izmenu, a crvena otkazivanje/uklanjanje. Tekst objašnjava događaj i bez boje ili slika.
- Pomeranje prikazuje prethodni i novi termin. Prikazuje se početak i kraj, uključujući datum završetka za termine koji prelaze ponoć. Srpski tekst koristi latinicu.
- Google Calendar link postoji za aktivne potvrde, ponovna zakazivanja i podsetnike. Prenosi samo naziv radnog prostora, vreme i javnu adresu, bez imena pacijenta ili kliničkih podataka. Ovo je ručno dodavanje, bez sinhronizacije; izmene i otkazivanja podsećaju korisnika da ažurira svoj kalendar.
- Klinika koristi postojeći logo, kontakt stranicu i javnu adresu. Klub koristi isključivo svoj logo, ako ga ima, i svoj naziv; nema kontakta/adrese klinike.
- Worker pre prvog slanja čuva kompletan sadržaj u postojećem JSON `payload.renderedEmailV2`. Ponovni pokušaj zato koristi identičan sadržaj i Resend idempotency ključ čak i ako se logo ili šablon kasnije promene. Nije potrebna nova SQL migracija. Pre objave provereno je da nema starih poruka sa započetim pokušajima u redu.
- Provere: 34 automatizovana testa, produkcioni build, ESLint, vizuelni pregled i provera širine od 319/320 px bez horizontalnog prelivanja. Renderovanje u pregledaču ne zamenjuje proveru u svim verzijama Outlook-a i drugih email klijenata.
