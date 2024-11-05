import React from "react";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { configureStore } from "@reduxjs/toolkit";

const api = createApi({
  reducerPath: "transactions-api",
  baseQuery: fetchBaseQuery({ baseUrl: "https://example.test" }),
  endpoints: (build) => ({
    helloWorld: build.query({
      queryFn() {
        return { data: "hello world" };
      },
    }),
  }),
});

function useDebounce(value) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 1000);

    return () => clearTimeout(timer);
  }, [value]);

  return debouncedValue;
}

function Component() {
  const [searchString, setSearchString] = React.useState("");

  const params = searchString || skipToken;
  const debouncedParams = useDebounce(params);
  const { data } = api.endpoints.helloWorld.useQuery(
    params === skipToken ? params : debouncedParams
  );

  return (
    <>
      <input
        placeholder="search here"
        onChange={(e) => setSearchString(e.target.value)}
        type="text"
      />
      <p>{data ? "Hello world" : null}</p>
    </>
  );
}

beforeEach(() => {
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat([api.middleware]),
  });
  render(
    <Provider store={store}>
      <Component />
    </Provider>
  );
});

it("with real timers - this passes", async () => {
  jest.useRealTimers();

  const addressSearchBar = await screen.findByPlaceholderText("search here");
  await userEvent.click(addressSearchBar);
  await userEvent.paste("my search string");
  await screen.findByText("Hello world", undefined, { timeout: 2000 });
});

it("with fake timers - this fails", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  const addressSearchBar = await screen.findByPlaceholderText("search here");
  await user.click(addressSearchBar);
  await user.paste("my search string");
  await screen.findByText("Hello world", undefined, { timeout: 2000 });
});
