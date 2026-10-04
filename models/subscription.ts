import { invalidateReads } from '@/lib/cache/read-through';
import { prisma } from '@/lib/prisma';
import { Subscription } from '@prisma/client';

export const createStripeSubscription = async ({
  customerId,
  id,
  active,
  startDate,
  endDate,
  priceId,
}: {
  customerId: string;
  id: string;
  active: boolean;
  startDate: Date;
  endDate: Date;
  priceId: string;
}) => {
  const created = await prisma.subscription.create({
    data: {
      customerId,
      id,
      active,
      startDate,
      endDate,
      priceId,
    },
  });
  invalidateReads('subscriptions:');
  return created;
};

export const deleteStripeSubscription = async (id: string) => {
  const removed = await prisma.subscription.deleteMany({
    where: {
      id,
    },
  });
  invalidateReads('subscriptions:');
  return removed;
};

export const updateStripeSubscription = async (id: string, data: any) => {
  const updated = await prisma.subscription.update({
    where: {
      id,
    },
    data,
  });
  invalidateReads('subscriptions:');
  return updated;
};

export const getByCustomerId = async (customerId: string) => {
  return await prisma.subscription.findMany({
    where: {
      customerId,
    },
  });
};

export const getBySubscriptionId = async (
  subscriptionId: string
): Promise<Subscription | null> => {
  return await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
  });
};
