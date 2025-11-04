import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { OGComputeService } from '@/lib/0g-compute';
import { OGStorageService } from '@/lib/0g-storage';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileB64, fileName, resumeText, preferences } = body;

    // ✅ Validate input
    if (!fileB64 && !resumeText) {
      return NextResponse.json(
        { success: false, error: 'Either fileB64 or resumeText is required' },
        { status: 400 }
      );
    }

    // ✅ Initialize compute + storage services
    // Use testnet for compute (as requested)
    const computeRpcUrl = process.env.NEXT_PUBLIC_0G_COMPUTE_RPC_URL || process.env.NEXT_PUBLIC_0G_RPC_URL || 'https://evmrpc-testnet.0g.ai/';
    const compute = new OGComputeService(
      process.env.COMPUTE_SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY,
      computeRpcUrl
    );
    await compute.initBroker?.();
    console.log('✅ 0G Compute initialized with RPC:', computeRpcUrl);

    const storage = new OGStorageService(process.env.PRIVATE_KEY);

    // ✅ Use OpenAI for skills extraction (more reliable than 0G Compute)
    let analysis: any;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (openaiKey) {
      // Extract text from file if provided
      let textToAnalyze = resumeText || '';
      if (fileB64) {
        const buffer = Buffer.from(fileB64, 'base64');
        // Extract text using compute service
        textToAnalyze = await compute.extractTextFromBuffer(buffer, fileName || 'resume.pdf');
      }
      
      if (!textToAnalyze || textToAnalyze.trim().length === 0) {
        throw new Error('No resume text available for analysis');
      }
      
      // Use OpenAI to extract skills
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a resume analysis expert. Extract ALL skills, technologies, programming languages, frameworks, tools, and experience from resumes. 
                You MUST return a valid JSON object with this exact structure:
                {
                  "skillsFound": ["skill1", "skill2", ...],
                  "skillsMissing": ["skill1", "skill2", ...],
                  "yearsExperience": number,
                  "education": "Bachelors|Masters|PhD|Other"
                }
                CRITICAL REQUIREMENTS: 
                - Extract EVERY technical skill mentioned (programming languages, frameworks, tools, databases, cloud platforms, libraries, etc.)
                - Look for skills in: "Skills", "Technologies", "Tech Stack", "Proficient in", "Experience with" sections
                - Include variations: "JS"/"JavaScript", "React.js"/"React", "Node"/"Node.js", etc.
                - skillsFound MUST be an array with at least 3-10 skills if the resume mentions technical work
                - If you see "Python", "Java", "React", "SQL", "Git", "AWS", etc., include them in skillsFound
                - yearsExperience should be a number (estimate from resume if not explicitly stated)
                - education should be one of: "Bachelors", "Masters", "PhD", or "Other"
                - Return ONLY the JSON object, no markdown, no code blocks, no explanations`
              },
              {
                role: 'user',
                content: `Analyze this resume text and extract ALL skills, technologies, and experience. Return only the JSON object:\n\n${textToAnalyze.substring(0, 12000)}`
              }
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: "json_object" }
          })
        });
        
        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          let content = openaiData.choices?.[0]?.message?.content || '';
          
          // Clean content - remove markdown code blocks if present
          content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          
          // Extract JSON from response
          let jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const parsed = JSON.parse(jsonMatch[0]);
              console.log('[OpenAI] Parsed response:', JSON.stringify(parsed, null, 2));
              
              // Debug: Check what we got
              let skillsFound = Array.isArray(parsed.skillsFound) ? parsed.skillsFound : 
                              (parsed.skills ? (Array.isArray(parsed.skills) ? parsed.skills : []) : []);
              let skillsMissing = Array.isArray(parsed.skillsMissing) ? parsed.skillsMissing : 
                                 (parsed.missingSkills ? (Array.isArray(parsed.missingSkills) ? parsed.missingSkills : []) : []);
              
              // FIX: If OpenAI put skills in skillsMissing instead of skillsFound, extract them
              if (skillsFound.length === 0 && skillsMissing.length > 0) {
                console.warn('[OpenAI] ⚠️ Skills found in skillsMissing instead of skillsFound. Extracting from text...');
                // Use the existing compute service's analyzeResume which will fallback to local analysis
                const localAnalysis = await compute.analyzeResume(textToAnalyze, preferences || {});
                skillsFound = localAnalysis.skills.found || [];
                skillsMissing = localAnalysis.skills.missing || [];
                console.log('[OpenAI] ✅ Using local analysis fallback - Found', skillsFound.length, 'skills');
              } else if (skillsFound.length === 0) {
                // Large mock fallback - extract from text using enhanced local analysis
                console.warn('[OpenAI] ⚠️ No skills found in OpenAI response. Using large mock fallback...');
                const localAnalysis = await compute.analyzeResume(textToAnalyze, preferences || {});
                skillsFound = localAnalysis.skills.found || [];
                skillsMissing = localAnalysis.skills.missing || [];
                console.log('[OpenAI] ✅ Using large mock fallback - Found', skillsFound.length, 'skills');
              }
            const yearsMatch = textToAnalyze.match(/(\d+)\s*(?:years?|yrs?)/i);
            const yearsExp = typeof parsed.yearsExperience === 'number' ? parsed.yearsExperience : 
                           (yearsMatch ? parseInt(yearsMatch[1]) : 2);
            const education = parsed.education || 
                           (textToAnalyze.toLowerCase().includes('phd') ? 'PhD' :
                            textToAnalyze.toLowerCase().includes('master') ? 'Masters' : 'Bachelors');
            
            const skillsScore = Math.min(100, Math.floor((skillsFound.length / Math.max(1, 15)) * 100));
            const experienceScore = Math.min(100, Math.floor(yearsExp * 10));
            const educationScore = education === 'PhD' ? 95 : education === 'Masters' ? 85 : 75;
            const overall = Math.round((skillsScore * 0.5) + (experienceScore * 0.2) + (educationScore * 0.15) + 10);
            
            // Market demand calculation
            const marketMap: Record<string, number> = {};
            const commonSkills = ['JavaScript','Python','Java','React','Node.js','SQL','Git','AWS','Docker','Kubernetes','TypeScript','Angular','Vue.js','Machine Learning','Cloud Computing','DevOps'];
            commonSkills.forEach((s, i) => {
              marketMap[s] = skillsFound.includes(s) ? Math.max(8, 10 - Math.floor(i/2)) : Math.max(1, 5 - Math.floor(i/3));
            });
            const avgDemand = Math.round(Object.values(marketMap).reduce((a, b) => a + b, 0) / Object.values(marketMap).length);
            
            analysis = {
              overallScore: overall,
              skills: { found: skillsFound, missing: skillsMissing.slice(0, 5), score: skillsScore },
              gaps: skillsMissing.slice(0, 3),
              experience: { years: yearsExp, score: experienceScore },
              education: { degree: education, cgpa: education === 'PhD' ? 4.0 : education === 'Masters' ? 3.6 : 3.2, score: educationScore },
              recommendations: skillsMissing.slice(0, 3).map((s: string) => `Improve your ${s} skills`),
              marketDemand: { overall: avgDemand, skills: marketMap },
              learningPaths: skillsMissing.slice(0, 2).map((s: string) => `${s} course`),
              timestamp: new Date().toISOString()
            };
            
            console.log('✅ OpenAI-based skills analysis completed - Found', skillsFound.length, 'skills');
            } catch (parseErr: any) {
              console.error('[OpenAI] JSON parse error:', parseErr?.message, 'Content:', content.substring(0, 200));
              throw new Error('Failed to parse OpenAI JSON response');
            }
          } else {
            console.error('[OpenAI] No JSON found in response. Content:', content.substring(0, 200));
            throw new Error('OpenAI did not return valid JSON');
          }
        } else {
          throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
        }
      } catch (openaiErr: any) {
        console.warn('OpenAI analysis failed, falling back to local analysis:', openaiErr?.message || openaiErr);
        // Fallback to local analysis
        if (fileB64) {
          const buffer = Buffer.from(fileB64, 'base64');
          analysis = await compute.analyzeResumeFile(buffer, preferences || {}, fileName || 'resume.pdf');
        } else {
          analysis = await compute.analyzeResume(resumeText, preferences || {});
        }
      }
    } else {
      // No OpenAI key - use local analysis
      if (fileB64) {
        const buffer = Buffer.from(fileB64, 'base64');
        await compute.initBroker?.();
        analysis = await compute.analyzeResumeFile(buffer, preferences || {}, fileName || 'resume.pdf');
        console.log('✅ Local file-based analysis completed');
      } else if (resumeText) {
        await compute.initBroker?.();
        analysis = await compute.analyzeResume(resumeText, preferences || {});
        console.log('✅ Local text-based analysis completed');
      } else {
        throw new Error('Either fileB64 or resumeText is required');
      }
    }

    // ✅ Upload analysis report to storage
    const report = {
      analysis,
      preferences: preferences || {},
      fileName: fileName || 'resume',
      createdAt: new Date().toISOString(),
    };
    const uploadResult = await storage.uploadJSON(report);

    // ✅ Persist candidate locally
    const candidatesPath = path.join(process.cwd(), 'data', 'candidates.json');
    let candidates = [];
    try {
      candidates = JSON.parse(await fs.readFile(candidatesPath, 'utf8'));
    } catch {
      candidates = [];
    }

    const candidateId = randomUUID();
    const candidate = {
      id: candidateId,
      name: (fileName || 'anonymous').replace(/\.[^/.]+$/, ''),
      email: preferences?.email || `candidate-${candidateId.slice(0, 8)}@example.com`,
      resumeHash: uploadResult.rootHash,
      storageURI: uploadResult.storageURI,
      preferences: preferences || {},
      analysis,
      did: null,
      didUri: null,
      createdAt: new Date().toISOString(),
    };

    candidates.push(candidate);
    await fs.mkdir(path.dirname(candidatesPath), { recursive: true });
    await fs.writeFile(candidatesPath, JSON.stringify(candidates, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      analysis,
      candidate,
      uploadResult,
    });
  } catch (err: any) {
    console.error('Resume analysis error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Unknown error' }, { status: 500 });
  }
}
