import { prisma } from '@/lib/prisma';

export async function getProjectByBillingId(billingId: string) {
  return prisma.translationProject.findFirst({
    where: { billingId },
  });
}

export async function updateProjectBilling(
  id: string,
  data: { billingId: string; billingProvider: string }
) {
  return prisma.translationProject.update({
    where: { id },
    data,
  });
}
