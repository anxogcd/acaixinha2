export interface StringVOConfig {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  nullable?: boolean;
}

export abstract class StringVO<TBrand> {
  readonly value: string | null;
  declare private readonly _brand: TBrand;

  protected static _config: StringVOConfig = {};

  constructor(value: string | null) {
    const config = (this.constructor as typeof StringVO)._config;

    if (value === null) {
      if (!config.nullable) {
        throw new Error(`${this.constructor.name} cannot be null`);
      }
      this.value = null;
      return;
    }

    if (config.minLength !== undefined && value.length < config.minLength) {
      throw new Error(`${this.constructor.name} must have at least ${config.minLength} characters`);
    }

    if (config.maxLength !== undefined && value.length > config.maxLength) {
      throw new Error(`${this.constructor.name} must have at most ${config.maxLength} characters`);
    }

    if (config.pattern && !config.pattern.test(value)) {
      throw new Error(`${this.constructor.name} does not match required pattern`);
    }

    this.value = value;
  }

  equals(other: StringVO<TBrand>): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? "";
  }

  toNullable(): string | null {
    return this.value;
  }
}
