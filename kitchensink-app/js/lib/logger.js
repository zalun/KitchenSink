define(function(require) {
  // TODO: add ability to change the log level

  var $ = require('elements');
  var elements = require('utils').elements;

  var send = function(type, message, element) {
    if (element) {
      elements('<p class="{type}">{Type}: {message}</p>'.format({
        type: type,
        Type: type.toUpperCase(),
        message: message
      })).insert(element);
    }
    console[type](type.toUpperCase() + ': ' + message);
  };

  var methods = {
    debug: function(message, el) {
      send('debug', message, el);
    },
    info: function(message, el) {
      send('info', message, el);
    },
    error: function(message, el) {
      send('error', message, el);
    }
  };

  var strip = function(stripObject, type) {
    var content = '';
    var inside = false;
    for (var key in stripObject) {
      inside = true;
      content += key + ': ' + stripObject[key] + '\n';
    }
    display = (!!type ? methods[type] : alert);

    if (inside) {
      display(content);
    } else {
      display(stripObject);
    }
  };

  methods.strip = strip;
  return methods;

});
