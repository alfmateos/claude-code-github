import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// getToolLabel unit tests

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/App.jsx" })).toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/App.jsx" })).toBe("Editing App.jsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/utils.ts" })).toBe("Viewing utils.ts");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/src/Old.tsx", new_path: "/src/New.tsx" })).toBe("Renaming Old.tsx to New.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/src/Unused.tsx" })).toBe("Deleting Unused.tsx");
});

test("getToolLabel: unknown tool falls back to tool name", () => {
  expect(getToolLabel("unknown_tool", { path: "/src/Foo.tsx" })).toBe("unknown_tool");
});

// ToolInvocationBadge rendering tests

test("ToolInvocationBadge shows friendly label when done", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Card.tsx" },
    state: "result",
    result: "Success",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Creating Card.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows friendly label while loading", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/src/App.jsx" },
    state: "call",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Editing App.jsx")).toBeDefined();
});

test("ToolInvocationBadge shows green dot when done", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "3",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/Button.tsx" },
    state: "result",
    result: "Done",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge shows spinner while loading", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "4",
    toolName: "file_manager",
    args: { command: "delete", path: "/src/Old.tsx" },
    state: "call",
  };

  const { container } = render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge: file_manager rename while loading", () => {
  const toolInvocation: ToolInvocation = {
    toolCallId: "5",
    toolName: "file_manager",
    args: { command: "rename", path: "/src/Foo.tsx", new_path: "/src/Bar.tsx" },
    state: "call",
  };

  render(<ToolInvocationBadge toolInvocation={toolInvocation} />);

  expect(screen.getByText("Renaming Foo.tsx to Bar.tsx")).toBeDefined();
});
