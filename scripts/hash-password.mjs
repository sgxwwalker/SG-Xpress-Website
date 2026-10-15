// Prints the ADMIN_PASSWORD_HASH_B64 line for .env (or Vercel's environment variables).
// Usage: npm run hash-password          (asks for the password without showing it)
//        npm run hash-password -- "your-strong-password"
//        npm run set-local-password     (same, then saves it into this computer's .env)
import bcrypt from "bcryptjs";
import fs from "node:fs";
import readline from "node:readline";

const updateEnv = process.argv.includes("--update-env");
const args = process.argv.slice(2).filter((a) => a !== "--update-env");

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide what's typed (the password never appears on screen or in shell history).
    rl._writeToOutput = (s) => { if (s.includes(question)) process.stdout.write(s); };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

let password = args[0];
if (!password) {
  password = await ask("New admin password (at least 10 characters): ");
  const again = await ask("Type it again: ");
  if (password !== again) {
    console.error("The two passwords don't match. Nothing was changed.");
    process.exit(1);
  }
}
if (password.length < 10) {
  console.error("Passwords need at least 10 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
// Base64 so the "$" characters in a bcrypt hash survive .env variable expansion.
const line = `ADMIN_PASSWORD_HASH_B64=${Buffer.from(hash).toString("base64")}`;

if (updateEnv) {
  const env = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8") : "";
  const next = /^ADMIN_PASSWORD_HASH_B64=.*$/m.test(env) ? env.replace(/^ADMIN_PASSWORD_HASH_B64=.*$/m, line) : `${env.trimEnd()}\n${line}\n`;
  fs.writeFileSync(".env", next);
  console.log("Saved. The local admin (http://localhost:3100/admin) now uses this password.");
} else {
  console.log(line);
}
