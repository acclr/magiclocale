import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import classNames from 'classnames';

type ProjectNavProps = {
  slug: string;
  projectId: string;
  active: 'workspace' | 'settings';
};

const ProjectNav = ({ slug, projectId, active }: ProjectNavProps) => {
  const { t } = useTranslation('common');
  const items = [
    {
      id: 'workspace' as const,
      href: `/teams/${slug}/projects/${projectId}`,
      name: t('translation-workspace'),
    },
    {
      id: 'settings' as const,
      href: `/teams/${slug}/projects/${projectId}/settings`,
      name: t('project-settings'),
    },
  ];

  return (
    <nav className="flex flex-wrap border-b border-gray-300" aria-label="Tabs">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={classNames(
            'mr-5 inline-flex items-center border-b-2 py-2 text-sm font-medium',
            active === item.id
              ? 'border-gray-900 text-gray-700 dark:text-gray-100'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default ProjectNav;
