import { SupabaseClient, User } from '@supabase/supabase-js';

export class AuthService {
  constructor(private supabaseClient: SupabaseClient) {}

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    return data;
  }

  async signOut() {
    const { error } = await this.supabaseClient.auth.signOut();

    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabaseClient.auth.getUser();
    return user;
  }

  async getCurrentSession() {
    const { data: { session } } = await this.supabaseClient.auth.getSession();
    return session;
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabaseClient.auth.onAuthStateChange((event, session) => {
      (async () => {
        callback(event, session);
      })();
    });
  }

  async resetPassword(email: string) {
    const { error } = await this.supabaseClient.auth.resetPasswordForEmail(email);

    if (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }
}
