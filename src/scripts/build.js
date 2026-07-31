const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting build process...\n");

// Step 1: Clean dist directory
console.log("📦 Cleaning dist directory...");
if (fs.existsSync("dist")) {
  fs.rmSync("dist", { recursive: true, force: true });
}

// Step 2: Run TypeScript compiler
console.log("🔨 Compiling TypeScript...");
try {
  execSync("npx tsc", { stdio: "inherit" });
} catch (error) {
  console.error("❌ TypeScript compilation failed");
  process.exit(1);
}

// Step 3: Copy email templates
console.log("📧 Copying email templates...");
const templatesSrc = path.join("src", "email", "templates");
const templatesDest = path.join("dist", "email", "templates");

if (fs.existsSync(templatesSrc)) {
  fs.cpSync(templatesSrc, templatesDest, { recursive: true });
  console.log("✅ Email templates copied");
}

// Step 4: Copy .env.production
console.log("📄 Copying environment file...");
fs.copyFileSync(".env.production", "dist/.env");

console.log("\n✅ Build completed successfully!");
console.log("📁 Build output: ./dist");
console.log("🚀 Run 'npm start' to start the production server");
