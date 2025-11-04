import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Mock ABI for RecruiterReputation contract
const RecruiterReputationABI = [
  "function rateRecruiter(address recruiter, uint8 score, string calldata comment) external",
  "event Rated(address indexed recruiter, uint8 score, string comment)",
  "function getAverage(address recruiter) public view returns (uint256)"
];

export async function POST(request: NextRequest) {
  try {
    const { recruiterAddress, score, comment, privateKey } = await request.json();

    if (!recruiterAddress || score === undefined || !privateKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (score < 0 || score > 5) {
      return NextResponse.json(
        { success: false, error: 'Score must be between 0 and 5' },
        { status: 400 }
      );
    }

    // In production, connect to blockchain and call rateRecruiter
    // For now, simulate the transaction
    const wallet = new ethers.Wallet(privateKey);
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    console.log('✅ Recruiter rated:', {
      recruiter: recruiterAddress,
      score,
      comment,
      txHash: mockTxHash
    });

    return NextResponse.json({
      success: true,
      txHash: mockTxHash,
      message: 'Recruiter rating submitted successfully'
    });
  } catch (error: any) {
    console.error('❌ Rate Recruiter Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Rating failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recruiterAddress = searchParams.get('address');

    if (!recruiterAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing recruiter address' },
        { status: 400 }
      );
    }

    // In production, query contract for average rating
    // For now, return mock data
    const mockAverage = 4.2;
    
    return NextResponse.json({
      success: true,
      averageRating: mockAverage,
      recruiterAddress
    });
  } catch (error: any) {
    console.error('❌ Get Average Rating Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get average rating' },
      { status: 500 }
    );
  }
}

