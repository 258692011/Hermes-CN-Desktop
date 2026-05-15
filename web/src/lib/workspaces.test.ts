import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  normalizeWorkspacePath,
  readSessionWorkspaceMap,
  readWorkspaceProjects,
  rememberSessionWorkspace,
  rememberWorkspaceProject,
  removeWorkspaceProject,
  workspaceNameFromPath,
} from "./workspaces";

describe("workspace persistence helpers", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it("normalizes paths and derives project names", () => {
    expect(normalizeWorkspacePath(" /Users/claw/Project/ ")).toBe("/Users/claw/Project");
    expect(workspaceNameFromPath("/Users/claw/Project")).toBe("Project");
  });

  it("stores workspace projects without duplicating equivalent paths", () => {
    rememberWorkspaceProject("/Users/claw/Project/");
    rememberWorkspaceProject("/Users/claw/Project", "Renamed");

    expect(readWorkspaceProjects()).toEqual([
      expect.objectContaining({
        path: "/Users/claw/Project",
        name: "Renamed",
      }),
    ]);
  });

  it("links sessions to workspaces and registers the project", () => {
    rememberSessionWorkspace("session-1", "/Users/claw/Project");

    expect(readSessionWorkspaceMap()).toEqual({
      "session-1": "/Users/claw/Project",
    });
    expect(readWorkspaceProjects()[0]).toMatchObject({
      path: "/Users/claw/Project",
      name: "Project",
    });
  });

  it("removes a workspace project and unlinks its sessions", () => {
    rememberSessionWorkspace("session-1", "/Users/claw/Project");
    rememberSessionWorkspace("session-2", "/Users/claw/Other");

    removeWorkspaceProject("/Users/claw/Project/");

    expect(readWorkspaceProjects()).toEqual([
      expect.objectContaining({ path: "/Users/claw/Other" }),
    ]);
    expect(readSessionWorkspaceMap()).toEqual({
      "session-2": "/Users/claw/Other",
    });
  });
});
