/**
 * ⚠️ DEMO VULNERABILITY SCANNER – EDUCATIONAL USE ONLY
 *
 * This script is a simplified vulnerability scanner built for demonstration purposes.
 * It uses basic regular expressions to highlight common insecure patterns in source code.
 *
 * NOTE:
 * - This is NOT a real-world security scanner.
 * - It does NOT provide comprehensive or reliable vulnerability detection.
 * - It is intended for learning and educational presentations ONLY.
 *
 * DO NOT use this tool in production environments or as a substitute for professional security audits.
 */

const fs = require("fs");
const path = require("path");

(async () => {
  const chalk = (await import("chalk")).default;

  const rulesPath = path.join(__dirname, "/vuln_rules/rules.json");
  const targetDir = path.join(__dirname, "../"); // Adjust if necessary
  const excludedDirs = ["node_modules", "scripts", "test", ".git"];

  // Load rules from JSON
  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

  // Scan file against all rules
  function scanFile(filePath, rules) {
    const results = [];
    const content = fs.readFileSync(filePath, "utf-8");

    const skipRulesByFile = {
      V01: content.includes("req.user.role") && content.match(/['"]ADMIN['"]/),
      V04: content.includes("allowedHosts"),
      V05: content.includes("execFile") && content.includes("safeCommands"),
      V06: content.includes("req.user.role") && content.includes("'CUSTOMER'"),
      V10:
        content.includes("req.user") &&
        content.match(/(assignedTo|username|role)/),
      V02:
        content.includes("req.user.username") &&
        content.includes("!== username"),
      V03: content.includes("req.user.role") && content.includes("'ADMIN'"),
      V11: content.includes(
        "new RegExp(`^(${pattern.replace(/[();]/g, '')})$`"
      ),
    };

    rules.forEach((rule) => {
      if (skipRulesByFile[rule.id]) return;

      const regex = new RegExp(rule.regex, "gm");
      const matches = [...content.matchAll(regex)];

      matches.forEach((match) => {
        const lineNumber = content.substring(0, match.index).split("\n").length;
        results.push({
          file: filePath,
          line: lineNumber,
          match: match[0].trim(),
          rule: rule.name,
          description: rule.description,
        });
      });
    });

    return results;
  }

  // Recursively collect .js files, excluding unnecessary folders
  function getJsFiles(dir) {
    let files = [];
    const entries = fs.readdirSync(dir);

    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        if (!excludedDirs.includes(entry)) {
          files = files.concat(getJsFiles(fullPath));
        }
      } else if (entry.endsWith(".js")) {
        files.push(fullPath);
      }
    });

    return files;
  }

  // Start scanning
  console.log(
    chalk.green("🔍 Scanning source code for potential vulnerabilities...")
  );

  const files = getJsFiles(targetDir);
  let totalFindings = [];

  files.forEach((file) => {
    const findings = scanFile(file, rules);
    totalFindings = totalFindings.concat(findings);
  });

  // Display results
  if (totalFindings.length > 0) {
    console.log(
      chalk.bgYellow.black.bold(
        "\n⚠️  Demo Vulnerability Scanner – For Educational Use Only\n"
      )
    );

    totalFindings.forEach((f) => {
      console.log(chalk.redBright.bold(`🚨 [${f.rule}]`));
      console.log(chalk.yellow(`File:`), f.file);
      console.log(chalk.cyan(`Line ${f.line}:`), f.match);
      console.log(chalk.gray(`→ ${f.description}\n`));
    });

    console.log(
      chalk.bgRed.white.bold(
        `⚠️  Found ${totalFindings.length} potential vulnerabilities.`
      )
    );
  } else {
    console.log(
      chalk.greenBright("✅ No known vulnerabilities found. Code looks clean.")
    );
  }
})();
