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

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any;
  }
}

/** Requests MetaMask account access and returns the connected address. */
export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts: string[] = await provider.send("eth_requestAccounts", []);
  return accounts[0];
}

/**
 * Stores enriched evidence data on the ImageStorage smart contract.
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
    throw new Error("ImageStorage contract not deployed.");
  }

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
): Promise<any[]> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  if (CONTRACT_ADDRESS === "0xNotDeployedYet") return [];

  const provider = new ethers.BrowserProvider(window.ethereum);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, IMAGE_STORAGE_ABI, provider);

  const records = await contract.getEvidence(userAddress);
  return records.map((r: any) => ({
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
