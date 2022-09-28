import { withAuth } from "next-auth/middleware"

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      return req.url.includes("api/proxy") || token?.email === "hello@philippadrian.com";
    },
  },
});