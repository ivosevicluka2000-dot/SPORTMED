# Kalendar termina i brisanje probnih kartona

## Termini

- Otvorite **Termini**. Početni prikaz je aktuelni mesec, sa nazivom meseca i godinom.
- Strelice menjaju mesec. **Danas** vraća na današnji datum.
- Klik na dan prikazuje njegove termine i postavlja datum u obrascu za novi termin. Vreme se i dalje može promeniti.
- **Prikaži ceo mesec** uklanja izbor pojedinačnog dana. Dostupni su i postojeći pregledi **Svi**, **Danas** i **Narednih 7 dana**.
- Uz termin je dugme **Obriši termin** sa potvrdom. **Otkaži** zadržava termin u evidenciji sa statusom otkazan.

## Ceo probni karton

1. Uđite u **Pacijenti** ili **Igrači** i otvorite željeni karton.
2. Ispod zaglavlja izaberite **Obriši ceo karton**.
3. Unesite prikazano ime i prezime i kliknite **Trajno obriši karton**.
4. Potvrdite brisanje u dijalogu.

Ova opcija je dostupna fizioterapeutu i vlasniku u njihovom radnom prostoru, kao i glavnom administratoru. Briše karton, njegove dnevne unose, fotografije, planove, termine i povezani pristup igrača. Nalog osobe i ostali kartoni se ne brišu. Brisanje se ne može poništiti; za završenu rehabilitaciju koristite status kartona.

## Tehnička provera

- Nije potrebna nova migracija. Koriste se postojeća pravila pristupa i kaskadno brisanje povezanih redova.
- Termini se grupišu i pretražuju prema vremenskoj zoni Europe/Belgrade. Mesečni prikaz učitava sve rezultate po stranicama, bez ranijeg ograničenja od 300 termina.
- Brisanje podataka kartona obavlja baza u jednoj operaciji. Fotografije se zatim uklanjaju kroz Storage API. Ako uklanjanje datoteka ne uspe, korisnik dobija poruku, a server beleži ID kartona i preostale putanje uz poruku `[rehab] Deleted record image cleanup failed`. Administrator može ponoviti uklanjanje tih putanja iz privatnog bucket-a `rehab-entry-images`; pristup kroz obrisani karton više nije dozvoljen.
- Provere: `npm run build`, `npm run test:rehab`, `node tests/rehab-calendar-browser-qa.mjs`. Browser test koristi izolovanu lokalnu bazu sa sintetičkim podacima i ne šalje mejlove.
# Provera brisanja — 16. septembar 2026.

Polje za potvrdu je prikazivalo ime velikim slovima zbog CSS-a, dok je server zahtevao potpuno jednaku veličinu slova. Ime se sada prikazuje bez te transformacije, a potvrda prihvata razlike u veličini slova, višak razmaka i Unicode NFC zapis. Celo ime i prezime su i dalje obavezni; pogrešno ime ne prolazi. Poruke sada razlikuju pogrešnu potvrdu od greške pri brisanju.

Produkcioni REST test sa privremenim terapeutom i izolovanim kartonom potvrdio je dozvolu brisanja i kaskadno uklanjanje dnevnog unosa i termina. Za ovu ispravku nije potrebna dodatna migracija. Regresioni testovi su u `tests/rehab-deletion.test.mjs`.
