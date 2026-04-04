import React from "react";
import { useParams } from "react-router-dom";
import "../../public/Discovery/Discovery.css";

function Resubmit() {
  const { id } = useParams();

  return (
    <section className="placeholder-page">
      <h1>Resubmit Page</h1>
      <p>Revision workflow placeholder for resource ID: {id}</p>
    </section>
  );
}

export default Resubmit;
