import React from "react";
import { useParams } from "react-router-dom";
import "../Discovery/Discovery.css";

function ResourceDetail() {
  const { id } = useParams();

  return (
    <section className="placeholder-page">
      <h1>Resource Detail Page</h1>
      <p>Viewing heritage resource ID: {id}</p>
    </section>
  );
}

export default ResourceDetail;
