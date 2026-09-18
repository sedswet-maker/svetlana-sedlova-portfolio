(() => {
  const header = document.querySelector(".header");
  if (!header) return;

  const ads = document.getElementById("yandex-ads");
  const hero = document.getElementById("about");
  const caseWork = document.querySelector(".case-work");
  const caseAbout = document.querySelector(".case-about");
  const cvHero = document.querySelector(".cv-hero");
  const portfolioBtn = header.querySelector(".header__portfolio");
  const portfolioDropdown = document.getElementById("portfolio-dropdown");
  const hideThreshold = 8;
  const showThreshold = 80;
  let lastY = window.scrollY;
  let ignoreScrolls = 0;
  // 1 = user scrolling down, -1 = up. Layout shifts from the
  // compacting title can drop scrollY and look like an upward scroll.
  let userDir = 0;
  const hasHomeHero = Boolean(hero && ads && hero.classList.contains("hero"));
  const mobileMq = window.matchMedia("(max-width: 640px)");

  const isMobile = () => mobileMq.matches;

  const syncHeaderHeight = () => {
    if (header.classList.contains("header--hidden")) {
      document.documentElement.style.setProperty("--header-height", "0px");
      return;
    }
    document.documentElement.style.setProperty(
      "--header-height",
      `${header.offsetHeight}px`
    );
  };

  const setPortfolioOpen = (open) => {
    if (!portfolioBtn || !portfolioDropdown) return;
    // Opening the menu must keep the bar visible — otherwise hide-on-scroll
    // (triggered by the height change) closes it on the same tap.
    if (open && header.classList.contains("header--hidden")) {
      header.classList.remove("header--hidden");
      ignoreScrolls = 2;
    }
    header.classList.toggle("is-portfolio-open", open);
    portfolioBtn.setAttribute("aria-expanded", String(open));
    portfolioDropdown.hidden = !open;
    syncHeaderHeight();
    lastY = window.scrollY;
  };

  const syncPortfolioButton = () => {
    if (!portfolioBtn) return;
    const show = isMobile() && !header.classList.contains("header--hero");
    portfolioBtn.hidden = !show;
    if (!show) setPortfolioOpen(false);
  };

  const setHidden = (hidden) => {
    if (header.classList.contains("header--hidden") === hidden) return;
    header.classList.toggle("header--hidden", hidden);
    if (hidden) setPortfolioOpen(false);
    syncHeaderHeight();
    // Changing --header-height shifts sticky titles and can fire a
    // scroll event in the opposite direction — ignore that bounce.
    ignoreScrolls = 2;
    lastY = window.scrollY;
  };

  // While scrolled away from the very top, the header's bottom padding
  // shrinks to match its top padding. The height change is re-measured
  // right when the state flips, so sticky elements below (profile block,
  // divider) snap to the new offset without a lagging/animated mismatch.
  const syncScrolledState = () => {
    const scrolled = window.scrollY > 0;
    if (header.classList.contains("header--scrolled") !== scrolled) {
      header.classList.toggle("header--scrolled", scrolled);
      syncHeaderHeight();
    }
  };

  const setHeroMode = (inHero) => {
    if (header.classList.contains("header--hero") === inHero) return;
    header.classList.toggle("header--hero", inHero);
    syncPortfolioButton();
    syncHeaderHeight();
    ignoreScrolls = 3;
    lastY = window.scrollY;
    window.dispatchEvent(new Event("resize"));
    requestAnimationFrame(() => {
      syncHeaderHeight();
      lastY = window.scrollY;
    });
  };

  header.addEventListener("transitionend", (event) => {
    if (
      event.target !== header ||
      (event.propertyName !== "padding-bottom" &&
        event.propertyName !== "padding-top" &&
        event.propertyName !== "transform")
    ) {
      return;
    }
    syncHeaderHeight();
  });

  const heroProjects = hero?.querySelector(".hero__projects");

  const syncHeroMode = () => {
    if (!hasHomeHero) return header.classList.contains("header--hero");
    // Full header once the bottom edge of the hero project pills
    // reaches the sticky bar.
    const headerH = header.offsetHeight;
    const trigger = heroProjects || hero;
    const triggerBottom = trigger.getBoundingClientRect().bottom;
    const inHeroNow = header.classList.contains("header--hero");
    if (inHeroNow) {
      if (triggerBottom <= headerH + 24) setHeroMode(false);
    } else if (triggerBottom > headerH + 100) {
      setHeroMode(true);
    }
    return header.classList.contains("header--hero");
  };

  const firstCaseRowMidReached = () => {
    const card =
      ads?.querySelector(".project__page > li") ||
      ads?.querySelector(".project__grid > li");
    if (!card) {
      return hero.getBoundingClientRect().bottom <= header.offsetHeight + 40;
    }
    const rect = card.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const head = ads.querySelector(".project__head");
    const line = head
      ? head.getBoundingClientRect().bottom
      : header.offsetHeight;
    return mid <= line;
  };

  // Hide on scroll-down / show on scroll-up once the trigger section
  // is reached. Home: midpoint of the first case row. Case page: sticky
  // «Разделы сайта» row meeting the header. CV: second screen.
  // Mobile home: keep header visible after the hero (Portfolio + CV).
  const caseWorkHead = document.querySelector(".case-work__head");

  const syncHideOnScroll = () => {
    const y = window.scrollY;
    if (!ads && !caseWork && !cvHero) {
      lastY = y;
      return;
    }

    // Keep the bar put while the portfolio menu is open so a layout
    // shift from the dropdown never auto-hides / closes it.
    if (header.classList.contains("is-portfolio-open")) {
      lastY = y;
      return;
    }

    if (syncHeroMode()) {
      setHidden(false);
      lastY = y;
      return;
    }

    if (hasHomeHero && isMobile()) {
      setHidden(false);
      lastY = y;
      return;
    }

    if (ignoreScrolls > 0) {
      ignoreScrolls -= 1;
      lastY = y;
      return;
    }

    const headerH = header.offsetHeight;
    const lead = headerH + 40;
    const reachedTrigger = ads
      ? hero
        ? firstCaseRowMidReached()
        : ads.getBoundingClientRect().top <= window.innerHeight * 0.6
      : caseWork
        ? caseWorkHead
          ? caseWorkHead.getBoundingClientRect().top <=
            (header.classList.contains("header--hidden") ? 8 : headerH + 8)
          : caseAbout
            ? caseAbout.getBoundingClientRect().bottom <= lead
            : caseWork.getBoundingClientRect().top <= lead
        : cvHero.getBoundingClientRect().bottom <= lead;

    if (!reachedTrigger) {
      setHidden(false);
    } else if (y > lastY + hideThreshold || (userDir > 0 && y >= lastY)) {
      setHidden(true);
    } else if (y < lastY - showThreshold || (userDir < 0 && y < lastY - hideThreshold)) {
      setHidden(false);
    }
    lastY = y;
  };

  const onScroll = () => {
    syncScrolledState();
    syncHideOnScroll();
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < 1) return;
      userDir = event.deltaY > 0 ? 1 : -1;
    },
    { passive: true }
  );
  let touchY = null;
  window.addEventListener(
    "touchstart",
    (event) => {
      touchY = event.touches[0]?.clientY ?? null;
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      const y = event.touches[0]?.clientY;
      if (touchY == null || y == null || Math.abs(y - touchY) < 4) return;
      userDir = y < touchY ? 1 : -1;
      touchY = y;
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    syncPortfolioButton();
    syncHeaderHeight();
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("hashchange", onScroll);
  window.addEventListener("load", onScroll);
  document.addEventListener("case-title-pin", () => {
    ignoreScrolls = 4;
    lastY = window.scrollY;
    requestAnimationFrame(() => {
      lastY = window.scrollY;
    });
  });
  // Tabs on the case page jump to «Разделы сайта» — treat that as
  // already being in the trigger section and hide the bar.
  document.addEventListener("case-section-enter", () => {
    ignoreScrolls = 3;
    lastY = window.scrollY;
    setHidden(true);
  });

  if (portfolioBtn && portfolioDropdown) {
    portfolioBtn.addEventListener("click", () => {
      setPortfolioOpen(portfolioDropdown.hidden);
    });

    portfolioDropdown.addEventListener("click", (event) => {
      if (event.target.closest("a")) setPortfolioOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!header.classList.contains("is-portfolio-open")) return;
      if (header.contains(event.target)) return;
      setPortfolioOpen(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setPortfolioOpen(false);
    });
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(syncHeaderHeight).catch(syncHeaderHeight);
  }
  syncPortfolioButton();
  syncHeaderHeight();
  syncScrolledState();
  syncHideOnScroll();
})();

