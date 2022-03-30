// dollar utility (needs reworked)
const $ = (selector) => {
   let targets = null;
   if (typeof selector === 'string') {
      targets = [ ...document.querySelectorAll(selector) ];
   } else if (selector.constructor.name === 'HTMLCollection') {
      targets = [ ...selector ];
   } else {
      targets = [ selector ];
   }
   targets.on = (handlers) => {
      for (let target of targets) {
         for (let handler in handlers) {
            target.addEventListener(handler, handlers[handler]);
         }
      }
   };
   targets.css = (styles) => {
      for (let target of targets) {
         for (let style in styles) {
            target.style[style] = styles[style];
         }
      }
   };
   targets.attr = (property, value) => {
      for (let target of targets) {
         if (typeof value === 'string') {
            target.setAttribute(property, value);
         } else {
            target.removeAttribute(property);
         }
      }
   };
   return targets;
};

$.util = {
   pz: (number, length) => {
      let string = number.toString();
      while (string.length < length) {
         string = `0${string}`;
      }
      return string;
   },
   nv: (array) => {
      let nav = {
         array: array,
         index: 0,
         push: (diff) => {
            nav.index = nav.calc(diff);
            return nav.pull(0);
         },
         pull: (diff) => {
            return nav.array[nav.calc(diff)];
         },
         calc: (diff) => {
            let index = nav.index;
            if (diff < 0) {
               while (diff < 0) {
                  if (index === 0) index = nav.array.length;
                  --index;
                  ++diff;
               }
            } else if (diff > 0) {
               while (diff > 0) {
                  ++index;
                  if (index === nav.array.length) index = 0;
                  --diff;
               }
            }
            return index;
         }
      };
      Object.defineProperty(nav, 'current', {
         get () {
            return nav.pull(0);
         },
         set (v) {
            return nav.push(v);
         }
      });
      return nav;
   },
   ms: function (time) {
      let seconds = Math.floor(time);
      let minutes = Math.floor(seconds / 60);
      seconds -= minutes * 60;
      return `${$.util.pz(minutes, 2)}:${$.util.pz(seconds, 2)}`;
   },
   sf: function (array) {
      let output = [];
      for (let key in array) if (String(Number(key)) === key) output[+key] = array[key];
      output = output.reduceRight((p, v, i, a) => {
         v = i ? ~~Math.floor(Math.random() * i + 1) : i;
         v - i ? ([ a[v], a[i] ] = [ a[i], a[v] ]) : 0;
         return a;
      }, output);
      for (let key in output) array[key] = output[key];
      return output;
   }
};

// grid updater
setInterval(() => {
   for (let grid of $('grid')) {
      let size = $(grid.children)
         .map((child) => {
            let content = {};
            try {
               content = JSON.parse(JSON.parse(getComputedStyle(child, ':before').content));
            } catch (e) {}
            if (content.size) return content.size;
            if (child && child.offsetParent === null) return '';
            if (child) return child.getAttribute('size') || '1fr';
         })
         .join(' ');
      if (size) {
         let type = grid.getAttribute('type');
         $(grid).css({ [`grid-template-${type}`]: size });
      }
   }
}, 1e3 / 20);

