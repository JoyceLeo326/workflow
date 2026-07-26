import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createProject,
  getProject,
  listProjects,
  resolveProjectStorageRoot,
  updateProject,
} from "@/lib/storage/project-store";
import { buildFallbackWorkflowResult } from "../fallback";

let storageRoot: string;

beforeEach(async () => {
  storageRoot = await mkdtemp(join(tmpdir(), "novel-workflow-"));
});

afterEach(async () => {
  await rm(storageRoot, { force: true, recursive: true });
});

describe("project-store", () => {
  it("keeps the default storage root statically scoped for production tracing", () => {
    const previous = process.env.PROJECT_STORAGE_ROOT;
    process.env.PROJECT_STORAGE_ROOT = join(tmpdir(), "ignored-project-root");

    try {
      expect(resolveProjectStorageRoot()).toBe(join(process.cwd(), "data", "projects"));
      expect(resolveProjectStorageRoot({ storageRoot })).toBe(storageRoot);
    } finally {
      if (previous === undefined) {
        delete process.env.PROJECT_STORAGE_ROOT;
      } else {
        process.env.PROJECT_STORAGE_ROOT = previous;
      }
    }
  });

  it("persists created projects and returns them newest first", async () => {
    const first = await createProject(
      { title: "第一个项目", sourceText: "第一段小说文本" },
      { storageRoot },
    );
    const second = await createProject(
      { title: "第二个项目", sourceText: "第二段小说文本" },
      { storageRoot },
    );

    const projects = await listProjects({ storageRoot });

    expect(projects.map((project) => project.id)).toEqual([second.id, first.id]);
    expect(await getProject(first.id, { storageRoot })).toMatchObject({
      title: "第一个项目",
      sourceText: "第一段小说文本",
      status: "draft",
    });
  });

  it("updates workflow status and results", async () => {
    const project = await createProject(
      { title: "雨夜归途", sourceText: "雨夜，林澈回到旧城。" },
      { storageRoot },
    );
    const results = buildFallbackWorkflowResult({
      title: project.title,
      sourceText: project.sourceText,
    });

    const updated = await updateProject(
      project.id,
      {
        status: "completed",
        results,
      },
      { storageRoot },
    );

    expect(updated.status).toBe("completed");
    expect(updated.results?.shots).toHaveLength(1);
    expect((await getProject(project.id, { storageRoot }))?.results?.timeline.items).toHaveLength(1);
  });
});
