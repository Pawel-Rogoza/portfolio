/* Portfolio — Paweł Rogoża
   Vanilla-JS terminal from the Claude Design file "Portfolio - Desktop (Live)".
   No dependencies, no build step.

   Layout of this file:
     1. storage + small helpers
     2. i18n dictionaries (page chrome + terminal content)
     3. theme
     4. virtual filesystem
     5. output DSL (DOM builders)
     6. command registry
     7. the shell (scrollback, history, completion, keys)
     8. page wiring + boot                                              */

(function () {
  'use strict';

  /* =====================================================================
     1. storage + helpers
     ===================================================================== */

  var KEY = {
    lang: 'portfolio-lang',
    theme: 'portfolio-theme',
    history: 'portfolio-history',
  };

  function load(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }
  function loadJSON(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return Array.isArray(v) ? v : fallback;
    } catch (e) { return fallback; }
  }

  var reducedMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  var LINKS = {
    github: 'https://github.com/pawel-rogoza',
    linkedin: 'https://www.linkedin.com/in/pawel-rogoza',
    email: 'mailto:pawel.rogoza@proton.me',
  };
  var EMAIL = 'pawel.rogoza@proton.me';

  var startedAt = Date.now();

  /* =====================================================================
     2. i18n
     ===================================================================== */

  /* page chrome — keyed by [data-i18n] in index.html */
  var PAGE = {
    en: {
      title: 'Paweł Rogoża — Linux Administration & SysOps',
      skipLink: 'Skip to the terminal',
      heroH1: "Hi, I'm Paweł Rogoża.",
      heroSub: 'I work in Linux administration and SysOps. My main project, Harbor, is a self-hosted VPS where I run and document a real server stack — web, mail, databases, monitoring, backups and automation.',
      navAbout: 'About', navHarbor: 'Harbor', navProjects: 'Projects', navSkills: 'Skills', navContact: 'Contact',
      ctaHarbor: 'Open Harbor', ctaContact: 'Get in touch',
      metaRoleLabel: 'Role', metaRoleValue: 'Linux admin · SysOps',
      metaFocusLabel: 'Focus', metaFocusValue: 'Harbor — self-hosted VPS',
      metaNextLabel: 'Heading for', metaNextValue: 'Cloud / DevOps',
      metaBasedLabel: 'Based in', metaBasedValue: 'Gdańsk, Poland',
      expand: 'expand', minimize: 'minimize',
      inputLabel: 'Terminal command',
      inputPlaceholder: 'type a command…',
      themeToggle: 'Switch between light and dark theme',
      hintTab: 'completes', hintHistory: 'history', hintClear: 'clear',
      footBuilt: 'Static site — HTML, CSS and vanilla JS. No build step, no dependencies.',
    },
    pl: {
      title: 'Paweł Rogoża — administracja Linuksem i SysOps',
      skipLink: 'Przejdź do terminala',
      heroH1: 'Cześć, jestem Paweł Rogoża.',
      heroSub: 'Zajmuję się administracją Linuksem i SysOps. Mój główny projekt, Harbor, to samodzielnie hostowany VPS, na którym uruchamiam i dokumentuję realny stack serwerowy — web, pocztę, bazy danych, monitoring, kopie zapasowe i automatyzację.',
      navAbout: 'O mnie', navHarbor: 'Harbor', navProjects: 'Projekty', navSkills: 'Umiejętności', navContact: 'Kontakt',
      ctaHarbor: 'Otwórz Harbor', ctaContact: 'Kontakt',
      metaRoleLabel: 'Rola', metaRoleValue: 'Administracja Linuksem · SysOps',
      metaFocusLabel: 'Skupienie', metaFocusValue: 'Harbor — własny VPS',
      metaNextLabel: 'Kierunek', metaNextValue: 'Cloud / DevOps',
      metaBasedLabel: 'Miejsce', metaBasedValue: 'Gdańsk, Polska',
      expand: 'pełny ekran', minimize: 'zmniejsz',
      inputLabel: 'Komenda terminala',
      inputPlaceholder: 'wpisz komendę…',
      themeToggle: 'Przełącz motyw jasny / ciemny',
      hintTab: 'uzupełnia', hintHistory: 'historia', hintClear: 'czyści',
      footBuilt: 'Strona statyczna — HTML, CSS i czysty JS. Bez build stepu i bez zależności.',
    },
  };

  /* terminal content */
  var TERM = {
    en: {
      boot: ['portfolio-shell 1.0 — booting…', 'mounting /home/pawel … ok', 'session opened for visitor … ok'],
      welcomeHi: 'Hi — type a command, hit Tab, or click a chip.',
      welcomeTry: 'Try: harbor · skills · htop · neofetch · help',

      whoami: 'pawel — Linux administration & SysOps, building toward infrastructure engineering.',

      aboutRole: 'Linux administration & SysOps.',
      aboutHeading: 'Building toward Cloud / DevOps / Platform Engineering.',
      aboutEdu: 'BSc Informatics & Econometrics — University of Gdańsk (2019–2022).',
      aboutMain: 'Main project: Harbor, a self-hosted VPS I run and document.',

      projectsHarbor: 'active · self-hosted VPS / Linux server stack',
      projectsMore: 'More will appear here as I build and document them.',
      projectsOpen: "→ type 'harbor' to open it.",

      harborLead: 'Self-hosted VPS for practical Linux administration.',
      harborIntro: 'A small hosting-like environment I run and document:',
      harborItems: [
        ['web server', 'monitoring'],
        ['mail stack', 'backups'],
        ['databases', 'user isolation'],
        ['basic automation', 'security hardening'],
      ],
      harborWhy: 'Why it exists: real services, real failures, real fixes — the parts a tutorial skips.',
      harborNote: '→ a dedicated write-up lives at projects/harbor.md',

      skillsRows: [
        ['Linux', 'shell · users & permissions · systemd · networking'],
        ['Servers', 'web hosting · mail stack · databases'],
        ['Ops', 'monitoring · backups · automation  (in progress)'],
        ['Security', 'hardening · user isolation  (learning)'],
        ['Next', 'Cloud / DevOps / Platform Engineering'],
      ],
      skillsHint: "→ try 'htop' for the same thing as processes.",

      htopHead: ['PID', 'AREA', 'LOAD', 'STATUS'],
      htopRows: [
        [101, 'linux', 'actively learning', 't-green', 78],
        [102, 'harbor', 'active project', 't-green', 86],
        [103, 'web-hosting', 'in progress', 't-amber', 62],
        [104, 'mail-stack', 'in progress', 't-amber', 55],
        [105, 'monitoring', 'building', 't-amber', 48],
        [106, 'automation', 'planned', 't-dim', 24],
        [107, 'cloud-devops', 'next career stage', 't-blue', 35],
      ],
      htopFoot: 'Load is a metaphor, not a metric — it is where my attention goes.',

      eduDegree: 'Bachelor of Science',
      eduField: 'Informatics & Econometrics',
      eduSchool: 'University of Gdańsk · 2019–2022',

      goalsNow: 'now    →  Linux administration / SysOps',
      goalsNext: 'next   →  deepen automation, monitoring, infrastructure',
      goalsLater: 'later  →  Cloud / DevOps / Platform Engineering',
      goalsNote: 'Honest, incremental, hands-on.',

      contactLead: 'The fastest way to reach me is email.',
      contactHint: "→ 'open github' opens a link in a new tab.",

      uptime: '27 years online — currently building toward Linux / SysOps.',

      helpTitle: 'Commands',
      helpTip: 'Tab completes · ↑ / ↓ recalls · Ctrl+L clears · Esc leaves fullscreen.',
      helpMore: "→ 'man <command>' explains a single command.",

      lsEmpty: 'directory is empty',
      grepUsage: 'usage: grep <pattern> [path]',
      grepNone: 'no matches',
      grepIn: 'searched',
      findUsage: 'usage: find <name>',
      findNone: 'nothing found',
      manUsage: 'usage: man <command>',
      manNo: 'no manual entry for',
      manUsageLabel: 'usage',
      echoUsage: 'usage: echo <text>',
      historyEmpty: 'history is empty',
      openUsage: 'usage: open <github|linkedin|email>',
      openUnknown: 'nothing to open for',
      openDone: 'opening',
      themeUsage: 'usage: theme <dark|light|auto>',
      themeNow: 'theme:',
      langUsage: 'usage: lang <en|pl>',
      langNow: 'language:',
      cdNoDir: 'no such directory:',
      cdNotDir: 'not a directory:',
      catNoFile: 'no such file:',
      catIsDir: 'is a directory:',
      catUsage: 'usage: cat <file>',
      unknownCmd: "I don't know this one yet.",
      unknownDid: 'Did you mean: ',
      unknownHelp: "Type 'help' to see everything.",
      sudo: 'nice try — this shell has no root, only a résumé.',
      exit: "there's no way out, but 'clear' gives you a fresh screen.",
      bannerSub: 'Linux administration & SysOps · portfolio shell',

      neoRows: [
        ['host', 'portfolio.pawelrogoza.pl'],
        ['shell', 'portfolio-shell 1.0'],
        ['role', 'Linux administration & SysOps'],
        ['project', 'Harbor — self-hosted VPS'],
        ['stack', 'web · mail · db · monitoring · backups'],
        ['next', 'Cloud / DevOps / Platform Engineering'],
      ],
      neoTheme: 'theme',
      neoLang: 'lang',
      neoUptime: 'session',
    },

    pl: {
      boot: ['portfolio-shell 1.0 — uruchamianie…', 'montowanie /home/pawel … ok', 'sesja otwarta dla visitor … ok'],
      welcomeHi: 'Cześć — wpisz komendę, użyj Tab albo kliknij chip.',
      welcomeTry: 'Spróbuj: harbor · skills · htop · neofetch · help',

      whoami: 'pawel — administracja Linuksem i SysOps, w drodze do inżynierii infrastruktury.',

      aboutRole: 'Administracja Linuksem i SysOps.',
      aboutHeading: 'Kierunek: Cloud / DevOps / Platform Engineering.',
      aboutEdu: 'Licencjat: Informatyka i Ekonometria — Uniwersytet Gdański (2019–2022).',
      aboutMain: 'Główny projekt: Harbor — własny VPS, który utrzymuję i dokumentuję.',

      projectsHarbor: 'aktywny · własny VPS / linuksowy stack serwerowy',
      projectsMore: 'Kolejne pojawią się tu w miarę budowania i dokumentowania.',
      projectsOpen: "→ wpisz 'harbor', żeby otworzyć.",

      harborLead: 'Własny VPS do praktycznej administracji Linuksem.',
      harborIntro: 'Małe środowisko hostingowe, które utrzymuję i dokumentuję:',
      harborItems: [
        ['serwer www', 'monitoring'],
        ['stack pocztowy', 'kopie zapasowe'],
        ['bazy danych', 'izolacja użytkowników'],
        ['podstawowa automatyzacja', 'utwardzanie bezpieczeństwa'],
      ],
      harborWhy: 'Po co: prawdziwe usługi, prawdziwe awarie, prawdziwe naprawy — to, co tutorial pomija.',
      harborNote: '→ pełny opis znajdziesz w projects/harbor.md',

      skillsRows: [
        ['Linux', 'shell · użytkownicy i uprawnienia · systemd · sieci'],
        ['Serwery', 'hosting www · stack pocztowy · bazy danych'],
        ['Ops', 'monitoring · backupy · automatyzacja  (w toku)'],
        ['Bezpieczeństwo', 'hardening · izolacja użytkowników  (uczę się)'],
        ['Dalej', 'Cloud / DevOps / Platform Engineering'],
      ],
      skillsHint: "→ wpisz 'htop', żeby zobaczyć to samo jako procesy.",

      htopHead: ['PID', 'OBSZAR', 'OBCIĄŻ.', 'STATUS'],
      htopRows: [
        [101, 'linux', 'uczę się na bieżąco', 't-green', 78],
        [102, 'harbor', 'aktywny projekt', 't-green', 86],
        [103, 'hosting-www', 'w toku', 't-amber', 62],
        [104, 'stack-pocztowy', 'w toku', 't-amber', 55],
        [105, 'monitoring', 'buduję', 't-amber', 48],
        [106, 'automatyzacja', 'planowane', 't-dim', 24],
        [107, 'cloud-devops', 'następny etap', 't-blue', 35],
      ],
      htopFoot: 'Obciążenie to metafora, nie metryka — pokazuje, gdzie idzie moja uwaga.',

      eduDegree: 'Licencjat',
      eduField: 'Informatyka i Ekonometria',
      eduSchool: 'Uniwersytet Gdański · 2019–2022',

      goalsNow: 'teraz  →  administracja Linuksem / SysOps',
      goalsNext: 'dalej  →  automatyzacja, monitoring, infrastruktura',
      goalsLater: 'potem  →  Cloud / DevOps / Platform Engineering',
      goalsNote: 'Uczciwie, krok po kroku, w praktyce.',

      contactLead: 'Najszybciej złapiesz mnie mailem.',
      contactHint: "→ 'open github' otwiera link w nowej karcie.",

      uptime: '27 lat online — obecnie kurs na Linuksa / SysOps.',

      helpTitle: 'Komendy',
      helpTip: 'Tab uzupełnia · ↑ / ↓ historia · Ctrl+L czyści · Esc wychodzi z pełnego ekranu.',
      helpMore: "→ 'man <komenda>' opisuje pojedynczą komendę.",

      lsEmpty: 'katalog jest pusty',
      grepUsage: 'użycie: grep <wzorzec> [ścieżka]',
      grepNone: 'brak dopasowań',
      grepIn: 'przeszukano',
      findUsage: 'użycie: find <nazwa>',
      findNone: 'nic nie znaleziono',
      manUsage: 'użycie: man <komenda>',
      manNo: 'brak opisu dla',
      manUsageLabel: 'użycie',
      echoUsage: 'użycie: echo <tekst>',
      historyEmpty: 'historia jest pusta',
      openUsage: 'użycie: open <github|linkedin|email>',
      openUnknown: 'nie wiem, co otworzyć dla',
      openDone: 'otwieram',
      themeUsage: 'użycie: theme <dark|light|auto>',
      themeNow: 'motyw:',
      langUsage: 'użycie: lang <en|pl>',
      langNow: 'język:',
      cdNoDir: 'nie ma takiego katalogu:',
      cdNotDir: 'to nie jest katalog:',
      catNoFile: 'nie ma takiego pliku:',
      catIsDir: 'to katalog:',
      catUsage: 'użycie: cat <plik>',
      unknownCmd: 'Tej jeszcze nie znam.',
      unknownDid: 'Czy chodziło o: ',
      unknownHelp: "Wpisz 'help', żeby zobaczyć wszystko.",
      sudo: 'dobra próba — ta powłoka nie ma roota, tylko CV.',
      exit: "stąd nie ma wyjścia, ale 'clear' daje czysty ekran.",
      bannerSub: 'administracja Linuksem i SysOps · powłoka portfolio',

      neoRows: [
        ['host', 'portfolio.pawelrogoza.pl'],
        ['powłoka', 'portfolio-shell 1.0'],
        ['rola', 'administracja Linuksem i SysOps'],
        ['projekt', 'Harbor — własny VPS'],
        ['stack', 'web · poczta · bazy · monitoring · backupy'],
        ['dalej', 'Cloud / DevOps / Platform Engineering'],
      ],
      neoTheme: 'motyw',
      neoLang: 'język',
      neoUptime: 'sesja',
    },
  };

  /* one-line description per command, used by both `help` and `man` */
  var DESC = {
    en: {
      whoami: 'short intro', about: 'about me', projects: 'list projects',
      harbor: 'open Harbor', skills: 'tech skill map', htop: 'skills as processes',
      education: 'background', goals: 'career direction', contact: 'links & email',
      ls: 'list files', cd: 'change directory', pwd: 'print working directory',
      tree: 'show the file tree', cat: 'print a file', grep: 'search inside files',
      find: 'find a file by name', open: 'open an external link',
      neofetch: 'system card', banner: 'ascii banner', uptime: 'a small note',
      date: 'current date and time', echo: 'print text back', history: 'commands you ran',
      man: 'explain a command', theme: 'dark / light / auto', lang: 'switch EN / PL',
      clear: 'clear the screen', help: 'this list',
    },
    pl: {
      whoami: 'krótkie intro', about: 'o mnie', projects: 'lista projektów',
      harbor: 'otwórz Harbor', skills: 'mapa umiejętności', htop: 'umiejętności jako procesy',
      education: 'wykształcenie', goals: 'kierunek rozwoju', contact: 'linki i e-mail',
      ls: 'lista plików', cd: 'zmień katalog', pwd: 'pokaż bieżący katalog',
      tree: 'drzewo plików', cat: 'wypisz plik', grep: 'szukaj w plikach',
      find: 'znajdź plik po nazwie', open: 'otwórz link zewnętrzny',
      neofetch: 'wizytówka systemu', banner: 'baner ascii', uptime: 'drobna notka',
      date: 'aktualna data i godzina', echo: 'powtórz tekst', history: 'wpisane komendy',
      man: 'opis komendy', theme: 'ciemny / jasny / auto', lang: 'przełącz EN / PL',
      clear: 'wyczyść ekran', help: 'ta lista',
    },
  };

  var lang = load(KEY.lang, 'en');
  if (lang !== 'en' && lang !== 'pl') lang = 'en';

  function t(key) {
    var v = TERM[lang][key];
    return v === undefined ? TERM.en[key] : v;
  }
  function desc(name) {
    return (DESC[lang] && DESC[lang][name]) || DESC.en[name] || '';
  }

  /* =====================================================================
     3. theme
     ===================================================================== */

  var root = document.documentElement;
  var prefersDark = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : { matches: false, addEventListener: function () {} };

  function activeTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return prefersDark.matches ? 'dark' : 'light';
  }
  function setTheme(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    save(KEY.theme, mode);
  }
  if (load(KEY.theme, 'auto') === 'auto') root.removeAttribute('data-theme');

  /* =====================================================================
     4. virtual filesystem
     ===================================================================== */

  var HOME = '/home/pawel';

  /* Files carry the name of the renderer that prints them, so `cat about.md`
     and the `about` command cannot drift apart. */
  var TREE = {
    type: 'dir',
    children: {
      'about.md': { type: 'file', render: 'about' },
      'skills.txt': { type: 'file', render: 'skills' },
      'education.txt': { type: 'file', render: 'education' },
      'goals.txt': { type: 'file', render: 'goals' },
      'contact.txt': { type: 'file', render: 'contact' },
      'projects': {
        type: 'dir',
        children: {
          'harbor.md': { type: 'file', render: 'harbor' },
        },
      },
    },
  };

  var cwd = [];   // segments below HOME; [] === ~

  function nodeAt(segments) {
    var node = TREE;
    for (var i = 0; i < segments.length; i++) {
      if (node.type !== 'dir' || !node.children[segments[i]]) return null;
      node = node.children[segments[i]];
    }
    return node;
  }

  /* Resolves a user-typed path to { segments, node } or null when it escapes
     the tree. `node` is null when the path simply does not exist. */
  function resolvePath(raw) {
    var p = String(raw || '').trim();
    var segs;
    if (p === '' || p === '~' || p === HOME) return { segments: [], node: TREE };

    if (p.charAt(0) === '/' || p.indexOf('~/') === 0) {
      var abs = p.indexOf('~/') === 0 ? p.slice(2) : p;
      if (p.charAt(0) === '/') {
        if (abs.indexOf(HOME) !== 0) return null;          // outside the sandbox
        abs = abs.slice(HOME.length);
      }
      segs = [];
      abs.split('/').forEach(function (s) { if (s && s !== '.') segs.push(s); });
    } else {
      segs = cwd.slice();
      p.split('/').forEach(function (s) {
        if (!s || s === '.') return;
        if (s === '..') segs.pop();
        else segs.push(s);
      });
    }
    return { segments: segs, node: nodeAt(segs) };
  }

  function pathLabel(segments) {
    return segments.length ? '~/' + segments.join('/') : '~';
  }
  function absLabel(segments) {
    return segments.length ? HOME + '/' + segments.join('/') : HOME;
  }
  function childNames(node) {
    if (!node || node.type !== 'dir') return [];
    return Object.keys(node.children).sort(function (a, b) {
      var ad = node.children[a].type === 'dir', bd = node.children[b].type === 'dir';
      if (ad !== bd) return ad ? -1 : 1;                   // directories first
      return a.localeCompare(b);
    });
  }
  function walk(node, segments, visit) {
    childNames(node).forEach(function (name) {
      var child = node.children[name];
      var path = segments.concat([name]);
      visit(child, path);
      if (child.type === 'dir') walk(child, path, visit);
    });
  }

  /* =====================================================================
     5. output DSL
     ===================================================================== */

  /* opts.mt maps onto a .mt-<n> utility class rather than an inline style, so
     the deployed CSP can stay free of style-src 'unsafe-inline'.
     Allowed values live in style.css: 2, 4, 6, 8, 12. */
  function spacing(cls, mt) {
    return cls + (mt ? ' mt-' + mt : '');
  }
  function ln(text, opts) {
    opts = opts || {};
    var d = document.createElement('div');
    d.className = spacing('term-line' + (opts.cls ? ' ' + opts.cls : ''), opts.mt);
    if (text !== null && text !== undefined) d.textContent = text;
    return d;
  }
  function parts(nodes, opts) {
    var d = ln(null, opts);
    nodes.forEach(function (n) { d.appendChild(n); });
    return d;
  }
  function tx(text, cls) {
    var s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  }
  function link(text, href) {
    var a = document.createElement('a');
    a.className = 'term-link';
    a.href = href;
    a.textContent = text;
    if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function grid(rows, opts) {
    opts = opts || {};
    var g = document.createElement('div');
    g.className = spacing('term-grid' + (opts.cls ? ' ' + opts.cls : ''), opts.mt);
    rows.forEach(function (row) {
      var k = document.createElement('span');
      k.className = 'grid-k' + (opts.keyCls ? ' ' + opts.keyCls : '');
      k.textContent = row[0];
      var v = document.createElement('span');
      v.className = 'grid-v' + (opts.valCls ? ' ' + opts.valCls : '');
      if (row[1] instanceof Node) v.appendChild(row[1]);
      else v.textContent = row[1];
      g.appendChild(k); g.appendChild(v);
    });
    return g;
  }

  /* =====================================================================
     6. commands
     ===================================================================== */

  var ALIAS = {
    'cls': 'clear', 'top': 'htop', 'ps': 'htop', 'dir': 'ls', 'll': 'ls',
    'commands': 'help', '?': 'help', 'h': 'help', 'info': 'about', 'me': 'about',
    'project': 'projects', 'work': 'projects', 'edu': 'education', 'cv': 'about',
    'mail': 'contact', 'email': 'contact', 'links': 'contact', 'hire': 'contact',
    'motd': 'banner', 'logo': 'banner', 'fetch': 'neofetch',
    'language': 'lang', 'colour': 'theme', 'color': 'theme', 'dark': 'theme', 'light': 'theme',
    'quit': 'exit', 'logout': 'exit', 'q': 'exit', 'man': 'man', 'search': 'grep',
  };

  var ART = [
    '██████╗ ██████╗ ',
    '██╔══██╗██╔══██╗',
    '██████╔╝██████╔╝',
    '██╔═══╝ ██╔══██╗',
    '██║     ██║  ██║',
    '╚═╝     ╚═╝  ╚═╝',
  ];

  function art(cls) {
    var pre = document.createElement('div');
    pre.className = 'term-art' + (cls ? ' ' + cls : '');
    pre.textContent = ART.join('\n');
    return pre;
  }

  /* file renderers — also reachable as bare commands */
  var RENDER = {
    about: function () {
      return [
        ln('Paweł Rogoża', { cls: 't-bold' }),
        ln(t('aboutRole'), { cls: 't-dim', mt: 2 }),
        ln(t('aboutHeading'), { cls: 't-dim' }),
        ln(t('aboutEdu'), { cls: 't-dim', mt: 6 }),
        ln(t('aboutMain'), { mt: 6 }),
      ];
    },
    projects: function () {
      return [
        ln('projects/', { cls: 't-blue t-bold' }),
        grid([['harbor.md', t('projectsHarbor')]], { mt: 4, keyCls: 't-green' }),
        ln(t('projectsMore'), { cls: 't-dim', mt: 6 }),
        ln(t('projectsOpen'), { cls: 't-dim' }),
      ];
    },
    harbor: function () {
      var out = [
        ln('# Harbor', { cls: 't-green t-bold' }),
        ln(t('harborLead'), { mt: 4 }),
        ln(t('harborIntro'), { mt: 6 }),
      ];
      t('harborItems').forEach(function (pair, i) {
        out.push(grid([['• ' + pair[0], '• ' + pair[1]]], { cls: 'term-grid-even', mt: i === 0 ? 4 : 0, keyCls: 't-dim', valCls: 't-dim' }));
      });
      out.push(ln(t('harborWhy'), { cls: 't-dim', mt: 6 }));
      out.push(ln(t('harborNote'), { cls: 't-green', mt: 6 }));
      return out;
    },
    skills: function () {
      var g = grid(t('skillsRows'), { mt: 4, keyCls: 't-green' });
      /* the last row is the forward-looking one — mark it amber */
      var vals = g.querySelectorAll('.grid-v');
      if (vals.length) vals[vals.length - 1].classList.add('t-amber');
      return [
        ln('skills.txt', { cls: 't-blue t-bold' }),
        g,
        ln(t('skillsHint'), { cls: 't-dim', mt: 6 }),
      ];
    },
    education: function () {
      return [
        ln('education.txt', { cls: 't-blue t-bold' }),
        ln(t('eduDegree'), { mt: 4 }),
        ln(t('eduField')),
        ln(t('eduSchool'), { cls: 't-dim' }),
      ];
    },
    goals: function () {
      return [
        ln('goals.txt', { cls: 't-blue t-bold' }),
        ln(t('goalsNow'), { cls: 't-green', mt: 4 }),
        ln(t('goalsNext'), { cls: 't-amber' }),
        ln(t('goalsLater'), { cls: 't-blue' }),
        ln(t('goalsNote'), { cls: 't-dim', mt: 6 }),
      ];
    },
    contact: function () {
      return [
        ln('contact.txt', { cls: 't-blue t-bold' }),
        ln(t('contactLead'), { cls: 't-dim', mt: 2 }),
        grid([
          ['Email', link(EMAIL, LINKS.email)],
          ['GitHub', link('github.com/pawel-rogoza', LINKS.github)],
          ['LinkedIn', link('linkedin.com/in/pawel-rogoza', LINKS.linkedin)],
        ], { mt: 6, keyCls: 't-dim' }),
        ln(t('contactHint'), { cls: 't-dim', mt: 6 }),
      ];
    },
  };

  /* Plain text of a rendered file, one entry per visible line — grep matches
     against this. Key/value grids are one element holding many rows, so they
     are unpacked in pairs instead of collapsing into a single run-on line. */
  function fileText(renderName) {
    var lines = [];
    (RENDER[renderName] ? RENDER[renderName]() : []).forEach(function (node) {
      if (node.classList && node.classList.contains('term-grid')) {
        var cells = node.children;
        for (var i = 0; i + 1 < cells.length; i += 2) {
          lines.push(cells[i].textContent + '  ' + cells[i + 1].textContent);
        }
      } else {
        lines.push(node.textContent);
      }
    });
    return lines;
  }

  function treeLines(node, segments, prefix, out) {
    var names = childNames(node);
    names.forEach(function (name, i) {
      var last = i === names.length - 1;
      var child = node.children[name];
      var isDir = child.type === 'dir';
      out.push(ln(prefix + (last ? '└── ' : '├── ') + name + (isDir ? '/' : ''), {
        cls: isDir ? 't-blue' : 't-dim',
      }));
      if (isDir) treeLines(child, segments.concat([name]), prefix + (last ? '    ' : '│   '), out);
    });
    return out;
  }

  var COMMANDS = {
    /* --- content ---------------------------------------------------- */
    whoami: { run: function () { return [ln(t('whoami'))]; } },
    about: { run: RENDER.about },
    projects: { run: RENDER.projects },
    harbor: { run: RENDER.harbor },
    skills: { run: RENDER.skills },
    education: { run: RENDER.education },
    goals: { run: RENDER.goals },
    contact: { run: RENDER.contact },

    htop: {
      run: function () {
        var head = t('htopHead');
        var wrap = document.createElement('div');
        wrap.className = 'htop';

        /* header uses the same three-slot .meter layout so the columns line up */
        var header = document.createElement('div');
        header.className = 'meter meter-head';
        header.appendChild(tx(head[0].padEnd(5) + head[1].padEnd(15), 'meter-label'));
        header.appendChild(tx(head[2], 'meter-track'));
        header.appendChild(tx(head[3], 'meter-value t-dim'));
        wrap.appendChild(header);

        var bars = [];
        t('htopRows').forEach(function (r) {
          var row = document.createElement('div');
          row.className = 'meter';

          var label = tx(String(r[0]).padEnd(5) + r[1].padEnd(15), 'meter-label');
          var track = document.createElement('span');
          track.className = 'meter-track';
          var fill = document.createElement('span');
          fill.className = 'meter-fill' + (r[3] === 't-amber' ? ' is-amber' : r[3] === 't-blue' ? ' is-blue' : r[3] === 't-dim' ? ' is-dim' : '');
          fill.style.width = r[4] + '%';
          track.appendChild(fill);
          var status = tx(r[2], 'meter-value ' + r[3]);

          row.appendChild(label); row.appendChild(track); row.appendChild(status);
          wrap.appendChild(row);
          bars.push({ fill: fill, base: r[4] });
        });

        if (!reducedMotion.matches) animateMeters(wrap, bars);
        return [wrap, ln(t('htopFoot'), { cls: 't-dim', mt: 6 })];
      },
    },

    uptime: { run: function () { return [ln(t('uptime'))]; } },

    date: {
      run: function () {
        var now = new Date();
        var locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
        return [ln(now.toLocaleString(locale, {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }))];
      },
    },

    banner: {
      run: function () {
        return [art(), ln(t('bannerSub'), { cls: 't-dim', mt: 4 })];
      },
    },

    neofetch: {
      run: function () {
        var box = document.createElement('div');
        box.className = 'neofetch';

        var left = document.createElement('div');
        left.className = 'neofetch-art';
        left.textContent = ART.join('\n');

        var right = document.createElement('div');
        right.className = 'neofetch-info';
        right.appendChild(parts([tx('visitor', 't-green'), tx('@', 't-dim'), tx('portfolio', 't-green')], { cls: 't-bold' }));
        right.appendChild(ln('─'.repeat(22), { cls: 't-faint' }));

        var rows = t('neoRows').slice();
        rows.push([t('neoTheme'), activeTheme()]);
        rows.push([t('neoLang'), lang.toUpperCase()]);
        rows.push([t('neoUptime'), sessionUptime()]);
        right.appendChild(grid(rows, { keyCls: 't-green' }));

        box.appendChild(left); box.appendChild(right);
        return [box];
      },
    },

    /* --- filesystem ------------------------------------------------- */
    pwd: { run: function () { return [ln(absLabel(cwd))]; } },

    ls: {
      usage: 'ls [path]',
      run: function (args) {
        var target = resolvePath(args[0] || '.');
        if (!target || !target.node) return [ln(t('cdNoDir') + ' ' + (args[0] || '.'), { cls: 't-amber' })];
        if (target.node.type !== 'dir') return [ln(target.segments[target.segments.length - 1])];
        var names = childNames(target.node);
        if (!names.length) return [ln(t('lsEmpty'), { cls: 't-dim' })];
        var row = ln(null);
        names.forEach(function (name, i) {
          var isDir = target.node.children[name].type === 'dir';
          if (i) row.appendChild(tx('   '));
          row.appendChild(tx(name + (isDir ? '/' : ''), isDir ? 't-blue' : ''));
        });
        return [row];
      },
    },

    cd: {
      usage: 'cd <dir>',
      run: function (args) {
        var target = resolvePath(args[0] || '~');
        if (!target || !target.node) return [ln(t('cdNoDir') + ' ' + (args[0] || '~'), { cls: 't-amber' })];
        if (target.node.type !== 'dir') return [ln(t('cdNotDir') + ' ' + args[0], { cls: 't-amber' })];
        cwd = target.segments;
        syncPath();
        return [ln(absLabel(cwd), { cls: 't-dim' })];
      },
    },

    tree: {
      run: function () {
        return [ln(HOME, { cls: 't-green' })].concat(treeLines(TREE, [], '', []));
      },
    },

    cat: {
      usage: 'cat <file>',
      run: function (args) {
        if (!args.length) return [ln(t('catUsage'), { cls: 't-dim' })];
        var target = resolvePath(args[0]);
        if (!target || !target.node) {
          return [
            ln('cat: ' + args[0] + ': ' + t('catNoFile'), { cls: 't-amber' }),
            ln("→ 'tree' · 'ls' · 'help'", { cls: 't-dim', mt: 4 }),
          ];
        }
        if (target.node.type === 'dir') return [ln('cat: ' + args[0] + ': ' + t('catIsDir'), { cls: 't-amber' })];
        return RENDER[target.node.render]();
      },
    },

    grep: {
      usage: 'grep <pattern> [path]',
      run: function (args) {
        if (!args.length) return [ln(t('grepUsage'), { cls: 't-dim' })];
        var needle = args[0].toLowerCase();
        var scope = resolvePath(args[1] || '.');
        if (!scope || !scope.node) return [ln(t('cdNoDir') + ' ' + args[1], { cls: 't-amber' })];

        var out = [], files = 0;
        var visit = function (node, path) {
          if (node.type !== 'file') return;
          files++;
          fileText(node.render).forEach(function (text) {
            if (text.toLowerCase().indexOf(needle) === -1) return;
            out.push(parts([
              tx(pathLabel(path) + ':', 't-blue'),
              tx(' ' + text.trim()),
            ]));
          });
        };
        if (scope.node.type === 'file') visit(scope.node, scope.segments);
        else walk(scope.node, scope.segments, visit);

        if (!out.length) out.push(ln(t('grepNone'), { cls: 't-dim' }));
        out.push(ln(t('grepIn') + ' ' + files + ' × ' + pathLabel(scope.segments), { cls: 't-faint', mt: 4 }));
        return out;
      },
    },

    find: {
      usage: 'find <name>',
      run: function (args) {
        if (!args.length) return [ln(t('findUsage'), { cls: 't-dim' })];
        var needle = args[0].toLowerCase().replace(/\*/g, '');
        var out = [];
        walk(TREE, [], function (node, path) {
          var name = path[path.length - 1];
          if (name.toLowerCase().indexOf(needle) === -1) return;
          out.push(ln(pathLabel(path) + (node.type === 'dir' ? '/' : ''), {
            cls: node.type === 'dir' ? 't-blue' : '',
          }));
        });
        return out.length ? out : [ln(t('findNone'), { cls: 't-dim' })];
      },
    },

    /* --- shell ------------------------------------------------------ */
    help: {
      run: function () {
        var order = ['whoami', 'about', 'projects', 'harbor', 'skills', 'htop',
          'education', 'goals', 'contact', 'ls', 'cd', 'pwd', 'tree', 'cat',
          'grep', 'find', 'open', 'neofetch', 'banner', 'uptime', 'date',
          'echo', 'history', 'man', 'theme', 'lang', 'clear', 'help'];
        return [
          ln(t('helpTitle'), { cls: 't-bold' }),
          grid(order.map(function (name) { return [name, desc(name)]; }), { mt: 4, keyCls: 't-green', valCls: 't-dim' }),
          ln(t('helpMore'), { cls: 't-dim', mt: 6 }),
          ln(t('helpTip'), { cls: 't-green', mt: 2 }),
        ];
      },
    },

    man: {
      usage: 'man <command>',
      run: function (args) {
        if (!args.length) return [ln(t('manUsage'), { cls: 't-dim' })];
        var name = (ALIAS[args[0].toLowerCase()] || args[0].toLowerCase());
        var cmd = COMMANDS[name];
        if (!cmd) return [ln(t('manNo') + " '" + args[0] + "'", { cls: 't-amber' })];
        var rows = [[t('manUsageLabel'), cmd.usage || name]];
        var aliases = Object.keys(ALIAS).filter(function (a) { return ALIAS[a] === name; });
        if (aliases.length) rows.push(['alias', aliases.join(', ')]);
        return [
          ln(name.toUpperCase(), { cls: 't-green t-bold' }),
          ln(desc(name), { mt: 2 }),
          grid(rows, { mt: 6, keyCls: 't-dim' }),
        ];
      },
    },

    echo: {
      usage: 'echo <text>',
      run: function (args, ctx) {
        if (!args.length) return [ln(t('echoUsage'), { cls: 't-dim' })];
        return [ln(ctx.rest)];
      },
    },

    history: {
      run: function () {
        if (!cmdLog.length) return [ln(t('historyEmpty'), { cls: 't-dim' })];
        var shown = cmdLog.slice(-20);
        var offset = cmdLog.length - shown.length;
        return shown.map(function (entry, i) {
          return parts([tx(String(offset + i + 1).padStart(4) + '  ', 't-faint'), tx(entry)]);
        });
      },
    },

    open: {
      usage: 'open <github|linkedin|email>',
      run: function (args) {
        if (!args.length) return [ln(t('openUsage'), { cls: 't-dim' })];
        var key = args[0].toLowerCase().replace(/[^a-z]/g, '');
        if (key === 'mail') key = 'email';
        if (key === 'gh') key = 'github';
        if (key === 'li' || key === 'in') key = 'linkedin';
        var url = LINKS[key];
        if (!url) return [ln(t('openUnknown') + " '" + args[0] + "'", { cls: 't-amber' })];
        try { window.open(url, '_blank', 'noopener'); } catch (e) { /* blocked — the link below still works */ }
        return [parts([tx(t('openDone') + ' ', 't-dim'), link(url, url)])];
      },
    },

    theme: {
      usage: 'theme <dark|light|auto>',
      run: function (args) {
        var mode = (args[0] || '').toLowerCase();
        if (!mode) mode = activeTheme() === 'dark' ? 'light' : 'dark';
        if (mode !== 'dark' && mode !== 'light' && mode !== 'auto') {
          return [ln(t('themeUsage'), { cls: 't-dim' })];
        }
        setTheme(mode);
        return [ln(t('themeNow') + ' ' + mode + (mode === 'auto' ? ' (' + activeTheme() + ')' : ''), { cls: 't-green' })];
      },
    },

    lang: {
      usage: 'lang <en|pl>',
      /* silent: setLang() wipes the screen and reprints the welcome itself, so
         exec() must not append an echo line on top of the fresh screen */
      silent: true,
      run: function (args) {
        var next = (args[0] || '').toLowerCase();
        if (!next) next = lang === 'en' ? 'pl' : 'en';
        if (next !== 'en' && next !== 'pl') { emit([ln(t('langUsage'), { cls: 't-dim' })]); return; }
        setLang(next);
      },
    },

    sudo: { run: function () { return [ln(t('sudo'), { cls: 't-amber' })]; } },
    exit: { run: function () { return [ln(t('exit'), { cls: 't-dim' })]; } },
    clear: { run: function () { return null; } },   // handled in exec()
  };

  /* --- live htop meters ------------------------------------------------ */
  function animateMeters(wrap, bars) {
    var ticks = 0;
    var id = setInterval(function () {
      /* stop once the block scrolls out of the DOM (clear, lang switch) or
         after a minute — no runaway timers left behind */
      if (!wrap.isConnected || ++ticks > 45) { clearInterval(id); return; }
      bars.forEach(function (b) {
        var drift = (Math.random() - 0.5) * 14;
        var v = Math.max(6, Math.min(98, b.base + drift));
        b.fill.style.width = v.toFixed(0) + '%';
      });
    }, 1400);
  }

  function sessionUptime() {
    var s = Math.floor((Date.now() - startedAt) / 1000);
    var m = Math.floor(s / 60);
    return m > 0 ? m + 'm ' + (s % 60) + 's' : s + 's';
  }

  /* =====================================================================
     7. the shell
     ===================================================================== */

  var output = document.getElementById('term-output');
  var input = document.getElementById('term-input');
  var field = input.parentNode;
  var terminal = document.getElementById('terminal');
  var crumbs = document.getElementById('path-crumbs');
  var promptCwd = document.getElementById('prompt-cwd');
  var statusCwd = document.getElementById('status-cwd');
  var termTitle = document.getElementById('term-title');

  var cmdLog = loadJSON(KEY.history, []);
  var historyIdx = cmdLog.length;
  var booting = false;
  var bootTimers = [];

  function scrollToBottom() { output.scrollTop = output.scrollHeight; }

  function promptLine(raw) {
    var d = document.createElement('div');
    d.className = 'term-prompt-line';
    d.appendChild(tx('pawel@portfolio', 't-green'));
    d.appendChild(tx(':' + pathLabel(cwd) + '$ ', 't-dim'));
    d.appendChild(tx(raw));
    return d;
  }

  function emit(nodes, echo) {
    var block = document.createElement('div');
    block.className = 'term-block';
    if (echo !== undefined && echo !== null) block.appendChild(promptLine(echo));
    (nodes || []).forEach(function (n) { block.appendChild(n); });
    output.appendChild(block);
    /* bound the scrollback so a long session cannot grow without limit */
    while (output.children.length > 200) output.removeChild(output.firstChild);
    scrollToBottom();
    return block;
  }

  function clearScreen() {
    output.textContent = '';
  }

  function welcome() {
    emit([
      ln(t('welcomeHi')),
      ln(t('welcomeTry'), { cls: 't-dim' }),
    ]);
  }

  function bootSequence() {
    var lines = t('boot');
    if (reducedMotion.matches) {
      emit(lines.map(function (l) { return ln(l, { cls: 't-faint' }); }));
      welcome();
      return;
    }
    booting = true;
    var block = emit([]);
    lines.forEach(function (text, i) {
      bootTimers.push(setTimeout(function () {
        block.appendChild(ln(text, { cls: 't-faint' }));
        scrollToBottom();
      }, 130 * (i + 1)));
    });
    bootTimers.push(setTimeout(function () {
      booting = false;
      bootTimers = [];
      welcome();
    }, 130 * (lines.length + 1)));
  }

  function flushBoot() {
    if (!booting) return;
    bootTimers.forEach(clearTimeout);
    bootTimers = [];
    booting = false;
    clearScreen();
    emit(t('boot').map(function (l) { return ln(l, { cls: 't-faint' }); }));
    welcome();
  }

  function resetTerminal() {
    bootTimers.forEach(clearTimeout);
    bootTimers = [];
    booting = false;
    clearScreen();
    welcome();
  }

  /* --- parsing ---------------------------------------------------------- */

  /* Strips the conversational lead-in people type on a portfolio ("show me
     the projects") so it still lands on a real command. */
  function normalise(raw) {
    return raw.trim()
      .replace(/\s+/g, ' ')
      .replace(/^(please\s+)?(open|show|view|read|go\s+to|goto)\s+(me\s+)?(the\s+)?/i, '');
  }

  function suggest(word) {
    var names = Object.keys(COMMANDS);
    var scored = names.map(function (c) {
      var score = 0;
      if (c.charAt(0) === word.charAt(0)) score += 1;
      if (c.indexOf(word) !== -1 || word.indexOf(c) !== -1) score += 3;
      var seen = {};
      for (var i = 0; i < word.length; i++) {
        var ch = word.charAt(i);
        if (!seen[ch]) { seen[ch] = true; if (c.indexOf(ch) !== -1) score += 0.2; }
      }
      return { c: c, score: score };
    }).sort(function (a, b) { return b.score - a.score; });

    var top = scored.filter(function (x) { return x.score > 0.6; }).slice(0, 3)
      .map(function (x) { return x.c; });
    return top.length ? top : ['harbor', 'skills', 'contact'];
  }

  function unknown(word) {
    var wrap = ln(null, { cls: 't-dim', mt: 4 });
    wrap.appendChild(document.createTextNode(t('unknownDid')));
    suggest(word).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'term-suggestion';
      b.textContent = s;
      b.addEventListener('click', function () { run(s); });
      wrap.appendChild(b);
    });
    wrap.appendChild(document.createTextNode('?'));
    return [
      ln(t('unknownCmd'), { cls: 't-amber' }),
      wrap,
      ln(t('unknownHelp'), { cls: 't-dim', mt: 4 }),
    ];
  }

  function exec(raw) {
    var line = normalise(raw);
    if (!line) return;

    var tokens = line.split(' ');
    var name = tokens[0].toLowerCase();
    var args = tokens.slice(1);
    var rest = line.slice(tokens[0].length).trim();

    /* `dark` / `light` are aliases of `theme` and carry their own argument */
    if ((name === 'dark' || name === 'light') && !args.length) args = [name];
    if (ALIAS[name]) name = ALIAS[name];

    if (name === 'clear') { clearScreen(); return; }

    var cmd = COMMANDS[name];
    if (cmd) {
      var ctx = { rest: rest, raw: raw, name: name };
      if (cmd.silent) cmd.run(args, ctx);
      else emit(cmd.run(args, ctx), raw);
      return;
    }

    /* not a command — maybe it is a path (autocd / implicit cat) */
    var target = resolvePath(line);
    if (target && target.node) {
      if (target.node.type === 'dir') emit(COMMANDS.cd.run([line], {}), raw);
      else emit(COMMANDS.cat.run([line], {}), raw);
      return;
    }

    emit(unknown(name), raw);
  }

  function run(raw) {
    if (!raw || !raw.trim()) return;
    flushBoot();
    var entry = raw.trim();
    if (cmdLog[cmdLog.length - 1] !== entry) cmdLog.push(entry);   // no consecutive dupes
    if (cmdLog.length > 60) cmdLog = cmdLog.slice(-60);
    historyIdx = cmdLog.length;
    save(KEY.history, JSON.stringify(cmdLog));
    input.value = '';
    syncField();
    exec(raw);
  }

  /* --- history recall --------------------------------------------------- */
  function recall(dir) {
    if (!cmdLog.length) return;
    var idx = historyIdx + dir;
    if (idx < 0) idx = 0;
    if (idx >= cmdLog.length) {
      historyIdx = cmdLog.length;
      input.value = '';
      syncField();
      return;
    }
    historyIdx = idx;
    input.value = cmdLog[idx];
    syncField();
    /* put the caret at the end, after the value has landed */
    setTimeout(function () { input.setSelectionRange(input.value.length, input.value.length); }, 0);
  }

  /* --- tab completion --------------------------------------------------- */
  function commonPrefix(list) {
    if (!list.length) return '';
    var prefix = list[0];
    list.forEach(function (s) {
      while (s.indexOf(prefix) !== 0) prefix = prefix.slice(0, -1);
    });
    return prefix;
  }

  function pathCandidates(fragment) {
    var slash = fragment.lastIndexOf('/');
    var dirPart = slash === -1 ? '' : fragment.slice(0, slash + 1);
    var basePart = slash === -1 ? fragment : fragment.slice(slash + 1);
    var dir = resolvePath(dirPart || '.');
    if (!dir || !dir.node || dir.node.type !== 'dir') return { dirPart: dirPart, names: [] };
    var names = childNames(dir.node).filter(function (n) {
      return n.toLowerCase().indexOf(basePart.toLowerCase()) === 0;
    }).map(function (n) {
      return n + (dir.node.children[n].type === 'dir' ? '/' : '');
    });
    return { dirPart: dirPart, names: names };
  }

  function complete() {
    var value = input.value;
    var head = value.replace(/\s+$/, '');
    var tokens = head.length ? head.split(/\s+/) : [];
    var trailingSpace = /\s$/.test(value);
    var editing = trailingSpace ? '' : (tokens[tokens.length - 1] || '');
    var isFirst = tokens.length <= 1 && !trailingSpace;

    var candidates, replaceWith;

    if (isFirst) {
      /* an empty line lists the real commands only — dumping every alias too
         would bury the answer the visitor is looking for */
      var pool = editing ? Object.keys(COMMANDS).concat(Object.keys(ALIAS)) : Object.keys(COMMANDS);
      candidates = pool
        .filter(function (n) { return n.indexOf(editing.toLowerCase()) === 0; })
        .sort()
        .filter(function (n, i, arr) { return arr.indexOf(n) === i; });
      replaceWith = function (text) { input.value = text + (candidates.length === 1 ? ' ' : ''); };
    } else {
      var verb = tokens[0].toLowerCase();
      verb = ALIAS[verb] || verb;
      if (verb === 'man') {
        candidates = Object.keys(COMMANDS).filter(function (n) { return n.indexOf(editing.toLowerCase()) === 0; }).sort();
      } else if (verb === 'open') {
        candidates = Object.keys(LINKS).filter(function (n) { return n.indexOf(editing.toLowerCase()) === 0; });
      } else if (verb === 'theme') {
        candidates = ['auto', 'dark', 'light'].filter(function (n) { return n.indexOf(editing.toLowerCase()) === 0; });
      } else if (verb === 'lang') {
        candidates = ['en', 'pl'].filter(function (n) { return n.indexOf(editing.toLowerCase()) === 0; });
      } else {
        var found = pathCandidates(editing);
        candidates = found.names.map(function (n) { return found.dirPart + n; });
      }
      var prefixTokens = trailingSpace ? tokens : tokens.slice(0, -1);
      replaceWith = function (text) {
        var joined = prefixTokens.concat([text]).join(' ');
        input.value = joined + (candidates.length === 1 && !/\/$/.test(text) ? ' ' : '');
      };
    }

    if (!candidates.length) return;
    if (candidates.length === 1) { replaceWith(candidates[0]); syncField(); return; }

    var prefix = commonPrefix(candidates);
    if (prefix && prefix.length > editing.length) replaceWith(prefix);
    emit([ln(candidates.join('   '), { cls: 't-faint' })], input.value);
    syncField();
  }

  /* --- input plumbing --------------------------------------------------- */
  function syncField() {
    field.classList.toggle('is-empty', input.value.length === 0);
  }

  input.addEventListener('input', syncField);
  input.addEventListener('focus', function () { terminal.classList.add('focused'); });
  input.addEventListener('blur', function () { terminal.classList.remove('focused'); });

  input.addEventListener('keydown', function (e) {
    var ctrl = e.ctrlKey || e.metaKey;

    if (e.key === 'Enter') { e.preventDefault(); run(input.value); return; }
    if (e.key === 'Tab') { e.preventDefault(); flushBoot(); complete(); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); recall(-1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); recall(1); return; }
    if (e.key === 'Escape' && !terminal.classList.contains('expanded')) {
      input.value = ''; syncField(); return;
    }

    if (!ctrl) return;
    var k = e.key.toLowerCase();
    if (k === 'l') { e.preventDefault(); clearScreen(); }
    else if (k === 'c') {
      e.preventDefault();
      emit([], input.value + '^C');
      input.value = ''; syncField();
      historyIdx = cmdLog.length;
    } else if (k === 'u') {
      e.preventDefault();
      input.value = input.value.slice(input.selectionStart); syncField();
      input.setSelectionRange(0, 0);
    } else if (k === 'k') {
      e.preventDefault();
      input.value = input.value.slice(0, input.selectionStart); syncField();
    } else if (k === 'a') {
      e.preventDefault(); input.setSelectionRange(0, 0);
    } else if (k === 'e') {
      e.preventDefault(); input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  /* clicking the transcript (or the empty part of the prompt row) focuses the
     input — unless the visitor is selecting text or following a link */
  function focusInput(e) {
    if (e && e.target.closest && e.target.closest('a, button')) return;
    var sel = window.getSelection();
    if (sel && sel.toString()) return;
    input.focus();
  }
  output.addEventListener('click', focusInput);
  field.addEventListener('click', focusInput);

  /* --- path chrome ------------------------------------------------------ */
  function syncPath() {
    crumbs.textContent = '';
    var segs = ['~'].concat(cwd);
    segs.forEach(function (seg, i) {
      if (i) crumbs.appendChild(tx('/', 'path-sep'));
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'path-seg' + (i === segs.length - 1 ? ' path-cur' : '');
      b.textContent = seg;
      var targetPath = i === 0 ? '~' : '~/' + cwd.slice(0, i).join('/');
      b.addEventListener('click', function () {
        run(i === segs.length - 1 ? 'ls' : 'cd ' + targetPath);
      });
      crumbs.appendChild(b);
    });
    promptCwd.textContent = ':' + pathLabel(cwd) + '$';
    statusCwd.textContent = absLabel(cwd);
    termTitle.textContent = 'visitor@portfolio: ' + absLabel(cwd);
  }

  /* =====================================================================
     8. page wiring + boot
     ===================================================================== */

  function applyPageStrings() {
    var L = PAGE[lang];
    root.lang = lang;
    document.title = L.title;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (L[key]) el.textContent = L[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (L[key]) el.placeholder = L[key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (L[key]) el.setAttribute('aria-label', L[key]);
    });
    document.getElementById('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
    document.getElementById('lang-pl').setAttribute('aria-pressed', String(lang === 'pl'));
    syncExpandLabel();
  }

  function setLang(next) {
    if (next === lang) return;
    lang = next;
    save(KEY.lang, next);
    applyPageStrings();
    syncPath();
    resetTerminal();          /* a shell keeps its transcript; a portfolio should not */
    input.focus();
  }

  document.getElementById('lang-en').addEventListener('click', function () { setLang('en'); });
  document.getElementById('lang-pl').addEventListener('click', function () { setLang('pl'); });

  document.getElementById('btn-theme').addEventListener('click', function () {
    setTheme(activeTheme() === 'dark' ? 'light' : 'dark');
  });
  if (prefersDark.addEventListener) {
    prefersDark.addEventListener('change', function () {
      if (load(KEY.theme, 'auto') === 'auto') root.removeAttribute('data-theme');
    });
  }

  /* Everything with [data-cmd] — nav, CTAs, path segments, fs strip, chips —
     runs its command. Triggers outside the terminal also bring it into view
     (matters on mobile, where the terminal sits below the hero text). */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('[data-cmd]') : null;
    if (!el) return;
    run(el.getAttribute('data-cmd'));
    if (!terminal.contains(el)) {
      terminal.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'nearest',
      });
    } else {
      input.focus();
    }
  });

  /* --- expand / minimise ------------------------------------------------ */
  var expandBtn = document.getElementById('btn-expand');
  var expandIcon = document.getElementById('expand-icon');
  var expandLabel = document.getElementById('expand-label');

  function syncExpandLabel() {
    var on = terminal.classList.contains('expanded');
    expandIcon.textContent = on ? '⤡' : '⤢';
    expandLabel.textContent = on ? PAGE[lang].minimize : PAGE[lang].expand;
    expandBtn.setAttribute('aria-expanded', String(on));
  }
  function setExpanded(on) {
    terminal.classList.toggle('expanded', on);
    document.body.classList.toggle('term-expanded', on);
    syncExpandLabel();
    if (on) input.focus();
    scrollToBottom();
  }
  expandBtn.addEventListener('click', function () {
    setExpanded(!terminal.classList.contains('expanded'));
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && terminal.classList.contains('expanded')) setExpanded(false);
  });

  /* --- go --------------------------------------------------------------- */
  applyPageStrings();
  syncPath();
  syncField();
  bootSequence();
})();
