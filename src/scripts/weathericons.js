  import { WeatherProvider } from "./getweather.js";

const WeatherIcons =
{
  CLEAR: "clear",
  CLOUDS: "few-clouds",
  FEW_CLOUDS: "few-clouds",
  FOG: "fog",
  FREEZING_RAIN: "freezing-rain",
  FREEZING_SCATTERED_RAIN: "freezing-rain",
  FREEZING_SCATTERED_RAIN_STORM: "freezing-rain",
  FREEZING_STORM: "freezing-storm",
  HAIL: "snow",
  MANY_CLOUDS: "overcast",
  MIST: "fog",
  OVERCAST: "overcast",
  SHOWERS: "showers",
  SHOWERS_SCATTERED: "showers-scattered",
  SHOWERS_SCATTERED_STORM: "storm",
  SNOW: "snow",
  SNOW_RAIN: "snow",
  SNOW_SCATTERED: "snow",
  SNOW_SCATTERED_STORM: "snow",
  SNOW_STORM: "snow",
  STORM: "storm",
  WINDY: "windy",
  TORNADO: "tornado"
};

// Map OpenWeatherMap icon codes to icon names
/**
  * @enum {string}
  */
const OpenWeatherMapIconMap =
{
  "01d": WeatherIcons.CLEAR, // "clear sky"
  "02d": WeatherIcons.FEW_CLOUDS, // "few clouds"
  "03d": WeatherIcons.FEW_CLOUDS, // "scattered clouds"
  "04d": WeatherIcons.CLOUDS, // "broken clouds"
  "09d": WeatherIcons.SHOWERS_SCATTERED, // "shower rain"
  "10d": WeatherIcons.SHOWERS, // "rain"
  "11d": WeatherIcons.STORM, // "thunderstorm"
  "13d": WeatherIcons.SNOW, // "snow"
  "50d": WeatherIcons.MIST, // "mist"
  "01n": WeatherIcons.CLEAR, // "clear sky night"
  "02n": WeatherIcons.FEW_CLOUDS, // "few clouds night"
  "03n": WeatherIcons.FEW_CLOUDS, // "scattered clouds night"
  "04n": WeatherIcons.CLOUDS, // "broken clouds night"
  "09n": WeatherIcons.SHOWERS_SCATTERED, // "shower rain night"
  "10n": WeatherIcons.SHOWERS, // "rain night"
  "11n": WeatherIcons.STORM, // "thunderstorm night"
  "13n": WeatherIcons.SNOW, // "snow night"
  "50n": WeatherIcons.MIST, // "mist night"
};


function hasNightVariant(name)
{
  return name === "clear" || name === "few-clouds";
}

/**
  * @param {boolean} isNight
  * @param {boolean} useSymbolic
  */
export function getIconName(provider, key, isNight, useSymbolic)
{
  let name;
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      name = OpenWeatherMapIconMap[key];
      break;
  }

  let fullName = "weather-" + name;

  if(isNight && hasNightVariant(name)) fullName += "-night";

  // Ignore useSymbolic for now because we only package symbolic icons
  fullName += "-symbolic";

  return fullName;
}

/**
  * @returns {string}
  */
export function gettextCondition(provider, code, gettext)
{
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      return gettext(OpenWeatherMapConditionMap[code] ?? "Not available");
    default:
      return gettext("Not available");
  }
}


