import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { range } from "lodash";

export function Pagination(props: {
  currentPageNumber: number;
  numberOfPages: number;
  setCurrentPageNumber: (page: number) => void;
  noDataPlaceholder: string;
}) {
  const showLeftDots = props.numberOfPages > 5 && props.currentPageNumber > 3;
  const showRightDots =
    props.numberOfPages > 5 &&
    props.currentPageNumber < props.numberOfPages - 2;

  let visiblePages: number[] = [];
  if (showLeftDots && !showRightDots) {
    visiblePages = range(props.numberOfPages - 3, props.numberOfPages + 1);
  } else if (!showLeftDots && showRightDots) {
    visiblePages = range(1, 5);
  } else if (showLeftDots && showRightDots) {
    visiblePages = [
      props.currentPageNumber - 1,
      props.currentPageNumber,
      props.currentPageNumber + 1,
    ];
  } else {
    visiblePages = range(1, props.numberOfPages + 1);
  }

  return (
    <div className="flex flex-row items-center justify-center text-sm font-medium gap-x-2">
      <button
        className="flex items-center justify-center w-8 h-8 bg-white border rounded-md shadow-sm border-slate-300 group hover:bg-blue-100"
        onClick={
          props.currentPageNumber > 1
            ? () => props.setCurrentPageNumber(props.currentPageNumber - 1)
            : () => {}
        }
      >
        <IconChevronLeft
          width={20}
          className="mr-[1.5px] text-slate-600 group-hover:text-blue-950"
        />
      </button>
      <div className="flex h-8 overflow-hidden border divide-x rounded-md shadow-sm bg-slate-50 border-slate-300 divide-slate-200">
        {showLeftDots && (
          <div className="flex items-center justify-center h-full cursor-not-allowed min-w-[3rem] text-slate-600">
            ...
          </div>
        )}

        {visiblePages.length === 0 && (
          <div className="flex items-center justify-center min-w-[3rem] px-3 h-full cursor-not-allowed text-slate-600">
            {props.noDataPlaceholder}
          </div>
        )}

        {visiblePages.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`flex items-center justify-center min-w-[3rem] h-full ${
              pageNumber === props.currentPageNumber
                ? "bg-white text-slate-950"
                : "text-slate-500"
            }`}
            onClick={() => props.setCurrentPageNumber(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        {showRightDots && (
          <div className="flex items-center justify-center min-w-[3rem] h-full cursor-not-allowed text-slate-600">
            ...
          </div>
        )}
      </div>
      <button
        className="flex items-center justify-center w-8 h-8 bg-white border rounded-md shadow-sm border-slate-300 group hover:bg-blue-100"
        onClick={
          props.currentPageNumber < props.numberOfPages
            ? () => props.setCurrentPageNumber(props.currentPageNumber + 1)
            : () => {}
        }
      >
        <IconChevronRight
          width={20}
          className="ml-[1.5px] text-slate-600 group-hover:text-blue-950"
        />
      </button>
    </div>
  );
}
