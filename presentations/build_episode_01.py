# -*- coding: utf-8 -*-
"""Build a widescreen YouTube PPT for Bihar Board Wala Episode 01."""
from __future__ import print_function
import os
import zipfile
from xml.sax.saxutils import escape

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                   "Bihar-Board-Wala-Episode-01-Arthvyavastha.pptx")

SW, SH = 12192000, 6858000  # 13.333" x 7.5" 16:9
EMU = 914400

def inch(n):
    return int(n * EMU)

C = {
    "indigo": "2D1B69",
    "indigo2": "4C2FB8",
    "navy": "1A1048",
    "saffron": "FF7A18",
    "gold": "FFC53D",
    "cream": "FFF6E8",
    "peach": "FFE8CC",
    "coral": "FF5A5F",
    "rose": "E11D74",
    "teal": "0D9B8A",
    "green": "168A4B",
    "mint": "E8FBF0",
    "white": "FFFFFF",
    "ink": "1F1635",
    "muted": "5C4E78",
    "card": "FFFFFF",
    "optA": "FF7A18",
    "optB": "4C2FB8",
    "optC": "0D9B8A",
    "optD": "E11D74",
}

OPT_COLORS = [C["optA"], C["optB"], C["optC"], C["optD"]]
LETTERS = ["क", "ख", "ग", "घ"]

QUESTIONS = [
    {
        "q": "अंग्रेजों के शासन से पहले भारत को क्या कहा जाता था?",
        "opts": ["सोने की चिड़िया", "चाँदी का देश", "मसालों का द्वीप", "लोहे का देश"],
        "ans": 0,
        "why": "भारत प्राचीन काल में कृषि, व्यापार, हस्तशिल्प और प्राकृतिक संसाधनों से समृद्ध था। इसी वजह से भारत को “सोने की चिड़िया” कहा जाता था।",
    },
    {
        "q": "भारत लगभग कितने वर्षों तक ब्रिटिश शासन का गुलाम (उपनिवेश) रहा?",
        "opts": ["लगभग 100 वर्ष", "लगभग 200 वर्ष", "लगभग 50 वर्ष", "लगभग 300 वर्ष"],
        "ans": 1,
        "why": "भारत पर ब्रिटिश प्रभुत्व लगभग दो शताब्दियों तक रहा। 1757 के प्लासी युद्ध से नियंत्रण मजबूत हुआ और 1947 में स्वतंत्रता मिली।",
    },
    {
        "q": "“अर्थव्यवस्था आजीविका अर्जन की एक प्रणाली है”—यह प्रसिद्ध परिभाषा किसने दी थी?",
        "opts": ["ब्राउन (Brown)", "आर्थर लेविस (Arthur Lewis)", "एडम स्मिथ (Adam Smith)", "जॉन मेनार्ड केन्स (J. M. Keynes)"],
        "ans": 0,
        "why": "ब्राउन के अनुसार अर्थव्यवस्था आजीविका अर्जित करने की प्रणाली है। इसमें मनुष्य अपनी आवश्यकताओं की पूर्ति के लिए आर्थिक गतिविधियाँ करता है।",
    },
    {
        "q": "कृषि, पशुपालन और मछली पालन को अर्थव्यवस्था के किस क्षेत्र में रखा जाता है?",
        "opts": ["प्राथमिक क्षेत्र", "द्वितीयक क्षेत्र", "तृतीयक क्षेत्र", "चतुर्थक क्षेत्र"],
        "ans": 0,
        "why": "प्राथमिक क्षेत्र में प्राकृतिक संसाधनों से सीधे उत्पादन होता है—कृषि, पशुपालन, मछली पालन, वानिकी और खनन।",
    },
    {
        "q": "द्वितीयक क्षेत्र (Secondary Sector) को और किस नाम से जाना जाता है?",
        "opts": ["औद्योगिक क्षेत्र", "सेवा क्षेत्र", "कृषि क्षेत्र", "बैंकिंग क्षेत्र"],
        "ans": 0,
        "why": "द्वितीयक क्षेत्र कच्चे माल को संसाधित कर तैयार वस्तुएँ बनाता है। कारखाने, निर्माण और विनिर्माण इसी में आते हैं, इसलिए इसे औद्योगिक क्षेत्र कहते हैं।",
    },
    {
        "q": "बैंक, परिवहन, संचार और व्यापार को किस क्षेत्र के अंतर्गत शामिल किया जाता है?",
        "opts": ["प्राथमिक क्षेत्र", "तृतीयक क्षेत्र (सेवा क्षेत्र)", "द्वितीयक क्षेत्र", "औद्योगिक क्षेत्र"],
        "ans": 1,
        "why": "तृतीयक क्षेत्र वस्तु नहीं, सेवाएँ देता है—बैंकिंग, परिवहन, संचार, व्यापार, शिक्षा और स्वास्थ्य।",
    },
    {
        "q": "भारत में किस प्रकार की अर्थव्यवस्था पाई जाती है?",
        "opts": ["पूँजीवादी अर्थव्यवस्था", "मिश्रित अर्थव्यवस्था", "समाजवादी अर्थव्यवस्था", "पारंपरिक अर्थव्यवस्था"],
        "ans": 1,
        "why": "भारत में सार्वजनिक और निजी दोनों क्षेत्रों की महत्वपूर्ण भूमिका है। इसलिए भारतीय अर्थव्यवस्था मिश्रित अर्थव्यवस्था है।",
    },
    {
        "q": "अमेरिका और जापान जैसे देशों में किस प्रकार की अर्थव्यवस्था है?",
        "opts": ["पूँजीवादी अर्थव्यवस्था", "समाजवादी अर्थव्यवस्था", "मिश्रित अर्थव्यवस्था", "साम्यवादी अर्थव्यवस्था"],
        "ans": 0,
        "why": "अमेरिका और जापान में उत्पादन के साधनों पर निजी क्षेत्र की प्रमुख भूमिका है। इन्हें पूँजीवादी या बाजार-आधारित अर्थव्यवस्था माना जाता है।",
    },
    {
        "q": "भारत में योजना आयोग (Planning Commission) का गठन कब किया गया था?",
        "opts": ["15 मार्च 1950", "15 अगस्त 1947", "26 जनवरी 1950", "1 अप्रैल 1951"],
        "ans": 0,
        "why": "योजना आयोग का गठन 15 मार्च 1950 को हुआ। उद्देश्य था देश के आर्थिक विकास के लिए पंचवर्षीय योजनाएँ तैयार करना।",
    },
    {
        "q": "योजना आयोग के पदेन अध्यक्ष कौन होते हैं?",
        "opts": ["देश के प्रधानमंत्री", "देश के राष्ट्रपति", "वित्त मंत्री", "उपराष्ट्रपति"],
        "ans": 0,
        "why": "योजना आयोग के पदेन अध्यक्ष भारत के प्रधानमंत्री होते थे। उनकी अध्यक्षता में विकास योजनाओं के महत्वपूर्ण निर्णय लिए जाते थे।",
    },
    {
        "q": "भारत में राष्ट्रीय विकास परिषद् (NDC) का गठन कब किया गया था?",
        "opts": ["6 अगस्त 1952", "26 जनवरी 1950", "15 मार्च 1950", "26 नवंबर 1949"],
        "ans": 0,
        "why": "राष्ट्रीय विकास परिषद् का गठन 6 अगस्त 1952 को हुआ। उद्देश्य था केंद्र और राज्यों के बीच विकास योजनाओं का समन्वय।",
    },
    {
        "q": "ATM का पूर्ण रूप क्या होता है?",
        "opts": ["Automatic Teller Machine", "Any Time Money", "Account Transfer Machine", "All Time Money"],
        "ans": 0,
        "why": "बिहार बोर्ड की पाठ्यपुस्तक के अनुसार ATM = Automatic Teller Machine। इससे बिना काउंटर जाए नकद निकासी जैसी सेवाएँ मिलती हैं।",
    },
    {
        "q": "किसी देश के आर्थिक विकास को मापने के लिए सबसे उचित सूचकांक किसे माना जाता है?",
        "opts": ["प्रति व्यक्ति आय (Per Capita Income)", "कुल साक्षरता दर", "कुल जनसंख्या", "कुल राष्ट्रीय आय"],
        "ans": 0,
        "why": "प्रति व्यक्ति आय से लोगों की औसत आय का अनुमान लगता है। देशों और राज्यों की आर्थिक तुलना में इसका सबसे अधिक उपयोग होता है।",
    },
    {
        "q": "बिहार की अर्थव्यवस्था का मुख्य आधार क्या है?",
        "opts": ["बड़े उद्योग", "कृषि", "सूचना प्रौद्योगिकी", "खनन"],
        "ans": 1,
        "why": "बिहार की बड़ी आबादी की आजीविका कृषि और उससे जुड़ी गतिविधियों पर निर्भर है। इसलिए कृषि राज्य की अर्थव्यवस्था का मुख्य आधार है।",
    },
    {
        "q": "NREGA के तहत ग्रामीण मजदूरों को साल में कम-से-कम कितने दिनों के रोज़गार की गारंटी दी जाती है?",
        "opts": ["100 दिन", "150 दिन", "50 दिन", "200 दिन"],
        "ans": 0,
        "why": "NREGA (बाद में मनरेगा) ग्रामीण परिवारों को एक वित्तीय वर्ष में कम-से-कम 100 दिनों के अकुशल मजदूरी रोज़गार की कानूनी गारंटी देता है।",
    },
]


