import { extractText, getDocumentProxy } from "unpdf";

/**
 * The text inside a PDF, read by code (no AI). Returns an empty string for a PDF with no selectable text,
 * such as a scan. Throws if the file is not a readable PDF (corrupt or password protected).
 */
export async function pdfToText(base64: string): Promise<string> {
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join("\n") : text).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
