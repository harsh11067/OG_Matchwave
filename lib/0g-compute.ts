// Mock 0G Compute Service for demonstration purposes
// In production, this would use the actual 0G SDK

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
  createdAt: string;
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

export class OGComputeService {
  constructor(privateKey?: string) {
    // In production, this would initialize the actual 0G SDK
    // For now, we just store the private key for demonstration
    console.log('0G Compute Service initialized', privateKey ? 'with private key' : 'without private key');
  }

  /**
   * Analyze resume using mock AI analysis
   */
  async analyzeResume(resumeText: string, preferences: any): Promise<ResumeAnalysis> {
    try {
      // Mock AI analysis - in production this would use 0G Compute
      const skills = this.extractSkillsFromText(resumeText);
      const experience = this.extractExperienceFromText(resumeText);
      const education = this.extractEducationFromText(resumeText);
      
      const analysis: ResumeAnalysis = {
        overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
        skills: {
          found: skills.slice(0, Math.min(skills.length, 5)),
          missing: ['Machine Learning', 'Cloud Computing', 'DevOps'],
          score: Math.floor(Math.random() * 30) + 70
        },
        experience: {
          years: experience,
          score: Math.floor(Math.random() * 30) + 70,
          gaps: ['2020-2021: Career break']
        },
        education: {
          degree: education,
          cgpa: 3.5 + Math.random() * 0.5,
          score: Math.floor(Math.random() * 30) + 70
        },
        recommendations: [
          'Add more cloud computing skills',
          'Include specific project metrics',
          'Highlight leadership experience'
        ],
        marketDemand: {
          skills: ['JavaScript', 'React', 'Node.js'],
          demandScore: Math.floor(Math.random() * 30) + 70
        },
        learningPaths: [
          'AWS Certification',
          'Advanced React Patterns',
          'System Design'
        ],
        timestamp: new Date().toISOString()
      };

      return analysis;
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * Match candidates to job postings
   */
  async matchCandidates(job: JobPosting, candidates: any[]): Promise<MatchResult[]> {
    try {
      // Mock matching algorithm - in production this would use 0G Compute
      const matches: MatchResult[] = candidates.map((candidate, index) => {
        const skillsScore = this.calculateSkillsMatch(job.requirements.skills, candidate.analysis?.skills?.found || []);
        const locationScore = job.location.toLowerCase().includes('remote') || 
                            candidate.preferences?.location?.toLowerCase().includes(job.location.toLowerCase()) ? 100 : 60;
        const salaryScore = this.calculateSalaryMatch(job.salary, candidate.preferences?.salary);
        const educationScore = this.calculateEducationMatch(job.requirements.education, candidate.analysis?.education?.degree);
        const experienceScore = this.calculateExperienceMatch(job.requirements.experience, candidate.analysis?.experience?.years);

        const overallScore = Math.floor(
          skillsScore * job.weights.skills +
          locationScore * job.weights.location +
          salaryScore * job.weights.salary +
          educationScore * job.weights.education +
          experienceScore * job.weights.experience
        );

        return {
          candidateId: candidate.id,
          candidateName: candidate.name,
          jobId: job.id,
          overallScore: Math.min(overallScore, 100),
          breakdown: {
            skillsScore,
            locationScore,
            salaryScore,
            educationScore,
            experienceScore
          },
          timestamp: new Date().toISOString()
        };
      });

      // Sort by score (highest first)
      return matches.sort((a, b) => b.overallScore - a.overallScore);
    } catch (error: any) {
      console.error('Error matching candidates:', error);
      throw error;
    }
  }

  /**
   * Extract skills from resume text
   */
  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Git',
      'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Angular', 'Vue.js'
    ];
    
    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    
    return foundSkills.length > 0 ? foundSkills : ['Programming', 'Problem Solving'];
  }

  /**
   * Extract experience from resume text
   */
  private extractExperienceFromText(text: string): number {
    const experienceMatch = text.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i);
    return experienceMatch ? parseInt(experienceMatch[1]) : Math.floor(Math.random() * 5) + 2;
  }

  /**
   * Extract education from resume text
   */
  private extractEducationFromText(text: string): string {
    if (text.toLowerCase().includes('phd') || text.toLowerCase().includes('doctorate')) {
      return 'PhD';
    } else if (text.toLowerCase().includes('master') || text.toLowerCase().includes('ms')) {
      return 'Masters';
    } else if (text.toLowerCase().includes('bachelor') || text.toLowerCase().includes('bs')) {
      return 'Bachelors';
    }
    return 'Bachelors';
  }

  /**
   * Calculate skills match score
   */
  private calculateSkillsMatch(requiredSkills: string[], candidateSkills: string[]): number {
    if (requiredSkills.length === 0) return 100;
    
    const matchedSkills = requiredSkills.filter(skill => 
      candidateSkills.some(candidateSkill => 
        candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(candidateSkill.toLowerCase())
      )
    );
    
    return Math.floor((matchedSkills.length / requiredSkills.length) * 100);
  }

  /**
   * Calculate salary match score
   */
  private calculateSalaryMatch(jobSalary: { min: number; max: number }, candidateSalary?: { min: number; max: number }): number {
    if (!candidateSalary) return 70;
    
    const jobMid = (jobSalary.min + jobSalary.max) / 2;
    const candidateMid = (candidateSalary.min + candidateSalary.max) / 2;
    
    const difference = Math.abs(jobMid - candidateMid) / jobMid;
    return Math.max(0, 100 - difference * 100);
  }

  /**
   * Calculate education match score
   */
  private calculateEducationMatch(required: string, candidate?: string): number {
    if (!candidate) return 50;
    
    const educationLevels = { 'PhD': 4, 'Masters': 3, 'Bachelors': 2, 'Associate': 1 };
    const requiredLevel = educationLevels[required as keyof typeof educationLevels] || 2;
    const candidateLevel = educationLevels[candidate as keyof typeof educationLevels] || 2;
    
    if (candidateLevel >= requiredLevel) return 100;
    return Math.max(50, 100 - (requiredLevel - candidateLevel) * 25);
  }

  /**
   * Calculate experience match score
   */
  private calculateExperienceMatch(required: number, candidate?: number): number {
    if (!candidate) return 50;
    
    if (candidate >= required) return 100;
    return Math.max(50, Math.floor((candidate / required) * 100));
  }
}
