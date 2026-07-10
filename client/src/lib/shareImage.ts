export type ShareImageResult = "shared" | "downloaded" | "copied";

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/** Share a rendered canvas as a PNG: native share sheet → clipboard copy → plain download. */
export async function shareOrDownloadPng(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string,
): Promise<ShareImageResult> {
  const blob = await canvasToBlob(canvas);
  if (blob) {
    const file = new File([blob], filename, { type: "image/png" });
    if (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] }) &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ files: [file], title });
        return "shared";
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") throw err;
      }
    }
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && "write" in navigator.clipboard) {
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        downloadCanvas(canvas, filename);
        return "copied";
      } catch {
        // fall through to plain download
      }
    }
  }
  downloadCanvas(canvas, filename);
  return "downloaded";
}
