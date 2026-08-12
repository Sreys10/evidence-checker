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

/** Helper to format RPC and ethers.js errors into human-readable messages */
function handleRpcError(error: any): never {
  console.error("Web3 RPC Error:", error);
  const msg = error?.message || String(error);
  if (msg.includes("-32002") || msg.includes("too many errors") || msg.includes("coalesce")) {
    throw new Error(
      "RPC Endpoint Error (-32002): MetaMask RPC rate limit or network error. " +
      "Please switch your MetaMask network to 'Hardhat Localhost' (http://127.0.0.1:8545, Chain ID 31337)."
    );
  }
  if (msg.includes("could not coalesce error")) {
    throw new Error(
      "RPC Connection Failed: Unable to communicate with the Ethereum node. " +
      "Ensure local Hardhat node is running at http://127.0.0.1:8545."
    );
  }
  throw error instanceof Error ? error : new Error(msg);
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
      handleRpcError(switchError);
    }
  }

  // Final safety check — verify chainId directly via ethereum provider
  try {
    const currentChainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    if (BigInt(currentChainIdHex) !== HARDHAT_CHAIN_ID_DECIMAL) {
      throw new Error(
        `Wrong network detected (Chain ID: ${currentChainIdHex}). ` +
        "Please switch MetaMask to 'Hardhat Localhost' (Chain ID 31337) and try again."
      );
    }
  } catch (e: any) {
    if (e.message?.includes("Wrong network")) throw e;
    handleRpcError(e);
  }
}

/** Requests MetaMask account access, switches to Hardhat, and returns the connected address. */
export async function connectWallet(): Promise<string> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed!");
  }

  try {
    // 1. Switch network FIRST so provider connects to Hardhat RPC
    await ensureHardhatNetwork();

    // 2. Request account access via raw RPC to avoid prematurely triggering ethers block polling
    const accounts: string[] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts connected.");
    }

    return accounts[0];
  } catch (err: any) {
    return handleRpcError(err);
  }
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

  try {
    // ⚡ Always switch to Hardhat BEFORE instantiating BrowserProvider
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
  } catch (err: any) {
    return handleRpcError(err);
  }
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

  try {
    await ensureHardhatNetwork();
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
  } catch (err: any) {
    console.warn("Could not fetch blockchain records:", err);
    return [];
  }
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

  try {
    await ensureHardhatNetwork();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, IMAGE_STORAGE_ABI, provider);

    const hashes: string[] = await contract.getHashes(userAddress);
    return hashes;
  } catch (err: any) {
    console.warn("Could not fetch blockchain hashes:", err);
    return [];
  }
}

