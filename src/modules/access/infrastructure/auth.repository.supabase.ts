import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { AuthRepository, CreateUserInput, AuthUser } from "./auth.repository";
export class SupabaseAuthRepository implements AuthRepository {
  private supabase = getSupabaseAdmin();

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const { data, error } = await this.supabase.auth.admin.createUser({
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
    const { error } = await this.supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  }

  async emailExists(email: string): Promise<boolean> {
    const { data } = await this.supabase.auth.admin.listUsers();
    return data.users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
  }
}
