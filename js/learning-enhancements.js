(() => {
  if (window.__SSA_LEARNING_ENHANCEMENTS__) return;
  window.__SSA_LEARNING_ENHANCEMENTS__ = true;
  const root = location.pathname;
  const load = (src) => {
    if (document.querySelector(`script[data-ssa-enhancement="${src}"]`)) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = src;
    script.dataset.ssaEnhancement = src;
    document.body.appendChild(script);
  };
  const boot = () => {
    if (root.includes("/student/dashboard")) load("/student/js/xp-runtime.js");
    if (root.includes("/student/course-player")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/student/css/class-discussion.css";
      document.head.appendChild(link);
      load("/student/js/class-discussion.js");
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();
})();
