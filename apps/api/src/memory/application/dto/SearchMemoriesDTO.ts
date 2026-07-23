export interface SearchMemoriesDTO {
  text?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
