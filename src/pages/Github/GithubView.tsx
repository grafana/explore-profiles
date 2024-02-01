import React, { useEffect } from 'react';

export function GithubView() {
  useEffect(() => {
    const authCode = new URLSearchParams(window.location.search.replace('?', '')).get('code');
    window.opener.postMessage({ authCode, type: 'github' });
    window.close();
  }, []);

  return <div></div>;
}
