import { createInitialSteps } from "./agents";
import { requestJsonWithRetry } from "./ai-json";
import { callOpenAiCompatibleJson } from "./model-client";
import { buildWorkflowMessages } from "./prompts";
import { workflowResultsSchema } from "./schemas";
import {
  evaluateCostPolicy,
  resolveCostMode,
  type ProviderBillingOwner,
  type QuotaWindow,
} from "@/lib/cost/policy";
import { getProject, updateProject } from "@/lib/storage/project-store";
import type { AgentStep, Project, RunEvent, WorkflowResults } from "./types";
import { buildAdaptationDecision, countNarrativeNodes, normalizeCreativeBrief } from "./brief";

const DEFAULT_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat";

function runtimeModelConfig(project: Project) {
  return {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: project.modelConfig.baseUrl || process.env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
    model: project.modelConfig.model || process.env.OPENAI_MODEL || DEFAULT_MODEL,
  };
}

function providerBillingOwner(value: string | undefined): ProviderBillingOwner {
  return value === "project" || value === "user" || value === "institution" ? value : "none";
}

function providerQuotaFromEnvironment(): QuotaWindow | undefined {
  const limit = process.env.AI_PROVIDER_QUOTA_LIMIT;
  const used = process.env.AI_PROVIDER_QUOTA_USED;
  const resetsAt = process.env.AI_PROVIDER_QUOTA_RESET_AT;

  if (limit === undefined || used === undefined || resetsAt === undefined) return undefined;

  return {
    limitUnits: Number(limit),
    usedUnits: Number(used),
    resetsAt,
  };
}

function markAllSteps(steps: AgentStep[], status: AgentStep["status"], error?: string): AgentStep[] {
  const now = new Date().toISOString();
  return steps.map((step) => ({
      ...step,
      status,
      progress: status === "completed" ? 100 : 50,
      startedAt: status === "running" ? now : step.startedAt,
      completedAt: status === "completed" ? now : step.completedAt,
      error,
    }));
}

export async function generateWorkflowResults(project: Project): Promise<WorkflowResults> {
  const config = runtimeModelConfig(project);
  const costDecision = evaluateCostPolicy({
    mode: resolveCostMode(process.env.COST_MODE),
    request: { capability: "ai_text", inputCharacters: project.sourceText.length },
    billingOwner: providerBillingOwner(process.env.AI_PROVIDER_OWNERSHIP),
    providerConnected: Boolean(config.apiKey),
    quota: providerQuotaFromEnvironment(),
  });

  if (!config.apiKey || !costDecision.allowed) {
    throw new Error("AI_PROVIDER_UNAVAILABLE：请先连接可用的用户或机构生成服务。");
  }

  const apiKey = config.apiKey;

  const result = await requestJsonWithRetry<WorkflowResults>(
    () =>
      callOpenAiCompatibleJson({
        apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
        messages: buildWorkflowMessages(project),
      }),
    {} as WorkflowResults,
  );
  if (result.usedFallback) {
    throw new Error(`AI_PROVIDER_INVALID_RESPONSE：${result.error ?? "模型未返回有效 JSON"}`);
  }

  const parsed = workflowResultsSchema.safeParse(result.value);
  if (!parsed.success) {
    throw new Error("AI_PROVIDER_SCHEMA_MISMATCH：模型输出未通过结构校验。");
  }
  const creativeBrief = normalizeCreativeBrief(project.creativeBrief);
  const totalNodes = countNarrativeNodes(project.sourceText);
  return {
    ...parsed.data,
    adaptationDecision: buildAdaptationDecision(
      creativeBrief,
      totalNodes,
      Math.min(totalNodes, creativeBrief.episodeMinutes * 4, 12),
    ),
  };
}

export async function* runProjectWorkflow(projectId: string): AsyncGenerator<RunEvent> {
  const existing = await getProject(projectId);
  if (!existing) {
    yield { type: "error", error: `Project not found: ${projectId}` };
    return;
  }

  let project = await updateProject(projectId, {
    status: "running",
    error: undefined,
    steps: createInitialSteps(),
  });

  try {
    const runningSteps = markAllSteps(project.steps, "running");
    project = await updateProject(projectId, { steps: runningSteps, status: "running" });
    for (const step of project.steps) {
      yield { type: "step", step, project };
    }

    const results = await generateWorkflowResults(project);
    const completedSteps = markAllSteps(project.steps, "completed");
    project = await updateProject(projectId, {
      status: "completed",
      steps: completedSteps,
      results,
    });
    for (const step of project.steps) {
      yield { type: "step", step, project };
    }
    yield { type: "complete", project };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    project = await updateProject(projectId, {
      status: "failed",
      error: message,
      steps: markAllSteps(project.steps, "failed", message),
    });
    yield { type: "error", error: message, project };
  }
}
