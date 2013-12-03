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
    cleanUp: function(successCB, errorCB) {
      function errorRemove() {
        errorCB('remove');
      }
      function successRemove() {
        if (++count >= length) {
          successCB();
        }
      }

      var search = navigator.mozContacts.find({
          filterBy: 'givenName',
          filterValue: 'kitchensink-app',
          filterOp: 'equals'});
      var count = 0;
      var length;

      search.onsuccess = function() {
        var contacts = search.result;
        length = contacts.length;
        if (length === 0) {
          return successCB();
        }
        for (var i=0; i < contacts.length; i++) {
          var remove = navigator.mozContacts.remove(contacts[i]);
          remove.onsuccess = successRemove;
          remove.onerror = errorRemove;
        }
      };
      search.onerror = function(e){ errorCB('find'); };
    },
    tests: [
      function(callback) {
        // https://wiki.mozilla.org/WebAPI/ContactsAPI#Get_all_contacts_example
        var test = 'getAll';
        // adding one contact
        var contact = new mozContact({
          firstName: ['Tom'], 
          givenName: ['kitchensink-app']
        }); // Bug 723206
        var saving = navigator.mozContacts.save(contact);
        saving.onsuccess = function() {
            var cursor = navigator.mozContacts.getAll({});

            cursor.onsuccess = function() {
                if (!cursor.result) {
                    callback(false, test, 'No contact found');
                }
                var remove = navigator.mozContacts.remove(contact);
                remove.onsuccess = function() {
                    callback(true, test);
                };
                remove.onerror = function() {
                    callback(false, test, 'Unable to remove the test contact');
                };
            };

            cursor.onerror = function() {
                callback(false, test, 'Error getting contacts');
            };
        };
        saving.onerror = function() {
            callback(false, test, 'Error in creating test contact');
        }

      },

      function(callback) {
        // https://developer.mozilla.org/en-US/docs/Web/API/ContactManager.find
        var test = 'find example from documentation';

        var filter = {
          // removed `name` as for https://bugzilla.mozilla.org/show_bug.cgi?id=898337
          filterBy: ['name', 'nickname', 'firstName'],
          filterValue: 'zorro',
          filterOp: 'equals',
          filterLimit: 100
        };

        var request = window.navigator.mozContacts.find(filter);

        request.onsuccess = function () {
          callback(true, test);
        }

        request.onerror = function () {
          callback(false, test, 'Something goes wrong!');
        }
      },

      function(callback) {
        var test = 'create and remove a contact';

        this.cleanUp(function() {
          var contact = new mozContact({
            firstName: ['Tom'], 
            givenName: ['kitchensink-app']
          });
          var saving1 = navigator.mozContacts.save(contact);
          saving1.onsuccess = function() {
            var contact = new mozContact({
              firstName: ['Jerry'], 
              givenName: ['kitchensink-app']
            });
            var saving2 = navigator.mozContacts.save(contact);
            saving2.onsuccess = function() {
              var search = navigator.mozContacts.find({
                filterBy: ['firstName'],
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
        }, function cleanUpError(what) {
            callback(false, test, what + ' failed in cleanUp');
        });
      }
    ]
  });
});
