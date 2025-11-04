// lib/0g-compute.ts
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

export interface ResumeAnalysis {
  overallScore: number;
  score?: number;
  skills: { found: string[]; missing: string[]; score: number };
    gaps: string[];
  experience: { years: number; score: number };
  education: { degree: string; cgpa?: number; score: number };
  recommendations: string[];
  marketDemand: { overall: number; skills: Record<string, number> };
  learningPaths: string[];
  timestamp: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: { skills: string[]; experience: number; education: string; cgpa?: number };
  location: string;
  salary: { min: number; max: number };
  weights: { skills: number; location: number; salary: number; education: number; experience: number };
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
  private broker: any | null = null;
  private signer: ethers.Wallet | null = null;
  private rpcUrl: string;
  public mockMode: boolean = true; // Make it public

  constructor(privateKey?: string, rpcUrl?: string) {
    this.rpcUrl = rpcUrl || process.env.NEXT_PUBLIC_0G_RPC_URL || '';
    this.mockMode = true; // Default to mock mode
    
    // Try new broker client approach first (from user's code)
    if (process.env.NEXT_PUBLIC_0G_COMPUTE_BROKER_URL) {
      try {
        const ServingBroker = require("@0glabs/0g-serving-broker");
        this.broker = new ServingBroker.BrokerClient({
          brokerUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_BROKER_URL,
          apiKey: process.env.COMPUTE_SIGNER_PRIVATE_KEY || privateKey
        });
        this.mockMode = false;
        console.log("[OGComputeService] connected to serving broker");
      } catch (err: any) {
        console.warn("[OGComputeService] broker client init failed, trying signer approach:", err?.message || err);
        this.mockMode = true;
      }
    }
    
    // Fallback to signer-based approach
    if (this.mockMode && privateKey) {
      const provider = new ethers.JsonRpcProvider(this.rpcUrl || 'https://evmrpc-testnet.0g.ai/');
      this.signer = new ethers.Wallet(privateKey, provider);
    } else {
      this.signer = null;
    }
  }

  /** initialize compute broker (optional) */
  async initBroker() {
    // If already initialized via BrokerClient, skip
    if (this.broker && !this.mockMode) {
      return;
    }
    
    // Try signer-based initialization
    if (this.signer) {
      try {
        this.broker = await createZGComputeNetworkBroker(this.signer);
        this.mockMode = false;
        console.log('[OGComputeService] broker initialized via signer');
      } catch (err) {
        console.warn('[OGComputeService] broker init failed, using local fallback', err);
        this.broker = null;
        this.mockMode = true;
      }
    }
  }

