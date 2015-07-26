define('app/controllers/logs', ['app/models/log', 'ember'],
    //
    //  Logs Controller
    //
    //  @returns Class
    //
    function (Log) {

        'use strict';

        return Ember.Controller.extend(Ember.Evented, {


            //
            //
            //  Properties
            //
            //


            model: [],
            loading: null,
            view: null,
            prettyTimeReady: false,


            load: function() {
                warn('load logs controller');
                if (!Mist.logs)  {
                    Ember.run.later(this, function () {
                        Mist.get('logs').on('logs', this, this.handleResponse);
                        Mist.get('logs').on('event', this, this.handleStream);
                    }, 350);
                } else {
                    Mist.get('logs').on('logs', this, this.handleResponse);
                    Mist.get('logs').on('event', this, this.handleStream);
                }
            },

            handleResponse: function(logs){
                if (this.get('view'))
                    this.get('view').handleResponse(logs);
            },

            handleStream: function(log) {
                if (this.get('view'))
                    this.get('view').handleStream(log);
            },

            //
            //
            //  Pseudo-Private Methods
            //
            //


            _reload: function () {
                Ember.run.later(this, function () {
                    this.load();
                }, 2000);
            },


            _setModel: function (logs) {
                Ember.run(this, function () {
                    var newModel = [];
                    logs.forEach(function (log) {
                        newModel.push(Log.create(log));
                    });
                    this.set('model', newModel);
                    this.trigger('onLogListChange');
                });
            },


            _prependModel: function (logs) {
                Ember.run(this, function () {
                    var additionalModel = [];
                    logs.forEach(function (log) {
                        additionalModel.push(Log.create(log));
                    });
                    this.get('model').unshiftObjects(additionalModel);
                    this.trigger('onLogListChange');
                });
            },


            _appendModel: function (logs) {
                Ember.run(this, function () {
                    var additionalModel = [];
                    logs.forEach(function (log) {
                        additionalModel.push(Log.create(log));
                    });
                    this.get('model').pushObjects(additionalModel);
                    this.trigger('onLogListChange');
                });
            }
        });
    }
);
