import Gdk from "gi://Gdk";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

// Import preferences pages
import { GeneralPage } from "./preferences/generalPage.js";
import { LayoutPage } from "./preferences/layoutPage.js";
import { LocationsPage } from "./preferences/locationsPage.js";

export default class SmertelikoGnomeWeatherExtension extends ExtensionPreferences {
  constructor(metadata) {
    super(metadata);
  }

  fillPreferencesWindow(window) {
    let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
    if (!iconTheme.get_search_path().includes(this.metadata.path + "/media")) {
      iconTheme.add_search_path(this.metadata.path + "/media");
    }

    window._settings = this.getSettings();

    const generalPage = new GeneralPage(this.metadata, window._settings, window);
    const layoutPage = new LayoutPage(this.metadata, window._settings);
    const locationsPage = new LocationsPage(
      this.metadata,
      window._settings,
      window
    );

    let prefsWidth = window._settings.get_int("prefs-default-width");
    let prefsHeight = window._settings.get_int("prefs-default-height");

    window.set_default_size(prefsWidth, prefsHeight);
    window.set_search_enabled(true);

    window.add(generalPage);
    window.add(layoutPage);
    window.add(locationsPage);

    window.connect("close-request", () => {
      let currentWidth = window.default_width;
      let currentHeight = window.default_height;
      // Remember user window size adjustments.
      if (currentWidth !== prefsWidth || currentHeight !== prefsHeight)
      {
        window._settings.set_int("prefs-default-width", currentWidth);
        window._settings.set_int("prefs-default-height", currentHeight);
      }
      window.destroy();
    });
  }
}
