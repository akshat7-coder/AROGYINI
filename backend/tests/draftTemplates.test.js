import { buildDraft, DRAFT_TYPES } from "../src/services/draftTemplates/index.js";
import { romanise, indent, numbered, compact } from "../src/services/draftTemplates/format.js";

// Minimal payloads: every optional field omitted, which exercises the other side of each
// conditional in the templates.
const MINIMAL = {
  posh: {
    complainantName: "Asha Rao",
    employerName: "Example Ltd",
    respondentName: "R Sharma",
    incidentDate: "2026-09-01",
    incidentDescription: "Unwelcome remarks were made to me.",
  },
  zero_fir: {
    complainantName: "Asha Rao",
    address: "Pune",
    phone: "+919876543210",
    policeStation: "Example Police Station",
    incidentDateTime: "1 September 2026",
    incidentPlace: "Near the market",
    incidentDescription: "My bag was snatched.",
  },
  pwdva: {
    aggrievedName: "Asha Rao",
    address: "Pune",
    respondentName: "R Deshmukh",
    relationship: "husband",
    incidentDescription: "He has assaulted me.",
  },
  dowry: {
    complainantName: "Asha Rao",
    address: "Pune",
    husbandName: "R Deshmukh",
    marriageDate: "2022-02-14",
    demandDescription: "They demanded cash after the wedding.",
    policeStation: "Example Police Station",
  },
};

describe("format helpers", () => {
  it("numbers in lowercase roman and falls back past ten", () => {
    expect(romanise(1)).toBe("i");
    expect(romanise(10)).toBe("x");
    expect(romanise(11)).toBe("11");
  });

  it("indents every line and trims each one", () => {
    expect(indent("one\n  two")).toBe("   one\n   two");
    expect(indent("x", "- ")).toBe("- x");
  });

  it("numbers a list and drops nullish lines when compacting", () => {
    expect(numbered(["a", "b"])).toEqual(["   i. a", "   ii. b"]);
    expect(compact(["a", null, "b", undefined])).toBe("a\nb");
  });
});

describe.each(DRAFT_TYPES)("%s draft with only the required fields", (type) => {
  const draft = buildDraft(type, MINIMAL[type]);

  it("still produces a title and a body", () => {
    expect(draft.type).toBe(type);
    expect(draft.title.length).toBeGreaterThan(10);
    expect(draft.text.length).toBeGreaterThan(300);
  });

  it("never renders an undefined or null placeholder", () => {
    expect(draft.text).not.toMatch(/undefined|null/);
  });

  it("carries the date and the disclaimer", () => {
    expect(draft.text).toContain("Date: ");
    expect(draft.text).toContain("not legal advice");
    expect(draft.text).toContain("15100");
  });

  it("omits the optional sections that were not supplied", () => {
    expect(draft.text).not.toContain("witnessed or have knowledge");
    expect(draft.text).not.toContain("Property lost or damaged");
  });
});

describe("POSH optional branches", () => {
  it("includes designation, department, employee id and contacts when given", () => {
    const { text } = buildDraft("posh", {
      ...MINIMAL.posh,
      designation: "Analyst",
      department: "Finance",
      employeeId: "E-99",
      respondentDesignation: "Manager",
      incidentPlace: "Third floor",
      witnesses: ["P Nair"],
      reliefSought: ["Transfer the respondent."],
      contactPhone: "+919876543210",
      contactEmail: "asha@example.com",
    });

    expect(text).toContain("Analyst");
    expect(text).toContain("Finance");
    expect(text).toContain("E-99");
    expect(text).toContain("Manager");
    expect(text).toContain("Third floor");
    expect(text).toContain("P Nair");
    expect(text).toContain("Transfer the respondent.");
    expect(text).toContain("asha@example.com");
  });

  it("renumbers the clauses when the witness section is absent", () => {
    const withWitness = buildDraft("posh", { ...MINIMAL.posh, witnesses: ["P Nair"] }).text;
    const without = buildDraft("posh", MINIMAL.posh).text;

    expect(withWitness).toContain("5. The following persons witnessed");
    expect(withWitness).toContain("6. I request the Internal Committee");
    expect(without).toContain("5. I request the Internal Committee");
  });
});

