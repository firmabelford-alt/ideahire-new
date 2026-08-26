import React from "react";

function Sorts({ children }) {
  return (
    <>
      {/*
        SORTS.JSX = GŁÓWNE MIEJSCE NA NOWE ELEMENTY STRONY.

        Wszystko, co dodamy tutaj, może być używane jako
        wspólna warstwa aplikacji nad istniejącym routerem.
        Nie usuwamy istniejącego routera ani jego tras.
      */}

      {children}
    </>
  );
}

export default Sorts;
