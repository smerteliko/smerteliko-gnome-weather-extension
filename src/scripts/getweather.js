import GLib from "gi://GLib";
import Soup from "gi://Soup";
import * as Utils from "./utils.js";

import {
  gettext as _
} from "resource:///org/gnome/shell/extensions/extension.js";

export const DEFAULT_KEYS =
[
  "b4d6a638dd4af5e668ccd8574fd90cec",
  "7a4baea97ef946c7864221259240804",
  "ES25QFD3CP93EZ9DMSJ72MAX7"
];
export class TooManyReqError extends Error
{
  provider;
  constructor(provider)
  {
    super(`Provider ${Utils.getWeatherProviderName(provider)} has received too many requests.`);
    this.provider = provider;
    this.name = "TooManyReqError";
  }
}



export class Weather
{
  #iconName;
  #condition;

  #tempC;
  #feelsLikeC;
  #humidityPercent;
  #pressureMBar;
  #windMps;
  #windDirDeg;
  #gustsMps;

  #sunrise;
  #sunset;

  #forecasts;

  /**
    * @param {number} tempC 
    * @param {number} feelsLikeC
    * @param {number} humidityPercent
    * @param {number} pressureMBar
    * @param {number} windMps
    * @param {number} windDirDeg
    * @param {number} gustsMps
    * @param {string} iconName
    * @param {string} condition
    * @param {Date} sunrise
    * @param {Date} sunset
    * @param {(Forecast[][] | null)} forecasts
    */
  constructor(tempC, feelsLikeC, humidityPercent, pressureMBar, windMps, windDirDeg, gustsMps, iconName, condition, sunrise, sunset, forecasts = null)
  {
    this.#tempC = tempC;
    this.#feelsLikeC = feelsLikeC;
    this.#humidityPercent = humidityPercent;
    this.#pressureMBar = pressureMBar;
    this.#windMps = windMps;
    this.#windDirDeg = windDirDeg;
    this.#gustsMps = gustsMps;
    this.#iconName = iconName;
    this.#sunrise = sunrise;
    this.#sunset = sunset;
    this.#forecasts = forecasts ? forecasts.length > 0 ? forecasts : null : null;

    if(typeof condition === "string") this.#condition = condition;
    else throw new Error(`Smerteliko-gnome-weather-exstension Weather Condition '${condition}' was type '${typeof condition}' not string.`);
  }

  /**
    * @returns {string}
    */
  getIconName()
  {
    return this.#iconName;
  }

  /**
    * @returns {string}
    */
  displayCondition()
  {
    return this.#condition;
  }

  /**
    * @param {Gio.Settings} settings
    * @param {string} locale
    * @returns {string}
    */
  displayTemperature(settings, locale)
  {
    return Utils.formatTemperature(
        this.#tempC,
        settings.get_enum("unit"),
        settings.get_int("decimal-places"),
        locale
    );
  }

  /**
    * @param {Gio.Settings} settings
    * @param {string} locale
    * @returns {string}
    */
  displayFeelsLike(settings, locale)
  {
    return Utils.formatTemperature(
        this.#feelsLikeC,
        settings.get_enum("unit"),
        settings.get_int("decimal-places"),
        locale
    );
  }

  /**
    * @returns {string}
    */
  displayHumidity()
  {
    return `${this.#humidityPercent}%`;
  }

  /**
    * @param {Gio.Settings} settings
    * @param {string} locale
    * @returns {string}
    */
  displayPressure(settings, locale)
  {
    return Utils.formatPressure(
        this.#pressureMBar,
        settings.get_enum("pressure-unit"),
        settings.get_int("pressure-decimal-places"),
        locale
    );
  }

  /**
    * @param {Gio.Settings} settings
    * @param {string} locale
    * @returns {string}
    */
  displayWind(settings, locale)
  {
    return Utils.formatWind(
        this.#windMps,
        settings.get_boolean("wind-direction"),
        settings.get_int("speed-decimal-places"),
        settings.get_enum("wind-speed-unit"),
        this.#windDirDeg,
        locale,
        _
    );
  }

