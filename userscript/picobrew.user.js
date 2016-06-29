// ==UserScript==
// @name           What's Picobrewing
// @description    Alternative view for a Zymatic brew session
// @namespace      http://github.com/toddq/whatspicobrewing
// @author         toddq
// @license        GNU GPL v3 (http://www.gnu.org/copyleft/gpl.html)
// @version        0.3
// @include        https://picobrew.com/*
// @include        https://*.picobrew.com/*
// @grant GM_setValue
// @grant GM_getValue
// ==/UserScript==

if (typeof(jQuery) === 'undefined') { return; }

var userUuid;
var machineId;
var linkBase = 'https://toddq.github.io/whatspicobrewing/#?';

$(function(){
    initVars();
    addLinksToSessionList();
    addLinkToSessionView();
});

function addLinksToSessionList () {
    var sessionLinks = $('a[href*="Members/Logs/LogHouse"]');
    sessionLinks.each(function (index, link) {
        var sessionId = link.href.match(/id=(\w+)/)[1];
        var alt = $(' <a />', {
            href: makeUrl(sessionId),
            target: '_blank',
            text: '[Alt View]',
            style: 'float: right; margin-right: 10px;'
        });
        $(this).after(alt);
    });
    // $($('a[href*="Members/Logs/LogHouse"]')[1]).after('  <a>[Alt]</a>');
    
}

function addLinkToSessionView () {
    // page var
    if (typeof(sess) === 'undefined') { return; }

    var firstButtonCell = $('.buttonTable :first td:eq(0)');
    var newButtonCell = $('<td>').attr('style', firstButtonCell.attr('style'));
    firstButtonCell.before(newButtonCell);

    var sessionId = sess;

    var link = $('<a>', {
        role: 'button',
        text: 'Alt View',
        target: '_blank',
        href: makeUrl(sessionId),
        class: 'btn btn-xs btn-primary',
        style: 'padding: 2px 20px; color: #fff'
    });
    newButtonCell.html(link);
}

function makeUrl (sessionId) {
    return linkBase + 'userId=' + userUuid + '&machineId=' + machineId + '&sessionId=' + sessionId;
}
                 
function initVars() {
    console.log('initVars()');
    getUserUuid();
    getMachineId();
}

function getUserUuid () {
    userUuid = GM_getValue('userUuid');
    console.log('stored userid: ', userUuid);

    if (!userUuid || userUuid === 'undefined') {
        var $user = $('#user');

        if ($user && $user.val()) {
            userUuid = $user.val();
            console.log('storing userid:', userUuid);
            GM_setValue('userUuid', userUuid);
        }
        else {
            $.get('/Members/User/Brewhouse.cshtml', function (data) {
                var $data = $('<div>').html(data);
                $user = $data.find('#user');
                if ($user && $user.val()) {
                    userUuid = $user.val();
                    console.log('storing userid:', userUuid);
                    GM_setValue('userUuid', userUuid);
                }
            });    
        }
    }
    return userUuid;
}

function getMachineId () {
    machineId = GM_getValue('machineId');
    console.log('stored machineId:', machineId);
    
    if (!machineId || machineId === 'undefined') {
        $.get('/Members/User/EditSettings.cshtml', function (data) {
            var $data = $('<div>').html(data);
            machineId = $data.find('#zymaticInfoTable tr:eq(0) td:eq(1)').text();
            if (machineId && machineId !== "undefined") {
                console.log('storing machineId:', machineId);
                GM_setValue('machineId', machineId);
            }
            
        });
    }
    return machineId;
}