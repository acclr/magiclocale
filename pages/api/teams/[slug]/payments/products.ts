import { NextApiRequest, NextApiResponse } from 'next';

import {
  getMagilocaleStripePriceIds,
  getTeamEntitlement,
  planIdForPriceId,
} from '@/lib/billing/entitlement';
import { MAGILOCALE_PLANS } from '@/domain/billing';
import { getByCustomerId } from 'models/subscription';
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

    const priceIds = getMagilocaleStripePriceIds();
    const entitlement = await getTeamEntitlement(teamMember.team.billingId);
    const subscriptions = teamMember.team.billingId
      ? await getByCustomerId(teamMember.team.billingId)
      : [];

    res.json({
      data: {
        entitlement,
        plans: (['starter', 'enterprise'] as const).map((id) => ({
          ...MAGILOCALE_PLANS[id],
          priceId: priceIds[id] || null,
          current: entitlement.planId === id && entitlement.subscribed,
        })),
        subscriptions: subscriptions
          .filter((subscription) => subscription.active)
          .map((subscription) => ({
            ...subscription,
            planId: planIdForPriceId(subscription.priceId),
            planName: (() => {
              const planId = planIdForPriceId(subscription.priceId);
              return planId ? MAGILOCALE_PLANS[planId].name : 'Magilocale';
            })(),
          })),
      },
    });
  } catch (error: any) {
    const message = error.message || 'Something went wrong';
    const status = error.status || 500;
    res.status(status).json({ error: { message } });
  }
}
