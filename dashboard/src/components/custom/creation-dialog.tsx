import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import toast from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IconCircleCheckFilled, IconCircleDashed } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function CreationDialog(props: {
  action: "create" | "update";
  label: "sensor" | "network";
  submit: (name: string) => Promise<void>;
  children: React.ReactNode;
  prefill?: string;
}) {
  const [name, setName] = useState(props.prefill ?? "");
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
        success: `Successfully ${props.action + "d"} ${props.label}`,
        error: `Could not ${props.action} ${props.label}`,
      });
      setIsOpen(false);
      setName("");
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
        setName("");
      }}
    >
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {props.action} {props.label}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row items-baseline gap-x-3">
          <Label className="text-right capitalize whitespace-nowrap">
            {props.label} Name
          </Label>
          <div className="flex flex-col items-start justify-start flex-grow gap-y-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            {rules.map((rule, index) => (
              <div
                key={index}
                className={
                  "flex flex-row items-center gap-x-2 text-xs font-medium px-3 " +
                  (rule.valid ? "text-emerald-700" : "text-rose-700")
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
