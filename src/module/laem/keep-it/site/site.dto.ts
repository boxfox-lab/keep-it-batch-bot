export interface SiteDTO {
  id: number;
  url: string;
  title: string;
  siteName: string;
  description: string;
  html: string;
  lang?: string;
}

export interface SiteSummary {
  main_points: string[];
  qa: Array<{
    question: string;
    answer: string;
  }>;
  summary: string;
  reading_time: number;
}

export interface BatchJobResponse {
  id: string;
  created_at: number;
  status: string;
  input_file_id: string;
  output_file_id?: string;
}

export interface SiteSummaryResponse {
  main_points: string[];
  qa: {
    question: string;
    answer: string;
  }[];
  summary: string;
  reading_time: number;
}

export interface BatchResult {
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
          function_call: {
            name: string;
            arguments: string;
          };
        };
        finish_reason: string;
      }>;
      created: number;
      model: string;
    };
    service_tier: 'default';
    system_fingerprint: null;
  };
}
