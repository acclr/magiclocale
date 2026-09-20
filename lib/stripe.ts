import Stripe from 'stripe';
import env from '@/lib/env';
import { updateTeam } from 'models/team';
import { updateProjectBilling } from 'models/translation-project';
import type { Project } from '@/domain/translations';

export const stripe = new Stripe(env.stripe.secretKey ?? '');

function isStripeMissingCustomer(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    error.code === 'resource_missing'
  );
}

async function resolveStoredStripeCustomerId(
  billingId: string | null | undefined,
  createCustomer: () => Promise<Stripe.Customer>
): Promise<string> {
  if (billingId) {
    try {
      const customer = await stripe.customers.retrieve(billingId);
      if (!customer.deleted) {
        return customer.id;
      }
    } catch (error) {
      if (!isStripeMissingCustomer(error)) {
        throw error;
      }
    }
  }

  const customer = await createCustomer();
  return customer.id;
}

export async function getStripeCustomerId(teamMember, session?: any) {
  const customerId = await resolveStoredStripeCustomerId(
    teamMember.team.billingId,
    async () => {
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
      return customer;
    }
  );

  return customerId;
}

export async function getProjectStripeCustomerId(
  project: Pick<Project, 'id' | 'name' | 'billingId'>,
  team: { id: string; name: string },
  session?: { user?: { email?: string | null; name?: string | null } }
): Promise<string> {
  const customerId = await resolveStoredStripeCustomerId(
    project.billingId,
    async () => {
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
      return customer;
    }
  );

  return customerId;
}
