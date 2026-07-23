import { randomUUID } from "node:crypto";
import { injectable } from "tsyringe";
import type { IIdGenerator } from "@acaixinha/shared";

@injectable()
export class CryptoIdGenerator implements IIdGenerator {
  generate(): string {
    return randomUUID();
  }
}
