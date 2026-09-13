const theadClass = 'bg-card text-xs uppercase text-muted-foreground';
const trHeadClass = 'hover:bg-card';
const thClass = 'px-6 py-3';

export const TableHeader = ({ cols }: { cols: string[] }) => {
  return (
    <thead className={theadClass}>
      <tr className={trHeadClass}>
        {cols.map((col, index) => (
          <th key={index} scope="col" className={thClass}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
};
