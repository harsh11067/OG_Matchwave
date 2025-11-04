'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore, loadPersistedStore } from '../lib/store';
import CandidateFlow from '../components/CandidateFlow';
import RecruiterFlow from '../components/RecruiterFlow';
import Dashboard from '../components/Dashboard';
const AskOGWidget = dynamic(() => import('../components/AskOGWidget'), { ssr: false });

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'candidate' | 'recruiter'>('dashboard');
  const { isLoading, error, setError } = useAppStore();

  useEffect(() => {
    // Load persisted state from localStorage
    loadPersistedStore();

    // Listen for navigation events from Dashboard Quick Actions
    const handleNavigateToCandidateFlow = () => setActiveTab('candidate');
    const handleNavigateToRecruiterFlow = () => setActiveTab('recruiter');
    const handleNavigateToMatching = () => setActiveTab('dashboard'); // For now, just go to dashboard

    window.addEventListener('navigate-to-candidate-flow', handleNavigateToCandidateFlow);
    window.addEventListener('navigate-to-recruiter-flow', handleNavigateToRecruiterFlow);
    window.addEventListener('navigate-to-matching', handleNavigateToMatching);

    return () => {
      window.removeEventListener('navigate-to-candidate-flow', handleNavigateToCandidateFlow);
      window.removeEventListener('navigate-to-recruiter-flow', handleNavigateToRecruiterFlow);
      window.removeEventListener('navigate-to-matching', handleNavigateToMatching);
    };
  }, []);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'candidate', name: 'Candidate Flow', icon: '👤' },
    { id: 'recruiter', name: 'Recruiter Flow', icon: '💼' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="text-6xl mr-3">🏄‍♂️</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            0G Matchwave
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          AI-powered, bias-free job matching built on 0G Chain, Compute & Storage.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-transparent">
        <nav className="-mb-px flex space-x-8 bg-transparent">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm font-bold ${
                activeTab === tab.id
                  ? 'border-primary-500 text-black'
                  : 'border-transparent text-black hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* AskOG AI Assistant Widget */}
      <AskOGWidget />

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Processing...</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'candidate' && <CandidateFlow />}
        {activeTab === 'recruiter' && <RecruiterFlow />}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
        <p>
          Built with 0G Labs technology • 
          <a href="https://docs.0g.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 ml-1">
            Documentation
          </a>
        </p>
      </div>
    </div>
  );
}