def t(s):
    return escape(s, {"\"": "&quot;"})


def rpr(sz, b=False, color="FFFFFF", font="Nirmala UI"):
    bold = ' b="1"' if b else ""
    return (
        '<a:rPr lang="hi-IN" altLang="en-US" sz="%d"%s dirty="0">'
        '<a:solidFill><a:srgbClr val="%s"/></a:solidFill>'
        '<a:latin typeface="%s"/><a:ea typeface="%s"/>'
        '<a:cs typeface="%s"/></a:rPr>'
    ) % (sz, bold, color, font, font, font)


def run(text, sz, b=False, color="FFFFFF"):
    return '<a:r>%s<a:t>%s</a:t></a:r>' % (rpr(sz, b, color), t(text))


def para(text, sz, b=False, color="FFFFFF", align="l", spc_before=0, spc_after=0):
    spc = ""
    if spc_before or spc_after:
        spc = "<a:spcBef><a:spcPts val=\"%d\"/></a:spcBef>" % spc_before if spc_before else ""
        if spc_after:
            spc += "<a:spcAft><a:spcPts val=\"%d\"/></a:spcAft>" % spc_after
    return (
        '<a:p><a:pPr algn="%s">%s</a:pPr>%s<a:endParaRPr lang="hi-IN" sz="%d"/></a:p>'
        % (align, spc, run(text, sz, b, color), sz)
    )


def paras(lines):
    return "".join(lines)


def shape(sid, name, x, y, w, h, fill, geom="roundRect", adj=18000,
          texts=None, anchor="ctr", align="ctr", stroke=None, stroke_w=12700,
          alpha=None, font_sz=1800, bold=True, font_color="FFFFFF",
          lins=140000, tins=80000):
    """A filled preset geometry, optionally with wrapped text."""
    av = ""
    if geom == "roundRect":
        av = '<a:avLst><a:gd name="adj" fmla="val %d"/></a:avLst>' % adj
    else:
        av = "<a:avLst/>"
    fill_xml = '<a:solidFill><a:srgbClr val="%s"' % fill
    if alpha is not None:
        fill_xml += '><a:alpha val="%d"/></a:srgbClr></a:solidFill>' % alpha
    else:
        fill_xml += "/></a:solidFill>"
    ln = "<a:ln><a:noFill/></a:ln>"
    if stroke:
        ln = ('<a:ln w="%d"><a:solidFill><a:srgbClr val="%s"/></a:solidFill>'
              '<a:prstDash val="solid"/></a:ln>' % (stroke_w, stroke))
    tx = ""
    if texts is not None:
        body = texts if isinstance(texts, str) and texts.startswith("<a:p>") else para(
            texts, font_sz, bold, font_color, align
        )
        tx = (
            "<p:txBody>"
            '<a:bodyPr wrap="square" lIns="%d" tIns="%d" rIns="%d" bIns="%d" '
            'rtlCol="0" anchor="%s">'
            '<a:spAutoFit/></a:bodyPr><a:lstStyle/>%s</p:txBody>'
            % (lins, tins, lins, tins, anchor, body)
        )
    else:
        tx = ("<p:txBody><a:bodyPr/><a:lstStyle/>"
              '<a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody>')
    sp_lock = ' txBox="1"' if texts is not None else ""
    return (
        "<p:sp><p:nvSpPr><p:cNvPr id=\"%d\" name=\"%s\"/>"
        "<p:cNvSpPr%s/><p:nvPr/></p:nvSpPr>"
        "<p:spPr><a:xfrm><a:off x=\"%d\" y=\"%d\"/><a:ext cx=\"%d\" cy=\"%d\"/></a:xfrm>"
        '<a:prstGeom prst="%s">%s</a:prstGeom>%s%s</p:spPr>%s</p:sp>'
        % (sid, name, sp_lock, x, y, w, h, geom, av, fill_xml, ln, tx)
    )


