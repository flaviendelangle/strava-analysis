import * as React from "react";

import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";

import { trpc } from "~/utils/trpc";

export default function ActivitiesStream(props: ActivitiesStreamProps) {
  const { id, type } = props;

  const activityQuery = trpc.activities.getActivityWithMap.useQuery({ id });

  const activityStreamsQuery = trpc.activities.getActivityStreams.useQuery({
    id,
  });

  const series = React.useMemo(() => {
    if (!activityStreamsQuery.data || !activityQuery.data) {
      return [];
    }

    const startDate = dayjs(activityQuery.data.startDateLocal);

    return [
      {
        name: type,
        type: "line",
        showSymbol: false,
        data:
          activityStreamsQuery.data
            ?.find((stream: any) => stream.type === type)
            .data.map((el, index) => [
              startDate.add(index, "second").toDate(),
              el,
            ]) ?? [],
      },
    ];
  }, [activityStreamsQuery.data, type]);

  console.log(series);

  return (
    <div className="h-64 w-96">
      <ReactECharts
        style={{ height: "100%" }}
        option={{
          series,
          xAxis: {
            type: "time",
          },
          yAxis: {
            type: "value",
          },
        }}
      />
    </div>
  );
}

interface ActivitiesStreamProps {
  id: number;
  type: "heartrate" | "watts";
}
