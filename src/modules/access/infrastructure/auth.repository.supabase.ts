import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AuthRepository, CreateUserInput, AuthUser } from "./auth.repository";
import type { Database } from "@/lib/supabase/types";

export class SupabaseAuthRepository implements AuthRepository {
  private supabaseAdmin = getSupabaseAdmin();

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const { data, error } = await this.supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      phone: input.phone,
      user_metadata: input.metadata,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Error creating auth user:", error);
      throw new Error(error?.message || "Failed to create auth user");
    }

    return {
      id: data.user.id,
      email: data.user.email!,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  }

  async emailExists(email: string): Promise<boolean> {
    const { data } = await this.supabaseAdmin.auth.admin.listUsers();
    return data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
  }

  /**
   * Verify a user's password by attempting sign-in
   * Uses an isolated client to avoid interfering with the user's actual session
   * 
   * @security This method uses signInWithPassword which is timing-safe
   * @security Uses an isolated client with persistSession: false to prevent
   *           race conditions and session state interference
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create an isolated client specifically for password verification
    // This client doesn't share state with the main singleton client
    const isolatedClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,  // Don't persist session to storage
        autoRefreshToken: false, // Don't auto-refresh tokens
      },
    });

    const { error } = await isolatedClient.auth.signInWithPassword({
      email,
      password,
    });

    // No need to sign out since persistSession is false
    // The session only exists in memory for this isolated client instance

    return !error;
  }

  /**
   * Update a user's password using admin privileges
   * 
   * @security Supabase handles password hashing (bcrypt)
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const { error } = await this.supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}
