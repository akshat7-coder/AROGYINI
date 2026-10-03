import { z } from "zod";
import { LEGAL_CATEGORIES } from "../models/LegalRight.js";

const text = (max) => z.string().trim().min(1).max(max);
const list = (max, itemMax = 400) => z.array(text(itemMax)).max(max);
const dateish = text(60);

export const rightsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  category: z.enum(LEGAL_CATEGORIES).optional(),
  search: z.string().trim().max(120).optional(),
});

export const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Invalid slug")
    .max(120),
});

const poshDraftSchema = z.object({
  type: z.literal("posh"),
  complainantName: text(120),
  designation: text(120).optional(),
  department: text(120).optional(),
  employeeId: text(40).optional(),
  employerName: text(200),
  respondentName: text(120),
  respondentDesignation: text(120).optional(),
  incidentDate: dateish,
  incidentPlace: text(200).optional(),
  incidentDescription: text(5000),
  witnesses: list(10, 200).optional(),
  reliefSought: list(10).optional(),
  contactPhone: text(20).optional(),
  contactEmail: z.email().optional(),
});

const zeroFirDraftSchema = z.object({
  type: z.literal("zero_fir"),
  complainantName: text(120),
  guardianName: text(120).optional(),
  age: z.coerce.number().int().min(1).max(120).optional(),
  address: text(400),
  phone: text(20),
  policeStation: text(200),
  district: text(120).optional(),
  incidentDateTime: dateish,
  incidentPlace: text(300),
  incidentDescription: text(5000),
  accusedDetails: text(1000).optional(),
  witnesses: list(10, 200).optional(),
  propertyLost: text(1000).optional(),
});

const pwdvaDraftSchema = z.object({
  type: z.literal("pwdva"),
  aggrievedName: text(120),
  age: z.coerce.number().int().min(1).max(120).optional(),
  address: text(400),
  phone: text(20).optional(),
  respondentName: text(120),
  relationship: text(60),
  marriageDate: dateish.optional(),
  sharedHousehold: text(400).optional(),
  incidentDescription: text(5000),
  children: list(10, 200).optional(),
  reliefs: z.array(z.enum(["protection", "residence", "monetary", "custody", "compensation"])).min(1).max(5).optional(),
  district: text(120).optional(),
});

const dowryDraftSchema = z.object({
  type: z.literal("dowry"),
  complainantName: text(120),
  guardianName: text(120).optional(),
  age: z.coerce.number().int().min(1).max(120).optional(),
  address: text(400),
  phone: text(20).optional(),
  husbandName: text(120),
  marriageDate: dateish,
  inLaws: list(10, 200).optional(),
  demandDescription: text(5000),
  amountDemanded: text(100).optional(),
  itemsDemanded: list(20, 200).optional(),
  policeStation: text(200),
  district: text(120).optional(),
  streedhanWithheld: text(2000).optional(),
  witnesses: list(10, 200).optional(),
});

export const draftSchema = z.discriminatedUnion("type", [
  poshDraftSchema,
  zeroFirDraftSchema,
  pwdvaDraftSchema,
  dowryDraftSchema,
]);

const faqs = z.array(z.object({ q: text(400), a: text(2000) })).max(20);

export const createLegalRightSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens")
    .max(120),
  title: text(200),
  actName: text(200),
  year: z.coerce.number().int().min(1800).max(2200).optional(),
  category: z.enum(LEGAL_CATEGORIES),
  summary: text(2000),
  keyProtections: list(40, 1000).optional(),
  howToFile: list(40, 1000).optional(),
  penalties: text(2000).optional(),
  helplines: list(20, 200).optional(),
  faqs: faqs.optional(),
  isPublished: z.boolean().optional(),
});

export const updateLegalRightSchema = createLegalRightSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { error: "Provide at least one field to update" });
