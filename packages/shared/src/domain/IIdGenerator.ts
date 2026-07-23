export const DITOKEN_ID_GENERATOR = Symbol("IIdGenerator");

export interface IIdGenerator {
  generate(): string;
}
