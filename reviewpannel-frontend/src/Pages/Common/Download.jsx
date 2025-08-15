import React from "react";
import Footer from "../../Components/Common/Footer";
import Navbar from "../../Components/Common/Navbar";
import "../../Style/Download.css";

const documents = [
  {
    title: "Ideation and Design-Doc-1",
    desc: "Initial project ideation and design documentation.",
    file: "pbl-front-end\public\docs\IdeaSpark Poster Template (1).pptx",
  },
  {
    title: "IdeaSpark Poster Template",
    desc: "Template for creating your IdeaSpark poster.",
    file: "pbl-front-end\public\docs\IdeaSpark Poster Template (1).pptx",
  },
  {
    title: "IdeaSpark Evaluation Sheet",
    desc: "Evaluation criteria for the IdeaSpark presentations.",
    file: "pbl-front-end\public\docs\IdeaSpark 2023_Evaluation Sheet.pdf",
  },
  {
    title: "Synopsis",
    desc: "A brief summary of your project.",
    file: "pbl-front-end\public\docs\Annexure 3_Synopsis.docx",
  },
  {
    title: "Viability Analysis Form",
    desc: "Form to assess the feasibility of your project.",
    file: "pbl-front-end\public\docs\Annexure 2_Form B_Viability Analysis Report.docx",
  },
  {
    title: "Project Tracker",
    desc: "Tool to monitor your project's progress.",
    file: "pbl-front-end\public\docs\Farmer Project Tracker Sheet.xlsx",
  },
  {
    title: "Project 0th Review form_PP2",
    desc: "Review form for the initial project presentation (PP2).",
    file: "pbl-front-end\public\docs\Annexure 5_Project Review Report.docx",
  },
  {
    title: "Project 0th Review form_Internship",
    desc: "Review form for the initial internship project presentation.",
    file: "pbl-front-end\public\docs\Annexure _Zertoh_Review Report_Internship_PP-2.docx",
  },
  {
    title: "Projet form_Internship",
    desc: "Official project form for internships.",
    file: "docs/Project_form_Internship.pdf",
  },
  {
    title: "SOP-Project Based Learning MITSOC",
    desc: "Standard Operating Procedures for PBL at MITSOC.",
    file: "pbl-front-end\public\docs\MITSOC_SoP_Project Based Learning_Version_4.0.pdf",
  },
  {
    title: "Project Report Format",
    desc: "Required format for your final project report.",
    file: "pbl-front-end\public\docs\Annexure 6_Project report format - guidelines_SKP (1).docx",
  },
  {
    title: "Project Presentation Format (PPT)",
    desc: "Template for your project presentation slides.",
    file: "pbl-front-end\public\docs\Final_Project_Presentation_format.pptx",
  },
  {
    title: "NOC Format",
    desc: "No Objection Certificate format.",
    file: "pbl-front-end\public\docs\Annexure 8_NOC of guide.docx",
  },
  {
    title: "Final Project Poster",
    desc: "Template for your final project poster.",
    file: "pbl-front-end\public\docs\Annexure 7_Template for Project Poster.pptx",
  },
  {
    title: "Success Story (for internship)",
    desc: "Template to document your internship success story.",
    file: "pbl-front-end\public\docs\Annexure 7_Success Story of Internship Proejct.docx",
  },
];

const Download = () => {
  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen font-[Poppins]">
        <header className="bg-gradient-to-r from-purple-700 to-indigo-600 text-white">
          <div className="container mx-auto px-6 py-8">
            <h1 className="text-4xl font-bold text-center">
              PBL Management Documents
            </h1>
          </div>
        </header>

        <main className="container mx-auto px-6 py-20">
          <section className="space-y-8">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span className="material-icons text-purple-600 text-3xl mr-4">
                    description
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {doc.title}
                    </h3>
                    <p className="text-gray-500 text-sm">{doc.desc}</p>
                  </div>
                </div>
                <a
                  href={doc.file}
                  download
                  className="common-button download-link bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition flex items-center"
                >
                  <span className="material-icons mr-2">download</span>
                  Download
                </a>
              </div>
            ))}
          </section>
        </main>
      </div>
      <Footbar />
    </>
  );
};

export default Download;
