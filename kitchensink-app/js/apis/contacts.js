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
          filterBy: ['familyName'],
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
        var data = {
          givenName: ['Tom'], 
          familyName: ['kitchensink-app']
        }
        var contact = new mozContact(data); 
        if ('init' in contact) {
          contact.init(data);
        }
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
        var test = 'update an existing contact by constructing from scratch';
        this.cleanUp(function() {
          var data = {
            givenName: ['Tom'], 
            familyName: ['kitchensink-app']
          };
          var contact = new mozContact(data);
          if ('init' in contact) {
            contact.init(data);
          }
          function saveError() {
            callback(false, test, 'Save error');
          }
          var saveRequest = navigator.mozContacts.save(contact);
          saveRequest.onsuccess = function() {
            var search = navigator.mozContacts.find({
              filterBy: ['id'],
              filterValue: contact.id,
              filterOp: 'equals'});
            search.onsuccess = function() {
              if (search.result.length !== 1) {
                callback(false, test, 'Result number is wrong. 1 !== ' + search.result.length);
              }
              var contact2 = search.result[0];
              contact2.givenName = ['Updated'];
              var saveRequest2 = navigator.mozContacts.save(contact2);
              saveRequest2.onsuccess = function() {
                if (contact2.id !== contact.id) {
                  callback(false, test, contact2.id + ' !== ' + contact.id);
                  return;
                }
                if (contact2.givenName[0] === 'Updated' &&
                    contact.familyName === contact.familyName) {
                  callback(true, test);
                } else { 
                  callback(false, test, 'Names are different');
                }
              };
              saveRequest2.onerror = saveError;
            }
            search.onerror = function(e) {
              callback(false, test, 'search error');
            }
          };
          saveRequest.onerror = saveError;
        });
      },

      /* 
       * it's currentlly a feature not a bug
       *
      function(callback) {
        var test = 'delete already deleted contact';
        this.cleanUp(function() {
          var data = {
            givenName: ['Tom'], 
            familyName: ['kitchensink-app']
          };
          var contact = new mozContact(data);
          if ('init' in contact) {
            contact.init(data);
          }
          function saveError() {
            callback(false, test, 'Save error');
          }
          function removeError() {
            callback(false, test, 'Remove error');
          }
          var saveRequest = navigator.mozContacts.save(contact);
          saveRequest.onsuccess = function() {
            var removeRequest = navigator.mozContacts.remove(contact);
            removeRequest.onsuccess = function() {
              var removeRequest2 = navigator.mozContacts.remove(contact);
              removeRequest2.onsuccess = function() {
                callback(false, test, 'Successful remove of a non existing contact');
              };
              removeRequest2.onerror = function() {
                callback(true, test);
              };
            };
            removeRequest.onerror = removeError;
          };
          saveRequest.onerror = saveError;
        });
      },
      */
        
      function(callback) {
        var test = 'create, search and remove a contact';

        this.cleanUp(function() {
          var data = {
            givenName: ['Tom'], 
            familyName: ['kitchensink-app']
          };
          var contact = new mozContact(data);
          if ('init' in contact) {
            contact.init(data);
          }
          var saving1 = navigator.mozContacts.save(contact);
          saving1.onsuccess = function() {
            var data = {
              givenName: ['Jerry', 'kitchensink-app'],
              familyName: ['kitchensink-app'], 
              tel: [{value: '123456'}], 
              email: [{type: ['home'], value: 'test@example.com'},
                      {type: ['work'], value: 'work@example.com', pref: true}],
              familyName: ['kitchensink-app']
            };
            var contact = new mozContact(data);
            if ('init' in contact) {
              contact.init(data);
            }
            var saving2 = navigator.mozContacts.save(contact);
            saving2.onsuccess = function() {
              var savedId = contact.id;
              var search = navigator.mozContacts.find({
                filterBy: ['givenName'],
                filterValue: 'kitchensink',
                filterOp: 'startsWith'});
              search.onsuccess = function() {
                if (search.result.length != 1) {
                  callback(false, test, 'find test failed. Expected: 1, Found: ' + search.result.length);
                } else {
                  var contact = search.result[0];
                  if (contact.id !== savedId) {
                    callback(false, test, 'Found contact has wring id');
                  } else if (!contact.email || contact.email.length !== 2) {
                    callback(false, test, 'No email found in contact');
                    return;
                  }
                  if (contact.email[0].value != 'test@example.com') {
                    callback(false, test, 'wrong email saved');
                    return;
                  }
                  var removeRequest = navigator.mozContacts.remove(contact);
                  removeRequest.onsuccess = function() {
                    callback(true, test);
                  };
                  removeRequest.onerror = function() {
                    callback(false, test, 'remove contact failed');
                  };
                }
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
