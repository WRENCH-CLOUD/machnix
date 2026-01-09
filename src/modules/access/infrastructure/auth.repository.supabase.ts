import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AuthRepository, CreateUserInput, AuthUser } from "./auth.repository";

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
   * Uses a temporary client to avoid affecting admin session
   * 
   * @security This method uses signInWithPassword which is timing-safe
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    // Create a temporary client for password verification
    // We don't use admin client here as we want to verify the actual password
    const tempClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error } = await tempClient.auth.signInWithPassword({
      email,
      password,
    });

    // Sign out immediately to clean up the temporary session
    await tempClient.auth.signOut();

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
