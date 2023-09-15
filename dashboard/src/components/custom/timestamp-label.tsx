import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export function TimestampLabel(props: {
  label: string;
  timestamp: number | null;
  labelClassName?: string;
}) {
  if (props.timestamp === null) {
    return (
      <div className="font-regular">
        not <span className={props.labelClassName}>{props.label}</span> yet
      </div>
    );
  } else {
    return (
      <div className="font-regular">
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger>
              <span className={props.labelClassName}>{props.label}</span>{" "}
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
