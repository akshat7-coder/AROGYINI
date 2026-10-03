// Field specs mirroring the zod schemas behind POST /api/legal/drafts, so the form is
// generated rather than hand-written four times. `list` fields are split on new lines.
const listHint = "One per line.";

export const DRAFT_TYPES = [
  {
    type: "posh",
    label: "Sexual harassment at work",
    short: "POSH Act",
    act: "POSH Act, 2013",
    blurb:
      "A written complaint to the Internal Committee at your workplace, citing Section 9 and asking for an inquiry and interim relief.",
    fields: [
      { name: "complainantName", label: "Your full name", required: true, placeholder: "Asha Rao" },
      { name: "designation", label: "Your designation", placeholder: "Senior Analyst" },
      { name: "department", label: "Your department", placeholder: "Finance" },
      { name: "employeeId", label: "Employee ID", placeholder: "E-1024" },
      {
        name: "employerName",
        label: "Employer name",
        required: true,
        placeholder: "Meridian Consulting Pvt Ltd",
      },
      { name: "respondentName", label: "Person complained against", required: true, placeholder: "Vikram Shah" },
      { name: "respondentDesignation", label: "Their designation", placeholder: "Team Lead" },
      { name: "incidentDate", label: "Date of the incident", type: "date", required: true },
      { name: "incidentPlace", label: "Where it happened", placeholder: "Fourth floor meeting room, Pune office" },
      {
        name: "incidentDescription",
        label: "What happened",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "Describe the incidents in order, with dates where you remember them.",
      },
      { name: "witnesses", label: "Witnesses", type: "list", hint: listHint, placeholder: "Priya Nair, Analyst" },
      {
        name: "reliefSought",
        label: "Relief you are asking for",
        type: "list",
        hint: `${listHint} Leave empty to use the standard requests.`,
      },
      { name: "contactPhone", label: "Your phone", placeholder: "+919876543210" },
      { name: "contactEmail", label: "Your email", type: "email", placeholder: "you@example.com" },
    ],
  },
  {
    type: "zero_fir",
    label: "Police complaint outside the local station",
    short: "Zero FIR",
    act: "BNSS, 2023, Section 173",
    blurb:
      "Any police station must register a Zero FIR for a cognizable offence and transfer it to the station with jurisdiction.",
    fields: [
      { name: "complainantName", label: "Your full name", required: true, placeholder: "Asha Rao" },
      { name: "guardianName", label: "Daughter or wife of", placeholder: "D/o Mohan Rao" },
      { name: "age", label: "Your age", type: "number", placeholder: "29" },
      {
        name: "address",
        label: "Your address",
        type: "textarea",
        required: true,
        rows: 2,
        placeholder: "12 Shivaji Nagar, Pune 411005",
      },
      { name: "phone", label: "Your phone", required: true, placeholder: "+919876543210" },
      {
        name: "policeStation",
        label: "Police station you are filing at",
        required: true,
        placeholder: "Deccan Gymkhana Police Station",
      },
      { name: "district", label: "District", placeholder: "Pune" },
      {
        name: "incidentDateTime",
        label: "When it happened",
        required: true,
        placeholder: "14 September 2026 at about 9:30 pm",
      },
      { name: "incidentPlace", label: "Where it happened", required: true, placeholder: "Near the bus stand, Kothrud" },
      {
        name: "incidentDescription",
        label: "What happened",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "Describe the facts plainly and in order.",
      },
      {
        name: "accusedDetails",
        label: "Anything known about the person or people",
        type: "textarea",
        rows: 3,
        placeholder: "Two men, aged about 25, one in a red jacket, on a black motorcycle.",
      },
      { name: "witnesses", label: "Witnesses", type: "list", hint: listHint },
      {
        name: "propertyLost",
        label: "Property lost or damaged",
        type: "textarea",
        rows: 2,
        placeholder: "One handbag containing a mobile phone and Rs 4,000 in cash.",
      },
    ],
  },
  {
    type: "pwdva",
    label: "Domestic violence",
    short: "PWDVA",
    act: "PWDVA, 2005, Section 12",
    blurb:
      "An application to the Magistrate for protection, residence, monetary relief, custody or compensation orders. The first hearing must be fixed within three days.",
    fields: [
      { name: "aggrievedName", label: "Your full name", required: true, placeholder: "Asha Rao" },
      { name: "age", label: "Your age", type: "number", placeholder: "29" },
      {
        name: "address",
        label: "Your address",
        type: "textarea",
        required: true,
        rows: 2,
        placeholder: "12 Shivaji Nagar, Pune 411005",
      },
      { name: "phone", label: "Your phone", placeholder: "+919876543210" },
      { name: "respondentName", label: "Person complained against", required: true, placeholder: "Rohit Deshmukh" },
      {
        name: "relationship",
        label: "Their relationship to you",
        required: true,
        placeholder: "husband",
        hint: "For example husband, partner, father-in-law, brother.",
      },
      { name: "marriageDate", label: "Date of marriage", type: "date" },
      {
        name: "sharedHousehold",
        label: "Shared household address",
        type: "textarea",
        rows: 2,
        placeholder: "Flat 4B, Sunrise Apartments, Pune",
      },
      {
        name: "incidentDescription",
        label: "What has happened",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "Describe the abuse, including dates and anything that was witnessed.",
      },
      {
        name: "children",
        label: "Children dependent on you",
        type: "list",
        hint: listHint,
        placeholder: "Ira Deshmukh, aged 2 years",
      },
      {
        name: "reliefs",
        label: "Orders you are asking for",
        type: "checkboxes",
        options: [
          { value: "protection", label: "Protection order (Section 18)" },
          { value: "residence", label: "Residence order (Section 19)" },
          { value: "monetary", label: "Monetary relief (Section 20)" },
          { value: "custody", label: "Custody of children (Section 21)" },
          { value: "compensation", label: "Compensation (Section 22)" },
        ],
        defaultValue: ["protection", "residence", "monetary"],
      },
      { name: "district", label: "District of the court", placeholder: "Pune" },
    ],
  },
  {
    type: "dowry",
    label: "Dowry demands",
    short: "Dowry Act",
    act: "Dowry Prohibition Act, 1961",
    blurb:
      "A police complaint under Sections 3 and 4, read with Section 85 of the BNS. Demanding dowry is an offence even if nothing was paid.",
    fields: [
      { name: "complainantName", label: "Your full name", required: true, placeholder: "Asha Rao" },
      { name: "guardianName", label: "Daughter or wife of", placeholder: "D/o Mohan Rao" },
      { name: "age", label: "Your age", type: "number", placeholder: "29" },
      {
        name: "address",
        label: "Your address",
        type: "textarea",
        required: true,
        rows: 2,
        placeholder: "12 Shivaji Nagar, Pune 411005",
      },
      { name: "phone", label: "Your phone", placeholder: "+919876543210" },
      { name: "husbandName", label: "Your husband's name", required: true, placeholder: "Rohit Deshmukh" },
      { name: "marriageDate", label: "Date of marriage", type: "date", required: true },
      {
        name: "inLaws",
        label: "Others involved",
        type: "list",
        hint: listHint,
        placeholder: "Sunita Deshmukh (mother-in-law)",
      },
      {
        name: "demandDescription",
        label: "The demands made",
        type: "textarea",
        required: true,
        rows: 5,
        placeholder: "Describe what was demanded, by whom, and when.",
      },
      { name: "amountDemanded", label: "Cash demanded", placeholder: "Rs 5,00,000" },
      { name: "itemsDemanded", label: "Items demanded", type: "list", hint: listHint, placeholder: "A four wheeler" },
      {
        name: "policeStation",
        label: "Police station you are filing at",
        required: true,
        placeholder: "Deccan Gymkhana Police Station",
      },
      { name: "district", label: "District", placeholder: "Pune" },
      {
        name: "streedhanWithheld",
        label: "Streedhan being withheld",
        type: "textarea",
        rows: 2,
        placeholder: "Gold jewellery given by my parents at the wedding.",
      },
      { name: "witnesses", label: "Witnesses", type: "list", hint: listHint },
    ],
  },
];

