'use client';

import { useState } from 'react';
import { useAppStore, generateId, generateTimestamp } from '../lib/store';
import { JobPosting, Candidate } from '../lib/types';

// Alias for compatibility
type Job = JobPosting;

export default function RecruiterFlow() {
  const [currentStep, setCurrentStep] = useState<'post-job' | 'match-candidates' | 'results'>('post-job');
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    skills: [{ name: '', weight: 1 }],
    location: '',
    salary: { min: 0, max: 0 },
    education: { degree: '', minCGPA: undefined as number | undefined },
    experience: { min: 0, max: 0 }
  });
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { addJob, candidates, addMatchingSession, setLoading, setError: setStoreError } = useAppStore();

  const handleJobFormChange = (field: string, value: any) => {
    setJobForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsChange = (index: number, field: 'name' | 'weight', value: any) => {
    setJobForm(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => 
        i === index ? { ...skill, [field]: field === 'weight' ? parseFloat(value) : value } : skill
      )
    }));
  };

  const addSkill = () => {
    setJobForm(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', weight: 1 }]
    }));
  };

  const removeSkill = (index: number) => {
    setJobForm(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsProcessing(true);
      setError(null);

      // Validate form
      if (!jobForm.title || !jobForm.company || !jobForm.description) {
        setError('Please fill in all required fields');
        return;
      }

      if (jobForm.skills.some(skill => !skill.name)) {
        setError('Please fill in all skill names');
        return;
      }

      // Create job object
      const job: Job = {
        id: generateId(),
        title: jobForm.title,
        company: jobForm.company,
        description: jobForm.description,
        requirements: {
          skills: jobForm.skills.map(skill => skill.name),
          experience: jobForm.experience.min,
          education: jobForm.education.degree,
          cgpa: jobForm.education.minCGPA
        },
        location: jobForm.location,
        salary: jobForm.salary,
        weights: {
          skills: 0.3,
          location: 0.2,
          salary: 0.2,
          education: 0.15,
          experience: 0.15
        },
        isActive: true,
        postedAt: generateTimestamp(),
        createdAt: generateTimestamp()
      };

      // Add job to store
      addJob(job);
      setCurrentStep('match-candidates');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMatching = async () => {
    if (candidates.length === 0) {
      setError('No candidates available for matching');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Get private key from localStorage
      const privateKey = typeof window !== 'undefined' ? localStorage.getItem('0g-private-key') : null;
      if (!privateKey) {
        setError('Private key not found. Please set it up in the Dashboard.');
        return;
      }

      // Get the most recent job
      const latestJob = useAppStore.getState().jobs[useAppStore.getState().jobs.length - 1];
      
      // Match candidates to job using API route (0G Compute)
      setLoading(true);
      const matchingResponse = await fetch('/api/match-candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job: latestJob,
          candidates
        })
      });
      
      if (!matchingResponse.ok) {
        throw new Error('Failed to match candidates');
      }
      
      const { matches } = await matchingResponse.json();
      
      // Add matching session to store
      addMatchingSession({
        id: generateId(),
        jobId: latestJob.id,
        matches,
        createdAt: generateTimestamp()
      });

      setMatchingResults(matches);
      setCurrentStep('results');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to match candidates');
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('post-job');
    setJobForm({
      title: '',
      company: '',
      description: '',
      skills: [{ name: '', weight: 1 }],
      location: '',
      salary: { min: 0, max: 0 },
      education: { degree: '', minCGPA: undefined },
      experience: { min: 0, max: 0 }
    });
    setMatchingResults([]);
    setError(null);
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowProfileModal(true);
  };

  const handleContactCandidate = (candidate: Candidate) => {
    // In a real application, this would open an email client or messaging system
    alert(`Contacting ${candidate.name} at ${candidate.email}`);
  };

  // Post Job Step
  if (currentStep === 'post-job') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Post a New Job</h2>
          <p className="text-gray-600">Create a detailed job posting to find the perfect candidate</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleJobSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  value={jobForm.title}
                  onChange={(e) => handleJobFormChange('title', e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
                <input
                  type="text"
                  value={jobForm.company}
                  onChange={(e) => handleJobFormChange('company', e.target.value)}
                  placeholder="e.g., Tech Corp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
              <textarea
                value={jobForm.description}
                onChange={(e) => handleJobFormChange('description', e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                required
              />
            </div>
          </div>

          {/* Skills and Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h3>
            <div className="space-y-3">
              {jobForm.skills.map((skill, index) => (
                <div key={index} className="flex space-x-3">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => handleSkillsChange(index, 'name', e.target.value)}
                    placeholder="e.g., JavaScript"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <select
                    value={skill.weight}
                    onChange={(e) => handleSkillsChange(index, 'weight', e.target.value)}
                    className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                  {jobForm.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Job Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={jobForm.location}
                onChange={(e) => handleJobFormChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA or Remote"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Salary Range */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Salary Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                <input
                  type="number"
                  value={jobForm.salary.min}
                  onChange={(e) => handleJobFormChange('salary', { ...jobForm.salary, min: parseInt(e.target.value) || 0 })}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                <input
                  type="number"
                  value={jobForm.salary.max}
                  onChange={(e) => handleJobFormChange('salary', { ...jobForm.salary, max: parseInt(e.target.value) || 0 })}
                  placeholder="100000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Education and Experience */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Education & Experience</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Degree</label>
                <input
                  type="text"
                  value={jobForm.education.degree}
                  onChange={(e) => handleJobFormChange('education', { ...jobForm.education, degree: e.target.value })}
                  placeholder="e.g., Bachelor in Computer Science"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={jobForm.education.minCGPA || ''}
                  onChange={(e) => handleJobFormChange('education', { ...jobForm.education, minCGPA: parseFloat(e.target.value) || undefined })}
                  placeholder="3.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Experience (years)</label>
                <input
                  type="number"
                  value={jobForm.experience.min}
                  onChange={(e) => handleJobFormChange('experience', { ...jobForm.experience, min: parseInt(e.target.value) || 0 })}
                  placeholder="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Experience (years)</label>
                <input
                  type="number"
                  value={jobForm.experience.max}
                  onChange={(e) => handleJobFormChange('experience', { ...jobForm.experience, max: parseInt(e.target.value) || 0 })}
                  placeholder="5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isProcessing}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
            >
              {isProcessing ? 'Creating...' : 'Create Job Posting'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Match Candidates Step
  if (currentStep === 'match-candidates') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Match Candidates</h2>
          <p className="text-gray-600">Find the best candidates for your job posting using AI</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ready to Find Matches?</h3>
          <p className="text-gray-600 mb-6">
            We'll analyze all available candidates and rank them based on their fit for your job posting.
          </p>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              <p><strong>Available Candidates:</strong> {candidates.length}</p>
              <p><strong>Matching Criteria:</strong> Skills, Experience, Location, Salary, Education</p>
            </div>
            
            <button
              onClick={handleMatching}
              disabled={isProcessing || candidates.length === 0}
              className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
            >
              {isProcessing ? 'Finding Matches...' : 'Find Matches'}
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setCurrentStep('post-job')}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Back to Job Posting
          </button>
        </div>
      </div>
    );
  }

  // Results Step
  if (currentStep === 'results') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Matching Results</h2>
          <p className="text-gray-600">Top candidates ranked by fit score</p>
        </div>

        {matchingResults.length > 0 ? (
          <div className="space-y-4">
            {matchingResults.map((match, index) => {
              const candidate = candidates.find(c => c.id === match.candidateId);
              return (
                <div key={match.candidateId} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        #{index + 1} - {candidate?.name || 'Unknown Candidate'}
                      </h3>
                      <p className="text-sm text-gray-500">{candidate?.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {match.score}%
                      </div>
                      <p className="text-sm text-gray-500">Match Score</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Skills</p>
                      <p className="text-lg font-bold text-blue-600">{match.breakdown.skills}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-lg font-bold text-blue-600">{match.breakdown.location}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Salary</p>
                      <p className="text-lg font-bold text-blue-600">{match.breakdown.salary}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Education</p>
                      <p className="text-lg font-bold text-blue-600">{match.breakdown.education}%</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="text-lg font-bold text-blue-600">{match.breakdown.experience}%</p>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  {candidate?.analysis && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Candidate Profile</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            <strong>Skills:</strong>{' '}
                            {(candidate.analysis.skills?.found ?? []).join(', ')}
                          </p>
                          <p><strong>Experience:</strong> {candidate.analysis.experience?.years ?? 0} years</p>
                          <p><strong>Education:</strong> {candidate.analysis.education?.degree ?? 'Not specified'}</p>
                        </div>
                        <div>
                          <p><strong>Market Demand:</strong> {candidate.analysis.marketDemand?.demandScore ?? 0}/10</p>
                          <p><strong>Overall Score:</strong> {candidate.analysis.overallScore ?? 0}%</p>
                          <p><strong>Skills Score:</strong> {candidate.analysis.skills?.score ?? 0}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 flex justify-end space-x-3">
                    <button 
                      onClick={() => candidate && handleViewProfile(candidate)}
                      className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      👁️ View Full Profile
                    </button>
                    <button 
                      onClick={() => candidate && handleContactCandidate(candidate)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      📧 Contact Candidate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm text-center">
            <p className="text-gray-500">No matches found</p>
          </div>
        )}

        <div className="flex justify-center space-x-4">
          <button
            onClick={resetFlow}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Post Another Job
          </button>
          <button
            onClick={() => setCurrentStep('match-candidates')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Find More Matches
          </button>
        </div>
      </div>
    );
  }

  // Profile Modal
  if (showProfileModal && selectedCandidate) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Candidate Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedCandidate.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCandidate.name}</h3>
                  <p className="text-gray-600">{selectedCandidate.email}</p>
                  <p className="text-sm text-gray-500">Joined: {new Date(selectedCandidate.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            {selectedCandidate.analysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Overall Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Overall Score</h4>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {selectedCandidate.analysis.overallScore ?? 0}%
                    </div>
                    <p className="text-gray-600">Based on AI analysis</p>
                  </div>
                </div>

                {/* Skills Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Skills Analysis</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Skills Score</span>
                        <span>{selectedCandidate.analysis.skills?.score ?? 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCandidate.analysis.skills?.score ?? 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Identified Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {(selectedCandidate.analysis.skills?.found ?? []).map((skill: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Experience & Education */}
            {selectedCandidate.analysis && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Experience</h4>
                  <div className="space-y-2">
                    <p><strong>Years:</strong> {selectedCandidate.analysis.experience?.years ?? 0}</p>
                    <p><strong>Score:</strong> {selectedCandidate.analysis.experience?.score ?? 0}%</p>
                    {selectedCandidate.analysis.experience?.gaps && selectedCandidate.analysis.experience.gaps.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Career Gaps:</p>
                        <ul className="text-sm text-gray-600">
                          {selectedCandidate.analysis.experience.gaps.map((gap: string, index: number) => (
                            <li key={index}>• {gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Education</h4>
                  <div className="space-y-2">
                    <p><strong>Degree:</strong> {selectedCandidate.analysis.education?.degree ?? 'Not specified'}</p>
                    <p><strong>Score:</strong> {selectedCandidate.analysis.education?.score ?? 0}%</p>
                    {selectedCandidate.analysis.education?.cgpa && (
                      <p><strong>CGPA:</strong> {selectedCandidate.analysis.education.cgpa}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Market Demand */}
            {selectedCandidate.analysis?.marketDemand && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Market Demand</h4>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {selectedCandidate.analysis.marketDemand.demandScore}/10
                  </div>
                  <p className="text-gray-600">Market Demand Score</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">In-Demand Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedCandidate.analysis.marketDemand.skills ?? []).map((skill: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {selectedCandidate.analysis?.recommendations && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h4>
                <ul className="space-y-2">
                  {(selectedCandidate.analysis.recommendations ?? []).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resume Information */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Resume Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Resume Hash</p>
                  <p className="font-mono text-sm bg-white px-3 py-2 rounded border">{selectedCandidate.resumeHash}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Storage URI</p>
                  <p className="font-mono text-sm bg-white px-3 py-2 rounded border">{selectedCandidate.storageURI}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => selectedCandidate && handleContactCandidate(selectedCandidate)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                📧 Contact Candidate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}