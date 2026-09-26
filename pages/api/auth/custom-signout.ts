import { NextApiRequest, NextApiResponse } from 'next';
import { getCookie } from 'cookies-next';

import {
  expiredSessionCookieHeaders,
  sessionCookieNames,
} from '@/lib/auth-session-cookie';
import env from '@/lib/env';
import { deleteManySessions } from 'models/session';

async function deleteDatabaseSessions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  for (const name of sessionCookieNames()) {
    const raw = await getCookie(name, { req, res });
    if (typeof raw !== 'string' || raw.length === 0) {
      continue;
    }

    await deleteManySessions({
      where: {
        sessionToken: raw,
      },
    });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (env.nextAuth.sessionStrategy === 'database') {
      await deleteDatabaseSessions(req, res);
    }
  } catch (error) {
    console.error('Signout error:', error);
  }

  for (const header of expiredSessionCookieHeaders()) {
    res.appendHeader('Set-Cookie', header);
  }

  return res.status(200).json({ success: true });
}
