import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInitialSteps } from "@/lib/workflow/agents";
import type { CreateProjectInput, Project } from "@/lib/workflow/types";

type StoreOptions = {
  storageRoot?: string;
};

let lastTimestamp = 0;

function nowIso(): string {
  const timestamp = Math.max(Date.now(), lastTimestamp + 1);
  lastTimestamp = timestamp;
  return new Date(timestamp).toISOString();
}

export function resolveProjectStorageRoot(options?: StoreOptions): string {
  return options?.storageRoot ?? join(/* turbopackIgnore: true */ process.cwd(), "data", "projects");
}

function root(options?: StoreOptions): string {
  return resolveProjectStorageRoot(options);
}

function projectPath(id: string, options?: StoreOptions): string {
  return join(root(options), `${id}.json`);
}

async function ensureRoot(options?: StoreOptions): Promise<void> {
  await mkdir(/* turbopackIgnore: true */ root(options), { recursive: true });
}

async function writeProject(project: Project, options?: StoreOptions): Promise<Project> {
  await ensureRoot(options);
  await writeFile(
    /* turbopackIgnore: true */ projectPath(project.id, options),
    JSON.stringify(project, null, 2),
    "utf8",
  );
  return project;
}

export async function createProject(input: CreateProjectInput, options?: StoreOptions): Promise<Project> {
  const timestamp = nowIso();
  const project: Project = {
    id: crypto.randomUUID(),
    title: input.title.trim() || "未命名项目",
    sourceText: input.sourceText.trim(),
    status: "draft",
    modelConfig: {
      baseUrl: input.modelConfig?.baseUrl,
      model: input.modelConfig?.model,
    },
    creativeBrief: input.creativeBrief,
    steps: createInitialSteps(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return writeProject(project, options);
}

export async function getProject(id: string, options?: StoreOptions): Promise<Project | null> {
  try {
    const content = await readFile(/* turbopackIgnore: true */ projectPath(id, options), "utf8");
    return JSON.parse(content) as Project;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function listProjects(options?: StoreOptions): Promise<Project[]> {
  await ensureRoot(options);
  const files = await readdir(/* turbopackIgnore: true */ root(options));
  const projects = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(
        async (file) =>
          JSON.parse(await readFile(/* turbopackIgnore: true */ join(root(options), file), "utf8")) as Project,
      ),
  );

  return projects.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>,
  options?: StoreOptions,
): Promise<Project> {
  const existing = await getProject(id, options);
  if (!existing) {
    throw new Error(`Project not found: ${id}`);
  }

  const updated: Project = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: nowIso(),
  };

  return writeProject(updated, options);
}
