/**
 * One-time setup: creates the first administrator account (or
 * promotes an existing account to admin).
 *
 * Usage (from the server folder):
 *   npm run create-admin -- --email you@example.com --password "s3cret!" --name "Ahmad Tahir"
 */

import { auth, db, FieldValue } from "../src/config/firebase.js";
import { ROLES } from "../src/config/roles.js";

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index !== -1 ? process.argv[index + 1] : undefined;
}

const email = (readArg("--email") || "").trim().toLowerCase();
const password = readArg("--password") || "";
const name = (readArg("--name") || "Administrator").trim();

if (!email || password.length < 6) {
  console.error('Usage: npm run create-admin -- --email you@example.com --password "at-least-6-chars" --name "Your Name"');
  process.exit(1);
}

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName: name, disabled: false });
    console.log(`Found existing account for ${email}; promoting it to administrator.`);
  } catch (err) {
    if (err.code !== "auth/user-not-found") throw err;
    user = await auth.createUser({ email, password, displayName: name });
    console.log(`Created account for ${email}.`);
  }

  await auth.setCustomUserClaims(user.uid, { role: ROLES.ADMIN });
  await db.collection("users").doc(user.uid).set(
    {
      name,
      email,
      role: ROLES.ADMIN,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: null,
    },
    { merge: true }
  );

  console.log(`Done. ${name} <${email}> is now an administrator. Sign in to the app with these details.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Could not create the admin account:", err.message);
  process.exit(1);
});