(() => {
  const cards = document.querySelectorAll(".alumni__card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const hit = card.querySelector(".alumni__hit");
    if (!hit) return;

    hit.addEventListener("click", () => {
      const open = !card.classList.contains("is-open");
      cards.forEach((other) => {
        if (other === card) return;
        other.classList.remove("is-open");
        other.querySelector(".alumni__hit")?.setAttribute("aria-expanded", "false");
      });
      card.classList.toggle("is-open", open);
      hit.setAttribute("aria-expanded", String(open));
    });
  });
})();

(() => {
  // Case page: the "Разделы сайта" head is sticky under the site header.
  // Flag it as pinned once it reaches the header so CSS can compact the title.
  const head = document.querySelector(".case-work__head");
  if (!head || !head.parentElement) return;

  const anchor = head.parentElement; // its top is the head's natural position

  const pinIn = 1;
  const pinOut = 56;

  const syncPinned = () => {
    if (head.dataset.pinLock === "1") return;
    const isSticky = getComputedStyle(head).position === "sticky";
    if (!isSticky) {
      head.classList.remove("is-pinned");
      return;
    }
    const headerHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height"
        )
      ) || 0;
    const top = anchor.getBoundingClientRect().top;
    const pinned = head.classList.contains("is-pinned");
    // Hysteresis: shrinking the title changes the head height and
    // used to flip the class on every frame at the threshold.
    if (!pinned && top <= headerHeight + pinIn) {
      head.classList.add("is-pinned");
      document.dispatchEvent(new Event("case-title-pin"));
    } else if (pinned && top > headerHeight + pinOut) {
      head.classList.remove("is-pinned");
      document.dispatchEvent(new Event("case-title-pin"));
    }
  };

  window.addEventListener("scroll", syncPinned, { passive: true });
  window.addEventListener("resize", syncPinned);
  syncPinned();
})();

