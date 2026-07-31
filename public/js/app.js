/* Portfolio â€” PaweÅ‚ RogoÅ¼a
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
    email: 'mailto:rogozapawel@proton.me',
  };
  var EMAIL = 'rogozapawel@proton.me';

  var startedAt = Date.now();

  /* =====================================================================
     2. i18n
     ===================================================================== */

  /* page chrome â€” keyed by [data-i18n] in index.html */
  var PAGE = {
    en: {
      title: 'PaweÅ‚ RogoÅ¼a â€” Hosting Tech Support â†’ SysOps',
      skipLink: 'Skip to the terminal',
      heroH1: "Hi, I'm PaweÅ‚ RogoÅ¼a.",
      heroSub: "I do tech support at cyberfolks.pl (hosting) and I'm growing toward SysOps / Linux administration. After hours I run Harbor â€” a self-hosted VPS â€” plus monitoring, analytics and the small tools that keep servers healthy.",
      navAbout: 'About', navProjects: 'Projects', navSkills: 'Skills', navContact: 'Contact',
      ctaProjects: 'Browse projects', ctaContact: 'Get in touch',
      metaRoleLabel: 'Role', metaRoleValue: 'Tech support (hosting)',
      metaFocusLabel: 'Focus', metaFocusValue: 'Hosting ops Â· side projects',
      metaNextLabel: 'Heading for', metaNextValue: 'SysOps / Linux admin',
      metaBasedLabel: 'Based in', metaBasedValue: 'GdaÅ„sk, Poland',
      expand: 'expand', minimize: 'minimize',
      inputLabel: 'Terminal command',
      inputPlaceholder: 'type a commandâ€¦',
      themeToggle: 'Switch between light and dark theme',
      hintTab: 'completes', hintHistory: 'history', hintClear: 'clear',
      footBuilt: 'Static site â€” HTML, CSS and vanilla JS. No build step, no dependencies.',
    },
    pl: {
      title: 'PaweÅ‚ RogoÅ¼a â€” wsparcie techniczne hostingu â†’ SysOps',
      skipLink: 'PrzejdÅº do terminala',
      heroH1: 'CzeÅ›Ä‡, jestem PaweÅ‚ RogoÅ¼a.',
      heroSub: 'PracujÄ™ we wsparciu technicznym cyberfolks.pl (hosting) i rozwijam siÄ™ w stronÄ™ SysOps / administracji Linuksem. Po godzinach utrzymujÄ™ Harbor â€” wÅ‚asny VPS â€” a do tego monitoring, analitykÄ™ i maÅ‚e narzÄ™dzia, ktÃ³re dbajÄ… o zdrowie serwerÃ³w.',
      navAbout: 'O mnie', navProjects: 'Projekty', navSkills: 'UmiejÄ™tnoÅ›ci', navContact: 'Kontakt',
      ctaProjects: 'Zobacz projekty', ctaContact: 'Kontakt',
      metaRoleLabel: 'Rola', metaRoleValue: 'Wsparcie techniczne (hosting)',
      metaFocusLabel: 'Skupienie', metaFocusValue: 'Hosting Â· projekty po godzinach',
      metaNextLabel: 'Kierunek', metaNextValue: 'SysOps / administracja Linuksem',
      metaBasedLabel: 'Miejsce', metaBasedValue: 'GdaÅ„sk, Polska',
      expand: 'peÅ‚ny ekran', minimize: 'zmniejsz',
      inputLabel: 'Komenda terminala',
      inputPlaceholder: 'wpisz komendÄ™â€¦',
      themeToggle: 'PrzeÅ‚Ä…cz motyw jasny / ciemny',
      hintTab: 'uzupeÅ‚nia', hintHistory: 'historia', hintClear: 'czyÅ›ci',
      footBuilt: 'Strona statyczna â€” HTML, CSS i czysty JS. Bez build stepu i bez zaleÅ¼noÅ›ci.',
    },
  };

  /* terminal content */
  var TERM = {
    en: {
      welcomeHi: 'Hi, type a command, hit Tab, or click a button.',
      welcomeTry: 'Try: ls -la Â· projects Â· skills Â· htop Â· help',

      whoami: 'pawel â€” tech support at cyber_Folks (since 03.2024), cyber_Admin Ambassador in the CST team (since 10.2025). Growing toward SysOps / Linux administration.',

      aboutRole: 'Tech support at cyber_Folks (since 03.2024) Â· cyber_Admin Ambassador in the CST team (since 10.2025).',
      aboutHeading: 'Growing toward SysOps / Linux administration.',
      aboutWork: 'Day to day: diagnosing DNS, mail (Exim, SPF/DKIM/DMARC), web and security issues; working with root privileges on DirectAdmin servers (backup restores via rsync, systemd). I also run internal cyber_Admin trainings.',
      aboutEdu: 'From 10.2026: postgraduate studies in cybersecurity (Polish Naval Academy in Gdynia).',
      aboutMain: 'After hours: Harbor (self-hosted VPS) and the projects running on it â€” see projects/.',

      projectsRows: [
        ['harbor.md', 'own hosting infrastructure on a VPS (web + mail)'],
        ['robust.md', 'work Â· Exim log analysis, spam detection (cyber_Folks)'],
        ['advokat-varshava.md', 'law-firm web app + PWA, hosted on Harbor'],
        ['noclegwsopocie.md', 'Python/FastAPI website, hosted on Harbor'],
        ['zabbix.md', 'monitoring for my servers'],
        ['umami.md', 'self-hosted web analytics'],
      ],
      projectsHint: "â†’ 'cat projects/<file>' opens a write-up Â· work scripts: 'ls ~/scripts'",

      harborLead: 'My own hosting infrastructure (web + mail), built from scratch on a VPS.',
      harborGoal: 'Part study, part business: I learn server administration on real services, host a few small web projects on the side, and write every decision down as open knowledge.',
      harborStackHead: 'stack:',
      harborStack: [
        ['os', 'AlmaLinux 10 Â· Hetzner Cloud (Falkenstein)'],
        ['web', 'nginx 1.26.3 built from source + Apache backend + PHP-FPM'],
        ['app', 'Python / FastAPI + Uvicorn over unix sockets (multi-tenant)'],
        ['db', 'MariaDB + SQLite'],
        ['cache', 'Redis + nginx FastCGI cache'],
        ['security', 'firewalld Â· fail2ban Â· ModSecurity v3 + OWASP CRS v4'],
        ['monitoring', 'Zabbix Â· Netdata'],
        ['analytics', 'Umami'],
        ['backup', 'restic â†’ Hetzner'],
        ['mail', 'Postfix + Dovecot + Rspamd (planned)'],
        ['iac', 'Ansible (planned)'],
      ],
      harborStagesHead: 'stages:',
      harborStages: [
        ['done', 'hardening & setup Â· web stack Â· SSL + WordPress Â· FastAPI isolation Â· L7 security Â· monitoring'],
        ['wip', 'client separation (PHP / MariaDB)'],
        ['next', 'backups Â· mail server Â· Ansible'],
      ],
      harborWhy: 'Why it exists: real services, real failures, real fixes â€” the parts a tutorial skips.',
      harborStatus: 'status: in active development Â· MIT license (notes and example configs â€” help yourself)',

      robustLead: 'Analyzes Exim logs and points at accounts that are likely sending spam.',
      robustNoBlock: 'It builds a report for manual review â€” it never blocks anything or changes server config.',
      robustPipe: 'pipeline: fetch logs (SSH) â†’ parse Exim â†’ JSONL â†’ aggregate by queue_id â†’ SMTP & PHP scoring â†’ verdicts â†’ Top N report',
      robustSignals: 'signals: volume & rate spikes Â· recipient patterns Â· spam-like subjects Â· reputation blocks & bounces Â· IP-prefix spread (/24, /64) Â· GeoIP',
      robustReport: 'report: HIGH / MID / LOW priorities, evidence-first cards, text + JSON output',
      robustRule: 'no single weak signal gives HIGH â€” a verdict combines independent evidence.',
      robustStack: 'stack: Bash + Python 3, run from a gateway over SSH',
      robustSample: [
        '$ ./spamhunt.sh s26',
        'ROBUST | s26 | last 72h',
        'HIGH: 3 | MID: 11 | LOW: 176',
        '1. [HIGH] account@domain.pl Â· SMTP',
        '   EVIDENCE: 410/11912 blocked as spam (3%)',
        '   PATTERN: 11912 sends Â· 3680 IP prefixes Â· generated list Â· slow-drip',
      ],
      robustStatus: 'status: written for my team at cyber_Folks Â· now developed together with the Development Department',

      advokatLead: 'Web application + PWA for a law firm.',
      advokatBody: 'Leads, documents, clients and finances in one place â€” around 50â€“60 users a day. Hosted on Harbor.',
      advokatCrmHead: 'the app:',
      advokatCrm: [
        'collects leads from the site in real time',
        'built-in document editing',
        'client and case records',
        'finance module',
        'installs on the phone as a PWA',
      ],

      zabbixLead: 'Monitoring for my servers.',
      zabbixBody: 'Hosts, services, triggers and alerts â€” Zabbix keeps an eye on Harbor and the rest of my infrastructure.',

      umamiLead: 'Self-hosted, privacy-friendly web analytics.',
      umamiBody: 'Traffic stats for my sites without handing visitor data to third parties.',

      noclegLead: 'noclegwsopocie.pl â€” a website built with Python / FastAPI.',
      noclegBody: 'Runs on Harbor, my self-hosted VPS.',

      redisLead: 'redis-check.sh â€” Redis diagnostics helper, used by the CST team.',
      redisSteps: [
        'checks that the user exists on the server',
        "verifies the user's Redis processes are alive",
        'if not: sudo lx_redis_manage reset_redis <user> â€” the most common fix',
      ],
      redisUsage: 'usage: redis-check.sh <directadmin-user>',

      calveLead: 'calve.sh â€” CloudLinux limit usage analysis, used by the CST team.',
      calveBody: "Snapshots a user's LVE usage on a www-cl-X server â€” CPU, RAM, processes (EP) and IOPS â€” through the day, at a chosen interval.",
      calveWhen: 'use case: a client reports a slow site â†’ see if and when the limits saturate, then read the logs from that window.',
      calveUsage: 'usage: calve <www-server> <user> [date] [interval-min]',
      calveSample: [
        '$ calve www-cl-1 zielonapaczka 2026-07-30 10',
        '09:00  CPU  38%   RAM 512M/1024M   EP  7/20   IOPS 122',
        '09:10  CPU  97%   RAM 940M/1024M   EP 19/20   IOPS 610',
        '09:20  CPU 100%   RAM 989M/1024M   EP 20/20   IOPS 655   <- saturation',
      ],

      casearchLead: 'casearch.sh â€” finds a hosting client by domain, login or hosting id.',
      casearchUsage: 'usage: casearch <domain|login|hosting-id>',

      exampleHead: 'example:',

      skillsRows: [
        ['Linux', 'AlmaLinux Â· CloudLinux Â· bash Â· systemd Â· rsync'],
        ['Web', 'nginx Â· Apache Â· PHP-FPM'],
        ['Data', 'MariaDB/MySQL Â· Redis'],
        ['Mail & DNS', 'Exim Â· DNS Â· SPF/DKIM/DMARC'],
        ['Security', 'firewalld Â· fail2ban Â· ModSecurity'],
        ['Ops', 'Zabbix Â· restic'],
        ['Scripting', 'Python (FastAPI) Â· bash Â· Git'],
        ['Panels', 'DirectAdmin Â· cyber_Admin'],
        ['Next', 'SysOps / Linux administration'],
      ],
      skillsHint: "â†’ try 'htop' for the same thing as processes.",

      htopHead: ['PID', 'AREA', 'LOAD', 'STATUS'],
      htopRows: [
        [101, 'tech-support', 'day job', 't-green', 88],
        [102, 'linux', 'actively learning', 't-green', 78],
        [103, 'harbor', 'active project', 't-green', 84],
        [104, 'robust', 'work project', 't-amber', 70],
        [105, 'monitoring', 'zabbix Â· umami', 't-amber', 52],
        [106, 'automation', 'bash Â· python', 't-amber', 46],
        [107, 'sysops', 'next step', 't-blue', 35],
      ],
      htopFoot: 'Load is a metaphor, not a metric â€” it is where my attention goes.',

      eduDegree: 'Bachelor of Science',
      eduField: 'Informatics & Econometrics',
      eduSpec: 'specialization: IT Applications in Business',
      eduSchool: 'University of GdaÅ„sk Â· 2019â€“2022',
      eduNext: 'From 10.2026: postgraduate studies â€” Cybersecurity',
      eduNextSchool: 'Polish Naval Academy in Gdynia',

      booksRows: [
        ['read', 'â€œHow Linux Worksâ€ â€” Brian Ward'],
        ['reading', 'â€œUNIX and Linux System Administration Handbookâ€ â€” Nemeth et al.'],
        ['up next', 'â€œSystems Performance: Enterprise and the Cloudâ€ â€” Brendan Gregg'],
      ],

      goalsNow: 'now    â†’  tech support (hosting, cyber_Folks)',
      goalsNext: 'next   â†’  SysOps / Linux administration',
      goalsLater: 'later  â†’  automation, monitoring, infrastructure at scale',
      goalsNote: 'Honest, incremental, hands-on.',

      contactLead: 'The fastest way to reach me is email.',
      contactHint: "â†’ 'open github' opens a link in a new tab.",

      uptime: '27 years online â€” tech support by day, SysOps in the making.',

      helpTitle: 'Commands',
      helpTip: 'Tab completes Â· â†‘ / â†“ recalls Â· Ctrl+L clears Â· Esc leaves fullscreen.',
      helpMore: "â†’ 'man <command>' explains a single command.",
      helpSecContent: 'content', helpSecFiles: 'files',
      helpSecSystem: 'system', helpSecShell: 'shell',

      lsEmpty: 'directory is empty',
      headUsage: 'usage: head [-n N] <file>',
      tailUsage: 'usage: tail [-n N] <file>',
      idNote: "not in the sudo group â€” see 'sudo'.",
      wWhat: 'reading the portfolio',
      sysctlRows: [
        ['nginx.service', 'serves this portfolio'],
        ['postfix.service', 'mail â€” harbor'],
        ['mariadb.service', 'databases â€” harbor'],
        ['zabbix-agent.service', 'monitoring â€” zabbix'],
        ['umami.service', 'web analytics â€” umami'],
        ['redis-watch.timer', 'redis-check.sh for DirectAdmin users'],
      ],
      sysctlFoot: 'all units green â€” as it should be.',
      rofs: 'read-only filesystem â€” nothing to change here.',
      editor: "no $EDITOR in this shell â€” the files are read-only. try 'cat <file>'.",
      net: "outbound network is disabled in this shell â€” 'open github' works, though.",
      pkg: 'no package manager needed â€” this site has zero dependencies.',
      ssh: 'visitor@harbor: Permission denied (publickey) â€” harbor only talks to me.',
      grepUsage: 'usage: grep <pattern> [path]',
      grepNone: 'no matches',
      grepIn: 'searched',
      findUsage: 'usage: find <name>',
      findNone: 'nothing found',
      manUsage: 'usage: man <×Î¸ÒÚ$z{-®éÜj×Ò3°Ğ¢f"6VVâÒ·Ó°Ğ¢f÷"‡f"’Ò²’Âv÷&BæÆVæwFƒ²’²²’°Ğ¢f"6‚Òv÷&Bæ6†$B†’“°Ğ¢–b‚6VVå¶6…Ò’²6VVå¶6…ÒÒG'VS²–b†2æ–æFW„öb†6‚’ÓÒÓ’66÷&R³Òã#²ĞĞ¢ĞĞ¢&WGW&â²3¢2Â66÷&S¢66÷&RÓ°Ğ¢Ò’ç6÷'B†gVæ7F–öâ†Â"’²&WGW&â"ç66÷&RÒç66÷&S²Ò“°Ğ Ğ¢f"F÷Ò66÷&VBæf–ÇFW"†gVæ7F–öâ‡‚’²&WGW&â‚ç66÷&Râãc²Ò’ç6Æ–6RƒÂ2Ğ¢æÖ†gVæ7F–öâ‡‚’²&WGW&â‚æ3²Ò“°Ğ¢&WGW&âF÷æÆVæwF‚òF÷¢²v†&&÷"rÂw6¶–ÆÇ2rÂv6öçF7BuÓ°Ğ¢ĞĞ Ğ¢gVæ7F–öâVæ¶æ÷vâ‡v÷&B’°Ğ¢f"w&ÒÆâ†çVÆÂÂ²6Ç3¢wBÖF–ÒrÂ×C¢BÒ“°Ğ¢w&æVæD6†–ÆB†Fö7VÖVçBæ7&VFUFW‡DæöFR‡B‚wVæ¶æ÷väF–Br’’“°Ğ¢7VvvW7B‡v÷&B’æf÷$V6‚†gVæ7F–öâ‡2’°Ğ¢f""ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚v'WGFöâr“°Ğ¢"çG—RÒv'WGFöâs°Ğ¢"æ6Æ74æÖRÒwFW&Ò×7VvvW7F–öâs°Ğ¢"çFW‡D6öçFVçBÒ3°Ğ¢"æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²'Vâ‡2“²Ò“°Ğ¢w&æVæD6†–ÆB†"“°Ğ¢Ò“°Ğ¢w&æVæD6†–ÆB†Fö7VÖVçBæ7&VFUFW‡DæöFR‚sòr’“°Ğ¢&WGW&â°Ğ¢Æâ‡B‚wVæ¶æ÷vä6ÖBr’Â²6Ç3¢wBÖÖ&W"rÒ’ÀĞ¢w&ÀĞ¢Æâ‡B‚wVæ¶æ÷vä†VÇr’Â²6Ç3¢wBÖF–ÒrÂ×C¢BÒ’ÀĞ¢Ó°Ğ¢ĞĞ Ğ¢gVæ7F–öâW†V2‡&r’°¢f"Æ–æRÒ&rçG&–Ò‚’ç&WÆ6R‚õÇ2²örÂrr“°¢–b‚Æ–æR’&WGW&ã° ¢ò¢†&ÖÆW72f—'7BÖÆöBV7FW"Vvs¢—BöæÇ’Æöö·2Æ–¶RF†R–æfÖ÷W0¢6öÖÖæBâ¶VW–ær—B†W&R†&Vf÷&Ræ÷&ÖÂ6öÖÖæBF—7F6‚’ÖVç27VFğ¢6öçF–çVW2Fò&V†fRæ÷&ÖÆÇ’f÷"WfW'’÷F†W"&wVÖVçBâ¢ğ¢–b†Æ–æRÓÓÒw7VFò&Ò×&bòr’°¢VÖ—B…¶Æâ‚t÷7¦ÆX&\Y³òæ–RW7Wv¢¬I—§–¶g&æ7W6¶–Vvò¢7—7FV×RrÂ²6Ç3¢wBÖÖ&W"rÒ•ÒÂ&r“°¢&WGW&ã°¢Ğ ¢f"Fö¶Vç2ÒÆ–æRç7Æ—B‚rr“°¢f"æÖRÒFö¶Vç5³ÒçFôÆ÷vW$66R‚“°Ğ Ğ¢ò¢6öçfW'6F–öæÂÆVBÖ–â‚'6†÷rÖRF†R&ö¦V7G2"’(	B7G&—VBöæÇ’v†VàĞ¢F†Rf—'7Bv÷&B—2æ÷BÇ&VG’6öÖÖæBÂ6ò÷Vâv—F‡V&7F—2öâF†PĞ¢&VÂ÷Væ–ç7FVBöbÆ÷6–ær—G2fW&"â¢ğĞ¢–b‚4ôÔÔäE5¶æÖUÒbbÄ”5¶æÖUÒ’°Ğ¢f"7G&—VBÒÆ–æRç&WÆ6R‚õâ‡ÆV6UÇ2²“ò†÷VçÇ6†÷wÇf–WwÇ&VGÆvõÇ2·F÷Æv÷Fò•Ç2²†ÖUÇ2²“ò‡F†UÇ2²“òö’Ârr“°Ğ¢–b‡7G&—VBbb7G&—VBÓÒÆ–æR’°Ğ¢Æ–æRÒ7G&—VC°Ğ¢Fö¶Vç2ÒÆ–æRç7Æ—B‚rr“°Ğ¢æÖRÒFö¶Vç5³ÒçFôÆ÷vW$66R‚“°Ğ¢ĞĞ¢ĞĞ Ğ¢f"&w2ÒFö¶Vç2ç6Æ–6Rƒ“°Ğ¢f"&W7BÒÆ–æRç6Æ–6R‡Fö¶Vç5³ÒæÆVæwF‚’çG&–Ò‚“°Ğ Ğ¢ò¢F&¶òÆ–v‡F&RÆ–6W2öbF†VÖVæB6''’F†V—"÷vâ&wVÖVçB¢ğĞ¢–b‚†æÖRÓÓÒvF&²rÇÂæÖRÓÓÒvÆ–v‡Br’bb&w2æÆVæwF‚’&w2Ò¶æÖUÓ°Ğ¢ò¢ÆÆ—2F†R6Æ76–2Ç2ÖÆ6†÷'F†æBÂæ÷BÆ–â&VæÖR¢ğĞ¢–b†æÖRÓÓÒvÆÂr’²æÖRÒvÇ2s²&w2çVç6†–gB‚rÖÆr“²ĞĞ¢–b„Ä”5¶æÖUÒ’æÖRÒÄ”5¶æÖUÓ°Ğ Ğ¢–b†æÖRÓÓÒv6ÆV"r’²6ÆV%67&VVâ‚“²&WGW&ã²ĞĞ Ğ¢f"6ÖBÒ4ôÔÔäE5¶æÖUÓ°Ğ¢–b†6ÖB’°Ğ¢f"7G‚Ò²&W7C¢&W7BÂ&s¢&rÂæÖS¢æÖRÓ°Ğ¢–b†6ÖBç6–ÆVçB’6ÖBç'Vâ†&w2Â7G‚“°Ğ¢VÇ6RVÖ—B†6ÖBç'Vâ†&w2Â7G‚’Â&r“°Ğ¢&WGW&ã°Ğ¢ĞĞ Ğ¢ò¢æ÷B6öÖÖæB(	BÖ–&R—B—2F‚†WFö6Bò–×Æ–6—B6B’¢ğĞ¢f"F&vWBÒ&W6öÇfUF‚†Æ–æR“°Ğ¢–b‡F&vWBbbF&vWBææöFR’°Ğ¢–b‡F&vWBææöFRçG—RÓÓÒvF—"r’VÖ—B„4ôÔÔäE2æ6Bç'Vâ…¶Æ–æUÒÂ·Ò’Â&r“°Ğ¢VÇ6RVÖ—B„4ôÔÔäE2æ6Bç'Vâ…¶Æ–æUÒÂ·Ò’Â&r“°Ğ¢&WGW&ã°Ğ¢ĞĞ Ğ¢VÖ—B‡Væ¶æ÷vâ†æÖR’Â&r“°Ğ¢ĞĞ Ğ¢gVæ7F–öâ'Vâ‡&r’°Ğ¢ò¢âV×G’VçFW"&–çG2&&R&ö×B(	B'&VF†–ær&ööÒÂÆ–¶R&VÂ6†VÆÂ¢ğĞ¢–b‚&rÇÂ&rçG&–Ò‚’’°Ğ¢VÖ—B…µÒÂrr“°Ğ¢–çWBçfÇVRÒrs°Ğ¢7–æ4f–VÆB‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢f"VçG'’Ò&rçG&–Ò‚“°Ğ¢–b†6ÖDÆöu¶6ÖDÆöræÆVæwF‚ÒÒÓÒVçG'’’6ÖDÆörçW6‚†VçG'’“²òòæò6öç6V7WF—fRGWW0Ğ¢–b†6ÖDÆöræÆVæwF‚âc’6ÖDÆörÒ6ÖDÆörç6Æ–6R‚Óc“°Ğ¢†—7F÷'”–G‚Ò6ÖDÆöræÆVæwFƒ°Ğ¢6fR„´U’æ†—7F÷'’Â¥4ôâç7G&–æv–g’†6ÖDÆör’“°Ğ¢–çWBçfÇVRÒrs°Ğ¢7–æ4f–VÆB‚“°Ğ¢W†V2‡&r“°Ğ¢ĞĞ Ğ¢ò¢ÒÒÒ†—7F÷'’&V6ÆÂÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢gVæ7F–öâ&V6ÆÂ†F—"’°Ğ¢–b‚6ÖDÆöræÆVæwF‚’&WGW&ã°Ğ¢f"–G‚Ò†—7F÷'”–G‚²F—#°Ğ¢–b†–G‚Â’–G‚Ò°Ğ¢–b†–G‚ãÒ6ÖDÆöræÆVæwF‚’°Ğ¢†—7F÷'”–G‚Ò6ÖDÆöræÆVæwFƒ°Ğ¢–çWBçfÇVRÒrs°Ğ¢7–æ4f–VÆB‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢†—7F÷'”–G‚Ò–Gƒ°Ğ¢–çWBçfÇVRÒ6ÖDÆöu¶–G…Ó°Ğ¢7–æ4f–VÆB‚“°Ğ¢ò¢WBF†R6&WBBF†RVæBÂgFW"F†RfÇVR†2ÆæFVB¢ğĞ¢6WEF–ÖV÷WB†gVæ7F–öâ‚’²–çWBç6WE6VÆV7F–öå&ævR†–çWBçfÇVRæÆVæwF‚Â–çWBçfÇVRæÆVæwF‚“²ÒÂ“°Ğ¢ĞĞ Ğ¢ò¢ÒÒÒF"6ö×ÆWF–öâÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢gVæ7F–öâ6öÖÖöå&Vf—‚†Æ—7B’°Ğ¢–b‚Æ—7BæÆVæwF‚’&WGW&ârs°Ğ¢f"&Vf—‚ÒÆ—7E³Ó°Ğ¢Æ—7Bæf÷$V6‚†gVæ7F–öâ‡2’°Ğ¢v†–ÆR‡2æ–æFW„öb‡&Vf—‚’ÓÒ’&Vf—‚Ò&Vf—‚ç6Æ–6RƒÂÓ“°Ğ¢Ò“°Ğ¢&WGW&â&Vf—ƒ°Ğ¢ĞĞ Ğ¢gVæ7F–öâF„6æF–FFW2†g&vÖVçB’°Ğ¢f"6Æ6‚Òg&vÖVçBæÆ7D–æFW„öb‚ròr“°Ğ¢f"F—%'BÒ6Æ6‚ÓÓÒÓòrr¢g&vÖVçBç6Æ–6RƒÂ6Æ6‚²“°Ğ¢f"&6U'BÒ6Æ6‚ÓÓÒÓòg&vÖVçB¢g&vÖVçBç6Æ–6R‡6Æ6‚²“°Ğ¢f"F—"Ò&W6öÇfUF‚†F—%'BÇÂrâr“°Ğ¢–b‚F—"ÇÂF—"ææöFRÇÂF—"ææöFRçG—RÓÒvF—"r’&WGW&â²F—%'C¢F—%'BÂæÖW3¢µÒÓ°Ğ¢f"æÖW2Ò6†–ÆDæÖW2†F—"ææöFR’æf–ÇFW"†gVæ7F–öâ†â’°Ğ¢&WGW&ââçFôÆ÷vW$66R‚’æ–æFW„öb†&6U'BçFôÆ÷vW$66R‚’’ÓÓÒ°Ğ¢Ò’æÖ†gVæ7F–öâ†â’°Ğ¢&WGW&ââ²†F—"ææöFRæ6†–ÆG&Vå¶åÒçG—RÓÓÒvF—"ròròr¢rr“°Ğ¢Ò“°Ğ¢&WGW&â²F—%'C¢F—%'BÂæÖW3¢æÖW2Ó°Ğ¢ĞĞ Ğ¢gVæ7F–öâ6ö×ÆWFR‚’°Ğ¢f"fÇVRÒ–çWBçfÇVS°Ğ¢f"†VBÒfÇVRç&WÆ6R‚õÇ2²BòÂrr“°Ğ¢f"Fö¶Vç2Ò†VBæÆVæwF‚ò†VBç7Æ—B‚õÇ2²ò’¢µÓ°Ğ¢f"G&–Æ–æu76RÒõÇ2BòçFW7B‡fÇVR“°Ğ¢f"VF—F–ærÒG&–Æ–æu76Ròrr¢‡Fö¶Vç5·Fö¶Vç2æÆVæwF‚ÒÒÇÂrr“°Ğ¢f"—4f—'7BÒFö¶Vç2æÆVæwF‚ÃÒbbG&–Æ–æu76S°Ğ Ğ¢f"6æF–FFW2Â&WÆ6Uv—Fƒ°Ğ Ğ¢–b†—4f—'7B’°Ğ¢ò¢âV×G’Æ–æRÆ—7G2F†R&VÂ6öÖÖæG2öæÇ’(	BGV×–ærWfW'’Æ–2FöğĞ¢v÷VÆB'W'’F†Rç7vW"F†Rf—6—F÷"—2Æöö¶–ærf÷"¢ğĞ¢f"ööÂÒVF—F–æròö&¦V7Bæ¶W—2„4ôÔÔäE2’æ6öæ6B„ö&¦V7Bæ¶W—2„Ä”2’’¢ö&¦V7Bæ¶W—2„4ôÔÔäE2“°Ğ¢6æF–FFW2ÒööÀĞ¢æf–ÇFW"†gVæ7F–öâ†â’²&WGW&ââæ–æFW„öb†VF—F–ærçFôÆ÷vW$66R‚’’ÓÓÒ²ÒĞ¢ç6÷'B‚Ğ¢æf–ÇFW"†gVæ7F–öâ†âÂ’Â'"’²&WGW&â'"æ–æFW„öb†â’ÓÓÒ“²Ò“°Ğ¢&WÆ6Uv—F‚ÒgVæ7F–öâ‡FW‡B’²–çWBçfÇVRÒFW‡B²†6æF–FFW2æÆVæwF‚ÓÓÒòrr¢rr“²Ó°Ğ¢ÒVÇ6R°Ğ¢f"fW&"ÒFö¶Vç5³ÒçFôÆ÷vW$66R‚“°Ğ¢fW&"ÒÄ”5·fW&%ÒÇÂfW&#°Ğ¢–b‡fW&"ÓÓÒvÖâr’°Ğ¢6æF–FFW2Òö&¦V7Bæ¶W—2„4ôÔÔäE2’æf–ÇFW"†gVæ7F–öâ†â’²&WGW&ââæ–æFW„öb†VF—F–ærçFôÆ÷vW$66R‚’’ÓÓÒ²Ò’ç6÷'B‚“°Ğ¢ÒVÇ6R–b‡fW&"ÓÓÒv÷Vâr’°Ğ¢6æF–FFW2Òö&¦V7Bæ¶W—2„Ä”äµ2’æf–ÇFW"†gVæ7F–öâ†â’²&WGW&ââæ–æFW„öb†VF—F–ærçFôÆ÷vW$66R‚’’ÓÓÒ²Ò“°Ğ¢ÒVÇ6R–b‡fW&"ÓÓÒwF†VÖRr’°Ğ¢6æF–FFW2Ò²vWFòrÂvF&²rÂvÆ–v‡BuÒæf–ÇFW"†gVæ7F–öâ†â’²&WGW&ââæ–æFW„öb†VF—F–ærçFôÆ÷vW$66R‚’’ÓÓÒ²Ò“°Ğ¢ÒVÇ6R–b‡fW&"ÓÓÒvÆærr’°Ğ¢6æF–FFW2Ò²vVârÂwÂuÒæf–ÇFW"†gVæ7F–öâ†â’²&WGW&ââæ–æFW„öb†VF—F–ærçFôÆ÷vW$66R‚’’ÓÓÒ²Ò“°Ğ¢ÒVÇ6R°Ğ¢f"f÷VæBÒF„6æF–FFW2†VF—F–ær“°Ğ¢6æF–FFW2Òf÷VæBææÖW2æÖ†gVæ7F–öâ†â’²&WGW&âf÷VæBæF—%'B²ã²Ò“°Ğ¢ĞĞ¢f"&Vf—…Fö¶Vç2ÒG&–Æ–æu76RòFö¶Vç2¢Fö¶Vç2ç6Æ–6RƒÂÓ“°Ğ¢&WÆ6Uv—F‚ÒgVæ7F–öâ‡FW‡B’°Ğ¢f"¦ö–æVBÒ&Vf—…Fö¶Vç2æ6öæ6B…·FW‡EÒ’æ¦ö–â‚rr“°Ğ¢–çWBçfÇVRÒ¦ö–æVB²†6æF–FFW2æÆVæwF‚ÓÓÒbbõÂòBòçFW7B‡FW‡B’òrr¢rr“°Ğ¢Ó°Ğ¢ĞĞ Ğ¢–b‚6æF–FFW2æÆVæwF‚’&WGW&ã°Ğ¢–b†6æF–FFW2æÆVæwF‚ÓÓÒ’²&WÆ6Uv—F‚†6æF–FFW5³Ò“²7–æ4f–VÆB‚“²&WGW&ã²ĞĞ Ğ¢f"&Vf—‚Ò6öÖÖöå&Vf—‚†6æF–FFW2“°Ğ¢–b‡&Vf—‚bb&Vf—‚æÆVæwF‚âVF—F–æræÆVæwF‚’&WÆ6Uv—F‚‡&Vf—‚“°Ğ¢VÖ—B…¶Æâ†6æF–FFW2æ¦ö–â‚rr’Â²6Ç3¢wBÖf–çBrÒ•ÒÂ–çWBçfÇVR“°Ğ¢7–æ4f–VÆB‚“°Ğ¢ĞĞ Ğ¢ò¢ÒÒÒ–çWBÇVÖ&–ærÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢gVæ7F–öâ7–æ4f–VÆB‚’°Ğ¢f–VÆBæ6Æ74Æ—7BçFövvÆR‚v—2ÖV×G’rÂ–çWBçfÇVRæÆVæwF‚ÓÓÒ“°Ğ¢ĞĞ Ğ¢–çWBæFDWfVçDÆ—7FVæW"‚v–çWBrÂ7–æ4f–VÆB“°Ğ¢–çWBæFDWfVçDÆ—7FVæW"‚vfö7W2rÂgVæ7F–öâ‚’°Ğ¢FW&Ö–æÂæ6Æ74Æ—7BæFB‚vfö7W6VBr“°Ğ¢–b‚V–WDfö7W2’67&öÆÅFô&÷GFöÒ‚“°Ğ¢Ò“°Ğ¢–çWBæFDWfVçDÆ—7FVæW"‚v&ÇW"rÂgVæ7F–öâ‚’²FW&Ö–æÂæ6Æ74Æ—7Bç&VÖ÷fR‚vfö7W6VBr“²Ò“°Ğ Ğ¢–çWBæFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÂgVæ7F–öâ†R’°Ğ¢f"7G&ÂÒRæ7G&Ä¶W’ÇÂRæÖWF¶W“°Ğ Ğ¢ò¢G—–ærv–âÖVç2F†Rf—6—F÷"—2FöæR&VF–ær(	B&V¦ö–âF†R&ö×B¢ğĞ¢–b†÷WGWBç67&öÆÅF÷²÷WGWBæ6Æ–VçD†V–v‡BÂ÷WGWBç67&öÆÄ†V–v‡BÒB’67&öÆÅFô&÷GFöÒ‚“°Ğ Ğ¢–b†Ræ¶W’ÓÓÒtVçFW"r’²Rç&WfVçDFVfVÇB‚“²'Vâ†–çWBçfÇVR“²&WGW&ã²ĞĞ¢–b†Ræ¶W’ÓÓÒuF"r’²Rç&WfVçDFVfVÇB‚“²6ö×ÆWFR‚“²&WGW&ã²ĞĞ¢–b†Ræ¶W’ÓÓÒt'&÷uWr’²Rç&WfVçDFVfVÇB‚“²&V6ÆÂ‚Ó“²&WGW&ã²ĞĞ¢–b†Ræ¶W’ÓÓÒt'&÷tF÷vâr’²Rç&WfVçDFVfVÇB‚“²&V6ÆÂƒ“²&WGW&ã²ĞĞ¢–b†Ræ¶W’ÓÓÒtW66RrbbFW&Ö–æÂæ6Æ74Æ—7Bæ6öçF–ç2‚vW‡æFVBr’’°Ğ¢–çWBçfÇVRÒrs²7–æ4f–VÆB‚“²&WGW&ã°Ğ¢ĞĞ Ğ¢–b‚7G&Â’&WGW&ã°Ğ¢f"²ÒRæ¶W’çFôÆ÷vW$66R‚“°Ğ¢–b†²ÓÓÒvÂr’²Rç&WfVçDFVfVÇB‚“²6ÆV%67&VVâ‚“²ĞĞ¢VÇ6R–b†²ÓÓÒv2r’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢VÖ—B…µÒÂ–çWBçfÇVR²uä2r“°Ğ¢–çWBçfÇVRÒrs²7–æ4f–VÆB‚“°Ğ¢†—7F÷'”–G‚Ò6ÖDÆöræÆVæwFƒ°Ğ¢ÒVÇ6R–b†²ÓÓÒwRr’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢–çWBçfÇVRÒ–çWBçfÇVRç6Æ–6R†–çWBç6VÆV7F–öå7F'B“²7–æ4f–VÆB‚“°Ğ¢–çWBç6WE6VÆV7F–öå&ævRƒÂ“°Ğ¢ÒVÇ6R–b†²ÓÓÒv²r’°Ğ¢Rç&WfVçDFVfVÇB‚“°Ğ¢–çWBçfÇVRÒ–çWBçfÇVRç6Æ–6RƒÂ–çWBç6VÆV7F–öå7F'B“²7–æ4f–VÆB‚“°Ğ¢ÒVÇ6R–b†²ÓÓÒvr’°Ğ¢Rç&WfVçDFVfVÇB‚“²–çWBç6WE6VÆV7F–öå&ævRƒÂ“°Ğ¢ÒVÇ6R–b†²ÓÓÒvRr’°Ğ¢Rç&WfVçDFVfVÇB‚“²–çWBç6WE6VÆV7F–öå&ævR†–çWBçfÇVRæÆVæwF‚Â–çWBçfÇVRæÆVæwF‚“°Ğ¢ĞĞ¢Ò“°Ğ Ğ¢ò¢6Æ–6¶–ærF†RG&ç67&—B†÷"F†RV×G’'BöbF†R&ö×B&÷r’fö7W6W2F†PĞ¢–çWB(	BVæÆW72F†Rf—6—F÷"—26VÆV7F–ærFW‡B÷"föÆÆ÷v–ærÆ–æ²¢ğĞ¢gVæ7F–öâfö7W4–çWB†R’°Ğ¢–b†RbbRçF&vWBæ6Æ÷6W7BbbRçF&vWBæ6Æ÷6W7B‚vÂ'WGFöâr’’&WGW&ã°Ğ¢f"6VÂÒv–æF÷rævWE6VÆV7F–öâ‚“°Ğ¢–b‡6VÂbb6VÂçFõ7G&–ær‚’’&WGW&ã°Ğ¢fö7W4–çWEV–WFÇ’‚“²ò¢&VF–ær÷6—F–öâ×W7B7W'f—fRF†R6Æ–6²¢ğĞ¢ĞĞ¢÷WGWBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂfö7W4–çWB“°Ğ¢f–VÆBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂfö7W4–çWB“°Ğ Ğ¢ò¢ÒÒÒF‚6‡&öÖRÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢gVæ7F–öâ7–æ5F‚‚’°Ğ¢7'VÖ'2çFW‡D6öçFVçBÒrs°Ğ¢f"6Vw2Ò²wâuÒæ6öæ6B†7vB“°Ğ¢6Vw2æf÷$V6‚†gVæ7F–öâ‡6VrÂ’’°Ğ¢–b†’’7'VÖ'2æVæD6†–ÆB‡G‚‚ròrÂwF‚×6Wr’“°Ğ¢f""ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚v'WGFöâr“°Ğ¢"çG—RÒv'WGFöâs°Ğ¢"æ6Æ74æÖRÒwF‚×6Vrr²†’ÓÓÒ6Vw2æÆVæwF‚ÒòrF‚Ö7W"r¢rr“°Ğ¢"çFW‡D6öçFVçBÒ6Vs°Ğ¢f"F&vWEF‚Ò’ÓÓÒòwâr¢wâòr²7vBç6Æ–6RƒÂ’’æ¦ö–â‚ròr“°Ğ¢"æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢'Vâ†’ÓÓÒ6Vw2æÆVæwF‚ÒòvÇ2r¢v6Br²F&vWEF‚“°Ğ¢Ò“°Ğ¢7'VÖ'2æVæD6†–ÆB†"“°Ğ¢Ò“°Ğ¢&ö×D7vBçFW‡D6öçFVçBÒs¢r²F„Æ&VÂ†7vB’²rBs°Ğ¢7FGW47vBçFW‡D6öçFVçBÒ'4Æ&VÂ†7vB“°Ğ¢FW&ÕF—FÆRçFW‡D6öçFVçBÒwf—6—F÷$÷'FföÆ–ó¢r²'4Æ&VÂ†7vB“°Ğ¢ĞĞ Ğ¢ò¢ÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓĞĞ¢‚âvRv—&–ær²&ö÷@Ğ¢ÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÓÒ¢ğĞ Ğ¢gVæ7F–öâÇ•vU7G&–æw2‚’°Ğ¢f"ÂÒtU¶ÆæuÓ°Ğ¢&ö÷BæÆærÒÆæs°Ğ¢Fö7VÖVçBçF—FÆRÒÂçF—FÆS°Ğ¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚u¶FFÖ“†åÒr’æf÷$V6‚†gVæ7F–öâ†VÂ’°Ğ¢f"¶W’ÒVÂævWDGG&–'WFR‚vFFÖ“†âr“°Ğ¢–b„Å¶¶W•Ò’VÂçFW‡D6öçFVçBÒÅ¶¶W•Ó°Ğ¢Ò“°Ğ¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚u¶FFÖ“†â×Æ6V†öÆFW%Òr’æf÷$V6‚†gVæ7F–öâ†VÂ’°Ğ¢f"¶W’ÒVÂævWDGG&–'WFR‚vFFÖ“†â×Æ6V†öÆFW"r“°Ğ¢–b„Å¶¶W•Ò’VÂçÆ6V†öÆFW"ÒÅ¶¶W•Ó°Ğ¢Ò“°Ğ¢Fö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚u¶FFÖ“†âÖ&–Òr’æf÷$V6‚†gVæ7F–öâ†VÂ’°Ğ¢f"¶W’ÒVÂævWDGG&–'WFR‚vFFÖ“†âÖ&–r“°Ğ¢–b„Å¶¶W•Ò’VÂç6WDGG&–'WFR‚v&–ÖÆ&VÂrÂÅ¶¶W•Ò“°Ğ¢Ò“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÆærÖVâr’ç6WDGG&–'WFR‚v&–×&W76VBrÂ7G&–ær†ÆærÓÓÒvVâr’“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÆær×Âr’ç6WDGG&–'WFR‚v&–×&W76VBrÂ7G&–ær†ÆærÓÓÒwÂr’“°Ğ¢7–æ4W‡æDÆ&VÂ‚“°Ğ¢ĞĞ Ğ¢gVæ7F–öâ6WDÆær†æW‡B’°Ğ¢–b†æW‡BÓÓÒÆær’&WGW&ã°Ğ¢ÆærÒæW‡C°Ğ¢6fR„´U’æÆærÂæW‡B“°Ğ¢Ç•vU7G&–æw2‚“°Ğ¢7–æ5F‚‚“°Ğ¢&W6WEFW&Ö–æÂ‚“²ò¢6†VÆÂ¶VW2—G2G&ç67&—C²÷'FföÆ–ò6†÷VÆBæ÷B¢ğĞ¢–çWBæfö7W2‚“°Ğ¢ĞĞ Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÆærÖVâr’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²6WDÆær‚vVâr“²Ò“°Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚vÆær×Âr’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’²6WDÆær‚wÂr“²Ò“°Ğ Ğ¢Fö7VÖVçBævWDVÆVÖVçD'”–B‚v'Fâ×F†VÖRr’æFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢6WEF†VÖR†7F—fUF†VÖR‚’ÓÓÒvF&²ròvÆ–v‡Br¢vF&²r“°Ğ¢Ò“°Ğ¢–b‡&VfW'4F&²æFDWfVçDÆ—7FVæW"’°Ğ¢&VfW'4F&²æFDWfVçDÆ—7FVæW"‚v6†ævRrÂgVæ7F–öâ‚’°Ğ¢–b†ÆöB„´U’çF†VÖRÂDTdTÅEõD„TÔR’ÓÒvWFòr’&WGW&ã°Ğ¢&ö÷Bç&VÖ÷fTGG&–'WFR‚vFF×F†VÖRr“°Ğ¢7–æ5F†VÖT6öÆ÷"‚“°Ğ¢Ò“°Ğ¢ĞĞ Ğ¢ò¢WfW'—F†–ærv—F‚¶FFÖ6ÖEÒ(	BæbÂ5D2ÂF‚6VvÖVçG2Âg27G&—Â6†—2(	@Ğ¢'Vç2—G26öÖÖæBâG&–vvW'2÷WG6–FRF†RFW&Ö–æÂÇ6ò'&–ær—B–çFòf–WpĞ¢†ÖGFW'2öâÖö&–ÆRÂv†W&RF†RFW&Ö–æÂ6—G2&VÆ÷rF†R†W&òFW‡B’â¢ğĞ¢Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ†R’°Ğ¢f"VÂÒRçF&vWBæ6Æ÷6W7BòRçF&vWBæ6Æ÷6W7B‚u¶FFÖ6ÖEÒr’¢çVÆÃ°Ğ¢–b‚VÂ’&WGW&ã°Ğ¢'Vâ†VÂævWDGG&–'WFR‚vFFÖ6ÖBr’“°Ğ¢–b‚FW&Ö–æÂæ6öçF–ç2†VÂ’’°Ğ¢FW&Ö–æÂç67&öÆÄ–çFõf–Wr‡°Ğ¢&V†f–÷#¢&VGV6VDÖ÷F–öâæÖF6†W2òvWFòr¢w6Öö÷F‚rÀĞ¢&Æö6³¢væV&W7BrÀĞ¢Ò“°Ğ¢ÒVÇ6R°Ğ¢ò¢V–WB(	B6†—Ö’†fR§W7B&–çFVBÆöær÷WGWB÷6—F–öæVBB—G2F÷¢ğĞ¢fö7W4–çWEV–WFÇ’‚“°Ğ¢ĞĞ¢Ò“°Ğ Ğ¢ò¢ÒÒÒW‡æBòÖ–æ–Ö—6RÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢f"W‡æD'FâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚v'FâÖW‡æBr“°Ğ¢f"W‡æD–6öâÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vW‡æBÖ–6öâr“°Ğ¢f"W‡æDÆ&VÂÒFö7VÖVçBævWDVÆVÖVçD'”–B‚vW‡æBÖÆ&VÂr“°Ğ Ğ¢gVæ7F–öâ7–æ4W‡æDÆ&VÂ‚’°Ğ¢f"öâÒFW&Ö–æÂæ6Æ74Æ—7Bæ6öçF–ç2‚vW‡æFVBr“°Ğ¢W‡æD–6öâçFW‡D6öçFVçBÒöâò~*Jr¢~*J"s°Ğ¢W‡æDÆ&VÂçFW‡D6öçFVçBÒöâòtU¶ÆæuÒæÖ–æ–Ö—¦R¢tU¶ÆæuÒæW‡æC°Ğ¢W‡æD'Fâç6WDGG&–'WFR‚v&–ÖW‡æFVBrÂ7G&–ær†öâ’“°Ğ¢ĞĞ¢gVæ7F–öâ6WDW‡æFVB†öâ’°Ğ¢FW&Ö–æÂæ6Æ74Æ—7BçFövvÆR‚vW‡æFVBrÂöâ“°Ğ¢Fö7VÖVçBæ&öG’æ6Æ74Æ—7BçFövvÆR‚wFW&ÒÖW‡æFVBrÂöâ“°Ğ¢7–æ4W‡æDÆ&VÂ‚“°Ğ¢–b†öâ’–çWBæfö7W2‚“°Ğ¢67&öÆÅFô&÷GFöÒ‚“°Ğ¢ĞĞ¢W‡æD'FâæFDWfVçDÆ—7FVæW"‚v6Æ–6²rÂgVæ7F–öâ‚’°Ğ¢6WDW‡æFVB‚FW&Ö–æÂæ6Æ74Æ—7Bæ6öçF–ç2‚vW‡æFVBr’“°Ğ¢Ò“°Ğ¢v–æF÷ræFDWfVçDÆ—7FVæW"‚v¶W–F÷vârÂgVæ7F–öâ†R’°Ğ¢–b†Ræ¶W’ÓÓÒtW66RrbbFW&Ö–æÂæ6Æ74Æ—7Bæ6öçF–ç2‚vW‡æFVBr’’6WDW‡æFVB†fÇ6R“°Ğ¢Ò“°Ğ Ğ¢ò¢ÒÒÒvòÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒÒ¢ğĞ¢Ç•vU7G&–æw2‚“°Ğ¢7–æ5F‚‚“°¢vVÆ6öÖR‚“°¢–çWBçfÇVRÒw7VFò&Ò×&bòs°¢7–æ4f–VÆB‚“°¢–çWBç6WE6VÆV7F–öå&ævR†–çWBçfÇVRæÆVæwF‚Â–çWBçfÇVRæÆVæwF‚“°§Ò’‚“° 