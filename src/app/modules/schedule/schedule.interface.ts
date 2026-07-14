export type ISchedule = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timezoneOffset?: string;
};

export type IFilterRequest = {
  startDate?: string | undefined;
  endDate?: string | undefined;
};
