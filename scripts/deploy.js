// scripts/deploy.js
const hre = require("hardhat");
const path = require("path");
const fs = require("fs");

async function main() {
  await hre.run("compile");

  const ImageStorage = await hre.ethers.getContractFactory("ImageStorage");
  const imageStorage = await ImageStorage.deploy();

  // ethers v6: wait for deployment
  await imageStorage.waitForDeployment();

  // ethers v6: get the address
  const contractAddress = await imageStorage.getAddress();

  console.log("ImageStorage deployed to:", contractAddress);

  // Write the address to .env.local for Next.js to pick up
  const envPath = path.join(__dirname, "..", ".env.local");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, { encoding: "utf-8" });
  }

  // Replace or append NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS
  const addressLine = `NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS=${contractAddress}`;
  if (envContent.includes("NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS=")) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS=.*/,
      addressLine
    );
  } else {
    envContent += `\n${addressLine}\n`;
  }

  fs.writeFileSync(envPath, envContent, { encoding: "utf-8" });
  console.log(`Updated .env.local with contract address: ${contractAddress}`);
  console.log("\nNext steps:");
  console.log("  1. Restart your Next.js dev server (npm run dev) to pick up the new env var");
  console.log("  2. Make sure MetaMask is connected to Localhost 8545");
  console.log("  3. Make sure your IPFS daemon is running: ipfs daemon");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
