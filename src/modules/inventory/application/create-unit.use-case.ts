import { Unit } from '../domain/inventory.entity'
import { UnitRepository } from '../domain/inventory.repository'

export class CreateUnitUseCase {
  constructor(
    private unitRepository: UnitRepository
  ) {}

  async execute(unitName: string): Promise<Unit> {
    const normalizedName = unitName.trim()
    if (!normalizedName) {
      throw new Error('Unit name is required')
    }

    const existing = await this.unitRepository.findByName(normalizedName)
    if (existing) {
      return existing
    }

    return this.unitRepository.create({ unitName: normalizedName })
  }
}

