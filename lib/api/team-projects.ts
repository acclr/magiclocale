import type { NextApiRequest, NextApiResponse } from 'next';

import type { Action, Resource } from '../permissions';
import { throwIfNoTeamAccess } from '../../models/team';
import { throwIfNotAllowed } from '../../models/user';
import { normalizeTeamProjectApiError } from './team-project-errors';

type TeamMember = Awaited<ReturnType<typeof throwIfNoTeamAccess>>;

export type TeamProjectRouteContext = {
  req: NextApiRequest;
  res: NextApiResponse;
  teamMember: TeamMember;
};

type TeamProjectRoute = {
  resource: Resource;
  action: Action;
  handle(context: TeamProjectRouteContext): Promise<void>;
};

type TeamProjectRoutes = Partial<Record<string, TeamProjectRoute>>;

export function createTeamProjectApiHandler(routes: TeamProjectRoutes) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
      const route = routes[req.method ?? ''];
      if (!route) {
        const allowed = Object.keys(routes);
        res.setHeader('Allow', allowed.join(', '));
        res.status(405).json({
          error: {
            code: 405,
            message: `Method ${req.method} Not Allowed`,
            values: {},
          },
        });
        return;
      }

      const teamMember = await throwIfNoTeamAccess(req, res);
      throwIfNotAllowed(teamMember, route.resource, route.action);
      await route.handle({ req, res, teamMember });
    } catch (error) {
      const normalized = normalizeTeamProjectApiError(error);
      res.status(normalized.status).json({
        error: {
          code: normalized.status,
          message: normalized.message,
          values: {},
        },
      });
    }
  };
}
