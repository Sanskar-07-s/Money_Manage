#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const isStaged = process.argv.includes("--staged");
const filesArgIndex = process.argv.indexOf("--files");
const filesFromArgs =
  filesArgIndex >= 0 ? process.argv.slice(filesArgIndex + 1) : [];
const filesFromEnv = process.env.SECRET_SCAN_FILES
  ? process.env.SECRET_SCAN_FILES.split(/\r?\n/).filter(Boolean)
  : [];

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tar",
  ".mp4",
  ".mov",
  ".mp3",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".exe",
  ".dll",
  ".bin",
]);

const PATH_BLOCKLIST = [
  /^frontend\/dist\//,
  /^frontend\/node_modules\//,
  /^backend\/node_modules\//,
  /^node_modules\//,
];

const SECRET_PATTERNS = [
  {
    name: "Firebase API Key",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    name: "OpenAI API Key",
    regex: /\bsk-(?:proj-|live-|test-|or-v1-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: "GitHub Token",
    regex: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: "Private Key Block",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "Firebase Service Account Private Key",
    regex: /"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----/g,
  },
];

function isAllowedMatch(filePath) {
  return filePath === "scripts/secret-scan.js";
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function listFiles() {
  if (filesFromArgs.length > 0) return filesFromArgs;
  if (filesFromEnv.length > 0) return filesFromEnv;

  const output = isStaged
    ? runGit(["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"])
    : runGit(["ls-files"]);
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean);
}

function shouldSkipFile(filePath) {
  if (PATH_BLOCKLIST.some((rule) => rule.test(filePath))) return true;
  const extension = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(extension);
}

function getFileContent(filePath) {
  if (isStaged) {
    try {
      return execFileSync("git", ["show", `:${filePath}`], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch {
      return null;
    }
  }

  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function containsNullByte(text) {
  return text.includes("\u0000");
}

function scanFile(filePath, content) {
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(line)) {
        if (isAllowedMatch(filePath)) {
          pattern.regex.lastIndex = 0;
          continue;
        }
        findings.push({
          filePath,
          lineNumber: index + 1,
          patternName: pattern.name,
        });
      }
      pattern.regex.lastIndex = 0;
    }
  }

  return findings;
}

function main() {
  const files = listFiles().filter((filePath) => !shouldSkipFile(filePath));
  const findings = [];

  for (const filePath of files) {
    const content = getFileContent(filePath);
    if (content == null || containsNullByte(content)) continue;
    findings.push(...scanFile(filePath, content));
  }

  if (findings.length === 0) {
    console.log("Secret scan passed.");
    return;
  }

  console.error("Secret scan failed. Potential secrets found:");
  for (const finding of findings) {
    console.error(
      `- ${finding.patternName} in ${finding.filePath}:${finding.lineNumber}`
    );
  }
  console.error("Remove secrets and use environment variables before committing.");
  process.exit(1);
}

main();
