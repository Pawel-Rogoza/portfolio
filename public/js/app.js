/* Portfolio — Paweł Rogoża
   Vanilla-JS port of the interactive terminal from the Claude Design file
   "Portfolio - Desktop (Live)". No dependencies, no build step. */

(function () {
  'use strict';

  // ---------------------------------------------------------------- i18n
  var STRINGS = {
    en: {
      heroH1: "Hi, I'm Paweł Rogoża.",
      heroSub: "I work in Linux administration and SysOps. My main project, Harbor, is a self-hosted VPS where I run and document a real server stack — web, mail, databases, monitoring, backups and automation.",
      navAbout: 'About', navHarbor: 'Harbor', navProjects: 'Projects', navSkills: 'Skills', navContact: 'Contact',
      ctaHarbor: 'Open Harbor', ctaContact: 'Get in touch',
    },
    pl: {
      heroH1: 'Cześć, jestem Paweł Rogoża.',
      heroSub: 'Zajmuję się administracją Linuksem i SysOps. Mój główny projekt, Harbor, to samodzielnie hostowany VPS, na którym uruchamiam i dokumentuję realny stack serwerowy — web, pocztę, bazy danych, monitoring, kopie zapasowe i automatyzację.',
      navAbout: 'O mnie', navHarbor: 'Harbor', navProjects: 'Projekty', navSkills: 'Umiejętności', navContact: 'Kontakt',
      ctaHarbor: 'Otwórz Harbor', ctaContact: 'Kontakt',
    },
  };

  var lang = 'en';
  try { lang = localStorage.getItem('portfolio-lang') || 'en'; } catch (e) {}
  if (lang !== 'en' && lang !== 'pl') lang = 'en';

  function applyLang() {
    var L = STRINGS[lang];
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (L[key]) el.textContent = L[key];
    });
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-pl').classList.toggle('active', lang === 'pl');
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem('portfolio-lang', l); } catch (e) {}
    applyLang();
  }
  document.getElementById('lang-en').addEventListener('click', function () { setLang('en'); });
  document.getElementById('lang-pl').addEventListener('click', function () { setLang('pl'); });
  applyLang();

  // ---------------------------------------------------------------- terminal state
  var state = {
    input: '',
    screen: null,      // null → welcome; otherwise { raw, cmd, arg, suggestions }
    log: [],           // every entered command, for ↑/↓ recall
    logIdx: 0,
  };

  var output = document.getElementById('term-output');
  var input = document.getElementById('term-input');
  var terminal = document.getElementById('terminal');

  // ---------------------------------------------------------------- command resolution
  function resolve(raw) {
    var s = raw.trim().replace(/\s+/g, ' ').toLowerCase();
    if (!s) return { cmd: 'empty' };
    s = s.replace(/^(open|show|view|read|go to|goto)\s+/, '');
    var map = {
      'whoami': 'whoami',
      'about': 'about', 'about.md': 'about', 'cat about.md': 'about', 'cat about': 'about',
      'projects': 'projects', 'project': 'projects', 'cd projects': 'projects', 'cd projects/': 'projects', 'projects/': 'projects',
      'ls projects': 'lsprojects', 'ls projects/': 'lsprojects',
      'harbor': 'harbor', 'harbor.md': 'harbor', 'cat harbor.md': 'harbor', 'cat projects/harbor.md': 'harbor', 'cat projects/harbor': 'harbor', 'projects/harbor.md': 'harbor',
      'skills': 'skills', 'skills.txt': 'skills', 'cat skills.txt': 'skills',
      'education': 'education', 'education.txt': 'education', 'cat education.txt': 'education',
      'goals': 'goals', 'goals.txt': 'goals', 'cat goals.txt': 'goals',
      'contact': 'contact', 'contact.txt': 'contact', 'cat contact.txt': 'contact',
      'help': 'help', '?': 'help', 'commands': 'help', 'man': 'help',
      'clear': 'clear', 'cls': 'clear',
      'ls': 'ls', 'ls -l': 'ls', 'ls ~': 'ls', 'ls /home/pawel': 'ls', 'dir': 'ls', 'cd': 'ls', 'cd ~': 'ls', 'cd ..': 'ls',
      'tree': 'tree',
      'uptime': 'uptime',
      'htop': 'htop', 'top': 'htop', 'ps': 'htop',
    };
    if (map[s]) return { cmd: map[s] };
    var m = s.match(/^cat\s+(.+)$/);
    if (m) {
      var f = m[1].replace('projects/', '').trim();
      var fm = { 'about.md': 'about', 'about': 'about', 'skills.txt': 'skills', 'education.txt': 'education', 'goals.txt': 'goals', 'contact.txt': 'contact', 'harbor.md': 'harbor' };
      if (fm[f]) return { cmd: fm[f] };
      return { cmd: 'nofile', arg: m[1] };
    }
    if (/^ls\s+/.test(s)) return { cmd: 'ls' };
    return { cmd: 'unknown', suggestions: suggest(s) };
  }

  function suggest(s) {
    var all = ['about', 'projects', 'harbor', 'skills', 'education', 'goals', 'contact', 'help'];
    var scored = all.map(function (c) {
      var sc = 0;
      if (c[0] === s[0]) sc += 1;
      if (c.indexOf(s) !== -1 || s.indexOf(c) !== -1) sc += 3;
      var seen = {};
      for (var i = 0; i < s.length; i++) {
        var ch = s[i];
        if (!seen[ch]) { seen[ch] = true; if (c.indexOf(ch) !== -1) sc += 0.2; }
      }
      return { c: c, sc: sc };
    }).sort(function (a, b) { return b.sc - a.sc; });
    var top = scored.filter(function (x) { return x.sc > 0.6; }).slice(0, 3).map(function (x) { return x.c; });
    if (top.length === 0) top = ['projects', 'skills', 'contact'];
    return top;
  }

  // ---------------------------------------------------------------- rendering helpers
  function line(text, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'term-line' + (opts.cls ? ' ' + opts.cls : '');
    if (opts.mt) el.style.marginTop = opts.mt + 'px';
    el.textContent = text;
    return el;
  }
  function frag(lines) {
    var f = document.createDocumentFragment();
    lines.forEach(function (l) { f.appendChild(l); });
    return f;
  }

  function renderWelcome() {
    return frag([
      line('Booting portfolio shell…', { cls: 't-dim' }),
      line('Logged in as visitor', { cls: 't-dim' }),
      line('Hi — type a command or click a chip.', { mt: 8 }),
      line('Try: harbor · skills · help', { cls: 't-dim' }),
    ]);
  }

  function renderOutput(e) {
    switch (e.cmd) {
      case 'empty': return null;
      case 'whoami':
        return frag([line('pawel — Linux administration & SysOps, building toward infrastructure engineering.')]);
      case 'about':
        return frag([
          line('Paweł Rogoża', { cls: 't-bold' }),
          line('Linux administration & SysOps.', { cls: 't-dim', mt: 2 }),
          line('Building toward Cloud / DevOps / Platform Engineering.', { cls: 't-dim' }),
          line('BSc Informatics & Econometrics — University of Gdańsk (2019–2022).', { cls: 't-dim', mt: 6 }),
          line('Main project: Harbor, a self-hosted VPS I run and document.', { mt: 6 }),
        ]);
      case 'projects':
        return frag([
          line('projects/', { cls: 't-blue t-bold' }),
          line('harbor.md   active · self-hosted VPS / Linux server stack', { mt: 4 }),
          line('More will appear here as I build and document them.', { cls: 't-dim', mt: 6 }),
          line("→ type 'harbor' to open it.", { cls: 't-dim' }),
        ]);
      case 'lsprojects':
        return frag([
          line('harbor.md'),
          line("→ 'harbor' or 'cat projects/harbor.md' to open.", { cls: 't-dim', mt: 4 }),
        ]);
      case 'harbor':
        return frag([
          line('# Harbor', { cls: 't-green t-bold' }),
          line('Self-hosted VPS for practical Linux administration.', { mt: 4 }),
          line('A small hosting-like environment I run and document:', { mt: 6 }),
          line('  • web server          • monitoring', { cls: 't-dim', mt: 4 }),
          line('  • mail stack          • backups', { cls: 't-dim' }),
          line('  • databases           • user isolation', { cls: 't-dim' }),
          line('  • basic automation    • security hardening', { cls: 't-dim' }),
          line('→ open full write-up: projects/harbor  (dedicated page)', { cls: 't-green', mt: 6 }),
        ]);
      case 'skills':
        return frag([
          line('skills.txt', { cls: 't-blue t-bold' }),
          line('Linux      shell · users & permissions · systemd · networking', { mt: 4 }),
          line('Servers    web hosting · mail stack · databases'),
          line('Ops        monitoring · backups · automation  (in progress)'),
          line('Security   hardening · user isolation  (learning)'),
          line('Next       Cloud / DevOps / Platform Engineering', { cls: 't-amber' }),
          line("→ try 'htop' for a live view.", { cls: 't-dim', mt: 6 }),
        ]);
      case 'htop': {
        var rows = [
          [101, 'Linux', 'actively learning', 't-green'],
          [102, 'Harbor', 'active project', 't-green'],
          [103, 'Web hosting', 'in progress', 't-amber'],
          [104, 'Mail stack', 'in progress', 't-amber'],
          [105, 'Monitoring', 'building', 't-amber'],
          [106, 'Automation', 'planned', 't-dim'],
          [107, 'Cloud / DevOps', 'next career stage', 't-blue'],
        ];
        var lines = [line('PID   AREA              STATUS', { cls: 't-dim' })];
        rows.forEach(function (r) {
          lines.push(line(String(r[0]).padEnd(6) + String(r[1]).padEnd(18) + r[2], { cls: r[3] }));
        });
        return frag(lines);
      }
      case 'education':
        return frag([
          line('education.txt', { cls: 't-blue t-bold' }),
          line('Bachelor of Science', { mt: 4 }),
          line('Informatics & Econometrics'),
          line('University of Gdańsk · 2019–2022', { cls: 't-dim' }),
        ]);
      case 'goals':
        return frag([
          line('goals.txt', { cls: 't-blue t-bold' }),
          line('now    →  Linux administration / SysOps', { cls: 't-green', mt: 4 }),
          line('next   →  deepen automation, monitoring, infrastructure', { cls: 't-amber' }),
          line('later  →  Cloud / DevOps / Platform Engineering', { cls: 't-blue' }),
          line('Honest, incremental, hands-on.', { cls: 't-dim', mt: 6 }),
        ]);
      case 'contact':
        return frag([
          line('contact.txt', { cls: 't-blue t-bold' }),
          line('GitHub     github.com/pawel-rogoza', { mt: 4 }),
          line('Email      pawel.rogoza@proton.me'),
          line('LinkedIn   linkedin.com/in/pawel-rogoza'),
        ]);
      case 'uptime':
        return frag([line('27 years online — currently building toward Linux / SysOps.')]);
      case 'ls':
        return frag([line('about.md   projects/   skills.txt   education.txt   goals.txt   contact.txt')]);
      case 'tree':
        return frag([
          line('/home/pawel'),
          line('├── about.md', { cls: 't-dim' }),
          line('├── projects', { cls: 't-blue' }),
          line('│   └── harbor.md', { cls: 't-dim' }),
          line('├── skills.txt', { cls: 't-dim' }),
          line('├── education.txt', { cls: 't-dim' }),
          line('├── goals.txt', { cls: 't-dim' }),
          line('└── contact.txt', { cls: 't-dim' }),
        ]);
      case 'help':
        return frag([
          line('Commands', { cls: 't-bold' }),
          line('whoami      short intro          ls          list files', { cls: 't-dim', mt: 4 }),
          line('about       about me             tree        show file tree', { cls: 't-dim' }),
          line('projects    list projects        cat <file>  open a file', { cls: 't-dim' }),
          line('harbor      open Harbor          htop        skills as processes', { cls: 't-dim' }),
          line('skills      tech skill map       uptime      a small note', { cls: 't-dim' }),
          line('education   background           clear       clear the screen', { cls: 't-dim' }),
          line('goals       career direction', { cls: 't-dim' }),
          line('contact     links & email', { cls: 't-dim' }),
          line('Tip: click files in the tree or the chips below — or use the top menu.', { cls: 't-green', mt: 6 }),
        ]);
      case 'nofile':
        return frag([
          line('cat: ' + e.arg + ': no such file', { cls: 't-amber' }),
          line("Try 'tree' to see available files, or 'help'.", { cls: 't-dim', mt: 4 }),
        ]);
      case 'unknown': {
        var sug = e.suggestions || ['projects', 'skills', 'contact'];
        var wrap = document.createElement('div');
        wrap.className = 'term-line t-dim';
        wrap.style.marginTop = '4px';
        wrap.appendChild(document.createTextNode('Did you mean: '));
        sug.forEach(function (sg) {
          var a = document.createElement('span');
          a.className = 'term-suggestion';
          a.textContent = sg;
          a.addEventListener('click', function () { run(sg); });
          wrap.appendChild(a);
        });
        wrap.appendChild(document.createTextNode('?'));
        return frag([
          line("I don't know this one yet.", { cls: 't-amber' }),
          wrap,
          line("Type 'help' to see everything.", { cls: 't-dim', mt: 4 }),
        ]);
      }
      default: return null;
    }
  }

  function render() {
    output.textContent = '';
    var screen = document.createElement('div');
    screen.className = 'term-screen';
    if (!state.screen) {
      screen.appendChild(renderWelcome());
    } else {
      var prompt = document.createElement('div');
      prompt.className = 'term-prompt-line';
      var u = document.createElement('span'); u.className = 't-green'; u.textContent = 'pawel@portfolio';
      var c = document.createElement('span'); c.className = 't-dim'; c.textContent = ':~$ ';
      var r = document.createElement('span'); r.textContent = state.screen.raw;
      prompt.appendChild(u); prompt.appendChild(c); prompt.appendChild(r);
      screen.appendChild(prompt);
      var out = renderOutput(state.screen);
      if (out) screen.appendChild(out);
    }
    output.appendChild(screen);
    output.scrollTop = 0;
  }

  // ---------------------------------------------------------------- run / recall
  function run(raw) {
    if (!raw || !raw.trim()) return;
    var r = resolve(raw);
    state.log.push(raw);                 // remember every command for ↑/↓ recall
    state.logIdx = state.log.length;
    // Clear-on-command: each command replaces the screen with just its result.
    state.screen = (r.cmd === 'clear') ? null : Object.assign({ raw: raw }, r);
    input.value = '';
    render();
  }

  // ↑/↓ walk back and forth through previously entered commands.
  function recall(dir) {
    if (!state.log.length) return;
    var idx = state.logIdx + dir;
    if (idx < 0) idx = 0;
    if (idx >= state.log.length) {
      state.logIdx = state.log.length;
      input.value = '';
      return;
    }
    state.logIdx = idx;
    input.value = state.log[idx];
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { run(input.value); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); recall(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); recall(1); }
  });

  // clicking the output area focuses the input (unless the user is selecting text)
  output.addEventListener('click', function () {
    var sel = window.getSelection();
    if (sel && sel.toString()) return;
    input.focus();
  });

  // ---------------------------------------------------------------- command triggers
  // Everything with [data-cmd] — nav links, CTAs, path segments, fs strip, chips —
  // runs its command in the terminal. Triggers outside the terminal also bring it
  // into view (matters on mobile, where the terminal sits below the hero text).
  document.querySelectorAll('[data-cmd]').forEach(function (el) {
    el.addEventListener('click', function () {
      run(el.getAttribute('data-cmd'));
      if (!terminal.contains(el)) {
        terminal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });

  // ---------------------------------------------------------------- expand / minimize
  var expandBtn = document.getElementById('btn-expand');
  var expandIcon = document.getElementById('expand-icon');
  var expandLabel = document.getElementById('expand-label');

  function setExpanded(on) {
    terminal.classList.toggle('expanded', on);
    document.body.classList.toggle('term-expanded', on);
    expandIcon.textContent = on ? '⤡' : '⤢';
    expandLabel.textContent = on ? 'minimize' : 'expand';
  }
  expandBtn.addEventListener('click', function () {
    setExpanded(!terminal.classList.contains('expanded'));
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && terminal.classList.contains('expanded')) setExpanded(false);
  });

  // ---------------------------------------------------------------- boot
  render();
})();
