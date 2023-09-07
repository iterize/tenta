import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export function TimestampLabel(props: {
  label: "created" | "received" | "published" | "acknowledged";
  timestamp: number | null;
}) {
  if (props.timestamp === null) {
    return (
      <div className="pl-1">
        not{" "}
        <span className="font-semibold text-emerald-800">{props.label}</span>{" "}
        yet
      </div>
    );
  } else {
    return (
      <div className="pl-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="font-semibold text-emerald-900">
                {props.label}
              </span>{" "}
              {formatDistanceToNow(new Date(props.timestamp * 1000), {
                addSuffix: true,
              })}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{new Date(props.timestamp * 1000).toISOString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
}
