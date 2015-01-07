/**
 * @fileOverview
 * Timer plugin for Shower.
 */
modules.define('shower-timer', [
    'Emitter',
    'util.extend',
    'util.bind'
], function (provide, EventEmitter, extend, bind) {

    var navigationPluginName = 'shower-navigation';

    /**
     * @class
     * Timer plugin for shower.
     * @name plugin.Timer
     * @param {Shower} shower
     * @constructor
     */
    function Timer (shower) {
        this.events = new EventEmitter();

        this._shower = shower;
        this._timer = null;

        this._showerListeners = null;
        this._playerListeners = null;
        this._pluginsListeners = null;
    }

    extend(Timer.prototype, /** @lends plugin.Timer.prototype */{

        init: function () {
            this._setupListeners();
        },

        destroy: function () {
            this._clearTimer();
            this._clearListeners();

            this._shower = null;
        },

        /**
         * @param {Integer} timing
         */
        run: function (timing) {
            this._initTimer(timing);
        },

        stop: function () {
            this._clearTimer();
        },

        _setupListeners: function () {
            var shower = this._shower;

            this.events
                .on('next', this._onNext, this);

            this._showerListeners = shower.events.group()
                .on('destroy', this.destroy, this);

            this._playerListeners = shower.player.events.group()
                .on('keydown', this._clearTimer, this)
                .on('activate', this._onSlideActivate, this);

            this._navigationPlugin = shower.plugins.get(navigationPluginName);
            if (!this._navigationPlugin) {
                this._pluginsListeners = this.shower.plugins.events.group()
                    .on('pluginadd', function (e) {
                        if (e.get('name') == navigationPluginName) {
                            this._navigationPlugin = shower.plugins.get(navigationPluginName);
                            this._pluginsListeners.offAll();
                        }
                    }, this);
            }

            if (shower.player.getCurrentSlideIndex() != -1) {
                this._onSlideActivate()
            }
        },

        _clearListeners: function () {
            this._showerListeners.offAll();
            this._playerListeners.offAll();
        },

        _onSlideActivate: function () {
            this._clearTimer();
            var currentSlide = this._shower.player.getCurrentSlide();

            if (this._shower.container.isSlideMode() && currentSlide.state.visited < 2) {
                var timing = currentSlide.getLayout().getData('timing');

                if (timing && /^(\d{1,2}:)?\d{1,3}$/.test(timing)) {
                    if (timing.indexOf(':') !== -1) {
                        timing = timing.split(':');
                        timing = (parseInt(timing[0], 10) * 60 + parseInt(timing[1], 10)) * 1000;
                    } else {
                        timing = parseInt(timing, 10) * 1000;
                    }

                    if (timing !== 0) {
                        this._initTimer(timing);
                    }
                }
            }
        },

        _initTimer: function (timing) {
            var shower = this._shower,
                navigationPlugin = this._navigationPlugin;

            // Support inner navigation plugin.
            if (navigationPlugin &&
                navigationPlugin.getLength() &&
                navigationPlugin.getLength() != navigationPlugin.getComplete()) {

                timing = timing / (navigationPlugin.getLength() + 1);
            }

            this._timer = setInterval(bind(function () {
                this.events.emit('next');
            }, this), timing);
        },

        _clearTimer: function () {
            if (this._timer) {
                clearInterval(this._timer);
                this._timer = null;
            }
        },

        _onNext: function () {
            this._clearTimer();
            this._shower.next();
        }
    });

    provide(Timer);
});

modules.require(['shower'], function (shower) {
    shower.plugins.add('shower-timer');
});
