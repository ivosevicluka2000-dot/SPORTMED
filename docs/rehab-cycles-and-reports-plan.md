# Plan: engleski za klubove, rehabilitacioni ciklusi i grupni izveštaji

Datum: 10. septembar 2026. Status: implementirano i provereno; spajanje na `main` odobreno 12. septembra 2026. Migracija 0010 primenjena i proverena u produkcionoj bazi 12. septembra 2026, nakon provera u izolovanoj lokalnoj bazi. Postojeći dnevni planovi su sačuvani. Detalji rada i provera su u `docs/rehab-basic-setup.md`.

## 1. Traženi rezultat

- Klubovi dobijaju englesku verziju kompletnog toka rada: prijava, navigacija, igrači, kartoni, planovi, termini, pristup i izveštaji.
- Novi rehabilitacioni planovi u klinici i klubovima organizuju se po ciklusima.
- U klinici se bira jedan pacijent, više pacijenata ili svi pacijenti za izveštaj i štampu.
- U klubu se bira jedan igrač, više igrača ili ceo klub za izveštaj i štampu.
- Izbor „svi” odnosi se na izabranu kliniku ili klub, u okviru prava prijavljenog korisnika.

## 2. Utvrđeno stanje u projektu

- Postoje `sr` i `en` rute i `next-intl`, ali su tekstovi u velikom delu rehabilitacione platforme direktno napisani na srpskom.
- Stranice u `src/app/[locale]/rehab/(platforma)/` uglavnom ponovo izvoze implementacije iz `src/app/[locale]/admin/rehab/`. Izmene zajedničkih ekrana raditi na jednom mestu.
- `rehab_plans` zahteva početak i kraj plana. `rehab_plan_days` čuva redni broj dana, datum i uputstvo. Svaki neprazan red u obrascu postaje jedan kalendarski dan.
- Kreiranje, kopiranje i SQL funkcija `update_rehab_plan_schedule` računaju datume iz broja dana. Sama promena oznake „dan” u „ciklus” nije dovoljna.
- Postoji štampa jednog plana i kratkog izveštaja za jednu osobu. Kratak izveštaj prikazuje poslednjih pet terapija, poslednji aktivni plan i naredni termin.
- Stranica izveštaja trenutno sadrži mesečne/godišnje zbirne pokazatelje i zaključak za radni prostor; nema izbor više osoba za štampu.
- Prenos igrača između klubova iz migracije `0009_rehab_simple_management.sql` izričito prenosi dnevne stavke planova. Mora obuhvatiti i cikluse.

## 3. Predloženo ponašanje ciklusa

Radna pretpostavka: ciklus je faza rehabilitacije promenljivog trajanja, a terapeut određuje sadržaj i prelazak u naredni ciklus. Broj ciklusa ne određuje broj kalendarskih dana.

Plan zadržava naziv, cilj, napomenu, datum početka i status. Datum završetka postaje opcion i više se ne izračunava iz broja stavki.

Svaki ciklus ima:

- Redni broj i naziv, npr. „Ciklus 1 — Mobilnost”.
- Opcioni cilj ciklusa.
- Obavezna višeredna uputstva: vežbe, terapije, doziranje i druge preporuke terapeuta.
- Opcioni početak i kraj; kraj ne može prethoditi početku.
- Status: planiran, u toku ili završen.

Obrazac omogućava dodavanje, izmenu, uklanjanje i promenu redosleda ciklusa. Novi red unutar uputstva ostaje deo istog ciklusa. Čuvanje celog plana i ciklusa je jedna transakcija. Plan mora imati najmanje jedan validan ciklus.

Kopiranje prenosi sadržaj i redosled ciklusa na izabranu osobu, a statuse vraća na „planiran”. Datumi ciklusa se podrazumevano prazne kako kopija ne bi nasledila zastareo raspored; terapeut unosi novi početak plana i eventualne datume ciklusa. Promena početka plana ne pomera automatski datume ciklusa.

Evidencija stvarno obavljenih terapija i zakazani termini i dalje imaju svoje datume. To omogućava praćenje poseta i tokom ciklusa koji traje više dana.

## 4. Baza i očuvanje postojećih planova

Dodati novu migraciju, bez menjanja već primenjenih migracija:

1. U `rehab_plans` dodati oznaku formata (`daily` / `cycles`): postojeći planovi ostaju `daily`, novi se eksplicitno kreiraju kao `cycles`. Omogućiti prazan `end_date` za ciklusne planove.
2. Dodati `rehab_plan_cycles`: identifikator, plan, radni prostor, redni broj, naziv, cilj, uputstva, opcioni datumi, status i polja autora/vremena. Uvesti jedinstven redni broj unutar plana i vezu plana i radnog prostora.
3. Primena postojećeg modela dozvola kroz RLS: osoba sa pristupom svom kartonu vidi samo njegove cikluse; upis imaju ovlašćeni terapeuti i administratori.
4. Dodati transakcijske operacije za kreiranje, izmenu, kopiranje i promenu redosleda ciklusa. Proveriti povezanost svakog prosleđenog identifikatora sa planom, osobom i radnim prostorom.
5. Staru funkciju rasporeda ograničiti na dnevne planove. Ciklusni planovi koriste novu operaciju koja ne računa dane.
6. Dopuniti transakciju prenosa igrača tako da ciklusi prate plan i karton u novi klub, uz odgovarajuće odložive strane ključeve.

