export interface CreateMemoryDTO {
  title: string;
  description: string;
  memoryDate: string;
  locationName?: string;
  coordinates?: { latitude: number; longitude: number };
  tags?: string[];
}