export const draftSpec = (type) => DRAFT_TYPES.find((entry) => entry.type === type);

export function initialDraftValues(spec) {
  return Object.fromEntries(
    spec.fields.map((field) => [
      field.name,
      field.defaultValue ?? (field.type === "checkboxes" ? [] : ""),
    ])
  );
}

// Trims, drops empties, and turns `list` textareas into arrays before posting.
export function toDraftPayload(spec, values) {
  const payload = { type: spec.type };

  for (const field of spec.fields) {
    const raw = values[field.name];

    if (field.type === "checkboxes") {
      if (raw?.length) payload[field.name] = raw;
      continue;
    }
    if (field.type === "list") {
      const items = String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (items.length > 0) payload[field.name] = items;
      continue;
    }
    const value = String(raw ?? "").trim();
    if (value) payload[field.name] = field.type === "number" ? Number(value) : value;
  }

  return payload;
}

export function validateDraft(spec, values) {
  return Object.fromEntries(
    spec.fields
      .filter((field) => field.required)
      .map((field) => {
        const raw = values[field.name];
        const empty = field.type === "checkboxes" ? !raw?.length : !String(raw ?? "").trim();
        return [field.name, empty ? `${field.label} is required` : null];
      })
      .filter(([, error]) => error)
  );
}
