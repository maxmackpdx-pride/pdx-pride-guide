import QRCode from "qrcode";

export function qrMatrix(text: string): boolean[][] {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  return Array.from({ length: modules.size }, (_, y) =>
    Array.from({ length: modules.size }, (_, x) => Boolean(modules.get(y, x))),
  );
}
