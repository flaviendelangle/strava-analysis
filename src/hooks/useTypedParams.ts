import { useParams } from "next/navigation";
import { z } from "zod";

export const useTypedParams = <T extends z.Schema>(schema: T) => {
  const params = useParams();

  return params == null
    ? null
    : (schema.parse(params) as z.infer<typeof schema>);
};
