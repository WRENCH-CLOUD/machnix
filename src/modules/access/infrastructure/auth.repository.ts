export interface AuthRepository {
    createUser(input: CreateUserInput): Promise<AuthUser>
    deleteUser(userId: string): Promise<void>
    emailExists(email: string): Promise<boolean>
    
    /**
     * Verify a user's password against stored hash
     * @param email - User's email address
     * @param password - Password to verify
     * @returns true if password is valid, false otherwise
     */
    verifyPassword(email: string, password: string): Promise<boolean>
    
    /**
     * Update a user's password
     * @param userId - The user's ID
     * @param newPassword - The new password to set
     * @throws Error if update fails
     */
    updatePassword(userId: string, newPassword: string): Promise<void>
}

export interface CreateUserInput{
    email: string
    password: string
    phone?: string
    role?: string
    metadata?: Record<string, any>
}

export interface AuthUser{
    id: string
    email: string
}

