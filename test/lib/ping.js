'use strict';

/* jshint -W030 */

var Ping = require('../../index')
  , helper = require('../helper')

describe('Pings', function() {

    var ping, socket, xmpp, manager

    var namespace = 'urn:xmpp:ping'

    before(function() {
        socket = new helper.SocketEventer()
        xmpp = new helper.XmppEventer()
        manager = {
            socket: socket,
            client: xmpp,
            trackId: function(id, callback) {
                this.callback = callback
            },
            makeCallback: function(error, data) {
                this.callback(error, data)
            },
            fullJid: {
                local: 'user',
                domain: 'example.com',
                resource: 'laptop'
            },
            _getLogger: function() {
                return {
                    log: function() {},
                    error: function() {},
                    warn: function() {},
                    info: function() {}
                }
            }
        }
        ping = new Ping()
        ping.init(manager)
    })

    beforeEach(function() {
        socket.removeAllListeners()
        xmpp.removeAllListeners()
        ping.init(manager)
    })

    describe('Ping', function() {

        it('Has the correct namespace', function() {
            ping.NS.should.equal(namespace)
        })

    })

})
