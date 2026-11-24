// nexthouserenting/src/components/utils/imageURL.tsx
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
//).replace(/\/+$/, "");
).replace(/\+$/, "");
function extractRawImageValue(input: unknown): string | undefined {
  if (!input) return undefined;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    // Handle JSON-stringified arrays or objects if stored that way
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return extractRawImageValue(JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(input)) {
    for (const entry of input) {
      const found = extractRawImageValue(entry);
      if (found) return found;
    }
    return undefined;
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;

    // Check direct image fields first
    for (const key of ["url", "secure_url", "path", "image", "src", "filename"]) {
      if (typeof obj[key] === "string" && obj[key].trim()) {
        return (obj[key] as string).trim();
      }
    }

    // Check array fields
    for (const listKey of ["images", "houseImages", "photos"]) {
      if (obj[listKey] !== undefined) {
        const found = extractRawImageValue(obj[listKey]);
        if (found) return found;
      }
    }

    // Check nested entity fields (common in bookings & maintenance requests)
    for (const nestedKey of ["houseId", "house", "propertyId", "property"]) {
      if (obj[nestedKey] !== undefined) {
        const found = extractRawImageValue(obj[nestedKey]);
        if (found) return found;
      }
    }
  }

  return undefined;
}

export function resolveImageUrl(
  source: unknown,
  fallback = "/placeholder-house.png"
): string {
  const raw = extractRawImageValue(source);
  if (!raw) return fallback;

  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }

  const normalized = raw
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^uploads\//i, "");

  return `${API_BASE_URL}/uploads/${normalized}`;
}