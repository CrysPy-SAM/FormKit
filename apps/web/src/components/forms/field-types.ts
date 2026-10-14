import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  Circle,
  FileUp,
  Hash,
  Mail,
  Phone,
  Star,
  Text,
  ToggleLeft,
  Type,
  Link as LinkIcon,
} from "lucide-react";

export type FieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "date"
  | "url"
  | "phone_number"
  | "select"
  | "radio"
  | "checkbox"
  | "rating"
  | "file_upload"
  | "statement"
  | "yes_no";

export type FieldTypeMeta = {
  type: FieldType;
  label: string;
  icon: LucideIcon;
  group: "Text" | "Choice" | "Other";
  hasOptions: boolean;
  hasPlaceholder: boolean;
};

export const FIELD_TYPES: FieldTypeMeta[] = [
  { type: "short_text", label: "Short text", icon: Type, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "long_text", label: "Long text", icon: AlignLeft, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "email", label: "Email", icon: Mail, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "phone_number", label: "Phone number", icon: Phone, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "url", label: "Website URL", icon: LinkIcon, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "number", label: "Number", icon: Hash, group: "Text", hasOptions: false, hasPlaceholder: true },
  { type: "date", label: "Date", icon: Calendar, group: "Text", hasOptions: false, hasPlaceholder: false },
  { type: "select", label: "Dropdown", icon: ChevronDownSquare, group: "Choice", hasOptions: true, hasPlaceholder: false },
  { type: "radio", label: "Multiple choice", icon: Circle, group: "Choice", hasOptions: true, hasPlaceholder: false },
  { type: "checkbox", label: "Checkboxes", icon: CheckSquare, group: "Choice", hasOptions: true, hasPlaceholder: false },
  { type: "yes_no", label: "Yes / No", icon: ToggleLeft, group: "Choice", hasOptions: false, hasPlaceholder: false },
  { type: "rating", label: "Rating", icon: Star, group: "Other", hasOptions: false, hasPlaceholder: false },
  { type: "file_upload", label: "File upload", icon: FileUp, group: "Other", hasOptions: false, hasPlaceholder: false },
  { type: "statement", label: "Statement", icon: Text, group: "Other", hasOptions: false, hasPlaceholder: false },
];

export const FIELD_TYPE_MAP: Record<FieldType, FieldTypeMeta> = Object.fromEntries(
  FIELD_TYPES.map((f) => [f.type, f]),
) as Record<FieldType, FieldTypeMeta>;
