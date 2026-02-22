import { MechanicRepository } from '../domain/mechanic.repository'
import { Mechanic, UpdateMechanicInput } from '../domain/mechanic.entity'

/**
 * Update Mechanic Use Case
 * Updates an existing mechanic's details
 */
export class UpdateMechanicUseCase {
    constructor(private readonly repository: MechanicRepository) { }

    async execute(id: string, input: UpdateMechanicInput): Promise<Mechanic> {
        // Check if mechanic exists
        const existing = await this.repository.findById(id)
        if (!existing) {
            throw new Error('Mechanic not found')
        }

        // Clean input data
        const cleanInput: UpdateMechanicInput = {}
        if (input.name !== undefined) cleanInput.name = input.name.trim()
        if (input.phone !== undefined) cleanInput.phone = input.phone.trim()
        if (input.email !== undefined) cleanInput.email = input.email.trim().toLowerCase()
        if (input.isActive !== undefined) cleanInput.isActive = input.isActive

        return this.repository.update(id, cleanInput)
    }
}
