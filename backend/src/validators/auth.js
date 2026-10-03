import { z } from "zod";
import { BLOOD_GROUPS } from "../models/User.js";
import { phoneSchema as phone } from "../utils/phone.js";

const email = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email("A valid email address is required")
);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80);
const city = z.string().trim().max(80);
const bloodGroup = z.enum(BLOOD_GROUPS);

export const signupSchema = z.object({
  name,
  email,
  password,
  phone: phone.optional(),
  city: city.optional(),
  bloodGroup: bloodGroup.optional(),
});

export const signinSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const updateMeSchema = z
  .object({
    name: name.optional(),
    phone: phone.optional(),
    city: city.optional(),
    bloodGroup: bloodGroup.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});
