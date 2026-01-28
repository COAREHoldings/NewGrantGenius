import NextAuth, { AuthOptions, User as NextAuthUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL!);

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await sql`SELECT * FROM users WHERE email = ${credentials.email}`;
        if (result.length === 0) {
          return null;
        }

        const user = result[0];
        
        // Check if user has a password (OAuth users may not have one)
        if (!user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          // Check if user exists by email
          const existingUser = await sql`SELECT * FROM users WHERE email = ${user.email}`;
          
          if (existingUser.length === 0) {
            // Create new user for OAuth
            const newUser = await sql`
              INSERT INTO users (email, password, name, role)
              VALUES (${user.email}, ${''}, ${user.name || user.email?.split('@')[0] || 'User'}, 'owner')
              RETURNING id
            `;
            user.id = String(newUser[0].id);
          } else {
            user.id = String(existingUser[0].id);
            user.name = existingUser[0].name;
          }

          // Store/update OAuth account link
          const existingAccount = await sql`
            SELECT * FROM oauth_accounts 
            WHERE provider = ${account.provider} AND provider_account_id = ${account.providerAccountId}
          `;
          
          if (existingAccount.length === 0) {
            await sql`
              INSERT INTO oauth_accounts (user_id, provider, provider_account_id, access_token, refresh_token)
              VALUES (${parseInt(user.id)}, ${account.provider}, ${account.providerAccountId}, ${account.access_token || null}, ${account.refresh_token || null})
            `;
          } else {
            await sql`
              UPDATE oauth_accounts 
              SET access_token = ${account.access_token || null}, refresh_token = ${account.refresh_token || null}
              WHERE provider = ${account.provider} AND provider_account_id = ${account.providerAccountId}
            `;
          }

          return true;
        } catch (error) {
          console.error('OAuth sign in error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as NextAuthUser & { role?: string }).role || 'owner';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
