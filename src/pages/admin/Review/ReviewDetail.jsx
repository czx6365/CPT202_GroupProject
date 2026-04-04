import React from "react";
import { useParams } from "react-router-dom";
import "../../public/Discovery/Discovery.css";

function ReviewDetail() {
  const { id } = useParams();

  return (
    <section className="placeholder-page">
      <h1>Review Detail Page</h1>
      <p>Detailed review workspace placeholder for submission ID: {id}</p>
    </section>
  );
}

export default ReviewDetail;
