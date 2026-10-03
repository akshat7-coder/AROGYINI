import { formatIstDate } from "../../utils/dates.js";
import { compact, indent, numbered } from "./format.js";

export const type = "posh";

export function build(data, now = new Date()) {
  const {
    complainantName,
    designation,
    department,
    employeeId,
    employerName,
    respondentName,
    respondentDesignation,
    incidentDate,
    incidentPlace,
    incidentDescription,
    witnesses = [],
    reliefSought = [],
    contactPhone,
    contactEmail,
  } = data;

  const reliefs =
    reliefSought.length > 0
      ? reliefSought
      : [
          "An inquiry into this complaint and action against the Respondent in accordance with Section 13 of the Act and the applicable service rules.",
          "Interim relief under Section 12 of the Act, including that the Respondent be restrained from reporting on my work or contacting me while the inquiry is pending.",
        ];

  const lines = [
    `Date: ${formatIstDate(now)}`,
    "",
    "To,",
    "The Presiding Officer",
    "Internal Committee (constituted under Section 4 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013)",
    employerName,
    "",
    "Subject: Written complaint of sexual harassment at the workplace under Section 9 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
    "",
    "Madam / Sir,",
    "",
    `1. I, ${complainantName}${designation ? `, ${designation}` : ""}${department ? `, ${department}` : ""}${
      employeeId ? ` (Employee ID: ${employeeId})` : ""
    }, am employed at ${employerName}. I am submitting this written complaint within the period prescribed under Section 9 of the Act.`,
    "",
    `2. This complaint is against ${respondentName}${
      respondentDesignation ? `, ${respondentDesignation}` : ""
    } (hereinafter "the Respondent").`,
    "",
    `3. On ${formatIstDate(incidentDate)}${incidentPlace ? `, at ${incidentPlace}` : ""}, the following occurred:`,
    "",
    indent(incidentDescription),
    "",
    "4. The conduct described above was unwelcome and amounts to sexual harassment within the meaning of Section 2(n) read with Section 3 of the Act.",
    "",
  ];

  let clause = 5;
  if (witnesses.length > 0) {
    lines.push(`${clause}. The following persons witnessed or have knowledge of the incident(s):`, "", ...numbered(witnesses), "");
    clause += 1;
  }

  lines.push(
    `${clause}. I request the Internal Committee to inquire into this complaint under Section 11 of the Act and to grant the following relief:`,
    "",
    ...numbered(reliefs),
    "",
    `${clause + 1}. I request that the confidentiality required by Section 16 of the Act be maintained in respect of my identity, the contents of this complaint, and the proceedings of the inquiry.`,
    "",
    `${clause + 2}. I further request that the inquiry be completed within the 90 days prescribed by Section 11(4) of the Act, and that I be informed of the Committee's findings.`,
    "",
    "The statements made above are true to the best of my knowledge and belief.",
    "",
    "Yours sincerely,",
    "",
    "",
    "_______________________",
    complainantName,
    designation || null,
    contactPhone ? `Phone: ${contactPhone}` : null,
    contactEmail ? `Email: ${contactEmail}` : null,
    "",
    "Enclosures:",
    "   1. Copies of the supporting documents, messages, or records relied upon.",
    "   2. List of witnesses, if any."
  );

  return {
    title: `POSH Act complaint to the Internal Committee, ${employerName}`,
    text: compact(lines),
  };
}
