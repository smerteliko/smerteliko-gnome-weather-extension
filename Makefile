UUID = smerteliko-gnome-weather-extension@smerteliko.com
PKG_NAME = smerteliko-gnome-weather-extension
SCHEMA_ID = org.gnome.shell.extensions.$(UUID)
SRC_DIR = src

MAIN_JS = extension.js prefs.js stylesheet.css
PREFS_JS_FILES = generalPage.js layoutPage.js locationsPage.js searchResultsWindow.js
SCRIPTS_JS_FILES = getweather.js locs.js myloc.js openweathermap.js utils.js

EXTRA_DIRECTORIES = media

TOLOCALIZE = $(addprefix $(SRC_DIR)/, $(MAIN_JS)) \
             $(addprefix $(SRC_DIR)/preferences/, $(PREFS_JS_FILES)) \
             $(addprefix $(SRC_DIR)/scripts/, $(SCRIPTS_JS_FILES)) \
             schemas/org.gnome.shell.extensions.smerteliko-gnome-weather-extension.gschema.xml

MSGSRC = $(wildcard po/*.po)
BASE_FILES = metadata.json Makefile

ifeq ($(strip $(DESTDIR)),)
	INSTALLTYPE = local
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLTYPE = system
	SHARE_PREFIX = $(DESTDIR)/usr/share
	INSTALLBASE = $(SHARE_PREFIX)/gnome-shell/extensions
endif

GIT_VER = $(shell git describe --long --tags --always --abbrev=7 --dirty | sed 's/^v//;s/\([^-]*-g\)/r\1/;s/-/./g')
ifdef VERSION
	ZIPVER = -v$(VERSION)
else
	ZIPVER = -v$(shell cat metadata.json | sed -n '/"version"/s/.*: *\([^,]*\).*/\1/p' | tr -d '"')
endif

.PHONY: all clean extension potfile mergepo install install-local zip-file

all: extension

clean:
	@echo "Очистка проекта..."
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo
	rm -fR _build
	rm -f $(PKG_NAME)*.zip

extension: schemas/gschemas.compiled $(MSGSRC:.po=.mo)

schemas/gschemas.compiled: schemas/org.gnome.shell.extensions.smerteliko-gnome-weather-extension.gschema.xml
	@echo "Компиляция DConf схем..."
	glib-compile-schemas schemas/

potfile: po/$(PKG_NAME).pot

po/$(PKG_NAME).pot: $(TOLOCALIZE)
	@echo "Генерация файла перевода .pot..."
	mkdir -p po
	xgettext -k_ -kN_ --from-code utf-8 -o po/$(PKG_NAME).pot --package-name $(PKG_NAME) $(TOLOCALIZE)

mergepo: potfile
	@echo "Слияние изменений .pot с .po файлами..."
	@for l in $(MSGSRC); do \
		msgmerge -U $$l po/$(PKG_NAME).pot; \
	done;

po/%.mo: po/%.po
	@echo "Компиляция файла .mo: $@"
	msgfmt -c $< -o $@

_build: all
	@echo "Создание временной директории сборки: _build"
	-rm -fR ./_build
	mkdir -p _build/schemas
	
	# Создаем структуру SRC: корневые JS, preferences и scripts
	mkdir -p _build
	cp $(addprefix $(SRC_DIR)/, $(MAIN_JS)) _build/
	
	mkdir -p _build/preferences
	cp $(addprefix $(SRC_DIR)/preferences/, $(PREFS_JS_FILES)) _build/preferences/
	
	mkdir -p _build/scripts
	cp $(addprefix $(SRC_DIR)/scripts/, $(SCRIPTS_JS_FILES)) _build/scripts/

	# Копируем мета-файлы и доп. директории
	cp $(BASE_FILES) _build
	cp -r $(EXTRA_DIRECTORIES) _build
	
	# Копируем схемы
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/

	# Обработка файлов локали (копируем .mo в структуру locale/)
	@echo "Копирование скомпилированных переводов..."
	mkdir -p _build/locale
	@for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/$(PKG_NAME).mo; \
	done;

	# Внедрение информации о версии Git в metadata.json
ifdef VERSION
	sed -i 's/"version": .*/"version": $(VERSION)/' _build/metadata.json;
else ifneq ($(strip $(GIT_VER)),)
	sed -i '/"version":/i\ \ "git-version": "$(GIT_VER)",' _build/metadata.json;
endif

install: install-local

install-local: _build
	@echo "Установка $(UUID) в $(INSTALLBASE)..."
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	
	# Копируем все содержимое _build/ в папку расширения
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
	
	-rm -fR _build
	@echo "Установка завершена. Перезапустите GNOME Shell (Alt+F2 -> r)."

zip-file: _build
	@echo "Создание дистрибутива zip: $(PKG_NAME)$(ZIPVER).zip"
	cd _build ; \
	zip -qr "$(PKG_NAME)$(ZIPVER).zip" .
	mv _build/$(PKG_NAME)$(ZIPVER).zip ./
	-rm -fR _build
	@echo "Zip файл создан."