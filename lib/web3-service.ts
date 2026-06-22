import { ethers } from "ethers";

// ABI for ImageStorage contract (from HrishiBanait/ipfs-blockchain-Image-Storage-System)
const IMAGE_STORAGE_ABI = [
  "function storeEvidence(string memory _ipfsHash, string memory _analystId, uint256 _confidenceScore, string memory _status) public",
  "function getEvidence(address user) external view returns (tuple(string ipfsHash, string analystId, uint256 confidenceScore, string status, uint256 timestamp)[] memory)",
  "function storeHash(string memory _hash) public",
  "function getHashes(address user) external view returns (string[] memory)",
  "event EvidenceStored(address indexed user, string ipfsHash, string analystId, uint256 confidenceScore, string status, uint256 timestamp)",
];

// Contract address – populated automatically by scripts/deploy.js into .env.local
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_IMAGE_STORAGE_ADDRESS || "0xNotDeployedYet";

// Hardhat local chain ID (31337 decimal = 0x7a69 hex)
const HARDHAT_CHAIN_ID = "0x7a69";
const HARDHAT_CHAIN_ID_DECIMAL = BigInt(31337);

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

/**
 * Forces MetaMask to switch to the local Hardhat network.
 * Adds the network automatically if it's not yet configured.
 * Must be called before any transaction is sent.
 */
async function ensureHardhatNetwork(): Promise<void> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  try {
    // Try switching to Hardhat Localhost
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HARDHAT_CHAIN_ID }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902 || switchError.code === -32603) {
      // Chain not added yet — add it automatically
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: HARDHAT_CHAIN_ID,
              chainName: "Hardhat Localhost",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            },
          ],
        });
        // Retry the switch after adding
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      } catch (addError: any) {
        throw new Error(
          "Could not add Hardhat Localhost network to MetaMask. " +
          "Please add it manually: RPC http://127.0.0.1:8545, Chain ID 31337."
        );
      }
    } else if (switchError.code === 4001) {
      // User rejected the switch
      throw new Error(
        "You rejected the network switch. Please switch MetaMask to 'Hardhat Localhost' (Chain ID 31337) and try again."
      );
    } else {
      throw switchError;
    }
  }

  // Final safety check — verify we're actually on Hardhat now
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  if (network.chainId !== HARDHAT_CHAIN_ID_DECIMAL) {
    throw new Error(
      `Wrong network detected (Chain ID: ${network.chainId}). ` +
      "Please switch MetaMask to 'Hardhat Localhost' (Chain ID 31337) and try again."
    );
  }
}

/** Requests MetaMask account access, switches to Hardhat, and returns the connected address. */
export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  // 1. Request account access
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts: string[] = await provider.send("eth_requestAccounts", []);

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts connected.");
  }

  // 2. Always enforce Hardhat Localhost network
  await ensureHardhatNetwork();

  return accounts[0];
}

/**
 * Stores enriched evidence data on the ImageStorage smart contract.
 * Always forces a network switch to Hardhat Localhost before sending.
 */
export async function storeEvidenceOnBlockchain(
  ipfsHash: string,
  analystId: string,
  confidenceScore: number,
  status: string
): Promise<ethers.TransactionReceipt> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  if (CONTRACT_ADDRESS === "0xNotDeployedYet") {
    throw new Error("ImageStorage contract not deployed. Run: npx hardhat run scripts/deploy.js --network localhost");
  }

  // ⚡ Always switch to Hardhat BEFORE sending the transaction
  await ensureHardhatNetwork();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(CONTRACT_ADDRESS, IMAGE_STORAGE_ABI, signer);

  // Convert confidence to integer if it's a float
  const score = Math.round(confidenceScore);

  const tx: ethers.TransactionResponse = await contract.storeEvidence(
    ipfsHash,
    analystId,
    score,
    status
  );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed – no receipt returned.");
  return receipt;
}

/**
 * Stores an IPFS CID on the ImageStorage smart contract (Legacy wrapper).
 */
export async function storeHashOnBlockchain(
  ipfsHash: string
): Promise<ethers.TransactionReceipt> {
  return storeEvidenceOnBlockchain(ipfsHash, "legacy", 0, "unknown");
}

/**
 * Retrieves all enriched evidence records stored on-chain for a user.
 */
export async function getEvidenceFromBlockchain(
  userAddress: string
): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  if (CONTRACT_ADDRESS === "0xNotDeployedYet") return [];

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, IMAGE_STORAGE_ABI, provider);

  const records = await contract.getEvidence(userAddress);
  return records.map((r: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ipfsHash: r.ipfsHash,
    analystId: r.analystId,
    confidenceScore: Number(r.confidenceScore),
    status: r.status,
    timestamp: Number(r.timestamp)
  }));
}

/**
 * Retrieves all IPFS CIDs stored on-chain for a given wallet address.
 */
export async function getHashesFromBlockchain(
  userAddress: string
): Promise<string[]> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  if (CONTRACT_ADDRESS === "0xNotDeployedYet") return [];

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, IMAGE_STORAGE_ABI, provider);

  const hashes: string[] = await contract.getHashes(userAddress);
  return hashes;
}
