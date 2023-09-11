export default {
  logo: (
    <div className="relative flex flex-row items-center justify-center -ml-6 gap-x-4">
      <div className="h-[var(--nextra-navbar-height)] w-auto py-2.5 px-5 bg-slate-900 dark:bg-transparent">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-ripple h-full w-full"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="white"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
          <path d="M3 7c3 -2 6 -2 9 0s6 2 9 0"></path>
          <path d="M3 17c3 -2 6 -2 9 0s6 2 9 0"></path>
          <path d="M3 12c3 -2 6 -2 9 0s6 2 9 0"></path>
        </svg>
      </div>
      <div className="flex-shrink-0 text-xl whitespace-nowrap font-regular text-slate-900 dark:text-white">
        <span className="font-bold">Tenta</span>
        <span className="hidden lg:inline"> Documentation</span>
      </div>
    </div>
  ),
  project: {
    link: "https://github.com/iterize/tenta",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="icon icon-tabler icon-tabler-brand-github-filled"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path
          d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z"
          strokeWidth="0"
          fill="currentColor"
        ></path>
      </svg>
    ),
  },
  docsRepositoryBase: "https://github.com/iterize/tenta/blob/main/docs",
  //primaryHue: 43,
  navigation: true,
  useNextSeoProps() {
    return {
      titleTemplate: "%s – Tenta",
    };
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Tenta" />
      <meta
        property="og:description"
        content="Manage your sensors remotely and in real-time"
      />
    </>
  ),
  footer: {
    text: (
      <span>© Felix Böhm and Moritz Makowski, {new Date().getFullYear()}</span>
    ),
  },
  faviconGlyph: "🏔️",
  sidebar: {
    titleComponent({ title, type, route }) {
      if (type === "doc") {
        if (route.split("/").length === 2) {
          return (
            <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">
              {title}
            </strong>
          );
        } else {
          return (
            <span className="text-neutral-600 dark:text-neutral-400">
              {title}
            </span>
          );
        }
      }
    },
  },
  banner: {
    key: "v1.0.0-release",
    text: "🎉 Tenta v0.1.0 has been released",
  },
  toc: {
    float: true,
  },
};
