"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableHead } from "@/components/ui/table";
import { MIN_COLUMN_WIDTH, CHECKBOX_WIDTH } from "./constants";
import { Header, flexRender } from "@tanstack/react-table";
import { Job } from "@/types/job";

interface DraggableTableHeadProps {
  header: Header<Job, unknown>;
  isSticky?: boolean;
  leftPosition?: number;
}

export function DraggableTableHead({
  header,
  isSticky = false,
  leftPosition = 0,
}: DraggableTableHeadProps) {
  const isCheckbox = header.id === "select";
  const isActions = header.id === "actions";
  const canDrag = !isCheckbox && !isActions;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: header.id,
    disabled: !canDrag,
  });

  const columnWidth = isCheckbox ? CHECKBOX_WIDTH : header.getSize();

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: columnWidth,
    minWidth: isCheckbox ? CHECKBOX_WIDTH : MIN_COLUMN_WIDTH,
    maxWidth: columnWidth,
    opacity: isDragging ? 0.5 : 1,
    ...(isSticky && { left: leftPosition }),
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`
        font-medium text-xs relative group overflow-hidden
        ${isSticky ? "sticky bg-card z-20 shadow-[1px_0_0_hsl(var(--border))]" : "z-10"}
        ${isCheckbox ? "p-0" : "border-r last:border-r-0"}
        ${isDragging ? "bg-muted" : ""}
        ${canDrag ? "cursor-grab active:cursor-grabbing" : ""}
      `}
      {...(canDrag ? { ...attributes, ...listeners } : {})}
    >
      <div
        className={`flex items-center ${
          isCheckbox
            ? "justify-center w-full h-full py-3"
            : "justify-between pr-2 w-full overflow-hidden"
        }`}
      >
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}

        {/* リサイズハンドル */}
        {header.column.getCanResize() && !isCheckbox && !isActions && (
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => header.column.resetSize()}
            className={`
              absolute right-0 top-0 bottom-0 w-1 cursor-col-resize
              hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity
              ${header.column.getIsResizing() ? "bg-primary/50 opacity-100" : ""}
            `}
          />
        )}
      </div>
    </TableHead>
  );
}
