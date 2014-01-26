'use strict';

var Base     = require('xmpp-ftw').Base
  , Disco    = require('xmpp-ftw-disco')
  , ltx      = require('ltx')
  , dataForm = require('xmpp-ftw').utils['xep-0004']
  , oob      = require('xmpp-ftw').utils['xep-0066']

var Command = function() {
    this.disco = new Disco()
}

Command.prototype = new Base()

Command.prototype.NS = 'http://jabber.org/protocol/commands'

Command.prototype._events = {
    'xmpp.command.list':    'listCommands',
    'xmpp.command.info':    'commandInfo',
    'xmpp.command.do':      'execute'
}

var init = Command.prototype.init

Command.prototype.init = function(manager) {
    init.call(this, manager)
    this.disco.init(manager, true)
}

Command.prototype.handles = function(stanza) {
    if ((false === stanza.is('message')) ||
        !stanza.getChild('query') ||
        (stanza.getChild('query').attrs.node !== this.NS)) {
        return false
    }
    return true
}

Command.prototype.handle = function(stanza) {
    // Going to ignore 'subject' element
    var data = []
    stanza.getChild('query').getChildren('item').forEach(function(command) {
        data.push({ node: command.attrs.node, name: command.attrs.name })
    })
    this.socket.send('xmpp.command.list', data)
    return true
}

Command.prototype.listCommands = function(data, callback) {
    data.node = this.NS
    data.of   = data.to
    delete data.to
    if (!data.of) data.of = this.manager.fullJid.getDomain()
    var newCallback
    if ('function' === typeof callback) {
        newCallback = function(error, data, rsm) {
            if (error) return callback(error)
            data.forEach(function(item, index) {
                delete data[index].jid
            })
            callback(error, data, rsm)
        }
    }
    this.disco.getItems(data, newCallback || callback)
}

Command.prototype.commandInfo = function(data, callback) {
    data.of = data.to
    delete data.to
    if (!data.of) data.of = this.manager.fullJid.getDomain()
    if (typeof callback !== 'function') {
        return this._clientError('Missing callback', data)
    }
    if (!data.node) {
        return this._clientError('Missing \'node\' key', data, callback)
    }
    this.disco.getFeatures(data, callback)
}

Command.prototype.execute = function(data, callback) {
    if (typeof callback !== 'function')
        return this._clientError('Missing callback', data)
    if (!data.node)
        return this._clientError('Missing \'node\' key', data, callback)
    if (!data.to)
        data.to = this.manager.fullJid.getDomain()
    var stanza = new ltx.Element(
        'iq',
        { to: data.to, type: 'set', id: this._getId() }
    )
    var attributes = {
        xmlns: this.NS,
        action: data.action || 'execute',
        node: data.node
    }
    var command = stanza.c('command', attributes)
    if (data.form) {
        dataForm.addForm(command, data.form)
    }
    var self = this
    this.manager.trackId(stanza.root().attr('id'), function(stanza) {
        if ('error' === stanza.attrs.type)
            return callback(self._parseError(stanza))
        self._handleExecuteCallback(stanza, callback)
    })
    this.client.send(stanza)
}

Command.prototype._handleExecuteCallback = function(stanza, callback) {
    var command = stanza.getChild('command', this.NS)
    var data = { status: command.attrs.status }
    if (command.getChild('note')) {
        var note = command.getChild('note')
        data.note = {
            type: note.attrs.type,
            description: note.getText()
        }
    }
    if (command.getChild('actions')) {
        var actions = command.getChild('actions')
        data.actions = { execute: actions.attrs.execute, values: [] }
        actions.children.forEach(function(action) {
            data.actions.values.push(action.getName())
        })
    }
    var x = command.getChild('x')
    if (x) {
        switch (x.attrs.xmlns) {
            case dataForm.NS:
                data.form = dataForm.parseFields(x)
                break
            case oob.NS_X:
                data.oob = oob.parse(command)
                break
        }
    }
    callback(null, data)
}

module.exports = Command
