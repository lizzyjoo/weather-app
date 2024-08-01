class Weather {
  constructor(
    conditions,
    day,
    address,
    datetime,
    feelslike,
    humidity,
    precipprob,
    icon,
    temp,
    tempmin,
    tempmax,
    windspeed,
    sunrise,
    sunset,
    uvindex
  ) {
    this.conditions = conditions;
    this.day = day;
    this.address = address;
    this.datetime = datetime;
    this.feelslike = feelslike;
    this.humidity = humidity;
    this.precipprob = precipprob;
    this.icon = icon;
    this.temp = temp;
    this.tempmin = tempmin;
    this.tempmax = tempmax;
    this.windspeed = windspeed;
    this.sunrise = sunrise;
    this.sunset = sunset;
    this.uvindex = uvindex;
  }
}

export default Weather;
