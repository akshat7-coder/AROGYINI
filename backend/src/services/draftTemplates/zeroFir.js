import { formatIstDate } from "../../utils/dates.js";
import { compact, indent, numbered } from "./format.js";

export const type = "zero_fir";

export function build(data, now = new Date()) {
  const {
    complainantName,
    guardianName,
    age,
    address,
    phone,
    policeStation,
    district,
    incidentDateTime,
    incidentPlace,
    incidentDescription,
    accusedDetails,
    witnesses = [],
    propertyLost,
  } = data;

  const lines = [
    `Date: ${formatIstDate(now)}`,
    "",
    "To,",
    "The Station House Officer",
    policeStation,
    district ? `District ${district}` : null,
    "",
    "Subject: Complaint for registration of a Zero FIR under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023",
    "",
    "Sir / Madam,",
    "",
    `1. I, ${complainantName}${guardianName ? `, ${guardianName}` : ""}${age ? `, aged ${age} years` : ""}, resident of ${address}, am lodging this complaint in respect of a cognizable offence.`,
    "",
    `2. The offence took place on ${incidentDateTime} at ${incidentPlace}, which I am informed falls outside the territorial jurisdiction of this police station. I am therefore requesting registration of a Zero FIR, which this station is bound to register and thereafter transfer to the police station having jurisdiction.`,
    "",
    "3. The facts are as follows:",
    "",
    indent(incidentDescription),
    "",
  ];

  let clause = 4;
  if (accusedDetails) {
    lines.push(`${clause}. Particulars of the person(s) complained against, so far as known to me:`, "", indent(accusedDetails), "");
    clause += 1;
  }
  if (witnesses.length > 0) {
    lines.push(`${clause}. The following persons witnessed the incident or can speak to it:`, "", ...numbered(witnesses), "");
    clause += 1;
  }
  if (propertyLost) {
    lines.push(`${clause}. Property lost or damaged:`, "", indent(propertyLost), "");
    clause += 1;
  }

  lines.push(
    `${clause}. I request that:`,
    "",
    ...numbered([
      "This information be registered as a Zero FIR under Section 173 of the Bharatiya Nagarik Suraksha Sanhita, 2023, notwithstanding the question of territorial jurisdiction.",
      "The First Information Report be read over to me and a free copy supplied to me, together with its number and the date of registration.",
      "The FIR be transferred forthwith to the police station having jurisdiction, and the transfer be intimated to me.",
      "Investigation be commenced without delay, since the registration of an FIR on information disclosing a cognizable offence is mandatory as held in Lalita Kumari v. Government of Uttar Pradesh, (2014) 2 SCC 1.",
    ]),
    "",
    `${clause + 1}. I am aware that a failure to record information in respect of the offences specified therein is itself punishable under Section 199 of the Bharatiya Nyaya Sanhita, 2023.`,
    "",
    "The facts stated above are true to the best of my knowledge and belief.",
    "",
    "Yours faithfully,",
    "",
    "",
    "_______________________",
    complainantName,
    `Address: ${address}`,
    `Phone: ${phone}`,
    "",
    "Acknowledgement (to be completed by the police station):",
    "   FIR No. ____________    Date ____________    Time ____________",
    "   Name and designation of the officer recording the information: ____________________",
    "   Signature and seal: ____________________",
  );

  return {
    title: `Zero FIR complaint to ${policeStation}`,
    text: compact(lines),
  };
}
