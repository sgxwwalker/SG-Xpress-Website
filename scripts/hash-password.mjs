// Prints the ADMIN_PASSWORD_HASH_B64 line for .env.
// Usage: npm run hash-password -- "your-strong-password"
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: npm run hash-password -- "a password of at least 10 characters"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Base64 so the "$" characters in a bcrypt hash survive .env variable expansion.
console.log(`ADMIN_PASSWORD_HASH_B64=${Buffer.from(hash).toString("base64")}`);
