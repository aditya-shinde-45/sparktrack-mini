import React, { useState } from "react";

const AssignedExternalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const fillReview = () => {
    const step1Data = new FormData(document.getElementById("step1"));
    const step2Data = new FormData(document.getElementById("step2"));

    document.getElementById("reviewName").textContent = step1Data.get("name");
    document.getElementById("reviewContact").textContent = step1Data.get("contact");
    document.getElementById("reviewID").textContent = step1Data.get("id");
    document.getElementById("reviewEmail").textContent = step1Data.get("email");
    document.getElementById("reviewFrom").textContent = step2Data.get("fromGroup");
    document.getElementById("reviewTo").textContent = step2Data.get("toGroup");
    document.getElementById("reviewOther").textContent = step2Data.get("otherGroups");
  };

  const updateProgress = () => {
    for (let i = 1; i <= totalSteps; i++) {
      const circle = document.querySelector(`#stepIndicator${i} div`);
      const label = document.querySelector(`#stepIndicator${i} p`);
      if (i <= currentStep) {
        circle.classList.remove("border-gray-300", "text-gray-400");
        circle.classList.add("border-purple-500", "text-purple-500");
        label.classList.remove("text-gray-400");
        label.classList.add("text-gray-600");
      } else {
        circle.classList.add("border-gray-300", "text-gray-400");
        circle.classList.remove("border-purple-500", "text-purple-500");
        label.classList.add("text-gray-400");
        label.classList.remove("text-gray-600");
      }
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      document.getElementById(`step${currentStep}`).classList.add("hidden");
      setCurrentStep((prev) => prev + 1);
      document.getElementById(`step${currentStep + 1}`).classList.remove("hidden");

      if (currentStep + 1 === totalSteps) {
        fillReview();
      }
    } else {
      alert("Form submitted!");
    }
    updateProgress();
  };

  const prevStep = () => {
    document.getElementById(`step${currentStep}`).classList.add("hidden");
    setCurrentStep((prev) => prev - 1);
    document.getElementById(`step${currentStep - 1}`).classList.remove("hidden");
    updateProgress();
  };

  return (
    <div id="multiStepForm" className="bg-white p-8 rounded-2xl shadow-lg mb-8">
      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-12">
        <div className="flex flex-col items-center" id="stepIndicator1">
          <div className="w-10 h-10 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 font-bold bg-white">
            1
          </div>
          <p className="text-sm text-gray-600 mt-2">Name & Login Credential</p>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center" id="stepIndicator2">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 font-bold bg-white">
            2
          </div>
          <p className="text-sm text-gray-400 mt-2">Assigned Group</p>
        </div>
        <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center" id="stepIndicator3">
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-400 font-bold bg-white">
            3
          </div>
          <p className="text-sm text-gray-400 mt-2">Review & Submit</p>
        </div>
      </div>

      {/* Step 1 */}
      <form id="step1" className="step">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input name="name" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input name="contact" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
            <input name="id" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="email" />
          </div>
        </div>
      </form>

      {/* Step 2 */}
      <form id="step2" className="step hidden">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input name="fromGroup" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input name="toGroup" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Other Groups</label>
            <input name="otherGroups" className="w-full px-4 py-2 border border-gray-300 rounded-lg" type="text" />
          </div>
        </div>
      </form>

      {/* Step 3 */}
      <div id="step3" className="step hidden">
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="mb-2"><strong>Name:</strong> <span id="reviewName"></span></p>
          <p className="mb-2"><strong>Contact:</strong> <span id="reviewContact"></span></p>
          <p className="mb-2"><strong>ID:</strong> <span id="reviewID"></span></p>
          <p className="mb-2"><strong>Email:</strong> <span id="reviewEmail"></span></p>
          <p className="mb-2"><strong>From:</strong> <span id="reviewFrom"></span></p>
          <p className="mb-2"><strong>To:</strong> <span id="reviewTo"></span></p>
          <p className="mb-2"><strong>Other Groups:</strong> <span id="reviewOther"></span></p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={prevStep}
          className={`bg-gray-400 text-white px-8 py-2 rounded-lg mr-2 ${currentStep === 1 ? "hidden" : ""}`}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={nextStep}
          className="bg-purple-600 text-white px-8 py-2 rounded-lg hover:bg-purple-700"
        >
          {currentStep === totalSteps ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AssignedExternalForm;
