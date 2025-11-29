import * as Main from "resource:///org/gnome/shell/ui/main.js";

import {
  gettext as _
} from "resource:///org/gnome/shell/extensions/extension.js";

import { getWeatherInfo } from "./getweather.js";
import { getCachedLocInfo, getLocationInfo } from "./myloc.js";
import * as Utils from "./utils.js";

async function initWeatherData(refresh) {
  if (refresh) {
    this._lastRefresh = Date.now();
  }
  try {
    await this.refreshWeatherData().then(async () => {
      try 
      {
        if(this._city.isMyLoc())
        {
          await getLocationInfo(this.settings);
        }
        this.recalcLayout();

      } catch (e) {
        console.error(e);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

async function reloadWeatherCache()
{
  try
  {
    await this.populateCurrentUI();
    if (!this._isForecastDisabled)
    {
      await this.populateTodaysUI();
      await this.populateForecastUI();
      this.recalcLayout();
    }
  }
  catch (e)
  {
    console.error(e);
  }
}

async function refreshWeatherData()
{
  try
  {
    let weather;
    try
    {
      weather = await getWeatherInfo(this, _);
    }
    catch(e)
    {
      let title, msg;
      if(e.name === "TooManyReqError")
      {
        let provName = Utils.getWeatherProviderName(e.provider);
        let tryAgain = Utils.weatherProviderNotWorking(this.settings);

        if(tryAgain)
        {
          this._provUrlButton.label = Utils.getWeatherProviderName(this.weatherProvider);
          this.reloadWeatherCurrent(1);
        }
        else
        {
          Main.notify(_("Smerteliko-gnome-weather-exstension Too Many Requests"),
            _("Provider %s has too many users. Try switching weather providers in settings.").format(provName));

          // Try reloading after 10 minutes
          this.reloadWeatherCurrent(600);
        }

        return;
      }
      else throw e;
    }

    if(!weather)
    {
      console.warn("Smerteliko-gnome-weather-exstension: getWeatherInfo failed without an error.");
      // Try reloading after 10 minutes
      this.reloadWeatherCurrent(600);
      return;
    }

    this.currentWeatherCache = weather;

    await this.populateCurrentUI();
    await this.populateTodaysUI();
    await this.populateForecastUI();
    this.reloadWeatherCurrent(this._refresh_interval_current);
  }
  catch(e)
  {
    console.error(`Smerteliko-gnome-weather-exstension: ${e}`);
    console.log(e.stack);
  }
}

function populateCurrentUI()
{
  return new Promise((resolve, reject) =>
  {
    try
    {
      /** @type {(Weather | null)} */
      let w = this.currentWeatherCache;
      if(!w) reject("Smerteliko-gnome-weather-exstension: No weather cached.");

      let location = this._city.getName(_);
      if(this._city.isMyLoc())
      {
        let locObj = getCachedLocInfo();
        let cityName = locObj.city;
        if(cityName === "Unknown") cityName = _("Unknown");
        location += ` (${cityName})`;
      }

      let iconName = w.getIconName();
      this._currentWeatherIcon.set_gicon(this.getGIcon(iconName));
      this._weatherIcon.set_gicon(this.getGIcon(iconName));

      let sunrise = w.getSunriseDate();
      let sunset = w.getSunsetDate();
      let lastBuild = new Date();

      // Is sunset approaching before the sunrise?
      let ms = lastBuild.getTime();
      if(sunrise.getTime() - ms > sunset.getTime() - ms)
      {
        this.topBoxSunIcon.set_gicon(this.getGIcon("daytime-sunset-symbolic"));
        this.topBoxSunInfo.text = Utils.formatTime(sunset, this.settings.get_enum("clock-format"), this.locale, _);
      }
      else
      {
        this.topBoxSunIcon.set_gicon(this.getGIcon("daytime-sunrise-symbolic"));
        this.topBoxSunInfo.text = Utils.formatTime(sunrise, this.settings.get_enum("clock-format"), this.locale, _);
      }

      let weatherInfoC = "";
      let weatherInfoT = "";

      let condition = w.displayCondition();
      let temp = w.displayTemperature(this.settings, this.locale); 

      if (this._comment_in_panel) weatherInfoC = condition;
      if (this._text_in_panel) weatherInfoT = temp;

      this._weatherInfo.text =
        weatherInfoC +
        (weatherInfoC && weatherInfoT ? _(", ") : "") +
        weatherInfoT;

      this._currentWeatherSummary.text = condition + (", ") + temp;

      let locText;
      if (this._loc_len_current !== 0 &&
        location.length > this._loc_len_current)
      {
        locText = location.substring(0, this._loc_len_current - 3) + "...";
      }
      else
      {
        locText = location;
      }

      let feelsLikeText = w.displayFeelsLike(this.settings, this.locale);
      let humidityText = w.displayHumidity();
      let pressureText = w.displayPressure(this.settings, this.locale);
      let windText = w.displayWind(this.settings, this.locale);

      this._currentWeatherSunrise.text = Utils.formatTime(sunrise, this.settings.get_enum("clock-format"), this.locale, _);
      this._currentWeatherSunset.text = Utils.formatTime(sunset, this.settings.get_enum("clock-format"), this.locale, _);
      this._currentWeatherBuild.text = Utils.formatTime(lastBuild, this.settings.get_enum("clock-format"), this.locale, _);


      if(this._currentWeatherLocation) this._currentWeatherLocation.text = locText;
      if(this._currentWeatherFeelsLike) this._currentWeatherFeelsLike.text = feelsLikeText;
      if(this._currentWeatherHumidity) this._currentWeatherHumidity.text = humidityText;
      if(this._currentWeatherPressure) this._currentWeatherPressure.text = pressureText;
      if(this._currentWeatherWind) this._currentWeatherWind.text = windText;
      if(this._currentWeatherWindGusts)
      {
        let available = w.gustsAvailable();
        this.setGustsPanelVisibility(available);
        if(available)
        {
          this._currentWeatherWindGusts.text = w.displayGusts(this.settings, this.locale);
        }
      }

      if(this._forecast.length > this._forecastDays)
      {
        this._forecast.splice(this._forecastDays, this._forecast.length - this._forecastDays);
        this.rebuildFutureWeatherUi(this._forecastDays);
      }

      resolve(0);
    } catch (e) {
      reject(e);
    }
  });
}

function populateTodaysUI() {
  return new Promise((resolve, reject) => {
    try {
      // Populate today's forecast UI
      let weather = this.currentWeatherCache;
      if(!weather) reject("Smerteliko-gnome-weather-exstension: No weather cached.");
      if(!weather.hasForecast()) reject("Smerteliko-gnome-weather-exstension: No forecast.");

      for (let i = 0; i < 4; i++)
      {
        let h = weather.forecastHoursFromNow(i * 3);
        let w = h.weather();

        let forecastTodayUi = this._todays_forecast[i];
        forecastTodayUi.Time.text = h.displayTime(this.settings.get_enum("clock-format"), this.locale);
        forecastTodayUi.Icon.set_gicon(this.getGIcon(w.getIconName()));
        forecastTodayUi.Temperature.text = w.displayTemperature(this.settings, this.locale);
        forecastTodayUi.Summary.text = w.displayCondition();
      }
      resolve(0);
    } catch (e) {
      reject(e);
    }
  });
}

function populateForecastUI() {
  return new Promise((resolve, reject) => {
    try {
      // Populate N day / 3 hour forecast UI
      let weather = this.currentWeatherCache;
      if(!weather) reject("Smerteliko-gnome-weather-exstension: No weather cached.");
      if(!weather.hasForecast()) reject("Smerteliko-gnome-weather-exstension: No forecast.");

      let hrsToMidnight = 24 - new Date().getHours();
      let dayCount = Math.min(this._days_forecast + 1, weather.forecastDayCount());
      for (let i = 0; i < dayCount - 1; i++)
      {
        let forecastUi = this._forecast[i];
        for (let j = 0; j < 8; j++)
        {
          let h = weather.forecastHoursFromNow(i * 24 + hrsToMidnight + j * 3);
          let w = h.weather();

          let forecastDate = h.getStart();
          if (j === 0)
          {
            let beginOfDay = new Date(new Date().setHours(0, 0, 0, 0));
            let dayLeft = Math.floor(
              (forecastDate.getTime() - beginOfDay.getTime()) / 86400000
            );

            if (dayLeft === 1) forecastUi.Day.text = "\n" + _("Tomorrow");
            else
              forecastUi.Day.text = "\n" + Utils.getLocaleDay(forecastDate.getDay());
          }

          forecastUi[j].Time.text = h.displayTime(this.settings.get_enum("clock-format"), this.locale);
          forecastUi[j].Icon.set_gicon(this.getGIcon(w.getIconName()));
          forecastUi[j].Temperature.text = w.displayTemperature(this.settings, this.locale);
          forecastUi[j].Summary.text = w.displayCondition();
        }
      }
      resolve(0);
    }
    catch (e)
    {
      reject(e);
    }
  });
}

export {
  initWeatherData, populateCurrentUI, populateForecastUI, populateTodaysUI, refreshWeatherData, reloadWeatherCache
};
