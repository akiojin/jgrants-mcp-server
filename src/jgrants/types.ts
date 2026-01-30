export type SubsidyListItem = {
  id?: string;
  name?: string;
  acceptance_start_datetime?: string;
  acceptance_end_datetime?: string;
  target_area_search?: string;
  [key: string]: unknown;
};

export type SubsidiesResponse = {
  status?: number;
  message?: string;
  result?: {
    count?: number;
    total?: number;
    offset?: number;
    subsidies?: SubsidyListItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type Attachment = {
  name: string;
  data: string;
  category?: string;
  [key: string]: unknown;
};

export type SubsidyDetail = {
  id?: string;
  name?: string;
  attachments?: Attachment[];
  [key: string]: unknown;
};

export type SubsidyDetailResponse = {
  status?: number;
  message?: string;
  result?: SubsidyDetail;
  [key: string]: unknown;
};
