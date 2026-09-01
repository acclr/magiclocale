import { normalizeTeamProjectApiError } from '../../lib/api/team-project-errors';
import { ApiError } from '../../lib/errors';

describe('normalizeTeamProjectApiError', () => {
  it('normalizes authentication, validation, and scoped not-found errors', () => {
    expect(normalizeTeamProjectApiError(new Error('Unauthorized'))).toEqual({
      status: 401,
      message: 'Unauthorized',
    });
    expect(
      normalizeTeamProjectApiError(new ApiError(422, 'Validation Error'))
    ).toEqual({ status: 422, message: 'Validation Error' });
    expect(
      normalizeTeamProjectApiError(new Error('Project not found: foreign'))
    ).toEqual({ status: 404, message: 'Project not found: foreign' });
  });
});
