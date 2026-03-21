// IPFS upload service — uses a local IPFS daemon (http://127.0.0.1:5001)
// Make sure to run `ipfs daemon` before using this.
// Falls back to a mock CID if the daemon is unreachable.

const LOCAL_IPFS_API =
  process.env.NEXT_PUBLIC_LOCAL_IPFS_URL || "http://127.0.0.1:5001";

/**
 * Uploads a file to the local IPFS node and returns the CID.
 * @param file The File object to upload
 * @returns The IPFS CID string (e.g. "QmXxx...")
 */
export async function uploadToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${LOCAL_IPFS_API}/api/v0/add?pin=true`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `IPFS daemon returned ${response.status}: ${response.statusText}`
      );
    }

    // The IPFS HTTP API returns newline-delimited JSON; we want the last line
    const text = await response.text();
    const lines = text.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1];
    const data = JSON.parse(lastLine) as { Hash: string };

    if (!data.Hash) {
      throw new Error("IPFS response did not contain a hash");
    }

    return data.Hash;
  } catch (error) {
    // If the daemon is not running, return a mock CID for development
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      console.warn(
        "⚠️  IPFS daemon unreachable at",
        LOCAL_IPFS_API,
        "— returning mock CID (run `ipfs daemon` to fix this)"
      );
      return "QmMockCID_" + Math.random().toString(36).substring(2, 9);
    }
    console.error("IPFS Upload Error:", error);
    throw error;
  }
}

/**
 * Returns a public gateway URL to view an IPFS file in the browser.
 * @param cid The IPFS CID
 */
export function ipfsGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}