describe("Zero FIR optional branches", () => {
  it("includes the district, accused, witnesses and property when given", () => {
    const { text } = buildDraft("zero_fir", {
      ...MINIMAL.zero_fir,
      guardianName: "D/o M Rao",
      age: 29,
      district: "Pune",
      accusedDetails: "Two men on a motorcycle.",
      witnesses: ["A bystander"],
      propertyLost: "One handbag.",
    });

    expect(text).toContain("D/o M Rao");
    expect(text).toContain("aged 29 years");
    expect(text).toContain("District Pune");
    expect(text).toContain("Two men on a motorcycle.");
    expect(text).toContain("A bystander");
    expect(text).toContain("One handbag.");
  });
});

describe("PWDVA optional branches", () => {
  it("defaults to protection, residence and monetary relief", () => {
    const { text } = buildDraft("pwdva", MINIMAL.pwdva);

    expect(text).toContain("Section 18");
    expect(text).toContain("Section 19");
    expect(text).toContain("Section 20");
    expect(text).not.toContain("custody of my child");
  });

  it("includes marriage date, household, children, district and all five reliefs", () => {
    const { text } = buildDraft("pwdva", {
      ...MINIMAL.pwdva,
      age: 29,
      phone: "+919876543210",
      marriageDate: "2022-02-14",
      sharedHousehold: "Flat 4B",
      children: ["Ira, aged 2"],
      district: "Pune",
      reliefs: ["protection", "residence", "monetary", "custody", "compensation"],
    });

    expect(text).toContain("AT PUNE");
    expect(text).toContain("14 February 2022");
    expect(text).toContain("Flat 4B");
    expect(text).toContain("Ira, aged 2");
    expect(text).toContain("Section 21");
    expect(text).toContain("Section 22");
    // interim-orders clause continues the roman numbering after the five reliefs
    expect(text).toContain("vi. Ex parte interim orders");
  });

  it("falls back to the generic relationship line with no marriage date", () => {
    const { text } = buildDraft("pwdva", { ...MINIMAL.pwdva, relationship: "brother" });

    expect(text).toContain("are in a domestic relationship as described above");
    expect(text).not.toContain("were married on");
  });
});

describe("Dowry optional branches", () => {
  it("includes in-laws, amounts, items, streedhan and witnesses when given", () => {
    const { text } = buildDraft("dowry", {
      ...MINIMAL.dowry,
      guardianName: "D/o M Rao",
      age: 29,
      phone: "+919876543210",
      district: "Pune",
      inLaws: ["S Deshmukh (mother-in-law)"],
      amountDemanded: "Rs 5,00,000",
      itemsDemanded: ["A car"],
      streedhanWithheld: "Gold jewellery.",
      witnesses: ["A neighbour"],
    });

    expect(text).toContain("S Deshmukh (mother-in-law)");
    expect(text).toContain("Rs 5,00,000");
    expect(text).toContain("A car");
    expect(text).toContain("Gold jewellery.");
    expect(text).toContain("A neighbour");
  });

  it("lists only the husband when no in-laws are named", () => {
    const { text } = buildDraft("dowry", MINIMAL.dowry);
    const accusedBlock = text.split("following persons:")[1].split("2. I was married")[0];

    expect(accusedBlock).toContain("i. R Deshmukh (husband)");
    expect(accusedBlock).not.toContain("ii. ");
  });

  it("omits the demands block when neither an amount nor items are given", () => {
    const { text } = buildDraft("dowry", MINIMAL.dowry);

    expect(text).not.toContain("The demands made include");
  });
});
