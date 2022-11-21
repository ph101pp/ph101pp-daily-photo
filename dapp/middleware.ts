import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidDate } from "./utils/isValidDate";

function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const query = url.pathname.slice(1);
  const [date] = query.split(".");

  if (
    !url.pathname.startsWith("/api/") &&
    !url.pathname.startsWith("/_next") &&
    !url.pathname.startsWith("/claim") &&
    !isValidDate(date)
  ) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    url.pathname = `/${now.getFullYear()}${month <= 9 ? "0" : ""}${month}${day <= 9 ? "0" : ""}${day}`
    return NextResponse.redirect(url)
  }
}

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth(
  middleware,
  {
    callbacks: {
      authorized({ req, token }) {
        const path: string = req.nextUrl.pathname;
        return (
          !path.startsWith("/api/") || // close all api routes
          path.startsWith("/api/proxy/") || // except for the proxy 
          token?.email === "hello@philippadrian.com" // or if logged in.
          ); 
      },
    },
  }
);