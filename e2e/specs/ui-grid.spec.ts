import { expect, test, type Locator } from "@playwright/test";

async function renderedColumnCount(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const columns = getComputedStyle(element).gridTemplateColumns.trim();
    return columns ? columns.split(/\s+/).length : 0;
  });
}

test.describe("页面响应式网格", () => {
  test("工作台随内容宽度切换 12/8/4 栏且不产生页面横向滚动", async ({ page }) => {
    await page.setViewportSize({ width: 1240, height: 820 });
    await page.goto("/");

    const grid = page.locator('[data-page-grid="true"]').first();
    await expect(grid).toBeVisible();
    expect(await renderedColumnCount(grid)).toBe(12);

    await page.setViewportSize({ width: 1180, height: 760 });
    expect(await renderedColumnCount(grid)).toBe(8);

    await page.setViewportSize({ width: 960, height: 680 });
    expect(await renderedColumnCount(grid)).toBe(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });

  test("SectionShell 页面可显式采用统一宽内容容器", async ({ page }) => {
    await page.setViewportSize({ width: 1240, height: 820 });
    await page.goto("/memory");

    const frame = page.locator('[data-page-frame="true"] [data-size="wide"]');
    await expect(frame).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  });
});
