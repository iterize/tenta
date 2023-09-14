import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconFileSettings } from "@tabler/icons-react";

export function ConfigRevisionTag(props: { revision: number | null }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger>
          <div
            className={
              "flex-shrink-0 pl-1.5 pr-2 py-0.5 text-sm bg-blue-150 rounded-md font-medium flex flex-row gap-x-1.5 items-center justify-center " +
              (props.revision === null
                ? "bg-slate-150 text-slate-800"
                : "bg-blue-150 text-blue-800")
            }
          >
            <>
              <IconFileSettings
                size={14}
                className={
                  props.revision === null ? "text-slate-500" : "text-blue-500"
                }
              />{" "}
              {props.revision === null ? "-" : props.revision}
            </>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>
            {props.revision === null
              ? "No Config Revision"
              : `Config Revision ${props.revision}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
