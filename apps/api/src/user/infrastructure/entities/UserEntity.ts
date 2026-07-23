export interface UserEntity {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  description: string | null;
  ownMemoryIds: string[];
  sharedMemoryIds: string[];
  createdAt: string;
  updatedAt: string;
}
