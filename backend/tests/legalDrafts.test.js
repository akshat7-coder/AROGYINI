import request from "supertest";
import app from "../src/app.js";
import { createUser, authHeader } from "./helpers.js";
import { DRAFT_TYPES } from "../src/services/draftTemplates/index.js";

const post = (user, body) => request(app).post("/api/legal/drafts").set(authHeader(user)).send(body);

const poshPayload = {
  type: "posh",
  complainantName: "Asha Rao",
  designation: "Senior Analyst",
  department: "Finance",
  employerName: "Meridian Consulting Pvt Ltd",
  respondentName: "Vikram Shah",
  respondentDesignation: "Team Lead",
  incidentDate: "2026-09-12",
  incidentPlace: "Fourth floor meeting room, Pune office",
  incidentDescription: "He made repeated unwelcome remarks about my appearance and blocked the door when I tried to leave.",
  witnesses: ["Priya Nair, Analyst", "Rahul Menon, Designer"],
  contactPhone: "+919876543210",
};

const zeroFirPayload = {
  type: "zero_fir",
  complainantName: "Asha Rao",
  guardianName: "D/o Mohan Rao",
  age: 29,
  address: "12 Shivaji Nagar, Pune 411005",
  phone: "+919876543210",
  policeStation: "Deccan Gymkhana Police Station",
  district: "Pune",
  incidentDateTime: "14 September 2026 at about 9:30 pm",
  incidentPlace: "Near the bus stand at Kothrud, Mumbai",
  incidentDescription: "Two men followed me from the bus stand and snatched my bag after threatening me.",
  accusedDetails: "Two men, aged about 25, one wearing a red jacket, riding a black motorcycle.",
  propertyLost: "One handbag containing a mobile phone and Rs 4,000 in cash.",
};

const pwdvaPayload = {
  type: "pwdva",
  aggrievedName: "Asha Rao",
  age: 29,
  address: "12 Shivaji Nagar, Pune 411005",
  respondentName: "Rohit Deshmukh",
  relationship: "husband",
  marriageDate: "2022-02-14",
  sharedHousehold: "Flat 4B, Sunrise Apartments, Pune",
  incidentDescription: "He has assaulted me on several occasions and has withheld money for household expenses.",
  children: ["Ira Deshmukh, aged 2 years"],
  reliefs: ["protection", "residence", "monetary", "custody"],
  district: "Pune",
};

const dowryPayload = {
  type: "dowry",
  complainantName: "Asha Rao",
  age: 29,
  address: "12 Shivaji Nagar, Pune 411005",
  husbandName: "Rohit Deshmukh",
  marriageDate: "2022-02-14",
  inLaws: ["Sunita Deshmukh (mother-in-law)", "Anil Deshmukh (father-in-law)"],
  demandDescription: "They demanded a car and cash after the wedding and have harassed me since I refused.",
  amountDemanded: "Rs 5,00,000",
  itemsDemanded: ["A four wheeler", "Gold ornaments"],
  policeStation: "Deccan Gymkhana Police Station",
  district: "Pune",
  streedhanWithheld: "Gold jewellery given by my parents at the wedding.",
};

