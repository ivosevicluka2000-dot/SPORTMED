# Rehab: provera objavljene verzije

Datum: 8. septembar 2026.
Commit na main: b31185c.
Produkcija: https://www.sportcaremed.com
Vercel GitHub status: success, Deployment has completed.
Supabase: migracija 0009_rehab_simple_management.sql uspešno izvršena kroz SQL Editor.

## Automatska provera

Isti integracioni test (`tests/rehab-management-live.mjs`) prošao je na lokalnom produkcionom serveru i na produkcionom domenu, posle deploymenta. Kreiranje naloga i kartona, prijave i premeštanje izvršeni su kroz stvarne aplikacione Server Actions; pristupi dodatno provereni direktnim korisničkim Supabase sesijama, pod RLS pravilima.

- Admin pravi prazan klub samo sa nazivom.
- Kartoni nastaju u izabranoj klinici ili klubu.
- Admin pravi terapeuta, predstavnika kluba i pojedinačni nalog igrača.
- Sva četiri test saradnička naloga (terapeut, dva kluba, igrač) uspešno se prijavljuju.
- Terapeut vidi test kartone klinike, klub samo svoje igrače, igrač samo sebe.
- Terapeut unosi terapiju u klinici; nije dozvoljen unos u klubu.
- Klub i igrač ne mogu da menjaju medicinsku evidenciju.
- Novi igrač automatski postaje vidljiv predstavniku svog kluba.
- Ponovljena dodela postojećem nalogu ne menja lozinku.
- Nedozvoljena dodela drugom klubu ili drugom kartonu odbija se.
- Saradnici nemaju glavni admin niti pravo kreiranja naloga.
- Premeštanje odbija neadmina, nepotvrđen zahtev, klinički karton i zastareo izvorni klub.
- Potvrđeno premeštanje čuva karton, terapije, planove, dane, termine, nalog i fotografije.
- Stari klub gubi pristup, novi ga dobija, igrač ostaje vezan za sebe.
- Stari klub ne dobija nove potpisane linkove fotografija.
- Karton i stranica plana za štampu dostupni su dozvoljenim nalozima nakon premeštanja.
- Direktan URL starog kluba završava na not-found granici, bez sadržaja kartona.
- Admin može da ukloni fotografiju i nakon premeštanja.
- Ukidanje pristupa ne briše karton.

Svaki završeni test uklonio je svojih 6 veštačkih kartona, 2 kluba i 4 naloga, zajedno sa pratećim test zapisima i slikom. Pravi podaci i lozinke nisu menjani. Postojeći korisnički „test klub” nije brisan.

## Dodatne provere

- `npm run build`: uspešno, uključujući TypeScript.
- ESLint izmenjenih Rehab ekrana i akcija: bez grešaka.
- 12 testova datuma i oporavka lozinke: uspešno.
- Prikaz novog spiska klubova i forme pristupa u desktop browseru.
- Glavni admin otvara postojeći admin panel i iz njega prelazi u Rehab bez ponovne prijave, potvrđeno u live browseru.
- Forma pristupa na širini 390 px: raspored bez vidljivog preklapanja.
- PDF vodič ažuriran na 6 stranica; sve stranice vizuelno pregledane.

## Granice provere

Automatski email podsetnici ostaju neaktivni; njihovo slanje nije uključeno niti proglašeno testiranim ovim deploymentom. Nije rađen test opterećenja. Ranije preuzeti dokumenti i fotografije ne mogu se opozvati; već izdati potpisani linkovi važe do isteka.
