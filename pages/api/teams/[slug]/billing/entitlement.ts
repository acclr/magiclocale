import { NextApiRequest, NextApiResponse } from 'next';

import { getTeamEntitlement } from '@/lib/billing/entitlement';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({
        error: { message: `Method ${req.method} Not Allowed` },
      });
    }

    const teamMember = await throwIfNoTeamAccess(req, res);
    throwIfNotAllowed(teamMember, 'team', 'read');
    const entitlement = await getTeamEntitlement(teamMember.team.billingId);
    res.json({ data: entitlement });
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}
