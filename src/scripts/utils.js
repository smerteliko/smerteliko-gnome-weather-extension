// utils.js (ES Module)

import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
// Assume getTranslation is available via shared context or imported where needed.
// For translation support in constants/messages, we must define the gettext context here.
import { getSoupSession } from "./myloc.js";

// --- CONSTANTS ---
export const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

export const LOCALE = GLib.get_language_names()[0];

export const WeatherUnits = {
  CELSIUS: 0,
  FAHRENHEIT: 1,
  KELVIN: 2,
  RANKINE: 3,
  REAUMUR: 4,
  ROEMER: 5,
  DELISLE: 6,
  NEWTON: 7,
};

export const WeatherWindSpeedUnits = {
  KPH: 0,
  MPH: 1,
  MPS: 2,
  KNOTS: 3,
  FPS: 4,
  BEAUFORT: 5,
};

export const WeatherPressureUnits = {
  HPA: 0,
  INHG: 1,
  BAR: 2,
  PA: 3,
  KPA: 4,
  ATM: 5,
  AT: 6,
  TORR: 7,
  PSI: 8,
  MMHG: 9,
  MBAR: 10,
};

export const HiContrastStyle = {
  NONE: 0,
  WHITE: 1,
  BLACK: 2
};

export const ClockFormat = {
  _24H: 0,
  _12H: 1,
  SYSTEM: 2
};

export const WeatherPosition = {
  CENTER: 0,
  RIGHT: 1,
  LEFT: 2,
};

// Keep enums in sync with GSettings schemas
export const GeolocationProvider = {
  OPENSTREETMAPS: 0,
  MAPQUEST: 2,
};


export const WeatherProvider =
{
  DEFAULT: 0,
  OPENWEATHERMAP: 1,
  COUNT: 1
};

export const ForecastDaysSupport =
{
  0: 0,
  1: 4,
  2: 2,
  3: 14,
  4: 15
}

export function getWeatherProviderName(prov)
{
  switch(prov)
  {
    case WeatherProvider.OPENWEATHERMAP:
      return "OpenWeatherMap";
    default:
      return null;
  }
}

export function getWeatherProviderUrl(prov)
{
  switch(prov)
  {
    case WeatherProvider.OPENWEATHERMAP:
      return "https://openweathermap.org/";
    default:
      return null;
  }
}

// Choose a random provider each time to try to avoid rate limiting
let randomProvider = 0;
function chooseRandomProvider(settings)
{
  // WeatherAPI.com doesn't support as many forecast days as OpenWeatherMap
  let forecastDays = settings.get_int("days-forecast");
  let rand = Math.floor(Math.random() * WeatherProvider[COUNT + 1]);

  // Should be OpenMeteo in the future
  if(ForecastDaysSupport[rand] < forecastDays) rand =  WeatherProvider.OPENWEATHERMAP;
  
  randomProvider = rand;
}

export function getWeatherProvider(settings)
{
  let prov = settings.get_enum("weather-provider");
  if(prov ===  WeatherProvider.DEFAULT)
  {
    if(!randomProvider) chooseRandomProvider(settings);
    return randomProvider;
  }
  else return prov;
}

let providerNotWorking = 0;
/**
  * Cycles the weather provider if weather provider is in random mode.
  * @returns {boolean} `true` if the weather provider changed and the operation
  * should be tried again, otherwise `false` if nothing changed.
  */
export function weatherProviderNotWorking(settings)
{
  let prov = settings.get_enum("weather-provider");
  if(prov ===  WeatherProvider.DEFAULT)
  {
    if(!providerNotWorking) providerNotWorking = randomProvider;
    // if we've already cycled through them all, give up
    else if(randomProvider === providerNotWorking) return false;

    randomProvider++;


    console.log("inc rand " + typeof randomProvider + randomProvider);

    return true;
  }
  else return false;
}

