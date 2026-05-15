"""Generate branded Nexora invoice PDFs using ReportLab."""
from datetime import datetime, timezone
from io import BytesIO

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable, SimpleDocTemplate, Spacer, Table, TableStyle, Paragraph,
)

BRAND_DARK  = HexColor("#0f172a")
BRAND_MID   = HexColor("#1e293b")
BRAND_BLUE  = HexColor("#0ea5e9")
BRAND_MUTED = HexColor("#64748b")
BRAND_LIGHT = HexColor("#f1f5f9")
BRAND_LINE  = HexColor("#e2e8f0")


def _fmt_amount(cents: int, currency: str) -> str:
    sym = {"usd": "$", "inr": "₹", "eur": "€", "gbp": "£"}.get((currency or "usd").lower(), (currency or "USD").upper() + " ")
    return f"{sym}{(cents or 0) / 100:,.2f}"


def _fmt_ts(ts: int | None) -> str:
    if not ts:
        return "—"
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%B %d, %Y")


def generate(inv: dict, client) -> bytes:
    """
    Render a Nexora-branded invoice PDF.
    inv   : dict returned by stripe_service.get_invoice()
    client: Client ORM object (has .name, .email)
    """
    buf = BytesIO()
    W_page = A4[0]
    margin = 20 * mm
    W = W_page - 2 * margin

    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=margin, rightMargin=margin,
        topMargin=margin, bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()

    def style(name, **kw):
        base = kw.pop("parent", styles["Normal"])
        return ParagraphStyle(name, parent=base, **kw)

    body      = style("body",      fontSize=9,  textColor=BRAND_MUTED, leading=14)
    body_dark = style("bodyDark",  fontSize=9,  textColor=BRAND_DARK,  leading=14)
    th_style  = style("th",        fontSize=8,  textColor=white,       fontName="Helvetica-Bold")
    th_right  = style("thR",       fontSize=8,  textColor=white,       fontName="Helvetica-Bold", alignment=TA_RIGHT)
    td_style  = style("td",        fontSize=8.5, textColor=BRAND_DARK, leading=12)
    td_right  = style("tdR",       fontSize=8.5, textColor=BRAND_DARK, leading=12, alignment=TA_RIGHT)
    lbl_right = style("lblR",      fontSize=9,  textColor=BRAND_MUTED, alignment=TA_RIGHT)
    val_right = style("valR",      fontSize=9,  textColor=BRAND_DARK,  fontName="Helvetica-Bold", alignment=TA_RIGHT)
    ttl_right = style("ttlR",      fontSize=11, textColor=BRAND_DARK,  fontName="Helvetica-Bold", alignment=TA_RIGHT)
    ttv_right = style("ttvR",      fontSize=11, textColor=BRAND_BLUE,  fontName="Helvetica-Bold", alignment=TA_RIGHT)
    footer_st = style("footer",    fontSize=7.5, textColor=BRAND_MUTED, alignment=TA_CENTER, leading=12)

    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    hdr = Table(
        [[
            Paragraph(
                "<font color='#0ea5e9' size='20'><b>Nexora</b></font><br/>"
                "<font color='#64748b' size='8'>AI Automation Platform</font>",
                styles["Normal"],
            ),
            Paragraph(
                "<font color='#0f172a' size='30'><b>INVOICE</b></font>",
                styles["Normal"],
            ),
        ]],
        colWidths=[W * 0.55, W * 0.45],
    )
    hdr.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ALIGN",         (1, 0), (1, 0), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(Spacer(1, 5 * mm))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_BLUE, spaceAfter=5 * mm))

    # ── Bill-to / invoice meta ────────────────────────────────────────────────
    inv_num = inv.get("number") or inv.get("id", "—")
    inv_date = _fmt_ts(inv.get("created"))
    period = f"{_fmt_ts(inv.get('period_start'))} – {_fmt_ts(inv.get('period_end'))}"
    status_txt = (inv.get("status") or "").upper()

    meta = Table(
        [
            [
                Paragraph("<font color='#64748b' size='7.5'><b>BILLED TO</b></font>", styles["Normal"]),
                Paragraph("<font color='#64748b' size='7.5'><b>INVOICE DETAILS</b></font>", styles["Normal"]),
            ],
            [
                Paragraph(f"<b>{client.name}</b><br/>{client.email}", body_dark),
                Paragraph(
                    f"Invoice #: <b>{inv_num}</b><br/>"
                    f"Issue date: <b>{inv_date}</b><br/>"
                    f"Period: <b>{period}</b><br/>"
                    f"Status: <b>{status_txt}</b>",
                    body_dark,
                ),
            ],
        ],
        colWidths=[W * 0.5, W * 0.5],
    )
    meta.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ALIGN",         (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
    ]))
    story.append(meta)
    story.append(Spacer(1, 8 * mm))

    # ── Line items ────────────────────────────────────────────────────────────
    currency = inv.get("currency", "usd")
    lines = inv.get("lines") or []

    col_w = [W * 0.52, W * 0.16, W * 0.16, W * 0.16]
    table_data = [[
        Paragraph("DESCRIPTION",  th_style),
        Paragraph("PERIOD START", th_style),
        Paragraph("PERIOD END",   th_style),
        Paragraph("AMOUNT",       th_right),
    ]]

    if lines:
        for line in lines:
            table_data.append([
                Paragraph(line.get("description") or "Nexora Subscription", td_style),
                Paragraph(_fmt_ts(line.get("period_start")), td_style),
                Paragraph(_fmt_ts(line.get("period_end")),   td_style),
                Paragraph(_fmt_amount(line.get("amount", 0), currency), td_right),
            ])
    else:
        table_data.append([
            Paragraph("Nexora Subscription", td_style),
            Paragraph(_fmt_ts(inv.get("period_start")), td_style),
            Paragraph(_fmt_ts(inv.get("period_end")),   td_style),
            Paragraph(_fmt_amount(inv.get("total", 0), currency), td_right),
        ])

    items = Table(table_data, colWidths=col_w, repeatRows=1)
    items.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0),  (-1, 0),  BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 1),  (-1, -1), [white, BRAND_LIGHT]),
        ("VALIGN",         (0, 0),  (-1, -1), "MIDDLE"),
        ("ALIGN",          (3, 0),  (3, -1),  "RIGHT"),
        ("TOPPADDING",     (0, 0),  (-1, -1), 7),
        ("BOTTOMPADDING",  (0, 0),  (-1, -1), 7),
        ("LEFTPADDING",    (0, 0),  (-1, -1), 8),
        ("RIGHTPADDING",   (0, 0),  (-1, -1), 8),
        ("GRID",           (0, 0),  (-1, -1), 0.5, BRAND_LINE),
    ]))
    story.append(items)
    story.append(Spacer(1, 5 * mm))

    # ── Totals ────────────────────────────────────────────────────────────────
    subtotal    = inv.get("subtotal", 0) or 0
    tax         = inv.get("tax", 0) or 0
    total       = inv.get("total", 0) or subtotal
    amount_paid = inv.get("amount_paid", 0) or total

    totals_rows = [
        [Paragraph("Subtotal", lbl_right), Paragraph(_fmt_amount(subtotal, currency), val_right)],
    ]
    if tax:
        totals_rows.append([Paragraph("Tax", lbl_right), Paragraph(_fmt_amount(tax, currency), val_right)])
    totals_rows.append([Paragraph("", lbl_right), Paragraph("", val_right)])
    total_row_idx = len(totals_rows)
    totals_rows.append([Paragraph("Total", ttl_right), Paragraph(_fmt_amount(total, currency), ttv_right)])
    totals_rows.append([Paragraph("Amount Paid", lbl_right), Paragraph(_fmt_amount(amount_paid, currency), val_right)])

    totals_tbl = Table(totals_rows, colWidths=[W * 0.72, W * 0.28])
    totals_tbl.setStyle(TableStyle([
        ("ALIGN",         (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("LINEABOVE",     (0, total_row_idx), (-1, total_row_idx), 1.5, BRAND_BLUE),
    ]))
    story.append(totals_tbl)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 12 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_MUTED, spaceAfter=4 * mm))
    story.append(Paragraph(
        "Nexora AI Automation Platform &nbsp;·&nbsp; support@nexora.ai &nbsp;·&nbsp; nexora.cmdfleet.com<br/>"
        "This invoice was automatically generated. For billing questions contact support.",
        footer_st,
    ))

    doc.build(story)
    return buf.getvalue()
