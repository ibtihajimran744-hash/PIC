const { execSync } = require('child_process');
try {
  console.log("Searching for copies of AdminPortal.tsx...");
  const output = execSync('find / -name "AdminPortal.tsx" 2>/dev/null || true');
  console.log("Found locations:\n", output.toString());
} catch (err) {
  console.error("Search failed:", err.message);
}
