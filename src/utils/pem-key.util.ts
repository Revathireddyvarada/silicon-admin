/** PEM from env / K8s: quoted, literal \\n, real newlines, or one flattened line. */
export function normalizePemKey(value: string): string {
  let pem = String(value ?? "").trim();
  if (
    (pem.startsWith('"') && pem.endsWith('"')) ||
    (pem.startsWith("'") && pem.endsWith("'"))
  ) {
    pem = pem.slice(1, -1).trim();
  }
  for (let i = 0; i < 3 && pem.includes("\\n"); i++) {
    pem = pem.replace(/\\n/g, "\n");
  }
  pem = pem.replace(/\\r/g, "").replace(/\r/g, "").trim();

  const match = pem.match(
    /-----BEGIN ([A-Z0-9 ]+)-----([\s\S]*?)-----END \1-----/,
  );
  if (!match) {
    return pem;
  }
  const type = match[1];
  const body = match[2].replace(/\s+/g, "");
  if (!body) {
    return pem;
  }
  const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN ${type}-----\n${wrapped}\n-----END ${type}-----`;
}