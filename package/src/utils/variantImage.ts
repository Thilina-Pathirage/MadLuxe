type VariantImageLike = {
  url?: string;
  isPrimary?: boolean;
};

type VariantLike = {
  images?: VariantImageLike[] | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export function normalizeVariantImageUrl(url?: string | null): string | null {
  if (!url) return null;

  if (url.startsWith("/")) return `${API_ORIGIN}${url}`;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/images/file/")) {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    }
    return url;
  } catch {
    if (url.startsWith("api/")) return `${API_ORIGIN}/${url}`;
    return url;
  }
}

export function getPrimaryImageUrl(variant?: VariantLike | null): string | null {
  const images = variant?.images ?? [];
  if (!images.length) return null;

  const primary = images.find((image) => image?.isPrimary && image?.url);
  if (primary?.url) return normalizeVariantImageUrl(primary.url);

  const first = images.find((image) => image?.url);
  return normalizeVariantImageUrl(first?.url);
}
