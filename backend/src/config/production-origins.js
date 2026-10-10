export function assertSecureProductionOrigins(origins, nodeEnv = process.env.NODE_ENV) {
  if (String(nodeEnv || "").toLowerCase() !== "production") return;

  const insecureOrigins = [...origins].filter((origin) => {
    try {
      return new URL(origin).protocol !== "https:";
    } catch {
      return true;
    }
  });

  if (insecureOrigins.length > 0) {
    throw new Error("Production CORS_ORIGINS must contain only valid HTTPS origins.");
  }
}
