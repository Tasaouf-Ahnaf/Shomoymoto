import moment from "moment";
import "moment/locale/bn";
import { getLanguage } from "./i18n";

const localeFor = (language) => (language === "bn" ? "bn" : "en");

export const FormatDate = (timestamp) => {
  return new Date(timestamp);
};

export const formatDateForText = (date) => {
  const locale = localeFor(getLanguage());
  return moment(date).locale(locale).format("D MMM YYYY");
};

export const formatTime = (time) => {
  const locale = localeFor(getLanguage());
  const date = moment(time);
  const meridiem = date.hour() < 12 ? "AM" : "PM";
  return `${date.locale(locale).format("h:mm")} ${meridiem}`;
};

export const getDatesRange = (startDate, endDate) => {
  const start = moment(new Date(startDate), "D MMM YYYY");
  const end = moment(new Date(endDate), "D MMM YYYY");
  const dates = [];
  while (start.isSameOrBefore(end)) {
    dates.push(start.format("D/MMM/YYYY"));
    start.add(1, "days");
  }

  return dates;
};

export const GetDateRangeToDisplay = (language = "en") => {
  const locale = localeFor(language);
  const dateList = [];
  for (let i = 0; i <= 7; i++) {
    dateList.push({
      date: moment().locale(locale).add(i, "days").format("DD"), //24
      day: moment().locale(locale).add(i, "days").format("ddd"), //tue
      formattedDate: moment().add(i, "days").format("D/MMM/YYYY"),
    });
  }

  return dateList;
};

export const GetPreviousDateRangeToDisplay = (count = 7, language = "en") => {
  const locale = localeFor(language);
  const dateList = [];
  for (let i = count; i >= 1; i--) {
    const d = moment().subtract(i, "days");
    dateList.push({
      date: d.clone().locale(locale).format("DD"),
      day: d.clone().locale(locale).format("ddd"),
      formattedDate: d.format("D/MMM/YYYY"),
    });
  }

  return dateList;
};
