// @ts-nocheck
export function mountAboutRoadmap(pageRoot: ShadowRoot) {
      const controller = new AbortController(),
        signal = controller.signal;
      const styleRoot = pageRoot.host;

      const reduceRgbMotion = matchMedia("(prefers-reduced-motion: reduce)");
      function syncRgbOutlineMotion() {
        pageRoot.querySelectorAll(".hero-next, .hero-z-halo svg, .idea-title-outline, .founder-faq__questions svg").forEach((svg) => {
          if (reduceRgbMotion.matches) svg.pauseAnimations?.();
          else svg.unpauseAnimations?.();
        });
      }
      reduceRgbMotion.addEventListener("change", syncRgbOutlineMotion, { signal });
      syncRgbOutlineMotion();

      const roadmapStory = pageRoot.querySelector(".story"),
        roadmapChapters = [...roadmapStory.querySelectorAll(":scope > .chapter")],
        roadmapInsertionAnchor = roadmapChapters[0],
        crossingOneIndex = roadmapChapters.findIndex((chapter) => chapter.textContent.includes("CROSSING 01")),
        futureChapter = roadmapStory.querySelector(":scope > .future-convergence"),
        roadmapInsertionMarker = document.createComment("roadmap phases");
      roadmapInsertionAnchor.before(roadmapInsertionMarker);

      function createRoadmapPhase(index, id, title, accent, nodes, open = false) {
        const phase = document.createElement("details"),
          summary = document.createElement("summary"),
          content = document.createElement("div");
        phase.className = `roadmap-phase roadmap-phase--${id}`;
        phase.dataset.phase = id;
        phase.style.setProperty("--phase-accent", accent);
        phase.open = open;
        summary.className = "roadmap-phase__summary";
        summary.innerHTML = `<span class="roadmap-phase__index">${String(index + 1).padStart(2, "0")}</span><span class="roadmap-phase__title">${title}</span><span class="roadmap-phase__state" aria-hidden="true"></span><span class="roadmap-phase__rails" aria-hidden="true"><i></i><i></i><i></i></span>`;
        content.className = "roadmap-phase__content";
        nodes.forEach((node) => content.append(node));
        phase.append(summary, content);
        return phase;
      }

      const completedPhase = createRoadmapPhase(0, "completed", "Completed", "var(--done)", roadmapChapters.slice(0, crossingOneIndex), true),
        nextPhase = createRoadmapPhase(1, "next", "What’s Next", "var(--system)", roadmapChapters.slice(crossingOneIndex)),
        possiblePhase = createRoadmapPhase(2, "possible", "What Can Be", "var(--cross)", [futureChapter]);
      roadmapInsertionMarker.replaceWith(completedPhase, nextPhase, possiblePhase);
      nextPhase.classList.add("is-teasing");
      possiblePhase.classList.add("is-teasing");

      const roadmapPhases = [completedPhase, nextPhase, possiblePhase],
        activatedPhases = new Set([0]);
      let lastRoadmapScrollY = window.scrollY,
        roadmapTransitionFrame = 0,
        roadmapFinished = false,
        roadmapFinishArmed = false;

      function preservePhaseAnchor(anchor, mutate, targetTop = null) {
        const before = anchor.getBoundingClientRect().top;
        const desiredTop = targetTop ?? before;
        const pageEl = document.documentElement;
        pageEl.style.overflowAnchor = "none";
        const previousScrollBehavior = pageEl.style.scrollBehavior;
        pageEl.style.scrollBehavior = "auto";
        mutate();
        requestAnimationFrame(() => {
          const after = anchor.getBoundingClientRect().top;
          window.scrollTo(0, Math.max(0, window.scrollY + after - desiredTop));
          requestAnimationFrame(() => {
            pageEl.style.overflowAnchor = "";
            pageEl.style.scrollBehavior = previousScrollBehavior;
            window.dispatchEvent(new Event("resize"));
          });
        });
      }

      function activateRoadmapPhase(index) {
        if (activatedPhases.has(index)) return;
        activatedPhases.add(index);
        if (index === 2) roadmapFinishArmed = true;
        const phase = roadmapPhases[index],
          summary = phase.querySelector("summary"),
          stickyTop = Number.parseFloat(getComputedStyle(summary).top) || 0;
        preservePhaseAnchor(summary, () => {
          roadmapPhases.forEach((item, itemIndex) => {
            item.open = itemIndex === index;
            if (itemIndex <= index) item.classList.remove("is-teasing");
          });
        }, stickyTop);
      }

      function roadmapPhaseTriggerY() {
        const summary = completedPhase.querySelector(".roadmap-phase__summary"),
          stickyTop = Number.parseFloat(getComputedStyle(summary).top) || 0;
        return stickyTop + summary.getBoundingClientRect().height;
      }

      function syncRoadmapPhases() {
        if (roadmapTransitionFrame) return;
        roadmapTransitionFrame = requestAnimationFrame(() => {
          roadmapTransitionFrame = 0;
          const scrollingDown = window.scrollY >= lastRoadmapScrollY;
          lastRoadmapScrollY = window.scrollY;
          if (!scrollingDown) return;
          const triggerY = roadmapPhaseTriggerY();
          if (!activatedPhases.has(1) && nextPhase.querySelector("summary").getBoundingClientRect().top <= triggerY) {
            activateRoadmapPhase(1);
            return;
          }
          if (!activatedPhases.has(2) && possiblePhase.querySelector("summary").getBoundingClientRect().top <= triggerY) {
            activateRoadmapPhase(2);
            return;
          }
          const techStack = pageRoot.querySelector("#tech-stack");
          if (roadmapFinishArmed && !roadmapFinished && techStack.getBoundingClientRect().top <= triggerY) {
            roadmapFinished = true;
            preservePhaseAnchor(techStack, () => roadmapPhases.forEach((phase) => {
              phase.open = false;
              phase.classList.remove("is-teasing");
            }));
          }
        });
      }
      window.addEventListener("scroll", syncRoadmapPhases, { passive: true, signal });
      roadmapPhases.forEach((phase) => phase.addEventListener("toggle", () => {
        if (phase.open) phase.classList.remove("is-teasing");
        window.dispatchEvent(new Event("resize"));
      }, { signal }));
      const roadmapEndObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || !roadmapFinishArmed || roadmapFinished || !activatedPhases.has(2)) return;
          if (entry.target.getBoundingClientRect().top > roadmapPhaseTriggerY()) return;
          roadmapFinished = true;
          preservePhaseAnchor(entry.target, () => roadmapPhases.forEach((phase) => {
            phase.open = false;
            phase.classList.remove("is-teasing");
          }));
        });
      }, { threshold: .04 });
      roadmapEndObserver.observe(pageRoot.querySelector("#tech-stack"));

      let stopTopoField = () => {};
      const topoCanvas = pageRoot.querySelector("#topo-field"),
        topoGl = topoCanvas.getContext("webgl", {
          alpha: false,
          antialias: true,
          depth: false,
        });
      if (topoGl) {
        const vertexSource = `
            attribute vec2 a_position;
            void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
          `,
          fragmentSource = `
            precision highp float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform float u_dpr;

            vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
            float snoise(vec2 v) {
              const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
              vec2 i = floor(v + dot(v, C.yy));
              vec2 x0 = v - i + dot(i, C.xx);
              vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
              vec4 x12 = x0.xyxy + C.xxzz;
              x12.xy -= i1;
              i = mod(i, 289.0);
              vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
              vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
              m = m * m;
              m = m * m;
              vec3 x = 2.0 * fract(p * C.www) - 1.0;
              vec3 h = abs(x) - 0.5;
              vec3 ox = floor(x + 0.5);
              vec3 a0 = x - ox;
              m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
              vec3 g;
              g.x = a0.x * x0.x + h.x * x0.y;
              g.yz = a0.yz * x12.xz + h.yz * x12.yw;
              return 130.0 * dot(m, g);
            }

            void main() {
              vec2 st = gl_FragCoord.xy / u_resolution.xy;
              st.x *= u_resolution.x / u_resolution.y;

              float gridSize = 48.0 * u_dpr;
              vec2 gridFract = fract(gl_FragCoord.xy / gridSize);
              float lineThickness = 1.0 / gridSize;
              float gridLines = step(1.0 - lineThickness, gridFract.x) + step(1.0 - lineThickness, gridFract.y);
              gridLines = clamp(gridLines, 0.0, 1.0) * 0.12;

              vec2 noisePos = st * 1.4 + vec2(u_time * 0.015, u_time * 0.025);
              float n = snoise(noisePos) * 0.5 + 0.5;
              float triangleWave = abs(fract(n * 10.0) - 0.5) * 2.0;
              float topoLines = smoothstep(0.02, 0.00, triangleWave) * 0.45;

              vec3 zaylistBlack = vec3(0.0196, 0.0196, 0.0235);
              vec3 contourInk = vec3(0.929, 0.933, 0.941);
              float lines = clamp(gridLines + topoLines, 0.0, 1.0);
              vec3 color = mix(zaylistBlack, contourInk, lines);
              gl_FragColor = vec4(color, 1.0);
            }
          `;

        function topoShader(type, source) {
          const shader = topoGl.createShader(type);
          topoGl.shaderSource(shader, source);
          topoGl.compileShader(shader);
          return shader;
        }

        const topoProgram = topoGl.createProgram();
        topoGl.attachShader(
          topoProgram,
          topoShader(topoGl.VERTEX_SHADER, vertexSource),
        );
        topoGl.attachShader(
          topoProgram,
          topoShader(topoGl.FRAGMENT_SHADER, fragmentSource),
        );
        topoGl.linkProgram(topoProgram);
        topoGl.useProgram(topoProgram);

        const topoBuffer = topoGl.createBuffer();
        topoGl.bindBuffer(topoGl.ARRAY_BUFFER, topoBuffer);
        topoGl.bufferData(
          topoGl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          topoGl.STATIC_DRAW,
        );
        const topoPosition = topoGl.getAttribLocation(
          topoProgram,
          "a_position",
        );
        topoGl.enableVertexAttribArray(topoPosition);
        topoGl.vertexAttribPointer(topoPosition, 2, topoGl.FLOAT, false, 0, 0);

        const topoResolution = topoGl.getUniformLocation(
            topoProgram,
            "u_resolution",
          ),
          topoTime = topoGl.getUniformLocation(topoProgram, "u_time"),
          topoDpr = topoGl.getUniformLocation(topoProgram, "u_dpr"),
          reduceTopoMotion = matchMedia("(prefers-reduced-motion: reduce)");

        function sizeTopoField() {
          const dpr = Math.min(devicePixelRatio || 1, 2);
          topoCanvas.width = innerWidth * dpr;
          topoCanvas.height = innerHeight * dpr;
          topoGl.viewport(0, 0, topoCanvas.width, topoCanvas.height);
          topoGl.uniform2f(topoResolution, topoCanvas.width, topoCanvas.height);
          topoGl.uniform1f(topoDpr, dpr);
        }
        window.addEventListener("resize", sizeTopoField, { signal });
        sizeTopoField();

        const topoStart = performance.now(),
          topoFrameInterval = 1000 / 18;
        let topoLastFrame = -topoFrameInterval,
          topoFrameRequest = 0;

        function drawTopoField(time) {
          topoFrameRequest = 0;
          if (document.hidden) return;

          if (
            reduceTopoMotion.matches ||
            time - topoLastFrame >= topoFrameInterval
          ) {
            topoLastFrame = time - ((time - topoLastFrame) % topoFrameInterval);
            topoGl.uniform1f(topoTime, (time - topoStart) * 0.001);
            topoGl.drawArrays(topoGl.TRIANGLE_STRIP, 0, 4);
          }

          if (!reduceTopoMotion.matches) {
            topoFrameRequest = requestAnimationFrame(drawTopoField);
          }
        }

        function startTopoField() {
          if (document.hidden || topoFrameRequest) return;
          topoFrameRequest = requestAnimationFrame(drawTopoField);
        }

        document.addEventListener("visibilitychange", () => {
          if (document.hidden) {
            if (topoFrameRequest) cancelAnimationFrame(topoFrameRequest);
            topoFrameRequest = 0;
          } else {
            topoLastFrame = performance.now() - topoFrameInterval;
            startTopoField();
          }
        }, { signal });
        reduceTopoMotion.addEventListener("change", startTopoField, { signal });
        startTopoField();

        const founderBoundary = pageRoot.querySelector("#tucker"),
          topoFieldTint = pageRoot.querySelector(".field");
        function syncTopoToRoadmap() {
          if (!founderBoundary) return;
          const roadmapIsVisible = founderBoundary.getBoundingClientRect().top > innerHeight;
          topoCanvas.style.visibility = roadmapIsVisible ? "visible" : "hidden";
          if (topoFieldTint) topoFieldTint.style.visibility = roadmapIsVisible ? "visible" : "hidden";
          if (roadmapIsVisible) startTopoField();
          else if (topoFrameRequest) {
            cancelAnimationFrame(topoFrameRequest);
            topoFrameRequest = 0;
          }
        }
        window.addEventListener("scroll", syncTopoToRoadmap, { passive: true, signal });
        window.addEventListener("resize", syncTopoToRoadmap, { signal });
        syncTopoToRoadmap();

        stopTopoField = () => {
          if (topoFrameRequest) cancelAnimationFrame(topoFrameRequest);
          topoFrameRequest = 0;
        };
      }

      const story = pageRoot.querySelector(".story"),
        desktopRoutes = pageRoot.querySelector(".routes"),
        futureConvergence = pageRoot.querySelector(".future-convergence"),
        futureRouteRevealRect = pageRoot.querySelector("#future-route-reveal-rect"),
        futureProductRoute = pageRoot.querySelector("#future-route-product"),
        futureSystemRoute = pageRoot.querySelector("#future-route-system"),
        futureUnifiedRoute = pageRoot.querySelector("#future-route-unified"),
        futureConfetti = pageRoot.querySelector(".future-confetti"),
        stops = [...pageRoot.querySelectorAll(".stop")];
      let finalRouteY = 1000,
        finalConfettiFired = false;
      const mobileRoutes = pageRoot.querySelector("#mobile-routes"),
        mobileProductRoute = pageRoot.querySelector("#mobile-route-product"),
        mobileSystemRoute = pageRoot.querySelector("#mobile-route-system"),
        mobileRouteQuery = matchMedia("(max-width: 720px)");

      function mobileRoutePath(selector, railX, storyRect) {
        const points = [...pageRoot.querySelectorAll(selector)]
          .map((node) => {
            const rect = node.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2 - storyRect.left,
              y: rect.top + rect.height / 2 - storyRect.top,
              visible: rect.width > 0 && rect.height > 0,
            };
          })
          .filter((point) => point.visible && point.y >= 0 && point.y <= storyRect.height)
          .sort((a, b) => a.y - b.y);
        if (!points.length) return "";

        const laneHeads = pageRoot.querySelector(".lane-heads"),
          startY = laneHeads.offsetTop + laneHeads.offsetHeight;
        let d = `M ${railX} ${startY}`;
        points.forEach((point, index) => {
          const previousY = index ? points[index - 1].y : startY;
          const available = Math.max(12, point.y - previousY);
          const bend = Math.min(30, available * 0.22);
          d += ` L ${railX} ${point.y - bend}`;
          d += ` Q ${railX} ${point.y} ${point.x} ${point.y}`;
          d += ` Q ${railX} ${point.y} ${railX} ${point.y + bend}`;
        });
        const futureRect = futureConvergence.getBoundingClientRect(),
          futureY = futureRect.top - storyRect.top,
          lastY = points[points.length - 1].y,
          endY = futureRect.height > 0 && futureY > lastY
            ? Math.min(storyRect.height, futureY)
            : Math.min(storyRect.height, lastY + 32);
        d += ` L ${railX} ${endY}`;
        return d;
      }

      function sizeDesktopRoutes() {
        const counterHeight = pageRoot.querySelector(".analytics-counter").offsetHeight,
          routeTop = pageRoot.querySelector(".lane-heads").offsetTop + pageRoot.querySelector(".lane-heads").offsetHeight,
          height = Math.max(0, futureConvergence.offsetTop - routeTop);
        styleRoot.style.setProperty("--counter-height", `${counterHeight}px`);
        styleRoot.style.setProperty("--routes-top", `${routeTop}px`);
        styleRoot.style.setProperty("--routes-height", `${height}px`);
      }

      function sizeFutureRoutes() {
        const futureRect = futureConvergence.getBoundingClientRect(),
          finalNode = futureConvergence.querySelector(".future-goal--final .future-goal__node"),
          finalNodeRect = finalNode.getBoundingClientRect();
        finalRouteY = Math.max(120, Math.min(1000, ((finalNodeRect.top + finalNodeRect.height / 2 - futureRect.top) / futureRect.height) * 1000));
        if (mobileRouteQuery.matches) {
          const storyRect = story.getBoundingClientRect();
          const scale = 900 / futureRect.width;
          const productStart = Math.max(0, (storyRect.left + 18 - futureRect.left) * scale);
          const systemStart = Math.max(0, (storyRect.left + 42 - futureRect.left) * scale);
          futureProductRoute.setAttribute("d", `M ${productStart} 0 C ${productStart} 34 440 66 440 90 V${finalRouteY}`);
          futureSystemRoute.setAttribute("d", `M ${systemStart} 0 C ${systemStart} 34 460 66 460 90 V${finalRouteY}`);
          futureUnifiedRoute.setAttribute("d", `M450 90 V${finalRouteY}`);
          return;
        }
        futureProductRoute.setAttribute("d", `M450 0 C450 34 440 62 440 96 V${finalRouteY}`);
        futureSystemRoute.setAttribute("d", `M450 0 C450 34 460 62 460 96 V${finalRouteY}`);
        futureUnifiedRoute.setAttribute("d", `M450 96 V${finalRouteY}`);
      }

      function fireFinalConfetti() {
        futureConvergence.querySelector(".future-goal--final").classList.add("confetti-fired");
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const node = futureConvergence.querySelector(".future-goal--final .future-goal__node"),
          rect = node.getBoundingClientRect(),
          ratio = Math.min(2, devicePixelRatio || 1),
          ctx = futureConfetti.getContext("2d"),
          colors = ["#ff2d5e", "#ff9500", "#ffee00", "#39ff14", "#00ffff", "#3a6bff", "#a855f7", "#ff2db2"];
        futureConfetti.width = innerWidth * ratio;
        futureConfetti.height = innerHeight * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        const particles = Array.from({ length: innerWidth < 600 ? 54 : 82 }, (_, index) => {
          const angle = Math.random() * Math.PI * 2,
            speed = 3.2 + Math.random() * 6.2;
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.2,
            gravity: .11 + Math.random() * .07,
            drag: .982,
            life: 58 + Math.random() * 34,
            age: 0,
            size: 3 + Math.random() * 5,
            color: colors[index % colors.length],
            spin: Math.random() * Math.PI,
            spinSpeed: (Math.random() - .5) * .28,
          };
        });
        function frame() {
          ctx.clearRect(0, 0, innerWidth, innerHeight);
          let alive = false;
          particles.forEach((particle) => {
            if (particle.age++ >= particle.life) return;
            alive = true;
            particle.vx *= particle.drag;
            particle.vy = particle.vy * particle.drag + particle.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.spin += particle.spinSpeed;
            ctx.save();
            ctx.globalAlpha = Math.min(1, (particle.life - particle.age) / 18);
            ctx.translate(particle.x, particle.y);
            ctx.rotate(particle.spin);
            ctx.fillStyle = particle.color;
            ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
            ctx.restore();
          });
          if (alive) requestAnimationFrame(frame);
          else ctx.clearRect(0, 0, innerWidth, innerHeight);
        }
        requestAnimationFrame(frame);
      }

      function drawMobileRoutes() {
        if (!mobileRouteQuery.matches) return;
        const storyRect = story.getBoundingClientRect();
        mobileRoutes.setAttribute(
          "viewBox",
          `0 0 ${storyRect.width} ${storyRect.height}`,
        );
        mobileProductRoute.setAttribute(
          "d",
          mobileRoutePath(".stop.product .node", 18, storyRect),
        );
        mobileSystemRoute.setAttribute(
          "d",
          mobileRoutePath(".stop.system .node", 42, storyRect),
        );
      }
      function setMobileRouteProgress(path, revealY) {
        if (!mobileRouteQuery.matches || !path.getAttribute("d")) return;
        const length = path.getTotalLength();
        if (!length) return;
        let low = 0,
          high = length;
        for (let index = 0; index < 18; index += 1) {
          const middle = (low + high) / 2;
          if (path.getPointAtLength(middle).y < revealY) low = middle;
          else high = middle;
        }
        path.style.setProperty(
          "--route-progress",
          Math.max(0, Math.min(1, high / length)).toFixed(5),
        );
      }
      pageRoot.querySelectorAll(".stop .brand-mark, .stop .brand-rail img")
        .forEach((logo) => (logo.alt = ""));
      function update() {
        const r = story.getBoundingClientRect(),
          futureRoadmapY = futureConvergence.getBoundingClientRect().top - r.top,
          routeHeight = Math.max(1, mobileRouteQuery.matches
            ? r.height
            : futureRoadmapY > 0 ? futureRoadmapY : r.height),
          travel = Math.max(0, Math.min(routeHeight, innerHeight * 0.58 - r.top));
        styleRoot.style.setProperty("--progress", (travel / routeHeight).toFixed(4));
        setMobileRouteProgress(mobileProductRoute, travel);
        setMobileRouteProgress(mobileSystemRoute, travel);
        const futureRect = futureConvergence.getBoundingClientRect(),
          futureTravel = Math.max(
            0,
            Math.min(futureRect.height, innerHeight * 0.58 - futureRect.top),
          );
        styleRoot.style.setProperty(
          "--future-progress",
          (futureTravel / futureRect.height).toFixed(4),
        );
        const futureRevealY = (futureTravel / futureRect.height) * 1000,
          cappedRevealY = Math.min(finalRouteY, futureRevealY);
        futureRouteRevealRect.setAttribute("height", String(cappedRevealY));
        if (futureRevealY >= finalRouteY - 1 && !finalConfettiFired) {
          finalConfettiFired = true;
          fireFinalConfetti();
        } else if (futureRevealY < finalRouteY - 80) {
          finalConfettiFired = false;
          futureConvergence.querySelector(".future-goal--final").classList.remove("confetti-fired");
        }
      }
      window.addEventListener("scroll", update, { passive: true, signal });
      window.addEventListener("resize", () => {
        update();
        sizeDesktopRoutes();
        drawMobileRoutes();
        sizeFutureRoutes();
      }, { signal });
      update();
      sizeDesktopRoutes();
      sizeFutureRoutes();
      const roadmapResizeObserver = new ResizeObserver(() => {
        sizeDesktopRoutes();
        drawMobileRoutes();
        sizeFutureRoutes();
      });
      roadmapResizeObserver.observe(story);
      mobileRouteQuery.addEventListener("change", drawMobileRoutes, { signal });
      drawMobileRoutes();
      const o = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add("is-seen");
            o.unobserve(e.target);
          }),
        { threshold: 0.15 },
      );
      stops.forEach((s) => o.observe(s));
      const futureGoals = [...pageRoot.querySelectorAll(".future-goal")];
      const futureGoalObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-current", entry.isIntersecting);
          });
        },
        { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
      );
      futureGoals.forEach((goal) => futureGoalObserver.observe(goal));
      pageRoot.querySelectorAll(".open").forEach((b, index) => {
        const detail = b.closest(".stop").querySelector(".detail"),
          detailId = `roadmap-detail-${index + 1}`;
        detail.id = detailId;
        detail.setAttribute("aria-hidden", "true");
        detail.inert = true;
        b.setAttribute("aria-expanded", "false");
        b.setAttribute("aria-controls", detailId);
        b.addEventListener("click", () => {
          const s = b.closest(".stop"),
            v = s.classList.toggle("is-open");
          b.setAttribute("aria-expanded", v);
          detail.setAttribute("aria-hidden", String(!v));
          detail.inert = !v;
          b.textContent = b.textContent.replace(v ? "+" : "−", v ? "−" : "+");
          requestAnimationFrame(drawMobileRoutes);
        }, { signal });
      });
      const analyticsTotalNodes = [...pageRoot.querySelectorAll("[data-analytics-total]")],
        analyticsLiveLabel = pageRoot.querySelector(".analytics-counter__live");
      function animateAnalyticsTotal(node, value) {
        const start = Number(node.dataset.value || value),
          startedAt = performance.now(),
          duration = 700;
        node.dataset.value = String(value);
        function tick(now) {
          const progress = Math.min(1, (now - startedAt) / duration),
            eased = 1 - Math.pow(1 - progress, 3),
            current = Math.round(start + (value - start) * eased);
          node.textContent = current.toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      async function refreshAnalyticsTotals() {
        if (location.protocol === "file:") {
          analyticsLiveLabel.textContent = "GA4 + Zaylist · latest verified";
          return;
        }
        try {
          const response = await fetch("/api/analytics/totals", { headers: { Accept: "application/json" } });
          if (!response.ok) throw new Error(`Analytics totals ${response.status}`);
          const totals = await response.json();
          analyticsTotalNodes.forEach((node) => {
            const value = Number(totals[node.dataset.analyticsTotal]);
            if (Number.isFinite(value)) animateAnalyticsTotal(node, value);
          });
          analyticsLiveLabel.textContent = "GA4 + Zaylist · updated live";
        } catch {
          analyticsLiveLabel.textContent = "GA4 + Zaylist · latest verified";
        }
      }
      analyticsTotalNodes.forEach((node) => {
        node.dataset.value = node.textContent.replace(/,/g, "");
      });
      refreshAnalyticsTotals();
      const analyticsInterval = location.protocol !== "file:"
        ? window.setInterval(refreshAnalyticsTotals, 5 * 60_000)
        : 0;
      const ideaForm = pageRoot.querySelector(".idea-form"),
        ideaStatus = pageRoot.querySelector(".idea-status"),
        ideaFrame = pageRoot.querySelector(".idea-frame");
      let ideaPending = false;
      ideaForm.addEventListener("submit", () => {
        ideaPending = true;
        ideaStatus.textContent = "Sending your idea…";
      }, { signal });
      ideaFrame.addEventListener("load", () => {
        if (!ideaPending) return;
        ideaPending = false;
        ideaStatus.textContent = "Idea submitted for private review.";
        ideaForm.reset();
      }, { signal });
      const founderContactToggle = pageRoot.querySelector("[data-founder-contact-toggle]"),
        founderContactForm = pageRoot.querySelector(".founder-contact-form"),
        founderContactStatus = founderContactForm.querySelector(".idea-status"),
        founderContactFrame = pageRoot.querySelector('iframe[name="collab-response"]');
      let founderContactPending = false;
      founderContactToggle.addEventListener("click", () => {
        const isOpen = founderContactForm.classList.toggle("is-open");
        founderContactToggle.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) founderContactForm.querySelector("input:not([type=hidden])").focus();
      }, { signal });
      founderContactForm.addEventListener("submit", () => {
        founderContactPending = true;
        founderContactStatus.textContent = "Sending to Tucker…";
      }, { signal });
      founderContactFrame.addEventListener("load", () => {
        if (!founderContactPending) return;
        founderContactPending = false;
        founderContactStatus.textContent = "Sent directly to Tucker’s inbox.";
        founderContactForm.reset();
      }, { signal });
      pageRoot.querySelector("[data-message-tucker]").addEventListener("click", async (event) => {
        if (location.protocol === "file:") return;
        event.preventDefault();
        try {
          const authResponse = await fetch("/api/auth/me", { credentials: "include" });
          location.href = authResponse.ok
            ? "/u/tucker_pdmax"
            : "/?auth=register&from=message-tucker";
        } catch {
          location.href = "/u/tucker_pdmax";
        }
      }, { signal });
    

      pageRoot.querySelectorAll('.quick-nav a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
          const target = pageRoot.querySelector(link.getAttribute("href"));
          if (!target) return;
          event.preventDefault();
          const owningPhase = target.closest(".roadmap-phase");
          if (owningPhase) owningPhase.open = true;
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }, { signal });
      });

      return () => {
        controller.abort();
        stopTopoField();
        roadmapResizeObserver.disconnect();
        o.disconnect();
        futureGoalObserver.disconnect();
        roadmapEndObserver.disconnect();
        if (analyticsInterval) window.clearInterval(analyticsInterval);
      };
}
