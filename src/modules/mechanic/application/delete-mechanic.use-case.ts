import { MechanicRepository } from '../domain/mechanic.repository'

/**
 * Delete Mechanic Use Case
 * Soft deletes a mechanic
 */
export class DeleteMechanicUseCase {
    constructor(private readonly repository: MechanicRepository) { }

    async execute(id: string): Promise<void> {
        // Check if mechanic exists
        const existing = await this.repository.findById(id)
        if (!existing) {
            throw new Error('Mechanic not found')
        }

        await this.repository.delete(id)
    }
}
