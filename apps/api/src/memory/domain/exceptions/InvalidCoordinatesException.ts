import { MemoryDomainErrors } from "../constants/index.js";

export class InvalidCoordinatesException extends Error {
  readonly code = MemoryDomainErrors.INVALID_COORDINATES;

  constructor(latitude: number, longitude: number) {
    super(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
    this.name = "InvalidCoordinatesException";
  }
}
