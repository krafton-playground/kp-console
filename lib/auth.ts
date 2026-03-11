import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, go to callbackUrl if relative, otherwise /dashboard
      if (url.startsWith("/")) return url;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
  }
}
