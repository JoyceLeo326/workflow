import { createInitialSteps } from "./agents";
import { requestJsonWithRetry } from "./ai-json";
import { buildFallbackWorkflowResult } from "./fallback";
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

function markStep(steps: AgentStep[], index: number, status: AgentStep["status"]): AgentStep[] {
  const now = new Date().toISOString();
  return steps.map((step, stepIndex) => {
    if (stepIndex !== index) {
      return step;
    }

    return {
      ...step,
      status,
      progress: status === "completed" ? 100 : 50,
      startedAt: status === "running" ? now : step.startedAt,
      completedAt: status === "completed" ? now : step.completedAt,
    };
  });
}

async function pause(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateWorkflowResults(project: Project): Promise<WorkflowResults> {
  const fallback = buildFallbackWorkflowResult({
    title: project.title,
    sourceText: project.sourceText,
  });
  const config = runtimeModelConfig(project);
  const costDecision = evaluateCostPolicy({
    mode: resolveCostMode(process.env.COST_MODE),
    request: { capability: "ai_text", inputCharacters: project.sourceText.length },
    billingOwner: providerBillingOwner(process.env.AI_PROVIDER_OWNERSHIP),
    providerConnected: Boolean(config.apiKey),
    quota: providerQuotaFromEnvironment(),
  });

  if (!config.apiKey || !costDecision.allowed) {
    return fallback;
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
    fallback,
  );

  const parsed = workflowResultsSchema.safeParse(result.value);
  return parsed.success ? parsed.data : fallback;
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
    for (let index = 0; index < project.steps.length; index += 1) {
      const runningSteps = markStep(project.steps, index, "running");
      project = await updateProject(projectId, { steps: runningSteps, status: "running" });
      yield { type: "step", step: project.steps[index], project };

      if (index === project.steps.length - 1) {
        const results = await generateWorkflowResults(project);
        const completedSteps = markStep(project.steps, index, "completed");
        project = await updateProject(projectId, {
          status: "completed",
          steps: completedSteps,
          results,
        });
      } else {
        await pause(120);
        const completedSteps = markStep(project.steps, index, "completed");
        project = await updateProject(projectId, { steps: completedSteps });
      }

      yield { type: "step", step: project.steps[index], project };
    }

    yield { type: "complete", project };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    project = await updateProject(projectId, {
      status: "failed",
      error: message,
    });
    yield { type: "error", error: message, project };
  }
}