(() => {
  // Case page: "Разделы сайта" tabs. Each chip shows its own panel
  // (text, button, video, mockups). The active tab is mirrored in the URL
  // hash (#releases etc.) so a section can be linked to directly.
  const head = document.querySelector(".case-work__head");
  const tabs = Array.from(document.querySelectorAll(".case-work__chip[data-tab]"));
  if (!head || tabs.length === 0) return;

  const panels = new Map();
  tabs.forEach((tab) => {
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    if (panel) panels.set(tab.dataset.tab, panel);
  });

  const activate = (name, { focus = false, updateHash = true } = {}) => {
    if (!panels.has(name)) return;

    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === name;
      tab.classList.toggle("case-work__chip--active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) tab.focus();
    });

    panels.forEach((panel, key) => {
      const isActive = key === name;
      panel.hidden = !isActive;
      panel.classList.toggle("is-active", isActive);
    });

    const keepPinned = head.classList.contains("is-pinned");
    const work = head.closest(".case-work") || head.parentElement;
    const inner = head.parentElement;
    if (work && document.querySelector(".case-page--mega-services")) {
      work.dataset.servicesTab = name;
    }
    if (work && document.querySelector(".case-page--mega-delivery")) {
      work.dataset.deliveryTab = name;
    }
    document.dispatchEvent(new Event("case-section-enter"));

    if (keepPinned) {
      // Stay compacted: scrolling to the section's top padding would
      // unpin the title and make the 52px size flash. Lock the class
      // and only rewind to the first pinned pixel of the new panel.
      head.dataset.pinLock = "1";
      head.classList.add("is-pinned");
      const headerH =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--header-height"
          )
        ) || 0;
      const pinY =
        inner.getBoundingClientRect().top + window.scrollY - headerH + 2;
      window.scrollTo({ top: Math.max(0, pinY), behavior: "auto" });
      document.dispatchEvent(new Event("case-section-enter"));
      requestAnimationFrame(() => {
        delete head.dataset.pinLock;
      });
    } else {
      const top = work.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
      document.dispatchEvent(new Event("case-section-enter"));
    }

    if (updateHash) {
      const url = name === "main" ? location.pathname + location.search : `#${name}`;
      history.replaceState(null, "", url);
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(tab.dataset.tab));

    tab.addEventListener("keydown", (event) => {
      let next = null;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      activate(tabs[next].dataset.tab, { focus: true });
    });
  });

  const fromHash = location.hash.replace(/^#/, "");
  if (fromHash && panels.has(fromHash) && fromHash !== "main") {
    activate(fromHash, { updateHash: false });
  }
})();

(() => {
  const profile = document.querySelector(".cv-profile");
  if (!profile) return;

  const syncProfileHeight = () => {
    document.documentElement.style.setProperty(
      "--profile-height",
      `${profile.offsetHeight}px`
    );
  };

  window.addEventListener("resize", syncProfileHeight);
  if (document.fonts?.ready) {
    document.fonts.ready.then(syncProfileHeight).catch(syncProfileHeight);
  }
  syncProfileHeight();
})();

