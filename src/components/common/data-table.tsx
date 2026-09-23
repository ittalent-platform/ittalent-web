import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  SortableHeaderButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  TableSkeletonRows,
  type SortState,
} from "@/components/ui/table";

export interface DataTableColumn<T> {
  cell: (row: T) => ReactNode;
  className?: string;
  header: ReactNode;
  key: string;
  sortable?: boolean;
}

export function TableSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DataTable<T>({
  className,
  columns,
  emptyState,
  isLoading,
  onRowClick,
  onSort,
  rowKey,
  rows,
  skeletonRows = 5,
  sort,
}: {
  className?: string;
  columns: DataTableColumn<T>[];
  emptyState?: ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  onSort?: (key: string) => void;
  rowKey: (row: T) => string;
  rows: T[];
  skeletonRows?: number;
  sort?: { direction: SortState; key: string };
}) {
  const showEmptyState = !isLoading && rows.length === 0 && emptyState;

  return (
    <Table className={className}>
      <TableHead>
        <TableHeaderRow>
          {columns.map((column) => (
            <TableHeaderCell className={column.className} key={column.key}>
              {column.sortable && onSort ? (
                <SortableHeaderButton
                  active={sort?.key === column.key}
                  direction={sort?.key === column.key ? sort.direction : null}
                  label={
                    typeof column.header === "string"
                      ? column.header
                      : column.key
                  }
                  onClick={() => onSort(column.key)}
                />
              ) : (
                column.header
              )}
            </TableHeaderCell>
          ))}
        </TableHeaderRow>
      </TableHead>
      <TableBody>
        {isLoading ? (
          <TableSkeletonRows columns={columns.length} rows={skeletonRows} />
        ) : showEmptyState ? (
          <tr>
            <td colSpan={columns.length}>{emptyState}</td>
          </tr>
        ) : (
          rows.map((row) => (
            <TableRow
              className={onRowClick ? "cursor-pointer" : undefined}
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <TableCell className={column.className} key={column.key}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
