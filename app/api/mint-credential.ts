import { NextResponse } from "next/server";
import { ethers } from "ethers";
import SkillCredentialABI from "@/lib/abis/SkillCredential.json"; // make sure to export ABI from your build artifacts
import { OGStorageService } from "../../lib/0g-storage";

export async function POST(req: Request) {
  try {
    const { candidate, credentialData, privateKey } = await req.json();

    if (!candidate || !credentialData || !privateKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Step 1: Upload credential JSON to 0G Storage (example flow)
    // Using direct HTTP upload per example to obtain a real zgs:// URI
    const uploadResp = await fetch(
      process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER ||
        "https://indexer-storage-testnet-turbo.0g.ai/upload",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: credentialData.candidateName || credentialData.candidate,
          type: "credential",
          content: credentialData,
        }),
      }
    );

    if (!uploadResp.ok) {
      const text = await uploadResp.text();
      throw new Error(`0G Storage upload failed: ${text}`);
    }

    const uploadJson = await uploadResp.json();
    const credentialURI = uploadJson?.uri || `zgs://mock-${Date.now()}`;

    // Step 2: Mint NFT Credential on-chain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_0G_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    const skillCredential = new ethers.Contract(
      process.env.NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS!, // add this in your .env
      SkillCredentialABI,
      wallet
    );

    const tx = await skillCredential.mintCredential(candidate, credentialURI);
    await tx.wait();

    return NextResponse.json({
      success: true,
      credentialURI,
      txHash: tx.hash,
      rootHash: uploadJson?.rootHash || '',
    });
  } catch (error: any) {
    console.error("❌ Mint Credential Error:", error);
    return NextResponse.json({ error: error.message || "Minting failed" }, { status: 500 });
  }
}
