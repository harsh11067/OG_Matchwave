'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAppStore, generateId, generateTimestamp } from '../lib/store';
import { ResumeParser, ParsedResume } from '../lib/resume-parser';
import { Candidate } from '../lib/types';
import { ethers } from 'ethers';
import dynamic from 'next/dynamic';
const CreateDidButton = dynamic(() => import('./CreateDidButton'), { ssr: false });

export default function CandidateFlow() {
  const [currentStep, setCurrentStep] = useState<'upload' | 'preferences' | 'analysis' | 'complete'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [preferences, setPreferences] = useState({
    email: '',
    roles: [''],
    location: '',
    salary: { min: 0, max: 0 },
    skills: ['']
  });
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addCandidate, addAnalysisSession, setLoading, setError: setStoreError } = useAppStore();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validation = ResumeParser.validateFile(file);

      if (!validation.isValid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setUploadedFile(file);
      setError(null);

      try {
        setIsProcessing(true);
        const parsed = await ResumeParser.parseResume(file);
        setParsedResume(parsed);
        setCurrentStep('preferences');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse resume');
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parsedResume || !uploadedFile) {
      setError('Resume not found');
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

      // Upload resume to 0G Storage using API route
      setLoading(true);
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const uploadResponse = await fetch('/api/upload-resume', {
        method: 'POST',
        headers: { 'x-private-key': privateKey },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload resume');
      }

      const { result: storageResult } = await uploadResponse.json();

      // Read file as base64 for advanced analysis (integrate fit_it.ts logic)
      const arrayBuffer = await uploadedFile.arrayBuffer();
      // Convert ArrayBuffer to base64 (browser-compatible)
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);

      // Analyze resume using API route (0G Compute) with base64 file
      const analysisResponse = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileB64: b64,
          fileName: uploadedFile.name,
          preferences,
          resumeText: parsedResume.text // Fallback text
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze resume');
      }

      const { analysis } = await analysisResponse.json();

      // Upload analysis report to 0G Storage using API route
      const reportResponse = await fetch('/api/upload-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-private-key': privateKey
        },
        body: JSON.stringify({ report: analysis })
      });

      if (!reportResponse.ok) {
        throw new Error('Failed to upload report');
      }

      const { result: reportResult } = await reportResponse.json();

      // Create candidate record
      const candidate: Candidate = {
        id: generateId(),
        name: parsedResume.fileName.replace(/\.[^/.]+$/, ''),
        email: preferences.email || `candidate-${generateId()}@example.com`,
        resumeHash: storageResult.rootHash,
        storageURI: storageResult.storageURI,
        preferences,
        analysis,
        did: null,
        didUri: null,
        createdAt: generateTimestamp()
      };

      // Add to store
      addCandidate(candidate);
      setAnalysisResult({ ...analysis, candidate });
      addAnalysisSession({
        id: generateId(),
        candidateId: candidate.id,
        resumeHash: storageResult.rootHash,
        analysis,
        createdAt: generateTimestamp()
      });

      setAnalysisResult(analysis);
      setCurrentStep('analysis');
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process resume');
      setLoading(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreferencesChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setPreferences(prev => {
      const currentArray = prev[field as keyof typeof prev];
      if (Array.isArray(currentArray)) {
        return {
          ...prev,
          [field]: currentArray.map((item: any, i: number) =>
            i === index ? value : item
          )
        };
      }
      return prev;
    });
  };

  const addArrayItem = (field: string) => {
    setPreferences(prev => {
      const currentArray = prev[field as keyof typeof prev];
      if (Array.isArray(currentArray)) {
        return {
          ...prev,
          [field]: [...currentArray, '']
        };
      }
      return prev;
    });
  };

  const removeArrayItem = (field: string, index: number) => {
    setPreferences(prev => {
      const currentArray = prev[field as keyof typeof prev];
      if (Array.isArray(currentArray)) {
        return {
          ...prev,
          [field]: currentArray.filter((_: any, i: number) => i !== index)
        };
      }
      return prev;
    });
  };

  const resetFlow = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setParsedResume(null);
    setPreferences({
      email: '',
      roles: [''],
      location: '',
      salary: { min: 0, max: 0 },
      skills: ['']
    });
    setAnalysisResult(null);
    setError(null);
  };

  // Upload Step
  if (currentStep === 'upload') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Resume</h2>
          <p className="text-gray-600">Upload your resume to get started with AI-powered analysis</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600">Processing resume...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <span className="text-4xl">📄</span>
              <div>
                <p className="text-lg font-bold text-black">
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                </p>
                <p className="text-gray-500">or click to browse</p>
              </div>
              <p className="text-sm text-gray-400">
                Supports PDF, Word documents, and text files (max 10MB)
              </p>
            </div>
          )}
        </div>

        {uploadedFile && (
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">File Details</h3>
            <div className="space-y-2">
              <p><strong>Name:</strong> {uploadedFile.name}</p>
              <p><strong>Size:</strong> {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {uploadedFile.type}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Preferences Step
  if (currentStep === 'preferences') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Your Preferences</h2>
          <p className="text-gray-600">Help us understand your career goals and preferences</p>
        </div>

        <form onSubmit={handlePreferencesSubmit} className="space-y-6">
          {/* Roles */}
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-4">Desired Roles</h3>
            <div className="space-y-3">
              {preferences.roles.map((role, index) => (
                <div key={index} className="flex space-x-3">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleArrayChange('roles', index, e.target.value)}
                    placeholder="e.g., Software Engineer, Product Manager"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {preferences.roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('roles', index)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('roles')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Add Role
              </button>
            </div>
          </div>

          {/* Contact Email */}
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Email</h3>
            <input
              type="email"
              value={preferences.email}
              onChange={(e) => handlePreferencesChange('email', e.target.value)}
              placeholder="e.g., you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-2">This email helps recruiters contact you directly.</p>
          </div>

          {/* Location */}
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Location</h3>
            <input
              type="text"
              value={preferences.location}
              onChange={(e) => handlePreferencesChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA or Remote"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Salary Range */}
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Expected Salary Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                <input
                  type="number"
                  value={preferences.salary.min}
                  onChange={(e) => handlePreferencesChange('salary', { ...preferences.salary, min: parseInt(e.target.value) || 0 })}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                <input
                  type="number"
                  value={preferences.salary.max}
                  onChange={(e) => handlePreferencesChange('salary', { ...preferences.salary, max: parseInt(e.target.value) || 0 })}
                  placeholder="100000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Skills</h3>
            <div className="space-y-3">
              {preferences.skills.map((skill, index) => (
                <div key={index} className="flex space-x-3">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                    placeholder="e.g., JavaScript, React, Node.js"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {preferences.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('skills', index)}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('skills')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
              >
                Add Skill
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setCurrentStep('upload')}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200"
            >
              {isProcessing ? 'Processing...' : 'Analyze Resume'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Analysis Step
  if (currentStep === 'analysis') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Analysis Complete! 🎯</h2>
          <p className="text-gray-600 font-medium">Your resume has been analyzed using advanced AI-powered 0G Compute with deep learning models for skills extraction, experience evaluation, and market demand analysis.</p>
        </div>

        {analysisResult ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm text-center">
              <h3 className="text-lg font-bold text-black mb-4">Overall Fit Score</h3>
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {analysisResult.overallScore ?? 0}%
              </div>
              <p className="text-gray-600">Based on your resume and preferences</p>
            </div>

            {/* Skills Analysis */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Found skills */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Identified Skills</h4>
                  <div className="space-y-2">
                    {(analysisResult.skills?.found ?? []).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-2"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing skills */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skill Gaps</h4>
                  <div className="space-y-2">
                    {(analysisResult.skills?.missing ?? []).map((gap: string, index: number) => (
                      <span
                        key={index}
                        className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm mr-2 mb-2"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Experience Analysis */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Experience Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Years of Experience</p>
                  <p className="text-2xl font-bold text-gray-900">{analysisResult.experience?.years ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience Score</p>
                  <p className="text-2xl font-bold text-blue-600">{analysisResult.experience?.score ?? 0}%</p>
                </div>
              </div>
            </div>

            {/* Education Analysis */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Education Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Degree Level</p>
                  <p className="text-lg font-semibold text-gray-900">{analysisResult.education?.degree ?? 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Education Score</p>
                  <p className="text-2xl font-bold text-blue-600">{analysisResult.education?.score ?? 0}%</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
              <ul className="space-y-2">
                {(analysisResult.recommendations ?? []).map((rec: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Market Demand */}
            <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Market Demand</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {analysisResult.marketDemand?.demandScore ?? 0}/10
                  </p>
                  <p className="text-gray-600">Overall market demand</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Top In-Demand Skills</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {analysisResult.marketDemand?.skills && typeof analysisResult.marketDemand.skills === 'object' 
                      ? Object.entries(analysisResult.marketDemand.skills).slice(0, 6).map(([skill, score]: [string, any], index: number) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <p className="font-medium text-sm">{skill}</p>
                          <p className="text-xs text-gray-600">{score}/10</p>
                        </div>
                      ))
                      : (Array.isArray(analysisResult.marketDemand?.skills) ? analysisResult.marketDemand.skills : []).slice(0, 6).map((skill: string, index: number) => (
                        <div key={index} className="text-center p-2 bg-gray-50 rounded">
                          <p className="font-medium text-sm">{skill}</p>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">No analysis data available</div>
        )}

        <div className="flex justify-center space-x-4">
          <button 
            onClick={resetFlow} 
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Start Over
          </button>
          <button 
            onClick={() => setCurrentStep('complete')} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Complete Step
  if (currentStep === 'complete') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎉 All Done!</h2>
          <p className="text-gray-600">Your resume has been successfully processed and stored on 0G Network</p>
        </div>

        <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Next?</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Resume Stored Securely</p>
                <p className="text-sm text-gray-600">Your resume is now stored on the 0G Network with blockchain security</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI Analysis Complete</p>
                <p className="text-sm text-gray-600">Your resume has been analyzed and insights are ready</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ready for Matching</p>
                <p className="text-sm text-gray-600">Recruiters can now find and match you with relevant job opportunities</p>
              </div>
            </div>
          </div>
        </div>

        {/* DID Creation */}
        <div className="bg-transparent rounded-xl border border-gray-200/50 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-black mb-4">Create Decentralized Identifier (DID)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a DID to securely verify your identity on the blockchain. This allows you to control your credentials.
          </p>
          <CreateDidButton 
            walletAddress={null} 
            candidateId={useAppStore.getState().candidates[useAppStore.getState().candidates.length - 1]?.id || null} 
          />
          {useAppStore.getState().candidates[useAppStore.getState().candidates.length - 1]?.didUri && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                <strong>DID Created:</strong> {useAppStore.getState().candidates[useAppStore.getState().candidates.length - 1]?.did}
              </p>
              <p className="text-xs text-green-600 mt-1">URI: {useAppStore.getState().candidates[useAppStore.getState().candidates.length - 1]?.didUri}</p>
            </div>
          )}
        </div>

        <div className="flex justify-center space-x-4">
          <button 
            onClick={resetFlow} 
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            Upload Another Resume
          </button>
          <button 
            onClick={() => window.location.href = '/#dashboard'} 
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}