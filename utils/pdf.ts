import PDFDocument from "pdfkit";
import type { AuditReport } from "@/types/ai-visibility";

/**
 * Generate a print-friendly PDF report buffer (Node.js / server or client via API).
 */
export async function reportToPdfBuffer(report: AuditReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `AI Visibility Report — ${report.url}`,
        Author: "Himat Technologies",
        Subject: "Technical readiness audit",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const accent = "#0f766e";
    const muted = "#525252";

    doc
      .fillColor(accent)
      .fontSize(11)
      .text("HIMAT TECHNOLOGIES", { characterSpacing: 1 });
    doc.moveDown(0.3);
    doc.fillColor("#111").fontSize(22).text("AI Visibility Report");
    doc.moveDown(0.4);
    doc.fillColor(muted).fontSize(10).text(`Audited URL: ${report.url}`);
    doc.text(`Timestamp: ${report.timestamp}`);
    doc.moveDown(0.8);

    doc
      .fillColor("#111")
      .fontSize(36)
      .text(`${report.score}`, { continued: true })
      .fontSize(16)
      .fillColor(muted)
      .text(" / 100");
    doc.moveDown(0.2);
    doc.fillColor(accent).fontSize(12).text(report.scoreLabel);
    doc.moveDown(0.3);
    doc.fillColor(muted).fontSize(9).text(report.scoreDisclaimer, {
      width: 495,
    });
    doc.moveDown(1);

    section(doc, "Summary");
    doc
      .fillColor("#111")
      .fontSize(10)
      .text(
        `Passed: ${report.summary.passed}   Warnings: ${report.summary.warnings}   Errors: ${report.summary.errors}   Info: ${report.summary.informational}`,
      );
    doc.moveDown(0.8);

    section(doc, "01 — Robots & AI Crawlers");
    doc
      .fillColor("#111")
      .fontSize(10)
      .text(
        `robots.txt: ${report.robots.found ? "Found" : "Not found"}${report.robots.statusCode != null ? ` (HTTP ${report.robots.statusCode})` : ""}`,
      );
    doc.moveDown(0.3);
    for (const c of report.robots.crawlers) {
      doc
        .fillColor("#111")
        .fontSize(9)
        .text(`${c.name}: ${c.status} — ${c.details}`);
    }
    doc
      .moveDown(0.3)
      .fillColor(muted)
      .fontSize(8)
      .text(
        "OAI-SearchBot is for ChatGPT Search discovery; GPTBot relates to training use cases.",
      );
    doc.moveDown(0.8);

    section(doc, "02 — Sitemap");
    bullet(doc, `Found: ${report.sitemap.found ? "Yes" : "No"}`);
    bullet(doc, `Kind: ${report.sitemap.kind ?? "n/a"}`);
    bullet(doc, `Valid XML: ${report.sitemap.validXml ? "Yes" : "No"}`);
    if (report.sitemap.urlCount != null) {
      bullet(doc, `URLs: ${report.sitemap.urlCount}`);
    }
    doc.moveDown(0.5);

    section(doc, "03 — llms.txt");
    bullet(doc, `Found: ${report.llms.found ? "Yes" : "No"} (optional)`);
    if (report.llms.statusCode != null) {
      bullet(doc, `HTTP: ${report.llms.statusCode}`);
    }
    doc.moveDown(0.5);

    section(doc, "04 — Organization Schema");
    bullet(doc, `Status: ${report.organization.status}`);
    if (report.organization.fields?.name) {
      bullet(doc, `Name: ${report.organization.fields.name}`);
    }
    if (report.organization.fields?.url) {
      bullet(doc, `URL: ${report.organization.fields.url}`);
    }
    bullet(
      doc,
      `Logo: ${report.organization.fields?.logo ? "Detected" : "Not detected"}`,
    );
    bullet(
      doc,
      `sameAs: ${report.organization.fields?.sameAs?.length ? "Detected" : "Not detected"}`,
    );
    doc.moveDown(0.5);

    section(doc, "05 — Page Clarity");
    bullet(doc, `Title: ${report.pageClarity.title.value ?? "(missing)"}`);
    bullet(
      doc,
      `Description: ${truncate(report.pageClarity.metaDescription.value ?? "(missing)", 120)}`,
    );
    bullet(doc, `Canonical: ${report.pageClarity.canonical.value ?? "(missing)"}`);
    bullet(doc, `H1 count: ${report.pageClarity.h1.count}`);
    bullet(doc, `Language: ${report.pageClarity.lang.value ?? "(missing)"}`);
    doc.moveDown(0.5);

    section(doc, "06 — Technical Signals");
    bullet(doc, `HTTPS: ${report.technical.https ? "Yes" : "No"}`);
    bullet(doc, `Status: ${report.technical.statusCode ?? "n/a"}`);
    bullet(doc, `Response time: ${report.technical.responseTimeMs ?? "n/a"} ms`);
    bullet(doc, `Content-Type: ${report.technical.contentType ?? "n/a"}`);
    doc.moveDown(0.8);

    section(doc, "Recommendations");
    if (report.recommendations.length === 0) {
      doc.fillColor("#111").fontSize(10).text("No additional recommendations.");
    } else {
      for (const r of report.recommendations) {
        doc.fillColor("#111").fontSize(9).text(`• ${r}`, { width: 495 });
        doc.moveDown(0.25);
      }
    }

    doc.moveDown(1.2);
    doc
      .fillColor(muted)
      .fontSize(8)
      .text(
        "Himat Technologies — AI Visibility Checker. Technical readiness only; not a prediction of AI citations.",
      );

    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.fillColor("#0f766e").fontSize(12).text(title);
  doc.moveDown(0.35);
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  doc.fillColor("#111").fontSize(10).text(`• ${text}`, { width: 495 });
  doc.moveDown(0.15);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
