export interface NoteDTO {
  id: number;
  title: string;
  description: string;
  urls: string[];
  tags: string[];
  lang?: string;
}

export interface NoteSummary {
  main_points: string[];
  qa: Array<{
    question: string;
    answer: string;
  }>;
  summary: string;
  folder: {
    name: string;
    description: string;
  };
  tags: string[];
}

export interface BatchJobResponse {
  id: string;
  status: string;
  output_file_id?: string;
}
