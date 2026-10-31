import assert from "node:assert/strict";
import test from "node:test";
import { getAllowedGoogleClientIds, usernameBaseFromEmail } from "../lib/googleAuth.ts";

test("getAllowedGoogleClientIds mengumpulkan dan men-deduplikasi client ID dari environment", () => {
  const prevEnv = { ...process.env };
  try {
    process.env.GOOGLE_CLIENT_ID = "client-web-1.apps.googleusercontent.com";
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "client-web-1.apps.googleusercontent.com";
    process.env.GOOGLE_ANDROID_CLIENT_ID = "client-android.apps.googleusercontent.com";
    process.env.GOOGLE_IOS_CLIENT_ID = "client-ios.apps.googleusercontent.com";
    process.env.GOOGLE_CLIENT_IDS = "client-extra-1, client-extra-2, client-web-1.apps.googleusercontent.com";

    const allowed = getAllowedGoogleClientIds();
    assert.deepEqual(allowed, [
      "client-web-1.apps.googleusercontent.com",
      "client-extra-1",
      "client-extra-2",
      "client-android.apps.googleusercontent.com",
      "client-ios.apps.googleusercontent.com",
    ]);
  } finally {
    process.env = prevEnv;
  }
});

test("getAllowedGoogleClientIds mengabaikan placeholder dan nilai kosong", () => {
  const prevEnv = { ...process.env };
  try {
    process.env.GOOGLE_CLIENT_ID = "replace-with-google-client-id";
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "";
    process.env.GOOGLE_ANDROID_CLIENT_ID = "   ";
    process.env.GOOGLE_IOS_CLIENT_ID = undefined;
    process.env.GOOGLE_CLIENT_IDS = "  ";

    const allowed = getAllowedGoogleClientIds();
    assert.deepEqual(allowed, []);
  } finally {
    process.env = prevEnv;
  }
});

test("usernameBaseFromEmail menghasilkan username aman dan valid", () => {
  assert.equal(usernameBaseFromEmail("budi.santoso+simonika@gmail.com"), "budi_santoso_simonika");
  assert.equal(usernameBaseFromEmail("ab@example.com"), "google_ab");
  assert.equal(usernameBaseFromEmail("user_with_very_long_email_address_1234567890@domain.com"), "user_with_very_long_emai");
});
