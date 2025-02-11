import * as React from "react";

import { useCookies } from "react-cookie";

import { Checkbox } from "@base-ui-components/react/checkbox";
import { CheckboxGroup } from "@base-ui-components/react/checkbox-group";
import { Dialog } from "@base-ui-components/react/dialog";

import { Tooltip } from "~/components/primitives/Tooltip";
import { formatActivityType } from "~/utils/format";
import { trpc } from "~/utils/trpc";

import { NavBarButton } from "./NavBarButton";

export function ParametersDialog() {
  const activityTypesQuery = trpc.strava.activityTypes.useQuery();
  const [state, setState] = useCookies(["activity-type"]);

  return (
    <Dialog.Root>
      <Tooltip label="Settings">
        <Dialog.Trigger
          render={
            <NavBarButton
              label="Settings"
              svgPath="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6"
            />
          }
        />
      </Tooltip>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black opacity-70 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-gray-700 p-6 text-gray-100 outline outline-1 outline-gray-600 transition-all duration-150 data-[ending-style]:scale-90 data-[starting-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
          <Dialog.Title className="mb-4 text-3xl font-medium">
            Settings
          </Dialog.Title>
          <div className="mb-6 text-base text-white">
            <CheckboxGroup
              aria-labelledby="activity-type-caption"
              value={state["activity-type"]}
              onValueChange={(newValue) => setState("activity-type", newValue)}
              className="flex flex-col items-start gap-2 text-white"
            >
              <div className="font-medium" id="activity-type-caption">
                Activity type
              </div>
              {activityTypesQuery.data?.map((activityType) => (
                <label className="flex items-center gap-2" key={activityType}>
                  <Checkbox.Root
                    name={activityType}
                    className="flex size-5 items-center justify-center rounded-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800 data-[unchecked]:border data-[unchecked]:border-gray-200 data-[checked]:bg-gray-300"
                  >
                    <Checkbox.Indicator className="flex text-gray-900 data-[unchecked]:hidden">
                      <CheckIcon className="size-3" />
                    </Checkbox.Indicator>
                  </Checkbox.Root>
                  {formatActivityType(activityType)}
                </label>
              ))}
            </CheckboxGroup>
          </div>
          <div className="flex justify-end gap-4">
            <Dialog.Close className="flex h-10 select-none items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3.5 text-base font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-100">
              Close
            </Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      fill="currentcolor"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      {...props}
    >
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
