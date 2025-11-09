import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../Components/Student/Header";
import Sidebar from "../../Components/Student/sidebar";
import { 
  Wrench,
  Code,
  Database,
  GitBranch,
  Figma,
  Globe,
  Terminal,
  PackageSearch,
  Cpu,
  Server,
  Palette,
  Shield,
  BookOpen,
  ExternalLink,
  Star,
  TrendingUp,
  Zap,
  Video,
  FileCode,
  Box
} from "lucide-react";
import { apiRequest } from "../../api";

const Tools = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("popular");
  const [searchQuery, setSearchQuery] = useState("");

  // Tool categories
  const categories = [
    { id: "popular", name: "Popular Tools", icon: Star },
    { id: "ai-ml", name: "AI/ML", icon: Cpu },
    { id: "devops", name: "DevOps", icon: Server },
    { id: "cybersecurity", name: "Cybersecurity", icon: Shield },
    { id: "design", name: "Design", icon: Palette },
    { id: "mobile", name: "Mobile App Development", icon: Code },
    { id: "learning", name: "Learning & Community", icon: BookOpen }
  ];

  // Comprehensive tool list
  const tools = [
    // Popular Tools
    {
      id: 1,
      name: "Visual Studio Code",
      category: "popular",
      description: "Powerful code editor with extensions for all programming languages",
      icon: Code,
      url: "https://code.visualstudio.com/",
      rating: 5,
      popular: true,
      tags: ["Editor", "IDE", "Free"]
    },
    {
      id: 2,
      name: "GitHub",
      category: "popular",
      description: "Version control and collaboration platform for developers",
      icon: GitBranch,
      url: "https://github.com/",
      rating: 5,
      popular: true,
      tags: ["Git", "Version Control", "Collaboration"]
    },
    {
      id: 3,
      name: "Figma",
      category: "popular",
      description: "Collaborative interface design tool",
      icon: Figma,
      url: "https://www.figma.com/",
      rating: 5,
      popular: true,
      tags: ["UI/UX", "Design", "Collaboration"]
    },
    {
      id: 4,
      name: "Postman",
      category: "popular",
      description: "API development and testing platform",
      icon: Terminal,
      url: "https://www.postman.com/",
      rating: 5,
      popular: true,
      tags: ["API", "Testing", "Development"]
    },
    {
      id: 5,
      name: "Stack Overflow",
      category: "popular",
      description: "Q&A community for programmers",
      icon: BookOpen,
      url: "https://stackoverflow.com/",
      rating: 5,
      popular: true,
      tags: ["Q&A", "Community", "Learning"]
    },
    {
      id: 6,
      name: "Node.js",
      category: "popular",
      description: "JavaScript runtime for building server-side applications",
      icon: Server,
      url: "https://nodejs.org/",
      rating: 5,
      popular: true,
      tags: ["JavaScript", "Backend", "Runtime"]
    },

    // AI/ML Tools
    {
      id: 7,
      name: "TensorFlow",
      category: "ai-ml",
      description: "Open-source machine learning framework by Google",
      icon: Cpu,
      url: "https://www.tensorflow.org/",
      rating: 5,
      popular: false,
      tags: ["ML", "AI", "Framework", "Python"]
    },
    {
      id: 8,
      name: "PyTorch",
      category: "ai-ml",
      description: "Deep learning framework for research and production",
      icon: Cpu,
      url: "https://pytorch.org/",
      rating: 5,
      popular: false,
      tags: ["ML", "Deep Learning", "Python"]
    },
    {
      id: 9,
      name: "Jupyter Notebook",
      category: "ai-ml",
      description: "Interactive computing environment for data science",
      icon: FileCode,
      url: "https://jupyter.org/",
      rating: 5,
      popular: false,
      tags: ["Data Science", "Python", "Notebook"]
    },
    {
      id: 10,
      name: "Scikit-learn",
      category: "ai-ml",
      description: "Machine learning library for Python",
      icon: Cpu,
      url: "https://scikit-learn.org/",
      rating: 5,
      popular: false,
      tags: ["ML", "Python", "Library"]
    },
    {
      id: 11,
      name: "Keras",
      category: "ai-ml",
      description: "High-level neural networks API",
      icon: Cpu,
      url: "https://keras.io/",
      rating: 4,
      popular: false,
      tags: ["Deep Learning", "Neural Networks", "Python"]
    },
    {
      id: 12,
      name: "Pandas",
      category: "ai-ml",
      description: "Data manipulation and analysis library",
      icon: Database,
      url: "https://pandas.pydata.org/",
      rating: 5,
      popular: false,
      tags: ["Data Analysis", "Python", "Library"]
    },

    // DevOps Tools
    {
      id: 13,
      name: "Docker",
      category: "devops",
      description: "Container platform for building and deploying applications",
      icon: Box,
      url: "https://www.docker.com/",
      rating: 5,
      popular: false,
      tags: ["Containers", "DevOps", "Deployment"]
    },
    {
      id: 14,
      name: "Kubernetes",
      category: "devops",
      description: "Container orchestration platform",
      icon: Server,
      url: "https://kubernetes.io/",
      rating: 5,
      popular: false,
      tags: ["Orchestration", "Containers", "Cloud"]
    },
    {
      id: 15,
      name: "Jenkins",
      category: "devops",
      description: "Automation server for CI/CD pipelines",
      icon: GitBranch,
      url: "https://www.jenkins.io/",
      rating: 4,
      popular: false,
      tags: ["CI/CD", "Automation", "DevOps"]
    },
    {
      id: 16,
      name: "Terraform",
      category: "devops",
      description: "Infrastructure as Code tool",
      icon: Server,
      url: "https://www.terraform.io/",
      rating: 5,
      popular: false,
      tags: ["IaC", "Cloud", "Infrastructure"]
    },
    {
      id: 17,
      name: "Ansible",
      category: "devops",
      description: "Configuration management and automation tool",
      icon: Terminal,
      url: "https://www.ansible.com/",
      rating: 4,
      popular: false,
      tags: ["Automation", "Configuration", "DevOps"]
    },
    {
      id: 18,
      name: "AWS",
      category: "devops",
      description: "Amazon Web Services cloud platform",
      icon: Server,
      url: "https://aws.amazon.com/",
      rating: 5,
      popular: false,
      tags: ["Cloud", "Hosting", "Infrastructure"]
    },
    {
      id: 19,
      name: "GitLab CI/CD",
      category: "devops",
      description: "Continuous integration and deployment platform",
      icon: GitBranch,
      url: "https://about.gitlab.com/",
      rating: 5,
      popular: false,
      tags: ["CI/CD", "Git", "DevOps"]
    },

    // Cybersecurity Tools
    {
      id: 20,
      name: "Wireshark",
      category: "cybersecurity",
      description: "Network protocol analyzer for troubleshooting and analysis",
      icon: Shield,
      url: "https://www.wireshark.org/",
      rating: 5,
      popular: false,
      tags: ["Network", "Security", "Analysis"]
    },
    {
      id: 21,
      name: "Metasploit",
      category: "cybersecurity",
      description: "Penetration testing framework",
      icon: Shield,
      url: "https://www.metasploit.com/",
      rating: 5,
      popular: false,
      tags: ["Pentesting", "Security", "Framework"]
    },
    {
      id: 22,
      name: "Burp Suite",
      category: "cybersecurity",
      description: "Web application security testing tool",
      icon: Shield,
      url: "https://portswigger.net/burp",
      rating: 5,
      popular: false,
      tags: ["Web Security", "Testing", "Analysis"]
    },
    {
      id: 23,
      name: "Nmap",
      category: "cybersecurity",
      description: "Network scanning and security auditing tool",
      icon: Shield,
      url: "https://nmap.org/",
      rating: 5,
      popular: false,
      tags: ["Network", "Scanning", "Security"]
    },
    {
      id: 24,
      name: "OWASP ZAP",
      category: "cybersecurity",
      description: "Web application security scanner",
      icon: Shield,
      url: "https://www.zaproxy.org/",
      rating: 4,
      popular: false,
      tags: ["Web Security", "Scanner", "OWASP"]
    },
    {
      id: 25,
      name: "Kali Linux",
      category: "cybersecurity",
      description: "Penetration testing Linux distribution",
      icon: Terminal,
      url: "https://www.kali.org/",
      rating: 5,
      popular: false,
      tags: ["Linux", "Pentesting", "OS"]
    },

    // Design Tools
    {
      id: 26,
      name: "Adobe XD",
      category: "design",
      description: "UI/UX design and prototyping tool",
      icon: Palette,
      url: "https://www.adobe.com/products/xd.html",
      rating: 5,
      popular: false,
      tags: ["UI/UX", "Prototyping", "Design"]
    },
    {
      id: 27,
      name: "Sketch",
      category: "design",
      description: "Digital design toolkit for Mac",
      icon: Palette,
      url: "https://www.sketch.com/",
      rating: 5,
      popular: false,
      tags: ["UI/UX", "Design", "Mac"]
    },
    {
      id: 28,
      name: "Canva",
      category: "design",
      description: "Graphic design platform for creating visuals",
      icon: Palette,
      url: "https://www.canva.com/",
      rating: 5,
      popular: false,
      tags: ["Graphics", "Design", "Templates"]
    },
    {
      id: 29,
      name: "InVision",
      category: "design",
      description: "Digital product design and prototyping platform",
      icon: Figma,
      url: "https://www.invisionapp.com/",
      rating: 4,
      popular: false,
      tags: ["Prototyping", "Collaboration", "Design"]
    },
    {
      id: 30,
      name: "Blender",
      category: "design",
      description: "3D creation suite for modeling and animation",
      icon: Box,
      url: "https://www.blender.org/",
      rating: 5,
      popular: false,
      tags: ["3D", "Modeling", "Animation"]
    },
    {
      id: 31,
      name: "GIMP",
      category: "design",
      description: "Free and open-source image editor",
      icon: Palette,
      url: "https://www.gimp.org/",
      rating: 4,
      popular: false,
      tags: ["Image Editing", "Graphics", "Free"]
    },

    // Mobile App Development Tools
    {
      id: 32,
      name: "Android Studio",
      category: "mobile",
      description: "Official IDE for Android app development",
      icon: Code,
      url: "https://developer.android.com/studio",
      rating: 5,
      popular: false,
      tags: ["Android", "IDE", "Mobile"]
    },
    {
      id: 33,
      name: "Xcode",
      category: "mobile",
      description: "IDE for iOS and macOS development",
      icon: Code,
      url: "https://developer.apple.com/xcode/",
      rating: 5,
      popular: false,
      tags: ["iOS", "IDE", "Apple"]
    },
    {
      id: 34,
      name: "React Native",
      category: "mobile",
      description: "Cross-platform mobile app framework",
      icon: Code,
      url: "https://reactnative.dev/",
      rating: 5,
      popular: false,
      tags: ["Cross-platform", "JavaScript", "Framework"]
    },
    {
      id: 35,
      name: "Flutter",
      category: "mobile",
      description: "Google's UI toolkit for cross-platform apps",
      icon: Code,
      url: "https://flutter.dev/",
      rating: 5,
      popular: false,
      tags: ["Cross-platform", "Dart", "Framework"]
    },
    {
      id: 36,
      name: "Expo",
      category: "mobile",
      description: "Platform for building React Native applications",
      icon: Code,
      url: "https://expo.dev/",
      rating: 4,
      popular: false,
      tags: ["React Native", "Development", "Tools"]
    },
    {
      id: 37,
      name: "Firebase",
      category: "mobile",
      description: "Backend platform for mobile and web applications",
      icon: Database,
      url: "https://firebase.google.com/",
      rating: 5,
      popular: false,
      tags: ["Backend", "Database", "Cloud"]
    },
    {
      id: 38,
      name: "Ionic",
      category: "mobile",
      description: "Cross-platform mobile app development framework",
      icon: Code,
      url: "https://ionicframework.com/",
      rating: 4,
      popular: false,
      tags: ["Cross-platform", "Web", "Framework"]
    },

    // Learning & Community Tools
    {
      id: 39,
      name: "Stack Overflow",
      category: "learning",
      description: "Q&A community for programmers and developers",
      icon: BookOpen,
      url: "https://stackoverflow.com/",
      rating: 5,
      popular: false,
      tags: ["Q&A", "Community", "Problem Solving"]
    },
    {
      id: 40,
      name: "freeCodeCamp",
      category: "learning",
      description: "Free coding education platform with interactive courses",
      icon: BookOpen,
      url: "https://www.freecodecamp.org/",
      rating: 5,
      popular: false,
      tags: ["Learning", "Courses", "Certifications"]
    },
    {
      id: 41,
      name: "MDN Web Docs",
      category: "learning",
      description: "Comprehensive documentation for web technologies",
      icon: FileCode,
      url: "https://developer.mozilla.org/",
      rating: 5,
      popular: false,
      tags: ["Documentation", "Web", "Reference"]
    },
    {
      id: 42,
      name: "W3Schools",
      category: "learning",
      description: "Web development tutorials and references",
      icon: BookOpen,
      url: "https://www.w3schools.com/",
      rating: 4,
      popular: false,
      tags: ["Tutorials", "Web", "Learning"]
    },
    {
      id: 43,
      name: "Codecademy",
      category: "learning",
      description: "Interactive platform for learning programming",
      icon: Code,
      url: "https://www.codecademy.com/",
      rating: 5,
      popular: false,
      tags: ["Learning", "Interactive", "Courses"]
    },
    {
      id: 44,
      name: "LeetCode",
      category: "learning",
      description: "Platform for coding interview preparation",
      icon: Terminal,
      url: "https://leetcode.com/",
      rating: 5,
      popular: false,
      tags: ["Coding Practice", "Interviews", "Algorithms"]
    },
    {
      id: 45,
      name: "HackerRank",
      category: "learning",
      description: "Coding challenges and technical skills assessment",
      icon: Code,
      url: "https://www.hackerrank.com/",
      rating: 5,
      popular: false,
      tags: ["Practice", "Challenges", "Skills"]
    },
    {
      id: 46,
      name: "GitHub Community",
      category: "learning",
      description: "Open source community and collaboration platform",
      icon: GitBranch,
      url: "https://github.com/",
      rating: 5,
      popular: false,
      tags: ["Open Source", "Community", "Collaboration"]
    },
    {
      id: 47,
      name: "Dev.to",
      category: "learning",
      description: "Community of developers sharing knowledge",
      icon: Globe,
      url: "https://dev.to/",
      rating: 4,
      popular: false,
      tags: ["Community", "Articles", "Blogging"]
    },
    {
      id: 48,
      name: "Reddit - r/programming",
      category: "learning",
      description: "Programming community discussions and news",
      icon: Globe,
      url: "https://www.reddit.com/r/programming/",
      rating: 4,
      popular: false,
      tags: ["Community", "Discussions", "News"]
    },
    {
      id: 49,
      name: "Udemy",
      category: "learning",
      description: "Online learning platform with thousands of courses",
      icon: Video,
      url: "https://www.udemy.com/",
      rating: 4,
      popular: false,
      tags: ["Courses", "Video", "Learning"]
    },
    {
      id: 50,
      name: "Coursera",
      category: "learning",
      description: "Online courses from top universities and companies",
      icon: BookOpen,
      url: "https://www.coursera.org/",
      rating: 5,
      popular: false,
      tags: ["University", "Certifications", "Courses"]
    },
    {
      id: 51,
      name: "edX",
      category: "learning",
      description: "Free online courses from leading institutions",
      icon: BookOpen,
      url: "https://www.edx.org/",
      rating: 5,
      popular: false,
      tags: ["University", "Free", "Courses"]
    },
    {
      id: 52,
      name: "GeeksforGeeks",
      category: "learning",
      description: "Computer science portal with tutorials and practice",
      icon: Code,
      url: "https://www.geeksforgeeks.org/",
      rating: 5,
      popular: false,
      tags: ["Tutorials", "Algorithms", "Practice"]
    },
    {
      id: 53,
      name: "YouTube - Programming Channels",
      category: "learning",
      description: "Video tutorials and coding content",
      icon: Video,
      url: "https://www.youtube.com/results?search_query=programming+tutorials",
      rating: 5,
      popular: false,
      tags: ["Video", "Tutorials", "Free"]
    },
    {
      id: 54,
      name: "The Odin Project",
      category: "learning",
      description: "Free full-stack web development curriculum",
      icon: BookOpen,
      url: "https://www.theodinproject.com/",
      rating: 5,
      popular: false,
      tags: ["Web Development", "Full Stack", "Free"]
    },
    {
      id: 55,
      name: "CS50",
      category: "learning",
      description: "Harvard's introduction to computer science",
      icon: BookOpen,
      url: "https://cs50.harvard.edu/",
      rating: 5,
      popular: false,
      tags: ["University", "Computer Science", "Free"]
    },
    {
      id: 56,
      name: "Discord - Dev Communities",
      category: "learning",
      description: "Real-time chat communities for developers",
      icon: Globe,
      url: "https://discord.com/",
      rating: 4,
      popular: false,
      tags: ["Community", "Chat", "Networking"]
    }
  ];

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const token = localStorage.getItem("student_token");
      const profileRes = await apiRequest("/api/student-auth/profile", "GET", null, token);
      const profileData = profileRes?.data?.profile || profileRes?.profile;
      setStudent(profileData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch student data:", error);
      setLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesCategory = tool.category === activeCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Check if search is active
  const isSearchActive = searchQuery.trim() !== "";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] bg-gray-50 flex flex-col min-h-screen">
      <Header
        name={student?.name_of_students || student?.name || "Student"}
        id={student?.enrollment_no || "----"}
      />
      
      <div className="flex flex-1 flex-col lg:flex-row mt-[70px] md:mt-[70px]">
        <Sidebar />
        
        <main className="flex-1 lg:ml-72 bg-gray-50">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold">
                        Development Tools
                      </h1>
                      <p className="text-purple-100 text-sm mt-1">
                        Essential resources for your project
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <Zap className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-purple-100">Total Tools</p>
                    <p className="text-lg font-bold">{tools.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Category Filters */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tools, categories, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                </div>

                {/* Category Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                  {categories.map(category => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                          activeCategory === category.id
                            ? "bg-purple-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Tools Display */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            {!isSearchActive ? (
              // Category View
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {categories.find(cat => cat.id === activeCategory)?.icon && 
                    React.createElement(categories.find(cat => cat.id === activeCategory).icon, {
                      className: "w-7 h-7 text-purple-600"
                    })
                  }
                  <h2 className="text-2xl font-bold text-gray-900">
                    {categories.find(cat => cat.id === activeCategory)?.name}
                  </h2>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                    {filteredTools.length}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTools.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                              <Icon className="w-6 h-6 text-purple-600" />
                            </div>
                            {tool.popular && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md">
                                <Star className="w-3 h-3" />
                                Popular
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tool.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${
                                index < tool.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Search Results View
              <>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Found <span className="font-semibold text-gray-900">{filteredTools.length}</span> tools matching "{searchQuery}"
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTools.map(tool => {
                    const Icon = tool.icon;
                    return (
                      <a
                        key={tool.id}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                              <Icon className="w-6 h-6 text-purple-600" />
                            </div>
                            {tool.popular && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-md">
                                <Star className="w-3 h-3" />
                                Popular
                              </span>
                            )}
                          </div>
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                          {tool.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {tool.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <Star
                              key={index}
                              className={`w-4 h-4 ${
                                index < tool.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* No Results */}
                {filteredTools.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <PackageSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tools Found</h3>
                    <p className="text-gray-600">
                      Try adjusting your search to find what you're looking for
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Tools;
