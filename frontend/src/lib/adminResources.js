// Field specs for the three content resources. One form component renders all of them,
// so adding a field is a data change rather than new JSX.
const LEGAL_CATEGORIES = ["workplace", "domestic", "marriage", "cyber", "criminal", "media"];
const JOB_TYPES = ["full-time", "part-time", "remote", "returnship", "internship"];

const LIST_HINT = "One per line.";

export const RESOURCES = {
  legal: {
    key: "legal",
    singular: "legal right",
    plural: "Legal rights",
    fields: [
      {
        name: "slug",
        label: "Slug",
        required: true,
        hint: "Lowercase words joined by hyphens, used in the public URL.",
        placeholder: "posh-act-2013",
        createOnly: true,
      },
      { name: "title", label: "Title", required: true },
      { name: "actName", label: "Act name", required: true },
      { name: "year", label: "Year", type: "number" },
      { name: "category", label: "Category", type: "select", options: LEGAL_CATEGORIES, required: true },
      { name: "summary", label: "Summary", type: "textarea", rows: 4, required: true },
      { name: "keyProtections", label: "Key protections", type: "list", rows: 5, hint: LIST_HINT },
      { name: "howToFile", label: "How to file", type: "list", rows: 5, hint: LIST_HINT },
      { name: "penalties", label: "Penalties", type: "textarea", rows: 3 },
      { name: "helplines", label: "Helplines", type: "list", rows: 3, hint: LIST_HINT },
      {
        name: "faqs",
        label: "FAQs",
        type: "pairs",
        rows: 4,
        hint: "One per line, as: Question :: Answer",
      },
      {
        name: "isPublished",
        label: "Published on the public site",
        type: "checkbox",
        defaultValue: true,
        warnWhenOff: "Unpublishing hides this from users. You can still find and re-publish it here.",
      },
    ],
  },

  jobs: {
    key: "jobs",
    singular: "job",
    plural: "Jobs",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "company", label: "Company", required: true },
      { name: "location", label: "Location" },
      { name: "type", label: "Type", type: "select", options: JOB_TYPES, required: true },
      { name: "category", label: "Category", hint: "Lowercase, hyphenated. Groups the filter chips." },
      { name: "salaryRange", label: "Pay range", placeholder: "Approx Rs 12,00,000 - 18,00,000 per year" },
      { name: "experienceLevel", label: "Experience" },
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
      { name: "requirements", label: "Requirements", type: "list", rows: 4, hint: LIST_HINT },
      { name: "benefits", label: "Benefits", type: "list", rows: 4, hint: LIST_HINT },
      { name: "applyUrl", label: "Apply URL", type: "url", placeholder: "https://example.com/careers/role" },
      { name: "careerBreakFriendly", label: "Open to a career break", type: "checkbox" },
      { name: "isActive", label: "Listed publicly", type: "checkbox", defaultValue: true },
    ],
  },

  scholarships: {
    key: "scholarships",
    singular: "scholarship",
    plural: "Scholarships",
    fields: [
      { name: "title", label: "Title", required: true },
      { name: "provider", label: "Provider", required: true },
      { name: "amount", label: "Amount", placeholder: "Approx Rs 50,000 per year", hint: "Mark amounts as approximate." },
      { name: "eligibility", label: "Eligibility", type: "list", rows: 5, hint: LIST_HINT },
      { name: "deadline", label: "Deadline", type: "date", hint: "Leave empty for a rolling scheme." },
      { name: "link", label: "Official link", type: "url" },
      { name: "domain", label: "Domain", hint: "Lowercase, hyphenated. For example higher-education." },
      { name: "isActive", label: "Listed publicly", type: "checkbox", defaultValue: true },
    ],
  },
};

const isoDay = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

// Turns a saved document into form values, or produces blanks for a new one.
export function toFormValues(resource, doc) {
  return Object.fromEntries(
    resource.fields.map((field) => {
      const raw = doc?.[field.name];

      if (field.type === "checkbox") return [field.name, raw ?? field.defaultValue ?? false];
      if (field.type === "list") return [field.name, (raw ?? []).join("\n")];
      if (field.type === "pairs") {
        return [field.name, (raw ?? []).map((pair) => `${pair.q} :: ${pair.a}`).join("\n")];
      }
      if (field.type === "date") return [field.name, isoDay(raw)];
      return [field.name, raw ?? ""];
    })
  );
}

export function toApiPayload(resource, values, { isCreate }) {
  const payload = {};

  for (const field of resource.fields) {
    if (field.createOnly && !isCreate) continue;
    const raw = values[field.name];

    if (field.type === "checkbox") {
      payload[field.name] = Boolean(raw);
      continue;
    }
    if (field.type === "list") {
      const items = String(raw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (items.length > 0 || !isCreate) payload[field.name] = items;
      continue;
    }
    if (field.type === "pairs") {
      const pairs = String(raw ?? "")
        .split("\n")
        .map((line) => line.split("::"))
        .filter((parts) => parts.length >= 2)
        .map((parts) => ({ q: parts[0].trim(), a: parts.slice(1).join("::").trim() }))
        .filter((pair) => pair.q && pair.a);
      if (pairs.length > 0 || !isCreate) payload[field.name] = pairs;
      continue;
    }
    if (field.type === "date") {
      // An emptied date means "rolling", which the API accepts as null.
      if (raw) payload[field.name] = raw;
      else if (!isCreate) payload[field.name] = null;
      continue;
    }

    const value = String(raw ?? "").trim();
    if (value) payload[field.name] = field.type === "number" ? Number(value) : value;
  }

  return payload;
}

export function validateResource(resource, values) {
  return Object.fromEntries(
    resource.fields
      .filter((field) => field.required)
      .map((field) => [
        field.name,
        String(values[field.name] ?? "").trim() ? null : `${field.label} is required`,
      ])
      .filter(([, error]) => error)
  );
}
