import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { fetchPublicStats } from "../redux/thunks/weeksThunks";
import {
  selectPublicStats,
  selectWeeksLoading,
} from "../redux/selectors/weeksSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Home = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectPublicStats);
  const loading = useSelector(selectWeeksLoading);
  const theme = useSelector(selectTheme);

  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);
  const [countersAnimated, setCountersAnimated] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    dispatch(fetchPublicStats());
  }, [dispatch]);

  useEffect(() => {
    const currentRef = statsRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated && !loading) {
            setCountersAnimated(true);
            setTimeout(() => {
              animateCounters();
            }, 100);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [countersAnimated, loading]);

  const animateCounters = () => {
    const statNumbers = document.querySelectorAll(".stat-number");
    statNumbers.forEach((stat) => {
      const target = parseInt(stat.getAttribute("data-target")) || 0;
      if (target === 0) {
        stat.textContent = "0";
        return;
      }
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          stat.textContent = target;
        }
      };

      updateCounter();
    });
  };

  const displayStats = {
    totalUsers: stats?.totalUsers || 0,
    totalWeeks: stats?.totalWeeks || 0,
    totalSubmissions: stats?.totalSubmissions || 0,
  };
  return (
    <div>
      <Navbar />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-[500px] w-[500px] animate-pulse rounded-full bg-neutral-100 opacity-60 blur-[100px] dark:bg-neutral-900 dark:opacity-20" />
        <div className="absolute -bottom-20 -right-20 h-[400px] w-[400px] animate-pulse rounded-full bg-neutral-200 opacity-60 blur-[100px] dark:bg-neutral-800 dark:opacity-20" />
      </div>

      <main className="container relative z-10 mx-auto px-6 pt-32 lg:pt-40">
        <section
          className={`text-center transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="mb-10 inline-block rounded-full border border-neutral-200 bg-white/50 px-6 py-2 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/50">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Where Excellence Meets Discipline
            </span>
          </div>

          <h1 className="mb-8 flex flex-col items-center justify-center text-7xl font-black tracking-tighter md:text-9xl">
            <span className="text-black dark:text-white">Athena</span>
            <span className="bg-gradient-to-r from-neutral-300 via-neutral-900 to-neutral-300 bg-clip-text text-transparent dark:from-neutral-700 dark:via-white dark:to-neutral-700">
              Nexus
            </span>
          </h1>

          <div className="relative mx-auto mb-12 max-w-2xl italic">
            <span className="absolute -left-8 -top-12 text-9xl text-neutral-100 dark:text-neutral-900">
              "
            </span>
            <p className="text-4xl font-medium md:text-6xl">
              Discipline is the motivation
            </p>
            <span className="absolute -right-8 -bottom-12 text-9xl text-neutral-100 dark:text-neutral-900">
              "
            </span>
          </div>

          <p className="mx-auto mb-14 max-w-xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400">
            Weekly project challenges for teams of 3. Submit your GitHub repos,
            showcase your work, and grow through disciplined practice.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/challenges"
              className="rounded-full bg-neutral-900 px-10 py-4 font-bold text-white transition-all hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              View Challenges
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-neutral-300 px-10 py-4 font-bold transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              Register Now
            </Link>
          </div>
        </section>

        <section
          className={`mt-40 grid gap-8 md:grid-cols-3 transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          {[
            {
              title: "Weekly Challenges",
              icon: "01",
              desc: "Fresh prompts every week to sharpen your full-stack skills.",
            },
            {
              title: "Milestones",
              icon: "02",
              desc: "Unlock levels and categories as your team masters new tech.",
            },
            {
              title: "Public Gallery",
              icon: "03",
              desc: "Display your repos to the community and get inspired.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-white p-10 transition-all hover:-translate-y-2 hover:border-neutral-900 dark:border-neutral-900 dark:bg-neutral-900/30 dark:hover:border-white"
            >
              <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
              <p className="text-neutral-500 dark:text-neutral-400">
                {feature.desc}
              </p>
            </div>
          ))}
        </section>

        <section
          ref={statsRef}
          className={`mt-40 mb-40 transition-all duration-1000 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Active Teams", target: displayStats.totalUsers },
              { label: "Challenges", target: displayStats.totalWeeks },
              { label: "Submissions", target: displayStats.totalSubmissions },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-3xl border border-neutral-100 bg-neutral-50/50 py-16 dark:border-neutral-900 dark:bg-neutral-900/20"
              >
                <span
                  className="stat-number text-6xl font-black tabular-nums md:text-7xl"
                  data-target={stat.target}
                >
                  0
                </span>
                <span className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
