//auth.repository.ts
import { initScriptLoader } from "next/script";
import {User} from "../domain/auth.entity";

export interface AuthRepository {
    createUser(input: Partial<User> & {password: string}): Promise<{data: User | null, error: any}>
    deleteUser(userId: string): Promise<{data: null, error: any}>
    emailExists(email: string): Promise<boolean>
}

export interface CreateUserInput{
    email: string
    password: string
    phone?: string
    role: string
    metadata?: Record<string, any>
}


export interface AuthUser{
    id: string
    email: string
}