def brand_footer(sid, dark=False):
    ink = C["cream"] if dark else C["indigo"]
    muted = "FFD9A8" if dark else C["muted"]
    bar = C["navy"] if dark else C["peach"]
    parts = []
    parts.append(shape(sid, "footer", 0, inch(7.12), SW, inch(0.38), bar, "rect", adj=0))
    parts.append(shape(
        sid + 1, "sign", inch(0.35), inch(7.12), inch(8.5), inch(0.38), bar, "rect", adj=0,
        texts=para("Bihar Board Wala  •  बिहार बोर्ड वाला  •  संस्थान एवं चैनल",
                   1200, True, ink, "l"),
        anchor="ctr", align="l", lins=40000, tins=20000,
    ))
    parts.append(shape(
        sid + 2, "ep", inch(9.2), inch(7.12), inch(3.8), inch(0.38), bar, "rect", adj=0,
        texts=para("एपिसोड 01  •  कक्षा 10 अर्थशास्त्र", 1100, True, muted, "r"),
        anchor="ctr", align="r", lins=40000, tins=20000,
    ))
    return "".join(parts)


def header_bar(sid, title, dark=False):
    bg = C["navy"] if dark else C["indigo"]
    parts = []
    parts.append(shape(sid, "top", 0, 0, SW, inch(0.78), bg, "rect", adj=0))
    parts.append(shape(sid + 1, "saffstrip", 0, inch(0.78), SW, inch(0.08), C["saffron"], "rect", adj=0))
    parts.append(shape(sid + 2, "goldstrip", 0, inch(0.86), SW, inch(0.04), C["gold"], "rect", adj=0))
    parts.append(shape(
        sid + 3, "brand", inch(0.35), inch(0.08), inch(5.4), inch(0.64), bg, "rect", adj=0,
        texts=para("Bihar Board Wala", 1600, True, C["gold"], "l"),
        anchor="ctr", align="l", lins=20000, tins=10000,
    ))
    parts.append(shape(
        sid + 4, "htitle", inch(5.8), inch(0.08), inch(7.1), inch(0.64), bg, "rect", adj=0,
        texts=para(title, 1400, True, C["cream"], "r"),
        anchor="ctr", align="r", lins=40000, tins=10000,
    ))
    return "".join(parts)


def bg(sid, color):
    return shape(sid, "bg", 0, 0, SW, SH, color, "rect", adj=0)


def blob(sid, x, y, w, h, fill, alpha=18000):
    return shape(sid, "blob", x, y, w, h, fill, "ellipse", adj=0, alpha=alpha)


def slide_xml(shapes):
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" showMasterSp="0">'
        "<p:cSld><p:spTree>"
        "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>"
        "<p:grpSpPr><a:xfrm><a:off x=\"0\" y=\"0\"/><a:ext cx=\"0\" cy=\"0\"/>"
        "<a:chOff x=\"0\" y=\"0\"/><a:chExt cx=\"0\" cy=\"0\"/></a:xfrm></p:grpSpPr>"
        "%s</p:spTree></p:cSld>"
        "<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>"
    ) % shapes


# ---------- slide builders ----------
def title_slide():
    s = []
    s.append(bg(2, C["navy"]))
    s.append(blob(3, inch(-1.4), inch(-1.6), inch(5.2), inch(5.2), C["saffron"], 22000))
    s.append(blob(4, inch(10.2), inch(4.2), inch(4.8), inch(4.8), C["gold"], 20000))
    s.append(blob(5, inch(9.6), inch(-1.1), inch(3.6), inch(3.6), C["rose"], 16000))
    s.append(blob(6, inch(-0.8), inch(5.4), inch(3.2), inch(3.2), C["teal"], 18000))
    s.append(shape(7, "accent", 0, 0, inch(0.22), SH, C["saffron"], "rect", adj=0))
    s.append(shape(8, "accent2", inch(13.11), 0, inch(0.22), SH, C["gold"], "rect", adj=0))
    s.append(shape(
        9, "badge", inch(0.7), inch(1.15), inch(4.4), inch(0.52), C["saffron"], adj=50000,
        texts=para("  EPISODE  01  •  FIRST CLASS", 1400, True, C["navy"], "ctr"),
        lins=40000, tins=20000,
    ))
    s.append(shape(
        10, "ch", inch(0.7), inch(1.85), inch(12), inch(0.7), C["navy"], "rect", adj=0, alpha=0,
        texts=para("कक्षा 10  •  सामाजिक विज्ञान  •  अर्थशास्त्र", 1800, True, C["gold"], "l"),
        align="l", anchor="ctr", lins=20000, tins=0,
    ))
    s.append(shape(
        11, "main", inch(0.7), inch(2.45), inch(12), inch(2.0), C["navy"], "rect", adj=0, alpha=0,
        texts=paras([
            para("अर्थव्यवस्था एवं इसके", 4000, True, C["cream"], "l"),
            para("विकास का इतिहास", 4000, True, C["gold"], "l"),
        ]),
        align="l", anchor="t", lins=20000, tins=20000,
    ))
    s.append(shape(
        12, "sub", inch(0.7), inch(4.55), inch(11.5), inch(0.7), C["navy"], "rect", adj=0, alpha=0,
        texts=para("पहला एपिसोड  •  15 महत्वपूर्ण MCQ  •  आसान व्याख्या  •  बोर्ड परीक्षा फोकस",
                   1800, False, "FFD9A8", "l"),
        align="l", lins=20000, tins=10000,
    ))
    s.append(shape(
        13, "cta", inch(0.7), inch(5.45), inch(6.4), inch(0.7), C["saffron"], adj=50000,
        texts=para("Bihar Board Wala", 2400, True, C["navy"], "ctr"),
        lins=40000, tins=20000,
    ))
    s.append(shape(
        14, "inst", inch(7.3), inch(5.5), inch(5.2), inch(0.6), C["navy"], "rect", adj=0, alpha=0,
        texts=para("संस्थान  •  YouTube चैनल  •  टेस्ट सीरीज़", 1400, True, C["cream"], "l"),
        align="l", lins=20000, tins=10000,
    ))
    s.append(brand_footer(40, dark=True))
    return slide_xml("".join(s))


