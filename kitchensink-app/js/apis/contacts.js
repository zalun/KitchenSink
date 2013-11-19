define(function(require) {
  var log = require('logger');
  var API = require('./models').API;

  return new API({
    id: 'contacts',
    name: 'Contacts API',
    description: 'Add/Read/Modify the device contacts address book.',
    bugs: [674720],
    info: 'https://wiki.mozilla.org/WebAPI/ContactsAPI',
    isPrepared: function() {
      return ('mozContacts' in navigator);
    },
    cleanUp: function(callback) {
      var search = navigator.mozContacts.find({
          filterBy: 'note',
          filterValue: 'kitchensink',
          filterOp: 'startsWith'});
      var count = 0;
      var length;
      function ret() {
        if (++count >= length) {
          callback();
        }
      }
      search.onsuccess = function() {
        var contacts = search.result;
        length = contacts.length;
        if (length === 0) {
          return callback();
        }
        for (var i=0; i < contacts.length; i++) {
          var remove = navigator.mozContacts.remove(contacts[i]);
          remove.onsuccess = ret;
          // remove.onerror = function(){}
        }
      };
      // search.onerror = function(){ };
    },
    tests: [
      function(callback) {
        this.cleanUp(function() {
          var test = 'create and remove a contact';

          if (navigator.mozContacts) {
            var contact = new mozContact();
            contact.init({name: 'Tom', note: 'kitchensink'}); // Bug 723206
            var saving1 = navigator.mozContacts.save(contact);
            saving1.onsuccess = function() {
              var contact = new mozContact();
              contact.init({name: 'Jerry', note: 'kitchensink'});
              var saving2 = navigator.mozContacts.save(contact);
              saving2.onsuccess = function() {
                var search = navigator.mozContacts.find({
                  filterBy: ['name'],
                  filterValue: 'Tom',
                  filterOp: 'startsWith'});
                search.onsuccess = function() {
                  if (search.result.length != 1) {
                    callback(false, test, 'find test failed. Expected: 1, Found: ' + search.result.length);
                  }
                  var removeRequest = navigator.mozContacts.remove(contact);
                  removeRequest.onsuccess = function() {
                    callback(true, test);
                  };
                  removeRequest.onerror = function() {
                    callback(false, test, 'remove contact failed');
                  };
                };
                search.onerror = function(e) {
                  callback(false, test, 'find error ');
                };
              };
              saving2.onerror = function() {
                callback(false, test, 'create second contact failed');
              };

              
            };
            saving1.onerror = function() {
              callback(false, test, 'create first contact failed');
            };
          } else {
            callback(false, test, 'navigator.MozContacts is falsy');
          }
        });
      }
    ]
  });
});
