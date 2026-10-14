import type { fieldTypeEnum } from "./forms.js";

export type FieldType = (typeof fieldTypeEnum.enumValues)[number];

export type FieldOption = {
    id: string;
    label: string;
};

export type FieldValidation = {
    min?: number;
    max?: number;
    pattern?: string;
    minSelections?: number; // checkbox only
    maxSelections?: number; // checkbox only
};

export type FieldConfig = {
    placeholder?: string;
    options?: FieldOption[];        // select, radio, checkbox
    validation?: FieldValidation;
    allowOther?: boolean;           // select, radio, checkbox
    randomizeOrder?: boolean;       // select, radio, checkbox
    conditionalLogic?: {
        fieldId: string;
        operator: "equals" | "not_equals";
        value: string;
    }[];
};

export type FormTheme = {
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    buttonTextColor?: string;
    fontFamily?: "sans" | "serif" | "mono";
    borderRadius?: "none" | "small" | "medium" | "large" | "full";
    cardStyle?: "flat" | "bordered" | "shadow";
    layout?: "centered" | "full-bleed";
    progressStyle?: "bar" | "steps" | "none";
    logoUrl?: string;
};

export type FormSettings = {
    /** @deprecated superseded by `formTheme` below — kept only so any old
     * value already stored in a `settings` JSON blob doesn't break parsing. */
    theme?: string;
    formTheme?: FormTheme;
    redirectUrl?: string;
    notificationEmails?: string[];
    closeAfterResponses?: number;
    closeAt?: string;
};

export type PublishedFieldSnapshot = {
    id: string;
    type: FieldType;
    label: string;
    order: number;
    required: boolean;
    config: FieldConfig;
};

export type PublishedFormSnapshot = {
    title: string;
    fields: PublishedFieldSnapshot[];
    settings: FormSettings;
};