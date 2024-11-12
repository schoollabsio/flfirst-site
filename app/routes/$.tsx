export default function NotFound() {
  return (
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-auto flex justify-center">
          <img
            src="/404.jpg"
            className="w-full max-w-md rounded-lg shadow-sm"
          />
        </div>
        <div className="w-full md:w-auto">
          <h1 className="text-3xl font-bold text-gray-600 mb-4">
            We looked everywhere, but couldn't find that!
          </h1>
          <p>
            The page you are looking for doesn't exist or the URL may have
            changed.
          </p>
          <div className="mt-4">
            <p>
              <span>
                If you are looking for this season's currently scheduled events,
                you can try{" "}
                <a
                  href="/events"
                  className="text-gray-500 underline hover:text-blue-600"
                >
                  here
                </a>
                .
              </span>
              <span>
                If you are looking for information on{" "}
                <i>Florida FIRST Tech Challenge™</i> teams, you can try{" "}
                <a
                  href="/teams"
                  className="text-gray-500 underline hover:text-blue-600"
                >
                  here
                </a>
                .
              </span>
            </p>
            <p>
              <span>
                Additionally, copies of Hans' newsletters can be found{" "}
                <a
                  href="/newsletter"
                  className="text-gray-500 underline hover:text-blue-600"
                >
                  here
                </a>
                .
              </span>
            </p>
          </div>
        </div>
      </div>
  );
}