(() => {
  const track = document.getElementById("portfolio-track");
  const strip = document.getElementById("portfolio-strip");
  const nextBtn = document.getElementById("portfolio-next");
  const nav = track?.closest(".portfolio-nav");
  // Carousel (arrow paging) is opt-in via .portfolio-nav--carousel
  if (!track || !strip || !nextBtn || !nav?.classList.contains("portfolio-nav--carousel")) {
    return;
  }

  const pills = Array.from(strip.querySelectorAll(".pill"));
  const pageSize = 5;
  let offset = 0;
  let pageWidth = 0;

  const measurePageWidth = () => {
    const pagePills = pills.slice(0, pageSize);
    if (!pagePills.length) return 0;

    const first = pagePills[0].getBoundingClientRect();
    const last = pagePills[pagePills.length - 1].getBoundingClientRect();
    // Floor so a subpixel of the next pill never peeks out
    return Math.floor(last.right - first.left);
  };

  const maxOffset = () => Math.max(0, strip.scrollWidth - track.clientWidth);
  const atEnd = () => offset >= maxOffset() - 1 && maxOffset() > 0;

  const syncTrackWidth = () => {
    pageWidth = measurePageWidth();
    if (pageWidth > 0) {
      track.style.width = `${pageWidth}px`;
    }
  };

  const apply = () => {
    const max = maxOffset();
    if (offset > max) offset = max;
    if (offset < 0) offset = 0;
    strip.style.transform = `translateX(${-offset}px)`;

    const reversed = atEnd();
    nextBtn.classList.toggle("pill-icon--reversed", reversed);
    nextBtn.setAttribute(
      "aria-label",
      reversed ? "Прокрутить проекты назад" : "Прокрутить проекты вперёд"
    );
  };

  const layout = () => {
    // Reset transform before measuring natural pill positions
    strip.style.transition = "none";
    strip.style.transform = "translateX(0)";
    offset = 0;
    syncTrackWidth();
    // Force reflow, then restore transition
    void strip.offsetWidth;
    strip.style.transition = "";
    apply();
  };

  nextBtn.addEventListener("click", () => {
    const max = maxOffset();
    if (max <= 0) return;

    const step = pageWidth || track.clientWidth;
    if (atEnd()) {
      offset = 0;
    } else {
      offset = Math.min(offset + step, max);
    }
    apply();
  });

  window.addEventListener("resize", layout);

  // Measure once, after the real font is active, so the nav never
  // has to visibly resize a second time when Inter swaps in.
  if (document.fonts?.ready) {
    document.fonts.ready.then(layout).catch(layout);
  } else {
    layout();
  }
})();

(() => {
  const rows = document.querySelectorAll(".cv-row--experience");

  rows.forEach((row) => {
    const header = row.querySelector(".cv-row__header");
    const panel = row.querySelector(".cv-row__panel");
    if (!header || !panel) return;

    const setOpen = (isOpen) => {
      row.classList.toggle("is-open", isOpen);
      header.setAttribute("aria-expanded", String(isOpen));
      panel.setAttribute("aria-hidden", String(!isOpen));
    };

    header.addEventListener("click", () => {
      setOpen(!row.classList.contains("is-open"));
    });

    // Clicking anywhere in the expanded panel collapses it too,
    // same as clicking the toggle button.
    panel.addEventListener("click", () => {
      setOpen(false);
    });
  });
})();

(() => {
  // CV: compact sticky «Образование» / «Опыт работы» padding once pinned.
  const heads = [...document.querySelectorAll(".cv-section__sticky")];
  if (!heads.length) return;

  const pinIn = 1;
  const pinOut = 24;

  const syncHead = (head) => {
    if (getComputedStyle(head).position !== "sticky") {
      head.classList.remove("is-pinned");
      return;
    }

    const headerHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height"
        )
      ) || 0;
    const top = head.getBoundingClientRect().top;
    const pinned = head.classList.contains("is-pinned");

    if (!pinned && top <= headerHeight + pinIn) {
      head.classList.add("is-pinned");
    } else if (pinned && top > headerHeight + pinOut) {
      head.classList.remove("is-pinned");
    }
  };

  const syncAll = () => heads.forEach(syncHead);

  window.addEventListener("scroll", syncAll, { passive: true });
  window.addEventListener("resize", syncAll);
  syncAll();
})();