def welcome_slide():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "स्वागत है आपकी पहली कक्षा में", dark=False))
    s.append(blob(10, inch(10.8), inch(4.8), inch(3.4), inch(3.4), C["saffron"], 14000))
    cards = [
        (C["saffron"], "🎯", "क्या मिलेगा", "बोर्ड परीक्षा जैसे MCQ, सही उत्तर और 2–3 लाइन की आसान व्याख्या।"),
        (C["indigo2"], "📚", "कौन सा अध्याय", "अर्थव्यवस्था एवं इसके विकास का इतिहास — कक्षा 10 सामाजिक विज्ञान।"),
        (C["teal"], "💛", "किसके साथ", "Bihar Board Wala — आपका संस्थान और YouTube चैनल।"),
        (C["rose"], "🔥", "कैसे पढ़ें", "पहले सोचें, फिर उत्तर देखें। तथ्यों को याद रखें, रटें नहीं।"),
    ]
    for i, (col, _ic, title, body) in enumerate(cards):
        col_i = i % 2
        row = i // 2
        x = inch(0.45 + col_i * 6.4)
        y = inch(1.2 + row * 2.75)
        s.append(shape(20 + i * 3, "c", x, y, inch(6.1), inch(2.5), C["white"], adj=16000,
                       stroke=col, stroke_w=25400))
        s.append(shape(21 + i * 3, "t", x + inch(0.25), y + inch(0.25), inch(5.6), inch(0.6),
                       col, adj=50000, texts=para(title, 2000, True, C["white"], "ctr"),
                       lins=40000, tins=15000))
        s.append(shape(22 + i * 3, "b", x + inch(0.25), y + inch(1.0), inch(5.6), inch(1.2),
                       C["white"], adj=0,
                       texts=para(body, 1600, False, C["ink"], "l"),
                       anchor="t", align="l", lins=20000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def agenda_slide():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "आज की कक्षा का नक्शा", dark=False))
    items = [
        ("01", C["saffron"], "आधार अवधारणा", "अर्थव्यवस्था, तीन क्षेत्र, मिश्रित बनाम पूँजीवादी"),
        ("02", C["indigo2"], "संस्थाएँ व तिथियाँ", "योजना आयोग, NDC, ATM, प्रति व्यक्ति आय"),
        ("03", C["teal"], "बिहार फोकस", "कृषि आधार और NREGA — 100 दिन"),
        ("04", C["rose"], "15 MCQ राउंड", "प्रश्न देखें → सोचें → उत्तर व व्याख्या"),
        ("05", C["gold"], "त्वरित रिविज़न", "उत्तर कुंजी + परीक्षा टिप"),
    ]
    for i, (num, col, title, body) in enumerate(items):
        y = inch(1.15 + i * 1.1)
        s.append(shape(20 + i * 3, "row", inch(0.45), y, inch(12.4), inch(0.98), C["white"],
                       adj=18000, stroke=col, stroke_w=19050))
        s.append(shape(21 + i * 3, "n", inch(0.65), y + inch(0.16), inch(1.15), inch(0.66),
                       col, adj=50000, texts=para(num, 2000, True, C["navy"] if col == C["gold"] else C["white"], "ctr")))
        s.append(shape(22 + i * 3, "tx", inch(2.05), y + inch(0.08), inch(10.4), inch(0.82),
                       C["white"], adj=0,
                       texts=paras([
                           para(title, 2000, True, C["ink"], "l"),
                           para(body, 1400, False, C["muted"], "l"),
                       ]),
                       anchor="ctr", align="l", lins=40000, tins=10000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def concept_sectors():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "याद रखें — अर्थव्यवस्था के तीन क्षेत्र", dark=False))
    sectors = [
        (C["saffron"], "प्राथमिक", "प्राकृतिक संसाधनों से सीधा उत्पादन", "कृषि  •  पशुपालन  •  मछली पालन  •  वानिकी  •  खनन"),
        (C["indigo2"], "द्वितीयक", "औद्योगिक क्षेत्र — कच्चे माल से वस्तु", "कारखाना  •  निर्माण  •  विनिर्माण"),
        (C["teal"], "तृतीयक", "सेवा क्षेत्र — वस्तु नहीं, सेवा", "बैंक  •  परिवहन  •  संचार  •  व्यापार  •  शिक्षा"),
    ]
    for i, (col, title, sub, ex) in enumerate(sectors):
        x = inch(0.4 + i * 4.3)
        s.append(shape(20 + i * 4, "card", x, inch(1.2), inch(4.1), inch(5.5), C["white"],
                       adj=14000, stroke=col, stroke_w=25400))
        s.append(shape(21 + i * 4, "top", x, inch(1.2), inch(4.1), inch(1.55), col, adj=0,
                       texts=para(title, 2600, True, C["white"], "ctr"), lins=40000, tins=40000))
        # round the top by overlaying? skip; keep simple
        s.append(shape(22 + i * 4, "sub", x + inch(0.2), inch(2.95), inch(3.7), inch(1.15),
                       C["white"], adj=0,
                       texts=para(sub, 1600, True, C["ink"], "ctr"),
                       anchor="t", lins=20000, tins=10000))
        s.append(shape(23 + i * 4, "ex", x + inch(0.25), inch(4.2), inch(3.6), inch(2.1),
                       C["peach"] if i == 0 else (C["cream"] if i == 1 else "D9F6F1"),
                       adj=16000,
                       texts=para(ex, 1500, False, C["ink"], "ctr"),
                       lins=50000, tins=40000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def concept_types():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "अर्थव्यवस्था के प्रकार — परीक्षा पॉइंट", dark=False))
    s.append(shape(20, "left", inch(0.4), inch(1.2), inch(6.2), inch(5.5), C["white"],
                   adj=14000, stroke=C["indigo2"], stroke_w=25400))
    s.append(shape(21, "lh", inch(0.4), inch(1.2), inch(6.2), inch(1.1), C["indigo2"], adj=0,
                   texts=para("भारत  =  मिश्रित अर्थव्यवस्था", 2000, True, C["white"], "ctr")))
    s.append(shape(22, "lb", inch(0.7), inch(2.55), inch(5.6), inch(3.7), C["white"], adj=0,
                   texts=paras([
                       para("सार्वजनिक क्षेत्र + निजी क्षेत्र", 1800, True, C["ink"], "l", spc_after=400),
                       para("दोनों की भूमिका महत्वपूर्ण है।", 1600, False, C["muted"], "l", spc_after=600),
                       para("सरकार योजना बनाती है, बाज़ार भी चलता है।", 1600, False, C["ink"], "l", spc_after=600),
                       para("बोर्ड में सबसे पक्का उत्तर: मिश्रित।", 1600, True, C["indigo2"], "l"),
                   ]),
                   anchor="t", align="l", lins=20000, tins=20000))
    s.append(shape(23, "right", inch(6.85), inch(1.2), inch(6.05), inch(5.5), C["white"],
                   adj=14000, stroke=C["saffron"], stroke_w=25400))
    s.append(shape(24, "rh", inch(6.85), inch(1.2), inch(6.05), inch(1.1), C["saffron"], adj=0,
                   texts=para("अमेरिका • जापान  =  पूँजीवादी", 1800, True, C["navy"], "ctr")))
    s.append(shape(25, "rb", inch(7.15), inch(2.55), inch(5.45), inch(3.7), C["white"], adj=0,
                   texts=paras([
                       para("निजी क्षेत्र की प्रमुख भूमिका", 1800, True, C["ink"], "l", spc_after=400),
                       para("उत्पादन के साधन बाज़ार के हाथ में।", 1600, False, C["muted"], "l", spc_after=600),
                       para("इसे बाजार-आधारित अर्थव्यवस्था भी कहते हैं।", 1600, False, C["ink"], "l", spc_after=600),
                       para("भारत को पूँजीवादी मत लिखना।", 1600, True, C["rose"], "l"),
                   ]),
                   anchor="t", align="l", lins=20000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def concept_institutions():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "तिथियाँ जो हर बार आती हैं", dark=False))
    rows = [
        (C["saffron"], "15 मार्च 1950", "योजना आयोग का गठन", "पदेन अध्यक्ष — प्रधानमंत्री"),
        (C["indigo2"], "6 अगस्त 1952", "राष्ट्रीय विकास परिषद् (NDC)", "केंद्र–राज्य समन्वय"),
        (C["teal"], "ATM", "Automatic Teller Machine", "Any Time Money गलत है"),
        (C["rose"], "NREGA / मनरेगा", "100 दिनों का रोज़गार", "ग्रामीण अकुशल मजदूरी — कानूनी गारंटी"),
        (C["gold"], "विकास का सूचक", "प्रति व्यक्ति आय", "साक्षरता या कुल आय से अधिक उचित"),
    ]
    for i, (col, a, b, c) in enumerate(rows):
        y = inch(1.15 + i * 1.1)
        s.append(shape(20 + i * 4, "r", inch(0.4), y, inch(12.5), inch(1.0), C["white"],
                       adj=18000, stroke=col, stroke_w=19050))
        s.append(shape(21 + i * 4, "a", inch(0.55), y + inch(0.14), inch(3.5), inch(0.72),
                       col, adj=50000,
                       texts=para(a, 1500, True, C["navy"] if col == C["gold"] else C["white"], "ctr"),
                       lins=30000, tins=12000))
        s.append(shape(22 + i * 4, "b", inch(4.25), y + inch(0.08), inch(4.6), inch(0.84),
                       C["white"], adj=0, texts=para(b, 1700, True, C["ink"], "l"),
                       align="l", lins=20000, tins=20000))
        s.append(shape(23 + i * 4, "c", inch(8.9), y + inch(0.08), inch(3.8), inch(0.84),
                       C["white"], adj=0, texts=para(c, 1400, False, C["muted"], "l"),
                       align="l", lins=20000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def concept_bihar_def():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "दो और पक्के तथ्य", dark=False))
    s.append(shape(20, "c1", inch(0.4), inch(1.2), inch(6.2), inch(5.5), C["white"],
                   adj=14000, stroke=C["saffron"], stroke_w=25400))
    s.append(shape(21, "h1", inch(0.4), inch(1.2), inch(6.2), inch(1.15), C["saffron"], adj=0,
                   texts=para("अर्थव्यवस्था की परिभाषा", 2000, True, C["white"], "ctr")))
    s.append(shape(22, "b1", inch(0.7), inch(2.6), inch(5.6), inch(3.7), C["white"], adj=0,
                   texts=paras([
                       para("“आजीविका अर्जन की एक प्रणाली”", 2000, True, C["indigo"], "l", spc_after=500),
                       para("यह परिभाषा ब्राउन (Brown) की है।", 1700, True, C["saffron"], "l", spc_after=500),
                       para("अंग्रेजों से पहले भारत = सोने की चिड़िया", 1600, False, C["ink"], "l", spc_after=400),
                       para("ब्रिटिश शासन ≈ 200 वर्ष (1757 → 1947)", 1600, False, C["ink"], "l"),
                   ]),
                   anchor="t", align="l", lins=20000, tins=20000))
    s.append(shape(23, "c2", inch(6.85), inch(1.2), inch(6.05), inch(5.5), C["white"],
                   adj=14000, stroke=C["teal"], stroke_w=25400))
    s.append(shape(24, "h2", inch(6.85), inch(1.2), inch(6.05), inch(1.15), C["teal"], adj=0,
                   texts=para("बिहार की अर्थव्यवस्था", 2000, True, C["white"], "ctr")))
    s.append(shape(25, "b2", inch(7.15), inch(2.6), inch(5.45), inch(3.7), C["white"], adj=0,
                   texts=paras([
                       para("मुख्य आधार — कृषि", 2200, True, C["teal"], "l", spc_after=500),
                       para("बड़ी आबादी कृषि और उससे जुड़ी गतिविधियों पर निर्भर है।", 1600, False, C["ink"], "l", spc_after=500),
                       para("बड़े उद्योग मुख्य आधार नहीं हैं।", 1600, True, C["rose"], "l", spc_after=400),
                       para("NREGA = ग्रामीण परिवार को 100 दिन।", 1600, True, C["ink"], "l"),
                   ]),
                   anchor="t", align="l", lins=20000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def mcq_intro():
    s = [bg(2, C["navy"])]
    s.append(blob(3, inch(-1.2), inch(-1.4), inch(4.5), inch(4.5), C["saffron"], 20000))
    s.append(blob(4, inch(10.5), inch(4.6), inch(4.2), inch(4.2), C["gold"], 18000))
    s.append(shape(5, "badge", inch(4.3), inch(1.7), inch(4.7), inch(0.55), C["saffron"], adj=50000,
                   texts=para("MCQ ROUND  •  15 प्रश्न", 1600, True, C["navy"], "ctr")))
    s.append(shape(6, "h", inch(0.8), inch(2.45), inch(11.7), inch(1.4), C["navy"], "rect", adj=0, alpha=0,
                   texts=para("पहले सोचिए, फिर उत्तर देखिए", 3600, True, C["cream"], "ctr"),
                   lins=20000, tins=20000))
    s.append(shape(7, "p", inch(1.5), inch(4.05), inch(10.3), inch(1.3), C["navy"], "rect", adj=0, alpha=0,
                   texts=paras([
                       para("हर प्रश्न के बाद अगली स्लाइड पर सही उत्तर और आसान व्याख्या है।", 1800, False, "FFD9A8", "ctr"),
                       para("Bihar Board Wala  •  Pause करके स्वयं उत्तर दें", 1600, True, C["gold"], "ctr"),
                   ]),
                   lins=20000, tins=20000))
    s.append(brand_footer(40, dark=True))
    return slide_xml("".join(s))


def question_slide(n, item):
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "MCQ  •  प्रश्न %02d / 15" % n, dark=False))
    s.append(shape(10, "qcard", inch(0.4), inch(1.12), inch(12.5), inch(1.85), C["white"],
                   adj=14000, stroke=C["indigo2"], stroke_w=19050,
                   texts=para(item["q"], 2000 if len(item["q"]) > 70 else 2200, True, C["ink"], "l"),
                   anchor="ctr", align="l", lins=120000, tins=60000))
    s.append(shape(11, "pause", inch(0.4), inch(3.08), inch(12.5), inch(0.42), C["peach"], adj=50000,
                   texts=para("⏸  एक पल रुकिए — अपना उत्तर चुनिए, फिर अगली स्लाइड देखिए",
                              1300, True, C["indigo"], "ctr"),
                   lins=40000, tins=8000))
    positions = [
        (0.4, 3.62), (6.75, 3.62),
        (0.4, 5.28), (6.75, 5.28),
    ]
    for i, opt in enumerate(item["opts"]):
        x, y = positions[i]
        col = OPT_COLORS[i]
        s.append(shape(20 + i * 2, "opt", inch(x), inch(y), inch(6.15), inch(1.48), C["white"],
                       adj=16000, stroke=col, stroke_w=22225))
        s.append(shape(21 + i * 2, "let", inch(x + 0.18), inch(y + 0.38), inch(0.72), inch(0.72),
                       col, "ellipse", adj=0,
                       texts=para(LETTERS[i], 1800, True, C["white"], "ctr"),
                       lins=10000, tins=8000))
        s.append(shape(30 + i, "ot", inch(x + 1.05), inch(y + 0.18), inch(4.9), inch(1.12),
                       C["white"], adj=0,
                       texts=para(opt, 1500 if len(opt) > 36 else 1700, True, C["ink"], "l"),
                       anchor="ctr", align="l", lins=20000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def answer_slide(n, item):
    s = [bg(2, "F3FFF7")]
    s.append(header_bar(3, "उत्तर  •  प्रश्न %02d / 15" % n, dark=False))
    letter = LETTERS[item["ans"]]
    opt = item["opts"][item["ans"]]
    s.append(shape(10, "ok", inch(0.4), inch(1.15), inch(12.5), inch(2.15), C["white"],
                   adj=14000, stroke=C["green"], stroke_w=25400))
    s.append(shape(11, "tag", inch(0.65), inch(1.38), inch(2.5), inch(0.5), C["green"], adj=50000,
                   texts=para("सही उत्तर", 1400, True, C["white"], "ctr"), lins=20000, tins=8000))
    s.append(shape(12, "big", inch(0.65), inch(1.95), inch(12.0), inch(1.1), C["white"], adj=0,
                   texts=para("(%s)   %s" % (letter, opt), 2400 if len(opt) < 40 else 2000, True, C["green"], "l"),
                   align="l", lins=20000, tins=20000))
    s.append(shape(13, "whyh", inch(0.4), inch(3.5), inch(12.5), inch(0.5), C["gold"], adj=50000,
                   texts=para("आसान व्याख्या  —  परीक्षा में ऐसे लिखिए", 1500, True, C["navy"], "l"),
                   align="l", lins=80000, tins=8000))
    s.append(shape(14, "why", inch(0.4), inch(4.15), inch(12.5), inch(2.7), C["white"],
                   adj=14000, stroke=C["gold"], stroke_w=19050,
                   texts=para(item["why"], 1800, False, C["ink"], "l"),
                   anchor="ctr", align="l", lins=140000, tins=80000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def key_slide():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "त्वरित उत्तर कुंजी  •  15/15", dark=False))
    # two columns of 8 and 7
    for i, item in enumerate(QUESTIONS):
        col = i // 8
        row = i % 8
        x = inch(0.35 + col * 6.5)
        y = inch(1.08 + row * 0.72)
        letter = LETTERS[item["ans"]]
        short = item["opts"][item["ans"]]
        if len(short) > 28:
            short = short[:26] + "…"
        stripe = OPT_COLORS[item["ans"]]
        s.append(shape(20 + i * 3, "k", x, y, inch(6.3), inch(0.64), C["white"], adj=50000,
                       stroke=stripe, stroke_w=12700))
        s.append(shape(21 + i * 3, "n", x + inch(0.1), y + inch(0.08), inch(0.9), inch(0.48),
                       stripe, adj=50000,
                       texts=para("Q%02d" % (i + 1), 1200, True, C["white"], "ctr"),
                       lins=10000, tins=6000))
        s.append(shape(22 + i * 3, "a", x + inch(1.1), y + inch(0.06), inch(5.05), inch(0.52),
                       C["white"], adj=0,
                       texts=para("(%s)  %s" % (letter, short), 1300, True, C["ink"], "l"),
                       align="l", lins=20000, tins=8000))
    s.append(brand_footer(90, dark=False))
    return slide_xml("".join(s))


def tips_slide():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "परीक्षा टिप  —  इन्हें रट लीजिए", dark=False))
    tips = [
        ("सोने की चिड़िया", "अंग्रेजों से पहले का भारत"),
        ("≈ 200 वर्ष", "ब्रिटिश शासन / उपनिवेश"),
        ("ब्राउन", "अर्थव्यवस्था = आजीविका अर्जन की प्रणाली"),
        ("तीन क्षेत्र", "प्राथमिक • द्वितीयक=औद्योगिक • तृतीयक=सेवा"),
        ("भारत = मिश्रित", "अमेरिका–जापान = पूँजीवादी"),
        ("15 मार्च 1950", "योजना आयोग  |  अध्यक्ष = प्रधानमंत्री"),
        ("6 अगस्त 1952", "NDC  |  ATM = Automatic Teller Machine"),
        ("बिहार = कृषि", "NREGA = 100 दिन  |  विकास सूचक = प्रति व्यक्ति आय"),
    ]
    for i, (a, b) in enumerate(tips):
        col_i = i % 2
        row = i // 2
        x = inch(0.4 + col_i * 6.45)
        y = inch(1.15 + row * 1.35)
        col = [C["saffron"], C["indigo2"], C["teal"], C["rose"]][row]
        s.append(shape(20 + i * 3, "t", x, y, inch(6.25), inch(1.22), C["white"],
                       adj=16000, stroke=col, stroke_w=19050))
        s.append(shape(21 + i * 3, "a", x + inch(0.2), y + inch(0.12), inch(5.85), inch(0.48),
                       C["white"], adj=0, texts=para(a, 1700, True, col, "l"),
                       align="l", lins=20000, tins=8000))
        s.append(shape(22 + i * 3, "b", x + inch(0.2), y + inch(0.6), inch(5.85), inch(0.48),
                       C["white"], adj=0, texts=para(b, 1400, False, C["ink"], "l"),
                       align="l", lins=20000, tins=8000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def thanks_slide():
    s = [bg(2, C["navy"])]
    s.append(blob(3, inch(-1.5), inch(4.8), inch(5), inch(5), C["saffron"], 20000))
    s.append(blob(4, inch(10.2), inch(-1.5), inch(4.6), inch(4.6), C["gold"], 18000))
    s.append(blob(5, inch(10.8), inch(5.0), inch(3.5), inch(3.5), C["rose"], 16000))
    s.append(shape(6, "badge", inch(4.15), inch(1.15), inch(5.0), inch(0.5), C["gold"], adj=50000,
                   texts=para("EPISODE 01  COMPLETE", 1400, True, C["navy"], "ctr")))
    s.append(shape(7, "h", inch(0.6), inch(1.85), inch(12.1), inch(1.5), C["navy"], "rect", adj=0, alpha=0,
                   texts=para("धन्यवाद  •  अभ्यास जारी रखिए", 3600, True, C["cream"], "ctr")))
    s.append(shape(8, "sub", inch(1.2), inch(3.4), inch(10.9), inch(0.7), C["navy"], "rect", adj=0, alpha=0,
                   texts=para("Like  •  Share  •  Subscribe  •  Bell आइकन दबाएँ", 2000, True, C["gold"], "ctr")))
    s.append(shape(9, "box", inch(2.4), inch(4.3), inch(8.5), inch(1.55), C["saffron"], adj=18000,
                   texts=paras([
                       para("Bihar Board Wala", 2800, True, C["navy"], "ctr"),
                       para("संस्थान  •  YouTube चैनल  •  बिहार बोर्ड टेस्ट सीरीज़", 1400, True, C["indigo"], "ctr"),
                   ]),
                   lins=40000, tins=30000))
    s.append(brand_footer(40, dark=True))
    return slide_xml("".join(s))


def next_tease():
    s = [bg(2, C["cream"])]
    s.append(header_bar(3, "अगला एपिसोड जल्द", dark=False))
    s.append(shape(10, "card", inch(1.3), inch(1.5), inch(10.7), inch(5.1), C["white"],
                   adj=12000, stroke=C["saffron"], stroke_w=31750))
    s.append(shape(11, "h", inch(1.3), inch(1.5), inch(10.7), inch(1.2), C["saffron"], adj=0,
                   texts=para("एपिसोड 02 में मिलेंगे", 2400, True, C["white"], "ctr")))
    s.append(shape(12, "b", inch(1.8), inch(3.0), inch(9.7), inch(3.1), C["white"], adj=0,
                   texts=paras([
                       para("और महत्वपूर्ण MCQ  •  और भी तेज़ रिविज़न", 2000, True, C["ink"], "ctr", spc_after=400),
                       para("Bihar Board Wala के साथ हर अध्याय कवर होगा।", 1800, False, C["muted"], "ctr", spc_after=600),
                       para("चैनल को Subscribe करना न भूलें।", 2000, True, C["indigo2"], "ctr"),
                   ]),
                   lins=40000, tins=20000))
    s.append(brand_footer(80, dark=False))
    return slide_xml("".join(s))


def build_slides():
    slides = [
        title_slide(),
        welcome_slide(),
        agenda_slide(),
        concept_sectors(),
        concept_types(),
        concept_institutions(),
        concept_bihar_def(),
        mcq_intro(),
    ]
    for i, q in enumerate(QUESTIONS, 1):
        slides.append(question_slide(i, q))
        slides.append(answer_slide(i, q))
    slides.append(key_slide())
    slides.append(tips_slide())
    slides.append(thanks_slide())
    slides.append(next_tease())
    return slides


# ---------- package XML ----------
THEME = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Bihar Board Wala">
<a:themeElements>
<a:clrScheme name="BBW Warm">
<a:dk1><a:srgbClr val="1F1635"/></a:dk1>
<a:lt1><a:srgbClr val="FFF6E8"/></a:lt1>
<a:dk2><a:srgbClr val="2D1B69"/></a:dk2>
<a:lt2><a:srgbClr val="FFE8CC"/></a:lt2>
<a:accent1><a:srgbClr val="FF7A18"/></a:accent1>
<a:accent2><a:srgbClr val="4C2FB8"/></a:accent2>
<a:accent3><a:srgbClr val="0D9B8A"/></a:accent3>
<a:accent4><a:srgbClr val="FFC53D"/></a:accent4>
<a:accent5><a:srgbClr val="E11D74"/></a:accent5>
<a:accent6><a:srgbClr val="FF5A5F"/></a:accent6>
<a:hlink><a:srgbClr val="4C2FB8"/></a:hlink>
<a:folHlink><a:srgbClr val="2D1B69"/></a:folHlink>
</a:clrScheme>
<a:fontScheme name="BBW">
<a:majorFont>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/>
</a:majorFont>
<a:minorFont>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/>
</a:minorFont>
</a:fontScheme>
<a:fmtScheme name="Office">
<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
<a:gs pos="35000"><a:schemeClr val="phClr"><a:tint val="37000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
<a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="15000"/><a:satMod val="350000"/></a:schemeClr></a:gs></a:gsLst>
<a:lin ang="16200000" scaled="1"/></a:gradFill>
<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="100000"/><a:shade val="100000"/><a:satMod val="130000"/></a:schemeClr></a:gs>
<a:gs pos="100000"><a:schemeClr val="phClr"><a:tint val="50000"/><a:shade val="100000"/><a:satMod val="350000"/></a:schemeClr></a:gs></a:gsLst>
<a:lin ang="16200000" scaled="0"/></a:gradFill></a:fillStyleLst>
<a:lnStyleLst>
<a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
<a:ln w="25400" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
<a:ln w="38100" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>
</a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle>
<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="40000"/><a:satMod val="350000"/></a:schemeClr></a:gs>
<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="20000"/><a:satMod val="255000"/></a:schemeClr></a:gs></a:gsLst>
<a:path path="circle"><a:fillToRect l="50000" t="-80000" r="50000" b="180000"/></a:path></a:gradFill>
<a:gradFill rotWithShape="1"><a:gsLst><a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="80000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
<a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="30000"/><a:satMod val="200000"/></a:schemeClr></a:gs></a:gsLst>
<a:path path="circle"><a:fillToRect l="50000" t="50000" r="50000" b="50000"/></a:path></a:gradFill></a:bgFillStyleLst>
</a:fmtScheme>
</a:themeElements>
<a:objectDefaults/><a:extraClrSchemeLst/>
</a:theme>
"""

TXSTYLE_LVL = """
<a:defRPr sz="%s" kern="1200">
<a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/>
</a:defRPr>"""

MASTER = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld name="Office Theme"><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFF6E8"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
<p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp>
<p:nvSpPr><p:cNvPr id="2" name="Title Placeholder 1"/>
<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
<p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="11278800" cy="1143000"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="hi-IN"/></a:p></p:txBody>
</p:sp>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2"
 accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
<p:txStyles>
<p:titleStyle><a:lvl1pPr algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="4400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr>
</a:lvl1pPr></p:titleStyle>
<p:bodyStyle>
<a:lvl1pPr marL="0" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl1pPr>
<a:lvl2pPr marL="457200" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1600" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl2pPr>
<a:lvl3pPr marL="914400" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl3pPr>
<a:lvl4pPr marL="1371600" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl4pPr>
<a:lvl5pPr marL="1828800" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl5pPr>
<a:lvl6pPr marL="2286000" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl6pPr>
<a:lvl7pPr marL="2743200" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl7pPr>
<a:lvl8pPr marL="3200400" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl8pPr>
<a:lvl9pPr marL="3657600" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl9pPr>
</p:bodyStyle>
<p:otherStyle>
<a:lvl1pPr marL="0" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1800" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl1pPr>
<a:lvl2pPr marL="457200" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1600" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl2pPr>
<a:lvl3pPr marL="914400" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl3pPr>
<a:lvl4pPr marL="1371600" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl4pPr>
<a:lvl5pPr marL="1828800" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl5pPr>
<a:lvl6pPr marL="2286000" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl6pPr>
<a:lvl7pPr marL="2743200" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl7pPr>
<a:lvl8pPr marL="3200400" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl8pPr>
<a:lvl9pPr marL="3657600" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1">
<a:defRPr sz="1400" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill>
<a:latin typeface="Nirmala UI"/><a:ea typeface="Nirmala UI"/><a:cs typeface="Nirmala UI"/></a:defRPr></a:lvl9pPr>
</p:otherStyle>
</p:txStyles>
</p:sldMaster>
"""

LAYOUT = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
<p:cSld name="Blank"><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
<p:sp>
<p:nvSpPr><p:cNvPr id="2" name="Title 1"/>
<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
<p:nvPr><p:ph type="title" hasCustomPrompt="1"/></p:nvPr></p:nvSpPr>
<p:spPr><a:xfrm><a:off x="457200" y="274638"/><a:ext cx="11278800" cy="0"/></a:xfrm>
<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
<p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="hi-IN"/></a:p></p:txBody>
</p:sp>
</p:spTree></p:cSld>
<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>
"""

PRES_RELS_HEAD = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
"""

SLIDE_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>
"""

ROOT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>
"""

MASTER_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"""

LAYOUT_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"""


def presentation_xml(n):
    ids = []
    for i in range(n):
        ids.append('<p:sldId id="%d" r:id="rId%d"/>' % (256 + i, 2 + i))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
        'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        '<p:sldIdLst>%s</p:sldIdLst>'
        '<p:sldSz cx="%d" cy="%d" type="screen16x9"/>'
        '<p:notesSz cx="6858000" cy="9144000"/>'
        "</p:presentation>"
    ) % ("".join(ids), SW, SH)


def content_types(n):
    overs = []
    for i in range(1, n + 1):
        overs.append(
            '<Override PartName="/ppt/slides/slide%d.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>' % i
        )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'
        '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>'
        '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'
        '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'
        '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>'
        '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>'
        "%s</Types>"
    ) % "".join(overs)


