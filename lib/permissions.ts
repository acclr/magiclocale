import { Role } from '@prisma/client';

type RoleType = (typeof Role)[keyof typeof Role];
export type Action =
  | 'create'
  | 'update'
  | 'read'
  | 'delete'
  | 'leave'
  /** Sealing a draft version and pointing an environment at it. */
  | 'publish';
export type Resource =
  | 'team'
  | 'team_member'
  | 'team_invitation'
  | 'team_sso'
  | 'team_dsync'
  | 'team_audit_log'
  | 'team_webhook'
  | 'team_payments'
  | 'team_api_key'
  | 'team_translation_project'
  | 'team_translation'
  | 'team_environment'
  | 'team_feature_flag'
  | 'team_version';

type RolePermissions = {
  [role in RoleType]: Permission[];
};

export type Permission = {
  resource: Resource;
  actions: Action[] | '*';
};

export const availableRoles = [
  {
    id: Role.MEMBER,
    name: 'Member',
  },
  {
    id: Role.ADMIN,
    name: 'Admin',
  },
  {
    id: Role.OWNER,
    name: 'Owner',
  },
];

export const permissions: RolePermissions = {
  OWNER: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_payments',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    {
      resource: 'team_translation_project',
      actions: '*',
    },
    {
      resource: 'team_translation',
      actions: '*',
    },
    {
      resource: 'team_environment',
      actions: '*',
    },
    {
      resource: 'team_feature_flag',
      actions: '*',
    },
    {
      resource: 'team_version',
      actions: '*',
    },
  ],
  ADMIN: [
    {
      resource: 'team',
      actions: '*',
    },
    {
      resource: 'team_member',
      actions: '*',
    },
    {
      resource: 'team_invitation',
      actions: '*',
    },
    {
      resource: 'team_sso',
      actions: '*',
    },
    {
      resource: 'team_dsync',
      actions: '*',
    },
    {
      resource: 'team_audit_log',
      actions: '*',
    },
    {
      resource: 'team_webhook',
      actions: '*',
    },
    {
      resource: 'team_api_key',
      actions: '*',
    },
    {
      resource: 'team_translation_project',
      actions: '*',
    },
    {
      resource: 'team_translation',
      actions: '*',
    },
    {
      resource: 'team_environment',
      actions: '*',
    },
    {
      resource: 'team_feature_flag',
      actions: '*',
    },
    {
      resource: 'team_version',
      actions: '*',
    },
  ],
  MEMBER: [
    {
      resource: 'team',
      actions: ['read', 'leave'],
    },
    {
      resource: 'team_translation_project',
      actions: ['read'],
    },
    {
      resource: 'team_translation',
      actions: ['read'],
    },
    {
      resource: 'team_environment',
      actions: ['read'],
    },
    {
      resource: 'team_feature_flag',
      actions: ['read'],
    },
    {
      resource: 'team_version',
      actions: ['read'],
    },
  ],
};
