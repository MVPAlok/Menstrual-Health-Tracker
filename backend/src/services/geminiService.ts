import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma';
import { calculatePredictions } from './cycleEngine';

export interface ChatResponsePayload {
  reply: string;
  suggestedFollowUps: string[];
  contextSnapshot?: {
    currentCycleDay?: number;
    currentPhase?: string;
    nextCycleDate?: string;
    daysRemaining?: number;
  };
  loggedData?: any;
}

/**
 * Builds rich, real-time health and cycle telemetry context for the authenticated user.
 */
export async function buildUserHealthContext(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { onboarding: true },
    });

    if (!user) {
      return null;
    }

    // Live cycle forecast and hormone simulation
    let forecast = null;
    try {
      forecast = await calculatePredictions(userId);
    } catch (e: any) {
      console.warn('⚠️ [GeminiService] Predictions could not be computed for context:', e.message);
    }

    // Recent 7 days of diagnostic telemetry
    const recentLogs = await prisma.dailyLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });

    // Partner Sync check
    const partnerSync = await prisma.partnerSync.findFirst({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
        status: 'ACCEPTED',
      },
    });

    return {
      userName: `${user.firstName} ${user.lastName}`.trim(),
      onboarding: user.onboarding,
      forecast,
      recentLogs,
      hasPartnerSynced: !!partnerSync,
    };
  } catch (error) {
    console.error('❌ [GeminiService] Error building user context:', error);
    return null;
  }
}

/**
 * Core function to query Google Gemini with real-time biometric and project context.
 */
