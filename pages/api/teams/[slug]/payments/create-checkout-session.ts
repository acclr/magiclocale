import { NextApiRequest, NextApiResponse } from 'next';

import { getSession } from '@/lib/session';
import { throwIfNoTeamAccess } from 'models/team';
import { throwIfNotAllowed } from 'models/user';
import {
  stripe,
  getStripeCustomerId,
  getProjectStripeCustomerId,
} from '@/lib/stripe';
import env from '@/lib/env';
import { ApiError } from '@/lib/errors';
import { getMagilocaleStripePriceIds } from '@/lib/billing/entitlement';
import { getProjectService } from '@/lib/translations';
import { checkoutSessionSchema, validateWithSchema } from '@/lib/zod';

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
  const { price, quantity, projectId } = validateWithSchema(
    checkoutSessionSchema,
    req.body
  );

  const teamMember = await throwIfNoTeamAccess(req, res);
  throwIfNotAllowed(teamMember, 'team_payments', 'create');
  const allowedPrices = Object.values(getMagilocaleStripePriceIds()).filter(
    Boolean
  );
  if (!allowedPrices.includes(price)) {
    throw new ApiError(422, 'Unknown Magilocale price.');
  }
  const session = await getSession(req, res);

  let customer: string;
  let successPath = `/teams/${teamMember.team.slug}/billing`;

  if (projectId) {
    const project = await getProjectService().get(
      teamMember.team.id,
      projectId
    );
    if (project.billingScope !== 'project') {
      throw new ApiError(
        422,
        'Switch this project to per-project billing before checking out.'
      );
    }
    customer = await getProjectStripeCustomerId(
      project,
      teamMember.team,
      session ?? undefined
    );
    successPath = `/teams/${teamMember.team.slug}/projects/${project.id}/settings`;
  } else {
    customer = await getStripeCustomerId(teamMember, session);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer,
    mode: 'subscription',
    line_items: [
      {
        price,
        quantity: quantity ?? 1,
      },
    ],
    metadata: {
      teamId: teamMember.team.id,
      billingScope: projectId ? 'project' : 'team',
      ...(projectId ? { projectId } : {}),
    },
    subscription_data: {
      metadata: {
        teamId: teamMember.team.id,
        billingScope: projectId ? 'project' : 'team',
        ...(projectId ? { projectId } : {}),
      },
    },
    success_url: `${env.appUrl}${successPath}`,
    cancel_url: `${env.appUrl}${successPath}`,
  });

  res.json({ data: checkoutSession });
};
