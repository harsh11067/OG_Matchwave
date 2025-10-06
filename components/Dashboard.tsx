'use client';

import { useAppStore } from '../lib/store';
import { useState } from 'react';

export default function Dashboard() {
  const { candidates, jobs, analysisSessions, matchingSessions } = useAppStore();
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  const stats = [
    {
      name: 'Total Candidates',
      value: candidates.length,
      icon: '👤',
      description: 'Resumes uploaded and analyzed'
    },
    {
      name: 'Active Jobs',
      value: jobs.filter(j => j.isActive).length,
      icon: '💼',
      description: 'Open positions'
    },
    {
      name: 'Analysis Sessions',
      value: analysisSessions.length,
      icon: '🔍',
      description: 'AI-powered resume reviews'
    },
    {
      name: 'Matching Sessions',
      value: matchingSessions.length,
      icon: '🎯',
      description: 'Job-candidate matches'
    }
  ];

  const recentCandidates = candidates.slice(-5).reverse();
  const recentJobs = jobs.slice(-5).reverse();

  const handlePrivateKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (privateKey && typeof window !== 'undefined') {
      // Store private key securely (in production, use proper key management)
      localStorage.setItem('0g-private-key', privateKey);
      setShowPrivateKeyInput(false);
      setPrivateKey('');
      // Force re-render to hide the setup warning
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Private Key Setup */}
        {typeof window !== 'undefined' && !window.localStorage.getItem('0g-private-key') && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200 rounded-2xl shadow-lg backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-100/30 to-yellow-100/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="relative flex items-center p-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-200 rounded-full flex items-center justify-center shadow-md">
                  <svg className="h-7 w-7 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-xl font-bold text-amber-900">
                  🔐 Setup Required
                </h3>
                <p className="text-amber-700 mt-1">
                  Connect your Ethereum wallet to start using 0G Network features.
                </p>
              </div>
              <div className="ml-6">
                <button
                  onClick={() => setShowPrivateKeyInput(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Private Key Input Modal */}
      {showPrivateKeyInput && (
        <div className="relative bg-white rounded-xl border-2 border-blue-200 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-xl"></div>
          <div className="relative p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Connect Your Wallet
              </h3>
              <p className="text-gray-600">
                Enter your Ethereum private key to connect to 0G Network
              </p>
            </div>
            
            <form onSubmit={handlePrivateKeySubmit} className="space-y-6">
              <div>
                <label htmlFor="privateKey" className="block text-sm font-semibold text-gray-700 mb-3">
                  🔑 Ethereum Private Key
                </label>
                <input
                  type="password"
                  id="privateKey"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="0x1234567890abcdef..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  This key will be used to sign transactions. Keep it secure and never share it.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Connect Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivateKeyInput(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={stat.name} 
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:bg-white/90"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg">
                      <span className="text-3xl">{stat.icon}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors duration-300">{stat.name}</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">{stat.value}</p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-0 group-hover:scale-100">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 group-hover:text-gray-800 transition-colors duration-300 font-medium">
                {stat.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Recent Candidates</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Live</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {recentCandidates.length > 0 ? (
              <div className="space-y-4">
                {recentCandidates.map((candidate, index) => (
                  <div 
                    key={candidate.id} 
                    className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-sm"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm font-semibold text-blue-700">
                          {candidate.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{candidate.name}</p>
                        <p className="text-sm text-gray-600">{candidate.email}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(candidate.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        candidate.analysis 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {candidate.analysis ? '✅ Analyzed' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-gray-500">No candidates yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload resumes to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
          <div className="p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Recent Job Postings</h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">Active</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {recentJobs.length > 0 ? (
              <div className="space-y-4">
                {recentJobs.map((job, index) => (
                  <div 
                    key={job.id} 
                    className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-green-50 hover:to-emerald-50 transition-all duration-300 hover:shadow-sm"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm font-semibold text-green-700">
                          {job.company.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-green-900 transition-colors duration-300">{job.title}</p>
                        <p className="text-sm text-gray-600">{job.company}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(job.postedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        job.isActive 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {job.isActive ? '🟢 Active' : '⚫ Closed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💼</span>
                </div>
                <p className="text-gray-500">No jobs posted yet</p>
                <p className="text-sm text-gray-400 mt-1">Create job postings to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
        <div className="p-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-600">Ready</span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-to-candidate-flow');
                window.dispatchEvent(event);
              }}
              className="group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📤</span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-900 transition-colors duration-300">Upload Resume</h4>
                <p className="text-sm text-gray-600 mt-2">Start candidate flow</p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-full h-1 bg-blue-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-to-recruiter-flow');
                window.dispatchEvent(event);
              }}
              className="group relative p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-dashed border-green-200 rounded-xl hover:border-green-400 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">📝</span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-green-900 transition-colors duration-300">Post Job</h4>
                <p className="text-sm text-gray-600 mt-2">Create new position</p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-full h-1 bg-green-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => {
                const event = new CustomEvent('navigate-to-matching');
                window.dispatchEvent(event);
              }}
              className="group relative p-6 bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 hover:from-purple-100 hover:to-violet-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">🔍</span>
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-purple-900 transition-colors duration-300">Find Matches</h4>
                <p className="text-sm text-gray-600 mt-2">Match candidates to jobs</p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-full h-1 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

