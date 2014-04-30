'use strict';

var Base     = require('xmpp-ftw').Base
  , ltx      = require('ltx')

var Ping = function() {}

Ping.prototype = new Base()

Ping.prototype.NS = 'urn:xmpp:ping'

Ping.prototype._events = {
    'xmpp.ping': 'perform',
    'xmpp.ping.pong': 'pong'
}

var init = Ping.prototype.init

Ping.prototype.init = function(manager) {
    init.call(this, manager)
}

Ping.prototype.handles = function(stanza) {
    return (stanza.is('iq') && !!stanza.getChild('ping', this.NS))
}

Ping.prototype.handle = function(stanza) {
    this.socket.send(
        'xmpp.ping',
        {
            id: stanza.attrs.id,
            from: this._getJid(stanza.attrs.from)
        }
    )
    return true
}

Ping.prototype.perform = function(data, callback) {
    if ('function' !== typeof callback)
        return this._clientError('Missing callback')
    if (!data.to) data.to = this.manager.fullJid.getDomain()
    var stanza = new ltx.Element(
        'iq',
        { to: data.to, id: this._getId(), type: 'get' }
    )
    stanza.c('ping', { xmlns: this.NS })
    var self = this
    this.manager.trackId(stanza, function(stanza) {
        if ('error' === stanza.attrs.type)
            return callback(self._parseError(stanza))
        callback(null, true)
    })
    this.client.send(stanza)
}

Ping.prototype.pong = function(data, callback) {
    if (!data.id)
        return this._clientError('Missing \'id\' key', data, callback)
    if (!data.to)
        return this._clientError('Missing \'to\' key', data, callback)
    var stanza = new ltx.Element(
        'iq',
        { to: data.to, id: data.id, type: 'result' }
    )
    this.client.send(stanza)
}

module.exports = Ping
