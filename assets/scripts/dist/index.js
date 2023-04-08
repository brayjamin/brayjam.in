var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
console.log('ewugehwuiehwf');
// placeholder ($) utility
var $ = function (selector) {
    var targets = null;
    if (typeof selector === 'string') {
        //@ts-expect-error
        targets = __spreadArray([], document.querySelectorAll(selector), true);
    }
    else if (selector.constructor.name === 'HTMLCollection') {
        //@ts-expect-error
        targets = __spreadArray([], selector, true);
    }
    else {
        targets = [selector];
    }
    targets.on = function (handlers) {
        Object.keys(handlers).forEach(function (event) {
            targets.forEach(function (target) {
                target.addEventListener(event, handlers[event]);
            });
        });
    };
    targets.off = function (handlers) {
        Object.keys(handlers).forEach(function (event) {
            targets.forEach(function (target) {
                target.removeEventListener(event, handlers[event]);
            });
        });
    };
    targets.css = function (styles) {
        targets.forEach(function (target) {
            Object.keys(styles).forEach(function (style) {
                target.style[style] = styles[style];
            });
        });
    };
    targets.attr = function (property, value) {
        targets.forEach(function (target) {
            if (!value)
                target.removeAttribute(property);
            else
                target.setAttribute(property, value);
        });
    };
    return targets;
};
$.util = {
    pz: function (number, length) {
        var string = number.toString();
        while (string.length < length)
            string = '0' + string;
        return string;
    },
    nv: function (array) {
        var nav = {
            array: array,
            index: 0,
            push: function (diff) {
                nav.index = nav.calc(diff);
                return nav.pull(0);
            },
            pull: function (diff) {
                return nav.array[nav.calc(diff)];
            },
            calc: function (diff) {
                var index = nav.index;
                if (diff < 0) {
                    while (diff > 0) {
                        if (index === 0)
                            index = nav.array.length;
                        --index;
                        ++diff;
                    }
                }
                else if (diff > 0) {
                    while (diff > 0) {
                        ++index;
                        if (index === nav.array.length)
                            index = 0;
                        --diff;
                    }
                }
                return index;
            }
        };
        Object.defineProperty(nav, 'current', {
            get: function () {
                return nav.pull(0);
            },
            set: function (v) {
                return nav.push(v);
            }
        });
        return nav;
    },
    ms: function (time) {
        var seconds = Math.floor(time);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds % 60;
        return "".concat($.util.pz(minutes, 2), ":").concat($.util.pz(seconds, 2));
    },
    sf: function (array) {
        var output = [];
        for (var key in array)
            if (String(Number(key)) === key)
                output[+key] = array[key];
        output = output.reduceRight(function (_, v, i, a) {
            var _a;
            v = i ? ~~Math.floor(Math.random() * i + 1) : i;
            v - i ? (_a = [a[i], a[v]], a[v] = _a[0], a[i] = _a[1], _a) : 0;
            return a;
        }, output);
        for (var key in output)
            array[key] = output[key];
        return output;
    }
};
// update album/playlist grid
setInterval(function () {
    var _a;
    for (var _i = 0, _b = $('grid'); _i < _b.length; _i++) {
        var grid = _b[_i];
        var size = $(grid.children)
            .map(function (child) {
            var content = {};
            try {
                content = JSON.parse(JSON.parse(getComputedStyle(child, ':before').content));
            }
            catch (e) { }
            if (content.size)
                return content.size;
            if (child && child.offsetParent === null)
                return '';
            if (child)
                return child.getAttribute('size') || '1fr';
        })
            .join(' ');
        if (size) {
            var type = grid.getAttribute('type');
            $(grid).css((_a = {}, _a["grid-template-".concat(type)] = size, _a));
        }
    }
}, 1e3 / 20);
/** Definitions */
var ui = {
    album: $('#track-album')[0],
    buff: $('#buff')[0],
    current: $('#current')[0],
    fill: $('#fill')[0],
    footer: $('#footer')[0],
    header: $('#list-header')[0],
    item: $('#list-item')[0],
    list: $('#hover-list')[0],
    play: $('#ctrl-play')[0],
    player: $('video')[0],
    preload: $('#preload')[0],
    rail: $('#rail')[0],
    repeat: $('#ctrl-repeat')[0],
    shuffle: $('#ctrl-shuffle')[0],
    title: $('#track-title')[0],
    total: $('#total')[0],
    volume: $('#ctrl-volume')[0]
};
/** Media frontend */
var mplayer = {
    get active() {
        return !ui.player.paused;
    },
    set active(value) {
        value
            ? ui.player.paused && ui.player.play().catch(function () { return (mplayer.resume = false); })
            : ui.player.paused || ui.player.pause();
    },
    anim: false,
    content: 'assets/content/',
    flow: function (direction) {
        var array = __spreadArray(__spreadArray(__spreadArray([], mnav.data['index'], true), mnav.data['index'], true), mnav.data['index'], true);
        var offset = 3;
        var current = mnav.data['index'].length + mnav.serial[0];
        var _loop_1 = function (item) {
            if (direction)
                item.style.animationName = "".concat(item.id, "-").concat(direction);
            var image = document.createElement('img');
            image.src = mplayer.content + mnav.data['groups'][array[current + offset]].cover;
            ui.preload.appendChild(image);
            setTimeout(function () {
                if (item.querySelector('img'))
                    item.querySelector('img').remove();
                item.appendChild(image);
                item.style.animationName = 'none';
            }, 200);
            --offset;
        };
        //@ts-expect-error
        for (var _i = 0, _a = __spreadArray([], document.querySelectorAll('.flow-item'), true); _i < _a.length; _i++) {
            var item = _a[_i];
            _loop_1(item);
        }
        setTimeout(function () {
            ui.list.style.display = 'block';
        }, 200);
        ui.list.innerHTML = eval('`' + ui.header.innerHTML + '`');
        mplayer.group.members.forEach(function (key, _) {
            //@ts-expect-error
            var member;
            switch (mplayer.group.type) {
                case 'collection':
                case 'single':
                case 'ep':
                    member = mnav.data['content'][key];
                    break;
                case 'compilation':
                case 'showcase':
                    member = mnav.data['content'][key.split(':')[1]];
                    break;
            }
            ui.list.innerHTML += eval('`' + ui.item.innerHTML + '`');
        });
        //@ts-expect-error
        for (var _b = 0, _c = __spreadArray([], document.querySelectorAll('.list-item'), true); _b < _c.length; _b++) {
            var item = _c[_b];
            item.addEventListener('click', function (event) {
                var key = event.currentTarget.id.split('-').slice(2).join('-');
                mnav.state = "".concat(mnav.state.split('/')[0], "/").concat(key);
                mplayer.refresh();
                mpc.play(true);
            });
        }
    },
    get group() {
        return mnav.data['groups'][mnav.group];
    },
    get member() {
        switch (mplayer.group.type) {
            case 'collection':
            case 'single':
            case 'ep':
                return mnav.data['content'][mnav.member];
            case 'compilation':
            case 'showcase':
                return mnav.data['content'][mnav.member.split(':')[1]];
        }
    },
    ready: false,
    refresh: function () {
        if (mplayer.active)
            mplayer.resume = true;
        ui.player.getAttribute('state') === mnav.state || (ui.player.src = mplayer.content + mplayer.member.source);
        ui.title.innerText = mplayer.member.title;
        var title;
        switch (mplayer.group.type) {
            case 'collection':
                title = mplayer.group.title;
                break;
            case 'single':
                title = 'Single';
                break;
            case 'ep':
                title = "".concat(mplayer.group.title, " - EP");
                break;
            case 'compilation':
            case 'showcase':
                title = mnav.data['groups'][mnav.member.split(':')[0]].title;
                break;
        }
        ui.album.innerText = title;
        //@ts-expect-error
        for (var _i = 0, _a = __spreadArray([], document.querySelectorAll('.list-item'), true); _i < _a.length; _i++) {
            var li = _a[_i];
            if (li.id === "list-item-".concat(mnav.member))
                li.setAttribute('active', '');
            else
                li.removeAttribute('active');
        }
        ui.player.setAttribute('state', mnav.state);
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: mplayer.member.title,
                artist: document.title,
                album: mplayer.group.title,
                artwork: [{ src: mplayer.content + mplayer.member.cover }]
            });
        }
        history.replaceState(null, null, "".concat(location.origin).concat(location.pathname, "?state=").concat(mnav.state));
        resizeHeaderText();
        var hoverList = document.getElementById('hover-list');
        if (mplayer.group.members.length === 1) {
            hoverList.classList.add('hide-hover-list');
        }
        else {
            hoverList.classList.remove('hide-hover-list');
        }
    },
    repeat: 'none',
    resume: false,
    seek: false,
    shuffle: false,
    volume: false
};
/** Media data handler */
var mnav = {
    default: {},
    data: {},
    generate: function (shuffle) {
        mnav.data = JSON.parse(JSON.stringify(mnav.default));
        if (shuffle) {
            mnav.data['index'].sort(function () { return Math.random() - 0.5; });
            Object.values(mnav.data['groups']).forEach(function (group) {
                group['members'].sort(function () { return Math.random() - 0.5; });
            });
        }
    },
    get group() {
        return mnav.data['index'][mnav.serial[0]];
    },
    set group(value) {
        mnav.serial[0] = mnav.data['index'].indexOf(value);
    },
    get member() {
        return mplayer.group.members[mnav.serial[1]];
    },
    set member(value) {
        mnav.serial[1] = mplayer.group.members.indexOf(value);
    },
    next: function () {
        if (++mnav.serial[1] > mplayer.group.members.length - 1) {
            --mnav.serial[0] < 0 && (mnav.serial[0] = mnav.data['index'].length - 1);
            mnav.serial[1] = 0;
            mplayer.flow('next');
        }
        mplayer.refresh();
    },
    prev: function () {
        if (--mnav.serial[1] < 0) {
            ++mnav.serial[0] > mnav.data['index'].length - 1 && (mnav.serial[0] = 0);
            mnav.serial[1] = mplayer.group.members.length - 1;
            mplayer.flow('prev');
        }
        mplayer.refresh();
    },
    serial: [0, 0],
    get state() {
        return "".concat(mnav.group, "/").concat(mnav.member);
    },
    set state(value) {
        mnav.group = value.split('/')[0];
        mnav.member = value.split('/')[1];
    }
};
function resizeTitleText() {
    var title = document.getElementById('track-title');
    if (!title)
        return;
    var textLength = title.textContent.length;
    var maxFontSize = 70; // Maximum font size
    var minFontSize = 30; // Minimum font size
    var maxLength = 30; // Maximum text length
    var fontSize = Math.max(minFontSize, maxFontSize - (textLength * (maxFontSize - minFontSize)) / maxLength);
    title.style.fontSize = fontSize + 'px';
}
function resizeHeaderText() {
    resizeTitleText();
    var hoverList = document.getElementById('hover-list');
    var headerText = hoverList.querySelector('text');
    if (!headerText)
        return;
    var textLength = headerText.textContent.length;
    var maxFontSize = 23.5; // Maximum font size
    var minFontSize = 10; // Minimum font size
    var maxLength = 160; // Maximum text length
    var fontSize = Math.max(minFontSize, maxFontSize - (textLength * (maxFontSize - minFontSize)) / maxLength);
    headerText.style.fontSize = fontSize + 'px';
}
// Call the function on page load
resizeHeaderText();
/** Media player controller */
var mpc = {
    play: function (state) {
        if (!mplayer.ready)
            return;
        mplayer.active = state === undefined ? !mplayer.active : state;
        if (mplayer.active) {
            mplayer.resume = false;
            ui.play.setAttribute('active', '');
            if (ui.player.readyState < 3)
                ui.play.innerText = 'search';
            else {
                ui.play.innerText = 'pause';
                ui.play.style.animationName = 'none';
            }
        }
        else {
            ui.footer.removeAttribute('class');
            ui.play.removeAttribute('active');
            ui.play.innerText = 'play_arrow';
            ui.play.style.animationName = 'none';
        }
    },
    repeat: function (state) {
        mplayer.repeat = "".concat(state === undefined ? { none: 'group', group: 'member', member: 'none' }[mplayer.repeat] : state);
        switch (mplayer.repeat) {
            case 'none': {
                ui.player.loop = false;
                ui.repeat.removeAttribute('active');
                ui.repeat.innerText = 'repeat';
                break;
            }
            case 'group': {
                ui.player.loop = false;
                ui.repeat.setAttribute('active', '');
                ui.repeat.innerText = 'repeat';
                break;
            }
            case 'member': {
                ui.player.loop = true;
                ui.repeat.setAttribute('active', '');
                ui.repeat.innerText = 'repeat_one';
                break;
            }
        }
    },
    seek: function (state) {
        mplayer.seek = state === undefined ? !mplayer.seek : state;
        if (mplayer.seek) {
            if (!mplayer.volume && mplayer.active) {
                mpc.play(false);
                mplayer.resume = true;
            }
        }
        else {
            if (!mplayer.volume && mplayer.resume) {
                mpc.play(true);
                ui.fill.removeAttribute('class');
                mplayer.resume = false;
            }
        }
    },
    shuffle: function (state) {
        mplayer.shuffle = state === undefined ? !mplayer.shuffle : state;
        if (mplayer.shuffle)
            ui.shuffle.setAttribute('active', '');
        else
            ui.shuffle.removeAttribute('active');
        mnav.generate(mplayer.shuffle);
        mplayer.flow();
        mplayer.refresh();
    },
    volume: function (state) {
        mplayer.volume = state === undefined ? !mplayer.volume : state;
        if (mplayer.volume) {
            ui.volume.setAttribute('active', '');
            ui.total.innerText = '100%';
        }
        else {
            ui.volume.removeAttribute('active');
            ui.total.innerText = $.util.ms(ui.player.duration || 0);
        }
    }
};
var index;
fetch(mplayer.content + 'index.json')
    .then(function (data) { return data.json(); })
    .then(function (data) {
    mnav.default = data;
    mnav.serial[0] = data['index'].length - 1;
    mnav.generate();
    var params = new URLSearchParams(location.search);
    if (params.has('state')) {
        mnav.state = params.get('state');
        mplayer.resume = true;
    }
    else if (params.has('album') && params.has('track')) {
        mnav.serial[0] = Number(params.get('album')) - 1;
        mnav.serial[1] = Number(params.get('track')) - 1;
        mplayer.resume = true;
    }
    mplayer.flow();
    mplayer.refresh();
});
/** Looped scripts */
var loops = [
    function (event) {
        if (!mplayer.seek || (!mplayer.volume && !ui.player.duration))
            return false;
        var rect1 = ui.fill.getBoundingClientRect();
        var rect2 = ui.rail.getBoundingClientRect();
        var cursor = event.clientX - rect1.left;
        var time = (ui.player.duration || 0) / (rect2.width / cursor);
        cursor = cursor < 0 ? 0 : cursor > rect2.width ? rect1.width : cursor;
        if (mplayer.volume)
            ui.player.volume = 1 / (rect2.width / cursor);
        else
            ui.player.currentTime = !isNaN(time) && isFinite(time) ? time : 0;
        ui.fill.style.width = "".concat(cursor, "px");
    },
    function () {
        if (mplayer.resume && ui.player.paused)
            ui.player.play();
        if (mplayer.seek || (ui.player.readyState > 2 && mplayer.ready)) {
            ui.play.innerText = mplayer.seek || ui.player.paused ? 'play_arrow' : 'pause';
            ui.play.style.animationName = 'none';
        }
        else if (mplayer.active || mplayer.resume) {
            ui.play.innerText = 'search';
            ui.play.style.animationName = 'buffering';
        }
        if (!mplayer.volume && !ui.player.duration) {
            ui.current.innerText = '00:00';
            ui.fill.style.width = '0';
        }
        else {
            var max = mplayer.volume ? 100 : ui.player.duration || 0;
            var rect = ui.rail.getBoundingClientRect();
            var current = mplayer.volume ? ui.player.volume * 100 : ui.player.currentTime;
            if (mplayer.volume)
                ui.current.innerText = "".concat(Math.round(ui.player.volume * 100), "%");
            else {
                ui.current.innerText = $.util.ms(ui.player.currentTime);
                ui.total.innerText = $.util.ms(ui.player.duration);
            }
            if (!mplayer.seek)
                ui.fill.style.width = "".concat(rect.width / (max / current), "px");
        }
    },
    function () {
        if (mplayer.volume)
            ui.buff.style.width = '0';
        else {
            /*
            let buff = ui.player.buffered;
            let index = 0;
            let max = ui.player.duration || 0;
            let rect = ui.rail.getBoundingClientRect();
            while (index < buff.length) {
               let end = buff.end(index);
               if (end < ui.player.currentTime) ++index;
               else return (ui.buff.style.width = `${rect.width / (max / end)}px`);
            }
            ui.buff.style.width = `${rect.width / (max / ui.player.currentTime)}px`;
            */
        }
    },
    function () {
        var tile = $('#preload-3')[0];
        if (tile) {
            var rect = tile.getBoundingClientRect();
            $('#hover-list').css({
                top: "".concat(rect.top, "px"),
                left: "".concat(rect.left, "px"),
                width: "".concat(rect.width, "px"),
                height: "".concat(rect.height, "px")
            });
        }
    }
];
/** Basic triggers */
$(document).on({ mouseup: function () { return mpc.seek(false); }, mousemove: loops[0] });
$('#ctrl-prev').on({ click: function () { return mnav.prev(); } });
$('#ctrl-play').on({ click: function () { return mpc.play(); } });
$('#ctrl-next').on({ click: function () { return mnav.next(); } });
$('#ctrl-volume').on({ click: function () { return mpc.volume(); } });
$('#ctrl-repeat').on({ click: function () { return mpc.repeat(); } });
$('#ctrl-shuffle').on({ click: function () { return mpc.shuffle(); } });
/** Scrub triggers */
$('#rail').on({
    mousedown: function (e) { return (mpc.seek(true), loops[0](e)); },
    mouseenter: function () { return ui.fill.setAttribute('class', 'hover'); },
    mouseleave: function () { return ui.fill.removeAttribute('class'); }
});
/** Cover flow triggers */
$('#flow-left, #flow-far-left').on({
    mousedown: function () {
        if (++mnav.serial[0] === mnav.data['index'].length) {
            mnav.serial[0] = 0;
        }
        mnav.serial[1] = 0;
        mplayer.flow('prev');
        mplayer.refresh();
    }
});
$('#flow-right, #flow-far-right').on({
    mousedown: function () {
        if (--mnav.serial[0] === -1) {
            mnav.serial[0] = mnav.data['index'].length - 1;
        }
        mnav.serial[1] = 0;
        mplayer.flow('next');
        mplayer.refresh();
    }
});
/** Hover list triggers */
$('#hover-list').on({
    mouseenter: function () {
        if (mplayer.group.members.length === 1)
            return;
        else
            $('#flow-center > img').css({ filter: 'blur(1px)' });
    },
    mouseleave: function () { return $('#flow-center > img').css({ filter: null }); }
});
/** Video triggers */
$('video').on({
    ended: function () {
        if (mplayer.repeat === 'track')
            mpc.play(true);
        else {
            mplayer.ready = false;
            mnav.next();
            mplayer.resume = true;
        }
    },
    canplay: function () {
        mplayer.ready = true;
        if (mplayer.resume)
            mpc.play(true);
    },
    loadstart: function () {
        mplayer.ready = false;
        mpc.play(true);
    }
});
/** Media key triggers */
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('previoustrack', mnav.prev);
    navigator.mediaSession.setActionHandler('nexttrack', mnav.next);
    navigator.mediaSession.setActionHandler('play', function () { return mpc.play(true); });
    navigator.mediaSession.setActionHandler('pause', function () { return mpc.play(false); });
    navigator.mediaSession.setActionHandler('stop', function () {
        ui.player.currentTime = 0;
        mpc.play(false);
    });
}
/** Misc triggers */
window.addEventListener('resize', function () { return (loops[1](), loops[2](), loops[3]()); });
document.body.onkeyup = function (event) {
    if (event.keyCode === 32)
        mpc.play(!mplayer.active);
};
/** Timers */
setInterval(loops[1], 50);
setInterval(loops[2], 500);
setInterval(loops[3], 100);
/** Defaults */
ui.player.volume = 0.75;
/** Garb shit */
//@ts-expect-error
var position = nav.offsetTop;
window.addEventListener('scroll', function () {
    if (window.pageYOffset > position) {
        //@ts-expect-error
        nav.classList.add('sticky');
    }
    else {
        //@ts-expect-error
        nav.classList.remove('sticky');
    }
});
// pagination (yeeto peeto)
$('.nav').on({
    click: function (event) {
        var previous = $('.nav[active]')[0];
        var next = event.currentTarget;
        if (previous !== next) {
            previous.removeAttribute('active');
            $(".page[name=\"".concat(previous.getAttribute('name'), "\"]"))[0].removeAttribute('active');
            next.setAttribute('active', '');
            $(".page[name=\"".concat(next.getAttribute('name'), "\"]"))[0].setAttribute('active', '');
        }
    }
});
setInterval(function () {
    if (window.innerWidth < 768) {
        console.log('wefewf');
        // hide album grid
        $('#content').css({ display: 'none' });
        $('#small-screen').css({ display: 'inline-block' });
    }
    else {
        // show album grid
        $('#content').css({ display: 'grid' });
        $('#small-screen').css({ display: 'none' });
    }
}, 100);
//# sourceMappingURL=index.js.map