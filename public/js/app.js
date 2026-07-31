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
      title: 'Paweł Rogoża — Hosting Tech Support → SysOps',
      skipLink: 'Skip to the terminal',
      heroH1: "Hi, I'm Paweł Rogoża.",
      heroSub: "I do tech support at cyberfolks.pl (hosting) and I'm growing toward SysOps / Linux administration. After hours I run Harbor — a self-hosted VPS — plus monitoring, analytics and the small tools that keep servers healthy.",
      navAbout: 'About', navProjects: 'Projects', navSkills: 'Skills', navContact: 'Contact',
      ctaProjects: 'Browse projects', ctaContact: 'Get in touch',
      metaRoleLabel: 'Role', metaRoleValue: 'Tech support (hosting)',
      metaFocusLabel: 'Focus', metaFocusValue: 'Hosting ops · side projects',
      metaNextLabel: 'Heading for', metaNextValue: 'SysOps / Linux admin',
      metaBasedLabel: 'Based in', metaBasedValue: 'Gdańsk, Poland',
      expand: 'expand', minimize: 'minimize',
      inputLabel: 'Terminal command',
      inputPlaceholder: 'type a command…',
      themeToggle: 'Switch between light and dark theme',
      hintTab: 'completes', hintHistory: 'history', hintClear: 'clear',
      footBuilt: 'Static site — HTML, CSS and vanilla JS. No build step, no dependencies.',
    },
    pl: {
      title: 'Paweł Rogoża — wsparcie techniczne hostingu → SysOps',
      skipLink: 'Przejdź do terminala',
      heroH1: 'Cześć, jestem Paweł Rogoża.',
      heroSub: 'Pracuję we wsparciu technicznym cyberfolks.pl (hosting) i rozwijam się w stronę SysOps / administracji Linuksem. Po godzinach utrzymuję Harbor — własny VPS — a do tego monitoring, analitykę i małe narzędzia, które dbają o zdrowie serwerów.',
      navAbout: 'O mnie', navProjects: 'Projekty', navSkills: 'Umiejętności', navContact: 'Kontakt',
      ctaProjects: 'Zobacz projekty', ctaContact: 'Kontakt',
      metaRoleLabel: 'Rola', metaRoleValue: 'Wsparcie techniczne (hosting)',
      metaFocusLabel: 'Skupienie', metaFocusValue: 'Hosting · projekty po godzinach',
      metaNextLabel: 'Kierunek', metaNextValue: 'SysOps / administracja Linuksem',
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
      boot: ['portfolio-shell 1.1 — booting…', 'mounting /home/pawel … ok', 'session opened for visitor … ok'],
      welcomeHi: 'Hi — type a command, hit Tab, or click a chip.',
      welcomeTry: 'Try: ls -la · projects · skills · htop · help',

      whoami: 'pawel — tech support at cyber_Folks (since 03.2024), cyber_Admin Ambassador in the CST team (since 10.2025). Growing toward SysOps / Linux administration.',

      aboutRole: 'Tech support at cyber_Folks (since 03.2024) · cyber_Admin Ambassador in the CST team (since 10.2025).',
      aboutHeading: 'Growing toward SysOps / Linux administration.',
      aboutWork: 'Day to day: diagnosing DNS, mail (Exim, SPF/DKIM/DMARC), web and security issues; working with root privileges on DirectAdmin servers (backup restores via rsync, systemd). I also run internal cyber_Admin trainings.',
      aboutEdu: 'From 10.2026: postgraduate studies in cybersecurity (Polish Naval Academy in Gdynia).',
      aboutMain: 'After hours: Harbor (self-hosted VPS) and the projects running on it — see projects/.',

      projectsRows: [
        ['harbor.md', 'own hosting infrastructure on a VPS (web + mail)'],
        ['robust.md', 'work · Exim log analysis, spam detection (cyber_Folks)'],
        ['advokat-varshava.md', 'law-firm web app + PWA, hosted on Harbor'],
        ['noclegwsopocie.md', 'Python/FastAPI website, hosted on Harbor'],
        ['zabbix.md', 'monitoring for my servers'],
        ['umami.md', 'self-hosted web analytics'],
      ],
      projectsHint: "→ 'cat projects/<file>' opens a write-up · work scripts: 'ls ~/scripts'",

      harborLead: 'My own hosting infrastructure (web + mail), built from scratch on a VPS.',
      harborGoal: 'Part study, part business: I learn server administration on real services, host a few small web projects on the side, and write every decision down as open knowledge.',
      harborStackHead: 'stack:',
      harborStack: [
        ['os', 'AlmaLinux 10 · Hetzner Cloud (Falkenstein)'],
        ['web', 'nginx 1.26.3 built from source + Apache backend + PHP-FPM'],
        ['app', 'Python / FastAPI + Uvicorn over unix sockets (multi-tenant)'],
        ['db', 'MariaDB + SQLite'],
        ['cache', 'Redis + nginx FastCGI cache'],
        ['security', 'firewalld · fail2ban · ModSecurity v3 + OWASP CRS v4'],
        ['monitoring', 'Zabbix · Netdata'],
        ['analytics', 'Umami'],
        ['backup', 'restic → Hetzner'],
        ['mail', 'Postfix + Dovecot + Rspamd (planned)'],
        ['iac', 'Ansible (planned)'],
      ],
      harborStagesHead: 'stages:',
      harborStages: [
        ['done', 'hardening & setup · web stack · SSL + WordPress · FastAPI isolation · L7 security · monitoring'],
        ['wip', 'client separation (PHP / MariaDB)'],
        ['next', 'backups · mail server · Ansible'],
      ],
      harborWhy: 'Why it exists: real services, real failures, real fixes — the parts a tutorial skips.',
      harborStatus: 'status: in active development · MIT license (notes and example configs — help yourself)',

      robustLead: 'Analyzes Exim logs and points at accounts that are likely sending spam.',
      robustNoBlock: 'It builds a report for manual review — it never blocks anything or changes server config.',
      robustPipe: 'pipeline: fetch logs (SSH) → parse Exim → JSONL → aggregate by queue_id → SMTP & PHP scoring → verdicts → Top N report',
      robustSignals: 'signals: volume & rate spikes · recipient patterns · spam-like subjects · reputation blocks & bounces · IP-prefix spread (/24, /64) · GeoIP',
      robustReport: 'report: HIGH / MID / LOW priorities, evidence-first cards, text + JSON output',
      robustRule: 'no single weak signal gives HIGH — a verdict combines independent evidence.',
      robustStack: 'stack: Bash + Python 3, run from a gateway over SSH',
      robustSample: [
        '$ ./spamhunt.sh s26',
        'ROBUST | s26 | last 72h',
        'HIGH: 3 | MID: 11 | LOW: 176',
        '1. [HIGH] account@domain.pl · SMTP',
        '   EVIDENCE: 410/11912 blocked as spam (3%)',
        '   PATTERN: 11912 sends · 3680 IP prefixes · generated list · slow-drip',
      ],
      robustStatus: 'status: written for my team at cyber_Folks · now developed together with the Development Department',

      advokatLead: 'Web application + PWA for a law firm.',
      advokatBody: 'Leads, documents, clients and finances in one place — around 50–60 users a day. Hosted on Harbor.',
      advokatCrmHead: 'the app:',
      advokatCrm: [
        'collects leads from the site in real time',
        'built-in document editing',
        'client and case records',
        'finance module',
        'installs on the phone as a PWA',
      ],

      zabbixLead: 'Monitoring for my servers.',
      zabbixBody: 'Hosts, services, triggers and alerts — Zabbix keeps an eye on Harbor and the rest of my infrastructure.',

      umamiLead: 'Self-hosted, privacy-friendly web analytics.',
      umamiBody: 'Traffic stats for my sites without handing visitor data to third parties.',

      noclegLead: 'noclegwsopocie.pl — a website built with Python / FastAPI.',
      noclegBody: 'Runs on Harbor, my self-hosted VPS.',

      redisLead: 'redis-check.sh — Redis diagnostics helper, used by the CST team.',
      redisSteps: [
        'checks that the user exists on the server',
        "verifies the user's Redis processes are alive",
        'if not: sudo lx_redis_manage reset_redis <user> — the most common fix',
      ],
      redisUsage: 'usage: redis-check.sh <directadmin-user>',

      calveLead: 'calve.sh — CloudLinux limit usage analysis, used by the CST team.',
      calveBody: "Snapshots a user's LVE usage on a www-cl-X server — CPU, RAM, processes (EP) and IOPS — through the day, at a chosen interval.",
      calveWhen: 'use case: a client reports a slow site → see if and when the limits saturate, then read the logs from that window.',
      calveUsage: 'usage: calve <www-server> <user> [date] [interval-min]',
      calveSample: [
        '$ calve www-cl-1 zielonapaczka 2026-07-30 10',
        '09:00  CPU  38%   RAM 512M/1024M   EP  7/20   IOPS 122',
        '09:10  CPU  97%   RAM 940M/1024M   EP 19/20   IOPS 610',
        '09:20  CPU 100%   RAM 989M/1024M   EP 20/20   IOPS 655   <- saturation',
      ],

      casearchLead: 'casearch.sh — finds a hosting client by domain, login or hosting id.',
      casearchUsage: 'usage: casearch <domain|login|hosting-id>',

      exampleHead: 'example:',

      skillsRows: [
        ['Linux', 'AlmaLinux · CloudLinux · bash · systemd · rsync'],
        ['Web', 'nginx · Apache · PHP-FPM'],
        ['Data', 'MariaDB/MySQL · Redis'],
        ['Mail & DNS', 'Exim · DNS · SPF/DKIM/DMARC'],
        ['Security', 'firewalld · fail2ban · ModSecurity + OWASP CRS'],
        ['Ops', 'Zabbix · restic'],
        ['Scripting', 'Python (FastAPI) · bash · Git'],
        ['Panels', 'DirectAdmin · cyber_Admin'],
        ['Next', 'SysOps / Linux administration'],
      ],
      skillsHint: "→ try 'htop' for the same thing as processes.",

      htopHead: ['PID', 'AREA', 'LOAD', 'STATUS'],
      htopRows: [
        [101, 'tech-support', 'day job', 't-green', 88],
        [102, 'linux', 'actively learning', 't-green', 78],
        [103, 'harbor', 'active project', 't-green', 84],
        [104, 'robust', 'work project', 't-amber', 70],
        [105, 'monitoring', 'zabbix · umami', 't-amber', 52],
        [106, 'automation', 'bash · python', 't-amber', 46],
        [107, 'sysops', 'next step', 't-blue', 35],
      ],
      htopFoot: 'Load is a metaphor, not a metric — it is where my attention goes.',

      eduDegree: 'Bachelor of Science',
      eduField: 'Informatics & Econometrics',
      eduSpec: 'specialization: IT Applications in Business',
      eduSchool: 'University of Gdańsk · 2019–2022',
      eduNext: 'From 10.2026: postgraduate studies — Cybersecurity',
      eduNextSchool: 'Polish Naval Academy in Gdynia',

      booksRows: [
        ['read', '“How Linux Works” — Brian Ward'],
        ['reading', '“UNIX and Linux System Administration Handbook” — Nemeth et al.'],
        ['up next', '“Systems Performance: Enterprise and the Cloud” — Brendan Gregg'],
      ],

      goalsNow: 'now    →  tech support (hosting, cyber_Folks)',
      goalsNext: 'next   →  SysOps / Linux administration',
      goalsLater: 'later  →  automation, monitoring, infrastructure at scale',
      goalsNote: 'Honest, incremental, hands-on.',

      contactLead: 'The fastest way to reach me is email.',
      contactHint: "→ 'open github' opens a link in a new tab.",

      uptime: '27 years online — tech support by day, SysOps in the making.',

      helpTitle: 'Commands',
      helpTip: 'Tab completes · ↑ / ↓ recalls · Ctrl+L clears · Esc leaves fullscreen.',
      helpMore: "→ 'man <command>' explains a single command.",
      helpSecContent: 'content', helpSecFiles: 'files',
      helpSecSystem: 'system', helpSecShell: 'shell',

      lsEmpty: 'directory is empty',
      headUsage: 'usage: head [-n N] <file>',
      tailUsage: 'usage: tail [-n N] <file>',
      idNote: "not in the sudo group — see 'sudo'.",
      wWhat: 'reading the portfolio',
      sysctlRows: [
        ['nginx.service', 'serves this portfolio'],
        ['postfix.service', 'mail — harbor'],
        ['mariadb.service', 'databases — harbor'],
        ['zabbix-agent.service', 'monitoring — zabbix'],
        ['umami.service', 'web analytics — umami'],
        ['redis-watch.timer', 'redis-check.sh for DirectAdmin users'],
      ],
      sysctlFoot: 'all units green — as it should be.',
      rofs: 'read-only filesystem — nothing to change here.',
      editor: "no $EDITOR in this shell — the files are read-only. try 'cat <file>'.",
      net: "outbound network is disabled in this shell — 'open github' works, though.",
      pkg: 'no package manager needed — this site has zero dependencies.',
      ssh: 'visitor@harbor: Permission denied (publickey) — harbor only talks to me.',
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
      bannerSub: 'hosting tech support → SysOps · portfolio shell',

      neoRows: [
        ['host', 'portfolio.pawelrogoza.pl'],
        ['shell', 'portfolio-shell 1.1'],
        ['role', 'tech support @ cyber_Folks (CST) · cyber_Admin Ambassador'],
        ['projects', 'harbor · robust · advokat-varshava · noclegwsopocie · zabbix · umami'],
        ['scripts', 'redis-check · calve · casearch'],
        ['next', 'SysOps / Linux administration'],
      ],
      neoTheme: 'theme',
      neoLang: 'lang',
      neoUptime: 'session',
    },

    pl: {
      boot: ['portfolio-shell 1.1 — uruchamianie…', 'montowanie /home/pawel … ok', 'sesja otwarta dla visitor … ok'],
      welcomeHi: 'Cześć — wpisz komendę, użyj Tab albo kliknij chip.',
      welcomeTry: 'Spróbuj: ls -la · projects · skills · htop · help',

      whoami: 'pawel — wsparcie techniczne w cyber_Folks (od 03.2024), Ambasador cyber_Admin w CST (od 10.2025). Rozwijam się w stronę SysOps / administracji Linuksem.',

      aboutRole: 'Wsparcie techniczne w cyber_Folks (od 03.2024) · Ambasador cyber_Admin w CST (od 10.2025).',
      aboutHeading: 'Rozwijam się w stronę SysOps / administracji Linuksem.',
      aboutWork: 'Na co dzień: diagnostyka DNS, poczty (Exim, SPF/DKIM/DMARC), WWW i bezpieczeństwa; praca na uprawnieniach root na serwerach DirectAdmin (przywracanie kopii przez rsync, systemd). Prowadzę wewnętrzne szkolenia z cyber_Admin.',
      aboutEdu: 'Od 10.2026: studia podyplomowe z cyberbezpieczeństwa (Akademia Marynarki Wojennej w Gdyni).',
      aboutMain: 'Po godzinach: Harbor (własny VPS) i projekty, które na nim działają — zobacz projects/.',

      projectsRows: [
        ['harbor.md', 'własna infrastruktura hostingowa na VPS (www + mail)'],
        ['robust.md', 'praca · analiza logów Exima, wykrywanie spamu (cyber_Folks)'],
        ['advokat-varshava.md', 'aplikacja webowa + PWA dla kancelarii, na Harborze'],
        ['noclegwsopocie.md', 'strona w Pythonie/FastAPI, na Harborze'],
        ['zabbix.md', 'monitoring moich serwerów'],
        ['umami.md', 'własna analityka www'],
      ],
      projectsHint: "→ 'cat projects/<plik>' otwiera opis · skrypty z pracy: 'ls ~/scripts'",

      harborLead: 'Własna infrastruktura hostingowa (www + mail), budowana od zera na VPS-ie.',
      harborGoal: 'Trochę nauka, trochę komercja: uczę się administracji na prawdziwych usługach, przy okazji hostuję kilka małych projektów WWW, a każdą decyzję spisuję jako open knowledge.',
      harborStackHead: 'stack:',
      harborStack: [
        ['os', 'AlmaLinux 10 · Hetzner Cloud (Falkenstein)'],
        ['web', 'nginx 1.26.3 ze źródeł + Apache jako backend + PHP-FPM'],
        ['app', 'Python / FastAPI + Uvicorn po socketach unix (multi-tenant)'],
        ['db', 'MariaDB + SQLite'],
        ['cache', 'Redis + nginx FastCGI cache'],
        ['security', 'firewalld · fail2ban · ModSecurity v3 + OWASP CRS v4'],
        ['monitoring', 'Zabbix · Netdata'],
        ['analytics', 'Umami'],
        ['backup', 'restic → Hetzner'],
        ['mail', 'Postfix + Dovecot + Rspamd (planowane)'],
        ['iac', 'Ansible (planowane)'],
      ],
      harborStagesHead: 'etapy:',
      harborStages: [
        ['gotowe', 'hardening i setup · web stack · SSL + WordPress · izolacja FastAPI · bezpieczeństwo L7 · monitoring'],
        ['w toku', 'separacja klientów (PHP / MariaDB)'],
        ['dalej', 'backupy · serwer pocztowy · Ansible'],
      ],
      harborWhy: 'Po co: prawdziwe usługi, prawdziwe awarie, prawdziwe naprawy — to, co tutorial pomija.',
      harborStatus: 'status: w aktywnym rozwoju · licencja MIT (notatki i przykładowe configi do wzięcia)',

      robustLead: 'Analizuje logi Exima i wskazuje konta z prawdopodobną wysyłką spamu.',
      robustNoBlock: 'Tworzy raport do ręcznej weryfikacji — niczego nie blokuje i nie zmienia konfiguracji serwera.',
      robustPipe: 'pipeline: pobranie logów (SSH) → parser Exim → JSONL → agregacja po queue_id → scoring SMTP i PHP → werdykty → raport Top N',
      robustSignals: 'sygnały: wolumen i piki tempa · wzorce odbiorców · spamerskie tematy · blokady reputacyjne i bounce · rozrzut prefiksów IP (/24, /64) · GeoIP',
      robustReport: 'raport: priorytety HIGH / MID / LOW, karty z dowodami, wynik tekstowy + JSON',
      robustRule: 'pojedynczy słaby sygnał nie daje HIGH — werdykt łączy niezależne dowody.',
      robustStack: 'stack: Bash + Python 3, uruchamiany z gatewaya przez SSH',
      robustSample: [
        '$ ./spamhunt.sh s26',
        'ROBUST | s26 | ostatnie 72h',
        'HIGH: 3 | MID: 11 | LOW: 176',
        '1. [HIGH] konto@domena.pl · SMTP',
        '   DOWÓD: 410/11912 blokad jako spam (3%)',
        '   WZORZEC: 11912 wysyłek · 3680 prefiksów IP · generowana lista · slow-drip',
      ],
      robustStatus: 'status: napisany dla mojego zespołu w cyber_Folks · rozwijany wspólnie z Działem Rozwoju',

      advokatLead: 'Aplikacja webowa + PWA dla kancelarii adwokackiej.',
      advokatBody: 'Leady, dokumenty, klienci i finanse w jednym miejscu — ok. 50–60 użytkowników dziennie. Hostowana na Harborze.',
      advokatCrmHead: 'aplikacja:',
      advokatCrm: [
        'zbiera leady ze strony na bieżąco',
        'wbudowana edycja dokumentów',
        'kartoteka klientów i spraw',
        'moduł finansów',
        'instaluje się na telefonie jako PWA',
      ],

      zabbixLead: 'Monitoring moich serwerów.',
      zabbixBody: 'Hosty, usługi, wyzwalacze i alerty — Zabbix pilnuje Harbora i reszty mojej infrastruktury.',

      umamiLead: 'Samodzielnie hostowana analityka www, przyjazna prywatności.',
      umamiBody: 'Statystyki ruchu moich stron bez oddawania danych odwiedzających firmom trzecim.',

      noclegLead: 'noclegwsopocie.pl — strona napisana w Pythonie / FastAPI.',
      noclegBody: 'Działa na Harborze — moim własnym VPS-ie.',

      redisLead: 'redis-check.sh — pomocnik diagnostyki Redisa, używany przez zespół CST.',
      redisSteps: [
        'sprawdza, czy użytkownik istnieje na serwerze',
        'weryfikuje, czy procesy Redis użytkownika żyją',
        'jeśli nie: sudo lx_redis_manage reset_redis <user> — najczęstszy fix',
      ],
      redisUsage: 'użycie: redis-check.sh <użytkownik-directadmin>',

      calveLead: 'calve.sh — analiza wykorzystania limitów CloudLinux, używany przez zespół CST.',
      calveBody: 'Snapshoty zużycia LVE użytkownika na serwerze www-cl-X — CPU, RAM, procesy (EP) i IOPS — w ciągu dnia, w zadanym interwale.',
      calveWhen: 'zastosowanie: klient zgłasza wolną stronę → widać, czy i kiedy limity się wysycają, a potem czyta się logi z tego okna.',
      calveUsage: 'użycie: calve <serwer-www> <user> [data] [interwał-min]',
      calveSample: [
        '$ calve www-cl-1 zielonapaczka 2026-07-30 10',
        '09:00  CPU  38%   RAM 512M/1024M   EP  7/20   IOPS 122',
        '09:10  CPU  97%   RAM 940M/1024M   EP 19/20   IOPS 610',
        '09:20  CPU 100%   RAM 989M/1024M   EP 20/20   IOPS 655   <- wysycenie',
      ],

      casearchLead: 'casearch.sh — wyszukuje klienta hostingu po domenie, loginie albo id hostingu.',
      casearchUsage: 'użycie: casearch <domena|login|id-hostingu>',

      exampleHead: 'przykład:',

      skillsRows: [
        ['Linux', 'AlmaLinux · CloudLinux · bash · systemd · rsync'],
        ['WWW', 'nginx · Apache · PHP-FPM'],
        ['Dane', 'MariaDB/MySQL · Redis'],
        ['Poczta i DNS', 'Exim · DNS · SPF/DKIM/DMARC'],
        ['Security', 'firewalld · fail2ban · ModSecurity + OWASP CRS'],
        ['Ops', 'Zabbix · restic'],
        ['Skrypty', 'Python (FastAPI) · bash · Git'],
        ['Panele', 'DirectAdmin · cyber_Admin'],
        ['Dalej', 'SysOps / administracja Linuksem'],
      ],
      skillsHint: "→ wpisz 'htop', żeby zobaczyć to samo jako procesy.",

      htopHead: ['PID', 'OBSZAR', 'OBCIĄŻ.', 'STATUS'],
      htopRows: [
        [101, 'wsparcie-tech', 'etat', 't-green', 88],
        [102, 'linux', 'uczę się na bieżąco', 't-green', 78],
        [103, 'harbor', 'aktywny projekt', 't-green', 84],
        [104, 'robust', 'projekt z pracy', 't-amber', 70],
        [105, 'monitoring', 'zabbix · umami', 't-amber', 52],
        [106, 'automatyzacja', 'bash · python', 't-amber', 46],
        [107, 'sysops', 'następny krok', 't-blue', 35],
      ],
      htopFoot: 'Obciążenie to metafora, nie metryka — pokazuje, gdzie idzie moja uwaga.',

      eduDegree: 'Licencjat',
      eduField: 'Informatyka i Ekonometria',
      eduSpec: 'specjalność: Aplikacje Informatyczne w Biznesie',
      eduSchool: 'Uniwersytet Gdański · 2019–2022',
      eduNext: 'Od 10.2026: studia podyplomowe — Cyberbezpieczeństwo',
      eduNextSchool: 'Akademia Marynarki Wojennej w Gdyni',

      booksRows: [
        ['przeczytane', '„Jak działa Linux” — Brian Ward'],
        ['w trakcie', '„Unix i Linux. Przewodnik administratora systemów” — Nemeth i in.'],
        ['w planach', '„Systems Performance: Enterprise and the Cloud” — Brendan Gregg'],
      ],

      goalsNow: 'teraz  →  wsparcie techniczne (hosting, cyber_Folks)',
      goalsNext: 'dalej  →  SysOps / administracja Linuksem',
      goalsLater: 'potem  →  automatyzacja, monitoring, infrastruktura na większą skalę',
      goalsNote: 'Uczciwie, krok po kroku, w praktyce.',

      contactLead: 'Najszybciej złapiesz mnie mailem.',
      contactHint: "→ 'open github' otwiera link w nowej karcie.",

      uptime: '27 lat online — za dnia wsparcie techniczne, w budowie SysOps.',

      helpTitle: 'Komendy',
      helpTip: 'Tab uzupełnia · ↑ / ↓ historia · Ctrl+L czyści · Esc wychodzi z pełnego ekranu.',
      helpMore: "→ 'man <komenda>' opisuje pojedynczą komendę.",
      helpSecContent: 'treść', helpSecFiles: 'pliki',
      helpSecSystem: 'system', helpSecShell: 'powłoka',

      lsEmpty: 'katalog jest pusty',
      headUsage: 'użycie: head [-n N] <plik>',
      tailUsage: 'użycie: tail [-n N] <plik>',
      idNote: "poza grupą sudo — sprawdź 'sudo'.",
      wWhat: 'przegląda portfolio',
      sysctlRows: [
        ['nginx.service', 'serwuje to portfolio'],
        ['postfix.service', 'poczta — harbor'],
        ['mariadb.service', 'bazy danych — harbor'],
        ['zabbix-agent.service', 'monitoring — zabbix'],
        ['umami.service', 'analityka www — umami'],
        ['redis-watch.timer', 'redis-check.sh dla użytkowników DirectAdmin'],
      ],
      sysctlFoot: 'wszystkie usługi zielone — tak ma być.',
      rofs: 'system plików tylko do odczytu — nic tu nie zmienisz.',
      editor: "w tej powłoce nie ma $EDITOR — pliki są tylko do odczytu. spróbuj 'cat <plik>'.",
      net: "ruch wychodzący jest tu wyłączony — ale 'open github' działa.",
      pkg: 'menedżer pakietów niepotrzebny — ta strona nie ma żadnych zależności.',
      ssh: 'visitor@harbor: Permission denied (publickey) — harbor rozmawia tylko ze mną.',
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
      bannerSub: 'wsparcie techniczne hostingu → SysOps · powłoka portfolio',

      neoRows: [
        ['host', 'portfolio.pawelrogoza.pl'],
        ['powłoka', 'portfolio-shell 1.1'],
        ['rola', 'wsparcie techniczne @ cyber_Folks (CST) · Ambasador cyber_Admin'],
        ['projekty', 'harbor · robust · advokat-varshava · noclegwsopocie · zabbix · umami'],
        ['skrypty', 'redis-check · calve · casearch'],
        ['dalej', 'SysOps / administracja Linuksem'],
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
      harbor: 'open Harbor', robust: 'spam detection (work)', advokat: 'law-firm app + PWA',
      nocleg: 'FastAPI website', zabbix: 'monitoring project', umami: 'web analytics project',
      skills: 'tech skill map', htop: 'skills as processes',
      education: 'background', books: 'reading list', goals: 'career direction', contact: 'links & email',
      ls: 'list files (-l, -a)', cd: 'change directory', pwd: 'print working directory',
      tree: 'show the file tree', cat: 'print a file',
      head: 'first lines of a file', tail: 'last lines of a file',
      grep: 'search inside files', find: 'find a file by name', open: 'open an external link',
      uname: 'kernel info', hostname: 'host name', id: 'who you are',
      df: 'disk usage', free: 'memory usage', w: 'who is logged in',
      systemctl: 'service status', ping: 'reach a host',
      neofetch: 'system card', banner: 'ascii banner', uptime: 'a small note',
      date: 'current date and time', echo: 'print text back', history: 'commands you ran',
      man: 'explain a command', theme: 'dark / light / auto', lang: 'switch EN / PL',
      clear: 'clear the screen', help: 'this list',
    },
    pl: {
      whoami: 'krótkie intro', about: 'o mnie', projects: 'lista projektów',
      harbor: 'otwórz Harbor', robust: 'wykrywanie spamu (praca)', advokat: 'aplikacja kancelarii + PWA',
      nocleg: 'strona w FastAPI', zabbix: 'projekt: monitoring', umami: 'projekt: analityka www',
      skills: 'mapa umiejętności', htop: 'umiejętności jako procesy',
      education: 'wykształcenie', books: 'lista lektur', goals: 'kierunek rozwoju', contact: 'linki i e-mail',
      ls: 'lista plików (-l, -a)', cd: 'zmień katalog', pwd: 'pokaż bieżący katalog',
      tree: 'drzewo plików', cat: 'wypisz plik',
      head: 'pierwsze linie pliku', tail: 'ostatnie linie pliku',
      grep: 'szukaj w plikach', find: 'znajdź plik po nazwie', open: 'otwórz link zewnętrzny',
      uname: 'informacje o jądrze', hostname: 'nazwa hosta', id: 'kim jesteś',
      df: 'zajętość dysku', free: 'zużycie pamięci', w: 'kto jest zalogowany',
      systemctl: 'status usług', ping: 'sprawdź host',
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

  /* Dark is the default — see js/theme.js, which applies it before first paint.
     'auto' is opt-in and is the only value that defers to the system. */
  var DEFAULT_THEME = 'dark';
  var THEME_COLOR = { light: '#f3f1ec', dark: '#1b1e28' };
  var themeColorMeta = document.getElementById('theme-color');

  function activeTheme() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    return prefersDark.matches ? 'dark' : 'light';   // only reached in 'auto'
  }
  function syncThemeColor() {
    if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLOR[activeTheme()]);
  }
  function setTheme(mode) {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    save(KEY.theme, mode);
    syncThemeColor();
  }
  /* theme.js already set the attribute; only an explicit 'auto' clears it */
  if (load(KEY.theme, DEFAULT_THEME) === 'auto') root.removeAttribute('data-theme');
  syncThemeColor();

  /* =====================================================================
     4. virtual filesystem
     ===================================================================== */

  var HOME = '/home/pawel';

  /* Files carry the name of the renderer that prints them, so `cat about.md`
     and the `about` command cannot drift apart. `size` feeds `ls -l`; names
     starting with a dot stay hidden until `ls -a`. */
  var TREE = {
    type: 'dir',
    children: {
      'about.md': { type: 'file', render: 'about', size: 512 },
      'skills.txt': { type: 'file', render: 'skills', size: 486 },
      'education.txt': { type: 'file', render: 'education', size: 208 },
      'books.txt': { type: 'file', render: 'books', size: 264 },
      'goals.txt': { type: 'file', render: 'goals', size: 214 },
      'contact.txt': { type: 'file', render: 'contact', size: 342 },
      'projects': {
        type: 'dir',
        children: {
          'harbor.md': { type: 'file', render: 'harbor', size: 2048 },
          'robust.md': { type: 'file', render: 'robust', size: 2048 },
          'advokat-varshava.md': { type: 'file', render: 'advokat', size: 1024 },
          'noclegwsopocie.md': { type: 'file', render: 'nocleg', size: 384 },
          'zabbix.md': { type: 'file', render: 'zabbix', size: 420 },
          'umami.md': { type: 'file', render: 'umami', size: 386 },
        },
      },
      'scripts': {
        type: 'dir',
        children: {
          'redis-check.sh': { type: 'file', render: 'redisCheck', size: 1337 },
          'calve.sh': { type: 'file', render: 'calve', size: 2048 },
          'casearch.sh': { type: 'file', render: 'casearch', size: 512 },
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
  function childNames(node, withHidden) {
    if (!node || node.type !== 'dir') return [];
    return Object.keys(node.children).filter(function (name) {
      return withHidden || name.charAt(0) !== '.';         // dotfiles need -a
    }).sort(function (a, b) {
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
    'motd': 'banner', 'logo': 'banner', 'fetch': 'neofetch', 'who': 'w',
    'language': 'lang', 'colour': 'theme', 'color': 'theme', 'dark': 'theme', 'light': 'theme',
    'quit': 'exit', 'logout': 'exit', 'q': 'exit', 'man': 'man', 'search': 'grep',
    'noclegwsopocie': 'nocleg', 'reading': 'books',
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
        ln(t('aboutWork'), { mt: 8 }),
        ln(t('aboutEdu'), { cls: 't-dim', mt: 4 }),
        ln(t('aboutMain'), { mt: 8 }),
      ];
    },
    projects: function () {
      return [
        ln('projects/', { cls: 't-blue t-bold' }),
        grid(t('projectsRows'), { mt: 4, keyCls: 't-green' }),
        ln(t('projectsHint'), { cls: 't-dim', mt: 8 }),
      ];
    },
    harbor: function () {
      return [
        ln('# Harbor', { cls: 't-green t-bold' }),
        ln(t('harborLead'), { mt: 4 }),
        ln(t('harborGoal'), { cls: 't-dim' }),
        ln(t('harborStackHead'), { cls: 't-blue t-bold', mt: 8 }),
        grid(t('harborStack'), { mt: 2, keyCls: 't-green' }),
        ln(t('harborStagesHead'), { cls: 't-blue t-bold', mt: 8 }),
        grid(t('harborStages'), { mt: 2, keyCls: 't-amber' }),
        ln(t('harborWhy'), { cls: 't-dim', mt: 8 }),
        ln(t('harborStatus'), { cls: 't-amber', mt: 8 }),
      ];
    },
    robust: function () {
      var out = [
        ln('# Robust', { cls: 't-green t-bold' }),
        ln(t('robustLead'), { mt: 4 }),
        ln(t('robustNoBlock'), { cls: 't-dim' }),
        ln(t('robustPipe'), { mt: 8 }),
        ln(t('robustSignals'), { cls: 't-dim', mt: 4 }),
        ln(t('robustReport'), { cls: 't-dim' }),
        ln(t('robustRule'), { cls: 't-dim' }),
        ln(t('robustStack'), { cls: 't-dim' }),
        ln(t('exampleHead'), { cls: 't-dim', mt: 8 }),
      ];
      t('robustSample').forEach(function (l, i) {
        out.push(ln(l, { cls: 't-faint', mt: i === 0 ? 4 : 0 }));
      });
      out.push(ln(t('robustStatus'), { cls: 't-amber', mt: 8 }));
      return out;
    },
    advokat: function () {
      var out = [
        ln('# advokat-varshava.pl', { cls: 't-green t-bold' }),
        ln(t('advokatLead'), { mt: 4 }),
        ln(t('advokatBody'), { cls: 't-dim', mt: 8 }),
        ln(t('advokatCrmHead'), { mt: 8 }),
      ];
      t('advokatCrm').forEach(function (l, i) {
        out.push(ln('• ' + l, { cls: 't-dim', mt: i === 0 ? 4 : 0 }));
      });
      out.push(parts([tx('→ ', 't-dim'), link('advokat-varshava.pl', 'https://advokat-varshava.pl')], { mt: 8 }));
      return out;
    },
    zabbix: function () {
      return [
        ln('# Zabbix', { cls: 't-green t-bold' }),
        ln(t('zabbixLead'), { mt: 4 }),
        ln(t('zabbixBody'), { cls: 't-dim', mt: 8 }),
      ];
    },
    umami: function () {
      return [
        ln('# Umami', { cls: 't-green t-bold' }),
        ln(t('umamiLead'), { mt: 4 }),
        ln(t('umamiBody'), { cls: 't-dim', mt: 8 }),
      ];
    },
    nocleg: function () {
      return [
        ln('# noclegwsopocie.pl', { cls: 't-green t-bold' }),
        ln(t('noclegLead'), { mt: 4 }),
        ln(t('noclegBody'), { cls: 't-dim', mt: 8 }),
        parts([tx('→ ', 't-dim'), link('noclegwsopocie.pl', 'https://noclegwsopocie.pl')], { mt: 8 }),
      ];
    },
    redisCheck: function () {
      var out = [
        ln('#!/usr/bin/env bash', { cls: 't-faint' }),
        ln(t('redisLead'), { cls: 't-green t-bold', mt: 4 }),
      ];
      t('redisSteps').forEach(function (l, i) {
        out.push(ln((i + 1) + '. ' + l, { cls: 't-dim', mt: i === 0 ? 4 : 0 }));
      });
      out.push(ln(t('redisUsage'), { cls: 't-dim', mt: 8 }));
      return out;
    },
    calve: function () {
      var out = [
        ln('#!/usr/bin/env bash', { cls: 't-faint' }),
        ln(t('calveLead'), { cls: 't-green t-bold', mt: 4 }),
        ln(t('calveBody'), { mt: 4 }),
        ln(t('calveWhen'), { cls: 't-dim', mt: 4 }),
        ln(t('calveUsage'), { cls: 't-dim', mt: 8 }),
        ln(t('exampleHead'), { cls: 't-dim', mt: 8 }),
      ];
      t('calveSample').forEach(function (l, i) {
        out.push(ln(l, { cls: 't-faint', mt: i === 0 ? 4 : 0 }));
      });
      return out;
    },
    casearch: function () {
      return [
        ln('#!/usr/bin/env bash', { cls: 't-faint' }),
        ln(t('casearchLead'), { cls: 't-green t-bold', mt: 4 }),
        ln(t('casearchUsage'), { cls: 't-dim', mt: 8 }),
      ];
    },
    skills: function () {
      var g = grid(t('skillsRows'), { mt: 4, keyCls: 't-green' });
      /* the last row is the forward-looking one — mark it amber */
      var vals = g.querySelectorAll('.grid-v');
      if (vals.length) vals[vals.length - 1].classList.add('t-amber');
      return [
        ln('skills.txt', { cls: 't-blue t-bold' }),
        g,
        ln(t('skillsHint'), { cls: 't-dim', mt: 8 }),
      ];
    },
    education: function () {
      return [
        ln('education.txt', { cls: 't-blue t-bold' }),
        ln(t('eduDegree'), { mt: 4 }),
        ln(t('eduField')),
        ln(t('eduSpec'), { cls: 't-dim' }),
        ln(t('eduSchool'), { cls: 't-dim' }),
        ln(t('eduNext'), { cls: 't-amber', mt: 8 }),
        ln(t('eduNextSchool'), { cls: 't-dim' }),
      ];
    },
    books: function () {
      return [
        ln('books.txt', { cls: 't-blue t-bold' }),
        grid(t('booksRows'), { mt: 4, keyCls: 't-green' }),
      ];
    },
    goals: function () {
      return [
        ln('goals.txt', { cls: 't-blue t-bold' }),
        ln(t('goalsNow'), { cls: 't-green', mt: 4 }),
        ln(t('goalsNext'), { cls: 't-amber' }),
        ln(t('goalsLater'), { cls: 't-blue' }),
        ln(t('goalsNote'), { cls: 't-dim', mt: 8 }),
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
        ln(t('contactHint'), { cls: 't-dim', mt: 8 }),
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

  /* --- small command plumbing ------------------------------------------ */

  /* "-la" and "-l -a" both land in { flags: { l, a }, rest: [paths…] };
     unknown letters are accepted and ignored, like a forgiving shell. */
  function splitFlags(args) {
    var flags = {}, rest = [];
    args.forEach(function (a) {
      if (/^-[A-Za-z]+$/.test(a)) a.slice(1).split('').forEach(function (c) { flags[c] = true; });
      else rest.push(a);
    });
    return { flags: flags, rest: rest };
  }

  var LS_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function lsStamp() {
    var d = new Date();
    return LS_MONTHS[d.getMonth()] + ' ' + String(d.getDate()).padStart(2, ' ') + ' 09:41';
  }

  function lsCls(name, isDir) {
    return isDir ? 't-blue' : /\.sh$/.test(name) ? 't-green' : '';
  }

  /* one row of `ls -l`; node is null for the '.' / '..' pseudo entries */
  function longLine(node, name) {
    var isDir = !node || node.type === 'dir';
    var perms = isDir ? 'drwxr-xr-x' : /\.sh$/.test(name) ? '-rwxr-xr-x' : '-rw-r--r--';
    var size = isDir ? 4096 : node.size || 640;
    var meta = perms + '  pawel pawel ' + String(size).padStart(5, ' ') + ' ' + lsStamp() + ' ';
    return parts([tx(meta, 't-dim'), tx(name + (isDir && name.charAt(0) !== '.' ? '/' : ''), lsCls(name, isDir))]);
  }

  function headTail(args, fromEnd) {
    var n = 10, path = null, label = fromEnd ? 'tail' : 'head';
    for (var i = 0; i < args.length; i++) {
      var a = args[i], m;
      if (a === '-n' && args[i + 1]) n = parseInt(args[++i], 10) || n;
      else if ((m = a.match(/^-n?(\d+)$/))) n = parseInt(m[1], 10) || n;
      else if (a.charAt(0) === '-') { /* ignore other flags */ }
      else if (!path) path = a;
    }
    if (!path) return [ln(t(fromEnd ? 'tailUsage' : 'headUsage'), { cls: 't-dim' })];
    var target = resolvePath(path);
    if (!target || !target.node) return [ln(label + ': ' + path + ': ' + t('catNoFile'), { cls: 't-amber' })];
    if (target.node.type === 'dir') return [ln(label + ': ' + path + ': ' + t('catIsDir'), { cls: 't-amber' })];
    var lines = fileText(target.node.render);
    return (fromEnd ? lines.slice(-n) : lines.slice(0, n)).map(function (text) { return ln(text); });
  }

  /* easter eggs share one shape: a single translated line */
  function saysT(key, cls) {
    return { run: function () { return [ln(t(key), { cls: cls || 't-dim' })]; } };
  }

  var COMMANDS = {
    /* --- content ---------------------------------------------------- */
    whoami: { run: function () { return [ln(t('whoami'))]; } },
    about: { run: RENDER.about },
    projects: { run: RENDER.projects },
    harbor: { run: RENDER.harbor },
    robust: { run: RENDER.robust },
    advokat: { run: RENDER.advokat },
    nocleg: { run: RENDER.nocleg },
    zabbix: { run: RENDER.zabbix },
    umami: { run: RENDER.umami },
    skills: { run: RENDER.skills },
    education: { run: RENDER.education },
    books: { run: RENDER.books },
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

    /* --- system --------------------------------------------------------
       Real terminal output is English; only the human-facing bits translate. */
    uname: {
      usage: 'uname [-a]',
      run: function (args) {
        return [ln(splitFlags(args).flags.a
          ? 'Linux portfolio 6.1.0-portfolio #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'
          : 'Linux')];
      },
    },

    hostname: { run: function () { return [ln('portfolio.pawelrogoza.pl')]; } },

    id: {
      run: function () {
        return [
          ln('uid=1000(visitor) gid=1000(visitor) groups=1000(visitor)'),
          ln(t('idNote'), { cls: 't-dim', mt: 2 }),
        ];
      },
    },

    df: {
      usage: 'df [-h]',
      run: function () {
        return [
          ln('Filesystem      Size  Used Avail Use% Mounted on', { cls: 't-dim' }),
          ln('/dev/vda1        25G  8.1G   17G  33% /'),
          ln('/dev/vdb1        50G   19G   31G  38% /backup'),
          ln('tmpfs           2.0G     0  2.0G   0% /dev/shm'),
        ];
      },
    },

    free: {
      usage: 'free [-h]',
      run: function () {
        return [
          ln('               total        used        free   available', { cls: 't-dim' }),
          ln('Mem:            4096        1742        2354        2354'),
          ln('Swap:           1024           0        1024        1024'),
        ];
      },
    },

    w: {
      run: function () {
        var now = new Date().toTimeString().slice(0, 8);
        return [
          ln(' ' + now + ' up 27 years,  1 user,  load average: 0.42, 0.35, 0.30', { cls: 't-dim' }),
          ln('USER     TTY      FROM     LOGIN@   WHAT', { cls: 't-dim' }),
          ln('visitor  pts/0    web      now      ' + t('wWhat')),
        ];
      },
    },

    systemctl: {
      usage: 'systemctl [status]',
      run: function () {
        var out = [ln('UNIT'.padEnd(22, ' ') + 'ACTIVE  DESCRIPTION', { cls: 't-dim' })];
        t('sysctlRows').forEach(function (r) {
          out.push(parts([tx(r[0].padEnd(22, ' ')), tx('active  ', 't-green'), tx(r[1], 't-dim')]));
        });
        out.push(ln(t('sysctlFoot'), { cls: 't-faint', mt: 4 }));
        return out;
      },
    },

    ping: {
      usage: 'ping <host>',
      run: function (args) {
        var host = (splitFlags(args).rest[0] || 'harbor').replace(/^https?:\/\//, '');
        return [
          ln('PING ' + host + ' (10.13.37.7) 56(84) bytes of data.'),
          ln('64 bytes from ' + host + ': icmp_seq=1 ttl=64 time=0.42 ms'),
          ln('64 bytes from ' + host + ': icmp_seq=2 ttl=64 time=0.38 ms'),
          ln('64 bytes from ' + host + ': icmp_seq=3 ttl=64 time=0.45 ms'),
          ln('--- ' + host + ' ping statistics ---', { mt: 4 }),
          ln('3 packets transmitted, 3 received, 0% packet loss', { cls: 't-dim' }),
        ];
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
      usage: 'ls [-l] [-a] [path]',
      run: function (args) {
        var parsed = splitFlags(args);
        var arg0 = parsed.rest[0] || '.';
        var target = resolvePath(arg0);
        if (!target || !target.node) return [ln(t('cdNoDir') + ' ' + arg0, { cls: 't-amber' })];

        if (target.node.type !== 'dir') {
          var base = target.segments[target.segments.length - 1];
          return [parsed.flags.l ? longLine(target.node, base) : ln(base)];
        }

        var names = childNames(target.node, parsed.flags.a);
        var all = parsed.flags.a ? ['.', '..'].concat(names) : names;

        if (parsed.flags.l) {
          var out = [ln('total ' + all.length * 4, { cls: 't-faint' })];
          all.forEach(function (name) {
            out.push(longLine(name === '.' || name === '..' ? null : target.node.children[name], name));
          });
          return out;
        }

        if (!all.length) return [ln(t('lsEmpty'), { cls: 't-dim' })];
        var row = ln(null);
        all.forEach(function (name, i) {
          var child = target.node.children[name];
          var isDir = !child || child.type === 'dir';       // '.' / '..' count as dirs
          if (i) row.appendChild(tx('   '));
          row.appendChild(tx(name + (isDir && child ? '/' : ''), lsCls(name, isDir)));
        });
        return [row];
      },
    },

    head: { usage: 'head [-n N] <file>', run: function (args) { return headTail(args, false); } },
    tail: { usage: 'tail [-n N] <file>', run: function (args) { return headTail(args, true); } },

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
        var groups = [
          ['helpSecContent', ['whoami', 'about', 'projects', 'skills', 'htop', 'education', 'books', 'goals', 'contact']],
          ['helpSecFiles', ['ls', 'cd', 'pwd', 'tree', 'cat', 'head', 'tail', 'grep', 'find']],
          ['helpSecSystem', ['uname', 'hostname', 'id', 'uptime', 'date', 'df', 'free', 'w', 'systemctl', 'neofetch', 'banner']],
          ['helpSecShell', ['echo', 'history', 'man', 'open', 'theme', 'lang', 'clear', 'help']],
        ];
        var out = [ln(t('helpTitle'), { cls: 't-bold' })];
        groups.forEach(function (g) {
          out.push(ln(t(g[0]), { cls: 't-blue t-bold', mt: 8 }));
          out.push(grid(g[1].map(function (name) { return [name, desc(name)]; }), { mt: 2, keyCls: 't-green', valCls: 't-dim' }));
        });
        out.push(ln(t('helpMore'), { cls: 't-dim', mt: 8 }));
        out.push(ln(t('helpTip'), { cls: 't-green', mt: 2 }));
        return out;
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
    ssh: { run: function () { return [ln(t('ssh'), { cls: 't-amber' })]; } },
    exit: { run: function () { return [ln(t('exit'), { cls: 't-dim' })]; } },
    clear: { run: function () { return null; } },   // handled in exec()
  };

  /* easter eggs — the muscle-memory commands every admin types anyway */
  ['vim', 'vi', 'nano', 'emacs'].forEach(function (n) { COMMANDS[n] = saysT('editor'); });
  ['touch', 'mkdir', 'rm', 'rmdir', 'mv', 'cp', 'chmod', 'chown'].forEach(function (n) { COMMANDS[n] = saysT('rofs', 't-amber'); });
  ['wget', 'curl'].forEach(function (n) { COMMANDS[n] = saysT('net'); });
  ['apt', 'apt-get', 'dnf', 'yum'].forEach(function (n) { COMMANDS[n] = saysT('pkg'); });

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

  /* Output taller than the viewport used to land the reader on its last line.
     Park the prompt line of such a block at the top instead, so the visitor
     reads top-down; short output keeps the classic stick-to-bottom. */
  function scrollToBlock(block) {
    if (block.offsetHeight > output.clientHeight) {
      output.scrollTop = block.getBoundingClientRect().top
        - output.getBoundingClientRect().top + output.scrollTop;
    } else {
      scrollToBottom();
    }
  }

  /* Focusing the input jumps back to the prompt at the bottom — but not when
     the focus is a side effect of clicking around the transcript. */
  var quietFocus = false;
  function focusInputQuietly() {
    quietFocus = true;
    input.focus();
    quietFocus = false;
  }

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
    scrollToBlock(block);
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
    /* show the lay of the land right away — visitors should not have to ask */
    emit(COMMANDS.ls.run([]), 'ls');
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
    var line = raw.trim().replace(/\s+/g, ' ');
    if (!line) return;

    var tokens = line.split(' ');
    var name = tokens[0].toLowerCase();

    /* Conversational lead-in ("show me the projects") — stripped only when
       the first word is not already a command, so `open github` stays on the
       real `open` instead of losing its verb. */
    if (!COMMANDS[name] && !ALIAS[name]) {
      var stripped = line.replace(/^(please\s+)?(open|show|view|read|go\s+to|goto)\s+(me\s+)?(the\s+)?/i, '');
      if (stripped && stripped !== line) {
        line = stripped;
        tokens = line.split(' ');
        name = tokens[0].toLowerCase();
      }
    }

    var args = tokens.slice(1);
    var rest = line.slice(tokens[0].length).trim();

    /* `dark` / `light` are aliases of `theme` and carry their own argument */
    if ((name === 'dark' || name === 'light') && !args.length) args = [name];
    /* `ll` is the classic `ls -la` shorthand, not a plain rename */
    if (name === 'll') { name = 'ls'; args.unshift('-la'); }
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
    flushBoot();
    /* an empty Enter prints a bare prompt — breathing room, like a real shell */
    if (!raw || !raw.trim()) {
      emit([], '');
      input.value = '';
      syncField();
      return;
    }
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
  input.addEventListener('focus', function () {
    terminal.classList.add('focused');
    if (!quietFocus) scrollToBottom();
  });
  input.addEventListener('blur', function () { terminal.classList.remove('focused'); });

  input.addEventListener('keydown', function (e) {
    var ctrl = e.ctrlKey || e.metaKey;

    /* typing again means the visitor is done reading — rejoin the prompt */
    if (output.scrollTop + output.clientHeight < output.scrollHeight - 4) scrollToBottom();

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
    focusInputQuietly();      /* reading position must survive the click */
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
      if (load(KEY.theme, DEFAULT_THEME) !== 'auto') return;
      root.removeAttribute('data-theme');
      syncThemeColor();
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
      /* quiet — a chip may have just printed long output positioned at its top */
      focusInputQuietly();
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