export const IconMap  = {
    "01d": "weather-clear-symbolic",             // "clear sky"
    "02d": "weather-few-clouds-symbolic",        // "few clouds"
    "03d": "weather-few-clouds-symbolic",        // "scattered clouds"
    "04d": "weather-overcast-symbolic",          // "broken clouds"
    "09d": "weather-showers-scattered-symbolic", // "shower rain"
    "10d": "weather-showers-symbolic",           // "rain"
    "11d": "weather-storm-symbolic",             // "thunderstorm"
    "13d": "weather-snow-symbolic",              // "snow"
    "50d": "weather-fog-symbolic",               // "mist"
    "01n": "weather-clear-night-symbolic",       // "clear sky night"
    "02n": "weather-few-clouds-night-symbolic",  // "few clouds night"
    "03n": "weather-few-clouds-night-symbolic",  // "scattered clouds night"
    "04n": "weather-overcast-symbolic",          // "broken clouds night"
    "09n": "weather-showers-scattered-symbolic", // "shower rain night"
    "10n": "weather-showers-symbolic",           // "rain night"
    "11n": "weather-storm-symbolic",             // "thunderstorm night"
    "13n": "weather-snow-symbolic",              // "snow night"
    "50n": "weather-fog-symbolic"                // "mist night"
};

// --- CORE CONVERSION FUNCTIONS ---

function buildQueryString(params) {
    return Object.keys(params).map(key => 
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
    ).join('&');
}

export async function loadJsonAsync(url, params)
{
  return new Promise((resolve, reject) =>
  {
    let httpSession = getSoupSession();
    let paramsHash = Soup.form_encode_hash(params);
    let message = Soup.Message.new_from_encoded_form("GET", url, paramsHash);

    httpSession.send_and_read_async(
      message,
      GLib.PRIORITY_DEFAULT,
      null,
      (sess, result) =>
      {
        let bytes = sess.send_and_read_finish(result);

        let jsonString = bytes.get_data();
        if (jsonString instanceof Uint8Array)
        {
          jsonString = new TextDecoder().decode(jsonString);
        }

        try
        {
          if (!jsonString)
          {
            reject("No data in response body.");
          }
          resolve([message.status_code, JSON.parse(jsonString)]);
        }
        catch(e)
        {
          sess.abort();
          reject(e);
        }
      }
    );
  });
}

// --- UNIT FORMATTING LOGIC ---
export function unitToUnicode(units, _) { 
    if (units === WeatherUnits.FAHRENHEIT)
        return _('\u00B0F');
    else if (units === WeatherUnits.KELVIN)
        return _('K');
    else if (units === WeatherUnits.RANKINE)
        return _('\u00B0Ra');
    else if (units === WeatherUnits.REAUMUR)
        return _('\u00B0R\u00E9');
    else if (units === WeatherUnits.ROEMER)
        return _('\u00B0R\u00F8');
    else if (units === WeatherUnits.DELISLE)
        return _('\u00B0De');
    else if (units === WeatherUnits.NEWTON)
        return _('\u00B0N');
    else
        return _('\u00B0C'); 
}
export function toFahrenheit(t, d) { return ((Number(t) * 1.8) + 32).toFixed(d); }
export function toKelvin(t, d) { return (Number(t) + 273.15).toFixed(d); }
export function toRankine(t, d) { return ((Number(t) * 1.8) + 491.67).toFixed(d); }
export function toReaumur(t, d) { return (Number(t) * 0.8).toFixed(d); }
export function toRoemer(t, d) { return ((Number(t) * 21 / 40) + 7.5).toFixed(d); }
export function toDelisle(t, d) { return ((100 - Number(t)) * 1.5).toFixed(d); }
export function toNewton(t, d) { return (Number(t) - 0.33).toFixed(d); }
export function toInHg(p, d) { return (p / 33.86530749).toFixed(d); }

