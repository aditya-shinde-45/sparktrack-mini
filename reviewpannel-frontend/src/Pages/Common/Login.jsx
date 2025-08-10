import React from "react";
import LoginHeader from "../../Components/Common/LoginHeader";

const Login = () => {
    return (
        <div className="font-[Poppins]">
            <LoginHeader />
            <main className="flex items-center justify-center min-h-screen -mt-16">
                <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
                    {/* Title */}
                    <div className="flex items-center justify-center mb-8 space-x-4">
                        <span className="material-icons text-gray-900" style={{ fontSize: 30 }}>
                            rate_review
                        </span>
                        <h1 style={{ fontSize: "32px" }} className="font-bold text-gray-900">
  Review Panel
</h1>
       </div>

                    {/* Form */}
                    <form>
                        {/* Username */}
                        <div className="mb-6">
                            <label className="sr-only" htmlFor="username">Username</label>
                            <input
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                                id="username"
                                name="username"
                                placeholder="Username"
                                type="text"
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-6">
                            <label className="sr-only" htmlFor="password">Password</label>
                            <input
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                                id="password"
                                name="password"
                                placeholder="Password"
                                type="password"
                            />
                        </div>

                        {/* Role Selection */}
                        <div className="mb-8 relative">
                            <label className="sr-only" htmlFor="select">Select</label>
                            <select
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
                                id="select"
                                name="select"
                            >
                                <option>Select</option>
                                <option>Mentor</option>
                                <option>External</option>
                                <option>Admin</option>
                            </select>
                        </div>

                        {/* Submit Button */}
                        <button
                            className="w-full bg-gradient-to-r from-[#975BFF] to-[#7B74EF] text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            type="submit"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Login;
