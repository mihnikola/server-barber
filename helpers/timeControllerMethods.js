//prvi slucaj ukoliko se datum nalazi izmedju startDate i endDate. Automatski vracan prazan
//Npr.. Imam startDate 10/09/2025 i endDate 15/09/2025, a moj kriterijum je 12/09/2025
//Automatski vraca prazan niz, zato sto odsustvo traje 6 dana
//done

export const betweenDateUnavailability = async (
  Availability,
  rangeStart,
  rangeEnd,
  emplId,
  selectedDate
) => {
  const reservationsUnavailability = await Availability.find({
    status: { $nin: [1] },
    employer: emplId,
    type: 1,
    startDate: { $lt: rangeStart },
    endDate: { $gt: rangeEnd },
  });
  if (reservationsUnavailability.length > 0) {
    if (
      reservationsUnavailability[0].startDate.toISOString().split("T")[0] !==
        selectedDate ||
      reservationsUnavailability[0].endDate.toISOString().split("T")[0] !==
        selectedDate
    )
      return true;
  } else {
    return false;
  }
};



//drugi slucaj ukoliko se datum nalazi u objektu gde su odsustva i rezervacije. Uzima bez tipa i kalkulise 
//slobodne termine u satima i minutima
//done
export const getAvailableTimes = async (
  Availability,
  emplId,
  rangeEnd,
  rangeStart,
  timesData,
  criteriaDate,
  serviceDurationMinutes
) => {
  const reservations = await Availability.find({
    status: { $nin: [1] },
    employer: emplId,
    startDate: { $lt: rangeEnd },
    endDate: { $gt: rangeStart },
  });

  const unavailableTimes = new Set();

  timesData.forEach((timeSlot) => {
    const [hours, minutes] = timeSlot.value.split(":").map(Number);
    const serviceStartTime = new Date(criteriaDate);
    serviceStartTime.setUTCHours(hours, minutes, 0, 0);

    const serviceEndTime = new Date(serviceStartTime);
    serviceEndTime.setUTCMinutes(
      serviceStartTime.getUTCMinutes() + serviceDurationMinutes
    );

    // Proveravamo da li se ova usluga preklapa s nekom od rezervacija
    const isOverlapped = reservations.some((reservation) => {
      const reservationStart = reservation.startDate;
      const reservationEnd = reservation.endDate;

      // Proveravamo preklapanje vremena. Termin je zauzet ako se [početak nove usluge, kraj nove usluge)
      // preklapa sa [početak rezervacije, kraj rezervacije).
      return (
        serviceStartTime < reservationEnd && serviceEndTime > reservationStart
      );
    });

    // Ako se preklapa, dodajemo ga u nedostupne termine
    if (isOverlapped) {
      unavailableTimes.add(timeSlot.value);
    }
  });

  const availableTimes = timesData.filter(
    (timeSlot) => !unavailableTimes.has(timeSlot.value)
  );



  return availableTimes;
};
