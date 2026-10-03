import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../public/forms");

const forms = [
  { id: "w2", title: "Form W-2  Wage and Tax Statement  2025" },
  { id: "nec", title: "Form 1099-NEC  Nonemployee Compensation  2025" },
  { id: "int", title: "Form 1099-INT  Interest Income  2025" },
  { id: "e", title: "Form 1098-E  Student Loan Interest Statement  2025" },
  { id: "t", title: "Form 1098-T  Tuition Statement  2025" },
  { id: "g", title: "Form 1099-G  Certain Government Payments  2025" },
  { id: "a", title: "Form 1095-A  Health Insurance Marketplace Statement  2025" },
];

function escapePdf(text) {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function makePdf(title, lines) {
  const content = [
    "BT",
    "/F1 16 Tf",
    "48 740 Td",
    `(${escapePdf(title)}) Tj`,
    "/F1 10 Tf",
    "0 -22 Td",
    "(KEENFinance practice copy. Not an official IRS form. Fill the blanks in the side panel.) Tj",
    ...lines.flatMap((line, index) => ["0 -28 Td", `(${escapePdf(`${index + 1}. ${line}`)}) Tj`]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body));
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return body;
}

const boxes = {
  w2: ["Employee name", "Employer name", "Wages, tips, other compensation (box 1)", "Federal income tax withheld (box 2)", "Social security wages (box 3)", "State wages (box 16)"],
  nec: ["Payer name", "Recipient name", "Nonemployee compensation (box 1)", "Federal income tax withheld (box 4)", "State income"],
  int: ["Payer / bank name", "Recipient name", "Interest income (box 1)", "Federal income tax withheld (box 4)"],
  e: ["Lender / servicer", "Borrower name", "Student loan interest received (box 1)"],
  t: ["School name", "Student name", "Payments received for qualified tuition (box 1)", "Scholarships or grants (box 5)"],
  g: ["Payer (state agency)", "Recipient name", "Unemployment compensation (box 1)", "Federal income tax withheld (box 4)"],
  a: ["Marketplace name", "Recipient name", "Monthly premium", "Advance payment of premium tax credit"],
};

mkdirSync(outDir, { recursive: true });
for (const form of forms) {
  writeFileSync(join(outDir, `${form.id}.pdf`), makePdf(form.title, boxes[form.id]));
}
console.log(`Wrote ${forms.length} blank practice PDFs to ${outDir}`);
