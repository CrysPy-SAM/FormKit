export type GenerateSlug = {
    userId: string;
    name: string | null | undefined;
}

export function generateSlug({ userId, name }: GenerateSlug): string {
    const base = (name ?? "user")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")   // strip anything that isn't a letter, number, space, or hyphen
        .replace(/\s+/g, "-")           // spaces → hyphens
        .replace(/-+/g, "-")            // collapse multiple hyphens
        .replace(/^-|-$/g, "");         // trim leading/trailing hyphens

    const fallback = base || "user";    // if name strips down to nothing (e.g. name was just emojis)
    const suffix = userId.replace(/-/g, "").slice(0, 12);

    return `${fallback}-${suffix}`;
}

export function generateFormSlug(title: string, formId: string): string {
    const base = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const fallback = base || "form";
    const suffix = formId.replace(/-/g, "").slice(0, 8);

    return `${fallback}-${suffix}`;
}