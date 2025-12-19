import { UserRepository } from '../domain/user.repository'
import { Mechanic } from '../domain/user.entity'

/**
 * Get All Mechanics Use Case
 * Retrieves all mechanics for the current tenant
 */
export class GetAllMechanicsUseCase {
  constructor(private readonly repository: UserRepository) {}

  async execute(): Promise<Mechanic[]> {
    return this.repository.findAllMechanics()
  }
}

