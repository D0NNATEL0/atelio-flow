type Column = {
  key: string;
  label: string;
};

type Row = Record<string, string>;

type DataTableProps = {
  columns: Column[];
  rows: Row[];
};

function getStatusTone(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("accept") ||
    normalized.includes("pay") ||
    normalized.includes("actif")
  ) {
    return "success";
  }

  if (
    normalized.includes("attente") ||
    normalized.includes("envoy") ||
    normalized.includes("nouveau")
  ) {
    return "warning";
  }

  if (
    normalized.includes("retard") ||
    normalized.includes("impayée") ||
    normalized.includes("relancer")
  ) {
    return "danger";
  }

  return "neutral";
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[columns[0].key]}-${index}`}>
              {columns.map((column) => {
                const value = row[column.key];
                const isStatusColumn = column.key === "status";

                return (
                  <td key={column.key}>
                    {isStatusColumn ? (
                      <span className={`status-pill status-pill-${getStatusTone(value)}`}>
                        <span className="status-dot" aria-hidden="true" />
                        {value}
                      </span>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
