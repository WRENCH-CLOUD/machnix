import { AuthRepository, CreateUserInput } from '../infrastructure/auth.repository'

export class UserCreationUseCase {
  constructor(private readonly authRepo: AuthRepository) {}

  async execute(input: CreateUserInput) {
    if (!input.email) {
      throw new Error('Email is required')
    }

    const emailTaken = await this.authRepo.emailExists(input.email)
    if (emailTaken) {
      throw new Error('Email already exists')
    }

    const user = await this.authRepo.createUser(input)

    return user
  }
}
