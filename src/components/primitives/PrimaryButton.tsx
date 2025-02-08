export function PrimaryButton(
  props: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">,
) {
  return (
    <button
      className="inline-flex gap-4 rounded-md bg-purple-800 px-4 py-2 text-white hover:bg-purple-700"
      {...props}
    />
  );
}