(() => {
  const projects = document.querySelectorAll(".project");

  projects.forEach((project) => {
    const button = project.querySelector(".project__more");
    const extras = project.querySelectorAll(".project__item--extra");
    if (!button || !extras.length) return;

    const labelMore = "Показать больше";
    const labelHide = "Скрыть";

    const syncWidth = () => {
      const isOpen = project.classList.contains("is-open");
      button.textContent = labelMore;
      button.style.minWidth = "";
      button.style.minWidth = `${button.offsetWidth}px`;
      if (isOpen) button.textContent = labelHide;
    };

    button.addEventListener("click", () => {
      const isOpen = project.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.textContent = isOpen ? labelHide : labelMore;
    });

    window.addEventListener("resize", syncWidth);
    if (document.fonts?.ready) {
      document.fonts.ready.then(syncWidth).catch(syncWidth);
    } else {
      syncWidth();
    }
  });
})();

(() => {
  const projects = ["yandex-ads", "megamarket"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  projects.forEach((project) => {
    const track = project.querySelector(".project__carousel-track");
    const dots = [...project.querySelectorAll(".project__dot")];
    if (!track || !dots.length) return;

    const pageStep = () => {
      const width = track.clientWidth || 1;
      const gap =
        parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) ||
        0;
      return width + gap;
    };

    const setActive = (index) => {
      const i = Math.max(0, Math.min(dots.length - 1, index));
      dots.forEach((dot, idx) => {
        const on = idx === i;
        dot.classList.toggle("is-active", on);
        if (on) dot.setAttribute("aria-current", "true");
        else dot.removeAttribute("aria-current");
      });
    };

    const syncFromScroll = () => {
      setActive(Math.round(track.scrollLeft / pageStep()));
    };

    let raf = 0;
    track.addEventListener(
      "scroll",
      () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(syncFromScroll);
      },
      { passive: true }
    );

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", () => {
        track.scrollTo({ left: idx * pageStep(), behavior: "smooth" });
        setActive(idx);
      });
    });

    window.addEventListener("resize", syncFromScroll);
    syncFromScroll();
  });
})();

(() => {
  const copyButtons = document.querySelectorAll(
    ".footer__contact[data-copy], .hero__contact[data-copy]"
  );

  copyButtons.forEach((button) => {
    const label = button.querySelector("span");
    const original = label?.textContent ?? "";
    let resetTimer = 0;

    button.addEventListener("click", () => {
      const value = button.getAttribute("data-copy") || original;

      const copyText = async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const input = document.createElement("textarea");
          input.value = value;
          input.setAttribute("readonly", "");
          input.style.position = "fixed";
          input.style.left = "-9999px";
          document.body.appendChild(input);
          input.select();
          document.execCommand("copy");
          input.remove();
        }
      };

      copyText();

      if (!label) return;
      window.clearTimeout(resetTimer);
      label.textContent = "Скопировано";
      resetTimer = window.setTimeout(() => {
        label.textContent = original;
      }, 1500);
    });
  });
})();

(() => {
  const videos = document.querySelectorAll(
    ".case-page--direct-home .case-mockups__anim"
  );
  if (videos.length === 0) return;

  const play = (video) => {
    video.muted = true;
    video.loop = true;
    const start = video.play();
    if (start && typeof start.catch === "function") {
      start.catch(() => {});
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) play(entry.target);
          else entry.target.pause();
        });
      },
      { threshold: 0.05, rootMargin: "40px 0px" }
    );
    videos.forEach((video) => observer.observe(video));
  } else {
    videos.forEach(play);
  }

  document.addEventListener("case-section-enter", () => {
    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
        play(video);
      }
    });
  });
})();

(() => {
  // Home: on mobile, compact sticky Yandex / Megamarket heads to date + title
  // (hide the description) once the block is pinned under the header.
  const heads = [
    document.querySelector("#yandex-ads .project__head"),
    document.querySelector("#megamarket .project__head"),
  ].filter(Boolean);
  if (!heads.length) return;

  const mobileMq = window.matchMedia("(max-width: 640px)");
  const pinIn = 1;
  const pinOut = 48;

  const syncHead = (head) => {
    const anchor = head.parentElement;
    if (!anchor) return;

    if (!mobileMq.matches || getComputedStyle(head).position !== "sticky") {
      head.classList.remove("is-pinned");
      return;
    }

    const headerHeight =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--header-height"
        )
      ) || 0;
    const top = anchor.getBoundingClientRect().top;
    const pinned = head.classList.contains("is-pinned");

    if (!pinned && top <= headerHeight + pinIn) {
      head.classList.add("is-pinned");
    } else if (pinned && top > headerHeight + pinOut) {
      head.classList.remove("is-pinned");
    }
  };

  const syncAll = () => heads.forEach(syncHead);

  window.addEventListener("scroll", syncAll, { passive: true });
  window.addEventListener("resize", syncAll);
  mobileMq.addEventListener("change", syncAll);
  syncAll();
})();
