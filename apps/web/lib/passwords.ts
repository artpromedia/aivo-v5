import bcrypt from "bcryptjs";

const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKMNPQRSTUVWXYZ";
const NUM = "23456789";
const SYMBOL = "@$!%*?&";

function secureRandomIndex(max: number) {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function randomFrom(charset: string, size = 1) {
  return Array.from({ length: size })
    .map(() => charset[secureRandomIndex(charset.length)])
    .join("");
}

function randomSuffix(length = 4) {
  const alphabet = LOWER + NUM;
  return Array.from({ length })
    .map(() => alphabet[secureRandomIndex(alphabet.length)])
    .join("");
}

export function buildBaseUsername(firstName: string, lastName: string) {
  const safe = `${firstName}.${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "");
  return safe.length >= 3 ? safe : `learner.${randomSuffix(3)}`;
}

export async function resolveUniqueUsername(base: string, checker: (username: string) => Promise<boolean>) {
  let attempt = 0;
  let candidate = base;

  while (attempt < 10) {
    const exists = await checker(candidate);
    if (!exists) return candidate;
    attempt += 1;
    candidate = `${base}${attempt}${randomSuffix(2)}`;
  }

  return `${base}-${Date.now()}`;
}

export function generateStrongPassword(length = 14) {
  const required = [randomFrom(LOWER), randomFrom(UPPER), randomFrom(NUM), randomFrom(SYMBOL)];
  const remainingLength = Math.max(length - required.length, 4);
  const all = LOWER + UPPER + NUM + SYMBOL;
  const remaining = Array.from({ length: remainingLength }).map(() => randomFrom(all));
  const combined = [...required, ...remaining]
    .sort(() => Math.random() - 0.5)
    .join("");
  return combined;
}

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
