#!/usr/bin/env python3
"""Generate a visually appealing Serbian admin guide PDF for Sport Care Med."""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

# ---------------------------------------------------------------------------
# Brand palette (matches Tailwind config)
# ---------------------------------------------------------------------------
NAVY = colors.HexColor("#0B2545")
TEAL = colors.HexColor("#13B5B1")
SAND = colors.HexColor("#F5F1EA")
GRAY_900 = colors.HexColor("#1F2937")
GRAY_700 = colors.HexColor("#374151")
GRAY_500 = colors.HexColor("#6B7280")
GRAY_300 = colors.HexColor("#D1D5DB")
GRAY_100 = colors.HexColor("#F3F4F6")
AMBER = colors.HexColor("#B45309")
AMBER_BG = colors.HexColor("#FEF3C7")
EMERALD = colors.HexColor("#047857")
EMERALD_BG = colors.HexColor("#D1FAE5")
RED_BG = colors.HexColor("#FEE2E2")
RED = colors.HexColor("#B91C1C")

OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "Sport-Care-Med-Admin-Vodic.pdf"

# ---------------------------------------------------------------------------
# Fonts — try DejaVu (ships with macOS via Homebrew sometimes) for full Serbian
# Latin diacritics, fall back to Helvetica.
# ---------------------------------------------------------------------------
FONT_REG = "Helvetica"
FONT_BOLD = "Helvetica-Bold"
FONT_ITAL = "Helvetica-Oblique"

_font_candidates = [
    ("/System/Library/Fonts/Supplemental/Arial.ttf",
     "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
     "/System/Library/Fonts/Supplemental/Arial Italic.ttf"),
    ("/Library/Fonts/Arial.ttf",
     "/Library/Fonts/Arial Bold.ttf",
     "/Library/Fonts/Arial Italic.ttf"),
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
     "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
     "/usr/share/fonts/truetype/dejavu/DejaVuSans-Oblique.ttf"),
]
for reg, bold, ital in _font_candidates:
    if Path(reg).exists() and Path(bold).exists():
        try:
            pdfmetrics.registerFont(TTFont("Body", reg))
            pdfmetrics.registerFont(TTFont("Body-Bold", bold))
            if Path(ital).exists():
                pdfmetrics.registerFont(TTFont("Body-Italic", ital))
                FONT_ITAL = "Body-Italic"
            else:
                FONT_ITAL = "Body"
            FONT_REG = "Body"
            FONT_BOLD = "Body-Bold"
            break
        except Exception:
            continue

# ---------------------------------------------------------------------------
# Styles
# ---------------------------------------------------------------------------
styles = getSampleStyleSheet()

style_cover_title = ParagraphStyle(
    "CoverTitle", parent=styles["Title"], fontName=FONT_BOLD,
    fontSize=42, leading=48, textColor=colors.white, alignment=TA_LEFT,
    spaceAfter=12,
)
style_cover_sub = ParagraphStyle(
    "CoverSub", parent=styles["Normal"], fontName=FONT_REG,
    fontSize=16, leading=22, textColor=colors.white, alignment=TA_LEFT,
)
style_cover_meta = ParagraphStyle(
    "CoverMeta", parent=styles["Normal"], fontName=FONT_REG,
    fontSize=11, leading=14, textColor=colors.HexColor("#CFE9E8"), alignment=TA_LEFT,
)

style_h1 = ParagraphStyle(
    "H1", parent=styles["Heading1"], fontName=FONT_BOLD,
    fontSize=24, leading=30, textColor=NAVY, spaceBefore=4, spaceAfter=10,
)
style_h2 = ParagraphStyle(
    "H2", parent=styles["Heading2"], fontName=FONT_BOLD,
    fontSize=16, leading=22, textColor=NAVY, spaceBefore=14, spaceAfter=6,
)
style_h3 = ParagraphStyle(
    "H3", parent=styles["Heading3"], fontName=FONT_BOLD,
    fontSize=12.5, leading=16, textColor=TEAL, spaceBefore=10, spaceAfter=4,
)
style_body = ParagraphStyle(
    "Body", parent=styles["Normal"], fontName=FONT_REG,
    fontSize=10.5, leading=15, textColor=GRAY_900, alignment=TA_JUSTIFY,
    spaceAfter=6,
)
style_body_left = ParagraphStyle(
    "BodyLeft", parent=style_body, alignment=TA_LEFT,
)
style_small = ParagraphStyle(
    "Small", parent=style_body, fontSize=9, leading=12, textColor=GRAY_500,
)
style_mono = ParagraphStyle(
    "Mono", parent=styles["Code"], fontName="Courier",
    fontSize=9.5, leading=13, textColor=GRAY_900, leftIndent=8, rightIndent=8,
    spaceBefore=2, spaceAfter=8, backColor=GRAY_100, borderPadding=8,
)
style_li = ParagraphStyle(
    "LI", parent=style_body, alignment=TA_LEFT, spaceAfter=2,
)
style_callout = ParagraphStyle(
    "Callout", parent=style_body, fontName=FONT_REG, fontSize=10.5, leading=15,
    textColor=GRAY_900, alignment=TA_LEFT,
)
style_chip = ParagraphStyle(
    "Chip", parent=styles["Normal"], fontName=FONT_BOLD,
    fontSize=9, leading=11, alignment=TA_CENTER, textColor=colors.white,
)
style_section_kicker = ParagraphStyle(
    "Kicker", parent=styles["Normal"], fontName=FONT_BOLD,
    fontSize=9, leading=11, textColor=TEAL, alignment=TA_LEFT, spaceAfter=2,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def hr(color=GRAY_300, thickness=0.6):
    t = Table([[""]], colWidths=[16.5 * cm], rowHeights=[0.1])
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, -1), thickness, color)]))
    return t


