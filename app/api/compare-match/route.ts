import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { computeMatchScore } from '../../../lib/match-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { candidate, previousWeights } = await request.json();

    if (!candidate) {
      return NextResponse.json(
        { success: false, error: 'Missing candidate' },
        { status: 400 }
      );
    }

    // Load jobs from local file (data/jobs.json) or use Zustand store data
    // For server-side, we'll read from file system
    const jobsPath = path.join(process.cwd(), 'data', 'jobs.json');
    let jobs: any[] = [];
    try {
      const raw = await fs.readFile(jobsPath, 'utf8');
      jobs = JSON.parse(raw);
    } catch (err) {
      // If file doesn't exist, try to fetch from search-crosschain API
      try {
        const jobsRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000'}/api/search-crosschain?network=all`);
        const jobsData = await jobsRes.json();
        jobs = jobsData.results || jobsData.jobs || [];
      } catch (fetchErr) {
        console.warn('Could not fetch jobs:', fetchErr);
        jobs = [];
      }
    }

    // Load current weights
    const weightsPath = path.join(process.cwd(), 'data', 'weights.json');
    let currentWeights = {};
    try {
      const raw = await fs.readFile(weightsPath, 'utf8');
      currentWeights = JSON.parse(raw);
    } catch (err) {
      // Use defaults if file doesn't exist
      currentWeights = {
        skills: 0.4,
        location: 0.2,
        salary: 0.15,
        education: 0.15,
        experience: 0.1
      };
    }

    // Prepare candidate metadata for matching
    const candidateMeta = {
      skills: candidate.analysis?.skills?.found || candidate.preferences?.skills || [],
      location: candidate.preferences?.location || '',
      salary: candidate.preferences?.salary || { min: 0, max: 0 },
      education: candidate.analysis?.education?.degree || '',
      experience: candidate.analysis?.experience?.years || 0
    };

    // Compute scores with current weights (AFTER adaptive learning)
    const scoredNow = await Promise.all(
      jobs.map(async (job: any) => {
        const jobMeta = job.metadata || job;
        const jobMetaNormalized = {
          skills: jobMeta.skills || jobMeta.requirements?.skills || [],
          location: jobMeta.location || job.location || '',
          salary: jobMeta.salary || job.salary || { min: 0, max: 0 },
          education: jobMeta.education || jobMeta.requirements?.education || '',
          experience: jobMeta.experience || jobMeta.requirements?.experience || 0
        };
        const score = await computeMatchScore(
          jobMetaNormalized,
          candidateMeta,
          currentWeights
        );
        return { job, score };
      })
    );

    // Compute with previous weights (BEFORE adaptive learning) if provided
    let scoredBefore = null;
    if (previousWeights) {
      scoredBefore = await Promise.all(
        jobs.map(async (job: any) => {
          const jobMeta = job.metadata || job;
          const jobMetaNormalized = {
            skills: jobMeta.skills || jobMeta.requirements?.skills || [],
            location: jobMeta.location || job.location || '',
            salary: jobMeta.salary || job.salary || { min: 0, max: 0 },
            education: jobMeta.education || jobMeta.requirements?.education || '',
            experience: jobMeta.experience || jobMeta.requirements?.experience || 0
          };
          const score = await computeMatchScore(
            jobMetaNormalized,
            candidateMeta,
            previousWeights
          );
          return { job, score };
        })
      );
    } else {
      // Use default weights as "before" if no previous weights provided
      const defaultWeights = {
        skills: 0.4,
        location: 0.2,
        salary: 0.15,
        education: 0.15,
        experience: 0.1
      };
      scoredBefore = await Promise.all(
        jobs.map(async (job: any) => {
          const jobMeta = job.metadata || job;
          const jobMetaNormalized = {
            skills: jobMeta.skills || jobMeta.requirements?.skills || [],
            location: jobMeta.location || job.location || '',
            salary: jobMeta.salary || job.salary || { min: 0, max: 0 },
            education: jobMeta.education || jobMeta.requirements?.education || '',
            experience: jobMeta.experience || jobMeta.requirements?.experience || 0
          };
          const score = await computeMatchScore(
            jobMetaNormalized,
            candidateMeta,
            defaultWeights
          );
          return { job, score };
        })
      );
    }

    // Sort by score descending
    scoredNow.sort((a, b) => b.score - a.score);
    if (scoredBefore) scoredBefore.sort((a, b) => b.score - a.score);

    return NextResponse.json({
      success: true,
      before: scoredBefore,
      after: scoredNow,
      weights: currentWeights
    });
  } catch (error: any) {
    console.error('Compare match error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

