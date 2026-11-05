(() => {
  const links = [...document.querySelectorAll('.nav-bar a[href^="#"]')];
  const linksById = new Map(
    links.map(link => [decodeURIComponent(link.hash.slice(1)), link])
  );
  const sections = [...linksById.keys()]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (!sections.length) {
    return;
  }

  const setActive = id => {
    links.forEach(link => {
      const isActive = decodeURIComponent(link.hash.slice(1)) === id;

      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const updateFromPosition = () => {
    const documentElement = document.documentElement;
    const pageBottom = Math.ceil(window.scrollY + window.innerHeight);

    if (pageBottom >= documentElement.scrollHeight - 2) {
      setActive(sections[sections.length - 1].id);
      return;
    }

    const marker = window.innerHeight * 0.32;
    let current = sections[0];

    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) {
        current = section;
      } else {
        break;
      }
    }

    setActive(current.id);
  };

  const hashId = decodeURIComponent(window.location.hash.slice(1));
  setActive(linksById.has(hashId) ? hashId : sections[0].id);

  const observer = new IntersectionObserver(updateFromPosition, {
    rootMargin: '-32% 0px -67% 0px',
    threshold: 0
  });

  sections.forEach(section => observer.observe(section));

  window.addEventListener('hashchange', () => {
    const id = decodeURIComponent(window.location.hash.slice(1));

    if (linksById.has(id)) {
      setActive(id);
    }
  });
  window.addEventListener('resize', updateFromPosition, { passive: true });
  window.addEventListener('scroll', () => {
    const documentElement = document.documentElement;
    const pageBottom = Math.ceil(window.scrollY + window.innerHeight);

    if (pageBottom >= documentElement.scrollHeight - 2) {
      updateFromPosition();
    }
  }, { passive: true });

  requestAnimationFrame(updateFromPosition);
})();