  /** extract plain text from PDF buffer OR docx buffer */
  async extractTextFromBuffer(buffer: Buffer, fileName?: string): Promise<string> {
    const lower = (fileName || '').toLowerCase();
    try {
      if (lower.endsWith('.pdf') || this.isPdfBuffer(buffer)) {
        const data = await pdfParse(buffer);
        return data.text || '';
      }
      // try docx via mammoth
      if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
        try {
          const result = await mammoth.extractRawText({ buffer });
          return result.value || '';
        } catch (e) {
          // fallback to naive text
        }
      }
    } catch (e) {
      console.warn('extractTextFromBuffer error', e);
    }
    // fallback: buffer->utf8
    return buffer.toString('utf8');
  }

  private isPdfBuffer(buf: Buffer): boolean {
    const header = buf.slice(0, 4).toString('utf8');
    return header === '%PDF';
  }

  /**
   * analyzeResumeFile - given a file buffer (PDF/DOCX/TXT) return ResumeAnalysis
   * This tries to call 0G Compute model (via broker). If model returns JSON we parse it,
   * otherwise we fallback to deterministic heuristics.
   */
  async analyzeResumeFile(buffer: Buffer, preferences: any = {}, fileName?: string): Promise<ResumeAnalysis> {
    // Use analyzeResumeFileBuffer from user's code if available
    if (this.analyzeResumeFileBuffer) {
      return this.analyzeResumeFileBuffer(buffer, preferences);
    }
    // Fallback to original method
    const text = await this.extractTextFromBuffer(buffer, fileName);
    return this.analyzeResume(text, preferences);
  }
  
  // Add analyzeResumeFileBuffer method from user's code
  async analyzeResumeFileBuffer(buffer: Buffer, preferences: any): Promise<ResumeAnalysis> {
    let text = "";
    try {
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(buffer);
      text = data.text || "";
    } catch (e) {
      try {
        const mammoth = require("mammoth");
        const res = await mammoth.extractRawText({ buffer });
        text = res.value || "";
      } catch (e2) {
        text = buffer.toString("utf8").slice(0, 50_000);
      }
    }
    return this.analyzeResumeFromText ? await this.analyzeResumeFromText(text, preferences) : await this.analyzeResume(text, preferences);
  }
  
  // Add analyzeResumeFromText method from user's code
  async analyzeResumeFromText(resumeText: string, preferences: any): Promise<ResumeAnalysis> {
    if (!this.mockMode && this.broker) {
      try {
        const job = await this.broker.submitJob({
          task: "resume-analyze",
          input: { resumeText, preferences },
          timeout: 60_000
        });
        const out = await this.broker.waitForJob(job.id);
        if (out.result) {
          return out.result as ResumeAnalysis;
        }
      } catch (err) {
        console.warn('[OGComputeService] Broker job failed, using local analysis:', err);
      }
    }
    return this.localAnalyze(resumeText, preferences);
  }

  /**
   * analyzeResume(text) - if 0G compute is available, send intelligent prompt to model and expect structured JSON,
   * else run deterministic parser heuristics.
   */
  async analyzeResume(resumeText: string, preferences: any = {}): Promise<ResumeAnalysis> {
    // Try new broker-based approach first (from user's code)
    if (!this.mockMode && this.broker) {
      try {
        const job = await this.broker.submitJob({
          task: "resume-analyze",
          input: { resumeText, preferences },
          timeout: 60_000
        });
        const out = await this.broker.waitForJob(job.id);
        if (out.result) {
          return out.result as ResumeAnalysis;
        }
      } catch (err) {
        console.warn('[OGComputeService] Broker job failed, using local analysis:', err);
      }
    }

    // Try original broker approach if new one didn't work
    if (this.broker) {
      try {
        const services = await this.broker.listService?.();
        const svc = services?.find((s: any) => /resume|cv|nlp|extract/i.test(s.name || '')) || services?.[0];
        if (svc) {
          const prompt = `Return a valid JSON object with keys:
{"skillsFound":["..."], "skillsMissing":["..."], "yearsExperience":NUMBER, "education":"Bachelors|Masters|PhD|Other"}
Analyze this resume text exactly (no extra commentary):\n\n${resumeText.substring(0, 4000)}`;

          const headers = (this.broker.inference && (await this.broker.inference.getRequestHeaders?.(svc.provider, prompt))) || {};
          const res = await fetch(`${svc.url}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify({
              model: svc.model || svc.name,
              messages: [
                { role: 'system', content: 'You are a strict JSON-only extractor. Output only JSON.' },
                { role: 'user', content: prompt }
              ],
              temperature: 0
            })
          });

          const js = await res.json();
          const content = js?.choices?.[0]?.message?.content || js?.choices?.[0]?.text || js?.result;
          const jsonText = this.extractJsonString(content);
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return this.buildAnalysisFromParsed(parsed, resumeText);
          }
        }
      } catch (err) {
        console.warn('[OGComputeService] 0G model call failed, fallback to heuristics', err);
      }
    }

    // Fallback to local analysis (improved version)
    return this.localAnalyze(resumeText, preferences);
  }
  
  // Use localAnalyze from user's code - ENHANCED to extract skills properly
  private async localAnalyze(text: string, preferences: any): Promise<ResumeAnalysis> {
    if (!text || text.trim().length === 0) {
      text = 'No resume text provided';
    }
    
    const common = ['JavaScript','Python','Java','React','Node.js','SQL','Git','AWS','Docker','Kubernetes','TypeScript','Angular','Vue.js','Machine Learning','Cloud Computing','DevOps','C++','C#','Go','Rust','PHP','Ruby','Swift','Kotlin','HTML','CSS','MongoDB','PostgreSQL','Redis','Elasticsearch','GraphQL','REST','Microservices','CI/CD','Linux','TensorFlow','PyTorch','Scikit-learn','Pandas','NumPy','Matplotlib'];
    const lower = text.toLowerCase();
    
    // Enhanced skill extraction - check for variations and common misspellings
    const found: string[] = [];
    common.forEach(skill => {
      const variations = [
        skill.toLowerCase(),
        skill.replace(/\./g, ''),
        skill.replace(/\.js/g, ''),
        skill.replace(/\s+/g, ''),
        skill.replace(/\s+/g, '-'),
        skill.replace(/\s+/g, '_')
      ];
      if (variations.some(v => lower.includes(v))) {
        found.push(skill);
      }
    });
    
    // Also extract skills from text patterns like "Skills: JavaScript, Python, React"
    const skillsSection = text.match(/(?:skills?|technologies?|tech stack|proficient in|experience with)[:\-]?\s*([^.]+)/i);
    if (skillsSection) {
      const skillsList = skillsSection[1].split(/[,;|•\n]/).map(s => s.trim()).filter(s => s.length > 1);
      skillsList.forEach(skill => {
        const normalized = skill.replace(/[^a-zA-Z0-9\s]/g, '').trim();
        if (normalized.length > 2 && !found.includes(normalized)) {
          // Check if it's similar to a common skill
          const match = common.find(c => c.toLowerCase().includes(normalized.toLowerCase()) || normalized.toLowerCase().includes(c.toLowerCase()));
          if (match && !found.includes(match)) {
            found.push(match);
          } else if (normalized.length > 3) {
            found.push(normalized);
          }
        }
      });
    }
    
    const uniqueFound = Array.from(new Set(found));
    const missing = common.filter(s => !uniqueFound.some(f => f.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(f.toLowerCase()))).slice(0,5);
    
    const yearsMatch = text.match(/(\d+)\s*(?:years?|yrs?)/i);
    const years = yearsMatch ? parseInt(yearsMatch[1]) : (text.match(/(\d+)\+/) ? 3 : 2);
    const skillsScore = Math.min(100, Math.floor((uniqueFound.length / Math.max(1, 15)) * 100)); // Normalize to 15 max skills
    const experienceScore = Math.min(100, Math.floor(years * 10));
    const education = lower.includes("phd") || lower.includes("doctorate") || lower.includes("ph.d") ? "PhD" : 
                     lower.includes("master") || lower.includes("ms") || lower.includes("m.sc") ? "Masters" : 
                     lower.includes("bachelor") || lower.includes("bs") || lower.includes("b.e") || lower.includes("b.tech") ? "Bachelors" : "Bachelors";
    const educationScore = education === "PhD" ? 95 : education === "Masters" ? 85 : 75;
    const overall = Math.round((skillsScore * 0.5) + (experienceScore * 0.2) + (educationScore * 0.15) + 10);
    
    // Enhanced market demand calculation
    const marketMap: Record<string, number> = {};
    common.forEach((s,i) => {
      const demandScore = uniqueFound.includes(s) ? Math.max(8, 10 - Math.floor(i/2)) : Math.max(1, 5 - Math.floor(i/3));
      marketMap[s] = demandScore;
    });
    const avgDemand = Math.round(Object.values(marketMap).reduce((a,b)=>a+b,0)/Object.values(marketMap).length);

    return {
      overallScore: overall,
      skills: { found: uniqueFound.slice(0, 20), missing: missing.slice(0,5), score: skillsScore },
      gaps: missing.slice(0,3),
      experience: { years, score: experienceScore },
      education: { degree: education, cgpa: this.mockCgpa(education), score: educationScore },
      recommendations: missing.length > 0 ? missing.slice(0, 3).map(s => `Improve your ${s} skills`) : ['Add concrete project metrics', 'Add links to repos or demos'],
      marketDemand: { overall: avgDemand, skills: marketMap },
      learningPaths: missing.length > 0 ? missing.slice(0, 2).map(s => `${s} course`) : ['AWS basics', 'Project-based ML course'],
      timestamp: new Date().toISOString()
    };
  }
  
  private mockCgpa(education: string) { 
    if (education==='PhD') return 4.0; 
    if (education==='Masters') return 3.6; 
    return 3.2; 
  }

  /** robust JSON substring extraction helper */
  private extractJsonString(maybe: string): string | null {
    if (!maybe || typeof maybe !== 'string') return null;
    const first = maybe.indexOf('{');
    const last = maybe.lastIndexOf('}');
    if (first >= 0 && last >= 0 && last > first) {
      const sub = maybe.slice(first, last + 1);
      try {
        JSON.parse(sub);
        return sub;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /** convert parsed JSON (from model) to ResumeAnalysis shape */
  private buildAnalysisFromParsed(parsed: any, resumeText: string): ResumeAnalysis {
    const skillsFound = Array.isArray(parsed.skillsFound) ? parsed.skillsFound : [];
    const skillsMissing = Array.isArray(parsed.skillsMissing) ? parsed.skillsMissing : [];

    const skillsScore = Math.floor((skillsFound.length / Math.max(1, skillsFound.length + skillsMissing.length)) * 100);
    const years = typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : this.extractExperienceFromText(resumeText);

    const education = parsed.education || this.extractEducationFromText(resumeText);

    const analysis: ResumeAnalysis = {
      overallScore: Math.round((skillsScore * 0.6) + (Math.min(10, years) * 4) + (education === 'PhD' ? 8 : education === 'Masters' ? 6 : 4)),
      score: undefined,
      skills: { found: skillsFound, missing: skillsMissing, score: skillsScore },
      gaps: skillsMissing.slice(0, 5),
      experience: { years, score: Math.min(100, Math.round((years / 10) * 100)) },
      education: { degree: education, cgpa: this.mockCgpa(education), score: education === 'PhD' ? 95 : education === 'Masters' ? 85 : 75 },
      recommendations: (skillsMissing || []).map((s: string) => `Improve ${s} via hands-on project`),
      marketDemand: { overall: 7, skills: skillsFound.reduce((acc: any, s: string) => (acc[s] = 8, acc), {}) },
      learningPaths: (skillsMissing || []).map((s: string) => `${s} course`),
      timestamp: new Date().toISOString()
    };
    return analysis;
  }

  /** deterministic heuristics analysis (fallback) */
  private deterministicAnalysis(text: string): ResumeAnalysis {
    const skillsFound = this.extractSkillsFromText(text);
    const marketCommon = ['JavaScript','Python','Java','React','Node.js','SQL','AWS','Docker','Kubernetes','TypeScript'];
    const missing = marketCommon.filter(s => !skillsFound.map(x => x.toLowerCase()).includes(s.toLowerCase())).slice(0,5);
    const skillsScore = Math.min(100, Math.floor((skillsFound.length / Math.max(1, marketCommon.length)) * 100));
    const years = this.extractExperienceFromText(text);
    const education = this.extractEducationFromText(text);
    return {
      overallScore: Math.round((skillsScore * 0.5) + (Math.min(10, years) * 4) + (education === 'PhD' ? 8 : education === 'Masters' ? 6 : 4)),
      skills: { found: skillsFound, missing, score: skillsScore },
      gaps: this.detectGapsFromText(text),
      experience: { years, score: Math.min(100, Math.round((years / 10) * 100)) },
      education: { degree: education, cgpa: this.mockCgpa(education), score: education === 'PhD' ? 95 : education === 'Masters' ? 85 : 75 },
      recommendations: this.generateRecommendations(skillsFound, missing),
      marketDemand: { overall: 7, skills: skillsFound.reduce((acc: any, s: string) => (acc[s] = 8, acc), {}) },
      learningPaths: this.suggestLearningPaths(missing),
      timestamp: new Date().toISOString()
    } as ResumeAnalysis;
  }

  /* ------------------- matching ------------------- */

  /** matchCandidates: ensures candidate.analysis exists (if not tries to analyze), computes component scores using job.weights */
  async matchCandidates(job: JobPosting, candidates: any[], weightsInput?: any): Promise<MatchResult[]> {
    const weights = weightsInput || job.weights || { skills: 0.4, location: 0.2, salary: 0.15, education: 0.15, experience: 0.1 };

    const results: MatchResult[] = [];
    for (const cand of candidates) {
      try {
        // Ensure analysis present
        if (!cand.analysis) {
          // Try to analyze from candidate.resumeBuffer (if provided) or parsed text
          if (cand.resumeBuffer) {
            // resumeBuffer should be a Buffer
            cand.analysis = await this.analyzeResumeFile(Buffer.from(cand.resumeBuffer), cand.preferences || {}, cand.resumeFileName || '');
          } else if (cand.parsedText) {
            cand.analysis = await this.analyzeResume(cand.parsedText, cand.preferences || {});
          } else {
            // fallback: attempt an empty deterministic analysis
            cand.analysis = await this.analyzeResume('', cand.preferences || {});
          }
        }

        const cSkills = cand.analysis?.skills?.found || [];
        const skillsScore = this.calculateSkillsMatch(job.requirements.skills || [], cSkills);
        const locationScore = (job.location || '').toLowerCase().includes('remote') ||
          ((cand.preferences?.location || cand.profile?.location || '') as string).toLowerCase().includes((job.location || '').toLowerCase()) ? 100 : 60;
        const salaryScore = this.calculateSalaryMatch(job.salary || { min: 0, max: 0 }, cand.preferences?.salary);
        const educationScore = this.calculateEducationMatch(job.requirements.education || 'Bachelors', cand.analysis?.education?.degree);
        const experienceScore = this.calculateExperienceMatch(job.requirements.experience || 0, cand.analysis?.experience?.years);

        let overall = Math.floor(
          skillsScore * (weights.skills ?? 0.4) +
          locationScore * (weights.location ?? 0.2) +
          salaryScore * (weights.salary ?? 0.15) +
          educationScore * (weights.education ?? 0.15) +
          experienceScore * (weights.experience ?? 0.1)
        );

        overall = Math.max(0, Math.min(100, overall));

        results.push({
          candidateId: cand.id,
          candidateName: cand.name || cand.id || 'Candidate',
          jobId: job.id,
          overallScore: overall,
          breakdown: { skillsScore, locationScore, salaryScore, educationScore, experienceScore },
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn('matchCandidates: candidate processing failed', cand.id, err);
      }
    }

    // sort desc
    return results.sort((a, b) => b.overallScore - a.overallScore);
  }

  /* ------------------ helper numeric functions ------------------ */

  private calculateSkillsMatch(required: string[], candidateSkills: string[]): number {
    if (!required || required.length === 0) return 100;
    const matched = required.filter(r => candidateSkills.some(cs => cs.toLowerCase().includes(r.toLowerCase())));
    return Math.floor((matched.length / required.length) * 100);
  }

  private calculateSalaryMatch(jobSalary: { min: number; max: number }, candidateSalary?: { min: number; max: number }): number {
    if (!candidateSalary) return 70;
    const jobMid = (jobSalary.min + jobSalary.max) / 2 || 1;
    const candMid = (candidateSalary.min + candidateSalary.max) / 2 || jobMid;
    const diff = Math.abs(jobMid - candMid) / Math.max(1, jobMid);
    return Math.max(0, 100 - diff * 100);
  }

  private calculateEducationMatch(required: string, candidate?: string): number {
    if (!candidate) return 50;
    const levels: any = { 'PhD': 4, 'Masters': 3, 'Bachelors': 2, 'Associate': 1 };
    const r = levels[required] || 2;
    const c = levels[candidate] || 2;
    return c >= r ? 100 : Math.max(50, 100 - (r - c) * 25);
  }

  private calculateExperienceMatch(required: number, candidate?: number): number {
    if (!candidate) return 50;
    if (candidate >= required) return 100;
    return Math.max(50, Math.floor((candidate / Math.max(1, required)) * 100));
  }

  /* ------------------ small NLP helpers reused from earlier mock ------------------ */

  private extractSkillsFromText(text: string): string[] {
    const common = ['JavaScript','Python','Java','React','Node.js','SQL','Git','AWS','Docker','Kubernetes','TypeScript','Angular','Vue.js','Machine Learning','Cloud Computing','DevOps'];
    const found = common.filter(s => text.toLowerCase().includes(s.toLowerCase()));
    const unique = Array.from(new Set(found));
    return unique.length ? unique : [];
  }

  private extractExperienceFromText(text: string): number {
    const m = text.match(/(\d+)\s*(?:years?|yrs?)/i);
    return m ? parseInt(m[1]) : 2;
  }

  private extractEducationFromText(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('phd') || t.includes('doctorate')) return 'PhD';
    if (t.includes('master') || t.includes('ms')) return 'Masters';
    if (t.includes('bachelor') || t.includes('bs') || t.includes('b.e') || t.includes('b.tech')) return 'Bachelors';
    return 'Bachelors';
  }

  private detectGapsFromText(text: string) {
    const gaps: string[] = [];
    if (!/machine learning/i.test(text)) gaps.push('Machine Learning');
    if (!/cloud/i.test(text)) gaps.push('Cloud Computing');
    if (!/devops/i.test(text)) gaps.push('DevOps');
    return gaps.slice(0, 5);
  }

  private generateRecommendations(found: string[], missing: string[]) {
    const recs: string[] = [];
    if (missing.includes('Cloud Computing')) recs.push('Take an introductory cloud (AWS/GCP) course');
    if (missing.includes('Machine Learning')) recs.push('Study ML fundamentals and complete a project');
    if (!found.includes('Git')) recs.push('Add Git usage / project repo references');
    if (found.includes('React')) recs.push('Add advanced React project details and metrics');
    return recs.length ? recs : ['Add project metrics and live links.'];
  }
  private suggestLearningPaths(missing: string[]) {
    const paths: string[] = [];
    if (missing.includes('Cloud Computing')) paths.push('AWS Solutions Architect - Associate');
    if (missing.includes('Machine Learning')) paths.push('Coursera ML Specialization');
    if (missing.includes('DevOps')) paths.push('Docker + Kubernetes hands-on course');
    return paths;
  }
}
