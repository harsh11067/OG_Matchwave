// Data schemas for 0G Storage JSON files
// These match the smart contract data structures and provide type safety

export interface CandidateProfile {
  version: string;
  candidate: string; // 0x address
  resumeURI: string; // 0G Storage URI
  resumeHash: string; // 0x hash
  preferences: {
    roles: string[];
    locations: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    workMode: string[];
  };
  skills: string[];
  experienceYears: number;
  education: {
    degree: string;
    cgpa?: number;
  };
}

export interface ResumeAnalysis {
  version: string;
  candidate: string; // 0x address
  model: string; // e.g., "resume-v0.3"
  resumeHash: string; // 0x hash
  scores: {
    skills: number;
    location: number;
    salary: number;
    education: number;
    experience: number;
    overall: number;
  };
  topSkills: Array<{
    name: string;
    weight: number;
  }>;
  suggestions: string[];
  explanations: string;
  generatedAt: number; // Unix timestamp
}

export interface JobPosting {
  version: string;
  jobId: number;
  owner: string; // 0x address
  title: string;
  weights: {
    skills: number;
    location: number;
    salary: number;
    education: number;
    experience: number;
  };
  requirements: {
    skills: Array<{
      name: string;
      minLevel: number;
    }>;
    location: string[];
    salaryRange: {
      min: number;
      max: number;
      currency: string;
    };
    education: {
      degree: string;
      minCgpa: number;
    };
    experienceYears: {
      min: number;
      max: number;
    };
  };
  validUntil: number; // Unix timestamp
}

export interface MatchReport {
  version: string;
  jobId: number;
  candidate: string; // 0x address
  resumeHash: string; // 0x hash
  model: string; // e.g., "matcher-v0.3"
  subscores: {
    skills: number;
    location: number;
    salary: number;
    education: number;
    experience: number;
  };
  overall: number;
  rationale: string;
  artifacts: string[]; // 0G Storage URIs
  generatedAt: number; // Unix timestamp
}

// Helper function to validate schema versions
export function validateSchemaVersion(version: string, expected: string): boolean {
  return version === expected;
}

// Helper function to create default profiles
export function createDefaultCandidateProfile(candidate: string): CandidateProfile {
  return {
    version: "1.0",
    candidate,
    resumeURI: "",
    resumeHash: "",
    preferences: {
      roles: [],
      locations: [],
      salaryRange: { min: 0, max: 0, currency: "USD" },
      workMode: []
    },
    skills: [],
    experienceYears: 0,
    education: { degree: "", cgpa: 0 }
  };
}

export function createDefaultJobPosting(owner: string, jobId: number): JobPosting {
  return {
    version: "1.0",
    jobId,
    owner,
    title: "",
    weights: {
      skills: 0.3,
      location: 0.2,
      salary: 0.2,
      education: 0.15,
      experience: 0.15
    },
    requirements: {
      skills: [],
      location: [],
      salaryRange: { min: 0, max: 0, currency: "USD" },
      education: { degree: "", minCgpa: 0 },
      experienceYears: { min: 0, max: 0 }
    },
    validUntil: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
  };
}







