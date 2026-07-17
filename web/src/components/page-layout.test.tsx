import ReactDOMServer from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageFrame, PageGrid } from "@hermes/shared-ui";

describe("PageFrame", () => {
  it("renders the selected content width and responsive grid contract", () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PageFrame size="readable" className="viewport" frameClassName="content">
        <PageGrid className="dashboard-grid">
          <section>内容</section>
        </PageGrid>
      </PageFrame>,
    );

    expect(html).toContain('data-page-frame="true"');
    expect(html).toContain('data-size="readable"');
    expect(html).toContain('data-page-grid="true"');
    expect(html).toContain("viewport");
    expect(html).toContain("content");
    expect(html).toContain("dashboard-grid");
  });
});