export function getWeatherCondition(code, _) {
    switch (parseInt(code, 10)) {                                   /**  CODE   |  DESCRIPTION                      */
        case 200: return _('Thunderstorm with Light Rain');         /**  200    |  Thunderstorm with light rain     */
        case 201: return _('Thunderstorm with Rain');               /**  201    |  Thunderstorm with rain           */
        case 202: return _('Thunderstorm with Heavy Rain');         /**  202    |  Thunderstorm with heavy rain     */
        case 210: return _('Light Thunderstorm');                   /**  210    |  Light thunderstorm               */
        case 211: return _('Thunderstorm');                         /**  211    |  Thunderstorm                     */
        case 212: return _('Heavy Thunderstorm');                   /**  212    |  Heavy thunderstorm               */
        case 221: return _('Ragged Thunderstorm');                  /**  221    |  Ragged thunderstorm              */
        case 230: return _('Thunderstorm with Light Drizzle');      /**  230    |  Thunderstorm with light drizzle  */
        case 231: return _('Thunderstorm with Drizzle');            /**  231    |  Thunderstorm with drizzle        */
        case 232: return _('Thunderstorm with Heavy Drizzle');      /**  232    |  Thunderstorm with heavy drizzle  */
        case 300: return _('Light Drizzle');                        /**  300    |  Light intensity drizzle          */
        case 301: return _('Drizzle');                              /**  301    |  Drizzle                          */
        case 302: return _('Heavy Drizzle');                        /**  302    |  Heavy intensity drizzle          */
        case 310: return _('Light Drizzle Rain');                   /**  310    |  Light intensity drizzle rain     */
        case 311: return _('Drizzle Rain');                         /**  311    |  Drizzle rain                     */
        case 312: return _('Heavy Drizzle Rain');                   /**  312    |  Heavy intensity drizzle rain     */
        case 313: return _('Shower Rain and Drizzle');              /**  313    |  Shower rain and drizzle          */
        case 314: return _('Heavy Rain and Drizzle');               /**  314    |  Heavy shower rain and drizzle    */
        case 321: return _('Shower Drizzle');                       /**  321    |  Shower drizzle                   */
        case 500: return _('Light Rain');                           /**  500    |  Light rain                       */
        case 501: return _('Moderate Rain');                        /**  501    |  Moderate rain                    */
        case 502: return _('Heavy Rain');                           /**  502    |  Heavy intensity rain             */
        case 503: return _('Very Heavy Rain');                      /**  503    |  Very heavy rain                  */
        case 504: return _('Extreme Rain');                         /**  504    |  Extreme rain                     */
        case 511: return _('Freezing Rain');                        /**  511    |  Freezing rain                    */
        case 520: return _('Light Shower Rain');                    /**  520    |  Light intensity shower rain      */
        case 521: return _('Shower Rain');                          /**  521    |  Shower rain                      */
        case 522: return _('Heavy Shower Rain');                    /**  522    |  Heavy intensity shower rain      */
        case 531: return _('Ragged Shower Rain');                   /**  531    |  Ragged shower rain               */
        case 600: return _('Light Snow');                           /**  600    |  Light snow                       */
        case 601: return _('Snow');                                 /**  601    |  Snow                             */
        case 602: return _('Heavy Snow');                           /**  602    |  Heavy snow                       */
        case 611: return _('Sleet');                                /**  611    |  Sleet                            */
        case 612: return _('Light Shower Sleet');                   /**  612    |  Light shower sleet               */
        case 613: return _('Shower Sleet');                         /**  613    |  Shower sleet                     */
        case 615: return _('Light Rain and Snow');                  /**  615    |  Light rain and snow              */
        case 616: return _('Rain and Snow');                        /**  616    |  Rain and snow                    */
        case 620: return _('Light Shower Snow');                    /**  620    |  Light shower snow                */
        case 621: return _('Shower Snow');                          /**  621    |  Shower snow                      */
        case 622: return _('Heavy Shower Snow');                    /**  621    |  Heavy shower snow                */
        case 701: return _('Mist');                                 /**  701    |  Mist                             */
        case 711: return _('Smoke');                                /**  711    |  Smoke                            */
        case 721: return _('Haze');                                 /**  721    |  Haze                             */
        case 731: return _('Sand/Dust Whirls');                     /**  731    |  Sand/Dust Whirls                 */
        case 741: return _('Fog');                                  /**  741    |  Fog                              */
        case 751: return _('Sand');                                 /**  751    |  Sand                             */
        case 761: return _('Dust');                                 /**  761    |  Dust                             */
        case 762: return _('Volcanic Ash');                         /**  762    |  Volcanic ash                     */
        case 771: return _('Squalls');                              /**  771    |  Squalls                          */
        case 781: return _('Tornado');                              /**  781    |  Tornado                          */
        case 800: return _('Clear Sky');                            /**  800    |  Clear sky                        */
        case 801: return _('Few Clouds');                           /**  801    |  Few clouds                       */
        case 802: return _('Scattered Clouds');                     /**  802    |  Scattered clouds                 */
        case 803: return _('Broken Clouds');                        /**  803    |  Broken clouds                    */
        case 804: return _('Overcast Clouds');                      /**  804    |  Overcast clouds                  */
        default:
            return _('Not available');
    }
}


