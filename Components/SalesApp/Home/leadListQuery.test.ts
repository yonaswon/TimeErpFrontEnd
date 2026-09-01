import { describe, expect, it } from "vitest";

import { buildLeadListParams } from "./leadListQuery";

const baseOptions = {
  activeTab: "your",
  filters: { dateRange: "", pipelineStage: "" },
  page: 1,
  pageSize: 20,
  search: "",
  userId: 17,
};

describe("buildLeadListParams", () => {
  it("includes pagination and the current salesperson scope", () => {
    const params = buildLeadListParams(baseOptions);

    expect(params.get("p")).toBe("1");
    expect(params.get("page_size")).toBe("20");
    expect(params.get("sales")).toBe("17");
  });

  it("sends trimmed server-side search on every page", () => {
    const params = buildLeadListParams({
      ...baseOptions,
      page: 3,
      search: "  0911 234 567  ",
    });

    expect(params.get("p")).toBe("3");
    expect(params.get("search")).toBe("0911 234 567");
  });

  it("combines pipeline and date filters with search", () => {
    const params = buildLeadListParams({
      ...baseOptions,
      filters: { dateRange: "last_7_days", pipelineStage: "MOCKUP_RETURNED" },
      search: "Abebe",
      now: new Date(2026, 8, 1, 10, 0, 0),
    });

    expect(params.get("created_after")).toBe("2026-08-25");
    expect(params.get("pipeline_stage_code")).toBe("MOCKUP_RETURNED");
    expect(params.get("search")).toBe("Abebe");
  });

  it("does not send a salesperson filter for the everyone tab", () => {
    const params = buildLeadListParams({ ...baseOptions, activeTab: "all" });

    expect(params.has("sales")).toBe(false);
  });
});
