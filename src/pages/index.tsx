import { signIn, signOut, useSession } from "next-auth/react";

import type { NextPageWithLayout } from "./_app";

const IndexPage: NextPageWithLayout = () => {
  const session = useSession();
  if (session.data?.user) {
    return (
      <>
        Signed in as {session.data.user.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    );
  }
  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  );
};

export default IndexPage;
