'use strict';

/* jshint -W030 */

var Ping = require('../../index')
  , helper = require('../helper')

var should = require('should')

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
                resource: 'laptop',
                getDomain: function() { return 'example.com' }
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

    describe('Outgoing ping', function() {

        it('Errors if callback missing', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing callback')
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.ping', {})
        })

        it('Errors with non-function callback', function(done) {
            xmpp.once('stanza', function() {
                done('Unexpected outgoing stanza')
            })
            socket.once('xmpp.error.client', function(error) {
                error.type.should.equal('modify')
                error.condition.should.equal('client-error')
                error.description.should.equal('Missing callback')
                xmpp.removeAllListeners('stanza')
                done()
            })
            socket.send('xmpp.ping', {}, true)
        })

        it('Sends expected stanza', function(done) {
            var request = { to: 'xmpp.org' }
            xmpp.once('stanza', function(stanza) {
                stanza.is('iq').should.be.true
                stanza.attrs.to.should.equal(request.to)
                stanza.attrs.type.should.equal('get')
                stanza.attrs.id.should.exist
                stanza.getChild('ping', ping.NS).should.exist
                done()
            })
            socket.send('xmpp.ping', request, function() {})
        })

        it('Fills in missing \'to\' address', function(done) {
            xmpp.once('stanza', function(stanza) {
                stanza.attrs.to
                    .should.equal(manager.fullJid.getDomain())
                done()
            })
            socket.send('xmpp.ping', {}, function() {})
        })

        it('Handles error response', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(helper.getStanza('iq-error'))
            })
            var callback = function(error, success) {
                should.not.exist(success)
                error.should.eql({
                    type: 'cancel',
                    condition: 'error-condition'
                })
                done()
            }
            socket.send('xmpp.ping', {}, callback)
        })

        it('Handes success response', function(done) {
            xmpp.once('stanza', function() {
                manager.makeCallback(helper.getStanza('iq-result'))
            })
            var callback = function(error, success) {
                should.not.exist(error)
                success.should.be.true
                done()
            }
            socket.send('xmpp.ping', {}, callback)
        })
    })

})
