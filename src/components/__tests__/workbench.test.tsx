// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Workbench } from "../workbench";

function makeStorage() {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => entries.delete(key),
    setItem: (key: string, value: string) => entries.set(key, String(value)),
  } satisfies Storage;
}

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: makeStorage(),
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:story-delivery"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Workbench", () => {
  it("opens directly on a complete story decision brief", () => {
    render(<Workbench />);

    expect(screen.getByRole("link", { name: "创剧 AI 首页" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "让每个改编选择，都有原文依据。" }),
    ).toBeInTheDocument();
    for (const label of [
      "项目名称",
      "故事类型",
      "目标观众",
      "单集时长",
      "叙事节奏",
      "情绪底色",
      "叙事视角",
      "改编重点",
      "制作限制",
      "原文片段",
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "生成创作路线" })).toBeEnabled();
    expect(screen.queryByText(String.fromCodePoint(0x767b, 0x5f55))).not.toBeInTheDocument();
  });

  it("makes story attributes visibly change the recommended route", async () => {
    const user = userEvent.setup();
    render(<Workbench />);

    await user.selectOptions(screen.getByLabelText("故事类型"), "都市情感");
    await user.selectOptions(screen.getByLabelText("目标观众"), "情感共鸣");
    await user.selectOptions(screen.getByLabelText("叙事节奏"), "留白呼吸");
    await user.selectOptions(screen.getByLabelText("情绪底色"), "温暖");
    await user.selectOptions(screen.getByLabelText("改编重点"), "人物关系");
    await user.click(screen.getByRole("button", { name: "生成创作路线" }));

    const recommended = screen.getByTestId("candidate-relationship-echo");
    expect(recommended).toHaveAttribute("data-recommended", "true");
    expect(within(recommended).getByText("关系回声线")).toBeInTheDocument();
    expect(within(recommended).getByText(/都市情感类型/)).toBeInTheDocument();
    expect(screen.getAllByText("得到").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("放弃").length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByTestId("candidate-scene")).toHaveLength(4);
  });

  it("completes selection, editing, real download, and feedback-driven next round", async () => {
    const user = userEvent.setup();
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    render(<Workbench />);

    await user.click(screen.getByRole("button", { name: "生成创作路线" }));
    await user.click(screen.getByRole("button", { name: "选择 十秒失衡线" }));
    await user.click(screen.getByRole("button", { name: "确认路线并生成交付" }));

    expect(screen.getByRole("heading", { name: "可编辑交付稿" })).toBeInTheDocument();
    const storyboard = screen.getByRole("region", { name: "路线分镜参照" });
    expect(within(storyboard).getAllByRole("img")).toHaveLength(5);
    expect(
      within(storyboard)
        .getAllByRole("img")
        .every((image) => image.getAttribute("src")?.includes("story-scenes")),
    ).toBe(true);
    const logline = screen.getByRole("textbox", { name: "一句话故事" });
    fireEvent.change(logline, { target: { value: "林澈必须决定是否公开父亲留下的未来信。" } });
    await user.click(screen.getByRole("button", { name: "下载 Markdown" }));
    expect(anchorClick).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("radio", { name: "1 分" }));
    await user.selectOptions(screen.getByLabelText("最需要改变的地方"), "人物动机偏弱");
    await user.type(
      screen.getByLabelText("观察记录"),
      "试读者只记得信，没有说出林澈为什么回去。",
    );
    await user.click(screen.getByRole("button", { name: "保存反馈并进入下一轮" }));

    expect(screen.getAllByText("下一轮推荐已改变").length).toBeGreaterThan(0);
    expect(screen.getByTestId("candidate-relationship-echo")).toHaveAttribute(
      "data-recommended",
      "true",
    );
    expect(screen.getAllByText(/上轮反馈/).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem("chuangju.story-studio.v2")).toContain("人物动机偏弱");
  });

  it("restores the local feedback round after a refresh", async () => {
    const user = userEvent.setup();
    const first = render(<Workbench />);

    await user.click(screen.getByRole("button", { name: "生成创作路线" }));
    await user.click(screen.getByRole("button", { name: "选择 十秒失衡线" }));
    await user.click(screen.getByRole("button", { name: "确认路线并生成交付" }));
    await user.selectOptions(screen.getByLabelText("最需要改变的地方"), "拍摄负担偏高");
    await user.type(screen.getByLabelText("观察记录"), "夜景切换次数超出当前排期。");
    await user.click(screen.getByRole("button", { name: "保存反馈并进入下一轮" }));

    first.unmount();
    render(<Workbench />);

    expect((await screen.findAllByText("已恢复第 2 轮创作判断")).length).toBeGreaterThan(0);
    expect(screen.getByTestId("candidate-single-location")).toHaveAttribute(
      "data-recommended",
      "true",
    );
  });
});