Postojeće dnevne planove prikazivati i štampati sa jasnom oznakom izvornog dnevnog rasporeda. Ne pretvarati automatski svaki dan u klinički ciklus. Predvideti radnju „Napravi plan po ciklusima iz ovog plana”: terapeut raspoređuje postojeća uputstva u cikluse i čuva novi plan, dok original ostaje sačuvan. Novi obrazac kreiranja nudi cikluse.

Pre puštanja proveriti migraciju na testnoj bazi sa postojećim dnevnim planovima. Prvo primeniti dopunsku šemu, zatim aplikaciju. Zadržavanje starih tabela čuva istorijske podatke; povratak na staru aplikaciju mora uzeti u obzir da ona ne razume nove ciklusne planove.

## 5. Engleska verzija

- Dodati zajednički `rehab` skup prevoda u `messages/sr.json` i `messages/en.json`, koristeći postojeći `next-intl`.
- Prevesti stranice klubova i sve zajedničke ekrane do kojih dolazi korisnik kluba: prijavu, pregled, liste, karton, planove, termine, upravljanje pristupom i štampu.
- Obuhvatiti dugmad, statuse, prazna stanja, potvrde, validaciju, poruke greške/uspeha, oznake za pristupačnost i tekst koji se kopira za pristup nalogu.
- Dodati SR/EN izbor u zaglavlje platforme. Pri promeni jezika sačuvati radni prostor, karton i filtere; postojeći javni `LanguageSwitcher` trenutno ne prosleđuje query parametre.
- Formatiranje datuma, meseci i brojeva prati jezik, uz zadržavanje vremenske zone Europe/Belgrade za termine.
- Štampu prikazati na izabranom jeziku i omogućiti promenu jezika u pregledu pre štampe.
- Zajednički prevodi dostupni su i klinici. Slobodan tekst koji unese terapeut čuva se u izvornom jeziku; automatski prevod medicinskog sadržaja nije deo ovog zahteva.

## 6. Izbor i štampanje izveštaja

Na stranici „Izveštaji” dodati izbor osoba i pregled pre štampe. Sa kartona zadržati prečicu sa unapred izabranom osobom; sa liste pacijenata/igrača omogućiti označavanje više osoba.

| Okruženje | Jedna osoba | Više osoba | Svi |
| --- | --- | --- | --- |
| Klinika | Jedan pacijent | Označeni pacijenti | Svi pacijenti te klinike |
| Klub | Jedan igrač | Označeni igrači | Svi igrači tog kluba |

Predloženi izbori pre štampe:

- Obuhvat: jedna osoba, izabrane osobe ili svi. Prikazati broj izabranih i pretragu po imenu.
- Status kartona: svi, aktivni ili završeni; početno „svi”. Jasno navesti kada filter sužava izbor.
- Period: svi datumi, mesec, godina ili raspon. Početno svi datumi; postojeći mesečni/godišnji pregled može preneti izabrani period.
- Sadržaj: „Zbirni pregled”, „Pojedinačni izveštaji” ili „Oba”. Za jednu osobu početno pojedinačni izveštaj, za više/sve početno oba.

Zbirni pregled sadrži naziv klinike/kluba, period, broj uključenih osoba i tabelu sa osobom, povredom/problemom, statusom, aktivnim planom/ciklusima i poslednjom terapijom. Ako postoje višestruki aktivni planovi/ciklusi, prikazati ih jasno bez proizvoljnog odabira jednog.

Pojedinačni izveštaji sadrže podatke osobe, planove sa ciklusima i evidentirane terapije u izabranom periodu. Svaka osoba počinje na novoj stranici. Novi puni izveštaj ne nasleđuje ograničenje na pet terapija iz postojećeg kratkog izveštaja; postojeća kratka prečica može ostati jasno označena.

Pravila perioda: terapije se filtriraju po datumu unosa, a planovi po preklapanju sa periodom; plan bez završetka tretira se kao otvoren. Ciklusi bez datuma prikazuju se uz uključeni plan. Status kartona označava trenutno stanje. Zaključak sačuvan za celu kliniku/klub ne prikazivati kao zaključak za izdvojenu grupu osoba.