/**
  * @param {boolean} isNight
  * @param {boolean} useSymbolic
  */
export function getIconName(provider, key)
{
  let name = '';
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      name = IconMap[key];
      break;
  }


  return name;
}

/**
  * @returns {string}
  */
export function gettextCondition(provider, code, gettext)
{
  switch(provider)
  {
    case WeatherProvider.OPENWEATHERMAP:
      return gettext(getWeatherCondition(code, gettext) ?? "Not available");
    default:
      return gettext("Not available");
  }
}

/**
 *
 * @param w
 * @param t
 * @returns {string|string}
 */
function toBeaufort(w, t, _) {
    if (w < 0.3)
        return (!t) ? "0" : "(" + _("Calm") + ")";

    else if (w >= 0.3 && w <= 1.5)
        return (!t) ? "1" : "(" + _("Light air") + ")";

    else if (w > 1.5 && w <= 3.4)
        return (!t) ? "2" : "(" + _("Light breeze") + ")";

    else if (w > 3.4 && w <= 5.4)
        return (!t) ? "3" : "(" + _("Gentle breeze") + ")";

    else if (w > 5, 4 && w <= 7.9)
        return (!t) ? "4" : "(" + _("Moderate breeze") + ")";

    else if (w > 7.9 && w <= 10.7)
        return (!t) ? "5" : "(" + _("Fresh breeze") + ")";

    else if (w > 10.7 && w <= 13.8)
        return (!t) ? "6" : "(" + _("Strong breeze") + ")";

    else if (w > 13.8 && w <= 17.1)
        return (!t) ? "7" : "(" + _("Moderate gale") + ")";

    else if (w > 17.1 && w <= 20.7)
        return (!t) ? "8" : "(" + _("Fresh gale") + ")";

    else if (w > 20.7 && w <= 24.4)
        return (!t) ? "9" : "(" + _("Strong gale") + ")";

    else if (w > 24.4 && w <= 28.4)
        return (!t) ? "10" : "(" + _("Storm") + ")";

    else if (w > 28.4 && w <= 32.6)
        return (!t) ? "11" : "(" + _("Violent storm") + ")";

    else
        return (!t) ? "12" : "(" + _("Hurricane") + ")";
}

/**
 *
 * @param temperature
 * @param units
 * @param decimalPlaces
 * @returns {string}
 */
