import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

import { getDB } from "~/db/getDB";

export async function getAuthContext(req: NextApiRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    throw new Error("No token found");
  }

  const db = getDB();

  return {
    athleteId: Number(token.sub),
    accessToken: token.accessToken as string,
    db,
  };
}
