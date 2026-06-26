// IPFS upload service — uses Pinata cloud IPFS pinning (works on deployed sites)
// Set PINATA_API_KEY and PINATA_API_SECRET in your environment variables.
// Falls back to a mock CID if credentials are not configured.

const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_API_SECRET = process.env.PINATA_API_SECRET || "";

/**
 * Uploads a file to IPFS via Pinata's pinning service and returns the CID.
 * Works on both local dev and deployed (Vercel/cloud) environments.
 * @param file The File object to upload
 * @returns The IPFS CID string (e.g. "QmXxx...")
 */
export async function uploadToIPFS(file: File): Promise<string> {
  // If Pinata credentials are not configured, return a mock CID
  if (!PINATA_API_KEY || !PINATA_API_SECRET) {
    console.warn(
      "⚠️  Pinata API credentials not configured. Add PINATA_API_KEY and PINATA_API_SECRET to your environment variables."
    );
    return "QmMockCID_" + Math.random().toString(36).substring(2, 9);
  }

  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_API_SECRET,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Pinata upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json() as { IpfsHash: string };

    if (!data.IpfsHash) {
      throw new Error("Pinata response did not contain an IPFS hash");
    }

    return data.IpfsHash;
  } catch (error) {
    console.error("IPFS Upload Error:", error);
    throw error;
  }
}

/**
 * Returns a public gateway URL to view an IPFS file in the browser.
 * @param cid The IPFS CID
 */
export function ipfsGatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}
