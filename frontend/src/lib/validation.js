// Mirrors the backend zod rules so the user sees the problem before a round trip.
// The server remains the authority; these only save a request.
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const validateName = (value) => {
  const name = (value ?? "").trim();
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  if (name.length > 80) return "Name must be 80 characters or fewer";
  return null;
};

export const validateEmail = (value) => {
  const email = (value ?? "").trim();
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Enter a valid email address";
  return null;
};

export const validatePassword = (value) => {
  if (!value) return "Password is required";
  if (value.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(value)) return "Password must contain at least one letter";
  if (!/\d/.test(value)) return "Password must contain at least one number";
  return null;
};

// Optional field: empty is fine. Accepts "98765 43210" and "+919876543210".
export const validatePhone = (value) => {
  const phone = (value ?? "").trim();
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  const normalised = cleaned.startsWith("+")
    ? cleaned
    : cleaned.startsWith("00")
      ? `+${cleaned.slice(2)}`
      : `+91${cleaned.replace(/^0/, "")}`;
  if (!/^\+[1-9]\d{7,14}$/.test(normalised)) {
    return "Enter a valid phone number, e.g. 98765 43210";
  }
  return null;
};

export const validateCity = (value) => {
  if ((value ?? "").trim().length > 80) return "City must be 80 characters or fewer";
  return null;
};

// Runs a map of field -> validator and returns only the fields that failed.
export function runValidators(values, validators) {
  return Object.fromEntries(
    Object.entries(validators)
      .map(([field, validate]) => [field, validate(values[field] ?? "")])
      .filter(([, error]) => error)
  );
}
