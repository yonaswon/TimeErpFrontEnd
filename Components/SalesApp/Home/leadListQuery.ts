export interface LeadListFilters {
  dateRange: string;
  pipelineStage: string;
}

interface LeadListQueryOptions {
  activeTab: string;
  filters: LeadListFilters;
  page: number;
  pageSize: number;
  search: string;
  userId: number | null;
  now?: Date;
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildLeadListParams = ({
  activeTab,
  filters,
  page,
  pageSize,
  search,
  userId,
  now = new Date(),
}: LeadListQueryOptions) => {
  const params = new URLSearchParams({
    ordering: "-created_at",
    p: String(page),
    page_size: String(pageSize),
  });

  if (activeTab === "your" && userId) params.set("sales", String(userId));
  if (activeTab === "converted") params.set("status", "CONVERTED");

  if (filters.dateRange === "today") {
    params.set("created_today", "true");
  } else if (filters.dateRange === "yesterday") {
    params.set("created_yesterday", "true");
  } else if (filters.dateRange === "last_7_days") {
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    params.set("created_after", formatLocalDate(sevenDaysAgo));
  }

  if (filters.pipelineStage) {
    params.set("pipeline_stage_code", filters.pipelineStage);
  }

  const normalizedSearch = search.trim();
  if (normalizedSearch) params.set("search", normalizedSearch);

  return params;
};

