export interface UserDTO {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}