def core_xml():
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:title>एपिसोड 01 — अर्थव्यवस्था एवं इसके विकास का इतिहास</dc:title>"
        "<dc:subject>Bihar Board Class 10 Economics MCQ</dc:subject>"
        "<dc:creator>Bihar Board Wala</dc:creator>"
        "<cp:lastModifiedBy>Bihar Board Wala</cp:lastModifiedBy>"
        "<cp:category>YouTube First Episode</cp:category>"
        "</cp:coreProperties>"
    )


def app_xml(n):
    titles = []
    names = ["Title", "Welcome", "Agenda", "Three Sectors", "Economy Types",
             "Dates", "Bihar + Definition", "MCQ Intro"]
    for i in range(1, 16):
        names.append("Q%02d" % i)
        names.append("A%02d" % i)
    names.extend(["Answer Key", "Exam Tips", "Thanks", "Next Episode"])
    for name in names[:n]:
        titles.append("<vt:lpstr>%s</vt:lpstr>" % escape(name))
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        "<Application>Bihar Board Wala</Application>"
        "<Slides>%d</Slides>"
        "<PresentationFormat>On-screen Show (16:9)</PresentationFormat>"
        "<Company>Bihar Board Wala</Company>"
        "<HeadingPairs><vt:vector size=\"2\" baseType=\"variant\">"
        "<vt:variant><vt:lpstr>Slide Titles</vt:lpstr></vt:variant>"
        "<vt:variant><vt:i4>%d</vt:i4></vt:variant></vt:vector></HeadingPairs>"
        "<TitlesOfParts><vt:vector size=\"%d\" baseType=\"lpstr\">%s</vt:vector></TitlesOfParts>"
        "</Properties>"
    ) % (n, n, n, "".join(titles))


