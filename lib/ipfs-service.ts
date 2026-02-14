
// This service handles uploading to IPFS.
// For production, use a dedicated gateway like Pinata.

const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

export async function uploadToIPFS(file: File): Promise<string> {
    // If no keys, return a mock hash for demonstration
    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
        console.warn("Pinata keys not found. Returning mock IPFS hash.");
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve("QmMockHash" + Math.random().toString(36).substring(7));
            }, 1500);
        });
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            body: formData,
            headers: {
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_KEY,
            },
        });

        if (!res.ok) {
            throw new Error(`Pinata Upload Failed: ${res.statusText}`);
        }

        const data = await res.json();
        return data.IpfsHash;
    } catch (error) {
        console.error("IPFS Upload Error:", error);
        throw error;
    }
}
