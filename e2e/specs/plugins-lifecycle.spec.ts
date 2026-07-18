import { pathToFileURL } from "node:url";
import { existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import {
  CORE_DIR,
  PLUGIN_IMPORT_MARKER,
  PLUGIN_SOURCE_DIR,
  VENV_PY,
  coreEnv,
} from "../harness/config.mjs";

const PLUGIN_NAME = "e2e-installed-plugin";

function newCoreProcessHasPluginTool(): boolean {
  const result = spawnSync(
    VENV_PY,
    [
      "-c",
      [
        "from hermes_cli.plugins import PluginManager",
        "from tools.registry import registry",
        "PluginManager().discover_and_load()",
        "raise SystemExit(0 if registry.get_entry('e2e_echo') else 1)",
      ].join("; "),
    ],
    { cwd: CORE_DIR, env: coreEnv(), encoding: "utf8" },
  );
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(`plugin probe failed: ${result.stderr || result.stdout}`);
  }
  return result.status === 0;
}

test("Plugins page manages a local Git plugin through its full lifecycle", async ({ page }) => {
  await page.goto("/plugins");

  await expect(page.getByRole("heading", { name: "插件管理" })).toBeVisible();
  await expect(page.getByText(/只对后续新会话生效/)).toBeVisible();

  await page.getByLabel("插件 Git 来源").fill(pathToFileURL(PLUGIN_SOURCE_DIR).href);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "安装", exact: true }).click();
  await expect(page.getByText(`已安装 ${PLUGIN_NAME}。`)).toBeVisible();
  expect(existsSync(PLUGIN_IMPORT_MARKER)).toBe(false);
  expect(newCoreProcessHasPluginTool()).toBe(true);
  expect(existsSync(PLUGIN_IMPORT_MARKER)).toBe(true);

  const search = page.getByPlaceholder("搜索名称、描述、工具、Hook 或环境变量");
  await search.fill(PLUGIN_NAME);
  const card = page.locator("article").filter({ hasText: PLUGIN_NAME });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("已启用", { exact: true })).toBeVisible();
  await expect(card.getByText("e2e_echo", { exact: true })).toBeVisible();
  await expect(card.getByText("E2E_PLUGIN_TOKEN", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: "配置环境变量" })).toHaveAttribute("href", "/env");

  await card.getByRole("button", { name: "更新" }).click();
  await expect(card.getByRole("button", { name: "更新" })).toBeEnabled();

  await card.getByRole("button", { name: "禁用", exact: true }).click();
  await expect(card.getByText("已禁用", { exact: true })).toBeVisible();
  rmSync(PLUGIN_IMPORT_MARKER, { force: true });
  expect(newCoreProcessHasPluginTool()).toBe(false);
  expect(existsSync(PLUGIN_IMPORT_MARKER)).toBe(false);
  await card.getByRole("button", { name: "启用", exact: true }).click();
  await expect(card.getByText("已启用", { exact: true })).toBeVisible();
  expect(newCoreProcessHasPluginTool()).toBe(true);

  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "卸载" }).click();
  await expect(card).toHaveCount(0);
  await expect(page.getByText("没有符合当前筛选条件的插件。")).toBeVisible();
});

test("Provider-managed plugins stay read-only and link to their settings", async ({ page }) => {
  await page.goto("/plugins");
  await page.getByPlaceholder("搜索名称、描述、工具、Hook 或环境变量").fill("memory/hindsight");

  const card = page.locator("article").filter({ hasText: "memory/hindsight" });
  await expect(card).toHaveCount(1);
  await expect(card.getByText("Provider 管理", { exact: true }).first()).toBeVisible();
  await expect(card.getByRole("button", { name: "Provider 管理" })).toBeDisabled();
  await expect(card.getByRole("link", { name: "前往设置" })).toHaveAttribute("href", "/memory");
});

test("older Core without Plugins Hub shows an upgrade prompt", async ({ page }) => {
  await page.route("**/api/dashboard/plugins/hub", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: '{"detail":"Not Found"}' }),
  );
  await page.goto("/plugins");

  await expect(page.getByRole("heading", { name: "当前内核尚未提供 Plugins Hub" })).toBeVisible();
  await expect(page.getByRole("link", { name: "查看内核版本" })).toHaveAttribute("href", "/kernel");
});
