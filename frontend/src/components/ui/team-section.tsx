"use client";

import React from "react";
import { Marquee } from "@/components/ui/marquee";
import { Users } from "lucide-react";

const teamMembers = [
  {
    image: "/raunak.jpeg",
    name: "Raunak Ahmed",
    role: "New York University",
  },
  {
    image: "/Upasana.jpeg",
    name: "Upasana Chakraborty",
    role: "New York University",
  },
  {
    image: "/vignesh.jpeg",
    name: "Vignesh Shanmugasundaram",
    role: "New York University",
  },
  {
    image: "/hemanesh.jpg",
    name: "Hemanesh Kamireddy",
    role: "New York University",
  },
  {
    image: "/dhiraj.jpg",
    name: "Dheeraj Pakala",
    role: "New York University",
  },
];

export default function TeamSection() {
  return (
    <section
      id="team"
      className="relative w-full overflow-hidden py-20 md:py-28"
      style={{ background: "#000000" }}
    >
      {/* Decorative SVG */}
      <div>
        <svg
          className="absolute right-0 bottom-0 text-gray-800 opacity-30"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_team)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_team">
              <rect fill="white" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mx-auto mb-16 flex max-w-5xl flex-col items-center px-6 text-center lg:px-0">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white">
            <Users className="w-6 h-6" />
          </div>

          <h2 className="relative mb-4 font-bold text-4xl text-white tracking-tight sm:text-5xl">
            Meet Our Team
            <svg
              className="absolute -top-2 -right-8 -z-10 w-24 text-gray-700 opacity-50"
              fill="currentColor"
              height="86"
              viewBox="0 0 108 86"
              width="108"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M38.8484 16.236L15 43.5793L78.2688 15L18.1218 71L93 34.1172L70.2047 65.2739"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="28"
              />
            </svg>
          </h2>
          <p className="max-w-2xl text-gray-400">
            The Team behind IntelliTract — building the future
            of agile project management with passion and precision.
          </p>
        </div>

        {/* Marquee */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-32 bg-gradient-to-r from-[#000000] to-transparent" />
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-32 bg-gradient-to-l from-[#000000] to-transparent" />

          <Marquee className="[--gap:1.5rem]" pauseOnHover>
            {teamMembers.map((member) => (
              <div
                className="group flex w-64 shrink-0 flex-col"
                key={member.name}
              >
                <div className="relative w-full overflow-hidden rounded-2xl bg-gray-800" style={{ height: "22rem" }}>
                  <img
                    alt={member.name}
                    className="h-full w-full object-cover grayscale transition-all duration-300 hover:grayscale-0"
                    src={member.image}
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 w-full rounded-lg bg-gray-900/85 backdrop-blur-sm p-3">
                    <h3 className="font-semibold text-white">
                      {member.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {member.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>

        {/* Testimonial */}
        <div className="mx-auto mt-20 max-w-3xl px-6 text-center lg:px-0">
          <p className="mb-8 font-medium text-lg text-gray-300 leading-relaxed md:text-xl italic">
            "IntelliTract has transformed how our engineering team manages sprints.
            The intelligent task assignment alone saved us 30% of our planning time."
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-orange-500/50">
              <img
                alt="Upasana Chakraborty"
                className="h-full w-full object-cover"
                src="/Upasana.jpeg"
                loading="lazy"
              />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">
                Upasana Chakraborty
              </p>
              <p className="text-gray-500 text-sm">
                New York University · IntelliTract
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
