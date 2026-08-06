// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Workbench } from "../workbench";

beforeEach(() => {
  const entries = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
  };
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mockEmptyProjects() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => ({ projects: [] }),
    }),
  );
}

describe("Workbench", () => {
  it("opens directly on the usable production desk without an account gate", () => {
    mockEmptyProjects();

    render(<Workbench />);

    expect(screen.getByText("创剧AI")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "把原著变成可执行的短剧方案" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("粘贴小说文本内容...")).toBeInTheDocument();
    expect(screen.getByText("AI 制作管线")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "剧本结构" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "时序草案" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "载入示例" })).toBeInTheDocument();
    expect(screen.getByText("直接创作 · 本机保存")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "整理结构草案" })).toBeDisabled();

    for (const internalCopy of [
      "零成本模式",
      "无自动扣费",
      "合规复刻矩阵",
      "移动端已适配",
      "本地 JSON 存储",
      "本地规则冒充 AI 生成",
    ]) {
      expect(screen.queryByText(internalCopy)).not.toBeInTheDocument();
    }
  });

  it("loads a polished sample script for quick mobile trials", () => {
    mockEmptyProjects();

    render(<Workbench />);

    fireEvent.click(screen.getByRole("button", { name: "载入示例" }));

    const textarea = screen.getByPlaceholderText("粘贴小说文本内容...") as HTMLTextAreaElement;
    expect(textarea.value).toContain("废弃剧院");
    expect(screen.getByRole("button", { name: "整理结构草案" })).toBeEnabled();
  });

  it("generates a truthful local structure draft without marking AI steps as completed", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: "整理结构草案" }));

    await waitFor(() => {
      expect(screen.getAllByText("结构草案已生成").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("待确认类型")).toBeInTheDocument();
    expect(screen.getAllByText("待连接").length).toBeGreaterThan(0);
    expect(screen.queryByText("7/7")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MD" })).not.toBeDisabled();
  });

  it("turns role, audience, priority, and duration into a visible saved adaptation decision", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    render(<Workbench />);

    fireEvent.change(screen.getByLabelText("主创称呼"), { target: { value: "许澄" } });
    fireEvent.change(screen.getByLabelText("我的角色"), { target: { value: "制片统筹" } });
    fireEvent.change(screen.getByLabelText("目标观众"), { target: { value: "悬疑追更" } });
    fireEvent.change(screen.getByLabelText("本轮优先"), { target: { value: "低成本拍摄" } });
    fireEvent.change(screen.getByLabelText("单集时长"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("交付时间"), { target: { value: "周五 18:00" } });
    fireEvent.change(screen.getByPlaceholderText("粘贴小说文本内容..."), {
      target: {
        value:
          "雨夜，林澈回到旧城。父亲的录音突然响起。阿岚劝他离开。林澈仍走进废弃剧院。旧灯亮起。黑衣人挡住去路。",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "整理结构草案" }));

    expect(await screen.findByText("许澄 · 制片统筹")).toBeInTheDocument();
    expect(screen.getByText(/原著当前 6 个叙事节点需压缩进 1 分钟/)).toBeInTheDocument();
    expect(screen.getAllByText(/优先合并重复地点/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/秘密揭示后置/).length).toBeGreaterThan(0);
    expect(screen.getByText("制作可行性")).toBeInTheDocument();

    const saved = window.localStorage.getItem("chuangju.projects.v1") ?? "";
    expect(saved).toContain('"targetAudience":"悬疑追更"');
    expect(saved).toContain('"priority":"低成本拍摄"');
    expect(saved).toContain('"episodeMinutes":1');
  });

  it("restores locally created projects after a refresh without requiring an account", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network unavailable")),
    );

    const firstRender = render(<Workbench />);
    fireEvent.change(screen.getByPlaceholderText("粘贴小说文本内容..."), {
      target: { value: "第一章 雨夜。林澈回到旧城。录音里出现一个陌生名字。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "整理结构草案" }));

    await waitFor(() => {
      expect(window.localStorage.getItem("chuangju.projects.v1")).toContain("雨夜归途");
    });

    firstRender.unmount();
    render(<Workbench />);

    await waitFor(() => {
      expect(screen.getByText("最近项目")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /雨夜归途/ })).toBeInTheDocument();
  });

  it("turns the current project into an editable Story Bible and records restorable versions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    render(<Workbench />);

    fireEvent.change(screen.getByPlaceholderText("粘贴小说文本内容..."), {
      target: { value: "第一章 雨夜。林澈回到旧城。录音里出现一个陌生名字。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "整理结构草案" }));
    fireEvent.click(screen.getByRole("button", { name: "建立可编辑稿" }));

    expect(screen.getByRole("button", { name: "Story Bible" })).toBeInTheDocument();
    const logline = screen.getByRole("textbox", { name: "一句话故事" });
    fireEvent.change(logline, { target: { value: "林澈循着录音回到旧城。" } });
    fireEvent.change(screen.getByRole("textbox", { name: "版本说明" }), {
      target: { value: "完善故事梗概" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存版本" }));

    expect(screen.getByText("版本 v2 已保存")).toBeInTheDocument();
    expect(screen.getByText("v2 · 完善故事梗概")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "恢复版本 2" })).toBeInTheDocument();
  });

  it("keeps the BYOK key in page memory instead of project storage", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network unavailable")));
    render(<Workbench />);

    fireEvent.change(screen.getByPlaceholderText("粘贴小说文本内容..."), {
      target: { value: "雨夜。林澈回到旧城。" },
    });
    fireEvent.click(screen.getByRole("button", { name: "整理结构草案" }));
    fireEvent.click(screen.getByRole("button", { name: /生成服务/ }));
    fireEvent.change(screen.getByLabelText("API Key"), {
      target: { value: "test-session-secret-key" },
    });

    expect(screen.getByRole("button", { name: "生成剧集方案" })).toBeEnabled();
    expect(window.localStorage.getItem("chuangju.projects.v1")).not.toContain(
      "test-session-secret-key",
    );
  });

  it("supports keyboard activation for provider controls", async () => {
    mockEmptyProjects();
    const user = userEvent.setup();
    render(<Workbench />);

    const provider = screen.getByRole("button", { name: /生成服务/ });
    provider.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByLabelText("HTTPS 服务地址")).toBeVisible();
    expect(screen.getByLabelText("API Key")).toBeVisible();
  });
});
