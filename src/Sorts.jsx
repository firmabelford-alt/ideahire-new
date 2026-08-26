import React from "react";

function Sorts({ children }) {
  return (
    <div className="sorts-root">
      {/*
        SORTS.JSX = GŁÓWNE MIEJSCE NA NOWE ELEMENTY STRONY.

        Wszystko, co dodamy tutaj, może działać jako wspólna
        warstwa całej aplikacji, bez zaśmiecania router.jsx.

        Router pozostaje odpowiedzialny za trasy, a Sorts za
        nowe elementy i wspólną warstwę interfejsu.
      */}

      {children}
    </div>
  );
}

export default Sorts;