// looped scripts
const L = [
   () => {
      if (!M.seek || (!M.volume && !O.player.duration)) return false;
      let rect1 = O.fill.getBoundingClientRect();
      let rect2 = O.rail.getBoundingClientRect();
      let cursor = event.clientX - rect1.left;
      let time = (O.player.duration || 0) / (rect2.width / cursor);
      cursor = cursor < 0 ? 0 : cursor > rect2.width ? rect1.width : cursor;
      if (M.volume) O.player.volume = 1 / (rect2.width / cursor);
      else O.player.currentTime = !isNaN(time) && isFinite(time) ? time : 0;
      O.fill.style.width = `${cursor}px`;
   },
   () => {
      if (M.resume && O.player.paused) O.player.play();
      if (M.seek || (O.player.readyState > 2 && M.ready)) {
         O.play.innerText = M.seek || O.player.paused ? 'play_arrow' : 'pause';
         O.play.style.animationName = 'none';
      } else if (M.active || M.resume) {
         O.play.innerText = 'search';
         O.play.style.animationName = 'buffering';
      }
      if (!M.volume && !O.player.duration) {
         O.current.innerText = '00:00';
         O.fill.style.width = '0';
      } else {
         let max = M.volume ? 100 : O.player.duration || 0;
         let rect = O.rail.getBoundingClientRect();
         let current = M.volume ? O.player.volume * 100 : O.player.currentTime;
         if (M.volume) O.current.innerText = `${Math.round(O.player.volume * 100)}%`;
         else {
            O.current.innerText = $.util.ms(O.player.currentTime);
            O.total.innerText = $.util.ms(O.player.duration);
         }
         if (!M.seek) O.fill.style.width = `${rect.width / (max / current)}px`;
      }
   },
   () => {
      if (M.volume) O.buff.style.width = '0';
      else {
         // fix code so it doesnt push page outside of viewport
         /*
         let buff = O.player.buffered;
         let index = 0;
         let max = O.player.duration || 0;
         let rect = O.rail.getBoundingClientRect();
         while (index < buff.length) {
            let end = buff.end(index);
            if (end < O.player.currentTime) ++index;
            else return (O.buff.style.width = `${rect.width / (max / end)}px`);
         }
         O.buff.style.width = `${rect.width / (max / O.player.currentTime)}px`;
         */
      }
   },
   () => {
      let tile = $('#preload-3')[0];
      if (tile) {
         let rect = tile.getBoundingClientRect();
         $('#hover-list').css({
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
         });
      }
   }
];

// media frontend
const M = {
   get active () {
      return !O.player.paused;
   },
   set active (value) {
      value ? O.player.paused && O.player.play().catch(() => (M.resume = false)) : O.player.paused || O.player.pause();
   },
   anim: false,
   content: 'assets/content/',
   flow: (direction) => {
      let array = [ ...N.data.index, ...N.data.index, ...N.data.index ];
      let offset = 3;
      let current = N.data.index.length + N.serial[0];
      for (let item of [ ...document.querySelectorAll('.flow-item') ]) {
         if (direction) item.style.animationName = `${item.id}-${direction}`;
         let image = document.createElement('img');
         image.src = M.content + N.data.groups[array[current + offset]].cover;
         O.preload.appendChild(image);
         setTimeout(() => {
            if (item.querySelector('img')) item.querySelector('img').remove();
            item.appendChild(image);
            item.style.animationName = 'none';
         }, 200);
         --offset;
      }
      setTimeout(() => {
         O.list.style.display = 'block';
      }, 200);
      O.list.innerHTML = eval('`' + O.header.innerHTML + '`');
      M.group.members.forEach((key, index) => {
         let member;
         switch (M.group.type) {
            case 'collection':
            case 'single':
               member = N.data.content[key];
               break;
            case 'compilation':
            case 'showcase':
               member = N.data.content[key.split(':')[1]];
               break;
         }
         O.list.innerHTML += eval('`' + O.item.innerHTML + '`');
      });
      for (let item of [ ...document.querySelectorAll('.list-item') ]) {
         item.addEventListener('click', (event) => {
            const key = event.currentTarget.id.split('-').slice(2).join('-');
            N.state = `${N.state.split('/')[0]}/${key}`;
            M.refresh();
            P.play(true);
         });
      }
   },
   get group () {
      return N.data.groups[N.group];
   },
   get member () {
      switch (M.group.type) {
         case 'collection':
         case 'single':
            return N.data.content[N.member];
         case 'compilation':
         case 'showcase':
            return N.data.content[N.member.split(':')[1]];
      }
   },
   ready: false,
   refresh: () => {
      if (M.active) M.resume = true;
      O.player.getAttribute('state') === N.state || (O.player.src = M.content + M.member.source);
      O.title.innerText = M.member.title;
      let title;
      switch (M.group.type) {
         case 'collection':
         case 'single':
            title = M.group.title;
            break;
         case 'compilation':
         case 'showcase':
            title = N.data.groups[N.member.split(':')[0]].title;
            break;
      }
      O.album.innerText = title;
      for (let li of [ ...document.querySelectorAll('.list-item') ]) {
         if (li.id === `list-item-${N.member}`) li.setAttribute('active', '');
         else li.removeAttribute('active');
      }
      O.player.setAttribute('state', N.state);
      if ('mediaSession' in navigator) {
         navigator.mediaSession.metadata = new MediaMetadata({
            title: M.member.title,
            artist: document.title,
            album: M.group.title,
            artwork: [ { src: M.content + M.group.cover } ]
         });
      }
      history.replaceState(null, null, `${location.origin}${location.pathname}?state=${N.state}`);
   },
   repeat: 'none',
   resume: false,
   seek: false,
   shuffle: false,
   volume: false
};