def callout(title: str, body: str, kind: str = "info"):
    if kind == "warn":
        bg, fg, accent = AMBER_BG, AMBER, AMBER
        icon = "!"
    elif kind == "danger":
        bg, fg, accent = RED_BG, RED, RED
        icon = "X"
    elif kind == "ok":
        bg, fg, accent = EMERALD_BG, EMERALD, EMERALD
        icon = "OK"
    else:
        bg, fg, accent = colors.HexColor("#E0F7F6"), TEAL, TEAL
        icon = "i"

    title_p = Paragraph(
        f'<font name="{FONT_BOLD}" color="{fg.hexval()}">{icon} &nbsp; {title}</font>',
        style_callout,
    )
    body_p = Paragraph(body, style_callout)
    inner = Table([[title_p], [body_p]], colWidths=[15.7 * cm])
    inner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
    ]))
    return KeepTogether([Spacer(1, 4), inner, Spacer(1, 6)])


def step_box(num: int, title: str, body_html: str):
    num_cell = Paragraph(
        f'<font name="{FONT_BOLD}" color="white" size="14">{num}</font>',
        ParagraphStyle("n", parent=style_body, alignment=TA_CENTER,
                       textColor=colors.white),
    )
    title_p = Paragraph(
        f'<font name="{FONT_BOLD}" color="{NAVY.hexval()}" size="11.5">{title}</font>',
        style_callout,
    )
    body_p = Paragraph(body_html, style_callout)
    right = Table([[title_p], [body_p]], colWidths=[14.0 * cm])
    right.setStyle(TableStyle([
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    outer = Table([[num_cell, right]], colWidths=[1.2 * cm, 14.5 * cm])
    outer.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), TEAL),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("VALIGN", (0, 0), (0, 0), "MIDDLE"),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
    ]))
    return KeepTogether([outer, Spacer(1, 6)])


def bullet_list(items):
    return ListFlowable(
        [ListItem(Paragraph(it, style_li), leftIndent=10, value="•")
         for it in items],
        bulletType="bullet", bulletFontName=FONT_BOLD, bulletColor=TEAL,
        leftIndent=14, bulletFontSize=10,
    )


def field_table(rows):
    """rows: list of (field, description)."""
    data = [[
        Paragraph(f'<font name="{FONT_BOLD}" color="{NAVY.hexval()}">Polje</font>', style_li),
        Paragraph(f'<font name="{FONT_BOLD}" color="{NAVY.hexval()}">Opis</font>', style_li),
    ]]
    for f, d in rows:
        data.append([
            Paragraph(f'<font name="{FONT_BOLD}">{f}</font>', style_li),
            Paragraph(d, style_li),
        ])
    t = Table(data, colWidths=[4.5 * cm, 11.2 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SAND),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, GRAY_100]),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


# ---------------------------------------------------------------------------
# Page templates
# ---------------------------------------------------------------------------
def cover_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Navy background
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    # Teal accent bar
    canvas.setFillColor(TEAL)
    canvas.rect(0, h - 4 * cm, w, 0.8 * cm, fill=1, stroke=0)
    # Decorative circle
    canvas.setFillColor(colors.HexColor("#103862"))
    canvas.circle(w - 1.5 * cm, 1.5 * cm, 6 * cm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.circle(w - 2.5 * cm, 2.5 * cm, 1.4 * cm, fill=1, stroke=0)
    # Top brand
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT_BOLD, 11)
    canvas.drawString(2 * cm, h - 2 * cm, "SPORT CARE MED")
    canvas.setFillColor(TEAL)
    canvas.setFont(FONT_REG, 9)
    canvas.drawString(2 * cm, h - 2.4 * cm, "Administratorski vodič")
    # Footer line
    canvas.setStrokeColor(TEAL)
    canvas.setLineWidth(0.6)
    canvas.line(2 * cm, 1.6 * cm, w - 2 * cm, 1.6 * cm)
    canvas.setFillColor(colors.HexColor("#9CC8C7"))
    canvas.setFont(FONT_REG, 9)
    canvas.drawString(2 * cm, 1.1 * cm, "Verzija 1.0   ·   Maj 2026   ·   sport-care-med")
    canvas.restoreState()