def main():
    slides = build_slides()
    n = len(slides)
    pres_rels = [PRES_RELS_HEAD]
    for i in range(n):
        pres_rels.append(
            '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide%d.xml"/>'
            % (2 + i, i + 1)
        )
    pres_rels.append(
        '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>'
        % (2 + n)
    )
    pres_rels.append("</Relationships>")

    if os.path.exists(OUT):
        os.remove(OUT)
    z = zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED)

    def add(name, data, stored=False):
        zi = zipfile.ZipInfo(name)
        zi.create_system = 0
        zi.compress_type = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
        if not isinstance(data, bytes):
            data = data.encode("utf-8")
        z.writestr(zi, data)

    add("[Content_Types].xml", content_types(n), stored=True)
    add("_rels/.rels", ROOT_RELS)
    add("docProps/core.xml", core_xml())
    add("docProps/app.xml", app_xml(n))
    add("ppt/presentation.xml", presentation_xml(n))
    add("ppt/_rels/presentation.xml.rels", "".join(pres_rels))
    add("ppt/theme/theme1.xml", THEME)
    add("ppt/slideMasters/slideMaster1.xml", MASTER)
    add("ppt/slideMasters/_rels/slideMaster1.xml.rels", MASTER_RELS)
    add("ppt/slideLayouts/slideLayout1.xml", LAYOUT)
    add("ppt/slideLayouts/_rels/slideLayout1.xml.rels", LAYOUT_RELS)
    for i, xml in enumerate(slides, 1):
        add("ppt/slides/slide%d.xml" % i, xml)
        add("ppt/slides/_rels/slide%d.xml.rels" % i, SLIDE_RELS)
    z.close()
    print("Wrote %s (%d slides, %d bytes)" % (OUT, n, os.path.getsize(OUT)))


if __name__ == "__main__":
    main()
