import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidDate } from "./utils/isValidDate";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const query = url.pathname.slice(1);
  const [date] = query.split(".");

  if(
    url.pathname.slice(0, 4) !== "/api" &&
    // url.pathname.slice(0, 6) !== "/claim" &&
    url.pathname.slice(0, 6) !== "/_next" &&
    ( url.pathname === '/' || !isValidDate(date))
  ) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    url.pathname = `/${now.getFullYear()}${month <= 9 ? "0" : ""}${month}${day <= 9 ? "0" : ""}${day}`
    return NextResponse.redirect(url)
  }
}

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      return !req.url.includes("api/") || req.url.includes("api/proxy") || token?.email === "hello@philippadrian.com";
    },
  },
});