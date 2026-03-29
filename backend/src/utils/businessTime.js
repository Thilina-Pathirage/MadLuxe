const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Colombo';

const toUtcRange = (start, end) => ({
  dateFrom: start.utc().toDate(),
  dateTo: end.utc().toDate(),
});

const resolveBusinessDateRange = ({
  period = 'monthly',
  year,
  month,
  dateFrom: qDateFrom,
  dateTo: qDateTo,
  timezone: businessTimezone = DEFAULT_TIMEZONE,
}) => {
  const buildDefaultRange = () => {
    if (period === 'daily' && month) {
      const start = dayjs.tz(`${month}-01`, businessTimezone).startOf('month');
      return { start, end: start.endOf('month') };
    }

    const resolvedYear = parseInt(year, 10) || dayjs().tz(businessTimezone).year();
    const start = dayjs.tz(`${resolvedYear}-01-01`, businessTimezone).startOf('year');
    return { start, end: start.endOf('year') };
  };

  if (qDateFrom || qDateTo) {
    const fallback = buildDefaultRange();
    return toUtcRange(
      qDateFrom ? dayjs.tz(qDateFrom, businessTimezone).startOf('day') : fallback.start,
      qDateTo ? dayjs.tz(qDateTo, businessTimezone).endOf('day') : fallback.end
    );
  }

  const { start, end } = buildDefaultRange();
  return toUtcRange(start, end);
};

const getBusinessMonthRange = (date = new Date(), businessTimezone = DEFAULT_TIMEZONE) => {
  const start = dayjs(date).tz(businessTimezone).startOf('month');
  return toUtcRange(start, start.endOf('month'));
};

const formatBusinessBucketLabel = (date, period, businessTimezone = DEFAULT_TIMEZONE) =>
  dayjs(date).tz(businessTimezone).format(period === 'daily' ? 'D' : 'MMM');

module.exports = {
  DEFAULT_TIMEZONE,
  dayjs,
  formatBusinessBucketLabel,
  getBusinessMonthRange,
  resolveBusinessDateRange,
};
