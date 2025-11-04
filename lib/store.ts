import { create } from 'zustand';
import { Candidate, JobPosting, AnalysisSession, MatchingSession } from './types';

// Alias Job to JobPosting for compatibility
export type Job = JobPosting;

// Re-export types for convenience
export type { Candidate, JobPosting, AnalysisSession, MatchingSession };

interface AppState {
  // Candidates
  candidates: Candidate[];
  currentCandidate: Candidate | null;
  
  // Jobs
  jobs: JobPosting[];
  currentJob: JobPosting | null;
  
  // Analysis & Matching
  analysisSessions: AnalysisSession[];
  matchingSessions: MatchingSession[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  removeCandidate: (id: string) => void;
  setCurrentCandidate: (candidate: Candidate | null) => void;
  
  addJob: (job: JobPosting) => void;
  updateJob: (id: string, updates: Partial<JobPosting>) => void;
  removeJob: (id: string) => void;
  setCurrentJob: (job: JobPosting | null) => void;
  
  addAnalysisSession: (session: AnalysisSession) => void;
  addMatchingSession: (session: MatchingSession) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getCandidateById: (id: string) => Candidate | undefined;
  getJobById: (id: string) => Job | undefined;
  getAnalysisByCandidateId: (candidateId: string) => AnalysisSession | undefined;
  getMatchingByJobId: (jobId: string) => MatchingSession | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  candidates: [],
  currentCandidate: null,
  jobs: [],
  currentJob: null,
  analysisSessions: [],
  matchingSessions: [],
  isLoading: false,
  error: null,

  // Actions
  addCandidate: (candidate) =>
    set((state) => ({
      candidates: [...state.candidates, candidate],
    })),

  updateCandidate: (id, updates) =>
    set((state) => ({
      candidates: state.candidates.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeCandidate: (id) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== id),
    })),

  setCurrentCandidate: (candidate) =>
    set({ currentCandidate: candidate }),

  addJob: (job) =>
    set((state) => ({
      jobs: [...state.jobs, job],
    })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, ...updates } : j
      ),
    })),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((j) => j.id !== id),
    })),

  setCurrentJob: (job) =>
    set({ currentJob: job }),

  addAnalysisSession: (session) =>
    set((state) => ({
      analysisSessions: [...state.analysisSessions, session],
    })),

  addMatchingSession: (session) =>
    set((state) => ({
      matchingSessions: [...state.matchingSessions, session],
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Computed values
  getCandidateById: (id) => get().candidates.find((c) => c.id === id),
  getJobById: (id) => get().jobs.find((j) => j.id === id),
  getAnalysisByCandidateId: (candidateId) => 
    get().analysisSessions.find((a) => a.candidateId === candidateId),
  getMatchingByJobId: (jobId) => 
    get().matchingSessions.find((m) => m.jobId === jobId),
}));

// Helper functions for generating IDs
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

// Local storage persistence
export const persistStore = () => {
  const state = useAppStore.getState();
  localStorage.setItem('0g-recruitment-state', JSON.stringify({
    candidates: state.candidates,
    jobs: state.jobs,
    analysisSessions: state.analysisSessions,
    matchingSessions: state.matchingSessions,
  }));
};

export const loadPersistedStore = () => {
  try {
    const persisted = localStorage.getItem('0g-recruitment-state');
    if (persisted) {
      const data = JSON.parse(persisted);
      useAppStore.setState({
        candidates: data.candidates || [],
        jobs: data.jobs || [],
        analysisSessions: data.analysisSessions || [],
        matchingSessions: data.matchingSessions || [],
      });
    }
  } catch (error) {
    console.error('Error loading persisted state:', error);
  }
};
