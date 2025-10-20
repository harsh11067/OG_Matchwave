import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { OGStorageService } from "../../lib/0g-storage";
import JobBoardABI from "@/lib/abis/JobBoard.json"; // Ensure this exists

export async function POST(req: Request) {
  try {
    const { jobId, candidate, analysis, privateKey } = await req.json();

    if (!jobId || !candidate || !analysis || !privateKey) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Step 1: Upload hire outcome JSON to 0G Storage
    const storage = new OGStorageService(privateKey);

    const outcomeData = {
      jobId,
      candidate,
      hired: true,
      analysisScore: analysis.score,
      timestamp: Date.now(),
    };

    const result = await storage.uploadJSON(outcomeData);
    const outcomeURI = result.storageURI;

    // Step 2: Confirm hire on-chain
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_0G_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);

    const jobBoard = new ethers.Contract(
      process.env.NEXT_PUBLIC_JOB_BOARD_ADDRESS!,
      JobBoardABI,
      wallet
    );

    const tx = await jobBoard.confirmHire(jobId, candidate, outcomeURI);
    await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: tx.hash,
      outcomeURI,
    });
  } catch (error: any) {
    console.error("❌ Confirm Hire Error:", error);
    return NextResponse.json({ error: error.message || "Hire confirmation failed" }, { status: 500 });
  }
}