def content_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Header band
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 1.2 * cm, w, 1.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(TEAL)
    canvas.rect(0, h - 1.25 * cm, w, 0.05 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(FONT_BOLD, 9)
    canvas.drawString(2 * cm, h - 0.78 * cm, "SPORT CARE MED  ·  Administratorski vodič")
    # Page number
    canvas.setFont(FONT_REG, 9)
    canvas.drawRightString(w - 2 * cm, h - 0.78 * cm, f"Strana {doc.page - 1}")
    # Footer
    canvas.setFillColor(GRAY_500)
    canvas.setFont(FONT_REG, 8)
    canvas.drawString(2 * cm, 1.0 * cm, "© Sport Care Med  ·  Interni vodič za administratore")
    canvas.drawRightString(w - 2 * cm, 1.0 * cm, "sport-care-med.rs")
    canvas.setStrokeColor(GRAY_300)
    canvas.setLineWidth(0.4)
    canvas.line(2 * cm, 1.4 * cm, w - 2 * cm, 1.4 * cm)
    canvas.restoreState()


# ---------------------------------------------------------------------------
# Document
# ---------------------------------------------------------------------------
def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        title="Sport Care Med — Administratorski vodič",
        author="Sport Care Med",
        subject="Uputstvo za korišćenje admin panela",
    )
    cover_frame = Frame(0, 0, A4[0], A4[1], id="cover",
                        leftPadding=2 * cm, rightPadding=2 * cm,
                        topPadding=4 * cm, bottomPadding=2 * cm)
    content_frame = Frame(doc.leftMargin, doc.bottomMargin,
                          doc.width, doc.height, id="content")
    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[cover_frame], onPage=cover_page),
        PageTemplate(id="Content", frames=[content_frame], onPage=content_page),
    ])

    story = []

    # ---- COVER ----------------------------------------------------------
    story.append(Spacer(1, 4 * cm))
    story.append(Paragraph(
        '<font color="#13B5B1">ADMIN PANEL</font>', style_cover_meta))
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph("Sport Care Med", style_cover_title))
    story.append(Paragraph(
        "Kompletan vodič kroz administratorski panel — proizvodi, blog, narudžbine, "
        "akcijski kodovi i još mnogo toga.",
        style_cover_sub,
    ))
    story.append(Spacer(1, 1.2 * cm))
    story.append(Paragraph(
        "Verzija 1.0  ·  Maj 2026  ·  Pripremljeno za Sport Care Med tim",
        style_cover_meta,
    ))
    story.append(PageBreak())
    # Switch template for the rest
    story.append(Paragraph("", style_body))  # filler so template applies
    doc.handle_nextPageTemplate("Content")

    # ---- TOC (manual) --------------------------------------------------
    story.append(Paragraph("Sadržaj", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 8))
    toc_items = [
        ("1.", "Pre nego što počnete", "3"),
        ("2.", "Prijava i pristup admin panelu", "3"),
        ("3.", "Pregled (Dashboard)", "4"),
        ("4.", "Proizvodi — kako dodati i izmeniti", "5"),
        ("5.", "Kategorije proizvoda", "8"),
        ("6.", "Akcijski kodovi (popusti)", "9"),
        ("7.", "Narudžbine i statusi", "10"),
        ("8.", "Blog — nacrt, objavljivanje i zakazivanje", "12"),
        ("9.", "Autori bloga", "15"),
        ("10.", "Upiti (Leads) sa sajta", "16"),
        ("11.", "Newsletter pretplatnici", "17"),
        ("12.", "Saveti i najčešće greške", "18"),
        ("13.", "Kontakt za tehničku podršku", "19"),
    ]
    toc_data = []
    for num, title, page in toc_items:
        toc_data.append([
            Paragraph(f'<font name="{FONT_BOLD}" color="{TEAL.hexval()}">{num}</font>',
                      style_li),
            Paragraph(title, style_li),
            Paragraph(f'<font color="{GRAY_500.hexval()}">str. {page}</font>', style_li),
        ])
    toc = Table(toc_data, colWidths=[1.2 * cm, 12.5 * cm, 2 * cm])
    toc.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, SAND]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(toc)
    story.append(PageBreak())

    # ---- 1. PRE NEGO ŠTO POČNETE ---------------------------------------
    story.append(Paragraph("Kicker · Početak", style_section_kicker))
    story.append(Paragraph("1. Pre nego što počnete", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Ovaj vodič je namenjen članovima Sport Care Med tima koji upravljaju "
        "sadržajem sajta — proizvodima, blogom, narudžbinama i upitima. Sve "
        "akcije se obavljaju kroz veb pregledač, bez instalacije ikakvog dodatnog "
        "softvera.", style_body))
    story.append(Paragraph("Šta vam je potrebno", style_h3))
    story.append(bullet_list([
        "Računar ili tablet sa stabilnom internet konekcijom",
        "Moderan veb pregledač (Chrome, Safari, Firefox, Edge — najnovija verzija)",
        "Vaš administratorski nalog (e-mail i lozinka)",
        "Slike proizvoda u JPG ili PNG formatu, idealno do 2&nbsp;MB po slici",
    ]))
    story.append(callout(
        "Bezbednost prvo",
        "Nikada ne delite lozinku sa drugima i odjavite se sa zajedničkih računara. "
        "Ako sumnjate da je nalog ugrožen, odmah promenite lozinku i obavestite tehničku podršku.",
        "warn",
    ))

    # ---- 2. PRIJAVA -----------------------------------------------------
    story.append(Paragraph("2. Prijava i pristup admin panelu", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(step_box(1, "Otvorite stranicu za prijavu",
        'U pregledaču otvorite <font name="' + FONT_BOLD +
        '">sport-care-med.rs/sr/nalog/prijava</font>.'))
    story.append(step_box(2, "Unesite e-mail i lozinku",
        "Koristite e-mail adresu koja je dobila administratorske dozvole."))
    story.append(step_box(3, "Otvorite admin panel",
        "Nakon prijave, u zaglavlju sajta pojavljuje se link "
        '<font name="' + FONT_BOLD + '">Admin</font>. '
        "Kliknite na njega ili idite direktno na "
        '<font name="' + FONT_BOLD + '">/sr/admin</font>.'))
    story.append(callout(
        "Nemate Admin link?",
        "To znači da vaš nalog još nije promovisan u administratora. "
        "Pošaljite vaš e-mail tehničkoj podršci — oni će u Supabase bazi postaviti "
        "vašu ulogu na <b>admin</b>. Posle toga se odjavite i ponovo prijavite.",
        "info",
    ))

    # ---- 3. DASHBOARD ---------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("3. Pregled (Dashboard)", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Početna strana admin panela prikazuje brze statistike i prečice ka svim "
        "delovima sistema. Sa leve strane je glavni meni (sidebar) koji je uvek "
        "dostupan.", style_body))
    story.append(Paragraph("Šta ćete videti", style_h3))
    story.append(bullet_list([
        "<b>Prihod (mesec / sve vreme):</b> ukupna vrednost potvrđenih narudžbina",
        "<b>Broj narudžbina:</b> nove, na čekanju, u obradi, isporučene",
        "<b>Top proizvodi:</b> najprodavaniji artikli u tekućem mesecu",
        "<b>Stanje zaliha:</b> upozorenja za proizvode sa malo komada",
        "<b>Novi upiti:</b> brojač neobrađenih kontakt formi",
    ]))
    story.append(callout(
        "Savet",
        "Otvorite Dashboard svakog jutra — top blok pokazuje šta zahteva pažnju "
        "(nove narudžbine, niske zalihe, novi upiti) na jednom mestu.",
        "ok",
    ))

    # ---- 4. PROIZVODI ---------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("Glavna sekcija · Prodavnica", style_section_kicker))
    story.append(Paragraph("4. Proizvodi — kako dodati i izmeniti", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Sekcija <b>Proizvodi</b> (<font name='" + FONT_BOLD +
        "'>/admin/products</font>) je srce prodavnice. Ovde dodajete nove artikle, "
        "menjate cene, ažurirate zalihe i postavljate slike.", style_body))

    story.append(Paragraph("4.1 Lista proizvoda", style_h2))
    story.append(Paragraph(
        "Lista prikazuje sve proizvode sa nazivom, slugom (URL adresom), cenom, "
        "stanjem zaliha i statusom (aktivan / neaktivan). Klikom na proizvod "
        "otvarate ga za izmenu.", style_body))

    story.append(Paragraph("4.2 Dodavanje novog proizvoda", style_h2))
    story.append(step_box(1, "Kliknite „+ Novo“",
        "Dugme se nalazi gore desno na listi proizvoda."))
    story.append(step_box(2, "Popunite osnovne podatke (SR i EN)",
        "Svako tekstualno polje ima dva taba — <b>SR</b> i <b>EN</b>. "
        "Popunite oba jezika, jer kupci na sajtu mogu menjati jezik."))
    story.append(step_box(3, "Postavite cene i zalihe",
        "Cena je u dinarima (RSD). „Stara cena“ je opciona — ako je veća od trenutne, "
        "na sajtu će se prikazati precrtana radi vizuelnog efekta sniženja."))
    story.append(step_box(4, "Otpremite slike",
        "Kliknite na polje za sliku i izaberite fajl(ove) sa računara. "
        "Slike se automatski uploaduju u skladište. Prvu sliku sajt koristi "
        "kao naslovnu."))
    story.append(step_box(5, "Označite Aktivan i (opciono) Istaknut",
        "Samo aktivni proizvodi su vidljivi kupcima. „Istaknut“ ih prikazuje na "
        "naslovnoj strani."))
    story.append(step_box(6, "Sačuvajte",
        "Pritisnite <b>Sačuvaj</b>. Promene su odmah vidljive na sajtu."))

    story.append(Paragraph("4.3 Polja u formi proizvoda", style_h2))
    story.append(field_table([
        ("Naziv (SR/EN)", "Glavni naziv proizvoda. Pojavljuje se u listi i na detaljnoj strani."),
        ("Slug", "Deo URL adrese, npr. <font name='Courier'>kineziološki-trakovi</font>. Mala slova, brojevi i crtice."),
        ("Opis (SR/EN)", "Detaljan opis, podržava Markdown formatiranje (naslovi, liste, linkovi)."),
        ("Cena", "Trenutna prodajna cena u dinarima."),
        ("Stara cena", "Opciono. Ako je veća, prikazuje sniženje."),
        ("Zalihe", "Broj komada na stanju. Kada padne na 0, kupci ne mogu naručiti."),
        ("Kategorija", "Bira se iz padajuće liste. Kategorije pravite u sekciji Kategorije."),
        ("Tip", "Fizički proizvod ili PDF (digitalni preuzimani fajl)."),
        ("Slike", "Više slika može biti otpremljeno. Prva je naslovna."),
        ("Aktivan", "Da li je proizvod vidljiv kupcima."),
        ("Istaknut", "Prikazuje proizvod na naslovnoj strani."),
    ]))
    story.append(callout(
        "Slug — pravilo",
        "Slug se može sastojati samo od malih slova, brojeva i crtica (-). "
        "Bez razmaka, bez đ/š/č/ć/ž — koristite <i>dj, s, c, c, z</i>. "
        "Primer: <font name='Courier'>kompresivne-carape-srednje</font>.",
        "warn",
    ))

    story.append(Paragraph("4.4 Izmena ili brisanje", style_h2))
    story.append(bullet_list([
        "Klik na proizvod u listi otvara formu za izmenu sa istim poljima.",
        "Sva polja se mogu menjati u bilo kom trenutku — promene su <b>odmah</b> vidljive.",
        "Dugme <b>Obriši</b> nalazi se na dnu strane za izmenu i traži potvrdu pre brisanja.",
    ]))
    story.append(callout(
        "Pažnja kod brisanja",
        "Brisanje proizvoda je trajno. Ako proizvod ima istoriju u narudžbinama, "
        "preporučuje se da ga umesto brisanja postavite na <b>Neaktivan</b> — tako "
        "ostaje u istoriji ali se ne prikazuje u prodavnici.",
        "danger",
    ))

    # ---- 5. KATEGORIJE --------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("5. Kategorije proizvoda", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Kategorije organizuju proizvode i omogućavaju kupcima da filtriraju "
        "ponudu. Pravite ih u sekciji <b>/admin/categories</b>.", style_body))
    story.append(Paragraph("Polja kategorije", style_h3))
    story.append(field_table([
        ("Naziv (SR/EN)", "Ime kategorije, npr. „Kompresivni programi“."),
        ("Slug", "URL adresa kategorije."),
        ("Opis (SR/EN)", "Kratak opis koji se prikazuje na vrhu strane kategorije."),
        ("Slika", "Naslovna slika kategorije (opciono)."),
        ("Redosled", "Broj koji određuje poredak u meniju i listi."),
    ]))
    story.append(callout(
        "Najbolje prakse",
        "Držite broj kategorija na razumnom nivou (5–10). Previše kategorija "
        "otežava pretragu kupcima. Koristite jasna, kratka imena.",
        "info",
    ))

    # ---- 6. POPUSTI -----------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("6. Akcijski kodovi (popusti)", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "U <b>/admin/discounts</b> pravite kodove koje kupci unose pri kupovini.",
        style_body))
    story.append(Paragraph("Tipovi popusta", style_h3))
    story.append(bullet_list([
        "<b>Procenat (%):</b> npr. 15% sa celokupne korpe",
        "<b>Fiksan iznos (RSD):</b> npr. 1.000 din. odbitka",
    ]))
    story.append(Paragraph("Ograničenja koja možete postaviti", style_h3))
    story.append(field_table([
        ("Datum od / do", "Vremenski okvir u kome je kod aktivan."),
        ("Maksimalan broj korišćenja", "Limit ukupne upotrebe (npr. 100 puta)."),
        ("Minimalna vrednost korpe", "Kod važi samo iznad zadatog iznosa."),
        ("Aktivan", "Trenutni status koda."),
    ]))
    story.append(callout(
        "Praćenje",
        "Sistem automatski beleži broj iskorišćenja (<b>used_count</b>) kada se "
        "narudžbina prvi put potvrdi. Iskorišćeni kodovi ostaju u istoriji.",
        "ok",
    ))

    # ---- 7. NARUDŽBINE -------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("Glavna sekcija · Operativa", style_section_kicker))
    story.append(Paragraph("7. Narudžbine i statusi", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>/admin/orders</b> prikazuje sve narudžbine u realnom vremenu. Klikom na "
        "narudžbinu otvara se detaljan prikaz sa podacima kupca, stavkama, "
        "iznosima i opcijom za promenu statusa.", style_body))

    story.append(Paragraph("Tok statusa narudžbine", style_h2))
    statuses = [
        ("pending", "Nova narudžbina, čeka obradu"),
        ("awaiting_payment", "Čeka uplatu (npr. virmanski)"),
        ("confirmed", "Potvrđena — kupac je dobio potvrdu"),
        ("paid", "Plaćeno — uplata je primljena"),
        ("processing", "U obradi — pakovanje, priprema za slanje"),
        ("shipped", "Poslata kurirskom službom"),
        ("delivered", "Isporučena kupcu"),
        ("cancelled", "Otkazana"),
        ("failed", "Greška u plaćanju"),
    ]
    data = [[
        Paragraph(f'<font name="{FONT_BOLD}" color="white">Status</font>',
                  ParagraphStyle("h", parent=style_li, textColor=colors.white)),
        Paragraph(f'<font name="{FONT_BOLD}" color="white">Značenje</font>',
                  ParagraphStyle("h", parent=style_li, textColor=colors.white)),
    ]]
    for s, d in statuses:
        data.append([
            Paragraph(f'<font name="Courier" color="{TEAL.hexval()}">{s}</font>', style_li),
            Paragraph(d, style_li),
        ])
    t = Table(data, colWidths=[5 * cm, 10.7 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SAND]),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(t)
    story.append(Spacer(1, 8))
    story.append(callout(
        "Kako menjati status",
        "Otvorite narudžbinu, izaberite novi status iz padajuće liste i kliknite "
        "<b>Sačuvaj</b>. Promena je odmah vidljiva kupcu u njegovom nalogu "
        "(<font name='" + FONT_BOLD + "'>/sr/nalog</font>).",
        "info",
    ))
    story.append(callout(
        "Otkazivanje",
        "Status <b>cancelled</b> ne vraća zalihe automatski. Ako otkažete narudžbinu, "
        "ručno proverite stanje u <b>Proizvodi</b> i po potrebi vratite komade.",
        "warn",
    ))

    # ---- 8. BLOG --------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("Glavna sekcija · Sadržaj", style_section_kicker))
    story.append(Paragraph("8. Blog — nacrt, objavljivanje i zakazivanje", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Blog se vodi u <b>/admin/blog</b>. Svaki post je <b>na jednom jeziku</b> "
        "— srpski i engleski su dva odvojena unosa, ali su povezani preko "
        "tzv. <i>translation group</i>-a (grupa prevoda) tako da sajt automatski "
        "pruži prevod kada korisnik promeni jezik.", style_body))

    story.append(Paragraph("8.1 Status posta", style_h2))
    story.append(Paragraph(
        "Kod kreiranja ili izmene posta birate jedan od tri statusa:", style_body))

    chip_data = [[
        Paragraph('<font name="' + FONT_BOLD + '" color="white">NACRT</font>', style_chip),
        Paragraph(
            "Sačuvano ali <b>nije vidljivo</b> javnosti. Idealno dok pišete ili "
            "čekate finalnu sliku.", style_li),
    ], [
        Paragraph('<font name="' + FONT_BOLD + '" color="white">OBJAVI ODMAH</font>', style_chip),
        Paragraph("Post se odmah pojavljuje na blogu sa trenutnim datumom.", style_li),
    ], [
        Paragraph('<font name="' + FONT_BOLD + '" color="white">ZAKAŽI</font>', style_chip),
        Paragraph(
            "Birate datum i vreme u budućnosti. Post je <b>nevidljiv</b> sve do tog "
            "trenutka, kada se automatski pojavljuje na sajtu.", style_li),
    ]]
    chip_table = Table(chip_data, colWidths=[3.2 * cm, 12.5 * cm])
    chip_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GRAY_500),
        ("BACKGROUND", (0, 1), (0, 1), EMERALD),
        ("BACKGROUND", (0, 2), (0, 2), AMBER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, SAND, colors.white]),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
    ]))
    story.append(chip_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("8.2 Kreiranje novog posta", style_h2))
    story.append(step_box(1, "Otvorite „+ Novo“ u sekciji Blog",
        "Forma za novi post se otvara u praznom stanju."))
    story.append(step_box(2, "Izaberite jezik posta",
        "Padajući meni: <b>SR</b> ili <b>EN</b>. Jezik se ne može promeniti nakon snimanja."))
    story.append(step_box(3, "Popunite osnovne podatke",
        "Slug (URL), naslov, kratak sažetak (excerpt) i sadržaj u Markdown formatu."))
    story.append(step_box(4, "Postavite naslovnu sliku i (opciono) galeriju",
        "Naslovna slika je jedna; galerija može imati više slika koje se prikazuju u članku."))
    story.append(step_box(5, "Izaberite autora, kategorije i srodne postove",
        "Sve iz padajućih lista. Autori se prave u <b>/admin/authors</b>."))
    story.append(step_box(6, "Izaberite STATUS",
        "<b>Nacrt</b> dok radite, <b>Objavi odmah</b> kada je gotov, ili "
        "<b>Zakaži</b> ako želite da izađe u tačno određeno vreme."))
    story.append(step_box(7, "Sačuvajte",
        "Klikom na <b>Sačuvaj</b> post je upisan. Ako je status „Objavi odmah“, "
        "već je vidljiv u sekciji <b>/sr/blog</b>."))

    story.append(callout(
        "Markdown — kratki podsetnik",
        "<b>## Naslov</b> — naslov sekcije &nbsp; · &nbsp; "
        "<b>**masno**</b> · <b>*kurziv*</b> · "
        "<b>[tekst](https://link)</b> · "
        "<b>- stavka liste</b>",
        "info",
    ))

    story.append(Paragraph("8.3 Prevod na drugi jezik", style_h2))
    story.append(bullet_list([
        "Prvo napravite SR verziju i sačuvajte je.",
        "Otvorite SR post — gore desno se pojavi <b>+ Translation group (EN)</b>.",
        "Klikom otvarate prazan editor već povezan istim ID-jem grupe prevoda.",
        "Popunite EN verziju i sačuvajte. Sajt će automatski pružiti prevod kada kupac promeni jezik.",
    ]))

    story.append(Paragraph("8.4 Statusna oznaka u listi", style_h2))
    story.append(Paragraph(
        "U listi postova vidite obojenu oznaku statusa za svaki unos:", style_body))
    badge_data = [[
        Paragraph('<font name="' + FONT_BOLD + '" color="' + GRAY_700.hexval() +
                  '">  Nacrt  </font>', style_chip),
        Paragraph("Post nije vidljiv na sajtu.", style_li),
    ], [
        Paragraph('<font name="' + FONT_BOLD + '" color="' + AMBER.hexval() +
                  '">  Zakazano  </font>', style_chip),
        Paragraph("Datum objave je u budućnosti.", style_li),
    ], [
        Paragraph('<font name="' + FONT_BOLD + '" color="' + EMERALD.hexval() +
                  '">  Objavljeno  </font>', style_chip),
        Paragraph("Post je trenutno vidljiv javnosti.", style_li),
    ]]
    bt = Table(badge_data, colWidths=[3.2 * cm, 12.5 * cm])
    bt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GRAY_100),
        ("BACKGROUND", (0, 1), (0, 1), AMBER_BG),
        ("BACKGROUND", (0, 2), (0, 2), EMERALD_BG),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
    ]))
    story.append(bt)

    # ---- 9. AUTORI ------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("9. Autori bloga", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "U <b>/admin/authors</b> dodajete profile autora koji se onda biraju "
        "u formi blog posta. Autorov profil sa biografijom se prikazuje na dnu "
        "članka i na zasebnoj stranici.", style_body))
    story.append(field_table([
        ("Ime", "Puno ime autora."),
        ("Pozicija (SR/EN)", "Npr. „Fizioterapeut“ / „Physiotherapist“."),
        ("Biografija (SR/EN)", "Kratak tekst, 2–4 rečenice."),
        ("Slika (avatar)", "Kvadratna slika, idealno 400×400 px."),
    ]))

    # ---- 10. LEADS -------------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("10. Upiti (Leads) sa sajta", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Sve poruke koje kupci ostave na sajtu — kontakt forma, B2B upiti, "
        "pop-up za popust — slivaju se u <b>/admin/leads</b>.", style_body))
    story.append(Paragraph("Šta možete uraditi sa upitom", style_h3))
    story.append(bullet_list([
        "<b>Pročitati poruku</b> klikom na red (proširuje detalje).",
        "<b>Promeniti status:</b> <i>new → contacted → closed</i>.",
        "<b>Dodati internu napomenu</b> koju vidite samo vi i tim.",
        "<b>Eksport CSV</b> — preuzmite sve upite za izveštaje ili CRM.",
    ]))
    story.append(callout(
        "Najbolja praksa",
        "Postavite cilj da svaki novi upit dobije status <b>contacted</b> u roku "
        "od 24 sata. Brzo reagovanje značajno povećava konverziju.",
        "ok",
    ))

    # ---- 11. NEWSLETTER -------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("11. Newsletter pretplatnici", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "<b>/admin/newsletter</b> prikazuje sve e-mail adrese koje su se "
        "pretplatile preko sajta. Možete videti datum prijave i da li se neko "
        "odjavio.", style_body))
    story.append(Paragraph("Šta možete uraditi", style_h3))
    story.append(bullet_list([
        "Pregledati listu pretplatnika",
        "Eksportovati CSV za uvoz u alate poput Mailchimp, Brevo ili Resend",
        "Videti odjave (unsubscribed) — ovi se NE smeju kontaktirati",
    ]))
    story.append(callout(
        "GDPR podsetnik",
        "Šaljite newsletter samo aktivnim pretplatnicima. Svaka kampanja "
        "<b>mora</b> sadržati link za odjavu. Nikada ne dodajite ručno "
        "adrese koje nisu eksplicitno pristale.",
        "warn",
    ))

    # ---- 12. SAVETI -----------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("12. Saveti i najčešće greške", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Slike — preporuke", style_h3))
    story.append(bullet_list([
        "Optimizujte slike pre otpremanja (do 2&nbsp;MB, ideal 500&nbsp;KB).",
        "Koristite JPG za fotografije, PNG za grafike sa providnošću.",
        "Slike proizvoda neka budu kvadratne (1:1) ili 4:5 za bolji prikaz.",
        "Naslovna slika bloga: 16:9 odnos, minimum 1200×675&nbsp;px.",
    ]))

    story.append(Paragraph("Najčešće greške", style_h3))
    issues = [
        ("Slug već postoji", "Slug mora biti jedinstven. Promenite ga (npr. dodajte broj na kraju)."),
        ("Slika se ne otprema", "Proverite veličinu (limit ~5&nbsp;MB) i format (JPG/PNG)."),
        ("Promene se ne vide na sajtu", "Osvežite stranicu (Ctrl/Cmd + Shift + R) — možda je u kešu."),
        ("EN verzija bloga ne postoji", "Otvorite SR post i kliknite „+ Translation group (EN)“."),
        ("Kod popusta ne radi", "Proverite datum, max. korišćenja i minimum korpe — sve moraju biti zadovoljeni."),
    ]
    rows = [[Paragraph(f'<font name="{FONT_BOLD}" color="white">Problem</font>',
                       ParagraphStyle("h", parent=style_li, textColor=colors.white)),
             Paragraph(f'<font name="{FONT_BOLD}" color="white">Rešenje</font>',
                       ParagraphStyle("h", parent=style_li, textColor=colors.white))]]
    for p, s in issues:
        rows.append([Paragraph(p, style_li), Paragraph(s, style_li)])
    it = Table(rows, colWidths=[5.5 * cm, 10.2 * cm], repeatRows=1)
    it.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SAND]),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(it)
    story.append(Spacer(1, 10))
    story.append(callout(
        "Sigurnost — uvek aktuelno",
        "Ne čuvajte lozinke u pregledaču na javnim računarima. Aktivirajte "
        "dvostruku verifikaciju (2FA) na e-mail nalogu povezanom sa "
        "administratorskim profilom.",
        "warn",
    ))

    # ---- 13. KONTAKT ----------------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("13. Kontakt za tehničku podršku", style_h1))
    story.append(hr(TEAL, 1.2))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Za sve tehničke probleme — bagovi, novi nalozi, izmene koje ne možete "
        "izvesti samostalno — kontaktirajte tehnički tim.", style_body))

    contact_data = [
        [Paragraph('<font name="' + FONT_BOLD + '" color="white">Pitanje</font>',
                   ParagraphStyle("h", parent=style_li, textColor=colors.white)),
         Paragraph('<font name="' + FONT_BOLD + '" color="white">Kome se obratiti</font>',
                   ParagraphStyle("h", parent=style_li, textColor=colors.white))],
        [Paragraph("Novi admin nalog / promena uloge", style_li),
         Paragraph("Tehnička podrška (e-mail razvojnom timu)", style_li)],
        [Paragraph("Greška u prikazu sajta", style_li),
         Paragraph("Tehnička podrška, sa screenshot-om i URL-om", style_li)],
        [Paragraph("Dodavanje sadržaja", style_li),
         Paragraph("Samostalno preko admin panela (ovaj vodič)", style_li)],
        [Paragraph("Promena dizajna / nove funkcije", style_li),
         Paragraph("Razvojni tim — pošaljite kratak opis i mockup ako imate", style_li)],
    ]
    ct = Table(contact_data, colWidths=[7 * cm, 8.7 * cm], repeatRows=1)
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), TEAL),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SAND]),
        ("BOX", (0, 0), (-1, -1), 0.4, GRAY_300),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, GRAY_300),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(ct)
    story.append(Spacer(1, 16))
    story.append(callout(
        "Kraj vodiča",
        "Hvala što koristite Sport Care Med admin panel. Ovaj vodič se redovno "
        "ažurira — uvek koristite najnoviju verziju koja se nalazi u "
        "<font name='" + FONT_BOLD + "'>docs/</font> folderu projekta.",
        "ok",
    ))

    doc.build(story)
    print(f"PDF generisan: {OUTPUT}")


if __name__ == "__main__":
    build()
