'use strict';

var Base     = require('xmpp-ftw').Base
  , ltx      = require('ltx')

var Ping = function() {}

Ping.prototype = new Base()

Ping.prototype.NS = 'urn:xmpp:ping'

Ping.prototype._events = {
    'xmpp.ping': 'perform'
}

var init = Ping.prototype.init

Ping.prototype.init = function(manager) {
    init.call(this, manager)
}

Ping.prototype.handles = function(stanza) {
    return false
}

Ping.prototype.handle = function(stanza) {
    return false
}

Ping.prototype.perform = function(data, callback) {

}

module.exports = Ping
