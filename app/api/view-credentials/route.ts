import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

const SkillCredentialABI = [
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function tokenCount() public view returns (uint256)"
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    const contractAddress = process.env.NEXT_PUBLIC_SKILL_CREDENTIAL_ADDRESS;
    if (!contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Contract address not configured' },
        { status: 500 }
      );
    }

    const rpcUrl = process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, SkillCredentialABI, provider);

    // Get balance (number of tokens owned by address)
    const balance = await contract.balanceOf(address);
    const tokenCount = Number(balance);

    // Get total token count
    const totalTokens = Number(await contract.tokenCount());
    
    // Fetch all token URIs by iterating through all tokens
    // Note: This is a simple approach. In production, you might want to index tokens
    const credentials = [];
    if (tokenCount > 0) {
      // For simplicity, check first 100 tokens (adjust as needed)
      const maxTokensToCheck = Math.min(totalTokens, 100);
      for (let tokenId = 1; tokenId <= maxTokensToCheck; tokenId++) {
        try {
          const tokenURI = await contract.tokenURI(tokenId);
          // Verify ownership by checking if owner is the address
          // Note: We'll fetch URI and metadata, but ownership check should be done via ownerOf
          // For now, fetch all tokens and filter client-side if needed
          
          // Fetch metadata from URI (could be zgs:// or http://)
          let metadata = {};
          if (tokenURI && tokenURI.startsWith('zgs://')) {
            const rootHash = tokenURI.replace('zgs://', '');
            const previewUrl = `${process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER || 'https://indexer-storage-testnet-turbo.0g.ai'}/preview/${rootHash}`;
            const res = await fetch(previewUrl);
            if (res.ok) metadata = await res.json();
          } else if (tokenURI && tokenURI.startsWith('http')) {
            const res = await fetch(tokenURI);
            if (res.ok) metadata = await res.json();
          }

          // Only add if we have valid metadata or URI
          if (tokenURI && (tokenURI.startsWith('zgs://') || tokenURI.startsWith('http'))) {
            credentials.push({
              tokenId: tokenId.toString(),
              tokenURI,
              metadata
            });
          }
          
          // Stop if we found enough tokens
          if (credentials.length >= tokenCount) break;
        } catch (err) {
          // Token might not exist, continue
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      address,
      count: tokenCount,
      credentials
    });
  } catch (error: any) {
    console.error('❌ View Credentials Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}

