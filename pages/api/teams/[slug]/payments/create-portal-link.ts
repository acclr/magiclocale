import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/lib/session';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import { stripe, getStripeCustomerId } from '@/lib/stripe';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { getProjectService } from '@/lib/translations';
import { billingPortalSchema, validateWithSchema } from '@/lib/zod';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'POST':
        await handlePOST(req, res);
        break;
      default:
        res.setHeader('Allow', 'POST');
        res.status(405).json({
          error: { message: `Method ${req.method} Not Allowed` },
        });
    }
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;

    res.status(status).json({ error: { message } });
  }
}

const handlePOST = async (req: NextApiRequest, res: NextApiResponse) => {
  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'team_payments', 'create');
  const session = await getSession(req, res);
  const { projectId } = validateWithSchema(billingPortalSchema, req.body ?? {});

  let customerId: string;
  let returnPath = `/teams/${teamMember.team.slug}/billing`;

  if (projectId) {
    const project = await getProjectService().get(
      teamMember.team.id,
      projectId
    );
    if (project.billingScope !== 'project') {
      throw new ApiError(422, 'This project is billed on the team retainer.');
    }
    if (!project.billingId) {
      throw new ApiError(
        422,
        'Subscribe to a project plan before opening the billing portal.'
      );
    }
    customerId = project.billingId;
    returnPath = `/teams/${teamMember.team.slug}/projects/${project.id}/settings`;
  } else {
    customerId = await getStripeCustomerId(teamMember, session);
  }

  const { url } = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.appUrl}${returnPath}`,
  });

  res.json({ data: { url } });
};
