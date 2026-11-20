import { createHash, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { qrMatrix } from "@shared/guestQr";
import { parsePacificDateTime } from "@shared/missedConnections";

export type GuestPass = { entryId: number; token: string; title: string; venue: string; dateStart: string };

function env(key: string) {
  return process.env[key]?.trim().replace(/\\n/g, "\n") || "";
}
export function walletAvailability() {
  return {
    apple: ["APPLE_PASS_TYPE_ID", "APPLE_TEAM_ID", "APPLE_PASS_WWDR_PEM", "APPLE_PASS_CERT_PEM", "APPLE_PASS_KEY_PEM"].every(k => !!env(k)),
    google: ["GOOGLE_WALLET_CLASS_ID", "GOOGLE_WALLET_CLIENT_EMAIL", "GOOGLE_WALLET_PRIVATE_KEY"].every(k => !!env(k)),
  };
}
async function publicFile(path: string) {
  try { return await readFile(`dist/public/${path}`); }
  catch { return readFile(`client/public/${path}`); }
}
function when(pass: GuestPass) {
  const time = parsePacificDateTime(pass.dateStart);
  return time == null ? pass.dateStart : new Intl.DateTimeFormat("en-US", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/Los_Angeles",
  }).format(time);
}

export async function guestPassPdf(pass: GuestPass) {
  const [{ PDFDocument, rgb }, { default: fontkit }] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")]);
  const doc = await PDFDocument.create();
  doc.setTitle(`${pass.title} · Zay'list guest pass`);
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(await publicFile("outzide-native/font-0.ttf"), { subset: true });
  const page = doc.addPage([360, 520]);
  page.drawRectangle({ x: 0, y: 0, width: 360, height: 520, color: rgb(.06, .06, .08) });
  page.drawRectangle({ x: 24, y: 481, width: 312, height: 2, color: rgb(.83, 1, 0) });
  const write = (text: string, y: number, size: number) => {
    let actual = size;
    while (actual > 10 && font.widthOfTextAtSize(text, actual) > 312) actual--;
    page.drawText(text.replace(/[\r\n]+/g, " "), { x: 24, y, size: actual, font, maxWidth: 312, lineHeight: actual + 2, color: rgb(1, 1, 1) });
  };
  write("ZAY'LIST   /   GUEST PASS", 493, 13);
  write(pass.title, 453, 24);
  write(pass.venue, 409, 15);
  write(when(pass), 384, 13);
  const matrix = qrMatrix(pass.token);
  const scale = 7;
  const edge = (matrix.length + 8) * scale;
  const left = (360 - edge) / 2;
  page.drawRectangle({ x: left, y: 84, width: edge, height: edge, color: rgb(1, 1, 1) });
  matrix.forEach((row, y) => row.forEach((ink, x) => {
    if (ink) page.drawRectangle({ x: left + (x + 4) * scale, y: 84 + (matrix.length + 3 - y) * scale, width: scale, height: scale, color: rgb(0, 0, 0) });
  }));
  write("Show this code at the door.", 53, 15);
  write(pass.token, 28, 10);
  return Buffer.from(await doc.save());
}

export async function appleGuestPass(pass: GuestPass) {
  const [{ PKPass }, { default: sharp }] = await Promise.all([import("passkit-generator"), import("sharp")]);
  const source = await publicFile("icons/zaylist-192.png");
  const images: Record<string, Buffer> = {};
  for (const ratio of [1, 2, 3]) {
    images[`icon${ratio === 1 ? "" : `@${ratio}x`}.png`] = await sharp(source).resize(29 * ratio).png().toBuffer();
  }
  const pk = new PKPass(images, {
    wwdr: env("APPLE_PASS_WWDR_PEM"), signerCert: env("APPLE_PASS_CERT_PEM"),
    signerKey: env("APPLE_PASS_KEY_PEM"), signerKeyPassphrase: env("APPLE_PASS_KEY_PASSPHRASE") || undefined,
  }, {
    formatVersion: 1, passTypeIdentifier: env("APPLE_PASS_TYPE_ID"), teamIdentifier: env("APPLE_TEAM_ID"),
    serialNumber: String(pass.entryId), organizationName: "Zaylist", description: "Zay'list guest pass", logoText: "ZAY'LIST",
    backgroundColor: "rgb(20,20,24)", foregroundColor: "rgb(255,255,255)", labelColor: "rgb(212,255,0)",
  });
  pk.type = "eventTicket";
  pk.primaryFields.push({ key: "event", label: "EVENT", value: pass.title });
  pk.secondaryFields.push({ key: "venue", label: "VENUE", value: pass.venue }, { key: "when", label: "WHEN", value: when(pass) });
  pk.setBarcodes({ format: "PKBarcodeFormatQR", message: pass.token, messageEncoding: "iso-8859-1", altText: pass.token });
  return pk.getAsBuffer();
}

export function googleGuestPass(pass: GuestPass) {
  const classId = env("GOOGLE_WALLET_CLASS_ID");
  const issuerId = classId.split(".")[0];
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const localized = (value: string) => ({ defaultValue: { language: "en-US", value } });
  const id = `${issuerId}.guest_${pass.entryId}_${createHash("sha256").update(pass.token).digest("hex").slice(0, 16)}`;
  const claims = {
    iss: env("GOOGLE_WALLET_CLIENT_EMAIL"), aud: "google", typ: "savetowallet", iat: Math.floor(Date.now() / 1000),
    origins: ["https://www.zaylist.com"], payload: { genericObjects: [{
      id, classId, state: "ACTIVE", cardTitle: localized("Zay'list guest pass"), header: localized(pass.title),
      subheader: localized([pass.venue, when(pass)].filter(Boolean).join(" · ")), hexBackgroundColor: "#141418",
      barcode: { type: "QR_CODE", value: pass.token, alternateText: pass.token },
    }] },
  };
  const input = `${encode({ alg: "RS256", typ: "JWT" })}.${encode(claims)}`;
  return `https://pay.google.com/gp/v/save/${input}.${sign("RSA-SHA256", Buffer.from(input), env("GOOGLE_WALLET_PRIVATE_KEY")).toString("base64url")}`;
}
