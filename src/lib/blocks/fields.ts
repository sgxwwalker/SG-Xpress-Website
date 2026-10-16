import { z } from "zod";

// One description of each editable field drives three things: the admin form,
// the validation when staff save, and the starting value for a new section.

export const ICON_NAMES = ["plane", "ship", "globe", "barrel", "cart", "pin", "phone", "chat", "check", "arrow", "alert", "info", "box", "doc", "clock", "users", "user", "help", "tag", "mail"] as const;
export type IconName = (typeof ICON_NAMES)[number];

export const LINK_TYPES = ["none", "page", "register", "login", "whatsapp-general", "whatsapp-china", "whatsapp-quotes", "phone", "email", "web"] as const;
export type LinkType = (typeof LINK_TYPES)[number];

export const BUTTON_STYLES = ["gold", "navy", "outline", "outline-light", "whatsapp"] as const;
export const BUTTON_ICONS = ["none", "arrow", "chat"] as const;

export type LinkValue = { type: LinkType; value: string; message: string };
export type ButtonValue = { label: string; link: LinkValue; style: (typeof BUTTON_STYLES)[number]; icon: (typeof BUTTON_ICONS)[number] };
export type ImageValue = { src: string; alt: string; width: number; height: number };

type Base = { key: string; label: string; hint?: string };
export type FieldSpec =
  | (Base & { kind: "text"; max?: number; multiline?: boolean; placeholder?: string })
  | (Base & { kind: "markdown"; max?: number; rows?: number })
  | (Base & { kind: "number"; min?: number; max?: number })
  | (Base & { kind: "toggle" })
  | (Base & { kind: "select"; options: readonly { value: string; label: string }[] })
  | (Base & { kind: "icon" })
  | (Base & { kind: "image" })
  | (Base & { kind: "link" })
  | (Base & { kind: "buttons"; max?: number })
  | (Base & { kind: "list"; itemLabel: string; fields: FieldSpec[]; max?: number });

// ---- Validation ----

const SAFE_PAGE = /^(\/(?!\/)[^\s]*|#[A-Za-z0-9_-]+)$/; // "/rates#air" or "#steps", never "//evil.com"

export const linkSchema = z
  .object({
    type: z.enum(LINK_TYPES),
    value: z.string().trim().max(600),
    message: z.string().trim().max(300),
  })
  .superRefine((l, ctx) => {
    const bad = (message: string) => ctx.addIssue({ code: "custom", message, path: ["value"] });
    if (l.type === "page" && !SAFE_PAGE.test(l.value)) bad("Page links start with / (e.g. /rates) or # (a section on the same page).");
    if (l.type === "web" && !(/^https?:\/\//i.test(l.value) && URL.canParse(l.value))) bad("Web addresses must start with https://");
    if (l.type === "phone" && l.value.replace(/\D/g, "").length < 7) bad("Enter a phone number.");
    if (l.type === "email" && l.value && !z.string().email().safeParse(l.value).success) bad("Enter a valid email address, or leave it blank for the main email.");
  });

export const buttonSchema = z.object({
  label: z.string().trim().min(1, "Every button needs a label.").max(80),
  link: linkSchema,
  style: z.enum(BUTTON_STYLES),
  icon: z.enum(BUTTON_ICONS),
});

// Built-in pictures live in /images, uploaded ones in /media. Nothing else can be used.
export const imageSchema = z.object({
  src: z.union([z.literal(""), z.string().regex(/^\/(images|media)\/[A-Za-z0-9._-]+$/, "Choose a picture from the media library.")]),
  alt: z.string().trim().max(300),
  width: z.number().int().min(0).max(10000),
  height: z.number().int().min(0).max(10000),
});

export function fieldSchema(f: FieldSpec): z.ZodType {
  switch (f.kind) {
    case "text":
      return z.string().max(f.max ?? (f.multiline ? 1500 : 300), `${f.label}: too long.`);
    case "markdown":
      return z.string().max(f.max ?? 80000, `${f.label}: too long.`);
    case "number":
      return z.number().min(f.min ?? 0).max(f.max ?? 1000);
    case "toggle":
      return z.boolean();
    case "select":
      return z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    case "icon":
      return z.enum(ICON_NAMES);
    case "image":
      return imageSchema;
    case "link":
      return linkSchema;
    case "buttons":
      return z.array(buttonSchema).max(f.max ?? 4);
    case "list":
      return z.array(propsSchema(f.fields)).max(f.max ?? 60);
  }
}

export function propsSchema(fields: FieldSpec[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])));
}

// ---- Starting values ----

export const NO_LINK: LinkValue = { type: "none", value: "", message: "" };
export const NO_IMAGE: ImageValue = { src: "", alt: "", width: 0, height: 0 };

export function emptyValue(f: FieldSpec): unknown {
  switch (f.kind) {
    case "text":
    case "markdown":
      return "";
    case "number":
      return f.min ?? 0;
    case "toggle":
      return false;
    case "select":
      return f.options[0].value;
    case "icon":
      return "box";
    case "image":
      return { ...NO_IMAGE };
    case "link":
      return { ...NO_LINK };
    case "buttons":
    case "list":
      return [];
  }
}

export function emptyProps(fields: FieldSpec[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.key, emptyValue(f)]));
}

/** Fills in any field missing from saved props (e.g. a field added in a later update). */
export function withDefaults(fields: FieldSpec[], props: Record<string, unknown> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = props?.[f.key];
    if (v === undefined) out[f.key] = emptyValue(f);
    else if (f.kind === "list" && Array.isArray(v)) out[f.key] = v.map((item) => withDefaults(f.fields, item as Record<string, unknown>));
    else out[f.key] = v;
  }
  return out;
}

// ---- Small helpers for writing default page content ----

export const page = (value: string): LinkValue => ({ type: "page", value, message: "" });
export const wa = (type: "whatsapp-general" | "whatsapp-china" | "whatsapp-quotes", message = ""): LinkValue => ({ type, value: "", message });
export const REGISTER: LinkValue = { type: "register", value: "", message: "" };
export const LOGIN: LinkValue = { type: "login", value: "", message: "" };

export function btn(label: string, link: LinkValue, style: ButtonValue["style"] = "navy", icon: ButtonValue["icon"] = "none"): ButtonValue {
  return { label, link, style, icon };
}

export function img(src: string, alt: string, width: number, height: number): ImageValue {
  return { src, alt, width, height };
}
