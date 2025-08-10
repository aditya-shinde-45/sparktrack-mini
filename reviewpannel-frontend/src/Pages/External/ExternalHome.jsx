import React from "react";
import Header from "../../Components/Common/Header";
import Sidebar from "../../Components/External/Sidebar";
import EvaluationForm from "../../Components/External/EvaluationForm";

const ExternalHome = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f3e5f5]">
      <Header name="Dr Vivek Swami" id="412056" />
      <div className="flex flex-1 flex-col lg:flex-row">
        <Sidebar />
        <EvaluationForm />
      </div>
    </div>
  );
};

export default ExternalHome;
