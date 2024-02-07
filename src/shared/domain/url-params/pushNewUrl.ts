export const pushNewUrl = (newSearchParams: URLSearchParams) => {
  const newUrl = new URL(window.location.toString());

  newUrl.search = newSearchParams.toString();

  history.pushState(null, '', newUrl.toString());
};