describe("POST /api/legal/drafts access", () => {
  it("requires authentication", async () => {
    expect((await request(app).post("/api/legal/drafts").send(poshPayload)).status).toBe(401);
  });

  it("rejects an unknown draft type", async () => {
    const user = await createUser();
    const res = await post(user, { ...poshPayload, type: "divorce" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("supports exactly the four documented types", () => {
    expect(DRAFT_TYPES.sort()).toEqual(["dowry", "posh", "pwdva", "zero_fir"]);
  });
});

describe("POSH draft", () => {
  it("includes the names, date, place and the governing sections", async () => {
    const user = await createUser();
    const res = await post(user, poshPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe("posh");
    expect(res.body.data.title).toContain("Meridian Consulting Pvt Ltd");

    const { text } = res.body.data;
    expect(text).toContain("Asha Rao");
    expect(text).toContain("Senior Analyst");
    expect(text).toContain("Meridian Consulting Pvt Ltd");
    expect(text).toContain("Vikram Shah");
    expect(text).toContain("Team Lead");
    expect(text).toContain("12 September 2026");
    expect(text).toContain("Fourth floor meeting room, Pune office");
    expect(text).toContain("blocked the door");
    expect(text).toContain("Priya Nair, Analyst");
    expect(text).toContain("The Presiding Officer");
    expect(text).toContain("Section 9");
    expect(text).toContain("Section 11(4)");
    expect(text).toContain("Section 16");
    expect(text).toContain("+919876543210");
  });

  it("stamps today's date in IST and carries the disclaimer", async () => {
    const user = await createUser();
    const { body } = await post(user, poshPayload);

    const todayIst = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    expect(body.data.text).toContain(`Date: ${todayIst}`);
    expect(body.data.text).toContain("not legal advice");
    expect(body.data.text).toContain("15100");
  });

  it("falls back to default reliefs when none are given", async () => {
    const user = await createUser();
    const { body } = await post(user, poshPayload);

    expect(body.data.text).toContain("Interim relief under Section 12");
  });

  it("uses the reliefs supplied instead", async () => {
    const user = await createUser();
    const { body } = await post(user, { ...poshPayload, reliefSought: ["Transfer of the Respondent to another unit."] });

    expect(body.data.text).toContain("Transfer of the Respondent to another unit.");
  });

  it("omits the witness clause when there are no witnesses", async () => {
    const user = await createUser();
    const { witnesses, ...withoutWitnesses } = poshPayload;
    const { body } = await post(user, withoutWitnesses);

    expect(body.data.text).not.toContain("witnessed or have knowledge");
  });

  it("rejects a payload missing the employer and the incident description", async () => {
    const user = await createUser();
    const { employerName, incidentDescription, ...incomplete } = poshPayload;

    const res = await post(user, incomplete);

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toContain("employerName");
    expect(fields).toContain("incidentDescription");
  });
});

describe("Zero FIR draft", () => {
  it("includes the station, the facts and the Zero FIR authority", async () => {
    const user = await createUser();
    const res = await post(user, zeroFirPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toContain("Deccan Gymkhana Police Station");

    const { text } = res.body.data;
    expect(text).toContain("Asha Rao");
    expect(text).toContain("D/o Mohan Rao");
    expect(text).toContain("aged 29 years");
    expect(text).toContain("12 Shivaji Nagar, Pune 411005");
    expect(text).toContain("The Station House Officer");
    expect(text).toContain("District Pune");
    expect(text).toContain("14 September 2026 at about 9:30 pm");
    expect(text).toContain("Near the bus stand at Kothrud, Mumbai");
    expect(text).toContain("snatched my bag");
    expect(text).toContain("red jacket");
    expect(text).toContain("Rs 4,000 in cash");
    expect(text).toContain("Zero FIR");
    expect(text).toContain("Section 173");
    expect(text).toContain("Lalita Kumari");
    expect(text).toContain("Section 199");
    expect(text).toContain("FIR No.");
  });

  it("rejects a payload missing the police station and the address", async () => {
    const user = await createUser();
    const { policeStation, address, ...incomplete } = zeroFirPayload;

    const res = await post(user, incomplete);

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["policeStation", "address"]));
  });
});

describe("PWDVA draft", () => {
  it("reads as a Section 12 application with the chosen reliefs", async () => {
    const user = await createUser();
    const res = await post(user, pwdvaPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toContain("Rohit Deshmukh");

    const { text } = res.body.data;
    expect(text).toContain("JUDICIAL MAGISTRATE OF THE FIRST CLASS");
    expect(text).toContain("AT PUNE");
    expect(text).toContain("SECTION 12 OF THE PROTECTION OF WOMEN FROM DOMESTIC VIOLENCE ACT, 2005");
    expect(text).toContain("Asha Rao");
    expect(text).toContain("Rohit Deshmukh");
    expect(text).toContain("husband");
    expect(text).toContain("14 February 2022");
    expect(text).toContain("Flat 4B, Sunrise Apartments, Pune");
    expect(text).toContain("withheld money");
    expect(text).toContain("Ira Deshmukh, aged 2 years");
    expect(text).toContain("Section 17");
    expect(text).toContain("Section 18");
    expect(text).toContain("Section 19");
    expect(text).toContain("Section 20");
    expect(text).toContain("Section 21");
    expect(text).toContain("Section 23");
    expect(text).toContain("Section 12(4)");
    expect(text).toContain("VERIFICATION");
  });

  it("includes only the reliefs asked for", async () => {
    const user = await createUser();
    const { body } = await post(user, { ...pwdvaPayload, reliefs: ["monetary"] });

    expect(body.data.text).toContain("Monetary relief under Section 20");
    expect(body.data.text).not.toContain("A residence order under Section 19");
  });

  it("rejects an unknown relief and a missing respondent", async () => {
    const user = await createUser();

    const badRelief = await post(user, { ...pwdvaPayload, reliefs: ["eviction"] });
    expect(badRelief.status).toBe(400);

    const { respondentName, ...incomplete } = pwdvaPayload;
    const missing = await post(user, incomplete);
    expect(missing.status).toBe(400);
    expect(missing.body.error.details.map((d) => d.field)).toContain("respondentName");
  });
});

describe("Dowry draft", () => {
  it("names the husband, the in-laws, the marriage date and the demands", async () => {
    const user = await createUser();
    const res = await post(user, dowryPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toContain("Rohit Deshmukh");

    const { text } = res.body.data;
    expect(text).toContain("Asha Rao");
    expect(text).toContain("Rohit Deshmukh (husband)");
    expect(text).toContain("Sunita Deshmukh (mother-in-law)");
    expect(text).toContain("Anil Deshmukh (father-in-law)");
    expect(text).toContain("14 February 2022");
    expect(text).toContain("demanded a car and cash");
    expect(text).toContain("Rs 5,00,000");
    expect(text).toContain("A four wheeler");
    expect(text).toContain("Section 3");
    expect(text).toContain("Section 4 of the Dowry Prohibition Act, 1961");
    expect(text).toContain("Section 85 of the Bharatiya Nyaya Sanhita");
    expect(text).toContain("six months extending to two years");
    expect(text).toContain("streedhan");
    expect(text).toContain("Section 8");
  });

  it("rejects a payload missing the marriage date and the husband", async () => {
    const user = await createUser();
    const { marriageDate, husbandName, ...incomplete } = dowryPayload;

    const res = await post(user, incomplete);

    expect(res.status).toBe(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["marriageDate", "husbandName"]));
  });

  it("rejects an empty description", async () => {
    const user = await createUser();
    const res = await post(user, { ...dowryPayload, demandDescription: "   " });

    expect(res.status).toBe(400);
  });
});
