import React from "react";
import { SignInPage } from "./ui/sign-in-flow-1";
import { Activity, Rocket, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "../AuthContext";

export default function LandingPage() {
  const { login } = useAuth();

  const handleLoginSuccess = async () => {
    // In our mock dashboard, we simulate a successful login
    // we bypass email/pw using the user's provided email.
    // the backend will just accept it as mock data for our demo locally.
    await login("alice@example.com", "password123");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-rose-900 selection:text-white">
      {/* Login / Hero Section */}
      <section id="login" className="w-full h-screen relative">
        <SignInPage onLoginSuccess={handleLoginSuccess} />
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 max-w-7xl mx-auto relative z-10 bg-black">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-300">
            About IntelliTract
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Our mission is to simplify modern sprint monitoring. With integrated workflows for scrum masters, developers, and admins, your agile team operates flawlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop" 
              alt="Team at work" 
              className="rounded-2xl opacity-80 hover:opacity-100 transition duration-500"
            />
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-red-900/40 p-4 rounded-xl flex-shrink-0 self-start">
                <Rocket className="text-red-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Accelerate Delivery</h3>
                <p className="text-white/60">Unlock peak performance through intelligent sprint allocations and integrated developer capacities.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-red-900/40 p-4 rounded-xl flex-shrink-0 self-start">
                <ShieldCheck className="text-red-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Secure Collaboration</h3>
                <p className="text-white/60">Built on modern architecture, ensure your proprietary projects stay secure within dedicated team boundaries.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Unleash Your Potential</h2>
            <p className="text-lg text-white/60">Robust features designed to tackle the most demanding backlogs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl hover:border-red-500/30 transition duration-300">
              <Activity className="w-10 h-10 text-red-500 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Live Developer Profiles</h3>
              <p className="text-white/60">Maintain real-time statuses and capacities for every team member to prevent cognitive overload.</p>
            </div>
            
            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl hover:border-red-500/30 transition duration-300">
              <Users className="w-10 h-10 text-red-500 mb-6" />
              <h3 className="text-xl font-semibold mb-3">Role-Based Access</h3>
              <p className="text-white/60">Separation of concerns between Developers, Scrum Masters, and Administrators inherently drives focus.</p>
            </div>

            <div className="bg-[#111] border border-white/5 p-8 rounded-3xl hover:border-red-500/30 transition duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-500" />
              <Rocket className="w-10 h-10 text-red-500 mb-6 relative z-10" />
              <h3 className="text-xl font-semibold mb-3 relative z-10">Smart Assignments</h3>
              <p className="text-white/60 relative z-10">Easily allocate tasks requiring specific skills directly to the most qualified team member.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-6 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed by Excellence</h2>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-16">Our leading product designers and engineers architected IntelliTract to fit flawlessly into your organization.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { name: "John Doe", title: "Lead Engineer", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
            { name: "Jane Smith", title: "Product Manager", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
            { name: "Alex Chen", title: "Designer", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop" },
            { name: "Sarah Jones", title: "Scrum Master", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop" },
          ].map((member, i) => (
            <div key={i} className="group">
              <div className="relative overflow-hidden rounded-full w-32 h-32 mx-auto mb-4 border border-white/10 group-hover:border-red-500/50 transition">
                <img src={member.img} alt={member.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              </div>
              <h4 className="font-semibold text-lg">{member.name}</h4>
              <p className="text-white/50 text-sm">{member.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center text-white/40">
        <p>&copy; {new Date().getFullYear()} IntelliTract Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
