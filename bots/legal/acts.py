"""Readable Act names for the source files, used as the `act` metadata and in citations."""
import re

ACT_NAMES = {
    "SexualHarassmentofWomenatWorkPlaceAct2013_0": "Sexual Harassment of Women at Workplace (POSH) Act, 2013",
    "TheProtectionofWomenfromDomesticViolenceAct2005_0": "Protection of Women from Domestic Violence Act, 2005",
    "THEDOWRYPROHIBITIONACT1961_0": "Dowry Prohibition Act, 1961",
    "THEIMMORALTRAFFICPREVENTIONACT1956_2": "Immoral Traffic (Prevention) Act, 1956",
    "TheIndecentRepresentationofWomenProhibitionAct1986_2": "Indecent Representation of Women (Prohibition) Act, 1986",
    "TheCommissionofSatiPreventionAct1987-of1988_0": "Commission of Sati (Prevention) Act, 1987",
    "The_Criminal_Law_Amendment_Act_2013_0": "Criminal Law (Amendment) Act, 2013",
    "202504081538695387 law": "NALSA / NCW Training Module: Women and Law",
    "_OceanofPDF.com_Legally_Yours_-_Manasi_Chaudhari": "Legally Yours - Manasi Chaudhari",
}


def act_name(stem: str) -> str:
    if stem in ACT_NAMES:
        return ACT_NAMES[stem]
    # Fall back to splitting a run-together filename into words.
    words = re.sub(r"[_-]+", " ", stem)
    words = re.sub(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Za-z])(?=\d{4}\b)", " ", words)
    return re.sub(r"\s+", " ", words).strip() or stem
