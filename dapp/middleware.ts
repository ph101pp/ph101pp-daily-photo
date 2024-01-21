import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidDate } from "./utils/isValidDate";

async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/CLAIM-0")
  ) {
    return;
  }
  const query = url.pathname.slice(1);
  const [token] = query.split(".");
  const [dateStr, idStr] = token.split("-");

  let dateInt = parseInt(dateStr);
  let idInt = parseInt(idStr);

  let date = dateStr;
  let id = idStr;
  let fullToken = query;

  // id received
  if (dateInt < 20220901 && !isNaN(dateInt) && isNaN(idInt)) {
    // console.log("A");
    id = dateStr;
    fullToken = await (await fetch(`${url.origin}/api/tokenDate/${id}`)).json();
  }
  else if (!isValidDate(date) && isNaN(idInt)) {
    // console.log("B");

    const now = new Date();
    const yearTemp = now.getFullYear();
    const monthTemp = now.getMonth() + 1;
    const dayTemp = now.getDate();
    date = `${yearTemp}${monthTemp <= 9 ? "0" : ""}${monthTemp}${dayTemp <= 9 ? "0" : ""}${dayTemp}`
    fullToken = await (await fetch(`${url.origin}/api/tokenIndex/${date}`)).json();
  } else {
    // console.log("C");
    fullToken = await (await fetch(`${url.origin}/api/tokenIndex/${date}`)).json();
  }

  if (fullToken !== query) {
    url.pathname = `/${fullToken}`
    return NextResponse.redirect(url);
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
          (!path.startsWith("/CLAIM-0") && // close CLAIM-0 route
            (
              !path.startsWith("/api/") || // close all api routes
              path.startsWith("/api/proxy/") // except for the proxy 
            )
          ) ||
          token?.email === "hello@philippadrian.com" // or if logged
        )
      },
    },
  }
);