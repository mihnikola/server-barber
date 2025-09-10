function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function formatDateInTimeZone(now, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const dateParts = {};
  parts.forEach(({ type, value }) => {
    dateParts[type] = value;
  });
  const baseIso = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}.000`;
  return baseIso + "Z";
}

const getTimeZoneAndCurrentData = (timeZone, data, now) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formattedDate = formatter.format(now);
  const filterMinutes = timeToMinutes(formattedDate);
  const filtered = data.filter(
    (item) => timeToMinutes(item.value) > filterMinutes
  );
  return filtered;
};

export const getTimeZoneSameDay = (selectedDate, timeZone, data) => {
  const now = new Date();

  const formatterData = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [day, month, year] = formatterData.format(now).split("/");
  const formatData = `${year}-${day}-${month}`;

  if (formatData === selectedDate) {
    return getTimeZoneAndCurrentData(timeZone, data, now);
  } else {
    return data;
  }
};

export const getSortReservationData = (response, timeZone) => {
  const newDate = new Date();

  const date = formatDateInTimeZone(newDate, timeZone);

  const { futureReservations, modifiedPastReservations } = response.reduce(
    (acc, reservation) => {
      if (reservation.startDate > new Date(date)) {
        acc.futureReservations.push(reservation.toObject());
      } else {
        acc.modifiedPastReservations.push({
          ...reservation.toObject(),
          past: true,
        });
      }
      return acc;
    },
    { futureReservations: [], modifiedPastReservations: [] }
  );
  futureReservations.sort(
    (a, b) => new Date(a.startDate) - new Date(b.startDate)
  );
  modifiedPastReservations.sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  );
  return [...futureReservations, ...modifiedPastReservations];
};
