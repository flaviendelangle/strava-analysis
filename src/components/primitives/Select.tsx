import { Select as BaseSelect } from "@base-ui-components/react/select";

export function Select<TValue extends string = string>(
  props: SelectProps<TValue>,
) {
  const { options, ...other } = props;

  return (
    <BaseSelect.Root {...other}>
      <BaseSelect.Trigger className="flex h-10 min-w-36 select-none items-center justify-between gap-3 rounded-md border border-gray-200 pl-3.5 pr-3 text-base text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-800 data-[popup-open]:bg-gray-800">
        <BaseSelect.Value placeholder={options[0]?.value} />
        <BaseSelect.Icon className="flex">
          <ChevronUpDownIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="outline-none" sideOffset={8}>
          <BaseSelect.Popup className="group origin-[var(--transform-origin)] rounded-md bg-gray-800 py-1 text-white shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-100 data-[ending-style]:scale-90 data-[side=none]:data-[starting-style]:scale-100 data-[starting-style]:scale-90 data-[ending-style]:opacity-0 data-[ending-style]:opacity-100 data-[side=none]:data-[starting-style]:opacity-100 data-[starting-style]:opacity-0 data-[ending-style]:transition-none data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            <BaseSelect.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=right]:left-[-13px] data-[side=top]:bottom-[-8px] data-[side=left]:rotate-90 data-[side=right]:-rotate-90 data-[side=top]:rotate-180">
              <ArrowSvg />
            </BaseSelect.Arrow>
            {options.map((option) => (
              <BaseSelect.Item
                className="grid min-w-[var(--anchor-width)] cursor-default select-none grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pl-2.5 pr-4 text-sm leading-4 outline-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4"
                value={option.value}
                key={option.value}
              >
                <BaseSelect.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </BaseSelect.ItemIndicator>
                <BaseSelect.ItemText className="col-start-2">
                  {option.label}
                </BaseSelect.ItemText>
              </BaseSelect.Item>
            ))}
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

function ArrowSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
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

export interface SelectProps<TValue extends string = string>
  extends Pick<BaseSelect.Root.Props<TValue>, "value" | "onValueChange"> {
  options: { value: TValue; label: string }[];
}
