export function Spinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4 h-4 text-slate-700 icon icon-tabler icon-tabler-loader-3"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
      <path
        d="M3 12a9 9 0 0 0 9 9a9 9 0 0 0 9 -9a9 9 0 0 0 -9 -9"
        className="origin-center animate-spin"
      ></path>
      <path
        d="M17 12a5 5 0 1 0 -5 5"
        className="origin-center animate-spin"
      ></path>
    </svg>
  );
}