  /**
    * @param {Gio.Settings} settings
    * @param {string} locale
    * @returns {string}
    */
  displayGusts(settings, locale)
  {
    return Utils.formatWind(
        this.#gustsMps,
        settings.get_boolean("wind-direction"),
        settings.get_int("speed-decimal-places"),
        settings.get_enum("wind-speed-unit"),
        this.#windDirDeg,
        locale,
        _
    );
  }

  /**
    * @returns {boolean}
    */
  gustsAvailable()
  {
    return typeof this.#gustsMps === "number";
  }

  /**
    * @returns {string}
    */
  displaySunrise(extension)
  {
    return Utils.formatTime(this.#sunrise, extension.settings.get_enum("clock-format"), extension.locale, _);
  }

  /**
    * @returns {Date}
    */
  getSunriseDate()
  {
    return this.#sunrise;
  }

  /**
    * @returns {string}
    */
  displaySunset(extension)
  {
    return Utils.formatTime(this.#sunset, extension.settings.get_enum("clock-format"), extension.locale, _);
  }

  /**
    * @returns {Date}
    */
  getSunsetDate()
  {
    return this.#sunset;
  }

  hasForecast()
  {
    return this.#forecasts !== null;
  }

  forecastDayCount()
  {
    return this.#forecasts.length;
  }

  forecastHourCount(dayIndex)
  {
    return this.#forecasts[dayIndex].length;
  }

  forecastDayHour(dayIndex, hourIndex)
  {
    return this.#forecasts[dayIndex][hourIndex];
  }

  forecastAtHour(dayIndex, hoursFromNow)
  {
    let day = this.#forecasts[dayIndex];
    return day[hoursFromNow / day[0].getDurationHours()];
  }

  forecastHoursFromNow(hoursFromNow)
  {
    let future = new Date().getTime() + 3600000 * hoursFromNow;
    let days = this.#forecasts.length;
    for(let i = 0; i < days; i++)
    {
      let d = this.#forecasts[i];
      let h = d[d.length - 1];
      let endTime = h.getEnd().getTime();

      if(future > endTime) continue;

      let distanceHrs = (future - d[0].getStart().getTime()) / 3600000;
      let index = Math.ceil(distanceHrs / h.getDurationHours());
      if(index >= this.#forecasts[i].length) index = this.#forecasts[i].length - 1;
      return this.#forecasts[i][index];
    }

    let lastDay = this.#forecasts[days - 1];
    return lastDay[lastDay.length - 1];
  }

}

export class Forecast
{
  #start;
  #end;
  #weather;

  /**
    * @param {Date} start 
    * @param {Date} end 
    * @param {Weather} weather 
    */
  constructor(start, end, weather)
  {
    this.#start = start;
    this.#end = end;
    this.#weather = weather;
  }

  getStart()
  {
    return this.#start;
  }

  getEnd()
  {
    return this.#end;
  }

  getDurationHours()
  {
    return (this.#end - this.#start) / 3600000;
  }

  /**
   * @param {number} clockFormat
   * @param {string} locale
   * @returns {string}
   */
  displayTime(clockFormat, locale)
  {
    return Utils.formatTime(this.#start, clockFormat, locale, _);
  }

  weather()
  {
    return this.#weather;
  }
}


function isSuccess(httpStatusCode)
{
  return httpStatusCode >= 200 && httpStatusCode < 300;
}

function clamp(lo, x, hi)
{
  return Math.min(Math.max(lo, x), hi);
}

function getCondit(extension, code, condition, gettext)
{
  if(!extension._translate_condition || extension._providerTranslations || !gettext)
  {
    return condition;
  }
  else
  {
    return Utils.getWeatherCondition(code,gettext);
  }
}

/**
  * @returns {Promise<Weather | null>}
  */
export async function getWeatherInfo(extension, gettext)
{
  const settings = extension.settings;

  let location = await extension._city.getCoords(settings);
  let lat = String(location[0]);
  let lon = String(location[1]);

  let params;
  switch(Utils.getWeatherProvider(extension.settings))
  {
    case Utils.WeatherProvider.OPENWEATHERMAP:
      {
        params =
        {
          lat,
          lon,
          units: "metric"
        };
        if(extension._providerTranslations) params.lang = extension.locale;
        let apiKey = extension.getWeatherKey();
        if(apiKey) params.appid = apiKey;

        let response;
        let forecastResponse;
        try
        {
          let cur = Utils.loadJsonAsync("https://api.openweathermap.org/data/2.5/weather", params, extension.metadata.uuid, extension.metadata.version);
          let fore = Utils.loadJsonAsync("https://api.openweathermap.org/data/2.5/forecast", params, extension.metadata.uuid, extension.metadata.version);
          let allResp = await Promise.all([ cur, fore ]);
          response = allResp[0];
          forecastResponse = allResp[1];
        }
        catch(e)
        {
          console.error(`Smerteliko-gnome-weather-exstension: Failed to fetch weather from OpenWeatherMap ('${e.message}').`);
          return null;
        }

        if(!isSuccess(response[0]) || !isSuccess(forecastResponse[0]))
        {
          console.error(`Smerteliko-gnome-weather-exstension: Invalid API Response from OpenWeatherMap ` +
            `${response[0]}/${forecastResponse[0]}: '${response[1]?.message}'` +
            `/'${forecastResponse[1]?.message}'.`);

          if(response[0] === 429 || forecastResponse[0] === 429) throw new TooManyReqError(Utils.WeatherProvider.OPENWEATHERMAP);
          else return null;
        }

        let json = response[1];
        let m = json.main;
        let iconId = json.weather[0].icon;

        // OpenWeatherMap bug? Sunrise/sunset seconds seems to always return
        // for same day even if sunrise is tomorrow morning. Therefore just
        // subtract today and we'll decide if it's tomorrow or not
        let thisMorningMs = new Date().setHours(0, 0, 0, 0);
        let midnightMs = thisMorningMs + 3600000 * 24;
        let sunriseMs = json.sys.sunrise * 1000 - thisMorningMs;
        let sunsetMs = json.sys.sunset * 1000 - thisMorningMs;

        let sunrise, sunset;
        // "pod" = Part of Day, "d" = day, "n" = night
        if(forecastResponse[1].list[0].sys.pod === "d")
        {
          sunrise = new Date(sunriseMs + midnightMs);
          sunset  = new Date(sunsetMs  + thisMorningMs);
        }
        else
        {
          sunrise = new Date(sunriseMs + thisMorningMs);
          sunset  = new Date(sunsetMs  + midnightMs);
        }

        let forecastDays = clamp(1, extension._days_forecast + 1, 5);
        extension._forecastDays = forecastDays - 1;

        let forecasts = [ ];
        for(let i = 0; i < forecastDays; i++)
        {
          let day = [ ];
          for(let j = 0; j < 8; j++)
          {
            let h = forecastResponse[1].list[i * 8 + j];
            let fIconId = h.weather[0].icon;
            let isFNight = fIconId[fIconId.length - 1] === "n";

            // Create Date from UTC timestamp
            let match = h.dt_txt.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2}) ([0-9]{2}):/);
            let dt = new Date(Date.UTC(match[1], match[2] - 1, match[3], match[4]));

            day.push(new Forecast(
              dt,
              new Date(dt.getTime() + 3600000 * 3),
              new Weather(
                h.main.temp,
                h.main.feels_like,
                h.main.humidity,
                h.main.pressure,
                h.wind?.speed,
                h.wind?.deg,
                h.wind?.gust,
                Utils.getIconName(Utils.WeatherProvider.OPENWEATHERMAP, fIconId, isFNight, true),
                getCondit(extension, h.weather[0].id, h.weather[0].description, gettext),
                sunrise,
                sunset
              )
            ));
          }
          forecasts.push(day);
        }

        return new Weather(
          m.temp,
          m.feels_like,
          m.humidity,
          m.pressure,
          json.wind?.speed,
          json.wind?.deg,
          json.wind?.gust,
          Utils.getIconName(Utils.WeatherProvider.OPENWEATHERMAP, iconId, iconId[iconId.length - 1] === "n", true),
          getCondit(extension, json.weather[0].id, json.weather[0].description, gettext),
          sunrise,
          sunset,
          forecasts
        );
      }

    default:
      console.error("Smerteliko-gnome-weather-exstension: Invalid weather provider.");
      return null;
  }
}