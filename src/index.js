import "./style.css";
import Weather from "./weather";
import Daily from "./daily";
import Hour from "./hour";
import Storage from "./storage";

let currentUnit = "C"; // Default unit is Celsius

// google places API: address autocomplete wdiget
(function (g) {
  var h,
    a,
    k,
    p = "The Google Maps JavaScript API",
    c = "google",
    l = "importLibrary",
    q = "__ib__",
    m = document,
    b = window;
  b = b[c] || (b[c] = {});
  var d = b.maps || (b.maps = {}),
    r = new Set(),
    e = new URLSearchParams(),
    u = () =>
      h ||
      (h = new Promise(async (f, n) => {
        await (a = m.createElement("script"));
        e.set("libraries", [...r] + "");
        for (k in g)
          e.set(
            k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
            g[k]
          );
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => (h = n(Error(p + " could not load.")));
        a.nonce = m.querySelector("script[nonce]")?.nonce || "";
        m.head.append(a);
      }));
  d[l]
    ? console.warn(p + " only loads once. Ignoring:", g)
    : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
})({
  key: process.env.GOOGLE_MAPS_API_KEY, // The environment variable is injected here
  v: "weekly",
});

let autocomplete;

async function initAutocomplete() {
  const { Places } = await google.maps.importLibrary("places");
  const input = document.getElementById("pac-input");
  const options = {
    types: ["(cities)"],
    fields: ["address_components", "geometry", "name"], // Restrict search to cities
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      console.log("No details available for input: '" + place.name + "'");
      return;
    }

    // Extract city name and other details
    const city = place.address_components.find((comp) =>
      comp.types.includes("locality")
    )?.long_name;
    const state = place.address_components.find((comp) =>
      comp.types.includes("administrative_area_level_1")
    )?.short_name;
    const country = place.address_components.find((comp) =>
      comp.types.includes("country")
    )?.short_name;

    // Form a more specific location query
    const locationQuery = `${city}, ${state}, ${country}`;
    // const [loccity, locstate, loccountry] = locationQuery
    //   .split(", ")
    //   .map((part) => part.trim());
    const locale = getLocaleFromCountry(country);

    // save to storage
    Storage.saveLocation(locationQuery);

    // Call getWeather with the more specific location
    getWeather(locationQuery, locale);
  });
}

function initialize() {
  const savedLocation = Storage.getLocation();
  if (savedLocation) {
    getWeather(savedLocation);
  } else {
    // by default, set it to cambridge
    getWeather("Cambridge, MA, USA");
  }
}

function domEventListeners() {}

