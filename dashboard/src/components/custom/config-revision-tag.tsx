import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconFileSettings } from "@tabler/icons-react";

export function ConfigRevisionTag(props: {
  revision: number | null;
  to_revision?: number | null;
}) {
  const noRevision =
    props.to_revision === undefined
      ? props.revision === null
      : props.revision === null && props.to_revision === null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger>
          <div
            className={
              "flex-shrink-0 pl-1.5 pr-2 py-0.5 text-sm bg-blue-150 rounded-md font-medium flex flex-row gap-x-1.5 items-center justify-center whitespace-nowrap " +
              (noRevision
                ? "bg-slate-150 text-slate-800"
                : "bg-blue-150 text-blue-800")
            }
          >
            <>
              <IconFileSettings
                size={14}
                className={noRevision ? "text-slate-500" : "text-blue-500"}
              />{" "}
              {(noRevision || props.to_revision === undefined) &&
                (props.revision === null ? "-" : props.revision)}
              {!noRevision && props.to_revision !== undefined && (
                <>
                  from {props.to_revision === null ? "-" : props.to_revision} to{" "}
                  {props.to_revision === null ? "-" : props.to_revision}
                </>
              )}
            </>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>
            {noRevision
              ? "No Config Revision"
              : `Config Revision ${props.revision}` +
                (props.to_revision !== undefined
                  ? ` to ${props.to_revision}`
                  : "")}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
