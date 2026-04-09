import React, { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { InfiniteGrid } from "./components/ui/the-infinite-grid";
import TeamSection from "./components/ui/team-section";
import RadialOrbitalTimeline from "./components/ui/radial-orbital-timeline";
import { FeatureCard } from "./components/ui/grid-feature-cards";
import { CircularRevealHeading } from "./components/ui/circular-reveal-heading";
import { LiquidMetalButton } from "./components/ui/liquid-metal-button";
import AnimatedTextCycle from "./components/ui/animated-text-cycle";
import {
  Zap,
  Shield,
  BarChart3,
  Users,
  Workflow,
  Brain,
  ChevronDown,
  Menu,
  X,
  Code,
  FileText,
  Database,
  Server,
  Palette,
  Box,
  Sparkles,
  Globe,
  Layers,
  PackageCheck,
} from "lucide-react";

interface HomePageProps {
  onNavigateToLogin: () => void;
}

/* ─── FAQ Data ─── */
const faqItems = [
  {
    question: "What is IntelliTract?",
    answer:
      "IntelliTract is an AI-powered agile intelligence platform that provides real-time sprint monitoring, intelligent task assignment, and structured developer profile management for modern engineering teams.",
  },
  {
    question: "How does the intelligent task assignment work?",
    answer:
      "IntelliTract analyzes developer profiles — including skills, current workload, capacity, and availability — to recommend the most qualified team member for each task. This reduces planning overhead and ensures optimal resource allocation.",
  },
  {
    question: "What roles does IntelliTract support?",
    answer:
      "IntelliTract supports three distinct roles: Administrators (user management & oversight), Scrum Masters (task creation & sprint coordination), and Developers (profile management & task execution). Each role has tailored dashboards and permissions.",
  },
  {
    question: "What technologies power IntelliTract?",
    answer:
      "The platform is built with React 19 and Tailwind CSS on the frontend, FastAPI with SQLite on the backend, and leverages Three.js for immersive 3D login experiences. The architecture is designed for extensibility and real-time performance.",
  },
  {
    question: "Can I integrate IntelliTract with existing tools?",
    answer:
      "IntelliTract exposes a RESTful API that can be integrated with CI/CD pipelines, Slack bots, and other project management tools. Our API-first approach ensures seamless interoperability with your existing workflow.",
  },
  {
    question: "Is IntelliTract suitable for large teams?",
    answer:
      "Absolutely. IntelliTract's role-based access control, workload balancing, and capacity tracking are designed to scale from small startups to enterprise engineering organizations with hundreds of developers.",
  },
];

/* ─── Feature Cards Data ─── */
const features = [
  {
    title: "Real-Time Sprint Tracking",
    icon: Zap,
    description:
      "Monitor task progress with live dashboards showing To Do, In Progress, and Done statuses with completion percentages.",
  },
  {
    title: "Intelligent Task Assignment",
    icon: Brain,
    description:
      "AI-driven recommendations match tasks to developers based on skills, workload, and availability for optimal allocation.",
    highlight: true,
  },
  {
    title: "Developer Profiles",
    icon: Users,
    description:
      "Comprehensive profiles tracking skills, interests, experience level, GitHub/LinkedIn connections, and real-time capacity.",
  },
  {
    title: "Role-Based Access Control",
    icon: Shield,
    description:
      "Three-tier permission system (Admin, Scrum Master, Developer) ensures each team member sees only what they need.",
    highlight: true,
  },
  {
    title: "Workload Analytics",
    icon: BarChart3,
    description:
      "Visualize team workload distribution and identify bottlenecks before they impact sprint velocity.",
  },
  {
    title: "Sprint Workflow Engine",
    icon: Workflow,
    description:
      "Structured workflows for task creation, assignment, status transitions, and sprint retrospectives.",
    highlight: true,
  },
];

/* ─── Tech Stack Timeline Data ─── */
const techStackTimeline = [
  {
    id: 1,
    title: "React 19",
    date: "Frontend",
    content: "Modern component architecture with hooks, concurrent rendering, and a fully reactive UI layer powering every dashboard view.",
    category: "Frontend",
    icon: Code,
    relatedIds: [2, 3, 6],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "TypeScript 6",
    date: "Type Safety",
    content: "End-to-end static typing across all components, API schemas, and state — eliminating runtime errors and improving DX.",
    category: "Language",
    icon: FileText,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Tailwind CSS 4",
    date: "Styling",
    content: "Utility-first CSS framework with the new Vite plugin, enabling rapid responsive UI with zero config and design system tokens.",
    category: "Styling",
    icon: Palette,
    relatedIds: [1, 2, 4],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 4,
    title: "Vite 8",
    date: "Build Tool",
    content: "Lightning-fast dev server and bundler with HMR, native ESM, and optimized production builds for the React frontend.",
    category: "Tooling",
    icon: Zap,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 5,
    title: "FastAPI",
    date: "Backend",
    content: "High-performance async Python API framework with automatic OpenAPI docs, JWT auth, and Pydantic schema validation.",
    category: "Backend",
    icon: Server,
    relatedIds: [6, 7],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 6,
    title: "SQLite",
    date: "Database",
    content: "Lightweight serverless relational database storing users, profiles, tasks, and sprint data via SQLAlchemy ORM.",
    category: "Database",
    icon: Database,
    relatedIds: [5, 7],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 7,
    title: "Framer Motion",
    date: "Animation",
    content: "Production-ready motion library powering scroll animations, FAQ accordions, page transitions, and animated text cycles.",
    category: "Animation",
    icon: Sparkles,
    relatedIds: [1, 8],
    status: "completed" as const,
    energy: 88,
  },
  {
    id: 8,
    title: "Three.js + Spline",
    date: "3D Graphics",
    content: "WebGL-powered 3D rendering via react-three-fiber and Spline for immersive hero scenes and interactive visual experiences.",
    category: "3D",
    icon: Box,
    relatedIds: [1, 7],
    status: "completed" as const,
    energy: 78,
  },
  {
    id: 9,
    title: "Radix UI + Lucide",
    date: "UI Primitives",
    content: "Accessible headless UI primitives from Radix combined with Lucide's consistent icon system across all components.",
    category: "UI",
    icon: Layers,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 82,
  },
  {
    id: 10,
    title: "Axios",
    date: "HTTP Client",
    content: "Promise-based HTTP client handling all REST API communication between the React frontend and FastAPI backend with JWT headers.",
    category: "Networking",
    icon: Globe,
    relatedIds: [5, 6],
    status: "completed" as const,
    energy: 80,
  },
];

/* ─── About Circular Reveal Data ─── */
const aboutItems = [
  {
    text: "AGILE",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop",
  },
  {
    text: "SPRINT",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop",
  },
  {
    text: "TRACKING",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop",
  },
  {
    text: "INTELLIGENCE",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop",
  },
];

/* ─── Logo Component ─── */
function Logo({ height = 48 }: { height?: number }) {
  return (
    <img
      src="/intellitract-logo.png"
      alt="IntelliTract"
      className="object-contain"
      style={{ height }}
    />
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: { question: string; answer: string };
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
    >
      <motion.div
        animate={{
          borderColor: isOpen ? "rgba(234,88,12,0.45)" : "rgba(229,231,235,1)",
          backgroundColor: isOpen ? "rgba(255,247,237,0.6)" : "rgba(255,255,255,1)",
        }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl overflow-hidden border"
        style={{ background: "white" }}
      >
        {/* Left accent bar */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ background: "linear-gradient(180deg,#ea580c,#f97316)" }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />

        <button
          onClick={onToggle}
          className="relative w-full flex items-center gap-4 px-6 py-5 text-left"
        >
          {/* Number */}
          <motion.span
            animate={{ color: isOpen ? "#ea580c" : "#d1d5db" }}
            transition={{ duration: 0.3 }}
            className="text-sm font-bold tabular-nums shrink-0 w-6"
          >
            {String(index + 1).padStart(2, "0")}
          </motion.span>

          <span className="text-black font-medium text-base md:text-lg flex-1 pr-2">
            {item.question}
          </span>

          {/* Animated chevron */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0"
          >
            <motion.div
              animate={{ color: isOpen ? "#ea580c" : "#9ca3af" }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </button>

        {/* Animated answer */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="answer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: -8 }}
                animate={{ y: 0 }}
                exit={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="px-6 pb-6 pl-16 text-black leading-relaxed text-sm md:text-base"
              >
                {item.answer}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ─── Animated Container ─── */
function AnimatedContainer({
  className,
  delay = 0.1,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Navbar ─── */
function Navbar({ onLoginClick }: { onLoginClick: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Features", href: "#features" },
    { label: "Tech Stack", href: "#techstack" },
    { label: "Team", href: "#team" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <nav
          className="flex items-center justify-between px-6 py-3 rounded-full border border-gray-200 backdrop-blur-xl shadow-sm"
          style={{ background: "rgba(255, 255, 255, 0.85)" }}
        >
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2">
            <Logo height={44} />
            <span className="text-black font-bold text-lg hidden sm:inline" style={{ letterSpacing: '0.1em', fontFamily: '"Saira Stencil", sans-serif' }}>
              INTELLITRACT
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-500 rounded-full hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Login CTA */}
          <div className="hidden md:flex items-center gap-3">
            <LiquidMetalButton label="Login" onClick={onLoginClick} />
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-600 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden mt-2 p-4 rounded-2xl border border-gray-200 backdrop-blur-xl shadow-lg"
            style={{ background: "rgba(255, 255, 255, 0.95)" }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileOpen(false);
                onLoginClick();
              }}
              className="w-full mt-2 px-6 py-3 text-sm font-semibold text-white rounded-full"
              style={{
                background: "linear-gradient(135deg, #ea580c, #f97316)",
              }}
            >
              Login
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── Main Home Page ─── */
export default function HomePage({ onNavigateToLogin }: HomePageProps) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#0f172a" }}>
      <Navbar onLoginClick={onNavigateToLogin} />

      {/* ── Hero ── */}
      <section id="home">
        <InfiniteGrid
          onGetStarted={onNavigateToLogin}
          onLearnMore={() => scrollToSection("features")}
        />
      </section>

      {/* ── About (Circular Reveal Heading) ── */}
      <section id="about" className="py-24 px-6" style={{ background: "#f0f0f0" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left: Circular Reveal */}
            <AnimatedContainer className="flex-shrink-0">
              <CircularRevealHeading
                items={aboutItems}
                centerText={
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#444444] tracking-wide">
                      ABOUT
                    </div>
                  </div>
                }
                size="lg"
              />
            </AnimatedContainer>

            {/* Right: About content */}
            <AnimatedContainer delay={0.3} className="flex-1 text-center lg:text-left">
              <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">
                About INTELLITRACT
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
                Smarter{" "}
                <AnimatedTextCycle
                  words={["Sprints", "Planning", "Workflows", "Delivery", "Tracking"]}
                  interval={2500}
                  className="text-orange-500"
                />
                ,<br />Stronger Teams
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                IntelliTract is an AI-powered agile intelligence platform designed
                for modern engineering teams. It combines real-time sprint monitoring,
                intelligent task assignment, and developer profiling into one
                cohesive experience.
              </p>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Our platform leverages machine learning to automatically match
                tasks to the best-suited developer based on skills, capacity,
                and workload — reducing planning overhead by up to 30%.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="px-5 py-3 rounded-xl border border-gray-700 bg-gray-900">
                  <div className="text-2xl font-bold text-orange-500">30%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Less Planning</div>
                </div>
                <div className="px-5 py-3 rounded-xl border border-gray-700 bg-gray-900">
                  <div className="text-2xl font-bold text-orange-500">3x</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Faster Sprints</div>
                </div>
                <div className="px-5 py-3 rounded-xl border border-gray-700 bg-gray-900">
                  <div className="text-2xl font-bold text-orange-500">100%</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Visibility</div>
                </div>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      {/* ── Features (Grid Feature Cards) ── */}
      <section id="features" className="py-16 md:py-32" style={{ background: "#ffffff" }}>
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4">
          <AnimatedContainer className="mx-auto max-w-3xl text-center">
            <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-wide text-balance md:text-4xl lg:text-5xl xl:font-extrabold text-black">
              Power. Speed. Control.
            </h2>
            <p className="text-gray-400 mt-6 text-lg font-light">
              Your{" "}
              <AnimatedTextCycle
                words={["sprints", "team", "workflow", "velocity", "planning", "delivery"]}
                interval={2500}
                className="text-orange-500"
              />{" "}
              deserves intelligent tooling.
            </p>
          </AnimatedContainer>

          <AnimatedContainer
            delay={0.4}
            className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed divide-gray-200 border-gray-200 sm:grid-cols-2 md:grid-cols-3"
          >
            {features.map((feature, i) => (
              <FeatureCard key={i} feature={feature} />
            ))}
          </AnimatedContainer>
        </div>
      </section>

      {/* ── Tech Stack (Radial Orbital Timeline) ── */}
      <section id="techstack" className="py-24 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">
          <AnimatedContainer className="text-center mb-12">
            <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">
              Tech Stack
            </p>
            <h2 className="text-3xl font-bold tracking-wide md:text-4xl lg:text-5xl text-black">
              Built With Modern Tools
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base">
              Click on any node to explore our technology stack and see how each
              tool connects to the rest of the platform.
            </p>
          </AnimatedContainer>

          <AnimatedContainer delay={0.4}>
            <RadialOrbitalTimeline timelineData={techStackTimeline} />
          </AnimatedContainer>
        </div>
      </section>

      {/* ── Team ── */}
      <TeamSection />

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-3xl mx-auto">
          <AnimatedContainer className="text-center mb-16">
            <p className="text-orange-500 text-sm font-semibold tracking-widest uppercase mb-3">
              FAQ
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-500 text-lg">
              Got questions? We've got answers.
            </p>

            {/* Live progress indicator */}
            <div className="flex items-center justify-center gap-2 mt-6">
              {faqItems.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  animate={{
                    width: openFAQ === i ? 28 : 8,
                    backgroundColor: openFAQ === i ? "#ea580c" : "#e5e7eb",
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-2 rounded-full"
                  aria-label={`Jump to question ${i + 1}`}
                />
              ))}
            </div>
          </AnimatedContainer>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div key={i} className="relative">
                <FAQItem
                  item={item}
                  index={i}
                  isOpen={openFAQ === i}
                  onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-12 px-6" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo height={40} />
            <span className="text-black font-bold" style={{ letterSpacing: '0.1em', fontFamily: '"Saira Stencil", sans-serif' }}>INTELLITRACT</span>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} INTELLITRACT Platform. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
