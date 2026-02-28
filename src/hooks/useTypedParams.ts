import { useParams } from "next/navigation";

export const useTypedParams = <T extends Record<string, "string">>(
  _schema: T,
): { [K in keyof T]: string } | null => {
  const params = useParams();
  return params as { [K in keyof T]: string } | null;
};