Štampa koristi postojeći browser print i omogućava čuvanje kao PDF. Dodati zajednički prikaz izveštaja kako pojedinačna i grupna štampa koriste ista pravila, prevode i izgled. U pregledu prikazati tačan broj uključenih osoba; dugme za štampu dostupno tek kada su svi podaci uspešno učitani.

## 7. Izolacija podataka i veći spiskovi

- Za izveštaj eksplicitno proveriti traženi radni prostor; ne koristiti tihi prelazak na prvi dostupan radni prostor za nevažeći izbor.
- Na serveru proveriti svaki izabrani ID i RLS. Izmenjeni URL ili zahtev ne sme uključiti osobu iz drugog kluba/klinike.
- Igrač može da štampa svoj karton, dok grupni izveštaj koriste uloge koje već imaju pristup celom radnom prostoru.
- Prazan izbor u režimu „izabrani” traži izbor najmanje jedne osobe. Greška učitavanja prikazuje grešku, a ne dokument sa nulama ili nepotpunim podacima.
- „Svi” učitava sve rezultate uz paginaciju, uključujući rezultate izvan podrazumevanog Supabase limita. Pretraga i paginacija ne gube označene osobe.
- Grupno učitavati planove, cikluse i terapije, bez jednog upita za svaku osobu. Veći eksplicitni izbor slati kroz serverski zahtev umesto neograničenog niza ID-jeva u URL-u.

## 8. Glavna mesta izmene

| Oblast | Postojeći fajlovi / predloženi dodaci |
| --- | --- |
| Tipovi i datumi | `src/lib/rehab/types.ts`, `src/lib/rehab/dates.ts` |
| Upis i kopiranje planova | `src/app/[locale]/admin/rehab/_actions.ts`, novi transakcijski RPC u migraciji |
| Karton i obrazac ciklusa | `src/app/[locale]/admin/rehab/pacijenti/[id]/page.tsx`, novi obrazac u `src/components/rehab/` |
| Štampa plana i osobe | Postojeće rute `pacijenti/[id]/planovi/[planId]/stampa` i `pacijenti/[id]/izvestaj/stampa` |
| Grupni izveštaji | `src/app/[locale]/admin/rehab/izvestaji/page.tsx`, nova zajednička ruta `/rehab/izvestaji/stampa`, server loader i komponente za izbor/štampu |
| Jezik i navigacija | `messages/{sr,en}.json`, `src/i18n/routing.ts`, `src/components/rehab/`, platform layout i klupske stranice |
| Baza i transfer | Nova migracija nakon poslednje postojeće; proširenje funkcije prenosa igrača |
| Dokumentacija i provere | `docs/rehab-basic-setup.md`, postojeći rehab testovi i novi testovi ciklusa/izveštaja |

## 9. Redosled realizacije i kriterijumi završetka

1. **Model i migracija:** ciklusi, prava pristupa, transakcije, istorijski dnevni planovi i prenos igrača.
2. **Rad u kartonu:** kreiranje, uređivanje, redosled, status, kopiranje i štampa plana po ciklusima u klinici i klubu.
3. **Prevodi:** SR/EN za sve klupske tokove i zajedničke ekrane, uz očuvanje konteksta pri promeni jezika.
4. **Izveštaji:** izbor jedne/više/svih osoba, period, zbirni i pojedinačni prikaz, štampa/PDF.
5. **Provera:** testovi ponašanja i prava, pregled štampe, obavezni `npm run build`, ažuriranje uputstva.

Prihvatni scenariji:

- Plan od tri ciklusa može se sačuvati bez tri uzastopna datuma; višeredno uputstvo ostaje u jednom ciklusu.
- Izmena redosleda, kopiranje i neuspeo upis ne ostavljaju delimično sačuvane podatke.
- Stari dnevni plan zadržava sva uputstva i datume i može da se odštampa.
- Prenos igrača prenosi i cikluse; stari klub gubi, a novi dobija odgovarajući pristup.
- Na engleskom se može završiti ceo klupski tok, uključujući greške i štampu. Promena jezika ostaje u istom klubu i kartonu.
- Za kliniku i klub proveriti svih šest kombinacija izbora: jedna osoba, više osoba i svi.
- Broj i imena osoba u štampi odgovaraju izboru, uključujući završene kartone, više stranica rezultata i osobe bez terapija.
- Proveriti period na njegovim granicama, planove bez kraja i cikluse bez datuma.
- Direktan zahtev za tuđi karton ili grupnu štampu iz naloga igrača ne otkriva podatke drugih osoba.
- Vizuelno proveriti A4 štampu na oba jezika, duge tekstove, više ciklusa i više osoba, bez odsečenog sadržaja i praznih međustranica.

Ovaj dokument određuje predložene podrazumevane vrednosti. Najvažnija poslovna pretpostavka za realizaciju je da ciklus nema obavezno fiksno trajanje; ako se u praksi meri brojem dolazaka, taj podatak treba dodati kao zasebno polje ciklusa.
