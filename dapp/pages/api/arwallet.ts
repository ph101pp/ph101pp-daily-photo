// This is an example of to protect an API route
import { getToken } from "next-auth/jwt"
import { Octokit } from "@octokit/rest"

import type { NextApiRequest, NextApiResponse } from "next";

// Endpoint protected by middleware.
// not most secure to send key to client 
// but also limited value at risk in ARWallet 
// and no other consequences than loss of funds
// if wallet is compromised.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if(req.method !== 'POST') {
    return res.redirect("/_next/404");
  }
  if(!process.env.ARWALLET) {
    return res.status(404).end("Not Found.");
  }

  res.setHeader("Cache-Control", "no-cache")
  // Add SALT to prevent browser from showing wallet in plain text ¯\_(ツ)_/¯.
  res.end("JTQCJlIjog"+Buffer.from(process.env.ARWALLET).toString("base64")+"xmZWhmYWxj");
}
