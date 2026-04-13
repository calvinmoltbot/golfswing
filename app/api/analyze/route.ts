import { NextResponse } from 'next/server';
import { swingAnalysisRequestSchema, type SwingAnalysisResponse } from '@/types/analysis';
import { buildSwingAnalysisMessages } from '@/prompts/swing-analysis';
import { callOpenRouterJson } from '@/lib/openrouter';
import { extractPoseMetrics } from '@/lib/pose';
import { detectSwingPhases } from '@/lib/phases';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = swingAnalysisRequestSchema.parse(body);

    const metrics = await extractPoseMetrics(parsed.videoUrl);
    const phases = detectSwingPhases(metrics);

    const messages = buildSwingAnalysisMessages({
      request: parsed,
      metrics,
      phases
    });

    const result = await callOpenRouterJson<SwingAnalysisResponse>({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro',
      messages
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
