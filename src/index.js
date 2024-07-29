import "./style.css"; 
import Weather from './weather';
import Daily from "./daily";
import Hour from "./hour";
let autocomplete;

async function initAutocomplete() {
    const { Places } = await google.maps.importLibrary("places");
    const input = document.getElementById("pac-input");
    const options = {
        types: ['(cities)'], 
        fields: ['address_components', 'geometry', 'name'], // Restrict search to cities
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }

        // Extract city name and other details
        const city = place.address_components.find(comp => comp.types.includes("locality"))?.long_name;
        const state = place.address_components.find(comp => comp.types.includes("administrative_area_level_1"))?.short_name;
        const country = place.address_components.find(comp => comp.types.includes("country"))?.short_name;
        
        // Form a more specific location query
        const locationQuery = `${city}, ${state}, ${country}`;
        console.log('Selected Location:', locationQuery);

        // Call getWeather with the more specific location
        getWeather(locationQuery);
    });
}

async function getWeather(city) {
    if (city) {
        try {
            const response = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(city)}?unitGroup=metric&key=8RAASHVT54D3JGUW2C66YQN2E&contentType=json`);
            const data = await response.json();
            console.log(data);
            // process data 
            processWeatherData(data)
        } catch (error) {
            console.error('Error fetching weather data:', error);
        }
    } else {
        alert('Please enter a city name.');
    }
}

initAutocomplete();

// extract only the data that I need, return as an object
function processWeatherData(data) {
    // create a weather object for 'today'
    const todayWeather = new Weather(
        data.currentConditions.conditions,
        data.currentConditions.datetime,
        data.currentConditions.feelslike,
        data.currentConditions.humidity,
        data.currentConditions.icon,
        data.currentConditions.temp,
        data.currentConditions.tempmin,
        data.currentConditions.tempmax,
        data.currentConditions.windspeed,
        data.currentConditions.sunrise,
        data.currentConditions.sunset,
        data.currentConditions.uvindex
    )
    displayTodayWeather(todayWeather);

    // hourly info for 'today'
    const todayHourly = data.days[0].hours;
    const hourlyData = []
    todayHourly.forEach(hour => {
        const hourData = new Hour(
            hour.datetime,
            hour.temp,
            hour.precipprob
        )
        hourlyData.push(hourData);
    })
    displayHourlyWeather(hourlyData);

    // create 'daily' objects from the 'days' of JSON
    const days = data.days;
    const weekOverview = [];
    
    // Get the first 7 days from the days array
    const daysToProcess = days.slice(1, 8);
    
    daysToProcess.forEach(day => {
        const dayInfo = new Daily(
            day.datetime,
            day.icon,
            day.temp,
            day.tempmin,
            day.tempmax,
            day.conditions
        );
        weekOverview.push(dayInfo); // Add to the weekOverview array
    });

    displayForecast(weekOverview);
   
}


function displayTodayWeather(weather) {
    // DOM elements
    const conditions = document.querySelector(".conditions");
    const todayIcon = document.querySelector(".today-icon");
    const todayTemp = document.querySelector(".today-temp");
    const currLocation = document.querySelector(".current-location");
    const currTimeDate = document.querySelector(".current-time-date");

    // append last updated time info 
    const currTimeText = document.createElement("p");
    currTimeText.classList.add('curr-time');
    currTimeText.textContent = weather.datetime;
    conditions.textContent = weather.conditions;
    currTimeDate.appendChild(currTimeText);

    
}

// parameter: array of hourl objects (24hrs)
function displayHourlyWeather(hourlyData) {

}

// array of 'daily' objects
function displayForecast(weekOverview){

}