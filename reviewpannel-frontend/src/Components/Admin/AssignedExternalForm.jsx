import React, { useState } from "react";

const AssignedExternalForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Step 1 state
  const [step1Data, setStep1Data] = useState({
    name: "",
    contact: "",
    id: "",
    email: "",
  });

  // Step 2 state
  const [year, setYear] = useState("");
  const [syClass, setSyClass] = useState("");
  const [tySpec, setTySpec] = useState("");
  const [tyClassNo, setTyClassNo] = useState("");
  const [lySpec, setLySpec] = useState("");
  const [lyClassNo, setLyClassNo] = useState("");

  // Review data
  const [reviewData, setReviewData] = useState({});

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const syOptions = Array.from({ length: 22 }, (_, i) =>
    `SY${(i + 1).toString().padStart(2, "0")}`
  );
  const specOptions = ["CC", "CSF", "AIA", "CORE", "BCT", "AIEC", "BDEC", "IT"];

  const handleStep1Change = (e) => {
    setStep1Data({ ...step1Data, [e.target.name]: e.target.value });
  };

  const fillReview = () => {
    setReviewData({
      ...step1Data,
      year,
      syClass,
      tySpec,
      tyClassNo,
      lySpec,
      lyClassNo,
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (
        !step1Data.name ||
        !step1Data.contact ||
        !step1Data.id ||
        !step1Data.email
      ) {
        alert("Please fill in all fields in Step 1");
        return;
      }
    }
    if (currentStep === 2) {
      if (!year) {
        alert("Please select a Year in Step 2");
        return;
      }
      if (year === "SY" && !syClass) {
        alert("Please select a SY class");
        return;
      }
      if ((year === "TY" || year === "LY") && !(tySpec || lySpec)) {
        alert("Please select a specialization");
        return;
      }
      if ((year === "TY" && !tyClassNo) || (year === "LY" && !lyClassNo)) {
        alert("Please enter class number");
        return;
      }
      fillReview();
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // Prepare payload according to your backend schema
    const payload = {
      name: step1Data.name,
      contact: step1Data.contact,
      id: step1Data.id,
      email: step1Data.email,
      year,
      syClass: year === "SY" ? syClass : undefined,
      tySpec: year === "TY" ? tySpec : undefined,
      tyClassNo: year === "TY" ? tyClassNo : undefined,
      lySpec: year === "LY" ? lySpec : undefined,
      lyClassNo: year === "LY" ? lyClassNo : undefined,
    };

    try {
      const response = await fetch("http://localhost:5000/api/assign-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit form");
        setLoading(false);
        return;
      }

      alert("External assigned successfully!");
      // Reset form and go to step 1
      setCurrentStep(1);
      setStep1Data({ name: "", contact: "", id: "", email: "" });
      setYear("");
      setSyClass("");
      setTySpec("");
      setTyClassNo("");
      setLySpec("");
      setLyClassNo("");
      setReviewData({});
    } catch (err) {
      setError("Server error, please try again later.");
    }
    setLoading(false);
  };

  return (
    <div
      id="multiStepForm"
      className="bg-white p-10 rounded-2xl shadow-lg mb-8 mx-auto"
    >
      {/* Progress Bar */}
      <div className="flex justify-between items-center mb-12">
        {[1, 2, 3].map((step) => {
          const isActive = step <= currentStep;
          const labels = [
            "Name & Login Credential",
            "Assigned Group",
            "Review & Submit",
          ];
          return (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold ${
                  isActive
                    ? "border-purple-600 text-purple-600 bg-white"
                    : "border-gray-300 text-gray-400 bg-white"
                }`}
              >
                {step}
              </div>
              <p
                className={`text-sm mt-2 font-semibold ${
                  isActive ? "text-gray-800" : "text-gray-400"
                } text-center`}
              >
                {labels[step - 1]}
              </p>
              {step !== totalSteps && (
                <div
                  className={`h-1 flex-1 mt-4 ${
                    isActive ? "bg-purple-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {currentStep === 1 && (
        <form id="step1" className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              name="name"
              value={step1Data.name}
              onChange={handleStep1Change}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
              type="text"
              placeholder="Enter name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact
            </label>
            <input
              name="contact"
              value={step1Data.contact}
              onChange={handleStep1Change}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
              type="text"
              placeholder="Enter contact"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID
            </label>
            <input
              name="id"
              value={step1Data.id}
              onChange={handleStep1Change}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
              type="text"
              placeholder="Enter ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              value={step1Data.email}
              onChange={handleStep1Change}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
              type="email"
              placeholder="Enter email"
            />
          </div>
        </form>
      )}

      {/* Step 2 */}
      {currentStep === 2 && (
        <form id="step2" className="grid gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Year
            </label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setSyClass("");
                setTySpec("");
                setTyClassNo("");
                setLySpec("");
                setLyClassNo("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
            >
              <option value="">Select Year</option>
              <option value="SY">Second Year (SY)</option>
              <option value="TY">Third Year (TY)</option>
              <option value="LY">Final Year (LY)</option>
            </select>
          </div>

          {year === "SY" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class (SY)
              </label>
              <select
                value={syClass}
                onChange={(e) => setSyClass(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
              >
                <option value="">Select SY Class</option>
                {syOptions.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(year === "TY" || year === "LY") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <select
                  value={year === "TY" ? tySpec : lySpec}
                  onChange={(e) =>
                    year === "TY" ? setTySpec(e.target.value) : setLySpec(e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
                >
                  <option value="">Select Specialization</option>
                  {specOptions.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Number
                </label>
                <input
                  type="text"
                  value={year === "TY" ? tyClassNo : lyClassNo}
                  onChange={(e) =>
                    year === "TY" ? setTyClassNo(e.target.value) : setLyClassNo(e.target.value)
                  }
                  placeholder="Enter Class Number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-900"
                />
              </div>
            </>
          )}
        </form>
      )}

      {/* Step 3 */}
      {currentStep === 3 && (
        <div
          id="step3"
          className="bg-gray-100 p-6 rounded-lg border border-gray-300 text-gray-900"
        >
          <h2 className="text-xl font-semibold mb-4">Review Your Details</h2>
          <p className="mb-2">
            <strong>Name:</strong> {reviewData.name}
          </p>
          <p className="mb-2">
            <strong>Contact:</strong> {reviewData.contact}
          </p>
          <p className="mb-2">
            <strong>ID:</strong> {reviewData.id}
          </p>
          <p className="mb-2">
            <strong>Email:</strong> {reviewData.email}
          </p>
          <p className="mb-2">
            <strong>Year:</strong>{" "}
            {reviewData.year === "SY"
              ? "Second Year (SY)"
              : reviewData.year === "TY"
              ? "Third Year (TY)"
              : reviewData.year === "LY"
              ? "Final Year (LY)"
              : ""}
          </p>
          {reviewData.year === "SY" && (
            <p className="mb-2">
              <strong>SY Class:</strong> {reviewData.syClass}
            </p>
          )}
          {(reviewData.year === "TY" || reviewData.year === "LY") && (
            <>
              <p className="mb-2">
                <strong>Specialization:</strong>{" "}
                {reviewData.year === "TY" ? reviewData.tySpec : reviewData.lySpec}
              </p>
              <p className="mb-2">
                <strong>Class Number:</strong>{" "}
                {reviewData.year === "TY" ? reviewData.tyClassNo : reviewData.lyClassNo}
              </p>
            </>
          )}
          {error && (
            <p className="text-red-600 font-semibold mt-4">Error: {error}</p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end mt-8 gap-4">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1 || loading}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            currentStep === 1 || loading
              ? "bg-gray-300 cursor-not-allowed text-gray-700"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={nextStep}
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : currentStep === totalSteps ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AssignedExternalForm;
