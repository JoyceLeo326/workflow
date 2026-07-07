// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Workbench } from "../workbench";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Workbench", () => {
  it("renders the workstation navigation, input area, agent lane, and result tabs", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ projects: [] }),
      }),
    );

    render(<Workbench />);

    expect(screen.getByText("创剧AI")).toBeInTheDocument();
    expect(screen.getAllByText("小说改剧").length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText("粘贴小说文本内容...")).toBeInTheDocument();
    expect(screen.getByText("Agent 处理管线")).toBeInTheDocument();
    expect(screen.getByText("合规复刻矩阵")).toBeInTheDocument();
    expect(screen.getByText("langchain-ai/langgraph")).toBeInTheDocument();
    expect(screen.getByText("run-llama/llama_index")).toBeInTheDocument();
    expect(screen.getByText("cline/cline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "剧本结构" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "成片预演" })).toBeInTheDocument();
  });
});
