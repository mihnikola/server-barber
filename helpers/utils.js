
const convertToTimeStamp = (dateStr, timeStr) => {
    // Parse the date string into a JavaScript Date object
  
    // Parse the date string into a JavaScript Date object
    const dateObj = new Date(dateStr);
  
    // Split the time string into hours and minutes
    const [hours, minutes] = timeStr.split(":");
  
    // Set the hours and minutes on the Date object
    dateObj.setUTCHours(hours); // Set UTC hours
    dateObj.setUTCMinutes(minutes); // Set UTC minutes
  
    // Convert the Date object into the ISO 8601 format string in UTC timezone
    return dateObj.toISOString();
  };
  const prettyUrlDataImage = (data) => {
    return data.replace("\\", "/");
  };

  module.exports = {
    prettyUrlDataImage,
    convertToTimeStamp,
  };