export function formatTemperature(temperature, units, decimalPlaces) {
    switch (units) {
        case WeatherUnits.FAHRENHEIT:
            temperature = this.toFahrenheit(temperature, decimalPlaces);
            break;

        case WeatherUnits.CELSIUS:
            temperature = temperature.toFixed(decimalPlaces);
            break;

        case WeatherUnits.KELVIN:
            temperature = this.toKelvin(temperature, decimalPlaces);
            break;

        case WeatherUnits.RANKINE:
            temperature = this.toRankine(temperature, decimalPlaces);
            break;

        case WeatherUnits.REAUMUR:
            temperature = this.toReaumur(temperature, decimalPlaces);
            break;

        case WeatherUnits.ROEMER:
            temperature = this.toRoemer(temperature, decimalPlaces);
            break;

        case WeatherUnits.DELISLE:
            temperature = this.toDelisle(temperature, decimalPlaces);
            break;

        case WeatherUnits.NEWTON:
            temperature = this.toNewton(temperature, decimalPlaces);
            break;
    }
    return parseFloat(temperature).toLocaleString(LOCALE).replace('-', '\u2212') + ' ' + unitToUnicode(units);
}

/**
 * 
 * @param {*} deg 
 * @param {*} directionStyle 
 * @returns 
 */
export function getWindDirection(deg, directionStyle, _) {
    let arrows = ["\u2193", "\u2199", "\u2190", "\u2196", "\u2191", "\u2197", "\u2192", "\u2198"];
    let letters = [_('N'), _('NE'), _('E'), _('SE'), _('S'), _('SW'), _('W'), _('NW')];
    let idx = Math.round(deg / 45) % arrows.length;
    return (directionStyle) ? arrows[idx] : letters[idx];
}
/**
 * 
 * @param {*} speed 
 * @param {*} directionStyle 
 * @param {*} decimalPlaces 
 * @param {*} speedUnits 
 * @param {*} deg 
 * @param {*} locale 
 * @returns 
 */

export function formatWind(speed, directionStyle, decimalPlaces, speedUnits, deg, locale, _) {
    let direction = getWindDirection(deg, directionStyle,_);
    let conv_MPSinMPH = 2.23693629;
    let conv_MPSinKPH = 3.6;
    let conv_MPSinKNOTS = 1.94384449;
    let conv_MPSinFPS = 3.2808399;
    let unit = _('m/s');
    let s = Number(speed);
    
    switch (speedUnits) {
        case WeatherWindSpeedUnits.MPH: s = (s * conv_MPSinMPH).toFixed(decimalPlaces); unit = _('mph'); break;
        case WeatherWindSpeedUnits.KPH: s = (s * conv_MPSinKPH).toFixed(decimalPlaces); unit = _('km/h'); break;
        case WeatherWindSpeedUnits.MPS: s = s.toFixed(decimalPlaces); unit = _('m/s'); break;
        case WeatherWindSpeedUnits.KNOTS: s = (s * conv_MPSinKNOTS).toFixed(decimalPlaces); unit = _('kn'); break;
        case WeatherWindSpeedUnits.FPS: s = (s * conv_MPSinFPS).toFixed(decimalPlaces); unit = _('ft/s'); break;
        case WeatherWindSpeedUnits.BEAUFORT: unit = toBeaufort(s, true,_); s = toBeaufort(s, false, _); break;
    }

    if (!s) return '\u2013';
    
    let formattedSpeed = parseFloat(s).toLocaleString(locale);
    
    if (speedUnits === WeatherWindSpeedUnits.BEAUFORT) {
        // For Beaufort scale, 'unit' already contains the descriptive text/scale.
        return `${formattedSpeed} ${unit}`; 
    } else if (s === 0 || !direction) {
        return `${formattedSpeed} ${unit}`;
    } else {
        return `${direction} ${formattedSpeed} ${unit}`;
    }
}

/**
 * 
 * @param {*} date 
 * @param {*} clockFormat 
 * @param {*} locale 
 * @returns 
 */
export function formatTime(date, clockFormat, locale, _)
{
    let isHr12;
    switch(clockFormat)
    {
      case 0: // ClockFormat._24H
        isHr12 = false;
        break;
      case 1: // ClockFormat._12H
        isHr12 = true;
        break;
      default: // ClockFormat.SYSTEM or fallback
        // We can't access system settings here, so we assume a default or simple formatting
        isHr12 = false; 
        break;
    }
    return date.toLocaleTimeString(locale, {
      hour12: isHr12,
      hour: "numeric",
      minute: "numeric"
    });
}