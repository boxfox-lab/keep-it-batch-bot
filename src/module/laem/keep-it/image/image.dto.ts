export interface BatchJobResponse {
  id: string;
  status: string;
  created_at: number;
  completed_at?: number;
  total_tokens?: number;
  error?: {
    code: string;
    message: string;
  };
}

export interface ImageSummaryResponse {
  main_points: string[];
  qa: { question: string; answer: string }[];
  summary: string;
}

export interface BatchResult {
  custom_id: string;
  status: string;
  response: {
    choices: Array<{
      message: {
        function_call: {
          arguments: string;
        };
      };
    }>;
  };
}