export async function processUserMessage(
  userId: string,
  userMessage: string
): Promise<ChatResponsePayload> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // 1. Fetch live user telemetry and cycle context
  const context = await buildUserHealthContext(userId);

  const contextSnapshot = {
    currentCycleDay: context?.forecast?.currentCycleDay,
    currentPhase: context?.forecast?.currentPhase,
    nextCycleDate: context?.forecast?.nextCycleDate,
    daysRemaining: context?.forecast?.daysRemaining,
  };

  // If API key is not configured, return an informative fallback message with live cycle context
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const phaseName = context?.forecast?.currentPhase ? (context.forecast.currentPhase.charAt(0).toUpperCase() + context.forecast.currentPhase.slice(1)) : 'Unknown';
    const day = context?.forecast?.currentCycleDay || 'N/A';
    
    return {
      reply: `👋 Hello **${context?.userName || 'there'}**!\n\nI am **Nari AI**, your body intelligence and menstrual health companion.\n\n* **Your Live Status**: Day **${day}** (${phaseName} Phase)\n* **Next Period Expected**: ${context?.forecast?.nextCycleDate || 'Calibrating'} (${context?.forecast?.daysRemaining ?? '--'} days remaining)\n\n> ⚠️ **Gemini API Key Required**:\n> To enable natural language understanding and personalized real-time health intelligence, please set your \`GEMINI_API_KEY\` in \`backend/.env\`.\n\nOnce configured, I can explain symptom correlations, guide nutrition for your exact phase, log daily health metrics, and answer any questions about NariCare!`,
      suggestedFollowUps: [
        "What is my current cycle phase and what does it mean?",
        "How do I configure my Gemini API key?",
        "What features does NariCare offer?"
      ],
      contextSnapshot,
    };
  }

  // 2. Fetch past conversation history from PostgreSQL
  const previousHistory = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  // Reverse to chronological order (oldest to newest)
  const history = previousHistory.reverse();

  // 3. Construct System Prompt with live project & biometric context
  const todayStr = new Date().toISOString().split('T')[0];

  const recentLogsText = (context?.recentLogs && context.recentLogs.length > 0)
    ? context.recentLogs.map(l => 
        `- Date ${l.date}: Mood=${l.mood}, Sleep=${l.sleepHours}h, Energy=${l.energyRate}/10, Stress=${l.stressFactor}/10, Hydration=${l.hydrationCups} cups, Symptoms=[${l.symptoms.join(', ')}], Flow=${l.flowType}`
      ).join('\n')
    : 'No recent telemetry logs recorded yet.';

  const hormoneText = context?.forecast?.hormones 
    ? `Estrogen: ${context.forecast.hormones.estrogen.toFixed(1)}%, Progesterone: ${context.forecast.hormones.progesterone.toFixed(1)}%, LH: ${context.forecast.hormones.lh.toFixed(1)}%, FSH: ${context.forecast.hormones.fsh.toFixed(1)}%`
    : 'Simulating baseline levels';

  const systemPrompt = `
You are Nari AI, an advanced, empathetic, and clinical-grade Body Intelligence Assistant embedded inside the NariCare cycle and health platform.

════════════ USER PROFILE & REAL-TIME BIOMETRICS ════════════
- Name: ${context?.userName || 'User'}
- Today's Date: ${todayStr}
- Cycle Baseline: Average Cycle Length = ${context?.onboarding?.cycleLength || 28} days, Period Length = ${context?.onboarding?.periodLength || 5} days
- Health Goals: ${(context?.onboarding?.healthGoals || []).join(', ') || 'General cycle wellness'}
- Current Cycle Day: ${context?.forecast?.currentCycleDay || 'Unknown'}
- Current Biological Phase: ${context?.forecast?.currentPhase || 'Unknown'} (Menstrual, Follicular, Ovulation, or Luteal)
- Next Period Forecast: ${context?.forecast?.nextCycleDate || 'Unknown'} (${context?.forecast?.daysRemaining ?? 'N/A'} days remaining)
- Real-Time Simulated Hormones: ${hormoneText}
- Partner Sync: ${context?.hasPartnerSynced ? 'Active & connected' : 'Not paired'}
- Recent 7 Days Telemetry:
${recentLogsText}

════════════ NARICARE PLATFORM KNOWLEDGE ════════════
You know every feature of NariCare:
1. Home Dashboard: Visualizes the 4-phase cycle wheel, live hormone graphs, biometric streaks, and actionable daily summaries.
2. Prediction Lab: Neural forecasting engine projecting future cycles, fertile/ovulation windows, and hormone curves up to 6 months in advance.
3. Interactive Calendar: Color-coded menstrual calendar displaying flow, ovulation peaks, and logged symptom histories.
4. Daily Logger: Quick telemetry logging for mood (Radiant, Balanced, Sensitive, Low Energy, Anxious), sleep duration, stress score, hydration (cups), flow type, and symptoms (Cramps, Headache, Bloating, Fatigue, Acne Flare, Healthy Flow).
5. Insights & Trends: Cross-metric correlations (e.g. how stress impacts sleep, hydration impacts energy) and PDF/CSV clinical report exports.
6. Partner Sync: Real-time discreet notification and symptom sharing with a paired partner using an encrypted sync code.

════════════ RESPONSE GUIDELINES ════════════
1. Persona: Knowledgeable, scientifically accurate, warm, supportive, validating, and concise. Never patronizing.
2. Context Awareness: Always reference the user's specific current phase, cycle day, or logged symptoms when relevant.
3. Medical Disclaimer: Provide evidence-based wellness guidance, nutrition, and phase-specific lifestyle tips, but remind users to consult healthcare professionals for acute or clinical diagnoses when appropriate.
4. Intent to Log Health Data: If the user states they want to log or update their metrics for today (e.g. "I drank 6 cups and have mild cramps", "Log my mood as Radiant"), extract this into the "detectedAction" object.
5. Follow-Up Suggestions: ALWAYS provide 2 to 3 smart, contextually relevant follow-up questions/prompts that the user might want to click next.

════════════ OUTPUT FORMAT (STRICT JSON) ════════════
You MUST respond with valid JSON ONLY, conforming exactly to this structure:
{
  "reply": "Your markdown-formatted response string here...",
  "suggestedFollowUps": [
    "Short question 1",
    "Short question 2",
    "Short question 3"
  ],
  "detectedAction": null
}

If a log action was requested by the user, detectedAction should be:
{
  "type": "LOG_ENTRY",
  "data": {
    "mood": "Balanced" | "Radiant" | "Sensitive" | "Low Energy" | "Anxious" (optional),
    "sleepHours": number (optional),
    "energyRate": number between 1 and 10 (optional),
    "stressFactor": number between 1 and 10 (optional),
    "hydrationCups": number between 1 and 8 (optional),
    "flowType": "NONE" | "SPOTTING" | "LIGHT" | "MEDIUM" | "HEAVY" (optional),
    "symptoms": ["Cramps", "Headache", "Bloating", "Fatigue", "Acne Flare", "Healthy Flow"] (optional)
  }
}
`.trim();

  // 4. Initialize Gemini Client
  const ai = new GoogleGenAI({ apiKey });

  // 5. Build contents array with conversation history
  const contents: any[] = [];

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Add current user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  try {
    let responseText = '';
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
        responseText = response.text || '';
        if (responseText) break;
      } catch (mErr: any) {
        lastErr = mErr;
        console.warn(`⚠️ [GeminiService] Model ${model} failed, attempting fallback:`, mErr.message);
      }
    }

    if (!responseText && lastErr) {
      throw lastErr;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      // If parsing fails, extract text directly
      parsed = {
        reply: responseText,
        suggestedFollowUps: [
          "Tell me more about my current phase",
          "What symptoms should I monitor?",
          "How can I improve my sleep?"
        ],
        detectedAction: null
      };
    }

    let loggedData = null;

    // Check if the AI detected an intent to log daily metrics
    if (parsed.detectedAction && parsed.detectedAction.type === 'LOG_ENTRY' && parsed.detectedAction.data) {
      try {
        const actionData = parsed.detectedAction.data;
        const existingLog = await prisma.dailyLog.findUnique({
          where: {
            userId_date: {
              userId,
              date: todayStr,
            },
          },
        });

        const updateData: any = {};
        if (actionData.mood) updateData.mood = actionData.mood;
        if (typeof actionData.sleepHours === 'number') updateData.sleepHours = actionData.sleepHours;
        if (typeof actionData.energyRate === 'number') updateData.energyRate = actionData.energyRate;
        if (typeof actionData.stressFactor === 'number') updateData.stressFactor = actionData.stressFactor;
        if (typeof actionData.hydrationCups === 'number') updateData.hydrationCups = actionData.hydrationCups;
        if (actionData.flowType) updateData.flowType = actionData.flowType;
        if (Array.isArray(actionData.symptoms)) {
          // Merge symptoms
          const combined = new Set([...(existingLog?.symptoms || []), ...actionData.symptoms]);
          updateData.symptoms = Array.from(combined);
        }

        const savedLog = await prisma.dailyLog.upsert({
          where: {
            userId_date: {
              userId,
              date: todayStr,
            },
          },
          update: updateData,
          create: {
            userId,
            date: todayStr,
            mood: updateData.mood || 'Balanced',
            sleepHours: updateData.sleepHours ?? 7.0,
            energyRate: updateData.energyRate ?? 7,
            stressFactor: updateData.stressFactor ?? 3,
            hydrationCups: updateData.hydrationCups ?? 4,
            flowType: updateData.flowType || 'NONE',
            symptoms: updateData.symptoms || [],
          },
        });

        loggedData = savedLog;
        parsed.reply += `\n\n✨ *I've updated your daily log for today (${todayStr}) in real-time!*`;
      } catch (logErr) {
        console.warn('⚠️ [GeminiService] Failed to auto-save detected log:', logErr);
      }
    }

    return {
      reply: parsed.reply || "I'm here to help you navigate your cycle and body intelligence.",
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) && parsed.suggestedFollowUps.length > 0
        ? parsed.suggestedFollowUps.slice(0, 3)
        : ["What phase am I in right now?", "How can I balance my energy?", "Tell me about my next cycle"],
      contextSnapshot,
      loggedData,
    };
  } catch (error: any) {
    console.error('❌ [GeminiService] Gemini API generation error:', error);
    
    // Fallback if model fails or quota issue
    return {
      reply: `I encountered a momentary issue connecting with the AI intelligence service (${error?.message || 'Network Timeout'}).\n\nHowever, your cycle data remains safe:\n* **Current Phase**: ${context?.forecast?.currentPhase || 'Calibrating'}\n* **Cycle Day**: Day ${context?.forecast?.currentCycleDay || 'N/A'}\n* **Next Period**: ${context?.forecast?.nextCycleDate || 'Calculating'}`,
      suggestedFollowUps: [
        "Tell me about my cycle phase",
        "How do I export my health report?",
        "What are common symptoms in this phase?"
      ],
      contextSnapshot,
    };
  }
}

