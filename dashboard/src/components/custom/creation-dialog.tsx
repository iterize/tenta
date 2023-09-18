import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconCircleCheckFilled, IconCircleDashed } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function CreationDialog(props: {
  action: "create" | "update";
  label: "sensor" | "network";
  submit: (name: string) => Promise<void | string>;
  onSuccess?: (newIdentifier: string) => void;
  children: React.ReactNode;
  previousValue?: string;
}) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const rules = [
    {
      label: "at least one character",
      valid: name.length > 0,
    },
    {
      label: "max. 64 characters",
      valid: name.length <= 64,
    },
    {
      label: "only lowercase letters/numbers/ dashes",
      valid: name.match(/^[a-z0-9-]*$/) !== null,
    },
    {
      label: "no leading/trailing/consecutive dashes",
      valid:
        name.match(/--/) === null &&
        name.match(/^-/) === null &&
        name.match(/-$/) === null,
    },
  ];

  const formatIsValid = rules.every((rule) => rule.valid);

  async function submit() {
    if (!formatIsValid) {
      toast.error(`Invalid ${props.label} name`);
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(props.submit(name), {
        loading: `${
          props.action.slice(0, 1).toUpperCase() +
          props.action.slice(1, -1) +
          "ing"
        } ${props.label}`,
        success: (data) => {
          if (props.onSuccess && typeof data === "string") {
            props.onSuccess(data);
          }
          setIsOpen(false);
          return `Successfully ${props.action + "d"} ${props.label}`;
        },
        error: `Could not ${props.action} ${props.label}`,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        setName(props.previousValue || "");
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-[calc(640px-2rem)] rounded-xl">
        <DialogHeader>
          <DialogTitle className="w-full text-center capitalize">
            {props.action} {props.label}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row items-baseline gap-3">
          <Label className="hidden text-right capitalize whitespace-nowrap md:block">
            {props.label} Name:
          </Label>
          <div className="flex flex-col items-start justify-start flex-grow gap-y-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-0.5"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submit();
                }
              }}
            />
            {props.previousValue !== undefined && (
              <div className="px-3 mb-2 -mt-2 text-xs text-slate-600">
                previously{" "}
                <span className="italic font-semibold">
                  {props.previousValue}
                </span>
              </div>
            )}
            {rules.map((rule, index) => (
              <div
                key={index}
                className={
                  "flex flex-row items-center gap-x-2 text-xs font-medium px-3 h-3.5 " +
                  (rule.valid ? "text-emerald-600" : "text-rose-600")
                }
              >
                {rule.valid ? (
                  <IconCircleCheckFilled size={14} />
                ) : (
                  <IconCircleDashed size={14} />
                )}

                <div>{rule.label}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={isSubmitting ? () => {} : submit}
            variant={isSubmitting ? "ghost" : "default"}
            className="capitalize"
          >
            {isSubmitting ? "..." : props.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