// data navigator
const N = {
   default: {},
   generate: (shuffle) => {
      let state;
      if (M.ready) state = N.state;
      N.data = JSON.parse(JSON.stringify(N.default));
      if (shuffle) {
         N.data.index.sort(() => Math.random() < 0.5);
         Object.values(N.data.groups).forEach((group) => group.members.sort(() => Math.random() < 0.5));
      }
      if (M.ready) N.state = state;
   },
   get group () {
      return N.data.index[N.serial[0]];
   },
   set group (value) {
      N.serial[0] = N.data.index.indexOf(value);
   },
   get member () {
      return M.group.members[N.serial[1]];
   },
   set member (value) {
      N.serial[1] = M.group.members.indexOf(value);
   },
   next: () => {
      if (++N.serial[1] > M.group.members.length - 1) {
         --N.serial[0] < 0 && (N.serial[0] = N.data.index.length - 1);
         N.serial[1] = 0;
         M.flow('next');
      }
      M.refresh();
   },
   prev: () => {
      if (--N.serial[1] < 0) {
         ++N.serial[0] > N.data.index.length - 1 && (N.serial[0] = 0);
         N.serial[1] = M.group.members.length - 1;
         M.flow('prev');
      }
      M.refresh();
   },
   serial: [ 0, 0 ],
   get state () {
      return `${N.group}/${N.member}`;
   },
   set state (value) {
      N.group = value.split('/')[0];
      N.member = value.split('/')[1];
   }
};

