import type { Memory } from "../models/Memory.js";
import type { User } from "../../../user/domain/models/User.js";

export class MemorySharingService {
  shareMemory(memory: Memory, targetUser: User): void {
    memory.shareWithUser(targetUser.id.value);
    targetUser.addSharedMemory(memory.id.value, memory.ownerId);
  }

  unshareMemory(memory: Memory, targetUser: User): void {
    memory.unshareWithUser(targetUser.id.value);
    targetUser.removeSharedMemory(memory.id.value);
  }
}
