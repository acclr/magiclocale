import { NextApiRequest, NextApiResponse } from 'next';

import { getBillingCatalog } from '@/lib/billing/catalog';
import { getProjectEntitlement } from '@/lib/billing/entitlement';
import { getProjectService } from '@/lib/translations';
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
    throwIfNotAllowed(teamMember, 'team_payments', 'read');

    const teamCatalog = await getBillingCatalog(
      teamMember.team.billingId,
      'team'
    );
    const projects = await getProjectService().list(teamMember.team.id);
    const projectSummaries = await Promise.all(
      projects.map(async (project) => {
        const entitlement = await getProjectEntitlement(
          project,
          teamMember.team.billingId
        );
        return {
          id: project.id,
          name: project.name,
          billingScope: project.billingScope,
          entitlement,
        };
      })
    );

    res.json({
      data: {
        ...teamCatalog,
        projects: projectSummaries,
      },
    });
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}
