import { formatIstDate } from "../../utils/dates.js";
import { compact, indent, numbered } from "./format.js";

export const type = "pwdva";

const RELIEF_CLAUSES = {
  protection:
    "A protection order under Section 18 restraining the Respondent from committing any act of domestic violence, entering my place of employment or any place frequented by me, attempting to communicate with me, and alienating any assets or operating any joint bank account.",
  residence:
    "A residence order under Section 19 restraining the Respondent from dispossessing me or in any manner disturbing my possession of the shared household, and directing him to remove himself from the shared household.",
  monetary:
    "Monetary relief under Section 20 towards my loss of earnings, medical expenses, loss caused by the destruction or removal of property, and maintenance for me and my children.",
  custody:
    "A custody order under Section 21 granting me temporary custody of my child or children.",
  compensation:
    "Compensation under Section 22 for the injuries, including mental torture and emotional distress, caused to me by the acts of domestic violence.",
};

export function build(data, now = new Date()) {
  const {
    aggrievedName,
    age,
    address,
    phone,
    respondentName,
    relationship,
    marriageDate,
    sharedHousehold,
    incidentDescription,
    children = [],
    reliefs = ["protection", "residence", "monetary"],
    district,
  } = data;

  const lines = [
    `Date: ${formatIstDate(now)}`,
    "",
    "BEFORE THE COURT OF THE JUDICIAL MAGISTRATE OF THE FIRST CLASS",
    district ? `AT ${district.toUpperCase()}` : null,
    "",
    "APPLICATION UNDER SECTION 12 OF THE PROTECTION OF WOMEN FROM DOMESTIC VIOLENCE ACT, 2005",
    "",
    `${aggrievedName}${age ? `, aged ${age} years` : ""}`,
    `Resident of ${address}`,
    "                                                            ... Aggrieved Person / Applicant",
    "",
    "VERSUS",
    "",
    respondentName,
    `(${relationship} of the Applicant)`,
    "                                                            ... Respondent",
    "",
    "MOST RESPECTFULLY SHOWETH:",
    "",
    `1. The Applicant is an aggrieved person within the meaning of Section 2(a) of the Protection of Women from Domestic Violence Act, 2005, and the Respondent is her ${relationship}, with whom she is or has been in a domestic relationship within the meaning of Section 2(f) of the Act.`,
    "",
    marriageDate
      ? `2. The Applicant and the Respondent were married on ${formatIstDate(marriageDate)}.`
      : "2. The Applicant and the Respondent are in a domestic relationship as described above.",
    "",
    sharedHousehold
      ? `3. The shared household is situated at ${sharedHousehold}. The Applicant has a right to reside in the shared household under Section 17 of the Act, irrespective of any right, title, or beneficial interest in it.`
      : "3. The Applicant has a right to reside in the shared household under Section 17 of the Act, irrespective of any right, title, or beneficial interest in it.",
    "",
    "4. The Respondent has subjected the Applicant to domestic violence within the meaning of Section 3 of the Act. The particulars are as follows:",
    "",
    indent(incidentDescription),
    "",
  ];

  let clause = 5;
  if (children.length > 0) {
    lines.push(`${clause}. The following child or children are dependent on the Applicant:`, "", ...numbered(children), "");
    clause += 1;
  }

  const chosen = reliefs.map((key) => RELIEF_CLAUSES[key]).filter(Boolean);

  lines.push(
    `${clause}. The acts complained of are continuing, and the Applicant apprehends further violence. She is therefore constrained to approach this Hon'ble Court.`,
    "",
    "PRAYER",
    "",
    "The Applicant most respectfully prays that this Hon'ble Court may be pleased to grant:",
    "",
    ...numbered([
      ...chosen,
      "Ex parte interim orders in terms of the above under Section 23 of the Act, pending disposal of this application.",
    ]),
    "",
    "   And pass such further or other orders as this Hon'ble Court may deem fit in the facts and circumstances of the case.",
    "",
    "The Applicant further prays that the first date of hearing be fixed within three days of the receipt of this application, as required by Section 12(4) of the Act.",
    "",
    "VERIFICATION",
    "",
    `I, ${aggrievedName}, the Applicant above named, verify that the contents of paragraphs 1 to ${clause} are true to my personal knowledge and that nothing material has been concealed.`,
    "",
    "",
    "_______________________",
    aggrievedName,
    `Address: ${address}`,
    phone ? `Phone: ${phone}` : null,
    "",
    "Enclosures:",
    "   1. Domestic Incident Report, if already recorded by the Protection Officer or service provider.",
    "   2. Medical records, photographs, messages, and any other supporting documents.",
    "   3. Proof of residence and of the domestic relationship.",
  );

  return {
    title: `Domestic violence application under Section 12, PWDVA 2005, against ${respondentName}`,
    text: compact(lines),
  };
}
