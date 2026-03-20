import { Unit } from '../domain/inventory.entity'
import { UnitRepository } from '../domain/inventory.repository'

export class UnitCrudUseCase {
  constructor(
    private unitRepository: UnitRepository
  ) {}

  async create(unitName: string): Promise<Unit> {
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

  async list(): Promise<Unit[]> {
    return this.unitRepository.findAll()
  }

  async update(id: string, unitName: string): Promise<Unit> {
    const unit = await this.unitRepository.findById(id)
    if (!unit) {
      throw new Error('Unit not found')
    }

    const normalizedName = unitName.trim()
    if (!normalizedName) {
      throw new Error('Unit name is required')
    }

    const existing = await this.unitRepository.findByName(normalizedName)
    if (existing && existing.id !== id) {
      throw new Error('Another unit with this name already exists')
    }

    return this.unitRepository.update(id, { unitName: normalizedName })
  }

  async delete(id: string): Promise<void> {
    const unit = await this.unitRepository.findById(id)
    if (!unit) {
      throw new Error('Unit not found')
    }

    await this.unitRepository.delete(id)
  }
}

