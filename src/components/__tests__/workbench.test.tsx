// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

  it("generates a complete browser demo when the project API is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => ({ projects: [] }),
        })
        .mockRejectedValueOnce(new Error("network unavailable")),
    );

    render(<Workbench />);

    fireEvent.change(screen.getByPlaceholderText("粘贴小说文本内容..."), {
      target: {
        value:
          "雨夜，林澈回到旧城，发现父亲留下的录音。好友阿岚提醒他别追查，但他决定去废弃剧院寻找真相。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "开始改剧" }));

    await waitFor(() => {
      expect(screen.getByText("已生成本地演示结果")).toBeInTheDocument();
    });
    expect(screen.getByText("悬疑剧情短剧")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MD" })).not.toBeDisabled();
  });
});