// get weather data based on location query
async function getWeather(city, locale) {
  if (city) {
    try {
      const response = await fetch(
        `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
          city
        )}?unitGroup=metric&key=8RAASHVT54D3JGUW2C66YQN2E&contentType=json`
      );
      const data = await response.json();
      console.log(data);
      // process data
      processWeatherData(data, locale);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  } else {
    alert("Please enter a city name.");
  }
}

initAutocomplete();

// extract only the data that I need, return as an object
function processWeatherData(data, locale) {
  // create a weather object for 'today'

  const todayWeather = new Weather(
    data.currentConditions.conditions,
    getDayName(data.days[0].datetime, locale),
    data.resolvedAddress,
    formatHour(data.currentConditions.datetime),
    Math.round(data.currentConditions.feelslike),
    Math.round(data.currentConditions.humidity),
    data.currentConditions.precipprob,
    data.currentConditions.icon,
    Math.round(data.currentConditions.temp),
    data.currentConditions.tempmin,
    data.currentConditions.tempmax,
    data.currentConditions.windspeed,
    formatTime(data.currentConditions.sunrise),
    formatTime(data.currentConditions.sunset),
    data.currentConditions.uvindex
  );

  displayTodayWeather(todayWeather);

  // hourly info for 'today'
  const todayHourly = data.days[0].hours;
  const filteredHourlyData = filterHourlyData(
    todayHourly,
    data.currentConditions.datetime
  );

  const tomorrowHourly = data.days[0].hours;
  const combined = filteredHourlyData.concat(tomorrowHourly);
  const hourlyData = combined.map(
    (hour) =>
      new Hour(
        formatHour(hour.datetime),
        Math.round(hour.temp),
        hour.icon,
        hour.precipprob
      )
  );

  displayHourlyWeather(hourlyData);
  document.getElementById("hourly").addEventListener("click", () => {
    displayHourlyWeather(hourlyData);
    updateTemperatureUI();
  });

  // create 'daily' objects from the 'days' of JSON
  const days = data.days;
  const weekOverview = [];

  // Get the first 7 days from the days array
  const daysToProcess = days.slice(1, 8);

  daysToProcess.forEach((day) => {
    const dayInfo = new Daily(
      getDayName(day.datetime, locale),
      day.icon,
      day.precipprob,
      Math.round(day.temp),
      day.tempmin,
      day.tempmax,
      day.conditions
    );
    weekOverview.push(dayInfo); // Add to the weekOverview array
  });

  displayForecast(weekOverview);
  document.getElementById("week").addEventListener("click", () => {
    displayForecast(weekOverview);
    updateTemperatureUI();
  });
}
const countryToLocaleMap = {
  US: "en-US",
  CA: "en-CA",
  GB: "en-GB",
  FR: "fr-FR",
  DE: "de-DE",
  // Add more mappings as needed
};

function getLocaleFromCountry(countryCode) {
  return countryToLocaleMap[countryCode] || "en-US"; // Default to en-US if not found
}
function getDayName(dateStr, locale) {
  const trimmedDateStr = dateStr.trim();
  const date = new Date(trimmedDateStr + "T00:00:00Z"); // Ensure date is in UTC

  if (isNaN(date.getTime())) {
    console.error("Invalid date:", trimmedDateStr);
    return "Invalid Date";
  }
  return date.toLocaleDateString(locale, { weekday: "long", timeZone: "UTC" });
}

function getNextDayHourlyData(data) {
  const todayHourly = data.days[0].hours;
  const nextDayHourly = data.days[1]?.hours || []; // Handle case where there's no next day's data

  return todayHourly.concat(nextDayHourly);
}

function filterHourlyData(hours, currentHourStr) {
  const currentHour = new Date(`1970-01-01T${currentHourStr}Z`).getTime();
  const endTime = currentHour + 24 * 60 * 60 * 1000; // 24 hours later in milliseconds

  return hours.filter((hour) => {
    const hourTime = new Date(`1970-01-01T${hour.datetime}Z`).getTime();
    return hourTime >= currentHour && hourTime <= endTime;
  });
}

function formatHour(timeStr) {
  const hour = Number(timeStr.split(":")[0]);

  // Determine AM or PM
  const period = hour >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour to 12-hour format
  const adjustedHour = hour % 12 || 12;

  // Format the hour string
  return `${adjustedHour} ${period}`;
}

// display HH:MM AM/PM
function formatTime(timeStr) {
  // Extract the hour and minute parts from the time string
  const [hour, minute] = timeStr.split(":").map(Number);

  // Determine AM or PM
  const period = hour >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour to 12-hour format
  const adjustedHour = hour % 12 || 12;

  // Format the time string
  return `${adjustedHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function displayTodayWeather(weather) {
  // DOM elements
  //main info
  const conditions = document.querySelector(".conditions");
  const day = document.querySelector(".day");
  const todayIcon = document.querySelector(".today-icon");
  const todayTemp = document.querySelector(".today-temp");
  todayTemp.classList.add("ctemp", "temp");
  todayTemp.setAttribute("data-original-temp", weather.temp);
  const currLocation = document.querySelector(".current-location");
  const currTimeDate = document.querySelector(".current-time-date");
  const fahrenheitBtn = document.getElementById("fdegree");
  const celciusBtn = document.getElementById("cdegree");

  // additional info
  const feelsLike = document.getElementById("feels-like");
  feelsLike.classList.add("temp", "ctemp");
  feelsLike.setAttribute("data-original-temp", weather.feelslike);
  const humidity = document.getElementById("humidity");
  const rainChance = document.getElementById("rain-chance");
  const windSpeed = document.getElementById("wind-speed");
  const uv = document.getElementById("uv");
  const sunrise = document.getElementById("sunrise");
  const sunset = document.getElementById("sunset");

  // current condition
  conditions.textContent = weather.conditions;
  day.textContent = weather.day;
  currTimeDate.textContent = `As of ${weather.datetime}`;

  // create icon and append to today-icon div
  const icon = createWeatherIcon(weather.icon);
  icon.id = "today";
  todayIcon.innerHTML = "";
  todayIcon.appendChild(icon);

  // temp
  todayTemp.textContent = `${weather.temp}°C`;

  // location
  currLocation.textContent = weather.address;

  feelsLike.textContent = `${weather.feelslike}°C`;
  humidity.textContent = `${weather.humidity}%`;
  rainChance.textContent = `${weather.precipprob}%`;
  windSpeed.textContent = `${weather.windspeed} km/hour`;
  uv.textContent = `${weather.uvindex}`;
  sunrise.textContent = `${weather.sunrise}`;
  sunset.textContent = `${weather.sunset}`;

  // event listener to switch degree units
  fahrenheitBtn.addEventListener("click", () => {
    currentUnit = "F";
    updateTemperatureUI();
  });
  celciusBtn.addEventListener("click", () => {
    currentUnit = "C";
    updateTemperatureUI();
  });
}

function createWeatherIcon(iconType) {
  const iconMapping = {
    snow: "icon-snow",
    rain: "icon-rain",
    fog: "icon-fog",
    wind: "icon-wind",
    cloudy: "icon-cloudy",
    "partly-cloudy-day": "icon-partly-cloudy-day",
    "partly-cloudy-night": "icon-partly-cloudy-night",
    "clear-day": "icon-clear-day",
    "clear-night": "icon-clear-night",
  };
  const iconClass = iconMapping[iconType] || "icon-default"; // Default class if icon type is not found
  const iconElement = document.createElement("div");
  iconElement.className = `${iconClass}`;
  return iconElement;
}

// parameter: array of hourly objects (24hrs)
function displayHourlyWeather(hourlyData) {
  const forecastContainer = document.querySelector(".weather-over-time");
  forecastContainer.classList.add("scroll");
  forecastContainer.innerHTML = "";

  hourlyData.forEach((hour) => {
    const hourDiv = document.createElement("div");
    hourDiv.classList.add("hour");
    hourDiv.innerHTML = `
    <p class="hour-time">${hour.datetime}</p>
    <div class="day-rain-div">
        <div class="rain-prob-icon"></div>
        <p>${hour.precipprob}%</p>
    </div>
    <div class="${createWeatherIcon(hour.icon).className}"></div>
    <p div class="ctemp temp" data-original-temp="${hour.temp}">${
      hour.temp
    }°C</p>
    
    `;

    forecastContainer.appendChild(hourDiv);
  });
}

// array of 'daily' objects
function displayForecast(weekOverview) {
  // DOM elements
  const forecastContainer = document.querySelector(".weather-over-time");
  forecastContainer.innerHTML = "";
  weekOverview.forEach((day) => {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");

    const datetimeP = document.createElement("p");
    datetimeP.textContent = day.datetime;
    datetimeP.classList.add("day-name");

    const dayRainDiv = document.createElement("div");
    dayRainDiv.classList.add("day-rain-div");

    const rainProbIconDiv = document.createElement("div");
    rainProbIconDiv.classList.add("rain-prob-icon");

    const precipProbP = document.createElement("p");
    precipProbP.classList.add("precip-prob");
    precipProbP.textContent = `${day.precipprob}%`;

    dayRainDiv.appendChild(rainProbIconDiv);
    dayRainDiv.appendChild(precipProbP);

    const weatherIconDiv = createWeatherIcon(day.icon);

    const minmaxDiv = document.createElement("div");
    minmaxDiv.classList.add("minmax");

    const minTempP = document.createElement("p");
    minTempP.classList.add("ctemp", "temp");
    minTempP.setAttribute("data-original-temp", Math.round(day.tempmin));
    minTempP.textContent = `${Math.round(day.tempmin)}°C`;

    const separatorSpan = document.createElement("span");
    separatorSpan.textContent = "/";

    const maxTempP = document.createElement("p");
    maxTempP.classList.add("ctemp", "temp");
    maxTempP.setAttribute("data-original-temp", Math.round(day.tempmax));
    maxTempP.textContent = `${Math.round(day.tempmax)}°C`;

    minmaxDiv.appendChild(minTempP);
    minmaxDiv.appendChild(separatorSpan);
    minmaxDiv.appendChild(maxTempP);

    dayDiv.appendChild(datetimeP);
    dayDiv.appendChild(dayRainDiv);
    dayDiv.appendChild(weatherIconDiv);
    dayDiv.appendChild(minmaxDiv);

    forecastContainer.appendChild(dayDiv);
  });
}

function convertTemperature(value, toUnit) {
  if (toUnit === "F") {
    return (value * 9) / 5 + 32;
  }
  return value; // Default to Celsius conversion
}

function updateTemperatureUI() {
  const tempElements = document.querySelectorAll(".temp");

  tempElements.forEach((element) => {
    const originalValue = parseFloat(
      element.getAttribute("data-original-temp")
    );
    if (currentUnit === "F") {
      const fahrenheitValue = convertTemperature(originalValue, "F");
      element.textContent = `${Math.round(fahrenheitValue)}°F`;
    } else {
      element.textContent = `${Math.round(originalValue)}°C`;
    }
  });
}

initialize();
