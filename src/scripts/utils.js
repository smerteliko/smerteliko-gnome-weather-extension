// utils.js (ES Module)

import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
// Assume getTranslation is available via shared context or imported where needed.
// For translation support in constants/messages, we must define the gettext context here.
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

// --- CONSTANTS ---
export const OWM_BASE_URL = 'https://api.openweathermap.org/data/3.0/weather';

export const WeatherUnits = { CELSIUS: 0, FAHRENHEIT: 1, KELVIN: 2, RANKINE: 3, REAUMUR: 4, ROEMER: 5, DELISLE: 6, NEWTON: 7 };
export const WeatherWindSpeedUnits = { KPH: 0, MPH: 1, MPS: 2, KNOTS: 3, FPS: 4, BEAUFORT: 5 };
export const WeatherPressureUnits = { HPA: 0, INHG: 1, BAR: 2, PA: 3, KPA: 4, ATM: 5, AT: 6, TORR: 7, PSI: 8, MMHG: 9, MBAR: 10 };
export const WeatherPosition = { CENTER: 0, RIGHT: 1, LEFT: 2 };

export const IconMap = IconMap = {
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

export function loadJsonAsync(url, params, uuid, version) {
    return new Promise((resolve, reject) => {
        let userAgent = `${uuid}/${version || '1.0'}`;
        let fullUrl = `${url}?${buildQueryString(params)}`;

        const uri = GLib.Uri.parse(fullUrl, GLib.UriFlags.NONE);
        const message = Soup.Message.new_from_uri('GET', uri);
        message.set_request_header('User-Agent', userAgent, true);

        const session = Soup.Session.new();

        session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, res) => {
            try {
                let response = session.send_and_read_finish(res);
                if (message.status !== Soup.Status.OK) {
                    let errorBody = response ? new TextDecoder().decode(response.get_data()) : 'Unknown API Error';
                    try {
                        const errorJson = JSON.parse(errorBody);
                        errorBody = errorJson.message || errorBody;
                    } catch (e) {/* Ignore JSON parse error */}
                    throw new Error(`HTTP Error ${message.status_code}: ${errorBody}`);
                }
                let json = JSON.parse(new TextDecoder().decode(response.get_data()));
                resolve(json);
            } catch (e) {
                reject(e);
            }
        });
    });
}

// --- UNIT FORMATTING LOGIC ---
export function unitToUnicode(units) { 
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

export function getWeatherCondition(code) {
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
 *
 * @param w
 * @param t
 * @returns {string|string}
 */
function toBeaufort(w, t) {
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
 * @param speed
 * @param direction
 * @param decimalPlaces
 * @param speedUnits
 * @returns {string}
 */
export function formatWind(speed, direction, decimalPlaces, speedUnits) {
    let conv_MPSinMPH = 2.23693629;
    let conv_MPSinKPH = 3.6;
    let conv_MPSinKNOTS = 1.94384449;
    let conv_MPSinFPS = 3.2808399;
    let unit = _('m/s');

    switch (speedUnits) {
        case WeatherWindSpeedUnits.MPH:
            speed = (speed * conv_MPSinMPH).toFixed(decimalPlaces);
            unit = _('mph');
            break;

        case WeatherWindSpeedUnits.KPH:
            speed = (speed * conv_MPSinKPH).toFixed(decimalPlaces);
            unit = _('km/h');
            break;

        case WeatherWindSpeedUnits.MPS:
            speed = speed.toFixed(decimalPlaces);
            break;

        case WeatherWindSpeedUnits.KNOTS:
            speed = (speed * conv_MPSinKNOTS).toFixed(decimalPlaces);
            unit = _('kn');
            break;

        case WeatherWindSpeedUnits.FPS:
            speed = (speed * conv_MPSinFPS).toFixed(decimalPlaces);
            unit = _('ft/s');
            break;

        case WeatherWindSpeedUnits.BEAUFORT:
            speed = this.toBeaufort(speed);
            unit = this.toBeaufort(speed, true);
            break;
    }

    if (!speed) {
        return '\u2013';
    }

    if (speed === 0 || !direction) {
        return parseFloat(speed).toLocaleString(LOCALE) + ' ' + unit;
    }

    // i.e. speed > 0 && direction
    return direction + ' ' + parseFloat(speed).toLocaleString(LOCALE) + ' ' + unit;
}