export function getPublicFormPath(slug: string) {
  return `/f/${slug}`;
}

export function getPublicFormUrl(slug: string) {
  if (typeof window === "undefined") return getPublicFormPath(slug);
  return `${window.location.origin}${getPublicFormPath(slug)}`;
}
