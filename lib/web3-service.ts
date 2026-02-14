
import { ethers } from "ethers";

// ABI for EvidenceRegistry
const EVIDENCE_REGISTRY_ABI = [
    "function registerEvidence(string _ipfsHash, string _fileName, string _fileType, string _evidenceId) public",
    "event EvidenceRegistered(address indexed uploader, string ipfsHash, string fileName, uint256 timestamp)",
    "function isEvidenceRegistered(string _ipfsHash) public view returns (bool)"
];

// Contract Address - User needs to deploy and set this
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EVIDENCE_CONTRACT_ADDRESS || "0xYourContractAddressHere";

declare global {
    interface Window {
        ethereum: unknown;
    }
}

export async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        throw new Error("Metamask is not installed!");
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0];
    } catch (error) {
        console.error("Failed to connect wallet:", error);
        throw error;
    }
}

export async function registerEvidenceOnBlockchain(
    ipfsHash: string,
    fileName: string,
    fileType: string,
    evidenceId: string
) {
    if (typeof window.ethereum === "undefined") {
        throw new Error("Metamask is not installed!");
    }

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();

        // Mock Contract for now if address is dummy
        if (CONTRACT_ADDRESS === "0xYourContractAddressHere") {
            console.warn("Using Mock Blockchain Transaction (Contract not deployed)");
            // Simulate delay
            await new Promise(r => setTimeout(r, 2000));
            return { hash: "0xMockTxHash" + Math.random().toString(36).substring(2) };
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, EVIDENCE_REGISTRY_ABI, signer);

        const tx = await contract.registerEvidence(ipfsHash, fileName, fileType, evidenceId);
        await tx.wait(); // Wait for confirmation
        return tx;
    } catch (error) {
        console.error("Blockchain Registration Error:", error);
        throw error;
    }
}
