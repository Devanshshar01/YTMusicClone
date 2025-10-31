import CredentialsProvider from "next-auth/providers/credentials";
import { supabaseServer } from "./supabaseServer";

// Using any to avoid type import issues with next-auth v4
export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          // Authenticate with Supabase Auth
          const { data, error } = await supabaseServer.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            console.error("Supabase auth error:", error);
            throw new Error("Invalid credentials");
          }

          // Fetch additional user data from custom users table
          const { data: userProfile, error: profileError } = await supabaseServer
            .from('users')
            .select('name, image')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profileError) {
            console.error("Error fetching user profile:", profileError);
          }

          return {
            id: data.user.id,
            email: data.user.email!,
            name: userProfile?.name || data.user.user_metadata?.name || null,
            image: userProfile?.image || null,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication failed. Please try again.");
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
