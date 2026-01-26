import { MechanicRepository } from '../domain/mechanic.repository'
import { Mechanic, CreateMechanicInput } from '../domain/mechanic.entity'

/**
 * Create Mechanic Use Case
 * Creates a new mechanic for the current tenant
 */
export class CreateMechanicUseCase {
    constructor(private readonly repository: MechanicRepository) { }

    async execute(input: CreateMechanicInput): Promise<Mechanic> {
        // Validate required fields
        if (!input.name || input.name.trim() === '') {
            throw new Error('Mechanic name is required')
        }

        return this.repository.create({
            name: input.name.trim(),
            phone: input.phone?.trim(),
            email: input.email?.trim().toLowerCase(),
        })
    }
}
