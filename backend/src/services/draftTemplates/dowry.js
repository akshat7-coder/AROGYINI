import { formatIstDate } from "../../utils/dates.js";
import { compact, indent, numbered } from "./format.js";

export const type = "dowry";

export function build(data, now = new Date()) {
  const {
    complainantName,
    guardianName,
    age,
    address,
    phone,
    husbandName,
    marriageDate,
    inLaws = [],
    demandDescription,
    amountDemanded,
    itemsDemanded = [],
    policeStation,
    district,
    streedhanWithheld,
    witnesses = [],
  } = data;

  const accused = [`${husbandName} (husband)`, ...inLaws];

  const lines = [
    `Date: ${formatIstDate(now)}`,
    "",
    "To,",
    "The Station House Officer",
    policeStation,
    district ? `District ${district}` : null,
    "",
    "Subject: Complaint under Sections 3 and 4 of the Dowry Prohibition Act, 1961 read with Section 85 of the Bharatiya Nyaya Sanhita, 2023",
    "",
    "Sir / Madam,",
    "",
    `1. I, ${complainantName}${guardianName ? `, ${guardianName}` : ""}${age ? `, aged ${age} years` : ""}, resident of ${address}, submit this complaint against the following persons:`,
    "",
    ...numbered(accused),
    "",
    `2. I was married to ${husbandName} on ${formatIstDate(marriageDate)}.`,
    "",
    "3. Since the marriage, the persons named above have demanded dowry from me and from my parents. The particulars of the demands are as follows:",
    "",
    indent(demandDescription),
    "",
  ];

  let clause = 4;
  if (amountDemanded || itemsDemanded.length > 0) {
    lines.push(`${clause}. The demands made include:`, "");
    if (amountDemanded) lines.push(`   - Cash: ${amountDemanded}`);
    itemsDemanded.forEach((item) => lines.push(`   - ${item}`));
    lines.push("");
    clause += 1;
  }

  lines.push(
    `${clause}. A demand for dowry is an offence under Section 4 of the Dowry Prohibition Act, 1961, punishable with imprisonment of not less than six months extending to two years, irrespective of whether anything was in fact paid. The giving or taking of dowry is separately an offence under Section 3 of the said Act. The conduct described above also amounts to cruelty punishable under Section 85 of the Bharatiya Nyaya Sanhita, 2023.`,
    ""
  );
  clause += 1;

  if (streedhanWithheld) {
    lines.push(
      `${clause}. The following streedhan and articles belonging to me are being withheld by the persons named above, and I seek their return under Section 6 of the Dowry Prohibition Act, 1961:`,
      "",
      indent(streedhanWithheld),
      ""
    );
    clause += 1;
  }

  if (witnesses.length > 0) {
    lines.push(`${clause}. The following persons have knowledge of the demands:`, "", ...numbered(witnesses), "");
    clause += 1;
  }

  lines.push(
    `${clause}. I therefore request that:`,
    "",
    ...numbered([
      "A First Information Report be registered against the persons named above under Sections 3 and 4 of the Dowry Prohibition Act, 1961 read with Section 85 of the Bharatiya Nyaya Sanhita, 2023.",
      "If this police station lacks territorial jurisdiction, the complaint be registered as a Zero FIR under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023 and transferred to the station having jurisdiction.",
      "The offences being cognizable, non-bailable, and non-compoundable under Section 8 of the Dowry Prohibition Act, 1961, investigation be commenced without delay.",
      "A free copy of the First Information Report be supplied to me along with its number and date.",
      "My streedhan and articles be recovered and restored to me.",
    ]),
    "",
    "The facts stated above are true to the best of my knowledge and belief.",
    "",
    "Yours faithfully,",
    "",
    "",
    "_______________________",
    complainantName,
    `Address: ${address}`,
    phone ? `Phone: ${phone}` : null,
    "",
    "Enclosures:",
    "   1. Copy of the marriage certificate or wedding invitation and photographs.",
    "   2. Messages, call records, and transfer receipts evidencing the demands.",
    "   3. List of streedhan and articles given at or after the marriage."
  );

  return {
    title: `Dowry Prohibition Act complaint against ${husbandName} and others`,
    text: compact(lines),
  };
}
