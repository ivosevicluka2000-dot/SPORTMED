from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path('/Users/luka/sport care')
OUT = ROOT / 'output/pdf/Vodic-za-koriscenje-Rehab-platforme.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
FONTS = Path('/Users/luka/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
pdfmetrics.registerFont(TTFont('Guide', str(FONTS / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('GuideBold', str(FONTS / 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('Guide', normal='Guide', bold='GuideBold', italic='Guide', boldItalic='GuideBold')
NAVY = HexColor('#17313E')
TEAL = HexColor('#087D79')
INK = HexColor('#263C46')
GRAY = HexColor('#5C6E77')
PALE = HexColor('#EDF6F5')
WIDTH, HEIGHT = A4
CONTENT = WIDTH - 104

body = ParagraphStyle('body', fontName='Guide', fontSize=10.5, leading=15.6, textColor=INK, spaceAfter=8)
small = ParagraphStyle('small', parent=body, fontSize=9.2, leading=13.7, spaceAfter=5)
title = ParagraphStyle('title', parent=body, fontName='GuideBold', fontSize=25, leading=30, textColor=NAVY, spaceAfter=13)
sub = ParagraphStyle('sub', parent=body, fontSize=11.3, leading=17, textColor=GRAY, spaceAfter=17)
h2 = ParagraphStyle('h2', parent=body, fontName='GuideBold', fontSize=13.3, leading=18, textColor=NAVY, spaceBefore=11, spaceAfter=7, keepWithNext=True)
tag = ParagraphStyle('tag', parent=small, fontName='GuideBold', fontSize=9, textColor=TEAL, spaceAfter=10)
story = []

def p(text, style=body):
    story.append(Paragraph(text, style))

def heading(text):
    p(text, h2)

def step(n, text):
    t = Table([[Paragraph(str(n), ParagraphStyle('n', parent=body, fontName='GuideBold', textColor=TEAL)), Paragraph(text, body)]], colWidths=[23, CONTENT-23])
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    story.append(t)

def note(label, text):
    t = Table([[Paragraph(f'<b>{label}</b><br/>{text}', small)]], colWidths=[CONTENT])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),PALE),('BOX',(0,0),(-1,-1),0.5,HexColor('#D5E8E6')),('LEFTPADDING',(0,0),(-1,-1),13),('RIGHTPADDING',(0,0),(-1,-1),13),('TOPPADDING',(0,0),(-1,-1),11),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
    story.append(Spacer(1,5))
    story.append(t)
    story.append(Spacer(1,7))

def start(section, name, intro):
    if story:
        story.append(PageBreak())
    p(section, tag)
    p(name, title)
    p(intro, sub)

start('01 / PRVI ULAZAK', 'Vodič za Rehab platformu', 'Sport Care &amp; Med<br/>Kako da otvorite karton, upišete terapiju i sačuvate plan.')
p('Platformu otvarate u internet pregledaču, na računaru ili telefonu. Ne morate ništa da instalirate. Za rad je potrebna internet veza.')
heading('Gde se prijavljujete')
p('<b>Glavni administrator:</b> otvorite <link href="https://www.sportcaremed.com/sr/admin" color="#087D79">www.sportcaremed.com/sr/admin</link>, prijavite se svojim admin nalogom i izaberite <b>Otvori Rehab platformu</b>.')
p('<b>Fizioterapeuti, klubovi i igrači:</b> otvorite link ispod. Unesite email i lozinku koje vam je dao administrator, pa kliknite <b>Prijavi se</b>.')
note('Link za prijavu', '<link href="https://www.sportcaremed.com/sr/rehab/prijava" color="#087D79">www.sportcaremed.com/sr/rehab/prijava</link><br/>Sačuvajte ovaj link u obeleživačima da ga ne tražite svaki put.')
heading('Ko šta vidi')
rows = [
    ('Glavni admin', 'Vidi kliniku i sve klubove. Unosi i menja podatke, dodaje klubove i pravi naloge.'),
    ('Fizioterapeut', 'Vidi i uređuje kartone, terapije, planove i termine u klinici. Ne vidi podatke klubova.'),
    ('Nalog kluba', 'Vidi sve igrače svog kluba i njihove planove. Ima pregled, bez menjanja podataka.'),
    ('Nalog igrača', 'Vidi samo svoj karton, dnevne unose i planove. Ne vidi druge igrače i ne menja podatke.'),
]
t = Table([[Paragraph(a, ParagraphStyle('role',parent=small,fontName='GuideBold')),Paragraph(b,small)] for a,b in rows],colWidths=[110,CONTENT-110])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,-2),0.5,HexColor('#DFE7EA')),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
story.append(t)
p('Ako admin radi sa više klubova, pre svakog unosa treba da proveri naziv izabranog prostora na vrhu stranice. Klinika i svaki klub imaju zasebnu evidenciju.', small)

start('02 / ZA GLAVNOG ADMINISTRATORA', 'Kako se prave nalozi', 'Svako koristi svoj email i svoju lozinku. Glavni admin nalog se ne deli sa saradnicima.')
heading('Nalog za fizioterapeuta')
step(1, 'Na vrhu otvorite <b>Klinika</b>, pa <b>Fizioterapeuti</b>.')
step(2, 'Unesite ime, email i početnu lozinku od najmanje 8 znakova. Kliknite <b>Dodaj fizioterapeuta</b>. Ne birate posebne dozvole: ovaj nalog uređuje sve pacijente klinike i ne vidi klubove.')
step(3, 'Uz sačuvan nalog kliknite <b>Kopiraj poruku za prijavu</b> i pošaljite je kolegi. Lozinku mu prosledite odvojeno - ona nije u kopiranoj poruci.')
heading('Novi klub i nalog kluba')
p('Otvorite <b>Klubovi</b>, upišite naziv i kliknite <b>Dodaj klub</b>. Klub može ostati prazan; igrače i naloge dodajete kad vam zatrebaju.')
p('U tom klubu otvorite <b>Osobe sa pristupom</b>. Unesite ime, email i početnu lozinku, pa <b>Dodaj osobu sa pristupom</b>. Ta osoba vidi sve igrače tog kluba, uključujući one koje dodate kasnije. Može da pregleda i štampa, ali ne menja podatke.')
heading('Nalog za jednog igrača')
p('Otvorite njegov karton i proširite <b>Omogući igraču prijavu</b>. Unesite email i početnu lozinku, pa sačuvajte. Nalog se odmah vezuje za taj karton - ne tražite igrača na drugoj listi. Vidi samo svoj karton i planove.')
note('Karton nije isto što i nalog', 'Karton čuva podatke i plan rehabilitacije. Nalog služi da se osoba prijavi. Samo pravljenje kartona ne daje igraču pristup platformi.')
p('<b>Ako email već postoji:</b> lozinku ostavite prazno; stara ostaje ista. Jedan saradnički nalog pripada jednom prostoru. Za ukidanje pristupa kliknite <b>Ukloni pristup</b> i potvrdite. Kartoni se ne brišu.', small)

start('03 / IGRAČI I KLUBOVI', 'Dodavanje i promena kluba', 'Klub je posebna evidencija. Ne morate unapred da napravite sve igrače ili naloge.')
heading('Kada dođe novi igrač')
step(1, 'Otvorite <b>Klubovi</b>, pronađite odgovarajući klub i kliknite <b>Otvori klub</b>.')
step(2, 'Kliknite <b>Novi igrač</b>, unesite njegove podatke i sačuvajte karton.')
step(3, 'Osobe koje već imaju pristup tom klubu odmah vide i novog igrača. Ne morate posebno da im ga dodeljujete.')
p('Ako i igrač treba da se prijavljuje, omogućite mu prijavu iz njegovog kartona. Ako ne treba, karton normalno koristite i bez njegovog naloga.')
heading('Ako igrač već postoji u drugom klubu')
step(1, 'Otvorite klub u koji igrač prelazi. U spisku igrača proširite <b>Dodaj postojećeg igrača iz drugog kluba</b>.')
step(2, 'Pronađite igrača po imenu ili starom klubu i izaberite ga. Proverite prikazani stari i novi klub.')
step(3, 'Pročitajte upozorenje, označite potvrdu i kliknite <b>Premesti igrača u ovaj klub</b>. Ovo radi samo glavni administrator.')
note('Šta se prenosi', 'Prelaze ceo sportski karton, terapije, slike, planovi, termini i igračev nalog. Prethodni klub gubi pristup, a novi dobija pregled tog kartona i istorije. Igraču ostaju isti email i lozinka.')
p('Jedan sportski karton pripada jednom klubu. Premeštanje nije pravljenje kopije. Klinički kartoni se ne prebacuju u klubove. Ranije preuzete PDF-ove i slike ne možete povući; već otvoreni linkovi za slike mogu važiti do isteka.', small)
heading('Pacijent u klinici')
p('Otvorite <b>Klinika</b>, pa <b>Novi pacijent</b>. Svi fizioterapeuti klinike imaju pristup tom kartonu. Pacijent ne mora da ima nalog, a podaci iz klinike nisu vidljivi klubovima.')

start('04 / SVAKODNEVNI RAD', 'Kartoni, terapije i slike', 'Ovaj deo uređuju admin i fizioterapeuti u prostoru kojem imaju pristup. Podatke kluba uređuje glavni admin.')
heading('Dodavanje pacijenta ili igrača')
step(1, 'Otvorite <b>Pacijenti</b> u klinici ili <b>Igrači</b> u klubu, pa izaberite <b>Novi pacijent</b> ili <b>Novi igrač</b>.')
step(2, 'Unesite ime, prezime i datum početka. Po potrebi dodajte telefon, email, datum rođenja, problem ili povredu i napomenu. Polja sa zvezdicom su obavezna.')
step(3, 'Sačuvajte karton. Ako kasnije treba nešto da ispravite, u kartonu otvorite deo <b>Podaci</b>, izmenite podatke i kliknite <b>Sačuvaj izmene</b>.')
heading('Upis posle terapije')
p('Otvorite karton, pa u delu <b>Dnevna evidencija</b> kliknite <b>+ Dodaj dnevni unos</b>. Unesite datum, trenutno stanje i urađenu terapiju. Po potrebi dodajte ocenu bola od 0 do 10 i napomenu. Na kraju kliknite <b>Sačuvaj unos</b>.')
note('Pišite kratko, ali da bude jasno i kolegi', 'Na primer: „Dolazi na dogovorenu kontrolu. Stanje provereno, terapija upisana nakon tretmana. Sledeća procena po dogovoru.” Zabeležite ono što je zaista urađeno i uočeno.')
p('Ako je unos sličan prethodnom, koristite <b>Popuni iz poslednjeg unosa</b>. Pre snimanja obavezno proverite tekst i ocenu bola. Ovo samo popunjava polja - novi unos i dalje treba sačuvati.')
heading('Dodavanje fotografija')
p('U dnevnom unosu otvorite polje <b>Fotografije</b> i izaberite slike sa uređaja. Možete dodati najviše <b>3 slike po unosu</b>, u JPG, PNG ili WebP formatu, do <b>5 MB po slici</b>. Slike možete naknadno dodati i kroz izmenu postojećeg unosa.')
p('Za uklanjanje fotografije kliknite znak <b>×</b> uz nju i potvrdite. Fotografije nisu deo javnog sajta. Dodajte samo ono što je potrebno za evidenciju; imajte u vidu da igrač može da vidi sadržaj svog kartona.')
p('<b>Kad se rehabilitacija završi:</b> u delu <b>Podaci</b> promenite status kartona na <b>Završen</b> i sačuvajte. Karton ostaje u evidenciji. Ako se rad nastavi, možete ga ponovo postaviti na <b>Aktivan</b>.', small)

start('05 / PLAN REHABILITACIJE', 'Plan po danima i štampa', 'Plan ostaje u kartonu, tako da svako ko ima odgovarajući pristup može da ga pronađe i pročita.')
heading('Pravljenje plana')
step(1, 'U kartonu pronađite <b>Rehabilitacioni planovi</b> i otvorite deo za dodavanje plana.')
step(2, 'Unesite naziv, datum početka i, ako želite, cilj plana. U polje <b>Plan po danima</b> upišite šta je predviđeno za svaki dan.')
step(3, '<b>Jedan neprazan red predstavlja jedan dan.</b> Za plan od 10 dana unesite 10 redova. Jedan plan može imati najviše 60 dana. Zatim kliknite <b>Sačuvaj plan</b>.')
note('Primer rasporeda teksta za tri dana', 'Procena i beleška nakon pregleda.<br/>Rad prema dogovorenom programu.<br/>Kontrola i dopuna plana.<br/><br/>Ovo je samo primer unosa. Konkretne vežbe, opterećenje i trajanje određuje stručna osoba.')
heading('Ako se plan promeni')
p('Za naslov, početak, cilj ili napomenu otvorite <b>Izmeni osnovne podatke plana</b>, pa <b>Sačuvaj podatke plana</b>. Opis i datum pojedinačnog dana možete menjati u njegovom redu, uz dugme <b>Sačuvaj</b>.')
p('Promena početnog datuma ponovo raspoređuje dane redom od novog početka. Ako ste neke datume ručno pomerali, proverite ih posle te izmene. Promena samo naslova ili napomene ne pomera datume.')
p('Za sličan plan kod druge osobe koristite <b>Kopiraj ceo plan u drugi karton</b>. Izaberite aktivan karton iz istog prostora i novi datum početka, pa <b>Kopiraj plan</b>. Zatim ga prilagodite toj osobi.')
heading('Štampa ili čuvanje kao PDF')
p('Kliknite <b>Štampaj plan</b>, pa na stranici za štampu <b>Štampaj / sačuvaj PDF</b>. U prozoru pregledača izaberite štampač ili opciju <b>Sačuvaj kao PDF / Save as PDF</b>. Za izveštaj iz kartona koristite <b>Štampaj izveštaj</b>.')
p('Po završetku plana kliknite <b>Označi završenim</b>. To ne zatvara automatski ceo karton - status kartona menjate posebno. Plan možete vratiti dugmetom <b>Vrati u aktivne</b>.', small)

start('06 / TERMINI I PREGLED RADA', 'Šta još treba da znate', 'Na početku dana pogledajte zakazane termine. Na kraju meseca pregledajte evidenciju i dopišite kratak zaključak.')
heading('Zakazivanje i izmena termina')
p('Otvorite <b>Termini</b>, izaberite pacijenta ili igrača, unesite datum, vreme i trajanje, pa sačuvajte termin. Možete dopisati terapiju, razlog dolaska i internu napomenu. Ako osobe nema na listi, prvo napravite njen karton.')
p('Za pomeranje koristite <b>Izmeni termin</b> i sačuvajte novi datum i vreme. Kada je tretman obavljen ili otkazan, promenite odgovarajući status termina da evidencija bude tačna.')
note('Važno za email podsetnike', 'Na dan pripreme ovog vodiča automatsko slanje još nije aktivirano. Termin možete sačuvati, ali se do potvrde aktivacije nemojte oslanjati na podsetnik. Polje „Email za podsetnik” namenjeno je adresi primaoca. SMS, Viber i WhatsApp poruke nisu uključene.')
heading('Mesečni i godišnji izveštaj')
step(1, 'Otvorite <b>Izveštaji</b> i proverite da li gledate kliniku ili odgovarajući klub.')
step(2, 'Izaberite <b>Mesečni</b> ili <b>Godišnji</b> pregled i kliknite <b>Prikaži pregled</b>. Ako menjate vrstu pregleda, po potrebi zatim izaberite željeni mesec ili godinu i ponovo prikažite pregled.')
step(3, 'Brojevi se prikazuju iz sačuvane evidencije. U polje za zaključak sami upišite kratak osvrt i kliknite <b>Sačuvaj zaključak</b>. Klinika i klubovi imaju odvojene preglede.')
heading('Ako nešto ne ide')
p('<b>Ne možete da se prijavite?</b> Proverite email, velika slova u lozinci i Rehab link. Za novu lozinku koristite <b>Zaboravili ste lozinku?</b> na prijavi. Ako poruka ne stigne ni u neželjenu poštu, javite se administratoru.', small)
p('<b>Nema kartona ili dugmeta za izmenu?</b> Proverite izabrani klub ili kliniku. Klub i igrač imaju samo pregled. Admin proverava nalog u <b>Fizioterapeuti</b>, <b>Osobe sa pristupom</b> ili u kartonu igrača.', small)
p('<b>Unos nije sačuvan?</b> Pročitajte poruku na ekranu, proverite obavezna polja i internet vezu. Sačekajte potvrdu o čuvanju pre nego što zatvorite stranicu.', small)
p('<b>Za kraj:</b> posle rada se odjavite, naročito na zajedničkom računaru. Lozinku ne delite, a PDF sa podacima prosledite samo osobi kojoj je namenjen.', small)

def page_art(c, doc):
    c.saveState()
    c.setFillColor(TEAL)
    c.rect(52, HEIGHT-39, 23, 3, stroke=0, fill=1)
    c.setFont('GuideBold', 8.5)
    c.setFillColor(NAVY)
    c.drawString(83, HEIGHT-40, 'SPORT CARE & MED')
    c.setFont('Guide', 8)
    c.setFillColor(GRAY)
    c.drawRightString(WIDTH-52, HEIGHT-40, 'UPUTSTVO ZA KORIŠĆENJE')
    c.setStrokeColor(HexColor('#DCE5E8'))
    c.line(52, 43, WIDTH-52, 43)
    c.setFont('Guide', 7.8)
    c.drawString(52, 28, 'Rehab platforma  |  Izdanje: 8. septembar 2026.')
    c.drawRightString(WIDTH-52, 28, str(doc.page) + ' / 6')
    c.restoreState()

class GuideCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.setTitle('Vodič za korišćenje Rehab platforme')
        self.setAuthor('Sport Care & Med')
        self.setSubject('Prijava, nalozi, kartoni, terapije, planovi, štampa i izveštaji')
        self.setCreator('Sport Care & Med')

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=52, rightMargin=52, topMargin=66, bottomMargin=59)
doc.build(story, onFirstPage=page_art, onLaterPages=page_art, canvasmaker=GuideCanvas)
print(OUT)
