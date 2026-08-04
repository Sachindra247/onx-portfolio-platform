const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

const sourcePath = path.resolve(
  projectRoot,
  "../../OnX_Certifications_Dashboard.html",
);

const outputPath = path.resolve(
  projectRoot,
  "src/data/certificationPrototypeData.ts",
);

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Prototype file was not found at:\n${sourcePath}`);
}

const source = fs.readFileSync(sourcePath, "utf8");

const defaultCerts = extractValue(
  source,
  "const defaultCerts =",
  "const vendorMeta =",
);

const vendorMeta = extractValue(
  source,
  "const vendorMeta =",
  "const rebates =",
);

const rebates = extractValue(source, "const rebates =", "const gaps =");

const gaps = extractValue(source, "const gaps =", "// ─── STATE");

const output = `import type {
  CertificationDto,
  CertificationGap,
  VendorCertificationMetaMap,
} from "../types/certifications";

export const prototypeCertifications =
  ${JSON.stringify(defaultCerts, null, 2)} as CertificationDto[];

export const prototypeVendorMeta =
  ${JSON.stringify(vendorMeta, null, 2)} as VendorCertificationMetaMap;

export const prototypeGaps =
  ${JSON.stringify(gaps, null, 2)} as CertificationGap[];

export const prototypeRebates =
  ${JSON.stringify(rebates, null, 2)};
`;

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true,
});

fs.writeFileSync(outputPath, output, "utf8");

console.log(`Created ${path.relative(projectRoot, outputPath)}`);

console.log(`Certification records: ${defaultCerts.length}`);

console.log(`Vendor metadata records: ${Object.keys(vendorMeta).length}`);

console.log(`Gap records: ${gaps.length}`);

function extractValue(text, startMarker, endMarker) {
  const startIndex = text.indexOf(startMarker);

  if (startIndex === -1) {
    throw new Error(`Could not locate: ${startMarker}`);
  }

  const valueStart = startIndex + startMarker.length;

  const endIndex = text.indexOf(endMarker, valueStart);

  if (endIndex === -1) {
    throw new Error(`Could not locate: ${endMarker}`);
  }

  const expression = text
    .slice(valueStart, endIndex)
    .trim()
    .replace(/;\s*$/, "");

  return vm.runInNewContext(`(${expression})`, Object.create(null), {
    timeout: 1000,
  });
}
