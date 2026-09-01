import Stripe from 'stripe';
import env from '@/lib/env';
import { updateTeam } from 'models/team';
import { updateProjectBilling } from 'models/translation-project';
import type { Project } from '@/domain/translations';

export const stripe = new Stripe(env.stripe.secretKey ?? '');

export async function getStripeCustomerId(teamMember, session?: any) {
  let customerId = '';
  if (!teamMember.team.billingId) {
    const customerData: {
      metadata: { teamId: string };
      email?: string;
    } = {
      metadata: {
        teamId: teamMember.teamId,
      },
    };
    if (session?.user?.email) {
      customerData.email = session?.user?.email;
    }
    const customer = await stripe.customers.create({
      ...customerData,
      name: session?.user?.name as string,
    });
    await updateTeam(teamMember.team.slug, {
      billingId: customer.id,
      billingProvider: 'stripe',
    });
    customerId = customer.id;
  } else {
    customerId = teamMember.team.billingId;
  }
  return customerId;
}

export async function getProjectStripeCustomerId(
  project: Pick<Project, 'id' | 'name' | 'billingId'>,
  team: { id: string; name: string },
  session?: { user?: { email?: string | null; name?: string | null } }
): Promise<string> {
  if (project.billingId) {
    return project.billingId;
  }

  const customer = await stripe.customers.create({
    name: `${team.name} / ${project.name}`,
    email: session?.user?.email ?? undefined,
    metadata: {
      teamId: team.id,
      projectId: project.id,
      billingScope: 'project',
    },
  });

  await updateProjectBilling(project.id, {
    billingId: customer.id,
    billingProvider: 'stripe',
  });

  return customer.id;
}
