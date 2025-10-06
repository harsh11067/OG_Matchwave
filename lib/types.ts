export interface Candidate {
  id: string;
  name: string;
  email: string;
  resumeHash: string;
  storageURI: string;
  preferences: {
    roles: string[];
    location: string;
    salary: {
      min: number;
      max: number;
    };
    skills: string[];
  };
  analysis?: ResumeAnalysis;
  createdAt: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: {
    skills: string[];
    experience: number;
    education: string;
    cgpa?: number;
  };
  location: string;
  salary: {
    min: number;
    max: number;
  };
  weights: {
    skills: number;
    location: number;
    salary: number;
    education: number;
    experience: number;
  };
  isActive: boolean;
  postedAt: string;
  createdAt: string;
}

export interface ResumeAnalysis {
  overallScore: number;
  skills: {
    found: string[];
    missing: string[];
    score: number;
  };
  experience: {
    years: number;
    score: number;
    gaps: string[];
  };
  education: {
    degree: string;
    cgpa?: number;
    score: number;
  };
  recommendations: string[];
  marketDemand: {
    skills: string[];
    demandScore: number;
  };
  learningPaths: string[];
  timestamp: string;
}

export interface MatchResult {
  candidateId: string;
  candidateName: string;
  jobId: string;
  overallScore: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    salaryScore: number;
    educationScore: number;
    experienceScore: number;
  };
  timestamp: string;
}

export interface AnalysisSession {
  id: string;
  candidateId: string;
  resumeHash: string;
  analysis: ResumeAnalysis;
  createdAt: string;
}

export interface MatchingSession {
  id: string;
  jobId: string;
  matches: MatchResult[];
  createdAt: string;
}

