console.log('ewugehwuiehwf');

// placeholder ($) utility
const $ = (selector: string | HTMLElement | HTMLCollection | Element | Document | HTMLDocument) => {
   let targets = null;
   if (typeof selector === 'string') {
      //@ts-expect-error
      targets = [ ...document.querySelectorAll(selector) ];
   } else if (selector.constructor.name === 'HTMLCollection') {
      //@ts-expect-error
      targets = [ ...selector ];
   } else {
      targets = [ selector ];
   }
   targets.on = (handlers: { [x in string]: () => void }) => {
      Object.keys(handlers).forEach(event => {
         targets.forEach(target => {
            target.addEventListener(event, handlers[event]);
         });
      });
   };
   targets.off = (handlers: { [x in string]: () => void }) => {
      Object.keys(handlers).forEach(event => {
         targets.forEach(target => {
            target.removeEventListener(event, handlers[event]);
         });
      });
   };
   targets.css = (styles: { [x in string]: string | number | boolean | null }) => {
      targets.forEach(target => {
         Object.keys(styles).forEach(style => {
            target.style[style] = styles[style];
         });
      });
   };
   targets.attr = (property, value?: string) => {
      targets.forEach(target => {
         if (!value) target.removeAttribute(property);
         else target.setAttribute(property, value);
      });
   };
   return targets;
};
$.util = {
   pz: (number: number, length: number) => {
      let string = number.toString();
      while (string.length < length) string = '0' + string;
      return string;
   },
   nv: (array: Array<string | HTMLElement | Element>) => {
      let nav = {
         array: array,
         index: 0,
         push: (diff: number) => {
            nav.index = nav.calc(diff);
            return nav.pull(0);
         },
         pull: (diff: number) => {
            return nav.array[nav.calc(diff)];
         },
         calc: (diff: number) => {
            let index = nav.index;
            if (diff < 0) {
               while (diff > 0) {
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
         set (v: number) {
            return nav.push(v);
         }
      });
      return nav;
   },
   ms: function (time: number) {
      let seconds = Math.floor(time);
      let minutes = Math.floor(seconds / 60);
      seconds = seconds % 60;
      return `${$.util.pz(minutes, 2)}:${$.util.pz(seconds, 2)}`;
   },
   sf: function (array: Array<string | HTMLElement | Element>) {
      let output = [];
      for (let key in array) if (String(Number(key)) === key) output[+key] = array[key];
      output = output.reduceRight((_, v, i, a) => {
         v = i ? ~~Math.floor(Math.random() * i + 1) : i;
         v - i ? ([ a[v], a[i] ] = [ a[i], a[v] ]) : 0;
         return a;
      }, output);
      for (let key in output) array[key] = output[key];
      return output;
   }
};

// update album/playlist grid
setInterval(() => {
   for (let grid of $('grid')) {
      let size = $(grid.children)
         .map(child => {
            let content = {} as {
               size: number;
            };
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

/** Definitions */
const ui = {
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
const mplayer = {
   get active () {
      return !ui.player.paused;
   },
   set active (value) {
      value
         ? ui.player.paused && ui.player.play().catch(() => (mplayer.resume = false))
         : ui.player.paused || ui.player.pause();
   },
   anim: false,
   content: 'assets/content/',
   flow: (direction?) => {
      let array = [ ...mnav.data['index'], ...mnav.data['index'], ...mnav.data['index'] ];
      let offset = 3;
      let current = mnav.data['index'].length + mnav.serial[0];
      //@ts-expect-error
      for (let item of [ ...document.querySelectorAll('.flow-item') ] as HTMLElement[]) {
         if (direction) item.style.animationName = `${item.id}-${direction}`;
         let image = document.createElement('img');
         image.src = mplayer.content + mnav.data['groups'][array[current + offset]].cover;
         ui.preload.appendChild(image);
         setTimeout(() => {
            if (item.querySelector('img')) item.querySelector('img').remove();
            item.appendChild(image);
            item.style.animationName = 'none';
         }, 200);
         --offset;
      }
      setTimeout(() => {
         ui.list.style.display = 'block';
      }, 200);
      ui.list.innerHTML = eval('`' + ui.header.innerHTML + '`');
      mplayer.group.members.forEach((key, _) => {
         //@ts-expect-error
         let member;
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
      for (let item of [ ...document.querySelectorAll('.list-item') ]) {
         item.addEventListener('click', event => {
            const key = event.currentTarget.id.split('-').slice(2).join('-');
            mnav.state = `${mnav.state.split('/')[0]}/${key}`;
            mplayer.refresh();
            mpc.play(true);
         });
      }
   },
   get group () {
      return mnav.data['groups'][mnav.group];
   },
   get member () {
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
   refresh: () => {
      if (mplayer.active) mplayer.resume = true;
      ui.player.getAttribute('state') === mnav.state || (ui.player.src = mplayer.content + mplayer.member.source);
      ui.title.innerText = mplayer.member.title;
      let title;
      switch (mplayer.group.type) {
         case 'collection':
            title = mplayer.group.title;
            break;
         case 'single':
            title = 'Single';
            break;
         case 'ep':
            title = `${mplayer.group.title} - EP`;
            break;
         case 'compilation':
         case 'showcase':
            title = mnav.data['groups'][mnav.member.split(':')[0]].title;
            break;
      }
      ui.album.innerText = title;
      //@ts-expect-error
      for (let li of [ ...document.querySelectorAll('.list-item') ] as HTMLElement[]) {
         if (li.id === `list-item-${mnav.member}`) li.setAttribute('active', '');
         else li.removeAttribute('active');
      }
      ui.player.setAttribute('state', mnav.state);
      if ('mediaSession' in navigator) {
         navigator.mediaSession.metadata = new MediaMetadata({
            title: mplayer.member.title,
            artist: document.title,
            album: mplayer.group.title,
            artwork: [ { src: mplayer.content + mplayer.member.cover } ]
         });
      }
      history.replaceState(null, null, `${location.origin}${location.pathname}?state=${mnav.state}`);
      resizeHeaderText();
      const hoverList = document.getElementById('hover-list');
      if (mplayer.group.members.length === 1) {
         hoverList.classList.add('hide-hover-list');
      } else {
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
const mnav = {
   default: {},
   data: {},
   generate: (shuffle?: boolean) => {
      mnav.data = JSON.parse(JSON.stringify(mnav.default));
      if (shuffle) {
         mnav.data['index'].sort(() => Math.random() - 0.5);
         Object.values(mnav.data['groups']).forEach(group => {
            group['members'].sort(() => Math.random() - 0.5);
         });
      }
   },
   get group () {
      return mnav.data['index'][mnav.serial[0]];
   },
   set group (value) {
      mnav.serial[0] = mnav.data['index'].indexOf(value);
   },
   get member () {
      return mplayer.group.members[mnav.serial[1]];
   },
   set member (value) {
      mnav.serial[1] = mplayer.group.members.indexOf(value);
   },
   next: () => {
      if (++mnav.serial[1] > mplayer.group.members.length - 1) {
         --mnav.serial[0] < 0 && (mnav.serial[0] = mnav.data['index'].length - 1);
         mnav.serial[1] = 0;
         mplayer.flow('next');
      }
      mplayer.refresh();
   },
   prev: () => {
      if (--mnav.serial[1] < 0) {
         ++mnav.serial[0] > mnav.data['index'].length - 1 && (mnav.serial[0] = 0);
         mnav.serial[1] = mplayer.group.members.length - 1;
         mplayer.flow('prev');
      }
      mplayer.refresh();
   },
   serial: [ 0, 0 ],
   get state () {
      return `${mnav.group}/${mnav.member}`;
   },
   set state (value) {
      mnav.group = value.split('/')[0];
      mnav.member = value.split('/')[1];
   }
};
function resizeTitleText () {
   const title = document.getElementById('track-title');
   if (!title) return;
   const textLength = title.textContent.length;
   const maxFontSize = 70; // Maximum font size
   const minFontSize = 30; // Minimum font size
   const maxLength = 30; // Maximum text length
   const fontSize = Math.max(minFontSize, maxFontSize - (textLength * (maxFontSize - minFontSize)) / maxLength);

   title.style.fontSize = fontSize + 'px';
}
function resizeHeaderText () {
   resizeTitleText();
   const hoverList = document.getElementById('hover-list');
   const headerText = hoverList.querySelector('text');
   if (!headerText) return;
   const textLength = headerText.textContent.length;
   const maxFontSize = 23.5; // Maximum font size
   const minFontSize = 10; // Minimum font size
   const maxLength = 160; // Maximum text length
   const fontSize = Math.max(minFontSize, maxFontSize - (textLength * (maxFontSize - minFontSize)) / maxLength);

   headerText.style.fontSize = fontSize + 'px';
}

// Call the function on page load
resizeHeaderText();

/** Media player controller */
const mpc = {
   play: (state?: boolean) => {
      if (!mplayer.ready) return;
      mplayer.active = state === undefined ? !mplayer.active : state;
      if (mplayer.active) {
         mplayer.resume = false;
         ui.play.setAttribute('active', '');
         if (ui.player.readyState < 3) ui.play.innerText = 'search';
         else {
            ui.play.innerText = 'pause';
            ui.play.style.animationName = 'none';
         }
      } else {
         ui.footer.removeAttribute('class');
         ui.play.removeAttribute('active');
         ui.play.innerText = 'play_arrow';
         ui.play.style.animationName = 'none';
      }
   },
   repeat: (state?: boolean) => {
      mplayer.repeat = `${
         state === undefined ? { none: 'group', group: 'member', member: 'none' }[mplayer.repeat] : state
      }`;
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
   seek: (state?: boolean) => {
      mplayer.seek = state === undefined ? !mplayer.seek : state;
      if (mplayer.seek) {
         if (!mplayer.volume && mplayer.active) {
            mpc.play(false);
            mplayer.resume = true;
         }
      } else {
         if (!mplayer.volume && mplayer.resume) {
            mpc.play(true);
            ui.fill.removeAttribute('class');
            mplayer.resume = false;
         }
      }
   },
   shuffle: (state?: boolean) => {
      mplayer.shuffle = state === undefined ? !mplayer.shuffle : state;
      if (mplayer.shuffle) ui.shuffle.setAttribute('active', '');
      else ui.shuffle.removeAttribute('active');
      mnav.generate(mplayer.shuffle);
      mplayer.flow();
      mplayer.refresh();
   },
   volume: (state?: boolean) => {
      mplayer.volume = state === undefined ? !mplayer.volume : state;
      if (mplayer.volume) {
         ui.volume.setAttribute('active', '');
         ui.total.innerText = '100%';
      } else {
         ui.volume.removeAttribute('active');
         ui.total.innerText = $.util.ms(ui.player.duration || 0);
      }
   }
};
let index: number;
fetch(mplayer.content + 'index.json')
   .then(data => data.json())
   .then(data => {
      mnav.default = data;
      mnav.serial[0] = data['index'].length - 1;
      mnav.generate();
      const params = new URLSearchParams(location.search);
      if (params.has('state')) {
         mnav.state = params.get('state');
         mplayer.resume = true;
      } else if (params.has('album') && params.has('track')) {
         mnav.serial[0] = Number(params.get('album')) - 1;
         mnav.serial[1] = Number(params.get('track')) - 1;
         mplayer.resume = true;
      }
      mplayer.flow();
      mplayer.refresh();
   });

/** Looped scripts */
const loops = [
   (event?) => {
      if (!mplayer.seek || (!mplayer.volume && !ui.player.duration)) return false;
      let rect1 = ui.fill.getBoundingClientRect();
      let rect2 = ui.rail.getBoundingClientRect();
      let cursor = event.clientX - rect1.left;
      let time = (ui.player.duration || 0) / (rect2.width / cursor);
      cursor = cursor < 0 ? 0 : cursor > rect2.width ? rect1.width : cursor;
      if (mplayer.volume) ui.player.volume = 1 / (rect2.width / cursor);
      else ui.player.currentTime = !isNaN(time) && isFinite(time) ? time : 0;
      ui.fill.style.width = `${cursor}px`;
   },
   () => {
      if (mplayer.resume && ui.player.paused) ui.player.play();
      if (mplayer.seek || (ui.player.readyState > 2 && mplayer.ready)) {
         ui.play.innerText = mplayer.seek || ui.player.paused ? 'play_arrow' : 'pause';
         ui.play.style.animationName = 'none';
      } else if (mplayer.active || mplayer.resume) {
         ui.play.innerText = 'search';
         ui.play.style.animationName = 'buffering';
      }
      if (!mplayer.volume && !ui.player.duration) {
         ui.current.innerText = '00:00';
         ui.fill.style.width = '0';
      } else {
         let max = mplayer.volume ? 100 : ui.player.duration || 0;
         let rect = ui.rail.getBoundingClientRect();
         let current = mplayer.volume ? ui.player.volume * 100 : ui.player.currentTime;
         if (mplayer.volume) ui.current.innerText = `${Math.round(ui.player.volume * 100)}%`;
         else {
            ui.current.innerText = $.util.ms(ui.player.currentTime);
            ui.total.innerText = $.util.ms(ui.player.duration);
         }
         if (!mplayer.seek) ui.fill.style.width = `${rect.width / (max / current)}px`;
      }
   },
   () => {
      if (mplayer.volume) ui.buff.style.width = '0';
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

/** Basic triggers */
$(document).on({ mouseup: () => mpc.seek(false), mousemove: loops[0] });
$('#ctrl-prev').on({ click: () => mnav.prev() });
$('#ctrl-play').on({ click: () => mpc.play() });
$('#ctrl-next').on({ click: () => mnav.next() });
$('#ctrl-volume').on({ click: () => mpc.volume() });
$('#ctrl-repeat').on({ click: () => mpc.repeat() });
$('#ctrl-shuffle').on({ click: () => mpc.shuffle() });

/** Scrub triggers */
$('#rail').on({
   mousedown: e => (mpc.seek(true), loops[0](e)),
   mouseenter: () => ui.fill.setAttribute('class', 'hover'),
   mouseleave: () => ui.fill.removeAttribute('class')
});

/** Cover flow triggers */
$('#flow-left, #flow-far-left').on({
   mousedown: () => {
      if (++mnav.serial[0] === mnav.data['index'].length) {
         mnav.serial[0] = 0;
      }
      mnav.serial[1] = 0;
      mplayer.flow('prev');
      mplayer.refresh();
   }
});
$('#flow-right, #flow-far-right').on({
   mousedown: () => {
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
   mouseenter: () => {
      if (mplayer.group.members.length === 1) return;
      else $('#flow-center > img').css({ filter: 'blur(1px)' });
   },
   mouseleave: () => $('#flow-center > img').css({ filter: null })
});

/** Video triggers */
$('video').on({
   ended: () => {
      if (mplayer.repeat === 'track') mpc.play(true);
      else {
         mplayer.ready = false;
         mnav.next();
         mplayer.resume = true;
      }
   },
   canplay: () => {
      mplayer.ready = true;
      if (mplayer.resume) mpc.play(true);
   },
   loadstart: () => {
      mplayer.ready = false;
      mpc.play(true);
   }
});

/** Media key triggers */
if ('mediaSession' in navigator) {
   navigator.mediaSession.setActionHandler('previoustrack', mnav.prev);
   navigator.mediaSession.setActionHandler('nexttrack', mnav.next);
   navigator.mediaSession.setActionHandler('play', () => mpc.play(true));
   navigator.mediaSession.setActionHandler('pause', () => mpc.play(false));
   navigator.mediaSession.setActionHandler('stop', () => {
      ui.player.currentTime = 0;
      mpc.play(false);
   });
}

/** Misc triggers */
window.addEventListener('resize', () => (loops[1](), loops[2](), loops[3]()));
document.body.onkeyup = event => {
   if (event.keyCode === 32) mpc.play(!mplayer.active);
};
/** Timers */
setInterval(loops[1], 50);
setInterval(loops[2], 500);
setInterval(loops[3], 100);

/** Defaults */
ui.player.volume = 0.75;

/** Garb shit */
//@ts-expect-error
const position = nav.offsetTop;
window.addEventListener('scroll', () => {
   if (window.pageYOffset > position) {
      //@ts-expect-error
      nav.classList.add('sticky');
   } else {
      //@ts-expect-error
      nav.classList.remove('sticky');
   }
});

// pagination (yeeto peeto)
$('.nav').on({
   click: event => {
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
setInterval(() => {
   if (window.innerWidth < 768) {
      console.log('wefewf');
      // hide album grid
      $('#content').css({ display: 'none' });
      $('#small-screen').css({ display: 'inline-block' });
   } else {
      // show album grid
      $('#content').css({ display: 'grid' });
      $('#small-screen').css({ display: 'none' });
   }
}, 100);
