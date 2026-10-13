import { createServer, type ServerResponse } from "node:http";

import { E2E_STORAGE_PORT } from "./environment";

const SLOW_RESPONSE_MS = 1_200;

function pdf(label: string): Buffer {
  const stream = `BT /F1 16 Tf 72 720 Td (ITTalent Document E2E - ${label.replace(/[()\\]/g, "_")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body);
}

function sendPdf(response: ServerResponse, path: string): void {
  const body = pdf(path);
  response.writeHead(200, {
    "cache-control": "no-store",
    "content-length": String(body.length),
    "content-type": "application/pdf",
  });
  response.end(body);
}

createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  if (path === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }
  if (path === "/unavailable.pdf") {
    response.writeHead(503, { "content-type": "text/plain" });
    response.end("fixture storage unavailable");
    return;
  }
  if (path.startsWith("/slow/")) {
    setTimeout(() => sendPdf(response, path), SLOW_RESPONSE_MS);
    return;
  }
  if (path.endsWith(".pdf")) {
    sendPdf(response, path);
    return;
  }
  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}).listen(E2E_STORAGE_PORT, "127.0.0.1", () => {
  console.info(`Document E2E storage listening on ${E2E_STORAGE_PORT}`);
});
