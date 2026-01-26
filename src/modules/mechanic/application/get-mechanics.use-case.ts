import { MechanicRepository } from '../domain/mechanic.repository'
import { Mechanic } from '../domain/mechanic.entity'

/**
 * Get All Mechanics Use Case
 * Retrieves all mechanics for the current tenant
 */
export class GetMechanicsUseCase {
    constructor(private readonly repository: MechanicRepository) { }

    async execute(activeOnly: boolean = false): Promise<Mechanic[]> {
        if (activeOnly) {
            return this.repository.findAllActive()
        }
        return this.repository.findAll()
    }
}
