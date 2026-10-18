export function getAllowedGoogleClientIds(): string[] {
  const rawValues = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_IDS,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
  ];

  const clientIds = rawValues
    .flatMap((value) => (value ? value.split(',') : []))
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && !id.startsWith('replace-with'));

  return Array.from(new Set(clientIds));
}

export function usernameBaseFromEmail(email: string): string {
  const localPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const base = localPart.replace(/^_+|_+$/g, '').slice(0, 24);
  return base.length >= 3 ? base : `google_${base}`;
}