// html objects
const O = {
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

// player controller
const P = {
   play: (state) => {
      if (!M.ready) return;
      M.active = state === undefined ? !M.active : state;
      if (M.active) {
         M.resume = false;
         O.play.setAttribute('active', '');
         if (O.player.readyState < 3) O.play.innerText = 'search';
         else {
            O.play.innerText = 'pause';
            O.play.style.animationName = 'none';
         }
      } else {
         O.footer.removeAttribute('class');
         O.play.removeAttribute('active');
         O.play.innerText = 'play_arrow';
         O.play.style.animationName = 'none';
      }
   },
   repeat: (state) => {
      M.repeat = state === undefined ? { none: 'group', group: 'member', member: 'none' }[M.repeat] : state;
      switch (M.repeat) {
         case 'none':
            O.player.loop = false;
            O.repeat.removeAttribute('active');
            O.repeat.innerText = 'repeat';
            break;
         case 'group':
            O.player.loop = false;
            O.repeat.setAttribute('active', '');
            O.repeat.innerText = 'repeat';
            break;
         case 'member':
            O.player.loop = true;
            O.repeat.setAttribute('active', '');
            O.repeat.innerText = 'repeat_one';
            break;
      }
   },
   seek: (state) => {
      M.seek = state === undefined ? !M.seek : state;
      if (M.seek) {
         if (!M.volume && M.active) {
            P.play(false);
            M.resume = true;
         }
      } else {
         if (!M.volume && M.resume) {
            P.play(true);
            O.fill.removeAttribute('class');
            M.resume = false;
         }
      }
   },
   shuffle: (state) => {
      M.shuffle = state === undefined ? !M.shuffle : state;
      if (M.shuffle) O.shuffle.setAttribute('active', '');
      else O.shuffle.removeAttribute('active');
      N.generate(M.shuffle);
      M.flow();
      M.refresh();
   },
   volume: (state) => {
      M.volume = state === undefined ? !M.volume : state;
      if (M.volume) {
         O.volume.setAttribute('active', '');
         O.total.innerText = '100%';
      } else {
         O.volume.removeAttribute('active');
         O.total.innerText = $.util.ms(O.player.duration || 0);
      }
   }
};

fetch(M.content + 'index.json').then((data) => data.json()).then((data) => {
   N.default = data;
   N.serial[0] = data.index.length - 1;
   N.generate();
   const params = new URLSearchParams(location.search);
   if (params.has('state')) {
      N.state = params.get('state');
      M.resume = true;
   } else if (params.has('album') && params.has('track')) {
      N.serial[0] = Number(params.get('album')) - 1;
      N.serial[1] = Number(params.get('track')) - 1;
      M.resume = true;
   }
   M.flow();
   M.refresh();
});

// debug
window.L = L;
window.M = M;
window.N = N;
window.O = O;
window.P = P;

// basic triggers
$(document).on({ mouseup: () => P.seek(false), mousemove: L[0] });
$('#ctrl-prev').on({ click: () => N.prev() });
$('#ctrl-play').on({ click: () => P.play() });
$('#ctrl-next').on({ click: () => N.next() });
$('#ctrl-volume').on({ click: () => P.volume() });
$('#ctrl-repeat').on({ click: () => P.repeat() });
$('#ctrl-shuffle').on({ click: () => P.shuffle() });

// scrub triggers
$('#rail').on({
   mousedown: (e) => (P.seek(true), L[0](e)),
   mouseenter: () => O.fill.setAttribute('class', 'hover'),
   mouseleave: () => M.seek && O.fill.removeAttribute('class')
});

// cover flow triggers
$('#flow-left, #flow-far-left').on({
   mousedown: () => {
      if (++N.serial[0] === N.data.index.length) {
         N.serial[0] = 0;
      }
      N.serial[1] = 0;
      M.flow('prev');
      M.refresh();
   }
});
$('#flow-right, #flow-far-right').on({
   mousedown: () => {
      if (--N.serial[0] === -1) {
         N.serial[0] = N.data.index.length - 1;
      }
      N.serial[1] = 0;
      M.flow('next');
      M.refresh();
   }
});

// hover list triggers
$('#hover-list').on({
   mouseenter: () => $('#flow-center > img').css({ filter: 'blur(1px)' }),
   mouseleave: () => $('#flow-center > img').css({ filter: null })
});

// video triggers
$('video').on({
   ended: () => {
      if (M.loop === 'track') P.play(true);
      else {
         M.ready = false;
         N.next();
         M.resume = true;
      }
   },
   canplay: () => {
      M.ready = true;
      if (M.resume) P.play(true);
   },
   loadstart: () => {
      M.ready = false;
      P.play(true);
   }
});

// media key triggers
if ('mediaSession' in navigator) {
   navigator.mediaSession.setActionHandler('previoustrack', N.prev);
   navigator.mediaSession.setActionHandler('nexttrack', N.next);
   navigator.mediaSession.setActionHandler('play', () => P.play(true));
   navigator.mediaSession.setActionHandler('pause', () => P.play(false));
   navigator.mediaSession.setActionHandler('stop', () => {
      O.player.currentTime = 0;
      P.play(false);
   });
}

// other events
window.addEventListener('resize', () => (L[1](), L[2](), L[3]()));

// timers
setInterval(L[1], 50);
setInterval(L[2], 500);
setInterval(L[3], 100);

// defaults
O.player.volume = 0.5;

// garb shit
const position = nav.offsetTop;
window.addEventListener('scroll', () => {
   if (window.pageYOffset > position) {
      nav.classList.add('sticky');
   } else {
      nav.classList.remove('sticky');
   }
});

// pagination (yeeto peeto)
$('.nav').on({
   click: (event) => {
      const previous = $('.nav[active]')[0];
      const next = event.currentTarget;
      if (previous !== next) {
         previous.removeAttribute('active');
         $(`.page[name="${previous.getAttribute('name')}"]`)[0].removeAttribute('active');
         next.setAttribute('active', '');
         $(`.page[name="${next.getAttribute('name')}"]`)[0].setAttribute('active', '');
      }
   }
});
