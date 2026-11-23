// Inspects the rendered PDFs: inflates content streams and looks for the text
// that must appear on a Service Invoice.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

function extractText(file) {
  const bytes = fs.readFileSync(file);
  const latin = bytes.toString("latin1");

  // Count pages via the /Type /Page objects.
  const pages = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;

  const chunks = [];
  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRe.exec(latin)) !== null) {
    const raw = Buffer.from(match[1], "latin1");
    try {
      chunks.push(zlib.inflateSync(raw).toString("latin1"));
    } catch {
      chunks.push(raw.toString("latin1"));
    }
  }

  // Text in PDF content streams is shown inside (...) Tj / TJ arrays.
  const text = chunks.join("\n");
  const draws = text.match(/\((?:\\.|[^\\()])*\)/g) || [];
  const visible = draws
    .map((token) => token.slice(1, -1).replace(/\\([()\\])/g, "$1"))
    .join(" ");
  return { pages, visible, streamBytes: text.length };
}

let failed = 0;
function expect(label, haystack, needle) {
  const ok = haystack.includes(needle);
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}: "${needle}"`);
}

const usd = extractText(path.join(__dirname, "sample-invoice-usd.pdf"));
console.log(`\nUSD pdf: pages=${usd.pages} textLen=${usd.visible.length}`);
expect("usd number", usd.visible, "INV-0007");
expect("usd issuer", usd.visible, "Juan Creative & Tech Services");
expect("usd TIN", usd.visible, "123-456-789-000");
expect("usd client", usd.visible, "Apex Growth Marketing LLC");
expect("usd line 1", usd.visible, "Social media management");
expect("usd amount", usd.visible, "USD 1,200.00");
expect("usd total", usd.visible, "USD 1,800.00");
expect("usd php equivalent", usd.visible, "PHP 105,390.00");
expect("usd fx note", usd.visible, "58.5500");
expect("usd disclaimer", usd.visible, "RA 11976");

const php = extractText(path.join(__dirname, "sample-invoice-php.pdf"));
console.log(`\nPHP pdf: pages=${php.pages} textLen=${php.visible.length}`);
expect("php number", php.visible, "INV-0008");
expect("php discount", php.visible, "PHP 3,000.00");
expect("php wht rate", php.visible, "5%");
expect("php wht amount", php.visible, "PHP 2,100.00");
expect("php net", php.visible, "PHP 39,900.00");
expect("php paid", php.visible, "PAID");

console.log(failed === 0 ? "\nPDF CONTENT OK" : `\n${failed} PDF CHECK(S) FAILED`);
process.exit(failed === 0 ? 0 : 1);
