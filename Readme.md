# Smerteliko GNOME Weather Extension

A powerful and highly customizable GNOME Shell extension for displaying current weather conditions and forecasts from OpenWeatherMap (OWM). This extension is built to support a wide array of unit conversions, multi-location management, and integration with modern GNOME design standards, ensuring a stable experience on GNOME Shell 45 and newer.

## ✨ Features

* Multi-Location Management: The extension is designed for users tracking weather across different regions. Easily manage and switch between multiple saved cities using precise coordinates (Lat, Lon), with seamless handling of "My Location" determined via Geoclue or IP lookup services. A dedicated settings tab allows for simple searching, adding, and deleting locations.

* Professional Unit Configuration: Supports a comprehensive and highly configurable suite of units far beyond standard Celsius/Fahrenheit. Includes a vast array of temperature scales (e.g., Celsius, Fahrenheit, Kelvin, Rankine, Réaumur, Roemer, Delisle, Newton), pressure units (hPa, inHg, Torr, PSI), and wind speed measurements (kph, mph, Beaufort, knots). This flexibility ensures the extension meets both casual and specialized meteorological needs.

* Detailed Panel and Popup Customization: Gain granular control over what information is visible in the GNOME panel and the pop-up menu. Choose to display temperature, textual weather conditions (e.g., "Clear Sky"), or prioritize contextual information like the upcoming sunrise or sunset time. The pop-up offers full detail, including pressure, humidity, wind speed, and "Feels Like" temperature.

* Responsive Adwaita Settings: The configuration dialogue utilizes modern Adwaita components, featuring two distinct pages (General and Locations) presented in a clean, adaptive interface for a seamless and responsive configuration experience across desktop and mobile form factors.

* Localization and Accessibility: Fully translatable using Gettext (currently includes Russian, English, and French). The extension also includes options for high-contrast text color overrides to improve readability against various desktop themes.

* Advanced Formatting Controls: Provides granular control over data presentation, allowing users to define the number of decimal places for temperature, pressure, and wind speed independently. Users can also switch wind direction indicators between cardinal letters (N, SW) and meteorological arrow symbols.

## 🛠️ Installation (Using Makefile)

This project uses a standard Makefile to handle building, installation, DConf schema compilation, and localization files (.mo), ensuring the code is correctly placed into your modular GNOME 45+ environment.

### Prerequisites

You must have the following packages installed to build the extension from source:

* make: Required for executing build scripts.

* git: Required for cloning the repository and handling version control information.

* gettext: Essential for localization (L10N) file extraction (xgettext) and compilation (msgfmt).

* glib-compile-schemas: Necessary to compile the DConf schema (.gschema.xml) into a binary file for the GNOME settings database.

* GJS development packages (libglib2.0-dev, libgjs-dev): Provides the necessary C headers and GObject introspection data required to compile and run GJS modules.

### Installation Steps

**1. Clone the Repository:** 
```bash
git clone https://github.com/smerteliko/smerteliko-gnome-weather-extension.git
cd smerteliko-gnome-weather-extension
```


**2.Build and Install Locally:**
The install target automatically compiles schemas, generates localization files, and copies the entire project structure (extension.js, prefs.js, src/) to your local GNOME extensions directory (~/.local/share/gnome-shell/extensions/).

```bash
make install
```


**3. Reload GNOME Shell:**
Press Alt + F2, type r (or restart), and press Enter. This forces the Shell to recognize and load the newly installed extension files.

Activate:
Enable the "Smerteliko GNOME Weather Extension" via the GNOME Extensions application and configure your OpenWeatherMap API key in the settings window.

### 📁 Project Structure

The codebase is organized using a modern, modular GJS structure for maintainability:

```
smerteliko-gnome-weather-extension/
├── Makefile                # Build, Install, and Localization tasks
├── metadata.json           # Extension UUID, Version, and Shell Compatibility (45+)
├── schemas/
│   └── *.gschema.xml       # DConf Settings Schema (Data Storage)
├── po/                     # Gettext source files (.pot, .po, .mo)
├── media/                  # Custom icons and assets
└── src/                    # All JavaScript and CSS Source Code
    ├── extension.js        # Main Extension Entry Point (Enable/Disable/Panel logic)
    ├── prefs.js            # Preferences Window Entry Point (Controls initialization of settings UI)
    ├── stylesheet.css      # Custom CSS styles for the panel and popup display
    ├── preferences/        # Contains modular GObject classes for the settings UI pages (e.g., GeneralPage, LocationsPage)
    │   └── *.js
    └── scripts/            # Core business logic: API wrappers, unit conversion functions, location utilities, and weather fetching logic.
        └── *.js
```


## 🌍 Localization and Contributing

This extension uses Gettext for localization, making contributions easy for translators.

**1. Extract Translatable Strings: Run the potfile target to generate the template file:**

``` bash
make potfile
```

**2. Update Translations: Use a tool like Poedit or Gtranslator to create/update .po files in the po/ directory.**

**3.Compile and Merge: The install process automatically compiles .po files to .mo and merges them into the build. To merge updates manually:**

``` bash
make mergepo
```


## 📜 License

This project is licensed under the terms of the GNU General Public License, version 2 or later (GPL-2.0-or-later), as indicated in the original project structure.

## 🤝 Contributing

I welcome any suggestions and feedback for improvement. If you find a bug or want to propose a new feature, please create a GitHub Issue or a Pull Request.

## 👨‍💻 Contact

* Name: Nikolay Makarov

* GitHub: [smerteliko](https://github.com/smerteliko)

* LinkedIn: [nickolay-makarov](https://www.linkedin.com/in/nikolay-makarov/)