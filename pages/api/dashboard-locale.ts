import type { NextApiRequest, NextApiResponse } from 'next';

import { getDashboardLocalePageProps } from '@/lib/dashboard-locale-server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json(await getDashboardLocalePageProps({ req }));
}
